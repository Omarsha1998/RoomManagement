const db = require("../../../helpers/sql.js");
const { respond } = require("../../../helpers/controller.js");
const { cf4Status } = require("../config/constants.js");
const appModel = require("../models/appModel.js");
const cf4DbDumpModel = require("../../cf4-db-dump/models/index.js");
const { sendTextMessage, sendEmail } = require("../../../helpers/util.js");

const _sendEmail = async (emailInfo) => {
  await sendEmail({
    ...emailInfo,
    templateId: 2916755,
  });
};

const _extractQDRFromMed = (med) => {
  if (!med["Quantity/Dosage/Route"]) return {};
  const props = ["Quantity", "Dosage", "Route"];

  return med["Quantity/Dosage/Route"].value
    .split("/")
    .map((v) => v?.trim())
    .reduce((acc, el, idx) => {
      const propName = props[idx];

      acc[propName] = el
        .replace("QTY:", "")
        .replace("DOSAGE:", "")
        .replace("ROUTE:", "")
        .trim();

      return acc;
    }, {});
};

const _extractDateFromMed = (med) => {
  if (med["Generic Name"]?.value) {
    const genName = med["Generic Name"].value;
    const dateTimeChargedRegExp = new RegExp(" - [0-9]{2}/[0-9]{2}/[0-9]{4}");

    const dateTimeCharged =
      med["Date & Time Charged"]?.value ??
      med["initialChargeDateTime"]?.value ??
      genName.match(dateTimeChargedRegExp)?.at(0)?.replace(" - ", "");

    return {
      genericName: {
        code: "genericName",
        value: genName.replace(dateTimeChargedRegExp, ""),
      },
      ...(dateTimeCharged
        ? {
            dateTimeCharged: {
              code: "dateTimeCharged",
              value: dateTimeCharged,
            },
          }
        : {}),
    };
  }

  return {};
};

const _fixMeds = (meds) => {
  const props = [
    // OLD FORMAT
    ["initialChargeDateTime", "dateTimeCharged"],
    ["Date & Time Charged", "dateTimeCharged"],
    ["Generic Name", "genericName"],
    ["Quantity", "quantity"],
    ["Dosage", "strength"],
    ["Strength", "strength"],
    ["Form", "form"],
    ["Package", "package"],
    ["Route", "route"],
    ["Total Cost", "totalCost"],
    // NEW FORMAT (ADDED LAST TO PRIORITIZE)
    ["dateTimeCharged", "dateTimeCharged"],
    ["genericName", "genericName"],
    ["quantity", "quantity"],
    ["strength", "strength"],
    ["form", "form"],
    ["package", "package"],
    ["route", "route"],
    ["totalCost", "totalCost"],
  ];

  return meds.map((med) => {
    const parsedMed = {
      ...med,
      ..._extractDateFromMed(med),
      ..._extractQDRFromMed(med),
    };

    return props.reduce((acc, prop) => {
      const oldPropName = prop[0];
      const newPropName = prop[1];

      if (
        parsedMed[oldPropName] &&
        parsedMed[oldPropName].value != null &&
        parsedMed[oldPropName].value !== ""
      ) {
        acc[newPropName] = parsedMed[oldPropName].value;
      }

      return acc;
    }, {});
  });
};

const _formatMedsJson = (value) => {
  if (!value) return [];

  // FOR BACKWARD COMPATIBILITY
  if (typeof value === "string") {
    // IF WEIRD JSON
    if (
      (value.startsWith('["[') && value.endsWith(']"]')) ||
      (value.startsWith('["{') && value.endsWith('}"]'))
    ) {
      const meds = JSON.parse(JSON.parse(value)[0]);
      return _fixMeds(meds);
    }

    try {
      // IF NORMAL JSON
      return JSON.parse(value);
    } catch (e) {
      throw "UNKNOWN MEDS FORMAT! FIX ASAP!";
    }
  }

  // IF VALID JS ARRAY
  return value;
};

const _prepareReqBody = async (payload) => {
  // Get items that only occur in the left array,
  const toDeleteClaimDetails = payload?.oldData
    ? payload.oldData
        .filter(
          (leftValue) =>
            !payload.fields.some(
              (rightValue) => leftValue.fieldCode === rightValue.code,
            ),
        )
        .map((d) => {
          return { id: d.cf4DetailId, value: null };
        })
    : [];

  const toUpsertClaimDetails = payload?.fields
    ? payload.fields.map((d) => {
        if (d.code === "drugsOrMedicinesResult") {
          d.value = JSON.stringify(_formatMedsJson(d.value));
        }

        return {
          id: d.cf4DetailId ?? 0,
          fieldCode: d.code,
          value: d.value,
        };
      })
    : [];

  const claim = await db.selectOne("*", "DocumentMgt..Cf4Claims", {
    code: payload.claimId,
  });

  if (!claim || claim.error) return null;

  delete payload.oldData;
  delete payload.fields;

  const ret = {
    ...payload,
    claimId: claim.id,
    claimCode: claim.code,
    caseNo: claim.caseNo,
    patientNo: claim.patientNo,
    action: payload.updateStatus,
    userCode: payload.rejectedBy || payload.acceptedBy || payload.completedBy,
    claimDetails: [...toUpsertClaimDetails, ...toDeleteClaimDetails],
    remarks: payload.remarks,
  };

  delete ret.updateStatus;
  delete ret.rejectedBy;
  delete ret.acceptedBy;
  delete ret.completedBy;

  return ret;
};

const selectClaim = async (req, res) => {
  if (!req.query) return res.status(400).json({ error: "Invalid URL query." });
  // const whereStrArr = [];
  // const whereArgs = [];

  // if (req.query.caseNo) {
  //   whereStrArr.push("c.CaseNo = ?");
  //   whereArgs.push(req.query.caseNo);
  // }

  // if (req.query.searchStr) {
  //   whereStrArr.push(
  //     `(CONCAT(p.LastName, ', ', p.FirstName, ' ', p.MiddleName) LIKE ?
  //       OR CONCAT(p.FirstName, ' ', p.MiddleName, ' ', p.LastName) LIKE ?)`,
  //   );

  //   whereArgs.push(`%${req.query.searchStr}%`);
  //   whereArgs.push(`%${req.query.searchStr}%`);
  // }

  // const whereStr =
  //   whereStrArr.length > 0 ? "WHERE ".concat(whereStrArr.join(" AND ")) : "";

  const [whereStr, whereArgs] = db.where(req.query, "cf4");

  const sqlStr = `
    SELECT
      --c.caseNo,
      --c.DateAd dateTimeAdmitted,
      --c.DateDis dateTimeDischarged,
      --c.patientType,
      --c.CC chiefComplaint,
      --CASE WHEN c.patientType IN ('OPD', 'ER') THEN c.patientType ELSE c.LAST_ROOM END room,
      --CASE WHEN c.patientType IN ('OPD', 'ER') THEN c.patientType ELSE s.DESCRIPTION END ward,
      --p.patientNo,
      --p.lastName,
      --p.firstName,
      --p.middleName,
      --p.dBirth birthDate,
      --TRIM(CONCAT(p.lastName, ', ', p.firstName, ' ', p.middleName)) fullname,
      --p.Sex gender,
      cf4.id,
      cf4.code,
      cf4.createdBy,
      cf4.updatedBy,
      cf4.rejectedBy,
      cf4.acceptedBy,
      cf4.completedBy,
      ch.status,
      ch.createdBy statusBy,
      ch.dateTimeCreated dateTimeStatus,
      ch.remarks statusRemarks
    FROM
      DocumentMgt..CF4Claims cf4
      --LEFT JOIN UERMMMC..Cases c ON c.CaseNo = cf4.CaseNo
      --LEFT JOIN UERMMMC..ROOMS r ON c.LAST_ROOM = r.RoomNo
      --LEFT JOIN UERMMMC..SECTIONS AS s ON r.UNIT = s.CODE
      --LEFT JOIN UERMMMC..PatientInfo p ON p.PatientNo = c.PatientNo
      LEFT JOIN (
        SELECT * FROM DocumentMgt..ClaimHistories WHERE Id IN
        (SELECT MAX(Id) FROM DocumentMgt..ClaimHistories GROUP BY ClaimId)
      ) ch ON ch.ClaimId = cf4.Code
    ${whereStr};
  `;

  const result = await db.query(sqlStr, whereArgs, null, false);

  if (result?.error) return res.status(500).json({ error: "Database Error" });
  res.json(result[0] ?? null);
};

const getMedicineCharges = async (req, res) => {
  if (!req.query.caseNo) {
    return res.json({ success: false, message: "Invalid Parameter" });
  }

  const sql = `
    SELECT
      --T0.caseNo,
      --T0.CHARGESLIPNO chargeSlipNo,
      --T3.itemCode,
      --T3.brandName,
      MIN(T0.CHARGEDATETIME) dateTimeCharged,
      MIN(T3.GenName) genericName,
      MIN(T3.MG) strength,
      MIN(T3.DosageForm) form,
      MIN(CASE WHEN T3.CategoryCode = 'MED' THEN
        T4.Description
      ELSE
        ''
      END) route,
      --T2.SellingPrice sellingPrice,
      --T2.DiscAmt discountAmount,
      SUM(T2.Qty) quantity,
      SUM(
        (CAST(T2.SellingPrice AS DECIMAL(20, 8)) * CAST(T2.Qty AS DECIMAL(20, 8))) 
        - CAST(T2.DiscAmt AS DECIMAL(20, 8))
      ) totalCost
    FROM 
      [UERMMMC]..[CHARGES_MAIN] T0 WITH(NOLOCK)
      INNER JOIN [UERMMMC]..[PHAR_Sales_Parent] T1 WITH(NOLOCK) ON T0.CHARGESLIPNO = T1.CSNo
      INNER JOIN [UERMMMC]..[PHAR_Sales_Details] T2 WITH(NOLOCK) ON T1.SalesNo = T2.SalesNo
      INNER JOIN [UERMMMC]..[PHAR_ITEMS] T3 WITH(NOLOCK) ON T2.ItemCode = T3.ItemCode
      LEFT JOIN UERMMMC..PHAR_CATEGORY T4 ON T3.Category = T4.Code
    WHERE
      --T0.CANCELED = 'N'
      T0.CANCELED <> 'Y'
      AND T1.Cancelled = 0
      AND T3.PhicGroupCode = 'MED'
      AND T0.CASENO = ?
    GROUP BY
      T3.ItemCode;
    `;

  const rows = await db.query(sql, [req.query.caseNo]);

  if (rows.error) return res.status(500).json({ error: rows.error });
  res.json(rows);
};

const dumpClaim = async (req, res) => {
  if (!req.query.caseNo) {
    return res.status(400).json("`caseNo` in URL query is required.");
  }

  const result = await db.transact(async (txn) => {
    return await cf4DbDumpModel.dumpClaim(req.query.caseNo, txn);
  });

  if (result?.error) return res.status(500).json("Database Error.");
  res.json(null);
};

const saveClaim = async (req, res) => {
  if (!req.body) {
    res.status(400).json({ error: "Request Body is required." });
    return;
  }

  const reqBody = await _prepareReqBody(req.body);

  if (!reqBody) {
    res.status(400).json({ error: "Claim cannot be found." });
    return;
  }

  const {
    userCode,
    claimId,
    caseNo,
    patientNo,
    claimDetails,
    action,
    remarks,
  } = reqBody;

  // console.log(reqBody);
  // return res.json({ success: true });

  const result = await db.transact(async (txn) => {
    let status = null;
    let claimCode = reqBody.claimCode ?? "";

    if (["UPSERT", "FINALIZE"].includes(action)) {
      status = action === "FINALIZE" ? cf4Status.FINALIZED : cf4Status.DRAFT;

      const claim = await appModel.upsertClaim(
        userCode,
        {
          id: claimId ?? 0,
          caseNo,
          patientNo,
          status,
          remarks,
        },
        txn,
      );

      await appModel.upsertClaimDetails(
        userCode,
        claim.code,
        claimDetails ?? [],
        txn,
      );

      claimCode = claim.code;
    }

    if (action === "REJECT" && claimId) {
      await appModel.rejectClaim(userCode, claimId, remarks, txn);

      const rejectionDetails = reqBody;

      const notifEmail = {
        email: rejectionDetails.rejectingEmailDestination,
        name: `<strong>${rejectionDetails.rejectingNameDestination}</strong>`,
        message: `
            A PhilHealth CF4 was rejected by <strong>${
              rejectionDetails.rejectingName
            } </strong> with a position of ${
              rejectionDetails.rejectingPosition
            }.
            <br /><br /> The reason for rejection is <u><strong>${
              rejectionDetails.remarks
            }</strong></u>.
            <br /><br /> The patient is <strong>${rejectionDetails.rejectingPatientName.toUpperCase()}</strong>,
            ${rejectionDetails.rejectingPatientAge} yr(s) old, ${
              rejectionDetails.rejectingPatientGender
            }, with the Case No. of 
            <strong>${
              rejectionDetails.rejectingPatientCaseNo
            }</strong>, admitted on
            <strong>${rejectionDetails.rejectingDateTimeAdmitted.trim()}</strong>.
            ${
              rejectionDetails.rejectingDateTimeDischarged !== null
                ? `The patient was discharged on <strong>${rejectionDetails.rejectingDateTimeDischarged.trim()}`
                : ""
            }.</strong>
            <br /><br />
            Thank you and have a nice day.
          `,
        subject: `Rejected UERM PhilHealth CF4 - ${rejectionDetails.rejectingPatientName}`,
        title: `Rejected UERM PhilHealth CF4`,
      };

      const notifSMS = {
        destination: rejectionDetails.rejectingMobileDestination,
        text: `A PhilHealth CF4 was rejected by ${
          rejectionDetails.rejectingName
        } with the Case # of ${
          rejectionDetails.rejectingPatientCaseNo
        } and named ${rejectionDetails.rejectingPatientName.toUpperCase()}.\n\nThe reason for rejection is ${
          rejectionDetails.remarks
        }.\n\n-- UERM PhilHealth CF4 --`,
      };

      await _sendEmail(notifEmail);
      await sendTextMessage(notifSMS.destination, notifSMS.text);

      status = cf4Status.DRAFT;
    }

    if (action === "ACCEPT" && claimId) {
      await appModel.acceptClaim(userCode, claimId, txn);
      status = cf4Status.ACCEPTED;
    }

    if (action === "COMPLETE" && claimCode && caseNo) {
      await appModel.upsertClaimDetails(
        userCode,
        claimCode,
        claimDetails ?? [],
        txn,
      );

      await appModel.completeClaim(userCode, claimId, txn);
      await cf4DbDumpModel.dumpClaim(caseNo, txn);

      status = cf4Status.COMPLETED;
    }

    if (status !== null) {
      await appModel.insertClaimHistory(
        { status, userCode, claimCode, remarks },
        txn,
      );
    }

    return { success: true };
  });

  if (result?.error) return res.status(500).json({ error: result.error });
  res.json(result);
};

const saveCf4Exception = async (req, res) => {
  const result = await db.query(
    `INSERT INTO DocumentMgt..CF4Exceptions (
      CaseNo,
      CreatedBy
    ) VALUES (?, ?);`,
    [req.body.caseNo, req.body.createdBy],
    null,
    false,
  );

  if (result?.error)
    return res
      .status(500)
      .json({ error: result.error, success: false, message: result.error });

  res.json({ success: true });
};

const selectClaims = async (req, res) => {
  const sqlWhereArr = [];
  const sqlWhereArgs = [req.query.dateFrom, req.query.dateTo];
  let sqlOrderBy = "";

  if (req.query.status) {
    if (Number(req.query.status) === 2) {
      sqlWhereArr.push(
        "cl.status IN ('2', '3')",
        "(CONVERT(DATE, cl.dateTimeUpdated) BETWEEN ? AND ?)",
      );

      sqlOrderBy = "ORDER BY cl.dateTimeUpdated DESC";
    } else {
      sqlWhereArgs.unshift(req.query.status);

      sqlWhereArr.push(
        "cl.status = ?",
        "(CONVERT(DATE, cl.dateTimeUpdated) BETWEEN ? AND ?)",
      );

      sqlOrderBy = "ORDER BY cl.dateTimeCompleted DESC";
    }
  }

  // if (req.query.status === "3") {
  //   sqlWhere = `where cl.status = '${req.query.status}'  AND (CONVERT(DATE, cl.dateTimeAccepted) BETWEEN '${req.query.dateFrom}' AND '${req.query.dateTo}'
  //   `;
  // }

  const sqlQuery = `
      SELECT TOP 20
        cl.id,
        cl.code,
        cl.caseNo,
        cl.patientNo,
        lastName = CASE WHEN p.lastname IS NULL THEN (
            SELECT
            lastname
            from
            UERMMMC..PATIENTINFO
            where
            PATIENTNO = cmpl.NewPatientNo
        ) ELSE p.lastname END,
        firstName = CASE WHEN p.firstName IS NULL THEN (
            SELECT
            firstName
            from
            UERMMMC..PATIENTINFO
            where
            PATIENTNO = cmpl.NewPatientNo
        ) ELSE p.firstName END,
        middleName = CASE WHEN p.firstName IS NULL THEN (
            SELECT
            middleName
            from
            UERMMMC..PATIENTINFO
            where
            PATIENTNO = cmpl.NewPatientNo
        ) ELSE p.middleName END,
        fullname = CASE WHEN p.lastname IS NULL THEN (
            SELECT
            CONCAT(
                lastName, ', ', firstName, ' ', middleName
            )
            from
            UERMMMC..PATIENTINFO
            where
            PATIENTNO = cmpl.NewPatientNo
        ) ELSE CONCAT(
            p.lastName, ', ', p.firstName, ' ',
            p.middleName
        ) END,
        gender = CASE WHEN p.sex IS NULL THEN (
            SELECT
            sex
            from
            UERMMMC..PATIENTINFO
            where
            PATIENTNO = cmpl.NewPatientNo
        ) ELSE p.sex END,
        birthDate = CASE WHEN p.DBIRTH IS NULL THEN (
            SELECT
            DBIRTH
            from
            UERMMMC..PATIENTINFO
            where
            PATIENTNO = cmpl.NewPatientNo
        ) ELSE p.DBIRTH END,
        p.AGE age,
        cl.status,
        c.patientType,
        cl.createdBy,
        cl.dateTimeCreated,
        cl.updatedBy,
        cl.acceptedBy,
        cl.dateTimeUpdated,
        cl.dateTimeAccepted,
        cl.rejectedBy,
        cl.dateTimeRejected,
        cl.completedBy,
        cl.dateTimeCompleted,
        cl.remarks rejectionRemarks,
        c.dateTimeAdmitted, 
        c.dateTimeDischarged, 
        c.discharge, 
        CASE WHEN c.patientType = 'OPD' THEN
          c.patientType 
        ELSE 
          CASE WHEN c.PatientType = 'ER' THEN c.patientType ELSE c.lastRoom END
        END room, 
        CASE WHEN c.patientType = 'OPD' THEN
          c.patientType
        ELSE
          CASE WHEN c.patientType = 'ER' THEN c.patientType ELSE s.DESCRIPTION END
        END ward
      FROM
        [DocumentMgt].[dbo].[CF4Claims] cl
        LEFT JOIN DocumentMgt..vw_CF4Cases c ON c.CaseNo = cl.CaseNo
        LEFT JOIN UERMMMC..PATIENTINFO p ON c.PatientNo = p.PatientNo 
        LEFT JOIN UERMMMC..CASES_MERGE_PATIENTNO_LOG cmpl ON c.PatientNo = cmpl.OldPatientNo 
        LEFT JOIN UERMMMC..ROOMS r ON c.lastRoom = r.ROOMNO 
        LEFT JOIN UERMMMC..SECTIONS s ON r.UNIT = s.CODE
      ${
        sqlWhereArr.length > 0 ? "WHERE ".concat(sqlWhereArr.join(" AND ")) : ""
      }
      ${sqlOrderBy};
    `;

  // console.log(sqlQuery);
  // console.log(sqlWhereArgs);
  const result = await db.query(sqlQuery, sqlWhereArgs);

  if (result?.error) return res.status(500).json({ error: result.error });
  res.json(result);
};

const selectCf4Patient = async (req, res) => {
  const whereArr = ["a.Status > 0", "b.Status > 0"];
  const whereArgs = [];

  if (req.query.caseNo) {
    whereArr.push("a.CaseNo = ?");
    whereArgs.push(req.query.caseNo);
  }

  const whereStr = whereArr.length > 0 ? `WHERE ${whereArr.join(" AND ")}` : "";

  const sqlStr = `
    SELECT
      a.id cf4Id,
      b.id cf4DetailId,
      a.code,
      a.caseNo,
      a.patientNo,
      a.status claimStatus,
      a.createdBy,
      CASE WHEN a.createdBy IS NOT NULL THEN
        (select name from [UE database]..vw_Employees where code = a.createdBy)
      ELSE
        NULL
      END createdByName,
      a.dateTimeCreated,
      a.updatedBy,
      CASE WHEN a.updatedBy IS NOT NULL THEN
        (select name from [UE database]..vw_Employees where code = a.updatedBy)
      ELSE
        NULL
      END updatedByName,
      a.dateTimeUpdated,
      a.acceptedBy,
      CASE WHEN a.acceptedBy IS NOT NULL THEN
        (select name from [UE database]..vw_Employees where code = a.acceptedBy)
      ELSE
        NULL
      END acceptedByName,
      a.dateTimeAccepted,
      a.completedBy,
      CASE WHEN a.completedBy IS NOT NULL THEN
        (select name from [UE database]..vw_Employees where code = a.completedBy)
      ELSE
        NULL
      END completedByName,
      a.dateTimeCompleted,
      a.rejectedBy,
      case when a.rejectedBy is not null then
        (select name from [UE database]..vw_Employees where code = a.rejectedBy)
      else
        null
      end rejectedByName,
      a.dateTimeRejected,
      a.remarks rejectionRemarks,
      b.dateTimeDeleted,
      b.fieldCode,
      b.value,
      b.status fieldStatus
    FROM
      DocumentMgt..CF4Claims a
      LEFT JOIN DocumentMgt..CF4ClaimDetails b on b.ClaimId = a.Code
    ${whereStr};`;

  const result = await db.query(sqlStr, whereArgs);

  if (result?.error)
    return res
      .status(500)
      .json({ error: result.error, success: false, message: result.error });

  res.json(result);
};

const selectClaimDetails = async (req, res) => {
  if (!req.params.code) {
    return res.status(400).json({ error: "`code` URL param is required." });
  }

  const [whereStr, whereArgs] = db.where({
    claimId: req.params.code,
    status: 1,
  });

  const sqlStr = `
    SELECT
      id,
      claimId,
      fieldCode,
      value
    FROM
      DocumentMgt..CF4ClaimDetails
    ${whereStr};`;

  const result = await db.query(sqlStr, whereArgs, null, false);

  if (result?.error)
    return res
      .status(500)
      .json({ error: result.error, success: false, message: result.error });

  res.json(result);
};

const selectEmployees = async (req, res) => {
  const result = await db.query(
    `
      SELECT
        LTRIM(RTRIM(EmployeeCode)) code,
        LOWER(CASE WHEN NULLIF(UermEmail, '') IS NULL THEN Email ELSE UermEmail END) email,
        mobileNo,
        LTRIM(RTRIM(CONCAT(LastName, ', ', FirstName, ' ', middlename, '. ', ExtName))) fullName
      FROM
        [UE database]..Employee
      WHERE
        Deleted <> 1;
    `,
    [],
    null,
    false,
  );

  if (result?.error) return res.status(500).json({ error: "Database Error" });
  res.json(result);
};

const mergeEclaimPatients = async (req, res) => {
  if (!req.body.originalPxId || !req.body.duplicatePxId) {
    return res
      .status(400)
      .json("`originalPxId` and `duplicatePxId` in Request Body are required.");
  }

  if (req.body.originalPxId === req.body.duplicatePxId) {
    return res
      .status(400)
      .json("`originalPxId` and `duplicatePxId` should not be the same.");
  }

  const response = (
    await cf4DbDumpModel.mergePatients(
      req.body.originalPxId,
      req.body.duplicatePxId,
    )
  )[0];

  respond(res, response);
};

const getEClaimPatientsByName = async (req, res) => {
  if (!req.body.firstName || !req.body.lastName) {
    return res
      .status(400)
      .json("`firstName` and `lastName` in Request Body are required.");
  }

  const response = await cf4DbDumpModel.getPatientsByName(
    req.body.firstName,
    req.body.middleName,
    req.body.lastName,
    req.body.extName,
  );

  respond(res, response);
};

module.exports = {
  selectClaim,
  getMedicineCharges,
  dumpClaim,
  saveClaim,
  selectCf4Patient,
  selectClaims,
  saveCf4Exception,
  selectClaimDetails,
  selectEmployees,
  mergeEclaimPatients,
  getEClaimPatientsByName,
};

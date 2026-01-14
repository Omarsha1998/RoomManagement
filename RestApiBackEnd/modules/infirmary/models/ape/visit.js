const db = require("../../../../helpers/sql.js");
// const QRCode = require("qrcode");
// const { customAlphabet } = require("nanoid");

const {
  // jsDateToISOString,
  // sendEmail,
  objContains,
} = require("../../../../helpers/util.js");

const { VISIT_ORDER_ACTIONS } = require("../../constants.js");

const patientModel = require("./patient.js");
const miscModel = require("./misc.js");

// const { appName, appClientUrl } = require("../../config.js");

// const nanoIdChars =
//   "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// const nanoid = customAlphabet(nanoIdChars, 22);

const columns = [
  { name: "id", identity: true },
  { name: "code", required: true },
  { name: "patientId", required: true },
  { name: "physicianCode", default: null },
  { name: "createdBy", required: true },
  { name: "dateTimeCreated", required: true },
  { name: "updatedBy", default: null },
  { name: "dateTimeUpdated", default: null },
  { name: "completedBy", default: null },
  { name: "dateTimeCompleted", default: null },
  { name: "remarks", default: null },
];

const columnNames = columns.map((c) => c.name);
const columnNamesJoined = columnNames.join(",");

// NOTE:
// - `null` MEANS ALL PATIENTS MUST DO THE EXAM/PROCEDURE
// - LOGICAL `OR` WILL BE USED FOR THE ARRAY ITEMS
// - LOGICAL `AND` WILL BE USED FOR THE ITEM PROPS
const examPxCriteria = {
  MED_HIST: null,
  PE: null,
  DENTAL: [
    {
      campusCode: "CAL",
    },
  ],
  LAB_CBC: null,
  LAB_URI: null,
  // ALLOW `LAB_FECA` FOR UE CALOOCAN EMPLOYEES
  LAB_FCL: [
    {
      affiliationCode: "EMP",
      campusCode: "CAL",
    },
  ],
  RAD_XR_CHST: null,
};

const _pxAllowedForTheExam = (patient, examCode) => {
  if (examPxCriteria[examCode] === null) {
    return true;
  }

  for (const c of examPxCriteria[examCode]) {
    if (objContains(patient, c)) {
      return true;
    }
  }

  return false;
};

const _getExamsToComplete = (exams, patient) => {
  return exams.filter((e) => _pxAllowedForTheExam(patient, e.code));
};

const selectOne = async (visitId, patientId, txn) => {
  if (!visitId && !patientId) {
    throw new Error("`visitId` or `patientId` is required.");
  }

  const whereStr = visitId ? "Id = ?" : "PatientId = ?";
  const whereArgs = visitId ? [visitId] : [patientId];

  return (
    await db.query(
      `
        SELECT
          ${columnNamesJoined}
        FROM
          AnnualPhysicalExam..Visits
        WHERE
          ${whereStr};
      `,
      whereArgs,
      txn,
      false,
    )
  )[0];
};

const selectMany = async (limitTo, whereStr, whereArgs, txn) => {
  if (!txn) {
    throw new Error("`txn` is required.");
  }

  const sqlStrTop =
    limitTo == null || limitTo === "" || Number(limitTo) === 0
      ? ""
      : "TOP ".concat(String(limitTo));

  return await db.query(
    `
      SELECT
        tb.*,
        ve.Id visitExamId,
        ve.VisitId visitExamVisitId,
        ve.ExamCode visitExamExamCode,
        ve.CreatedBy visitExamCreatedBy,
        ve.DateTimeCreated visitExamDateTimeCreated,
        ve.AcceptedBy visitExamAcceptedBy,
        ve.DateTimeAccepted visitExamDateTimeAccepted,
        ve.CompletedBy visitExamCompletedBy,
        ve.DateTimeCompleted visitExamDateTimeCompleted
        /* ,CASE WHEN ved.VisitExamId IS NULL THEN
          0
        ELSE
          1
        END hasVisitExamResult */
      FROM
        (
          SELECT ${sqlStrTop}
            v.id,
            v.physicianCode,
            v.createdBy,
            v.dateTimeCreated,
            v.completedBy,
            v.dateTimeCompleted,
            v.remarks,
            p.Id patientId,
            p.CampusCode patientCampusCode,
            p.AffiliationCode patientAffiliationCode,
            p.IdentificationCode patientIdentificationCode,
            p.FirstName patientFirstName,
            p.MiddleName patientMiddleName,
            p.LastName patientLastName,
            p.ExtName patientExtName,
            p.Gender patientGender,
            p.DeptCode patientDeptCode,
            p.YearLevel patientYearLevel
          FROM
            AnnualPhysicalExam..Visits v
            LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = v.PatientId
          ${whereStr}
          ${sqlStrTop ? "ORDER BY v.Id DESC" : ""}
        ) tb
        LEFT JOIN AnnualPhysicalExam..VisitExams ve ON ve.VisitId = tb.Id
        /* LEFT JOIN (
          SELECT MIN(VisitExamId) VisitExamId
          FROM AnnualPhysicalExam..VisitExamDetails
          GROUP BY VisitExamId
        ) ved ON ved.VisitExamId = ve.Id */
        ;
    `,
    whereArgs,
    txn,
    false,
  );
};

const selectCompletedExamCodes = async (visitId, txn) => {
  const rows = await db.query(
    `
      SELECT *
      FROM AnnualPhysicalExam..VisitExams
      WHERE VisitId = ?;
    `,
    [visitId],
    txn,
  );

  if (rows.length > 0) {
    return rows.map((r) => r.phaseCode);
  }

  return [];
};

const insertOne = async (user, patient, txn) => {
  if (!txn) {
    throw new Error("`txn` is required.");
  }

  const existingVisit = await selectOne(null, patient.id, txn);

  if (existingVisit) {
    return {
      status: 400,
      body: {
        errorMessage: "Patient visit already exists.",
        visit: existingVisit,
      },
    };
  }

  const visitCode = await db.generateRowCode(
    "AnnualPhysicalExam..Visits",
    "Code",
    "",
    3,
    txn,
    { includeMs: false },
  );

  const insertedVisit = await db.insertOne(
    "AnnualPhysicalExam..Visits",
    {
      // code: nanoid(),
      code: visitCode,
      patientId: patient.id,
      createdBy: user.code,
      ...(user.roleCode === "DR" ? { physicianCode: user.code } : {}),
    },
    txn,
  );

  const exams = await miscModel.selectExams(txn);

  for (const exam of _getExamsToComplete(exams, patient)) {
    const insertedVisitExam = await db.insertOne(
      "AnnualPhysicalExam..VisitExams",
      {
        visitId: insertedVisit.id,
        examCode: exam.code,
        createdBy: user.code,
      },
      txn,
    );

    await db.query(
      `
        UPDATE AnnualPhysicalExam..VisitExams SET
          ChargeSlipCode = ?
        WHERE
          Id = ?;
      `,
      [`${visitCode}${String(exam.id).padStart(2, "0")}`, insertedVisitExam.id],
      txn,
      false,
    );
  }

  return {
    status: 200,
    body: {
      errorMessage: "",
      visit: insertedVisit,
    },
  };
};

const completeExam = async (userCode, visitId, examCode, txn) => {
  if (!txn) {
    throw new Error("`txn` is required.");
  }

  const updatedVisitExam = await db.updateOne(
    "AnnualPhysicalExam..VisitExams",
    { completedBy: userCode },
    { visitId, examCode },
    txn,
    { timestampColName: "dateTimeCompleted" },
  );

  // LET THE ONE WHO COMPLETES THE EXAM BE THE AUTHOR OF THE
  // EXAM DETAILS INSERTED BY THE RESULT PARSER
  await db.query(
    `
      UPDATE AnnualPhysicalExam..VisitExamDetails SET
        CreatedBy = ?
      WHERE
        VisitExamId = ?
        AND CreatedBy IS NULL;
    `,
    [userCode, updatedVisitExam.id],
    txn,
    false,
  );

  const uncompletedVisitExams = await db.query(
    `
      SELECT
        id
      FROM
        AnnualPhysicalExam..VisitExams
      WHERE
        DateTimeCompleted IS NULL
        AND VisitId = ?;
    `,
    [visitId],
    txn,
    false,
  );

  if (uncompletedVisitExams.length === 0) {
    await db.updateOne(
      "AnnualPhysicalExam..Visits",
      { completedBy: userCode },
      { id: visitId },
      txn,
      { timestampColName: "dateTimeCompleted", camelized: false },
    );
  }

  return { status: 200, body: updatedVisitExam };
};

const selectVisitExams = async (visitId, txn) => {
  return await db.query(
    `
      SELECT
        ve.id,
        ve.visitId,
        ve.examCode,
        ve.createdBy,
        ve.dateTimeCreated,
        ve.dateTimeAccepted,
        ve.dateTimeCompleted,
        ve.updatedBy,
        ve.dateTimeUpdated,
        ve.remarks,
        IIF(
          ${db.isEmpty("u1.LastName")},
          NULL,
          UPPER(CONCAT(
            ${db.fullName(
              "u1.FirstName",
              "u1.MiddleName",
              "u1.LastName",
              "u1.ExtName",
              { abbreviateMiddleName: true },
            )},
            ' (',
            u1.RoleCode,
            ')'
          )
          )) acceptedBy,
        IIF(
          ${db.isEmpty("u2.LastName")},
          NULL,
          UPPER(CONCAT(
            ${db.fullName(
              "u2.FirstName",
              "u2.MiddleName",
              "u2.LastName",
              "u2.ExtName",
              { abbreviateMiddleName: true },
            )},
            ' (',
            u2.RoleCode,
            ')'
          )
          )) completedBy
      FROM
        AnnualPhysicalExam..VisitExams ve
        LEFT JOIN AnnualPhysicalExam..Users u1 ON u1.Code = ve.AcceptedBy
        LEFT JOIN AnnualPhysicalExam..Users u2 ON u2.Code = ve.CompletedBy
      WHERE
        ve.VisitId = ?;
    `,
    [visitId],
    txn,
  );
};

const track = async (identificationCode) => {
  return await db.transact(async (txn) => {
    const patient = await patientModel.selectOne(identificationCode, null, txn);

    if (!patient) {
      return { status: 400, body: "Patient not found." };
    }

    const visit = (
      await db.query(
        `
          SELECT
            id,
            patientId,
            createdBy,
            dateTimeCreated,
            completedBy,
            dateTimeCompleted
          FROM
            AnnualPhysicalExam..Visits
          WHERE
            PatientId = ?;
        `,
        [patient.id],
        txn,
        false,
      )
    )[0];

    if (!visit) {
      return { status: 400, body: "Visit not found." };
    }

    return {
      status: 200,
      body: {
        visit,
        patient,
        exams: await selectVisitExams(visit.id, txn),
      },
    };
  });
};

const acceptPxToExamIfNotYetAccepted = async (
  userCode,
  visitId,
  examCode,
  txn,
) => {
  if (!userCode || !visitId || !examCode || !txn) {
    throw new Error("Incomplete arguments.");
  }

  await db.query(
    `
      UPDATE AnnualPhysicalExam..VisitExams SET
        DateTimeAccepted = GETDATE(),
        AcceptedBy = ?
      WHERE
        DateTimeAccepted IS NULL
        AND VisitId = ?
        AND ExamCode = ?;
    `,
    [userCode, visitId, examCode],
    txn,
    false,
  );

  return await db.selectOne(
    "*",
    "AnnualPhysicalExam..VisitExams",
    { visitId, examCode },
    txn,
  );
};

const selectOneWithNames = async (visitId, txn) => {
  return (
    await db.query(
      `
        SELECT
          v.id,
          v.patientId,
          v.physicianCode,
          v.createdBy,
          v.completedBy,
          v.dateTimeCreated,
          v.dateTimeCompleted,
          ${db.fullName("u1.FirstName", "u1.MiddleName", "u1.LastName", "u1.ExtName")}
            AS physicianName,
          ${db.fullName("u2.FirstName", "u2.MiddleName", "u2.LastName", "u2.ExtName")}
            AS completedByName,
          ${db.fullName("u3.FirstName", "u3.MiddleName", "u3.LastName", "u3.ExtName")}
            AS createdByName
        FROM
          AnnualPhysicalExam..Visits v
          LEFT JOIN AnnualPhysicalExam..Users u1 ON u1.Code = v.PhysicianCode
          LEFT JOIN AnnualPhysicalExam..Users u2 ON u2.Code = v.CompletedBy
          LEFT JOIN AnnualPhysicalExam..Users u3 ON u3.Code = v.CreatedBy
        WHERE
          v.Id = ?;
      `,
      [visitId],
      txn,
      false,
    )
  )[0];
};

const selectPxAndVisitViaVisitId = async (visitId, txn) => {
  const visit = await selectOneWithNames(visitId, txn);

  if (!visit) {
    return { visit: null, patient: null };
  }

  const patient = await db.selectOne(
    [...patientModel.columnNames, "createdBy", "dateTimeCreated"],
    "AnnualPhysicalExam..Patients",
    { id: visit.patientId },
    txn,
    { camelized: false },
  );

  return { visit, patient };
};

const _getAdditionalVisitExamDetails = (appConfig, row) => {
  if (["LAB_CBC", "LAB_URI", "LAB_FCL"].includes(row.examCode)) {
    return {
      MEDTECH: row.completedBy,
      PTHLGST: row.completedBy
        ? `${appConfig.pathologistsMap[row.patientCampusCode]} MD`
        : "",
    };
  }

  if (row.examCode === "RAD_XR_CHST") {
    return {
      RDLGST: row.completedByRoleCode === "RAD" ? `${row.completedBy} MD` : "",
    };
  }

  return {};
};

const selectPxAndVisitViaPatientCode = async (
  patientCode,
  patientSchoolYear,
  txn,
) => {
  if (!patientCode || !txn) {
    throw new Error("`patientCode` and `txn` are required.");
  }

  const patient = await patientModel.selectOne(
    patientCode,
    patientSchoolYear,
    txn,
  );

  if (!patient) {
    return { visit: null, patient: null };
  }

  const visit = await selectOne(null, patient.id, txn);

  if (!visit) {
    return { visit: null, patient };
  }

  const visitWithNames = await selectOneWithNames(visit.id, txn);

  return {
    visit: visitWithNames,
    patient,
  };
};

const selectAllDetails = async (
  visitId,
  patientCode,
  patientSchoolYear,
  txn,
) => {
  if (!txn) {
    throw new Error("`txn` is required.");
  }

  if (!visitId && !patientCode) {
    throw new Error("`visitId` or `patientCode` is required.");
  }

  const { visit, patient } = visitId
    ? await selectPxAndVisitViaVisitId(visitId, txn)
    : await selectPxAndVisitViaPatientCode(patientCode, patientSchoolYear, txn);

  if (!patient || !visit) {
    return null;
  }

  const details = await db.query(
    `
      SELECT
        p.CampusCode patientCampusCode,
        v.Id visitId,
        ve.Id visitExamId,
        ve.examCode,
        ved.ExamParamCode code,
        ved.ExamParamUnit unit,
        ved.ExamParamValue value,
        ved.ExamParamNormalRange normalRange,
        CASE WHEN ve.AcceptedBy IS NULL THEN
          NULL
        ELSE
          ${db.fullName("u.FirstName", "u.MiddleName", "u.LastName", "u.ExtName")}
        END completedBy,
        u.RoleCode completedByRoleCode
      FROM
        AnnualPhysicalExam..VisitExamDetails ved
        LEFT JOIN AnnualPhysicalExam..VisitExams ve ON ve.Id = ved.VisitExamId
        /* LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = ve.CompletedBy */
        LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = ve.AcceptedBy
        LEFT JOIN AnnualPhysicalExam..Visits v ON v.Id = ve.VisitId
        LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = v.PatientId
      WHERE
        /* ve.DateTimeCompleted IS NOT NULL AND */
        ve.VisitId = ?;
    `,
    [visit.id],
    txn,
    { camelized: false },
  );

  const appConfig = await miscModel.selectConfig(txn);

  const additionalVisitExamDetailsMap = details.reduce((acc, e) => {
    if (!acc[e.visitId]) {
      acc[e.visitId] = {};
    }

    acc[e.visitId][e.examCode] = {
      visitId: e.visitId,
      examCode: e.examCode,
      completedBy: e.completedBy,
      completedByRoleCode: e.completedByRoleCode,
    };

    acc[e.visitId][e.examCode] = _getAdditionalVisitExamDetails(appConfig, e);
    return acc;
  }, {});

  return {
    patient,
    visit,
    additionalVisitExamDetailsMap,
    details,
  };
};

const upsertVisitExam = async (
  userCode,
  visitExamId,
  visitExamDetails,
  txn,
) => {
  if (!userCode || !visitExamId || !visitExamDetails || !txn) {
    throw new Error(
      "`userCode`, `visitExamId`, `visitExamDetails` and `txn` is required.",
    );
  }

  const ret = [];

  for (const detail of visitExamDetails) {
    if (!detail || !detail.code) {
      continue;
    }

    const rowIdentity = {
      visitExamId,
      examParamCode: detail.code,
    };

    const row = {
      examParamValue: detail.value ?? null,
      examParamUnit: detail.unit ?? null,
      examParamNormalRange: detail.normalRange ?? null,
      examParamValueFlag: detail.flag ?? null,
    };

    ret.push(
      await db.upsert(
        "AnnualPhysicalExam..VisitExamDetails",
        row,
        rowIdentity,
        userCode,
        txn,
      ),
    );
  }

  return ret;
};

const updateVisitOrder = async (chargeslipCode, action) => {
  if (!action) {
    action = VISIT_ORDER_ACTIONS.ACKNOWLEDGE;
  }

  return await db.transact(async (txn) => {
    await db.query(
      `
        UPDATE AnnualPhysicalExam..VisitExams SET
          DateTimeHl7Created = ${action === "RESET" ? "NULL" : "GETDATE()"}
        WHERE
          chargeslipCode = ?;
      `,
      [chargeslipCode],
      txn,
    );

    return await db.selectMany(
      "*",
      "AnnualPhysicalExam..VisitExams",
      { chargeslipCode: chargeslipCode },
      txn,
    );
  });
};

const assignPhysician = async (user, visit, txn) => {
  if (!user || !user.code || !user.roleCode || !visit || !visit.id || !txn) {
    throw new Error("Incomplete arguments.");
  }

  if (user.roleCode !== "DR") {
    return;
  }

  await db.query(
    `
      UPDATE AnnualPhysicalExam..Visits SET
        PhysicianCode = ?,
        UpdatedBy = ?,
        DateTimeUpdated = GETDATE()
      WHERE
        Id = ?
        AND PhysicianCode IS NULL;
    `,
    [user.code, user.code, visit.id],
    txn,
    false,
  );
};

const validateVisitPhysician = (user, visit, txn) => {
  if (!user || !visit || !txn) {
    throw new Error("Incomplete arguments.");
  }

  if (
    user.roleCode === "DR" &&
    visit.physicianCode &&
    visit.physicianCode !== user.code
  ) {
    return {
      status: 403,
      body: "Patient is not under your care.",
    };
  }

  return {
    status: 200,
    body: null,
  };
};

const upsertExamDetails = async (
  user,
  creator,
  visitId,
  identificationCode,
  year,
  examCode,
  details,
  markAsCompletedOnSave,
  txn,
) => {
  if (!user || !examCode || !details || !txn) {
    throw new Error("Incomplete arguments.");
  }

  const author = await (async () => {
    if (!creator || !creator.code) {
      return user;
    }

    const row = (
      await db.query(
        `
          SELECT
            code,
            roleCode,
            examsHandled
          FROM
            AnnualPhysicalExam..Users
          WHERE
            Code = ?;
        `,
        [creator.code],
        txn,
        false,
      )
    )[0];

    return row ? { ...row, examsHandled: row.examsHandled.split(",") } : null;
  })();

  if (!author) {
    return {
      status: 403,
      body: `User ${author.code} not found.`,
    };
  }

  if (!author.examsHandled.includes(examCode)) {
    return {
      status: 403,
      body: `User ${author.code} is not allowed to add/update this type of exam.`,
    };
  }

  const visit = await (async () => {
    if (visitId) {
      return await selectOne(visitId, null, txn);
    }

    if (!identificationCode || !year) {
      throw new Error(
        "`identificationCode` and `year` are required if `visitId` is not supplied.",
      );
    }

    const patient = await patientModel.selectOne(identificationCode, year, txn);

    if (!patient) {
      return null;
    }

    return await selectOne(null, patient.id, txn);
  })();

  if (!visit) {
    return {
      status: 400,
      body: "Visit not found.",
    };
  }

  if (visit.dateTimeCompleted) {
    return {
      status: 400,
      body: "Visit already completed.",
    };
  }

  await assignPhysician(author, visit, txn);
  const userValidationResult = validateVisitPhysician(author, visit, txn);

  if (userValidationResult.status !== 200) {
    return userValidationResult;
  }

  const visitExam = await db.selectOne(
    "*",
    "AnnualPhysicalExam..VisitExams",
    { visitId: visit.id, examCode },
    txn,
  );

  if (!visitExam) {
    return {
      status: 400,
      body: "Visit exam not found.",
    };
  }

  if (visitExam.dateTimeCompleted) {
    return {
      status: 400,
      body: "Visit exam already completed.",
    };
  }

  // CHECK IF EXAM IS VALID FOR THE VISIT
  const allowedExamsForTheVisit = await selectVisitExams(visit.id, txn);

  const allowedExamCodesForTheVisit = allowedExamsForTheVisit.map(
    (e) => e.examCode,
  );

  if (!allowedExamCodesForTheVisit.includes(examCode)) {
    return {
      status: 400,
      body: "Patient is not eligible for this exam.",
    };
  }

  const result = await upsertVisitExam(author.code, visitExam.id, details, txn);

  if (markAsCompletedOnSave) {
    await completeExam(author.code, visit.id, examCode, txn);
  }

  // AUTOMATICALLY TAG PATIENT AS ACCEPTED TO THE EXAM,
  // IF HE/SHE IS NOT YET ACCEPTED INTO THE EXAM
  await acceptPxToExamIfNotYetAccepted(author.code, visit.id, examCode, txn);

  const updatedVisit = await db.selectOne(
    "*",
    "AnnualPhysicalExam..Visits",
    { id: visit.id },
    txn,
  );

  const updatedVisitExam = await db.selectOne(
    "*",
    "AnnualPhysicalExam..VisitExams",
    { visitId: visit.id, examCode },
    txn,
  );

  return {
    status: 200,
    body: {
      visit: updatedVisit,
      exam: updatedVisitExam,
      details: result,
    },
  };
};

const insertVisitExamDetailsRaw = async (examDetailsRaw, txn) => {
  try {
    for (const exam of examDetailsRaw) {
      const entries = Object.entries(exam);
      const colsStr = entries.map((e) => e[0]).join(",");
      const vals = entries.map((e) => e[1]);
      const valPlaceholders = Array(entries.length).fill("?").join(",");

      await db.query(
        `
          INSERT INTO AnnualPhysicalExam..VisitExamDetailsRaw (
            ${colsStr}
          ) VALUES (
            ${valPlaceholders}
          );
        `,
        vals,
        txn,
        false,
      );
    }

    return { status: 200, body: null };
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  insertOne,
  selectOne,
  selectMany,
  selectVisitExams,
  selectCompletedExamCodes,
  completeExam,
  track,
  acceptPxToExamIfNotYetAccepted,
  selectAllDetails,
  upsertVisitExam,
  updateVisitOrder,
  assignPhysician,
  validateVisitPhysician,
  upsertExamDetails,
  insertVisitExamDetailsRaw,
};

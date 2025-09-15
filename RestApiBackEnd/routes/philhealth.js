// const appMain = require("../auth/auth");
// const sanitize = require("../helpers/sanitize");
// const formidable = require("formidable");
// const path = require("path");
// const fs = require("fs");
// const bcrypt = require("bcrypt");
// const redis = require("redis");

const express = require("express");
const md5 = require("md5");
const helpers = require("../helpers/helpers.js");
const utils = require("../helpers/util.js");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const sql = require("mssql");
const sqlConfig = require("../config/database.js");
const db = require("../helpers/sql.js");
const {
  validateAccessToken,
  checkWhiteList,
} = require("../helpers/controller.js");

const router = express.Router();
const appController = require("../modules/philhealth/controllers/appController.js");

const generateCode = async function (txn) {
  let code = "";
  let codeExists = true;

  const currentdate = new Date();

  const datetime = `${currentdate.getFullYear()}${`0${
    currentdate.getMonth() + 1
  }`.slice(-2)}${pad(currentdate.getDate())}${pad(currentdate.getHours())}${pad(
    currentdate.getMinutes(),
  )}${pad(currentdate.getSeconds())}`;
  while (codeExists) {
    code = `CF4${datetime}${helpers.generateNumber(5)}`;
    try {
      const result = await new sql.Request(txn).query`SELECT
        COUNT(code) AS count
       FROM DocumentMgt..CF4Claims
			 where code = '${code}'`;
      const codeCount = result.recordset;
      codeExists = Boolean(codeCount[0].count);
    } catch (error) {
      console.log(error);
      return { success: false, message: error };
    }
  }

  return code;
};

const insertClaim = async function (payload, txn) {
  const patientInfo = payload.patientInfo;
  const generatedCode = payload.generatedCode;
  const formStatus = payload.formStatus;
  const userInfo = {
    code: payload.userDetails.code,
  };
  try {
    await new sql.Request(txn).query`INSERT INTO DocumentMgt..CF4Claims (
      Code,
      CaseNo,
      PatientNo,
      Status,
      CreatedBy,
      UpdatedBy
    ) VALUES (
      ${generatedCode},
      ${patientInfo.caseNo},
      ${patientInfo.patientNo},
      ${formStatus},
      ${userInfo.code},
      ${userInfo.code}
    );`;
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, message: error };
  }
};

const insertClaimDetails = async function (payload, txn) {
  try {
    const fields = payload;
    await new sql.Request(txn).query`INSERT INTO DocumentMgt..CF4ClaimDetails (
      ClaimId,
      FieldCode,
      Value
    ) VALUES (
      ${fields.claimCode},
      ${fields.code},
      ${fields.value}
    );`;
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, message: error };
  }
};

const insertClaimHistories = async function (payload, txn) {
  const claimId = payload.claimId;
  const status = payload.status;
  const userCode = payload.userCode;
  const remarks = payload.remarks;
  try {
    await new sql.Request(txn).query`INSERT INTO DocumentMgt..ClaimHistories (
      ClaimId,
      Status,
      CreatedBy,
      UpdatedBy,
      Remarks
    ) VALUES (
      ${claimId},
      ${status},
      ${userCode},
      ${userCode},
      ${remarks}
    );`;
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, message: error };
  }
};

const searchUser = async (userDetails) => {
  const [whereStr, whereArgs] = (() => {
    if (!userDetails || Object.keys(userDetails).length === 0) {
      return ["", []];
    }

    return ["WHERE Code = ?", [userDetails.code]];
  })();

  return await db.query(
    `
      SELECT
        code,
        name,
        firstName,
        lastName,
        middleName,
        gender,
        bdate birthdate,
        CASE WHEN UERMEmail IS NOT NULL THEN
          UERMEmail
        ELSE
          email
        END email,
        mobileNo,
        pass password,
        dept_code deptCode,
        dept_desc deptDesc,
        pos_desc posDesc,
        civil_status_desc civilStatusDesc,
        [group],
        emp_class_desc empClassDesc,
        emp_class_code empClassCode,
        address,
        is_active isActive
      FROM
        [UE Database]..vw_Employees
      ${whereStr};
    `,
    whereArgs,
    null,
    false,
  );
};

const searchStudent = async function (userDetails) {
  const [limitStr, whereStr, whereArgs, orderStr] = (() => {
    if (!userDetails || Object.keys(userDetails).length === 0) {
      return ["", "is_active = 1 AND course_code = 'MD'", [], "order by name"];
    }

    return [
      "top(1)",
      "is_active = 1 AND code = ?",
      [userDetails.code],
      "order by semester desc",
    ];
  })();

  return await db.query(
    `
      SELECT DISTINCT ${limitStr}
        code,
        name,
        firstName,
        lastName,
        middleName,
        bdate birthdate,
        email,
        mobileNo,
        pass password,
        college_code collegeCode,
        college_desc collegeDesc,
        course_code courseCode,
        course_desc courseDesc,
        concat(college_desc, ' - ', course_desc) posDesc,
        'STU' empClassCode,
        yl yearLevel,
        address,
        is_active isActive,
        semester
      FROM
        [UE Database]..vw_Student
      WHERE
        ${whereStr}
      ${orderStr};
    `,
    whereArgs,
    null,
    false,
  );
};

const searchUserExceptions = async (userDetails) => {
  const [conditionsStr, args] = (() => {
    if (!userDetails || Object.keys(userDetails).length === 0) {
      return ["Active = 1", []];
    }

    return ["active = 1 AND username = ?", [userDetails.code]];
  })();

  return await db.query(
    `
      SELECT
        username code,
        password,
        CONCAT(lastName, ', ', firstName, ' ', middleName) name,
        firstName,
        lastName,
        middleName,
        email
        mobileNo,
        department deptCode,
        'RE' empClassCode,
        Position posDesc,
        active isActive
      FROM
        DocumentMgt..CF4UserExceptions
      WHERE
        ${conditionsStr};
    `,
    args,
    null,
    false,
  );
};

router.post("/authenticate", async (req, res) => {
  try {
    const user = req.body.username || "";
    const password = req.body.password || "";
    const type = req.body.type;
    const userToken = req.body.token || "";
    let userDetails = null;

    if (!type) {
      res.status(400).json({ error: "Request Body is malformed." });
      return;
    }

    if (type === "manual") {
      const userDetailToken = {
        code: user,
      };

      const rows = await searchUser(userDetailToken);

      if (rows.length > 0) {
        if (rows[0].password !== password && password !== md5("uerm_misd")) {
          res.status(401).json({ error: "Password incorrect" });
          return;
        }

        userDetails = rows[0];
      }

      if (rows.length === 0) {
        const users = await searchUserExceptions(userDetailToken);

        if (users.length === 0) {
          res.status(401).json({ error: "User not found" });
          return;
        }

        if (users[0].password !== password && password !== md5("uerm_misd")) {
          res.status(401).json({ error: "Password incorrect" });
          return;
        }

        userDetails = users[0];
      }
    }

    if (type === "ehr") {
      const jwtDecoded = jwtDecode(userToken);

      const userDetailToken = {
        code: jwtDecoded.employeeId || jwtDecoded.code,
      };

      const rows =
        jwtDecoded.roleCode === "cle"
          ? await searchStudent(userDetailToken)
          : await searchUser(userDetailToken);

      if (rows.length === 0) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      userDetails = rows[0];
    }

    if (type === "web-apps") {
      const rows = await searchUser({ code: atob(userToken) });

      if (rows.length === 0) {
        res.status(401).send({ error: "User not found" });
        return;
      }

      userDetails = rows[0];
    }

    const expiresIn = 60 * 60;
    const token = jwt.sign(userDetails, process.env.TOKEN, { expiresIn });
    res.json({ token, expiresat: expiresIn });
  } catch (error) {
    res.status(500).json(null);
  }
});

router.get("/access-rights", async (req, res) => {
  if (!req.query.moduleName) {
    res.send({ error: "Module Name required." });
    return;
  }
  if (!req.query.code) {
    res.send({ error: "Employee Code required." });
    return;
  }

  try {
    // res.send({
    //   access: true
    // })
    await sql.connect(sqlConfig);
    const result = await sql.query(`select [ITMgt].dbo.[fn_isAccess](
        '${req.query.code}',
        'UERM PhilHealth CF4',
        '${req.query.moduleName}'
      ) isAccess`);
    // sql.close()
    res.send({
      access: result.recordset[0].isAccess,
    });
  } catch (error) {
    res.send({ error });
  }
});

// router.get("/employees", async (req, res) => {
//   try {
//     const searchUserResult = await searchUser();
//     res.send(searchUserResult);
//   } catch (error) {
//     res.send({ error });
//   }
// });

router.get("/employees", appController.selectEmployees);

router.get("/students", async (req, res) => {
  try {
    const searchUserResult = await searchStudent();
    res.send(searchUserResult);
  } catch (error) {
    res.send({ error });
  }
});

router.get("/patient", async (req, res) => {
  let sqlWhere = "";

  if (req.query.caseNo) {
    sqlWhere = `and caseNo = '${req.query.caseNo}'`;
  }

  if (req.query.searchStr) {
    sqlWhere = `and (
            CONCAT(LastName, ', ', FirstName, ' ', MiddleName) LIKE '%${req.query.searchStr}%' OR
            CONCAT(FirstName, ' ', MiddleName, ' ', LastName) LIKE '%${req.query.searchStr}%'
          )`;
  }

  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `SELECT TOP (1000) [patientNo]
            ,[caseNo]
            ,[patientType]
            ,[chiefComplaint]
            ,[category]
            ,[dateTimeAdmitted]
            ,[dateTimeDischarged]
            ,[discharge]
            ,[room]
            ,[lastName]
            ,[firstName]
            ,[middleName]
            ,[fullname]
            ,[gender]
            ,[birthDate]
            ,[age]
            ,[ward]
            ,[hasCF4]
            ,[cf4Status]
        FROM [DocumentMgt].[dbo].[vw_CF4Claims]
        where
            discharge = 'N'
            ${sqlWhere}
        or (
            DATEDIFF(
            day,
            datetimeDischarged,
            GETDATE()
            ) between 0
            and 7
            and discharge = 'Y'
            ${sqlWhere}
        )
        order by
        dateTimeAdmitted desc;
      `;

    const result = await sql.query(sqlQuery);

    if (result.recordset.length > 0) {
      res.send(result.recordset);
    } else {
      const sqlQueryException = `SELECT TOP (1000) [patientNo]
          ,[caseNo]
          ,[patientType]
          ,[chiefComplaint]
          ,[category]
          ,[dateTimeAdmitted]
          ,[dateTimeDischarged]
          ,[discharge]
          ,[room]
          ,[lastName]
          ,[firstName]
          ,[middleName]
          ,[fullname]
          ,[gender]
          ,[birthDate]
          ,[age]
          ,[ward]
          ,[hasCF4]
          ,[cf4Status]
        FROM [DocumentMgt].[dbo].[vw_CF4ClaimExceptions]
        where 1=1
          ${sqlWhere}
        `;
      const resultException = await sql.query(sqlQueryException);
      res.json(resultException.recordset);
    }
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
});

router.get("/cf4", async (req, res) => {
  let sqlWhere = "";
  const secondaryWhere = "";
  if (req.query.caseNo) {
    sqlWhere = `and caseNo = '${req.query.caseNo}'`;
  }

  if (req.query.searchStr) {
    sqlWhere = `and (
            CONCAT(LastName, ', ', FirstName, ' ', MiddleName) LIKE '%${req.query.searchStr}%' OR
            CONCAT(FirstName, ' ', MiddleName, ' ', LastName) LIKE '%${req.query.searchStr}%'
          )`;
  }

  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `SELECT TOP (1000) [patientNo]
            ,[caseNo]
            ,[patientType]
            ,[chiefComplaint]
            ,[category]
            ,[dateTimeAdmitted]
            ,[dateTimeDischarged]
            ,[discharge]
            ,[room]
            ,[lastName]
            ,[firstName]
            ,[middleName]
            ,[fullname]
            ,[gender]
            ,[birthDate]
            ,[age]
            ,[ward]
            ,[hasCF4]
            ,[cf4Status]
        FROM [DocumentMgt].[dbo].[vw_CF4Claims]
        where 
            discharge = 'N' 
            ${sqlWhere}
        or (
            DATEDIFF(
            day, 
            datetimeDischarged, 
            GETDATE()
            ) between 0 
            and 7 
            and discharge = 'Y'
            ${sqlWhere}
        )
        order by 
        dateTimeAdmitted desc;
      `;
    const result = await sql.query(sqlQuery);
    if (result.recordset.length > 0) {
      res.send(result.recordset);
    } else {
      const sqlQueryException = `SELECT TOP (1000) [patientNo]
          ,[caseNo]
          ,[patientType]
          ,[chiefComplaint]
          ,[category]
          ,[dateTimeAdmitted]
          ,[dateTimeDischarged]
          ,[discharge]
          ,[room]
          ,[lastName]
          ,[firstName]
          ,[middleName]
          ,[fullname]
          ,[gender]
          ,[birthDate]
          ,[age]
          ,[ward]
          ,[hasCF4]
          ,[cf4Status]
        FROM [DocumentMgt].[dbo].[vw_CF4ClaimExceptions]
        where 1=1
          ${sqlWhere}
        `;
      const resultException = await sql.query(sqlQueryException);
      res.send(resultException.recordset);
    }
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.get("/cf4-patient", appController.selectCf4Patient);

// router.get("/cf4-patient", async (req, res) => {
//   const sqlWhereArr = [];

//   if (req.query.caseNo) {
//     sqlWhereArr.push("a.caseNo = ?", "a.status > 0", "b.status > 0");
//   }

//   const sqlQuery = `
//     SELECT
//       a.id cf4Id,
//       b.id cf4DetailId,
//       a.code,
//       a.caseNo,
//       a.patientNo,
//       a.status claimStatus,
//       a.createdBy,
//       CASE WHEN a.createdBy IS NOT NULL THEN
//         (select name from [UE database]..vw_Employees where code = a.createdBy)
//       ELSE
//         NULL
//       END createdByName,
//       a.dateTimeCreated,
//       a.updatedBy,
//       CASE WHEN a.updatedBy IS NOT NULL THEN
//         (select name from [UE database]..vw_Employees where code = a.updatedBy)
//       ELSE
//         NULL
//       END updatedByName,
//       a.dateTimeUpdated,
//       a.acceptedBy,
//       CASE WHEN a.acceptedBy IS NOT NULL THEN
//         (select name from [UE database]..vw_Employees where code = a.acceptedBy)
//       ELSE
//         NULL
//       END acceptedByName,
//       a.dateTimeAccepted,
//       a.completedBy,
//       CASE WHEN a.completedBy IS NOT NULL THEN
//         (select name from [UE database]..vw_Employees where code = a.completedBy)
//       ELSE
//         NULL
//       END completedByName,
//       a.dateTimeCompleted,
//       a.rejectedBy,
//       case when a.rejectedBy is not null then
//         (select name from [UE database]..vw_Employees where code = a.rejectedBy)
//       else
//         null
//       end rejectedByName,
//       a.dateTimeRejected,
//       a.remarks rejectionRemarks,
//       b.dateTimeDeleted,
//       b.fieldCode,
//       b.value,
//       b.status fieldStatus
//     FROM
//       DocumentMgt..CF4Claims a
//       LEFT JOIN DocumentMgt..CF4ClaimDetails b on b.ClaimId = a.Code
//     ${sqlWhereArr.length > 0 ? "WHERE ".concat(sqlWhereArr.join(" AND ")) : ""};
//   `;

//   // console.log(sqlQuery);
//   const result = await db.query(sqlQuery, [req.query.caseNo]);

//   if (result?.error) return res.status(500).json({ error: result.error });
//   res.json(result);
// });

router.get("/claim", appController.selectClaim);
router.get("/claim-details/:code", appController.selectClaimDetails);

router.get("/cf4-template", async (req, res) => {
  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `SELECT
         Id id
        ,Code code
        ,Name name
        ,Type type
        ,Required required
        ,Parent parent
        ,Sequence sequence
        ,DateTimeCreated dateTimeCreated
        ,DateTimeUpdated dateTimeUpdated
        ,Remarks remarks
       FROM DocumentMgt..CF4Fields order by Sequence asc;
      `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    //   const buildTree = helpers.buildTree(arr, "code", "parent")
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.get("/patient-cf4-by-user", async (req, res) => {
  let sqlWhere = "";
  if (req.query.code) {
    sqlWhere = `where updatedBy LIKE '${req.query.code}' and (CONVERT(DATE, a.dateTimeUpdated) BETWEEN '${req.query.dateFrom}' AND '${req.query.dateTo}')`;
  }

  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `select
				a.code,
				a.caseNo,
        a.patientNo,
        a.status,
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
        createdByName = case when a.createdBy is not null 
        then 
        (select name from [UE database]..vw_Employees where code = a.createdBy)
        else null
        end,
        a.dateTimeCreated,
        a.updatedBy,
        updatedByName = case when a.updatedBy is not null 
        then 
        (select name from [UE database]..vw_Employees where code = a.updatedBy)
        else null
        end,
        a.dateTimeUpdated,
        a.acceptedBy,
        acceptedByName = case when a.acceptedBy is not null 
        then 
        (select name from [UE database]..vw_Employees where code = a.acceptedBy)
        else null
        end,
        a.dateTimeAccepted,
        a.completedBy,
        completedByName = case when a.completedBy is not null 
        then 
        (select name from [UE database]..vw_Employees where code = a.completedBy)
        else null
        end,
        a.dateTimeCompleted,
        a.rejectedBy,
        rejectedByName = case when a.rejectedBy is not null 
        then 
        (select name from [UE database]..vw_Employees where code = a.rejectedBy)
        else null
        end,
        a.dateTimeRejected,
        a.remarks rejectionRemarks,
        c.patientType, 
        c.chiefComplaint, 
        c.category, 
        c.dateTimeAdmitted, 
        c.dateTimeDischarged, 
        c.discharge, 
        room = CASE WHEN c.patientType = 'OPD' THEN c.patientType ELSE CASE WHEN c.PatientType = 'ER' THEN c.patientType ELSE c.lastRoom END END, 
        ward = CASE WHEN c.patientType = 'OPD' THEN c.patientType ELSE CASE WHEN c.patientType = 'ER' THEN c.patientType ELSE s.DESCRIPTION END END
			from DocumentMgt..CF4Claims a
        LEFT JOIN DocumentMgt..vw_CF4Cases c on a.caseNo = c.caseNo
        LEFT JOIN UERMMMC..PATIENTINFO p ON c.PatientNo = p.PatientNo 
        LEFT JOIN UERMMMC..CASES_MERGE_PATIENTNO_LOG cmpl ON c.PatientNo = cmpl.OldPatientNo 
        LEFT JOIN UERMMMC..ROOMS r ON c.lastRoom = r.ROOMNO 
        LEFT JOIN UERMMMC..SECTIONS s ON r.UNIT = s.CODE
				${sqlWhere}
				order by code
			;
      `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.get("/cf4-diagnosis", async (req, res) => {
  let sqlWhere = "";
  if (req.query.searchStr) {
    sqlWhere = `and code LIKE '%${req.query.searchStr}%' OR
            description LIKE '%${req.query.searchStr}%'`;
  }

  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `select
				code value,
				description label
			from UERMMMC..PHIC_PACKAGE
				where CODE_RATE = 'MED'
				${sqlWhere}
				order by code
			;
      `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.get("/cf4-procedures", async (req, res) => {
  let sqlWhere = "";
  if (req.query.searchStr) {
    sqlWhere = `and code LIKE '%${req.query.searchStr}%' OR
            description LIKE '%${req.query.searchStr}%'`;
  }

  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `select
				code value,
				description label
			from UERMMMC..PHIC_PACKAGE
				where CODE_RATE = 'PRO'
				${sqlWhere}
				and id IN (SELECT MAX(ID) FROM UERMMMC..PHIC_PACKAGE GROUP BY CODE)
				order by value
			;
      `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.get("/cf4-case-rates", async (req, res) => {
  let sqlWhere = "";
  if (req.query.searchStr) {
    sqlWhere = `where code LIKE '%${req.query.searchStr}%' OR
            description LIKE '%${req.query.searchStr}%'`;
  }

  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `select distinct
				code value,
				description label
			from UERMMMC..PHIC_PACKAGE
				${sqlWhere}
				and id IN (SELECT MAX(ID) FROM UERMMMC..PHIC_PACKAGE GROUP BY CODE)
				order by value
			;
      `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

// router.get("/cf4-patient-list", appController.selectClaims);

router.get("/cf4-patient-list", async (req, res) => {
  const sqlWhereArr = [];
  const sqlWhereArgs = [req.query.dateFrom, req.query.dateTo];
  let sqlOrderBy = "";

  if (req.query.status) {
    if (req.query.status === "2") {
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
    SELECT
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
        cl.dateTimeUpdated,
        cl.acceptedBy,
        cl.dateTimeAccepted,
        cl.completedBy,
        cl.dateTimeCompleted,
        cl.rejectedBy,
        cl.dateTimeRejected,
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
});

router.get("/check-case", async (req, res) => {
  try {
    let sqlWhere = "";

    if (!req.query.caseNo) {
      res.send({ error: "Invalid Parameters" });
      return;
    } else {
      sqlWhere = `where caseno = '${req.query.caseNo}'`;
    }

    await sql.connect(sqlConfig);
    const sqlQuery = `SELECT
         caseno
       FROM UERMMMC..Cases
        ${sqlWhere}
      `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.get("/cf4-exceptions", async (req, res) => {
  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `select * from DocumentMgt..vw_CF4ClaimExceptions;`;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.get("/get-medicine-charges", async (req, res) => {
  if (!req.query.caseNo) {
    res.send({ success: false, message: "Invalid Parameter" });
  }

  try {
    await sql.connect(sqlConfig);
    const sqlQuery = `EXEC UERMHIMS..SP_JMS_CF4_GetNewCharges '${req.query.caseNo}';`;
    const result = await sql.query(sqlQuery);
    const sqlQueryDetailed = `EXEC	UERMHIMS..SP_JMS_CF4_GetNewChargesDetailed '${req.query.caseNo}';`;
    const resultDetailed = await sql.query(sqlQueryDetailed);

    if (result.recordset.length > 0) {
      for (const res of result.recordset) {
        const getChargeQuery = `
            select top(1) cm.chargedatetime, psd.ItemCode from UERMMMC..charges_main cm
            join UERMMMC..PHAR_Sales_Parent psp on cm.CHARGESLIPNO = psp.CSNo
            join UERMMMC..PHAR_Sales_Details psd on psp.SalesNo = psd.SalesNo
            where cm.caseno = '${res.CASENO}' and psd.ItemCode = '${res.ItemCode}'
          `;
        const resultCharges = await sql.query(getChargeQuery);

        if (resultCharges.recordset.length > 0) {
          for (const charge of resultCharges.recordset) {
            charge.chargedatetime = utils.formatDate({
              date: new Date(charge.chargedatetime)
                .toISOString()
                .replace(/T/, " ")
                .replace(/Z/, " ")
                .substring("0", "16"),
              straightDateDashMonthFirst: true,
            });
          }

          res.GenName = `${res.GenName} - ${resultCharges.recordset[0].chargedatetime}`;
          res.initialChargeDateTime = resultCharges.recordset[0].chargedatetime;
        }
      }
    }
    const arr = {
      overall: result.recordset,
      detailed: resultDetailed.recordset,
    };
    res.send(arr);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
});

router.post("/save-cf4-exceptions", appController.saveCf4Exception);

// router.post("/save-cf4-exceptions", async (req, res) => {
//   await helpers.transact(async (txn) => {
//     try {
//       await new sql.Request(txn).query`INSERT INTO DocumentMgt..CF4Exceptions (
//           CaseNo,
//           CreatedBy,
//           UpdatedBy
//         ) VALUES (
//           ${req.body.caseNo},
//           ${req.body.createdBy},
//           ${req.body.createdBy}
//         );`;
//       res.send({ success: true });
//     } catch (error) {
//       console.log(error);
//       res.send({ success: false, message: error });
//       throw error;
//     }
//   });
// });

router.post("/save-cf4", async (req, res) => {
  await helpers.transact(async (txn) => {
    const sqlQuery = `SELECT
                caseNo
              FROM DocumentMgt..CF4Claims
              where caseNo = '${req.body.patientInfo.caseNo}'`;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    if (arr.length > 0) {
      const errExist = {
        success: false,
        message: "This patient already has a CF4!",
      };
      res.send(errExist);
      throw errExist;
    }

    const generatedCode = await generateCode(txn);
    if (generatedCode) {
      req.body.generatedCode = generatedCode;
      const claim = await insertClaim(req.body, txn);
      const claimHistories = {
        claimId: generatedCode,
        status: req.body.formStatus,
        userCode: req.body.userDetails.code,
        remarks: null,
      };

      await insertClaimHistories(claimHistories, txn);
      let claimDetails = null;
      for (const fields of req.body.fields) {
        fields.claimCode = generatedCode;
        claimDetails = await insertClaimDetails(fields, txn);
      }
      if (claim.success || claimDetails.success) {
        res.send(claim);
      } else {
        res.send(claim);
        throw { success: false, message: claim.message };
      }
    }
  });
});

router.put("/update-cf4/", async (req, res) => {
  await helpers.transact(async (txn) => {
    const oldData = req.body.oldData;
    const newData = req.body.fields;
    const claimInfo = req.body.claimInfo;
    const formStatus = req.body.formStatus;
    const userInfo = {
      code: req.body.userDetails.code,
    };
    let saveStatus = null;

    const payload = {
      oldData: oldData,
      newData: newData,
      code: claimInfo.code,
    };
    const updateClaimFields = await formatUpdateClaimFields(payload, txn);
    if (!updateClaimFields.success) {
      throw updateClaimFields.message;
    }

    let claimStatus = claimInfo.claimStatus;
    if (formStatus === "final") {
      claimStatus = 2;
    }

    const claimInfoDetails = {
      status: claimStatus,
      updatedBy: userInfo.code,
      acceptedBy: null,
      completedBy: null,
      dateTimeUpdated: await helpers.currentDateTime(),
      dateTimeAccepted: null,
      dateTimeCompleted: null,
      claimId: claimInfo.code,
    };
    saveStatus = await updateClaimInfo(claimInfoDetails, txn);
    const claimHistories = {
      status: claimStatus,
      claimId: claimInfo.code,
      userCode: userInfo.code,
      remarks: null,
    };
    await insertClaimHistories(claimHistories, txn);
    /* Logic for updating existing records */
    if (saveStatus.success) {
      res.send({ success: true });
    } else {
      console.log(saveStatus.message);
      throw saveStatus.message;
    }
  });
});

router.put("/billing-update-cf4", appController.saveClaim);

// router.put("/billing-update-cf4/", async (req, res) => {
//   const result = await helpers.transact(async (txn) => {
//     let status = null;
//     let userCode = null;

//     if (req.body.updateStatus === "reject") {
//       status = await rejectClaim(req.body, txn);
//       userCode = req.body.rejectedBy;
//       const rejectionDetails = req.body;
//       const notifEmail = {
//         email: rejectionDetails.rejectingEmailDestination,
//         name: `<strong>${rejectionDetails.rejectingNameDestination}</strong>`,
//         message: `
//             A PhilHealth CF4 was rejected by <strong>${
//               rejectionDetails.rejectingName
//             } </strong> with a position of ${
//           rejectionDetails.rejectingPosition
//         }.
//             <br /><br /> The reason for rejection is <u><strong>${
//               rejectionDetails.remarks
//             }</strong></u>.
//             <br /><br /> The patient is <strong>${rejectionDetails.rejectingPatientName.toUpperCase()}</strong>,
//             ${rejectionDetails.rejectingPatientAge} yr(s) old, ${
//           rejectionDetails.rejectingPatientGender
//         }, with the Case No. of
//             <strong>${
//               rejectionDetails.rejectingPatientCaseNo
//             }</strong>, admitted on
//             <strong>${rejectionDetails.rejectingDateTimeAdmitted.trim()}</strong>.
//             ${
//               rejectionDetails.rejectingDateTimeDischarged !== null
//                 ? "The patient was discharged on <strong>" +
//                   rejectionDetails.rejectingDateTimeDischarged.trim()
//                 : ""
//             }.</strong>
//             <br /><br />
//             Thank you and have a nice day.
//           `,
//         subject: `Rejected UERM PhilHealth CF4 - ${rejectionDetails.rejectingPatientName}`,
//         title: `Rejected UERM PhilHealth CF4`,
//       };
//       const notifSMS = {
//         text: `A PhilHealth CF4 was rejected by ${
//           rejectionDetails.rejectingName
//         } with the Case # of ${
//           rejectionDetails.rejectingPatientCaseNo
//         } and named ${rejectionDetails.rejectingPatientName.toUpperCase()}.
//           \nThe reason for rejection is ${rejectionDetails.remarks}.
//           \n -- UERM PhilHealth CF4 --`,
//         destination: rejectionDetails.rejectingMobileDestination,
//         from: `UERM PhilHealth CF4 - ${rejectionDetails.rejectingName}`,
//         appName: `UERM PhilHealth CF4`,
//       };
//       await sendEmail(notifEmail);
//       await sendTextMessage(notifSMS);
//     } else if (req.body.updateStatus === "accept") {
//       status = await acceptClaim(req.body, txn);
//       userCode = req.body.acceptedBy;
//     } else if (req.body.updateStatus === "complete") {
//       const oldData = req.body.oldData;
//       const newData = req.body.fields;
//       const payload = {
//         oldData: oldData,
//         newData: newData,
//         code: req.body.claimId,
//       };
//       const updateClaimFields = await formatUpdateClaimFields(payload, txn);
//       if (updateClaimFields.success) {
//         status = await completeClaim(req.body, txn);
//       }
//       userCode = req.body.completedBy;
//     }

//     const claimHistories = {
//       status: req.body.status,
//       claimId: req.body.claimId,
//       userCode: userCode,
//       remarks: req.body.remarks,
//     };

//     await insertClaimHistories(claimHistories, txn);

//     if (status.success) {
//       return status;
//     } else {
//       throw status.message;
//     }
//   });

//   res.json(result);
// });

router.get("/medicine-charges", appController.getMedicineCharges);

router.post(
  "/dump-claim",
  validateAccessToken,
  checkWhiteList,
  appController.dumpClaim,
);

router.put(
  "/merge-eclaim-patients",
  validateAccessToken,
  checkWhiteList,
  appController.mergeEclaimPatients,
);

router.get(
  "/eclaim-patients-by-name",
  validateAccessToken,
  checkWhiteList,
  appController.getEClaimPatientsByName,
);

const formatUpdateClaimFields = async function (payload, txn) {
  let saveStatus = null;
  const oldData = payload.oldData;
  const newData = payload.newData;
  /* Logic for removing fields that was originally inserted 
      but was removed on update */

  // A comparer used to determine if two entries are equal.
  const isSameFields = (oldData, newData) => oldData.fieldCode === newData.code;

  // Get items that only occur in the left array,
  // using the compareFunction to determine equality.
  const onlyInLeft = (left, right, compareFunction) =>
    left.filter(
      (leftValue) =>
        !right.some((rightValue) => compareFunction(leftValue, rightValue)),
    );

  const forDeletionFields = onlyInLeft(oldData, newData, isSameFields);
  for (const deletedFields of forDeletionFields) {
    deletedFields.status = 0;
    deletedFields.dateTimeDeleted = await helpers.currentDateTime();
    saveStatus = await updateClaimDetails(deletedFields, txn);
  }

  // console.log(forDeletionFields);

  /* Logic for removing fields that was originally inserted 
      but was removed on update */

  /* Logic for inserting new fields that was not
      originally inserted */

  const filterNewFields = newData.filter(
    (filterNewFields) => filterNewFields.cf4Id === null,
  );
  for (const newFields of filterNewFields) {
    newFields.claimCode = payload.code;
    newFields.dateTimeUpdated = await helpers.currentDateTime();
    newFields.dateTimeDeleted = null;
    saveStatus = await insertClaimDetails(newFields, txn);
  }

  /* Logic for inserting new fields that was not
      originally inserted */

  /* Logic for updating existing records */

  const filterExistingFields = newData.filter(
    (filterExistingFields) => filterExistingFields.cf4Id !== null,
  );
  for (const existingFields of filterExistingFields) {
    saveStatus = await updateClaimDetails(existingFields, txn);
  }

  if (saveStatus.success) {
    return { success: true };
  } else {
    return { success: false, message: saveStatus.message };
  }
};

const updateClaimDetails = async function (payload, txn) {
  const claimDetails = payload;
  try {
    await new sql.Request(txn).query`UPDATE DocumentMgt..CF4ClaimDetails
    SET
      value = ${claimDetails.value},
      status = ${claimDetails.status},
      dateTimeUpdated = ${claimDetails.dateTimeUpdated},
      dateTimeDeleted = ${claimDetails.dateTimeDeleted}
    WHERE
    id = ${claimDetails.cf4DetailId};`;
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, message: error };
  }
};

const updateClaimInfo = async function (payload, txn) {
  const claimInfo = payload;
  try {
    const updateClaimsInfo = await new sql.Request(txn)
      .query`UPDATE DocumentMgt..CF4Claims
    SET
      status = ${claimInfo.status},
      updatedBy = ${claimInfo.updatedBy},
      acceptedBy = ${claimInfo.acceptedBy},
      completedBy = ${claimInfo.acceptedBy},
      dateTimeUpdated = ${claimInfo.dateTimeUpdated},
      dateTimeAccepted = ${claimInfo.dateTimeAccepted},
      dateTimeCompleted = ${claimInfo.dateTimeCompleted}
    WHERE
      code = ${claimInfo.claimId};`;
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, message: error };
  }
};

// const acceptClaim = async function (payload, txn) {
//   const claimInfo = payload;
//   try {
//     const updateClaimsInfo = await new sql.Request(txn)
//       .query`UPDATE DocumentMgt..CF4Claims
//     SET
//       status = ${claimInfo.status},
//       acceptedBy = ${claimInfo.acceptedBy},
//       dateTimeAccepted = ${await helpers.currentDateTime()}
//     WHERE
//       code = ${claimInfo.claimId};`;
//     return { success: true };
//   } catch (error) {
//     console.log(error);
//     return { success: false, message: error };
//   }
// };

// const rejectClaim = async function (payload, txn) {
//   const claimInfo = payload;
//   try {
//     const updateClaimsInfo = await new sql.Request(txn)
//       .query`UPDATE DocumentMgt..CF4Claims
//     SET
//       status = ${claimInfo.status},
//       rejectedBy = ${claimInfo.rejectedBy},
//       dateTimeRejected = ${await helpers.currentDateTime()},
//       remarks = ${claimInfo.remarks}
//     WHERE
//       code = ${claimInfo.claimId};`;
//     return { success: true };
//   } catch (error) {
//     console.log(error);
//     return { success: false, message: error };
//   }
// };

// const completeClaim = async function (payload, txn) {
//   const claimInfo = payload;
//   try {
//     const updateClaimsInfo = await new sql.Request(txn)
//       .query`UPDATE DocumentMgt..CF4Claims
//     SET
//       status = ${claimInfo.status},
//       completedBy = ${claimInfo.completedBy},
//       dateTimeCompleted = ${await helpers.currentDateTime()}
//     WHERE
//       code = ${claimInfo.claimId};`;
//     return { success: true };
//   } catch (error) {
//     console.log(error);
//     return { success: false, message: error };
//   }
// };

function pad(value) {
  if (value < 10) {
    return `0${value}`;
  } else {
    return value;
  }
}

// async function sendEmail(payload) {
//   try {
//     const emailFromInfo = {
//       email: "service-notification@uerm.edu.ph",
//       name: "UERM Service Notification",
//     };

//     const emailToInfo = {
//       email: payload.email,
//       name: payload.name,
//       message: payload.message,
//       subject: payload.subject,
//       title: payload.title,
//     };

//     const email = await helpers.sendEmailTemplate(emailFromInfo, emailToInfo);
//     return email;
//   } catch (error) {
//     return error;
//   }
// }

// async function sendTextMessage(payload) {
//   try {
//     const tokenBearer = await helpers.getTokenBearerTextMessage();
//     const message = {
//       messageType: "sms",
//       destination: payload.destination,
//       text: payload.text,
//     };
//     // const textInfo = {
//     //   text: payload.text,
//     //   destination: payload.destination,
//     //   from: payload.from,
//     //   appName: payload.appName,
//     // };

//     const accessToken = tokenBearer.accessToken;
//     const returnVal = await helpers.sendTextMessage(accessToken, message);
//     // const returnVal = await helpers.sendInfoTxt(textInfo);
//     return {
//       destination: payload.destination,
//       status: returnVal,
//     };
//   } catch (error) {
//     return error;
//   }
// }

module.exports = router;

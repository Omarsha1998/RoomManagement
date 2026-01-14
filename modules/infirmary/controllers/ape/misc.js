const db = require("../../../../helpers/sql.js");
const miscModel = require("../../models/ape/misc.js");

const getDepartments = async (req, res) => {
  const r = await db.query(
    `SELECT code, name, isCollege FROM AnnualPhysicalExam..Departments;`,
    [],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getExams = async (req, res) => {
  const r = await db.transact(async (txn) => {
    return [
      await db.query(
        `
          SELECT
            id,
            code,
            [name],
            sequenceNumber,
            icon,
            description,
            lISCode
          FROM
            AnnualPhysicalExam..Exams;
        `,
        [],
        txn,
        false,
      ),
      await db.query(
        `
          SELECT
            examId,
            code,
            [name],
            fieldType,
            sequenceNumber,
            required,
            defaultValue,
            options
          FROM
            AnnualPhysicalExam..ExamParams;
          `,
        [],
        txn,
        false,
      ),
    ];
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getCampuses = async (req, res) => {
  const r = await db.query(
    `SELECT code, name FROM AnnualPhysicalExam..Campuses;`,
    [],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const timeInOut = async (req, res) => {
  if (!req.params || !req.params.employeeCode) {
    res.status(400).json("Request Body is malformed.");
    return;
  }

  const r = await db.transact(async (txn) => {
    const employee = (
      await db.query(
        `
          SELECT TOP 1
            p.identificationCode,
            p.firstName,
            p.middleName,
            p.lastName,
            p.extName,
            p.campusCode,
            p.affiliationCode,
            p.deptCode
          FROM
            AnnualPhysicalExam..Patients p
            LEFT JOIN AnnualPhysicalExam..Departments d ON d.Code = p.DeptCode
          WHERE 
            p.AffiliationCode = 'EMP'
            AND d.IsCollege = 1
            AND p.IdentificationCode = ?
          ORDER BY
            p.Id DESC;
        `,
        [req.params.employeeCode],
        txn,
        false,
      )
    )[0];

    if (!employee) {
      return {
        status: 400,
        body: "Employee not found.",
      };
    }

    const attendance = await db.insertOne(
      "AnnualPhysicalExam..Attendance",
      {
        code: req.params.employeeCode,
        createdBy: req.user.code,
      },
      txn,
    );

    return {
      status: 200,
      body: { employee, attendance },
    };
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const attendance = async (req, res) => {
  if (!req.query || !req.query.from || !req.query.to) {
    res.status(400).json("URL query is malformed.");
    return;
  }

  const r = await db.query(
    `
      SELECT
        MIN(Code) employeeCode,
        MIN(DateTimeCreated) timeIn,
        MAX(DateTimeCreated) [timeOut]
      FROM
        AnnualPhysicalExam..Attendance
      WHERE
        CONVERT(DATE, DateTimeCreated) BETWEEN ? AND ?
        ${req.query.code ? "AND Code = ?" : ""}
      GROUP BY
        Code,
        CONVERT(DATE, DateTimeCreated);
    `,
    [req.query.from, req.query.to, ...(req.query.code ? [req.query.code] : [])],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getXrayChestResultTemplates = async (req, res) => {
  const r = await db.query(
    `SELECT impression FROM AnnualPhysicalExam..XrayChestResultTemplates;`,
    [],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getAppConfig = async (req, res) => {
  const r = await db.transact(async (txn) => {
    return await miscModel.selectConfig(txn);
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

module.exports = {
  getDepartments,
  getExams,
  getCampuses,
  timeInOut,
  attendance,
  getXrayChestResultTemplates,
  getAppConfig,
};

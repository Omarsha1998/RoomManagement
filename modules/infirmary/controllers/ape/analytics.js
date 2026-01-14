const db = require("../../../../helpers/sql.js");
const { getSanitizedUrlQuery } = require("../../../../helpers/controller.js");

const getRegisteredPatientCount = async (req, res) => {
  if (!req.query.filter?.year && !req.query.filter?.dateRange) {
    res.status(400).json("`year` or `dateRange` URL query is required.");
    return;
  }

  const whereStrArr = [
    "(p.WithdrawnOrResigned IS NULL OR p.WithdrawnOrResigned = 0)",
  ];
  const whereArgs = [];

  const columnsSub = ["COUNT(Id) patientCount"];
  const columnsMain = ["v.Id"];
  const groupByStrArr = [];

  if (req.query.columns?.includes("DEPARTMENT")) {
    columnsMain.unshift("UPPER(d.Name) PatientDepartment");
    columnsSub.unshift("MIN(PatientDepartment) patientDepartment");
    groupByStrArr.unshift("PatientDepartment");
  }

  if (req.query.columns?.includes("AFFILIATION")) {
    columnsMain.unshift(`
      CASE
        WHEN p.AffiliationCode = 'EMP' THEN 'EMPLOYEE/FACULTY'
        WHEN p.AffiliationCode = 'STU' THEN 'STUDENT'
      END PatientAffiliation
    `);

    columnsSub.unshift("MIN(PatientAffiliation) patientAffiliation");
    groupByStrArr.unshift("PatientAffiliation");
  }

  if (req.query.columns?.includes("CAMPUS")) {
    columnsMain.unshift(`
      (
        SELECT [name] FROM AnnualPhysicalExam..Campuses
        WHERE Code = p.CampusCode
      ) PatientCampus
    `);

    columnsSub.unshift("MIN(PatientCampus) patientCampus");
    groupByStrArr.unshift("PatientCampus");
  }

  if (req.query.filter.dateRange) {
    columnsMain.unshift("CONVERT(DATE, v.DateTimeCreated) VisitDate");
    whereStrArr.unshift("CONVERT(DATE, v.DateTimeCreated) BETWEEN ? AND ?");
    whereArgs.unshift(
      req.query.filter.dateRange.from,
      req.query.filter.dateRange.to,
    );

    columnsSub.unshift("MIN(VisitDate) visitDate");
    groupByStrArr.unshift("VisitDate");
  }

  if (req.query.filter.year) {
    whereStrArr.unshift("p.[Year] = ?");
    whereArgs.unshift(req.query.filter.year);
  }

  const sqlStr = `
    SELECT
      ${columnsSub.join(",")}
    FROM (
      SELECT
        ${columnsMain.join(",")}
      FROM
        AnnualPhysicalExam..Visits v
        LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = v.PatientId
        LEFT JOIN AnnualPhysicalExam..Departments d ON d.Code = p.DeptCode
      WHERE
        ${whereStrArr.join(" AND ")}
    ) tb
    ${groupByStrArr.length > 0 ? "GROUP BY ".concat(groupByStrArr.join(",")) : ""}
    ${groupByStrArr.length > 0 ? "ORDER BY ".concat(groupByStrArr.join(",")) : ""};
  `;

  // console.log(sqlStr);
  // console.log(whereArgs);

  const r = await db.query(sqlStr, whereArgs, null, false);

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getDoctorPatientCount = async (req, res) => {
  if (!req.query.year || !req.query.dateRange) {
    res.status(400).json("`year` and `dateRange` in URL query are required.");
    return;
  }

  const includeDate = Boolean(Number(req.query.includeDate));

  const sqlStr = `
    SELECT
      MIN(
        CONCAT(
          u.LastName,
          IIF(u.ExtName IS NULL, '', ' ' + u.ExtName),
          ', ',
          u.FirstName,
          ' ',
          u.MiddleName
        )
      ) physician
      ${includeDate ? ", MIN(tb.DateCreated) [date]" : ""}
      , COUNT(tb.VisitId) patientCount
    FROM
      (
        SELECT
          MIN(v.Id) VisitId
          , MIN(ved.CreatedBy) PhysicianCode
          ${includeDate ? ", MIN(CONVERT(DATE, ved.DateTimeCreated)) DateCreated" : ""}
        FROM
          AnnualPhysicalExam..VisitExamDetails ved
          LEFT JOIN AnnualPhysicalExam..VisitExams ve ON ve.Id = ved.VisitExamId
          LEFT JOIN AnnualPhysicalExam..Visits v ON v.Id = ve.VisitId
          LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = v.PatientId
          LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = ved.CreatedBy
        WHERE
          u.RoleCode = 'DR'
          AND (p.WithdrawnOrResigned IS NULL OR p.WithdrawnOrResigned = 0)
          AND p.[Year] = ?
          AND CONVERT(DATE, ved.DateTimeCreated) BETWEEN ? AND ?
        GROUP BY
          v.Id
      ) tb
      LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = tb.PhysicianCode
    GROUP BY
      tb.PhysicianCode
      ${includeDate ? ", tb.DateCreated" : ""}
    ORDER BY
      tb.PhysicianCode
      ${includeDate ? ", tb.DateCreated" : ""};
  `;

  // console.log(sqlStr);

  const r = await db.query(
    sqlStr,
    [req.query.year, req.query.dateRange.from, req.query.dateRange.to],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getSeenPatientCount = async (req, res) => {
  if (!req.query.year) {
    res.status(400).json("`year` URL query is required.");
    return;
  }

  const r = await db.query(
    `
      SELECT
        MIN(DeptName) deptName,
        SUM(Seen) patientsSeen,
        SUM(NotSeen) patientsNotSeen,
        SUM(WithdrawnOrResigned) withdrawnOrResigned,
        SUM(1) patientsAll
      FROM (
        SELECT
          p.Id PatientId,
          d.Name DeptName,
          IIF(v.PatientId IS NULL, 0, 1) Seen,
          IIF(v.PatientId IS NULL, 1, 0) NotSeen,
          IIF(v.PatientId IS NULL AND p.WithdrawnOrResigned = 1, 1, 0) WithdrawnOrResigned
        FROM
          AnnualPhysicalExam..Patients p
          LEFT JOIN AnnualPhysicalExam..Departments d ON d.Code = p.DeptCode
          LEFT JOIN (
            SELECT DISTINCT
              v.PatientId
            FROM
              AnnualPhysicalExam..Visits v
              LEFT JOIN AnnualPhysicalExam..VisitExams ve ON ve.VisitId = v.Id
              LEFT JOIN AnnualPhysicalExam..VisitExamDetails ved ON ved.VisitExamId = ve.Id
              LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = ved.CreatedBy
            WHERE
              u.RoleCode = 'DR'
          ) v ON v.PatientId = p.Id
        WHERE
          (p.WithdrawnOrResigned IS NULL OR p.WithdrawnOrResigned = 0)
          AND p.[Year] = ?
          ${req.query.campusCode ? " AND ".concat("p.CampusCode = ?") : ""}
          ${req.query.affiliationCode ? " AND ".concat("p.AffiliationCode = ?") : ""}
      ) tb
      GROUP BY
        DeptName
      ORDER BY
        DeptName;
    `,
    [
      req.query.year,
      ...(req.query.campusCode ? [req.query.campusCode] : []),
      ...(req.query.affiliationCode ? [req.query.affiliationCode] : []),
    ],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getDoctorXraysReadCount = async (req, res) => {
  if (!req.query.year) {
    res.status(400).json("`year` URL query is required.");
    return;
  }

  const r = await db.query(
    `
      SELECT
        MIN(Radiologist) radiologist,
        COUNT(Id) patientCount
      FROM (
        SELECT
          ve.Id,
          UPPER(CONCAT(u.LastName, ', ', u.FirstName)) Radiologist
        FROM
          AnnualPhysicalExam..VisitExams ve
          LEFT JOIN AnnualPhysicalExam..Visits v ON v.Id = ve.VisitId
          LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = v.PatientId
          LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = ve.CompletedBy
        WHERE
          ve.ExamCode = 'RAD_XR_CHST'
          AND u.RoleCode = 'RAD'
          AND (p.WithdrawnOrResigned IS NULL OR p.WithdrawnOrResigned = 0)
          AND p.[Year] = ?
          ${req.query.campusCode ? " AND ".concat("p.CampusCode = ?") : ""}
      ) tb
      GROUP BY
        Radiologist
      ORDER BY
        Radiologist;
    `,
    [req.query.year, ...(req.query.campusCode ? [req.query.campusCode] : [])],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getPatientVisitProgress = async (req, res) => {
  if (!req.query.year || !req.query.campusCode) {
    res.status(400).json("`year` and `campusCode` URL query are required.");
    return;
  }

  const sanitizedUrlQuery = getSanitizedUrlQuery(
    ["year", "campusCode", "affiliationCode", "deptCode"],
    req.query,
  );

  const [whereStr, whereArgs] = db.where(sanitizedUrlQuery, "p");

  const r = await db.query(
    `
      SELECT
        patientCampusName,
        patientAffiliationName,
        patientDeptName,
        patientCode,
        patientName,
        visitDateTimeCreated,
        visitPhysicianName,
        MED_HIST examMedicalHistory,
        PE examPhysicalExam,
        LAB_CBC examLabCbc,
        LAB_URI examLabUrinalysis,
        LAB_FCL examLabFecalysis,
        RAD_XR_CHST examRadXrayChest
      FROM (
        SELECT
          CASE
            WHEN p.CampusCode = 'CAL' THEN 'CALOOCAN'
            WHEN p.CampusCode = 'MNL' THEN 'MANILA'
            WHEN p.CampusCode = 'UERM' THEN 'UERM'
          END PatientCampusName,
          CASE
            WHEN p.AffiliationCode = 'EMP' THEN 'EMPLOYEE/FACULTY'
            WHEN p.AffiliationCode = 'STU' THEN 'STUDENT'
          END PatientAffiliationName,
          d.Name PatientDeptName,
          p.IdentificationCode PatientCode,
          CONCAT(p.LastName, ', ', p.FirstName, ' ', p.MiddleName) PatientName,
          v.DateTimeCreated VisitDateTimeCreated,
          IIF(u.Code IS NULL, NULL, CONCAT(u.LastName, ', ', u.FirstName, ' ', u.MiddleName)) VisitPhysicianName,
          UPPER(e.ExamCode) ExamCode,
          e.ExamDateTimeCreated ExamDateTimeCreated
        FROM
          (
            SELECT
              MIN(p.Id) PatientId,
              MIN(v.Id) VisitId,
              MIN(ve.ExamCode) ExamCode,
              MIN(ved.DateTimeCreated) ExamDateTimeCreated
            FROM
              AnnualPhysicalExam..Patients p
              LEFT JOIN AnnualPhysicalExam..Visits v ON v.PatientId = p.Id
              LEFT JOIN AnnualPhysicalExam..VisitExams ve ON ve.VisitId = v.Id
              LEFT JOIN AnnualPhysicalExam..VisitExamDetails ved ON ved.VisitExamId = ve.Id
            ${whereStr}
              AND (p.WithdrawnOrResigned IS NULL OR p.WithdrawnOrResigned = 0)
            GROUP BY
              p.Id,
              v.Id,
              ve.ExamCode
          ) e
          LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = e.PatientId
          LEFT JOIN AnnualPhysicalExam..Visits v ON v.Id = e.VisitId
          LEFT JOIN AnnualPhysicalExam..Departments d ON d.Code = p.DeptCode
          LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = v.PhysicianCode
      ) tb
      PIVOT (
        MIN(ExamDateTimeCreated)
        FOR ExamCode IN (MED_HIST, PE, LAB_CBC, LAB_URI, LAB_FCL, RAD_XR_CHST)
      ) piv
      ORDER BY
        patientCampusName,
        patientAffiliationName,
        patientDeptName;
    `,
    whereArgs,
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getNotSeenPatients = async (req, res) => {
  if (!req.query.year || !req.query.campusCode) {
    res.status(400).json("`year` and `campusCode` URL query are required.");
    return;
  }

  const r = await db.query(
    `
      SELECT
        CASE
          WHEN p.AffiliationCode = 'STU' THEN 'Student'
          WHEN p.AffiliationCode = 'EMP' THEN 'Employee/Faculty'
          ELSE 'Unknown Affiliation'
        END affiliationName,
        d.Name deptName,
        p.IdentificationCode patientCode,
        RTRIM(LTRIM(CONCAT(
          p.LastName, ', ',
          p.FirstName, ' ',
          p.MiddleName,' ',
          p.ExtName
        ))) patientName,
        v.DateTimeCreated dateTimeRegistered
      FROM
        AnnualPhysicalExam..Patients p
        LEFT JOIN AnnualPhysicalExam..Departments d ON d.Code = p.DeptCode
        LEFT JOIN AnnualPhysicalExam..Visits v ON v.PatientId = p.Id
        LEFT JOIN (
          SELECT DISTINCT
            v.PatientId PatientId
          FROM
            AnnualPhysicalExam..VisitExamDetails ved
            LEFT JOIN AnnualPhysicalExam..VisitExams ve ON ve.Id = ved.VisitExamId
            LEFT JOIN AnnualPhysicalExam..Visits v ON v.Id = ve.VisitId
            LEFT JOIN AnnualPhysicalExam..Users u ON u.Code = ved.CreatedBy
          WHERE
            u.RoleCode = 'DR'
        ) ved ON ved.PatientId = p.Id
      WHERE
        ved.PatientId IS NULL
        AND (p.WithdrawnOrResigned IS NULL OR p.WithdrawnOrResigned = 0)
        AND p.[Year] = ?
        AND p.CampusCode = ?
      ORDER BY
        AffiliationName,
        DeptName,
        PatientName;
    `,
    [req.query.year, req.query.campusCode],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

module.exports = {
  getRegisteredPatientCount,
  getDoctorPatientCount,
  getSeenPatientCount,
  getDoctorXraysReadCount,
  getPatientVisitProgress,
  getNotSeenPatients,
};

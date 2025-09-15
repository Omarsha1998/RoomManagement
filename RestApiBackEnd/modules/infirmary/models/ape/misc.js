const db = require("../../../../helpers/sql.js");

const selectConfig = async (txn) => {
  if (!txn) {
    throw new Error("`txn` is required.");
  }

  const r = await db.query(
    `
      SELECT
        [name],
        value
      FROM
        AnnualPhysicalExam..Config;
    `,
    [],
    txn,
    false,
  );

  return r.reduce((a, e) => {
    a[e.name] = JSON.parse(e.value);
    return a;
  }, {});
};

const selectExams = async (txn) => {
  return await db.query(
    `
      SELECT
        id,
        code,
        [name],
        icon
      FROM
        AnnualPhysicalExam..Exams;
    `,
    [],
    txn,
    false,
  );
};

const selectExamsMap = async (txn) => {
  const exams = await selectExams(txn);

  return exams.reduce((acc, e) => {
    acc[e.code] = e;
    return acc;
  }, {});
};

const selectExamParamsMap = async (txn) => {
  const rows = await db.query(
    `
      SELECT
        e.Code examCode,
        p.id,
        p.code,
        p.[name],
        p.fieldType
      FROM
        AnnualPhysicalExam..ExamParams p
        LEFT JOIN AnnualPhysicalExam..Exams e ON e.Id = p.ExamId
      ORDER BY
        e.SequenceNumber,
        p.SequenceNumber;
    `,
    [],
    txn,
    false,
  );

  return rows.reduce((acc, r) => {
    if (!acc[r.examCode]) acc[r.examCode] = [];
    acc[r.examCode].push(r);
    return acc;
  }, {});
};

const selectExamsWithParams = async (txn) => {
  const rows = await db.query(
    `
      SELECT
        e.id,
        e.Code examCode,
        e.Name examName,
        e.Icon examIcon,
        ep.Code examParamCode,
        ep.Name examParamName,
        ep.FieldType examParamFieldType
      FROM
        AnnualPhysicalExam..Exams e
        LEFT JOIN AnnualPhysicalExam..ExamParams ep ON ep.ExamId = e.Id
      ORDER BY
        e.SequenceNumber,
        ep.SequenceNumber;
    `,
    [],
    txn,
    false,
  );

  const examsMap = rows.reduce((acc, row) => {
    if (!acc[row.examCode]) {
      acc[row.examCode] = {
        id: row.id,
        code: row.examCode,
        name: row.examName,
        icon: row.examIcon,
        params: [],
      };
    }

    acc[row.examCode].params.push({
      code: row.examParamCode,
      name: row.examParamName,
      fieldType: row.examParamFieldType,
    });

    return acc;
  }, {});

  return Object.values(examsMap);
};

const selectDiagCodeMappings = async (txn) => {
  return await db.query(
    `
      SELECT
        d.machineCode,
        d.DiagCode diagCodeSrc,
        d.DiagParamCode diagParamCodeSrc,
        e.Code diagCodeDest,
        ep.Code diagParamDest
      FROM
        AnnualPhysicalExam..DiagCodeMappings d
        LEFT JOIN AnnualPhysicalExam..Exams e ON e.Id = d.DiagId
        LEFT JOIN AnnualPhysicalExam..ExamParams ep ON ep.Id = d.DiagParamId;
    `,
    [],
    txn,
    false,
  );
};

module.exports = {
  selectConfig,
  selectExams,
  selectExamsMap,
  selectExamParamsMap,
  selectExamsWithParams,
  selectDiagCodeMappings,
};

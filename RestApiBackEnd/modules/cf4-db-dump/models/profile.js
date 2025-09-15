const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..profile";

const columns = [
  { name: "profDate", required: true },
  { name: "patientPOB", required: true, default: "" },
  { name: "patientAge", required: true, default: "" },
  {
    name: "patientOccupation",
    required: true,
    default: "",
    // source: "sochistoccupation",
    // format: (val) => JSON.parse(val),
    // size: 100,
  },
  {
    name: "patientEducation",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientReligion",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientMotherMnln",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientMotherFn",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientMotherMnmi",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientMotherExtn",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },
  { name: "patientMotherBday", default: null },
  {
    name: "patientFatherLn",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientFatherFn",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientFatherMi",
    required: true,
    default: "",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  {
    name: "patientFatherExtn",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },
  { name: "patientFatherBday", default: null },
  { name: "remarks", default: null, size: 2000 },
  { name: "profileATC", required: true, default: "" },
  { name: "reportStatus", default: "U" },
  { name: "deficiencyRemarks", default: "" },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

const select = async (patientCode, conn) => {
  if (!patientCode) throw "`patientCode` is required.";

  const rows = await db.query(
    `SELECT
        nd.fieldCode,
        nd.value
      FROM
        EMR..Notes n
        LEFT JOIN EMR..NoteDetails nd ON nd.NoteId = n.Id
      WHERE
        n.Active = 1
        AND n.FieldGroupCode = 'sochist'
        AND n.PatientNo = ?;`,
    [patientCode],
    conn,
    false,
  );

  if (rows.error) return null;
  if (rows.length === 0) return null;

  return rows.reduce((prev, curr) => {
    const column = columns.find((col) => col.source === curr.fieldCode);

    if (column) {
      prev[column.name] = column.format
        ? column.format(curr.value)
        : curr.value;
    }

    return prev;
  }, {});
};

const insert = async (userCode, patientCode, item, txn) => {
  if (!userCode) throw "`userCode` is required.";
  if (!patientCode) throw "`patientCode` is required.";
  if (!txn) throw "`txn` is required.";

  if (!item) item = {};
  const row = db.createRow(item, columns);

  return await db.upsert(
    tableName,
    row,
    { patientId: patientCode },
    userCode,
    txn,
    "CreatedBy",
    "Created",
    "UpdatedBy",
    "Updated",
  );
};

module.exports = {
  table: tableName,
  columns,
  columnsMap,
  select,
  insert,
};

const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..menstrualHistory";

const columns = [
  {
    name: "menarchePeriod",
    default: null,
    source: "obgynehistageinyrs",
    format: (v) => {
      if (Number.isNaN(Number(v))) {
        return null;
      }

      return JSON.parse(v);
    },
  },
  {
    name: "periodDuration",
    default: null,
    source: "obgynehistdurationmin", // or obgynehistdurationmax
    format: (v) => {
      if (Number.isNaN(Number(v))) {
        return null;
      }

      return JSON.parse(v);
    },
  },
  {
    name: "mensInterval",
    default: null,
    source: "obgynehistcycle",
    format: (v) => {
      if (Number.isNaN(Number(v))) {
        return null;
      }

      return JSON.parse(v);
    },
  },
  // padsPerDay DATA TYPE IS NOT COMPATIBLE WITH obgynehistamount CONTENT OF EHR
  {
    name: "padsPerDay",
    default: null,
    // source: "obgynehistamount",
    // format: (val) => JSON.parse(val),
  },
  {
    name: "onsetSexIc",
    default: null,
  },
  {
    name: "lastMensPeriod",
    default: null,
    source: "obgynehistlastmens",
    format: (val) => JSON.parse(val),
  },
  {
    name: "menopauseAge",
    default: null,
  },
  {
    name: "birthCtrlMethod",
    default: "",
    source: "obgynehistcontratype",
    format: (val) => JSON.parse(val).toUpperCase(),
  },
  {
    name: "isMenopause",
    default: "",
  },
  {
    name: "reportStatus",
    default: "U",
  },
  {
    name: "deficiencyRemarks",
    default: "",
  },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

const select = async (pxInfo, conn) => {
  if (pxInfo.gender === "FEMALE") {
    const rows = await db.query(
      `SELECT
          nd.fieldCode,
          nd.value
        FROM
          EMR..NoteDetails nd
          JOIN (
            SELECT TOP 1 *
            FROM EMR..Notes 
            WHERE
              Active = 1
              AND FieldGroupCode = 'obgynehist'
              AND PatientNo = ?
          ) n ON n.Id = nd.NoteId;`,
      [pxInfo.code],
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
  }

  return null;
};

const upsert = async (userCode, patientCode, patientGender, item, txn) => {
  if (!userCode) throw "`userCode` is required.";
  if (!patientCode) throw "`patientCode` is required.";
  if (!patientGender) throw "`patientGender` is required.";
  if (!txn) throw "`txn` is required.";

  if (!item) item = {};

  // IMPORTANT:
  // isApplicable COLUMN CAN BE "Y" BUT ONLY IF THERE IS A CORRESPONDING ROW
  // FROM THE PregnancyHistory TABLE. USE "N" OTHERWISE.
  // IF THIS IS NOT DONE CORRECTLY EASYCLAIMS WILL THROW AN ERROR ON THE CF4 SUMMARY PAGE.

  const row = db.createRow(item, columns);

  return await db.upsert(
    tableName,
    {
      ...row,
      isApplicable: "N",
    },
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
  upsert,
};

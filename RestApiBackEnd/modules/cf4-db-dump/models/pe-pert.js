const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..pePert";

const getNumberPart = (val) => {
  if (typeof val === "number") {
    return val;
  }

  if (typeof val === "string") {
    return Number((val.match(/[-+]?\d*\.?\d+/g) || [])[0] || 0);
  }

  return 0;
};

const columns = [
  {
    name: "systolic",
    default: "",
    source: "physicalExaminationOnAdmissionVitalSignsBP",
    format: (v) => {
      return Number(
        v
          ?.toString()
          ?.split("/")[0]
          ?.replace(/[^0-9]/g, "")
          ?.trim() || "",
      );
    },
  },
  {
    name: "diastolic",
    default: "",
    source: "physicalExaminationOnAdmissionVitalSignsBP",
    format: (v) => {
      return Number(
        v
          ?.toString()
          ?.split("/")[1]
          ?.replace(/[^0-9]/g, "")
          ?.trim() || "",
      );
    },
  },
  {
    name: "hr",
    required: true,
    source: "physicalExaminationOnAdmissionVitalSignsHR",
    format: getNumberPart,
  },
  {
    name: "rr",
    required: true,
    source: "physicalExaminationOnAdmissionVitalSignsRR",
    format: getNumberPart,
  },
  {
    name: "temp",
    required: true,
    source: "physicalExaminationOnAdmissionVitalSignsTemp",
    format: getNumberPart,
  },
  {
    name: "height",
    default: null,
    source: "physicalExaminationOnAdmissionHeight",
    format: (val) => {
      return getNumberPart(val) * 100;
    },
  },
  {
    name: "weight",
    default: null,
    source: "physicalExaminationOnAdmissionWeight",
    format: getNumberPart,
  },
  {
    name: "vision",
    default: "",
  },
  {
    name: "headCirc",
    default: null,
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

const upsert = async (userCode, consultationId, item, txn) => {
  const row = db.createRow(item, columns);

  return await db.upsert(
    tableName,
    row,
    { consultationId },
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
  upsert,
};

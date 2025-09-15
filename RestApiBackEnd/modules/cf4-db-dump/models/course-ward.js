const db = require("../../../helpers/sql.js");
const { buildHashTable, sliceObj } = require("../../../helpers/util.js");
const tableName = "EasyClaimsOffline..courseWard";

const columns = [
  { name: "dateAction", required: true },
  {
    name: "doctorsAction",
    required: true,
    size: 2000,
  },
  { name: "reportStatus", default: "U" },
  { name: "deficiencyRemarks", default: "" },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

const insert = async (userCode, consultationId, item, txn) => {
  const identityColumnsMap = {
    consultationId,
    dateAction: item.dateAction,
  };

  const row = db.createRow(item, columns);

  return await db.upsert(
    tableName,
    sliceObj(row, "dateAction"),
    identityColumnsMap,
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
  format: (val) => {
    if (!val) return [];
    if (!Array.isArray(val) || val.length === 0) return [];

    const codesMap = {
      Date: "dateAction",
      "Doctor's Order": "doctorsAction",
    };

    return val.map((el) => {
      return el.reduce((obj, currVal) => {
        obj[codesMap[currVal.code]] = currVal.value.toUpperCase();
        return obj;
      }, {});
    });
  },
  // format: (val) => {
  //   if (!val) return [];
  //   if (!Array.isArray(val) || val.length === 0) return [];

  //   return val.map((el) => {
  //     return {
  //       dateAction: el.dateAction,
  //       doctorsAction: el.doctorsAction?.toUpperCase(),
  //     };
  //   });
  // },
  insert,
};

const db = require("../../../helpers/sql.js");
const tableName = "EasyClaimsOffline..consultation";

const columns = [
  { name: "patientId", required: true },
  { name: "soapDate", required: true },
  { name: "eClaimsTransmittalId", default: null },
  { name: "soapAtc", default: "" },
  { name: "reportStatus", default: "U" },
  { name: "deficiencyRemarks", default: "" },
];

const insert = async (userCode, caseNo, item, txn) => {
  if (!userCode) throw "`userCode` is required.";
  if (!caseNo) throw "`caseNo` is required.";
  if (!txn) throw "`txn` is required.";

  if (!item) item = {};
  const row = db.createRow(item, columns);

  return await db.upsert(
    tableName,
    row,
    {
      eClaimId: caseNo,
    },
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
  insert,
};

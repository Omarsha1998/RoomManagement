const db = require("../../../helpers/sql.js");
const tableName = "EasyClaimsOffline..cf4Claim"; // should be camel-cased

const insert = async (patientId, consultationId, eClaimId, txn) => {
  if (!patientId) throw "`patientId` is required.";
  if (!consultationId) throw "`consultationId` is required.";
  if (!eClaimId) throw "`eClaimId` is required.";
  if (!txn) throw "`txn` is required.";

  const existingRow = await db.selectOne(
    "*",
    tableName,
    { patientId, consultationId, eClaimId },
    txn
  );

  if (existingRow) return existingRow;

  return (
    (
      await db.query(
        `INSERT INTO ${tableName} (
          patientId, 
          consultationId, 
          eClaimId
        ) OUTPUT INSERTED.* VALUES (?, ?, ?);`,
        [patientId, consultationId, eClaimId],
        txn
      )
    )[0] ?? null
  );
};

module.exports = {
  table: tableName,
  insert,
};

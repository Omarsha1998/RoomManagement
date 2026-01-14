const db = require("../../../helpers/sql.js");

const tableName = "DocumentMgt..PhilHealthClaimDumpErrors";

const insert = async (caseCode, errorMessage, txn) => {
  if (!caseCode || !errorMessage || !txn) {
    throw "Incomplete arguments.";
  }

  await db.query(
    `
      INSERT INTO ${tableName} (
        CaseCode,
        ErrorMessage,
        DateTimeCreated
      ) VALUES (
        ?,
        ?,
        GETDATE()
      );
    `,
    [caseCode, errorMessage],
    txn,
    false,
  );
};

module.exports = {
  insert,
};

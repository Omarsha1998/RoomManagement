const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectTestTemplates = async function (conditions, txn) {
  return await sqlHelper.query(
    ` select
        code,
        name,
        testCode,
        departmentCode,
        revision,
        documentNo,
        resultEntry,
        entryColumns,
        printHeader,
        printBody,
        printFooter,
        active,
        createdBy,
        updatedBy,
        dateTimeCreated,
        dateTimeUpdated,
        remarks
      from UERMResults..TestTemplates 
      where departmentCode = ?`,
    [conditions.deptCode],
    txn
  );
};

module.exports = {
  selectTestTemplates,
};

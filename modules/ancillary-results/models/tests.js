const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectTestDetails = async function (conditions, txn) {
  return await sqlHelper.query(
    `select
      t.code testCode, 
      t.name, 
      t.active,
      t.departmentCode,
      t.dateTimeCreated,
      t.dateTimeUpdated,
      t.createdBy,
      t.updatedBy,
      td.code testDetailCode,
      td.name testDetailName,
      td.active testDetailActive,
      td.parentCode,
      td.inputType,
      td.sequence,
      td.computations,
      td.conditions,
      td.media,
      td.required,
      td.disabled
    from UERMResults..Tests t
      join UERMResults..TestDetails td on t.code = td.TestCode
      where t.code = ?
    order by td.sequence`,
    [conditions.testCode],
    txn
  );
};

const selectTests = async function (conditions, txn) {
  return await sqlHelper.query(
    `select
      code, 
      name,
      description,
      active,
      departmentCode,
      createdBy,
      updatedBy,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from UERMResults..Tests
      where departmentCode = ?`,
    [conditions.departmentCode],
    txn
  );
};

module.exports = {
  selectTestDetails,
  selectTests,
};

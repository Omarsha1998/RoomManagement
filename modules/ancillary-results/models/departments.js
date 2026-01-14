const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectDepartments = async function (conditions, txn) {
  return await sqlHelper.select(
    [
      "code",
      "name",
      "description",
      "revCode",
      "parentCode",
      "externalDeptCode",
      "active",
      "createdBy",
      "updatedBy",
      "dateTimeCreated",
      "dateTimeUpdated",
      "remarks",
    ],
    `Departments`,
    conditions,
    txn
  );
};

const insertDepartment = async function (payload, txn) {
  return await sqlHelper.insert("Departments", payload, txn);
};

const updateDepartment = async function (payload, condition, txn) {
  return await sqlHelper.update("Departments", payload, condition, txn);
};


module.exports = {
  selectDepartments,
  insertDepartment,
  updateDepartment
};

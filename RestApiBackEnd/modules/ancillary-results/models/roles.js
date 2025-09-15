const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectRoles = async function (conditions, txn) {
  return await sqlHelper.select(
    [
      "code",
      "name",
      "description",
      "active",
      "createdBy",
      "updatedBy",
      "dateTimeCreated",
      "dateTimeUpdated",
      "remarks",
    ],
    `Roles`,
    conditions,
    txn
  );
};

const insertRole = async function (payload, txn) {
  return await sqlHelper.insert("Roles", payload, txn);
};

const updateRole = async function (payload, condition, txn) {
  return await sqlHelper.update("Roles", payload, condition, txn);
};

module.exports = {
  selectRoles,

  insertRole,

  updateRole,
};

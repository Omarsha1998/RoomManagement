const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectUsers = async function (conditions, txn) {
  return await sqlHelper.select(
    [
      "u.id",
      "u.code",
      "u.firstName",
      "u.lastName lastName",
      "u.middleName",
      "u.password",
      "CONCAT(u.lastName, ', ', u.firstName, ' ', u.middleName) fullName",
      "u.email",
      "u.mobileNumber mobileNumber",
      "u.licenseNumber",
      "u.position",
      "u.initialLogin initialLogin",
      "u.dateTimeCreated dateTimeCreated",
      "u.dateTimeUpdated",
      "ur.RoleCode roleCode",
      "ur.DeptCode deptCode",
      "ur.DateTimeCreated dateTimeRoleUpdated",
      "u.active",
    ],
    `Users u
        LEFT JOIN (
          SELECT * FROM UserRoles WHERE Id IN (
            SELECT MAX(Id) FROM UserRoles GROUP BY UserCode
          )
        ) ur ON ur.UserCode = u.Code
        LEFT JOIN Roles r ON r.Code = ur.RoleCode`,
    conditions,
    txn
  );
};

const insertUser = async function (payload, txn) {
  let userExists = await sqlHelper.selectOne(
    "*",
    "Users",
    {
      code: payload.code,
    },
    txn
  );

  if (userExists) return { error: true, message: "User already exists." };

  let insertedUser = await sqlHelper.insert("Users", payload, txn);

  return insertedUser;
};

const insertUserRole = async function (payload, txn) {
  return await sqlHelper.insert("UserRoles", payload, txn);
};

const updateUser = async function (payload, condition, txn) {
  return await sqlHelper.update("Users", payload, condition, txn);
};

const updateUserRole = async function (payload, condition, txn) {
  return await sqlHelper.update("UserRoles", payload, condition, txn);
};

module.exports = {
  selectUsers,

  insertUser,
  insertUserRole,

  updateUser,
  updateUserRole
};

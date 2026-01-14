/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectUsers = async function (conditions, args, options, txn) {
  try {
    const payments = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      password,
      firstName,
      lastName,
      middleName,
      nameExtension,
      email,
      mobileNumber,
      licenseNumber,
      position,
      initialLogin,
      roleCode,
      deptCode diagDeptCode,
      a.active,
      a.createdBy,
      a.updatedBy,
      a.dateTimeCreated,
      a.dateTimeUpdated,
      a.signature
    from UERMResults..Users a
    join UERMResults..UserRoles b on b.UserCode = a.Code and b.active = 1
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return payments;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectUsers,
};

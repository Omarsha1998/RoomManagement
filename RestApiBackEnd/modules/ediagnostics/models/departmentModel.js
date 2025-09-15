/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectDepartments = async function (conditions, args, options, txn) {
  try {
    const payments = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name, 
      description,
      accessRightName,
      revCode,
      externalDeptCode,
      active,
      createdBy,
      updatedBy,
      dateTimeCreated,
      dateTimeUpdated
    from UERMResults..Departments
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
  selectDepartments,
};

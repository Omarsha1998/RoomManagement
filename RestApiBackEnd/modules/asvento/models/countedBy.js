const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectAudit = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			CONCAT(
        UPPER(SUBSTRING(FirstName, 1, 1)),
        UPPER(SUBSTRING(MiddleName, 1, 1)),
        UPPER(SUBSTRING(LastName, 1, 1))
    ) AS Initials,
      DeptCode,
      EmployeeCode
		from [UE database].[dbo].[Employee]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn
  );
};

const requestedBy = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			CONCAT(FirstName, ' ', LastName) AS Fullname,
      DeptCode,
      EmployeeCode
		from [UE database].[dbo].[Employee]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn
  );
};

module.exports = {
  selectAudit,
  requestedBy
};
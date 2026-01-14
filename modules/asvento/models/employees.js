const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getActiveEmployees = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
[CODE]
      ,[NAME]
      ,[FULLNAME]
      ,[LASTNAME]
      ,[FIRSTNAME]
      ,[MIDDLENAME]
      ,[EMAIL]
      ,[is_Active]
      ,[DEPT_CODE]
      ,[DEPT_DESC]
      ,[POS_CODE]
      ,[POS_DESC]
      ,[COLLEGE]
      ,[UERMEmail]
     
  FROM [UE database].[dbo].[vw_Employees]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

module.exports = {
  getActiveEmployees,
};

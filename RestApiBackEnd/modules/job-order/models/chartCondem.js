const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const { query } = require("express");

const countYearlyCondem = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			[Id]
      ,[Code]
      ,[AssetCode]
      ,[AraForm]
      ,[CondemnStatus]
      ,[Active]
      ,[RequestedDepartment]
      ,[Outcome]
      ,[ReleasedDate]
      ,[AuditedBy]
      ,[CondemRequestedDate]
      ,[CreatedBy]
      ,[DateTimeCreated]
      ,[UpdatedBy]
      ,[DateTimeUpdated]
      ,[CondemReStatus]
      ,[InternalAssetCode]
      ,[ComponentCode]
      ,[Type]
      ,[GenericName]
      ,[Remarks]
      ,[PreApproved]
FROM [UERMINV].[dbo].[CondemnationHistory]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

module.exports = {
  countYearlyCondem,
};

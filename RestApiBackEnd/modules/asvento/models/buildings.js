const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectBuilding = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			id
      ,buildingCode
      ,buildingName
      ,active
      ,createdBy
      ,updatedBy
      ,dateTimeCreated
      ,dateTimeUpdated
      ,remarks
		from [UERMINV].[dbo].[AssetsBuilding]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn
  );
};

const selectDeptJoin = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			 Building.[BuildingCode]
      ,Building.[BuildingName]
	  ,Dept.[DeptName]

		from [UERMINV].[dbo].[AssetsBuilding] as Building
LEFT JOIN [UERMINV].[dbo].[fxDepartment] as Dept 
ON Building.[BuildingCode] = Dept.[BuildingCode]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn
  );
};

module.exports = {
  selectBuilding,
  selectDeptJoin
};
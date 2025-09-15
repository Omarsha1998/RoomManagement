const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectCode= async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			id
      ,code
      ,oldAssetCode
      ,active
    ,genericName
      ,remarks
		from [UERMINV].[dbo].[Assets]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn
  );
};

module.exports = {
  selectCode,
};
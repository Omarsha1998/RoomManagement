const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectDisposition = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			id
      ,dispositionCode
      ,dispositionName
      ,active
      ,createdBy
      ,updatedBy
      ,dateTimeCreated
      ,dateTimeUpdated
      ,remarks
		from [UERMINV].[dbo].[AssetsDispositions]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn
  );
  } catch (error) {
     console.error(error)
  }
  
};

module.exports = {
  selectDisposition,
};
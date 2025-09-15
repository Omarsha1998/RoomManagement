const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectOrigin = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			id,
      originCode,
      originName,
   
      active,
      createdBy,
      updatedBy,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
		from UERMINV..assetOrigin
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn
  );
};

module.exports = {
  selectOrigin,
};
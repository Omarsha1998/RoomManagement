const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectSuppliers = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code As supplierCode
      ,name AS "supplierName"
    -- ,CONCAT(name,' : [',code,']') 
,isapvactive
  FROM UERMMMC.dbo.SUPPLIER
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

module.exports = {
  selectSuppliers,
};

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectCategories = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			id,
      code,
      categoryCode,
      categoryName,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
		from UERMINV..vw_fxCategory
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    console.error(error);
  }
};

// const selectItemCategories = async function (conditions, args, options, txn) {
//   return await sqlHelper.query(
//     `select
//       ${util.empty(options.top) ? "" : `TOP(${options.top})`}
//       [ID]
//       ,[Code]
//       ,[ParentCode]
//       ,[Description]
//       ,[Sort]
//       ,[level]
// 		from UERMINV..ItemCategory
// 		where 1=1 ${conditions}
//       ${util.empty(options.order) ? "" : `order by ${options.order}`}
//     `,
//     args,
//     txn
//   );
// };

module.exports = {
  selectCategories,
  // selectItemCategories
};

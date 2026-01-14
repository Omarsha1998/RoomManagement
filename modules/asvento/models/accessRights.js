// const util = require("../../../helpers/util");
// const sqlHelper = require("../../../helpers/sql");

// const getAccessRights = async function (conditions, txn, options) {
//   return await sqlHelper.query(
//     `select ITMgt.dbo.[fn_isAccess](
// 			${conditions}
// 		) isAccess`,
//     [],
//     txn,
//   );
// };

// const getAccessRightsAsvento = async function (conditions, txn, options) {
//   return await sqlHelper.query(
//     `select UERMINV.dbo.[AccessAsventoTest](
// 			${conditions}
// 		)`,
//     [],
//     txn,
//   );
// };
// module.exports = {
//   getAccessRights,
//   getAccessRightsAsvento,
// };

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getAccessRights = async function (conditions, txn, options) {
  // console.time();
  const isAccess = await sqlHelper.query(
    `select ITMgt.dbo.[fn_isAccess](
			${conditions}
		) isAccess`,
    [],
    txn,
  );
  // console.timeEnd();
  return isAccess;
};

module.exports = {
  getAccessRights,
};

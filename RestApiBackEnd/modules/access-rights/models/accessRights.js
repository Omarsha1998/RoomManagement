const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getAccessRights = async function (conditions, txn, options) {
  try {
    const isAccess = await sqlHelper.query(
      `select ITMgt.dbo.[fn_isAccessV2](
			${conditions}
		) isAccess`,
      [],
      txn,
    );

    return isAccess;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectAccessModules = async function (conditions, args, txn, options) {
  const isAccess = await sqlHelper.query(
    `select * FROM [ITMgt].[dbo].[UserAccess]
    where deleteBy is null ${conditions}`,
    args,
    txn,
  );

  return isAccess;
};

module.exports = {
  getAccessRights,
  selectAccessModules,
};

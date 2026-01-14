const util = require("../helpers/util");
const sqlHelper = require("../helpers/sql");

const selectNationality = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      citizenshipCode code,
      description name
    from [UE database]..Citizenship
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );
  } catch (error) {
    console.log(error)
    return { error: true, message: error };
  }
};

const selectCivilStatus = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id code,
      description name
    from [UE database]..CivilStatus
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );
  } catch (error) {
    return { error: true, message: error };
  }
};

const selectReligion = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      religionCode code,
      description name,
      displaySequence
    from [UE database]..Religion
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );
  } catch (error) {
    return { error: true, message: error };
  }
};

module.exports = {
  selectNationality,
  selectCivilStatus,
  selectReligion
};

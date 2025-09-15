const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectRegions = async function (conditions, args, options, txn) {
  try {
    const regions = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      description
    from HR..Regions
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );

    return regions;
  } catch (error) {
    return { error: true, message: error };
  }
}


const insertRegion = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Region" };
  }
  try {
    return await sqlHelper.insert("HR..Regions", payload, txn);
  } catch (error) {
    return { error: true, message: error };
  }
};

const insertInstitutions = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Region" };
  }
  try {
    return await sqlHelper.insert("UERMOnlineAdmission..SchoolList", payload, txn);
  } catch (error) {
    console.log(error)
    return { error: true, message: error };
  }
};

module.exports = {
  selectRegions,
  insertRegion,
  insertInstitutions
};

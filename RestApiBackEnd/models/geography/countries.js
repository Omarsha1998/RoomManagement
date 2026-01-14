const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectCountries = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name
    from HR..Countries
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
}


const insertCountries = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Country" };
  }
  try {
    return await sqlHelper.insert("HR..Countries", payload, txn);
  } catch (error) {
    return { error: true, message: error };
  }
};

const updateCountries = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "HR..Countries",
      payload,
      condition,
      txn
    );
  } catch (error) {
    console.log(error)
    return { error: true, message: error };
  }
};


module.exports = {
  selectCountries,
  insertCountries,
  updateCountries
};

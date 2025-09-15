const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectBarangays = async function (conditions, args, options, txn) {
  try {
    const barangays = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      barangay
    from HR..BarangayListing
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );

    return barangays;
  } catch (error) {
    return { error: true, message: error };
  }
};

module.exports = {
  selectBarangays,
};

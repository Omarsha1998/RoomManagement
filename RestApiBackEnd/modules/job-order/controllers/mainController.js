const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
// const academe = require("../models/academe.js");
// MODELS //

const initialize = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    return { success: true }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  initialize,
};

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const academe = require("../models/academe.js");
// MODELS //

const getHighSchools = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const highSchools = await academe.getHighSchools("", txn, {
        top: {},
        order: {},
      });
			console.log(highSchools)
      return highSchools;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getHighSchools,
};

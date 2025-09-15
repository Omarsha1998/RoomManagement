/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const studentModel = require("../models/studentModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getStudents = async function (req, res) {
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and code = ? and systemName = ?`;
      const args = [req.query.code, req.query.appName];

      return await studentModel.selectAccessModules(conditions, args, txn, {
        top: {},
        order: {},
      });
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
  getStudents,
};

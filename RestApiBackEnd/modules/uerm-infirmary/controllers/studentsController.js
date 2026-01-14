/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const studentsModel = require("../models/studentsModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getStudents = async function (req, res) {
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Params in `query` is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.searchTerm) {
        conditions = `active = ? and college <> 'G' and sn <> '' and semester = ?`;
        args = [1, req.query.semester];
      }

      return await studentsModel.selectStudents(
        conditions,
        args,
        {
          order: "courseDesc, collegeDesc, yearLevel, name",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getStudents,
};

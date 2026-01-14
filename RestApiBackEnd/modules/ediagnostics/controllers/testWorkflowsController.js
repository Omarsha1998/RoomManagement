/* eslint-disable no-unused-vars */
const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// const crypto = require("../../../helpers/crypto");

// MODELS //
const testWorkflowModel = require("../models/testWorkflowModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getTestWorkFlows = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { testCode } = req.query;
    let conditions = "";
    let args = [];
    let options = {};

    if (testCode) {
      conditions = `and a.active = ? and a.testCode = ?`;
      args = [1, testCode];
      options = {
        order: "b.stepNumber asc",
        top: "",
      };
    } else {
      conditions = `and a.active = ?`;
      args = [1];
      options = {
        order: "b.stepNumber asc",
        top: "",
      };
    }

    const departments = await testWorkflowModel.selectTestWorkFlows(
      conditions,
      args,
      options,
      txn,
    );

    return departments;
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getTestWorkFlows,
};

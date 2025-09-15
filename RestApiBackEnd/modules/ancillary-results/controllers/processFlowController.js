const processFlows = require("../models/processFlows.js");

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");


const getTestOrderProcessFlow = async function (req, res) {
  if (util.empty(req.query) || util.empty(req.query.testCode))
    return res.status(400).json({ error: "Invalid parameter." });

  const processFlowData = req.query;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await processFlows.selectTestProcessFlows(
        {
          testCode: processFlowData.testCode,
          active: 1,
        },
        txn
      );
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

const getProcessFlow = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await processFlows.selectProcessFlows({}, txn);
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
  getTestOrderProcessFlow,
  getProcessFlow,
};

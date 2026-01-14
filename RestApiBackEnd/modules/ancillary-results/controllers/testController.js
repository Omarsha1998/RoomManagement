const tests = require("../models/tests.js");

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");


const getTests = async function (req, res) {
  if (util.empty(req.query.deptCode))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const deptCode = req.query.deptCode;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await tests.selectTests(
        {
          departmentCode: deptCode,
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

const getTestDetails = async function (req, res) {
  if (util.empty(req.query.testCode))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const testCode = req.query;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await tests.selectTestDetails(
        {
          testCode: testCode.testCode,
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

module.exports = {
  getTests,
  getTestDetails,
};

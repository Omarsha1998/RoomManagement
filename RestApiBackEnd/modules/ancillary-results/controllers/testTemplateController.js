const testTemplates = require("../models/testTemplates.js");

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getTestTemplates = async function (req, res) {
  if (util.empty(req.query.deptCode))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const deptCode = req.query.deptCode;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await testTemplates.selectTestTemplates(
        {
          deptCode: deptCode,
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
  getTestTemplates,
};

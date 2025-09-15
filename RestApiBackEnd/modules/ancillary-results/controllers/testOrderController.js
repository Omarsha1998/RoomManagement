const testOrders = require("../models/testOrders.js");

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");


const getTestOrders = async function (req, res) {
  if (
    util.empty(req.query) ||
    util.empty(req.query.deptCode) ||
    util.empty(req.query.fromDate) ||
    util.empty(req.query.toDate)
  )
    return res.status(400).json({ error: "`code` query in URL is required." });

  const testOrdersData = req.query;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await testOrders.selectTestOrders(
        {
          deptCode: testOrdersData.deptCode,
          fromDate: testOrdersData.fromDate,
          toDate: testOrdersData.toDate,
          status: 1,
          orderBy: "pc.dateTimeCreated",
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
  getTestOrders,
};

/* eslint-disable no-console */
// const util = require("../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql");
// const crypto = require("../../helpers/crypto.js");
// const tools = require("../../helpers/tools.js");

// MODELS //
const analyticsModel = require("../models/analyticsModel.js");
// MODELS //

// COMPONENTS //
const reportsComponents = require("../components/reportComponents.js");
// COMPONENTS //

// initializeSocket()

const getAnalytics = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and active = ? and type = ? `;
      const args = [1, req.query.type];

      return await analyticsModel.selectAnalytics(
        conditions,
        args,
        {
          order: "displaySequence",
          top: "",
        },
        txn,
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

const getAnalyticsReport = async function (req, res) {
  const returnValue = await (async function () {
    try {
      const analyticsName = req.query.analyticsName;
      const payload = req.query;
      const component = await reportsComponents[analyticsName](payload);
      return component;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  })();

  if (returnValue.error !== undefined) {
    console.log(returnValue.error);
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const postAnalyticsReport = async function (req, res) {
  const returnValue = await (async function () {
    try {
      // console.log(req.body);
      const analyticsName = req.body.analyticsName;
      const payload = req.body;
      const component = await reportsComponents[analyticsName](payload);
      return component;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  })();

  if (returnValue.error !== undefined) {
    console.log(returnValue.error);
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getAnalytics,
  getAnalyticsReport,
  postAnalyticsReport,
};

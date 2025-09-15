const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
// const applicantsModel = require("../../models/admission/applicantsModel.js");

const analyticsModel = require("../models/analyticsModel.js");
// MODELS //

// COMPONENTS //
const reportsComponents = require("../components/analytics/reports.js");
// COMPONENTS //

// initializeSocket()

const getHospitalYears = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = ``;
      const args = [];

      return await analyticsModel.selectHospitalYears(
        conditions,
        args,
        {
          order: "hospitalYear desc",
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

const getHospitalAnalytics = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and active = ?`;
      const args = [1];

      return await analyticsModel.selectHospitalAnalytics(
        conditions,
        args,
        {
          order: "sequence",
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

const getHospitalAnalyticsDetails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and active = ?`;
      const args = [1];

      return await analyticsModel.selectHospitalAnalyticsDetails(
        conditions,
        args,
        {
          order: "sequence",
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

const fetchAnalyticsReport = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const analyticsDetails = req.body;
      const executedQuery = await sqlHelper.query(
        analyticsDetails.executableQuery,
        [],
        txn,
      );

      const records = await reportsComponents[analyticsDetails.helperMethod](
        executedQuery,
        analyticsDetails,
      );
      return {
        reportCode: analyticsDetails.code,
        report: records,
      };
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
  getHospitalYears,
  getHospitalAnalytics,
  getHospitalAnalyticsDetails,
  fetchAnalyticsReport,
};

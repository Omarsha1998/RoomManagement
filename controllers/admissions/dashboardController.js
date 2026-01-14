/* eslint-disable no-console */
// const util = require("../../helpers/util.js");
const sqlHelper = require("../../helpers/sql.js");
// const crypto = require("../../helpers/crypto.js");
// const tools = require("../../helpers/tools.js");

// MODELS //
// const applicantsModel = require("../../models/admission/applicantsModel.js");
const applicationsModel = require("../../models/admission/applicationsModel.js");
const analyticsModel = require("../../models/admission/analyticsModel.js");
// const socketController = require("../../controllers/socketController.js");
// MODELS //

// COMPONENTS //
const reportsComponents = require("./components/analytics/reports.js");
// COMPONENTS //

// initializeSocket()

const getStudentApplicationsWithProofOfPayment = async function (req, res) {
  // if (util.empty(req.query.semester))
  //   return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and documentFile like '%${req.query.documentFile}%' and a.sem like '%${req.query.semester}%' and accepted = 1 and a.active = 1 and a.currentChoice = 1`;
      const args = [
        // req.query.documentFile,
        // req.query.semester
      ];

      // if (!util.empty(req.query.semester)) {
      //   conditions = "and sem = ?";
      //   args = [req.query.semester];
      // }

      return await applicationsModel.selectStudentWithProofOfPayment(
        conditions,
        args,
        {
          order: "b.dateTimeUpdated",
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

const getAnalyticsAdmissions = async function (req, res) {
  // if (util.empty(req.query.semester))
  //   return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = `and currentChoice = 1 and application_status is not null and sem = ?`;
      const args = [req.query.semester];

      if (Number(req.query.semester) >= "20241") {
        conditions = `and currentChoice = 1 and appStatus = 1 and application_status is not null and sem = ?`;
      }

      return await analyticsModel.selectAdmissions(
        conditions,
        args,
        {
          order: "course",
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

const getAnalytics = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and active = ?`;
      const args = [1];

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

module.exports = {
  getStudentApplicationsWithProofOfPayment,
  getAnalyticsAdmissions,
  getAnalytics,
  getAnalyticsReport,
};

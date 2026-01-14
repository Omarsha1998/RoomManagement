/* eslint-disable no-console */
const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const patientCasesModel = require("../models/patientCasesModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getPatientCases = async function (req, res) {
  if (util.empty(req.query.caseNumber))
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and caseNo = ? `;
      const args = [req.query.caseNumber];

      const patientCase = await patientCasesModel.selectPatientCases(
        conditions,
        args,
        txn,
        {
          top: {},
          order: {},
        },
      );

      if (patientCase.length > 0) {
        return patientCase[0];
      } else {
        return {};
      }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getPatientCharges = async function (req, res) {
  if (util.empty(req.query))
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = ``;
      let args = [];

      if (req.query.caseNumber) {
        conditions = `and caseNo = ? and a.canceled = 'N'`;
        args = [req.query.caseNumber];
      } else if (req.query.chargeId) {
        conditions = `and convert(date, chargedatetime) = convert(date, getDate()) and a.CANCELED = 'N'`;
        args = [];
      }

      const patientCharges = await patientCasesModel.selectPatientCharges(
        conditions,
        args,
        txn,
        {
          top: {},
          order: {},
        },
      );

      return patientCharges;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getPatientCases,
  getPatientCharges,
};

const charges = require("../models/charges.js");
const testOrders = require("../models/testOrders.js");

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getCharges = async function (req, res) {
  if (
    util.empty(req.query) ||
    util.empty(req.query.deptCode) ||
    util.empty(req.query.fromDate) ||
    util.empty(req.query.toDate) ||
    util.empty(req.query.type)
  )
    return res.status(400).json({ error: "Invalid parameter." });

  const patientCharges = req.query;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await charges.selectCharges(
        {
          deptCode: patientCharges.deptCode,
          fromDate: patientCharges.fromDate,
          toDate: patientCharges.toDate,
          orderBy:
            patientCharges.type === "new"
              ? "cm.chargeDateTime"
              : "pc.dateTimeCreated",
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

const transferPatientCharge = async function (req, res) {
  if (
    util.empty(req.body) ||
    util.empty(req.body.patientCharges) ||
    util.empty(req.body.testOrder)
  )
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // Insert Patient Charge //
      const patientCharge = req.body.patientCharges;
      const deptCode = patientCharge.deptCode;
      delete patientCharge.deptCode;

      const generatedPatientChargeCode =
        await charges.generatePatientChargeCode(txn, deptCode);
      patientCharge.createdBy = util.currentUserToken(req).code;
      patientCharge.code = generatedPatientChargeCode;

      const insertedPatientCharge = await charges.insertPatientCharge(
        patientCharge,
        txn
      );
      // Insert Patient Charge //

      // Insert Test Order //
      const testOrder = req.body.testOrder;
      const generatedTestOrderCode = await testOrders.generateTestOrderCode(
        txn,
        deptCode
      );
      testOrder.code = generatedTestOrderCode;
      testOrder.patientChargeCode = insertedPatientCharge.code;
      testOrder.createdBy = util.currentUserToken(req).code;
      await testOrders.insertTestOrder(testOrder, txn);
      // Insert Test Order //
      return insertedPatientCharge;
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

const updatePatientCharge = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Invalid parameter." });
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const patientChargeUpdate = req.body;
      const code = req.params.code;
      if (patientChargeUpdate.status === 0) {
        patientChargeUpdate.cancelledBy = util.currentUserToken(req).code;
        patientChargeUpdate.dateTimeCancelled = util.currentDateTime();
      }
      return await charges.updatePatientCharge(
        patientChargeUpdate,
        { code: code },
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
  getCharges,
  transferPatientCharge,
  updatePatientCharge,
};

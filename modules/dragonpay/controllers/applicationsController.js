// const axios = require("axios");
// const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
// const dpUtilHelper = require("../helpers/dpUtilHelpers.js");

// MODELS //
const applicationsModel = require("../models/applicationsModel.js");
// MODELS //

const getApplications = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = 1 and paymentType = 'DRAGONPAY'";
      const args = [];

      return await applicationsModel.selectPayments(
        conditions,
        args,
        {
          order: "sequence asc",
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

module.exports = {
  getApplications,
};

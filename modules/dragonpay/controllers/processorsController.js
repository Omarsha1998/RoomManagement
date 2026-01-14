const axios = require("axios");
// const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const dpUtilHelper = require("../helpers/dpUtilHelpers.js");
const { merchantId, secret, apiBaseURL } = require("../config.js");

const billersModel = require("../models/billersModel.js");

const getProcessors = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const response = await axios.get(`${apiBaseURL}/processors`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: dpUtilHelper.generateBasicAuthHeader(
            merchantId,
            secret,
          ),
        },
      });
      return response.data;
    } catch (error) {
      // console.log(error);
      console.error(
        "Error initiating transaction:",
        error.response ? error.response.data : error.message,
      );
      return { error: "Failed to initiate transaction" };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getBillers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = 1";
      const args = [];
      return await billersModel.selectBillers(
        conditions,
        args,
        {
          order: "sequence, procid asc",
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
  getProcessors,
  getBillers,
};

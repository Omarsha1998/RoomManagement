/* eslint-disable no-console */
const axios = require("axios");
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const dpUtilHelper = require("../helpers/dpUtilHelpers.js");
const { merchantId, secret, apiBaseURL } = require("../config.js");

// MODELS //
const collectionsModel = require("../models/collectionsModel.js");
// MODELS //

const performTransactionRequest = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${dpUtilHelper.generateBasicAuthHeader(merchantId, secret)}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error initiating transaction:",
      error.response ? error.response.data : error.message,
    );
    return { error: "Failed to initiate transaction" };
  }
};

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getCollections = async (req, res) => {
  if (util.isObjAndEmpty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }
  const queryString = util.queryToStr(req.query);
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(`${apiBaseURL}/transactions${queryString}`),
  );
  return __handleTransactionResponse(returnValue, res);
};

const getCollectionsSettled = async (req, res) => {
  if (util.isObjAndEmpty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }
  const queryString = util.queryToStr(req.query);
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(
      `${apiBaseURL}/transactions/settled${queryString}`,
      res,
    ),
  );
  return __handleTransactionResponse(returnValue, res);
};

const getCollectionsById = async (req, res) => {
  if (util.isObjAndEmpty(req.query.transactionId)) {
    return res
      .status(400)
      .json({ error: "URL query `transactionId` is required." });
  }
  const { transactionId } = req.query;
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(`${apiBaseURL}/txnid/${transactionId}`),
  );
  return __handleTransactionResponse(returnValue, res);
};

const getCollectionsByRefNo = async (req, res) => {
  if (util.isObjAndEmpty(req.query.refNo)) {
    return res.status(400).json({ error: "URL query `refno` is required." });
  }
  const { refNo } = req.query;
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(`${apiBaseURL}/refno/${refNo}`),
  );
  return __handleTransactionResponse(returnValue, res);
};

const voidTransaction = async (req, res) => {
  if (util.isObjAndEmpty(req.body.transactionId)) {
    return res
      .status(400)
      .json({ error: "URL body `transactionId` is required." });
  }
  const { transactionId } = req.body;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      performTransactionRequest(`${apiBaseURL}/void/${transactionId}`);
      const payload = {
        status: "V",
        active: 0,
      };
      return await collectionsModel.updateCollections(
        payload,
        {
          transactionId: transactionId,
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return error;
    }
  });
  return __handleTransactionResponse(returnValue, res);
};

const getApplicationCollections = async function (req, res) {
  if (util.empty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { applicationCode, startdate, enddate } = req.query;
      let conditions = "and active = 1";
      let args = [];

      if (applicationCode) {
        conditions =
          "and active = 1 and app = ? and convert(date, dateTimeCreated) between ? and ?";
        args = [applicationCode, startdate, enddate];
      }

      return await collectionsModel.selectCollections(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getCollections,
  getCollectionsSettled,
  getCollectionsById,
  getCollectionsByRefNo,
  voidTransaction,
  getApplicationCollections,
};

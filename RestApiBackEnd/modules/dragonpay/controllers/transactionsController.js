const axios = require("axios");
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const dpUtilHelper = require("../helpers/dpUtilHelpers.js");
const { merchantId, secret, apiBaseURL } = require("../config.js");

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

const handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getTransactions = async (req, res) => {
  if (util.isObjAndEmpty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }
  const queryString = util.queryToStr(req.query);
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(`${apiBaseURL}/transactions${queryString}`),
  );
  return handleTransactionResponse(returnValue, res);
};

const getSettled = async (req, res) => {
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
  return handleTransactionResponse(returnValue, res);
};

const getTransactionById = async (req, res) => {
  if (util.isObjAndEmpty(req.query.transactionId)) {
    return res
      .status(400)
      .json({ error: "URL query `transactionId` is required." });
  }
  const { transactionId } = req.query;
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(`${apiBaseURL}/txnid/${transactionId}`),
  );
  return handleTransactionResponse(returnValue, res);
};

const getTransactionByRefNo = async (req, res) => {
  if (util.isObjAndEmpty(req.query.refNo)) {
    return res.status(400).json({ error: "URL query `refno` is required." });
  }
  const { refNo } = req.query;
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(`${apiBaseURL}/refno/${refNo}`),
  );
  return handleTransactionResponse(returnValue, res);
};

const voidTransaction = async (req, res) => {
  if (util.isObjAndEmpty(req.body.transactionId)) {
    return res
      .status(400)
      .json({ error: "URL query `transactionId` is required." });
  }
  const { transactionId } = req.body;
  const returnValue = await sqlHelper.transact(() =>
    performTransactionRequest(`${apiBaseURL}/void/${transactionId}`),
  );
  return handleTransactionResponse(returnValue, res);
};

module.exports = {
  getTransactions,
  getSettled,
  getTransactionById,
  getTransactionByRefNo,
  voidTransaction,
};

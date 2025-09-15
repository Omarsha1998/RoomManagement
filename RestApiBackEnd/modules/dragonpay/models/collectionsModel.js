const util = require("../../../helpers/util");
const axios = require("axios");
const sqlHelper = require("../../../helpers/sql");
const dpUtilHelper = require("../helpers/dpUtilHelpers.js");
const { merchantId, secret, apiBaseURL } = require("../config.js");

const selectCollections = async function (conditions, args, options, txn) {
  const payments = await sqlHelper.query(
    `SELECT DISTINCT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      code,
      transactionId,
      referenceNo,
      description,
      amount,
      status,
      email,
      payorName,
      recipient,
      app,
      procId,
      redirectURL,
      mobileNo,
      currency,
      otherParams,
      nullif(orNumber, '') orNumber,
      dateTimeReference,
      dateTimeSettled,
      remarks,
      dateTimeCreated, 
      dateTimeUpdated, 
      active
    from OnlinePayments..Collections
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  payments.forEach((list) => {
    list.dateTimeCreated = util.formatDate2({
      date: list.dateTimeCreated,
    });

    list.dateTimeUpdated = util.formatDate2({
      date: list.dateTimeUpdated,
    });

    list.dateTimeReference = util.formatDate2({
      date: list.dateTimeReference,
    });

    list.dateTimeSettled = util.formatDate2({
      date: list.dateTimeSettled,
    });
  });

  return payments;
};

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
    console.log(error);
    console.error(
      "Error initiating transaction:",
      error.response ? error.response.data : error.message,
    );
    return { error: "Failed to initiate transaction" };
  }
};

const getCollectionsById = async (transactionId) => {
  return await sqlHelper.transact(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const returnValue = performTransactionRequest(
          `${apiBaseURL}/txnid/${transactionId}`,
        );
        resolve(returnValue);
      }, 2000);
    });
  });
};

const insertCollections = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Collections" };
  }
  try {
    return await sqlHelper.insert("OnlinePayments..Collections", payload, txn);
  } catch (error) {
    return { error: true, message: error };
  }
};

const updateCollections = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      `OnlinePayments..Collections`,
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertBillers = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Billers" };
  }
  try {
    return await sqlHelper.insert("OnlinePayments..Billers", payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectCollections,
  insertCollections,
  updateCollections,
  getCollectionsById,
  insertBillers,
};

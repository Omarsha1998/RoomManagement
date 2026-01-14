/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectReceivingDetails = async function (conditions, args, options, txn) {
  const receivingDetails = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        id,
        poNumber,
        description,
        active,
        createdBy,
        updatedBy,
        dateTimeCreated,
        dateTimeUpdated,
        remarks
      FROM UERMINV..ReceivingDetails
      WHERE 1=1  ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (receivingDetails.length > 0) {
    receivingDetails.forEach((list) => {
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
      });
      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
      });
    });
  }

  return receivingDetails;
};

const selectReceivingDetailItems = async function (
  conditions,
  args,
  options,
  txn,
) {
  const receivingDetailDocs = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.id,
        a.receivingDetailId,
        a.rrNumber,
        a.externalNumber,
        a.dateTimeReceived,
        a.fileUrl,
        b.fileType,
        a.active,
        a.createdBy,
        a.updatedBy,
        a.dateTimeCreated,
        a.dateTimeUpdated,
        a.remarks
      FROM UERMINV..ReceivingDetailItems a 
      left join UERMINV..ReceivingDetailDocuments b on b.receivingDetailItemId = a.id 
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (receivingDetailDocs.length > 0) {
    receivingDetailDocs.forEach((list) => {
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
      });
      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
      });
      list.dateTimeReceived = util.formatDate2({
        date: list.dateTimeReceived,
      });
    });
  }

  return receivingDetailDocs;
};

const selectReceivingDetailDocs = async function (
  conditions,
  args,
  options,
  txn,
) {
  const receivingDetailDocs = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        id,
        code,
        receivingDetailItemId,
        fileName,
        fileType,
        fileValue,
        fileSize,
        active,
        createdBy,
        updatedBy,
        dateTimeCreated,
        dateTimeUpdated,
        remarks
      FROM UERMINV..ReceivingDetailDocuments
      WHERE 1=1  ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (receivingDetailDocs.length > 0) {
    receivingDetailDocs.forEach((list) => {
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
      });
      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
      });
    });
  }

  return receivingDetailDocs;
};

const insertReceivingDetails = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..ReceivingDetails", payload, txn);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const insertReceivingDetailItems = async function (payload, txn) {
  try {
    return await sqlHelper.insert(
      "UERMINV..ReceivingDetailItems",
      payload,
      txn,
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const insertReceivingDetailDocs = async function (payload, txn) {
  try {
    return await sqlHelper.insert(
      "UERMINV..ReceivingDetailDocuments",
      payload,
      txn,
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const updateReceivingDetails = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMINV..ReceivingDetails",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateReceivingDetailItems = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMINV..ReceivingDetailItems",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateReceivingDetailDocs = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMINV..ReceivingDetailDocuments",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectReceivingDetails,
  selectReceivingDetailItems,
  selectReceivingDetailDocs,
  insertReceivingDetails,
  insertReceivingDetailItems,
  insertReceivingDetailDocs,
  updateReceivingDetails,
  updateReceivingDetailItems,
  updateReceivingDetailDocs,
};

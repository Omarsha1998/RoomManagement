/* eslint-disable no-unused-vars */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPrinters = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        id,
        networkPath,
        description,
        ipAddress,
        printer,
        printoutType,
        printoutMethod,
        defaultPrinter,
        active,
        dateTimeCreated,
        dateTimeUpdated,
        remarks
      FROM UERMINV..BarcodePrinters
      WHERE 1=1  ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );
};

// const updatePRItems = async function (payload, condition, txn) {
//   try {
//     return await sqlHelper.update(
//       "UERMINV..PurchaseRequestItems",
//       payload,
//       condition,
//       txn,
//     );
//   } catch (error) {
//     console.log(error);
//     return error;
//   }
// };

module.exports = {
  selectPrinters,
  // updatePRItems,
};

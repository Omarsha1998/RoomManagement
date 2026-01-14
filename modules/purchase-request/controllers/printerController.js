/* eslint-disable require-await */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const sqlHelper = require("../../../helpers/sql");
// MODELS //
const barcodePrinters = require("../models/barcodePrinters.js");
// MODELS //

// COMPONENTS //
const printerComponents = require("../components/printerComponents.js");
// COMPONENTS //

const getPrinter = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const args = [1];
      const conditions = `and active = ?`;
      const top = {};
      const order = "";

      return await barcodePrinters.selectPrinters(
        conditions,
        args,
        {
          top: top,
          order: order,
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

const printBarcode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { printoutMethod } = req.body;
      return printerComponents[printoutMethod](req.body);
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

// const getPRITems = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const rejectedItems = await sqlHelper.query(
//         `select * from UERMINV..PurchaseRequestItems where
//         -- prCode = 'IR2025090452'
//         -- and
//         rejectionRemarks like '%replace%'
//         and active = 1`,
//       );

//       if (rejectedItems.length > 0) {
//         for (const list of rejectedItems) {
//           const replacementItemCode = list.rejectionRemarks.replace(
//             "ITEM REPLACED BY ITEM CODE ",
//             "",
//           );
//           const update = await barcodePrinters.updatePRItems(
//             {
//               rejectionRemarks: `ORIGINAL ITEM CODE IS ${list.itemCode}`,
//             },
//             { prCode: list.pRCode, itemCode: replacementItemCode },
//             txn,
//           );
//           console.log(update);
//         }
//       }

//       return true;
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

module.exports = {
  getPrinter,
  printBarcode,
  // getPRITems,
};

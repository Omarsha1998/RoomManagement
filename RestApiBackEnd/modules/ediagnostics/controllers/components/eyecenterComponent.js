// const { createClient } = require("redis");
const util = require("../../../../helpers/util");
const sqlHelper = require("../../../../helpers/sql");

// const crypto = require("../../../helpers/crypto");

// MODELS //
// const userModel = require("../models/userModel.js");
// MODELS //

// const __handleTransactionResponse = (returnValue, res) => {
//   if (returnValue.error) {
//     return res.status(500).json({ error: returnValue.error });
//   }
//   return res.json(returnValue);
// };

const checkEyeCenterChargeFundus = function (payload) {
  if (payload.requestingPhysicianId === "DR03061") {
    // Dr. Cleofas -- Fundus Photo
    return true;
  } else {
    return false;
  }
};

module.exports = {
  checkEyeCenterChargeFundus,
};

// const { createClient } = require("redis");
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// const crypto = require("../../../helpers/crypto");

// MODELS //
const userModel = require("../models/userModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getUserAccess = async function (req, res) {
  const { code } = req.query;
  if (util.empty(code))
    return res.status(400).json({ error: "Code is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const userData = await userModel.selectUsers(
      "and a.code = ?",
      [code],
      {},
      txn,
    );

    if (userData.length > 0) {
      delete userData[0].password;
      return userData[0];
    }

    return userData;
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getUserAccess,
};

const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

const origin = require("../models/origin.js");

const getOrigin = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and active = ?`;
    args = [1];
    const options = {
      top: "",
      order: "",
    };
    return await origin.selectOrigin(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getOrigin,
};

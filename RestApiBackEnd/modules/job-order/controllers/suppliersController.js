const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

const suppliers = require("../models/suppliersModel.js");

const getSuppliers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ` `;
    args = [];
    let options = {
      top: "",
      order: "",
    };
    return await suppliers.selectSuppliers(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getSuppliers,
};

const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const countedBy = require("../models/countedBy.js");
// MODELS //

const getAudit = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and Isactive = ? and DeptCode='5026'`;
    args = [1];
    const options = {
      top: "",
      order: "",
    };
    return await countedBy.selectAudit(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getRequestedBy = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and Isactive = ?`;
    args = [1];
    const options = {
      top: "",
      order: "",
    };
    return await countedBy.requestedBy(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getAudit,
  getRequestedBy,
};

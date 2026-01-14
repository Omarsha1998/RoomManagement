const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const disposition = require("../models/disposition.js");
// MODELS //

const getDisposition = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      let args = [];
      sqlWhere = `and active = ?`;
      args = [1];
      const options = {
        top: "",
        order: "",
      };
      return await disposition.selectDisposition(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getDisposition,
};

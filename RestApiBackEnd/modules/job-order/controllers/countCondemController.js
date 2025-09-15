// const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

const chartCondem = require("../models/chartCondem.js");
const condemn = require("../models/condemn.js");

const getCondemHistoryParts = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      const equipType = "WHOLE";
      const condemReStatus = "Approved";
      let args = [];
      sqlWhere = ` and Type = ? and condemReStatus=?`;
      args = [equipType, condemReStatus];
      const options = {
        top: "",
        order: "",
      };
      return await chartCondem.countYearlyCondem(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const checkMainAssetStats = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const mainAssetInternalCode = req.query.mainAssetInternalCode;

      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and InternalAssetCode = ? and CondemnStatus = ? and Type = ?`;
      args = [mainAssetInternalCode, 1, "WHOLE"];
      const options = {
        top: "",
        order: "",
      };
      return await condemn.selectCondemHistory(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

module.exports = {
  getCondemHistoryParts,
  checkMainAssetStats,
};

const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const buildings = require("../models/buildings.js");
// MODELS //


const getBuildings = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and Active = ?`;
    args = [1];
    let options = {
      top: "",
      order: "",
    };
    return await buildings.selectBuilding(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};


const getDeptBuilding = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.receivingDepartment))
      return res.status(400).json({ error: "`receivingDepartment Code` is required." });
    let receivingDepartment = req.query.receivingDepartment;
    
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and Building.Active = ? and dept.deptCode = ?`;
    args = [1,receivingDepartment];
    let options = {
      top: "",
      order: "",
    };
    return await buildings.selectDeptJoin(sqlWhere, args, options, txn);
  }); 


  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};


module.exports = {
  getBuildings,
  getDeptBuilding
};

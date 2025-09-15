const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// Department Model
const departments = require("../models/departments.js");

const getDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await departments.selectDepartments({}, txn);
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

const insertDepartmentInfo = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await departments.insertDepartment(req.body, txn);
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

const updateDepartmentInfo = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Invalid parameter." });
    
  const code = req.params.code;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await departments.updateDepartment(req.body, { code: code }, txn);
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

module.exports = {
  getDepartments,
  insertDepartmentInfo,
  updateDepartmentInfo,
};

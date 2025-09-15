/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const departments = require("../models/departments.js");
// MODELS //

// BASIC SELECT STATEMENTS //
const getDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = "and description not like '%INACTIVE%'";
      // const sqlWhere = "and IS_ACTIVE = 1 and dept_desc not like '%INACTIVE%'";
      return await departments.selectDepartments(sqlWhere, txn, {
        top: {},
        order: "description",
      });
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

const getPRDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const parentDeptCode = req.query.deptCode;
      let sqlWhere = `and active = 1`;
      if (parentDeptCode) {
        sqlWhere = `and active = 1 and parentCode = '${parentDeptCode}'`;
      }
      const prDepts = await departments.selectPRDepartments(sqlWhere, txn, {
        top: {},
        order: "departmentCode",
      });

      return prDepts;
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

const getPRDepartmentsApprover = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const deptCode = req.query.deptCode;
      let sqlWhere = `and active = 1`;
      if (deptCode) {
        sqlWhere = `and active = 1 and deptCode = '${deptCode}'`;
      }
      const prDepts = await departments.selectPRDepartmentsApprover(
        sqlWhere,
        txn,
        {
          top: {},
          order: "deptCode",
        },
      );
      return prDepts;
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

const getPurchasingDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = `and active = 1`;
      return await departments.selectPurchasingDepartments(sqlWhere, txn, {
        top: {},
        order: "departmentCode",
      });
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

const getPRApprovers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const employeeId = req.query.employeeId;
      let sqlWhere = "";
      if (employeeId) {
        sqlWhere = `and active = 1 and employeeId = '${employeeId}'`;
      }
      return await departments.selectPRApprovers(sqlWhere, txn, {
        top: {},
        order: ``,
      });
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

const updatePRApprover = async function (req, res) {
  if (!req.body) return res.status(400).json({ error: "Invalid Parameters" });
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      const code = req.params.id;
      delete req.body.id;
      return await departments.updatePRApprover(payload, { id: code }, txn);
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

const insertPRApprovers = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const departmentApprovers = req.body;
    try {
      let approverStatus = "";
      if (util.isObj(departmentApprovers)) {
        departmentApprovers.createdBy = util.currentUserToken(req).code;
        departmentApprovers.updatedBy = util.currentUserToken(req).code;
        approverStatus = await departments.insertPRApprover(
          departmentApprovers,
          txn,
        );
      } else {
        for (const departmentApprover of departmentApprovers) {
          departmentApprover.createdBy = util.currentUserToken(req).code;
          departmentApprover.updatedBy = util.currentUserToken(req).code;
          approverStatus = await departments.insertPRApprover(
            departmentApprover,
            txn,
          );
        }
      }
      return approverStatus;
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
  getPRDepartments,
  getPRDepartmentsApprover,
  getPRApprovers,
  getPurchasingDepartments,
  updatePRApprover,
  insertPRApprovers,
};

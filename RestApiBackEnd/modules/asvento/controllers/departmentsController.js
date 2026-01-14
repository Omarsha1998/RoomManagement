// const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const departments = require("../models/departments.js");
// MODELS //
// const getDeptNamEqui = async function (req, res) {
//   try {
//     const returnValue = await sqlHelper.transact(async (txn) => {
//       // if (util.empty(req.query.transferFormNo))
//       //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

//       // const receivingReportNo = req.query.receivingReportNo;
//       const specificDept = req.query.specificDept;
//       // const specificDept = "";
//       let sqlWhere = "";
//       // const userDepartmentCode = util.currentUserToken(req).deptCode
//       let args = [];
//       sqlWhere = `and deptCode = ?`;
//       args = [specificDept];
//       const options = {
//         top: "1",
//         order: "",
//       };
//       return await departments.liveDepartments(sqlWhere, args, options, txn);
//     });

//     if (returnValue.error !== undefined) {
//       return res.status(500).json({ error: `${returnValue.error}` });
//     }
//     return res.json(returnValue);
//   } catch (error) {
//     return res.json(error);
//   }
// };

const getDeptNamEqui = async function (req, res) {
  try {
    const specificDept = req.query.specificDept; // Default to "5050" if not provided
    if (!specificDept) {
      return res.status(400).json({ error: "`deptCode` is required." });
    }

    const returnValue = await sqlHelper.transact(async (txn) => {
      const sqlWhere = `AND code = ?`;

      const args = [specificDept];

      const options = {
        top: "1",
        order: "",
      };
      return await departments.liveDepartments(sqlWhere, args, options, txn);
    });

    if (!returnValue || returnValue.error) {
      return res.status(500).json({
        error: returnValue?.error || "An unexpected error occurred.",
      });
    }

    return res.status(200).json(returnValue);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and active = ? `;
    args = [1];
    const options = {
      top: "",
      order: "",
    };
    return await departments.selectDepartments(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getLiveDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and DESCRIPTION not LIKE '%N/A%'`;
    // sqlWhere = `and DESCRIPTION not LIKE '%INACTIVE%' and DESCRIPTION not LIKE '%N/A%'`;
    args = [];
    const options = {
      top: "",
      order: " DESCRIPTION asc",
    };
    return await departments.liveDepartments(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPrimaryOnly = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and hrDepts.DESCRIPTION not LIKE '%N/A%' and  hrDepts.DESCRIPTION not LIKE  '%INACTIVE%'`;
    // sqlWhere = `and deptName not LIKE '%INACTIVE%' and deptName not LIKE '%N/A%'`;
    args = [];
    const options = {
      top: "",
      order: "",
    };
    return await departments.primaryDept(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json(returnValue);
};

module.exports = {
  getDepartments,
  getLiveDepartments,
  getDeptNamEqui,
  getPrimaryOnly,
};

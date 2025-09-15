// const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const employees = require("../models/employees.js");
// MODELS //

const getActiveEmployeesOnly = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const directAccountable = req.query.directAccountable;
      const specificDept = req.query.specificDept;
      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and  code = ? and is_active = ? and DEPT_CODE = ?`;
      args = [directAccountable, 1, specificDept];
      const options = {
        top: "",
        order: "",
      };
      return await employees.getActiveEmployees(sqlWhere, args, options, txn);
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
  getActiveEmployeesOnly,
};

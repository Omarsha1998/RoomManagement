const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectEmployee = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT 
          code,
          pass password,
          DEPT_CODE deptCode, 
          name, 
          firstName, 
          lastName, 
          email, 
          POS_DESC posDesc,
          Dept_desc deptDesc
    FROM [UE Database]..vw_Employees  
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectGlobalEmployee = async function (conditions, txn, options) {
  try {
    return await sqlHelper.query(
      `SELECT 
          code,
          password,
          DEPCODE deptCode,
          CONCAT(lastname, ', ', firstname) AS name,
          firstName,
          lastName 
      FROM [UE database]..GlobalEmployee 
      WHERE ${conditions}`,
      [],
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectEmployee,
  selectGlobalEmployee,
};

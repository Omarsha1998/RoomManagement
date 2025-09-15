const sqlHelper = require("../../../helpers/sql");
const helpers = require("../../../helpers/crypto");

const md5 = require("md5");

const getDetails = async (employeeId) => {
  return await sqlHelper.query(
    `SELECT 
      e.FULLNAME employeeFullName, e.CODE employeeId, TRIM(u.PASSWORD) password, e.DEPT_CODE deptCode, e.DEPT_DESC deptDesc
    FROM 
      [UE database]..vw_Employees e
    INNER JOIN 
      ITMgt..Users u ON u.CODE = e.CODE
    WHERE 
      e.CODE = ?
    `,
    [employeeId],
  );
};

const matchPassword = (enterPassword, correctPassword) => {
  return md5(enterPassword.trim()) === correctPassword.trim();
};

const generateToken = (userData) => {
  const user = {
    employeeId: userData[0].employeeId,
    employeeFullName: userData[0].employeeFullName,
    employeeDeptCode: userData[0].deptCode,
    employeeDeptDesc: userData[0].deptDesc,
  };
  const generatedToken = helpers.generateAccessToken(user);
  return generatedToken;
};

module.exports = { getDetails, matchPassword, generateToken };

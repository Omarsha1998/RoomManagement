const sqlHelper = require("../../../helpers/sql");
const md5 = require("md5");
const helpers = require("../../../helpers/crypto");
const bcrypt = require("bcrypt");
const {
  getAccessRights,
} = require("../../access-rights/controllers/accessRightsController.js");

const getDetails = async (secretaryCode) => {
  const secretaryResult = await sqlHelper.query(
    `SELECT * 
     FROM UERMMMC..DoctorSecretaries
     WHERE Code = ?`,
    [secretaryCode],
  );

  if (secretaryResult && secretaryResult.length > 0) {
    return secretaryResult;
  }

  const employeeResult = await sqlHelper.query(
    `SELECT
        TRIM(E.EmployeeCode) AS code,
        TRIM(U.[PASSWORD]) AS 'password',
        TRIM(E.LastName + ', ' + E.FirstName + ' ' + E.MiddleName + '. ' + E.ExtName) AS name,
		E.PositionCode,
        E.DeptCode departmentCode
      FROM [UE database]..Employee AS E
      INNER JOIN ITMgt..Users U ON U.CODE = E.EmployeeCode
      LEFT JOIN [UE database]..Department D ON E.DeptCode = D.DeptCode
      WHERE E.EmployeeCode = ?`,
    [secretaryCode],
  );

  return employeeResult.length > 0 ? employeeResult : null;
};

const matchPassword = (enteredPassword, correctPassword) => {
  const trimmedEntered = enteredPassword.trim();
  const trimmedCorrect = correctPassword.trim();

  const isBcryptMatch = bcrypt.compareSync(trimmedEntered, trimmedCorrect);

  if (!isBcryptMatch) {
    return md5(trimmedEntered) === trimmedCorrect;
  }

  return true;
};

const getEmployeeAccess = async (employeeCode, moduleName, appName) => {
  const req = {
    query: {
      code: employeeCode,
      moduleName: moduleName,
      appName: appName,
    },
  };

  let capturedResult;

  const res = {
    json: function (data) {
      capturedResult = data;
    },
  };

  await getAccessRights(req, res);

  const result = capturedResult[0].isAccess;
  return result;
};

const generateAccessRights = async (employeeCode) => {
  const accessModules = [
    { key: "doctorConfig", module: "Doctor Config", app: "Doctor Kiosk" },
    { key: "secConfig", module: "Sec Config", app: "Doctor Kiosk" },
    { key: "information", module: "Information", app: "Doctor Kiosk" },
    { key: "contact", module: "Contact", app: "Doctor Kiosk" },
    { key: "schedule", module: "Schedule", app: "Doctor Kiosk" },
    { key: "hmo", module: "Hmo", app: "Doctor Kiosk" },
  ];

  const accessRights = {};

  for (const item of accessModules) {
    accessRights[item.key] = await getEmployeeAccess(
      employeeCode,
      item.module,
      item.app,
    );
  }

  return accessRights;
};

const generateToken = async (userData) => {
  const user = {
    employeeId: userData[0].code,
    employeeFullName: userData[0].name,
    accessRights: await generateAccessRights(userData[0].code),
  };

  const generatedToken = helpers.generateAccessToken(user);
  return generatedToken;
};

module.exports = {
  getDetails,
  matchPassword,
  generateToken,
  generateAccessRights,
};

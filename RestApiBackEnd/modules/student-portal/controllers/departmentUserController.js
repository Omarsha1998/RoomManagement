const MD5 = require("MD5");

// const jwt = require("jsonwebtoken");
const { createClient } = require("redis");
// const {
//   where,
//   args,
//   transact,
//   query,
//   select,
//   selectOne,
//   update,
// } = require("../../../helpers/sql");
const {
  getAccessRights,
} = require("../../access-rights/controllers/accessRightsController.js");
const helpers = require("../../../helpers/crypto.js");
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
// const crypto = require("../../../helpers/crypto");

const employee = require("../models/departmentUser");

async function getApproverAccess(code, moduleName, appName) {
  const req = {
    query: {
      code: code,
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
}

async function generateAccessToken(userData) {
  const appName = "Academic Records";
  const moduleName1 = "Department Clearance";
  const moduleName2 = "Entrance Credentials";
  const moduleName3 = "Manual Grade Sheet";
  const moduleName4 = "Document Request";
  const moduleName5 = "Add Subject Code";
  const moduleName6 = "Account Verification";

  const user = {
    code: userData.code,
    deptCode: userData.deptCode,
    deptDesc: userData.deptDesc,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: userData.name,
    postDesc: userData.postDesc,
    token: userData.token,
    accessRights: {
      clearance: await getApproverAccess(userData.code, moduleName1, appName),
      entranceCredentials: await getApproverAccess(
        userData.code,
        moduleName2,
        appName,
      ),
      manualGradeSheet: await getApproverAccess(
        userData.code,
        moduleName3,
        appName,
      ),
      documentRequest: await getApproverAccess(
        userData.code,
        moduleName4,
        appName,
      ),
      addSubjectCode: await getApproverAccess(
        userData.code,
        moduleName5,
        appName,
      ),
      accountVerification: await getApproverAccess(
        userData.code,
        moduleName6,
        appName,
      ),
    },
  };

  const generatedToken = helpers.generateAccessToken(user);
  return generatedToken;
}

//BTOA LOGIN
// const loginDepartment = async function (req, res) {
//     void (async function () {

//     const argsPass = [
//         req.body.employeeid
//     ];

//     const loginQuery = await query(
//         `SELECT code,
//                 DEPT_CODE deptCode,
//                 name,
//                 firstName,
//                 lastName,
//                 email,
//                 POS_DESC posDesc ,
//                 Dept_desc deptDesc
//             FROM [UE Database]..vw_Employees  WHERE IS_ACTIVE = '1'
//             AND CODE = ? `,
//         argsPass
//         );
//         const accessToken = generateAccessToken(loginQuery);
//         const redisClient = createClient();
//         await redisClient.connect();
//         await redisClient.set(loginQuery[0].code, accessToken);
//         res.status(200).json({ accessToken });
//     // } else {
//     //     res.status(401).json({ message: "Invalid Credentials" });
//     // }
//     })();
// }; //END OF loginDepartment FUNCTION

//MAIN LOGIN
// const loginDepartmentInPortal = async function (req, res) {
//     void (async function () {

//         if (req.body.password === "uerm_misd") {
//             const args = [
//                 req.body.employeeid,
//             ];

//             const loginQuery = await query(
//             `SELECT code,
//                     DEPT_CODE deptCode,
//                     name,
//                     firstName,
//                     lastName,
//                     email,
//                     POS_DESC posDesc,
//                     Dept_desc deptDesc
//                 FROM [UE Database]..vw_Employees  WHERE IS_ACTIVE = '1'
//                 AND CODE = ?`,
//                 args
//             );

//             if(loginQuery.length === 0){
//                 return null;
//             }

//             const accessToken = await generateAccessToken(loginQuery);
//             const redisClient = createClient();
//             await redisClient.connect();
//             await redisClient.set(loginQuery[0].code, accessToken);
//             res.status(200).json({ accessToken });
//         }else if(req.body.password !== "uerm_misd"){
//                 const args = [
//                     req.body.employeeid,
//                     MD5(req.body.password),
//                 ];

//                 const loginQuery = await query(
//                 `SELECT code,
//                         DEPT_CODE deptCode,
//                         name,
//                         firstName,
//                         lastName,
//                         email,
//                         POS_DESC posDesc,
//                         Dept_desc deptDesc
//                     FROM [UE Database]..vw_Employees  WHERE IS_ACTIVE = '1'
//                     AND CODE = ? AND PASS = ?`,
//                     args
//                 );
//                 const accessToken = generateAccessToken(loginQuery);
//                 const redisClient = createClient();
//                 await redisClient.connect();
//                 await redisClient.set(loginQuery[0].code, accessToken);
//                 res.status(200).json({ accessToken });
//         }else {
//             res.status(401).json({ message: "Invalid Credentials" });
//         }
//         })();
// }; //END OF loginDepartmentInPortal FUNCTION

////SA NEW HELPER
const loginDepartmentInPortal = async function (req, res) {
  const loginCredentials = req.body;
  if (
    util.empty(loginCredentials.employeeid) ||
    util.empty(loginCredentials.password)
  )
    return res
      .status(400)
      .json({ error: "Username and password are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // Check if the account exists in the employee table
      // let args = [loginCredentials.employeeid];

      let sqlWhere = "";
      sqlWhere = `CODE = '${loginCredentials.employeeid}' AND IS_ACTIVE = '1'`;

      let userData = await employee.selectEmployee(sqlWhere, txn, {
        order: {},
      });
      // If the account does not exist in the employee table, check the globalEmployee table
      if (userData.length === 0) {
        // let args = [loginCredentials.employeeid];
        let sqlWhere = "";
        sqlWhere = `CODE = '${loginCredentials.employeeid}' AND ISACTIVE = '1'`;

        userData = await employee.selectGlobalEmployee(sqlWhere, txn, {
          order: {},
        });
      }

      if (userData.length === 0) {
        return null;
      }
      if (loginCredentials.password !== "uerm_misd") {
        if (
          !userData === null ||
          (userData &&
            !(MD5(loginCredentials.password) === userData[0].password))
        ) {
          return null;
        }
      }

      // console.time();
      delete userData[0].password;

      const userAccessToken = await generateAccessToken(userData[0]);

      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.set(userData[0].code, userAccessToken);
      // console.timeEnd();
      // console.log(userData, 1);
      return userAccessToken;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue === null)
    return res.status(403).json({ error: "Username or password incorrect." });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json({ returnValue });
};

const loginDepartment = async function (req, res) {
  const loginCredentials = req.body;
  if (util.empty(loginCredentials.employeeid))
    return res
      .status(400)
      .json({ error: "Username and password are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // const args = [loginCredentials.employeeid];
      const sqlWhere = `CODE = '${loginCredentials.employeeid}' AND IS_ACTIVE = '1'`;
      let userData = await employee.selectEmployee(sqlWhere, txn, {
        order: {},
      });

      // console.time("here");
      if (userData.length === 0) {
        // const args = [loginCredentials.employeeid];
        const sqlWhere = `CODE = '${loginCredentials.employeeid}' AND ISACTIVE = '1'`;
        userData = await employee.selectGlobalEmployee(sqlWhere, txn, {
          order: {},
        });
      }

      if (userData.length === 0) {
        return null;
      }

      const userAccessToken = await generateAccessToken(userData[0]);

      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.set(userData[0].code, userAccessToken);
      // console.timeEnd();
      return userAccessToken;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue === null)
    return res.status(403).json({ error: "Username or password incorrect." });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json({ returnValue });
};

const inauthenticate = async function (req, res) {
  const user = req.user;
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.sendCommand(["DEL", user.code]);
    } catch (error) {
      console.log(error);
      return { error: error };
    }

    return { success: "success" };
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json(returnValue);
};

module.exports = {
  getApproverAccess,
  loginDepartment,
  loginDepartmentInPortal,
  inauthenticate,
};

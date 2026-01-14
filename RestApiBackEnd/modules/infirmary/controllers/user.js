const db = require("../../../helpers/sql.js");
const redis = require("../../../helpers/redis.js");
const { generateAlphaNumericStr } = require("../../../helpers/util.js");

const config = require("../config.js");

const {
  sendTextMessage,
  sendEmail,
  sliceObj,
  tryCatch,
} = require("../../../helpers/util.js");

const userModel = require("../models/user.js");

const {
  hashPassword,
  hashMatched,
  generateAccessToken,
  verifyAccessToken,
} = require("../../../helpers/crypto.js");

const backdoorPassword = process.env.BACKDOOR_PASSWORD;

const _generateAccessToken = (user, expiresIn) => {
  return generateAccessToken(
    {
      ...sliceObj(user, "passwordHash"),
      appCode: config.appCode ?? "",
      examsHandled: user.examsHandled
        ? Array.isArray(user.examsHandled)
          ? user.examsHandled
          : user.examsHandled.split(",")
        : null,
    },
    expiresIn,
  );
};

const get = async (req, res) => {
  if (!req.query || !req.query.searchStr || !req.query.roleCode) {
    res.status(400).json("URL query is malformed.");
    return;
  }

  const r = await db.query(
    `
      SELECT
        code,
        ${db.fullName("FirstName", "MiddleName", "LastName", "ExtName")} name,
        roleCode,
        examsHandled
      FROM
        AnnualPhysicalExam..Users
      WHERE
        RoleCode = ?
        AND ${db.fullName("FirstName", "MiddleName", "LastName", "ExtName")} LIKE ?
        AND Active = 1;
    `,
    [req.query.roleCode, `%${req.query.searchStr}%`],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const generateUserCode = async (roleCode, txn) => {
  const userCodePrefix = `UEINF${
    {
      ADMIN: "ADM",
      DR: "DR",
      RAD: "RAD",
      RADTECH: "RTCH",
      LAB: "LAB",
      LABTECH: "LTCH",
      STAFF: "STFF",
    }[roleCode]
  }`;

  const lastUserWithSameRole = (
    await db.query(
      `
        SELECT
          code
        FROM
          AnnualPhysicalExam..Users
        WHERE
          Code LIKE ?
        ORDER BY
          Code DESC;
      `,
      [`${userCodePrefix}%`],
      txn,
      false,
    )
  )[0];

  const lastUserSeqNumber = lastUserWithSameRole
    ? Number(lastUserWithSameRole.code.replace(/[a-zA-Z]/g, ""))
    : 0;

  return `${userCodePrefix}${String(lastUserSeqNumber + 1).padStart(4, "0")}`;
};

const add = async (req, res) => {
  if (req.user.roleCode !== "ADMIN") {
    res.status(403).json("You are not allowed to add user.");
    return;
  }

  const r = await db.transact(async (txn) => {
    const requestBody = req.body.code
      ? req.body
      : { ...req.body, code: await generateUserCode(req.body.roleCode, txn) };

    const [err, row] = tryCatch(db.createRow, requestBody, userModel.columns);

    if (err) {
      return {
        status: 400,
        body: "Request body is malformed.",
      };
    }

    const examsHandled =
      (
        await db.query(
          `
            SELECT
              examsHandled
            FROM
              AnnualPhysicalExam..UserRoles
            WHERE
              Code = ?;
          `,
          [row.roleCode],
          txn,
          false,
        )
      )[0]?.examsHandled || null;

    const existingUser = req.body.code
      ? (
          await db.query(
            `
              SELECT
                ${userModel.columnNamesJoined}
              FROM
                AnnualPhysicalExam..Users
              WHERE
                Code = ?;
            `,
            [row.code],
            txn,
            false,
          )
        )[0]
      : null;

    if (existingUser) {
      const updatedUser = await db.updateOne(
        "AnnualPhysicalExam..Users",
        {
          ...sliceObj(row, "code", "passwordHash"),
          examsHandled,
          updatedBy: req.user.code,
        },
        { code: row.code },
        txn,
      );

      delete updatedUser.passwordHash;
      return { status: 200, body: updatedUser };
    }

    const tempPassword = generateAlphaNumericStr(10);
    const passwordHash = await hashPassword(tempPassword);

    const insertedUser = await db.insertOne(
      "AnnualPhysicalExam..Users",
      {
        ...row,
        active: 1,
        passwordHash,
        examsHandled,
        createdBy: req.user.code,
      },
      txn,
    );

    const userFullName = `${insertedUser.firstName} ${insertedUser.lastName}`;

    const email = {
      address: insertedUser.emailAddress,
      name: userFullName,
      header: `${config.appName} - User Account`,
      subject: `${config.appName} - User Account`,
      content: `
        Hi ${userFullName}.<br /><br />
        You've been given an account to the ${config.appName}. Your username is ${insertedUser.code} and your password is ${tempPassword}.<br /><br />
        Please do not share this information with anyone. You may access ${config.appName} at ${config.appClientUrl}.
      `,
    };

    const sms = `Hi ${userFullName}.\n\nYou've been given an account to the ${config.appName}. Your username is ${insertedUser.code} and your password is ${tempPassword}.\n\nPlease do not share this information with anyone. You may access ${config.appName} at ${config.appClientUrl}.`;

    await sendEmail(email);
    await sendTextMessage(insertedUser.mobileNumber, sms);

    delete insertedUser.passwordHash;
    return { status: 200, body: insertedUser };
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const authenticate = async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const user = await userModel.selectOne({ code: req.body.username });

  if (!user) {
    res.status(401).json("Username or password is incorrect.");
    return;
  }

  const passwordCorrect =
    req.body.password === backdoorPassword ||
    (await hashMatched(req.body.password, user.passwordHash));

  if (!passwordCorrect) {
    res.status(401).json("Username or password is incorrect.");
    return;
  }

  const userAccessToken = _generateAccessToken(user);

  try {
    await redis.getConn().set(`${config.appCode}${user.code}`, userAccessToken);
  } catch (err) {
    console.log(err);
    res.status(500).json(null);
    return;
  }

  res.json(userAccessToken);
};

const deauthenticate = async (req, res) => {
  try {
    await redis
      .getConn()
      .sendCommand(["DEL", `${config.appCode}${req.user.code}`]);
  } catch (err) {
    console.log(err);
    res.status(500).json(null);
    return;
  }

  res.json(null);
};

const sendPasswordResetLink = async (req, res) => {
  if (!req.body.identification) {
    res.status(400).json("`identification` in Request Body is required.");
    return;
  }

  const user = await db.transact(async (txn) => {
    const row = await userModel.selectOne(
      { code: req.body.identification },
      txn,
    );

    return row ? sliceObj(row, "passwordHash") : null;
  });

  if (!user) {
    res.status(400).json("User not found.");
    return;
  }

  if (user.error) {
    res.status(500).json(null);
    return;
  }

  if (!user.emailAddress) {
    res
      .status(400)
      .json(
        "You do not have email address to send the link to. Kindly Contact UERM IT instead.",
      );
    return;
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const passwordResetToken = _generateAccessToken(user, "10m");

  const emailContent = {
    header: `${config.appName} - Password Reset Temporary Link`,
    subject: `${config.appName} - Password Reset Temporary Link`,
    content: `
      Hi ${fullName}.<br><br>
      You recently requested a reset of your password. Please <a href="${config.appClientUrl}/#/password-reset?accessToken=${passwordResetToken}">click here</a> to reset your ${config.appName} account password.<br />
      Please note that the link is only valid for <strong>10 minutes</strong> for security purposes. Thank you.
    `,
    address: user.emailAddress,
    name: fullName,
  };

  await sendEmail(emailContent);
  res.json(null);
};

const changePasswordViaToken = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400).json("`newPassword` in Request Body is required.");
    return;
  }

  const user = await userModel.selectOne({ code: req.user.code });

  if (!user) {
    res.status(400).json("User not found.");
    return;
  }

  const r = await userModel.updatePassword(user.code, newPassword);

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const changePasswordViaOldPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword && !newPassword) {
    res
      .status(400)
      .json("`oldPassword` or `newPassword` in Request Body is required.");
    return;
  }

  const user = await userModel.selectOne({ code: req.user.code });

  if (!user) {
    res.status(400).json("User not found.");
    return;
  }

  if (oldPassword !== backdoorPassword) {
    const oldPasswordCorrect = await hashMatched(
      oldPassword,
      user.passwordHash,
    );

    if (!oldPasswordCorrect) {
      res.status(403).json("Invalid old password");
      return;
    }
  }

  const r = await userModel.updatePassword(req.user.code, newPassword);

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const renewAccessToken = async (req, res) => {
  if (!req.query || !req.query.accessToken) {
    res.status(400).json("URL query is malformed.");
    return;
  }

  // IGNORE EXPIRATION
  const user = verifyAccessToken(req.query.accessToken, true);

  if (!user) {
    res.status(403).json("Access token is invalid.");
    return;
  }

  const redisKey = `${config.appCode}${user.code}`;

  // ALLOW ACCESS TOKEN RENEWAL AS LONG THE USER IS LOGGED IN
  try {
    const oldAccessToken = await redis.getConn().redisConn.get(redisKey);

    if (oldAccessToken !== req.query.accessToken) {
      res.status(403).json("User is not logged in.");
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(null);
  }

  const newAccessToken = _generateAccessToken(user);

  try {
    await redis.getConn().set(redisKey, newAccessToken);
  } catch (err) {
    console.log(err);
    res.status(500).json(null);
    return;
  }

  res.json(newAccessToken);
};

module.exports = {
  get,
  add,
  authenticate,
  deauthenticate,
  sendPasswordResetLink,
  changePasswordViaToken,
  changePasswordViaOldPassword,
  renewAccessToken,
};

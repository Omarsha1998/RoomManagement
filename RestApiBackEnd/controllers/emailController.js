/* eslint-disable no-console */
// const express = require("express");
// const router = express.Router();
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");

const appMain = require("../auth/auth");
// const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const api = {
  secretKey: "2b6e2a8f66a9b8f21fdcd9feeea439eb",
  apiKey: "d5756bd2a66525b42917761f83330586",
};
// MailJet login creds
// user: service-notification@uerm.edu.ph
// pass: Friday90210@
const mailjet = require("node-mailjet").connect(api.apiKey, api.secretKey);

const util = require("../helpers/util");
// const sqlHelper = require("../helpers/sql");
// const crypto = require("../helpers/crypto");
const tools = require("../helpers/tools.js");

// router.use(sanitize);

const sendResidents = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.email) {
    res.send({ error: "Email required!" });
    return;
  }
  if (!req.query.firstName) {
    res.send({ error: "First Name required!" });
    return;
  }
  if (!req.query.uermEmail) {
    res.send({ error: "UERM Email required!" });
    return;
  }
  if (!req.query.defaultPass) {
    res.send({ error: "Default password required!" });
    return;
  }
  console.log(`Sending Email: ${req.query.email}`);

  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "service-notification@uerm.edu.ph",
          Name: "UERM Notification",
        },
        // "To": req.query.email,
        To: [{ Email: req.query.email, Name: req.query.firstName }],
        Subject: "UERM E-Mail",
        HTMLPart: `
                        <h3>Hi ${req.query.firstName}</h3>
                        <p>Here is your UERM Email account:</p>
                        <p>
                            <div>Username: <b>${req.query.uermEmail}</b></div>
                            <div>Default Password: <b>${req.query.defaultPass}</b></div>
                        </p>
                        <p>To access UERM E-Mail:</p>
                        <ol>
                            <li>Open <a href="https://www.gmail.com">https://www.gmail.com</a></li>
                            <li>Use the username and the default password. You will be prompted to change your password upon logging in.</li>
                        </ol>
                        <p>Thank you.</p>
                    `,
        CustomID: "UermEmailApi",
      },
    ],
  });

  request
    .then((result) => {
      console.log(result.body);
      res.send({ success: result.body });
    })
    .catch((err) => {
      console.log(err);
      res.send({ error: err.statusCode });
    });

  // res.send({ 'success': `Email sent to ${req.query.email}` });
};

const sendAppRegistration = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "service-notification@uerm.edu.ph",
          Name: "UERM Notification",
        },
        // "To": req.query.email,
        To: [
          {
            Email: req.body.email,
            // Email: "jommar.ilagan@uerm.edu.ph",
            Name: req.body.username,
          },
        ],
        Subject: "UERM App Registration",
        HTMLPart: `
            <h3>Hi ${req.body.username}</h3>
            <p>You are now registered to UERM Apps via REMOTE LOGIN:</p>
            <p>
                <div>Username: <b>${req.body.username}</b></div>
                <div>Default Password: <b>${req.body.password}</b></div>
            </p>
            <p>To access UERM Apps:</p>
            <ol>
                <li>Open <a href="https://apps.uerm.edu.ph/auth">https://apps.uerm.edu.ph/auth</a></li>
                <li>Use the username and the default password. You will be prompted to change your password upon logging in.</li>
            </ol>
            <p>Thank you.</p>
        `,
        CustomID: "UermAppLogin",
      },
    ],
  });

  request
    .then((result) => {
      console.log(result.body);
      res.send({ success: result.body });
    })
    .catch((err) => {
      console.log(err);
      res.send({ error: err.statusCode });
    });

  // res.send({ 'success': `Email sent to ${req.query.email}` });
};

const sendForgotPassword = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const password = helpers.randomString(5);
      const sqlQuery = `exec ITMgt..sp_ResetPassword
        '${req.body.username}',
        '${password}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      if (result.recordset[0].ERR) {
        res.send({
          error: true,
          message: result.recordset[0].MSG,
        });
        return;
      }
      const request = mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "service-notification@uerm.edu.ph",
              Name: "UERM Notification",
            },
            // "To": req.query.email,
            To: [
              {
                Email: req.body.email,
                // Email: "jommar.ilagan@uerm.edu.ph",
                Name: req.body.username,
              },
            ],
            Subject: "UERM App Forget Password",
            HTMLPart: `
            <h3>Hi ${req.body.username}</h3>
            <p>Your password is now reset:</p>
            <p>
                <div>Username: <b>${req.body.username}</b></div>
                <div>Default Password: <b>${password}</b></div>
            </p>
            <p>To access UERM Apps:</p>
            <ol>
                <li>Open <a href="https://apps.uerm.edu.ph/auth">https://apps.uerm.edu.ph/auth</a></li>
                <li>Use the username and the default password. You will be prompted to change your password upon logging in.</li>
            </ol>
            <p>Thank you.</p>
        `,
            CustomID: "UermAppLogin",
          },
        ],
      });

      request
        .then((result) => {
          console.log(result.body);
          res.send({ success: result.body });
        })
        .catch((err) => {
          console.log(err);
          res.send({ error: err.statusCode });
        });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const sendDynamicEmail = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Body is required." });

  const returnValue = await (async () => {
    try {
      const emailDetails = req.body;
      const emailContent = {
        emailSender:
          emailDetails.emailSender ?? "service-notification@uerm.edu.ph",
        header: emailDetails.header,
        subject: emailDetails.subject,
        content: emailDetails.body,
        email: emailDetails.email,
        name: emailDetails.name,
      };
      await util.sendEmail(emailContent);
      return { success: true };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  })();

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const sendDynamicSMS = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Body is required." });

  const returnValue = await (async () => {
    try {
      const smsDetails = req.body;

      const smsMessage = {
        messageType: "sms",
        destination: smsDetails.contactNumber.toString(),
        app: "SMS - SENDER",
        text: smsDetails.body,
      };
      // console.log(smsMessage)
      const tokenBearerSMS = await util.getTokenSMS();
      const accessToken = tokenBearerSMS.accessToken;
      const smsStatus = await tools.sendSMSInsertDB(
        accessToken,
        smsMessage,
        true,
      );
      console.log(smsStatus);
      return { success: true };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  })();

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  sendResidents,
  sendAppRegistration,
  sendForgotPassword,
  sendDynamicEmail,
  sendDynamicSMS,
};

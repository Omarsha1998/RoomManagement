const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const fs = require("fs");

const helpers = require("../helpers/helpers");
const sanitize = require("../helpers/sanitize");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
// FTP CONN
const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftp");
// /FTP CONN

router.use(sanitize);

router.get("/", (req, res) => {
  res.send({ error: "No index router / available" });
});

router.post("/validate-login", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // if (!req.query.caseno) {
  //   res.send({ error: "Case Number not found." });
  //   return;
  // }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_ValidatePortalLogin
        '${req.body.mobileno}',
        '${req.body.otp}',
        '${req.body.auth}'
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/change-password", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: true, message: appMain.error });
    return;
  }
  if (!req.body.username) {
    res.send({ error: true, message: "Username is required!" });
  }
  if (!req.body.password != "") {
    res.send({ error: true, message: "Password is required!" });
  }
  if (!req.body.oldPassword != "") {
    res.send({ error: true, message: "Old Password is required!" });
  }
  if (!req.body.otp != "") {
    res.send({ error: true, message: "OTP is required!" });
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_ChangePatientPortalPassword
        '${req.body.username}',
        '${req.body.password}',
        '${req.body.oldPassword}',
        '${req.body.otp}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      res.send(
        result.recordset.map((i) => {
          return {
            error: i.ERR,
            message: i.MSG,
          };
        })[0],
      );
    } catch (error) {
      res.send({ error });
    }
  })();
});

module.exports = router;

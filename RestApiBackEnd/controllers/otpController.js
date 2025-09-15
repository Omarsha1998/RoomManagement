const express = require("express");
const router = express.Router();
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const OTPAuth = require("otpauth");
const otplib = require("otplib");
const secret = process.env.TOKEN;

const getOTP = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  otplib.totp.options = { digits: 6, epoch: Date.now(), step: 30 };
  const token = otplib.totp.generate(secret);
  res.send({
    otp: token,
  });
};

const verifyOTP = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const token = req.body.otp;
      const isValid = otplib.totp.verify({ token, secret });
      if (isValid) {
        res.send({
          otpAuth: "success",
        });
      } else {
        res.send({
          otpAuth: "error",
        });
      }
    } catch (err) {
      console.error(err);
    }
  })();
};

module.exports = {
  getOTP,
  verifyOTP,
};

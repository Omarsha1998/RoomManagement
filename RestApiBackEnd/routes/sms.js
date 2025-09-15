const express = require("express");
const router = express.Router();
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");

router.get("/get-token-bearer", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    const token = await helpers.getTokenBearerTextMessage()
    res.send(token)
  })();
});

router.get("/get-refresh-token-bearer", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    // const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMjg5MTM4OCIsInpvbmVpbmZvIjoiQXNpYS9NYW5pbGEiLCJjc3MiOiJzbWFydC5jc3MiLCJyb2xlIjoiMiIsImlzcyI6InJlc3QgYXV0aCIsIm9pZCI6IjMyODkxMzg0IiwibG9jYWxlIjoiZW4tUEgiLCJyaWQiOiIyMzAiLCJhdWQiOiJyZXN0IGFwaSIsInRvbiI6IjIiLCJzY29wZSI6WzIwNDIxLDIwNDIwLDIwMDAwLDIwNzUxLDIwNzUwLDIwNzM2LDIwNzM1LDIwNzM0LDIwNzMzLDIwNzMyLDIwNzMxLDIwNzMwXSwibmFtZSI6IlpBQ0FSSUFTLCBKRUZGUkVZIiwiZXhwIjoxNjE5MTk0OTgxLCJpYXQiOjE2MTkxOTMxODEsImp0aSI6InJTNXFGZnlrbXozWGY5TzFMVWI0M1pqIiwiZW1haWwiOiJqZWZmX3phY2FyaWFzQHVlcm0uZWR1LnBoIn0.ZRiBSmbPXrM_1LgE-p40O1wJYNtNP-TShMAVGVpJrZY'
    // const refreshToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJyZXN0IGFwaSIsInN1YiI6IjMyODkxMzg4IiwiaXNzIjoicmVzdCBhdXRoIiwiZXhwIjoxNjE5MjIxOTgxLCJpYXQiOjE2MTkxOTMxODEsImp0aSI6InJTNXFGZnlrbXozWGY5TzFMVWI0M1pqIn0.TnDbJiBtnAD73dGtyswSkLnCVHqn5KCn9g26ogzN5Ek'
    const accessToken = req.query.accessToken
    const refreshToken = req.query.refreshToken
    const token = await helpers.refreshTokenBearerTextMessage(accessToken, refreshToken)
    res.send(token)
  })();
});

router.post("/send-text-message", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    const accessToken = req.query.accessToken
    const message = {
      messageType: req.body.messageType,
      destination: req.body.destination,
      text: req.body.text
    }
    const token = await helpers.sendTextMessage(accessToken, message)
    res.send(token)
  })();
});

module.exports = router;

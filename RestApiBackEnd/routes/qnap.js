const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const qnap = require("../auth/auth").qnapAuth;
const http = require("http");
const https = require("https");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

const qnapUrl = `${qnap.server.local}cgi-bin/filemanager/`;

router.get("/auth", (req, res) => {
  const url = `${qnapUrl}wfm2Login.cgi?user=${qnap.user}&pwd=${qnap.pass}`;

  http
    .get(url, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        data = JSON.parse(data);
        res.send({ error: !data.authPassed, ...data });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
      res.send({ error: true, message: err.message });
    });
});

router.get("/create-folder/:sid/:folder/:path", (req, res) => {
  const url = `${qnapUrl}utilRequest.cgi?func=createdir&sid=${req.params.sid}&dest_folder=${req.params.folder}&dest_path=/${req.params.path}`;
  console.log(url);

  // http://10.107.11.170:8080/cgi-bin/filemanager/utilRequest.cgi?func=createdir&sid=bsiawy20&dest_folder/sample&dest_path=/imageresults
  // http://10.107.11.170:8080/cgi-bin/filemanager/utilRequest.cgi?func=upload&sid=bsiawy20&type=standard&dest_path=/imageresults&overwrite=1&progress=-imageresults-test.zip

  http
    .get(url, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        data = JSON.parse(data);
        res.send({ error: false, ...data });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
      res.send({ error: true, message: err.message });
    });
});

router.get("/upload/:sid/:dir/:file", (req, res) => {
  const url = `${qnapUrl}utilRequest.cgi?func=upload&sid=${req.params.sid}&type=standard&dest_path=/${req.params.dir}&overwrite=1&progress=${req.params.file}`;
  // http://ip:8080/cgi-bin/filemanager/utilRequest.cgi?func=upload&type=standard&sid=xxxx&dest_path=/Public&overwrite=1&progress=-Public-test.zip
  // http://10.107.11.170:8080/cgi-bin/filemanager/utilRequest.cgi?func=upload&sid=bsiawy20&type=standard&dest_path=/imageresults&overwrite=1&progress=-imageresults-test.zip

  console.log(url);

  http
    .get(url, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        data = JSON.parse(data);
        res.send({ error: false, ...data });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
      res.send({ error: true, message: err.message });
    });
});

module.exports = router;

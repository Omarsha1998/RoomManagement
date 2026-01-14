const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonth(monthString) {
  const date = new Date(`1900 ${monthString} 01`);
  const month = date.getMonth() + 1;
  return `0${month}`.substr(-2);
}

router.post("/saveForm", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec EMR..sp_SaveDOHForm
    '${req.body.date}',
    '${req.body.module}',
    '${req.body.department}',
    '${req.body.form}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/data/:type/:year/:month", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const month = getMonth(req.params.month);
  const date = `${req.params.year}${month}`;
  const sqlQuery = `select
    *
  from EMR..DOHStatistics d
  where d.date = '${date}'
  and d.module = '${req.params.type}'
  and d.isDeleted = 0`;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

module.exports = router;

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

const search = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const reqName =
    req.query.name === null
      ? ""
      : req.query.name === "null"
        ? ""
        : req.query.name;
  const reqOrNo =
    req.query.orno === null
      ? ""
      : req.query.orno === "null"
        ? ""
        : req.query.orno;
  if (!reqName && !reqOrNo) {
    res.send([]);
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [UE database]..vw_Payments p
      where p.name like '${reqName == "" ? "%" : `${reqName}%`}'
      and p.orno like '${reqOrNo == "" ? "%" : reqOrNo}'
      order by transactionDate desc`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
};

module.exports = {
  search,
};

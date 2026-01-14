const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN

const getSignatories = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.resultId) {
    res.send({ error: true, message: "Result ID required!" });
  }
  if (!req.query.resultType) {
    res.send({ error: true, message: "Result Type required!" });
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from EMR.dbo.fn_Signatories(
        '${req.query.resultId}',
        '${req.query.resultType}'
      )`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const searchResult = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.type) {
    res.send({ error: true, message: "Result type required!" });
  }
  if (
    !req.query.firstName &&
    !req.query.lastName &&
    !req.query.middleName &&
    !req.query.caseno
  ) {
    res.send([]);
  }
  void (async function () {
    try {
      let sqlWhere = null;
      let recParser = null;
      if (req.query.date) {
        sqlWhere = `and convert(date,r.createDate) = '${req.query.date}'`;
      } else if (req.query.caseno) {
        sqlWhere = `and r.caseno = '${req.query.caseno}'`;
      } else {
        sqlWhere = `and r.lastName like '%${req.query.lastName}%' and r.firstName like '%${req.query.firstName}%' and r.middleName like '%${req.query.middleName}%'`;
      }

      if (req.query.type == "xr") {
        recParser = `'xr'`;
      } else {
        recParser = `'lab','hclab'`;
      }
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from UERMEMR..vw_PatientRecords r
      where r.recParser in (${recParser})
      ${sqlWhere}
      order by createDate`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
};

module.exports = {
  getSignatories,
  searchResult,
};

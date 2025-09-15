// const express = require("express");
// const router = express.Router();
const appMain = require("../auth/auth");
// const sanitize = require("../helpers/sanitize");
// const helpers = require("../helpers/helpers");

// New SQL Helpers and Utils //
// const util = require("../helpers/util");
const sqlHelper = require("../helpers/sql");
// New SQL Helpers and Utils //

// Models //
const libraryUsers = require("../models/library/libraryUsers");
// Models //

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");

const login = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec UERMLibrary..sp_LoginAttendance
        '${req.body.code}'
      `;
      const result = await sql.query(sqlQuery);
      res.send(
        result.recordset.length > 0
          ? result.recordset[0]
          : {
              error: true,
              message: "SN/Employee Number not exists.",
            },
      );
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getCurrentLogin = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        code
      from
        (select
          row_number() over (partition by code order by loginDate desc) row,
          code,
          loginDate
        from UERMLibrary..Attendance
        where logoutDate is null) x
      where x.row = 1
      order by loginDate desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getPatronLoginReport = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        a.code,
        p.name,
        p.college,
        p.[YEAR LEVEL] yearLevel,
        p.department,
        convert(date,a.loginDate) date,
        p.[PATRON TYPE] type,
        count(a.code) loginQty
      from UERMLibrary..Attendance a
      left join UERMLibrary..vw_Patrons p
        on a.code = p.code
        where convert(date,a.loginDate) between '${req.query.dateFrom}' and '${req.query.dateTo}'
      group by a.code,p.name,p.college,p.DEPARTMENT,p.[PATRON TYPE],convert(date,a.loginDate)
      order by date,name`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getLibraryDetailedReport = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";

      sqlWhere = `and convert(date,a.loginDate) between '${req.query.dateFrom}' and '${req.query.dateTo}' order by date,name`;

      return await libraryUsers.getLibraryUsers(sqlWhere, txn, {
        top: {},
        order: {},
      });
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  login,
  getCurrentLogin,
  getPatronLoginReport,
  getLibraryDetailedReport,
};

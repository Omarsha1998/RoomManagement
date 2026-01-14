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
  let caseno = req.query.caseno == null ? "" : req.query.caseno;
  let patientName = req.query.patientName == null ? "" : req.query.patientName;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from UERMEMR..vw_ClinicalAbstract a
                where a.patientName like '%${patientName}%'
                and a.caseno like '%${caseno}%'
                order by patientName, dateAdmitted
            `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        result: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getResult = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.caseno) {
    res.send({ error: "No Case Number found." });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from UERMEMR..vw_ClinicalAbstract a
                where a.caseno = '${req.query.caseno}'
            `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        result: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
};


const saveResult = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec UERMEMR..sp_SaveClinicalAbstract
          '${req.body.caseno}',
          '${req.body.admitted}',
          '${req.body.admittingDiagnosis}',
          '${req.body.finalDiagnosis}',
          '${req.body.history}',
          '${req.body.surgeryDone}',
          '${req.body.surgeryDate}',
          '${req.body.surgeryProcedureDone}',
          '${req.body.procedures}',
          '${req.body.medications}',
          '${req.body.patientOutcome}',
          '${req.body.user}',
          '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        result: result.recordset[0],
      });
    } catch (error) {
      res.send({ error });
    }
  })();
};



module.exports = {
  search,
  getResult,
  saveResult,
};

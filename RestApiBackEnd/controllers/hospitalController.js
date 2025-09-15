const express = require("express");
const appMain = require("../auth/auth");
const helpers = require("../helpers/helpers");
const sanitize = require("../helpers/sanitize");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN

const getChargesLab = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from UERMMMC..CHARGES c
            --where c.FRM2_CODE = 'lab'
            where c.labtype is not null
            order by description`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        charges: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getXray = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.validated) {
    res.send({ error: "Validated required!" });
    return;
  }

  void (async function () {
    let sqlWhere = "";
    if (req.query.id) {
      sqlWhere = `and x.radiologyId = '${req.query.id}'`;
    }
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from EMR..vw_RadiologyInfo x
        where x.isValidated = '${req.query.validated}'
        and x.isDeleted = 0
        ${sqlWhere}
        order by patientName,chargeSlipNo`;
      console.log(sqlQuery);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({ radiologyInfo: result.recordset });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const saveXray = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.user) {
    res.send({ error: true, message: "User required!" });
    return;
  }
  if (!req.body.radiologyId) {
    res.send({ error: true, message: "Radiology ID required!" });
    return;
  }
  if (!req.body.result) {
    res.send({ error: true, message: "Result required!" });
    return;
  }
  if (!req.body.reader) {
    res.send({ error: true, message: "Reader required!" });
    return;
  }

  // res.send({'asd':'dsa'});

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_ValidateXR
            '${req.body.radiologyId}',
            '${req.body.result}',
            '${req.body.reader}',
            '${req.body.user}',
            '${helpers.getIp(req.connection.remoteAddress)}'
          `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        message: result.recordset[0].MSG,
        error: result.recordset[0].ERR,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getLabCharges = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.normalValueId) {
    res.send({ error: "Normal Value required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from EMR..vw_NormalValues n
            where n.normalValueId = '${req.query.normalValueId}'`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({ normalValue: result.recordset[0] });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getLaboratoryDepts = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere = "";
  if (req.query.labModule) {
    sqlWhere = `and d.module = '${req.query.labModule}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select distinct labDept,module,chargeId from UERMMMCIOnlineExaminations..depts d
            where d.deleted = 0
            ${sqlWhere}
            and dCode = '1050'`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({ labDepts: result.recordset });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const saveLabCharges = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.labModule) {
    res.send({ error: "Laboratory module required" });
    return;
  }
  if (!req.body.chargeId) {
    res.send({ error: "Charge ID required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_AssignLaboratoryCharges
                '${req.body.labModule}',
                '${req.body.chargeId}',
                '${helpers.getIp(req.connection.remoteAddress)}'
            `;
      // console.log(sqlQuery);
      // res.send({'asd':'dsa'});
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        message: result.recordset[0].MSG,
        error: result.recordset[0].ERR,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getMyRoomAnalytics = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `EXEC UERMHIMS..RMAnalytics  '${req.params.month}', '${req.params.year}'
      `;

      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getRoomAnalytics = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `EXEC UERMHIMS..RMAnalytics '5','2021'
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getRoomMonthYear = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT MMDesc +' '+ CONVERT(VARCHAR(20),YY) AS MYDesc  ,* FROM UERMHIMS..MonthYearControlTable
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result);
    } catch (error) {
      res.send({ error });
    }
  })();
};

module.exports = {
  getChargesLab,
  getXray,
  getLabCharges,
  getLaboratoryDepts,
  getMyRoomAnalytics,
  getRoomAnalytics,
  getRoomMonthYear,
  saveXray,
  saveLabCharges,
};

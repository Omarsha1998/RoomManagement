const express = require("express");
const router = express.Router();
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const redis = require("redis");
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

const getAnnouncements = async function (req, res) {
  let sqlWhere = "";

  if (req.query.app) {
    sqlWhere = `where App = '${req.query.app}' and active = 1`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);

      const sqlQuery = `SELECT
        id
        ,name
        ,description
        ,post
        ,links
        ,type
        ,active
        ,contentBeforeFile
        ,needsAcknowledgement
        ,fileType
        ,allowed
        ,dateTimeCreated
        ,createdBy
        ,dateTimeUpdated
        ,updatedBy
        ,remarks
      FROM            
        HR..Announcements
      ${sqlWhere}
      ORDER BY dateTimeCreated desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
};

const getAcknowledgement = async function (req, res) {
  var sqlWhere = "";
  if (req.query.announcementId) {
    var sqlWhere = `where announcementId = '${req.query.announcementId}' and employeeId = '${req.query.employeeId}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
         id,
         announcementId,
         employeeId,
         dateTimeCreated,
         dateTimeUpdated
      FROM            
        HR..AnnouncementAcknowledges
        ${sqlWhere}
      `;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
};

const acknowledgeAnnouncement = async function (req, res) {
  if (!req.body.id) {
    res.send({ error: "Announcement ID Required." });
    return;
  }

  if (!req.body.employeeId) {
    res.send({ error: "Employee ID Required." });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_AcknowledgeAnnouncement
                '${req.body.id}',
                '${req.body.employeeId}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR === true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
};

module.exports = {
  getAnnouncements,
  getAcknowledgement,
  acknowledgeAnnouncement,
};

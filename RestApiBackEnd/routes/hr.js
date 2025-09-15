const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const redis = require("redis");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const sql = require("mssql");
const sqlConfig = require("../config/database");

router.get("/employees", (req, res) => {
  void (async function () {
    let sqlWhere = "";

    if (!req.query.code) {
      res.status(403).send({ error: "Invalid Parameters" });
      return;
    }

    sqlWhere = `code = '${req.query.code}'`;

    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        code,
        name,
        firstName,
        lastName,
        middleName,
        gender,
        bdate birthdate,
        email = case when UERMEmail is not null
          then UERMEmail
        else
          email
        end,
        mobileNo,
		    pass password,
        dept_code deptCode,
        dept_desc deptDesc,
        pos_desc posDesc,
        civil_status_desc civilStatusDesc,
        [group],
        emp_class_desc empClassDesc,
        emp_class_code empClassCode,
        address,
        is_active isActive
      from [UE Database]..vw_Employees where
      ${sqlWhere}
      and is_active = 1
      `;
      const result = await sql.query(sqlQuery);
      const arr = result.recordset[0];
      if (Object.keys(arr).length > 0) {
        const expiresIn = 60 * 60;
        const token = jwt.sign(arr, process.env.TOKEN, {
          expiresIn,
        });
        res.status(200).send({
          token: token,
          expiresat: expiresIn,
        });
        return;
      }
      res.send(arr);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

router.get("/announcement-payroll-policy", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT 
        id
        ,period
        ,cutoffFrom
        ,cutoffTo
        ,submissionOfTimeKeeping
        ,hrdComputation hrDeptComputation
        ,accountingPayroll
        ,active
        ,createdBy
        ,dateTimeCreated
        ,updatedBy
        ,dateTimeUpdated
        ,remarks
      FROM HR..PayrollAnnouncements
      order by id
      `;
      const result = await sql.query(sqlQuery);
      const arr = result.recordset;
      res.send(arr);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

router.put("/announcement-payroll-policy/:id", (req, res) => {
  void (async function () {
    const payload = req.body;
    const paramId = req.params.id;
    try {
      await helpers.transact(async (txn) => {
        await new sql.Request(txn).query`UPDATE HR..PayrollAnnouncements
        SET
         period = ${payload.period},
          cutoffFrom = ${payload.cutoffFrom},
          cutoffTo = ${payload.cutoffTo},
          submissionOfTimeKeeping = ${payload.submissionOfTimeKeeping},
          hrdComputation = ${payload.hrDeptComputation},
          accountingPayroll = ${payload.accountingPayroll},
          active = ${payload.active},
          updatedBy = ${payload.updatedBy},
          dateTimeUpdated = ${await helpers.currentDateTime()}
        WHERE
        id = ${paramId};`;
        res.send({ success: true });
      });
    } catch (error) {
      console.log(error);
      res.send({ success: false, message: error });
    }
  })();
});

async function setAutoPayrollPolicy() {
  // console.log("Executing HR Jobs");
  try {
    const monthNow = new Date().getMonth();
    const yearNow = new Date().getFullYear();
    const firstDayNow = new Date(yearNow, monthNow, 1);
    const formatfirstDayNow = new Intl.DateTimeFormat("en", {
      day: "2-digit",
    }).format(firstDayNow);
    const lastDay = new Date(yearNow, monthNow + 1, 0);
    const formatlastDay = new Intl.DateTimeFormat("en", {
      day: "2-digit",
    }).format(lastDay);
    let monthNext = new Date().getMonth() + 1;
    if (monthNow === 11) {
      monthNext = 0;
    }
    const firstDay = new Date(yearNow, monthNext, 1);
    const formatfirstDay = new Intl.DateTimeFormat("en", {
      day: "2-digit",
    }).format(firstDay);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ];

    const payload = [
      {
        period: `${months[monthNow]} 16-${formatlastDay}`,
        cutoffFrom: `${months[monthNow]} 3`,
        cutoffTo: `${months[monthNow]} 16`,
        submissionOfTimeKeeping: `On or before ${months[monthNow]} 16 (12PM)`,
        hrDeptComputation: `${months[monthNow]} 17-19`,
        accountingPayroll: `${months[monthNow]} 20 onwards`,
      },
      {
        period: `${months[monthNext]} ${formatfirstDay}-15`,
        cutoffFrom: `${months[monthNow]} 17`,
        cutoffTo: `${months[monthNext]} 2`,
        submissionOfTimeKeeping: `On or before ${months[monthNext]} 2 (12PM)`,
        hrDeptComputation: `${months[monthNext]} 3-5`,
        accountingPayroll: `${months[monthNext]} 6 onwards`,
      },
    ];

    await sql.connect(sqlConfig);
    const sqlQuery = `SELECT 
      id
      ,period
      ,cutoffFrom
      ,cutoffTo
      ,submissionOfTimeKeeping
      ,hrdComputation hrDeptComputation
      ,accountingPayroll
      ,active
      ,createdBy
      ,dateTimeCreated
      ,updatedBy
      ,dateTimeUpdated
      ,remarks
    FROM HR..PayrollAnnouncements
    where convert(date, DateTimeCreated) like '%${yearNow}-${pad(
      monthNow + 1,
    )}%'
    order by id
    `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    if (arr.length === 0) {
      await helpers.transact(async (txn) => {
        await new sql.Request(txn).query`UPDATE HR..PayrollAnnouncements
          SET
            active = 0,
            updatedBy = 'SYSTEM GENERATED',
            dateTimeUpdated = ${await helpers.currentDateTime()}
            `;
        for (const res of payload) {
          await new sql.Request(txn).query`INSERT INTO HR..PayrollAnnouncements
          (
            period,
            cutoffFrom,
            cutoffTo,
            submissionOfTimeKeeping,
            hrdComputation,
            accountingPayroll,
            createdBy,
            dateTimeCreated
          ) VALUES (
            ${res.period},
            ${res.cutoffFrom},
            ${res.cutoffTo},
            ${res.submissionOfTimeKeeping},
            ${res.hrDeptComputation},
            ${res.accountingPayroll},
            'SYSTEM GENERATED',
            ${await helpers.currentDateTime()}
          )
          `;
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}

function pad(value) {
  if (value < 10) {
    return `0${value}`;
  } else {
    return value;
  }
}

function fixDTR() {
  void (async function () {
    // console.log("Executing HR-Fix DTR Jobs");

    try {
      await sql.connect(sqlConfig);
      const date = new Date();
      const currentDate = date
        .toISOString()
        .substr(0, 10)
        .replace("-", "")
        .replace("-", "")
        .replace("-", "");
      const sqlQuery = `exec HR.dbo.Usp_jf_FixDTR '${
        currentDate - 1
      }','${currentDate}','','POST'`;
      const result = await sql.query(sqlQuery);
      const arr = result.recordset;
      return arr;
    } catch (error) {
      console.log(error);
      return error;
      // res.status(500).send(error);
    }
  })();
}

// if (process.env.NODE_ENV === "prod") {
//   setAutoPayrollPolicy();
//   fixDTR();
//   setInterval(() => {
//     fixDTR();
//     setAutoPayrollPolicy();
//   }, 86400000);
// }

router.get("/announcements", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT 
        id
        ,name
        ,description
        ,post
        ,links
        ,active
        ,fileType
        ,type
        ,needsAcknowledgement
        ,dateTimeCreated
        ,createdBy
        ,dateTimeUpdated
        ,updatedBy
        ,remarks
      FROM HR..Announcements 
      order by DateTimeCreated
      `;
      const result = await sql.query(sqlQuery);
      const arr = result.recordset;
      // for (var resultArr of arr) {
      //   if (resultArr.media !== null) {
      //     resultArr.mediaFile = resultArr.media.toString('base64')
      //   }
      // }
      res.send(arr);
      // res.end(img);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

router.get("/announcement-img/:id", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT 
        media
      FROM HR..Announcements 
      where id = '${req.params.id}'
      `;
      const result = await sql.query(sqlQuery);
      const arr = result.recordset;
      if (arr[0].media !== null) {
        const img = Buffer.from(arr[0].media, "base64");

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": img.length,
        });
        // res.send(arr);
        res.end(img);
      } else {
        res.send({ message: "No Media Found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

router.get("/announcement-video/:id", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT 
        media
      FROM HR..Announcements 
      where id = '${req.params.id}'
      `;
      const result = await sql.query(sqlQuery);
      const arr = result.recordset;

      const video = Buffer.from(arr[0].media, "base64");

      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Length": video.length,
      });
      // res.send(arr);
      res.end(video);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

router.get("/announcement-file/:id", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT 
        media
      FROM HR..Announcements 
      where id = '${req.params.id}'
      `;
      const result = await sql.query(sqlQuery);
      const arr = result.recordset;

      if (arr[0].media !== null) {
        const buf = Buffer.from(arr[0].media);
        res.setHeader("Content-Type", "application/pdf");
        res.send(buf);
      } else {
        res.status(500).send({ error: "No media file" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

router.post("/announcements", (req, res) => {
  void (async function () {
    try {
      const payload = JSON.parse(req.body.payload);
      let mediaFile = null;
      if (req.files !== null) {
        mediaFile = req.files.file.data;
      }

      await helpers.transact(async (txn) => {
        await new sql.Request(txn).query`INSERT INTO HR..Announcements
          (
            name,
            description,
            needsAcknowledgement,
            post,
            fileType,
            type,
            createdBy,
            media,
            active
          ) VALUES (
            ${payload.name},
            ${payload.description},
            ${payload.needsAcknowledgement},
            ${payload.post === null ? "" : payload.post},
            ${payload.fileType === null ? "" : payload.fileType.value},
            ${payload.type === null ? "" : payload.type.value},
            ${payload.code},
            ${mediaFile},
            0
          )
        `;
        res.send({ success: true });
      });
    } catch (error) {
      console.log(error);
      res.send({ success: false, message: error });
    }
  })();
});

// router.post("/test", (req, res) => {
//   void (async function () {
//     try {
//       // const payload = JSON.parse(req.body.studentInfo);
//       console.log(JSON.parse(req.body.studentInfo), 'body')
//       // console.log(req.files, 'file')
//       // sampleFile = req.files.file;

//       // uploadPath = `//10.107.3.198/Users/Public/test/` + sampleFile.name;
//       // // Use the mv() method to place the file somewhere on your server
//       // sampleFile.mv(uploadPath, function (err) {
//       //   if (err) {
//       //     console.log(err)
//       //     // return res.status(500).send(err);
//       //     res.send(err)
//       //     return
//       //   }
//       //   res.send("File uploaded!");
//       // });
//       res.send({ success: true });
//     } catch (error) {
//       console.log(error);
//       res.send(error);
//     }
//   })();
// });

module.exports = router;

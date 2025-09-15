const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
// const folder = path.join('/var/www/html/vue_assets/ads')
const folder = path.join("C:/Users/Bernard/Videos");
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
const pdf = require("html-pdf");
router.use(sanitize);

router.get("/device/depts", (req, res) => {
  const depts = [
    { code: "2020", description: "COM - ANATOMY" },
    { code: "2170", description: "COM - ANESTHESIA AND PAIN MEDICINE" },
    { code: "2030", description: "COM - BIOCHEMISTRY" },
    { code: "2186", description: "COM - MEDICAL EDUCATION UNIT" },
    { code: "2183", description: "COM - MEDICAL HUMANITIES" },
    { code: "2060", description: "COM - MEDICINE" },
    { code: "2070", description: "COM - MICROBIOLOGY" },
    { code: "2090", description: "COM - NEUROSCIENCE" },
    { code: "2110", description: "COM - OB GYNE" },
    { code: "2050", description: "COM - OPHTHALMOLOGY" },
    { code: "2040", description: "COM - OTORHINOLARYNGOLOGY (EENT)" },
    { code: "2080", description: "COM - PATHOLOGY" },
    { code: "2120", description: "COM - PEDIATRICS" },
    { code: "2130", description: "COM - PHARMACOLOGY" },
    { code: "2140", description: "COM - PHYSIOLOGY" },
    { code: "2150", description: "COM - PREVENTIVE MEDICINE" },
    { code: "2100", description: "COM - PSYCHIATRY" },
    { code: "2180", description: "COM - SURGERY" },
    { code: "3000", description: "COLLEGE OF NURSING" },
    { code: "2000", description: "COLLEGE OF MEDICINE (Deans Office)" },
    { code: "10100", description: "COLLEGE OF ALLIED HEALTH PROFESSIONS" },
    { code: "4000", description: "COLLEGE OF ALLIED REHABILITATION SCIENCES" },
  ];
  res.send(depts);
});

router.get("/get-ip", (req, res) => {
  "use strict";
  const { promisify } = require("util"); //<-- Require promisify
  const getIP = promisify(
    require("external-ip")({
      replace: true,
      services: [
        "https://ipinfo.io/ip",
        "http://icanhazip.com/",
        "http://ident.me/",
      ],
      timeout: 600,
      getIP: "parallel",
      verbose: true,
    }),
  );

  getIP()
    .then((ip) => {
      res.send(ip);
    })
    .catch((error) => {
      console.error(error);
    });
});

router.get("/get-ip2", (req, res) => {
  // var ip = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
  //        req.socket.remoteAddress
  // res.send(ip);
  res.send({ ipAddress: helpers.getIp(req.socket.remoteAddress) });
});

router.get("/check-access/:code/:systemName/:moduleName", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // console.log(req.params);

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ITMgt.dbo.fn_isAccess(
        '${req.params.code}',
        '${req.params.systemName}',
        '${req.params.moduleName}'
      ) hasAccess`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0].hasAccess);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/device/register", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec ITMgt..sp_RegisterDevice
        '${req.body.code}',
        '${req.body.name}',
        '${req.body.department}',
        '${req.body.email}',
        '${req.body.macAddress}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-rooms-dashboard", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec UERMHIMS..Usp_jf_GetRoomWebDashBoard`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-rooms-details", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec UERMHIMS..Usp_jf_GetRoomWebDashBoard'DETAILED'`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-outbox-smart-sms", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec UERMSMS..sp_SmartSendSMS
        '${req.body.message}',
        '${req.body.status}',
        '${req.body.mpn}',
        '${req.body.sourceApp}'
      `;

      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR == true) {
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
});

router.get("/get-active-employees-mobile", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `Select *
      // from uermsms..Phonebook p
      // join [ue database]..vw_employees b on b.CODE = p.EmployeeCode
      // where p.employeecode is not null and b.IS_ACTIVE = 1`;
      const sqlQuery = `Select CODE, MOBILENO
      from [ue database]..vw_employees b
      where b.IS_ACTIVE = 1 AND MOBILENO <> ''`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/raffles", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..Raffles where enabled = 1`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/raffle-get-winners", (req, res) => {
  let sqlWhere = "";
  if (req.query.raffleID) {
    sqlWhere = `where raffle_id = '${req.query.raffleID}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..vw_Raffle_Winners ${sqlWhere} order by create_datetime asc`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/raffle-get-winners-v2", (req, res) => {
  let sqlWhere = "";
  if (req.query.raffleID) {
    sqlWhere = `where raffle_id = '${req.query.raffleID}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..vw_Raffle_WinnersV2 ${sqlWhere} order by datetime_updated asc`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/raffle-clear-winners", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `EXEC HR..sp_RaffleClearWinners`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/raffle-reset-overall-winners", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `EXEC HR..sp_RaffleResetOverallWinners`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.post("/raffle-save-entries", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_RaffleRegisterEntries
        '${req.body.code}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.position}',
        '${req.body.department}',
        '${req.body.category}'
      `;

      const result = await sql.query(sqlQuery);
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: result.recordset[0].MSG,
      });
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/raffle-categories", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select category from HR..RaffleEntries group by category`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/raffle-entries", (req, res) => {
  let sqlWhere = "";
  if (req.query.category) {
    if (req.query.category !== "ALL") {
      sqlWhere = `and category = '${req.query.category}'`;
    }
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select 
          * from HR..RaffleEntries
        where winner = 0 and active = 1
        ${sqlWhere}`;

      console.log(sqlQuery);
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/raffle-save-winners", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_RaffleSaveWinners
        '${req.body.entry_id}',
        '${req.body.raffle_id}'
      `;

      const result = await sql.query(sqlQuery);
      if (result.recordset[0].ERR == true) {
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
});

router.get("/bingo-get-numbers", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..BingoRollNumbers order by DateAdded desc`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/bingo-register-user", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_RegisterBingoUser
        '${req.body.userCode}',
        '${req.body.password}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.lastName}',
        '${req.body.bingoCardB}',
        '${req.body.bingoCardI}',
        '${req.body.bingoCardN}',
        '${req.body.bingoCardG}',
        '${req.body.bingoCardO}'
      `;

      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR == true) {
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
});

router.post("/bingo-post-numbers", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_BingoRecordNumbers
        '${req.body.bingoLetters}',
        '${req.body.bingoNumbers}'
      `;

      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR == true) {
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
});

router.post("/bingo-declare-users", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_DeclareBingo
        '${req.body.bingoNumbers}',
        '${req.body.code}'
      `;

      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR == true) {
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
});

router.post("/bingo-users-reset-numbers", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `update HR..UsersBingo
      SET BingoNumbers = null
      where UserCode = '${req.body.userCode}'`;

      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: "Bingo Numbers Reset!",
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/bingo-reset-numbers", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_BingoResetGame`;
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR == true) {
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
});

router.get("/bingo-login-user", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.userCode) {
    res.send({ error: "Code required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..UsersBingo where UserCode = '${req.query.userCode}'`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/bingo-configuration", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..BingoConfigurations`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/bingo-combinations", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..BingoCombinations`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/bingo-update-config", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      let sqlQuery = "";
      // sqlQuery = `update HR..BingoConfigurations SET BingoCombination = '${req.body.combination}', AllowBingo = '${req.body.allowBingo}', AllowRegistration = '${req.body.allowRegistration}' `;
      if (req.body.type === "1") {
        sqlQuery = `update HR..BingoConfigurations SET BingoContent = '${req.body.combination}' where Name = 'CurrentCombination'`;
      } else if (req.body.type === "2") {
        sqlQuery = `update HR..BingoConfigurations SET Status = '${req.body.allowBingo}' where Name = 'AllowBingo'`;
      } else if (req.body.type === "3") {
        sqlQuery = `update HR..BingoConfigurations SET Status = '${req.body.allowRegistration}' where Name = 'AllowRegistration'`;
      }
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        message: result,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/bingo-declared-user", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..UsersBingo where Bingo = 1 order by DateTimeDeclared`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/bingo-reject-users", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";
  if (req.body.userCode) {
    sqlWhere = `where UserCode = '${req.body.userCode}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `update HR..UsersBingo
      SET Bingo = 0
      ${sqlWhere}
      `;

      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: "Player(s) Rejected!",
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/bingo-declare-winner", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `update HR..UsersBingo
      SET Winner = 1
      where UserCode = '${req.body.userCode}'`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: "Congratulations!",
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/upload-video", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );

  void (async function () {
    try {
      // await sql.connect(sqlConfig);
      // const sqlQuery = `exec student request`;
      // const result = await sql.query(sqlQuery);
      // // sql.close();
      // res.send(result.recordset);
      // const result = result.recordset.length
      const result = 1;

      if (result > 0) {
        try {
          const form = new formidable.IncomingForm();
          form.uploadDir = folder;
          form.parse(req, (_, fields, files) => {
            res.send({
              message: "success",
            });
          });
          form.on("file", function (field, file) {
            fs.rename(
              file.path,
              `${form.uploadDir}/` + `${file.name}`,
              (err) => {
                if (err) throw err;
              },
            );
          });
        } catch (error) {
          res.send({
            message: "error",
          });
        }
      }
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/get-uploaded-videos", (req, res) => {
  //passsing directoryPath and callback function
  void (async function () {
    try {
      fs.readdir(folder, function (err, files) {
        //handling error
        if (err) {
          return console.log(`Unable to scan directory: ${err}`);
        }
        //listing all files using forEach
        const arrFile = [];
        files.forEach(function (file) {
          if (file.includes(".mp4")) {
            // const fullFile = `${folder}/${file}`
            arrFile.push(file);
          }
        });
        res.send(arrFile);
      });
    } catch (error) {
      res.send(error);
    }
  })();
});

router.get("/nst-attendance", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const sqlLimit = "";
  let sqlWhere = "";
  if (req.query.code) {
    sqlWhere = `where Code ='${req.query.code}'`;
  }

  if (req.query.checkTimeIn) {
    sqlWhere = `where convert(date,d.DateTimeCreated) = convert(date,GETDATE()) and Code = '${req.query.code}'`;
  }

  void (async function () {
    try {
      const sqlQuery = `select
          *
        from UERMHIMS..NSTAttendance d
        ${sqlWhere}
        order by Id desc
        `;

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();

      res.send({ result: result.recordset });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/nst-attendance-dashboard", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";
  if (req.query.inclusiveDate) {
    sqlWhere = `'${req.query.inclusiveDate}'`;
  }

  void (async function () {
    try {
      const sqlQuery = `EXEC UERMHIMS..Usp_jf_GetNSTAttendance ${sqlWhere}`;

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({ result: result.recordset });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/nst-time-in", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `UERMHIMS..sp_NSTInsertTimeIn
        '${req.body.code}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.position}',
        '${req.body.department}',
        '${req.body.timeInLocation}'
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/nst-get-ip-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `select
          *
        from UERMHIMS..NSTConfigByIP
        `;

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/cf4-patient", (req, res) => {
  let sqlWhere = "";
  if (req.query.caseNo) {
    sqlWhere = `where a.caseNo = '${req.query.caseNo}'`;
  }

  if (req.query.lastName) {
    sqlWhere = `where lastName like '%${req.query.lastName}%'`;
  }

  void (async function () {
    try {
      const sqlQuery = `select distinct
          a.caseNo,
          a.patientNo,
          c.lastName,
          c.firstName,
          c.middleName,
          b.age,
          c.sex,
          b.DATEAD dateAdmission,
          b.DATEDIS dateDischarged
      from UERMMMC..PATIENTINFO c 
      join UERMHIMS..CF4_RDetails a on c.PATIENTNO = a.PATIENTNO
      join UERMMMC..CASES b on a.CASENO = B.CASENO
      ${sqlWhere}`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/cf4-details", (req, res) => {
  let sqlWhere = "";
  if (req.query.caseNo) {
    sqlWhere = `where caseNo = '${req.query.caseNo}'
    order by b.HeaderId, b.Id asc`;
  }

  void (async function () {
    try {
      const sqlQuery = `SELECT
        a.id cf4Id,
        a.caseNo,
        a.patientNo,
        a.headerId,
        a.questionId,
        b.Id,
        b.detailDescription question,
        a.resultValue,
        b.remarks questionType,
        b.title,
        b.subGroup,
        a.remarks,
        a.isStatus,
        a.dateAdded,
        a.dateModified,
        a.rheaderId,
        d.HeaderName section,
        f.name userAdded,
        f.pos_desc userPosition
      FROM UERMHIMS..CF4_RDetails a
      join UERMHIMS..CF4_QDetails b on a.QuestionId = b.Id
      join UERMHIMS..CF4_QHeader d on b.HeaderId = d.Id
      join UERMHIMS..AspNetUsers e on a.UserAdded = e.Id
      join [UE Database]..vw_Employees f on e.UserName = f.code
      ${sqlWhere}`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/cf4-details-course-ward", (req, res) => {
  let sqlWhere = "";
  if (req.query.caseNo) {
    sqlWhere = `where caseNo = '${req.query.caseNo}'`;
  }

  void (async function () {
    try {
      const sqlQuery = `SELECT
        id,
        patientNo,
        headerId,
        resultDoctorOrder,
        resultDoctorOrderDate,
        remarks,
        dateAdded,
        userAdded
      FROM UERMHIMS..CF4_RCourseWard
      ${sqlWhere}`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/cf4-details-drugs", (req, res) => {
  let sqlWhere = "";
  if (req.query.caseNo) {
    sqlWhere = `where caseNo = '${req.query.caseNo}'`;
  }

  void (async function () {
    try {
      const sqlQuery = `SELECT
        id,
        patientNo,
        headerId,
        resultItemCode,
        resultGenericName,
        resultQuantity,
        resultTotalCost,
        remarks,
        dateAdded,
        userAdded
      FROM UERMHIMS..CF4_RDrugsMeds a
      ${sqlWhere}`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/address/:type/:search", (req, res) => {
  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }
  let sqlQuery;
  switch (req.params.type) {
    case "region":
      sqlQuery = `select code, name region from [UE database]..[CodeRegion] c order by region`;
      break;
    case "province":
      sqlQuery = `select code, name province from [UE database]..[CodeProvince] c where c.code like '${req.params.search}%' order by province`;
      break;
    case "municipality":
      sqlQuery = `select code, name municipality from [UE database]..[CodeMunicipalityCity] c where c.code like '${req.params.search}%' order by municipality`;
      break;
  }
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

router.get("/nst-check-dtr", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";
  if (req.query.code) {
    sqlWhere = `where n.Code ='${req.query.code}'`;
  }

  void (async function () {
    try {
      const sqlQuery = `select n.*, b.LASTIN, b.LASTOUT, b.Status 
      from UERMHIMS..vw_LastBioINOUT b 
      left join UERMHIMS..NSTAttendance n on b.code=n.Code and convert(char(8),n.DateTimeCreated,112)=convert(char(8),getdate(),112)
      ${sqlWhere}`;

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

const axios = require("axios");
router.get("/get-result", (req, res) => {
  const config = {
    method: "get",
    url: "http://10.107.3.214/NovaWeb/WebViewer/Account/ValidateUserFromUrl?key=01fnr63dd.Ljav5SLYem20yxUGsHupqV_mqJfs4K9weDHsXbUk_dGCBFg05I-YRIrttfCY3nqPcwgUd3D1d1nIMpGRE689DpX5IgyWb78ZQq_LTPSFXhumGd",
    headers: {
      Cookie:
        ".WEBVIEWERAUTH=C58713B7F4FE78C405A80B1A7FD496E812BB000D446B7AC2CACA78B82B55B7EE7C2C1D01F30407CA3D7A98F2097985E907A2CD46732534DED62FDC3A32E0C1890DC2A49FE716AE513C64CA48943E882AB35570FAB0D30B947AED70A0C45C40D7E185413F8F95275059B7E5D31BCB76B46DC248EF45E625BDCB79E28719712975C71D9C073AEA5252EA8FF48B42BF65F82827791CCE919F500817175507FAF4DC0D2ACF83C1CC85C443EA36936DEA03BDA7ACDB9CA6C8E0B415299AC0B5ED5FA495C89E1970E6D83B6E608125CD02E8FE8381D4D153B02BF94E9666CF4E3EAD2AFE747473B2A5D6C9109CE6C0800F83FB59887DFCAF3928247038AF5779E814E2DFEF50A901E066BA668B16025B4CEBE4; ASP.NET_SessionId=o0phawg1pqo1mfynjzbqxosm",
    },
  };

  axios(config)
    .then(function (response) {
      res.send(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
});

// async function getSessionStatus (date) {
//   var options = {
//     'method': 'GET',
//     'url': `http://10.107.3.214/NovaWeb/WebViewer/Account/SessionStatus?_=${date}`,
//   };
//   request(options, function (error, response) {
//     if (error) throw new Error(error);
//     console.log(response.body)
//   });
// }

router.get("/get-result-pdf", (req, res) => {
  // var config = {
  //   method: 'get',
  //   url: 'http://10.107.3.214/NovaWeb/WebViewer/api/Report?studyUID=1.2.840.10008.114051.42608.2021043011365655.2054943441&patientID=1200068373&patientGroup=PHI-UE&timestamp=2021-08-16T09:53:17.891Z',
  //   headers: {
  //     'Cookie': '.WEBVIEWERAUTH=C58713B7F4FE78C405A80B1A7FD496E812BB000D446B7AC2CACA78B82B55B7EE7C2C1D01F30407CA3D7A98F2097985E907A2CD46732534DED62FDC3A32E0C1890DC2A49FE716AE513C64CA48943E882AB35570FAB0D30B947AED70A0C45C40D7E185413F8F95275059B7E5D31BCB76B46DC248EF45E625BDCB79E28719712975C71D9C073AEA5252EA8FF48B42BF65F82827791CCE919F500817175507FAF4DC0D2ACF83C1CC85C443EA36936DEA03BDA7ACDB9CA6C8E0B415299AC0B5ED5FA495C89E1970E6D83B6E608125CD02E8FE8381D4D153B02BF94E9666CF4E3EAD2AFE747473B2A5D6C9109CE6C0800F83FB59887DFCAF3928247038AF5779E814E2DFEF50A901E066BA668B16025B4CEBE4; ASP.NET_SessionId=o0phawg1pqo1mfynjzbqxosm',
  //     'Content-Type': 'application/pdf'
  //   },

  // };
  // var stream = fs.readStream('/location/of/pdf');
  const filename =
    "http://10.107.3.214/NovaWeb/WebViewer/api/Report?studyUID=1.2.840.10008.114051.42608.2021043011365655.2054943441&patientID=1200068373&patientGroup=PHI-UE&timestamp=2021-08-16T09:53:17.891Z";
  // Be careful of special characters

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline;filename=${filename}`);
  res.setMaxListeners;
});

router.post("/encrypt", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.string) {
    res.send({ error: true, message: "String required!" });
    return;
  }
  res.send({ encrypted: helpers.encrypt(req.body.string) });
});

router.post("/decrypt", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.string) {
    res.send({ error: true, message: "String required!" });
    return;
  }
  res.send({ decrypted: helpers.decrypt(req.body.string) });
});

router.post("/encrypt-string", (req, res) => {
  if (!req.body.string) {
    res.send({ error: true, message: "String required!" });
    return;
  }
  res.send({ encrypted: helpers.encrypt(req.body.string) });
});

router.post("/decrypt-string", (req, res) => {
  if (!req.body.string) {
    res.send({ error: true, message: "String required!" });
    return;
  }
  res.send({ decrypted: helpers.decrypt(req.body.string) });
});

router.get("/encrypt/:string", (req, res) => {
  // DO NOT USE THIS ENDPINT ON LIVE APPS!
  // USED FOR TESTING ONLY!

  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }
  res.send({ encrypted: helpers.encrypt(req.params.string) });
});

router.get("/decrypt/:string", (req, res) => {
  // DO NOT USE THIS ENDPINT ON LIVE APPS!
  // USED FOR TESTING ONLY!

  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }
  res.send({ decrypted: helpers.decrypt(req.params.string) });
});

router.get("/id-assist/:id", (req, res) => {
  let sqlWhere = "";
  if (req.params.id) {
    sqlWhere = `where a.code ='${req.params.id}'`;
  }

  void (async function () {
    try {
      const sqlQuery1 = `
          SELECT a.code
          ,[IDTYPE] idType
          ,[ISSUEDATE] issueDate
          ,[VALID_UNTIL] validUntil
          ,a.LASTNAME lastName
          ,a.FIRSTNAME firstName
          ,a.MIDDLENAME middleName
          ,[MI] mi
          ,[COURSE] course
          ,a.COLLEGE college
          ,a.ADDRESS address
          ,SSS sss
          ,a.TIN tin
          ,[CONTACTNAME] contactName
          ,[CONTACTNO] contactNo
          ,[CONTACTADDRESS] contactAddress
          ,[TRANSACTION_DATE] transactionDate
          ,[ALUMNIID] alumniID
          ,[deleteDate] deleteDate
          ,b.NAME printedBy
        FROM [IDAssist].[dbo].[IDInfo] a
        join [UE database]..vw_Employees b on a.PRINT_BY = b.CODE
        ${sqlWhere}`;

      const sqlQuery = `
      SELECT
           a.code
          ,[IDTYPE] idType
          ,[ISSUEDATE] issueDate
          ,[VALID_UNTIL] validUntil
          ,a.LASTNAME lastName
          ,a.FIRSTNAME firstName
          ,a.MIDDLENAME middleName
          ,[MI] mi
          ,[COURSE] course
          ,a.COLLEGE college
          ,a.ADDRESS address
          ,SSS sss
          ,a.TIN tin
          ,[CONTACTNAME] contactName
          ,[CONTACTNO] contactNo
          ,[CONTACTADDRESS] contactAddress
          ,[TRANSACTION_DATE] transactionDate
          ,[ALUMNIID] alumniID
          ,[deleteDate] deleteDate
          ,[TRANS_TYPE] transType
          ,b.NAME printedBy
        FROM [IDAssist].[dbo].[IDInfoLogs] a
        join [UE database]..vw_Employees b on a.PRINT_BY = b.CODE
      ${sqlWhere}
        order by Transaction_Date desc`;
      await sql.connect(sqlConfig);
      const result1 = await sql.query(sqlQuery1);
      const result = await sql.query(sqlQuery);
      sql.close();

      let html = ``;

      html += `<table border='1' style="font-size:12px;border-collapse: collapse;" width='100%'>`;
      html += `<thead>
        <tr>
          <td colspan="2" style='text-transform:uppercase;font-size:22px;text-align:center;'> 
            ${result1.recordset[0].lastName}, ${result1.recordset[0].firstName} ${result1.recordset[0].middleName}
          </td>
        </tr>
      </thead>`;
      html += `
        <tbody>  
          <tr>
            <td>TRANSACTION DATE</td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].transactionDate
                .toISOString()
                .replace("T", " ")
                .replace("Z", " ")}
            </td>
          </tr>
          <tr>
            <td> ADDRESS </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].address}
            </td>
          </tr>
          <tr>
            <td> ISSUE DATE </td>
            <td style='text-align: center; text-transform:uppercase;'>
              ${result1.recordset[0].issueDate}
            </td>
          </tr>
          <tr>
            <td> VALID UNTIL </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].validUntil}
            </td>
          </tr>
          <tr>
            <td> COURSE </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].course}
            </td>
          </tr>
          <tr>
            <td> COLLEGE </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].college}
            </td>
          </tr>
          <tr>
            <td> CONTACT NAME </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].contactName}
            </td>
          </tr>
          <tr>
            <td> CONTACT NUMBER </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].contactNo}
            </td>
          </tr>
          <tr>
            <td> CONTACT ADDRESS </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].contactAddress}
            </td>
          </tr>
          <tr>
            <td> PRINTED BY: </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].printedBy}
            </td>
          </tr>
        </tbody>
        `;

      if (result1.recordset[0].alumniID !== null) {
        html += `<tr>
            <td> ALUMNI ID: </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${result1.recordset[0].alumniID}
            </td>
          </tr>`;
      }

      html += `<tr>
          <td colspan="2">&nbsp;</td>
        </tr>
        `;

      html += `</table>`;

      // Body

      html += `<table border='1' style="font-size:12px;border-collapse: collapse;" width='100%'>`;

      html += `<thead>
        <tr>
          <td colspan="2" style='text-transform:uppercase;font-size:22px;text-align:center;'> Print History </td>
        </tr>
      </thead>`;

      html += `<tbody>`;

      for (const history of result.recordset) {
        html += `
        <tr>
          <td>TRANSACTION DATE</td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.transactionDate
              .toISOString()
              .replace("T", " ")
              .replace("Z", " ")}
          </td>
        </tr>
        <tr>
          <td> ADDRESS </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.address}
          </td>
        </tr>
        <tr>
          <td> ISSUE DATE </td>
          <td style='text-align: center; text-transform:uppercase;'>
            ${history.issueDate}
          </td>
        </tr>
        <tr>
          <td> VALID UNTIL </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.validUntil}
          </td>
        </tr>
        <tr>
          <td> COURSE </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.course}
          </td>
        </tr>
        <tr>
          <td> COLLEGE </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.college}
          </td>
        </tr>
        <tr>
          <td> CONTACT NAME </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.contactName}
          </td>
        </tr>
        <tr>
          <td> CONTACT NUMBER </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.contactNo}
          </td>
        </tr>
        <tr>
          <td> CONTACT ADDRESS </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.contactAddress}
          </td>
        </tr>
        <tr>
          <td> PRINTED BY: </td>
          <td style='text-align:center; text-transform:uppercase;'>
            ${history.printedBy}
          </td>
        </tr>
        `;

        if (history.alumniID !== null) {
          html += `<tr>
            <td> ALUMNI ID: </td>
            <td style='text-align:center; text-transform:uppercase;'>
              ${history.alumniID}
            </td>
          </tr>`;
        }

        html += `<tr>
          <td colspan="2">&nbsp;</td>
        </tr>`;
      }

      html += `</tbody>`;

      // End of Body
      html += `</table>`;
      pdf
        .create(html, {
          format: "Letter",
          orientation: "portrait",
          border: {
            top: ".5in",
            right: ".5in",
            bottom: ".5in",
            left: ".5in",
          },
        })
        .toStream(function (err, stream) {
          // res.send(stream.pipe(fs.createWriteStream('./foo.pdf')));
          stream.pipe(res);
        });
      // res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/clear-patient-exit", (req, res) => {
  void (async function () {
    await helpers.transact(async (txn) => {
      const payload = req.body;
      try {
        await new sql.Request(txn)
          .query`INSERT INTO UERMHIMS..TableNotifications (
          CaseNo,
          NotificationType,
          Message,
          AcknowledgedBy
        ) VALUES (
          ${payload.caseNo},
          ${payload.notificationType},
          ${payload.message},
          ${payload.acknowledgedBy}
        );`;
        if (payload.autoDischarging === "true") {
          await new sql.Request(txn).query`UPDATE UERMMMC..Cases SET
              DISCHARGE = 'Y',
              DISCHARGEBY = ${payload.acknowledgedBy},
              DATEDIS = ${await helpers.currentDateTime()}
            WHERE caseno = ${payload.caseNo};`;
        }
        res.send({ success: true });
      } catch (error) {
        const err = { success: false, message: error };
        res.send(err);
        throw err;
      }
    });
  })();
});

router.get("/patients-cleared-exit", (req, res) => {
  void (async function () {
    let sqlWhere = "";
    if (req.query.type) {
      sqlWhere = `where notificationtype = '${req.query.type}' and (convert(date, Transdate) = convert(date, getDate()) or convert(date, Transdate) = convert(date, getDate() - 1))   `;
    }

    try {
      const sqlQuery = `select
        c.patientNo, 
        c.fullname,
        c.patientType,
        ER_GROUP= case when c.hostname in ('COVID-ER01','COVID-ER02','COVID-ER03','COVID-ER04') then 'COVID-ER' else 'EMERGENCY ROOM' end,
        tn.*  
      from UERMHIMS..TableNotifications tn
      join [UERMMMC].[dbo].[vw_EncounterCases] c on tn.CaseNo = c.caseNo
      ${sqlWhere}
      order by TransDate desc`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/patient-check-case", (req, res) => {
  let sqlWhere = "";
  if (req.query.caseNo) {
    sqlWhere = `where c.caseNo = '${req.query.caseNo}'`;
  } else {
    res.send({ error: true, message: "Invalid Parameters" });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `SELECT 
        c.*,
        dischargeStatus = case when c.discharge='Y' then 'D' else c.CASESTAT end,
        ehr=cast(case when isnull(ehr.caseno,'')='' then 0 else 1 end as bit),
        inf=cast(case when isnull(c.uermStudentEmployee,'') in ('','N/A') then 0 else 1 end as bit),
        tn.notificationType,
        tn.message,
        tn.transDate
      FROM [UERMMMC].[dbo].[vw_EncounterCases] c
      left join UERMHIMS..TableNotifications tn on c.caseNo = tn.caseNo  and NotificationType = 'CLEAREXITDISCHARGE'      
      left join UERMHIMS..vw_PatientWith_ehr ehr on c.CASENO=ehr.caseno
      ${sqlWhere}
      order by datetimeAdmitted desc`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

module.exports = router;

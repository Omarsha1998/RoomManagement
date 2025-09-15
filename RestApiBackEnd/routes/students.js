const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");

const folder = path.join(__dirname, "../uploads/students");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

router.get("/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";

  if (req.query.studentNo) {
    sqlWhere = `and b.CODE = '${req.query.studentNo}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
        select 
          a.UERMEmail,
          b.CODE,
          b.LASTNAME,
          b.MIDDLENAME,
          b.FIRSTNAME,
          b.BDATE,
          b.NAME,
          b.AGE,
          b.COLLEGE_CODE,
          b.COLLEGE_DESC,
          b.COURSE_CODE,
          b.COURSE_DESC,
          b.ADDRESS,
          b.TEL_NO,
          b.EMAIL,
          b.CONTACT_ADDRESS,
          b.semester
        from [UE database]..CANVAS_StudentEmail a
        join [UE database]..vw_Student b on b.CODE = a.SN
        and b.IS_ACTIVE = 1
          ${sqlWhere}
        order by name`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/search", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select distinct
        code sn,
        name,
        yl,
        college_desc college,
        course_desc course
      from [UE database]..vw_Student s
      where s.lastName like '%${req.body.lastName}%'
      and s.firstName like '%${req.body.firstName}%'
      and s.middleName like '%${req.body.middleName}%'
      and s.code like '%${req.body.sn}%'
      and s.IS_ACTIVE = 1
      order by name`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/add-vaccine", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec Infirmary..sp_AddVaccine
        '${req.body.sn}',
        '${req.body.vaccine}',
        '${req.body.date}',
        '${req.body.lotNo}',
        '${req.body.vaccinator}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-personal-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec [UE database]..sp_UpdateStudentRefExt
    '${req.body.sn}',
    '${req.body.isBeneficiary}',
    '${req.body.philHealth}',
    '${req.body.insurance}',
    '${req.body.noVaxReason}',
    '${req.body.firstDose}',
    '${req.body.firstDoseDate}',
    '${req.body.secondDose}',
    '${req.body.secondDoseDate}',
    '${req.body.booster}',
    '${req.body.boosterDate}',
    '${req.body.booster2}',
    '${req.body.boosterDate2}',
    '${req.body.streetAddress}',
    '${req.body.municipality}',
    '${req.body.country}',
    '${req.body.addressIntl}',
    '${req.body.streetAddressCondo}',
    '${req.body.municipalityCondo}',
    '${req.body.streetAddressMailing}',
    '${req.body.municipalityMailing}',
    '${req.body.mpn1}',
    '${req.body.mpn2}',
    '${req.body.landline}',
    '${req.body.mpnParent}',
    '${req.body.mpnGuardian}',
    '${req.body.vaccineFileName}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/send-email-otp", (req, res) => {
  const mailjet = require("node-mailjet").connect(
    process.env.MAIL_JET_PUBLIC_KEY,
    process.env.MAIL_JET_PRIVATE_KEY,
  );
  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "service-notification@uerm.edu.ph",
          Name: "UERM Service Notification",
        },
        To: [
          {
            Email: `${req.body.emailAddress}`,
            Name: `${req.body.name}`,
          },
        ],
        TemplateID: 3090061,
        TemplateLanguage: true,
        Subject: "UERM Student Portal OTP",
        Variables: {
          otpCode: `${req.body.otp}`,
        },
      },
    ],
  });
  request
    .then((result) => {
      res.send(result.body);
    })
    .catch((err) => {
      console.log(err.statusCode);
    });
});

router.get("/vaccine/:sn", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        v.id,
        v.code,
        s.name,
        s.COLLEGE_DESC college,
        s.COURSE_DESC course,
        v.vaccine,
        v.date,
        v.lotNo,
        v.vaccinator
      from Infirmary..Vaccine v
      join [ue database]..vw_Student s
        on v.code = s.code
      where v.deleted = 0
      and v.code = '${req.params.sn}'
      order by name, v.date desc`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/colleges", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    s.CollegeCode code,
    s.description,
    s.acronym
  from UERMMMC..SECTIONS s
  where s.CollegeCode is not null
  order by description`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/register-student-portal", (req, res) => {
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
        const form = new formidable.IncomingForm();
        form.uploadDir = folder;
        const requestID = "0000001";
        form.parse(req, (_, fields, files) => {
          // console.log('\n-----------')
          // console.log('Fields', fields)
          // lastname = fields.lastname
          // console.log('Received:', Object.keys(files))
          // console.log()
          res.send("Thank you");
          return fields.lastname;
        });
        form.on("file", function (field, file) {
          const date = new Date();
          const year = new Intl.DateTimeFormat("en", {
            year: "numeric",
          }).format(date);
          const month = new Intl.DateTimeFormat("en", {
            month: "2-digit",
          }).format(date);
          const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(
            date,
          );
          const formattedDate = `${year}${month}${day}`;
          fs.rename(
            file.path,
            `${form.uploadDir}/` + `${formattedDate}_${requestID}_${file.name}`,
            (err) => {
              if (err) throw err;
            },
          );
        });
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    *
  from [UE database]..[Student ReferenceExt] s
  where s.sn = '${req.query.sn}'`;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

module.exports = router;

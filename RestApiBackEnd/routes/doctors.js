const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const sqlHelper = require("../helpers/sqlQueries");

const sqlConfig = require("../config/database");

// SQL CONN
const sql = require("mssql");
const { response } = require("express");
router.use(sanitize);

const erDate = "convert(date,getdate())";
// const erDate = "'2021-05-10'";

router.get("/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from uermemr..vw_DoctorsInfo order by fullName`;
      const result = await sql.query(sqlQuery);
      res.send({
        doctors: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/validate-otp", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select top 1
        *
      from uermsms..outbox_smart o
      where o.mpn = '${req.body.mobileno}'
      and o.tag = 'DrPortal'
      and o.otp = '${req.body.otp}'
      and datediff(minute,o.transdate,getdate()) <= 20
      order by o.transdate desc`;
      // const sqlQuery = `select top 1
      //   *
      // from uermsms..outbox_smart o
      // where o.mpn = '${req.body.mobileno}'
      // and o.otp = '${req.body.otp}'
      // and datediff(minute,o.Datestamp,getdate()) <= 20
      // order by o.Datestamp desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/credentials/mobile/:mobileNo", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.mobileNo) {
    res.send({ error: "Mobile Number required!" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from UERMMMC..vw_DoctorsCredentials d
      where (d.mobileNo = '${req.params.mobileNo}'
      or d.mobileNoAlt = '${req.params.mobileNo}')
      and (d.mobileNo is not null or d.mobileNoAlt is not null)`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/validator/:drCode", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.drCode) {
    res.send({ error: "Dr Code is required!" });
    return;
  }
  const sqlQuery = sqlHelper.imagingResults({
    drCode: req.params.drCode,
  });
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `select
      //   id,
      //   'Result Encoding' resultTakenFrom,
      //   chargeDetailId,
      //   chargeSlipNo,
      //   description,
      //   caseno,
      //   physician,
      //   physicianName,
      //   technician,
      //   technicianName,
      //   resultDate,
      //   resultTime,
      //   convert(varchar(max),result) result,
      //   attachments,
      //   patientName,
      //   revCode,
      //   '' url
      // from emr..vw_ImagingCharges c
      // where c.physician = '${req.params.drCode}'
      // and c.isValidated = 0

      // union

      // select
      //   Id id,
      //   'RIS' resultTakenFrom,
      //   ChargeProcedureID chargeDetailId,
      //   ChargeslipNo chargeSlipNo,
      //   description description,
      //   CaseNo caseno,
      //   DRCode physician,
      //   RequestingPhysicianName physicianName,
      //   EmpCode technician,
      //   RawRadTech technicianName,
      //   resultDate,
      //   null resultTime,
      //   convert(varchar(max),RawResult) result,
      //   '' attachments,
      //   concat(LastName,', ',Firstname,' ',MiddleName) patientName,
      //   RevCode revCode,
      //   convert(varchar(max),ResultURL) url
      // from  UERM_LIS..vw_HIS_RIS_Integration
      // where DRCode = '${req.params.drCode}'`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/my-patients", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec EMR..Usp_jf_GetDoctorsPatients
    '${req.body.drCode}',
    '${req.body.admissionFrom}',
    '${req.body.admissionTo}',
    '${req.body.lastName}',
    '${req.body.firstName}'
  `;

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

router.post("/patient-results", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select * from emr..vw_DoctorPF pf
  join EMR..vw_PatientResultsV2 r
    on pf.caseno = r.caseno
  where pf.drCode = '${req.body.drCode}'
  order by name`;

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

router.get("/patients/:drCode", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.drCode) {
    res.send({ error: "DR Code required!" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from EMR..vw_DoctorsPatients d
      where d.drCode = '${req.params.drCode}'
      order by chargeDate`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/patients-pf/:drCode", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.drCode) {
    res.send({ error: "DR Code required!" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from EMR..vw_PFList d
      -- where d.drCode = '${req.params.drCode}'
      where d.drCode = '137'
      order by dateAdmitted desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/er-patients", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from UERMMMC..vw_ERPatients e
      where convert(date,e.dateAdmitted) = ${erDate}
      and e.isDischarged = 0
      order by patientName`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/validate-code/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.code) {
    res.send({
      error: true,
      message: "DR Code is required!",
    });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        r.appUrl,
        case
          -- when 1 = 1 then 1
          when datediff(minute,r.createDate,getdate()) <= r.validMins then 1
          else 0
        end isValid,
        r.code,
        d.mpn1 mobileno,
        d.email
      from ITMgt..Redirects r
      join UERMMMC..Doctors d
        on r.code = d.code
      where urlCode = '${req.params.code}'`;
      const result = await sql.query(sqlQuery);
      if (result.recordset.length == 0) {
        res.send({
          error: true,
          msg: "Validation code is invalid!",
        });
        return;
      }
      res.send({
        error: false,
        ...result.recordset[0],
        msg:
          result.recordset[0].isValid == 0
            ? "Your validation code is already expired!"
            : "Please wait while we login your doctors portal.",
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/login", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: true, message: appMain.error });
    return;
  }
  if (!req.body.mobileno) {
    res.send({
      error: true,
      message: "Mobile number is required!",
    });
    return;
  }
  if (!req.body.email) {
    res.send({
      error: true,
      message: "Email is required!",
    });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_DrPortalLogin
        '${req.body.mobileno}',
        '${req.body.email}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/send-otp/:mobileno", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.mobileno) {
    res.send({ error: "ID Number required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_DrPortalOTP
        '${req.params.mobileno}'
      `;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/secretary/mpn/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.code) {
    res.send({ error: "ID Number required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        code,
        contactno mobileNo,
        lastName,
        firstName,
        middleName
      from IDAssist..idinfo
      where idtype = 'dsec'
      and CODE = '${req.params.code}'`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/testDate", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [UERMEMR]..[HSFetchData] '0976707B','DISCHARGE INSTRUCTION','5272','10.107.4.218'`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/patient-er-charges", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        r.id resultId,
        c.caseno,
        r.result,
        c.description
      from UERMMMC..vw_PatientCharges c
      join EMR..ImagingResults r
        on r.chargeDetailId = c.chargeDetailId
      where convert(date,c.chargeDate) = ${erDate}
      and c.revCode in (select revCode from EMR..vw_Modalities)`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/appointments", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.drcode) {
    res.send({ error: "Doctors Code required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from UERMEMR..vw_PatientAppointments a
        where a.drCode = '${req.query.drcode}'`;
      const result = await sql.query(sqlQuery);
      res.send({
        appointments: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/personal-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.user) {
    res.send({ error: "User required" });
    return;
  }
  if (!req.body.lastName) {
    res.send({ error: "Last Name required" });
    return;
  }
  if (!req.body.firstName) {
    res.send({ error: "First Name required" });
    return;
  }
  if (!req.body.middleName) {
    res.send({ error: "Middle Name required" });
    return;
  }
  if (!req.body.gender) {
    res.send({ error: "Gender required" });
    return;
  }
  if (!req.body.specialization) {
    res.send({ error: "Specialization required" });
    return;
  }
  if (!req.body.lic) {
    res.send({ error: "LIC required" });
    return;
  }
  if (!req.body.licExpiry) {
    res.send({ error: "LIC Expiration required" });
    return;
  }
  if (!req.body.empCode) {
    res.send({ error: "Employee Code required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_SaveDoctorsInfo
        '${req.body.user}',
        '${req.body.empCode}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.gender}',
        '${req.body.specialization}',
        '${req.body.lic}',
        '${req.body.licExpiry}',
        '${helpers.getIp(req.connection.remoteAddress)}'`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

module.exports = router;

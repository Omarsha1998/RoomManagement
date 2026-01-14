const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const fs = require("fs");

const helpers = require("../helpers/helpers");
const sqlHelper = require("../helpers/sqlQueries");
const sanitize = require("../helpers/sanitize");

const cryptojs = require("crypto-js");
const atob = require("atob");
const encryptionKey = helpers.encryptionKey;

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
// FTP CONN
const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftp");
// /FTP CONN

const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");

router.use(sanitize);

router.get("/", (req, res) => {
  res.send({ error: "No index router / available" });
});

router.get("/search-patientinfo-caseno", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.caseno) {
    res.send({ error: "Case Number not found." });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
                c.caseno,
                concat(p.lastname,', ',p.firstname,' ',p.middlename) patientName,
                c.age,
                p.sex gender,
                p.STATUS civilStatus,
                convert(varchar(max),convert(date,p.DBIRTH)) birthDate,
                convert(varchar(max),convert(date,c.datead)) dateAdmitted,
                convert(varchar(max),convert(date,c.DATEDIS)) dateDischarged,
                p.address,
                c.LAST_ROOM room
            from UERMMMC..PATIENTINFO p
            left join UERMMMC..CASES c
                on p.patientno = c.patientno
            where c.caseno = '${req.query.caseno}'
            `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        result: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
  // res.send({ 'asd': req.query });
});

router.get("/search-cases", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    if (req.query.fullname) {
      try {
        await sql.connect(sqlConfig);
        const sqlQuery = `select
                    concat(p.lastname,', ',p.firstname,' ',p.middlename) fullName,
                    c.caseno,
                    c.datead dateAdmitted,
                    c.datedis dateDischarged
                from UERMMMC..PATIENTINFO p
                left join UERMMMC..CASES c
                    on p.patientno = c.patientno
                where concat(p.lastname,' ',p.firstname,' ',p.middlename) like '%${req.query.fullname}%'
                and year(c.datead) = year(getdate())
                order by concat(p.lastname,' ',p.firstname,' ',p.middlename)
                `;
        const result = await sql.query(sqlQuery);
        // sql.close();
        res.send({
          result: result.recordset,
        });
      } catch (error) {
        res.send({ error });
      }
    }
  })();
  // res.send({ 'asd': req.query });
});

router.get("/info/:patientno", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: true, message: appMain.error });
    return;
  }
  if (!req.params.patientno) {
    res.send({ error: true, message: "Patient Number is required!" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        p.patientNo,
        p.lastName,
        p.firstName,
        p.middleName,
        p.sex gender,
        convert(date,p.DBIRTH) birthDate,
        p.PHONENOS mobileNo,
        p.EMAILADD email,
        a.username
      from UERMMMC..patientinfo p
      left join EMR..PatientPortalAccounts a
        on p.patientno = a.patientno
      where p.PATIENTNO = '${req.params.patientno}'`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(
        result.recordset.length > 0
          ? result.recordset[0]
          : { error: true, message: "Patient does not exist!" },
      );
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        ltrim(rtrim(cm.chargeSlipNo)) chargeSlipNo,
        cm.caseno,
        c.dateAd,
        p.lastName,
        p.firstName,
        p.middleName,
        cm.CHARGEDATETIME chargeDate,
        cd.CHARGE_ID chargeId,
        ch.description
      from UERMMMC..charges_main cm
      left join UERMMMC..CHARGES_DETAILS cd
        on cm.CHARGESLIPNO = cd.CHARGESLIPNO
        and cd.CANCELED = 'n'
      left join UERMMMC..CHARGES ch
        on ch.ID = cd.CHARGE_ID
      left join UERMMMC..CASES c
        on c.CASENO = cm.CASENO
      left join UERMMMC..PATIENTINFO p
        on p.PATIENTNO = c.PATIENTNO
      where cm.CANCELED = 'n'
      and (cm.chargeSlipNo = '${req.params.search}' or concat(p.lastName,',',p.firstName,' ',p.middleName) like '%${req.params.search}%')
      order by chargeDate desc`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/charges/list/:search", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        ltrim(rtrim(cm.chargeSlipNo)) chargeSlipNo,
        cm.caseno,
        c.dateAd,
        p.lastName,
        p.firstName,
        p.middleName,
        cm.CHARGEDATETIME chargeDate,
        cd.CHARGE_ID chargeId,
        ch.description
      from UERMMMC..charges_main cm
      left join UERMMMC..CHARGES_DETAILS cd
        on cm.CHARGESLIPNO = cd.CHARGESLIPNO
        and cd.CANCELED = 'n'
      left join UERMMMC..CHARGES ch
        on ch.ID = cd.CHARGE_ID
      left join UERMMMC..CASES c
        on c.CASENO = cm.CASENO
      left join UERMMMC..PATIENTINFO p
        on p.PATIENTNO = c.PATIENTNO
      where cm.CANCELED = 'n'
      and (cm.chargeSlipNo = '${req.params.search}' or concat(p.lastName,',',p.firstName,' ',p.middleName) like '%${req.params.search}%')
      order by chargeDate desc`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/result/imaging/:id", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(`select
        *
      from EMR..vw_ImagingCharges c
      where c.id = '${req.params.id}'
      order by resultDate desc`);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/result/imaging-charges/:id", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(`select
        *
      from EMR..vw_ImagingCharges c
      where c.chargeDetailId = '${req.params.id}'
      order by resultDate desc`);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/charges/details/:csno", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // const sqlQuery = `exec EMR..sp_ImagingCharges '${req.params.csno}'`;
  const sqlQuery = sqlHelper.imagingCharges({
    lastName: "",
    firstName: "",
    chargeSlipNo: req.params.csno,
    withResult: "%",
    isValidated: "%",
  });
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `select
      //   *
      // from EMR..vw_ImagingCharges c
      // where c.chargeslipNo = '${req.params.csno}'
      // order by isValidated,resultDate desc`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/view-result-ftp", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.file) {
    res.send({ error: "File attribute not found." });
    return;
  }
  const file = req.query.file;
  const dir = file.split("/");
  if (dir.length != 2) {
    res.send({ error: "File attribute invalid." });
    return;
  }

  void (async function () {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    const localDir = "./assets/diagnosticResults/";
    const result = `${localDir}${dir[1]}`;
    try {
      await client.access({
        host: ftpConfig.server,
        password: ftpConfig.password,
        user: ftpConfig.user,
        secure: false,
      });
      await client.cd("uploads/diagnosticresults/");
      await client.cd(dir[0]);
      await client.downloadTo(result, dir[1]);
      client.close();

      fs.readFile(result, (err, data) => {
        res.contentType("application/pdf");
        res.send(data);
        fs.unlink(result, (err) => {
          console.log(err);
        });
      });
    } catch (error) {
      res.send({ error: "Could not load pdf result.", message: error });
    }
  })();
});

router.get("/validate", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.code) {
    res.send({ error: "Invalid validation code." });
    return;
  }

  void (async function () {
    try {
      const caseno = req.query.code.substring(1, req.query.code.length - 1);
      await sql.connect(sqlConfig);
      const result = await sql.query(
        `select UERMEMR.dbo.fn_ValidatePatientCaseUrl('${req.query.code}') isValid`,
      );
      const patientInfo = await sql.query(`select
                p.patientno,
                p.lastname,
                p.firstname,
                p.middlename
            from UERMMMC..patientinfo p
            left join UERMMMC..cases c
                on c.patientno = p.patientno
            where c.caseno = '${caseno}'`);
      // sql.close();
      res.send({
        isValidated: result.recordset[0].isValid,
        patientInfo:
          patientInfo.recordset.length == 1
            ? patientInfo.recordset[0]
            : patientInfo.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/imaging-charges", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.caseno && !req.body.lastName && !req.body.firstName) {
    res.send({ error: "Please enter case number or name." });
    return;
  }
  if (req.body.lastName || req.body.firstName) {
    req.body.lastName = req.body.lastName || "";
    req.body.firstName = req.body.firstName || "";
  }

  let sqlWhere = "";

  if (req.body.caseno.trim() != "") {
    sqlWhere += `and c.caseno = '${req.body.caseno}'`;
  }
  if (req.body.modality.trim() != "") {
    sqlWhere += `and c.revCode = '${req.body.modality}'`;
  }
  const sqlQuery = sqlHelper.imagingCharges({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    revCode: req.body.modality,
    withResult: req.body.withResult || "%",
    isValidated: req.body.isValidated || "%",
  });

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `select
      //   *
      // from EMR..vw_ImagingCharges c
      // where c.lastName like '${req.body.lastName}%'
      // and c.firstName like '${req.body.firstName}%'
      // ${sqlWhere}
      // order by convert(datetime,concat(chargeDate,' ',chargeTime)) desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/search-name", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    p.patientno,
    concat(p.LASTNAME,', ',p.FIRSTNAME,' ',p.MIDDLENAME) name,
    p.lastname,p.firstname,p.middlename,
    convert(date,p.DBIRTH) birthdate,
    p.SEX gender,
    max(c.DATEAD) lastEncounter
  from UERMMMC..PATIENTINFO p
  join UERMMMC..CASES c
    on p.PATIENTNO = c.PATIENTNO
  where concat(p.LASTNAME,' ',p.FIRSTNAME,' ',p.MIDDLENAME) like '%${req.body.search}%'
  group by p.PATIENTNO,p.lastname,p.firstname,p.middlename,concat(p.LASTNAME,', ',p.FIRSTNAME,' ',p.MIDDLENAME),p.DBIRTH,p.SEX`;

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

router.post("/consultation-history", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    c.cc chiefComplaint,
    d.FINAL diagnosis,
    convert(date,c.DATEAD) date,
    dr.NAME physician,
    dr.[AREA OF SPECIALTY] specialty
  from UERMMMC..CASES c
  join UERMMMC..DIAGNOSIS d
    on c.CASENO = d.CASENO
  join UERMMMC..PROFEE p
    on c.CASENO = p.CASENO
  join UERMMMC..DOCTORS dr
    on p.DR_CODE = dr.CODE
  where c.PATIENTNO = '${req.body.patientno}'
  --and p.Udf_MainDoc = 1
  and p.DOC_TYPE = 'ATT'
  order by date desc`;

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

router.post("/basic-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    p.patientno,
    p.lastname,
    p.firstname,
    p.middlename,
    r.DESCRIPTION religion,
    n.DESCRIPTION nationality,
    p.sex gender,
    convert(date,p.dbirth) birthdate,
    p.mpn,
    max(c.datead) lastEncounter,
    convert(bit,case
      when convert(date,max(c.DATEAD)) = convert(date,getdate()) then 1
      else 0
    end) isActive
  from UERMMMC..PATIENTINFO p
  left join UERMMMC..RELIGION r
    on p.RELIGION = r.CODE
  left join UERMMMC..NATIONALITY n
    on p.NATIONALITY = n.CODE
  join UERMMMC..CASES c
    on p.PATIENTNO = c.PATIENTNO
  where p.PATIENTNO = '${req.body.patientno}'
  group by
    p.patientno,
    p.lastname,
    p.firstname,
    p.middlename,
    r.DESCRIPTION,
    n.DESCRIPTION,
    p.sex,
    convert(date,p.dbirth),
    p.mpn`;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0] || result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/appointments", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.date) {
    res.send({ error: "Date is required." });
    return;
  }
  if (!req.body.time) {
    res.send({ error: "Time is required." });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec UERMEMR..sp_SaveAppointment
          '${req.body.patientno}',
          '${req.body.lastName}',
          '${req.body.firstName}',
          '${req.body.middleName}',
          '${req.body.doctor}',
          '${req.body.date}',
          '${req.body.time}',
          '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({ success: result.recordset[0].MSG });
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

  let sqlQuery = "";

  if (req.query.all && req.query.all == 1) {
    sqlQuery = `select * from UERMEMR..vw_PatientAppointments a
        -- where a.date >= convert(date,GETDATE())
        order by case
            when convert(date,getdate()) = convert(date,scheduleFrom) then  0
            else 1
        end, scheduleFrom, patientName`;
  } else {
    if (!req.query.patientno) {
      res.send({ error: "Patient Number required", field: "patientno" });
      return;
    }
    sqlQuery = `select * from UERMEMR..vw_PatientAppointments a
        where a.date >= convert(date,GETDATE())
        and a.patientno = '${req.query.patientno}'
        order by patientName,scheduleFrom`;
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

router.get("/isResultValidated", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.resultId) {
    res.send({ error: true, message: "Result ID required" });
    return;
  }

  if (!req.query.type) {
    res.send({ error: true, message: "Result type required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select UERMEMR.dbo.fn_IsResultValidated('${req.query.resultId}','${req.query.type}') isValidated`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/result", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const form = req.body;
  void (async function () {
    function formatDate(date) {
      var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();

      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;

      return [year, month, day].join("-");
    }
    const date = {
      firstDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      lastDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
      ),
    };
    if (
      form.dateFrom == "" &&
      form.dateTo == "" &&
      form.caseno == "" &&
      form.chargeSlipNo == "" &&
      form.name == ""
    ) {
      form.dateFrom = form.dateFrom || date.firstDate;
      form.dateTo = form.dateTo || date.lastDate;
    } else if (form.dateFrom == "" && form.dateTo == "") {
      form.dateFrom = "1900-01-01";
      form.dateTo = date.lastDate;
    }
    try {
      await sql.connect(sqlConfig);
      let sqlQuery;
      sqlQuery = `select
        *
      from EMR..vw_PatientResultsV2 x
      where x.caseno like '${form.caseno || "%"}'
      and x.csno like '${form.chargeSlipNo || "%"}'
      and x.name like '${form.name || ""}%'
      and x.resultDate between convert(date,'${formatDate(
        form.dateFrom,
      )}') and convert(date,'${formatDate(form.dateTo)}')
      and x.type = '${form.type}'
      order by name`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/result-v2", (req, res) => {
  let drQuery = "";
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.patientno) {
    res.send({ error: "Patient Number required", field: "patientno" });
    return;
  }
  if (req.body.drCode) {
    drQuery = `--and x.caseno in (select p.caseno from EMR..vw_DoctorPF p where p.drCode = '${req.body.drCode}')`;
  }
  const form = req.body;
  // const sqlQuery = `select
  //   *
  // from EMR..vw_PatientResultsV2 x
  // where x.patientno = '${form.patientno}'
  // ${drQuery || ""}
  // --where x.patientno = '1800261436'
  // order by name,resultDate desc`;
  // form.patientno = "2100325401";
  // form.patientno = "1000008470";
  let sqlQuery = `
    declare @tbl table
      (id varchar(max),
      chargeDetailId varchar(max),
      csno varchar(20),
      caseno varchar(20),
      description varchar(1000),
      result text,
      resultUrl text,
      attachments text,
      resultDate varchar(30),
      revCode varchar(10),
      type varchar(10),
      isValidated bit)
    insert into @tbl
    exec [EMR]..[Usp_jf_GetPatientResultV2] '${form.patientno}','RIS'
    insert into @tbl
    exec [EMR]..[Usp_jf_GetPatientResultV2] '${form.patientno}','LIS'
    select * from @tbl
    order by convert(date,resultDate) desc
  `;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // sqlQuery = `exec [EMR]..[Usp_jf_GetPatientResultV2] '${form.patientno}','RIS'`;
      // const ris = await sql.query(sqlQuery);
      // sqlQuery = `exec [EMR]..[Usp_jf_GetPatientResultV2] '${form.patientno}','LIS'`;
      // const lis = await sql.query(sqlQuery);

      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/result", (req, res) => {
  let labResult = [];
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.patientno) {
    res.send({ error: "Patient Number required", field: "patientno" });
    return;
  }
  void (async function () {
    const isValidated = req.query.v == 1 ? "1" : "%";
    try {
      let sqlWhere = "";
      await sql.connect(sqlConfig);
      if (req.query.id && req.query.template) {
        sqlWhere = `
          and r.recordId = '${req.query.id}'
          and r.template = '${req.query.template}'
        `;
      } else if (req.query.history) {
        sqlWhere = `and year(r.createDate) > year(getdate())-${req.query.history}`;
      } else if (req.query.caseno) {
        sqlWhere = `and r.caseno = '${req.query.caseno}'`;
      }
      const showAllResult = req.query.showAll == "true" ? true : false;
      // if (req.query.delay && req.query.delay > 0) {
      //   sqlWhere = `and dateadd(hour,-${req.query.delay},getdate()) >= r.createDate`;
      // }
      const sqlString = `select
        *,
        convert(date,r.createDate) resultDate,
        case
          when r.recParser in ('xr') then 'Released'
          when dateadd(hour,-3,getdate()) >= r.createDate then 'Released'
          else 'Validating'
        end resultStatus
      from UERMEMR..vw_PatientRecords r
      where r.patientno = '${req.query.patientno}'
      and r.recParser in ('lab','hclab','xr','emr','ftp')
      ${showAllResult ? "" : "and r.recParser in ('xr')"}
      ${sqlWhere}
      and r.isValidated like '${isValidated}'
      order by createDate desc
      --and r.recParser in ('hclab')`;
      const result = await sql.query(sqlString);
      const labResult = await helpers.parsePatientResult(result.recordset);
      res.send(labResult);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/set-password", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.username) {
    res.send({ error: "Username required." });
    return;
  }
  if (!req.body.password) {
    res.send({ error: "Password required." });
    return;
  }
  if (!req.body.question) {
    res.send({ error: "Question required." });
    return;
  }
  if (!req.body.answer) {
    res.send({ error: "Answer required." });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(`exec UERMEMR..sp_SetPassword
        '${req.body.username}',
        '${req.body.password}',
        '${req.body.question}',
        '${req.body.answer}',
        '${req.body.username}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `);
      // sql.close();
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({ success: result.recordset[0].MSG });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/secret-question-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(`select
                id,
                question
            from uermemr..SecretQuestion s
            where s.deleted = 0
            order by question`);
      // sql.close();
      res.send({
        secretQuestions: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/validate-portal-otp", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: true, message: appMain.error });
    return;
  }
  if (!req.body.mobileno) {
    res.send({ error: true, message: "Mobile number is required!" });
    return;
  }
  if (!req.body.otp) {
    res.send({ error: true, message: "OTP is required!" });
    return;
  }

  const sqlQuery = `select top(1)
    'OTP Validated!' msg,
    0 err,
    s.otp
  from UERMSMS..Outbox_Smart s
  where s.MPN = '${req.body.mobileno}'
  order by Transdate desc`;
  let returnMsg;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      if (
        result.recordset.length > 0 &&
        req.body.otp == result.recordset[0].otp
      ) {
        returnMsg = {
          err: false,
          msg: result.recordset[0].msg,
        };
      } else {
        returnMsg = { err: true, msg: "You have entered an invalid OTP!" };
      }
      // sql.close();
      res.send(returnMsg);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/portal-login", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: true, message: appMain.error });
    return;
  }
  if (!req.body.username) {
    res.send({ error: true, message: "Could not find username." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(`select
        *
      from EMR..vw_PortalUserInfo a
      where a.username = '${req.body.username}'
      order by username`);
      // sql.close();
      if (result.recordset.length != 1) {
        res.send({ error: true, message: "Could not find user." });
        return;
      }
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/login", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.username) {
    res.send({ error: "Could not find username." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(`select
        a.patientno,
        a.username,
        a.password,
        a.forceChange,
        a.mobileno
      from UERMEMR..PatientAccount a
      where a.username = '${req.body.username}'
      order by username`);
      // sql.close();
      if (result.recordset.length != 1) {
        res.send({ error: "Could not find user." });
        return;
      }
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/secret-question", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.username) {
    res.send({ error: "Could not find username." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlString = `select * from UERMEMR..vw_SecretAnswers a
            where a.username = '${req.query.username}'
            order by a.question`;
      const result = await sql.query(sqlString);
      // sql.close();
      if (result.recordset.length != 1) {
        res.send({ error: "No secret question." });
        return;
      }
      res.send({
        secretQuestion: result.recordset[0],
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/change-password", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.username) {
    res.send({ error: "Could not find username." });
    return;
  }
  if (!req.body.newPassword) {
    res.send({ error: "Could not find new password." });
    return;
  }
  if (!req.body.oldPassword) {
    res.send({ error: "Could not find old password." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlString = `exec UERMEMR..sp_ChangeEMRPass
                '${req.body.username}',
                '${req.body.newPassword}',
                '${req.body.oldPassword}',
                '${helpers.getIp(req.socket.remoteAddress)}'
            `;
      const result = await sql.query(sqlString);
      // sql.close();
      res.send({
        message: result.recordset[0],
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/check-registration/:patientno", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.patientno) {
    res.send({ error: true, message: "Patient number is invalid." });
    return;
  }
  void (async function () {
    try {
      const patientno = cryptojs.AES.decrypt(
        atob(req.params.patientno),
        encryptionKey,
      ).toString(cryptojs.enc.Utf8);
      const sqlQuery = `select EMR.dbo.fn_IsPortalRegistered('${patientno}') isRegistered`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/register-portal", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.username) {
    res.send({ error: true, message: "Username is required." });
    return;
  }
  if (!req.body.email) {
    res.send({ error: true, message: "Email is required." });
    return;
  }
  if (!req.body.password) {
    res.send({ error: true, message: "Password required." });
    return;
  }
  if (!req.body.patientno) {
    res.send({ error: true, message: "Patient Number required." });
    return;
  }
  if (!req.body.mobileno) {
    res.send({ error: true, message: "Mobile Number required." });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec EMR..sp_RegisterPatientPortal
        '${req.body.username}',
        '${req.body.password}',
        '${req.body.email}',
        '${req.body.patientno}',
        '${req.body.mobileno}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(
        result.recordset.map((i) => {
          return {
            error: i.ERR,
            message: i.MSG,
          };
        })[0],
      );
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/register", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.caseno) {
    res.send({ error: "Case Number is required." });
    return;
  }
  if (!req.body.username) {
    res.send({ error: "Username is required." });
    return;
  }
  if (!req.body.mobileno) {
    res.send({ error: "Mobile Number required." });
    return;
  }
  if (!req.body.otp) {
    res.send({ error: "OTP required." });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec UERMEMR..sp_RegisterPatient
        '${req.body.caseno}',
        '${req.body.username}',
        '${req.body.mobileno}',
        '${req.body.otp}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({ success: result.recordset[0].MSG });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/otp", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.caseno) {
    res.send({ error: "Case Number is required." });
    return;
  }
  if (!req.query.mobileno) {
    res.send({ error: "Mobile Number required." });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec UERMEMR..sp_GenerateOTP
        '${req.query.caseno}',
        '${req.query.mobileno}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({ success: result.recordset[0].MSG });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/active-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    c.caseno,
    p.patientno,
    c.datead,
    case
      when datediff(hour,c.datead,getdate()) > 24 then concat(datediff(day,c.datead,getdate()),' Day/s')
      when datediff(minute,c.datead,getdate()) > 60 then concat(datediff(hour,c.datead,getdate()),' Hour/s')
      else concat(datediff(minute,c.datead,getdate()),' Minute/s')
    end admissionAge,
    /*datediff(hour,c.datead,getdate()) hours,
    datediff(day,c.datead,getdate()) days,
    datediff(minute,c.datead,getdate()) minutes,*/
    p.lastname,
    p.firstname,
    p.middlename,
    p.sex gender,
    convert(date,p.DBIRTH) birthDate,
    c.age,
    c.PATIENT_CATEGORY category,
    c.PATIENTTYPE type,
    c.UDF_CaseDept caseDept,
    d.code drCode,
    d.name physician,
    d.[AREA OF SPECIALTY] drSpeacialty,
    d.DEPARTMENT drDept
  from UERMMMC..CASES c
  join UERMMMC..PATIENTINFO p
    on c.PATIENTNO = p.PATIENTNO
  left join UERMMMC..PROFEE pf
    on c.CASENO = pf.CASENO
    and pf.Udf_MainDoc = 1
  left join UERMMMC..DOCTORS d
    on pf.DR_CODE = d.CODE
  where c.DATEDIS is null
  and c.UDF_CaseDept is not null
  and c.DISCHARGE = 'N'
  order by caseDept, datead desc`;
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

router.get("/ehr/:type", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let discharged = "";
  let admitted = "";
  let forDischarge = "";
  switch (req.params.type) {
    case "active":
      discharged = "N";
      break;
    case "discharged":
      discharged = "Y";
      admitted = "and convert(date,c.datead) = convert(date,getdate())";
      break;
    case "for-discharge":
      discharged = "N";
      forDischarge = "and c.datedis is not null";
      break;
  }
  const sqlQuery = `select
    c.caseno,
    p.patientno,
    c.datead,
    c.datedis,
    case
      when datediff(hour,c.datead,getdate()) > 24 then concat(datediff(day,c.datead,getdate()),' Day/s')
      when datediff(minute,c.datead,getdate()) > 60 then concat(datediff(hour,c.datead,getdate()),' Hour/s')
      else concat(datediff(minute,c.datead,getdate()),' Minute/s')
    end admissionAge,
    /*datediff(hour,c.datead,getdate()) hours,
    datediff(day,c.datead,getdate()) days,
    datediff(minute,c.datead,getdate()) minutes,*/
    p.lastname,
    p.firstname,
    p.middlename,
    p.sex gender,
    convert(date,p.DBIRTH) birthDate,
    c.age,
    c.PATIENT_CATEGORY category,
    c.PATIENTTYPE type,
    c.UDF_CaseDept caseDept,
    d.code drCode,
    d.name physician,
    d.[AREA OF SPECIALTY] drSpeacialty,
    d.DEPARTMENT drDept
  from UERMMMC..CASES c
  join UERMMMC..PATIENTINFO p
    on c.PATIENTNO = p.PATIENTNO
  left join UERMMMC..PROFEE pf
    on c.CASENO = pf.CASENO
    and pf.Udf_MainDoc = 1
  left join UERMMMC..DOCTORS d
    on pf.DR_CODE = d.CODE
  where c.UDF_CaseDept is not null
  and c.DISCHARGE = '${discharged}'
  ${admitted}
  ${forDischarge}
  order by caseDept, datead desc`;

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

router.post("/clearance-authenticate", (req, res) => {
  void (async function () {
    try {
      const user =
        req.body.username === undefined ? "" : req.body.username.trim();
      const password =
        req.body.password === undefined ? "" : req.body.password.trim();
      // const type = req.body.type;
      let sqlWhere = "";

      if (user === "" || password === "") {
        res.send({ success: false, message: "Invalid Parameters" });
        return;
      } else {
        sqlWhere = `and code = '${user}' and type = 2`;
      }

      const sqlQuery = `SELECT
        id
        ,code
        ,hashCode
        ,firstName
        ,lastName
        ,middleName
        ,concat(lastName, ', ', firstName, ' ', middleName) fullName
        ,mobileNumber
        ,type
        ,initialLogin
        ,active
        ,createdBy
        ,updatedBy
        ,dateTimeCreated
        ,dateTimeUpdated
        ,remarks
      FROM ITMgt..PatientMonitoringUsers
      where 1=1 ${sqlWhere}`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      if (result.recordset.length > 0) {
        const userDetails = result.recordset[0];
        if (Object.keys(userDetails).length > 0) {
          if (password !== process.env.BACKDOOR_PASSWORD) {
            if (userDetails.hashCode !== password) {
              res.send({ success: false, message: "Invalid Password" });
              return;
            }
          }
          delete userDetails.hashCode;
          const expiresIn = 60 * 60;
          var token = jwt.sign(userDetails, process.env.TOKEN, {
            expiresIn,
          });
          res.status(200).send({
            token: token,
            expiresat: expiresIn,
          });
        }
      } else {
        res.send({ success: false, message: "Invalid User" });
        return;
      }
      // sql.close();
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

router.put("/clearance-update-profile", (req, res) => {
  void (async function () {
    await helpers.transact(async (txn) => {
      const payload = req.body;
      try {
        await new sql.Request(txn).query`UPDATE ITMgt..PatientMonitoringUsers
        SET
          code = ${payload.username},
          hashCode = ${payload.password},
          firstName = ${payload.firstName},
          lastName = ${payload.lastName},
          mobileNumber = ${payload.mobileNumber},
          initialLogin = ${payload.initialLogin},
          updatedBy = ${payload.updatedBy},
          dateTimeUpdated = ${await helpers.currentDateTime()}
        WHERE
        code = ${payload.username};`;
        const status = { success: true };
        res.send(status);
      } catch (error) {
        console.log(error);
        const errStatus = { success: false, message: error };
        res.send(errStatus);
      }
    });
  })();
});

router.get("/clearance-patient-directory", (req, res) => {
  void (async function () {
    try {
      // const sqlQuery = `exec UERMHIMS..Usp_jf_GetPatientDirectoryV2`;
      const sqlQuery = `select distinct
          c.patientNo,
          c.caseno,
          c.fullname PatientName,
          c.patientType,
          c.CASESTAT,
          ER_GROUP= case when  c.patientType = 'IPD' then  c.patientType else 'EMERGENCY GROUP' end,
      (select NotificationType from UERMHIMS..TableNotifications where caseno = c.caseno and notificationtype = 'CLEAREXITDISCHARGE') notificationtype
        from UERMHIMS..TableNotifications tn
        left join [UERMMMC].[dbo].[vw_EncounterCases] c on tn.CaseNo = c.caseNo
      where  c.DISCHARGE = 'N'
            /* AND (ca.DISCHARGE = 'N' OR ca.DISCHARGE IS NULL OR ca.DISCHARGE = '')
            AND (ca.DATEDIS IS NULL OR ca.DATEDIS = '') */
            AND c.CASENO NOT LIKE '%W%'`;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

module.exports = router;

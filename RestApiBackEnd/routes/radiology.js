const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const sqlHelper = require("../helpers/sqlQueries");
const formidable = require("formidable");
const http = require("http");
const https = require("https");
const util = require("util");
const qnap = require("../auth/auth").qnapAuth;

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN

router.use(sanitize);

router.get("/q", (req, res) => {
  res.send({ asd: "dsa", qnap });
});

router.post("/assign-radtech", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.resultId) {
    res.send({ error: true, message: "Result ID required!" });
    return;
  }
  if (!req.body.radtech) {
    res.send({ error: true, message: "Rad Tech required!" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [UERMEMR]..sp_AssignRadTech
        '${req.body.resultId}',
        '${req.body.radtech}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-details", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.technician) {
    res.send({ error: true, message: "Technician required!" });
    return;
  }
  if (!req.body.physician) {
    res.send({ error: true, message: "Physician required!" });
    return;
  }
  if (!req.body.id) {
    res.send({ error: true, message: "Result ID required!" });
    return;
  }
  if (!req.body.isValidated) {
    res.send({ error: true, message: "Is Validated required!" });
    return;
  }
  if (!req.body.reason) {
    if (req.body.reason.trim().length < 20 && !req.body.isValidated) {
      res.send({ error: true, message: "Reason must be over 20 characters!" });
      return;
    }
    res.send({ error: true, message: "Reason required!" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [EMR]..sp_UpdateImagingDetails
        '${req.body.id}',
        '${req.body.isValidated}',
        '${req.body.physician}',
        '${req.body.technician}',
        '${req.body.reason}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/assign-reader", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.resultId) {
    res.send({ error: true, message: "Result ID required!" });
    return;
  }
  if (!req.body.reader) {
    res.send({ error: true, message: "Reader required!" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [UERMEMR]..sp_AssignConsultant
        '${req.body.resultId}',
        '${req.body.reader}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/assign-modality", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.employee) {
    res.send({ error: true, message: "Employee required!" });
    return;
  }
  if (!req.body.type) {
    res.send({ error: true, message: "Type required!" });
    return;
  }
  if (!req.body.modality) {
    res.send({ error: true, message: "Modality required!" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [EMR]..sp_AssignModality
        '${req.body.employee}',
        '${req.body.type}',
        '${req.body.modality}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/patient-result", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // const sqlQuery = `exec EMR..sp_SearchForValidation
  //   '${req.body.lastName}',
  //   '${req.body.firstName}'
  // `;
  const sqlQuery = sqlHelper.imagingCharges({
    lastName: req.body.lastName || "%",
    firstName: req.body.firstName || "%",
    chargeSlipNo: req.body.chargeSlipNo || "%",
    withResult: req.body.withResult || "%",
    isValidated: req.body.isValidated || "%",
  });
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

router.post("/search-for-validation", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // const sqlQuery = `exec EMR..sp_SearchForValidation
  //   '${req.body.lastName}',
  //   '${req.body.firstName}'
  // `;
  const sqlQuery = sqlHelper.imagingCharges({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    chargeSlipNo: "",
    withResult: req.body.withResult,
    isValidated: req.body.isValidated,
  });
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

router.get("/for-validation", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec EMR..sp_ForValidation`;
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

router.get("/techs", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(
        `select
          revCode,
          techDescription
        from emr..techs`,
      );
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/ris-results", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(
        `select * from  UERM_LIS..vw_HIS_RIS_Integration`,
      );
      // sql.close();
      res.send(result.recordset);
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
  // const sqlQuery = `exec EMR..sp_ImagingCharges
  //   '%',
  //   '${req.body.lastName}',
  //   '${req.body.firstName}'
  // `;
  const sqlQuery = sqlHelper.imagingCharges({
    lastName: req.body.lastName,
    firstName: req.body.firstName,
    chargeSlipNo: "",
    withResult: req.body.withResult || 0,
    isValidated: req.body.isValidated || 1,
  });
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

router.post("/unvalidate-result", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.id) {
    res.send({ error: true, message: "ID Required" });
    return;
  }
  if (!req.body.reason) {
    res.send({ error: true, message: "Reason Required" });
    return;
  }
  if (!req.body.user) {
    res.send({ error: true, message: "Username Required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_UnvalidateResult
        '${req.body.id}',
        '${req.body.reason}',
        '${req.body.user}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/recent-validation/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // const sqlQuery = `select
  //   *
  // from EMR..vw_ImagingCharges c
  // where c.isValidated = 1
  // and c.validateDate is not null
  // and dateadd(hour,-24,getdate()) <= c.validateDate
  // and c.validatedByCode = '${req.params.code}'
  // order by patientName, validateDate desc`;
  // const sqlQuery = `exec EMR..sp_RecentValidation
  //   '${req.params.code}'
  // `;
  const sqlQuery = `select * from
    (select
      r.id,
      r.controlNo,
      concat(p.lastName,', ',p.firstName,' ',p.middleName) patientName,
      c.caseno,
      r.csno chargeSlipNo,
      ch.description,
      case
        when r.createDate < '2020-09-28 13:40:21.367' and r.result is not null then 1
        else r.isValidated
      end isValidated,
      r.validateDate,
      r.validatedBy,
      r.technician,
      case
        when r.physician is null and r.physicianUnverified is not null then r.physicianUnverified
        else r.physician
      end physician,
      convert(varchar(max),r.result) result,
      convert(varchar(max),r.createDate,107) resultDate,
      convert(varchar(max),r.createDate) resultDateTime,
      convert(varchar(max),convert(time,r.createDate),0) resultTime,
      convert(varchar(max),r.attachments) attachments,
      isnull(r.fromRis,0) fromRis
    from emr..imagingresults r
    join UERMMMC..charges_main cm
      on r.csno = cm.chargeslipno
    join UERMMMC..cases c
      on cm.caseno = c.caseno
    join UERMMMC..PATIENTINFO p
      on c.patientno = p.PATIENTNO
    join UERMMMC..CHARGES_DETAILS cd
      on cm.CHARGESLIPNO = cd.CHARGESLIPNO
    join UERMMMC..CHARGES ch
      on ch.ID = cd.CHARGE_ID
      and ch.allowOnlineResult = 1
    where r.validatedBy = '${req.params.code}'
    and datediff(hour,r.validateDate,getdate()) <= 24) x
  where x.isValidated = 1
  and x.result is not null
  order by patientName, validateDate desc`;
  // const sqlQuery = sqlHelper.imagingCharges({
  //   code: req.params.code,
  //   isValidated: 1,
  //   withResult: 1,
  //   isRecentValidated: true
  // });
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

router.get("/consultant-technician", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        e.EmployeeCode code,
        concat(e.LastName,', ',e.FirstName,' ',e.MiddleName) name,
        'tech' type
      from [UE database]..Employee e
      where e.Class not in ('gl')
      and e.Isactive = 1

      union

      select
        e.EmployeeCode code,
        concat(e.LastName,', ',e.FirstName,' ',e.MiddleName) name,
        'enc' type
      from [UE database]..Employee e
      where e.Class not in ('gl')
      and e.Isactive = 1

      union

      select
        e.EmployeeCode code,
        concat(e.LastName,', ',e.FirstName,' ',e.MiddleName) name,
        'val' type
      from [UE database]..Employee e
      where e.Class not in ('gl')
      and e.Isactive = 1

      union

      select
        d.code,
        d.name,
        'con' type
      from UERMMMC..DOCTORS d
      where d.DELETED = 0

      order by type,name`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/modality", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from EMR..vw_ModalityAssignment
      order by description,type,name`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/verify", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.user) {
    res.send({ error: true, message: "User required!" });
    return;
  }
  if (!req.body.id) {
    res.send({ error: true, message: "ID required!" });
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

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_ValidateImaging
        '${req.body.id}',
        '${req.body.result}',
        '${req.body.attachments}',
        '${req.body.reader}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        message: result.recordset[0].MSG,
        error: result.recordset[0].ERR,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-ris", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.user) {
    res.send({ error: true, message: "User required!" });
    return;
  }
  if (!req.body.id) {
    res.send({ error: true, message: "ID required!" });
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

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec EMR..sp_SaveRISResult
        '${req.body.id}',
        '${req.body.result}',
        '${req.body.attachments}',
        '${req.body.reader}',
        '${req.body.user}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      // const sqlQuery = "select 1 ERR, 'asd' MSG"

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        message: result.recordset[0].MSG,
        error: result.recordset[0].ERR,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/upload-attachment", (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      // Check for and handle any errors here.
      res.send({ error: true, message: err.message });
      return;
    }
    res.send({ error: false, message: "File uploaded successfully!" });
    // This last line responds to the form submission with a list of the parsed data and files.
    res.end(util.inspect({ fields: fields, files: files }));
  });
});

router.post("/save-result", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [EMR]..sp_SaveImagingResult
        '${req.body.id}',
        '${req.body.chargeDetailId}',
        '${req.body.chargeSlipNo}',
        '${req.body.result}',
        '${req.body.attachments}',
        '${req.body.doctor}',
        '${req.body.radTech}',
        '${req.body.controlNo}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search-case", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.caseno) {
    res.send({ error: "Case Number required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from UERMMMC..cases c
      join UERMMMC..CHARGES_MAIN cm
        on c.CASENO = cm.CASENO
        and (left(cm.CHARGESLIPNO,2) = 'xr'
        or left(cm.CHARGESLIPNO,3) = 'wel')
      where c.CASENO = '${req.query.caseno}'`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search-result/:search", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.search) {
    res.send({ error: "Search params required!" });
    return;
  }
  const sqlQuery = sqlHelper.imagingCharges({
    lastName: "%",
    firstName: "%",
    chargeSlipNo: req.params.search,
    withResult: "%",
    isValidated: "%",
  });
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

router.get("/modalities", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from EMR..vw_Modalities m
      order by description`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/generate-control-no/:chargeSlipNo", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select EMR.dbo.[fn_GenerateControlNo]('${req.params.chargeSlipNo}') controlNo`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/radtech", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
                e.code,
                e.name,
                e.dept_desc department,
                e.pos_desc position,
                e.emp_class_desc class
            from [UE Database]..vw_Employees e
            where e.pos_code in ('RADTECH')
            order by name`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/consultants", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select distinct
        m.code,
        m.name,
        d.[AREA OF SPECIALTY] specialty,
        d.DEPARTMENT department,
        m.modality
      from EMR..vw_ModalityAssignment m
      left join UERMMMC..DOCTORS d
        on d.code = m.code
      where m.type = 'con'
      order by name`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/ris-users", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    u.id,
    u.ORUCode oruCode,
    u.ORUType type,
    u.HISCode code,
    case
      when d.code is not null then d.name
      when e.code is not null then e.name
    end name,
    u.ORUName oruName
  from uerm_lis.[dbo].[HISRadiologyUsers] u
  left join [UE database]..vw_Employees e
    on u.hisCode = e.code
    and u.ORUType <> 'Signing Physician'
    and e.is_active = 1
  left join UERMMMC..DOCTORS d
    on u.HISCode = d.code
    and u.ORUType = 'Signing Physician'
    and d.deleted = 0
  order by
    case
      when d.code is not null then 1
      when e.code is not null then 1
      else 0
    end,
    case
      when u.hiscode is null then 0
      else 1
    end,
    type, name
  -- where u.hiscode is null`;

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

router.get("/qnap-create-folder/:sid/:folder/:path", (req, res) => {
  const url = `${qnap.server.local}/cgi-bin/filemanager/utilRequest.cgi?func=createdir&sid=${req.params.sid}&dest_folder=${req.params.folder}&dest_path=/LIS`;
  http
    .get(url, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        data = JSON.parse(data);
        res.send({ error: false, ...data });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
      res.send({ error: true, message: err.message });
    });
});

router.get("/qnap-auth", (req, res) => {
  const url = `${qnap.server.local}cgi-bin/filemanager/wfm2Login.cgi?user=${qnap.user}&pwd=${qnap.pass}`;
  console.log(url);

  // void async function () {
  // const response = await fetch(url, {
  //   method: "GET",
  //   headers: {
  //     "Content-Type": "application/json"
  //   }
  // }).then((r) => r.json());

  // console.log("QNAP API RESPONSE",response);

  // res.send({ response });
  // };

  http
    .get(url, (resp) => {
      let data = "";
      resp.on("data", (chunk) => {
        data += chunk;
      });
      resp.on("end", () => {
        data = JSON.parse(data);
        res.send({ error: !data.authPassed, ...data });
      });
    })
    .on("error", (err) => {
      console.log(err.message);
      res.send({ error: true, message: err.message });
    });
});

router.post("/update-ris-user", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec [EMR]..sp_UpdateRisUser
    '${req.body.id}',
    '${req.body.type}',
    '${req.body.code}',
    '${req.body.user}',
    '${helpers.getIp(req.connection.remoteAddress)}'
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

router.get("/radtechs", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `select
      //   *
      // from [UE database]..vw_Employees e
      // where (e.pos_code in ('RADTECH')
      // or e.code in ('2254','182'))
      // and e.is_active = 1
      // and e.emp_class_code not in ('gl')
      // order by name`;
      const sqlQuery = `select distinct
        m.CODE,
        m.NAME,
        e.DEPT_DESC,
        e.POS_DESC,
        e.EMP_CLASS_DESC,
        m.MODALITY
      from EMR..vw_ModalityAssignment m
      left join [UE database]..vw_Employees e
        on e.code = m.code
      where m.type = 'tech'
      order by name`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(
        result.recordset.map((e) => {
          return {
            code: e.CODE,
            name: e.NAME,
            department: e.DEPT_DESC,
            position: e.POS_DESC,
            class: e.EMP_CLASS_DESC,
            revCode: e.MODALITY,
          };
        }),
      );
      // res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/result-details", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.resultId) {
    res.send({ error: true, message: "ID required!" });
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        i.radno,
        i.caseno,
        i.diagnosis,
        i.examination
      from UERMEMR..RecordsRadiologyInfo i
      where i.radiologyid = '${req.query.resultId}'`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

module.exports = router;

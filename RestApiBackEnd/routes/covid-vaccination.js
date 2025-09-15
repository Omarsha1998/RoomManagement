const express = require("express");
const router = express.Router();
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const WebSocket = require("ws");

router.use(sanitize);

router.get("/ws", (req, res) => {
  const wss = req.websocketConfig.wss;
  wss.on("connection", function connection(ws) {
    ws.on("message", function incoming(message) {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });
  res.send("Websocket Connection");
});

router.post("/generate-vaccine-no", async (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const vaccineNumber = await helpers.setCheckDigit(
        req.body.vaccineDates,
        req.body.vaccineNo,
      );
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASGenerateVaccineeNumber
        '${vaccineNumber}',
        '${req.body.categoryIDNumber}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/vas-vaccinators", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere = "";
  let sqlStart = "";
  let sqlSelect = "*";
  let sqlOrder = "";

  if (req.query.unMapped) {
    sqlStart = "distinct";
    sqlSelect = "Vaccinator_Name";
    sqlWhere = `where Vaccinator_Name like '%/%'`;
    sqlOrder = `order by Vaccinator_Name`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlStart} ${sqlSelect} from HR..VaccineVAS ${sqlWhere} ${sqlOrder}`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/master-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..vw_VaccineList`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/vaccine-printing", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";
  if (req.query.vaccineNo) {
    sqlWhere = `where VaccineNo = '${req.query.vaccineNo}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..Vaccine_Printing ${sqlWhere}`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/preregistration-reservation-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlLimit = "";
  let sqlWhere = "";

  if (!req.query.email) {
    sqlLimit = "TOP(50)";
  } else {
    sqlWhere = `where EmailAddress LIKE '%${req.query.email}%'`;
  }

  if (!req.query.hashKey) {
    sqlLimit = "TOP(50)";
  } else if (req.query.hashKey) {
    sqlWhere = `where HashKey = '${req.query.hashKey}'`;
  }

  if (req.query.referringUserType == "CORPORATE") {
    sqlLimit = "";
    sqlWhere = `where Company = '${req.query.company}'`;
  } else if (req.query.referringUserType == "CORPORATE" && !req.query.email) {
    sqlWhere = `where EmailAddress = '${req.query.email}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlLimit} * from HR..VaccineReservationAccess ${sqlWhere} order by Id desc`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-reservation-access", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASSaveReservationAccess
        '${req.body.email}',
        '${req.body.mobileNumber}',
        '${req.body.accessed}',
        '${req.body.submitted}',
        '${req.body.reservationType}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-reservation-corporate-access", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASSaveReservationAccessCorporate
        '${req.body.email}',
        '${req.body.mobileNumber}',
        '${req.body.accessed}',
        '${req.body.submitted}',
        '${req.body.reservationType}',
        '${req.body.company}',
        '${req.body.expirationDate}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/give-vas-access", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASSaveUserAccess
        '${req.body.userID}',
        '${req.body.password}',
        '${req.body.volunteer}',
        '${req.body.firstName}',
        '${req.body.lastName}',
        '${req.body.middleName}',
        '${req.body.position}'
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

router.post("/update-reservation-access", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);

      const sqlQuery = `exec HR..sp_VASUpdateReservationAccess
        '${req.body.email}',
        '${req.body.mobileNumber}',
        '${req.body.accessed}',
        '${req.body.submitted}',
        '${req.body.reservationType}',
        '${req.body.hashKey}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/delete-preregistration-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASDeletePreregistration
        '${req.body.categoryIDNumber}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/master-list-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";
  let sqlLimit = "";

  if (!req.query.lastName && !req.query.categoryIDNumber && !req.query.qrCode) {
    sqlLimit = `TOP (1000)`;
    // sqlWhere = `where convert(date,DateTimeCreated) >= convert(date, '2021-08-25')`
  }

  if (req.query.lastName) {
    sqlWhere = `where Last_Name LIKE '%${req.query.lastName}%'`;
  }

  if (req.query.categoryIDNumber) {
    sqlWhere = `where Category_ID_Number = '${req.query.categoryIDNumber}'`;
  }

  if (req.query.referringCategoryID) {
    sqlWhere = `where ReferringEmployeeID = '${req.query.referringCategoryID}'`;
  }

  if (req.query.qrCode) {
    sqlWhere = `where QRCode = '${req.query.qrCode}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlLimit} * from HR..vw_VaccineMasterListVAS WITH (NOLOCK) ${sqlWhere} order by DateTimeCreated desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/master-list-raw-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  var sqlWhere = "";
  let sqlLimit = "";

  if (
    !req.query.lastName &&
    !req.query.categoryIDNumber &&
    !req.query.email &&
    !req.query.referringCategoryID &&
    !req.query.qrCode
  ) {
    sqlLimit = `TOP (1000)`;
  }

  if (req.query.lastName) {
    sqlWhere = `where Last_Name LIKE '%${req.query.lastName}%'`;
  }

  if (req.query.categoryIDNumber) {
    sqlWhere = `where Category_ID_Number = '${req.query.categoryIDNumber}'`;
  }

  if (req.query.email) {
    sqlWhere = `where ReferringEmployeeEmail = '${req.query.email}'`;
  }

  if (req.query.referringCategoryID) {
    sqlWhere = `where ReferringEmployeeID = '${req.query.referringCategoryID}'`;
  }

  if (req.query.qrCode) {
    var sqlWhere = `where QRCode = '${req.query.qrCode}'`;
  }

  if (req.query.hashKey) {
    var sqlWhere = `where HashKey = '${req.query.hashKey}'`;
  }

  if (req.query.company) {
    const company = req.query.company;
    if (req.query.company && !req.query.lastName && !req.query.hashKey) {
      var sqlWhere = `where Name_Of_Employer = '${company}'`;
    } else if (req.query.company && req.query.lastName) {
      var sqlWhere = `where Name_Of_Employer = '${company}' and Last_Name = '${req.query.lastName}'`;
    } else if (req.query.company && req.query.hashKey) {
      var sqlWhere = `where Name_Of_Employer = '${company}' and HashKey = '${req.query.hashKey}'`;
    }
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlLimit} * from HR..vw_VaccinePreregisteredMasterList WITH (NOLOCK) ${sqlWhere} order by Id desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/master-list-vaccinated-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  var sqlWhere = "";
  let sqlLimit = "";

  if (req.query.all === "true") {
    sqlLimit = "";
    sqlWhere = `where FinalVaccineeNo is null and FinalDosage > 2`;
  }

  if (
    !req.query.lastName &&
    !req.query.categoryIDNumber &&
    req.query.all !== "true"
  ) {
    sqlLimit = `TOP(1000)`;
  }

  if (req.query.dateFrom && req.query.dateTo) {
    sqlLimit = "";
    sqlWhere = `where convert(date, [DATE OF VAX]) >= '${req.query.dateFrom}'
                and convert(date, [DATE OF VAX]) <= '${req.query.dateTo}'`;
  }

  if (req.query.qrCode) {
    var sqlWhere = `where QRCode = '${req.query.qrCode}'`;
  }

  if (req.query.lastName) {
    var sqlWhere = `where Last_Name LIKE '%${req.query.lastName}%'`;
  }

  if (req.query.categoryIDNumber) {
    var sqlWhere = `where Category_ID_Number = '${req.query.categoryIDNumber}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlLimit} * from HR..vw_VaccineMasterListVASVaccinatedV2 WITH (NOLOCK) ${sqlWhere}  order by DateTimeCreated desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/master-list-raw-vaccinated-outside", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";
  let sqlLimit = "";

  if (!req.query.lastName && !req.query.categoryIDNumber) {
    sqlLimit = `TOP(500)`;
  }

  if (req.query.all) {
    sqlLimit = ``;
  }

  if (req.query.qrCode) {
    sqlWhere = `where QRCode = '${req.query.qrCode}'`;
  }

  if (req.query.lastName) {
    sqlWhere = `where Last_Name LIKE '%${req.query.lastName}%'`;
  }

  if (req.query.categoryIDNumber) {
    sqlLimit = `TOP(500)`;
    sqlWhere = `where Category_ID_Number = '${req.query.categoryIDNumber}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlLimit} * from HR..vw_VaccinePreregisteredMasterList WITH (NOLOCK) ${sqlWhere}  order by dateadded desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/master-list-booster-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  var sqlWhere = "";
  let sqlLimit = "";

  if (!req.query.lastName && !req.query.categoryIDNumber) {
    sqlLimit = `TOP(500)`;
    sqlWhere = `where VaccinedDosage = 2`;
  }

  if (req.query.all) {
    sqlLimit = ``;
    sqlWhere = `where VaccinedDosage = 2`;
  }

  if (req.query.scheduling === "true") {
    sqlLimit = ``;
    sqlWhere = `where VaccinedDosage = 2 and (isHRActive = 1 or isHRActive is null) and convert(date, VaccinatedDT) >= '2021-04-05'`;
  } else {
    sqlLimit = ``;
    sqlWhere = `where VaccinedDosage = 2`;
  }

  if (req.query.dateFrom && req.query.dateTo) {
    sqlLimit = "";
    sqlWhere = `where convert(date, [DATE OF VAX]) >= '${req.query.dateFrom}'
                and convert(date, [DATE OF VAX]) <= '${req.query.dateTo}'`;
  }

  if (req.query.qrCode) {
    var sqlWhere = `where QRCode = '${req.query.qrCode}'`;
  }

  if (req.query.lastName) {
    var sqlWhere = `where Last_Name LIKE '%${req.query.lastName}%'`;
  }

  if (req.query.categoryIDNumber) {
    var sqlWhere = `where Category_ID_Number = '${req.query.categoryIDNumber}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlLimit} * from HR..vw_VaccineMasterListVASBooster WITH (NOLOCK) ${sqlWhere} order by VaccinatedDT`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/vas-vaccinated", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  var sqlWhere = "";
  let sqlLimit = "";

  if (!req.query.lastName && !req.query.categoryIDNumber) {
    sqlLimit = `TOP(1000)`;
  }

  if (req.query.all) {
    sqlLimit = ``;
  }

  if (req.query.dateFrom && req.query.dateTo) {
    sqlLimit = "";
    sqlWhere = `where convert(date, [DATE OF VAX]) >= '${req.query.dateFrom}'
                and convert(date, [DATE OF VAX]) <= '${req.query.dateTo}'`;
  }

  if (req.query.qrCode) {
    var sqlWhere = `where QRCode = '${req.query.qrCode}'`;
  }

  if (req.query.lastName) {
    var sqlWhere = `where Last_Name LIKE '%${req.query.lastName}%'`;
  }

  if (req.query.categoryIDNumber) {
    var sqlWhere = `where Category_ID_Number = '${req.query.categoryIDNumber}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ${sqlLimit} * from HR..vw_VASVaccinated WITH (NOLOCK) ${sqlWhere} order by VASVaccinationDateTime`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/vaccine-certificate", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";
  let orderBy = "order by DOSE";

  if (req.query.forRevision) {
    sqlWhere = "where RevisionStatus is not null";
  }

  if (req.query.vaccineeNo) {
    sqlWhere = `where VaccineeNo = '${req.query.vaccineeNo}'`;
  }

  if (req.query.categoryIDNumber) {
    sqlWhere = `where Category_ID_Number = '${req.query.categoryIDNumber}'`;
  }
  if (req.query.vaccineCertificate == "1") {
    sqlWhere = `where Last_Name = '${req.query.lastName}' and First_Name = '${req.query.firstName}'`;
    orderBy = `order by DOSE`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
        select
          * from HR..vw_VaccineCertification
        ${sqlWhere}
        ${orderBy}
        `;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/corporate-users", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..VaccineVASCompanies`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/corporate-users-by-code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.userName) {
    res.send({ error: "Code required" });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..VaccineVASCompanies where UserName = '${req.query.userName}'`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/approve-preregister-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASApprovePreregister
        '${req.body.category}',
        '${req.body.categoryID}',
        '${req.body.categoryIDNumber}',
        '${req.body.philhealthID}',
        '${req.body.pwdID}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.gender}',
        '${req.body.birthdate}',
        '${req.body.civilStatus}',
        '${req.body.contactNumber}',
        '${req.body.fullAddress}',
        '${req.body.region}',
        '${req.body.province}',
        '${req.body.city}',
        '${req.body.barangay}',
        '${req.body.employmentStatus}',
        '${req.body.directCovid}',
        '${req.body.profession}',
        '${req.body.drugAllergy}',
        '${req.body.foodAllergy}',
        '${req.body.insectAllergy}',
        '${req.body.latexAllergy}',
        '${req.body.moldAllergy}',
        '${req.body.petAllergy}',
        '${req.body.pollenAllergy}',
        '${req.body.withComorbidity}',
        '${req.body.hypertension}',
        '${req.body.heartDisease}',
        '${req.body.kidneyDisease}',
        '${req.body.diabetesMellitus}',
        '${req.body.bronchialAsthma}',
        '${req.body.immunodeficiencyStatus}',
        '${req.body.cancer}',
        '${req.body.others}',
        '${req.body.patientDiagnosedWithCovid}',
        '${req.body.classificationOfCovid}',
        '${req.body.dateOfCovid}',
        '${req.body.providedConsent}',
        '${req.body.householdMemberCategory}',
        '${req.body.qrCode}',
        ${req.body.vaccineSched != "" ? `'${req.body.vaccineSched}'` : null},
        '${req.body.priorityGroup}',
        '${req.body.vaccineeCategory}'
      `;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
      if (result.recordset[0].MSG !== undefined) {
        const updateRawMasterList = `Update HR..VaccineMasterList_Raw SET Transferred = '1' where Id = '${req.body.vaccineeID}'`;
        await sql.connect(sqlConfig);
        const result = await sql.query(updateRawMasterList);
        // if (req.body.scheduled) {
        //   sendTextMessage()
        //   sendEmail()
        // }
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/approve-preregister-corporate-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASApproveCorporatePreregister
        '${req.body.category}',
        '${req.body.categoryID}',
        '${req.body.categoryIDNumber}',
        '${req.body.philhealthID}',
        '${req.body.pwdID}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.gender}',
        '${req.body.birthdate}',
        '${req.body.civilStatus}',
        '${req.body.contactNumber}',
        '${req.body.fullAddress}',
        '${req.body.region}',
        '${req.body.province}',
        '${req.body.city}',
        '${req.body.barangay}',
        '${req.body.employmentStatus}',
        '${req.body.directCovid}',
        '${req.body.profession}',
        '${req.body.drugAllergy}',
        '${req.body.foodAllergy}',
        '${req.body.insectAllergy}',
        '${req.body.latexAllergy}',
        '${req.body.moldAllergy}',
        '${req.body.petAllergy}',
        '${req.body.pollenAllergy}',
        '${req.body.withComorbidity}',
        '${req.body.hypertension}',
        '${req.body.heartDisease}',
        '${req.body.kidneyDisease}',
        '${req.body.diabetesMellitus}',
        '${req.body.bronchialAsthma}',
        '${req.body.immunodeficiencyStatus}',
        '${req.body.cancer}',
        '${req.body.others}',
        '${req.body.patientDiagnosedWithCovid}',
        '${req.body.classificationOfCovid}',
        '${req.body.dateOfCovid}',
        '${req.body.providedConsent}',
        '${req.body.householdMemberCategory}',
        '${req.body.companyName}',
        '${req.body.companyProvince}',
        '${req.body.companyAddress}',
        '${req.body.companyContactNumber}',
        '${req.body.qrCode}',
        ${req.body.vaccineSched != "" ? `'${req.body.vaccineSched}'` : null},
        '${req.body.priorityGroup}',
        '${req.body.vaccineeCategory}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
      if (result.recordset[0].MSG !== undefined) {
        const updateRawMasterList = `Update HR..VaccineMasterList_Raw SET Transferred = '1' where Id = '${req.body.vaccineeID}'`;
        await sql.connect(sqlConfig);
        const result = await sql.query(updateRawMasterList);
        // if (req.body.scheduled) {
        //   sendTextMessage()
        //   sendEmail()
        // }
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/approve-vaccinated-employees-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASApproveVaccinatedEmployees
        '${req.body.category}',
        '${req.body.categoryID}',
        '${req.body.categoryIDNumber}',
        '${req.body.philhealthID}',
        '${req.body.pwdID}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.gender}',
        '${req.body.birthdate}',
        '${req.body.civilStatus}',
        '${req.body.contactNumber}',
        '${req.body.fullAddress}',
        '${req.body.region}',
        '${req.body.province}',
        '${req.body.city}',
        '${req.body.barangay}',
        '${req.body.employmentStatus}',
        '${req.body.directCovid}',
        '${req.body.profession}',
        '${req.body.drugAllergy}',
        '${req.body.foodAllergy}',
        '${req.body.insectAllergy}',
        '${req.body.latexAllergy}',
        '${req.body.moldAllergy}',
        '${req.body.petAllergy}',
        '${req.body.pollenAllergy}',
        '${req.body.withComorbidity}',
        '${req.body.hypertension}',
        '${req.body.heartDisease}',
        '${req.body.kidneyDisease}',
        '${req.body.diabetesMellitus}',
        '${req.body.bronchialAsthma}',
        '${req.body.immunodeficiencyStatus}',
        '${req.body.cancer}',
        '${req.body.others}',
        '${req.body.patientDiagnosedWithCovid}',
        '${req.body.classificationOfCovid}',
        '${req.body.dateOfCovid}',
        '${req.body.providedConsent}',
        '${req.body.householdMemberCategory}',
        '${req.body.companyName}',
        '${req.body.companyProvince}',
        '${req.body.companyAddress}',
        '${req.body.companyContactNumber}',
        '${req.body.qrCode}',
        ${req.body.vaccineSched != "" ? `'${req.body.vaccineSched}'` : null},
        '${req.body.priorityGroup}',
        '${req.body.vaccineeCategory}',
        '${req.body.vaccineeID}',
        '${req.body.vaccinationInfo}'
      `;
      const result = await sql.query(sqlQuery);
      if (result.recordset[0].MSG !== undefined) {
        res.send(result.recordset[0]);
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-vaccinated-employees-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASUpdateVaccinatedEmployees
        '${req.body.category}',
        '${req.body.categoryID}',
        '${req.body.categoryIDNumber}',
        '${req.body.philhealthID}',
        '${req.body.pwdID}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.gender}',
        '${req.body.birthdate}',
        '${req.body.civilStatus}',
        '${req.body.contactNumber}',
        '${req.body.fullAddress}',
        '${req.body.region}',
        '${req.body.province}',
        '${req.body.city}',
        '${req.body.barangay}',
        '${req.body.employmentStatus}',
        '${req.body.directCovid}',
        '${req.body.profession}',
        '${req.body.drugAllergy}',
        '${req.body.foodAllergy}',
        '${req.body.insectAllergy}',
        '${req.body.latexAllergy}',
        '${req.body.moldAllergy}',
        '${req.body.petAllergy}',
        '${req.body.pollenAllergy}',
        '${req.body.withComorbidity}',
        '${req.body.hypertension}',
        '${req.body.heartDisease}',
        '${req.body.kidneyDisease}',
        '${req.body.diabetesMellitus}',
        '${req.body.bronchialAsthma}',
        '${req.body.immunodeficiencyStatus}',
        '${req.body.cancer}',
        '${req.body.others}',
        '${req.body.patientDiagnosedWithCovid}',
        '${req.body.classificationOfCovid}',
        '${req.body.dateOfCovid}',
        '${req.body.providedConsent}',
        '${req.body.householdMemberCategory}',
        '${req.body.qrCode}',
        '${req.body.priorityGroup}',
        '${req.body.vaccineeID}',
        '${req.body.vaccinationInfo}'
      `;
      const result = await sql.query(sqlQuery);
      if (result.recordset[0].MSG !== undefined) {
        res.send(result.recordset[0]);
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/insert-vaccinated-employees", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASInsertToVaccinatedEmployees
        '${req.body.categoryIDNumber}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.date}',
        '${req.body.contactNumber}',
        '${req.body.manufacturer}',
        '${req.body.dose}',
        '${req.body.remarks}'
      `;

      const result = await sql.query(sqlQuery);
      if (result.recordset[0].MSG !== undefined) {
        res.send(result.recordset[0]);
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-preregistration-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASUpdatePreregistration
        '${req.body.category}',
        '${req.body.categoryID}',
        '${req.body.categoryIDNumber}',
        '${req.body.philhealthID}',
        '${req.body.pwdID}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.gender}',
        '${req.body.birthdate}',
        '${req.body.civilStatus}',
        '${req.body.contactNumber}',
        '${req.body.fullAddress}',
        '${req.body.region}',
        '${req.body.province}',
        '${req.body.city}',
        '${req.body.barangay}',
        '${req.body.employmentStatus}',
        '${req.body.directCovid}',
        '${req.body.profession}',
        '${req.body.drugAllergy}',
        '${req.body.foodAllergy}',
        '${req.body.insectAllergy}',
        '${req.body.latexAllergy}',
        '${req.body.moldAllergy}',
        '${req.body.petAllergy}',
        '${req.body.pollenAllergy}',
        '${req.body.withComorbidity}',
        '${req.body.hypertension}',
        '${req.body.heartDisease}',
        '${req.body.kidneyDisease}',
        '${req.body.diabetesMellitus}',
        '${req.body.bronchialAsthma}',
        '${req.body.immunodeficiencyStatus}',
        '${req.body.cancer}',
        '${req.body.others}',
        '${req.body.patientDiagnosedWithCovid}',
        '${req.body.classificationOfCovid}',
        '${req.body.dateOfCovid}',
        '${req.body.providedConsent}',
        '${req.body.householdMemberCategory}',
        '${req.body.qrCode}',
        '${req.body.cancelled}',
        '${req.body.priorityGroup}',
        '${req.body.vaccineeID}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-preregister-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASUpdatePreregister
        '${req.body.category}',
        '${req.body.categoryID}',
        '${req.body.categoryIDNumber}',
        '${req.body.philhealthID}',
        '${req.body.pwdID}',
        '${req.body.lastName}',
        '${req.body.firstName}',
        '${req.body.middleName}',
        '${req.body.gender}',
        '${req.body.birthdate}',
        '${req.body.civilStatus}',
        '${req.body.contactNumber}',
        '${req.body.fullAddress}',
        '${req.body.region}',
        '${req.body.province}',
        '${req.body.city}',
        '${req.body.barangay}',
        '${req.body.employmentStatus}',
        '${req.body.directCovid}',
        '${req.body.profession}',
        '${req.body.qrCode}',
        '${req.body.cancelled}',
        '${req.body.vaccineeID}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-registered-schedule-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      let sqlWhere = "";
      if (req.body.categoryIDNumber) {
        sqlWhere = `where Category_ID_Number = '${req.body.categoryIDNumber}'`;
      } else {
        sqlWhere = `where Id = '${req.body.vaccineeID}'`;
      }

      let sqlQuery = "";
      if (req.body.secondDose === "true") {
        sqlQuery = `update HR..VaccineMasterList SET SecondDoseVaccineSched = '${req.body.vaccineSched}', SecondDose = 1 ${sqlWhere} `;
      } else if (req.body.booster === "true") {
        sqlQuery = `update HR..VaccineMasterList SET BoosterDoseVaccineSched = '${req.body.vaccineSched}', Booster = ${req.body.boosterDose} ${sqlWhere}`;
      } else {
        sqlQuery = `update HR..VaccineMasterList SET VaccineSched = '${req.body.vaccineSched}' ${sqlWhere}`;
      }
      const result = await sql.query(sqlQuery);
      //
      const queryResult = {
        message: "Successfully updated vaccine schedule",
        error: "",
      };
      res.send(queryResult);
    } catch (error) {
      const queryResult = {
        message: "",
        error: "Error",
      };
      res.send(queryResult);
    }
  })();
});

// router.post("/update-vaccinee-vas-v3", (req, res) => {
//   if (!appMain.checkAuth(req.query.auth)) {
//     res.send({ error: appMain.error });
//     return;
//   }

//   void (async function () {
//     try {
//       await sql.connect(sqlConfig);

//       if (req.body.station == '3') {
//         const sqlQuery = `exec HR..sp_VASUpdateMasterList
//           '${req.body.category}',
//           '${req.body.categoryID}',
//           '${req.body.categoryIDNumber}',
//           '${req.body.philhealthID}',
//           '${req.body.pwdID}',
//           '${req.body.lastName}',
//           '${req.body.firstName}',
//           '${req.body.middleName}',
//           '${req.body.gender}',
//           '${req.body.birthdate}',
//           '${req.body.civilStatus}',
//           '${req.body.contactNumber}',
//           '${req.body.fullAddress}',
//           '${req.body.region}',
//           '${req.body.province}',
//           '${req.body.city}',
//           '${req.body.barangay}',
//           '${req.body.employmentStatus}',
//           '${req.body.directCovid}',
//           '${req.body.profession}',
//           '${req.body.drugAllergy}',
//           '${req.body.foodAllergy}',
//           '${req.body.insectAllergy}',
//           '${req.body.latexAllergy}',
//           '${req.body.moldAllergy}',
//           '${req.body.petAllergy}',
//           '${req.body.pollenAllergy}',
//           '${req.body.withComorbidity}',
//           '${req.body.hypertension}',
//           '${req.body.heartDisease}',
//           '${req.body.kidneyDisease}',
//           '${req.body.diabetesMellitus}',
//           '${req.body.bronchialAsthma}',
//           '${req.body.immunodeficiencyStatus}',
//           '${req.body.cancer}',
//           '${req.body.others}',
//           '${req.body.patientDiagnosedWithCovid}',
//           '${req.body.classificationOfCovid}',
//           '${req.body.dateOfCovid}',
//           '${req.body.providedConsent}',
//           '${req.body.householdMemberCategory}',
//           '${req.body.qrCode}',
//           '${req.body.priorityGroup}',
//           '${req.body.vaccineeID}'
//         `;
//         const result = await sql.query(sqlQuery);

//         res.send(result.recordset[0]);
//         if (result.recordset[0].MSG !== undefined) {
//           var saveVas = ''
//           if (req.body.vasID !== '') {
//             saveVas = `update HR..VaccineVAS SET Station = '${req.body.station}' where Id = '${req.body.vasID}'`;
//           } else {
//             saveVas = `exec HR..sp_VASInsertMasterList
//               '${req.body.categoryIDNumber}',
//               '${req.body.station}',
//               '${req.body.dose}'
//             `;
//           }
//           await sql.connect(sqlConfig);
//           const result = await sql.query(saveVas);
//         }
//       } else {
//         const sqlQuery = `exec HR..sp_VASUpdateVASMasterList
//             '${req.body.vaccineManufacturer}',
//             '${req.body.batchNumber}',
//             '${req.body.lotNumber}',
//             '${req.body.vaccinator}',
//             '${req.body.professionOfVaccinator}',
//             '${req.body.firstDose}',
//             '${req.body.secondDose}',
//             '${req.body.adverseEffects}',
//             '${req.body.dosage}',
//             '${req.body.station}',
//             '${req.body.screeningDateTime}',
//             ${req.body.vaccinationDateTime != '' ? `'${req.body.vaccinationDateTime}'` : null },
//             '${req.body.vasID}'
//         `;
//         const result = await sql.query(sqlQuery);

//         res.send(result.recordset[0]);
//       }
//     } catch (error) {
//       res.send({ error });
//     }
//   })();
// });

router.post("/update-vaccinee-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);

      if (req.body.station == "3") {
        const sqlQuery = `exec HR..sp_VASUpdateMasterList
          '${req.body.category}',
          '${req.body.categoryID}',
          '${req.body.categoryIDNumber}',
          '${req.body.philhealthID}',
          '${req.body.pwdID}',
          '${req.body.lastName}',
          '${req.body.firstName}',
          '${req.body.middleName}',
          '${req.body.gender}',
          '${req.body.birthdate}',
          '${req.body.civilStatus}',
          '${req.body.contactNumber}',
          '${req.body.fullAddress}',
          '${req.body.region}',
          '${req.body.province}',
          '${req.body.city}',
          '${req.body.barangay}',
          '${req.body.employmentStatus}',
          '${req.body.directCovid}',
          '${req.body.profession}',
          '${req.body.drugAllergy}',
          '${req.body.foodAllergy}',
          '${req.body.insectAllergy}',
          '${req.body.latexAllergy}',
          '${req.body.moldAllergy}',
          '${req.body.petAllergy}',
          '${req.body.pollenAllergy}',
          '${req.body.withComorbidity}',
          '${req.body.hypertension}',
          '${req.body.heartDisease}',
          '${req.body.kidneyDisease}',
          '${req.body.diabetesMellitus}',
          '${req.body.bronchialAsthma}',
          '${req.body.immunodeficiencyStatus}',
          '${req.body.cancer}',
          '${req.body.others}',
          '${req.body.patientDiagnosedWithCovid}',
          '${req.body.classificationOfCovid}',
          '${req.body.dateOfCovid}',
          '${req.body.providedConsent}',
          '${req.body.householdMemberCategory}',
          '${req.body.qrCode}',
          '${req.body.priorityGroup}',
          '${req.body.vaccineeID}'
        `;
        const result = await sql.query(sqlQuery);
        res.send(result.recordset[0]);
        if (result.recordset[0].MSG !== undefined) {
          let saveVas = "";
          if (req.body.vasID !== "") {
            saveVas = `update HR..VaccineVAS SET Station = '${req.body.station}' where Id = '${req.body.vasID}'`;
          } else {
            saveVas = `exec HR..sp_VASInsertMasterList
              '${req.body.categoryIDNumber}',
              '${req.body.station}',
              '${req.body.dose}',
              '${req.body.registeringUser}',
              '${req.body.registeringLead}'
            `;
          }

          await sql.connect(sqlConfig);
          const result = await sql.query(saveVas);
        }
      } else if (req.body.station == "4") {
        const sqlQuery = `exec HR..sp_VASUpdateScreeningStation
            '${req.body.categoryIDNumber}',
            '${req.body.deferral}',
            '${req.body.dosage}',
            '${req.body.healthScreening}',
            '${req.body.otherReasonOfDeferral}',
            '${req.body.bloodPressure}',
            '${req.body.heartRate}',
            '${req.body.respiratoryRate}',
            '${req.body.temperature}',
            '${req.body.oxygenSaturation}',
            '${req.body.screeningCategory}',
            '${req.body.screeningDateTime}',
            '${req.body.screeningUser}',
            '${req.body.screeningLead}',
            ${
              req.body.vaccinationDateTime != ""
                ? `'${req.body.vaccinationDateTime}'`
                : null
            },
            '${req.body.station}',
            '${req.body.vasID}'
        `;
        const result = await sql.query(sqlQuery);
        res.send(result.recordset[0]);
      } else if (req.body.station == "5") {
        const sqlQuery = `exec HR..sp_VASUpdateVaccinationStation
            '${req.body.vaccineManufacturer}',
            '${req.body.batchNumber}',
            '${req.body.lotNumber}',
            '${req.body.vaccinator}',
            '${req.body.professionOfVaccinator}',
            '${req.body.firstDose}',
            '${req.body.secondDose}',
            '${req.body.adverseEffects}',
            '${req.body.dosage}',
            '${req.body.station}',
            '${req.body.screeningDateTime}',
            ${
              req.body.vaccinationDateTime != ""
                ? `'${req.body.vaccinationDateTime}'`
                : null
            },
            '${req.body.vaccinatingUser}',
            '${req.body.vaccinatingLead}',
            '${req.body.vasID}'
        `;
        const result = await sql.query(sqlQuery);
        res.send(result.recordset[0]);
      } else {
        const sqlQuery = `exec HR..sp_VASUpdateScreeningStation
            '${req.body.categoryIDNumber}',
            '${req.body.deferral}',
            '${req.body.dosage}',
            '${req.body.healthScreening}',
            '${req.body.otherReasonOfDeferral}',
            '${req.body.bloodPressure}',
            '${req.body.heartRate}',
            '${req.body.respiratoryRate}',
            '${req.body.temperature}',
            '${req.body.oxygenSaturation}',
            '${req.body.screeningCategory}',
            '${req.body.screeningDateTime}',
            '${req.body.screeningUser}',
            '${req.body.screeningLead}',
            ${
              req.body.vaccinationDateTime != ""
                ? `'${req.body.vaccinationDateTime}'`
                : null
            },
            '${req.body.station}',
            '${req.body.vasID}'
        `;
        const result = await sql.query(sqlQuery);
        res.send(result.recordset[0]);
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-vas-deferral", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASSaveDeferral
          '${req.body.categoryIDNumber}',
          '${req.body.deferringUser}',
          '${req.body.deferralCode}',
          '${req.body.otherReasonForDeferral}',
          '${req.body.dosage}'
      `;
      const result = await sql.query(sqlQuery);

      const updateVaccineMasterList = `update HR..VaccineMasterList SET SecondDose = 0 where Id = '${req.body.vaccineeID}'`;
      await sql.query(updateVaccineMasterList);
      const updateVaccineMasterListVAS = `update HR..VaccineVAS SET Dosage = 1 where Id = '${req.body.vasID}'`;
      await sql.query(updateVaccineMasterListVAS);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASInsertMasterList
        '${req.body.categoryIDNumber}',
        '${req.body.station}',
        '${req.body.dose}',
        '${req.body.registeringUser}',
        '${req.body.registeringLead}'
      `;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/request-vaccine-details-revision", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_VASRequestUpdateVaccineeInformation
        '${req.body.categoryIDNumber}',
        '${req.body.remarks}'
      `;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/vaccination-survey", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const surveyObj = JSON.parse(req.body.surveyDetails);
      await sql.connect(sqlConfig);
      const transaction = new sql.Transaction();
      await transaction.begin();
      try {
        for (const surveyDetails of surveyObj) {
          await new sql.Request(transaction)
            .query`INSERT INTO HR..VaccineSurvey (
            code,
            survey_code,
            status,
            remarks
          ) VALUES (
            ${req.body.userCode},
            ${surveyDetails.code},
            ${surveyDetails.status ? 1 : 0},
            ${surveyDetails.remarks}
          );`;
        }
        await transaction.commit();
        res.send({ success: "success" });
      } catch (error) {
        await transaction.rollback();
        res.send({ error });
      }
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/vaccination-survey", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere = "";

  if (req.query.withUserInfo) {
    sqlWhere = `where a.code = '${req.query.userCode}'`;
  }
  if (req.query.withBoosterDate) {
    sqlWhere = ``;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
        a.code,
        a.survey_code,
        a.status,
        a.remarks,
        a.datetime_created,
        b.Last_Name Last_Name_Raw,
        b.First_Name First_Name_Raw,
        b.Middle_Name Middle_Name_Raw,
        b.PhilHealth_ID PhilHealth_ID_Raw,
        b.Contact_Number Contact_Number_Raw,
        b.BoosterRemarks,
        b.ReferringCategory,
        c.Last_Name,
        c.First_Name,
        c.Middle_Name,
        c.Contact_Number,
        c.PhilHealth_ID,
        b.PriorityGroup,
        (select [DATE OF VAX] from HR..Vaccinated where DOSE = 3 and code = a.code) BoosterDate
      FROM [HR].[dbo].[VaccineSurvey] a
        left join HR..VaccineMasterList_Raw b on a.code = b.Category_ID_Number
        left join HR..VaccineMasterList c on a.code = c.Category_ID_Number
      ${sqlWhere}`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.put("/vax-information", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const personalInfoObj =
        req.body.personalInfo === "" ? null : req.body.personalInfo;
      const vaccineeInformationObj =
        req.body.vaccineeInformation === ""
          ? null
          : req.body.vaccineeInformation;
      const personalInfo = JSON.parse(personalInfoObj);
      const vaccineeInformation = JSON.parse(vaccineeInformationObj);
      await sql.connect(sqlConfig);
      const transaction = new sql.Transaction();
      await transaction.begin();
      try {
        if (personalInfo !== null) {
          const personalInfoQuery = `UPDATE HR..VaccineMasterList
            SET
            First_Name = '${personalInfo.firstName}',
            Last_Name = '${personalInfo.lastName}',
            Middle_Name = '${personalInfo.middleName}',
            Birthdate = '${personalInfo.birthdate}',
            Sex = '${personalInfo.gender}',
            Contact_Number = '${personalInfo.contactNumber}',
            Edit_Status = 1,
            Edit_Details = '${personalInfo.editDetails}',
            Edit_Datetime = getDate()
          WHERE Category_ID_Number = '${personalInfo.userCode}'`;
          await new sql.Request(transaction).query(personalInfoQuery);
        }

        if (vaccineeInformation !== null) {
          for (const vaxInfo of vaccineeInformation) {
            const vaccinatedQuery = `UPDATE HR..Vaccinated
              SET
              VACCINE_RECEIVED = '${vaxInfo.VACCINE_RECEIVED}',
              [DATE OF VAX] = '${vaxInfo.VaccinationDate}',
              Final_Vaccinator = '${vaxInfo.originalVaccinator}',
              Final_Lot_No = '${vaxInfo.originalLotNo}',
              Final_Batch_No = '${vaxInfo.originalBatchNo}'
            WHERE Id = '${vaxInfo.VaccineeID}'`;
            await new sql.Request(transaction).query(vaccinatedQuery);
          }
        }
        await transaction.commit();
        res.send({ success: "success" });
      } catch (error) {
        await transaction.rollback();
        console.log(error);
        res.send({ error });
      }
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.post("/save-vas-booster-raw", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_RegisterVaccineHouseholdMemberAlumni
        '${req.body.category}',
        '${req.body.categoryID}',
        '${req.body.categoryIDNumber}',
        '${req.body.philhealthIDNumber}',
        '${req.body.pwdID}',
        '${req.body.contactNumber}',
        '${req.body.firstName}',
        '${req.body.lastName}',
        '${req.body.middleName}',
        '${req.body.birthdate}',
        '${req.body.sex}',
        '${req.body.civilStatus}',
        '${req.body.fullAddress}',
        '${req.body.profession}',
        '${req.body.region}',
        '${req.body.province}',
        '${req.body.city}',
        '${req.body.barangay}',
        '${req.body.householdMemberCategory}',
        '${req.body.referringCategory}',
        '${req.body.referringEmployeeID}',
        '${req.body.referringEmployeeName}',
        '${req.body.referringEmployeeEmail}',
        '${req.body.referringEmployeeContactNumber}',
        '${req.body.referringCollege}',
        '${req.body.qrCode}'
      `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      const allergiesVal = req.body.allergies == "" ? null : req.body.allergies;
      if (allergiesVal !== null) {
        const allergies = req.body.allergies.split(",");
        allergies.forEach(async function (item, index) {
          const updateAllergies = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateAllergies);
        });
      }

      const comorbiditiesVal =
        req.body.comorbidities == "" ? null : req.body.comorbidities;
      if (comorbiditiesVal !== null) {
        const comorbidities = req.body.comorbidities.split(",");
        comorbidities.forEach(async function (item, index) {
          const updateComorbidities = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes', With_Comorbidity = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateComorbidities);
        });
      }
      if (req.body.primaryDose === 3) {
        const updateBooster = `Update HR..VaccineMasterList_Raw SET Vaccinated = 1 where Category_ID_Number = '${req.body.categoryIDNumber}'`;
        await sql.connect(sqlConfig);
        await sql.query(updateBooster);
      }

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

router.post("/save-vas-for-booster", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const screeningStation = `exec HR..sp_VASUpdateScreeningStation
            '${req.body.categoryIDNumber}',
            '${req.body.deferral}',
            '${req.body.dosage}',
            '${req.body.healthScreening}',
            '${req.body.otherReasonOfDeferral}',
            '${req.body.bloodPressure}',
            '${req.body.heartRate}',
            '${req.body.respiratoryRate}',
            '${req.body.temperature}',
            '${req.body.oxygenSaturation}',
            '${req.body.screeningCategory}',
            '${req.body.screeningDateTime}',
            '${req.body.screeningUser}',
            '${req.body.screeningLead}',
            ${
              req.body.vaccinationDateTime != ""
                ? `'${req.body.vaccinationDateTime}'`
                : null
            },
            '${req.body.station}',
            '${req.body.vasID}'
        `;
      const screeningresult = await sql.query(screeningStation);

      const vaccinationStation = `exec HR..sp_VASUpdateVaccinationStation
            '${req.body.vaccineManufacturer}',
            '${req.body.batchNumber}',
            '${req.body.lotNumber}',
            '${req.body.vaccinator}',
            '${req.body.professionOfVaccinator}',
            '${req.body.firstDose}',
            '${req.body.secondDose}',
            '${req.body.adverseEffects}',
            '${req.body.dosage}',
            '${req.body.station}',
            '${req.body.screeningDateTime}',
            ${
              req.body.vaccinationDateTime != ""
                ? `'${req.body.vaccinationDateTime}'`
                : null
            },
            '${req.body.vaccinatingUser}',
            '${req.body.vaccinatingLead}',
            '${req.body.vasID}'
        `;
      const vaccinationResult = await sql.query(vaccinationStation);
      const updateBooster = `Update HR..VaccineVAS SET DateTimeCreated = '${req.body.screeningDateTime}', DischargingUser = '${req.body.vaccinatingLead}', DischargingLead = '${req.body.vaccinatingLead}', DischargeDateTime = '${req.body.screeningDateTime}' where Id = '${req.body.vasID}'`;
      const boosterVas = await sql.query(updateBooster);

      if (req.body.boosterUploading == "1") {
        const updateOtherDose = `Update HR..VaccineVAS SET DateTimeCreated = null, DischargeDateTime = null, VaccinationDateTime = null, ScreeningDateTime = null where Category_ID_Number = '${req.body.categoryIDNumber}' and (Dosage = 1 or Dosage = 2)`;

        await sql.query(updateOtherDose);
      }

      if (req.body.boosterUploading == "1") {
        const updateOtherDose = `Update HR..VaccineVAS SET DateTimeCreated = null, DischargeDateTime = null, VaccinationDateTime = null, ScreeningDateTime = null where Category_ID_Number = '${req.body.categoryIDNumber}' and (Dosage = 1 or Dosage = 2)`;

        await sql.query(updateOtherDose);
      }
      if (req.body.primaryDose == "2") {
        const updateOtherDose = `Update HR..VaccineVAS SET DateTimeCreated = null, DischargeDateTime = null, VaccinationDateTime = null, ScreeningDateTime = null where Category_ID_Number = '${req.body.categoryIDNumber}' and Dosage = 1`;

        await sql.query(updateOtherDose);
      }
      res.send(screeningresult.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-vas-deferral", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.categoryIDNumber) {
    res.send({ error: "Category ID Number Required." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..vw_VaccineDeferrals where CategoryIDNumber = '${req.query.categoryIDNumber}'`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-vas-masterlist", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_SaveVASMasterList
        '${req.body.code}',
        '${req.body.station}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec HR..sp_UpdateVaccineInfo
        '${req.body.code}',
        '${req.body.mobileNo}'
      `;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-vaccine-config-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.period) {
    res.send({ error: "Period Required." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..VaccineConfigByDate where Period = '${req.query.period}'`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-vaccine-users-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhere = "";

  if (req.query.userID) {
    sqlWhere = `where UserID = '${req.query.userID}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..VaccineVASUserAccess ${sqlWhere} order by DateTimeCreated desc`;
      const result = await sql.query(sqlQuery);
      res.send({
        result: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-vaccinators-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..VaccineVaccinator order by Name`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-companies-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..VaccineVASCompanies`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-provinces/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.regionID) {
    res.send({ error: "Region ID Required." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..RegionProvince where Region = '${req.query.regionID}'`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-cities/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.provinceID) {
    res.send({ error: "Province ID Required." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..towncity WHERE TOWNCITY LIKE '${req.query.provinceID}%'`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-barangays/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.cityID) {
    res.send({ error: "City ID Required." });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..BarangayListing WHERE BARANGaY LIKE '${req.query.cityID}%'`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/get-vaccinated/", (req, res) => {
  var sqlWhere = "";
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.dateFrom || !req.query.dateTo) {
    res.send({ error: "Inclusive Dates Required." });
    return;
  }

  if (req.query.vaccine) {
    var sqlWhere = `and VACCINE_RECEIVED = '${req.query.vaccine}'`;
  }

  if (req.query.aefiSymptoms) {
    var sqlWhere = `and AEFI_SYMPTOMS like '%${req.query.aefiSymptoms}%'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select vac.*,v.*,vas.Station from HR..Vaccinated vac 
        join HR..VaccineMasterList v on v.Category_ID_Number = vac.CODE
		    join HR..VaccineVAS vas on vas.ID = vac.VASId
        where convert(date, [DATE OF VAX]) >= '${req.query.dateFrom}' 
        and convert(date, [DATE OF VAX]) <= '${req.query.dateTo}'
        ${sqlWhere}`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-monitoring-vaccinated", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const aefiSymptom =
        req.body.aefiSymptom == "" ? null : `'${req.body.aefiSymptom}'`;
      const vaccine = req.body.vaccine == "" ? null : `'${req.body.vaccine}'`;
      const aefiSymptomOthers =
        req.body.aefiSymptomOthers == ""
          ? null
          : `'${req.body.aefiSymptomOthers}'`;
      const aefiRemarks =
        req.body.aefiRemarks == "" ? null : `'${req.body.aefiRemarks}'`;
      let sqlQuery = "";
      if (req.body.type === "vaccinated") {
        sqlQuery = `exec HR..sp_VASDischargeVaccinee
                '${req.body.vaccinedID}',
                '${req.body.code}',
                ${aefiSymptom},
                ${aefiSymptomOthers},
                ${aefiRemarks},
                ${vaccine},
                ${req.body.dischargingUser},
                ${req.body.dischargingLead},
                '${req.body.vasID}'
            `;
      } else {
        sqlQuery = `exec HR..sp_VASUpdateVaccinedDischarged
                '${req.body.vaccinedID}',
                ${aefiSymptom},
                ${aefiSymptomOthers},
                ${aefiRemarks},
                ${vaccine}
              `;
      }
      await sql.connect(sqlConfig);
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

router.get("/vaccine-form/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  // if (!req.query.employeeID) {
  //   res.send({ error: 'ID Required.' });
  //   return;
  // }
  if (req.query.employeeID) {
    var sqlWhere = `where Category_ID_Number = '${req.query.employeeID}'`;
  }

  if (req.query.hashKey) {
    var sqlWhere = `where Hashkey = '${req.query.hashKey}' COLLATE SQL_Latin1_General_CP1_CS_AS`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from 
        HR..VaccineMasterList
        ${sqlWhere}`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/vaccinee-for-approval/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  // if (!req.query.employeeID) {
  //   res.send({ error: 'ID Required.' });
  //   return;
  // }
  if (req.query.employeeID) {
    var sqlWhere = `where Category_ID_Number = '${req.query.employeeID}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from 
        HR..VaccineMasterList_Raw
        ${sqlWhere}`;
      const result = await sql.query(sqlQuery);

      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/register-employee-vaccine-user", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_RegisterUserVaccineMasterlist
                '${req.body.category}',
                '${req.body.categoryID}',
                '${req.body.categoryIDNumber}',
                '${req.body.philhealthID}',
                '${req.body.pwdID}',
                '${req.body.qrCode}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/register-household-member-vaccine", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      let sqlQuery = "";
      if (req.body.householdMemberCategory == "employee") {
        sqlQuery = `exec HR..sp_RegisterVaccineHouseholdMember
                '${req.body.category}',
                '${req.body.categoryID}',
                '${req.body.categoryIDNumber}',
                '${req.body.philhealthIDNumber}',
                '${req.body.pwdID}',
                '${req.body.contactNumber}',
                '${req.body.firstName}',
                '${req.body.lastName}',
                '${req.body.middleName}',
                '${req.body.birthdate}',
                '${req.body.sex}',
                '${req.body.civilStatus}',
                '${req.body.fullAddress}',
                '${req.body.profession}',
                '${req.body.region}',
                '${req.body.province}',
                '${req.body.city}',
                '${req.body.barangay}',
                '${req.body.householdMemberCategory}',
                '${req.body.referringCategory}',
                '${req.body.referringEmployeeID}',
                '${req.body.referringEmployeeName}',
                '${req.body.qrCode}'
            `;
      } else {
        sqlQuery = `exec HR..sp_RegisterVaccineHouseholdMemberAlumni
                '${req.body.category}',
                '${req.body.categoryID}',
                '${req.body.categoryIDNumber}',
                '${req.body.philhealthIDNumber}',
                '${req.body.pwdID}',
                '${req.body.contactNumber}',
                '${req.body.firstName}',
                '${req.body.lastName}',
                '${req.body.middleName}',
                '${req.body.birthdate}',
                '${req.body.sex}',
                '${req.body.civilStatus}',
                '${req.body.fullAddress}',
                '${req.body.profession}',
                '${req.body.region}',
                '${req.body.province}',
                '${req.body.city}',
                '${req.body.barangay}',
                '${req.body.householdMemberCategory}',
                '${req.body.referringCategory}',
                '${req.body.referringEmployeeID}',
                '${req.body.referringEmployeeName}',
                '${req.body.referringEmployeeEmail}',
                '${req.body.referringEmployeeContactNumber}',
                '${req.body.referringCollege}',
                '${req.body.qrCode}'
            `;
      }

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      const allergiesVal = req.body.allergies == "" ? null : req.body.allergies;
      if (allergiesVal !== null) {
        const allergies = req.body.allergies.split(",");
        allergies.forEach(async function (item, index) {
          const updateAllergies = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateAllergies);
        });
      }

      const comorbiditiesVal =
        req.body.comorbidities == "" ? null : req.body.comorbidities;
      if (comorbiditiesVal !== null) {
        const comorbidities = req.body.comorbidities.split(",");
        comorbidities.forEach(async function (item, index) {
          const updateComorbidities = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes', With_Comorbidity = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateComorbidities);
        });
      }

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

router.post("/save-corporate-preregistration", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASSaveCorporatePreregistration
            '${req.body.category}',
            '${req.body.categoryID}',
            '${req.body.categoryIDNumber}',
            '${req.body.philhealthID}',
            '${req.body.pwdID}',
            '${req.body.lastName}',
            '${req.body.firstName}',
            '${req.body.middleName}',
            '${req.body.suffix}',
            '${req.body.contactNumber}',
            '${req.body.fullAddress}',
            '${req.body.region}',
            '${req.body.province}',
            '${req.body.city}',
            '${req.body.barangay}',
            '${req.body.gender}',
            '${req.body.birthdate}',
            '${req.body.civilStatus}',
            '${req.body.employmentStatus}',
            '${req.body.directCovid}',
            '${req.body.profession}',
            '${req.body.companyName}',
            '${req.body.companyProvince}',
            '${req.body.companyAddress}',
            '${req.body.companyContactNumber}',
            '${req.body.pregnancy}',
            '${req.body.drugAllergy}',
            '${req.body.foodAllergy}',
            '${req.body.insectAllergy}',
            '${req.body.latexAllergy}',
            '${req.body.moldAllergy}',
            '${req.body.petAllergy}',
            '${req.body.pollenAllergy}',
            '${req.body.withComorbidity}',
            '${req.body.hypertension}',
            '${req.body.heartDisease}',
            '${req.body.kidneyDisease}',
            '${req.body.diabetesMellitus}',
            '${req.body.bronchialAsthma}',
            '${req.body.immunodeficiencyStatus}',
            '${req.body.cancer}',
            '${req.body.others}',
            '${req.body.patientDiagnosedWithCovid}',
            '${req.body.dateOfCovid}',
            '${req.body.classificationOfCovid}',
            '${req.body.providedConsent}',
            '${req.body.householdMemberCategory}',
            '${req.body.referringCategory}',
            '${req.body.referringEmployeeID}',
            '${req.body.referringEmployeeName}',
            '${req.body.referringEmployeeEmail}',
            '${req.body.referringEmployeeContactNumber}',
            '${req.body.qrCode}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/update-informed-consent-form", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASAcceptConsent
                '${req.body.categoryIDNumber}',
                '${req.body.dose}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/register-corporate-user-vaccine", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      sqlQuery = `exec HR..sp_VASRegisterCorporateVaccinee
                '${req.body.category}',
                '${req.body.categoryID}',
                '${req.body.categoryIDNumber}',
                '${req.body.philhealthIDNumber}',
                '${req.body.pwdID}',
                '${req.body.contactNumber}',
                '${req.body.firstName}',
                '${req.body.lastName}',
                '${req.body.middleName}',
                '${req.body.birthdate}',
                '${req.body.sex}',
                '${req.body.civilStatus}',
                '${req.body.fullAddress}',
                '${req.body.profession}',
                '${req.body.region}',
                '${req.body.province}',
                '${req.body.city}',
                '${req.body.barangay}',
                '${req.body.householdMemberCategory}',
                '${req.body.referringCategory}',
                '${req.body.referringEmployeeID}',
                '${req.body.referringEmployeeName}',
                '${req.body.referringEmployeeEmail}',
                '${req.body.referringEmployeeContactNumber}',
                '${req.body.companyName}',
                '${req.body.companyProvince}',
                '${req.body.companyAddress}',
                '${req.body.companyContactNumber}',
                '${req.body.hashKey}',
                '${req.body.qrCode}',
                '${req.body.priorityGroup}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      const allergiesVal = req.body.allergies == "" ? null : req.body.allergies;
      if (allergiesVal !== null) {
        const allergies = req.body.allergies.split(",");
        allergies.forEach(async function (item, index) {
          const updateAllergies = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateAllergies);
        });
      }

      const comorbiditiesVal =
        req.body.comorbidities == "" ? null : req.body.comorbidities;
      if (comorbiditiesVal !== null) {
        const comorbidities = req.body.comorbidities.split(",");
        comorbidities.forEach(async function (item, index) {
          const updateComorbidities = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes', With_Comorbidity = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateComorbidities);
        });
      }

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

router.post("/register-vaccinated", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      sqlQuery = `exec HR..sp_VASRegisterVaccinated
                '${req.body.category}',
                '${req.body.categoryID}',
                '${req.body.categoryIDNumber}',
                '${req.body.philhealthIDNumber}',
                '${req.body.pwdID}',
                '${req.body.contactNumber}',
                '${req.body.firstName}',
                '${req.body.lastName}',
                '${req.body.middleName}',
                '${req.body.birthdate}',
                '${req.body.sex}',
                '${req.body.civilStatus}',
                '${req.body.fullAddress}',
                '${req.body.profession}',
                '${req.body.region}',
                '${req.body.province}',
                '${req.body.city}',
                '${req.body.barangay}',
                '${req.body.householdMemberCategory}',
                '${req.body.referringCategory}',
                '${req.body.referringEmployeeID}',
                '${req.body.referringEmployeeName}',
                '${req.body.referringEmployeeEmail}',
                '${req.body.referringEmployeeContactNumber}',
                '${req.body.companyName}',
                '${req.body.companyProvince}',
                '${req.body.companyAddress}',
                '${req.body.companyContactNumber}',
                '${req.body.hashKey}',
                '${req.body.qrCode}',
                '${req.body.priorityGroup}',
                '${req.body.remarks}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      const allergiesVal = req.body.allergies == "" ? null : req.body.allergies;
      if (allergiesVal !== null) {
        const allergies = req.body.allergies.split(",");
        allergies.forEach(async function (item, index) {
          const updateAllergies = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateAllergies);
        });
      }

      const comorbiditiesVal =
        req.body.comorbidities == "" ? null : req.body.comorbidities;
      if (comorbiditiesVal !== null) {
        const comorbidities = req.body.comorbidities.split(",");
        comorbidities.forEach(async function (item, index) {
          const updateComorbidities = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes', With_Comorbidity = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateComorbidities);
        });
      }

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

router.post("/register-vaccinated-with-booster", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      sqlQuery = `exec HR..sp_VASRegisterVaccinatedBooster
                '${req.body.category}',
                '${req.body.categoryID}',
                '${req.body.categoryIDNumber}',
                '${req.body.philhealthIDNumber}',
                '${req.body.pwdID}',
                '${req.body.contactNumber}',
                '${req.body.firstName}',
                '${req.body.lastName}',
                '${req.body.middleName}',
                '${req.body.birthdate}',
                '${req.body.sex}',
                '${req.body.civilStatus}',
                '${req.body.fullAddress}',
                '${req.body.profession}',
                '${req.body.region}',
                '${req.body.province}',
                '${req.body.city}',
                '${req.body.barangay}',
                '${req.body.householdMemberCategory}',
                '${req.body.referringCategory}',
                '${req.body.referringEmployeeID}',
                '${req.body.referringEmployeeName}',
                '${req.body.referringEmployeeEmail}',
                '${req.body.referringEmployeeContactNumber}',
                '${req.body.companyName}',
                '${req.body.companyProvince}',
                '${req.body.companyAddress}',
                '${req.body.companyContactNumber}',
                '${req.body.hashKey}',
                '${req.body.qrCode}',
                '${req.body.priorityGroup}',
                '${req.body.remarks}',
                '${req.body.boosterRemarks}',
                '${req.body.surveyCode}',
                '${req.body.surveyAnswer}',
                '${req.body.surveyRemarks}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      const allergiesVal = req.body.allergies == "" ? null : req.body.allergies;
      if (allergiesVal !== null) {
        const allergies = req.body.allergies.split(",");
        allergies.forEach(async function (item, index) {
          const updateAllergies = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateAllergies);
        });
      }

      const comorbiditiesVal =
        req.body.comorbidities == "" ? null : req.body.comorbidities;
      if (comorbiditiesVal !== null) {
        const comorbidities = req.body.comorbidities.split(",");
        comorbidities.forEach(async function (item, index) {
          const updateComorbidities = `Update HR..VaccineMasterList_Raw SET ${item} = '01_Yes', With_Comorbidity = '01_Yes' where Category_ID_Number = '${req.body.categoryIDNumber}'`;
          await sql.connect(sqlConfig);
          const result = await sql.query(updateComorbidities);
        });
      }

      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: result.recordset[0].MSG,
        categoryNumber: result.recordset[0].CATEGORYNUMBER,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/register-employee-vaccine", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_RegisterVaccineMasterlist
                '${req.body.category}',
                '${req.body.categoryID}',
                '${req.body.categoryIDNumber}',
                '${req.body.philhealthID}',
                '${req.body.pwdID}',
                '${req.body.contactNumber}',
                '${req.body.firstName}',
                '${req.body.lastName}',
                '${req.body.middleName}',
                '${req.body.department}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/set-configurations-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASSetConfiguration
                '${req.body.period}',
                '${req.body.brand}',
                '${req.body.batchNo}',
                '${req.body.lotNo}',
                '${req.body.dose}',
                '${req.body.registrationLead}',
                '${req.body.screeningLead}',
                '${req.body.vaccinationLead}',
                '${req.body.dischargingLead}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/update-configuration-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASUpdateConfiguration
                '${req.body.id}',
                '${req.body.brand}',
                '${req.body.batchNo}',
                '${req.body.lotNo}',
                '${req.body.dose}',
                '${req.body.registrationLead}',
                '${req.body.screeningLead}',
                '${req.body.vaccinationLead}',
                '${req.body.dischargingLead}'
            `;

      await sql.connect(sqlConfig);
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

router.post("/register-vaccinator-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASRegisterVaccinator
                '${req.body.period}',
                '${req.body.name}',
                '${req.body.licenseNumber}',
                '${req.body.profession}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/save-company-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASSaveCorporateCompany
                '${req.body.companyName}',
                '${req.body.companyShortCode}',
                '${req.body.companyProvince}',
                '${req.body.companyAddress}',
                '${req.body.companyContactNumber}',
                '${req.body.username}',
                '${req.body.password}',
                '${req.body.firstName}',
                '${req.body.middleName}',
                '${req.body.lastName}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/update-company-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASUpdateCorporateCompany
                '${req.body.companyName}',
                '${req.body.companyProvince}',
                '${req.body.companyAddress}',
                '${req.body.companyContactNumber}',
                '${req.body.username}',
                '${req.body.password}',
                '${req.body.firstName}',
                '${req.body.middleName}',
                '${req.body.lastName}',
                '${req.body.companyID}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/insert-booster-dose-vaccinated", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASFullyInsertToVaccinated
                '${req.body.code}',
                '${req.body.lastName}',
                '${req.body.firstName}',
                '${req.body.middleName}',
                '${req.body.mobile}',
                '${req.body.vaccineReceived}',
                '${req.body.dateOfVax}',
                '${req.body.dose}',
                '${req.body.finalVaccinator}',
                '${req.body.finalLotNo}',
                '${req.body.finalBatchNo}',
                '${req.body.vaccineeNo}'
            `;
      await sql.connect(sqlConfig);

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

router.post("/insert-to-vaccinated-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASInsertToVaccinated
                '${req.body.code}',
                '${req.body.lastName}',
                '${req.body.firstName}',
                '${req.body.middleName}',
                '${req.body.mobile}',
                '${req.body.vaccineReceived}',
                '${req.body.dose}',
                '${req.body.vasID}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      if (req.body.boosterUploading == "1") {
        const updateVaccinatedData = `Update HR..Vaccinated SET [DATE OF VAX] = '${req.body.vaccinationDateTime}' where CODE ='${req.body.categoryIDNumber}' and DOSE = 3`;
        await sql.query(updateVaccinatedData);
        // if (req.body.dose == '3') {
        //   const updateOtherDoses = `Update HR..Vaccinated SET [DATE OF VAX] = null where CODE = '${req.body.categoryIDNumber}' and (DOSE = 1 or DOSE = 2)`
        //   await sql.query(updateOtherDoses);
        // }
      }

      if (req.body.primaryUploading == "1") {
        const updateVaccinatedData = `Update HR..Vaccinated SET [DATE OF VAX] = '${req.body.vaccinationDateTime}' where CODE ='${req.body.categoryIDNumber}'`;
        await sql.query(updateVaccinatedData);
        if (req.body.primaryDose == "2") {
          const updateOtherDoses = `Update HR..Vaccinated SET [DATE OF VAX] = null where CODE = '${req.body.categoryIDNumber}' and DOSE = 1`;
          await sql.query(updateOtherDoses);
        }
      }

      res.send({
        success: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/remove-vaccinator-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASRemoveVaccinator
                '${req.body.id}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/update-vaccinator-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASUpdateVaccinator
                '${req.body.id}',
                '${req.body.name}',
                '${req.body.licenseNumber}',
                '${req.body.profession}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/set-vaccinator-vas", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASSetVaccinator
                '${req.body.id}',
                '${req.body.period}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/set-vaccine-card-update-request", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VaccineCardUpdateRequest
                '${req.body.vaccineNo}',
                '${req.body.status}',
                '${req.body.remarks}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/update-vaccine-card-details", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_VASUpdateVaccineCardDetails
                '${req.body.vaccineNo}',
                '${req.body.lastName}',
                '${req.body.firstName}',
                '${req.body.middleName}',
                '${req.body.birthdate}',
                '${req.body.gender}',
                '${req.body.contactNo}',
                '${req.body.phicNo}',
                '${req.body.address}',
                '${req.body.manufacturer}',
                '${req.body.firstDoseDate}',
                '${req.body.secondDoseDate}',
                '${req.body.batchNo}',
                '${req.body.lotNo}',
                '${req.body.secondDoseBatchNo}',
                '${req.body.secondDoseLotNo}',
                '${req.body.firstDoseVaccinator}',
                '${req.body.secondDoseVaccinator}',
                '${req.body.remarks}',
                '${req.body.status}'
            `;
      await sql.connect(sqlConfig);
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

router.post("/update-employee-vaccine-category", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.code) {
    res.send({ error: "ID Required." });
    return;
  }

  void (async function () {
    try {
      if (req.body.formType == "registration") {
        var sqlQuery = `exec HR..sp_UpdateUserVaccineMasterlistCategory
                  '${req.body.category}',
                  '${req.body.categoryID}',
                  '${req.body.philhealthID}',
                  '${req.body.pwdID}',
                  '${req.body.code}'
              `;
      } else {
        var sqlQuery = `exec HR..sp_UpdateVaccineMasterlistCategory
                  '${req.body.category}',
                  '${req.body.categoryID}',
                  '${req.body.philhealthID}',
                  '${req.body.pwdID}',
                  '${req.body.code}'
                `;
      }
      await sql.connect(sqlConfig);
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

router.post("/update-employee-vaccine-personal-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.code) {
    res.send({ error: "User Code Required." });
    return;
  }
  void (async function () {
    try {
      if (req.body.formType == "registration") {
        var sqlQuery = `exec HR..sp_UpdateUserVaccineMasterlistPersonalInfo
                  '${req.body.lastName}',
                  '${req.body.firstName}',
                  '${req.body.middleName}',
                  '${req.body.suffix}',
                  '${req.body.gender}',
                  '${req.body.birthdate}',
                  '${req.body.civilStatus}',
                  '${req.body.contactNumber}',
                  '${req.body.fullAddress}',
                  '${req.body.region}',
                  '${req.body.province}',
                  '${req.body.municipality}',
                  '${req.body.barangay}',
                  '${req.body.employmentStatus}',
                  '${req.body.directCovid}',
                  '${req.body.profession}',
                  '${req.body.code}'
              `;
      } else {
        var sqlQuery = `exec HR..sp_UpdateVaccineMasterlistPersonalInfo
                  '${req.body.lastName}',
                  '${req.body.firstName}',
                  '${req.body.middleName}',
                  '${req.body.suffix}',
                  '${req.body.gender}',
                  '${req.body.birthdate}',
                  '${req.body.civilStatus}',
                  '${req.body.contactNumber}',
                  '${req.body.fullAddress}',
                  '${req.body.region}',
                  '${req.body.province}',
                  '${req.body.municipality}',
                  '${req.body.barangay}',
                  '${req.body.employmentStatus}',
                  '${req.body.directCovid}',
                  '${req.body.profession}',
                  '${req.body.code}'
              `;
      }
      await sql.connect(sqlConfig);
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

router.post("/update-employee-vaccine-other-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.code) {
    res.send({ error: "User Code Required." });
    return;
  }

  void (async function () {
    try {
      if (req.body.formType == "registration") {
        var sqlQuery = `exec HR..sp_UpdateUserVaccineMasterlistOtherInfo
                '${req.body.employerName}',
                '${req.body.employerLGU}',
                '${req.body.employerAddress}',
                '${req.body.employerContactNumber}',
                '${req.body.code}'
            `;
      } else {
        var sqlQuery = `exec HR..sp_UpdateVaccineMasterlistOtherInfo
                  '${req.body.employerName}',
                  '${req.body.employerLGU}',
                  '${req.body.employerAddress}',
                  '${req.body.employerContactNumber}',
                  '${req.body.code}'
              `;
      }
      await sql.connect(sqlConfig);
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

router.post("/update-employee-vaccine-profile-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.code) {
    res.send({ error: "User Code Required." });
    return;
  }

  void (async function () {
    try {
      if (req.body.formType == "registration") {
        var sqlQuery = `exec HR..sp_UpdateUserVaccineMasterlistProfileInfo
                '${req.body.pregnancyStatus}',
                '${req.body.drugAllergy}',
                '${req.body.foodAllergy}',
                '${req.body.insectAllergy}',
                '${req.body.latexAllergy}',
                '${req.body.moldAllergy}',
                '${req.body.petAllergy}',
                '${req.body.pollenAllergy}',
                '${req.body.withComorbidity}',
                '${req.body.hypertension}',
                '${req.body.heartDisease}',
                '${req.body.kidneyDisease}',
                '${req.body.diabetesMellitus}',
                '${req.body.bronchialAsthma}',
                '${req.body.immunodeficiencyStatus}',
                '${req.body.cancer}',
                '${req.body.others}',
                '${req.body.patientWasDiagnosedWithCovid}',
                '${req.body.dateOfCovidCollection}',
                '${req.body.covidClassification}',
                '${req.body.providedElectronicInformedConsent}',
                '${req.body.code}'
            `;
      } else {
        var sqlQuery = `exec HR..sp_UpdateVaccineMasterlistProfileInfo
                  '${req.body.pregnancyStatus}',
                  '${req.body.drugAllergy}',
                  '${req.body.foodAllergy}',
                  '${req.body.insectAllergy}',
                  '${req.body.latexAllergy}',
                  '${req.body.moldAllergy}',
                  '${req.body.petAllergy}',
                  '${req.body.pollenAllergy}',
                  '${req.body.withComorbidity}',
                  '${req.body.hypertension}',
                  '${req.body.heartDisease}',
                  '${req.body.kidneyDisease}',
                  '${req.body.diabetesMellitus}',
                  '${req.body.bronchialAsthma}',
                  '${req.body.immunodeficiencyStatus}',
                  '${req.body.cancer}',
                  '${req.body.others}',
                  '${req.body.patientWasDiagnosedWithCovid}',
                  '${req.body.dateOfCovidCollection}',
                  '${req.body.covidClassification}',
                  '${req.body.providedElectronicInformedConsent}',
                  '${req.body.code}'
              `;
      }
      await sql.connect(sqlConfig);
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

router.post("/update-employee-vaccine-referring-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.code) {
    res.send({ error: "User Code Required." });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_UpdateUserVaccineMasterlistReferringInfo
              '${req.body.referringEmployeeID}',
              '${req.body.referringEmployeeName}',
              '${req.body.userCategory}',
              '${req.body.code}'
          `;
      await sql.connect(sqlConfig);
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

router.post("/send-email-schedule", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    const emailFromInfo = {
      email: "service-notification@uerm.edu.ph",
      name: "UERM Service Notification",
    };

    const emailToInfo = {
      email: req.body.email,
      name: req.body.name,
      message: req.body.message,
    };

    const email = await helpers.sendEmailMailJet(emailFromInfo, emailToInfo);
    res.send(email);
  })();
});

router.post("/send-email", (req, res) => {
  const mailjet = require("node-mailjet").connect(
    process.env.MAIL_JET_PUBLIC_KEY,
    process.env.MAIL_JET_PRIVATE_KEY,
  );
  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "it@uerm.edu.ph",
          Name: "UERM Service Notification",
        },
        To: [
          {
            Email: `${req.body.emailAddress}`,
            Name: `${req.body.name}`,
          },
        ],
        TemplateID: 2812448,
        TemplateLanguage: true,
        Subject: `${req.body.emailSubject}`,
        Variables: {
          link: `${req.body.reservationLink}`,
        },
      },
    ],
  });
  request
    .then((result) => {
      res.send(result.body);
    })
    .catch((err) => {
      res.send(err.statusCode);
    });
});

router.get("/get-token-bearer", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    const token = await helpers.getTokenBearerTextMessage();
    res.send(token);
  })();
});

router.get("/get-refresh-token-bearer", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    // const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIzMjg5MTM4OCIsInpvbmVpbmZvIjoiQXNpYS9NYW5pbGEiLCJjc3MiOiJzbWFydC5jc3MiLCJyb2xlIjoiMiIsImlzcyI6InJlc3QgYXV0aCIsIm9pZCI6IjMyODkxMzg0IiwibG9jYWxlIjoiZW4tUEgiLCJyaWQiOiIyMzAiLCJhdWQiOiJyZXN0IGFwaSIsInRvbiI6IjIiLCJzY29wZSI6WzIwNDIxLDIwNDIwLDIwMDAwLDIwNzUxLDIwNzUwLDIwNzM2LDIwNzM1LDIwNzM0LDIwNzMzLDIwNzMyLDIwNzMxLDIwNzMwXSwibmFtZSI6IlpBQ0FSSUFTLCBKRUZGUkVZIiwiZXhwIjoxNjE5MTk0OTgxLCJpYXQiOjE2MTkxOTMxODEsImp0aSI6InJTNXFGZnlrbXozWGY5TzFMVWI0M1pqIiwiZW1haWwiOiJqZWZmX3phY2FyaWFzQHVlcm0uZWR1LnBoIn0.ZRiBSmbPXrM_1LgE-p40O1wJYNtNP-TShMAVGVpJrZY'
    // const refreshToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJyZXN0IGFwaSIsInN1YiI6IjMyODkxMzg4IiwiaXNzIjoicmVzdCBhdXRoIiwiZXhwIjoxNjE5MjIxOTgxLCJpYXQiOjE2MTkxOTMxODEsImp0aSI6InJTNXFGZnlrbXozWGY5TzFMVWI0M1pqIn0.TnDbJiBtnAD73dGtyswSkLnCVHqn5KCn9g26ogzN5Ek'
    const accessToken = req.query.accessToken;
    const refreshToken = req.query.refreshToken;
    const token = await helpers.refreshTokenBearerTextMessage(
      accessToken,
      refreshToken,
    );
    res.send(token);
  })();
});

router.post("/send-text-message", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    const accessToken = req.query.accessToken;
    const message = {
      messageType: req.body.messageType,
      destination: req.body.destination,
      text: req.body.text,
    };
    const token = await helpers.sendTextMessage(accessToken, message);
    res.send(token);
  })();
});

router.post("/send-text-message-v2", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `insert into UERMSMS..Outbox
            (
              Msg,
              MPN,
              Status,
              Priority,
              UserID,
              COMNum,
              Datestamp,
              SourceApp
            )
              '${req.body.text}',
              '${req.body.destination}',
              '0',
              '2',
              'COVID-Vaccine Team',
              '1',
              getDate(),
              'UERM RamVax'
            `;
      await sql.connect(sqlConfig);
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

router.post("/send-email-template", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    const emailFromInfo = {
      email: "service-notification@uerm.edu.ph",
      name: "UERM Service Notification",
    };

    const emailToInfo = {
      subject: req.body.subject,
      title: req.body.title,
      email: req.body.email,
      name: req.body.name,
      message: req.body.message,
    };

    const email = await helpers.sendEmailTemplate(emailFromInfo, emailToInfo);
    res.send(email);
  })();
});

module.exports = router;

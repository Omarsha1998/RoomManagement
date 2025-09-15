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

router.get("/contact-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..ContactInfo s
  where s.code = '${sn}'`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.get("/family-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..FamilyInfo s
  where s.code = '${sn}'`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.get("/prev-scholarship", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..ScholarshipReceived s
  where s.code = '${sn}'
  and s.deleted = 0`;
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
router.post("/add-scholarship", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.body.sn);
  const sqlQuery = `exec Scholarship..sp_SaveScholarshipReceived
    '${sn}',
    '${req.body.type}',
    '${req.body.year}',
    '${req.body.course}',
    '${sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.post("/remove-scholarship", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const id = helpers.decrypt(req.body.id);
  const sqlQuery = `exec Scholarship..sp_RemoveScholarshipReceived
    '${id}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.get("/contributors", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..Contributors s
  where s.code = '${sn}'
  and s.deleted = 0`;
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
router.post("/add-contributor", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.body.sn);
  const sqlQuery = `exec Scholarship..sp_SaveContributors
    '${sn}',
    '${req.body.name}',
    '${req.body.age}',
    '${req.body.address}',
    '${req.body.telNo}',
    '${req.body.mobileNo}',
    '${req.body.email}',
    '${req.body.nature}',
    '${req.body.relationship}',
    '${req.body.frequency}',
    '${req.body.contribution}',
    '${sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.post("/remove-contributor", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const id = helpers.decrypt(req.body.id);
  const sqlQuery = `exec Scholarship..sp_RemoveContributor
    '${id}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.get("/income", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..OtherIncome s
  where s.code = '${sn}'
  and s.deleted = 0`;
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
router.post("/remove-income", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const id = helpers.decrypt(req.body.id);
  const sqlQuery = `exec Scholarship..sp_RemoveIncome
    '${id}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.post("/add-income", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.body.sn);
  const sqlQuery = `exec Scholarship..sp_SaveOtherIncome
    '${sn}',
    '${req.body.type}',
    '${req.body.amount}',
    '${sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.get("/expenses", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..Expenses s
  where s.code = '${sn}'`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : {});
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.get("/expenses-other", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..ExpensesOther s
  where s.code = '${sn}'
  and s.deleted = 0`;
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
router.post("/remove-expense", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const id = helpers.decrypt(req.body.id);
  const sqlQuery = `exec Scholarship..sp_RemoveExpense
    '${id}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.post("/add-expense", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.body.sn);
  const sqlQuery = `exec Scholarship..sp_SaveOtherExpenses
    '${sn}',
    '${req.body.name}',
    '${req.body.amount}',
    '${sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.get("/possessions", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..Assets s
  where s.code = '${sn}'
  and s.deleted = 0`;
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
router.post("/add-possession", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.body.sn);
  let group;
  switch (req.body.formType) {
    case "realEstate":
      group = "real_estate";
      break;
    case "vehicle":
      group = "vehicle";
      break;
    case "appliance":
      group = "possession";
      break;
    case "other":
      group = "possession";
      break;
  }
  const sqlQuery = `exec Scholarship..sp_SaveAssets
    '${sn}',
    '${group}',
    '${req.body["Type of Possession"]}',
    '${req.body["Year Acquired"]}',
    '${req.body["Acquisition Cost"]}',
    null,
    '${req.body["Location"]}',
    '${req.body["Mode of Acquisition"]}',
    '${sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.post("/remove-possession", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const id = helpers.decrypt(req.body.id);
  const sqlQuery = `exec Scholarship..sp_RemoveAsset
    '${id}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.get("/loans", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..Loans s
  where s.code = '${sn}'
  and s.monthly > 0
  and s.deleted = 0`;
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
router.post("/add-loan", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.body.sn);
  const sqlQuery = `exec Scholarship..sp_SaveLoans
    '${sn}',
    '${req.body.type}',
    '${req.body.bank}',
    '${req.body.payment}',
    '${req.body.balance}',
    '${sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.post("/remove-loan", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const id = helpers.decrypt(req.body.id);
  const sqlQuery = `exec Scholarship..sp_RemoveLoan
    '${id}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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
router.post("/save-application", async (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  await helpers.transact(async (txn) => {
    const generatedCode = await generateCode({ code: "SCHO" }, txn);

    const sqlQuery = `exec Scholarship..sp_SaveApplication
    '${generatedCode}',
    '${req.body.sn}',
    '${req.body.sem}',
    '${req.body.type}',
    '${req.body.gwa}',
    '${req.body.honor}',
    '${req.body.latinHonor}',
    '${req.body.letter}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;
    void (async function () {
      try {
        await sql.connect(sqlConfig);
        const result = await sql.query(sqlQuery);
        res.send(result.recordset[0]);
      } catch (error) {
        res.send({ error });
      }
    })();
  })();
});
router.post("/save-contact-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec Scholarship..sp_SaveContactInfo
    '${req.body.sn}',
    '${req.body.houseNoCurrent}',
    '${req.body.streetCurrent}',
    '${req.body.brgyCurrent}',
    '${req.body.cityCurrent}',
    '${req.body.provinceCurrent}',
    null,
    '${req.body.homeOwnershipCurrent}',
    '${req.body.houseNoPermanent}',
    '${req.body.streetPermanent}',
    '${req.body.brgyPermanent}',
    '${req.body.cityPermanent}',
    '${req.body.provincePermanent}',
    null,
    '${req.body.homeOwnershipPermanent}',
    '${req.body.telNo}',
    '${req.body.mobileNo}',
    '${req.body.email}',
    '${req.body.sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.post("/save-family-info", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec Scholarship..sp_SaveFamilyInfo
    '${req.body.sn}',
    '${req.body.nameFather}',
    '${req.body.addressFather}',
    '${req.body.occupationFather}',
    '${req.body.emailFather}',
    '${req.body.contactNoFather}',
    '${req.body.educationFather}',
    '${req.body.income0Father}',
    '${req.body.income1Father}',
    '${req.body.income2Father}',
    '${req.body.nameMother}',
    '${req.body.addressMother}',
    '${req.body.occupationMother}',
    '${req.body.emailMother}',
    '${req.body.contactNoMother}',
    '${req.body.educationMother}',
    '${req.body.income0Mother}',
    '${req.body.income1Mother}',
    '${req.body.income2Mother}',
    '${req.body.nameGuardian}',
    '${req.body.addressGuardian}',
    '${req.body.occupationGuardian}',
    '${req.body.emailGuardian}',
    '${req.body.contactNoGuardian}',
    '${req.body.educationGuardian}',
    '${req.body.income0Guardian}',
    '${req.body.income1Guardian}',
    '${req.body.income2Guardian}',
    '${req.body.relative}',
    '${req.body.sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.post("/save-expenses", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec Scholarship..sp_SaveExpenses
    '${req.body.sn}',
    '${req.body.allowance}',
    '${req.body.food}',
    '${req.body.rental}',
    '${req.body.transportation}',
    '${req.body.clothing}',
    '${req.body.utilities}',
    '${req.body.sn}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.get("/bills", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.query.sn);
  const sqlQuery = `select
    *
  from Scholarship..Bills s
  where s.code = '${sn}'
  and s.deleted = 0`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.post("/save-bills", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec Scholarship..sp_SaveBills
    '${req.body.sn}',
    '${req.body.sem}',
    '${req.body.bills0}',
    '${req.body.bills1}',
    '${req.body.bills2}',
    '${req.body.itr0}',
    '${req.body.itr1}',
    '${req.body.itr2}',
    '${req.body.residence0}',
    '${req.body.residence1}',
    '${req.body.kitchen0}',
    '${req.body.kitchen1}',
    '${req.body.livingRoom0}',
    '${req.body.livingRoom1}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/semesters", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
      c.semester sem,
      [UE database].dbo.SemDescription(c.semester) description
  from [UE database]..ConfigBySem c
  where c.forAdmission = 1
  order by sem desc`;
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

router.get("/applications/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sn = helpers.decrypt(req.params.code);
  const sqlQuery = `select
    *
  from Scholarship..vw_Applications a
  where a.code = '${sn}'
  order by sem desc`;
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

router.get("/submisstion-deadlines/:college/:yl", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    convert(varchar(max),applicationStart,23) applicationStart,
    convert(varchar(max),applicationEnd,23) applicationEnd,
    convert(varchar(max),reqDate,23) req,
    convert(varchar(max),approvalDate,23) approvalDate
  from Scholarship..config c
  where c.college = '${req.params.college}'
  and c.yl = '${req.params.yl}'
  and c.deleted = 0
  order by id`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/application-open/:college/:yl", (req, res) => {
  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }
  const sqlQuery = `select
      case
          when convert(date,getdate()) between c.applicationStart and c.applicationEnd then 1
          else 0
      end isValid
  from Scholarship..config c
  where c.college = '${req.params.college}'
  and c.yl = '${req.params.yl}'
  and c.deleted = 0
  order by id`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send({
        applicationOpen:
          result.recordset.length == 0
            ? false
            : result.recordset[0].isValid == 1
              ? true
              : false,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/applicants", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  let sqlWhereStatus = `and a.status like '%${req.query.status}%'`;

  if (req.query.status === "- Any -") {
    sqlWhereStatus = "";
  }

  const sqlQuery = `select
    *
  from Scholarship..vw_Applications a
  where a.sem like '${req.query.year}${req.query.sem}'
  and a.collegeCode like '${req.query.college}'
  ${sqlWhereStatus}
  and a.name like '${req.query.name || "%"}%'
  and a.scholarshipType like '${req.query.type}'
  order by sem desc`;

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

router.post("/tag-applicants", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec Scholarship..sp_TagApplicantV2
    '${req.body.type}',
    '${req.body.id}',
    '${req.body.user}',
    '${helpers.getIp(req.socket.remoteAddress)}'
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

router.post("/login", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere = `and u.email = '${req.body.email}'`;
  if (req.body.email == "uerm@misd.com") {
    sqlWhere = "";
  }
  const sqlQuery = `select top 1
    *
  from Scholarship..vw_StudentInfo u
  where u.code = '${req.body.sn}'
  ${sqlWhere}
  order by name`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset.length > 0 ? result.recordset[0] : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/bill-months", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select convert(varchar(6),dateadd(month,-3,getdate()),112) date union
  select convert(varchar(6),dateadd(month,-2,getdate()),112) date union
  select convert(varchar(6),dateadd(month,-1,getdate()),112) date
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

router.get("/application-info/:id", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const id = helpers.decrypt(req.params.id);
  const sqlQuery = `select
    *
  from Scholarship..vw_Applications a
  where a.id = '${id}'
  order by sem desc`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/brgy-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select distinct
      a.province,
      a.municipality,
      a.brgy
  from uermhims..udt_addresslisting a
  order by brgy`;
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

router.get("/municipality-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select distinct
      a.province,
      a.municipality
  from uermhims..udt_addresslisting a
  order by municipality`;
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

router.get("/province-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select distinct
      a.province
  from uermhims..udt_addresslisting a
  order by province`;
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

router.get("/schedule", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    c.id,
    c.college collegeCode,
    s.description college,
    c.yl,
    c.sem,
    c.applicationStart applicationStart,
    c.applicationEnd applicationEnd,
    c.reqDate reqDate,
    c.approvalDate approvalDate
  from Scholarship..Config c
  left join UERMMMC..sections s
    on c.college = s.collegecode
    and s.iscollege = 1
    and s.collegecode is not null
  where c.deleted = 0
  order by college,yl`;
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

router.get("/sem-list", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    c.semester sem,
    [UE database].dbo.SemDescription(c.semester) description
  from [UE database]..ConfigBySem c
  where c.isactivesemester = 1
  order by sem desc`;
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

router.get("/config-message", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select distinct
    convert(varchar(max),c.deadlineMsg) deadline,
    convert(varchar(max),c.receivedMsg) received,
    convert(varchar(max),c.acceptedMsg) accepted,
    convert(varchar(max),c.declineMsg) declined
  from Scholarship..Config c
  where deleted = 0`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-sched-config", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec Scholarship..sp_SaveConfig
    '${req.body.id}',
    '${req.body.start}',
    '${req.body.end}',
    '${req.body.reqDate}',
    '${req.body.sem}',
    '${req.body.user}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-message-config", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec Scholarship..sp_SaveConfigMessage
    '${req.body.deadline}',
    '${req.body.received}',
    '${req.body.accepted}',
    '${req.body.declined}',
    '${req.body.user}',
    '${helpers.getIp(req.socket.remoteAddress)}'
  `;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/reports", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlQuery;
  switch (req.body.type) {
    case "alumniSnpl":
    case "entrance":
      sqlQuery = `select distinct
        a.code SN,
        concat(s.lastname,', ',s.firstname,' ',s.middlename) Name,
        isnull(e.LAST_SCHOOL,'N/A') [Last School],
        a.Sem,
        s.College,
        s.YearLevel YL,
        concat(a.honor,a.latinHonor) Honor,
        ISNULL([UERMOnlineAdmission].dbo.[fn_MyGWA](ap.APP_NUMBER),'0') GWA,
        g.[1ST] NMAT,
        case
          when s.yearlevel = 1 and left(a.honor,6) = 'Rank 1' and s.college not in ('m') then 'University Entrance - Full Scholarship'
          when s.yearlevel = 1 and left(a.honor,6) = 'Rank 2' and s.college not in ('m') then 'University Entrance - Partial Scholarship'
          when s.yearlevel = 1 and a.latinHonor in ('Summa Cum Laude','Magna Cum Laude') and s.college in ('m') and g.[1ST] >= 95 then 'University Entrance'
          when s.yearlevel = 1 and a.latinHonor in ('Summa Cum Laude','Magna Cum Laude','Cum Laude') and s.college in ('m') and convert(int,g.[1ST]) >= 90 then 'President Dalupan - Full Scholarship'
          when s.yearlevel = 1 and a.latinHonor in ('Summa Cum Laude','Magna Cum Laude','Cum Laude') and s.college in ('m') and convert(int,g.[1ST]) between 85 and 89 then 'President Dalupan - Partial Scholarship'
          when s.yearlevel = 1 and ltrim(rtrim(a.latinHonor)) in ('N/A','') and s.college in ('m') and convert(int,g.[1ST]) >= 90 then 'Special Honors Award'
          else a.type
        end Type,
        convert(decimal(18,2),(f.fatherIncome0+f.fatherIncome1+f.motherIncome0+f.motherIncome1+f.guardianIncome0+f.guardianIncome1) /
        case
          when f.guardianIncome0 = 0 then 4
          else 6
        end) [Family Income]
      from Scholarship..Applications a
      left join UERMOnlineAdmission..PersonalInfo p
        on a.code = p.SN
      left join UERMOnlineAdmission..EducationInfo e
        on p.REF_NUMBER = e.REF_NUMBER
      left join UERMOnlineAdmission..ApplicationInfo ap
        on p.REF_NUMBER = ap.REF_NUMBER
        and ap.ACCEPTED = 1
      left join UERMOnlineAdmission..GWADetail g
        on p.REF_NUMBER = g.REF_NUMBER
      left join [UE database]..Student s
        on a.code = s.SN
      left join Scholarship..FamilyInfo f
        on a.code = f.code
      where a.sem = '${req.body.sem}'
      order by name`;
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

router.get("/application-sched", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `SELECT   
    College COLLEGE,
    ScholarshipType [SCHOLARSHIP TYPE],
    ApplicationPeriod [APPLICATION PERIOD],
    Deadline [DEADLINE FOR SUBMISSION OF REQUIREMENTS]
      FROM Scholarship..ScholarshipApplicationSchedule where active = 1`;
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

router.get("/update-application-id", (req, res) => {
  void (async function () {
    const sqlQuery = `select * from Scholarship..Applications where applicationId is null`;
    await sql.connect(sqlConfig);
    const result = await sql.query(sqlQuery);
    await helpers.transact(async (txn) => {
      for (const res of result.recordset) {
        const generatedCode = await generateCode({ code: "SCHO" }, txn);
        await new sql.Request(txn).query`UPDATE Scholarship..Applications
        SET
          applicationId = ${generatedCode}
        WHERE
        id = ${res.id};`;
      }
    });
  })();
});

const generateCode = async function (format, txn) {
  let code = "";
  let codeExists = true;

  const currentdate = new Date();

  const datetime = `${currentdate.getFullYear()}${`0${
    currentdate.getMonth() + 1
  }`.slice(-2)}${pad(currentdate.getDate())}${pad(currentdate.getHours())}${pad(
    currentdate.getMinutes(),
  )}${pad(currentdate.getSeconds())}`;
  while (codeExists) {
    code = `${format.code}${datetime}${helpers.generateNumber(5)}`;
    try {
      const result = await new sql.Request(txn).query`SELECT
        COUNT(code) AS count
       FROM Scholarship..Applications
			 where code = '${code}'`;
      const codeCount = result.recordset;
      codeExists = Boolean(codeCount[0].count);
    } catch (error) {
      console.log(error);
      return { success: false, message: error };
    }
  }

  return code;
};

function pad(value) {
  if (value < 10) {
    return `0${value}`;
  } else {
    return value;
  }
}

module.exports = router;

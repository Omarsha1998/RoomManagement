const express = require("express");
const router = express.Router();
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");

const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");

router.use(sanitize);

router.get("/", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from [UE database]..vw_Employees e
      order by name`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/department/:deptcode", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from [UE database]..vw_Employees e
      where e.dept_code = '${req.params.deptcode}'
      and e.is_active = 1
      and e.emp_class_code not in ('gl')
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
          };
        }),
      );
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/position/:poscode", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from [UE database]..vw_Employees e
      where e.pos_code = '${req.params.poscode}'
      and e.is_active = 1
      and e.emp_class_code not in ('gl')
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
          };
        }),
      );
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/absences", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.dateFrom) {
    res.send({ error: true, message: "Date from required!" });
  }
  if (!req.query.dateTo) {
    res.send({ error: true, message: "Date to required!" });
  }
  if (!req.query.department) {
    res.send({ error: true, message: "Department required!" });
  }
  void (async function () {
    try {
      const dateDiff =
        (new Date(req.query.dateTo) - new Date(req.query.dateFrom)) /
        (1000 * 60 * 60 * 24);

      const dates = [];

      for (let x = 0; x <= dateDiff; x++) {
        const currentDate = new Date(req.query.dateFrom);
        currentDate.setDate(currentDate.getDate() + x);

        dates.push(currentDate.toISOString().substring(0, 10));
      }

      await sql.connect(sqlConfig);
      const sqlQuery = `select * from
        (select
            e.code,
            e.name,
            e.department,
            e.position,
			      emp.EMP_STATUS_DESC empStatus,
            case
                when e.calType = 'REGULAR HOLIDAY' then 'LH'
                when e.calType = 'SPECIAL NON-WORKING HOLIDAY' then 'SH'
                when e.schedFrom = 'DAY OFF' then 'DO'
                when e.schedFrom = 'REST DAY' then 'RD'
                when e.schedFrom = 'WORK FROM HOME' then 'W'
                when e.schedFrom = 'UNDER QUARANTINE' then 'Q'
                when e.leaveType is not null then e.leaveType
                when e.isAbsent = 1 then 'A'
                else 'P'
            end status,
            e.transDate date
        from HR.dbo.fn_DTR('${req.query.dateFrom}','${req.query.dateTo}') e
        left join [UE database]..vw_Employees emp
          on e.code = emp.code
            where e.active = 1
            and (e.deptCode like '${
              req.query.department
            }' and e.posCode like '${req.query.position}')
            -- and (e.leaveType is not null or e.isAbsent = 1 or e.schedFrom in ('WORK FROM HOME','UNDER QUARANTINE'))
            ) src
        pivot (
            max(status)
            for date in ([${
              dates.length > 0 ? dates.join("],[") : req.query.dateFrom
            }])
        ) pvt
      order by name`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/dtr", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const employeeQuery = `select top 25
					e.CODE
				from [UE database]..vw_Employees e
				where e.EMP_CLASS_CODE = '${req.body.class}'
				and e.CODE not in (select code from UERMATT..NoDtr where deleted = 0)
				and e.CODE not in (select code from HR..TimeDataPosting where timeDataFrom = '${req.body.dateFrom}' and timeDataTo = '${req.body.dateTo}' and isCancelled = 0)
				and e.IS_ACTIVE = 1`;

      const sqlQuery = `select
        e.*
      from hr.dbo.fn_DTR('${req.body.dateFrom}','${req.body.dateTo}') e
      where e.code in (${employeeQuery})
      and e.active = 1
      and e.class = '${req.body.class}'
      order by e.department,e.name,e.transDate`;
      // const sqlQuery = `select
      //   *
      // from HR.dbo.fn_DTR('${req.body.dateFrom}','${req.body.dateTo}') e
      // where e.code like '${req.body.code || "%"}'
      // and e.class = '${req.body.class}'
      // --and e.isFinalized = '${req.body.finalized || false}'
      // and e.active = 1
      // --and e.[IN] is not null
      // --and e.[OT - OUT] is not null
      // order by name,transDateTime`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/departments/active", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select distinct
        e.DEPT_CODE code,
        e.DEPT_DESC description
      from [UE database]..vw_Employees e
      where e.IS_ACTIVE = '${req.query.active || "1"}'
      and e.DEPT_DESC is not null
      and e.DEPT_CODE <> ''
      order by description`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/positions/active", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select distinct
        e.POS_CODE code,
        e.POS_DESC description
      from [UE database]..vw_Employees e
      where e.IS_ACTIVE = 1
      order by description`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/active", (req, res) => {
  sql.connect(sqlConfig, (err) => {
    if (err) {
      res.send({ error: err });
    }
    const request = new sql.Request();
    request.query(
      `select * from [UE database]..vw_Employees e where e.is_active = 1 order by name`,
      (err, recordset) => {
        if (err) {
          res.send({ error: err });
        }
        res.send(recordset.recordset);
      },
    );
  });
});

router.get("/search/code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.code) {
    res.send({ error: "Code required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [ue database]..vw_Employees e
        where e.code = '${req.query.code}'
        and e.is_active like
          case
            when code between '8037' and '8137' and e.pos_code='POSTGINT' then convert(varchar(max),e.is_active)
            else '${req.query.active ? req.query.active : 1}'
          end
        and e.emp_class_code not in ('gl')
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
});

router.get("/search-all/code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.code) {
    res.send({ error: "Code required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [ue database]..vw_Employees e
        where e.code = '${req.query.code}'
        and e.emp_class_code not in ('gl')
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
});

router.get("/holiday-acknowledgement/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.params.code) {
    res.send({ error: "Code required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [HR]..vw_HolidayAcknowledgement e
        where e.code = '${req.params.code}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/holiday-acknowledge", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.user) {
    res.send({ error: "User required" });
    return;
  }
  if (!req.body.id) {
    res.send({ error: "ID required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [HR]..sp_AcknowledgeHoliday
        '${req.body.id}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/memo-acknowledge", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.user) {
    res.send({ error: "User required" });
    return;
  }
  if (!req.body.id) {
    res.send({ error: "ID required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec [HR]..sp_AcknowledgeMemo
        '${req.body.id}',
        '${req.body.user}',
        '${helpers.getIp(req.connection.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      // res.send({sqlQuery})
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/memo-pending/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.params.code) {
    res.send({ error: "User required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from HR..vw_MemoList m
        where m.code = '${req.params.code}'
        and m.accepted = 0`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      // res.send({sqlQuery})
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/name", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.name) {
    res.send({ error: "Name required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [ue database]..vw_Employees e
                where e.name like '%${req.query.name}%'
                and e.is_active = ${req.query.active ? req.query.active : 1}
                and e.emp_class_code not in ('gl')
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
});

router.get("/vaccine/:code", (req, res) => {
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
      const sqlQuery = `SELECT HR.dbo.fn_IsVacineUpdated('${req.params.code}') isVaccineUpdated`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send({
        isVaccineUpdated: result.recordset[0].isVaccineUpdated,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/department", (req, res) => {
  sql.connect(sqlConfig, (err) => {
    if (err) {
      res.send({ error: err });
    }
    const request = new sql.Request();
    request.query(
      `select top 10
            *
        from [UE database]..vw_Employees e
        where e.is_active = '${req.query.active}'
        and e.dept_code = '${req.query.deptcode}'
        order by name`,
      (err, recordset) => {
        if (err) {
          res.send({ error: err });
        }
        res.send(recordset.recordset);
      },
    );
  });
});

router.get("/search/codePIS", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.code) {
    res.send({ error: "Code required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [ue database]..vw_Employees_PIS e
                where e.code = '${req.query.code}'
                and e.is_active = ${req.query.active ? req.query.active : 1}
                and e.emp_class_code not in ('gl')
            `;

      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        result: result.recordset,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/provinces", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `Select * from UERMHIMS..udt_addresslisting`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/civilstatus", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select description,CAST(id AS VARCHAR(10)) id From [UE database]..CivilStatus`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/religion", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * From [UE database]..Religion`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/nationality", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select Description,CAST(CitizenshipCode AS VARCHAR(10)) CitizenshipCode  From [UE database]..Citizenship`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/family", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.query.code) {
    res.send({ error: "Code required" });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select FullName,FamType,Birthdate,Occupation,CompanySchool,recno
                 from [ue database]..Family e
                where e.EmployeeCode = '${req.query.code}'
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
});
router.get("/search/education", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from hr..vw_Education e
     where e.code = '${req.query.code}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.get("/search/seminar", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from hr..vw_Seminars e
     where e.code = '${req.query.code}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/govtlicense", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from hr..vw_Licensures e
     where e.code = '${req.query.code}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/check-default-pass/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select ITMgt.dbo.fn_isDefaultPass('${req.params.code}') isDefaultPass`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/register-public-access", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const password = helpers.randomString(5);
      const sqlQuery = `exec ITMgt..sp_RegisterPublicUser
        '${req.body.username}',
        '${password}',
        '${req.body.email}',
        '${req.body.birthDate}',
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

router.post("/change-pass", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec ITMgt..sp_ChangeDefaultPass
        '${req.body.username}',
        '${req.body.passwordMd5}',
        '${req.body.mobileno}',
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

router.post("/login", (req, res) => {
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
          e.BDATE birthDate,
          e.email,
          e.dept_code departmentCode,
          e.dept_desc department,
          e.pos_code positionCode,
          e.pos_desc position,
          case
            when u.isDefault = 1 then UERMLibrary.dbo.getMd5(u.DEFAULTPASS)
            else e.pass
          end password,
          u.isDefault isDefaultPass
        from [UE Database]..vw_Employees e
        left join ITMgt..Users u
          on e.code = u.code
        where e.code = '${req.body.username}'
        and e.IS_ACTIVE = 1
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset.length > 0 ? result.recordset : []);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/test-ip", (req, res) => {
  res.send({
    ip: helpers.getIp(req.socket.remoteAddress),
    public: req.headers,
    asd: req.ip,
  });
});

router.get("/is-allowed-from-public/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        a.id,
        a.code,
        e.name,
        e.dept_desc department,
        e.pos_Desc position
      from ITMgt..AppConfig a
      join [UE database]..vw_Employees e
        on a.code = e.code
        and e.IS_ACTIVE = 1
      where a.deleteDate is null
      and a.code = '${req.params.code}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset.length == 1);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/personalInfoSTG", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmployeePersonalDet_STG 
      SELECT 
       UPPER('${req.query.code}') ,
			 UPPER ('${req.body.lastname}') ,
			 UPPER ('${req.body.firstname}') ,
			 UPPER ('${req.body.middlename}') ,
			 UPPER ('${req.body.extName}'),
      '${req.body.email}' ,
      '${req.body.bDate}',
       UPPER ('${req.body.gender}')  ,
       UPPER ('${req.body.civilStatus}'),
			 UPPER ('${req.body.nationality}') ,
			 UPPER ('${req.body.religion}') ,
			 UPPER ('${req.body.mobileNo}') ,
			 UPPER ('${req.body.address}') ,
			 UPPER ('${req.body.telNo}') ,
			 '${req.body.address2}' ,
			 '${req.body.contactNo}' ,
			 '${req.body.tin}' ,
			 '${req.body.sssNo}' ,
			 '${req.body.philHealth}' ,
       '${req.body.pagibig}' ,
       CONVERT(BIT,'${req.body.isCharged}') ,
       '${req.body.chargeInfo}' ,
       '${req.body.birthPlace}' ,
       '${req.body.birthCertFileName}' ,
       '${req.body.civilStatFileName}' ,
       '${req.body.tinIDFileName}' ,
       '${req.body.sssIDFileName}' ,
       '${req.body.philHlthIDFileName}' ,
       '${req.body.pagIbigIDFileName}' ,
       UPPER ('${req.body.houseNo}') ,
       UPPER ('${req.body.street}') ,
       UPPER ('${req.body.subdivision}') ,
       UPPER ('${req.body.province}'),
       UPPER ('${req.body.municipality}') ,
       UPPER ('${req.body.brgy}') ,
       UPPER ('${req.body.mailHouseNo}') ,
       UPPER ('${req.body.mailStreet}'),
       UPPER ('${req.body.mailSubdivision}'),
       UPPER ('${req.body.mailProvince}') ,
       UPPER ('${req.body.mailMunicipality}') ,
       UPPER ('${req.body.mailingBrgy}') ,
       '${req.body.permaLandline}' ,
       '${req.body.mailingLandline}' ,
       CONVERT(BIT,'${req.body.isSoloParent}') ,
       CONVERT(BIT,'${req.body.isPWD}') ,
       '${req.body.soloFile}' ,
       '${req.body.pwdIDFile}' 
      `;

      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});
router.post("/save/personalInfo", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `EXEC HR..[PIS_UPDATEINFO] 
       '${req.query.code}' , 'PINFO'
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpFamInfoAdd", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmpFamilyInfo 
      SELECT 
       '${req.query.code}' ,
			  NEWID() ,
			  'ADD' ,
			 '${req.body.fullname}' ,
			 '${req.body.relationship}' ,
       '${req.body.birthdate}' ,
       '${req.body.occupation}' ,
       '${req.body.companyschool}' ,
       '${req.body.fileName}' ,
        0,
        ''
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpFamInfoEdit", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmpFamilyInfo 
      SELECT 
       '${req.query.code}' ,
         NEWID(),
			  'EDIT' ,
			 '${req.body.fullname}' ,
			 '${req.body.relationship}' ,
       '${req.body.birthdate}' ,
       '${req.body.occupation}' ,
       '${req.body.companyschool}' ,
       '${req.body.fileName}' ,
        0,
        '${req.body.id}' 
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpEducInfoAdd", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmployeeEducInfo 
      SELECT 
       '${req.query.code}' ,
			  NEWID() ,
			  'ADD' ,
			 '${req.body.institution}' ,
			 '${req.body.degree}' ,
       '${req.body.type}' ,
       '${req.body.from}' ,
       '${req.body.to}' ,
       '${req.body.filename}' ,
        0
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpEducInfoEdit", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmployeeEducInfo 
      SELECT 
       '${req.query.code}' ,
       '${req.body.id}' ,
			  'EDIT' ,
			 '${req.body.institution}' ,
			 '${req.body.degree}' ,
       '${req.body.type}' ,
       '${req.body.from}' ,
       '${req.body.to}' ,
       '${req.body.filename}' ,
        0
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpSeminarAdd", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmpSeminars 
      SELECT 
       '${req.query.code}' ,
			  NEWID() ,
			  'ADD' ,
			 '${req.body.venue}' ,
			 '${req.body.theme}' ,
       '${req.body.year}' ,
       '${req.body.filename}' ,
        0
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpSeminarEdit", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmpSeminars 
      SELECT 
       '${req.query.code}' ,
       '${req.body.id}' ,
			  'EDIT' ,
			 '${req.body.venue}' ,
			 '${req.body.theme}' ,
       '${req.body.year}' ,
       '${req.body.filename}' ,
        0
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpAddGovtLic", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmpGovtLicense 
      SELECT 
       '${req.query.code}' ,
        NEWID(),
			  'ADD' ,
			 '${req.body.title}' ,
			 '${req.body.licNo}' ,
       '${req.body.year}' ,
       '${req.body.filename}' ,
        0
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save/EmpEditGovtLic", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `INSERT INTO HR..tmpEmpGovtLicense 
      SELECT 
       '${req.query.code}' ,
       '${req.body.id}' ,
			  'EDIT' ,
			 '${req.body.title}' ,
			 '${req.body.licNo}' ,
       '${req.body.year}' ,
       '${req.body.filename}' ,
        0
      `;
      const result = await sql.query(sqlQuery);

      sql.close();
      res.send({
        error: result.recordset[0].ERR,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/approvalEmp", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
       LTRIM(RTRIM(LastName+','+' '+FirstName + ' '+ MiddleName + ' '+ExtensionName)) AS FullName,
       * FROM HR..tmpEmployeePersonalDet_vw where ISNULL(Approved,0) = 0 
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/approvalEmpFamInfo", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
       * FROM HR..tmpEmpFamilyInfo where ISNULL(Approved,0) = 0 
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/approvalEmpEducInfo", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
       * FROM HR..tmpEmployeeEducInfo where ISNULL(Approved,0) = 0 
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/approvalEmpSeminars", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
       * FROM HR..tmpEmpSeminars where ISNULL(Approved,0) = 0 
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/approvalEmpGovtLic", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
       * FROM HR..tmpEmpGovtLicense where ISNULL(Approved,0) = 0 
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/approvalPersonalDetails", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT
       * FROM HR..PIS_PersonalInfoChanges_vw where ISNULL(Approved,0) = 0 
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search/checkLogin", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `SELECT 'x' AS [Res] FROM [UE database]..vw_Employees
      WHERE (DEPT_CODE = '5040' OR DEPT_CODE ='5050') 
      AND CODE = '${req.query.code}'
      `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/available-leave", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        x.code,x.name,x.department,x.position,x.leaveType,
        --sum(x.usedLeave) usedLeave,
        --sum(x.earnedLeave) earnedLeave,
        --max(x.maxLeave) maxLeave,
        case
          when max(x.maxLeave) < sum(x.earnedLeave) - sum(x.usedLeave) then max(x.maxLeave)
          else sum(x.earnedLeave) - sum(x.usedLeave)
        end availableLeave
      from
        (select
          e.code,
          e.name,
          e.DEPT_DESC department,
          e.POS_DESC position,
          v.leaveType,
          case
            when v.leaveType = 'SL' and e.[SERVICE YEARS] >= 10 then 22
            when v.leaveType = 'SL' and e.[SERVICE YEARS] < 10 then 21
            when e.[SERVICE YEARS] >= 10 then 22*2
            else 21*2
          end maxLeave,
          convert(decimal(18,2),v.Credit) usedLeave,
          convert(decimal(18,2),v.Debit) earnedLeave
        from [UE database]..vw_Employees e
        left join HR..vw_LeaveCredits v
          on e.CODE = v.Code
          and v.YearAttributed >= year(getdate()) - 2
        -- where e.CODE like '5272'
        where v.LeaveType in ('vl','sl')
        and e.code = '${req.query.code}') x
      group by x.code,x.name,x.department,x.position,x.leaveType`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/service-record", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        r.id,
        r.code,
        r.type,
        r.departmentDesc department,
        r.positionDesc position,
        r.[from] date
      from HR..vw_ServiceRecord r
      where r.code = '${req.query.code}'
      and r.deleted = 0
      order by [from] desc`;

      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/picture/:employeeID", (req, res) => {
  let sqlWhere = "";
  if (req.params.employeeID) {
    sqlWhere = `where PictureId = '${req.params.employeeID}'`;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select 
        pictureId,
        pictureImage
      from PictureDatabase..Picture
      ${sqlWhere}`;
      const result = await sql.query(sqlQuery);
      const rows = result.recordset;
      if (rows.length > 0) {
        for (const row of rows) {
          const base64data = row.pictureImage.toString("base64");
          row.rawPicture = base64data;
        }
        var img = Buffer.from(rows[0].rawPicture, "base64");

        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": img.length,
        });
      } else {
        var img = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAk1BMVEUtLTPf4ev; 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",
          "base64",
        );
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": img.length,
        });
      }
      res.end(img);
      sql.close();
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

module.exports = router;

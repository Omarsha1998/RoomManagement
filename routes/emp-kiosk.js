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

router.get("/info/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    e.code,
    e.name,
    e.dept_desc department,
    e.pos_desc position,
    e.emp_class_desc class,
    e.mobileNo,
    e.email,
    e.uermEmail,
    e.address,
    e.tin,
    e.sss_no sss,
    e.pagibig,
    e.philHealth
  from [UE Database]..vw_Employees e
  where e.code = '${req.params.code}'`;

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

router.get("/employees-approving/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select distinct
    e.code,
    e.name,
    e.DEPT_DESC department,
    e.POS_DESC position
  from HR..vw_Approvers a
  join [UE database]..vw_Employees e
    on e.DEPT_CODE = a.deptCode
  where a.code = '${req.params.code}'
  and e.IS_ACTIVE = 1
  and e.EMP_CLASS_CODE not in ('GL')
  order by department,name`;

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

router.get("/pending/leave-approver/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    x.*,
    e.name,
    e.department
  from
    (select
      l.leaveId,
      l.code,
      convert(date,l.leaveFrom) leaveFrom,
      convert(date,l.leaveTo) leaveTo,
      l.leaveType,
      l.dateFiled,
      l.archived,
      l.duration,
      l.status
    from hr..vw_LeaveStatus l
    where l.status in ('pending','accepted')
    and l.approveLeaveId is null
    union
    select
      e.id,
      e.code,
      e.date,
      e.date,
      e.type,
      e.dateFiled,
      e.isArchived,
      e.days,
      case
        when e.isAccepted = 1 then 'ACCEPTED'
        when e.isCancelled = 1 then 'DELETED'
		    else 'PENDING'
      end status
    from HR..EmployeeLeave e
    where e.isCancelled = 0
    and e.isApproved = 0
    and e.isAccepted = 0) x
  join
    (select
	    e.name,
      e.code,
      e.dept_desc department
    from HR..vw_Approvers a
    join [UE database]..vw_Employees e
    on a.deptCode = e.DEPT_CODE
    and e.IS_ACTIVE = 1
    and e.EMP_CLASS_CODE not in ('GL')
    where a.code = '${req.params.code}') e
	on x.code = e.code
  order by department,name,leaveFrom desc`;

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

router.get("/pending/leave/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select * from
    (select
      l.leaveId,
      l.code,
      convert(date,l.leaveFrom) leaveFrom,
      convert(date,l.leaveTo) leaveTo,
      l.leaveType,
      l.dateFiled,
      l.archived,
      l.duration,
      l.status
    from hr..vw_LeaveStatus l
    where l.status in ('pending','accepted')
    and l.approveLeaveId is null
    union
    select
      e.id,
      e.code,
      e.date,
      e.date,
      e.type,
      e.dateFiled,
      e.isArchived,
      e.days,
      case
        when e.isAccepted = 1 then 'ACCEPTED'
        when e.isCancelled = 1 then 'DELETED'
		    else 'PENDING'
      end status
    from HR..EmployeeLeave e
    where e.isCancelled = 0
    and e.isApproved = 0
    and e.isAccepted = 0) x
  where x.code = '${req.params.code}'
  order by leaveFrom desc`;

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

router.get("/pending/overtime/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    *
  from HR..vw_OTStatus s
  where s.transmittalApproved = 0
  and s.code = '${req.params.code}'
  order by otFrom desc`;

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

router.post("/post-leave/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_SaveEmployeeLeave
    '${req.body.code}',
    '${req.body.date}',
    '${req.body.day}',
    '${req.body.type}',
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

router.post("/post-overtime/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_SaveEmployeeOvertime
    '${req.body.code}',
    '${req.body.date}',
    '${req.body.hours}',
    '${req.body.timeFrom}',
    '${req.body.timeTo}',
    '${req.body.work}',
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

router.get("/birthdays", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    e.code,
    e.name,
    case DATEPART(MONTH,convert(date,e.BDATE))
      when 1 then 'JAN'
      when 2 then 'FEB'
      when 3 then 'MAR'
      when 4 then 'APR'
      when 5 then 'MAY'
      when 6 then 'JUN'
      when 7 then 'JUL'
      when 8 then 'AUG'
      when 9 then 'SEP'
      when 10 then 'OCT'
      when 11 then 'NOV'
      when 12 then 'DEC'
    end [month],
    DATEPART(DAY,convert(date,e.BDATE)) [day],
    DATEADD(
      YEAR,+DATEDIFF(YEAR,convert(date,e.BDATE),GETDATE()),e.BDATE
    ) birthDay,
    e.IS_OFFICER isOfficer,
    e.dept_desc department,
    e.pos_desc position,
    case
      when DATEPART(MONTH,convert(date,e.BDATE)) = DATEPART(MONTH,GETDATE()) and
      DATEPART(DAY,convert(date,e.BDATE)) = DATEPART(DAY,GETDATE()) then 0
      when DATEPART(DAY,convert(date,e.BDATE)) < DATEPART(DAY,GETDATE()) then 2
      else 1
    end seq
  from [UE database]..vw_Employees e
  where e.EMP_CLASS_CODE <> 'GL'
  and month(convert(date,e.BDATE)) = month(getdate())
  and e.is_active = 1
  order by seq,convert(int,DATEPART(DAY,convert(date,e.BDATE)))`;

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

router.get("/holidays", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
			c.id,
			c.date,
			c.note,
			type,
			case
				when DATEPART(MONTH,GETDATE()) = DATEPART(MONTH,DATE) then 0
				else 1
			end seq
		from [UE database]..jom_HRMS_Calendar c
		where c.DELETED = 0
    and convert(varchar(6),c.date) >= convert(varchar(6),getdate())
		order by SEQ,c.date asc`;

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

router.get("/dtr/:code/:from/:to", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.code) {
    res.send({ error: "Employee required!" });
    return;
  }
  if (!req.params.from) {
    res.send({ error: "Date FROM required!" });
    return;
  }
  if (!req.params.to) {
    res.send({ error: "Date TO required!" });
    return;
  }
  // const sqlQuery = `select
  //   code,name,department,position,class,
  //   transDate,schedFrom,schedTo,onLeave,leaveType,
  //   calType,holidayPay,absent,notAbsent,otHours,otFrom,otTo,
  //   isSkeletal,isOff,isAbsent,
  //   [in],[out],[OT - IN] otIn,[OT - OUT] otOut,
  //   late,undertime,diffAM,diffPM
  // from HR.dbo.fn_DTR('${req.params.from}','${req.params.to}') e
  // where e.code in (select code from [ue database]..vw_employees e where e.code = '${req.params.code}')
  // and e.transDate <= convert(date,getdate())
  // order by name`;

  const sqlQuery = `exec HR.dbo.Usp_jf_DTRv2 '${req.params.from}','${req.params.to}','${req.params.code}',''`;

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

router.get("/timedata/:code/:date", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.code) {
    res.send({ error: "Employee required!" });
    return;
  }
  if (!req.params.date) {
    res.send({ error: "Date required!" });
    return;
  }
  const sqlQuery = `select * from [HR].dbo.fn_DTRLogs(
			'${req.params.code}',
			'${req.params.date}'
		)`;

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

router.get("/fix-sched/:code/:date", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.params.code) {
    res.send({ error: "Employee required!" });
    return;
  }
  if (!req.params.date) {
    res.send({ error: "Date required!" });
    return;
  }
  const sqlQuery = `exec [UERMATT]..[sp_FixSched]
    '${req.params.code}',
    '${req.params.date}',
    '${req.params.code}',
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

module.exports = router;

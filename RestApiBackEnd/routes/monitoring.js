const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const util = require("../helpers/util");
const timedataHelpers = require("../helpers/timedataHelpers");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

router.get("/leave", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
          *
        from HR..vw_LeaveStatus l
        where l.deptCode = '${req.query.deptCode}'
        and convert(date,l.leaveFrom) between '${req.query.dateFrom}' and '${req.query.dateTo}'
        order by name,leaveFrom
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/employee-leave", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
      select code, fullname, dept_desc, pos_desc, [SERVICE YEARS] serviceYears, 
        (select sum(debit)-sum(credit) from HR..vw_LeaveCredits vc where vc.code = emp.code and leaveType in ('vl') and (convert(date, leaveFrom) <= '2023-05-31'  or LeaveFrom is null) group by vc.code) availableVL
      from [UE database]..vw_Employees emp where emp.CODE = '${req.query.code}'`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/ot", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
          *
        from HR..vw_OTStatus o
        where o.deptCode = '${req.query.deptCode}'
        and o.statusCode like '${req.query.status || "%"}'
        and convert(date,o.otFrom) between '${req.query.dateFrom}' and '${
          req.query.dateTo
        }'
        order by name,otFrom
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/search-employee-ot", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
          *
        from HR..vw_OTStatus o
        where (o.name like '%${req.body.name}%' or o.code = '${req.body.name}')
        and o.statusCode like '${req.body.status || "%"}'
        and convert(date,o.otFrom) between '${req.body.dateFrom}' and '${
          req.body.dateTo
        }'
        and o.deptCode in (select deptCode from HR..vw_Approvers)
        order by name,otFrom
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/pending/:type", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `select distinct
      //   o.otId id,
      //   o.code,
      //   o.name,
      //   o.position,
      //   o.department,
      //   o.otFrom,
      //   o.otTo,
      //   o.duration,
      //   o.dateFiled,
      //   o.statusDescription status,
      //   o.headApproveDate otApproveDate,
      //   o.allowDate transmittalApproveDate,
      //   o.acceptDate otAcceptDate,
      //   t.[in],
      //   t.[out],
      //   t.[ot - in] otIn,
      //   t.[ot - out] otOut
      // from hr..vw_OTStatus o
      // join [UE database]..vw_Employees e
      //   on o.code = e.code
      //   and e.IS_ACTIVE = 1
      // left join HR..PendingOT pen
      //   on o.otId = pen.otId
      // left join HR..vw_TimedataPivot t
      //   on o.code = t.code
      //   and t.date = convert(date,o.otFrom)
      // where o.statusCode not in (7,5)
      // and year(o.otFrom) >= 2020
      // and pen.id is null
      // order by o.otFrom desc, name`;
      const sqlQuery = `select
        o.otId,
        o.code,
        o.name,
        o.department,
        convert(date,o.otFrom) date,
        convert(time,o.otFrom) otFrom,
        convert(time,o.otTo) otTo,
        o.statusDescription status,
        o.pendingStatus,
        o.duration,
        o.transmittalHours
      from hr..vw_OTStatus o
      where o.statusCode not in (7,8,10)
      and o.otId not in (select otId from HR..OTSummary s where s.deleted = 0)
      and o.deptCode in (select deptCode from HR..vw_ApproversV2)
      and year(o.otFrom) >= '2022'
      order by o.otFrom desc,department,name`;

      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search-ot/:code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        o.otId,
        o.code,
        o.name,
        o.reason,
        o.statusDescription,
        o.position,
        o.department,
        convert(date,o.otFrom) date
      from HR..vw_OTStatus o
      where o.code = '${req.params.code}'
      order by
        case
          when statusCode = 7 then 99
          else statusCode
        end,
      o.otFrom desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/pending-leave", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere;
  switch (req.query.type || "ph") {
    case "ph":
      sqlWhere = "and s.statusCode in (2)";
      break;
    case "p":
      sqlWhere = "and s.statusCode in (3)";
      break;
    case "a":
      sqlWhere = "and s.statusCode in (4)";
      break;
  }
  const sqlQuery = `select
    s.leaveId,
    s.code,
    s.name,
    s.position,
    s.department,
    convert(datetime,s.leaveFrom,100) leaveFrom,
    convert(datetime,s.leaveTo,100) leaveTo,
    s.leaveType,
    s.duration,
    s.reason,
    s.dateFiled,
    s.statusDescription,
    a.lvl
  from HR..vw_LeaveStatus s
  left join HR..vw_ApproversV2 a
    on s.deptCode = a.deptCode
  where a.code = '${req.query.approver}'
  ${sqlWhere}
  and datediff(day,s.leaveFrom,getdate()) between -45 and 365
  order by s.statusCode,s.leaveFrom desc`;

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

router.get("/emp-group", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select distinct
    [group]
  from [UE database]..vw_Employees e
  where e.IS_ACTIVE = 1
  and e.[group] is not null`;

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

router.get("/report/dtr-summary", (req, res) => {
  const date =
    req.query.date || req.query.dateFrom.split("-").join("").substring(0, 6);
  let sqlQuery = `select
    e.code,
    e.name,
    e.dept_desc department,
    e.pos_desc position,
    e.emp_class_code CLASS
  from [ue database]..vw_Employees e
  where e.is_active = 1
  --and e.[group] = '${req.query.group}'
  and e.emp_class_code in ('ra','ma')
  order by name`;
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sqlQuery = `select
        x.code,
        sum(x.hours) hours,
        count(x.code) days
      from
        (select
          t.code,
          convert(date,t.timeIn) date,
          t.timeIn,
          t.timeOut,
          convert(decimal(18,2),DATEDIFF(MINUTE,t.timeIn,t.[timeOut]) / 60.0) hours
        from
          (select
            row_number() over (partition by code,convert(date,timeIn) order by code,timeIn) rowNo,
            t.code,
            case
              when t.overtimeIn is null or t.timeIn < t.overtimeIn then t.timeIn
              else t.overtimeIn
            end timeIn,
            case
              when t.overtimeOut is null or t.[timeOut] < t.overtimeOut then t.[timeOut]
              else t.overtimeOut
            end [timeOut]
          from hr..timedata t
          where deleteDate is null) t
        where t.rowNo = 1
        and convert(date,t.timeIn) between '${req.query.dateFrom}' and '${req.query.dateTo}') x
        --and convert(varchar(6),t.timeIn,112) = '${date}') x
      where x.hours > 0
      group by x.code`;
      const dtr = await sql.query(sqlQuery);

      sqlQuery = `select
        v.IDCode code,
        convert(decimal(18,2),sum(v.USED_LEAVE)) days
      from [UE database]..VacationSickLeave v
      where v.DELETED = 0
      and convert(date,v.DateLeavedFrom) between '${req.query.dateFrom}' and '${req.query.dateTo}'
      and convert(varchar(6),v.DateLeavedFrom,112) = '${date}'
      group by v.IDCode`;
      const leave = await sql.query(sqlQuery);
      for (const e of result.recordset) {
        const d = dtr.recordset.filter((i) => {
          return i.code == e.code;
        });
        const l = leave.recordset.filter((i) => {
          return i.code == e.code;
        });
        e.hours = d.length > 0 ? d[0].hours : 0;
        e.days = d.length > 0 ? d[0].days : 0;
        e.leave = l.length > 0 ? l[0].days : 0;
      }
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/report", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlQuery;
  if (req.query.type.toLowerCase() == "leave") {
    sqlQuery = `select
      o.code,
      e.name,
      o.department,
      o.position,
      convert(varchar(max),o.leaveFrom,23) leaveDate,
      o.leaveType,
      o.duration,
      o.reason,
      o.statusDescription
    from HR..vw_LeaveStatus o
    join [UE database]..vw_Employees e
      on o.code = e.CODE
    where convert(date,o.leaveFrom) between '${req.query.dateFrom}' and '${req.query.dateTo}'
    and e.IS_ACTIVE = 1
    and o.leaveType in ('VL', 'SL', 'AWOL', 'LOA', 'BL', 'ML','LWOP')
    and e.[GROUP] = '${req.query.group}'`;
  } else if (req.query.type.toLowerCase() == "overtime") {
    sqlQuery = `select
      o.code,
      e.name,
      o.department,
      o.position,
      convert(varchar(max),o.otFrom,23) otDate,
      o.duration,
      o.reason,
      o.statusDescription
    from HR..vw_OTStatus o
    join [UE database]..vw_Employees e
      on o.code = e.CODE
    where convert(date,o.otFrom) between '${req.query.dateFrom}' and '${req.query.dateTo}'
    and e.IS_ACTIVE = 1
    and e.[GROUP] = '${req.query.group}'`;
  } else if (req.query.type.toLowerCase() == "dtr logs") {
    sqlQuery = `select
      e.code,
      e.name,
      e.DEPT_DESC department,
      e.POS_DESC position,
      case
        when left(Type,1) = 't' then t.InOut
        when left(Type,1) = 'o' then 'OT '+t.InOut
        when left(Type,1) = 'b' then 'BREAK '+t.InOut
      end type,
      t.DateStamp dateStamp
    from AMPS_UERM..timedata t
    join [UE database]..vw_Employees e
      on convert(varchar(max),t.pin) = e.code
    where convert(date,t.Timedata) between '${req.query.dateFrom}' and '${req.query.dateTo}'
    and e.IS_ACTIVE = 1
    and e.[GROUP] = '${req.query.group}'
    order by name,dateStamp desc`;
  } else if (req.query.type.toLowerCase() == "dtr posted") {
    sqlQuery = `select
      e.code,
      e.name,
      e.DEPT_DESC department,
      convert(varchar(max),d.[from],23) [from],
      convert(varchar(max),d.[to],23) [to],
      d.absences,
      d.tardy,
      d.undertime,
      d.overtime,
      d.overtime35,
      d.overtime130,
      d.overtime135,
      d.diffPm,
      d.diffNp,
      d.note,
      concat(d.YEAR,d.MONTH,d.WEEKCODE) payrollPeriod
    from [UE database]..jom_HRMS_DTRPosting d
    join [UE database]..vw_Employees e
      on e.CODE = d.CODE
    where d.FINAL = 1
    and convert(date,d.[FROM]) between '${req.query.dateFrom}' and '${req.query.dateTo}'
    and e.IS_ACTIVE = 1
    and e.[GROUP] = '${req.query.group}'
    order by name,payrollPeriod desc,department,[from]`;
  } else if (req.query.type.toLowerCase() == "timekeeping active") {
    sqlQuery = `select
      e.code,e.name,e.department,e.position,e.empGroup,
      sum(late) late,
      count(leave) leave,
      sum(
        case
          when e.late >= 15 then 1
		      else 0
        end
      ) habitualTardiness,
      sum(case
        when datediff(minute,e.dtrIn,e.schedFrom) > 15 then 1
        else 0
      end) earlyIn,
      sum(isAbsent) absences,
      convert(decimal(18,2),case
        when sum(e.isAbsent) > 0 then 0
        when sum(e.late) > 0 then ((60*8*count(e.dtrIn)) - sum(e.late)) / 60.0
        else 8*count(e.dtrIn)
      end) dutyHours,
      count(e.dtrIn) dutyDays,
      isnull(sum(o.HOURS),0) otHours,
      sum(e.isRestDay) restDay,
      sum(e.isDayOff) dayOff
    from HR.dbo.fn_DTRV2('${req.query.dateFrom}','${req.query.dateTo}') e
    left join [UE database]..Overtime o
      on e.code = o.CODE
      and e.date = o.DATE_OF_LEAVE
      and o.DELETED = 0
    left join UERMATT..NoDtr n
        on e.code = n.code
        and n.deleted = 0
    where e.empGroup = '${req.query.group}'
    and e.isActive = 1
    and n.code is null
    group by e.code,e.name,e.department,e.position,e.empGroup
    order by name`;
  } else if (req.query.type.toLowerCase() == "timekeeping inactive") {
    sqlQuery = `select
      e.code,e.name,e.department,e.position,e.empGroup,
      sum(late) late,
      count(leave) leave,
      sum(
        case
          when e.late >= 15 then 1
		      else 0
        end
      ) habitualTardiness,
      sum(case
        when datediff(minute,e.dtrIn,e.schedFrom) > 15 then 1
        else 0
      end) earlyIn,
      sum(isAbsent) absences,
      convert(decimal(18,2),case
        when sum(e.isAbsent) > 0 then 0
        when sum(e.late) > 0 then ((60*8*count(e.dtrIn)) - sum(e.late)) / 60.0
        else 8*count(e.dtrIn)
      end) dutyHours,
      count(e.dtrIn) dutyDays,
      isnull(sum(o.HOURS),0) otHours,
      sum(e.isRestDay) restDay,
      sum(e.isDayOff) dayOff
    from HR.dbo.fn_DTRV2('${req.query.dateFrom}','${req.query.dateTo}') e
    left join [UE database]..Overtime o
      on e.code = o.CODE
      and e.date = o.DATE_OF_LEAVE
      and o.DELETED = 0
    left join UERMATT..NoDtr n
        on e.code = n.code
        and n.deleted = 0
    where e.empGroup = '${req.query.group}'
    and e.isActive = 0
    and n.code is null
    group by e.code,e.name,e.department,e.position,e.empGroup
    order by name`;
  } else if (req.query.type.toLowerCase() == "supervisor up attendance") {
    sqlQuery = `select
      e.code,
      e.name,
      e.DEPT_DESC department,
      e.POS_DESC position,
      e.EMP_CLASS_CODE class,
      x.totalLeave,
      --x.dutyDays,
      --x.dutyDays - x.totalLeave daysPresent
      case
        when e.RESIGNED is not null and e.RESIGNED < '${req.query.dateFrom}' then 0
        else x.dutyDays
        end dutyDays,
      case
        when e.RESIGNED is not null and e.RESIGNED < '${req.query.dateFrom}' then 0
        else x.dutyDays - x.totalLeave
      end daysPresent
    from [UE database]..vw_Employees e
      join (select
        n.code,
        convert(decimal(18,2),sum(isnull(USED_LEAVE,0))) totalLeave,
        (select
          count(c.DATE)
        from [UE database].dbo.fn_GenerateCalendar('${req.query.dateFrom}','${req.query.dateTo}') c
        where DATEPART(WEEKDAY,c.DATE) not in (7,1)) dutyDays
      from UERMATT..NoDtr n
      left join [UE database]..VacationSickLeave l
        on n.code = l.IDCode
        and l.DELETED = 0
        and l.DateLeavedFrom between '${req.query.dateFrom}' and '${req.query.dateTo}'
      where n.deleted = 0
      group by n.code) x
      on e.code = x.code
    where e.EMP_CLASS_CODE not in ('gl')
    and e.IS_ACTIVE = 1
    and e.[GROUP] = '${req.query.group}'
    order by name`;
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

router.get("/pending-ot", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere;
  switch (req.query.type || "ph") {
    case "ph":
      sqlWhere =
        "and o.pendingStatus = 'OT Pending: A1' and o.statusCode = '3'";
      break;
    case "p":
      sqlWhere =
        "and o.pendingStatus = 'OT Pending: A2' and o.statusCode = '3'";
      break;
    case "a":
      sqlWhere = "and o.statusCode in ('4','5')";
      break;
    case "f":
      sqlWhere = "and o.statusCode in ('9')";
      break;
  }
  const sqlQuery = `select
    o.otId,
    o.code,
    o.name,
    o.position,
    o.department,
    convert(datetime,o.otFrom,100) otFrom,
    convert(datetime,o.otTo,100) otTo,
    o.duration,
    o.reason,
    o.dateFiled,
    o.headApproveDate dateApproved,
    o.statusDescription,
    a.lvl
  from HR..vw_OTStatus o
  left join HR..vw_ApproversV2 a
    on o.deptCode = a.deptCode
  where a.code = '${req.query.approver}'
  ${sqlWhere}
  and datediff(day,o.otFrom,getdate()) between -45 and 365
  order by
  case
    when statusCode = 7 then 99
    else statusCode
  end,
  o.otFrom desc`;
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

router.get("/pending-transmittal", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlWhere;
  switch (req.query.type || "ph") {
    case "ph":
      sqlWhere =
        "and o.pendingStatus = 'Transmittal Pending: A1' and o.statusCode = '5'";
      break;
    case "p":
      sqlWhere =
        "and o.pendingStatus = 'Transmittal Pending: A2' and o.statusCode = '5'";
      break;
    case "a":
      sqlWhere = "and o.statusCode in ('8','9')";
      break;
    case "na":
      sqlWhere = "and o.statusCode in ('4')";
  }
  const sqlQuery = `select
      o.otId,
      o.code,
      o.name,
      o.position,
      o.department,
      convert(datetime,o.otFrom,100) otFrom,
      convert(datetime,o.otTo,100) otTo,
      o.duration,
      o.reason,
      o.dateFiled,
      o.headApproveDate dateApproved,
      o.statusDescription,
      a.lvl
  from HR..vw_OTStatus o
  left join HR..vw_ApproversV2 a
    on o.deptCode = a.deptCode
  where a.code = '${req.query.approver}'
  ${sqlWhere}
  and datediff(day,o.otFrom,getdate()) between -45 and 365
  order by
  case
      when statusCode = 7 then 99
      else statusCode
  end,
  o.otFrom desc`;

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

router.get("/approvers", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select * from HR..vw_ApproversV2 order by name`;
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

router.post("/tag-overtime", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlQuery;
  // GET APPROVING LEVEL
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // BUILD QUERY
      switch (req.body.method) {
        case "approve-ot":
          sqlQuery = `exec UERMATT..sp_AllowOvertime
            '${req.body.otId}',
            '${req.body.lvl}',
            '${req.body.code}',
            '${helpers.getIp(req.socket.remoteAddress)}'
          `;
          break;
        case "disapprove-ot":
          sqlQuery = `exec [HR]..[sp_DisapproveOvertime]
            '${req.body.otId}',
            '${req.body.code}',
            '${helpers.getIp(req.socket.remoteAddress)}'
          `;
          break;
        case "approve-transmittal":
          sqlQuery = `exec [UERMATT]..[sp_ApprovePendingTransmittal]
            '${req.body.otId}',
            '${req.body.lvl}',
            '${req.body.code}',
            '${helpers.getIp(req.socket.remoteAddress)}'
          `;
          // return;
          break;
        case "disapprove-transmittal":
          sqlQuery = `exec UERMATT..sp_DisapprovePendingTransmittal
            '${req.body.otId}',
            '${req.body.lvl}',
            '${req.body.code}',
            '${helpers.getIp(req.socket.remoteAddress)}'
          `;
          res.send({ ERR: true, MSG: "Disapprove transmittal not found!" });
          return;
          break;
      }
      // console.log(sqlQuery)
      // sqlQuery = `select getdate() date`;

      void (async function () {
        try {
          await sql.connect(sqlConfig);
          const result = await sql.query(sqlQuery);
          res.send(result.recordset[0]);
        } catch (error) {
          res.send({ error });
        }
      })();
    } catch (error) {
      console.log(error);
    }
  })();
});

router.post("/tag-leave", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlQuery;
  let lvl;
  // GET APPROVING LEVEL
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // lvl = await sql.query(
      //   `select HR.dbo.fn_GetApprovingLvl('${req.body.code}','${req.body.type}') lvl`
      // );
      // BUILD QUERY
      if (req.body.approve == "disapprove") {
        sqlQuery = `exec [HR]..[sp_DisapproveLeave]
          '${req.body.leaveId}',
          '${req.body.code}',
          '${helpers.getIp(req.socket.remoteAddress)}'
        `;
      } else if (req.body.lvl == 1) {
        sqlQuery = `exec [HR]..[sp_ApproveLeaveA1]
          '${req.body.leaveId}',
          '${req.body.lvl}',
          '${req.body.code}',
          '${helpers.getIp(req.socket.remoteAddress)}'
        `;
      } else if (req.body.lvl == 2) {
        const leaveDetails = await sql.query(`select
          t.code,
          t.leave_type leaveType,
          convert(varchar(max),t.date_from,23) dateFrom,
          convert(varchar(max),t.date_to,23) dateTo,
          t.leave_days duration,
          left(t.time_from,5) timeFrom,
          left(t.time_to,5) timeTo,
          t.reason
        from UERMATT..TempLeave t
        where t.id = '${req.body.leaveId}'`);
        sqlQuery = `exec [HR]..[sp_SaveLeave]
          '${leaveDetails.recordset[0].code}',
          '${leaveDetails.recordset[0].leaveType}',
          '${leaveDetails.recordset[0].dateFrom}',
          '${leaveDetails.recordset[0].dateTo}',
          '${leaveDetails.recordset[0].duration}',
          '${leaveDetails.recordset[0].timeFrom}',
          '${leaveDetails.recordset[0].timeTo}',
          '${leaveDetails.recordset[0].reason}',
          '${req.body.code}',
          '${helpers.getIp(req.socket.remoteAddress)}'
        `;
      }

      void (async function () {
        try {
          await sql.connect(sqlConfig);
          const result = await sql.query(sqlQuery);
          res.send(result.recordset[0]);
        } catch (error) {
          res.send({ error });
        }
      })();
    } catch (error) {
      console.log(error);
    }
  })();
});

router.post("/tag-ot-paid", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_TagOTPaid
    '${req.body.id}',
    '${req.body.payrollPeriod}',
    '${req.body.code}',
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

router.get("/asd", (req, res) => {
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `select distinct
      //   d.code,
      //   e.name,
      //   concat(d.year,d.month,d.weekcode) payrollPeriod,
      //   d.note
      // from [UE database]..jom_HRMS_DTRPosting d
      // join [UE database]..vw_Employees e
      //   on d.code = e.code
      //   and e.is_active = 1
      // where d.OVERTIME + d.OVERTIME130 + d.OVERTIME135 + d.OVERTIME35 > 0
      // and d.NOTE like '%o%'
      // and d.YEAR >= 2021
      // and d.FINAL = 1
      // order by d.code,payrollPeriod`;
      const update = [];
      let sqlQuery = "";
      // sqlQuery = `select
      //   o.otId,
      //   o.code,
      //   convert(varchar(max),o.otFrom,23) date
      // from HR..vw_OTStatus o
      // where o.statusDescription = 'Paid - OT paid - '`;
      sqlQuery = `select
        o.otId,
        o.code,
        convert(varchar(max),o.otFrom,23) date,
        o.duration
      from hr..vw_OTStatus o
      where o.statusCode in (9)
      and o.deptCode in (select deptCode from HR..vw_Approvers)`;
      const result = await sql.query(sqlQuery);
      const emps = [];
      const notFound = [];
      for (const x of result.recordset) {
        const q = `select
          d.code,
          concat(d.year,d.month,d.weekcode) payrollPeriod,
          d.note
        from [UE database]..jom_HRMS_DTRPosting d
        where d.code = '${x.code}'
        and d.note like '%${x.date}%'
        and d.OVERTIME+d.OVERTIME130+d.OVERTIME135+d.OVERTIME35 > 0`;
        const r = await sql.query(q);
        if (r.recordset.length > 0) {
          emps.push({
            ...r.recordset[0],
            id: x.otId,
            date: x.date,
          });
          update.push(
            `update [UE database]..Overtime set [OT PAID] = 1, payrollPeriod = '${r.recordset[0].payrollPeriod}' where id = '${x.otId}'`,
          );
        } else {
          notFound.push({
            id: x.otId,
            date: x.date,
            code: x.code,
            duration: x.duration,
          });
        }
      }
      res.send({ emps, notFound });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/paid-ot", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      // const sqlQuery = `select distinct
      //   d.code,
      //   e.name,
      //   concat(d.year,d.month,d.weekcode) payrollPeriod,
      //   d.note
      // from [UE database]..jom_HRMS_DTRPosting d
      // join [UE database]..vw_Employees e
      //   on d.code = e.code
      //   and e.is_active = 1
      // where d.OVERTIME + d.OVERTIME130 + d.OVERTIME135 + d.OVERTIME35 > 0
      // and d.NOTE like '%o%'
      // and d.YEAR >= 2021
      // and d.FINAL = 1
      // order by d.code,payrollPeriod`;
      const sqlQuery = `select distinct
        o.code,
        o.name,
        concat(d.year,d.month,d.weekcode) payrollPeriod,
        convert(varchar(max),d.note)
      from HR..vw_OTStatus o
      left join [UE database]..jom_HRMS_DTRPosting d
        on convert(varchar(6),o.otFrom,112) = concat(d.year,d.month)
        and o.code = d.CODE
      where o.statusCode = 8
      and o.transmittal is not null
      and d.NOTE <> ''
      and d.FINAL = 1
      order by payrollPeriod desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/ot-for-payment", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from HR..vw_OTStatus o
      where o.statusCode = 6
      order by payrollPeriod desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/approved-transmittal-status", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        o.otId,
        o.code,
        convert(date,o.otFrom) date,
        o.name,
        o.department
      from HR..vw_OTStatus o
      where o.statusCode = 8
      order by o.otFrom desc`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/overtime-statistics", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        o.statusCode,
        d.description,
        count(d.description) qty
      from HR..vw_OTStatus o
      join HR..vw_OTStatusDescription d
        on o.statusCode = d.code
      group by d.description,o.statusCode`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/paid-overtime/:code/:date", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        d.code,
        concat(d.year,d.month,d.weekcode) payrollPeriod,
        d.note
      from [UE database]..jom_HRMS_DTRPosting d
      where d.code = '${req.params.code}'
      and convert(varchar(max),d.note) like '%${req.params.date}%'`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/status-list/:type", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    o.code,
    o.description status
  from hr..vw_OTStatusDescription o
  order by o.seq`;

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

router.post("/save-pending", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_TagPending
    '${req.body.period}',
    '${req.body.id}',
    '${req.body.type}',
    '${req.body.user}',
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

router.get("/dtr/:code/:dateFrom/:dateTo", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const sqlQuery = `exec HR.dbo.Usp_jf_DTRv2 '${req.params.dateFrom}','${req.params.dateTo}','${req.params.code}',''`;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);

      if (result.recordset.length > 0) {
        for (const dtr of result.recordset) {
          if (!util.empty(dtr.schedFrom)) {
            dtr.schedFrom = await util.formatDateWithTime({
              date: dtr.schedFrom,
              militaryTime: true,
            });
          } else {
            dtr.schedFrom = dtr.NOTE;
          }

          if (!util.empty(dtr.schedTo)) {
            dtr.schedTo = await util.formatDateWithTime({
              date: dtr.schedTo,
              militaryTime: true,
            });
          } else {
            dtr.schedTo = dtr.NOTE;
          }
        }
      }
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/timedata", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  req.body.dtrFrom = "2020-02-05";
  req.body.dtrTo = "2020-02-11";
  const sqlQuery = `
    declare @tbl table
      (code varchar(max))

    insert into @tbl
    select top 20 e.code from [UE database]..vw_Employees e
    where e.IS_ACTIVE = 1
    and e.DEPT_CODE like '${req.body.department}'
    order by e.NAME

    select
      *
    from HR.dbo.fn_DTR('${req.body.dtrFrom}','${req.body.dtrTo}') d
    where d.code in (select code from @tbl)
    order by d.name,d.transDateTime
  `;

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

router.post("/save-ot-summary", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_SaveOTSummary
    '${req.body.id}',
    '${req.body.duration}',
    '${req.body.type}',
    '${req.body.payrollPeriod}',
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

router.post("/remove-ot-summary", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_RemoveOTSummary
    '${req.body.code}',
    '${req.body.payrollPeriod}',
    '${req.body.type}',
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

router.get("/ot-computed", async (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // SET REQUEST QUERIES ON HELPER VARIABLE
  timedataHelpers.reqQueries = req.query;

  //   ot: `select
  //   o.code,
  //   s.hours,
  //   s.type,
  //   s.payrollPeriod,
  //   o.DATE_OF_LEAVE date
  // from HR..OTSummary s
  // join [UE database]..Overtime o
  //   on s.otId = o.ID
  //   and o.DELETED = 0
  // where isnull(o.[OT PAID],0) = 0
  // and o.CODE = '${req.query.code}'
  // and s.payrollPeriod = '${req.query.payrollPeriod}'
  // union
  // select
  //   e.code,
  //   case
  //     when e.calType = 'REGULAR HOLIDAY' then e.holidayPay
  //     when e.calType = 'SPECIAL NON-WORKING HOLIDAY' then e.holidayPay
  //     else 0
  //   end hours,
  //   case
  //     when e.calType = 'REGULAR HOLIDAY' then 'OT 100'
  //     when e.calType = 'SPECIAL NON-WORKING HOLIDAY' then 'OT 35'
  //   end type,
  //   '${req.query.payrollPeriod}' payrollPeriod,
  //   e.transDate date
  // from HR.dbo.fn_DTR('${req.query.dateFrom}','${req.query.dateTo}') e
  // where e.code = '${req.query.code}'
  // -- and e.holidayPay > 0
  // and
  //   case
  //     when e.calType = 'REGULAR HOLIDAY' and e.[IN] is null and e.[OT - IN] is null then 0
  //     when e.calType = 'SPECIAL NON-WORKING HOLIDAY' and e.[IN] is null and e.[OT - IN] is null then 0
  //     when e.calType = 'REGULAR HOLIDAY' then e.holidayPay
  //     when e.calType = 'SPECIAL NON-WORKING HOLIDAY' then e.holidayPay
  //     else e.holidayPay
  //   end > 0
  // and e.calType in ('REGULAR HOLIDAY','SPECIAL NON-WORKING HOLIDAY')
  // order by date`,

  const queries = {
    ot: `select
      o.code,
      s.hours,
      s.type,
      s.payrollPeriod,
      o.DATE_OF_LEAVE date
    from HR..OTSummary s
    join [UE database]..Overtime o
      on s.otId = o.ID
      and o.DELETED = 0
    where isnull(o.[OT PAID],0) = 0
    and o.CODE = '${req.query.code}'
    and s.payrollPeriod = '${req.query.payrollPeriod}'
    order by date`,
    dtr: `exec HR.dbo.Usp_jf_DTRv2 '${req.query.dateFrom}','${req.query.dateTo}','${req.query.code}',''`,
    late: `exec HR.dbo.Usp_jf_DTRv2 '${
      timedataHelpers.getLasthMonthDate(req.query.dateFrom).from
    }','${timedataHelpers.getLasthMonthDate(req.query.dateFrom).to}','${
      req.query.code
    }',''`,

    // `select
    //   *
    // from HR.dbo.fn_DTR(
    //   '${timedataHelpers.getLasthMonthDate(req.query.dateFrom).from}',
    //   '${timedataHelpers.getLasthMonthDate(req.query.dateFrom).to}'
    // ) e
    // where e.code = '${req.query.code}'
    // order by transDate`,
    refund: `select
      r.payrollPeriod,d.code,
      r.days,
      d.note
    from HR..DTRRefunds r
    join [UE database]..jom_HRMS_DTRPosting d
      on r.dtrPostingId = d.id
    where r.deleted = 0
    and r.payrollPeriod = '${req.query.payrollPeriod}'
    and d.code = '${req.query.code}'
    --group by r.payrollPeriod,d.code`,
  };

  void (async function () {
    try {
      await sql.connect(sqlConfig);

      const otCalType = `exec HR.dbo.Usp_jf_DTRv2 '${req.query.dateFrom}','${req.query.dateTo}','${req.query.code}',''`;
      const otCalTypeQuery = await sql.query(otCalType);

      const ot35andOt100 = [];
      if (otCalTypeQuery.recordset.length > 0) {
        const otCalRecordset = otCalTypeQuery.recordset;
        for (const otCal of otCalRecordset) {
          otCal.hours =
            otCal.calType === "REGULAR HOLIDAY"
              ? otCal.holidayPay
              : otCal.calType === "SPECIAL NON-WORKING HOLIDAY"
                ? otCal.holidayPay
                : 0;

          otCal.type =
            otCal.calType === "REGULAR HOLIDAY"
              ? "OT 100"
              : otCal.calType === "SPECIAL NON-WORKING HOLIDAY"
                ? "OT 35"
                : otCal.calType;

          if (
            otCal.calType === "REGULAR HOLIDAY" &&
            otCal.IN === null &&
            otCal["OT - IN"] === null
          ) {
            otCal.otHolidayPay = 0;
          } else if (
            otCal.calType === "SPECIAL NON-WORKING HOLIDAY" &&
            otCal.IN === null &&
            otCal["OT - IN"] === null
          ) {
            otCal.otHolidayPay = 0;
          } else {
            otCal.otHolidayPay = otCal.holidayPay;
          }
        }

        const filterDTRWithHoliday = otCalRecordset.filter(
          (filterOTCal) =>
            filterOTCal.calType === "REGULAR HOLIDAY" ||
            filterOTCal.calType === "SPECIAL NON-WORKING HOLIDAY",
        );
        if (filterDTRWithHoliday.length > 0) {
          const filterOTWithHoliday = filterDTRWithHoliday.filter(
            (filterOTCal) => filterOTCal.otHolidayPay > 0,
          );
          if (filterOTWithHoliday.length > 0) {
            for (const finalOTWithHoliday of filterOTWithHoliday) {
              const otWithHoliday = {
                code: finalOTWithHoliday.code,
                hours: finalOTWithHoliday.hours,
                type: finalOTWithHoliday.type,
                payrollPeriod: req.query.payrollPeriod,
                date: new Date(finalOTWithHoliday.transDate),
              };
              ot35andOt100.push(otWithHoliday);
            }
          }
        }
      }
      // console.log(ot35andOt100)
      const ot = await sql.query(queries.ot);
      let finalOTRecordset = [];
      if (ot.recordset.length > 0) {
        finalOTRecordset = ot.recordset.concat(ot35andOt100);
      } else {
        if (ot35andOt100.length > 0) {
          finalOTRecordset = ot35andOt100;
        }
      }

      const dtr = await sql.query(queries.dtr);
      const late = await sql.query(queries.late);
      const refund = await sql.query(queries.refund);

      if (finalOTRecordset.length > 0) {
        for (const otData of finalOTRecordset) {
          otData.date = await util.formatDate({
            date: otData.date.toISOString(),
            straightDate: true,
          });
        }
      }

      if (dtr.recordset.length > 0) {
        for (const dtrData of dtr.recordset) {
          dtrData.formattedTransDate = await util.formatDate({
            date: dtrData.transDate.toISOString(),
            straightDate: true,
          });
          dtrData.transDate = await util.formatDate({
            date: dtrData.transDate.toISOString(),
            straightDate: true,
          });
        }
      }

      if (late.recordset.length > 0) {
        for (const lateData of late.recordset) {
          lateData.transDate = await util.formatDate({
            date: lateData.transDate.toISOString(),
            straightDate: true,
          });
        }
      }

      // if (dtr.recordset.length > 0) {
      //   for (let dtrData of dtr.recordset) {
      //     dtrData.formattedTransDate = await util.formatDate( { date: dtrData.transDate.toISOString(), straightDate: true })
      //     dtrData.transDate = await util.formatDate( { date: dtrData.transDate.toISOString(), straightDate: true })
      //   }
      // }
      // console.log(queries);
      const computed = {
        ot: timedataHelpers.computeOt(finalOTRecordset),
        deductions: timedataHelpers.computeDeductions(
          late.recordset.filter((i) => i.late > 0 || i.undertime > 0),
        ),
        differentials: timedataHelpers.computeDifferentials(
          dtr.recordset.filter((i) => i.diffAM > 0 || i.diffPM > 0),
        ),
        absences: timedataHelpers.computeAbsences(
          dtr.recordset.filter((i) => i.isAbsent),
        ),
        refund: timedataHelpers.computeRefund(refund.recordset),
      };
      computed.dateString = [
        computed.ot["OT 100"].dateString,
        computed.ot["OT 130"].dateString,
        computed.ot["OT 135"].dateString,
        computed.ot["OT 35"].dateString,
        computed.deductions.late.dateString,
        computed.deductions.undertime.dateString,
        computed.differentials.diffAM.dateString,
        computed.differentials.diffPM.dateString,
        computed.absences.dateString,
        computed.refund.dateString,
      ]
        .filter((i) => i != "")
        .join(";");

      computed.dtr = dtr.recordset.map((i) => {
        const transDate = new Date(i.transDate);
        const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

        if (!util.empty(i.schedFrom)) {
          i.schedFrom = i.schedFrom.toISOString().substr(11, 5);
          i.schedTo = i.schedTo.toISOString().substr(11, 5);
          // console.log(i.schedFrom, i.schedTo);
          // let schedFrom = util.formatDate({
          //   date: i.schedFrom,
          //   straightDateWithMilitaryTime: true,
          // });
          // i.schedFrom = schedFrom;

          // let schedTo = util.formatDate({
          //   date: i.schedTo,
          //   straightDateWithMilitaryTime: true,
          // });
          // i.schedTo = schedTo;

          // console.log(i.schedFrom, i.schedTo);
          // i.schedFrom = i.schedFrom.toISOString().substr(11, 5);
        } else {
          i.schedFrom = i.NOTE;
          i.schedTo = i.NOTE;
        }
        // console.log(i)
        return {
          Date: i.formattedTransDate,
          Day: weekday[transDate.getDay()],
          "Sched From": i.schedFrom,
          "Sched To": i.schedTo,
          "Time In": i.IN,
          "Time Out": i.OUT,
          "OT In": i["OT - IN"],
          "OT Out": i["OT - OUT"],
          "OT Hrs": i.otHours,
          Leave: i.leaveType,
          Absent: i.isOff ? 0 : i.isAbsent ? 1 : 0,
          Late: i.late,
          Undertime: i.undertime,
          "Diff AM": i.diffAM,
          "Diff PM": i.diffPM,
          Calendar: i.calType,
        };
      });
      computed.habitualTardiness = dtr.recordset.map((i) => {
        const transDate = new Date(i.transDate);
        const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const formattedTransDate = new Date(i.transDate)
          .toISOString()
          .substring(0, 10);

        const timeIn = new Date(`${formattedTransDate} ${i.IN}`);
        const scheduleFrom = new Date(`${formattedTransDate} ${i.schedFrom}`);
        let earlyIn = 0;
        if (timeIn < scheduleFrom) {
          const diff = scheduleFrom.getTime() - timeIn.getTime();
          const msec = diff;
          const mm = Math.floor(msec / 1000 / 60);
          earlyIn = mm;
        }
        let perfectAttendance = 1;
        if (i.late > 0 && i.absent === 1) {
          perfectAttendance = 0;
        }

        return {
          Date: new Date(i.transDate).toISOString().substring(0, 10),
          Day: weekday[transDate.getDay()],
          "Sched From": i.schedFrom === null ? "" : i.schedFrom,
          "Sched To": i.schedTo === null ? "" : i.schedTo,
          "Time In": i.IN,
          "Time Out": i.OUT,
          Leave: i.leaveType,
          Absent: i.isOff ? 0 : i.isAbsent ? 1 : 0,
          EarlyIn: earlyIn,
          Late: i.late,
          ExcessiveTardiness:
            i.late > 15 ? (i.late < 15 ? 15 - i.late : i.late - 15) : 0,
        };
      });

      let countHabitualTardiness = 0;
      for (const computation of computed.habitualTardiness) {
        countHabitualTardiness += computation.ExcessiveTardiness;
      }
      const filterHabitualTardiness = computed.habitualTardiness.filter(
        (filterHabitualTardiness) =>
          filterHabitualTardiness.ExcessiveTardiness !== 0,
      );
      computed.habitualTardinessTotal = {
        total: countHabitualTardiness,
        habitualTardiness: filterHabitualTardiness.length,
      };

      computed.params = req.query;
      res.send(computed);
    } catch (error) {
      console.log(error);
      res.send({ error });
    }
  })();
});

router.get("/ot-summary/:payrollPeriod?", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    o.code,
    e.name,
    e.DEPT_DESC department,
    e.pos_desc position,
    sum(s.hours) hours,
    s.type,
    count(o.code) qty,
    s.payrollPeriod
  from HR..OTSummary s
  join [UE database]..overtime o
    on o.id = s.otId
    and isnull(o.[OT PAID],0) = 0
    and o.deleted = 0
  left join [UE database]..vw_Employees e
    on e.code = o.code
  -- where o.payrollPeriod is null
  where o.[OT PAID] = 0
  and o.payrollPeriod not in
    (select
      concat(d.YEAR,d.MONTH,d.WEEKCODE) payrollPeriod
    from [UE database]..jom_HRMS_DTRPosting d
    where d.FINAL = 1)
  and s.deleted = 0
  and s.payrollPeriod like '%${req.params.payrollPeriod || "%"}%'
  group by o.code,s.payrollPeriod,s.type,e.name,e.DEPT_DESC,e.pos_desc
  order by name`;

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

router.get("/ot-summary-paid/:payrollPeriod?", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const sqlQuery = `select
    o.code,
    e.name,
    e.DEPT_DESC department,
    e.pos_desc position,
    sum(s.hours) hours,
    s.type,
    count(o.code) qty,
    s.payrollPeriod
  from HR..OTSummary s
  join [UE database]..overtime o
    on o.id = s.otId
    and o.deleted = 0
  left join [UE database]..vw_Employees e
    on e.code = o.code
  -- where o.payrollPeriod is null
  where
  -- o.[OT PAID] = 0
  -- and
  o.payrollPeriod in
    (select
      concat(d.YEAR,d.MONTH,d.WEEKCODE) payrollPeriod
    from [UE database]..jom_HRMS_DTRPosting d
    where d.FINAL = 1)
  and s.deleted = 0
  and o.payrollPeriod = '${req.params.payrollPeriod}'
  group by o.code,s.payrollPeriod,s.type,e.name,e.DEPT_DESC,e.pos_desc
  order by name`;

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

router.get("/employee-timedata-compute", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select top 50
    e.code,
    e.name,
    e.DEPT_DESC department,
    e.POS_DESC position,
    e.EMP_CLASS_CODE class
  from [UE database]..vw_Employees e
	left join UERMATT..timeDataPosting t
		on e.CODE = t.code
    and t.cancelled = 0
		and convert(varchar(6),t.dateTo,112)+t.weekCode = '${req.query.payrollPeriod}'
	left join UERMATT..NoDtr d
		on e.CODE = d.code
		and d.deleted = 0
  where e.EMP_CLASS_CODE in ('RA','MA','OF')
  and e.EMP_CLASS_CODE like '${req.query.class}'
	and t.code is null

	${req.query.class.toLowerCase() == "of" ? "" : "and d.code is null"}
  and e.IS_ACTIVE = 1
  order by department,name`;
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

router.get("/employee-timedata", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    e.code,
    e.name,
    e.DEPT_DESC department,
    e.POS_DESC position,
    e.EMP_CLASS_CODE class
  from [UE database]..vw_Employees e
	left join UERMATT..timeDataPosting t
		on e.CODE = t.code
    and t.cancelled = 0
		and convert(varchar(6),t.dateTo,112)+t.weekCode = '${req.query.payrollPeriod}'
	left join UERMATT..NoDtr d
		on e.CODE = d.code
		and d.deleted = 0
  where e.EMP_CLASS_CODE in ('RA','MA','OF')
  and e.EMP_CLASS_CODE like '${req.query.class}'
	${req.query.class.toLowerCase() == "of" ? "" : "and d.code is null"}
  and e.IS_ACTIVE = 1
  order by department,name`;

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

router.get("/timedata-summary", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    d.id,
    e.CODE code,
    e.NAME name,
    e.DEPT_DESC department,
    e.POS_DESC position,
    d.ABSENCES absencesDay,
    d.ABSENCES_HR absencesHour,
    d.tardy late,
    d.undertime,
    d.OVERTIME35 ot35,
    d.OVERTIME ot100,
    d.OVERTIME130 ot130,
    d.OVERTIME135 ot135,
    d.DIFFNP diffNp,
    d.DIFFPM diffPm,
    d.refund,
    d.note,
    e.EMP_CLASS_CODE class
  from [UE database]..jom_HRMS_DTRPosting d
  join [UE database]..vw_Employees e
    on e.CODE = d.CODE
  where concat(d.year,d.month,d.weekcode) = '${req.query.payrollPeriod}'
  and d.FINAL like '${req.query.final}'

  union

  select
    d.id,
    e.CODE code,
    e.NAME name,
    e.DEPT_DESC department,
    e.POS_DESC position,
    isnull(d.ABSENCES,0) absencesDay,
    isnull(d.ABSENCES_HR,0) absencesHour,
    isnull(d.tardy,0) late,
    isnull(d.undertime,0) undertime,
    isnull(d.OVERTIME35,0) ot35,
    isnull(d.OVERTIME,0) ot100,
    isnull(d.OVERTIME130,0) ot130,
    isnull(d.OVERTIME135,0) ot135,
    isnull(d.DIFFNP,0) diffNp,
    isnull(d.DIFFPM,0) diffPm,
    isnull(d.refund,0) refund,
    isnull(d.note,0) note,
    e.EMP_CLASS_CODE class
  from [UE database]..vw_Employees e
  join [UE database]..jom_HRMS_DTRPosting d
    on d.CODE = e.CODE
    and concat(d.year,d.month,d.weekcode) = '${req.query.payrollPeriod}'
  where e.IS_ACTIVE like 1
  and e.IS_OFFICER = 1
  and isnull(d.FINAL,0) like '${req.query.final}'
  order by department,name`;

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

router.post("/save-timedata", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec [HR]..[sp_SaveTimeData]
    '${req.body.code}',
    '${req.body.absences}',
    0,
    '${req.body.late}',
    '${req.body.undertime}',
    '${req.body.diffPM}',
    '${req.body.diffAM}',
    '${req.body.ot35}',
    '${req.body.ot100}',
    '${req.body.ot130}',
    '${req.body.ot135}',
    '${req.body.note}',
    '${req.body.payrollPeriod}',
    '${req.body.dtrFrom}',
    '${req.body.dtrTo}',
    '${req.body.refund}',
    '${req.body.user}',
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

router.post("/remove-assignment", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec [HR]..[sp_RemoveAssignment]
    '${req.body.id}',
    '${req.body.user}',
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

router.post("/assign-approver-department", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const depts = req.body.departments.split(",");
  const result = [];

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      for (const d of depts) {
        const sqlQuery = `exec [HR]..[sp_AssignApproverDept]
          '${req.body.lvl}',
          '${req.body.code}',
          '${d}',
          '${req.body.user}',
          '${helpers.getIp(req.socket.remoteAddress)}'
        `;
        const r = await sql.query(sqlQuery);
        result.push(r.recordset[0]);
      }
      // sql.close();
      res.send(result);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/toggle-assignment-lvl", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec [HR]..[sp_ToggleAssignmentLvl]
    '${req.body.id}',
    '${req.body.user}',
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

router.post("/timedata-finalize", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec [HR]..sp_FinalizeTimeData
    '${req.body.id}',
    '${req.body.user}',
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

router.post("/timedata-summary-reverse", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec [HR]..sp_ReverseTimedataSummary
    '${req.body.id}',
    '${req.body.user}',
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

router.post("/save-time-adjustment", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_SaveTimeAdjustment
    '${req.body.code}',
    '${req.body.date}',
    '${req.body.time}',
    '${req.body.type}',
    '${req.body.reason}',
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

router.get("/time-adjustment", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const fromDate = req.query.dateFrom;
  const toDate = req.query.dateTo;

  const sqlQuery = `select
    t.id,
    t.code,
    e.name,
    e.DEPT_DESC department,
    e.POS_DESC position,
    t.date,
    convert(varchar(5),t.time) time,
    t.type,
    t.reason
  from HR..TimeAdjustment t
  join [UE database]..vw_Employees e
    on t.code = e.code
  where t.deleted = 0
  and convert(date, t.date) between '${fromDate}' and '${toDate}'
  and completed = 0`;
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

router.post("/tag-time-adjustment", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_TagTimeAdjustment
    '${req.body.type}',
    '${req.body.id}',
    '${req.body.user}',
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

router.get("/refund-search", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    d.id,
    d.code,
    e.name,
    e.DEPT_DESC department,
    e.POS_DESC position,
    d.absences,
    d.note
  from [UE database]..jom_HRMS_DTRPosting d
  join [UE database]..vw_Employees e
    on d.code = e.code
  left join HR..DTRRefunds r
    on d.id = r.dtrPostingId
    and r.deleted = 0
  where d.FINAL = 1
  and concat(d.YEAR,d.month,d.weekcode) = '${req.query.pp}'
  and e.name like '${req.query.name || "%"}'
  and d.ABSENCES > 0
  and r.id is null
  order by department,name`;

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(
        result.recordset.map((i) => {
          return {
            ...i,
            absencesDate: timedataHelpers.getAbsences(i.note),
            absencesSelected: [],
          };
        }),
      );
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/tag-refund", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_TagRefund
    '${req.body.payrollPeriod}',
    '${req.body.id}',
    '${req.body.days}',
    '${req.body.user}',
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

router.get("/refund-active", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select
    r.id,
    r.payrollPeriod,
    r.days,
    e.code,
    e.name,
    e.dept_desc department,
    e.pos_desc position
  from HR..DTRRefunds r
  join [UE database]..jom_HRMS_DTRPosting d
    on r.dtrPostingId = d.id
  join [UE database]..vw_Employees e
    on d.code = e.code
  left join [UE database]..jom_HRMS_DTRPosting p
    on r.payrollPeriod = concat(d.year,d.month,d.weekcode)
    and d.code = p.code
  where r.deleted = 0
  and p.code is null
  order by name`;

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

router.post("/refund-remove", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `exec HR..sp_RemoveRefund
    '${req.body.id}',
    '${req.body.code}',
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

router.get("/leave-details", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `select HR.[dbo].fn_GetAvailableLeave(
      '${req.query.employeeId}',
      '${req.query.leaveType}',
      '${req.query.year}'
    ) availableLeave
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

router.get("/leave-detailed", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  const sqlQuery = `
    SELECT 
       leaveId
      ,approveLeaveId
      ,code
      ,name
      ,posCode
      ,position
      ,deptCode
      ,department
      ,leaveType
      ,leaveFrom
      ,leaveTo
      ,duration
      ,reason
      ,status
      ,statusCode
      ,approverCode
      ,dateFiled
      ,leaveAge
      ,approveDate
      ,acceptDate
      ,archived
      ,hrReceived
      ,hrReceiveDate
      ,statusDescription
    FROM HR..vw_LeaveStatus
    where code = '${req.query.employeeId}'
    and DATEPART(YEAR, dateFiled) = '${req.query.year}'
    and leaveType = '${req.query.leaveType}'
    and status = 'ACCEPTED'
  `;

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

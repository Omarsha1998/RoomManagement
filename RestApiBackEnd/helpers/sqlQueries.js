/* eslint-disable no-fallthrough */
function imagingResults(params) {
  const sqlQuery = `
  select * from
    (select
      r.id,
      r.controlNo,
      cm.caseno,
      ltrim(rtrim(cm.chargeslipNo)) chargeSlipNo,
      p.patientNo,
      p.lastName,p.firstName,p.middleName,
      concat(p.lastName,', ',p.firstName,' ',p.middleName) patientName,
      case
        when isdate(p.dbirth) = 0 then 0
        else datediff(month,p.DBIRTH,c.DATEAD)/12
      end age,
      p.sex gender,
      ch.description,
      convert(varchar(max),cm.CHARGEDATETIME,107) chargeDate,
      convert(varchar(max),convert(time,cm.CHARGEDATETIME),100) chargeTime,
      case
        when convert(date,cm.CHARGEDATETIME) <= '2020-08-03' and r.result is not null then 1
        when r.createDate < '2020-09-28 13:40:21.367' and r.result is not null then 1
        else r.isValidated
      end isValidated,
      r.validateDate,
      d.name requestingPhysician,
      r.technician,
      concat(e.LastName,' ',e.FirstName,' ',e.MiddleName) technicianName,
      d.code physician,
      d.name physicianName,
      convert(varchar(max),r.result) result,
      convert(varchar(max),r.createDate,107) resultDate,
      convert(varchar(max),r.createDate) resultDateTime,
      convert(varchar(max),convert(time,r.createDate),0) resultTime,
      convert(varchar(max),r.attachments) attachments,
      ch.REV_CODE revCode
    from emr..ImagingResults r
    join UERMMMC..CHARGES_MAIN cm
      on r.csno = cm.chargeslipno
    join UERMMMC..CHARGES_DETAILS cd
      on cm.CHARGESLIPNO = cd.CHARGESLIPNO
    join UERMMMC..CHARGES ch
      on cd.CHARGE_ID = ch.ID
    join uermmmc..cases c
      on cm.caseno = c.caseno
    join UERMMMC..PATIENTINFO p
      on c.PATIENTNO = p.PATIENTNO
    join UERMMMC..DOCTORS d
      on case
          when r.physician is null then r.physicianUnverified
          else r.physician
        end = d.CODE
    join [UE database]..vw_Employees e
      on r.technician = e.code
    where d.code = '${params.drCode}') x
  where x.isValidated = 0
  order by patientName`;

  return sqlQuery;
}
function imagingCharges(params) {
  const queryString = {};
  params.withResult = params.withResult || "%";
  // console.log(params)
  // params.withResult = params.withResult.toString();
  switch (params.withResult) {
    case true:
      params.withResult = "1";
    case "1":
      queryString.withResult = `and r.result is not null`;
      break;
    case false:
      params.withResult = "0";
    case "0":
      queryString.withResult = `and r.result is null`;
      break;
    case "%":
      queryString.withResult = `and isnull(convert(varchar(max),r.result),'') like '%'`;
      break;
    default:
      queryString.withResult = `and isnull(convert(varchar(max),r.result),'') like '${
        params.withResult == "1" || params.withResult == true ? "%" : ""
      }'`;
  }
  queryString.recentValidated = params.isRecentValidated
    ? "and datediff(hour,r.validateDate,getdate()) <= 24"
    : "";

  const sqlQuery = `select
    *
  from
    (select
      r.id,
      cd.id chargeDetailId,
      r.controlNo,
      cm.caseno,
      ltrim(rtrim(cm.chargeslipNo)) chargeSlipNo,
      cd.CHARGE_ID chargeId,
      p.patientNo,
      p.lastName,p.firstName,p.middleName,
      concat(p.lastName,', ',p.firstName,' ',p.middleName) patientName,
      case
        when cs.LAST_ROOM = '' and cs.PATIENTTYPE = 'opd' then
          case
            when cs.UERM_STUD_EMPLOYEE <> 'N/A' then 'INF'
            when cs.PATIENT_CATEGORY = 'cha' then 'OPCha'
            else 'OPPay'
          end
        else cs.LAST_ROOM
      end room,
      case
        when isdate(p.dbirth) = 0 then 0
        else datediff(month,p.DBIRTH,cs.DATEAD)/12
        /*when cs.age = '' then datediff(month,p.DBIRTH,getdate())/12
        when isnumeric(cs.age) = 0 then 0
        else cs.age*/
      end age,
      p.sex gender,
      c.description,
      convert(varchar(max),cm.CHARGEDATETIME,107) chargeDate,
      convert(varchar(max),convert(time,cm.CHARGEDATETIME),100) chargeTime,
      case
        -- when r.result is null and year(cm.CHARGEDATETIME) = year(getdate()) then 0
        when convert(date,cm.CHARGEDATETIME) <= '2020-08-03' and r.result is not null then 1
        when r.createDate < '2020-09-28 13:40:21.367' and r.result is not null then 1
        else r.isValidated
      end isValidated,
      r.validateDate,
      /*case
        when att.name is null then dd.name
        else att.name
      end requestingPhysician,*/
      dd.name requestingPhysician,
      case
        when convert(date,cm.CHARGEDATETIME) <= '2020-08-03' then ''
        --when ee.EmployeeCode = '5272' then ''
        else concat(ee.LastName,' ',ee.FirstName,' ',ee.MiddleName)
      end validatedByName,
      case
        when convert(date,cm.CHARGEDATETIME) <= '2020-08-03' then ''
        --when ee.EmployeeCode = '5272' then ''
        else ee.EmployeeCode
      end validatedByCode,
      r.technician,
      concat(e.LastName,' ',e.FirstName,' ',e.MiddleName) technicianName,
      case
        when r.physician is null and r.physicianUnverified is null then cd.READER
        when r.physician is null and r.physicianUnverified is not null then r.physicianUnverified
        else r.physician
      end physician,
      d.name physicianName,
      convert(varchar(max),r.result) result,
      convert(varchar(max),r.createDate,107) resultDate,
      convert(varchar(max),r.createDate) resultDateTime,
      convert(varchar(max),convert(time,r.createDate),0) resultTime,
      convert(varchar(max),r.attachments) attachments,
      c.REV_CODE revCode,
      m.description revDescription,
      isnull(r.fromRis,0) fromRis,
      'details' chargeType
    from UERMMMC..CHARGES_MAIN cm
    join UERMMMC..cases cs
      on cs.CASENO = cm.CASENO
    join UERMMMC..PATIENTINFO p
      on p.PATIENTNO = cs.PATIENTNO
    left join UERMMMC..CHARGES_DETAILS cd
      on cm.CHARGESLIPNO = cd.CHARGESLIPNO
    left join UERMMMC..CHARGES c
      on c.ID = cd.CHARGE_ID
    left join EMR..ImagingResults r
      on r.csno = cm.CHARGESLIPNO
      and case
        when r.createDate < '2020-09-28 13:40:21.367' then cd.ID -- select getdate()
        else r.chargeDetailId
      end = cd.ID
      and r.deleted = 0
    left join [UE database]..Employee e
      on e.employeecode = r.technician
    left join UERMMMC..DOCTORS d
      on d.CODE = r.physician
    left join [UE database]..Employee ee
      on ee.EmployeeCode = r.validatedBy
    /*left join UERMMMC..vw_AttendingPhysician att
      on att.caseno = cs.CASENO*/
    join EMR..vw_Modalities m
      on m.revCode = c.REV_CODE
    left join UERMMMC..DOCTORS dd
      on cm.DR_CODE = dd.CODE
    where cm.CANCELED = 'n'
    ${params.id ? `and r.id = '${params.id}'` : ""}
    and cd.CANCELED = 'n'
    and c.AllowOnlineResult = 1
    and cm.CHARGESLIPNO like '${params.chargeSlipNo || "%"}'
    and p.LASTNAME like '${params.lastName || ""}%'
    and p.FIRSTNAME like '${params.firstName || ""}%'
    and isnull(ee.EmployeeCode,'') like '${params.code || ""}%'
    ${queryString.withResult}
    ${queryString.recentValidated}

    union

    select
      r.id,
      cd.id chargeDetailId,
      r.controlNo,
      cm.caseno,
      ltrim(rtrim(cm.chargeslipNo)) chargeSlipNo,
      cd.PackageChargeID chargeId,
      p.patientNo,
      p.lastName,p.firstName,p.middleName,
      concat(p.lastName,', ',p.firstName,' ',p.middleName) patientName,
      case
        when cs.LAST_ROOM = '' and cs.PATIENTTYPE = 'opd' then
          case
            when cs.UERM_STUD_EMPLOYEE <> 'N/A' then 'INF'
            when cs.PATIENT_CATEGORY = 'cha' then 'OPCha'
            else 'OPPay'
          end
        else cs.LAST_ROOM
      end room,
      case
        when isdate(p.dbirth) = 0 then 0
        else datediff(month,p.DBIRTH,cs.DATEAD)/12
        /*when cs.age = '' then datediff(month,p.DBIRTH,getdate())/12
        when isnumeric(cs.age) = 0 then 0
        else cs.age*/
      end age,
      p.sex gender,
      c.description,
      convert(varchar(max),cm.CHARGEDATETIME,107) chargeDate,
      convert(varchar(max),convert(time,cm.CHARGEDATETIME),100) chargeTime,
      case
        -- when r.result is null and year(cm.CHARGEDATETIME) = year(getdate()) then 0
        when convert(date,cm.CHARGEDATETIME) <= '2020-08-03' and r.result is not null then 1
        when r.createDate < '2020-09-28 13:40:21.367' and r.result is not null then 1
        else r.isValidated
      end isValidated,
      r.validateDate,
      /*case
        when att.name is null then dd.name
        else att.name
      end requestingPhysician,*/
      dd.name requestingPhysician,
      case
        when convert(date,cm.CHARGEDATETIME) <= '2020-08-03' then ''
        --when ee.EmployeeCode = '5272' then ''
        else concat(ee.LastName,' ',ee.FirstName,' ',ee.MiddleName)
      end validatedByName,
      case
        when convert(date,cm.CHARGEDATETIME) <= '2020-08-03' then ''
        --when ee.EmployeeCode = '5272' then ''
        else ee.EmployeeCode
      end validatedByCode,
      r.technician,
      concat(e.LastName,' ',e.FirstName,' ',e.MiddleName) technicianName,
      case
        when r.physician is null and r.physicianUnverified is null then cd.READER
        when r.physician is null and r.physicianUnverified is not null then r.physicianUnverified
        else r.physician
      end physician,
      d.name physicianName,
      convert(varchar(max),r.result) result,
      convert(varchar(max),r.createDate,107) resultDate,
      convert(varchar(max),r.createDate) resultDateTime,
      convert(varchar(max),convert(time,r.createDate),0) resultTime,
      convert(varchar(max),r.attachments) attachments,
      c.REV_CODE revCode,
      m.description revDescription,
      isnull(r.fromRis,0) fromRis,
      'package' chargeType
    from UERMMMC..CHARGES_MAIN cm
    join UERMMMC..cases cs
      on cs.CASENO = cm.CASENO
    join UERMMMC..PATIENTINFO p
      on p.PATIENTNO = cs.PATIENTNO
    left join UERMMMC..CHARGES_DETAILS_Package cd
      on cm.CHARGESLIPNO = cd.CHARGESLIPNO
    left join UERMMMC..CHARGES c
      on c.ID = cd.ItemCodeChargeID
    left join EMR..ImagingResults r
      on r.csno = cm.CHARGESLIPNO
      and case
        when r.createDate < '2020-09-28 13:40:21.367' then cd.ID -- select getdate()
        else r.chargeDetailId
      end = cd.ID
      and r.deleted = 0
    left join [UE database]..Employee e
      on e.employeecode = r.technician
    left join UERMMMC..DOCTORS d
      on d.CODE = r.physician
    left join [UE database]..Employee ee
      on ee.EmployeeCode = r.validatedBy
    /*left join UERMMMC..vw_AttendingPhysician att
      on att.caseno = cs.CASENO*/
    join EMR..vw_Modalities m
      on m.revCode = c.REV_CODE
    left join UERMMMC..DOCTORS dd
      on cm.DR_CODE = dd.CODE
    left join UERMMMC..CHARGES_DETAILS ccd
      on ccd.CHARGESLIPNO = cd.CHARGESLIPNO
    where cm.CANCELED = 'n'
    and ccd.CANCELED = 'n'
    and c.AllowOnlineResult = 1
    ${params.id ? `and r.id = '${params.id}'` : ""}
    and cm.CHARGESLIPNO like '${params.chargeSlipNo || "%"}'
    and p.LASTNAME like '${params.lastName || ""}%'
    and p.FIRSTNAME like '${params.firstName || ""}%'
    and isnull(ee.EmployeeCode,'') like '${params.code || ""}%'
    ${queryString.withResult}
    ${queryString.recentValidated}) x
  where isnull(x.isValidated,'') like '${params.isValidated || "%"}'
  and x.revCode like '${params.revCode || "%"}'
  order by ${
    params.lastName && params.lastName == "" ? "1" : "x.isValidated"
  }, convert(date,chargeDate) desc, convert(date,resultDate) desc`;

  return sqlQuery;
}

module.exports = {
  imagingCharges,
  imagingResults,
};

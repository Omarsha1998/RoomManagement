/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPersonnels = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
			${util.empty(options.top) ? "" : `TOP(${options.top})`}
			code, 
      name, 
      firstName, 
      lastName, 
      middleName, 
      concat(lastName, ', ', firstName) fullName, 
      concat(firstName, ' ', lastName) alternativeFullName, 
      gender, 
      bdate birthdate, 
      email = case when UERMEmail is not null then UERMEmail else email end, 
      mobileNo, 
      pass password, 
      case when (
        select 
          count(*) 
        from 
          HR..vw_ServiceRecord e 
        where 
          e.code = a.code 
          and e.deleted = 0 
          and e.classCode = 'OF' 
          and active = 1
      ) > 0 then (
        select 
          top(1) departmentCode 
        from 
          HR..vw_ServiceRecord e 
        where 
          e.code = a.code 
          and e.deleted = 0 
          and e.classCode = 'OF' 
          and active = 1 
        order by 
          [from] desc
      ) else dept_code end deptCode, 
      case when (
        select 
          count(*) 
        from 
          HR..vw_ServiceRecord e 
        where 
          e.code = a.code 
          and e.deleted = 0 
          and e.classCode = 'OF' 
          and active = 1
      ) > 0 then (
        select 
          top(1) departmentDesc 
        from 
          HR..vw_ServiceRecord e 
        where 
          e.code = a.code 
          and e.deleted = 0 
          and e.classCode = 'OF' 
          and active = 1 
        order by 
          [from] desc
      ) else dept_desc end deptDesc, 
      case when (
        select 
          count(*) 
        from 
          HR..vw_ServiceRecord e 
        where 
          e.code = a.code 
          and e.deleted = 0 
          and e.classCode = 'OF' 
          and active = 1
      ) > 0 then (
        select 
          top(1) positionDesc 
        from 
          HR..vw_ServiceRecord e 
        where 
          e.code = a.code 
          and e.deleted = 0 
          and e.classCode = 'OF' 
          and active = 1 
        order by 
          [from] desc
      ) else pos_desc end posDesc, 
      civil_status_desc civilStatusDesc, 
      [group], 
      emp_class_desc empClassDesc, 
      emp_class_code empClassCode, 
      address, 
      [SERVICE YEARS] serviceYears, 
      is_active isActive 
		from [UE Database]..vw_Employees a
		where 1=1 ${conditions}
		${util.empty(options.order) ? "" : `order by ${options.order}`}
		`,
      args,
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectDoctors = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
			  ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.code id,
        a.ehr_code code,
        a.name,
        a.[FIRST NAME] firstName,
        a.[MIDDLE NAME] middleName,
        a.[LAST NAME] lastName,
        a.[EXT NAME] nameExtension,
        a.gender,
        a.email,
        b.uermEmail,
        a.password,
        a.department,
        a.[AREA OF SPECIALTY] areaOfSpecialty,
        a.specialization,
        a.phic,
        a.mpn1 contactNumber1,
        a.mpn2 contactNumber2,
        a.emp_code employeeCode,
        a.[PHIC EXP DATE] phicExpirationDate,
        a.[LIC EXP DATE] licenseExpirationDate,
        a.sched,
        a.secName1 secretaryName,
        a.secMpn1 secretaryContactNumber,
        a.hmoAccred,
        a.clinicalDepartment,
        a.subDepartment,
        a.ancillaryDepartment,
        a.ancillaryDesignation,
        a.ancillaryTests,
        a.initialLogin,
        a.createdBy,
        a.updatedBy,
        a.dateTimeCreated,
        a.dateTimeUpdated
      from UERMMMC..Doctors a 
      left join [UE database]..vw_Employees b on b.code = a.emp_code
        where 1=1 ${conditions}
		${util.empty(options.order) ? "" : `order by ${options.order}`}
		`,
      args,
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectAppUsers = async function (
  conditions,
  args,
  options,
  txn,
  module = false,
) {
  try {
    const users = await sqlHelper.query(
      `select 
        ${module ? "" : "distinct"} 
        b.code,
        b.name,
        b.lastName,
        b.firstName,
        b.middleName,
        CONCAT(
          b.firstName,
          CASE 
            WHEN b.middleName IS NOT NULL AND b.middleName <> '' THEN ' ' + LEFT(b.middleName, 1) + '.'
            ELSE ''
          END,
          ' ', b.lastName,
          CASE 
            WHEN b.extname IS NOT NULL AND b.extname <> '' THEN ', ' + b.extname
            ELSE ''
          END
        ) AS fullName,
        b.mobileNo,
        b.email,
        b.uermEmail,
        b.dept_code deptCode,
        b.dept_desc deptDesc,
        b.pos_code positionCode,
        b.pos_desc positionDesc,
        b.is_active isActive,
        a.moduleName
      from ITMgt..UserAccess a
      join [UE database]..vw_Employees b on b.code = a.code
      where 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return users;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateInformation = async function (payload, condition, table, txn) {
  try {
    return await sqlHelper.update(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectPersonnels,
  selectDoctors,
  selectAppUsers,
  updateInformation,
};

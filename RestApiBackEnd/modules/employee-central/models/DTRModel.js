const sqlHelper = require("../../../helpers/sql");

const getDTRDetails = async (
  startDate,
  endDate,
  employeeCode,
  departmentCode,
  displayType,
  classType,
) => {
  // try {
  //     const DTRQuery = `
  //       EXEC HR.dbo.Usp_jf_DTRv2
  //         ${sqlWhereStrArr.join(', ')};
  //     `;

  //     const result = await conn
  //       .request()
  //       .input('startDate', sql.VarChar, args.startDate)
  //       .input('endDate', sql.VarChar, args.endDate)
  //       .input('employeeCode', sql.VarChar, args.employeeCode)
  //       .input('additionalParameter', sql.VarChar, args.additionalParameter)
  //       .query(DTRQuery);

  //     return result.recordset;
  // } catch (error) {
  //     console.error(error);
  //     return { status: 500, message: 'Failed to retrieve DTR Details' };
  // }

  return await sqlHelper.query(
    `EXEC HR.dbo.Usp_jf_DTRv2 
      '${startDate}',
      '${endDate}',
      '${employeeCode}',
      '${departmentCode}',
      '${displayType}',
      '${classType}'
      `,
    [],
  );
};

const noDtrEmployee = async (employeeId) => {
  // return await sqlHelper.query(
  //   `SELECT Position, PositionCode
  //     FROM [UE database]..NoDtrEmployee
  //     `,
  // );

  return await sqlHelper.query(
    `SELECT CASE 
      WHEN EXISTS (
          SELECT 1
          FROM [UERMATT].[dbo].[NoDtr]
          WHERE code = ?
        ) THEN 1
        ELSE 0
      END AS result
    `,
    [employeeId],
  );
};

const timeData = async (period, employeeCode) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      HR..TimeData
    WHERE
      period = ? and code = ?
    `,
    [period, employeeCode],
  );
};

const updateTimeDate = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "HR..TimeData",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const employeeClass = async () => {
  return await sqlHelper.query(
    `SELECT class, TRIM(Description) description
    FROM
      [UE database]..EmployeeClass
    `,
  );
};

const getEmployees = async (payrollPeriod, employeeClass) => {
  return await sqlHelper.query(
    `select 
      e.code,
      e.name,
      e.DEPT_DESC department,
      e.POS_DESC position,
      e.EMP_CLASS_CODE class
    from [UE database]..vw_Employees e
    left join UERMATT..timeDataPosting t
      on e.CODE = t.code
      and t.cancelled = 0
      and convert(varchar(6),t.dateTo,112)+t.weekCode = ?
    left join UERMATT..NoDtr d
      on e.CODE = d.code
      and d.deleted = 0
    where e.EMP_CLASS_CODE like ?
    and t.code is null
    and d.code is null
    and e.IS_ACTIVE = 1
    order by department,name
    `,
    [payrollPeriod, employeeClass],
  );
};

const employeeOvertime = async (employeeCode, payrollPeriod) => {
  return await sqlHelper.query(
    `select
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
    and o.CODE = ?
    and s.payrollPeriod = ?
    order by date
    `,
    [employeeCode, payrollPeriod],
  );
};

const dtrPosting = async (
  code,
  absences,
  absencesHour,
  late,
  undertime,
  diffAM,
  diffPM,
  ot35,
  ot100,
  ot130,
  ot135,
  refund,
  note,
  payrollPeriod,
  timeDataFrom,
  timeDataTo,
  moduleParams,
  user,
  origin,
  txn,
) => {
  return await sqlHelper.query(
    `EXEC HR..sp_UpdateDTR
      '${code}',
      '${absences}',
      '${absencesHour}',
      '${late}',
      '${undertime}',
      '${diffPM}',
      '${diffAM}',
      '${ot35}',
      '${ot100}',
      '${ot130}',
      '${ot135}',
      '${note}',
      '${payrollPeriod}',
      '${timeDataFrom}',
      '${timeDataTo}',
      '${refund}',
      '${moduleParams}',
      '${user}',
      '${origin}'
    `,
    [],
    txn,
  );
};

const finalizeTimeData = async (
  fromDate,
  toDate,
  user,
  origin = "EmployeeCentral",
) => {
  return await sqlHelper.query(
    `EXEC UERMATT..sp_FinalizeTimeDataRecord
      '${fromDate}',
      '${toDate}',
      '${user}',
      '${origin}'
    `,
    [],
  );
};

const getComputedLate = async (
  startDate,
  endDate,
  employeeCode,
  departmentCode,
  displayType,
  classType,
) => {
  return await sqlHelper.query(
    `EXEC HR.dbo.Usp_jf_DTRv2 
      '${startDate}',
      '${endDate}',
      '${employeeCode}',
      '${departmentCode}',
      '${displayType}',
      '${classType}'
      `,
    [],
  );
};

// const getSummaryReport = async (payrollPeriod) => {
//   return await sqlHelper.query(
//     `SELECT
//       d.CODE employeeCode,
//       e.FULLNAME employeeName,
//       e.DEPT_DESC department,
//       d.[FROM] payrollFrom,
//       d.[TO] payrollTo,
//       d.ABSENCES absences,
//       d.ABSENCES_HR absencesHours,
//       d.TARDY lates,
//       d.UNDERTIME undertime,
//       d.OVERTIME35 oT35,
//       d.OVERTIME oT100,
//       d.OVERTIME130 oT130,
//       d.OVERTIME135 oT135,
//       d.DIFFNP diffAM,
//       d.DIFFPM diffPM,
//       d.REFUND refund
//     FROM [UE database]..jom_HRMS_DTRPosting d
//     INNER JOIN [UE database]..vw_Employees e ON d.CODE = e.CODE
//     WHERE d.FINAL = 1
//       AND CONCAT(year, month, weekcode) = ?
//     ORDER BY e.FULLNAME ASC;
//     `,
//     [payrollPeriod],
//   );
// };

// const getSummaryReport = async (
//   payrollPeriod,
//   typeReport,
//   fromDate,
//   toDate,
//   employeeCode,
//   classCode,
// ) => {
//   const isFacultyResident = typeReport === "facultyResident";
//   const finalCondition = isFacultyResident ? 0 : 1;

//   const employeeFilter =
//     isFacultyResident && employeeCode ? "AND e.CODE = ?" : "";
//   const classFilter = classCode ? "AND e.EMP_CLASS_CODE = ?" : "";

//   const buildParams = (finalValue) => {
//     const params = [finalValue, payrollPeriod];
//     if (employeeFilter && employeeCode) params.push(employeeCode);
//     if (classFilter && classCode) params.push(classCode);
//     return params;
//   };

//   const getDTRQuery = () => `
//     SELECT
//       d.CODE employeeCode,
//       e.FULLNAME employeeName,
//       e.DEPT_DESC department,
//       d.[FROM] payrollFrom,
//       d.[TO] payrollTo,
//       d.ABSENCES absences,
//       d.ABSENCES_HR absencesHours,
//       d.TARDY lates,
//       d.UNDERTIME undertime,
//       d.OVERTIME35 oT35,
//       d.OVERTIME oT100,
//       d.OVERTIME130 oT130,
//       d.OVERTIME135 oT135,
//       d.DIFFNP diffAM,
//       d.DIFFPM diffPM,
//       d.REFUND refund,
//       d.FINAL final,
//       d.note
//     FROM [UE database]..jom_HRMS_DTRPosting d
//     INNER JOIN [UE database]..vw_Employees e ON d.CODE = e.CODE
//     WHERE d.FINAL = ?
//       AND CONCAT(year, month, weekcode) = ?
//       ${employeeFilter}
//       ${classFilter}
//     ORDER BY e.FULLNAME ASC;
//   `;

//   const mainQuery = getDTRQuery();
//   const mainParams = buildParams(finalCondition);

//   const results = await sqlHelper.query(mainQuery, mainParams);

//   if (results.length > 0 || !isFacultyResident) {
//     return results;
//   }

//   const finalizedQuery = getDTRQuery();
//   const finalizedParams = buildParams(1);

//   const finalizedResults = await sqlHelper.query(
//     finalizedQuery,
//     finalizedParams,
//   );

//   if (finalizedResults.length > 0) {
//     //Already Finalized
//     // console.log("Already Finalized - Returning empty array\n");
//     return [];
//   }

//   const employeeParams = [];
//   let employeeQuery = `
//     SELECT CODE, FULLNAME, DEPT_DESC
//     FROM [UE database]..vw_Employees
//     WHERE 1=1
//   `;

//   if (employeeCode) {
//     employeeQuery += ` AND CODE = ?`;
//     employeeParams.push(employeeCode);
//   }

//   if (classCode) {
//     employeeQuery += ` AND EMP_CLASS_CODE = ?`;
//     employeeParams.push(classCode);
//   }

//   const employeeInfo = await sqlHelper.query(employeeQuery, employeeParams);

//   if (employeeInfo.length === 0) {
//     //No Employee Info
//     // console.log("No employee info found - Returning empty array\n");
//     return [];
//   }

//   return employeeInfo.map((emp) => ({
//     employeeCode: emp.cODE,
//     employeeName: emp.fULLNAME,
//     department: emp.dEPT_DESC,
//     payrollFrom: fromDate || null,
//     payrollTo: toDate || null,
//     absences: 0,
//     absencesHours: 0,
//     lates: 0,
//     undertime: 0,
//     oT35: 0,
//     oT100: 0,
//     oT130: 0,
//     oT135: 0,
//     diffAM: 0,
//     diffPM: 0,
//     refund: 0,
//     final: null,
//   }));
// };

// Add this new model function
const getLWOP = async (fromDate, toDate, employeeCode, classCode) => {
  const query = `
    SELECT 
      v.IDCode,
      SUM(v.daysOfLeave) totalAbsences,
      STRING_AGG('(LWOP ' + CONVERT(VARCHAR(10), v.DateLeavedFrom, 23) + ')', ', ') leaveDates
    FROM [UE database]..VacationSickLeave v
    RIGHT JOIN [UE database]..Employee e ON v.IDCode = e.EmployeeCode AND e.Class = ?
    WHERE v.LeaveType = 'LWOP' 
      AND (v.DateLeavedFrom >= ? AND v.DateLeavedTo <= ?) 
      AND v.IDCode = ?
    GROUP BY IDCode
  `;

  const params = [classCode, fromDate, toDate, employeeCode];
  const results = await sqlHelper.query(query, params);
  return results.length > 0 ? results[0] : null;
};

// Helper function to apply LWOP check to results
const applyLWOPCheck = async (records, fromDate, toDate, classCode) => {
  return await Promise.all(
    records.map(async (record) => {
      const lwopData = await getLWOP(
        fromDate,
        toDate,
        record.employeeCode,
        classCode,
      );

      if (lwopData && lwopData.totalAbsences) {
        // If totalAbsences > raw absences, use totalAbsences
        // If raw absences is 0 or less than totalAbsences, use totalAbsences
        const finalAbsences =
          record.absences === 0 || lwopData.totalAbsences > record.absences
            ? lwopData.totalAbsences
            : record.absences;

        // Build the new note by appending LWOP leave dates
        let updatedNote = record.note || "";

        if (lwopData.leaveDates) {
          if (updatedNote) {
            // If note already has content, append with appropriate separator
            // If note already starts with "A:", just add comma separator
            // Otherwise add semicolon and "A:"
            if (updatedNote.trim().startsWith("A:")) {
              updatedNote += `,${lwopData.leaveDates}`;
            } else {
              updatedNote += `;A:${lwopData.leaveDates}`;
            }
          } else {
            // If note is empty, start with "A:"
            updatedNote = `A:${lwopData.leaveDates}`;
          }
        }

        return {
          ...record,
          absences: finalAbsences,
          note: updatedNote,
        };
      }

      return record;
    }),
  );
};

const getSummaryReport = async (
  payrollPeriod,
  typeReport,
  fromDate,
  toDate,
  employeeCode,
  classCode,
) => {
  const isFacultyResident = typeReport === "facultyResident";
  const finalCondition = isFacultyResident ? 0 : 1;

  const employeeFilter =
    isFacultyResident && employeeCode ? "AND e.CODE = ?" : "";
  const classFilter = classCode ? "AND e.EMP_CLASS_CODE = ?" : "";

  const buildParams = (finalValue) => {
    const params = [finalValue, payrollPeriod];
    if (employeeFilter && employeeCode) params.push(employeeCode);
    if (classFilter && classCode) params.push(classCode);
    return params;
  };

  const getDTRQuery = () => `
    SELECT
      d.CODE employeeCode,
      e.FULLNAME employeeName,
      e.DEPT_DESC department,
      d.[FROM] payrollFrom,
      d.[TO] payrollTo,
      d.ABSENCES absences,
      d.ABSENCES_HR absencesHours,
      d.TARDY lates,
      d.UNDERTIME undertime,
      d.OVERTIME35 oT35,
      d.OVERTIME oT100,
      d.OVERTIME130 oT130,
      d.OVERTIME135 oT135,
      d.DIFFNP diffAM,
      d.DIFFPM diffPM,
      d.REFUND refund,
      d.FINAL final,
      d.note
    FROM [UE database]..jom_HRMS_DTRPosting d
    INNER JOIN [UE database]..vw_Employees e ON d.CODE = e.CODE
    WHERE d.FINAL = ?
      AND CONCAT(year, month, weekcode) = ?
      ${employeeFilter}
      ${classFilter}
    ORDER BY e.FULLNAME ASC;
  `;

  const mainQuery = getDTRQuery();
  const mainParams = buildParams(finalCondition);

  let results = await sqlHelper.query(mainQuery, mainParams);

  if (results.length > 0 || !isFacultyResident) {
    // Apply LWOP check for FA class employees when we have results
    if (classCode === "FA" && results.length > 0) {
      results = await applyLWOPCheck(results, fromDate, toDate, classCode);
    }

    return results;
  }

  const finalizedQuery = getDTRQuery();
  const finalizedParams = buildParams(1);

  const finalizedResults = await sqlHelper.query(
    finalizedQuery,
    finalizedParams,
  );

  if (finalizedResults.length > 0) {
    //Already Finalized
    // console.log("Already Finalized - Returning empty array\n");
    return [];
  }

  const employeeParams = [];
  let employeeQuery = `
    SELECT CODE, FULLNAME, DEPT_DESC 
    FROM [UE database]..vw_Employees 
    WHERE 1=1
  `;

  if (employeeCode) {
    employeeQuery += ` AND CODE = ?`;
    employeeParams.push(employeeCode);
  }

  if (classCode) {
    employeeQuery += ` AND EMP_CLASS_CODE = ?`;
    employeeParams.push(classCode);
  }

  const employeeInfo = await sqlHelper.query(employeeQuery, employeeParams);

  if (employeeInfo.length === 0) {
    //No Employee Info
    // console.log("No employee info found - Returning empty array\n");
    return [];
  }

  // Map employee info to default structure
  let defaultResults = employeeInfo.map((emp) => ({
    employeeCode: emp.cODE,
    employeeName: emp.fULLNAME,
    department: emp.dEPT_DESC,
    payrollFrom: fromDate || null,
    payrollTo: toDate || null,
    absences: 0,
    absencesHours: 0,
    lates: 0,
    undertime: 0,
    oT35: 0,
    oT100: 0,
    oT130: 0,
    oT135: 0,
    diffAM: 0,
    diffPM: 0,
    refund: 0,
    final: null,
  }));

  // Apply LWOP check for FA class employees on default results
  if (classCode === "FA") {
    defaultResults = await applyLWOPCheck(
      defaultResults,
      fromDate,
      toDate,
      classCode,
    );
  }

  return defaultResults;
};

const getOvertimeSummary = async (employeeCode, payrollPeriod) => {
  return await sqlHelper.query(
    `SELECT
      o.code,
      s.hours,
      s.type,
      s.payrollPeriod,
      o.DATE_OF_LEAVe overtimeDate
    FROM
      HR..OTSummary s
    JOIN
      [UE database]..Overtime o
      ON s.otID = o.ID
      and o.DELETED = 0
    WHERE
      o.CODE = ? and s.payrollPeriod = ?
    `,
    [employeeCode, payrollPeriod],
  );
};

const checkTimeData = async (period, code) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      HR..TimeData
    WHERE
      period = ?
      AND code = ?
    `,
    [period, code],
  );
};

const updateTimeData = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "HR..TimeData",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const insertTimeData = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "HR..TimeData",
    item,
    txn,
    creationDateTimeField,
  );
};

const insertTimeManualLog = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "HR..TimeAdjustment",
    item,
    txn,
    creationDateTimeField,
  );
};

module.exports = {
  getDTRDetails,
  noDtrEmployee,
  timeData,
  updateTimeDate,
  employeeClass,
  getEmployees,
  employeeOvertime,
  dtrPosting,
  finalizeTimeData,
  getComputedLate,
  getSummaryReport,
  getOvertimeSummary,
  checkTimeData,
  updateTimeData,
  insertTimeData,
  insertTimeManualLog,
};

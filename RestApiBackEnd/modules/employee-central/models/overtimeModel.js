const sqlHelper = require("../../../helpers/sql.js");

const createOvertime = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..NewOvertime",
    item,
    txn,
    creationDateTimeField,
  );
};

const getOvertimeDetails = async (employeeCode) => {
  // return await sqlHelper.query(
  //   `SELECT
  //     o.OtId overtimeId,
  //     o.EmployeeCode,
  //     o.DateFrom dateOfOvertime,
  //     o.FiledHours workHours,
  //     o.WorkLoad,
  //     o.DateCreated overtimeCreated,
  //     o.TimeFrom,
  //     o.TimeTo,
  //     o.ApprovedHours,
  //     CASE
  //       WHEN oo.[OT PAID] = 0 AND oo.[OT PAID DATE] IS NULL THEN 'For Payment'
  //       WHEN oo.[OT PAID] = 1 AND oo.[OT PAID DATE] IS NOT NULL THEN 'PAID'
  //       ELSE o.Status
  //     END AS Status,
  //     e.FULLNAME employeeName,
  //     e.DEPT_CODE departmentCode,
  //     e.DEPT_DESC departmentDesc,
  //     e.POS_DESC position,
  //     e.EMP_STATUS_DESC employeeStatus,
  //     o.ApprovedByLevel1,
  //     o.ApprovedByLevel1DateTime,
  //     o.ApprovedByLevel2,
  //     o.ApprovedByLevel2DateTime,
  //     o.CanceledBy,
  //     o.CanceledByDateTime,
  //     o.CanceledReason,
  //     o.CancelApprovedByLevel1,
  //     o.CancelApprovedByLevel1DateTime,
  //     o.CancelApprovedByLevel2,
  //     o.CancelApprovedByLevel2DateTime,
  //     o.RejectedBy,
  //     o.RejectedDateTime,
  //     o.RejectedReason,
  //     o.PayrollPeriod
  //   FROM
  //     [UE database]..NewOvertime o
  //   LEFT JOIN
  //     [UE database]..vw_Employees e ON o.EmployeeCode = e.CODE
  //   LEFT JOIN
  //     [UE database]..Overtime oo ON o.OldOtId = oo.ID
  //   WHERE
  //     o.EmployeeCode = ? AND Status IS NOT NULL
  //   ORDER BY
  //     o.OtId DESC
  //   `,
  //   [employeeCode],
  // );

  return await sqlHelper.query(
    `
    SELECT 
          o.OtId overtimeId, 
          o.EmployeeCode, 
          o.DateFrom dateOfOvertime, 
          o.FiledHours workHours, 
          o.WorkLoad, 
          o.DateCreated overtimeCreated, 
          o.TimeFrom, 
          o.TimeTo, 
          o.ApprovedHours,
          CASE
            WHEN oo.[OT PAID] = 0 AND oo.[OT PAID DATE] IS NULL THEN 'For Payment'
            WHEN oo.[OT PAID] = 1 AND oo.[OT PAID DATE] IS NOT NULL THEN 'PAID'
            ELSE o.Status
          END AS Status,
          e.FULLNAME employeeName, 
          e.DEPT_CODE departmentCode, 
          e.DEPT_DESC departmentDesc,
          e.POS_DESC position,
          e.EMP_STATUS_DESC employeeStatus,
          o.ApprovedByLevel1,
          o.ApprovedByLevel1DateTime, 
          o.ApprovedByLevel2, 
          o.ApprovedByLevel2DateTime, 
          o.CanceledBy, 
          o.CanceledByDateTime, 
          o.CanceledReason,
          o.CancelApprovedByLevel1, 
          o.CancelApprovedByLevel1DateTime, 
          o.CancelApprovedByLevel2, 
          o.CancelApprovedByLevel2DateTime,
          o.RejectedBy, 
          o.RejectedDateTime, 
          o.RejectedReason, 
          o.PayrollPeriod,
          td.[IN] AS SchedIn,
          td.[OUT] AS SchedOut,
          DATEADD(SECOND, DATEDIFF(SECOND, '00:00:00', COALESCE(sm.mFrom, sp.pFrom)), CAST(o.DateFrom AS DATETIME)) AS SchedFrom,
          DATEADD(SECOND, DATEDIFF(SECOND, '00:00:00', COALESCE(sm.mTo, sp.pTo)), CAST(o.DateTo AS DATETIME)) AS SchedTo
    FROM 
          [UE database]..NewOvertime o
    LEFT JOIN 
          [UE database]..vw_Employees e ON o.EmployeeCode = e.CODE
    LEFT JOIN 
          [UE database]..Overtime oo ON o.OldOtId = oo.ID
    OUTER APPLY (
          SELECT TOP 1 mFrom, mTo, DOFF1, DOFF2, NOTE
          FROM UERMATT..vw_SchedManual sm
          WHERE sm.EMPCODE = o.EmployeeCode
            AND sm.DATE BETWEEN o.DateFrom AND o.DateTo
        ) sm
        OUTER APPLY (
          SELECT TOP 1 pFrom, pTo, DOFF1, DOFF2
          FROM UERMATT..vw_SchedPermanent sp
          WHERE sp.EMPCODE = o.EmployeeCode
          ORDER BY pFrom
        ) sp
    LEFT JOIN HR..vw_TimedataPivot td 
          ON td.CODE = o.EmployeeCode 
          AND td.DATE = o.DateFrom
    WHERE
          o.EmployeeCode = ? AND o.Status IS NOT NULL
    ORDER BY
          o.dateCreated DESC
    `,
    [employeeCode],
  );
};

const getPendingOvertime = async (
  condition,
  parameters,
  employeeCode,
  userHasLevel1,
  userHasLevel2,
  cancelModule,
) => {
  let pendingOvertime = [];

  const level1Status = cancelModule ? "PendingCancel" : "Pending";
  const level2Status = cancelModule ? "PendingCancelLevel2" : "PendingLevel2";

  if (userHasLevel1) {
    pendingOvertime = await sqlHelper.query(
      `SELECT
        o.OtId AS overtimeId,
        o.EmployeeCode,
        o.DateFrom AS dateOfOvertime,
        o.FiledHours AS workHours,
        o.WorkLoad,
        o.DateCreated AS overtimeCreated,
        o.TimeFrom,
        o.TimeTo,
        o.Status,
        e.FULLNAME AS employeeName,
        e.DEPT_CODE AS departmentCode,
        e.DEPT_DESC AS deptDescription
      FROM
        [UE database]..NewOvertime o
      LEFT JOIN
        [UE database]..vw_Employees e ON o.EmployeeCode = e.CODE
      WHERE
        o.status = ?
        ${condition.length > 0 ? `AND (${condition.join(" OR ")})` : ""}
        AND o.EmployeeCode != ?
      ORDER BY o.OtId DESC`,
      [level1Status, ...parameters, employeeCode],
    );
  }

  if (userHasLevel2) {
    pendingOvertime = await sqlHelper.query(
      `SELECT
        o.OtId AS overtimeId,
        o.EmployeeCode,
        o.DateFrom AS dateOfOvertime,
        o.FiledHours AS workHours,
        o.WorkLoad,
        o.DateCreated AS overtimeCreated,
        o.TimeFrom,
        o.TimeTo,
        o.Status,
        e.FULLNAME AS employeeName,
        e.DEPT_CODE AS departmentCode,
        e.DEPT_DESC AS deptDescription
      FROM
        [UE database]..NewOvertime o
      LEFT JOIN
        [UE database]..vw_Employees e ON o.EmployeeCode = e.CODE
      WHERE
        o.status = ?
        ${condition.length > 0 ? `AND (${condition.join(" OR ")})` : ""}
        AND o.EmployeeCode != ?
      ORDER BY o.OtId DESC`,
      [level2Status, ...parameters, employeeCode],
    );
  }

  return pendingOvertime;
};

// const checkLevelStatus = async (overtimeId) => {
//   return await sqlHelper.query(
//     `SELECT DISTINCT e.DeptCode, e.EmployeeCode iDCode, a.lvl, o.approvedByLevel1, o.approvedByLevel2, o.status, e.Class, a.employeeCodes
//     FROM
//         [UE database]..NewOvertime o
//     LEFT JOIN
//         [UE database]..Employee e ON e.EmployeeCode = o.EmployeeCode
//     LEFT JOIN
//         [HR]..Approvers a ON a.deptCode = e.DeptCode
//     WHERE o.OtId = ?
//     AND (a.employeeCodes IS NULL OR CHARINDEX(CAST(o.EmployeeCode AS NVARCHAR(255)), a.employeeCodes) > 0)
//     AND a.deleted != 1
//     `,
//     [overtimeId],
//   );
// };

const checkLevelStatus = async (overtimeId, overtimeModule = false) => {
  const level1Field = overtimeModule
    ? "cancelApprovedByLevel1"
    : "approvedByLevel1";
  const level2Field = overtimeModule
    ? "cancelApprovedByLevel2"
    : "approvedByLevel2";

  const query = `
    SELECT DISTINCT 
        e.DeptCode, 
        e.EmployeeCode AS iDCode, 
        a.lvl, 
        o.${level1Field} AS approvedByLevel1,
        o.${level2Field} AS approvedByLevel2,
        o.status, 
        e.Class, 
        a.employeeCodes
    FROM [UE database]..NewOvertime o
    LEFT JOIN [UE database]..Employee e ON e.EmployeeCode = o.EmployeeCode
    LEFT JOIN [HR]..Approvers a ON a.deptCode = e.DeptCode
    WHERE o.OtId = ?
      AND (a.employeeCodes IS NULL OR CHARINDEX(CAST(o.EmployeeCode AS NVARCHAR(255)), a.employeeCodes) > 0)
      AND a.deleted != 1
  `;

  return await sqlHelper.query(query, [overtimeId]);
};

const getOvertimeIdDetails = async (overtimeId) => {
  return await sqlHelper.query(
    `SELECT *
    FROM [UE database]..NewOvertime
    WHERE OtId = ?
      `,
    [overtimeId],
  );
};

const updateOvertimeAction = async (
  item,
  condition,
  txn,
  updateDateTimeField,
) => {
  return await sqlHelper.update(
    "[UE database]..NewOvertime",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const userActionOvertime = async (sqlWhereStrArr, args) => {
  return await sqlHelper.query(
    `SELECT
        o.OtId AS overtimeId,
        o.EmployeeCode,
        o.DateFrom AS dateOfOvertime,
        o.FiledHours AS workHours,
        o.WorkLoad,
        o.DateCreated AS overtimeCreated,
        o.TimeFrom,
        o.TimeTo,
        o.Status,
        e.FULLNAME AS employeeName,
        e.DEPT_CODE AS departmentCode,
        e.DEPT_DESC AS deptDescription
      FROM
        [UE database]..NewOvertime o
      LEFT JOIN
        [UE database]..vw_Employees e ON o.EmployeeCode = e.CODE
      ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""}
      ORDER BY o.OtId DESC`,
    args,
  );
};

const pendingHrd = async () => {
  return await sqlHelper.query(
    `SELECT 
      o.OtId,
      o.EmployeeCode,
      o.DateFrom AS dateOfOvertime,
      o.TimeFrom,
      o.TimeTo,
      o.FiledHours,
      o.ApprovedHours,
      o.WorkLoad,
      o.Status,
      o.DateCreated AS overtimeCreated,
      e.FULLNAME AS EmployeeName,
      e.DEPT_CODE AS DepartmentCode,
      e.DEPT_DESC AS DeptDescription,
      COALESCE(sm.mFrom, sp.pFrom) AS SchedStartTime,
      COALESCE(sm.mTo, sp.pTo) AS SchedEndTime,
      DATEADD(SECOND, DATEDIFF(SECOND, '00:00:00', COALESCE(sm.mFrom, sp.pFrom)), CAST(o.DateFrom AS DATETIME)) AS SchedFrom,
      DATEADD(SECOND, DATEDIFF(SECOND, '00:00:00', COALESCE(sm.mTo, sp.pTo)), CAST(o.DateTo AS DATETIME)) AS SchedTo,
      td.[IN] AS SchedIn,
      td.[OUT] AS SchedOut,
      smartNote.ResolvedNote AS Note,
      hc.TYPE AS HolidayType,
      CASE 
        WHEN smartNote.ResolvedNote = 'DAY OFF' AND hc.TYPE IN ('SPECIAL NON-WORKING HOLIDAY', 'SPECIAL WORKING HOLIDAY', 'REGULAR HOLIDAY') THEN 'OT 130'
        WHEN smartNote.ResolvedNote = 'REST DAY' AND hc.TYPE IN ('SPECIAL NON-WORKING HOLIDAY', 'SPECIAL WORKING HOLIDAY', 'REGULAR HOLIDAY') THEN 'OT 135'
        WHEN smartNote.ResolvedNote = 'DAY OFF' AND hc.TYPE IS NULL THEN 'OT 130'
        WHEN smartNote.ResolvedNote = 'REST DAY' AND hc.TYPE IS NULL THEN 'OT 135'
        WHEN smartNote.ResolvedNote = hc.TYPE THEN 'OT 130'
        WHEN smartNote.ResolvedNote IS NULL THEN 'OT 130'
        ELSE NULL
      END AS OTType
    FROM [UE database]..NewOvertime o
    LEFT JOIN [UE database]..vw_Employees e ON o.EmployeeCode = e.CODE
    OUTER APPLY (
      SELECT TOP 1 mFrom, mTo, DOFF1, DOFF2, NOTE
      FROM UERMATT..vw_SchedManual sm
      WHERE sm.EMPCODE = o.EmployeeCode
        AND sm.DATE BETWEEN o.DateFrom AND o.DateTo
    ) sm
    OUTER APPLY (
      SELECT TOP 1 pFrom, pTo, DOFF1, DOFF2
      FROM UERMATT..vw_SchedPermanent sp
      WHERE sp.EMPCODE = o.EmployeeCode
      ORDER BY pFrom
    ) sp
    CROSS APPLY (
      SELECT 
        CASE 
          WHEN sm.NOTE IS NOT NULL THEN sm.NOTE
          WHEN DATEPART(WEEKDAY, o.DateFrom) IN (COALESCE(sp.DOFF1, -1), COALESCE(sp.DOFF2, -1)) THEN 'DAY OFF'
          ELSE NULL
        END AS ResolvedNote
    ) smartNote
    LEFT JOIN [UE database]..jom_HRMS_Calendar hc 
      ON hc.DATE = o.DateFrom AND hc.DELETED != 1
    LEFT JOIN HR..vw_TimedataPivot td 
      ON td.CODE = o.EmployeeCode 
      AND td.DATE = o.DateFrom
    WHERE o.Status = 'PendingHrd'  
    `,
  );
};

const insertIntoOldOvertime = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..Overtime",
    item,
    txn,
    creationDateTimeField,
  );
};

const insertIntoAllowedOvertime = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMATT..AllowedOvertime",
    item,
    txn,
    creationDateTimeField,
  );
};

const getFilter = async (employeeCode) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      HR..Approvers
    WHERE
      Code = ?
    `,
    [employeeCode],
  );
};

const insertIntoSummary = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "HR..OTSummary",
    item,
    txn,
    creationDateTimeField,
  );
};

const getPendingAccomplishment = async (
  condition,
  parameters,
  employeeCode,
) => {
  return await sqlHelper.query(
    `SELECT
        o.OtId AS overtimeId,
        o.EmployeeCode,
        o.DateFrom AS dateOfOvertime,
        o.FiledHours AS workHours,
        o.WorkLoad,
        o.DateCreated AS overtimeCreated,
        o.TimeFrom,
        o.TimeTo,
        o.Status,
        e.FULLNAME AS employeeName,
        e.DEPT_CODE AS departmentCode,
        e.DEPT_DESC AS deptDescription
      FROM
        [UE database]..NewOvertime o
      LEFT JOIN
        [UE database]..vw_Employees e ON o.EmployeeCode = e.CODE
      WHERE
        o.status = 'PendingAccomplishApproval'
        ${condition.length > 0 ? `AND (${condition.join(" OR ")})` : ""}
        AND o.EmployeeCode != ?
      ORDER BY o.OtId DESC`,
    [...parameters, employeeCode],
  );
};

const unpaidOvertime = async (fromDate, toDate, classCode) => {
  const query = `
    WITH smartNoteResolved AS (
        SELECT 
            ot.otId AS OvertimeId,
            ot.code AS EmployeeCode,
            ot.name AS EmployeeName,
            ot.Position,
            ot.Department,
            ot.deptCode AS DepartmentCode,
            ot.otFrom AS OvertimeFrom,
            ot.otTo AS OvertimeTo,
            ot.transmittalHours AS OvertimeHours,
            ot.statusDescription AS Status,
            ot.PayrollPeriod,
            COALESCE(
                vm.NOTE,
                CASE 
                    WHEN sp.DOFF1 = DATEPART(WEEKDAY, CONVERT(DATE, ot.otTo)) 
                      OR sp.DOFF2 = DATEPART(WEEKDAY, CONVERT(DATE, ot.otTo)) 
                    THEN 'DAY OFF' 
                    ELSE NULL 
                END
            ) AS ResolvedNote, 
            cal.TYPE AS CalendarType
        FROM hr..vw_OTStatus ot
        OUTER APPLY (
            SELECT TOP 1 *
            FROM UERMATT..vw_SchedManual vm
            WHERE vm.EMPCODE = ot.code
              AND vm.DATE = CONVERT(DATE, ot.otTo)
        ) vm
        OUTER APPLY (
            SELECT TOP 1 *
            FROM UERMATT..vw_SchedPermanent sp
            WHERE sp.EMPCODE = ot.code
        ) sp
        OUTER APPLY (
            SELECT TOP 1 c.NOTE, c.TYPE
            FROM [UE database]..jom_HRMS_Calendar c
            WHERE c.DATE = CONVERT(DATE, ot.otTo)
        ) cal
      WHERE ot.statusCode IN (3,4,5,6,9)
          AND (CONVERT(DATE, otFrom) >= ? AND CONVERT(DATE, otTo) <= ?)
    ),
    otComputed AS (
        SELECT *,
            CASE 
                WHEN ResolvedNote = 'DAY OFF' 
                    AND CalendarType IN (
                        'SPECIAL NON-WORKING HOLIDAY', 
                        'SPECIAL WORKING HOLIDAY', 
                        'REGULAR HOLIDAY') THEN 'OT 130'
                WHEN ResolvedNote = 'REST DAY' 
                    AND CalendarType IN (
                        'SPECIAL NON-WORKING HOLIDAY', 
                        'SPECIAL WORKING HOLIDAY', 
                        'REGULAR HOLIDAY') THEN 'OT 135'
                WHEN ResolvedNote = 'DAY OFF' 
                    AND CalendarType IS NULL THEN 'OT 130'
                WHEN ResolvedNote = 'REST DAY' 
                    AND CalendarType IS NULL THEN 'OT 135'
                WHEN ResolvedNote = CalendarType THEN 'OT 130'
                WHEN ResolvedNote IS NULL THEN 'OT 130'
                ELSE NULL
            END AS OTType
        FROM smartNoteResolved
    ),
    holidayDates AS (
        SELECT 
            DATE,
            NOTE,
            TYPE,
            CASE 
                WHEN TYPE LIKE '%SPECIAL%' THEN 'OT 30'
                WHEN TYPE = 'REGULAR HOLIDAY' THEN 'OT 100'
                ELSE NULL
            END AS HolidayOTType
        FROM [UE database]..jom_HRMS_Calendar
        WHERE DATE >= ? AND DATE <= ?
          AND DELETED = 0
          AND TYPE IN ('SPECIAL NON-WORKING HOLIDAY', 'SPECIAL WORKING HOLIDAY', 'REGULAR HOLIDAY')
    ),
    allEmployees AS (
        SELECT DISTINCT 
            EmployeeCode,
            EmployeeName,
            Position,
            Department,
            DepartmentCode
        FROM smartNoteResolved
    ),
    holidayPay AS (
        SELECT 
            ae.EmployeeCode,
            ae.EmployeeName,
            ae.Position,
            ae.Department,
            ae.DepartmentCode,
            hd.DATE AS OvertimeFrom,
            hd.DATE AS OvertimeTo,
            8.0 AS OvertimeHours,
            'Holiday Pay' AS Status,
            NULL AS PayrollPeriod,
            hd.NOTE AS ResolvedNote,
            hd.TYPE AS CalendarType,
            hd.HolidayOTType AS OTType
        FROM allEmployees ae
        CROSS JOIN holidayDates hd
        WHERE NOT EXISTS (
            SELECT 1 
            FROM otComputed ot 
            WHERE ot.EmployeeCode = ae.EmployeeCode 
              AND CONVERT(DATE, ot.OvertimeFrom) <= hd.DATE 
              AND CONVERT(DATE, ot.OvertimeTo) >= hd.DATE
        )
    ),
    allRecords AS (
        SELECT 
            EmployeeCode,
            EmployeeName,
            Position,
            Department,
            DepartmentCode,
            OvertimeFrom,
            OvertimeTo,
            OvertimeHours,
            OTType,
            'Overtime' AS RecordType
        FROM otComputed
        
        UNION ALL
        
        SELECT 
            EmployeeCode,
            EmployeeName,
            Position,
            Department,
            DepartmentCode,
            OvertimeFrom,
            OvertimeTo,
            OvertimeHours,
            OTType,
            'Holiday Pay' AS RecordType
        FROM holidayPay
    )
    SELECT 
        ar.EmployeeCode,
        ar.EmployeeName,
        e.EMP_CLASS_DESC AS EmployeeClass,
        ar.Position,
        ar.Department,
        ar.DepartmentCode,
        ROUND(CAST(DATEDIFF(MONTH, e.HIRED, GETDATE()) AS float) / 12.0, 2) AS ServiceLength,
        STRING_AGG(
            '(' + CONVERT(VARCHAR(10), CONVERT(DATE, ar.OvertimeFrom), 23) + ' - ' + ar.OTType + ')', 
            ', '
        ) AS Dates,
        SUM(CASE WHEN ar.OTType = 'OT 130' THEN ar.OvertimeHours ELSE 0 END) AS [OT 130],
        SUM(CASE WHEN ar.OTType = 'OT 135' THEN ar.OvertimeHours ELSE 0 END) AS [OT 135],
        SUM(CASE WHEN ar.OTType = 'OT 100' THEN ar.OvertimeHours ELSE 0 END) AS [OT 100],
        SUM(CASE WHEN ar.OTType = 'OT 30' THEN ar.OvertimeHours ELSE 0 END) AS [OT 30],
        SUM(CASE WHEN ar.OTType IN ('OT 130', 'OT 135', 'OT 100', 'OT 30') THEN ar.OvertimeHours ELSE 0 END) AS TotalOvertime
    FROM allRecords ar
    LEFT JOIN [UE database]..vw_Employees e ON ar.EmployeeCode = e.CODE
    WHERE ar.OTType IS NOT NULL
      ${classCode ? "AND e.EMP_CLASS_CODE = ?" : ""}
    GROUP BY 
        ar.EmployeeCode,
        ar.EmployeeName,
        e.EMP_CLASS_DESC,
        ar.Position,
        ar.Department,
        ar.DepartmentCode,
        e.HIRED
    ORDER BY ar.EmployeeName;
  `;

  const params = classCode
    ? [fromDate, toDate, fromDate, toDate, classCode]
    : [fromDate, toDate, fromDate, toDate];

  return await sqlHelper.query(query, params);
};

module.exports = {
  createOvertime,
  getPendingOvertime,
  getOvertimeDetails,
  checkLevelStatus,
  getOvertimeIdDetails,
  updateOvertimeAction,
  userActionOvertime,
  pendingHrd,
  insertIntoOldOvertime,
  getFilter,
  insertIntoSummary,
  getPendingAccomplishment,
  insertIntoAllowedOvertime,
  unpaidOvertime,
};

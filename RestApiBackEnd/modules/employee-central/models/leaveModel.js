const sqlHelper = require("../../../helpers/sql.js");

const calculateTotalLeaveValue = async (
  employeeCode,
  leavetype,
  // sqlWhereStrArr3,
  // args3,
  // sqlWhereStrArr2,
  // args2,
) => {
  // const sqlWhereStrArr3 = ["Code = ?", "l.leaveType = ?"];
  // const args3 = [employeeID, LeaveType];
  // const sqlWhereStrArr2 = ["IDCode = ?", "LeaveType = ?", "status IN (?, ?)"];
  // const args2 = [employeeID, LeaveType, "Pending", "PendingLevel2"];

  // Query to get remaining days from [UE database]..leaveledger
  const leaveLedgerQuery = await sqlHelper.query(
    `SELECT
            l.leaveType,
            SUM(l.debit - l.credit) AS remaining
        FROM
            [HR]..vw_LeaveCreditsV2 l
        WHERE l.Code = ? and l.leaveType = ?
        GROUP BY 
          l.leaveType
          ORDER BY l.leaveType;
        `,
    [employeeCode, leavetype],
  );

  // const leaveLedgerQuery = `
  //     SELECT
  //         l.LeaveType,
  //         Remaining = SUM(l.debit - l.credit)
  //     FROM
  //         [UE database]..LeaveLedger l
  //     WHERE
  //         l.Code = @EmployeeCode
  //         AND l.LeaveType = @LeaveType
  //         AND (l.Debit > 0 OR l.Credit > 0)
  //         AND (l.LeaveType <> 'SL' OR YEAR(l.YearAttributed) = YEAR(GETDATE()))
  //     GROUP BY
  //         l.code,
  //         l.LeaveType
  //     ORDER BY
  //         l.Code;
  // `;

  // Query to get remaining days from HR..LeaveInfo
  const leaveInfoQuery = await sqlHelper.query(
    `SELECT
            SUM(daysOfLeave) AS Remaining
        FROM
            [UE database]..VacationSickLeave
        WHERE IdCode = ? and LeaveType = ? and status IN (?, ?)
        `,
    [employeeCode, leavetype, "Pending", "PendingLevel2"],
  );

  // const leaveInfoQuery = `
  //     SELECT
  //         SUM(Days) AS Remaining
  //     FROM
  //         HR..LeaveInfo
  //     WHERE
  //         Code = @EmployeeCode
  //         AND LeaveType = @LeaveType
  //         AND STATUS = 'PENDING'
  // `;

  // Execute the queries
  // const leaveLedgerResult = await conn
  //   .request()
  //   .input('EmployeeCode', mssql.Int, EmployeeCode)
  //   .input('LeaveType', mssql.NVarChar, LeaveType)
  //   .query(leaveLedgerQuery);

  // const leaveInfoResult = await conn
  //   .request()
  //   .input('EmployeeCode', mssql.Int, EmployeeCode)
  //   .input('LeaveType', mssql.NVarChar, LeaveType)
  // .query(leaveInfoQuery);
  const leaveLedge = leaveLedgerQuery[0].remaining;
  const leaveInfo = leaveInfoQuery[0].remaining;

  return leaveLedge - leaveInfo;

  // const leaveLedge = leaveLedgerResult.recordset[0]?.Remaining || 0;
  // const leaveInfo = leaveInfoResult.recordset[0]?.Remaining || 0;

  // if (leaveLedge === undefined && leaveInfo === undefined) {
  //   return { status: 404, message: 'No Leave Details Found for this User' };
  //   } else {
  //   return leaveLedge - leaveInfo;
  // }
};

const calculateTotalLeaveValueInEdit = async (
  sqlWhereStrArr,
  args,
  sqlWhereStrArr2,
  args2,
  sqlWhereStrArr3,
  args3,
) => {
  const leaveIDInforQuery = await sqlHelper.query(
    `SELECT
            LeaveType,
            SUM(daysOfLeave) AS Remaining
        FROM
            [UE database]..VacationSickLeave
        ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""}
        GROUP BY LeaveType
        `,
    args,
  );

  // if (leaveIDInforQuery[0].leaveType === 'VL' ||
  //     leaveIDInforQuery[0].leaveType === 'SL' ||
  //     leaveIDInforQuery[0].leaveType === 'EL' ||
  //     leaveIDInforQuery[0].leaveType === 'BL' &&
  //     leaveIDInforQuery[0].leaveType === 'PARENTL' &&
  //     leaveIDInforQuery[0].leaveType === 'MC' &&
  //     leaveIDInforQuery[0].leaveType === 'ML' &&
  //     leaveIDInforQuery[0].leaveType === 'OL' &&
  //     leaveIDInforQuery[0].leaveType === 'UL') {
  //   leaveIDInforQuery[0].remaining = 0;
  // }

  // const leaveIDInforQuery = `
  // SELECT
  //     SUM(Days) AS Remaining
  // FROM
  //     HR..LeaveInfo
  // WHERE
  //     Code = @EmployeeCode
  //     AND LeaveID = @LeaveID
  //     AND LeaveType = @LeaveType
  //     AND STATUS = 'PENDING'
  // `;

  let leaveInfoQuery = await sqlHelper.query(
    `SELECT
            leaveType,
            SUM(daysOfLeave) AS Remaining
        FROM
            [UE database]..VacationSickLeave
        ${sqlWhereStrArr2.length > 0 ? `WHERE ${sqlWhereStrArr2.join(" AND ")}` : ""}
        GROUP BY
            leaveType
        ORDER BY
            leaveType
        `,
    args2,
  );

  // const leaveInfoQuery = `
  //     SELECT
  //         SUM(Days) AS Remaining
  //     FROM
  //         HR..LeaveInfo
  //     WHERE
  //         Code = @EmployeeCode
  //         AND LeaveType = @LeaveType
  //         AND STATUS = 'PENDING'
  // `;

  // Query to get remaining days from [UE database]..leaveledger
  const leaveLedgerQuery = await sqlHelper.query(
    `SELECT
            l.leaveType,
            SUM(l.debit - l.credit) AS Remaining
        FROM
            [HR]..vw_LeaveCreditsV2 l
        ${sqlWhereStrArr3.length > 0 ? `WHERE ${sqlWhereStrArr3.join(" AND ")}` : ""}
        GROUP BY 
          l.leaveType
        ORDER BY l.leaveType;
        `,
    args3,
  );

  if (leaveInfoQuery === null || leaveInfoQuery.length === 0) {
    leaveInfoQuery = [{ leaveType: "TEST", remaining: 0 }];
  }

  if (leaveIDInforQuery[0].leaveType !== leaveInfoQuery[0].leaveType) {
    leaveIDInforQuery[0].remaining = 0;
  }

  const leaveLedge = leaveLedgerQuery[0].remaining;
  const leaveInfo = leaveInfoQuery[0].remaining;
  const leaveIdInfo = leaveIDInforQuery[0].remaining;

  return leaveLedge - leaveInfo + leaveIdInfo;

  // console.log(total)
  // const leaveLedgerQuery = `
  // SELECT
  //     l.leaveType,
  //     Remaining = SUM(l.debit - l.credit)
  // FROM
  //     [UE database]..LeaveLedger l
  // WHERE
  //     l.code = @EmployeeCode
  //     AND l.leaveType = @LeaveType
  //     AND (l.Debit > 0 OR l.Credit > 0)
  //     AND (l.LeaveType <> 'SL' OR YEAR(l.YearAttributed) = YEAR(GETDATE()))
  // GROUP BY
  //     l.code,
  //     l.leaveType
  // ORDER BY
  //     l.Code;
  // `;

  // const leaveIDInfoResult = await conn
  //   .request()
  //   .input('EmployeeCode', mssql.Int, EmployeeCode)
  //   .input('LeaveID', mssql.Int, LeaveID)
  //   .input('LeaveType', mssql.NVarChar, LeaveType)
  //   .query(leaveIDInforQuery);

  // const leaveInfoResult = await conn
  //   .request()
  //   .input('EmployeeCode', mssql.Int, EmployeeCode)
  //   .input('LeaveType', mssql.NVarChar, LeaveType)
  //   .query(leaveInfoQuery);

  // const leaveLedgerResult = await conn
  //   .request()
  //   .input('EmployeeCode', mssql.Int, EmployeeCode)
  //   .input('LeaveType', mssql.NVarChar, LeaveType)
  //   .query(leaveLedgerQuery);

  // const leaveIDInfo = leaveIDInfoResult.recordset[0]?.Remaining || 0;
  // const leaveInfo = leaveInfoResult.recordset[0]?.Remaining || 0;
  // const leaveLedge = leaveLedgerResult.recordset[0]?.Remaining || 0;

  // if (leaveIDInfo === undefined && leaveInfo === undefined && leaveLedge === undefined) {
  //   return { status: 404, message: 'No Leave Details Found for this User' };
  // } else {
  //   const totalResult = leaveLedge - leaveInfo + leaveIDInfo;
  //   return totalResult;
  // }
};

const createLeaveRequest = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..VacationSickLeave",
    item,
    txn,
    creationDateTimeField,
  );

  // const formattedTimeFrom = TimeFrom.substring(0, 5);
  // const formattedTimeTo = TimeTo.substring(0, 5);

  // const hourFrom = parseInt(formattedTimeFrom.split(':')[0]);
  // const hourTo = parseInt(formattedTimeTo.split(':')[0]);
  // const amOrPmFrom = hourFrom >= 12 ? ' PM' : ' AM';
  // const amOrPmTo = hourTo >= 12 ? ' PM' : ' AM';
  // const formattedTimeFromFinal = (hourFrom % 12 || 12) + formattedTimeFrom.slice(2) + amOrPmFrom;
  // const formattedTimeToFinal = (hourTo % 12 || 12) + formattedTimeTo.slice(2) + amOrPmTo;

  // const currentYear = new Date().getFullYear();
  // const remarks = `FILED-${LeaveType}-${currentYear}`;

  // return await sqlHelper.query(
  //   `DECLARE @LeaveID NVARCHAR(10)

  //       INSERT INTO HR..LeaveInfo (LeaveID, Code, LeaveType, Days, TransDate, YearEffectivity, YearAttributed, ItemType, TimeFrom, TimeTo, DateFrom, DateTo, Reason, Remarks, Status)
  //       OUTPUT INSERTED.LeaveID
  //       VALUES (@LeaveID, ?, ?, ?, GETDATE(), YEAR(GETDATE()), YEAR(GETDATE()), 'FILED', ?, ?, ?, ?, ?, ?, 'Pending')
  //       `,
  //       [EmployeeCode, LeaveType, Days, formattedTimeFromFinal, formattedTimeToFinal, DateFrom, DateTo, Reason, remarks],
  //       txn
  //   );
};

const getLeaveDetails = async (employeeId) => {
  // try {
  // return await sqlHelper.query(
  //   `
  //   SELECT
  //       vsl.*,
  //       e.LastName,
  //       e.FirstName,
  //       e.MiddleInitial,
  //       e.DeptCode
  //   FROM
  //       [UE database]..VacationSickLeave AS vsl
  //   JOIN
  //       [UE database]..Employee AS e ON vsl.IDCode = e.EmployeeCode
  //       ${sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND ") : "" };`,
  //       args,
  // )

  return await sqlHelper.query(
    `SELECT 
    vsl.IDCode,
    vsl.TIME_FROM,
    vsl.TIME_TO,
    vsl.DateLeavedFrom,
    vsl.DateLeavedTo,
    vsl.TransDate,
    vsl.daysOfLeave,
    vsl.LeaveType,
    vsl.leaveId,
    vsl.status,
    vsl.reasonForLeave,
    vsl.DELETED,
    e.LastName,
    e.FirstName,
    e.MiddleInitial,
    e.DeptCode,
    vsl.approvedByLevel1,
    vsl.approvedByLevel2,
    vsl.cancelledStatusOrig,
    vsl.cancelledByLevel2,
    vsl.cancelledByLevel1,
    vsl.reasonForRejection,
    vsl.reasonForCancel
    FROM 
        [UE database]..VacationSickLeave AS vsl
    JOIN 
        [UE database]..Employee AS e ON vsl.IDCode = e.EmployeeCode
    WHERE 
        vsl.IDCode = ?
        AND YEAR(TransDate) BETWEEN (YEAR(GETDATE()) - 3) AND YEAR(GETDATE())
        AND vsl.TIME_FROM IS NOT NULL
        AND vsl.TIME_TO IS NOT NULL
        AND vsl.DateLeavedFrom IS NOT NULL
        AND vsl.DateLeavedTo IS NOT NULL
        AND vsl.status IS NOT NULL

    UNION ALL

    SELECT 
        'TempLeave' AS IDCode,
        tl.TIME_FROM AS TIME_FROM,
        tl.TIME_TO AS TIME_TO,
        tl.DATE_FROM AS DateLeavedFrom,
        tl.DATE_TO AS DateLeavedTo,
        tl.DateCreated AS TransDate,
        tl.LEAVE_DAYS AS daysOfLeave,
        tl.LEAVE_TYPE AS leaveType,
        tl.id AS leaveId,
        CASE 
            WHEN UPPER(tl.[LEAVE STATUS]) = 'PENDING' THEN 'Pending'
        WHEN UPPER(tl.[LEAVE STATUS]) = 'ACCEPTED' THEN 'Approved'
            ELSE tl.[LEAVE STATUS]
        END AS status,
        tl.REASON AS reasonForLeave,
        tl.DELETED AS DELETED,
        e.LastName AS LastName,
        e.FirstName AS FirstName,
        e.MiddleInitial AS MiddleInitial,
        e.DeptCode AS DeptCode,
        NULL AS approvedByLevel1,
        NULL AS approvedByLevel2,
        NULL AS cancelledStatusOrig,
        NULL AS cancelledByLevel2,
        NULL AS cancelledByLevel1,
        NULL AS reasonForRejection,
        NULL AS reasonForCancel
    FROM 
        [UERMATT]..[TempLeave] tl
    JOIN 
        [UE database]..Employee AS e ON tl.CODE = e.EmployeeCode
    WHERE 
        CODE = ?
        AND YEAR(DateCreated) BETWEEN (YEAR(GETDATE()) - 3) AND YEAR(GETDATE())
        AND tl.[LEAVE STATUS] IS NOT NULL
        AND [LEAVE STATUS] NOT IN ('CANCELLED', 'DELETED', 'PENDING')
    ORDER BY TransDate DESC
        `,
    [employeeId, employeeId],
  );

  // if (!pendingDetails || pendingDetails.length === 0) {
  //   return { pendingDetails: [], approversDetails: [] };
  // }

  // const pendingDeptCode = pendingDetails[0].deptCode
  // const approversDetails = await sqlHelper.query(
  //   `SELECT
  //       a.code,
  //       a.lvl,
  //       a.deptCode,
  //       e.FirstName,
  //       e.LastName,
  //       e.MiddleInitial
  //   FROM
  //       HR..Approvers AS a
  //   JOIN
  //       [UE database]..Employee AS e ON a.code = e.EmployeeCode
  //   WHERE
  //       a.deptCode = ?
  //   GROUP BY
  //       a.code, a.lvl, a.deptCode, e.FirstName, e.LastName, e.MiddleInitial
  //   ORDER BY
  //       a.lvl;
  //   `,
  //   [pendingDeptCode]
  // )

  // return { pendingDetails, approversDetails };
  //   const getLeaveQuery =
  //   `
  //   SELECT
  //       LeaveInfo.*,
  //       Employee.LastName,
  //       Employee.FirstName,
  //       Employee.MiddleInitial
  //   FROM
  //       HR..LeaveInfo
  //   JOIN
  //       [UE database]..Employee ON CONVERT(varchar(5), LeaveInfo.Code) = Employee.EmployeeCode
  //   WHERE
  //       LeaveInfo.Code = @EmployeeCode
  //       AND LeaveInfo.TimeFrom IS NOT NULL
  //       AND LeaveInfo.TimeTo IS NOT NULL
  //       AND LeaveInfo.DateFrom IS NOT NULL
  //       AND LeaveInfo.DateTo IS NOT NULL
  //   `;

  //   const result = await conn
  //     .request()
  //     .input('EmployeeCode', mssql.Int, EmployeeCode)
  //     .query(getLeaveQuery);

  //   if (result.recordset.length === 0) {
  //     return { status: 404, message: 'No Leave Details Found for this User' };
  //   }

  //   return result.recordset;
  // } catch (error) {
  //   return { status: 500, message: 'Failed to retrieve leave details' };
  // }
};

// getLeaveBalance: async (EmployeeCode) => {
//   try {
//     const pool = await poolPromise;

//     const leaveBalanceQuery = `
//       SELECT YEAR(YearAttributed) AS Year, LeaveType, SUM(Debit) AS Balance
//       FROM [UE database]..LeaveLedger
//       WHERE Code = @EmployeeCode AND YEAR(YearAttributed) IS NOT NULL
//       GROUP BY YEAR(YearAttributed), LeaveType
//     `;

//     const result = await pool
//       .request()
//       .input('EmployeeCode', mssql.Int, EmployeeCode)
//       .query(leaveBalanceQuery);

//     if (result.recordset.length === 0) {
//       return { status: 404, message: 'No Leave Balance Found for this User' };
//     }

//     return result.recordset;
//   } catch (error) {
//     console.error(error);
//     return { status: 500, message: 'Failed to retrieve leave balance' };
//   }
// },

const getLeaveBalance = async (sqlWhereStrArr, args) => {
  // return await sqlHelper.query(
  //   `
  //   SELECT
  //     l.code,
  //     YearAttributed AS Year,
  //     l.leaveType,
  //     Remaining = ROUND(SUM(l.Debit - l.Credit), 2)
  //   FROM [UE database]..LeaveLedger l
  //   ${sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND ") + " AND (l.Debit > 0 OR l.Credit > 0) AND ((l.leaveType = 'SL' AND YEAR(l.YearAttributed) = YEAR(GETDATE())) OR l.leaveType <> 'SL')" : "" }
  //   GROUP BY
  //     l.code,
  //     YEAR(l.YearAttributed),
  //     l.leaveType
  //   ORDER BY l.code, Year;
  //   `,
  //   args
  // );

  return await sqlHelper.query(
    `SELECT leaveType, Year, remaining
    FROM (
        SELECT leaveType, yearAttributed AS Year, SUM(debit - credit) AS remaining
        FROM [HR].[dbo].[vw_LeaveCreditsV2]
        ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""}
        GROUP BY leaveType, yearAttributed
    ) AS subquery
    WHERE remaining > 0
    ORDER BY leaveType, Year;
    `,
    args,
  );

  // WITH CalculatedRemaining AS (
  //     SELECT leaveType, yearAttributed AS Year, SUM(debit - credit) AS remaining
  //     FROM [HR].[dbo].[vw_LeaveCreditsV2]
  //     WHERE code = '6681'
  //     GROUP BY leaveType, yearAttributed
  // )
  // SELECT leaveType, Year, remaining
  // FROM CalculatedRemaining
  // WHERE remaining >= 0
  // ORDER BY leaveType, Year;

  // try {

  //     const leaveBalanceQuery = `
  //         SELECT
  //             l.code,
  //             YEAR(l.YearAttributed) AS Year,
  //             l.leaveType,
  //             Remaining = ROUND(SUM(l.Debit - l.Credit), 2)
  //         FROM [UE database]..LeaveLedger l
  //         WHERE
  //             l.Code = @EmployeeCode
  //             AND (l.Debit > 0 OR l.Credit > 0)
  //             AND ((l.leaveType = 'SL' AND YEAR(l.YearAttributed) = YEAR(GETDATE())) OR l.leaveType <> 'SL')
  //         GROUP BY
  //             l.code,
  //             YEAR(l.YearAttributed),
  //             l.leaveType
  //         ORDER BY l.code, Year;
  //     `;

  //     const result = await conn
  //         .request()
  //         .input('EmployeeCode', mssql.Int, EmployeeCode)
  //         .query(leaveBalanceQuery);

  //     if (result.recordset.length === 0) {
  //         return { status: 404, message: 'No Leave Balance Found for this User' };
  //     }

  //     // Format the Remaining value
  //     const formattedResult = result.recordset.map(item => {
  //         const formattedRemaining = item.Remaining % 1 === 0 ? parseInt(item.Remaining) : item.Remaining.toFixed(2);
  //         return {
  //             ...item,
  //             Remaining: formattedRemaining
  //         };
  //     });

  //     return formattedResult;
  // } catch (error) {
  //     console.error(error);
  //     return { status: 500, message: 'Failed to retrieve leave balance' };
  // }
};

const getUserLeaveBalanceDetails = async (employeeId, leaveType) => {
  // try {
  return await sqlHelper.query(
    `SELECT 
        subquery.Code, 
        subquery.leaveType, 
        subquery.Year, 
        subquery.remaining,
      e.Position,
      e.EmployeeCode,
      e.Class,
        es.Description AS EmployeeStatus, 
        d.Description AS Department, 
        DM.DESCRIPTION AS deptDescSecond
    FROM (
        SELECT 
            Code, 
            leaveType, 
            yearAttributed AS Year, 
            SUM(debit - credit) AS remaining
        FROM 
            [HR].[dbo].[vw_LeaveCreditsV2]
        WHERE Code = ? AND LeaveType = ?
        GROUP BY 
            Code, 
            leaveType, 
            yearAttributed
    ) AS subquery
    JOIN 
        [UE database]..Employee e ON subquery.Code = e.EmployeeCode
    JOIN 
        [UE database]..EmployeeStatus es ON e.EmployeeStatus = es.code
    LEFT JOIN 
        [UE database]..Department d ON e.DeptCode = d.DeptCode
    LEFT JOIN 
        [UERMMMC]..vw_Departments AS DM ON e.DeptCode = COALESCE(DM.CODE, d.DeptCode)
    ORDER BY 
        subquery.leaveType, 
        subquery.Year;
    `,
    [employeeId, leaveType],
  );

  // } catch (error) {
  //     console.error(error);
  //     return { status: 500, message: 'Failed to retrieve leave balance' };
  // }
};

const getLeaveLedger = async (employeeCode) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      [UE database]..LeaveLedger
    WHERE
      Code = ?
    ORDER BY 
      RecNo DESC
    `,
    [employeeCode],
  );

  // try {

  //   const forfeitLeaveQuery = `
  //     SELECT *
  //     FROM
  //       [HR]..leaveledger
  //     WHERE
  //       code = @EmployeeCode
  //   `
  //   const result = await conn
  //     .request()
  //     .input('EmployeeCode', mssql.Int, EmployeeCode)
  //     .query(forfeitLeaveQuery);

  //   if(result.recordset.length === 0) {
  //     return { status: 404, message: 'No Forfeited Leaves for this User'};
  //   }

  //   return result.recordset;
  // } catch (error) {
  //   console.error(error);
  //   return { status: 500, message: 'Failed to retrieve Forfeited Leaves' };
  // }
};

// getPendingLeaves: async () => {
//   try {
//     const pool = await poolPromise;

//     if (!pool) {
//       return { status: 500, message: 'Error Connecting to Database' };
//     }

//     const pendingLeavesQuery = `
//       SELECT *
//       FROM HR..LeaveInfo
//       WHERE Status = 'Pending'
//     `;

//     const pendingLeavesResult = await pool.request().query(pendingLeavesQuery);

//     return pendingLeavesResult.recordset;
//   } catch (error) {
//     console.error(error);
//     return { status: 500, message: 'Internal Server Error' };
//   }
// },
const checkEmployeeToApprove = async (employeeId) => {
  return await sqlHelper.query(
    `SELECT
        code,
        lvl,
        deptCode,
        employeeCodes
    FROM HR..Approvers
    WHERE code = ? and deleted = 0
    `,
    [employeeId],
  );
};

const getPendingLeavesByEmployee = async (
  employeeCodesLevel1,
  employeeCodesLevel2,
  lvl1DeptCodes,
  lvl2DeptCodes,
  userHasLevel1,
  userHasLevel2,
  employeeCode,
) => {
  if (!employeeCodesLevel1) employeeCodesLevel1 = [];
  if (!employeeCodesLevel2) employeeCodesLevel2 = [];
  let lvl1Pending = [];
  let lvl2Pending = [];

  const employeeCodesStr1 = Array(employeeCodesLevel1.length)
    .fill("?")
    .join(",");
  const employeeCodesStr2 = Array(employeeCodesLevel2.length)
    .fill("?")
    .join(",");
  const lvl1DeptCodesStr = Array(lvl1DeptCodes.length).fill("?").join(",");
  const lvl2DeptCodesStr = Array(lvl2DeptCodes.length).fill("?").join(",");

  const addtnlConditions = [];
  const addtnlConditionsArgs = [];

  if (employeeCodesLevel1.length > 0) {
    addtnlConditions.push(`LI.IDCode IN (${employeeCodesStr1})`);
    addtnlConditionsArgs.push(...employeeCodesLevel1);
  }

  if (lvl1DeptCodes.length > 0) {
    addtnlConditions.push(`UE.DeptCode IN (${lvl1DeptCodesStr})`);
    addtnlConditionsArgs.push(...lvl1DeptCodes);
  }

  if (employeeCodesLevel1.length > 0 && lvl1DeptCodes.length > 0) {
    addtnlConditions.push(
      `(UE.DeptCode IN (${lvl1DeptCodesStr}) AND LI.IDCode NOT IN (${employeeCodesStr1}))`,
    );
    addtnlConditionsArgs.push(...lvl1DeptCodes);
    addtnlConditionsArgs.push(...employeeCodesLevel1);
  }

  const addtnlConditions2 = [];
  const addtnlConditionsArgs2 = [];

  if (employeeCodesLevel2.length > 0) {
    addtnlConditions2.push(`LI.IDCode IN (${employeeCodesStr2})`);
    addtnlConditionsArgs2.push(...employeeCodesLevel2);
  }

  if (lvl2DeptCodes.length > 0) {
    addtnlConditions2.push(`UE.DeptCode IN (${lvl2DeptCodesStr})`);
    addtnlConditionsArgs2.push(...lvl2DeptCodes);
  }

  if (employeeCodesLevel2.length > 0 && lvl2DeptCodes.length > 0) {
    addtnlConditions2.push(
      `(UE.DeptCode IN (${lvl2DeptCodesStr}) AND LI.IDCode NOT IN (${employeeCodesStr2}))`,
    );
    addtnlConditionsArgs2.push(...lvl2DeptCodes);
    addtnlConditionsArgs2.push(...employeeCodesLevel2);
  }

  if (userHasLevel1) {
    lvl1Pending = await sqlHelper.query(
      `
      SELECT
          LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
          (SELECT SUM(debit - credit) 
            FROM [HR].[dbo].[vw_LeaveCreditsV2] 
            WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
      FROM
          [UE database]..VacationSickLeave AS LI
      JOIN
          [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
      LEFT JOIN
          [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
      LEFT JOIN
          [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
      WHERE
        LI.status = 'Pending'
        AND approvedByLevel1DateTime IS NULL
        AND approvedByLevel2DateTime IS NULL
        AND cancelledStatusOrig IS NULL 
        ${addtnlConditions.length > 0 ? `AND (${addtnlConditions.join(" OR ")})` : ""}
        AND LI.IDCode != ?;
      `,
      [...addtnlConditionsArgs, employeeCode],
    );
  }

  if (userHasLevel2) {
    lvl2Pending = await sqlHelper.query(
      `
      SELECT
          LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
          (SELECT SUM(debit - credit) 
            FROM [HR].[dbo].[vw_LeaveCreditsV2] 
            WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
      FROM
          [UE database]..VacationSickLeave AS LI
      JOIN
          [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
      LEFT JOIN
          [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
      LEFT JOIN
          [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
      WHERE
        LI.status = 'PendingLevel2'
        AND approvedByLevel1DateTime IS NOT NULL
        AND approvedByLevel2DateTime IS NULL
        AND cancelledStatusOrig IS NULL 
        ${addtnlConditions2.length > 0 ? `AND (${addtnlConditions2.join(" OR ")})` : ""}
        AND LI.IDCode != ?;
      `,
      [...addtnlConditionsArgs2, employeeCode],
    );
  }

  // if (userHasLevel1 && userHasLevel2) {
  //   return { lvl1Pending, lvl2Pending };
  // } else if (userHasLevel1 && !userHasLevel2) {
  //   return { lvl1Pending };
  // } else {
  //   return { lvl2Pending };
  // }

  let result = [];

  if (userHasLevel1) {
    result = result.concat(lvl1Pending);
  }

  if (userHasLevel2) {
    result = result.concat(lvl2Pending);
  }

  return result;
};

// const getPendingLeaves = async (sqlWhereStrArr, args) => {

//   const getLvl = await sqlHelper.query(
//     `SELECT
//         code,
//         lvl,
//         deptCode,
//         employeeCodes
//     FROM HR..Approvers
//     ${sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND ") : ""}
//     `,
//     args
//   )

//   const userHasLevel1 = getLvl.some(entry => entry.lvl === 1);
//   const userHasLevel2 = getLvl.some(entry => entry.lvl === 2);

//   const level1DeptCodes = [...new Set(getLvl.filter(entry => entry.lvl === 1).map(entry => entry.deptCode))];
//   const level2DeptCodes = [...new Set(getLvl.filter(entry => entry.lvl === 2).map(entry => entry.deptCode))];

//   if (userHasLevel1 && userHasLevel2) {
//     const lvl1Pending = await sqlHelper.query(
//       `
//       SELECT
//           LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
//           (SELECT SUM(debit - credit)
//             FROM [HR].[dbo].[vw_LeaveCreditsV2]
//             WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
//       FROM
//           [UE database]..VacationSickLeave AS LI
//       JOIN
//           [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
//       LEFT JOIN
//           [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
//       LEFT JOIN
//           [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
//       WHERE
//         LI.status = ?
//         AND approvedByLevel1DateTime IS NULL
//         AND approvedByLevel2DateTime IS NULL
//         AND cancelledStatusOrig IS NULL
//         AND UE.DeptCode IN (${Array(level1DeptCodes.length).fill("?").join(",")})
//       `,
//       ['Pending', ...level1DeptCodes]
//     );

//     const lvl2Pending = await sqlHelper.query(
//       `
//       SELECT
//           LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
//           (SELECT SUM(debit - credit)
//             FROM [HR].[dbo].[vw_LeaveCreditsV2]
//             WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
//       FROM
//           [UE database]..VacationSickLeave AS LI
//       JOIN
//           [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
//       LEFT JOIN
//           [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
//       LEFT JOIN
//           [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
//       WHERE
//           LI.status = ? AND approvedByLevel1DateTime IS NOT NULL
//           AND approvedByLevel2DateTime IS NULL
//           AND cancelledStatusOrig IS NULL
//           AND UE.DeptCode IN (${Array(level2DeptCodes.length).fill("?").join(",")})
//       `,
//       ['PendingLevel2', ...level2DeptCodes]
//     );

//     return { lvl1Pending, lvl2Pending };

//   }

//   if(userHasLevel1 && !userHasLevel2) {
//     const lvl1Pending = await sqlHelper.query(
//       `
//       SELECT
//           LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
//           (SELECT SUM(debit - credit)
//             FROM [HR].[dbo].[vw_LeaveCreditsV2]
//             WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
//       FROM
//           [UE database]..VacationSickLeave AS LI
//       JOIN
//           [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
//       LEFT JOIN
//           [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
//       LEFT JOIN
//           [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
//       WHERE
//           LI.status = ?
//           AND approvedByLevel1DateTime IS NULL
//           AND approvedByLevel2DateTime IS NULL
//           AND cancelledStatusOrig IS NULL
//           AND UE.DeptCode IN (${Array(level1DeptCodes.length).fill("?").join(",")})
//           `,
//       ['Pending', ...level1DeptCodes]
//     );

//     return { lvl1Pending };
//   }

//   if(!userHasLevel1 && userHasLevel2) {
//     const lvl2Pending = await sqlHelper.query(
//       `
//       SELECT
//           LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
//           (SELECT SUM(debit - credit)
//             FROM [HR].[dbo].[vw_LeaveCreditsV2]
//             WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
//       FROM
//           [UE database]..VacationSickLeave AS LI
//       JOIN
//           [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
//       LEFT JOIN
//           [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
//       LEFT JOIN
//           [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
//       WHERE
//           LI.status = ?
//           AND approvedByLevel1DateTime IS NOT NULL
//           AND approvedByLevel2DateTime IS NULL
//           AND cancelledStatusOrig IS NULL
//           AND UE.DeptCode IN (${Array(level2DeptCodes.length).fill("?").join(",")})
//           `,
//       ['PendingLevel2', ...level2DeptCodes]
//     );

//     return { lvl2Pending };
//   }
// };

const pendingLeaveTypeBalance = async (employeId, leaveType) => {
  return await sqlHelper.query(
    `
    SELECT leaveType, remainingLeaveBal
    FROM (
        SELECT leaveType, SUM(debit - credit) AS remainingLeaveBal
          FROM [HR].[dbo].[vw_LeaveCreditsV2]
          WHERE code = ? AND leaveType = ?
          GROUP BY leaveType
    ) AS subquery
    WHERE remainingLeaveBal >= 0
    ORDER BY leaveType;
    `,
    [employeId, leaveType],
  );
};

const getApprovedLeaves = async (
  sqlWhereStrArr,
  args,
  sqlWhereStrArr2,
  args2,
) => {
  const leaveRequestsQuery = await sqlHelper.query(
    `
    SELECT 
        LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.DeptCode, s.DESCRIPTION deptDescription,
        (SELECT SUM(debit - credit) 
            FROM [HR].[dbo].[vw_LeaveCreditsV2] 
            WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
    FROM 
        [UE database]..VacationSickLeave AS LI
    LEFT JOIN 
        [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
    LEFT JOIN 
        UERMMMC..SECTIONS s ON UE.DeptCode = s.CODE
    ${sqlWhereStrArr2.length > 0 ? `WHERE ${sqlWhereStrArr2.join(" AND ")}` : ""}
    `,
    args2,
  );

  const approverCodeQuery = await sqlHelper.query(
    `SELECT 
        code, 
        deptCode
    FROM 
        [HR]..Approvers
    ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""};
    `,
    args,
  );

  const filteredRejectedLeaves = leaveRequestsQuery.filter((leave) => {
    return approverCodeQuery.some(
      (approver) => approver.deptCode === leave.deptCode,
    );
  });

  return filteredRejectedLeaves;

  // try {

  //   const leaveRequestsQuery = `
  //     SELECT
  //           LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.DeptCode
  //     FROM
  //         HR..LeaveInfo AS LI
  //     JOIN
  //         [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.Code) = UE.EmployeeCode
  //     WHERE
  //         LI.Status = 'Approved'
  //         AND TimeFrom IS NOT NULL
  //         AND TimeTo IS NOT NULL
  //         AND DateFrom IS NOT NULL
  //         AND DateTo IS NOT NULL
  //     `;

  //   const approvedLeaveResult = await conn.request().query(leaveRequestsQuery);

  //   const approverCodeQuery = `
  //     SELECT
  //           code,
  //           deptCode
  //     FROM
  //         [HR]..Approvers
  //     WHERE
  //         code = @EmployeeCode
  //     `;

  //   const approverCodeResult = await conn
  //     .request()
  //     .input('EmployeeCode', mssql.Int, EmployeeCode)
  //     .query(approverCodeQuery);

  //   // Filter approvedLeaveResult based on matching deptCode
  //   const filteredApprovedLeaves = approvedLeaveResult.recordset.filter(leave => {
  //       return approverCodeResult.recordset.some(approver => approver.deptCode === leave.DeptCode);
  //   });

  //   return filteredApprovedLeaves;
  // } catch (error) {
  //     console.error(error);
  //     return { status: 500, message: 'Error Getting Approved Leave' };
  // }
};

const getRejectedLeaves = async (
  sqlWhereStrArr,
  args,
  sqlWhereStrArr2,
  args2,
) => {
  const leaveRequestsQuery = await sqlHelper.query(
    `
    SELECT 
        LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.DeptCode, s.DESCRIPTION deptDescription,
        (SELECT SUM(debit - credit) 
            FROM [HR].[dbo].[vw_LeaveCreditsV2] 
            WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
    FROM 
        [UE database]..VacationSickLeave AS LI
    LEFT JOIN 
        [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
    LEFT JOIN 
        UERMMMC..SECTIONS s ON UE.DeptCode = s.CODE
    ${sqlWhereStrArr2.length > 0 ? `WHERE ${sqlWhereStrArr2.join(" AND ")}` : ""};
    `,
    args2,
  );

  const approverCodeQuery = await sqlHelper.query(
    `SELECT 
        code, 
        deptCode
    FROM 
        [HR]..Approvers
        ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""};
    `,
    args,
  );

  const filteredRejectedLeaves = leaveRequestsQuery.filter((leave) => {
    return approverCodeQuery.some(
      (approver) => approver.deptCode === leave.deptCode,
    );
  });

  return filteredRejectedLeaves;

  // try {

  //   const leaveRequestsQuery = `
  //     SELECT
  //         LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.DeptCode
  //     FROM
  //         HR..LeaveInfo AS LI
  //     JOIN
  //         [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.Code) = UE.EmployeeCode
  //     WHERE
  //         LI.Status = 'Rejected'
  //         AND TimeFrom IS NOT NULL
  //         AND TimeTo IS NOT NULL
  //         AND DateFrom IS NOT NULL
  //         AND DateTo IS NOT NULL
  //     `;

  //   const rejectLeaveResult = await conn.request().query(leaveRequestsQuery);

  //   const approverCodeQuery = `
  //     SELECT
  //         code,
  //         deptCode
  //     FROM
  //         [HR]..Approvers
  //     WHERE
  //         code = @EmployeeCode
  //     `;

  //   const approverCodeResult = await conn
  //     .request()
  //     .input('EmployeeCode', mssql.Int, EmployeeCode)
  //     .query(approverCodeQuery);

  //   // Filter rejectLeaveResult based on matching deptCode
  //   const filteredRejectedLeaves = rejectLeaveResult.recordset.filter(leave => {
  //       return approverCodeResult.recordset.some(approver => approver.deptCode === leave.DeptCode);
  //   });

  //   return filteredRejectedLeaves;
  // } catch (error) {
  //     console.error(error);
  //     return { status: 500, message: 'Error Getting Rejected Leave' };
  // }
};

const cancelLeave = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "[UE database]..VacationSickLeave",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const deleteLeave = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "[UE database]..VacationSickLeave",
    item,
    condition,
    txn,
    updateDateTimeField,
  );

  // const leaveInfoQuery = await sqlHelper.query(
  //   `SELECT *
  //   FROM [UE database]..VacationSickLeave
  //   ${sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND ") : ""}
  //   `,
  //   args,
  //   txn
  // )

  // if(leaveInfoQuery.length === 0){
  //   return leaveInfoQuery;
  // }

  // return await sqlHelper.query(
  //   `DELETE
  //   FROM [UE database]..VacationSickLeave
  //   ${sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND ") : ""}
  //   `,
  //   args,
  //   txn
  // )
  // try {
  //   const leaveInfoQuery = await conn
  //     .request()
  //     .input('LeaveID', mssql.Int, LeaveID)
  //     .query('SELECT * FROM HR..LeaveInfo WHERE LeaveID = @LeaveID');

  //   const leaveRequest = leaveInfoQuery.recordset[0];

  //   if (!leaveRequest) {
  //     return { status: 404, message: 'Leave request not found' };
  //   }

  //   const deleteQuery = `
  //     DELETE FROM HR..LeaveInfo
  //     WHERE LeaveID = @LeaveID
  //   `;

  //   const deleteResult = await runInTransaction(conn, async (request) => {
  //     return request
  //       .input('LeaveID', mssql.Int, LeaveID)
  //       .query(deleteQuery);
  //   });

  //   if (deleteResult.rowsAffected[0] === 0) {
  //     return { status: 500, message: 'Failed to delete leave request' };
  //   }

  //   return { status: 200, message: 'Leave request deleted successfully' };
  // } catch (error) {
  //   console.error(error);
  //   return { status: 500, message: 'Failed to delete leave request' };
  // }
};

const checkLevelStatus = async (leaveId) => {
  return await sqlHelper.query(
    `SELECT DISTINCT e.DeptCode, e.EmployeeCode iDCode, a.lvl, v.approvedByLevel1, v.approvedByLevel2, v.status, e.Class, a.employeeCodes
    FROM
        [UE database]..VacationSickLeave v
    LEFT JOIN
        [UE database]..Employee e ON e.EmployeeCode = v.IDCode
    LEFT JOIN
        [HR]..Approvers a ON a.deptCode = e.DeptCode
    WHERE v.leaveId = ?
    AND (a.employeeCodes IS NULL OR CHARINDEX(CAST(v.IDCode AS NVARCHAR(255)), a.employeeCodes) > 0)
    AND a.deleted != 1
    `,
    [leaveId],
  );
};

const checkLevelStatusCancel = async (leaveId) => {
  return await sqlHelper.query(
    `SELECT DISTINCT e.DeptCode, e.EmployeeCode iDCode, a.lvl, v.approvedByLevel1, v.approvedByLevel2, v.status, e.Class, a.employeeCodes,
        v.cancelledStatusOrig, v.cancelledByLevel1, v.cancelledByLevel2, v.ledgerId, v.Year,
        v.daysOfLeave, v.leaveId, v.IDCode, v.leaveType, v.effectiveYear, e.class
    FROM 
        [UE database]..VacationSickLeave v
    LEFT JOIN
        [UE database]..Employee e ON e.EmployeeCode = v.IDCode
    LEFT JOIN
        [HR]..Approvers a ON a.deptCode = e.DeptCode
    WHERE v.leaveId = ?
    AND (a.employeeCodes IS NULL OR CHARINDEX(CAST(v.IDCode AS NVARCHAR(255)), a.employeeCodes) > 0)
    AND a.deleted != 1
    `,
    [leaveId],
  );
};

// const verifyLevelCreate = async (employeeId) => {
//   return await sqlHelper.query(
//     `SELECT
//         e.employeeCode,
//         CASE WHEN a.lvl IS NULL THEN 0 ELSE a.lvl END lvl
//     FROM
//         [UE DATABASE]..Employee e
//     LEFT JOIN HR..Approvers a ON e.EmployeeCode = a.Code AND a.deleted = 0
//     WHERE
//       e.EmployeeCode = ?;
//     `,
//     [employeeId],
//   );
// };

const verifyLevelHasOneTWO = async (employeeId) => {
  return await sqlHelper.query(
    `SELECT DISTINCT e.deptCode, e.EmployeeCode, a.lvl, a.code, a.employeeCodes employeeToApprove
    FROM 
        [UE database]..Employee e
    LEFT JOIN
        [HR]..Approvers a ON a.deptCode = e.DeptCode AND a.deleted = 0
    WHERE e.EmployeeCode = ?
    `,
    [employeeId],
  );
};

const verifyLevelCreate = async (employeeId) => {
  // const deptCode = await sqlHelper.query(
  //   `SELECT DeptCode
  //   FROM
  //       [UE database]..Employee
  //   WHERE
  //       EmployeeCode = ? AND deleted != 1
  //   `,
  //   [employeeId],
  // );

  // return await sqlHelper.query(
  //   `SELECT
  //       lvl,
  //       deptCode,
  //       code,
  //       employeeCodes
  //   FROM
  //       HR..Approvers
  //   WHERE
  //       (
  //         (employeeCodes LIKE ? OR
  //         employeeCodes LIKE ? OR
  //         employeeCodes LIKE ? OR
  //         employeeCodes LIKE ?)
  //         OR deptCode = ?
  //       )
  //       AND deleted != 1
  //       AND code != ?
  //       `,
  //   [
  //     `${employeeId}`,
  //     `${employeeId},%`,
  //     `%,${employeeId}`,
  //     `%,${employeeId},%`,
  //     deptCode[0].deptCode,
  //     employeeId,
  //   ],
  // );

  return await sqlHelper.query(
    `WITH ApproverData AS (
        SELECT 
            e.DeptCode,
            e.EmployeeCode,
			a.deleted,
            a.lvl,
            a.code AS approversCode,
            a.employeeCodes,
            emp.FirstName,
            emp.MiddleInitial,
            emp.LastName,
            CASE 
                WHEN ',' + ISNULL(a.employeeCodes, '') + ',' LIKE '%,' + e.EmployeeCode + ',%' THEN 1
                ELSE 0
            END AS isDirectApprover
        FROM 
            [UE database]..Employee e
        JOIN
            HR..Approvers a ON e.DeptCode = a.deptCode AND a.deleted = 0
        JOIN
            [UE database]..Employee emp ON a.code = emp.EmployeeCode
        WHERE
            e.EmployeeCode = ?
    )
    SELECT 
        DeptCode,
        EmployeeCode,
        lvl,
        approversCode,
        employeeCodes,
		deleted,
        FirstName,
        MiddleInitial,
        LastName
    FROM ApproverData
    WHERE 
        isDirectApprover = 1
        OR (
            NOT EXISTS (
                SELECT 1 FROM ApproverData WHERE isDirectApprover = 1
            )
            AND employeeCodes IS NULL
        )
    ORDER BY lvl, LastName`,
    [employeeId],
  );
};

const verifyLevel = async (employeeId) => {
  return await sqlHelper.query(
    `SELECT code, lvl, deptCode
    FROM HR..Approvers
    WHERE code = ? and deleted = 0
    `,
    [employeeId],
  );
  // const verify = await sqlHelper.query(
  //   `SELECT e.DeptCode, v.IDCode, a.lvl
  //   FROM
  //       [UE database]..VacationSickLeave v
  //   LEFT JOIN
  //       [UE database]..Employee e ON e.EmployeeCode = v.IDCode
  //   LEFT JOIN
  //       [HR]..Approvers a ON a.deptCode = e.DeptCode
  //   WHERE v.IDCode - ?
  //   `,
  //   [employeeId]
  // )
};

const updateLeaveAction = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "[UE database]..VacationSickLeave",
    item,
    condition,
    txn,
    updateDateTimeField,
  );

  // const codeReq = getLeaveInfo[0].iDCode;
  // const leaveTypeReq = getLeaveInfo[0].leaveType;
  // const transDateReq = getLeaveInfo[0].transDate;
  // const itemType = getLeaveInfo[0].itemType;
  // const yearEffectivity = getLeaveInfo[0].effectiveYear;
  // const remarks = getLeaveInfo[0].remarks;
  // const referenceNo = getLeaveInfo[0].leaveId;
  // const creditReq = getLeaveInfo[0].uSED_LEAVE

  // if (Status === 'Approved' || Status === 'Rejected') {
  //   const actionTime = new Date();
  //   let updateLeaveQuery = `
  //     UPDATE HR..LeaveInfo
  //     SET Status = @Status,
  //         ApprovedBy = @EmployeeCode,
  //         ApprovedDateTime = @ActionTime
  //   `;

  //   if (Status === 'Rejected') {
  //     updateLeaveQuery = `
  //       UPDATE HR..LeaveInfo
  //       SET Status = @Status,
  //           RejectedBy = @EmployeeCode,
  //           RejectedDateTime = @ActionTime
  //     `;
  //   }

  //   updateLeaveQuery += `
  //     WHERE LeaveID = @LeaveID
  //   `;

  //   const result = await runInTransaction(conn, async (request) => {
  //     const updateResult = await request
  //       .input('Status', mssql.NVarChar, Status)
  //       .input('EmployeeCode', mssql.Int, EmployeeCode)
  //       .input('ActionTime', mssql.DateTime, actionTime)
  //       .input('LeaveID', mssql.Int, LeaveID)
  //       .query(updateLeaveQuery);

  // If the leave is approved, insert data into [UE database]..LeaveLedger
  // if (Status === 'Approved') {
  //   const leaveInfoResult = await request
  //     .input('LeaveIDRequest', mssql.Int, LeaveID)
  //     .query(`
  //       SELECT *
  //       FROM HR..LeaveInfo
  //       WHERE LeaveID = @LeaveIDRequest
  //     `);

  //   const leaveInfo = leaveInfoResult.recordset[0];

  //   await request
  //     .input('EmployeeCodeReq', mssql.Int, leaveInfo.Code)
  //     .input('LeaveTypeReq', mssql.NVarChar, leaveInfo.LeaveType)
  //     .input('TransDateReq', mssql.DateTime, leaveInfo.TransDate)
  //     .input('ITEMTYPEReq', mssql.NVarChar, leaveInfo.ITEMTYPE)
  //     .input('YearAttributedReq', mssql.NVarChar, leaveInfo.YearAttributed)
  //     .input('YearEffectivityReq', mssql.NVarChar, leaveInfo.YearEffectivity)
  //     .input('RemarksReq', mssql.NVarChar, leaveInfo.Remarks)
  //     .input('ReferenceNoReq', mssql.Int, leaveInfo.LeaveID)
  //     .input('CreditReq', mssql.Float, leaveInfo.Days)
  //     .query(`
  //       INSERT INTO [UE database]..LeaveLedger
  //       (Code, LeaveType, TransDate, ITEMTYPE, YearAttributed, YearEffectivity, Remarks, ReferenceNo, Credit)
  //       VALUES
  //       (@EmployeeCodeReq, @LeaveTypeReq, @TransDateReq, @ITEMTYPEReq, @YearAttributedReq, @YearEffectivityReq, @RemarksReq, @ReferenceNoReq, @CreditReq)
  //     `);
  // }

  //   return updateResult.rowsAffected[0];
  // });

  //   return result;
  // } else {
  //   return 0;
  // }
};

const getInfoAction = async (sqlWhereStrArr, args, txn) => {
  const info = await sqlHelper.query(
    `SELECT *
    FROM [UE database]..VacationSickLeave
    ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : " "}
    `,
    args,
    txn,
  );

  return info;
};

const insertLeaveLedger = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..LeaveLedger",
    item,
    txn,
    creationDateTimeField,
  );
};

const getLedgerId = async (referenceNo, txn) => {
  return await sqlHelper.query(
    `SELECT RecNo
    FROM [UE database]..LeaveLedger
    WHERE RecNo = ?
    `,
    [referenceNo],
    txn,
  );
};

const updateLegerIdVSL = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "[UE database]..VacationSickLeave",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
  // return await sqlHelper.query(
  //   `UPDATE [UE database]..VacationSickLeave
  //   SET ledgerId = ?, USED_LEAVE = ?, Year = ?, hrReceived = ?, hrReceiveDate= ?
  //   WHERE leaveId = ?
  //   `,
  //   [ledgerId, usedLeaved, yearAttributed, 1, currentDate, leaveId],
  //   txn
  // )
};

const getSchedule = async (employeeId, startDate, endDate) => {
  // return await sqlHelper.query(
  //   `SELECT TOP 1
  //       sa.[SCHEDID] schedId,
  //       s.[FROM] timeFrom,
  //       s.[TO] timeTo
  //   FROM
  //       [UE database].[dbo].[jom_HRMS_PermanentSchedule] sa
  //   JOIN
  //       [UE database]..[jom_HRMS_Schedule] s ON sa.[SCHEDID] = S.[ID]
  //   WHERE
  //       sa.[EMPCODE] = ?
  //   `,
  //   [employeeId],
  // );
  return await sqlHelper.query(
    `EXEC HR.dbo.Usp_jf_DTRv2
      '${startDate}',
      '${endDate}',
      '${employeeId}',
      '',
      'TimeView'
      `,
    [],
  );
};

const updateAndValidateLeave = async (
  // leaveId,
  // EmployeeCode,
  // LeaveType,
  // Days,
  // TimeFrom,
  // TimeTo,
  // DateFrom,
  // DateTo,
  // Reason,
  // edited,
  // dateTimeEdited,
  // txn,
  item,
  condition,
  txn,
  updateDateTimeField,
) => {
  // const checkLeaveOwnershipQuery = `
  //   SELECT Code
  //   FROM HR..LeaveInfo
  //   WHERE LeaveID = @LeaveID;
  // `;
  // const checkLeaveOwnershipResult = await conn
  // .request()
  // .input('LeaveID', mssql.Int, LeaveID)
  // .query(checkLeaveOwnershipQuery);

  // const checkLeaveOwnershipQuery = await sqlHelper.query(
  //   `SELECT IDCode
  //     FROM [UE database]..VacationSickLeave
  //     WHERE leaveId = ?
  //     `,
  //   [leaveId],
  //   txn,
  // );

  // const codeFromDatabase = checkLeaveOwnershipQuery[0].iDCode;

  // const trimmedCode =
  //   typeof codeFromDatabase === "number"
  //     ? codeFromDatabase.toString()
  //     : codeFromDatabase;
  // const trimmedEmployeeCode =
  //   typeof EmployeeCode === "string"
  //     ? EmployeeCode.trim().toLowerCase()
  //     : EmployeeCode;

  // if (
  //   checkLeaveOwnershipQuery.length === 0 ||
  //   trimmedCode !== trimmedEmployeeCode
  // ) {
  //   return { status: 401, message: "Unauthorized access" };
  // }

  return await sqlHelper.update(
    "[UE database]..VacationSickLeave",
    item,
    condition,
    txn,
    updateDateTimeField,
  );

  // if (LeaveType === "LWOP") {
  //   return await sqlHelper.query(
  //     `UPDATE [UE database]..VacationSickLeave
  //       SET daysOfLeave = ?,
  //           TIME_FROM = ?,
  //           TIME_TO = ?,
  //           DateLeavedFrom = ?,
  //           DateLeavedTo = ?,
  //           reasonForLeave = ?,
  //           LeaveType = ?,
  //           Remarks = ?,
  //           LeaveWOPay = ?,
  //           edited = ?,
  //           dateTimeEdited = ?
  //       WHERE leaveId = ?;
  //       `,
  //     [
  //       Days,
  //       TimeFrom,
  //       TimeTo,
  //       DateFrom,
  //       DateTo,
  //       Reason,
  //       LeaveType,
  //       Reason,
  //       Days,
  //       edited,
  //       dateTimeEdited,
  //       leaveId,
  //     ],
  //     txn,
  //   );
  // }

  // const result = await sqlHelper.query(
  //   `UPDATE [UE database]..VacationSickLeave
  //     SET daysOfLeave = ?,
  //         TIME_FROM = ?,
  //         TIME_TO = ?,
  //         DateLeavedFrom = ?,
  //         DateLeavedTo = ?,
  //         reasonForLeave = ?,
  //         LeaveType = ?,
  //         Remarks = ?,
  //         LeaveWOPay = ?,
  //         edited = ?,
  //         dateTimeEdited = ?
  //     WHERE leaveId = ?;
  //     `,
  //   [
  //     Days,
  //     TimeFrom,
  //     TimeTo,
  //     DateFrom,
  //     DateTo,
  //     Reason,
  //     LeaveType,
  //     Reason,
  //     0,
  //     edited,
  //     dateTimeEdited,
  //     leaveId,
  //   ],
  //   txn,
  // );

  // console.log("RESULT:", result);

  // const updateLeaveQuery = `
  //   UPDATE HR..LeaveInfo
  //   SET Days = @Days,
  //       TimeFrom = @TimeFrom,
  //       TimeTo = @TimeTo,
  //       DateFrom = @DateFrom,
  //       DateTo = @DateTo,
  //       LeaveType = @LeaveType,
  //       Reason = @Reason
  //   WHERE LeaveID = @LeaveID;

  // `;

  // const updateResult =
  // await runInTransaction(conn, async (request) => {
  //   return request
  //     .input('Days', mssql.Float, Days)
  //     .input('TimeFrom', mssql.NVarChar, formattedTimeFromFinal)
  //     .input('TimeTo', mssql.NVarChar, formattedTimeToFinal)
  //     .input('DateFrom', mssql.Date, DateFrom)
  //     .input('DateTo', mssql.Date, DateTo)
  //     .input('LeaveType', mssql.NVarChar, LeaveType)
  //     .input('Reason', mssql.NVarChar, Reason)
  //     .input('LeaveID', mssql.Int, LeaveID)
  //     .query(updateLeaveQuery);
  // });
};

const getLeaveIdDetails = async function (leaveId) {
  return await sqlHelper.query(
    `SELECT leaveType, daysOfLeave, IDCode, Year, itemType, EffectiveYear, leaveid, remarks, leaveId, cancelledStatusOrig, approvedByLevel1, approvedByLevel2
      FROM [UE database]..VacationSickLeave
      WHERE leaveId = ?
      `,
    [leaveId],
  );
};

const getAttributedYear = async (
  leaveIdCode,
  leaveIdLeaveType,
  leaveIdDays,
  txn,
) => {
  // const leaveBalances = await sqlHelper.query(
  //   `SELECT leaveType, yearAttributed year, SUM(debit - credit) remaining
  //   FROM HR..vw_LeaveCreditsV2
  //   WHERE code = ? AND leaveType = ?
  //   GROUP BY leaveType, yearAttributed
  //   ORDER BY yearAttributed`,
  //   [leaveIdCode, leaveIdLeaveType],
  //   txn
  // );

  const leaveBalances = await sqlHelper.query(
    `DECLARE @appliedLeave MONEY = ?;

    DECLARE @TestTable TABLE (
        RowNum INT NOT NULL IDENTITY(1,1),
        YearEffectivity CHAR(4),
        YearAttributed CHAR(4) NOT NULL,
        RemainingLeave MONEY NOT NULL,
        AppliedLeave MONEY NOT NULL,
        DistributedLeave MONEY
    );

    -- Insert actual remaining leaves per year for the employee
    INSERT INTO @TestTable (YearEffectivity, YearAttributed, RemainingLeave, AppliedLeave)
    SELECT 
        YearEffectivity = CONVERT(CHAR(4), GETDATE(), 112),
        YearAttributed,
        RemainingLeave = SUM(debit - credit),
        AppliedLeave = @appliedLeave
    FROM HR.dbo.vw_LeaveCreditsV2
    WHERE code = ? AND LeaveType = ?
    GROUP BY YearAttributed
    HAVING SUM(debit - credit) > 0
    ORDER BY YearAttributed;

    -- Compute how the leave will be distributed per year
    WITH cteRunningBalance AS (
        SELECT 
            RowNum,
            YearEffectivity,
            YearAttributed,
            RemainingLeave,
            AppliedLeave,
            Balance = AppliedLeave - SUM(RemainingLeave) OVER (ORDER BY RowNum)
        FROM @TestTable
    )
    UPDATE t
    SET DistributedLeave = 
        CASE 
            WHEN bal.Balance > 0 THEN bal.RemainingLeave
            WHEN bal.Balance <= 0 AND bal.RemainingLeave + bal.Balance >= 0 THEN bal.RemainingLeave + bal.Balance
            WHEN bal.Balance = 0 AND bal.RemainingLeave = bal.AppliedLeave THEN bal.AppliedLeave
            ELSE 0
        END
    FROM cteRunningBalance bal
    JOIN @TestTable t ON bal.RowNum = t.RowNum;

    -- Final Output
    SELECT 
        YearAttributed AS [Year], 
        DistributedLeave AS [daysOfLeave]
    FROM @TestTable
    WHERE DistributedLeave IS NOT NULL AND DistributedLeave != 0;
`,
    [leaveIdDays, leaveIdCode, leaveIdLeaveType],
    txn,
  );

  return leaveBalances;
};

const generateLeaveId = async (txn, res) => {
  const now = new Date();
  const dateTimeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  const row = await sqlHelper.query(
    `SELECT TOP 1
          leaveId
        FROM
          [UE database]..VacationSickLeave
        WHERE
          leaveId LIKE '${dateTimeStr}%'
        ORDER BY
          leaveId DESC;`,
    [],
    txn,
  );

  if (row.error) return res.status(500).json("Internal Server Error.");

  let leaveId;

  if (row.length === 0) {
    leaveId = `${dateTimeStr.padEnd(12, "0")}`;
    return leaveId;
  } else {
    const lastSeriesNo = Number(row[0].leaveId.substring(8, 12));
    let nextSeriesNo = lastSeriesNo + 1;
    leaveId = `${dateTimeStr}${String(nextSeriesNo).padStart(4, "0")}`;

    // Ensure uniqueness by checking if the generated leaveId already exists
    while (row.some((entry) => entry.leaveId === leaveId)) {
      nextSeriesNo++;
      leaveId = `${dateTimeStr}${String(nextSeriesNo).padStart(4, "0")}`;
    }

    return leaveId;
  }
};

const getUserApprovedLeaves = async (sqlWhereStrArr, args) => {
  return await sqlHelper.query(
    `SELECT 
          v.*, 
          e.FirstName, 
          e.LastName, 
          e.MiddleInitial, 
          e.DeptCode,
          d.Description deptDescription,
          DM.DESCRIPTION deptDescSecond
      FROM 
          [UE database]..VacationSickLeave v
      JOIN
          [UE database]..Employee e ON v.IDCode = e.EmployeeCode
      LEFT JOIN
        [UE database]..Department AS d ON e.DeptCode = d.DeptCode
      LEFT JOIN
        [UERMMMC]..vw_Departments AS DM ON e.DeptCode = COALESCE(DM.CODE, d.DeptCode)
      ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""}
      `,
    args,
  );
};

const getUserRejectedLeaves = async (sqlWhereStrArr, args) => {
  return await sqlHelper.query(
    `SELECT 
          v.*, 
          e.FirstName, 
          e.LastName, 
          e.MiddleInitial, 
          e.DeptCode,
          d.Description deptDescription,
          DM.DESCRIPTION deptDescSecond
      FROM 
          [UE database]..VacationSickLeave v
      JOIN
          [UE database]..Employee e ON v.IDCode = e.EmployeeCode
      LEFT JOIN
        [UE database]..Department AS d ON e.DeptCode = d.DeptCode
      LEFT JOIN
        [UERMMMC]..vw_Departments AS DM ON e.DeptCode = COALESCE(DM.CODE, d.DeptCode)
      ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""}
      `,
    args,
  );
};

const getUserCancelApprovedLeaves = async (sqlWhereStrArr, args) => {
  return await sqlHelper.query(
    `SELECT 
          v.*, 
          e.FirstName, 
          e.LastName, 
          e.MiddleInitial, 
          e.DeptCode,
          d.Description deptDescription,
          DM.DESCRIPTION deptDescSecond
      FROM 
          [UE database]..VacationSickLeave v
      JOIN
          [UE database]..Employee e ON v.IDCode = e.EmployeeCode
      LEFT JOIN
        [UE database]..Department AS d ON e.DeptCode = d.DeptCode
      LEFT JOIN
        [UERMMMC]..vw_Departments AS DM ON e.DeptCode = COALESCE(DM.CODE, d.DeptCode)
      ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""}
      `,
    args,
  );
};

const getUserCancelRejectedLeaves = async (sqlWhereStrArr, args) => {
  return await sqlHelper.query(
    `SELECT 
          v.*, 
          e.FirstName, 
          e.LastName, 
          e.MiddleInitial, 
          e.DeptCode,
          d.Description deptDescription,
          DM.DESCRIPTION deptDescSecond
      FROM 
          [UE database]..VacationSickLeave v
      JOIN
          [UE database]..Employee e ON v.IDCode = e.EmployeeCode
      LEFT JOIN
        [UE database]..Department AS d ON e.DeptCode = d.DeptCode
      LEFT JOIN
        [UERMMMC]..vw_Departments AS DM ON e.DeptCode = COALESCE(DM.CODE, d.DeptCode)
      ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""}
      `,
    args,
  );
};

const getCancelPending = async (
  employeeCodesLevel1,
  employeeCodesLevel2,
  lvl1DeptCodes,
  lvl2DeptCodes,
  userHasLevel1,
  userHasLevel2,
) => {
  if (!employeeCodesLevel1) employeeCodesLevel1 = [];
  if (!employeeCodesLevel2) employeeCodesLevel2 = [];
  let lvl1Pending = [];
  let lvl2Pending = [];

  const employeeCodesStr1 = Array(employeeCodesLevel1.length)
    .fill("?")
    .join(",");
  const employeeCodesStr2 = Array(employeeCodesLevel2.length)
    .fill("?")
    .join(",");
  const lvl1DeptCodesStr = Array(lvl1DeptCodes.length).fill("?").join(",");
  const lvl2DeptCodesStr = Array(lvl2DeptCodes.length).fill("?").join(",");

  const addtnlConditions = [];
  const addtnlConditionsArgs = [];

  if (employeeCodesLevel1.length > 0) {
    addtnlConditions.push(`LI.IDCode IN (${employeeCodesStr1})`);
    addtnlConditionsArgs.push(...employeeCodesLevel1);
  }

  if (lvl1DeptCodes.length > 0) {
    addtnlConditions.push(`UE.DeptCode IN (${lvl1DeptCodesStr})`);
    addtnlConditionsArgs.push(...lvl1DeptCodes);
  }

  if (employeeCodesLevel1.length > 0 && lvl1DeptCodes.length > 0) {
    addtnlConditions.push(
      `(UE.DeptCode IN (${lvl1DeptCodesStr}) AND LI.IDCode NOT IN (${employeeCodesStr1}))`,
    );
    addtnlConditionsArgs.push(...lvl1DeptCodes);
    addtnlConditionsArgs.push(...employeeCodesLevel1);
  }

  const addtnlConditions2 = [];
  const addtnlConditionsArgs2 = [];

  if (employeeCodesLevel2.length > 0) {
    addtnlConditions2.push(`LI.IDCode IN (${employeeCodesStr2})`);
    addtnlConditionsArgs2.push(...employeeCodesLevel2);
  }

  if (lvl2DeptCodes.length > 0) {
    addtnlConditions2.push(`UE.DeptCode IN (${lvl2DeptCodesStr})`);
    addtnlConditionsArgs2.push(...lvl2DeptCodes);
  }

  if (employeeCodesLevel2.length > 0 && lvl2DeptCodes.length > 0) {
    addtnlConditions2.push(
      `(UE.DeptCode IN (${lvl2DeptCodesStr}) AND LI.IDCode NOT IN (${employeeCodesStr2}))`,
    );
    addtnlConditionsArgs2.push(...lvl2DeptCodes);
    addtnlConditionsArgs2.push(...employeeCodesLevel2);
  }

  if (userHasLevel1) {
    lvl1Pending = await sqlHelper.query(
      `
        SELECT
            LI.*, 
            UE.FirstName, 
            UE.LastName, 
            UE.MiddleInitial, 
            UE.Deptcode, 
            D.Description AS DeptDescription, 
            DM.DESCRIPTION AS deptDescSecond,
            (SELECT SUM(debit - credit) 
              FROM [HR].[dbo].[vw_LeaveCreditsV2] 
              WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
        FROM
            [UE database]..VacationSickLeave AS LI
        JOIN
            [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
        LEFT JOIN
            [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
        LEFT JOIN
            [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
        WHERE
          LI.cancelledStatusOrig = 'Pending'
          AND cancelledByLevel1DateTime IS NULL
          AND cancelledByLevel2DateTime IS NULL
          AND cancelledStatusOrig IS NOT NULL 
          ${addtnlConditions.length > 0 ? `AND (${addtnlConditions.join(" OR ")})` : ""};
        `,
      addtnlConditionsArgs,
    );
  }

  if (userHasLevel2) {
    lvl2Pending = await sqlHelper.query(
      `
        SELECT
            LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
            (SELECT SUM(debit - credit) 
              FROM [HR].[dbo].[vw_LeaveCreditsV2] 
              WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
        FROM
            [UE database]..VacationSickLeave AS LI
        JOIN
            [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
        LEFT JOIN
            [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
        LEFT JOIN
            [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
        WHERE
          LI.cancelledStatusOrig = 'PendingLevel2'
          AND cancelledByLevel1DateTime IS NOT NULL
          AND cancelledByLevel2DateTime IS NULL
          AND cancelledStatusOrig IS NOT NULL 
          ${addtnlConditions2.length > 0 ? `AND (${addtnlConditions2.join(" OR ")})` : ""};
        `,
      addtnlConditionsArgs2,
    );
  }

  // if (userHasLevel1 && userHasLevel2) {
  //   return { lvl1Pending, lvl2Pending };
  // } else if (userHasLevel1 && !userHasLevel2) {
  //   return { lvl1Pending };
  // } else {
  //   return { lvl2Pending };
  // }

  let result = [];

  if (userHasLevel1) {
    result = result.concat(lvl1Pending);
  }

  if (userHasLevel2) {
    result = result.concat(lvl2Pending);
  }

  return result;

  // const getLvl = await sqlHelper.query(
  //   `SELECT
  //       code,
  //       lvl,
  //       deptCode
  //   FROM HR..Approvers
  //   ${sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND ") : ""}
  //   `,
  //   args
  // )

  // const userHasLevel1 = getLvl.some(entry => entry.lvl === 1);
  // const userHasLevel2 = getLvl.some(entry => entry.lvl === 2);

  // const level1DeptCodes = [...new Set(getLvl.filter(entry => entry.lvl === 1).map(entry => entry.deptCode))];
  // const level2DeptCodes = [...new Set(getLvl.filter(entry => entry.lvl === 2).map(entry => entry.deptCode))];

  // if (userHasLevel1 && userHasLevel2) {
  //   const lvl1Pending = await sqlHelper.query(
  //     `
  //     SELECT
  //         LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
  //         (SELECT SUM(debit - credit)
  //           FROM [HR].[dbo].[vw_LeaveCreditsV2]
  //           WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
  //     FROM
  //         [UE database]..VacationSickLeave AS LI
  //     JOIN
  //         [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
  //     LEFT JOIN
  //         [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
  //     LEFT JOIN
  //         [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
  //     WHERE LI.cancelledStatusOrig = ? AND cancelledByLevel1DateTime IS NULL AND cancelledByLevel2DateTime IS NULL AND UE.DeptCode IN (?)
  //     `,
  //     ['Pending', level1DeptCodes]
  //   );

  //   const lvl2Pending = await sqlHelper.query(
  //     `
  //     SELECT
  //         LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
  //         (SELECT SUM(debit - credit)
  //           FROM [HR].[dbo].[vw_LeaveCreditsV2]
  //           WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
  //     FROM
  //         [UE database]..VacationSickLeave AS LI
  //     JOIN
  //         [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
  //     LEFT JOIN
  //         [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
  //     LEFT JOIN
  //         [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
  //     WHERE LI.cancelledStatusOrig = ? AND cancelledByLevel1DateTime IS NOT NULL AND cancelledByLevel2DateTime IS NULL AND UE.DeptCode IN (?)
  //     `,
  //     ['PendingLevel2', level2DeptCodes]
  //   );

  //   return { lvl1Pending, lvl2Pending };

  // }

  // if(userHasLevel1 && !userHasLevel2) {
  //   const lvl1Pending = await sqlHelper.query(
  //     `
  //     SELECT
  //         LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
  //         (SELECT SUM(debit - credit)
  //           FROM [HR].[dbo].[vw_LeaveCreditsV2]
  //           WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
  //     FROM
  //         [UE database]..VacationSickLeave AS LI
  //     JOIN
  //         [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
  //     LEFT JOIN
  //         [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
  //     LEFT JOIN
  //         [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
  //     WHERE LI.cancelledStatusOrig = ? AND cancelledByLevel1DateTime IS NULL AND cancelledByLevel2DateTime IS NULL AND UE.DeptCode IN (?)
  //     `,
  //     ['Pending', level1DeptCodes]
  //   );

  //   return { lvl1Pending };
  // }

  // if(!userHasLevel1 && userHasLevel2) {
  //   const lvl2Pending = await sqlHelper.query(
  //     `
  //     SELECT
  //         LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.Deptcode, D.Description AS DeptDescription, DM.DESCRIPTION AS deptDescSecond,
  //         (SELECT SUM(debit - credit)
  //           FROM [HR].[dbo].[vw_LeaveCreditsV2]
  //           WHERE code = LI.IDCode AND leaveType = LI.leaveType) AS RemainingBalance
  //     FROM
  //         [UE database]..VacationSickLeave AS LI
  //     JOIN
  //         [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
  //     LEFT JOIN
  //         [UE database]..Department AS D ON UE.DeptCode = D.DeptCode
  //     LEFT JOIN
  //         [UERMMMC]..vw_Departments AS DM ON UE.DeptCode = COALESCE(DM.CODE, D.DeptCode)
  //     WHERE LI.cancelledStatusOrig = ? AND cancelledByLevel1DateTime IS NOT NULL AND cancelledByLevel2DateTime IS NULL AND UE.DeptCode IN (?)
  //     `,
  //     ['PendingLevel2', level2DeptCodes]
  //   );

  //   return { lvl2Pending };
  // }
};

const getApproversDetails = async (employeeId) => {
  // return await sqlHelper.query(
  //   `SELECT
  //       e.DeptCode,
  //       e.EmployeeCode,
  //       a.lvl,
  //       a.code AS approversCode,
  //       emp.FirstName,
  //       emp.MiddleInitial,
  //       emp.LastName
  //   FROM
  //       [UE database]..Employee e
  //   JOIN
  //       HR..Approvers a ON e.DeptCode = a.deptCode
  //   JOIN
  //       [UE database]..Employee emp ON a.code = emp.EmployeeCode
  //   ${sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND "): ""}
  //   GROUP BY
  //       e.DeptCode,
  //       e.EmployeeCode,
  //       a.lvl,
  //       a.code,
  //       emp.FirstName,
  //       emp.MiddleInitial,
  //       emp.LastName
  //   ORDER BY a.lvl, emp.LastName
  //   `,
  //   args
  // )
  // return await sqlHelper.query(
  //   `SELECT
  //         e.DeptCode,
  //         e.EmployeeCode,
  //         a.lvl,
  //         a.code AS approversCode,
  //         a.employeeCodes,
  //         emp.FirstName,
  //         emp.MiddleInitial,
  //         emp.LastName
  //     FROM
  //         [UE database]..Employee e
  //     JOIN
  //         HR..Approvers a ON e.DeptCode = a.deptCode AND a.deleted = 0
  //     JOIN
  //         [UE database]..Employee emp ON a.code = emp.EmployeeCode
  //     WHERE
  //         e.EmployeeCode = ?
  //         AND (
  //             ',' + a.employeeCodes + ',' LIKE '%,' + e.EmployeeCode + ',%'
  //             OR e.DeptCode = a.deptCode AND NOT EXISTS (
  //                 SELECT 1
  //                 FROM HR..Approvers a2
  //                 WHERE e.DeptCode = a2.deptCode
  //                 AND a2.deleted = 0
  //                 AND ',' + a2.employeeCodes + ',' LIKE '%,' + e.EmployeeCode + ',%'
  //             )
  //         )
  //     GROUP BY
  //         e.DeptCode,
  //         e.EmployeeCode,
  //         a.lvl,
  //         a.code,
  //         a.employeeCodes,
  //         emp.FirstName,
  //         emp.MiddleInitial,
  //         emp.LastName
  //     ORDER BY
  //         a.lvl,
  //         emp.LastName;
  //     `,
  //   [employeeId],
  // );

  return await sqlHelper.query(
    `WITH ApproverData AS (
        SELECT 
            e.DeptCode,
            e.EmployeeCode,
            a.lvl,
            a.code AS approversCode,
            a.employeeCodes,
            emp.FirstName,
            emp.MiddleInitial,
            emp.LastName,
            CASE 
                WHEN ',' + ISNULL(a.employeeCodes, '') + ',' LIKE '%,' + e.EmployeeCode + ',%' THEN 1
                ELSE 0
            END AS isDirectApprover
        FROM 
            [UE database]..Employee e
        JOIN
            HR..Approvers a ON e.DeptCode = a.deptCode AND a.deleted = 0
        JOIN
            [UE database]..Employee emp ON a.code = emp.EmployeeCode
        WHERE
            e.EmployeeCode = ?
    )
    SELECT 
        DeptCode,
        EmployeeCode,
        lvl,
        approversCode,
        employeeCodes,
        FirstName,
        MiddleInitial,
        LastName
    FROM ApproverData
    WHERE 
        isDirectApprover = 1
        OR (
            NOT EXISTS (
                SELECT 1 FROM ApproverData WHERE isDirectApprover = 1
            )
            AND employeeCodes IS NULL
        )
    ORDER BY lvl, LastName
      `,
    [employeeId],
  );
};

const getApprovedCancelLeaves = async (
  sqlWhereStrArr,
  args,
  sqlWhereStrArr2,
  args2,
) => {
  const leaveRequestsQuery = await sqlHelper.query(
    `
      SELECT 
          LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.DeptCode, s.DESCRIPTION deptDescription
      FROM 
          [UE database]..VacationSickLeave AS LI
      LEFT JOIN 
          [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
      LEFT JOIN 
        UERMMMC..SECTIONS s ON UE.DeptCode = s.CODE
      ${sqlWhereStrArr2.length > 0 ? `WHERE ${sqlWhereStrArr2.join(" AND ")}` : ""}
      `,
    args2,
  );

  const approverCodeQuery = await sqlHelper.query(
    `SELECT 
          code, 
          deptCode
      FROM 
          [HR]..Approvers
      ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""};
      `,
    args,
  );

  const filteredRejectedLeaves = leaveRequestsQuery.filter((leave) => {
    return approverCodeQuery.some(
      (approver) => approver.deptCode === leave.deptCode,
    );
  });

  return filteredRejectedLeaves;
};

const getRejectedCancelLeaves = async (
  sqlWhereStrArr,
  args,
  sqlWhereStrArr2,
  args2,
) => {
  const leaveRequestsQuery = await sqlHelper.query(
    `
    SELECT 
        LI.*, UE.FirstName, UE.LastName, UE.MiddleInitial, UE.DeptCode, s.DESCRIPTION deptDescription
    FROM 
        [UE database]..VacationSickLeave AS LI
    LEFT JOIN 
        [UE database]..Employee AS UE ON CONVERT(varchar(5), LI.IDCode) = UE.EmployeeCode
    LEFT JOIN 
        UERMMMC..SECTIONS s ON UE.DeptCode = s.CODE
    ${sqlWhereStrArr2.length > 0 ? `WHERE ${sqlWhereStrArr2.join(" AND ")}` : ""};
    `,
    args2,
  );

  const approverCodeQuery = await sqlHelper.query(
    `SELECT 
            code, 
            deptCode
        FROM 
            [HR]..Approvers
            ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""};
        `,
    args,
  );

  const filteredRejectedLeaves = leaveRequestsQuery.filter((leave) => {
    return approverCodeQuery.some(
      (approver) => approver.deptCode === leave.deptCode,
    );
  });

  return filteredRejectedLeaves;
};

const getLeaveTypes = async () => {
  return await sqlHelper.query(
    `SELECT leaveCode value, leaveDesc label
    FROM
      HR..[vw_LeaveTypes]
    `,
  );
};

const checkYearAttributedCancel = async (leaveId) => {
  return await sqlHelper.query(
    `SELECT YearAttributed year, Credit daysOfLeave
        FROM [UE database]..LeaveLedger
        WHERE ReferenceNo = ?
        `,
    [leaveId],
  );
};
const getEmployeeDetails = async (employeeId, activeStatus) => {
  const leaveLedgerDetails = await sqlHelper.query(
    `SELECT  
            l.leaveType, l.yearAttributed AS Year, SUM(debit - credit) AS remaining, EmployeeCode, 
            CONCAT(e.LastName, ', ', e.FirstName, ' ', CASE WHEN e.MiddleName IS NOT NULL THEN LEFT(e.MiddleName, 1) + '.' ELSE '' END) AS FullName,
            DeptDescr, Position
        FROM (
            SELECT 
                EmployeeCode, LastName, FirstName, MiddleName, DeptDescr, Position
            FROM [UE database]..[view_Employee]
            WHERE (EmployeeCode = ? OR LastName = ? OR FirstName = ?) AND IsActive = ?
        ) AS e
        JOIN 
            [HR].[dbo].[vw_LeaveCreditsV2] AS l ON e.EmployeeCode = l.Code
        JOIN 
            HR..vw_LeaveTypes AS vw ON l.LeaveType = vw.leaveCode
        GROUP BY 
            e.EmployeeCode, e.LastName, e.FirstName, e.MiddleName, l.leaveType, l.yearAttributed, vw.leaveDesc, e.DeptDescr, e.Position
        HAVING SUM(debit - credit) >= 0
        ORDER BY 
            l.leaveType, l.yearAttributed    
        `,
    [employeeId, employeeId, employeeId, activeStatus],
  );

  const leaveDetails = await sqlHelper.query(
    `SELECT 
            vsl.IDCode,
            vsl.TIME_FROM,
            vsl.TIME_TO,
            vsl.DateLeavedFrom,
            vsl.DateLeavedTo,
            vsl.TransDate,
            vsl.daysOfLeave,
            vsl.LeaveType,
            vsl.leaveId,
            vsl.status,
            vsl.reasonForLeave,
            vsl.DELETED,
            e.LastName,
            e.FirstName,
            e.MiddleInitial,
            CONCAT(e.LastName, ', ', e.FirstName, ' ', CASE WHEN e.MiddleName IS NOT NULL THEN LEFT(e.MiddleName, 1) + '.' ELSE '' END) AS FullName,
            e.DeptCode,
            d.DESCRIPTION,
            e.position,
            vsl.approvedByLevel1,
            vsl.approvedByLevel2,
            vsl.cancelledStatusOrig,
            vsl.cancelledByLevel2,
            vsl.cancelledByLevel1,
            vsl.reasonForRejection,
            vsl.reasonForCancel
        FROM 
            [UE database]..VacationSickLeave AS vsl
        JOIN 
            [UE database]..Employee AS e ON vsl.IDCode = e.EmployeeCode
        LEFT JOIN
			      UERMMMC..vw_Departments d ON e.DeptCode = d.CODE
        WHERE (e.EmployeeCode = ? OR e.LastName = ? OR e.FirstName = ?) 
            AND e.IsActive = ?
            AND YEAR(TransDate) BETWEEN (YEAR(GETDATE()) - 3) AND YEAR(GETDATE())
            AND vsl.TIME_FROM IS NOT NULL
            AND vsl.TIME_TO IS NOT NULL
            AND vsl.DateLeavedFrom IS NOT NULL
            AND vsl.DateLeavedTo IS NOT NULL
            AND vsl.status IS NOT NULL
            AND vsl.DELETED = 0

        UNION ALL

        SELECT 
            'TempLeave' AS IDCode,
            tl.TIME_FROM AS TIME_FROM,
            tl.TIME_TO AS TIME_TO,
            tl.DATE_FROM AS DateLeavedFrom,
            tl.DATE_TO AS DateLeavedTo,
            tl.DateCreated AS TransDate,
            tl.LEAVE_DAYS AS daysOfLeave,
            tl.LEAVE_TYPE AS leaveType,
            tl.id AS leaveId,
            CASE 
                WHEN UPPER(tl.[LEAVE STATUS]) = 'PENDING' THEN 'Pending'
            WHEN UPPER(tl.[LEAVE STATUS]) = 'ACCEPTED' THEN 'Approved'
                ELSE tl.[LEAVE STATUS]
            END AS status,
            tl.REASON AS reasonForLeave,
            tl.DELETED AS DELETED,
            e.LastName AS LastName,
            e.FirstName AS FirstName,
            e.MiddleInitial AS MiddleInitial,
            CONCAT(e.LastName, ', ', e.FirstName, ' ', CASE WHEN e.MiddleName IS NOT NULL THEN LEFT(e.MiddleName, 1) + '.' ELSE '' END) AS FullName,
            e.DeptCode AS DeptCode,
            d.DESCRIPTION,
            e.position,
            NULL AS approvedByLevel1,
            NULL AS approvedByLevel2,
            NULL AS cancelledStatusOrig,
            NULL AS cancelledByLevel2,
            NULL AS cancelledByLevel1,
            NULL AS reasonForRejection,
            NULL AS reasonForCancel
        FROM 
            [UERMATT]..[TempLeave] tl
        JOIN 
            [UE database]..Employee AS e ON tl.CODE = e.EmployeeCode
        LEFT JOIN
			      UERMMMC..vw_Departments d ON e.EmployeeCode = d.CODE
        WHERE 
            tl.CODE = ?
            AND YEAR(DateCreated) BETWEEN (YEAR(GETDATE()) - 3) AND YEAR(GETDATE())
            AND tl.[LEAVE STATUS] IS NOT NULL
            AND [LEAVE STATUS] NOT IN ('CANCELLED', 'DELETED', 'PENDING')
        ORDER BY TransDate DESC
        `,
    [employeeId, employeeId, employeeId, activeStatus, employeeId],
  );

  // const leaveDetails = await sqlHelper.query(
  //     `SELECT
  //         vsl.*, e.EmployeeCode, e.LastName, e.FirstName, e.MiddleName, e.DeptCode
  //     FROM
  //         [UE database]..[view_Employee] e
  //     JOIN
  //         [UE database]..VacationSickLeave vsl ON e.EmployeeCode = vsl.IDCode
  //     WHERE (e.EmployeeCode = ? OR e.LastName = ? OR e.FirstName = ?)
  //         AND e.IsActive = ?
  //         AND vsl.TIME_FROM IS NOT NULL
  //         AND vsl.TIME_TO IS NOT NULL
  //         AND vsl.DateLeavedFrom IS NOT NULL
  //         AND vsl.DateLeavedTo IS NOT NULL
  //         AND vsl.status IS NOT NULL
  //         AND vsl.DELETED = 0
  //     `,
  //     [employeeId, employeeId, employeeId, activeStatus]
  //   )

  return { leaveLedgerDetails, leaveDetails };
};

const getPendingDetailsApproversEmail = async (
  statusPending,
  statusPending2,
) => {
  const requestDetailsLevel1 = await sqlHelper.query(
    `SELECT 
            DISTINCT hr.code, hr.lvl, e.DEPT_CODE, vsl.leaveId, vsl.IDCode, vsl.status, e2.UERMEmail approverEmail, e2.FULLNAME, hr.employeeCodes
        FROM 
            [UE database]..VacationSickLeave vsl
        LEFT JOIN 
            [UE database]..vw_Employees e ON vsl.IDCode = e.CODE
        LEFT JOIN 
            HR..Approvers hr ON e.DEPT_CODE = hr.DeptCode
        LEFT JOIN 
            [UE database]..vw_Employees e2 ON hr.code = e2.CODE
        WHERE 
            vsl.status = ? and hr.deleted != 1
            AND (CHARINDEX(CAST(vsl.IDCode AS NVARCHAR(255)), hr.employeeCodes) > 0 OR e.DEPT_CODE = hr.deptCode)   
            AND hr.lvl = 1
        `,
    [statusPending],
  );

  const requestDetailsLevel2 = await sqlHelper.query(
    `SELECT 
            DISTINCT hr.code, hr.lvl, e.DEPT_CODE, vsl.leaveId, vsl.IDCode, vsl.status, e2.UERMEmail approverEmail, e2.FULLNAME, hr.employeeCodes
        FROM 
            [UE database]..VacationSickLeave vsl
        LEFT JOIN 
            [UE database]..vw_Employees e ON vsl.IDCode = e.CODE
        LEFT JOIN 
            HR..Approvers hr ON e.DEPT_CODE = hr.DeptCode
        LEFT JOIN 
            [UE database]..vw_Employees e2 ON hr.code = e2.CODE
        WHERE 
            vsl.status = ? and hr.deleted != 1
            AND (CHARINDEX(CAST(vsl.IDCode AS NVARCHAR(255)), hr.employeeCodes) > 0 OR e.DEPT_CODE = hr.deptCode) 
            AND hr.lvl = 2
        `,
    [statusPending2],
  );

  const canceledDetailsLevel1 = await sqlHelper.query(
    `SELECT 
            DISTINCT hr.code, hr.lvl, e.DEPT_CODE, vsl.leaveId, vsl.IDCode, vsl.status, e2.UERMEmail approverEmail, e2.FULLNAME, hr.employeeCodes
        FROM 
            [UE database]..VacationSickLeave vsl
        LEFT JOIN 
            [UE database]..vw_Employees e ON vsl.IDCode = e.CODE
        LEFT JOIN 
            HR..Approvers hr ON e.DEPT_CODE = hr.DeptCode
        LEFT JOIN 
            [UE database]..vw_Employees e2 ON hr.code = e2.CODE
        WHERE 
            vsl.cancelledStatusOrig = ? and hr.deleted != 1
            AND (CHARINDEX(CAST(vsl.IDCode AS NVARCHAR(255)), hr.employeeCodes) > 0 OR e.DEPT_CODE = hr.deptCode) 
            AND hr.lvl = 1
        `,
    [statusPending],
  );

  const canceledDetailsLevel2 = await sqlHelper.query(
    `SELECT 
            DISTINCT hr.code, hr.lvl, e.DEPT_CODE, vsl.leaveId, vsl.IDCode, vsl.status, e2.UERMEmail approverEmail, e2.FULLNAME, hr.employeeCodes
        FROM 
            [UE database]..VacationSickLeave vsl
        LEFT JOIN 
            [UE database]..vw_Employees e ON vsl.IDCode = e.CODE
        LEFT JOIN 
            HR..Approvers hr ON e.DEPT_CODE = hr.DeptCode
        LEFT JOIN 
            [UE database]..vw_Employees e2 ON hr.code = e2.CODE
        WHERE 
            vsl.cancelledStatusOrig = ? and hr.deleted != 1
            AND (CHARINDEX(CAST(vsl.IDCode AS NVARCHAR(255)), hr.employeeCodes) > 0 OR e.DEPT_CODE = hr.deptCode) 
            AND hr.lvl = 2
        `,
    [statusPending2],
  );

  return {
    requestDetailsLevel1,
    requestDetailsLevel2,
    canceledDetailsLevel1,
    canceledDetailsLevel2,
  };

  // const requestDetails = await sqlHelper.query(
  //   `SELECT DISTINCT hr.code, hr.lvl, e.DEPT_CODE, vsl.leaveId, vsl.status, e2.UERMEmail approverEmail, e2.FULLNAME
  //   FROM
  //       [UE database]..VacationSickLeave vsl
  //   JOIN
  //       [UE database]..vw_Employees e ON vsl.IDCode = e.CODE
  //   JOIN
  //       HR..Approvers hr ON e.DEPT_CODE = hr.DeptCode
  //   JOIN
  //       [UE database]..vw_Employees e2 ON hr.code = e2.CODE
  //   WHERE
  //       (vsl.status = ? AND hr.lvl != ?)
  //       OR
  //       (vsl.status = ? AND hr.lvl = ?)
  //   `,
  //   [statusPending, level2, statusPending2, level2]
  // )

  // const canceledDetails = await sqlHelper.query(
  //   `SELECT DISTINCT hr.code, hr.lvl, e.DEPT_CODE, vsl.leaveId, vsl.status, e2.UERMEmail approverEmail
  //   FROM
  //       [UE database]..VacationSickLeave vsl
  //   JOIN
  //       [UE database]..vw_Employees e ON vsl.IDCode = e.CODE
  //   JOIN
  //       HR..Approvers hr ON e.DEPT_CODE = hr.DeptCode
  //   JOIN
  //       [UE database]..vw_Employees e2 ON hr.code = e2.CODE
  //   WHERE
  //       (vsl.cancelledStatusOrig = ? AND hr.lvl != ?)
  //       OR
  //       (vsl.cancelledStatusOrig = ? AND hr.lvl = ?)
  //   `,
  //   [statusPending, level2, statusPending2, level2]
  // )

  // return { requestDetails, canceledDetails}
};

const getPendingDetailsCanceledEmail = async (
  statusPending,
  statusPending2,
  level2,
) => {
  return await sqlHelper.query(
    `SELECT DISTINCT hr.code, hr.lvl, e.DEPT_CODE, vsl.leaveId, vsl.status, e2.UERMEmail approverEmail
        FROM 
            [UE database]..VacationSickLeave vsl
        JOIN 
            [UE database]..vw_Employees e ON vsl.IDCode = e.CODE
        JOIN 
            HR..Approvers hr ON e.DEPT_CODE = hr.DeptCode
        JOIN 
            [UE database]..vw_Employees e2 ON hr.code = e2.CODE
        WHERE 
            (vsl.cancelledStatusOrig = ? AND hr.lvl != ?)
            OR 
            (vsl.cancelledStatusOrig = ? AND hr.lvl = ?)
        `,
    [statusPending, level2, statusPending2, level2],
  );
};

const checkDateOfLeaveOverlap = async (
  employeeID,
  dateFrom,
  dateTo,
  request,
) => {
  const statusFilter = request
    ? `('CANCELLED', 'RejectedByLevel1', 'RejectedByLevel2')`
    : `('CANCELLED', 'RejectedByLevel1', 'RejectedByLevel2', 'Pending', 'PendingLevel2')`;

  const query = `
    SELECT *
    FROM [UE database]..VacationSickLeave
    WHERE
        (DateLeavedFrom BETWEEN ? AND ?)
        AND (DateLeavedTo BETWEEN ? AND ?)
        AND IDCode = ?
        AND (status NOT IN ${statusFilter})
    ORDER BY RecNo DESC
  `;

  return await sqlHelper.query(query, [
    dateFrom,
    dateTo,
    dateFrom,
    dateTo,
    employeeID,
  ]);
};

const checkSchedule = async (date) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
        [UE database]..jom_HRMS_Calendar
    WHERE
        DATE = ?
    `,
    [date],
  );
};

const getApproverWithEmployees = async () => {
  return await sqlHelper.query(
    `SELECT 
        a.code, 
        e.FULLNAME AS approverName, 
        e.DEPT_DESC AS approverDeptDescription, 
        e.DEPT_CODE AS approverDeptCode, 
        e.POS_DESC AS approverPosition, 
        a.lvl, 
        a.deptCode, 
        d.DESCRIPTION AS deptDescription, 
        a.employeeCodes 
    FROM HR..Approvers a
    LEFT JOIN UERMMMC..vw_Departments d 
        ON a.deptCode = d.CODE
    LEFT JOIN [UE database]..vw_Employees e 
        ON a.code = e.CODE
    WHERE a.deleted = 0 
    AND e.FULLNAME IS NOT NULL  
    ORDER BY e.FULLNAME;
    `,
  );
};

const getEmployeeToApproveDetails = async (employeeCodes) => {
  const placeholders = employeeCodes.map(() => "?").join(",");
  return await sqlHelper.query(
    `SELECT CODE code, Name fullName, POS_DESC position 
    FROM [UE database]..vw_Employees
    WHERE CODE IN (${placeholders})`,
    employeeCodes,
  );
};

const getDetailsEmployeeCodes = async (
  approverCode,
  employeeCode,
  lvl,
  deptCode,
) => {
  return await sqlHelper.query(
    `SELECT * FROM HR..Approvers
    WHERE code = ? 
    AND deptCode = ? 
    AND lvl = ?
    AND employeeCodes LIKE '%' + ? + '%'`,
    [approverCode, deptCode, lvl, employeeCode],
  );
};

const updateEmployeeToApprove = async (
  item,
  condition,
  txn,
  updateDateTimeField,
) => {
  return await sqlHelper.update(
    "HR..Approvers",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const getActiveEmployees = async (deptCode) => {
  return await sqlHelper.query(
    `SELECT CODE employeeCode, FULLNAME fullName, DEPT_CODE deptCode, DEPT_DESC deptDescription, POS_CODE posCode, POS_DESC position
    FROM [UE database]..vw_Employees
    WHERE DEPT_CODE = ? and IS_ACTIVE = 1 
    `,
    [deptCode],
  );
};

const getAllDepartment = async () => {
  return await sqlHelper.query(
    `SELECT CODE deptCode, DESCRIPTION description
    FROM UERMMMC..vw_Departments
    WHERE DELETED = 0 AND DESCRIPTION NOT LIKE '%INACTIVE%'
    `,
  );
};

const getHRApproveDetails = async (
  approverCode,
  deptCode,
  lvl,
  employeeCode,
  activeEmployee,
  byEmployeeCodes,
) => {
  if (activeEmployee === true && byEmployeeCodes === false) {
    return await sqlHelper.query(
      `SELECT * 
      FROM HR..Approvers
      WHERE code= ? and deptCode = ? AND deleted = 0
      `,
      [approverCode, deptCode],
    );
  }

  if (byEmployeeCodes === true && activeEmployee === false) {
    return await sqlHelper.query(
      `SELECT * FROM HR..Approvers
      WHERE code = ? 
      AND deleted = 0
      AND deptCode = ? 
      AND lvl = ?
      AND employeeCodes LIKE '%' + ? + '%'`,
      [approverCode, deptCode, lvl, employeeCode],
    );
  }

  if (activeEmployee === false && byEmployeeCodes === false) {
    return await sqlHelper.query(
      `SELECT * 
      FROM HR..Approvers
      WHERE code= ? and deptCode = ? AND lvl = ? AND deleted = 0
      `,
      [approverCode, deptCode, lvl],
    );
  }
};

const insertHrApprover = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "HR..Approvers",
    item,
    txn,
    creationDateTimeField,
  );
};

const removingApproverDepartment = async (
  item,
  condition,
  txn,
  updateDateTimeField,
) => {
  return await sqlHelper.update(
    "HR..Approvers",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const checkApproverInApprovers = async (approverCode, deptCode, lvl) => {
  return await sqlHelper.query(
    `SELECT *
    FROM HR..Approvers
    WHERE code = ? AND deptCode = ? AND lvl = ?
    `,
    [approverCode, deptCode, lvl],
  );
};

const runSp = async (fromDate, toDate) => {
  return await sqlHelper.query(
    `EXEC [UE database]..ProcessLeaveApprovedButNotInLeaveLedger ?, ?
    `,
    [fromDate, toDate],
  );
};

const checkAccess = async (approverCode) => {
  return await sqlHelper.query(
    `SELECT *
		FROM ITMgt..UserAccess
		WHERE systemName = 'Employee Portal' and code = ? and moduleName = 'Leave Approver'
		and deleteDate is null
    `,
    [approverCode],
  );
};

const insertAccessRight = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "ITMgt..UserAccess",
    item,
    txn,
    creationDateTimeField,
  );
};

module.exports = {
  calculateTotalLeaveValue,
  calculateTotalLeaveValueInEdit,
  createLeaveRequest,
  getLeaveDetails,
  getLeaveBalance,
  getUserLeaveBalanceDetails,
  getLeaveLedger,
  getApprovedLeaves,
  getRejectedLeaves,
  deleteLeave,
  updateLeaveAction,
  updateAndValidateLeave,
  generateLeaveId,
  checkLevelStatus,
  getInfoAction,
  insertLeaveLedger,
  getLedgerId,
  updateLegerIdVSL,
  getLeaveIdDetails,
  getAttributedYear,
  getSchedule,
  verifyLevel,
  // verifyLevelCreate,
  getUserApprovedLeaves,
  getUserRejectedLeaves,
  pendingLeaveTypeBalance,
  cancelLeave,
  getCancelPending,
  getApproversDetails,
  checkLevelStatusCancel,
  getUserCancelApprovedLeaves,
  getUserCancelRejectedLeaves,
  getApprovedCancelLeaves,
  getRejectedCancelLeaves,
  getLeaveTypes,
  checkYearAttributedCancel,
  getEmployeeDetails,
  getPendingDetailsApproversEmail,
  getPendingDetailsCanceledEmail,
  checkEmployeeToApprove,
  getPendingLeavesByEmployee,
  verifyLevelHasOneTWO,
  verifyLevelCreate,
  checkDateOfLeaveOverlap,
  checkSchedule,
  getApproverWithEmployees,
  getEmployeeToApproveDetails,
  getDetailsEmployeeCodes,
  updateEmployeeToApprove,
  getActiveEmployees,
  getAllDepartment,
  getHRApproveDetails,
  insertHrApprover,
  removingApproverDepartment,
  checkApproverInApprovers,
  runSp,
  checkAccess,
  insertAccessRight,
};

const sqlHelper = require("../../../helpers/sql");

const getSubjectCode = async (semester) => {
  return await sqlHelper.query(
    `SELECT 
        DISTINCT so.SubjectCode, 
        so.semester, 
        sm.Description description,
        so.SubjectCode + ' - ' + TRIM(sm.Description) 
        subjectCodeDescription  
    FROM 
        [UE database]..[Subject Offered] so
		LEFT JOIN 
        [UE database]..[Subject Masterfile] sm ON so.SubjectCode = sm.SubjectCode
		WHERE semester = ?
		ORDER BY semester, sm.Description ASC
    `,
    [semester],
  );
};

const getRoomDesignation = async (roomType, capacity, department) => {
  // SELECT *
  //     FROM (
  //         SELECT *,
  //               ROW_NUMBER() OVER (ORDER BY CASE WHEN TRY_CAST(Capacity AS INT) = ? THEN 1 ELSE 2 END, Capacity) AS rn
  //         FROM RoomMgt..Rooms
  //         WHERE RoomTypeCodes LIKE '%' + ? + '%'
  //           AND TRY_CAST(Capacity AS INT) >= ?
  //           AND (DepartmentCode LIKE ? OR DepartmentCode IS NULL)
  //     ) AS subquery
  //     ORDER BY rn;

  if (roomType === "LAB") {
    return await sqlHelper.query(
      `SELECT *
      FROM (
          SELECT *,
                ROW_NUMBER() OVER (ORDER BY CASE WHEN TRY_CAST(Capacity AS INT) = ? THEN 1
                WHEN Capacity IS NULL THEN 2
                ELSE 3 END, Capacity) AS rn
          FROM RoomMgt..Rooms
                WHERE RoomTypeCodes LIKE '%' + ? + '%'
            AND (TRY_CAST(Capacity AS INT) >= ? OR Capacity IS NULL)
            AND (DepartmentCode LIKE ? OR DepartmentCode IS NULL)
      ) AS subquery
      ORDER BY rn;
      `,
      [capacity, roomType, capacity, department],
    );
  }

  return await sqlHelper.query(
    `SELECT *
    FROM (
        SELECT *,
              ROW_NUMBER() OVER (
                  ORDER BY CASE WHEN TRY_CAST(Capacity AS INT) = ? THEN 1 WHEN Capacity IS NULL THEN 2 ELSE 3 END, Capacity
              ) AS rn
        FROM RoomMgt..Rooms
        WHERE RoomTypeCodes LIKE '%' + ? + '%'
          AND (TRY_CAST(Capacity AS INT) >= ? OR Capacity IS NULL)
    ) AS subquery
    ORDER BY rn;
    `,
    [capacity, roomType, capacity],
  );
};

// const addSchedule = async (item, txn, creationDateTimeField) => {
//   return await sqlHelper.insert(
//     "RoomMgt..RoomSchedules",
//     item,
//     txn,
//     creationDateTimeField,
//   );
// };

const getAllRoom = async (fromDate, toDate) => {
  // const isSingleDay = fromDate === toDate;

  // const query = `
  //   SELECT
  //     R.Id AS RoomId,
  //     R.Name AS RoomName,
  //     R.Description AS roomTypeDescription,
  //     R.RoomTypeCodes roomType,
  //     B.description building,
  //     RS.FromDate,
  //     RS.ToDate,
  //     RS.Days,
  //     RS.Intervals,
  //     RS.SubjectCode,
  //     RS.Section,
  //     RS.Professor
  //   FROM
  //     RoomMgt..Rooms R
  //   LEFT JOIN
  //     RoomMgt..RoomSchedules RS ON R.Id = RS.RoomId
  //   LEFT JOIN
  //     RoomMgt..Buildings B on R.BldgCode = B.code
  //   WHERE ((RS.FromDate BETWEEN ? AND ?)
  //   OR (RS.ToDate BETWEEN ? AND ?)
  //   OR (RS.FromDate <= ? AND RS.ToDate >= ?)
  //   OR (RS.FromDate <= ? AND RS.ToDate <= ?)
  //   OR (RS.FromDate >= ? AND RS.ToDate >= ?)
  //   OR RS.FromDate IS NULL
  //   OR RS.ToDate IS NULL)
  //   ORDER BY
  //     R.Id, RS.FromDate
  // `;

  // if (isSingleDay) {
  //   query += `
  //     (RS.FromDate <= ? AND RS.ToDate >= ?)
  //     OR RS.FromDate IS NULL
  //     OR RS.ToDate IS NULL
  //   `;
  // } else {
  //   query += `
  //     (RS.FromDate BETWEEN ? AND ?)
  //   OR (RS.ToDate BETWEEN ? AND ?)
  //   OR (RS.FromDate <= ? AND RS.ToDate >= ?)
  //   OR (RS.FromDate <= ? AND RS.ToDate <= ?)
  //   OR (RS.FromDate >= ? AND RS.ToDate >= ?)
  //   OR RS.FromDate IS NULL
  //   OR RS.ToDate IS NULL
  //   `;
  // }

  // query += `
  //     ((RS.FromDate BETWEEN ? AND ?)
  //   OR (RS.ToDate BETWEEN ? AND ?)
  //   OR (RS.FromDate <= ? AND RS.ToDate >= ?)
  //   OR (RS.FromDate <= ? AND RS.ToDate <= ?)
  //   OR (RS.FromDate >= ? AND RS.ToDate >= ?)
  //   OR RS.FromDate IS NULL
  //   OR RS.ToDate IS NULL)
  // `;

  // query += `
  //   ORDER BY
  //     R.Id, RS.FromDate
  // `;

  const params = [fromDate, toDate, fromDate, toDate];

  return await sqlHelper.query(
    `SELECT 
        R.Id AS roomId,
        R.Name AS roomName,
        R.Description AS roomTypeDescription,
        R.RoomTypeCodes AS roomType,
        B.description AS building,
        RS.FromDate,
        RS.ToDate,
        RS.Days,
        RS.Intervals,
        RS.SubjectCode,
        RS.Section,
        RS.Professor,
        R.Capacity,
        RS.Active
    FROM 
        RoomMgt..Rooms R
    LEFT JOIN 
        RoomMgt..RoomSchedules RS 
        ON R.Id = RS.RoomId
        AND (
            (RS.FromDate BETWEEN ? AND ?)
            OR (RS.FromDate <= ? AND RS.ToDate >= ?)
            OR RS.FromDate IS NULL
            OR RS.ToDate IS NULL
        )
        AND RS.Active = 1
    LEFT JOIN
        RoomMgt..Buildings B 
        ON R.BldgCode = B.code
    ORDER BY 
        R.Name ASC;
    `,
    params,
  );

  // return await sqlHelper.query(
  //   `
  //   SELECT
  //     R.Id AS RoomId,
  //     R.Name AS RoomName,
  //     R.Description AS roomTypeDescription,
  //     R.RoomTypeCodes roomType,
  //     B.description building,
  //     RS.FromDate,
  //     RS.ToDate,
  //     RS.Days,
  //     RS.Intervals,
  //     RS.SubjectCode,
  //     RS.Section,
  //     RS.Professor,
  //     r.Capacity
  //   FROM
  //     RoomMgt..Rooms R
  //   LEFT JOIN
  //     RoomMgt..RoomSchedules RS ON R.Id = RS.RoomId
  //   LEFT JOIN
  //     RoomMgt..Buildings B on R.BldgCode = B.code
  //   WHERE ((RS.FromDate BETWEEN ? AND ?)
  //   OR (RS.FromDate <= ? AND RS.ToDate >= ?)
  //   OR RS.FromDate IS NULL
  //   OR RS.ToDate IS NULL)
  //   AND RS.Active = 1
  //   ORDER BY
  //     R.Id, RS.FromDate
  // `,
  //   params,
  // );
};

const bookedRooms = async () => {
  return await sqlHelper.query(
    `SELECT 
        rs.roomId, 
        rs.FromDate, 
        rs.ToDate, 
        rs.Days, 
        rs.Intervals,
        rs.SubjectCode, 
        sm.Description AS SubjectDescription, 
        rs.Section, 
        rs.Professor, 
        rs.Remarks, 
        r.Name AS RoomName, 
        r.RoomTypeCodes, 
        r.Description AS RoomDescription, 
        b.description AS BuildingDescription, 
        rs.DepartmentCode DeptCode,
		    d.DESCRIPTION DeptLabel,
        r.Floor,
        r.DateTimeCreated,
        rs.Active
    FROM 
        RoomMgt..RoomSchedules rs
    LEFT JOIN 
        RoomMgt..Rooms r ON rs.RoomId = r.Id
    LEFT JOIN 
        RoomMgt..Buildings b ON r.BldgCode = b.code
    LEFT JOIN
        UERMMMC..vw_Departments d ON rs.DepartmentCode = d.CODE
    LEFT JOIN 
        [UE database]..[Subject Masterfile] sm ON rs.SubjectCode = sm.SubjectCode
    WHERE
        rs.Active = 1
    ORDER 
        BY rs.DateTimeCreated DESC
    `,
  );
};

const bookedRoomsByEmployeeCode = async (employeeCode) => {
  return await sqlHelper.query(
    `SELECT 
        rs.id,
        rs.roomId, 
        rs.FromDate, 
        rs.ToDate, 
        rs.Days, 
        rs.Intervals,
        rs.SubjectCode, 
        sm.Description AS SubjectDescription, 
        rs.Section, 
        rs.Professor, 
        rs.Remarks, 
        r.Name AS RoomName, 
        r.RoomTypeCodes, 
        r.Description AS RoomDescription, 
        b.description AS BuildingDescription, 
        rs.DepartmentCode DeptCode,
        r.Floor,
        r.DateTimeCreated,
        rs.Active
    FROM 
        RoomMgt..RoomSchedules rs
    LEFT JOIN 
        RoomMgt..Rooms r ON rs.RoomId = r.Id
    LEFT JOIN 
        RoomMgt..Buildings b ON r.BldgCode = b.code
    LEFT JOIN
        UERMMMC..vw_Departments d ON rs.DepartmentCode = d.CODE
    LEFT JOIN 
        [UE database]..[Subject Masterfile] sm ON rs.SubjectCode = sm.SubjectCode
    WHERE 
        rs.CreatedBy = ? 
    ORDER 
        BY rs.DateTimeUpdated DESC
    `,
    [employeeCode],
  );
};

const getSections = async (semester, subjectCode) => {
  // const semester = await sqlHelper.query(
  //   `SELECT
  //       semester
  //   FROM
  //       [UE database]..ConfigBySem
  //   WHERE
  //       semester LIKE ?
  //       AND IsactiveSemester = 1
  //   ORDER BY semester DESC
  //   `,
  //   [`%${currentYear}%`],
  // );

  // const semestersStr = semester.map((item) => item.semester);
  // const placeHolder = semestersStr.map(() => "?").join(", ");

  return await sqlHelper.query(
    `SELECT
        section, TRIM(section) + ' - ' + TRIM(semester) as secsem
    FROM
        [UE database]..[Subject Offered]
    WHERE
        SubjectCode = ? AND semester = ?
    ORDER BY
        semester DESC`,
    [subjectCode, semester],
  );
};

const getIntervals = async (roomIds) => {
  return await sqlHelper.query(
    `SELECT 
        R.Id AS RoomId,
        R.Name AS RoomName,
        R.Description AS roomTypeDescription,
        R.RoomTypeCodes roomType,
        B.description building,
        RS.FromDate,
        RS.ToDate,
        RS.Days,
        RS.Intervals,
        RS.SubjectCode,
        RS.Section,
        RS.Professor
        RS.Active
    FROM 
        RoomMgt..Rooms R
    LEFT JOIN 
        RoomMgt..RoomSchedules RS ON R.Id = RS.RoomId
    LEFT JOIN
        RoomMgt..Buildings B on R.BldgCode = B.code
    WHERE
        RS.RoomId IN (?)
    ORDER BY 
        R.Id, RS.FromDate
    `,
    [roomIds],
  );
};

const selectSchedules = async (roomId) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
        RoomMgt..RoomSchedules
    WHERE RoomId = ? AND Active = 1
    `,
    [roomId],
  );
};

const getSemester = async () => {
  // return await sqlHelper.query(
  //   `SELECT
  //     RIGHT(c.semester,1) SEM_CODE,
  //     case
  //       when RIGHT(c.semester,1) = 1 then 'FIRST SEMESTER'
  //       when RIGHT(c.semester,1) = 2 then 'SECOND SEMESTER'
  //       when RIGHT(c.semester,1) = 3 then 'FIRST TRIMESTER'
  //       when RIGHT(c.semester,1) = 4 then 'SECOND TRIMESTER'
  //       when RIGHT(c.semester,1) = 5 then 'THIRD TRIMESTER'
  //       when RIGHT(c.semester,1) = 0 then 'SUMMER'
  //     end SEM_DESC,
  //     LEFT(c.semester,4) SEM_YEAR_FROM,
  //     LEFT(c.semester,4)+1 SEM_YEAR_TO,
  //     case
  //       when RIGHT(c.semester,1) in ('3','4','5') then 'TRIMESTRAL'
  //       else 'SEMESTRAL'
  //     end SEMTRI
  //   FROM [UE database]..ConfigBySem c
  //   WHERE c.ForAdmission = 1
  //   `,
  // );
  return await sqlHelper.query(
    `SELECT
		    c.semester,
        RIGHT(c.semester, 1) AS semCode,
        CASE 
            WHEN RIGHT(c.semester, 1) = '1' THEN 'FIRST SEMESTER'
            WHEN RIGHT(c.semester, 1) = '2' THEN 'SECOND SEMESTER'
            WHEN RIGHT(c.semester, 1) = '3' THEN 'FIRST TRIMESTER'
            WHEN RIGHT(c.semester, 1) = '4' THEN 'SECOND TRIMESTER'
            WHEN RIGHT(c.semester, 1) = '5' THEN 'THIRD TRIMESTER'
            WHEN RIGHT(c.semester, 1) = '0' THEN 'SUMMER'
        END AS semDesc,
        LEFT(c.semester, 4) AS semYearFrom,
        LEFT(c.semester, 4) + 1 AS semYearTo,
        CASE 
            WHEN RIGHT(c.semester, 1) IN ('3', '4', '5') THEN 'TRIMESTRAL'
            ELSE 'SEMESTRAL'
        END AS semester,
        CASE 
            WHEN RIGHT(c.semester, 1) = '1' THEN 'FIRST SEMESTER'
            WHEN RIGHT(c.semester, 1) = '2' THEN 'SECOND SEMESTER'
            WHEN RIGHT(c.semester, 1) = '3' THEN 'FIRST TRIMESTER'
            WHEN RIGHT(c.semester, 1) = '4' THEN 'SECOND TRIMESTER'
            WHEN RIGHT(c.semester, 1) = '5' THEN 'THIRD TRIMESTER'
            WHEN RIGHT(c.semester, 1) = '0' THEN 'SUMMER'
        END + ' ' + LEFT(c.semester, 4) + '-' + CAST(LEFT(c.semester, 4) + 1 AS NVARCHAR) AS semYear
    FROM 
        [UE database]..ConfigBySem c
    ORDER BY 
        c.semester DESC;
    `,
  );
};

const checkRoom = async (roomId) => {
  return await sqlHelper.query(
    `SELECT *
    FROM RoomMgt..Rooms
    WHERE Id = ?
    `,
    [roomId],
  );
};

const bookedRoomsView = async (
  room,
  department,
  building,
  fromDate,
  toDate,
) => {
  return await sqlHelper.query(
    `EXEC RoomMgt..SPRoomSchedulesV2 ?, ?, ?, ?, ?`,
    [room, department, building, fromDate, toDate],
  );
};

const ConTrial = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "RoomMgt..RoomSchedules",
    item,
    txn,
    creationDateTimeField,
  );
};

const getAllRoomsForReport = async () => {
  return await sqlHelper.query(
    `SELECT 
    r.Id, r.Name roomName, r.BldgCode, b.Description buildingDescription, (r.name + ' - ' + b.Description) roomNameWithBuilding
    FROM RoomMgt..Rooms r
    LEFT JOIN RoomMgt..Buildings b ON r.BldgCode = b.Code
    `,
  );
};

const checkStatus = async () => {
  return await sqlHelper.query(
    `SELECT *
    FROM RoomMgt..RoomSchedules
    WHERE Active = 1
    `,
  );
};

const updateStatus = async (item, condition, txn, updateDate) => {
  return await sqlHelper.update(
    "RoomMgt..RoomSchedules",
    item,
    condition,
    txn,
    updateDate,
  );
};

const cancelSchedule = async (item, condition, txn, updateDate) => {
  return await sqlHelper.update(
    "RoomMgt..RoomSchedules",
    item,
    condition,
    txn,
    updateDate,
  );
};

const insertManualData = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "RoomMgt..RoomSchedules",
    item,
    txn,
    creationDateTimeField,
  );
};

const getGenEdSched = async () => {
  // return await sqlHelper.query(
  //   `SELECT
  //     semester,
  //     SubjectCode,
  //     section,
  //     limit,
  //     SubjectOfferedTo,
  //     YearLevel,
  //     roomTypeCodes = '',
  //     intervals = '',
  //     days = '',
  //     hours = 3
  //   FROM
  //     [UE database]..[Subject Offered]
  //   WHERE
  //     semester = '20251'
  //     AND SubjectCode IN (
  //       'ART', 'GECE3', 'ENSCIE3', 'ETHICS', 'ELEC1P',
  //       'PSYCHO1P', 'RIZAL1PT', 'LOGIC1N', 'NSTP1', 'MATHMW',
  //       'PLITE2', 'RPH', 'PCOM', 'MT1D', 'TCW', 'PATHFIT1', 'PATHFIT2', 'PATHFIT3', 'PATHFIT4'
  //     )
  //   ORDER BY
  //     semester, SubjectCode, section DESC;
  //   `,
  // );
  return await sqlHelper.query(
    // `SELECT
    //     s.semester,
    //     s.SubjectCode,
    //     s.section,
    //     s.limit,
    //     s.SubjectOfferedTo,
    //     s.YearLevel,
    //     roomTypeCodes = '',
    //     intervals = '',
    //     days = '',
    //     CASE
    //   WHEN s.SubjectCode LIKE '%PATHFIT%' THEN 2
    //     ELSE 3
    //   END hours,
    //   c.College,
    //   c.Description
    //   FROM
    //     [UE database]..[Subject Offered] s
    // LEFT JOIN
    //   [UE database]..View_College c ON s.College = c.college
    // WHERE semester = '20251'
    //     AND SubjectCode IN (
    //       'ART', 'GECE3', 'ENSCIE3', 'ETHICS', 'ELEC1P',
    //       'PSYCHO1P', 'RIZAL1PT', 'LOGIC1N', 'NSTP1', 'MATHMW',
    //       'PLITE2', 'RPH', 'PCOM', 'MT1D', 'TCW', 'PATHFIT1', 'PATHFIT2', 'PATHFIT3', 'PATHFIT4'
    //     )
    // ORDER BY
    //   semester, SubjectCode, section DESC;
    // `,
    `SELECT 
        s.semester, 
        s.SubjectCode, 
        s.section, 
        s.limit, 
        s.SubjectOfferedTo, 
        s.YearLevel, 
        roomTypeCodes = '', 
        intervals = '', 
        days = '',
        CASE
      WHEN s.SubjectCode LIKE '%PATHFIT%' THEN 2
        ELSE 3
      END hours,
      c.College,
      c.Description
      FROM 
        [UE database]..[Subject Offered] s
    LEFT JOIN
      [UE database]..View_College c ON s.College = c.college
    WHERE semester = '20251' 
        AND SubjectCode IN (
          'STS', 'USELF'
        )
    ORDER BY 
      semester, SubjectCode, section DESC;
    `,
  );
};

const getSchedule = async (semester, subjectOfferedTo, yearLevel) => {
  return await sqlHelper.query(
    `SELECT
      Semester,
      college,
      Course,
      yearlevel,
      TotalUnits,
      CAST(StartOfClasses AS DATE) AS StartOfClasses,
      CAST(EndOfClasses AS DATE) AS EndOfClasses
    FROM 
      [UE database]..EndofEnrollment
    WHERE 
      Semester = ? and college = ? and yearLevel = ?
    ORDER BY 
      Semester DESC
    `,
    [semester, subjectOfferedTo, yearLevel],
  );
};

const getRoomsApplicable = async (capacity, roomTypeCodes) => {
  if (roomTypeCodes.length > 0) {
    // Only return GYM rooms (no capacity filter)
    return await sqlHelper.query(
      `
      SELECT 
          Name AS RoomName,
          BldgCode,
          Floor,
          Capacity AS TotalCapacity,
          Name AS RoomNames,
          CAST(Id AS VARCHAR) AS RoomId,
          RoomTypeCodes
      FROM RoomMgt..Rooms
      WHERE RoomTypeCodes = ?
      `,
      [roomTypeCodes],
    );
  } else {
    // Return grouped rooms based on capacity
    return await sqlHelper.query(
      `WITH SplitRooms AS (
          SELECT
              Id,
              Name,
              Capacity,
              BldgCode,
              Floor,
              RoomTypeCodes,
              CASE 
                  WHEN Name IN ('ROOM 302 - A', 'ROOM 302 - B') THEN 'ROOM 302'
                  WHEN Name IN ('ROOM 303 - A', 'ROOM 303 - B') THEN 'ROOM 303'
                  WHEN Name IN ('ROOM 304 - A', 'ROOM 304 - B') THEN 'ROOM 304'
                  WHEN Name IN ('ROOM 307 - A', 'ROOM 307 - B') THEN 'ROOM 307'
                  WHEN Name IN ('ROOM 308 - A', 'ROOM 308 - B') THEN 'ROOM 308'
                  WHEN Name LIKE 'DISCUSSION RM %' THEN 'DISCUSSION ROOM GROUP'
                  ELSE Name
              END AS BaseRoom,
              CASE 
                  WHEN Name LIKE 'DISCUSSION RM %'
                      OR Name IN (
                          'ROOM 302 - A', 'ROOM 302 - B',
                          'ROOM 303 - A', 'ROOM 303 - B',
                          'ROOM 304 - A', 'ROOM 304 - B',
                          'ROOM 307 - A', 'ROOM 307 - B',
                          'ROOM 308 - A', 'ROOM 308 - B'
                      )
                      THEN 1
                  ELSE 0
              END AS IsSplit
          FROM RoomMgt..Rooms
          WHERE Id IN (
              '379','380','235','236','237','238','239','247','246','248','249','250','350',
              '255','256','258','257','280','281','282','283','309','310','381',
              '313','314','315','363','327','328','335','336','337','338','243','382','354',
              '355','358','360','361','364','365','229','377','376','378','368'
          )
      ),
      GroupedRooms AS (
          SELECT
              BaseRoom,
              BldgCode,
              Floor,
              MAX(RoomTypeCodes) AS RoomTypeCodes,
              SUM(Capacity) AS TotalCapacity,
              STRING_AGG(Name, ', ') AS RoomNames,
              STRING_AGG(CAST(Id AS VARCHAR), ', ') AS RoomId,
              MIN(IsSplit) AS HasSplit
          FROM SplitRooms
          GROUP BY BaseRoom, BldgCode, Floor
      )
      SELECT 
          BaseRoom AS RoomGroupName,
          BldgCode,
          Floor,
          TotalCapacity,
          RoomNames,
          RoomId,
          RoomTypeCodes
      FROM GroupedRooms
      ORDER BY RoomGroupName;
      `,
    );
    // return await sqlHelper.query(
    //   `
    //   WITH SplitRooms AS (
    //       SELECT
    //           Id,
    //           Name,
    //           Capacity,
    //           BldgCode,
    //           Floor,
    //           RoomTypeCodes,
    //           CASE
    //               WHEN Name LIKE '% - A' OR Name LIKE '% - B' OR Name LIKE '% - 1' OR Name LIKE '% - 2' OR Name LIKE '% - 3'
    //               THEN LEFT(Name, CHARINDEX('-', Name + '-') - 2)
    //               ELSE Name
    //           END AS BaseRoom,
    //           CASE
    //               WHEN Name LIKE '% - A' OR Name LIKE '% - B' OR Name LIKE '% - 1' OR Name LIKE '% - 2' OR Name LIKE '% - 3'
    //               THEN 1
    //               ELSE 0
    //           END AS IsSplit
    //       FROM RoomMgt..Rooms
    //   ),
    //   GroupedRooms AS (
    //       SELECT
    //           BaseRoom,
    //           BldgCode,
    //           Floor,
    //           MAX(RoomTypeCodes) AS RoomTypeCodes,
    //           SUM(Capacity) AS TotalCapacity,
    //           STRING_AGG(Name, ', ') AS RoomNames,
    //           STRING_AGG(Id, ', ') AS RoomId,
    //           MIN(IsSplit) AS HasSplit
    //       FROM SplitRooms
    //       GROUP BY BaseRoom, BldgCode, Floor
    //   )
    //   SELECT
    //       BaseRoom AS RoomGroupName,
    //       BldgCode,
    //       Floor,
    //       TotalCapacity,
    //       RoomNames,
    //       RoomId,
    //       RoomTypeCodes
    //   FROM GroupedRooms
    //   WHERE TotalCapacity >= ?
    //   ORDER BY ABS(TotalCapacity - ?);
    //   `,
    //   [capacity, capacity],
    // );
  }
};

const getScheduledOfRoomId = async (roomId) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      RoomMgt..RoomSchedules
    WHERE
      RoomId = ?
    `,
    [roomId],
  );
};

const getSectionSchedule = async (section) => {
  return await sqlHelper.query(
    `SELECT * 
    FROM 
      RoomMgt..RoomSchedules
    WHERE 
      Section = ?
    `,
    [section],
  );
};

module.exports = {
  getSubjectCode,
  getRoomDesignation,
  getAllRoom,
  bookedRooms,
  getSections,
  getIntervals,
  selectSchedules,
  getSemester,
  checkRoom,
  bookedRoomsByEmployeeCode,
  bookedRoomsView,
  ConTrial,
  getAllRoomsForReport,
  checkStatus,
  updateStatus,
  cancelSchedule,
  insertManualData,
  getGenEdSched,
  getSchedule,
  getRoomsApplicable,
  getScheduledOfRoomId,
  getSectionSchedule,
};

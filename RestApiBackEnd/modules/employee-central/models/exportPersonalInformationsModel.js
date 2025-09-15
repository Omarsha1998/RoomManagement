const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 

async function getDepartment() {
  const query = `SELECT 
                TRIM(department_code) AS 'department_code', 
                TRIM(department_name) AS 'department_name'
              FROM (
                SELECT 
                  CAST('' AS VARCHAR(255)) AS 'department_code', 
                  CAST('Any' AS VARCHAR(255)) AS 'department_name',
                  0 AS sort_order
                UNION ALL
                SELECT 
                  TRIM(CODE) AS 'department_code', 
                  TRIM([DESCRIPTION]) AS 'department_name',
                  1 AS sort_order
                FROM UERMMMC..VW_DEPARTMENTS
                WHERE DELETED = 0 AND NOT [DESCRIPTION] LIKE 'INACTIVE%'
              ) AS subquery
              ORDER BY sort_order, department_name ASC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getPosition() {
  const query = `SELECT 
                TRIM(position_code) AS 'position_code', 
                TRIM(position_name) AS 'position_name'
              FROM (
                SELECT 
                  CAST('' AS VARCHAR(255)) AS 'position_code', 
                  CAST('Any' AS VARCHAR(255)) AS 'position_name',
                  0 AS sort_order
                UNION ALL
                SELECT 
                  TRIM(PositionCode) AS 'position_code', 
                  TRIM(Position) AS 'position_name',
                  1 AS sort_order
                FROM [UE database]..[Position] 
              ) AS subquery
              ORDER BY sort_order, position_name ASC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getClass() {
  const query = `SELECT 
                  TRIM(class_code) AS 'class_code', 
                  TRIM(class_name) AS 'class_name'
                FROM (
                  SELECT 
                    CAST('' AS VARCHAR(255)) AS 'class_code', 
                    CAST('Any' AS VARCHAR(255)) AS 'class_name',
                    0 AS sort_order
                  UNION ALL
                  SELECT 
                    TRIM(Class) AS 'class_code', 
                    TRIM([Description]) AS 'class_name',
                    1 AS sort_order
                  FROM [UE database]..[EmployeeClass]
                ) AS subquery
                ORDER BY sort_order, class_name ASC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getStatus() {
  const query = `SELECT 
                TRIM(status_code) AS 'status_code', 
                TRIM(status_name) AS 'status_name'
              FROM (
                SELECT 
                  CAST('' AS VARCHAR(255)) AS 'status_code', 
                  CAST('Any' AS VARCHAR(255)) AS 'status_name',
                  0 AS sort_order
                UNION ALL
                SELECT 
                  TRIM(CAST(ID AS VARCHAR(255))) AS 'class_code', 
                  TRIM([DESCRIPTION]) AS 'class_name',
                  1 AS sort_order
                FROM [UE database]..EmployeeStatus
              ) AS subquery
              ORDER BY sort_order, status_name ASC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getGender() {
  const query = `SELECT 
                TRIM(gender_code) AS 'gender_code', 
                TRIM(gender_name) AS 'gender_name'
              FROM (
                SELECT 
                  CAST('' AS VARCHAR(255)) AS 'gender_code', 
                  CAST('Any' AS VARCHAR(255)) AS 'gender_name',
                  0 AS sort_order
                UNION ALL
                SELECT 
                  TRIM('M') AS 'gender_code', 
                  TRIM('Male') AS 'gender_name',
                  1 AS sort_order
                UNION ALL
                SELECT 
                  TRIM('F') AS 'gender_code', 
                  TRIM('Female') AS 'gender_name',
                  1 AS sort_order
              ) AS subquery
              ORDER BY sort_order, gender_name DESC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getActive() {
  const query = `SELECT 
                TRIM(active_code) AS 'active_code', 
                TRIM(active_name) AS 'active_name'
              FROM (
                SELECT 
                  CAST('' AS VARCHAR(255)) AS 'active_code', 
                  CAST('Any' AS VARCHAR(255)) AS 'active_name',
                  0 AS sort_order
                UNION ALL
                SELECT 
                  TRIM('1') AS 'active_code', 
                  TRIM('Yes') AS 'active_name',
                  1 AS sort_order
                UNION ALL
                SELECT 
                  TRIM('0') AS 'active_code', 
                  TRIM('No') AS 'active_name',
                  1 AS sort_order
              ) AS subquery
              ORDER BY sort_order, active_name DESC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getGroup() {
  const query = `SELECT DISTINCT 
  TRIM([Group]) AS 'group_name' 
  FROM UERMMMC..SECTIONS
  WHERE DELETED = 0 AND [GROUP] IS NOT NULL`;
  const response = (await helperMethods.executeQuery(query)).recordset;

  const newObj = {
    group_name: 'Any'
  };

  response.unshift(newObj);
  return response;
}

async function getWithLicense() {
  const query = `SELECT 
                TRIM(with_license_code) AS 'with_license_code', 
                TRIM(with_license_name) AS 'with_license_name'
              FROM (
                SELECT 
                  CAST('' AS VARCHAR(255)) AS 'with_license_code', 
                  CAST('Any' AS VARCHAR(255)) AS 'with_license_name',
                  0 AS sort_order
                UNION ALL
                SELECT 
                  TRIM('1') AS 'with_license_code', 
                  TRIM('Yes') AS 'with_license_name',
                  1 AS sort_order
                UNION ALL
                SELECT 
                  TRIM('0') AS 'with_license_code', 
                  TRIM('No') AS 'with_license_name',
                  1 AS sort_order
              ) AS subquery
              ORDER BY sort_order, with_license_name DESC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getEducationalAttainment() {
  const query = `SELECT 
  TRIM([Description]) AS 'education_name'
  FROM HR..HighestEducationalAttainment`;
  const response = (await helperMethods.executeQuery(query)).recordset;

  const newObj = {
    education_name: 'Any'
  };

  response.unshift(newObj);
  return response;
}


function getKeyWord(educationalAttainment) {
  let response = "";
  switch (educationalAttainment) {
    case "ASSOCIATE DEGREE":
      response = "ASSOCIATE";
      break;
    case "BACHELOR'S DEGREE":
      response = "BACHELOR";
      break;
    case "DOCTORAL DEGREE":
      response = "DOCTOR";
      break;
    case "HIGH SCHOOL DIPLOMA":
      response = "HIGH SCHOOL";
      break;
    case "MASTER'S DEGREE":
      response = "MASTER";
      break;
    case "VOCATIONAL COURSE":
      response = "VOCATION";
      break;
  }
  if (response === "") throw `Cannot found in getKeyWord(). The educational attainment : ${  educationalAttainment}`;
  return response;
}


async function searchEmployee(body) {
  let query = `SELECT DISTINCT
  E.EmployeeCode AS 'employee_code',
  E.LastName AS 'last_name',
  E.FirstName AS 'first_name',
  E.MiddleName AS 'middle_name',
  ISNULL(REPLACE(D.[DESCRIPTION],'’',''''),'') AS 'department'
FROM [UE database]..Employee AS E
  LEFT JOIN [UE database]..EmployeeClass AS C 
  ON C.Class = E.Class
  LEFT JOIN [UE database]..EmployeeStatus AS S 
  ON CAST(S.NUM AS VARCHAR(MAX)) = E.EmployeeStatus
  LEFT JOIN UERMMMC..SECTIONS AS D 
  ON D.CODE = E.DeptCode  
  LEFT JOIN [UE database]..Position AS P
  ON P.PositionCode = E.PositionCode     
  LEFT JOIN [UE DATABASE]..CIVILSTATUS AS CS
  ON CONVERT(VARCHAR(MAX),CS.ID) = CONVERT(VARCHAR(MAX),E.CIVILSTATUS)  
  LEFT JOIN [UE database]..EmployeeExt AS EE
  ON EE.EmployeeCode = E.EmployeeCode
  LEFT JOIN UERMHIMS..CodeRegion AS CR1 
  ON CR1.CODE = EE.CurrentAddress_RegionCode
  LEFT JOIN UERMHIMS..CodeProvince AS CP1 
  ON CP1.Code = EE.CurrentAddress_ProvinceCode
  LEFT JOIN UERMHIMS..CodeMunicipalityCity AS CMC1 
  ON CMC1.Code = EE.CurrentAddress_CityOrMunicipalityCode
  LEFT JOIN UERMHIMS..CodeRegion AS CR2 
  ON CR2.CODE = EE.PermanentAddress_RegionCode
  LEFT JOIN UERMHIMS..CodeProvince AS CP2
  ON CP2.Code = EE.PermanentAddress_ProvinceCode
  LEFT JOIN UERMHIMS..CodeMunicipalityCity AS CMC2 
  ON CMC2.Code = EE.PermanentAddress_CityOrMunicipalityCode
  LEFT JOIN [UE database]..License AS L 
  ON L.EmployeeCode = E.EmployeeCode
  LEFT JOIN [UE database]..Education AS ED
  ON ED.EmployeeCode = E.EmployeeCode
  LEFT JOIN HR..CollegeDegrees AS CD 
  ON CD.ID = ED.CollegeDegreeID
WHERE E.DeptCode LIKE @DeptCode AND
  E.PositionCode LIKE @PositionCode AND
  E.Class LIKE @Class AND
  E.EmployeeStatus LIKE @EmployeeStatus AND
  ISNULL(E.Sex,'%') LIKE @Sex AND
  E.IsActive LIKE @IsActive AND
  E.LastName LIKE @LastName AND
  E.FirstName LIKE @FirstName AND
  ISNULL(E.MiddleName,'') LIKE @MiddleName AND
  ISNULL(D.[Group],'%') LIKE @Group AND 
  E.EmployeeCode LIKE @EmployeeCode`;


  if (body.with_license_code !== "" && body.with_license_code === "1") query += " AND L.License IS NOT NULL";
  else if (body.with_license_code !== "" && body.with_license_code === "0") query += " AND L.License IS NULL";


  if (body.educational_attainment !== "") {
    body.educational_attainment = getKeyWord(body.educational_attainment);

    query += " AND ";

    if (body.educational_attainment === "BACHELOR") {
      query += `ED.DiplomaDegreeHonor LIKE '%BS%' OR 
              CD.[Description] LIKE '%BS%' OR `;
    }

    query += ` ED.DiplomaDegreeHonor LIKE @EducationalAttainment OR 
   CD.[Description] LIKE @EducationalAttainment`;
  }

  const parameters = [
    { name: "DeptCode", dataType: SQLDataTypes.VARCHAR, value: `%${  body.department_code}` },
    { name: "PositionCode", dataType: SQLDataTypes.VARCHAR, value: `%${  body.position_code}` },
    { name: "Class", dataType: SQLDataTypes.VARCHAR, value: `%${  body.class_code}` },
    { name: "EmployeeStatus", dataType: SQLDataTypes.VARCHAR, value: `%${  body.status_code}` },
    { name: "Sex", dataType: SQLDataTypes.VARCHAR, value: `%${  body.gender_code}` },
    { name: "IsActive", dataType: SQLDataTypes.VARCHAR, value: `%${  body.active_code}` },
    { name: "LastName", dataType: SQLDataTypes.VARCHAR, value: `%${  body.last_name  }%` },
    { name: "FirstName", dataType: SQLDataTypes.VARCHAR, value: `%${  body.first_name  }%` },
    { name: "MiddleName", dataType: SQLDataTypes.VARCHAR, value: `%${  body.middle_name  }%` },
    { name: "Group", dataType: SQLDataTypes.VARCHAR, value: `%${  body.group_name}` },
    { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: `%${  body.employee_code}` },
    { name: "EducationalAttainment", dataType: SQLDataTypes.VARCHAR, value: `%${  body.educational_attainment  }%` }
  ];

  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

async function getPersonalInformations(employeeIDs, withLicenseCode) {
  let query = "";

  // 1 = Yes
  if (withLicenseCode === "1") {
    query = `SELECT
    (CASE 
        WHEN ISNULL(E.isDPOCompliant, 0) = 1 THEN 'Yes'
        ELSE 'No'
    END) AS 'Data Privacy Consent',
    E.EmployeeCode AS 'Employee Code',
    E.LastName AS 'Last Name',
    E.FirstName AS 'First Name',
    E.MiddleName AS 'Middle Name',
    E.ExtName AS 'Ext Name',
    C.[Description] AS 'Class',
    S.[DESCRIPTION] AS 'Status',
    D.[GROUP] AS 'Group',
    REPLACE(P.Position,'’','''') AS 'Position',
    ISNULL(REPLACE(D.[DESCRIPTION],'’',''''),'') AS 'Department',
    CASE
        WHEN ISNULL(CAST(E.DateHired AS DATE), '1900-01-01') < '1900-01-01' THEN '1900-01-01'
        ELSE CONVERT(VARCHAR(10), CAST(E.DateHired AS DATE), 101)
    END AS 'Date Hired',
    CASE
        WHEN ISNULL(CAST(E.DateRegular AS DATE), '1900-01-01') < '1900-01-01' THEN '1900-01-01'
        ELSE CONVERT(VARCHAR(10), CAST(E.DateRegular AS DATE), 101)
    END AS 'Date Regularized',
    CASE
        WHEN E.Class = 'RE' AND LTRIM(RTRIM(E.EmployeeStatus)) = '7' AND E.PositionCode = 'POSTGINT' 
        THEN DATEADD(DAY,-1,DATEADD(YEAR,+1,ISNULL(CAST(E.DATEHIRED AS DATE),'1900-01-01')))    
        ELSE NULLIF(CAST(E.ResignationDate AS DATE),'1900-01-01')    
    END AS 'Date of Separation',
     CAST(
      ROUND(
        DATEDIFF(MONTH, E.DATEHIRED,
          CASE    
            WHEN NULLIF(CAST(E.RESIGNATIONDATE AS DATE),'1900-01-01') IS NULL THEN GETDATE()    
            ELSE E.RESIGNATIONDATE    
          END) / 12.0, 2
      ) AS DECIMAL(18,2)) AS 'Years of Service',
    NULLIF(E.SEX,'') AS 'Gender',
    CASE
        WHEN ISNULL(CAST(E.BIRTHDATE AS DATE), '1900-01-01') < '1900-01-01' THEN '1900-01-01'
        ELSE CONVERT(VARCHAR(10), CAST(E.BIRTHDATE AS DATE), 101)
    END AS 'Birth Date',
    FLOOR(DATEDIFF(DD, CASE    
            WHEN ISNULL(CAST(E.BIRTHDATE AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'    
            ELSE ISNULL(CAST(E.BIRTHDATE AS DATE),'1900-01-01')    
        END, GETDATE())/365.242) AS 'Age',
    CS.[DESCRIPTION] AS 'Civil Status',
    E.MOBILENO AS 'Mobile No',
    ISNULL(LOWER(TRIM(E.Email)), '') AS 'Personal Email', 
    ISNULL(LOWER(TRIM(E.UERMEmail)), '') AS 'UERM Email',
    EE.CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName AS 'Current Address (Room / Floor / Unit No. & Building Name)',
    EE.CurrentAddress_HouseOrLotAndBlockNo AS 'Current Address (House / Lot & Block No.)',
    EE.CurrentAddress_StreetName AS 'Current Address (Street Name)',
    EE.CurrentAddress_Subdivision AS 'Current Address (Subdivision)',
    CR1.[NAME] AS 'Current Address (Region)',
    CP1.[NAME] AS 'Current Address (Province)',
    CMC1.[NAME] AS 'Current Address (City / Municipality)',
    EE.CurrentAddress_Barangay AS 'Current Address (Barangay)',
    EE.PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName AS 'Permanent Address (Room / Floor / Unit No. & Building Name)',
    EE.PermanentAddress_HouseOrLotAndBlockNo AS 'Permanent Address (House / Lot & Block No.)',
    EE.PermanentAddress_StreetName AS 'Permanent Address (Street Name)',
    EE.PermanentAddress_Subdivision AS 'Permanent Address (Subdivision)',
    CR2.[NAME] AS 'Permanent Address (Region)',
    CP2.[NAME] AS 'Permanent Address (Province)',
    CMC2.[NAME] AS 'Permanent Address (City / Municipality)',
    EE.PermanentAddress_Barangay AS 'Permanent Address (Barangay)',
      UPPER(
        CASE 
        WHEN (
          SELECT TOP 1 SchoolListID
          FROM [UE Database]..Education 
          WHERE Institution IS NULL AND SchoolListID IS NOT NULL AND EmployeeCode = E.EmployeeCode
          ORDER BY [From] DESC
        ) IS NOT NULL 
        THEN (
          SELECT TOP 1 TRIM(SL.[Description])
          FROM HR..SchoolList SL
          JOIN [UE Database]..Education ED ON SL.ID = ED.SchoolListID
          WHERE ED.Institution IS NULL AND ED.SchoolListID IS NOT NULL AND EmployeeCode = E.EmployeeCode
          ORDER BY ED.[From] DESC
        )
        ELSE
          (SELECT TOP 1 Institution 
           FROM [UE Database]..Education 
           WHERE EmployeeCode = E.EmployeeCode
           ORDER BY [From] DESC
           )
        END
      ) AS 'School',
  UPPER(
    CASE 
      WHEN (
        SELECT TOP 1 X.Recno
        FROM [UE Database]..Education AS X
        WHERE X.CollegeDegreeID IS NOT NULL AND X.CollegeCourseID IS NOT NULL AND X.EmployeeCode = E.EmployeeCode
        ORDER BY X.[From] DESC
      ) IS NOT NULL 
      THEN (
        SELECT TOP 1 CONCAT(CD.[Description], ' IN ', CC.[Description], ' ', CM.[Description])
        FROM [UE database]..Education AS ED
        LEFT JOIN HR..CollegeDegrees AS CD
        ON CD.ID = ED.CollegeDegreeID
        LEFT JOIN HR..CollegeCourses AS CC
        ON CC.ID = ED.CollegeCourseID
        LEFT JOIN HR..CollegeMajors AS CM
        ON CM.ID = ED.CollegeMajorID
        WHERE ED.EmployeeCode = E.EmployeeCode
        ORDER BY ED.[From] DESC
      )
      ELSE
          (SELECT TOP 1 DiplomaDegreeHonor 
           FROM [UE Database]..Education 
           WHERE EmployeeCode = E.EmployeeCode
           ORDER BY [From] DESC
          )
    END
  ) AS 'Degree',
  
    E.SSS_No AS 'SSS',
    E.TIN, 
    E.PhilHealth,
    E.PagIBIG_No AS 'Pag-Ibig',
    L.License AS 'License',
    L.LicenseNo AS 'License No',
    L.Board_Rating AS 'Board Rating'
  FROM 
    [UE database]..Employee AS E
  LEFT JOIN 
    [UE database]..EmployeeClass AS C ON C.Class = E.Class
  LEFT JOIN 
    [UE database]..EmployeeStatus AS S ON CAST(S.NUM AS VARCHAR(MAX)) = E.EmployeeStatus
  LEFT JOIN 
    UERMMMC..SECTIONS AS D ON D.CODE = E.DeptCode  
  LEFT JOIN 
    [UE database]..Position AS P ON P.PositionCode = E.PositionCode     
  LEFT JOIN 
    [UE DATABASE]..CIVILSTATUS CS ON CONVERT(VARCHAR(MAX),CS.ID) = CONVERT(VARCHAR(MAX),E.CIVILSTATUS)  
  LEFT JOIN 
    [UE database]..EmployeeExt AS EE ON EE.EmployeeCode = E.EmployeeCode
  LEFT JOIN 
    UERMHIMS..CodeRegion AS CR1 ON CR1.CODE = EE.CurrentAddress_RegionCode
  LEFT JOIN 
    UERMHIMS..CodeProvince AS CP1 ON CP1.Code = EE.CurrentAddress_ProvinceCode
  LEFT JOIN 
    UERMHIMS..CodeMunicipalityCity AS CMC1 ON CMC1.Code = EE.CurrentAddress_CityOrMunicipalityCode
  LEFT JOIN 
    UERMHIMS..CodeRegion AS CR2 ON CR2.CODE = EE.PermanentAddress_RegionCode
  LEFT JOIN 
    UERMHIMS..CodeProvince AS CP2 ON CP2.Code = EE.PermanentAddress_ProvinceCode
  LEFT JOIN 
    UERMHIMS..CodeMunicipalityCity AS CMC2 ON CMC2.Code = EE.PermanentAddress_CityOrMunicipalityCode
  LEFT JOIN 
    [UE database]..License AS L ON L.EmployeeCode = E.EmployeeCode`;
  }
  // '' = Any
  else {
    query += `SELECT
    (CASE 
        WHEN ISNULL(E.isDPOCompliant, 0) = 1 THEN 'Yes'
        ELSE 'No'
    END) AS 'Data Privacy Consent',
    E.EmployeeCode AS 'Employee Code',
    E.LastName AS 'Last Name',
    E.FirstName AS 'First Name',
    E.MiddleName AS 'Middle Name',
    E.ExtName AS 'Ext Name',
    C.[Description] AS 'Class',
    S.[DESCRIPTION] AS 'Status',
    D.[GROUP] AS 'Group',
    REPLACE(P.Position,'’','''') AS 'Position',
    ISNULL(REPLACE(D.[DESCRIPTION],'’',''''),'') AS 'Department',
    CASE
        WHEN ISNULL(CAST(E.DateHired AS DATE), '1900-01-01') < '1900-01-01' THEN '1900-01-01'
        ELSE CONVERT(VARCHAR(10), CAST(E.DateHired AS DATE), 101)
    END AS 'Date Hired',
    CASE
        WHEN ISNULL(CAST(E.DateRegular AS DATE), '1900-01-01') < '1900-01-01' THEN '1900-01-01'
        ELSE CONVERT(VARCHAR(10), CAST(E.DateRegular AS DATE), 101)
    END AS 'Date Regularized',
    CASE
        WHEN E.Class = 'RE' AND LTRIM(RTRIM(E.EmployeeStatus)) = '7' AND E.PositionCode = 'POSTGINT' 
        THEN DATEADD(DAY,-1,DATEADD(YEAR,+1,ISNULL(CAST(E.DATEHIRED AS DATE),'1900-01-01')))    
        ELSE NULLIF(CAST(E.ResignationDate AS DATE),'1900-01-01')    
    END AS 'Date of Separation',
    CAST(
      ROUND(
        DATEDIFF(MONTH, E.DATEHIRED,
          CASE    
            WHEN NULLIF(CAST(E.RESIGNATIONDATE AS DATE),'1900-01-01') IS NULL THEN GETDATE()    
            ELSE E.RESIGNATIONDATE    
          END) / 12.0, 2
      ) AS DECIMAL(18,2)) AS 'Years of Service',
    NULLIF(E.SEX,'') AS 'Gender',
    CASE
        WHEN ISNULL(CAST(E.BIRTHDATE AS DATE), '1900-01-01') < '1900-01-01' THEN '1900-01-01'
        ELSE CONVERT(VARCHAR(10), CAST(E.BIRTHDATE AS DATE), 101)
    END AS 'Birth Date',
    FLOOR(DATEDIFF(DD, CASE    
            WHEN ISNULL(CAST(E.BIRTHDATE AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'    
            ELSE ISNULL(CAST(E.BIRTHDATE AS DATE),'1900-01-01')    
        END, GETDATE())/365.242) AS 'Age',
    CS.[DESCRIPTION] AS 'Civil Status',
    E.MOBILENO AS 'Mobile No',
    ISNULL(LOWER(TRIM(E.Email)), '') AS 'Personal Email', 
    ISNULL(LOWER(TRIM(E.UERMEmail)), '') AS 'UERM Email',
    EE.CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName AS 'Current Address (Room / Floor / Unit No. & Building Name)',
    EE.CurrentAddress_HouseOrLotAndBlockNo AS 'Current Address (House / Lot & Block No.)',
    EE.CurrentAddress_StreetName AS 'Current Address (Street Name)',
    EE.CurrentAddress_Subdivision AS 'Current Address (Subdivision)',
    CR1.[NAME] AS 'Current Address (Region)',
    CP1.[NAME] AS 'Current Address (Province)',
    CMC1.[NAME] AS 'Current Address (City / Municipality)',
    EE.CurrentAddress_Barangay AS 'Current Address (Barangay)',
    EE.PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName AS 'Permanent Address (Room / Floor / Unit No. & Building Name)',
    EE.PermanentAddress_HouseOrLotAndBlockNo AS 'Permanent Address (House / Lot & Block No.)',
    EE.PermanentAddress_StreetName AS 'Permanent Address (Street Name)',
    EE.PermanentAddress_Subdivision AS 'Permanent Address (Subdivision)',
    CR2.[NAME] AS 'Permanent Address (Region)',
    CP2.[NAME] AS 'Permanent Address (Province)',
    CMC2.[NAME] AS 'Permanent Address (City / Municipality)',
    EE.PermanentAddress_Barangay AS 'Permanent Address (Barangay)',
      UPPER(
        CASE 
        WHEN (
          SELECT TOP 1 SchoolListID
          FROM [UE Database]..Education 
          WHERE Institution IS NULL AND SchoolListID IS NOT NULL AND EmployeeCode = E.EmployeeCode
          ORDER BY [From] DESC
        ) IS NOT NULL 
        THEN (
          SELECT TOP 1 TRIM(SL.[Description])
          FROM HR..SchoolList SL
          JOIN [UE Database]..Education ED ON SL.ID = ED.SchoolListID
          WHERE ED.Institution IS NULL AND ED.SchoolListID IS NOT NULL AND EmployeeCode = E.EmployeeCode
          ORDER BY ED.[From] DESC
        )
        ELSE
          (SELECT TOP 1 Institution 
          FROM [UE Database]..Education 
          WHERE EmployeeCode = E.EmployeeCode
          ORDER BY [From] DESC
          )
        END
      ) AS 'School',
  UPPER(
    CASE 
      WHEN (
        SELECT TOP 1 X.Recno
        FROM [UE Database]..Education AS X
        WHERE X.CollegeDegreeID IS NOT NULL AND X.CollegeCourseID IS NOT NULL AND X.EmployeeCode = E.EmployeeCode
        ORDER BY X.[From] DESC
      ) IS NOT NULL 
      THEN (
        SELECT TOP 1 CONCAT(CD.[Description], ' IN ', CC.[Description], ' ', CM.[Description])
        FROM [UE database]..Education AS ED
        LEFT JOIN HR..CollegeDegrees AS CD
        ON CD.ID = ED.CollegeDegreeID
        LEFT JOIN HR..CollegeCourses AS CC
        ON CC.ID = ED.CollegeCourseID
        LEFT JOIN HR..CollegeMajors AS CM
        ON CM.ID = ED.CollegeMajorID
        WHERE ED.EmployeeCode = E.EmployeeCode
        ORDER BY ED.[From] DESC
      )
      ELSE
          (SELECT TOP 1 DiplomaDegreeHonor 
          FROM [UE Database]..Education 
          WHERE EmployeeCode = E.EmployeeCode
          ORDER BY [From] DESC
          )
    END
  ) AS 'Degree',

    E.SSS_No AS 'SSS',
    E.TIN, 
    E.PhilHealth,
    E.PagIBIG_No AS 'Pag-Ibig',
  UPPER(
    CASE 
      WHEN (
        SELECT TOP 1 
      YearTaken
      FROM [UE database]..License 
      WHERE EmployeeCode = E.EmployeeCode
      ORDER BY YearTaken DESC
      ) IS NOT NULL 
      THEN (
          SELECT TOP 1 
        License
        FROM [UE database]..License 
        WHERE EmployeeCode = E.EmployeeCode
        ORDER BY YearTaken DESC
      )
      ELSE
          (
        SELECT TOP 1 
        License
        FROM [UE database]..License 
        WHERE EmployeeCode = E.EmployeeCode
        ORDER BY RecNo DESC
          )
    END
  ) AS 'License',
  UPPER(
    CASE 
      WHEN (
        SELECT TOP 1 
      YearTaken
      FROM [UE database]..License 
      WHERE EmployeeCode = E.EmployeeCode
      ORDER BY YearTaken DESC
      ) IS NOT NULL 
      THEN (
          SELECT TOP 1 
        LicenseNo
        FROM [UE database]..License 
        WHERE EmployeeCode = E.EmployeeCode
        ORDER BY YearTaken DESC
      )
      ELSE
          (
        SELECT TOP 1 
        LicenseNo
        FROM [UE database]..License 
        WHERE EmployeeCode = E.EmployeeCode
        ORDER BY RecNo DESC
          )
    END
  ) AS 'License No',
  UPPER(
    CASE 
      WHEN (
        SELECT TOP 1 
      YearTaken
      FROM [UE database]..License 
      WHERE EmployeeCode = E.EmployeeCode
      ORDER BY YearTaken DESC
      ) IS NOT NULL 
      THEN (
          SELECT TOP 1 
        Board_Rating
        FROM [UE database]..License 
        WHERE EmployeeCode = E.EmployeeCode
        ORDER BY YearTaken DESC
      )
      ELSE
          (
        SELECT TOP 1 
        Board_Rating
        FROM [UE database]..License 
        WHERE EmployeeCode = E.EmployeeCode
        ORDER BY RecNo DESC
          )
    END
  ) AS 'Board Rating'
  FROM 
    [UE database]..Employee AS E
  LEFT JOIN 
    [UE database]..EmployeeClass AS C ON C.Class = E.Class
  LEFT JOIN 
    [UE database]..EmployeeStatus AS S ON CAST(S.NUM AS VARCHAR(MAX)) = E.EmployeeStatus
  LEFT JOIN 
    UERMMMC..SECTIONS AS D ON D.CODE = E.DeptCode  
  LEFT JOIN 
    [UE database]..Position AS P ON P.PositionCode = E.PositionCode     
  LEFT JOIN 
    [UE DATABASE]..CIVILSTATUS CS ON CONVERT(VARCHAR(MAX),CS.ID) = CONVERT(VARCHAR(MAX),E.CIVILSTATUS)  
  LEFT JOIN 
    [UE database]..EmployeeExt AS EE ON EE.EmployeeCode = E.EmployeeCode
  LEFT JOIN 
    UERMHIMS..CodeRegion AS CR1 ON CR1.CODE = EE.CurrentAddress_RegionCode
  LEFT JOIN 
    UERMHIMS..CodeProvince AS CP1 ON CP1.Code = EE.CurrentAddress_ProvinceCode
  LEFT JOIN 
    UERMHIMS..CodeMunicipalityCity AS CMC1 ON CMC1.Code = EE.CurrentAddress_CityOrMunicipalityCode
  LEFT JOIN 
    UERMHIMS..CodeRegion AS CR2 ON CR2.CODE = EE.PermanentAddress_RegionCode
  LEFT JOIN 
    UERMHIMS..CodeProvince AS CP2 ON CP2.Code = EE.PermanentAddress_ProvinceCode
  LEFT JOIN 
    UERMHIMS..CodeMunicipalityCity AS CMC2 ON CMC2.Code = EE.PermanentAddress_CityOrMunicipalityCode`;
  }

  query += " WHERE ";

  const employeeIDArray = employeeIDs.split(',').map(id => id.trim());

  if (employeeIDArray.length === 0) throw "The length value of employeeIDArray is 0";


  let placeholders = '';
  const inputParameters = {};
  for (let i = 0; i < employeeIDArray.length; i++) {
    placeholders += `@EmployeeID${i + 1},`;
    inputParameters[`EmployeeID${i + 1}`] = SQLDataTypes.VARCHAR;
  }
  placeholders = placeholders.slice(0, -1); // Remove the last comma

  query += `E.EmployeeCode IN (${placeholders})`;

  const parameters = [];

  for (const [key, type] of Object.entries(inputParameters)) {
     parameters.push({ name: key, dataType: type, value: employeeIDArray[parseInt(key.substr(10)) - 1] });
  }

  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

async function getAllOptions() {
  const response = {
    department: await getDepartment(),
    position: await getPosition(),
    class: await getClass(),
    status: await getStatus(),
    gender: await getGender(),
    active: await getActive(),
    group: await getGroup(),
    with_license: await getWithLicense(),
    educational_attainment: await getEducationalAttainment(),
  }
  return response;
}

module.exports = {
  getAllOptions,
  searchEmployee,
  getPersonalInformations
}
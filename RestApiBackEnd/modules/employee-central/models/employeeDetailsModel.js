const sqlHelper = require("../../../helpers/sql");

const getClass = async () => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      [UE database]..EmployeeClass
    `,
  );
};

const getHierarchy = async (whereConditionLevel, highestLevel, filters) => {
  return await sqlHelper.query(
    `WITH CTE_OrgTree AS (
        SELECT 
            os.Code,
            os.Parent,
            os.Level,
            CAST(os.Code AS VARCHAR(MAX)) AS Path,
            CASE 
                WHEN os.Level = 1 THEN os.Code
                ELSE NULL 
            END AS Division,
            CASE 
                WHEN os.Level = 2 THEN os.Code 
                ELSE NULL 
            END AS [Group],
            CASE 
                WHEN os.Level = 3 THEN os.Code 
                ELSE NULL 
            END AS Department,
            CASE 
                WHEN os.Level = 4 THEN os.Code 
                ELSE NULL 
            END AS Section,
            CASE 
                WHEN os.Level = 5 THEN os.Code 
                ELSE NULL 
            END AS Area
        FROM 
            [UE database]..OrganizationalStructure os
        WHERE 
            os.Parent IS NULL

        UNION ALL

        SELECT 
            os.Code,
            os.Parent,
            os.Level,
            CAST(cte.Path + ' -> ' + os.Code AS VARCHAR(MAX)) AS Path,
            CASE 
                WHEN os.Level = 1 THEN os.Code
                ELSE cte.Division 
            END AS Division,
            CASE 
                WHEN os.Level = 2 THEN os.Code 
                ELSE cte.[Group] 
            END AS [Group],
            CASE 
                WHEN os.Level = 3 THEN os.Code 
                ELSE cte.Department 
            END AS Department,
            CASE 
                WHEN os.Level = 4 THEN os.Code 
                ELSE cte.Section 
            END AS Section,
            CASE 
                WHEN os.Level = 5 THEN os.Code 
                ELSE cte.Area 
            END AS Area
        FROM 
            [UE database]..OrganizationalStructure os
        INNER JOIN CTE_OrgTree cte ON os.Parent = cte.Code
    )

    SELECT 
        cte.Code
    FROM 
        CTE_OrgTree cte
    WHERE 
        ${whereConditionLevel}
    ORDER BY 
        cte.Path;  
    `,
    highestLevel ? [filters[highestLevel], filters[highestLevel]] : [],
  );
};

const getInformation = async (
  employeeCode,
  firstName,
  lastName,
  middleName,
  selectedClass,
  withLicense,
  gender,
  active,
  combineCodes,
) => {
  active = active ? active : "";
  employeeCode = employeeCode ? employeeCode : "";

  let query = `
    SELECT *
    FROM
      [UE database]..vw_Employees
    WHERE 
      (ISNULL(?, '') = '' OR CODE LIKE '%' + ? + '%')
      AND (ISNULL(?, '') = '' OR FIRStNAME LIKE '%' + ? + '%')
      AND (ISNULL(?, '') = '' OR LASTNAME LIKE '%' + ? + '%')
      AND (ISNULL(?, '') = '' OR MIDDLENAME LIKE '%' + ? + '%')
      AND (ISNULL(?, '') = '' OR EMP_CLASS_CODE LIKE '%' + ? + '%')
      AND (ISNULL(?, '') = '' OR GENDER LIKE '%' + ? + '%')
      AND (ISNULL(?, '') = '' OR LicenseNumber LIKE '%' + ? + '%')
      AND (ISNULL(?, '') = '' OR CAST(IS_ACTIVE AS NVARCHAR) LIKE '%' + ? + '%')
    `;

  query += ` AND DEPT_CODE IN (${combineCodes.map(() => "?").join(",")})`;

  return await sqlHelper.query(query, [
    employeeCode,
    employeeCode,
    firstName,
    firstName,
    lastName,
    lastName,
    middleName,
    middleName,
    selectedClass,
    selectedClass,
    gender,
    gender,
    withLicense,
    withLicense,
    active,
    active,
    ...combineCodes,
  ]);
};
module.exports = {
  getClass,
  getHierarchy,
  getInformation,
};

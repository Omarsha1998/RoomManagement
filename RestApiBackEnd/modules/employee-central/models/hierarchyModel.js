const sqlHelper = require("../../../helpers/sql");

// const getHiearchy = async () => {
//   return await sqlHelper.query(
//     `WITH CTE_OrgTree AS (
//         SELECT
//             os.Code,
//             os.Parent,
//             os.Level,
//             CAST(os.Code AS VARCHAR(MAX)) AS Path,
//             CASE
//                 WHEN os.Level = 1 THEN os.Code
//                 ELSE NULL
//             END AS CorporateOfficer,
//             CASE
//                 WHEN os.Level = 2 THEN os.Code
//                 ELSE NULL
//             END AS Division1,
//             CASE
//                 WHEN os.Level = 3 THEN os.Code
//                 ELSE NULL
//             END AS Division2,
//             CASE
//                 WHEN os.Level = 4 THEN os.Code
//                 ELSE NULL
//             END AS [Group],
//             CASE
//                 WHEN os.Level = 5 THEN os.Code
//                 ELSE NULL
//             END AS Department,
// 			CASE
//                 WHEN os.Level = 6 THEN os.Code
//                 ELSE NULL
//             END AS Section,
// 			CASE
//                 WHEN os.Level = 7 THEN os.Code
//                 ELSE NULL
//             END AS Area
//         FROM
//             [UE database]..OrganizationalStructure os
//         WHERE
//             os.Parent IS NULL

//         UNION ALL

//         SELECT
//             os.Code,
//             os.Parent,
//             os.Level,
//             CAST(cte.Path + ' -> ' + os.Code AS VARCHAR(MAX)) AS Path,
//             CASE
//                 WHEN os.Level = 1 THEN os.Code
//                 ELSE cte.CorporateOfficer
//             END AS CorporateOfficer,
//             CASE
//                 WHEN os.Level = 2 THEN os.Code
//                 ELSE cte.Division1
//             END AS Division1,
//             CASE
//                 WHEN os.Level = 3 THEN os.Code
//                 ELSE cte.Division2
//             END AS Division2,
//             CASE
//                 WHEN os.Level = 4 THEN os.Code
//                 ELSE cte.[Group]
//             END AS [Group],
//             CASE
//                 WHEN os.Level = 5 THEN os.Code
//                 ELSE cte.Department
//             END AS Department,
// 			CASE
//                 WHEN os.Level = 5 THEN os.Code
//                 ELSE cte.Section
//             END AS Section,
// 			CASE
//                 WHEN os.Level = 5 THEN os.Code
//                 ELSE cte.Area
//             END AS Area
//         FROM
//             [UE database]..OrganizationalStructure os
//         INNER JOIN CTE_OrgTree cte ON os.Parent = cte.Code
//     )

//     SELECT
//         cte.Code,
// 		COALESCE(os.Description, d.DESCRIPTION) AS codeDescription,
//         cte.Parent,
//         cte.Path,
// 		cte.CorporateOfficer,
// 		COALESCE(os1.Description, d1.Description) AS CorporateOfficerDescription,
//         cte.Division1,
// 		COALESCE(os2.Description, d2.Description) AS Division1Description,
// 		cte.Division2,
// 		COALESCE(os3.Description, d3.Description) AS Division2Description,
// 		cte.[Group],
// 		COALESCE(os4.Description, d4.Description) AS GroupDescription,
// 		cte.Department,
// 		COALESCE(os5.Description, d5.Description) AS DepartmentDescription,
// 		cte.Section,
// 		COALESCE(os6.Description, d6.Description) AS SectionDescription,
// 		cte.Area,
// 		COALESCE(os7.Description, d7.Description) AS AreaOfAssignment
//     FROM
//         CTE_OrgTree cte

//     LEFT JOIN [UE database]..OrganizationalStructure os ON cte.Code = os.Code
//     LEFT JOIN UERMMMC..vw_Departments d ON os.Code = d.CODE

//     LEFT JOIN [UE database]..OrganizationalStructure os1 ON cte.CorporateOfficer = os1.Code
//     LEFT JOIN UERMMMC..vw_Departments d1 ON os1.Code = d1.CODE

//     LEFT JOIN [UE database]..OrganizationalStructure os2 ON cte.Division1 = os2.Code
//       LEFT JOIN UERMMMC..vw_Departments d2 ON os2.Code = d2.CODE

//     LEFT JOIN [UE database]..OrganizationalStructure os3 ON cte.Division2 = os3.Code
//       LEFT JOIN UERMMMC..vw_Departments d3 ON os3.Code = d3.CODE

//     LEFT JOIN [UE database]..OrganizationalStructure os4 ON cte.[Group] = os4.Code
//       LEFT JOIN UERMMMC..vw_Departments d4 ON os4.Code = d4.CODE

//     LEFT JOIN [UE database]..OrganizationalStructure os5 ON cte.Department = os5.Code
//       LEFT JOIN UERMMMC..vw_Departments d5 ON os5.Code = d5.CODE

//     LEFT JOIN [UE database]..OrganizationalStructure os6 ON cte.Section = os6.Code
//       LEFT JOIN UERMMMC..vw_Departments d6 ON os6.Code = d6.CODE

//     LEFT JOIN [UE database]..OrganizationalStructure os7 ON cte.Section = os7.Code
//     LEFT JOIN UERMMMC..vw_Departments d7 ON os7.Code = d7.CODE
//     WHERE
//       cte.Code != 'N/A'
//       and (COALESCE(os.Description, d.DESCRIPTION) NOT LIKE 'INACTIVE%')
//     ORDER BY
//       codeDescription ASC
//     `,
//   );
// };

const getHiearchy = async () => {
  return await sqlHelper.query(
    `SELECT 
      os.Code,
      COALESCE(os.Description, vd.Description) AS Description, 
      os.Parent, 
      os.Level 
    FROM 
      [UE database]..OrganizationalStructure os
    LEFT 
      JOIN UERMMMC..vw_Departments vd ON os.Code = vd.CODE
    WHERE 
      (os.Code != 'N/A' or vd.CODE != 'N/A') 
      AND (COALESCE(os.Description, vd.DESCRIPTION) NOT LIKE 'INACTIVE%')
    `,
  );
  // return await sqlHelper.query(
  //   `WITH CTE_OrgTree AS (
  //       SELECT
  //           os.Code,
  //           os.Parent,
  //           os.Level,
  //           CAST(os.Code AS VARCHAR(MAX)) AS Path,
  //           CASE WHEN os.Level = 1 THEN os.Code END AS CorporateOfficer1,
  //           CASE WHEN os.Level = 2 THEN os.Code END AS CorporateOfficer2,
  //           CASE WHEN os.Level = 3 THEN os.Code END AS Division1,
  //           CASE WHEN os.Level = 4 THEN os.Code END AS Division2,
  //           CASE WHEN os.Level = 5 THEN os.Code END AS [Group],
  //           CASE WHEN os.Level = 6 THEN os.Code END AS Department,
  //           CASE WHEN os.Level = 7 THEN os.Code END AS Section,
  //           CASE WHEN os.Level = 8 THEN os.Code END AS Area
  //       FROM [UE database]..OrganizationalStructure os
  //       WHERE os.Parent IS NULL

  //       UNION ALL

  //       SELECT
  //           os.Code,
  //           os.Parent,
  //           os.Level,
  //           CAST(cte.Path + ' -> ' + os.Code AS VARCHAR(MAX)) AS Path,
  //           CASE WHEN os.Level = 1 THEN os.Code ELSE cte.CorporateOfficer1 END,
  //           CASE WHEN os.Level = 2 THEN os.Code ELSE cte.CorporateOfficer2 END,
  //           CASE WHEN os.Level = 3 THEN os.Code ELSE cte.Division1 END,
  //           CASE WHEN os.Level = 4 THEN os.Code ELSE cte.Division2 END,
  //           CASE WHEN os.Level = 5 THEN os.Code ELSE cte.[Group] END,
  //           CASE WHEN os.Level = 6 THEN os.Code ELSE cte.Department END,
  //           CASE WHEN os.Level = 7 THEN os.Code ELSE cte.Section END,
  //           CASE WHEN os.Level = 8 THEN os.Code ELSE cte.Area END
  //       FROM [UE database]..OrganizationalStructure os
  //       INNER JOIN CTE_OrgTree cte ON os.Parent = cte.Code
  //   )

  //   SELECT
  //       cte.Code,
  //       COALESCE(os.Description, d.Description) AS CodeDescription,
  //       cte.Parent,
  //       cte.Path,

  //       cte.CorporateOfficer1,
  //       COALESCE(os1.Description, d1.Description) AS CorporateOfficer1Description,

  //       cte.CorporateOfficer2,
  //       COALESCE(os2.Description, d2.Description) AS CorporateOfficer2Description,

  //       cte.Division1,
  //       COALESCE(os3.Description, d3.Description) AS Division1Description,

  //       cte.Division2,
  //       COALESCE(os4.Description, d4.Description) AS Division2Description,

  //       cte.[Group],
  //       COALESCE(os5.Description, d5.Description) AS GroupDescription,

  //       cte.Department,
  //       COALESCE(os6.Description, d6.Description) AS DepartmentDescription,

  //       cte.Section,
  //       COALESCE(os7.Description, d7.Description) AS SectionDescription,

  //       cte.Area,
  //       COALESCE(os8.Description, d8.Description) AS AreaDescription

  //   FROM CTE_OrgTree cte
  //   LEFT JOIN [UE database]..OrganizationalStructure os ON cte.Code = os.Code
  //   LEFT JOIN UERMMMC..vw_Departments d ON os.Code = d.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os1 ON cte.CorporateOfficer1 = os1.Code
  //   LEFT JOIN UERMMMC..vw_Departments d1 ON os1.Code = d1.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os2 ON cte.CorporateOfficer2 = os2.Code
  //   LEFT JOIN UERMMMC..vw_Departments d2 ON os2.Code = d2.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os3 ON cte.Division1 = os3.Code
  //   LEFT JOIN UERMMMC..vw_Departments d3 ON os3.Code = d3.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os4 ON cte.Division2 = os4.Code
  //   LEFT JOIN UERMMMC..vw_Departments d4 ON os4.Code = d4.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os5 ON cte.[Group] = os5.Code
  //   LEFT JOIN UERMMMC..vw_Departments d5 ON os5.Code = d5.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os6 ON cte.Department = os6.Code
  //   LEFT JOIN UERMMMC..vw_Departments d6 ON os6.Code = d6.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os7 ON cte.Section = os7.Code
  //   LEFT JOIN UERMMMC..vw_Departments d7 ON os7.Code = d7.Code

  //   LEFT JOIN [UE database]..OrganizationalStructure os8 ON cte.Area = os8.Code
  //   LEFT JOIN UERMMMC..vw_Departments d8 ON os8.Code = d8.Code

  //   WHERE
  //       cte.Code <> 'N/A'
  //       AND COALESCE(os.Description, d.Description) NOT LIKE 'INACTIVE%'

  //   ORDER BY
  //       CodeDescription ASC
  //   `,
  // );
};

const getDepartments = async () => {
  return await sqlHelper.query(
    `SELECT 
      d.Code, 
      COALESCE(os.Description, d.DESCRIPTION) deptDescription,
      os.deleted
    FROM 
      UERMMMC..vw_Departments d
    LEFT JOIN 
      [UE database]..OrganizationalStructure os ON os.Code = d.CODE
    WHERE 
      d.DESCRIPTION NOT LIKE 'INACTIVE%'
    ORDER BY deptDescription ASC
    `,
  );
};

const checkDuplicate = async (department) => {
  return await sqlHelper.query(
    ` SELECT 
      os.Code, COALESCE(os.Description, d.DESCRIPTION) description, os.deleted, os.Parent, os.Level
    FROM [UE database]..OrganizationalStructure os
    LEFT JOIN UERMMMC..vw_Departments d ON os.Code = d.CODE
    WHERE os.Code = ?
    ORDER BY description ASC
    `,
    [department],
  );
};

const setNewHierarchy = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "[UE database]..OrganizationalStructure",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const insertNewHierarchy = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..OrganizationalStructure",
    item,
    txn,
    creationDateTimeField,
  );
};

module.exports = {
  getHiearchy,
  getDepartments,
  checkDuplicate,
  setNewHierarchy,
  insertNewHierarchy,
};

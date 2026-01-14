const helperMethods = require("../utility/helperMethods.js");
const helpers = require("../../../helpers/crypto.js");
const { SQLDataTypes } = require('../utility/enums.js'); 


async function getResponse(query, employeeID, link = '') {
  const parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: employeeID }
  ];

  if (link !== "") parameters.push({ name: "LINK", dataType: SQLDataTypes.VARCHAR, value: link });

  const response = await helperMethods.executeQuery(query, parameters);

  return (link === "") ? response.recordset[0].total : response.recordset;
}



async function getAllDepartments() {
  const query = `SELECT T.* FROM
                            (SELECT 
                            '0' AS 'department_id', 
                              'ANY DEPARTMENT' AS 'department_name'
                            UNION
                              SELECT 
                              TRIM(Code) AS 'department_id', 
                              TRIM([Description]) AS 'department_name'
                              FROM UERMMMC..SECTIONS
							            WHERE Deleted = 0
                            ) AS T
                          ORDER BY IIF(T.department_id = '0', 0, 1), T.department_name ASC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function searchEmployee(departmentID, employeeCode, lastName, firstName, middleName) {
  let query = `SELECT 
                  E.EmployeeCode AS 'employee_id',
                  E.LastName AS 'last_name',
                  E.FirstName AS 'first_name',
                  E.MiddleName AS 'middle_name',
                  S.[Description] AS 'department'
                  FROM [UE database]..Employee AS E
                  INNER JOIN UERMMMC..SECTIONS AS S
                  ON E.DeptCode = S.Code 
                  WHERE E.IsActive IN (1,0) `;

  if (departmentID !== '0') query += `AND S.Code = @DepartmentID `;
  if (!helperMethods.isNullOrUndefinedOrEmpty(employeeCode)) query += "AND E.EmployeeCode LIKE @EmployeeCode ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(lastName))  query += "AND E.LastName LIKE @LastName ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(firstName)) query += "AND E.FirstName LIKE @FirstName ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(middleName)) query += "AND E.MiddleName LIKE @MiddleName ";

  query += `ORDER BY E.LastName ASC`;

  const parameters = [];

  if (departmentID !== "0") parameters.push({ name: "DepartmentID", dataType: SQLDataTypes.VARCHAR, value: departmentID });
  if (!helperMethods.isNullOrUndefinedOrEmpty(employeeCode)) parameters.push({ name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value:  employeeCode });
  if (!helperMethods.isNullOrUndefinedOrEmpty(lastName)) parameters.push({ name: "LastName", dataType: SQLDataTypes.VARCHAR, value: `%${  lastName   }%`});
  if (!helperMethods.isNullOrUndefinedOrEmpty(firstName)) parameters.push({ name: "FirstName", dataType: SQLDataTypes.VARCHAR, value: `%${  firstName   }%`});
  if (!helperMethods.isNullOrUndefinedOrEmpty(middleName)) parameters.push({ name: "MiddleName", dataType: SQLDataTypes.VARCHAR, value: `%${  middleName   }%`});
  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

async function getTotalPRCIDs(employeeID) {
  // PRC ID (LICENSE)
  const query = `SELECT  
   COUNT(EmployeeCode) AS 'total'
   FROM [UE database]..License 
   WHERE EmployeeCode = @EmployeeID AND ExpirationDate IS NOT NULL`;
  return await getResponse(query, employeeID);
}

async function getTotalBirthCertificates(employeeID) {
  // BIRTH CERTIFICATE (FOR CHILDREN)
  const query = `SELECT COUNT(Recno) AS 'total' 
  FROM [UE database]..Family
  WHERE EmployeeCode = @EmployeeID  AND FamType = 'Child' AND HasAttachment = 1`;
  return await getResponse(query, employeeID);
}

async function getTotalMarriageCertificates(employeeID) {
  // MARRIAGE CERTIFICATE (FOR SPOUSE)
  const query = `SELECT 
  COUNT(Recno) AS 'total'
  FROM [UE database]..Family
  WHERE EmployeeCode = @EmployeeID  AND FamType = 'Spouse' AND HasAttachment = 1`;
  return await getResponse(query, employeeID);
}

async function getTotalTORs(employeeID) {
  // TOR (EDUCATIONAL BACKGROUND)
  const query = `SELECT 
  COUNT(EmployeeCode) AS 'total'
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND IsTranscriptSubmitted = 1 AND IsFinish = 1 AND HasAttachment = 1`;
  return await getResponse(query, employeeID);
}

async function getTotalDiplomas(employeeID) {
  // DIPLOMA (EDUCATIONAL BACKGROUND) 
  const query = `SELECT 
  COUNT(EmployeeCode) AS 'total'
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND IsDiplomaSubmitted = 1 AND IsFinish = 1 AND HasAttachment = 1`;
  return await getResponse(query, employeeID);
}

async function getTotalTrainingsOrSeminars(employeeID) {
  // TRAINING/SEMINAR CERTIFICATE
  const query = `SELECT 
  COUNT(EmployeeCode) AS 'total'
  FROM HR..EmployeeCompletedTrainingOrSeminar
  WHERE EmployeeCode = @EmployeeID`;
  return await getResponse(query, employeeID);
}

async function getNamesAndLinksPRCIDs(employeeID, token) {
  const link = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-prc-id?token=${  token  }&licenseName=`;
  const query = `SELECT 
  License AS 'name',
  @LINK + TRIM(License) AS 'link'
  FROM [UE database]..License 
  WHERE EmployeeCode = @EmployeeID AND ExpirationDate IS NOT NULL`;

  return await getResponse(query, employeeID, link);
}

async function getNamesAndLinksBirthCertificates(employeeID, token) {
  const link = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-birth-certificate?token=${  token  }&fileName=`;
  const query = `SELECT 
  FullName AS 'name',
  @LINK + TRIM(FullName) AS 'link'
  FROM [UE database]..Family WHERE EmployeeCode = @EmployeeID AND FamType = 'Child' AND HasAttachment = 1`;

  return await getResponse(query, employeeID, link);
}

async function getNamesAndLinksMarriageCertificates(employeeID, token) {
  const link = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-marriage-certificate?token=${  token}`;
  const query = `SELECT 
  FullName AS 'name',
  @LINK AS 'link'
  FROM [UE database]..Family WHERE EmployeeCode = @EmployeeID AND FamType = 'Spouse' AND HasAttachment = 1`;

  return await getResponse(query, employeeID, link);
}

async function getNamesAndLinksTORs(employeeID, token) {
  const link = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-tor-or-diploma?token=${  token  }&diploma=`;
  const query = `SELECT 
  (TRIM(D.[Description]) + ' IN ' + TRIM(C.[Description]) + ISNULL(' ' + TRIM(M.[Description]), '')) 'name',
   @LINK +  (TRIM(D.[Description]) + ' IN ' + TRIM(C.[Description]) + ISNULL(' ' + TRIM(M.[Description]), '')) + '&document=tor' AS 'link'
  FROM [UE database]..Education AS E
  INNER JOIN HR..CollegeDegrees AS D
  ON D.ID = E.CollegeDegreeID
  INNER JOIN HR..CollegeCourses AS C
  ON C.ID = E.CollegeCourseID
  LEFT JOIN HR..CollegeMajors AS M
  ON M.ID = E.CollegeMajorID
  WHERE E.EmployeeCode = @EmployeeID AND E.IsTranscriptSubmitted = 1 AND E.IsFinish = 1 AND E.HasAttachment = 1`;

  return await getResponse(query, employeeID, link);
}

async function getNamesAndLinksDiplomas(employeeID, token) {
  const link = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-tor-or-diploma?token=${  token  }&diploma=`;
  const query = `SELECT 
  (TRIM(D.[Description]) + ' IN ' + TRIM(C.[Description]) + ISNULL(' ' + TRIM(M.[Description]), '')) 'name',
  @LINK +  (TRIM(D.[Description]) + ' IN ' + TRIM(C.[Description]) + ISNULL(' ' + TRIM(M.[Description]), '')) + '&document=diploma' AS 'link'
  FROM [UE database]..Education AS E
  INNER JOIN HR..CollegeDegrees AS D
  ON D.ID = E.CollegeDegreeID
  INNER JOIN HR..CollegeCourses AS C
  ON C.ID = E.CollegeCourseID
  LEFT JOIN HR..CollegeMajors AS M
  ON M.ID = E.CollegeMajorID
  WHERE E.EmployeeCode = @EmployeeID AND E.IsDiplomaSubmitted = 1 AND E.IsFinish = 1 AND E.HasAttachment = 1`;

  return await getResponse(query, employeeID, link);
}

async function getNamesAndLinksTrainingsOrSeminars(employeeID, token) {
  const link = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-training-or-seminar-certificate?token=${  token  }&trainingOrSeminarName=`;
  const query = `SELECT 
  TrainingOrSeminarName AS 'name',
  @LINK + TRIM(TrainingOrSeminarName) AS 'link'
  FROM HR..EmployeeCompletedTrainingOrSeminar WHERE EmployeeCode = @EmployeeID`;

  return await getResponse(query, employeeID, link);
}

async function getEmployeeAttachments(employeeID) {
  const user = { employee_id: employeeID };

  const token = helpers.generateAccessToken(user);

  const employeeAttachments = {
    totals: {
      prc_id: await getTotalPRCIDs(employeeID),
      birth_certificate: await getTotalBirthCertificates(employeeID),
      marriage_certificate: await getTotalMarriageCertificates(employeeID),
      tor: await getTotalTORs(employeeID),
      diploma: await getTotalDiplomas(employeeID),
      training_or_seminar: await getTotalTrainingsOrSeminars(employeeID),
    },
    names_and_links: {
      prc_id: await getNamesAndLinksPRCIDs(employeeID, token),
      birth_certificate: await getNamesAndLinksBirthCertificates(employeeID, token),
      marriage_certificate: await getNamesAndLinksMarriageCertificates(employeeID, token),
      tor: await getNamesAndLinksTORs(employeeID, token),
      diploma: await getNamesAndLinksDiplomas(employeeID, token),
      training_or_seminar: await getNamesAndLinksTrainingsOrSeminars(employeeID, token),
    }
  };

  return employeeAttachments;
}

module.exports = {
  getAllDepartments,
  searchEmployee,
  getEmployeeAttachments
}
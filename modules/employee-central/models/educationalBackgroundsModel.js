const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 

async function get(employeeID, token) {
  const query = `SELECT
  ISNULL(TRIM(E.[From]), '') AS 'from',
  ISNULL(TRIM(E.[To]), '') AS 'to',  
   UPPER(TRIM(CASE 
        WHEN E.CollegeDegreeID IS NOT NULL AND E.CollegeCourseID IS NOT NULL AND CollegeMajorID IS NULL
         THEN  CONCAT(CD.[Description], ' IN ', CC.[Description])
        WHEN E.CollegeDegreeID IS NOT NULL AND E.CollegeCourseID IS NOT NULL AND CollegeMajorID IS NOT NULL
         THEN  CONCAT(CD.[Description], ' IN ', CC.[Description], ' ', CM.[Description])
        ELSE 
          E.DiplomaDegreeHonor
   END)) AS 'diploma',
   UPPER(CASE 
        WHEN E.Institution IS NULL AND E.SchoolListID IS NOT NULL
		   THEN SL.[Description]
        ELSE
		   ISNULL(TRIM(E.Institution), '')
   END) AS 'institution_name',
   UPPER(CASE 
        WHEN E.InstitutionAddress IS NULL AND E.SchoolListID IS NOT NULL
		     THEN SL.Province + ', ' + SL.MunicipalityCity 
        ELSE
		   ISNULL(TRIM(E.InstitutionAddress), '')
   END) AS 'institution_location',
  '' AS 'attached_tor',
  '' AS 'attached_diploma'
  FROM [UE database]..Education AS E
  LEFT JOIN HR..CollegeDegrees AS CD
  ON CD.ID = E.CollegeDegreeID
  LEFT JOIN HR..CollegeCourses AS CC
  ON CC.ID = E.CollegeCourseID
  LEFT JOIN HR..CollegeMajors AS CM
  ON CM.ID = E.CollegeMajorID
  LEFT JOIN HR..SchoolList AS SL
  ON SL.ID = E.SchoolListID
  WHERE E.EmployeeCode = @EmployeeID AND E.deleted != 1
  ORDER BY E.[From] DESC`;

  const parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: employeeID }
  ];

  const records = (await helperMethods.executeQuery(query, parameters)).recordset;

  for (let i = 0; i < records.length; i++) {
    const diploma = records[i].diploma;
    const uploadedFolderPath = helperMethods.getUploadedFolderPath();
    const path = `${uploadedFolderPath  }/current_files/${  employeeID  }/educational_backgrounds/${  diploma}`;
    if (await helperMethods.isFolderExist(path) === true) {
      if (await helperMethods.isFolderEmpty(path) === false) {
        const url = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-tor-or-diploma?token=${  token}`;
        const attachedTOR = `${url  }&diploma=${  diploma  }&document=tor`;
        const attachedDiploma = `${url  }&diploma=${  diploma  }&document=diploma`;
        records[i].attached_tor = attachedTOR;
        records[i].attached_diploma = attachedDiploma;
      } else {
        throw `The folder: ${diploma} is empty.`;
      }
    }
  }

  return records;
}

async function isDegreeExist(degreeName){
  const query = `SELECT 
                 COUNT(ID) AS 'total'
                 FROM HR..CollegeDegrees 
                 WHERE [Description] = @Description`;
const parameters = [{ name: "Description", dataType: SQLDataTypes.VARCHAR, value: degreeName }];
const response = await helperMethods.executeQuery(query, parameters);
return (response.recordset[0].total !== 0 && response.recordset[0].total > 0) ? true : false;
}

async function isCourseExist(courseName){
  const query = `SELECT 
                 COUNT(ID) AS 'total'
                 FROM HR..CollegeCourses 
                 WHERE [Description] = @Description`;
const parameters = [{ name: "Description", dataType: SQLDataTypes.VARCHAR, value: courseName }];
const response = await helperMethods.executeQuery(query, parameters);
return (response.recordset[0].total !== 0 && response.recordset[0].total > 0) ? true : false;
}

async function isMajorExist(majorName){
  const query = `SELECT 
                 COUNT(ID) AS 'total'
                 FROM HR..CollegeMajors 
                 WHERE [Description] = @Description`;
const parameters = [{ name: "Description", dataType: SQLDataTypes.VARCHAR, value: majorName }];
const response = await helperMethods.executeQuery(query, parameters);
return (response.recordset[0].total !== 0 && response.recordset[0].total > 0) ? true : false;
}


async function isDiplomaExist(data) {
  let query = `SELECT 
  TOP 1 RecNo
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND deleted != 1 AND 
  SchoolListID = @SchoolListID AND CollegeDegreeID = @CollegeDegreeID AND 
  CollegeCourseID = @CollegeCourseID`;

  if (data.major_id !== null) query += " AND CollegeMajorID = @CollegeMajorID";

  let parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: data.employee_id },
    { name: "SchoolListID", dataType: SQLDataTypes.INT, value: data.school_id },
    { name: "CollegeDegreeID", dataType: SQLDataTypes.INT, value: data.degree_id },
    { name: "CollegeCourseID", dataType: SQLDataTypes.INT, value: data.course_id }
  ];

  if (data.major_id !== null) parameters.push({ name: "CollegeMajorID", dataType: SQLDataTypes.INT, value: data.major_id });

  let response = await helperMethods.executeQuery(query, parameters);

  if (response.recordset[0] !== undefined && response.recordset.length > 0) return true;

  query = `SELECT 
  TOP 1 RecNo
  FROM [UE database]..Education
  WHERE EmployeeCode = @EmployeeID AND deleted != 1 AND DiplomaDegreeHonor = @Diploma`;

  parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: data.employee_id },
    { name: "Diploma", dataType: SQLDataTypes.VARCHAR, value: data.diploma }
  ];

  response = await helperMethods.executeQuery(query, parameters);

  const length = (response.recordset[0] !== undefined) ? response.recordset[0].length : 0;
  return (length > 0) ? true : false;
}

async function getDegrees() {
  const query = `SELECT 
               ID AS 'degree_id',
               TRIM(UPPER([Description])) AS 'degree_name' 
              FROM HR..CollegeDegrees
              WHERE IsActive = 1
              ORDER BY [Description] ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getCourses() {
  const query = `SELECT 
               ID AS 'course_id',
               TRIM(UPPER([Description])) AS 'course_name' 
              FROM HR..CollegeCourses
              WHERE IsActive = 1
              ORDER BY [Description] ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getInstitutions() {
  const query = ` SELECT 
                ID AS 'school_id',
                TRIM(UPPER([Description])) AS 'school_name', 
                TRIM(UPPER(ISNULL(Province + ', ' + MunicipalityCity, ''))) AS 'location'
                FROM HR..SchoolList
                WHERE IsDeleted = 0
                ORDER BY [Description] ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getMajors(courseID) {
  const query = `SELECT 
               ID AS 'major_id',
               TRIM([Description]) AS 'major_name'
            FROM HR..CollegeMajors
            WHERE CollegeCourseID = @CourseID
            ORDER BY [Description] ASC`;

  const parameters = [
    { name: "CourseID", dataType: SQLDataTypes.INT, value: courseID }
  ];

  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

async function getOptions() {
  const response = {
    degrees: await getDegrees(),
    courses: await getCourses(),
    institutions: await getInstitutions()
  };
  return response;
}

function toActualColumnName(column) {
  if (column === "from") return "From";
  else if (column === "to") return "To";
  else if (column === "diploma") return "DiplomaDegreeHonor";
  else if (column === "institution_name") return "Institution";
  else if (column === "institution_location") return "InstitutionAddress";
  else if (column === "attach_tor") return "TOR";
  else if (column === "attach_diploma") return "DIPLOMA";
  else if (column === "school_id") return "SchoolListID";
  else if (column === "degree_id") return "CollegeDegreeID";
  else if (column === "course_id") return "CollegeCourseID";
  else if (column === "major_id") return "CollegeMajorID";
  else throw `Cannot find the actual name of ${  column}`;
}

async function manipulateTableRequestDtl(transaction, id, data) {
  delete data.employee_id;
  delete data.request_type;
  delete data.diploma;

  if (data.major_id === null) delete data.major_id;

  for (const column in data) {
    const actualColumnName = toActualColumnName(column);
    let requestedNewValue = data[column];

    if (actualColumnName === "TOR" || actualColumnName === "DIPLOMA") requestedNewValue = `${actualColumnName.toLowerCase()  }.${  requestedNewValue.split('.').pop()}`;
    else requestedNewValue = requestedNewValue.toString().toUpperCase().trim();

    if (actualColumnName === "CollegeDegreeID" || actualColumnName === "CollegeCourseID") requestedNewValue = requestedNewValue.replace("IN", "");
    else if (actualColumnName === "CollegeMajorID") {
      const containsMajorIn = requestedNewValue.includes("MAJOR IN");
      if (!containsMajorIn) requestedNewValue = `MAJOR IN ${requestedNewValue}`;
    }

    const query = `INSERT INTO [UE database]..RequestDtl 
          (RequestHdrID, ColumnName, NewValue)
          VALUES 
          (@RequestHdrID, @ColumnName, @NewValue)`;

    const parameters = [
      { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: id },
      { name: "ColumnName", dataType: SQLDataTypes.VARCHAR, value: actualColumnName },
      { name: "NewValue", dataType: SQLDataTypes.VARCHAR, value: requestedNewValue }
    ];

    helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
  }
}

async function createRequest(data) {
  let transaction;
  try {
    transaction = await helperMethods.beginTransaction();

    const createdBy = data.employee_id;
    const destinationTable = "Education";

    let query = `INSERT INTO [UE database]..RequestHdr 
             (CreatedBy, DateTimeCreated, DestinationTable, RequestType)
             VALUES 
             (@CreatedBy, GETDATE(), @DestinationTable, @RequestType)`;

    const parameters = [
      { name: "CreatedBy", dataType: SQLDataTypes.VARCHAR, value: createdBy },
      { name: "DestinationTable", dataType: SQLDataTypes.VARCHAR, value: destinationTable },
      { name: "RequestType", dataType: SQLDataTypes.SMALLINT, value: 1 }, // 1 = create
    ];

    helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));

    query = `SELECT TOP 1
             ID AS 'request_id'
             FROM [UE database]..RequestHdr 
             ORDER BY DateTimeCreated DESC`;
    const response = await helperMethods.executeQuery(query, null, transaction);
    const requestID = response.recordset[0].request_id;

    if (data.request_type === "create") await manipulateTableRequestDtl(transaction, requestID, data);
    else throw "Invalid value of request type";

    await helperMethods.commitTransaction(transaction);
    return requestID;
  } catch (error) {
    await helperMethods.rollbackTransaction(transaction);
    throw error;
  }
}

module.exports = {
  get,
  createRequest,
  isDiplomaExist,
  getOptions,
  getInstitutions,
  getDegrees,
  getCourses,
  getMajors,
  isDegreeExist,
  isCourseExist,
  isMajorExist
}
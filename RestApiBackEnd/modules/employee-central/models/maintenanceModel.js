const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 

async function getAllModules() {
  const query = `SELECT 
  ID AS 'module_id', 
  UPPER(TRIM(ModuleName)) AS 'module_name'
  FROM HR..PISMaintenanceModuleNames
  ORDER BY ModuleName ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getAllFields(moduleID) {
  const query = `SELECT 
  ID AS 'field_id', 
  UPPER(TRIM(FieldName)) AS 'field_name'
  FROM HR..PISMaintenanceModuleFields
  WHERE PISModuleNameID = @PISModuleNameID
  ORDER BY FieldName ASC`;

  const parameters = [
    { name: "PISModuleNameID", dataType: SQLDataTypes.INT, value: Number(moduleID) }
  ];

  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

async function getList(fieldName, statusID, description) {
  // Trim field name and description
  fieldName = fieldName.trim();
  description = description.trim();

  // Define base query for each field name
  let baseQuery = "";
 if (fieldName === "COURSES") {
    baseQuery = `SELECT 
      C.ID AS 'id',
      TRIM(C.[Description]) AS 'description',
      (CASE 
        WHEN C.IsActive = 1
          THEN 'Active'
        ELSE 
          'Inactive'
      END) AS 'status',
      TRIM(E1.LastName + ', ' + E1.FirstName + ' ' + LEFT(E1.MiddleName, 1) + '. ' + E1.ExtName) AS 'created_by',
      C.DateTimeCreated AS 'date_time_created',
      TRIM(E2.LastName + ', ' + E2.FirstName + ' ' + LEFT(E2.MiddleName, 1) + '. ' + E2.ExtName) AS 'updated_by',
      C.DateTimeUpdated AS 'date_time_updated'
      FROM HR..CollegeCourses AS C
      INNER JOIN [UE database]..Employee AS E1
      ON C.CreatedBy = E1.EmployeeCode
      LEFT JOIN [UE database]..Employee AS E2
      ON C.UpdatedBy = E2.EmployeeCode
      `;
  }
 else if (fieldName === "DEGREES") {
    baseQuery = `SELECT 
      C.ID AS 'id',
      TRIM(C.[Description]) AS 'description',
      (CASE 
        WHEN C.IsActive = 1
          THEN 'Active'
        ELSE 
          'Inactive'
      END) AS 'status',
      TRIM(E1.LastName + ', ' + E1.FirstName + ' ' + LEFT(E1.MiddleName, 1) + '. ' + E1.ExtName) AS 'created_by',
      C.DateTimeCreated AS 'date_time_created',
      TRIM(E2.LastName + ', ' + E2.FirstName + ' ' + LEFT(E2.MiddleName, 1) + '. ' + E2.ExtName) AS 'updated_by',
      C.DateTimeUpdated AS 'date_time_updated'
      FROM HR..CollegeDegrees AS C 
      INNER JOIN [UE database]..Employee AS E1
      ON C.CreatedBy = E1.EmployeeCode
      LEFT JOIN [UE database]..Employee AS E2
      ON C.UpdatedBy = E2.EmployeeCode`;
  } 
  else if (fieldName === "MAJORS") {
    baseQuery = `SELECT 
      CM.ID AS 'id',
      CC.ID AS 'course_id',
      CC.[Description] AS 'course',
      TRIM(CM.[Description]) AS 'description',
      (CASE 
        WHEN CM.IsActive = 1
          THEN 'Active'
        ELSE 
          'Inactive'
      END) AS 'status',
      TRIM(E1.LastName + ', ' + E1.FirstName + ' ' + LEFT(E1.MiddleName, 1) + '. ' + E1.ExtName) AS 'created_by',
      CM.DateTimeCreated AS 'date_time_created',
      TRIM(E2.LastName + ', ' + E2.FirstName + ' ' + LEFT(E2.MiddleName, 1) + '. ' + E2.ExtName) AS 'updated_by',
      CM.DateTimeUpdated AS 'date_time_updated'
      FROM HR..CollegeMajors AS CM
      INNER JOIN HR..CollegeCourses AS CC
      ON CC.ID = CM.CollegeCourseID
      INNER JOIN [UE database]..Employee AS E1
      ON CM.CreatedBy = E1.EmployeeCode
      LEFT JOIN [UE database]..Employee AS E2
      ON CM.UpdatedBy = E2.EmployeeCode`;
  } else throw "Invalid value of fieldName";


  // Append WHERE conditions based on statusID and description
  let whereClause = "";
  if (statusID !== '0') {
    whereClause = " WHERE ";
    whereClause += (fieldName === "MAJORS") ? "CM." : " C.";

    if (statusID === '1') whereClause += "IsActive = 1";
    else if (statusID === '2') whereClause += "IsActive = 0";
  }

  if (description !== "") {
    if (whereClause !== "") whereClause += " AND ";
    else whereClause = " WHERE ";

    whereClause += (fieldName === "MAJORS") ? "CM." : " C.";

    whereClause += `[Description] LIKE @Description`;
  }

  // Append ORDER BY clause
  let orderByClause = " ORDER BY ";
  orderByClause += (fieldName === "MAJORS") ? "CM." : "C.";
  orderByClause += "[Description] ASC";

  // Construct final query by combining base query, WHERE conditions, and ORDER BY clause
  const query = baseQuery + whereClause + orderByClause;


  const parameters = [
    { name: "Description", dataType: SQLDataTypes.VARCHAR, value: `%${  description  }%` }
  ];

  return (await helperMethods.executeQuery(query, parameters)).recordset;
}


async function submit(body) {
  let query = "";

  const parameters = [
    { name: "Description", dataType: SQLDataTypes.VARCHAR, value: body.description },
    { name: "IsActive", dataType: SQLDataTypes.BIT, value: body.is_active },
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: body.employee_id },
  ];


  if (body.action_name === "ADD NEW") {

      query = `INSERT INTO HR..${body.table_name} 
      (Description, IsActive, CreatedBy, DateTimeCreated`;
   
      query +=  (body.table_name !== "CollegeMajors") ?  ")":  ", CollegeCourseID)";

      query +=` VALUES (@Description, @IsActive, @EmployeeID, GETDATE()`;
  
      query +=  (body.table_name !== "CollegeMajors") ?  ")":  ", @CollegeCourseID)";

  } else if (body.action_name === "EDIT") {

      query = `UPDATE HR..${body.table_name} 
               SET Description = @Description, IsActive = @IsActive,
               UpdatedBy = @EmployeeID, DateTimeUpdated = GETDATE()`;

        if (body.table_name === "CollegeMajors") query += ", CollegeCourseID = @CollegeCourseID";  
        query += " WHERE ID = @ID";
  
        if (body.action_name === "EDIT") parameters.push({ name: "ID", dataType: SQLDataTypes.INT, value: body.id });
  }

  if (body.table_name === "CollegeMajors") parameters.push({ name: "CollegeCourseID", dataType: SQLDataTypes.INT, value: body.course_id });

  helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters));
}


async function isDescriptionExist(tableName, description) {
  const query = `SELECT 
                 COUNT(ID) AS 'total'
                 FROM HR..${tableName}
                 WHERE [Description] = @Description`;

  const parameters = [
    { name: "Description", dataType: SQLDataTypes.VARCHAR, value: description }
  ];

  const response = await helperMethods.executeQuery(query, parameters);
  const total = response.recordset[0].total;
  return (total > 0) ? true : false;
}

async function getCourses() {
  const query = `SELECT 
                 ID AS 'course_id',
                 TRIM(UPPER([Description])) AS 'course_name' 
                 FROM HR..CollegeCourses
                 ORDER BY [Description] ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}



module.exports = {
  getAllModules,
  getAllFields,
  getList,
  isDescriptionExist,
  getCourses,
  submit
}
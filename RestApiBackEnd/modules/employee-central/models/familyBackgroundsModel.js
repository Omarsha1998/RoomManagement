const uploadsModel = require("./uploadsModel.js");
const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require("../utility/enums.js");

function toActualColumnName(columnName) {
  if (columnName === "occupation") return "Occupation";
  else if (columnName === "full_name") return "FullName";
  else if (columnName === "birth_date") return "Birthdate";
  else if (columnName === "school_name_or_company_name") return "CompanySchool";
}

function toSentenceCase(str) {
  return str.toLowerCase().replace(/^(.)|\s+(.)/g, function ($1) {
    return $1.toUpperCase();
  });
}

async function getRelationships() {
  const query = `SELECT 
                 TRIM(UPPER([Description])) AS 'relationship'
                 FROM [UE database]..FamilyType
                 WHERE PIS_IsDeleted = 0
                 ORDER BY [Description] ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getRelationshipCategories() {
  const query = `SELECT 
                 T.Category 
                 FROM (
                      SELECT
                          'ALL' AS 'Category', 
                          NULL AS ID
                      UNION
                      SELECT 
                          TRIM([Description]) AS Category, 
                          ID
                      FROM [UE database]..FamilyTypeCategory
                      WHERE PIS_IsDeleted = 0
                 ) AS T
                 ORDER BY T.ID ASC`;
  return (await helperMethods.executeQuery(query)).recordset.map(
    (obj) => obj.Category,
  );
}

async function hasChange(data) {
  const query = `SELECT TOP 1
                 FullName
                 FROM [UE database]..Family 
                 WHERE EmployeeCode = @EmployeeID
                 AND Occupation = @Occupation 
                 AND CompanySchool = @CompanySchool
                 AND FamType = @FamType
                 AND Birthdate = @Birthdate
                 AND FullName = @FullName`;

  const parameters = [
    {
      name: "EmployeeID",
      dataType: SQLDataTypes.VARCHAR,
      value: data.employee_id,
    },
    {
      name: "Occupation",
      dataType: SQLDataTypes.VARCHAR,
      value: data.occupation,
    },
    {
      name: "CompanySchool",
      dataType: SQLDataTypes.VARCHAR,
      value: data.school_name_or_company_name,
    },
    {
      name: "FamType",
      dataType: SQLDataTypes.VARCHAR,
      value: data.family_type,
    },
    { name: "Birthdate", dataType: SQLDataTypes.DATE, value: data.birth_date },
    { name: "FullName", dataType: SQLDataTypes.VARCHAR, value: data.full_name },
  ];

  const response = (await helperMethods.executeQuery(query, parameters))
    .recordset;

  if (response.length > 0) {
    if (
      data.family_type === "CHILD" &&
      data.attach_birth_certificate !== undefined &&
      data.attach_birth_certificate !== ""
    )
      return true;
    else if (
      data.family_type === "SPOUSE" &&
      data.attach_marriage_certificate !== undefined &&
      data.attach_marriage_certificate !== ""
    )
      return true;

    return false;
  } else {
    return true;
  }
}

async function removeNoChanges(data) {
  const unUsedIndexes = [];
  for (const item of data) {
    const query = `
    SELECT TOP 1 
    FullName
    FROM [UE database]..Family 
    WHERE FamType = @FamType 
    AND FullName = @FullName 
    AND Occupation = @Occupation 
    AND CompanySchool = @CompanySchool
    AND EmployeeCode = @EmployeeCode
    AND Birthdate = @Birthdate`;

    const parameters = [
      {
        name: "FamType",
        dataType: SQLDataTypes.VARCHAR,
        value: item.family_type,
      },
      {
        name: "FullName",
        dataType: SQLDataTypes.VARCHAR,
        value: item.full_name,
      },
      {
        name: "Occupation",
        dataType: SQLDataTypes.VARCHAR,
        value: item.occupation,
      },
      {
        name: "CompanySchool",
        dataType: SQLDataTypes.VARCHAR,
        value: item.school_name_or_company_name,
      },
      {
        name: "EmployeeCode",
        dataType: SQLDataTypes.VARCHAR,
        value: item.employee_id,
      },
      {
        name: "Birthdate",
        dataType: SQLDataTypes.DATE,
        value: item.birth_date,
      },
    ];

    const response = (await helperMethods.executeQuery(query, parameters))
      .recordset;

    if (response.length === 1) {
      const index = data.findIndex((x) => x.full_name === item.full_name);
      unUsedIndexes.push(index);
    }
  }

  for (let i = unUsedIndexes.length - 1; i >= 0; i--) {
    data.splice(unUsedIndexes[i], 1);
  }

  return data;
}

async function manipulateTableRequestDtl(
  transaction,
  id,
  familyType,
  data,
  personQueueNumber,
) {
  const employeeID = data.employee_id;
  const familyID = data.family_id;
  delete data.family_id;
  delete data.employee_id;
  delete data.request_type;
  delete data.family_type;

  if (data.attach_marriage_certificate === "") {
    delete data.attach_marriage_certificate;
  }

  if (data.attach_birth_certificate === "") {
    delete data.attach_birth_certificate;
  }

  let parameters;
  let response;
  let query;

  for (const column in data) {
    if (
      column === "attach_marriage_certificate" ||
      column === "attach_birth_certificate"
    ) {
      if (column === "attach_birth_certificate" && personQueueNumber === null) {
        query = `INSERT INTO [UE database]..RequestDtl 
                      (RequestHdrID, ColumnName, NewValue, FamilyRecno)
                      VALUES 
                      (@RequestHdrID, @ColumnName, @NewValue, @FamilyRecno)`;

        parameters = [
          { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: id },
          {
            name: "ColumnName",
            dataType: SQLDataTypes.VARCHAR,
            value: "BIRTH CERTIFICATE",
          },
          {
            name: "NewValue",
            dataType: SQLDataTypes.VARCHAR,
            value: `${data.full_name.trim()}.${data[column].split(".").pop()}`,
          },
          { name: "FamilyRecno", dataType: SQLDataTypes.INT, value: familyID },
        ];

        helperMethods.checkRowsAffected(
          await helperMethods.executeQuery(query, parameters, transaction),
        );
      } else {
        query = `INSERT INTO [UE database]..RequestDtl 
                      (RequestHdrID, ColumnName, NewValue, PersonQueueNumber, FamilyRecno)
                      VALUES 
                      (@RequestHdrID, @ColumnName, @NewValue, @PersonQueueNumber, @FamilyRecno)`;
        const columnName =
          column === "attach_marriage_certificate"
            ? "MARRIAGE CERTIFICATE"
            : "BIRTH CERTIFICATE";
        let newValue = "";
        if (column === "attach_marriage_certificate") {
          newValue = `marriage_certificate.${data[column].split(".").pop()}`;
        } else {
          newValue = `${data.full_name.trim()}.${data[column].split(".").pop()}`;
        }

        parameters = [
          { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: id },
          {
            name: "ColumnName",
            dataType: SQLDataTypes.VARCHAR,
            value: columnName,
          },
          { name: "NewValue", dataType: SQLDataTypes.VARCHAR, value: newValue },
          {
            name: "PersonQueueNumber",
            dataType: SQLDataTypes.SMALLINT,
            value: personQueueNumber,
          },
          { name: "FamilyRecno", dataType: SQLDataTypes.INT, value: familyID },
        ];

        helperMethods.checkRowsAffected(
          await helperMethods.executeQuery(query, parameters, transaction),
        );
      }
    } else {
      const actualColumnName = toActualColumnName(column);
      const columnValue = data[column];

      query = `SELECT TOP 1 
               EmployeeCode
               FROM [UE database]..Family 
               WHERE EmployeeCode = @EmployeeCode 
               AND FamType = '${familyType}' 
               AND ${actualColumnName} = '${columnValue}'`;

      parameters = [
        {
          name: "EmployeeCode",
          dataType: SQLDataTypes.VARCHAR,
          value: employeeID,
        },
      ];

      response = await helperMethods.executeQuery(
        query,
        parameters,
        transaction,
      );

      const isExist = response.recordset.length === 0 ? false : true;
      if (isExist === false) {
        const requestedNewValue = data[column];
        let columnCurrentValue = "";

        // ------------------------------------------------- EDIT -------------------------------------------------
        if (personQueueNumber === null) {
          query = `SELECT TOP 1 
                  ${actualColumnName}
                  FROM [UE database]..Family 
                  WHERE EmployeeCode = @EmployeeCode 
                  AND FamType = '${familyType}'`;

          if (familyID !== undefined) query += ` AND Recno = ${familyID}`;

          parameters = [
            {
              name: "EmployeeCode",
              dataType: SQLDataTypes.VARCHAR,
              value: employeeID,
            },
          ];

          response = await helperMethods.executeQuery(
            query,
            parameters,
            transaction,
          );
          const columnObject = response.recordset[0];
          columnCurrentValue = columnObject[Object.keys(columnObject)[0]];
          columnCurrentValue =
            columnCurrentValue === null ? "" : columnCurrentValue;

          if (columnCurrentValue === "" && requestedNewValue === "") continue;
        }
        // ------------------------------------------------- EDIT -------------------------------------------------

        // ------------------------------------------------- FOR BIRTHDATE -------------------------------------------------
        if (typeof columnCurrentValue === "object") {
          const year = columnCurrentValue.getFullYear();
          const month = String(columnCurrentValue.getMonth() + 1).padStart(
            2,
            "0",
          );
          const day = String(columnCurrentValue.getDate()).padStart(2, "0");
          columnCurrentValue = `${year}-${month}-${day}`;
        }
        // ------------------------------------------------- FOR BIRTHDATE -------------------------------------------------

        if (familyType !== "") {
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (personQueueNumber === null) {
            query = `INSERT INTO [UE database]..RequestDtl 
          (RequestHdrID, ColumnName, OldValue, NewValue, FamilyRecno)
          VALUES 
          (@RequestHdrID, @ColumnName, @OldValue, @NewValue, @FamilyRecno)`;
          }
          // ------------------------------------------------- EDIT -------------------------------------------------

          // ------------------------------------------------- CREATE -------------------------------------------------
          else {
            query = `INSERT INTO [UE database]..RequestDtl 
          (RequestHdrID, ColumnName, NewValue, PersonQueueNumber)
          VALUES 
          (@RequestHdrID, @ColumnName, @NewValue, @PersonQueueNumber)`;
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        } else {
          query = `INSERT INTO [UE database]..RequestDtl 
        (RequestHdrID, ColumnName, OldValue, NewValue)
        VALUES 
        (@RequestHdrID, @ColumnName, @OldValue, @NewValue)`;
        }

        parameters = [
          { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: id },
          {
            name: "ColumnName",
            dataType: SQLDataTypes.VARCHAR,
            value: actualColumnName,
          },
        ];

        if (personQueueNumber === null)
          parameters.push({
            name: "OldValue",
            dataType: SQLDataTypes.VARCHAR,
            value: columnCurrentValue.toString().toUpperCase(),
          });

        parameters.push({
          name: "NewValue",
          dataType: SQLDataTypes.VARCHAR,
          value: requestedNewValue.toString().toUpperCase(),
        });

        if (familyType !== "") {
          if (personQueueNumber === null)
            parameters.push({
              name: "FamilyRecno",
              dataType: SQLDataTypes.INT,
              value: familyID,
            });
          else
            parameters.push({
              name: "PersonQueueNumber",
              dataType: SQLDataTypes.SMALLINT,
              value: personQueueNumber,
            });
        }

        helperMethods.checkRowsAffected(
          await helperMethods.executeQuery(query, parameters, transaction),
        );
      }
    }
  }
}

async function getMarriageCertificate(employeeID, token) {
  if ((await uploadsModel.getCurrentMarriageCertificate(employeeID)) === "")
    return "";
  return `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-marriage-certificate?token=${token}`;
}

async function getBirthCertificates(record, employeeID, token) {
  const fullName = record.full_name;
  const uploadedFolderPath = helperMethods.getUploadedFolderPath();
  const path = `${uploadedFolderPath}/current_files/${employeeID}/family_backgrounds/children/birth_certificate/`;
  if ((await helperMethods.isFolderExist(path)) === true) {
    if ((await helperMethods.isFolderEmpty(path)) === false) {
      if ((await helperMethods.isExist(`${path}${fullName}.pdf`)) === true) {
        let url = `/${process.env.EC_EJS_VIEWS_FOLDER}/uploads/get-current-birth-certificate?token=${token}`;
        url += `&fileName=${fullName}`;
        record.birth_certificate = url;
        return record.birth_certificate;
      }
      return "";
    }
    throw `The folder birth_certificate was not found.`;
  }
  return "";
}

async function get(employeeID, token) {
  const query = `SELECT 
                  Recno AS 'id',
                  TRIM(FullName) AS 'full_name',
                  TRIM(UPPER(FamType)) AS 'relationship',
                  '' AS 'certificate',
                  ISNULL(FORMAT(Birthdate, 'yyyy-MM-dd'), '') AS 'birth_date',
                  IIF(Birthdate = '' OR Birthdate IS NULL, 0, FLOOR(DATEDIFF(DD, ISNULL(CAST((Birthdate) AS DATE),'1900-01-01'), GETDATE())/365.242)) AS 'age',
                  ISNULL(TRIM(Occupation), '') AS 'occupation',
                  ISNULL(TRIM(CompanySchool), '') AS 'school_name_or_company_name'
                  FROM [UE database]..Family
                  WHERE EmployeeCode = @EmployeeID AND (deleted = 0 OR deleted IS NULL)
                  ORDER BY FullName ASC`;

  const parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: employeeID },
  ];

  const records = (await helperMethods.executeQuery(query, parameters))
    .recordset;

  for (let i = 0; i < records.length; i++) {
    if (records[i].relationship === "SPOUSE")
      records[i].certificate = await getMarriageCertificate(employeeID, token);
    else if (records[i].relationship === "CHILD")
      records[i].certificate = await getBirthCertificates(
        records[i],
        employeeID,
        token,
      );
  }

  return records;
}

async function createRequest(data) {
  let transaction;
  try {
    transaction = await helperMethods.beginTransaction();
    const createdBy =
      Array.isArray(data) === true ? data[0].employee_id : data.employee_id;
    let familyType =
      Array.isArray(data) === true ? data[0].family_type : data.family_type;
    familyType = toSentenceCase(familyType);
    const destinationTable = "Family";
    const requestType =
      Array.isArray(data) === true ? data[0].request_type : data.request_type;

    let familyTypeID = 0;

    let query = `SELECT TOP 1 
                 ID AS 'id' 
                 FROM [UE database]..FamilyType 
                 WHERE [Description] = @Description`;

    let parameters = [
      {
        name: "Description",
        dataType: SQLDataTypes.VARCHAR,
        value: familyType,
      },
    ];

    let response = await helperMethods.executeQuery(
      query,
      parameters,
      transaction,
    );
    if (response.recordset[0].length === 0)
      throw "Cannot find the id in [UE database]..FamilyType";
    familyTypeID = response.recordset[0].id;

    query = `INSERT INTO [UE database]..RequestHdr 
             (CreatedBy, DateTimeCreated, DestinationTable, RequestType, FamilyType)
             VALUES 
             (@CreatedBy, GETDATE(), @DestinationTable, @RequestType, @FamilyType)`;

    parameters = [
      { name: "CreatedBy", dataType: SQLDataTypes.VARCHAR, value: createdBy },
      {
        name: "DestinationTable",
        dataType: SQLDataTypes.VARCHAR,
        value: destinationTable,
      },
      {
        name: "RequestType",
        dataType: SQLDataTypes.SMALLINT,
        value: requestType === "edit" ? 0 : 1,
      },
      {
        name: "FamilyType",
        dataType: SQLDataTypes.SMALLINT,
        value: familyTypeID,
      },
    ];

    helperMethods.checkRowsAffected(
      await helperMethods.executeQuery(query, parameters, transaction),
    );

    query = `SELECT TOP 1 
             ID AS 'id' 
             FROM [UE database]..RequestHdr 
             ORDER BY DateTimeCreated DESC`;

    response = await helperMethods.executeQuery(query, null, transaction);
    const requestID = response.recordset[0].id;

    if (requestType === "create" || requestType === "edit") {
      if (Array.isArray(data) === true) {
        for (const [index, item] of data.entries()) {
          let personQueueNumber = null;
          if (requestType === "create") {
            personQueueNumber = index;
            personQueueNumber++;
          }
          await manipulateTableRequestDtl(
            transaction,
            requestID,
            familyType,
            item,
            personQueueNumber,
          );
        }
      } else {
        let personQueueNumber = null;
        if (requestType === "create") {
          personQueueNumber = 1;
        }
        await manipulateTableRequestDtl(
          transaction,
          requestID,
          familyType,
          data,
          personQueueNumber,
        );
      }
    } else {
      throw "Invalid value of request type";
    }

    await helperMethods.commitTransaction(transaction);
    return requestID;
  } catch (error) {
    await helperMethods.rollbackTransaction(transaction);
    throw error;
  }
}

module.exports = {
  get,
  getRelationships,
  hasChange,
  createRequest,
  removeNoChanges,
  getMarriageCertificate,
  getRelationshipCategories,
};

const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 
const usersModel = require("./usersModel.js");

function convertToYesOrNo(booleanString) {
  const response = (booleanString === "TRUE") ? "YES" : "NO";
  return response;
}

async function getCivilStatusName(civilStatusID) {
  const query = `SELECT TOP 1 
                TRIM(UPPER([Description])) AS 'Name'
                FROM [UE database]..CivilStatus 
                WHERE ID = @ID`;
  const parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: Number(civilStatusID) }];
  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].Name;
}

async function getReligionName(religionCode) {
  const query = `SELECT TOP 1 
                TRIM(UPPER([Description])) AS 'Name'
                FROM [UE database]..Religion 
                WHERE ReligionCode = @ReligionCode`;
  const parameters = [{ name: "ReligionCode", dataType: SQLDataTypes.VARCHAR, value: religionCode }];
  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].Name;
}

async function getRelationshipName(relationshipID) {
  const query = `SELECT TOP 1 
                TRIM(UPPER([Description])) AS 'Name'
                FROM [UE database]..FamilyType 
                WHERE ID = @ID`;

  const parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: Number(relationshipID) }];
  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].Name;
}

async function getFamilyID(requestID) {
  const query = `SELECT TOP 1 
               FamilyRecno AS 'family_id' 
               FROM RequestDtl 
               WHERE RequestHdrID = @RequestHdrID`;

  const parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestID }];

  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].family_id;
}

async function getRegionName(regionCode) {
  const query = `SELECT TOP 1 
                TRIM(UPPER([NAME])) AS 'Name'
                FROM UERMHIMS..CodeRegion
                WHERE CODE = @CODE`;
  const parameters = [{ name: "CODE", dataType: SQLDataTypes.VARCHAR, value: regionCode }];
  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].Name;
}

async function getProvinceName(provinceCode) {
  const query = `SELECT TOP 1 
                TRIM(UPPER([NAME])) AS 'Name'
                FROM UERMHIMS..CodeProvince
                WHERE CODE = @CODE`;
  const parameters = [{ name: "CODE", dataType: SQLDataTypes.VARCHAR, value: provinceCode }];
  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].Name;
}

async function getInstitutionName(schoolID) {
  const query = `SELECT TOP 1
               TRIM([Description]) AS 'Name'
               FROM HR..SchoolList
               WHERE ID = @ID`;

  const parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: Number(schoolID) }];
  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].Name.toUpperCase();
}

function isEditableByHR(value) {
  return isNaN(Number(value));
}


function getParameterID(id){
  return [{ name: "ID", dataType: SQLDataTypes.INT, value: Number(id) }];
 }
 

async function getDegreeName(degreeID) {
  let query = `SELECT COUNT(ID) AS 'total'
               FROM HR..CollegeDegrees
               WHERE ID = @ID`;
  let response = await helperMethods.executeQuery(query, getParameterID(degreeID));
  if (response.recordset[0].total === 0) return degreeID.toUpperCase(); 

   query = `SELECT TOP 1
               TRIM([Description]) AS 'Name'
               FROM HR..CollegeDegrees
               WHERE ID = @ID`;

  response = await helperMethods.executeQuery(query, getParameterID(degreeID));
  return response.recordset[0].Name.toUpperCase();
}

async function getCourseName(courseID) {
  let query = `SELECT COUNT(ID) AS 'total'
               FROM HR..CollegeCourses
               WHERE ID = @ID`;
  let response = await helperMethods.executeQuery(query, getParameterID(courseID));
  if (response.recordset[0].total === 0) return courseID.toUpperCase();  

   query = `SELECT TOP 1
                 TRIM([Description]) AS 'Name'
                 FROM HR..CollegeCourses
                 WHERE ID = @ID`;

  response = await helperMethods.executeQuery(query, getParameterID(courseID));
  return response.recordset[0].Name.toUpperCase();
}

async function getMajorName(majorID) {
  let query = `SELECT COUNT(ID) AS 'total'
               FROM HR..CollegeMajors
               WHERE ID = @ID`;
  let response = await helperMethods.executeQuery(query, getParameterID(majorID));
 if (response.recordset[0].total === 0) return majorID.toUpperCase();  
 
  query = `SELECT TOP 1
           TRIM([Description]) AS 'Name'
           FROM HR..CollegeMajors
           WHERE ID = @ID`;
 
 
    response = await helperMethods.executeQuery(query, getParameterID(majorID));
   return response.recordset[0].Name.toUpperCase();
 } 

 async function getCityOrMunicipalityName(cityOrMunicipalityCode) {
  const query = `SELECT TOP 1 
                TRIM(UPPER([NAME])) AS 'Name'
                FROM UERMHIMS..CodeMunicipalityCity
                WHERE CODE = @CODE`;
  const parameters = [{ name: "CODE", dataType: SQLDataTypes.VARCHAR, value: cityOrMunicipalityCode }];
  const response = await helperMethods.executeQuery(query, parameters);
  return response.recordset[0].Name;
}

async function renameColumnName(recordSets) {
  const response = [];
  for (const item of recordSets) {
    item.editable_by_hr = false;

    if (item.column_name === "LastName") item.column_name = "Last Name";
    else if (item.column_name === "FirstName") item.column_name = "First Name";
    else if (item.column_name === "MiddleName") item.column_name = "Middle Name";
    else if (item.column_name === "ExtName") item.column_name = "Extension Name";
    else if (item.column_name === "Nickname") item.column_name = "Nick Name";
    else if (item.column_name === "EMail") item.column_name = "Personal Email";
    else if (item.column_name === "MobileNo") item.column_name = "Mobile No";
    else if (item.column_name === "Permanent_TelNo") item.column_name = "Telephone No";
    else if (item.column_name === "CivilStatus") {
      item.column_name = "Civil Status";
      if (item.from !== "" && item.from !== undefined) item.from = await getCivilStatusName(item.from);
      if (item.to !== undefined) item.to = await getCivilStatusName(item.to);
    } else if (item.column_name === "ReligionCode") {
      item.column_name = "Religion";
      if (item.from !== "" && item.from !== undefined) item.from = await getReligionName(item.from);
      if (item.to !== undefined) item.to = await getReligionName(item.to);
    }
    else if (item.column_name === "ContactFamilyTypeID") {
      item.column_name = "Relationship";
      if (item.from !== "" && item.from !== undefined) item.from = await getRelationshipName(item.from);
      if (item.to !== undefined) item.to = await getRelationshipName(item.to);
    }
    else if (item.column_name === "ContactPerson") item.column_name = "Contact Person Name";
    else if (item.column_name === "Contact_Address") item.column_name = "Contact Person Address";
    else if (item.column_name === "Contact_TelNo") item.column_name = "Contact Person Contact No";
    else if (item.column_name === "ExpirationDate") item.column_name = "Expiration Date";
    else if (item.column_name === "FullName") item.column_name = "Full Name";
    else if (item.column_name === "Birthdate") item.column_name = "Birth Date";
    else if (item.column_name === "MarriageDate") item.column_name = "Marriage Date";
    else if (item.column_name === "CompanySchool") item.column_name = "Company Name or School Name";
    else if (item.column_name === "DiplomaDegreeHonor") item.column_name = "Diploma";
    else if (item.column_name === "Institution") item.column_name = "Institution Name";
    else if (item.column_name === "InstitutionAddress") item.column_name = "Institution Address";
    else if (item.column_name === "TrainingOrSeminarName") item.column_name = "Training or Seminar Name";
    else if (item.column_name === "TrainingProvider") item.column_name = "Training Provider";
    else if (item.column_name === "FromDate") item.column_name = "From Date";
    else if (item.column_name === "ToDate") item.column_name = "To Date";
    else if (item.column_name === "CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName") {
      item.column_name = "(Current Address) Room / Floor / UnitNo & Building Name";
    }
    else if (item.column_name === "CurrentAddress_HouseOrLotAndBlockNo") {
      item.column_name = "(Current Address) House / Lot & Block No";
    }
    else if (item.column_name === "CurrentAddress_StreetName") {
      item.column_name = "(Current Address) Street Name";
    }
    else if (item.column_name === "CurrentAddress_Subdivision") {
      item.column_name = "(Current Address) Subdivision";
    }
    else if (item.column_name === "CurrentAddress_RegionCode") {
      item.column_name = "(Current Address) Region";
    }
    else if (item.column_name === "CurrentAddress_ProvinceCode") {
      item.column_name = "(Current Address) Province";
    }
    else if (item.column_name === "CurrentAddress_CityOrMunicipalityCode") {
      item.column_name = "(Current Address) City / Municipality";
    }
    else if (item.column_name === "CurrentAddress_Barangay") {
      item.column_name = "(Current Address) Barangay";
    }
    else if (item.column_name === "PermanentAddress_IsSameAsCurrentAddress") {
      item.column_name = "(Permanent Address) Is Same As Current Address";
      if (item.from !== "" && item.from !== undefined) item.from = convertToYesOrNo(item.from);
      if (item.to !== undefined) item.to = convertToYesOrNo(item.to);
    }
    else if (item.column_name === "PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName") {
      item.column_name = "(Permanent Address) Room / Floor / UnitNo & Building Name";
    }
    else if (item.column_name === "PermanentAddress_HouseOrLotAndBlockNo") {
      item.column_name = "(Permanent Address) House / Lot & Block No";
    }
    else if (item.column_name === "PermanentAddress_StreetName") {
      item.column_name = "(Permanent Address) Street Name";
    }
    else if (item.column_name === "PermanentAddress_Subdivision") {
      item.column_name = "(Permanent Address) Subdivision";
    }
    else if (item.column_name === "PermanentAddress_RegionCode") {
      item.column_name = "(Permanent Address) Region";
    }
    else if (item.column_name === "PermanentAddress_ProvinceCode") {
      item.column_name = "(Permanent Address) Province";
    }
    else if (item.column_name === "PermanentAddress_CityOrMunicipalityCode") {
      item.column_name = "(Permanent Address) City / Municipality";
    }
    else if (item.column_name === "PermanentAddress_Barangay") {
      item.column_name = "(Permanent Address) Barangay";
    }
    else if (item.column_name === "SchoolListID") {
      item.column_name = "Institution";
      if (item.value !== undefined) item.value = await getInstitutionName(item.value);
    }
    else if (item.column_name === "CollegeDegreeID") {
      item.column_name = "Degree";
      if (item.value !== undefined) { item.editable_by_hr = isEditableByHR(item.value); item.value = await getDegreeName(item.value) }
    }
    else if (item.column_name === "CollegeCourseID") {
      item.column_name = "Course";
      if (item.value !== undefined) { item.course_id = item.value; item.editable_by_hr = isEditableByHR(item.value); item.value = await getCourseName(item.value); }
    }
    else if (item.column_name === "CollegeMajorID") {
      item.column_name = "Major";
      if (item.value !== undefined) { item.editable_by_hr = isEditableByHR(item.value); item.value = await getMajorName(item.value); }
    }

    if (item.column_name === "(Current Address) Region" || item.column_name === "(Permanent Address) Region") {
      if (item.from !== "" && item.from !== undefined) item.from = await getRegionName(item.from);
      if (item.to !== undefined) item.to = await getRegionName(item.to);
    }
    else if (item.column_name === "(Current Address) Province" || item.column_name === "(Permanent Address) Province") {
      if (item.from !== "" && item.from !== undefined) item.from = await getProvinceName(item.from);
      if (item.to !== undefined) item.to = await getProvinceName(item.to);
    }
    else if (item.column_name === "(Current Address) City / Municipality" || item.column_name === "(Permanent Address) City / Municipality") {
      if (item.from !== "" && item.from !== undefined) item.from = await getCityOrMunicipalityName(item.from);
      if (item.to !== undefined) item.to = await getCityOrMunicipalityName(item.to);
    }

    item.column_name = item.column_name.toUpperCase();
    response.push(item);
  }
  return response;
}

async function isMoreThanOne(requestID, isEditRequestType = true) {
  let query = `SELECT DISTINCT `;
  query += isEditRequestType === true ? 'FamilyRecno' : 'PersonQueueNumber';
  query += ` FROM RequestDtl WHERE RequestHdrID = @RequestHdrID`;

  const parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestID }];
  const response = await helperMethods.executeQuery(query, parameters);
  return (response.recordset.length > 1);
}


async function getFullName(famType, createdBy, familyID = 0) {
  let query = `SELECT TOP 1 
               FullName AS 'full_name' 
               FROM [UE Database]..Family 
               WHERE FamType = '${famType}'
               AND EmployeeCode = @EmployeeID`;

  if (familyID !== 0 && familyID > 0) query += " AND Recno = @Recno";

  const parameters = [{ name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: createdBy }];

  if (familyID !== 0 && familyID > 0) parameters.push({ name: "Recno", dataType: SQLDataTypes.INT, value: familyID });

  const response = await helperMethods.executeQuery(query, parameters);

  if (response.recordset[0].full_name === undefined || response.recordset[0].full_name === null || response.recordset[0].full_name === "") {
    throw "Invalid value of full_name in getFullName()";
  }

  return ` (<b>${  response.recordset[0].full_name.trim()  }</b>) family backgrounds. <br /><br />`;
}

async function manipulateFolder(transaction, requestID, type, statusFolder, employeeID = 0, requestDtlID = 0) {
  let query = `SELECT TOP 1 
  D.OldValue AS 'old_value',
  D.NewValue AS 'new_value',
   CASE
      WHEN H.RequestType = '0' THEN 'to'
      WHEN H.RequestType = '1' THEN 'value'
   END AS 'folder'
  FROM RequestDtl AS D
  INNER JOIN RequestHdr AS H
  ON D.RequestHdrID = H.ID
  WHERE D.RequestHdrID = @RequestHdrID AND D.ColumnName = @Type`;

  let parameters = [
    { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestID },
    { name: "Type", dataType: SQLDataTypes.VARCHAR, value: type }
  ];

  if (requestDtlID !== 0) {
    query += " AND D.ID = @ID";
    parameters.push({ name: "ID", dataType: SQLDataTypes.INT, value: requestDtlID });
  }

  let response = await helperMethods.executeQuery(query, parameters, transaction);

  const newValueFileName = response.recordset[0].new_value.trim();
  const oldValueFileName = response.recordset[0].old_value;
  let folder = response.recordset[0].folder;

  const uploadedFolderPath = helperMethods.getUploadedFolderPath();

  const sourcePath = `${uploadedFolderPath  }/requests/pending/${  requestID}`;

  let isFound = false;

  if (await helperMethods.isExist(`${sourcePath  }/${  folder  }/${  newValueFileName}`) === true) isFound = true;
  else if (await helperMethods.isExist(`${sourcePath  }/${  folder === "to" ? "value" : "to"  }/${  newValueFileName}`) === true) {
    isFound = true;
    folder = (folder === "to") ? "value" : "to";
  }
  else throw `File : ${newValueFileName} was not found, inside of ${requestID} folder.`;

  if (isFound === true) {

    const destinationPath = `${uploadedFolderPath  }/requests/${  statusFolder  }/${  requestID}`;

    if (type === "BIRTH CERTIFICATE") {
      await helperMethods.createFolder(`${destinationPath  }/${  folder}`);
      await helperMethods.copyFile(`${sourcePath  }/${  folder  }/${  newValueFileName}`, `${destinationPath  }/${  folder}`);
    } else {
      await helperMethods.createFolder(destinationPath);
      await helperMethods.copyFiles(sourcePath, destinationPath);
    }

    // --------------------------- PENDING -> APPROVED FOLDER ---------------------------
    if (statusFolder === "approved" && employeeID > 0) {
      let path = `${uploadedFolderPath  }/current_files/${  employeeID}`;

      if (type === "MARRIAGE CERTIFICATE") path += "/family_backgrounds/spouse";
      else if (type === "BIRTH CERTIFICATE") path += "/family_backgrounds/children/birth_certificate";
      else if (type === "PRC ID") path += "/licenses/";
      else if (type === "DIPLOMA") {
        path += "/educational_backgrounds/";

        query = `SELECT TOP 1
        CD.[Description] AS 'degree_name'
        FROM [UE database]..RequestDtl AS D
        INNER JOIN HR..CollegeDegrees AS CD
        ON CD.ID = D.NewValue
        WHERE D.RequestHdrID = @RequestHdrID
        AND D.ColumnName = 'CollegeDegreeID'`;

        parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestID }];
        response = await helperMethods.executeQuery(query, parameters, transaction);

        const degreeName = response.recordset[0].degree_name;

        query = `SELECT TOP 1
        CC.[Description] AS 'course_name'
        FROM [UE database]..RequestDtl AS D
        INNER JOIN HR..CollegeCourses AS CC
        ON CC.ID = D.NewValue
        WHERE D.RequestHdrID = @RequestHdrID
        AND D.ColumnName = 'CollegeCourseID'`;
        parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestID }];
        response = await helperMethods.executeQuery(query, parameters, transaction);
        const courseName = response.recordset[0].course_name;

        query = `SELECT TOP 1
        CM.[Description] AS 'major_name'
        FROM [UE database]..RequestDtl AS D
        INNER JOIN HR..CollegeMajors AS CM
        ON CM.ID = D.NewValue
        WHERE D.RequestHdrID = @RequestHdrID
        AND D.ColumnName = 'CollegeMajorID'`;
        parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestID }];
        response = await helperMethods.executeQuery(query, parameters, transaction);
        let majorName = (response.recordset.length > 0) ? response.recordset[0].major_name : null;
        let diploma = `${degreeName  } IN ${  courseName  }`;
        if (majorName !== null) { 
          const containsMajorIn = majorName.includes("MAJOR IN");
          if (!containsMajorIn) majorName = `MAJOR IN ${majorName}`;
          diploma += ` ${majorName}`;
        }
        diploma = diploma.trim();
        path += `${diploma  }/`;
      }
      else if (type === "TRAINING OR SEMINAR CERTIFICATE") path += "/trainings_or_seminars";
      else throw "Invalid value of type.";

      if (await helperMethods.isExist(path + oldValueFileName) === true) await helperMethods.deleteFile(path + oldValueFileName);

      if (type === "BIRTH CERTIFICATE") {
        await helperMethods.createFolder(path);
        await helperMethods.copyFile(`${sourcePath  }/${  folder  }/${  newValueFileName}`, path);
      } else {
        await helperMethods.createFolder(path);
        await helperMethods.copyFiles(`${sourcePath  }/${  folder}`, path);
      }
    }
    // --------------------------- PENDING -> APPROVED FOLDER ---------------------------

    if (type === "BIRTH CERTIFICATE") {
      await helperMethods.deleteFile(`${sourcePath  }/${  folder  }/${  newValueFileName}`);
      if (await helperMethods.isFolderEmpty(`${sourcePath  }/${  folder  }/`) === true) { await helperMethods.deleteFolder(sourcePath); }
    } else {
      await helperMethods.deleteFiles(sourcePath);
      if (await helperMethods.isFolderEmpty(sourcePath) === true) { await helperMethods.deleteFolder(sourcePath); }
    }
  }
}

async function getDescription(fullName, requestID) {
  let description = `<b>${  fullName  }</b> has sent a request to `;
  let query = `SELECT TOP 1 
          H.CreatedBy AS 'created_by',
          H.DestinationTable AS 'destination_table', 
          H.RequestType AS 'request_type', 
          H.FamilyType AS 'family_type', 
                CASE
                  WHEN TRIM(E.Sex) = 'M' THEN 'his'
                  WHEN TRIM(E.Sex) = 'F' THEN 'her'
                  ELSE ''
                END AS 'gender'
          FROM RequestHdr AS H
          INNER JOIN Employee AS E
          ON H.CreatedBy = E.EmployeeCode
          WHERE H.ID = @ID`;

  let parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestID }];
  let response = await helperMethods.executeQuery(query, parameters);
  const createdBy = response.recordset[0].created_by.trim();
  const destinationTable = response.recordset[0].destination_table.trim();
  const requestType = response.recordset[0].request_type;
  const familyType = response.recordset[0].family_type;
  const gender = response.recordset[0].gender;
  // requestType values = (0 = Edit, 1 = Create)
  description += requestType === 0 ? "change" : "create";
  description += ` ${  gender  } `;
  description += requestType === 0 ? "current" : "new";
  description += " ";
  switch (destinationTable) {
    case "Employee":
      description += "personal information. <br /><br />";
      break;
    case "Family":
      if (familyType === 0) throw 'The value of family_type cannot be zero when the value of destination table is not Family.';
      else {
        if (familyType === 1) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          description += "mother";
          if (requestType === 0) description += await getFullName("Mother", createdBy);
          // ------------------------------------------------- EDIT -------------------------------------------------
        } else if (familyType === 2) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          description += "father";
          if (requestType === 0) description += await getFullName("Father", createdBy);
          // ------------------------------------------------- EDIT -------------------------------------------------
        } else if (familyType === 3) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            if (await isMoreThanOne(requestID) === true) description += "siblings family background. <br /><br />";
            else {
              description += "sibling";
              const familyID = await getFamilyID(requestID);
              description += await getFullName("Sibling", createdBy, familyID);
            }
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            const isCreateTypeRequest = false;
            if (await isMoreThanOne(requestID, isCreateTypeRequest) === true) {
              description += "siblings family background. <br /><br />";
            } else {
              description += "sibling family background. <br /><br />";
            }
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
        else if (familyType === 4) {
          description += "spouse";
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) description += await getFullName("Spouse", createdBy);
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) description += " family background. <br /><br />";
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
        else if (familyType === 5) {
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            if (await isMoreThanOne(requestID) === true) {
              description += "children family background. <br /><br />";
            } else {
              description += "child";
              const familyID = await getFamilyID(requestID);
              description += await getFullName("Child", createdBy, familyID);
            }
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            const isCreateTypeRequest = false;
            if (await isMoreThanOne(requestID, isCreateTypeRequest) === true) {
              description += "children family background. <br /><br />";
            } else {
              description += "child family background. <br /><br />";
            }
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        } else if (familyType === 6) {
          description += "mother in law";
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            description += await getFullName("Mother-In-Law", createdBy);
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            description += " family background. <br /><br />";
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
        else if (familyType === 7) {
          description += "father in law";
          // ------------------------------------------------- EDIT -------------------------------------------------
          if (requestType === 0) {
            description += await getFullName("Father-In-Law", createdBy);
          }
          // ------------------------------------------------- EDIT -------------------------------------------------
          // ------------------------------------------------- CREATE -------------------------------------------------
          else if (requestType === 1) {
            description += " family background. <br /><br />";
          }
          // ------------------------------------------------- CREATE -------------------------------------------------
        }
      }
      break;
    case "License":
      description += "license";
      query = `SELECT TOP 1 
      TRIM(LicenseNo) AS 'license_no'
      FROM [UE Database]..RequestHdr 
      WHERE CreatedBy = @EmployeeID AND ID = @ID`;
      parameters = [
        { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: createdBy },
        { name: "ID", dataType: SQLDataTypes.INT, value: requestID }
      ];
      response = await helperMethods.executeQuery(query, parameters);

      query = `SELECT TOP 1 License AS 'license'
       FROM [UE Database]..License
       WHERE EmployeeCode = @EmployeeID AND LicenseNo = @LicenseNo`;

      parameters = [
        { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: createdBy }, 
        { name: "LicenseNo", dataType: SQLDataTypes.VARCHAR, value: response.recordset[0].license_no }
      ];

      response = await helperMethods.executeQuery(query, parameters);
      description += ` (<b>${  (response.recordset.length > 0) ? response.recordset[0].license.trim() : ""  }</b>). <br /><br />`; 
      break;
    case "Education":
      description += "educational background. <br /><br />";
      break;
    case "EmployeeCompletedTrainingOrSeminar":
      description += "training or seminar. <br /><br />";
      break;
    default:
      throw `The value of destinationTable (${  destinationTable  }) was not allowed in the source codes.`;
  }
  return description;
}

const processElement = async (prefix, number, requestID, statusID, familyID) => {
  let result = `(${  prefix  }${number  } = `;
  const query = `SELECT ColumnName AS 'column_name' 
                 FROM [UE database]..RequestDtl 
                 WHERE RequestHdrID = @ID
                 AND CurrentStatus = @CurrentStatus
                 AND FamilyRecno = @FamilyRecno`;


  const parameters = [
    { name: "ID", dataType: SQLDataTypes.INT, value: requestID },
    { name: "CurrentStatus", dataType: SQLDataTypes.INT, value: statusID },
    { name: "FamilyRecno", dataType: SQLDataTypes.INT, value: familyID }
  ];

  const response = await helperMethods.executeQuery(query, parameters);

  const elements = await renameColumnName(response.recordset);

  elements.forEach((element, index) => {
    result += element.column_name;
    if (index !== elements.length - 1) {
      result += ", ";
    }
  });
  result += ") ";
  return result;
};

const processFamilyIDs = async (familyIDs, prefix, number, requestID, statusID) => {
  let response = "";
  for (const element of familyIDs) {
    response += await processElement(prefix, number, requestID, statusID, element.FamilyID);
    number++;
  }
  return response;
};

async function getRequestedFields(requestID, statusID) {
  let requestedFields = "";
  let query = `SELECT TOP 1 
               TRIM(H.DestinationTable) AS 'destination_table',
               ISNULL(TRIM(FT.[Description]), '') AS 'family_type'
               FROM RequestHdr AS H 
               LEFT JOIN FamilyType AS FT
               ON FT.ID = H.FamilyType 
               WHERE H.ID = @ID`;

  const parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestID }];
  const response = await helperMethods.executeQuery(query, parameters);

  const destinationTable = response.recordset[0].destination_table;
  let familyType = response.recordset[0].family_type;

  switch (destinationTable) {
    case "Employee":
      requestedFields += "PERSONAL INFORMATION ";
      break;
    case "Family":
      requestedFields += "FAMILY BACKGROUND";
      if (familyType === "") throw 'The value of family_type cannot be zero when the value of destination table is not Family.';
      else {
        familyType = familyType.toUpperCase();
        requestedFields += " (";
        if (familyType === "SIBLING") requestedFields += (await isMoreThanOne(requestID) === true) ? `${familyType}S` : familyType;
        else if (familyType === "CHILD") requestedFields += (await isMoreThanOne(requestID) === true) ? `${familyType}REN` : familyType;
        else requestedFields += familyType;
        requestedFields += ")";
      }
      break;
    case "License":
      requestedFields += "LICENSE ";
      break;
    case "Education":
      requestedFields += "EDUCATIONAL BACKGROUND ";
      break;
    case "EmployeeCompletedTrainingOrSeminar":
      requestedFields += "TRAINING OR SEMINAR ";
      break;
    default:
      throw `The value of destinationTable (${  destinationTable  }) was not allowed in the source codes.`;
  }

  requestedFields += "= ";

  if (requestedFields.includes("(SIBLINGS)") === true || requestedFields.includes("(CHILDREN)") === true) {

    query = `SELECT DISTINCT FamilyRecno
    FROM [UE database]..RequestDtl 
    WHERE RequestHdrID = @ID
    AND CurrentStatus = @CurrentStatus`;

    const parameters = [
      { name: "ID", dataType: SQLDataTypes.INT, value: requestID },
      { name: "CurrentStatus", dataType: SQLDataTypes.INT, value: statusID }
    ];

    const response = await helperMethods.executeQuery(query, parameters);

    let prefix = "";
    const number = 1;
    if (familyType === 3) prefix = "S";
    else if (familyType === 5) prefix = "C";
    else throw "Invalid value of familyType";

    const familyIDs = response.recordset;
    requestedFields += await processFamilyIDs(familyIDs, prefix, number, requestID, statusID);

  } else {
    query = `SELECT ColumnName AS 'column_name' 
           FROM [UE database]..RequestDtl 
           WHERE RequestHdrID = @ID
           AND CurrentStatus = @CurrentStatus`;

    const parameters = [
      { name: "ID", dataType: SQLDataTypes.INT, value: requestID },
      { name: "CurrentStatus", dataType: SQLDataTypes.INT, value: statusID }
    ];

    const response = await helperMethods.executeQuery(query, parameters);

    const elements = await renameColumnName(response.recordset);
    elements.forEach((element, index) => {
      requestedFields += element.column_name;
      if (index !== elements.length - 1) {
        requestedFields += ", ";
      }
    });
  }

  requestedFields = requestedFields.trim();

  return requestedFields;
}

async function getPending(employeeID, dateFrom, dateTo) {
  let query = `SELECT DISTINCT
                  (
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl 
                  WHERE CurrentStatus = 0 AND ApprovedBy IS NULL 
                  AND DateTimeApproved IS NULL AND CreatedBy != @EmployeeID 
				          AND RequestHdrID = H.ID)
                  AS VARCHAR(MAX))
                  + '/' +
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl WHERE RequestHdrID = H.ID) AS VARCHAR(MAX))
                  ) AS 'stats',
                  H.ID AS 'request_id', 
                  CASE
                  WHEN H.RequestType = 0 THEN 'edit'
                  WHEN H.RequestType = 1 THEN 'create'
                  END AS 'request_type',
                  TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'created_by',
                  H.DateTimeCreated AS 'date_time_created',
                  H.ShouldHighlightedToHR AS 'should_high_lighted_to_hr',
                  '' AS 'requested_fields',
                  '' AS 'description',
                  '' AS 'details',
                  '' AS 'are_siblings_or_children'
                  FROM [UE database]..RequestHdr AS H
                  INNER JOIN [UE database]..RequestDtl AS D
                  ON D.RequestHdrID = H.ID
                  INNER JOIN [UE database]..Employee AS E
                  ON H.CreatedBy = E.EmployeeCode
                  WHERE D.CurrentStatus = 0
                  AND D.ApprovedBy IS NULL
                  AND D.DateTimeApproved IS NULL
                  AND H.CreatedBy != @EmployeeID
                  AND H.DateTimeCreated BETWEEN @DateFrom AND DATEADD(DAY, 1, @DateTo)
                  AND H.IsDeleted = 0
                  ORDER BY H.DateTimeCreated DESC`;

  const parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: employeeID },
    { name: "DateFrom", dataType: SQLDataTypes.DATE, value: dateFrom },
    { name: "DateTo", dataType: SQLDataTypes.DATE, value: dateTo }
  ];

  const requestHdr = (await helperMethods.executeQuery(query, parameters)).recordset;

  for (const index in requestHdr) {

    query = `SELECT DISTINCT
      ISNULL(TRIM(F.FullName), '') AS 'sibling_or_child_full_name',
      D.FamilyRecno AS 'family_id',
      D.PersonQueueNumber AS 'person_queue_number'
      FROM RequestDtl AS D
      LEFT JOIN Family AS F
      ON D.FamilyRecno = F.Recno
      WHERE D.RequestHdrID = @RequestHdrID`;

    const parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdr[index].request_id }];

    const response = await helperMethods.executeQuery(query, parameters);
    const totalLength = response.recordset.length;
    requestHdr[index].are_siblings_or_children = (totalLength > 1) ? true : false;

    const result = response.recordset;
    const dtl = [];
    for (const item of result) {
      // ------------------------------------------------- CREATE -------------------------------------------------
      if (requestHdr[index].request_type === 'create') {
        query = `SELECT 
            D.ID AS 'id',
            TRIM(D.ColumnName) AS 'column_name',
            TRIM(D.NewValue) AS 'value',
            D.HRRemarks AS 'hr_remarks',
            TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'remarks_by',
            D.DateTimeRemarks AS 'date_time_remarks'
            FROM [UE database]..RequestDtl AS D
            LEFT JOIN [UE database]..Employee AS E
            ON D.RemarksBy = E.EmployeeCode
            WHERE D.RequestHdrID = @RequestHdrID
            AND D.CurrentStatus = 0
            AND D.ApprovedBy IS NULL
            AND D.DateTimeApproved IS NULL`;

        if (item.person_queue_number !== null) query += " AND D.PersonQueueNumber = @PersonQueueNumber";
        query += " ORDER BY D.ID ASC";

        const parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdr[index].request_id }];

        if (item.person_queue_number !== null) parameters.push({ name: "PersonQueueNumber", dataType: SQLDataTypes.INT, value: item.person_queue_number });

        const response = await helperMethods.executeQuery(query, parameters);

        if (response.recordset.length > 0) {
          if (totalLength > 1) dtl.push({ table_rows: await renameColumnName(response.recordset) });
          requestHdr[index].details = (totalLength > 1) ? dtl : await renameColumnName(response.recordset);
        }
      }
      // ------------------------------------------------- CREATE -------------------------------------------------
      // ------------------------------------------------- EDIT -------------------------------------------------
      else if (requestHdr[index].request_type === 'edit') {
        query = `SELECT 
                 D.ID AS 'id',
                 TRIM(D.ColumnName) AS 'column_name',
                 TRIM(D.OldValue) AS 'from',
                 TRIM(D.NewValue) AS 'to',
                 D.HRRemarks AS 'hr_remarks',
                 TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'remarks_by',
                 D.DateTimeRemarks AS 'date_time_remarks'
                 FROM [UE database]..RequestDtl AS D
                 LEFT JOIN [UE database]..Employee AS E
                 ON D.RemarksBy = E.EmployeeCode
                 WHERE D.RequestHdrID = @RequestHdrID
                 AND D.CurrentStatus = 0
                 AND D.ApprovedBy IS NULL
                 AND D.DateTimeApproved IS NULL`;

        if (item.family_id !== null) query += " AND D.FamilyRecno = @FamilyRecno";
        query += " ORDER BY D.ID ASC";

        const parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdr[index].request_id }];

        if (item.family_id !== null) parameters.push({ name: "FamilyRecno", dataType: SQLDataTypes.INT, value: item.family_id });

        const response = await helperMethods.executeQuery(query, parameters);

        if (response.recordset.length > 0) {
         if (totalLength > 1) {
          const obj = {
            sibling_or_child_full_name: item.sibling_or_child_full_name,
            table_rows: await renameColumnName(response.recordset)
          };
          dtl.push(obj);
         }
          requestHdr[index].details = (totalLength > 1) ? dtl : await renameColumnName(response.recordset);
        }
      }
      // ------------------------------------------------- EDIT -------------------------------------------------
      else {
        throw 'Invalid request type in getPending()';
      }

    }

    requestHdr[index].description = await getDescription(requestHdr[index].created_by, requestHdr[index].request_id);
    const statusID = 0;
    requestHdr[index].requested_fields = await getRequestedFields(requestHdr[index].request_id, statusID);
  }

  return requestHdr;
}

async function getMyApproved(employeeID, dateFrom, dateTo) {
  let query = `SELECT DISTINCT
                  (
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl 
                  WHERE CurrentStatus = 1 AND ApprovedBy IS NOT NULL 
                  AND DateTimeApproved IS NOT NULL AND H.CreatedBy != @EmployeeID
                  AND RequestHdrID = H.ID)
                  AS VARCHAR(MAX))
                  + '/' +
                  CAST((SELECT COUNT(*) FROM [UE database]..RequestDtl WHERE RequestHdrID = H.ID) AS VARCHAR(MAX))
                  ) AS 'stats',
                  H.ID AS 'request_id', 
                  CASE
                  WHEN H.RequestType = 0 THEN 'edit'
                  WHEN H.RequestType = 1 THEN 'create'
                  END AS 'request_type',
                  TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'created_by',
                  H.DateTimeCreated AS 'date_time_created',
                  '' AS 'requested_fields',
                  '' AS 'details'
                  FROM [UE database]..RequestHdr AS H
                  INNER JOIN [UE database]..RequestDtl AS D
                  ON D.RequestHdrID = H.ID
                  INNER JOIN [UE database]..Employee AS E
                  ON H.CreatedBy = E.EmployeeCode
                  WHERE D.CurrentStatus = 1
                  AND D.ApprovedBy IS NOT NULL
                  AND D.DateTimeApproved IS NOT NULL
                  AND D.ApprovedBy = @EmployeeID
                  AND H.DateTimeCreated BETWEEN @DateFrom AND DATEADD(DAY, 1, @DateTo)
                  AND H.IsDeleted = 0
                  ORDER BY H.DateTimeCreated DESC`;

  const parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: employeeID },
    { name: "DateFrom", dataType: SQLDataTypes.DATE, value: dateFrom },
    { name: "DateTo", dataType: SQLDataTypes.DATE, value: dateTo }
  ];

  const requestHdr = (await helperMethods.executeQuery(query, parameters)).recordset;

  for (const index in requestHdr) {

    query = `SELECT DISTINCT
      ISNULL(TRIM(F.FullName), '') AS 'sibling_or_child_full_name',
      D.FamilyRecno AS 'family_id',
      D.PersonQueueNumber AS 'person_queue_number'
      FROM RequestDtl AS D
      LEFT JOIN Family AS F
      ON D.FamilyRecno = F.Recno
      WHERE D.RequestHdrID = @RequestHdrID`;

    const parameters = [
      { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdr[index].request_id }
    ];

    const response = await helperMethods.executeQuery(query, parameters);
    const totalLength = response.recordset.length;
    requestHdr[index].are_siblings_or_children = (totalLength > 1) ? true : false;

    const result = response.recordset;
    const dtl = [];
    for (const item of result) {
      // ------------------------------------------------- CREATE -------------------------------------------------
      if (requestHdr[index].request_type === 'create') {
        query = `SELECT 
            ID AS 'id',
		      	DateTimeApproved AS 'date_time_approved',
            TRIM(ColumnName) AS 'column_name',
            TRIM(NewValue) AS 'value'
            FROM RequestDtl
            WHERE RequestHdrID = @RequestHdrID
            AND CurrentStatus = 1
            AND ApprovedBy IS NOT NULL
            AND DateTimeApproved IS NOT NULL`;

        if (item.person_queue_number !== null) query += " AND PersonQueueNumber = @PersonQueueNumber";
        query += " ORDER BY DateTimeApproved ASC";

        const parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdr[index].request_id }];

        if (item.person_queue_number !== null) parameters.push({ name: "PersonQueueNumber", dataType: SQLDataTypes.INT, value: item.person_queue_number });

        const response = await helperMethods.executeQuery(query, parameters);

        if (response.recordset.length > 0) {
          if (totalLength > 1) dtl.push({ table_rows: await renameColumnName(response.recordset) });
          requestHdr[index].details = (totalLength > 1) ? dtl : await renameColumnName(response.recordset);
        }
      }
      // ------------------------------------------------- CREATE -------------------------------------------------
      // ------------------------------------------------- EDIT -------------------------------------------------
      else if (requestHdr[index].request_type === 'edit') {
        query = `SELECT 
                  ID AS 'id',
                  DateTimeApproved AS 'date_time_approved',
                  TRIM(ColumnName) AS 'column_name',
                  TRIM(OldValue) AS 'from',
                  TRIM(NewValue) AS 'to'
                  FROM RequestDtl
                  WHERE RequestHdrID = @RequestHdrID
                  AND CurrentStatus = 1
                  AND ApprovedBy IS NOT NULL
                  AND DateTimeApproved IS NOT NULL`;


        if (item.family_id !== null) query += " AND FamilyRecno = @FamilyRecno";
        query += " ORDER BY DateTimeApproved ASC";

        const parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdr[index].request_id }];

        if (item.family_id !== null) parameters.push({ name: "FamilyRecno", dataType: SQLDataTypes.INT, value: item.family_id });

        const response = await helperMethods.executeQuery(query, parameters);

        if (response.recordset.length > 0) {
          if (totalLength > 1){
          const obj = {
            sibling_or_child_full_name: item.sibling_or_child_full_name,
            table_rows: await renameColumnName(response.recordset)
          };
          dtl.push(obj);
        }
          requestHdr[index].details = (totalLength > 1) ? dtl : await renameColumnName(response.recordset);
        }
      }
      // ------------------------------------------------- EDIT -------------------------------------------------
      else {
        throw 'Invalid request type in getMyApproved()';
      }

    }

    requestHdr[index].description = await getDescription(requestHdr[index].created_by, requestHdr[index].request_id);
    const statusID = 1;
    requestHdr[index].requested_fields = await getRequestedFields(requestHdr[index].request_id, statusID);
  }

  return requestHdr;
}

async function updatePISIsDependent(transaction) {
  const query = `UPDATE [UE DATABASE]..Family SET PIS_IsDependent = 1 
              WHERE Recno IN (
             SELECT 
                  F1.Recno AS 'family_recno'
                            FROM [UE database]..Family AS F1
                            WHERE Recno IN
                              (SELECT 
                                DISTINCT
                                D.FamilyRecno
                                FROM [UE database]..RequestHdr AS H
                                INNER JOIN [UE database]..RequestDtl AS D
                                ON D.RequestHdrID = H.ID
                INNER JOIN [UE database]..FamilyType AS FT
                ON FT.ID = H.FamilyType
                                WHERE D.CurrentStatus = 1 -- 1 = Approved
                      AND D.ApprovedBy IS NOT NULL 
                      AND D.DateTimeApproved IS NOT NULL
                      AND H.IsDeleted = 0
                                AND H.DestinationTable = 'Family'
                AND FT.PIS_IsDeleted = 0
                      AND D.FamilyRecno IS NOT NULL
                      )
                )`;

    helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, null, transaction));
}


async function approveRequest(employeeID, data) {
  let transaction;
  try {
    let requestHdrID;
    transaction = await helperMethods.beginTransaction();

    const familyDetails = [];
    let educationalBackgroundsRequestHdrID = 0;
    let trainingOrSeminarRequestHdrID = 0;
    for (const index in data) {
      const requestDtlID = data[index].id;
      let query = `SELECT TOP 1
      H.DateTimeCreated AS 'date_time_created',
      TRIM(H.CreatedBy) AS 'created_by', 
      TRIM(H.DestinationTable) AS 'destination_table',
       CASE
      WHEN H.RequestType = 0 THEN 'Edit'
      WHEN H.RequestType = 1 THEN 'Create'
      END AS 'request_type',
       (CASE
        WHEN H.FamilyType = 0 THEN 'None'
	       ELSE (SELECT TOP 1 TRIM([Description]) FROM [UE database]..FamilyType WHERE ID = H.FamilyType) 
       END) AS 'family_type',
      ISNULL(TRIM(H.LicenseNo), '') AS 'license_no',
      TRIM(D.ColumnName) AS 'column_name',
      TRIM(D.NewValue) AS 'new_value',
      ISNULL(D.FamilyRecno, 0) AS 'family_id'
      FROM [UE database]..RequestDtl AS D
      INNER JOIN RequestHdr AS H
      ON D.RequestHdrID = H.ID
      WHERE D.ID = @ID`;

      let parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestDtlID }];

      let response = await helperMethods.executeQuery(query, parameters, transaction);

      const dateTimeCreated = response.recordset[0].date_time_created;
      const createdBy = response.recordset[0].created_by;
      let destinationTable = response.recordset[0].destination_table;
      const requestType = response.recordset[0].request_type;
      const familyType = response.recordset[0].family_type;
      const licenseNo = response.recordset[0].license_no;
      const columnName = response.recordset[0].column_name;
      const newValue = response.recordset[0].new_value;
      const familyID = response.recordset[0].family_id;


      query = `UPDATE [UE database]..RequestDtl 
               SET CurrentStatus = 1, ApprovedBy = @ApprovedBy, DateTimeApproved = GETDATE()
               WHERE ID = @ID`;

      parameters = [
        { name: "ApprovedBy", dataType: SQLDataTypes.VARCHAR, value: employeeID },
        { name: "ID", dataType: SQLDataTypes.INT, value: requestDtlID },
      ];

      helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));

      // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------
      if (data[index].column_name !== undefined && data[index].value !== undefined) {
        let tableName = "";
        const columnName = data[index].column_name;
        let value = data[index].value;

        if (columnName === "DEGREE") tableName = "CollegeDegrees";
        else if (columnName === "COURSE") tableName = "CollegeCourses";
        else if (columnName === "MAJOR") tableName = "CollegeMajors";
        else throw "Invalid value of column_name";

        let isExist = false;

        if (columnName === "DEGREE" || columnName === "COURSE") {
            
           let degreeOrCourseName = value;
           degreeOrCourseName = degreeOrCourseName.trim().toUpperCase().replace("IN", "");

           query = `SELECT TOP 1
                    COUNT(ID) AS 'total'
                    FROM HR..${tableName} 
                    WHERE [Description] = @Description`;
                   parameters = [{ name: "Description", dataType: SQLDataTypes.VARCHAR, value: degreeOrCourseName }];
                   response = await helperMethods.executeQuery(query, parameters, transaction);     
                   if (response.recordset[0].total > 0) isExist = true; 

                   if (!isExist){
                    query = `INSERT INTO HR..${tableName} 
                    (Description, IsActive, CreatedBy)
                    VALUES 
                    (@Description, @IsActive, @CreatedBy)`;
        
                    parameters = [
                      { name: "Description", dataType: SQLDataTypes.VARCHAR, value: degreeOrCourseName },
                      { name: "IsActive", dataType: SQLDataTypes.BIT, value: true },
                      { name: "CreatedBy", dataType: SQLDataTypes.VARCHAR, value: employeeID },
                    ];
                  }

        } else if (columnName === "MAJOR") {
          let courseID;
          if (helperMethods.isValidNumber(data[index].course_id)) courseID = data[index].course_id;
          else {
          query = `SELECT TOP 1
                   ID
                   FROM HR..CollegeCourses 
                   WHERE [Description] = @Description`;
                   parameters = [{ name: "Description", dataType: SQLDataTypes.VARCHAR, value: data[index].course_id }];
                   response = await helperMethods.executeQuery(query, parameters, transaction);     
                   courseID = response.recordset[0].ID;
          }

          let majorName = value.trim().toUpperCase();
          const containsMajorIn = majorName.includes("MAJOR IN");
          if (!containsMajorIn) majorName = `MAJOR IN ${majorName}`;

          value = majorName;

          query = `SELECT TOP 1
                   COUNT(ID) AS 'total'
                   FROM HR..${tableName} 
                   WHERE [Description] = @Description`;
          parameters = [{ name: "Description", dataType: SQLDataTypes.VARCHAR, value: majorName }];
          response = await helperMethods.executeQuery(query, parameters, transaction);     
          if (response.recordset[0].total > 0) isExist = true; 

          if (!isExist){
            query = `INSERT INTO HR..${tableName} 
            (IsActive, CollegeCourseID, Description, CreatedBy)
            VALUES 
            (@IsActive, @CollegeCourseID, @Description, @CreatedBy)`;

            parameters = [
              { name: "IsActive", dataType: SQLDataTypes.BIT, value: true },
              { name: "CollegeCourseID", dataType: SQLDataTypes.INT, value: courseID },
              { name: "Description", dataType: SQLDataTypes.VARCHAR, value: majorName },
              { name: "CreatedBy", dataType: SQLDataTypes.VARCHAR, value: employeeID },
            ];
          }
        }

        if (!isExist)helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));

        query = `SELECT TOP 1 
                 ID AS 'LatestID' 
                 FROM HR..${tableName} 
                 WHERE [Description] = @Description 
                 ORDER BY ID DESC`;
        parameters = [{ name: "Description", dataType: SQLDataTypes.VARCHAR, value: value}];
        response = await helperMethods.executeQuery(query, parameters, transaction);
        const latestID = response.recordset[0].LatestID;

        query = `UPDATE [UE database]..RequestDtl 
                 SET NewValue = @NewValue
                 WHERE ID = @ID`;
        parameters = [
          { name: "NewValue", dataType: SQLDataTypes.VARCHAR, value: latestID },
          { name: "ID", dataType: SQLDataTypes.INT, value: requestDtlID },
        ];
        helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
      }
      // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------

      query = `SELECT TOP 1 RequestHdrID
               FROM [UE database]..RequestDtl 
               WHERE ID = @ID`;

      parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestDtlID }];

      response = await helperMethods.executeQuery(query, parameters, transaction);
      requestHdrID = response.recordset[0].RequestHdrID;

      // ------------------------------------------------- EDIT -------------------------------------------------
      if (requestType === "Edit") {

        // ------------------------------------------------- LICENSE -------------------------------------------------
        if (familyType === "None" && licenseNo === "" && destinationTable === "License") throw `this employee doesn't have a license number. Please update it in the HRMS.`;       
        // ------------------------------------------------- LICENSE -------------------------------------------------

        // ------------------------------------------------- PERSONAL INFORMATIONS -------------------------------------------------
        if (familyType === "None" && licenseNo === "") {

          if (columnName.includes("CurrentAddress_") === true || columnName.includes("PermanentAddress_") === true) {
            destinationTable += "Ext";

            let query = `SELECT TOP 1 
                         EmployeeCode 
                         FROM [UE database]..${destinationTable}
                         WHERE EmployeeCode = @EmployeeCode`;

            parameters = [{ name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: createdBy }];

            response = await helperMethods.executeQuery(query, parameters, transaction);

            if (response.recordset.length === 0) {
              query = `INSERT INTO [UE database]..${destinationTable}
               (EmployeeCode, CurrentAddress_StreetName, CurrentAddress_RegionCode, CurrentAddress_ProvinceCode, 
                CurrentAddress_CityOrMunicipalityCode, CurrentAddress_Barangay, PermanentAddress_IsSameAsCurrentAddress, 
                PermanentAddress_StreetName, PermanentAddress_RegionCode, PermanentAddress_ProvinceCode, 
                PermanentAddress_CityOrMunicipalityCode, PermanentAddress_Barangay, CreatedBy, DateTimeCreated)
                VALUES
               (@EmployeeCode, '', '', '', '', '', 0, '', '', '', '', '', @EmployeeCode, GETDATE())`;

              parameters = [{ name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: createdBy }];
              helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
            }

          }

          const query = `UPDATE [UE database]..${destinationTable}
                       SET ${columnName} = @NewValue 
                       WHERE EmployeeCode = @EmployeeCode`;

          parameters = [
            { name: "NewValue", dataType: SQLDataTypes.VARCHAR, value: newValue.toString() },
            { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: createdBy }
          ];
          helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
        }
        // ------------------------------------------------- PERSONAL INFORMATIONS -------------------------------------------------

        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------
        else if (familyType !== "None" && licenseNo === "") {


          if (columnName === "MARRIAGE CERTIFICATE" || columnName === "BIRTH CERTIFICATE") {

            if (columnName === "MARRIAGE CERTIFICATE") await manipulateFolder(transaction, requestHdrID, "MARRIAGE CERTIFICATE", "approved", createdBy);        
            else if (columnName === "BIRTH CERTIFICATE") await manipulateFolder(transaction, requestHdrID, "BIRTH CERTIFICATE", "approved", createdBy, requestDtlID);
            
            const query = `UPDATE [UE database]..Family
                           SET HasAttachment = 1, UpdatedBy = @UpdatedBy, DateTimeUpdated = @DateTimeUpdated
                           WHERE EmployeeCode = @EmployeeCode 
                           AND FamType = @FamType AND Recno = @Recno`;

            parameters = [
              { name: "UpdatedBy", dataType: SQLDataTypes.VARCHAR, value: createdBy },
              { name: "DateTimeUpdated", dataType: SQLDataTypes.DATETIME, value: dateTimeCreated },
              { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: createdBy },
              { name: "FamType", dataType: SQLDataTypes.VARCHAR, value: familyType },
              { name: "Recno", dataType: SQLDataTypes.INT, value: familyID },
            ];
            helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
          }
          else {
            let query = `UPDATE [UE database]..${destinationTable}
                         SET ${columnName} = @NewValue, UpdatedBy = @UpdatedBy, DateTimeUpdated = @DateTimeUpdated
                         WHERE EmployeeCode = @EmployeeCode AND FamType = '${familyType}'`;

            if (familyType === "Sibling" || familyType === "Child") query += ` AND Recno = ${familyID}`;

            parameters = [
              { name: "NewValue", dataType: SQLDataTypes.VARCHAR, value: newValue },
              { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: createdBy },
              { name: "UpdatedBy", dataType: SQLDataTypes.VARCHAR, value: createdBy },
              { name: "DateTimeUpdated", dataType: SQLDataTypes.DATETIME, value: dateTimeCreated }
            ];

            helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));

            if (familyType === "Child" && columnName === "FullName") {
              query = `SELECT TOP 1 OldValue
              FROM [UE database]..RequestDtl 
              WHERE ID = @ID`;

              parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestDtlID }];
              response = await helperMethods.executeQuery(query, parameters, transaction);
              let oldValue = response.recordset[0].OldValue;

              if (oldValue !== null) oldValue = oldValue.trim();

              const uploadedFolderPath = helperMethods.getUploadedFolderPath();
              let fullPath = `${uploadedFolderPath  }/current_files/${  createdBy}`;
              fullPath += `/family_backgrounds/children/birth_certificate/${  oldValue  }.pdf`;

              let foundPath = "";

              if (await helperMethods.isExist(fullPath) === true) foundPath = fullPath;
              else throw `The file: ${oldValue} was not found.`;

              if (foundPath !== "") {
                const extension = foundPath.split('.').pop();
                await helperMethods.renameFile(foundPath, `${newValue  }.${  extension}`);
              }
            }
          }

          await updatePISIsDependent(transaction);
        }
        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------

        // ------------------------------------------------- LICENSE -------------------------------------------------
        else if (familyType === "None" && licenseNo !== "") {
          query = `SELECT TOP 1 (ISNULL(LicenseNo, '')) AS 'LicenseNo'
          FROM [UE database]..RequestHdr 
          WHERE ID = @ID`;
          parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestHdrID }];
          response = await helperMethods.executeQuery(query, parameters, transaction);
          if (response.recordset[0].LicenseNo === "" || response.recordset[0].LicenseNo === undefined || response.recordset[0].LicenseNo === null)
          {
                 query = `UPDATE [UE database]..RequestHdr
                           SET LicenseNo = @LicenseNo
                           WHERE ID = @ID`;

                 parameters = [
                   { name: "LicenseNo", dataType: SQLDataTypes.CHAR, value: licenseNo },
                   { name: "ID", dataType: SQLDataTypes.INT, value: requestHdrID },
                 ];

                 helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
           }

          if (columnName === "ExpirationDate") {
            query = `UPDATE [UE database]..${destinationTable} 
                     SET ${columnName} = @NewValue, UpdatedBy = @UpdatedBy, DateTimeUpdated = @DateTimeUpdated
                     WHERE EmployeeCode = @EmployeeCode AND LicenseNo = '${licenseNo}'`;

            parameters = [
              { name: "NewValue", dataType: SQLDataTypes.VARCHAR, value: newValue },
              { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: createdBy },
              { name: "UpdatedBy", dataType: SQLDataTypes.VARCHAR, value: createdBy },
              { name: "DateTimeUpdated", dataType: SQLDataTypes.DATETIME, value: dateTimeCreated }
            ];

            helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
          } else if (columnName === "PRC ID") await manipulateFolder(transaction, requestHdrID, "PRC ID", "approved", createdBy);
        }
        // ------------------------------------------------- LICENSE -------------------------------------------------
      }
      // ------------------------------------------------- EDIT -------------------------------------------------
      // ------------------------------------------------- CREATE -------------------------------------------------
      else if (requestType === "Create") {

        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------
        if (familyType !== "None" && licenseNo === "") {
          query = `SELECT DISTINCT RequestHdrID, PersonQueueNumber
                       FROM [UE database]..RequestDtl 
                       WHERE RequestHdrID = @RequestHdrID`;

          parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdrID }];
          response = await helperMethods.executeQuery(query, parameters, transaction);
          if (familyType === "Child" || familyType === "Sibling") {
            const result = response.recordset;
            for (let i = 0; i < result.length; i++) {
              const personQueueNumber = result[i].PersonQueueNumber;
              query = `SELECT TOP 1
                       PersonQueueNumber
                       FROM [UE database]..RequestDtl 
                       WHERE ID = @ID`;

              parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestDtlID }];
              response = await helperMethods.executeQuery(query, parameters, transaction);

              if (personQueueNumber === response.recordset[0].PersonQueueNumber)
                if (familyDetails.some(x => x.PersonQueueNumber === personQueueNumber) === false) familyDetails.push(result[i]);
            }
          } else {
            if (familyDetails.length === 0) familyDetails.push(response.recordset);
          }

          if (columnName === "BIRTH CERTIFICATE") await manipulateFolder(transaction, requestHdrID, columnName, "approved", createdBy, requestDtlID);
        }
        // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------

        // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------
        if (familyType === "None" && licenseNo === '' && destinationTable === "Education") {
          if (educationalBackgroundsRequestHdrID === 0) educationalBackgroundsRequestHdrID = requestHdrID;
          if (columnName === "DIPLOMA") await manipulateFolder(transaction, requestHdrID, columnName, "approved", createdBy);
        }
        // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------

        // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------
        if (columnName === "TRAINING OR SEMINAR CERTIFICATE") {
          if (trainingOrSeminarRequestHdrID === 0) trainingOrSeminarRequestHdrID = requestHdrID;
          await manipulateFolder(transaction, requestHdrID, columnName, "approved", createdBy);
        }
        // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------

      } else throw "The value of requestType is not valid.";
    }


    // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------
    if (familyDetails.length > 0) {

      for (const obj of familyDetails) {

       const requestHdrID = (obj.RequestHdrID === undefined) ? obj[0].RequestHdrID : obj.RequestHdrID 

        let query = `SELECT 
       (SELECT CreatedBy FROM [UE database]..RequestHdr WHERE ID = @RequestHdrID) AS 'EmployeeCode',
       (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'FullName' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'FullName',
       (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'Birthdate' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'Birthdate',
       (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'Occupation' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'Occupation',
       (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'MarriageDate' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'MarriageDate',
       (SELECT FT.[Description]
          FROM [UE database]..RequestHdr AS HDR
          INNER JOIN [UE database]..FamilyType AS FT
          ON HDR.FamilyType = FT.ID
          WHERE HDR.ID = @RequestHdrID
       ) AS 'FamType',
       (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'CompanySchool' AND RequestHdrID = @RequestHdrID AND PersonQueueNumber = @PersonQueueNumber) AS 'CompanySchool'`;

        let parameters = [
          { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdrID},
          { name: "PersonQueueNumber", dataType: SQLDataTypes.SMALLINT, value: (obj.PersonQueueNumber === undefined) ? obj[0].PersonQueueNumber : obj.PersonQueueNumber },
        ];

        let response = await helperMethods.executeQuery(query, parameters, transaction);
        const result = response.recordset[0];

        let hasAttachment = 0;
        if (result.FamType.trim() === 'Child' || result.FamType.trim() === 'Spouse') hasAttachment = 1;

        query = `INSERT INTO [UE database]..Family
          (EmployeeCode, FullName, Birthdate, Occupation, MarriageDate, FamType, CompanySchool, HasAttachment)
          VALUES 
          (@EmployeeCode, @FullName, @Birthdate, @Occupation, @MarriageDate, @FamType, @CompanySchool, @HasAttachment)`;

        parameters = [
          { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: result.EmployeeCode },
          { name: "FullName", dataType: SQLDataTypes.VARCHAR, value: result.FullName },
          { name: "Birthdate", dataType: SQLDataTypes.DATE, value: result.Birthdate },
          { name: "Occupation", dataType: SQLDataTypes.VARCHAR, value: result.Occupation },
          { name: "MarriageDate", dataType: SQLDataTypes.DATE, value: result.MarriageDate },
          { name: "FamType", dataType: SQLDataTypes.VARCHAR, value: result.FamType },
          { name: "CompanySchool", dataType: SQLDataTypes.VARCHAR, value: result.CompanySchool },
          { name: "HasAttachment", dataType: SQLDataTypes.BIT, value: hasAttachment }
        ];

        helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));

        query = `SELECT TOP 1 
                 Recno AS 'id'
                 FROM [UE database]..Family 
                 ORDER BY DateTimeCreated DESC`;

         response = await helperMethods.executeQuery(query, null, transaction);
         const recno = helperMethods.toNumber(response.recordset[0].id);

         query = `UPDATE [UE database]..RequestDtl
                  SET FamilyRecno = @FamilyRecno
                  WHERE RequestHdrID = @RequestHdrID
                  AND FamilyRecno IS NULL`;

         parameters = [
                    { name: "FamilyRecno", dataType: SQLDataTypes.INT, value: recno },
                    { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestHdrID }
         ];

         helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));

        // ------------------------------------------------- SPOUSE -------------------------------------------------
        if (result.FamType === "Spouse") await manipulateFolder(transaction, obj[0].RequestHdrID, "MARRIAGE CERTIFICATE", "approved", result.EmployeeCode);
        // ------------------------------------------------- SPOUSE -------------------------------------------------
      }

      await updatePISIsDependent(transaction);
    }
    // ------------------------------------------------- FAMILY BACKGROUNDS -------------------------------------------------


    // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------
    if (educationalBackgroundsRequestHdrID !== 0) {
     let query = `SELECT 
        (SELECT CreatedBy FROM [UE database]..RequestHdr WHERE ID = @RequestHdrID) AS 'employee_code',
        (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'From' AND RequestHdrID = @RequestHdrID) AS 'from',
        (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'To' AND RequestHdrID = @RequestHdrID) AS 'to',
        (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'SchoolListID' AND RequestHdrID = @RequestHdrID) AS 'school_list_id',
        (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'CollegeDegreeID' AND RequestHdrID = @RequestHdrID) AS 'college_degree_id',
        (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'CollegeCourseID' AND RequestHdrID = @RequestHdrID) AS 'college_course_id',
        (SELECT NewValue FROM [UE database]..RequestDtl WHERE ColumnName = 'CollegeMajorID' AND RequestHdrID = @RequestHdrID) AS 'college_major_id'`;

      let parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: educationalBackgroundsRequestHdrID }];

      const response = await helperMethods.executeQuery(query, parameters, transaction);
      const result = response.recordset[0];

      query = `INSERT INTO [UE database]..Education 
        (EmployeeCode, [From], [To], IsDiplomaSubmitted, IsTranscriptSubmitted, IsFinish, HasAttachment, SchoolListID, CollegeDegreeID, CollegeCourseID`;

      if (result.college_major_id !== undefined && result.college_major_id !== null) query += ", CollegeMajorID";

      query += `)
                VALUES 
               (@EmployeeCode, @From, @To, 1, 1, 1, 1, @SchoolListID, @CollegeDegreeID, @CollegeCourseID`;

      if (result.college_major_id !== undefined && result.college_major_id !== null) query += ", @CollegeMajorID";

      query += ")";

      parameters = [
        { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: result.employee_code },
        { name: "From", dataType: SQLDataTypes.VARCHAR, value: result.from },
        { name: "To", dataType: SQLDataTypes.VARCHAR, value: result.to },
        { name: "SchoolListID", dataType: SQLDataTypes.INT, value: result.school_list_id },
        { name: "CollegeDegreeID", dataType: SQLDataTypes.INT, value: result.college_degree_id },
        { name: "CollegeCourseID", dataType: SQLDataTypes.INT, value: result.college_course_id },
      ];

      if (result.college_major_id !== undefined && result.college_major_id !== null) parameters.push({ name: "CollegeMajorID", dataType: SQLDataTypes.INT, value: result.college_major_id });
      helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
    }
    // ------------------------------------------------- EDUCATIONAL BACKGROUNDS -------------------------------------------------


    // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------
    if (trainingOrSeminarRequestHdrID !== 0) {
      let query = `SELECT 
      (SELECT CreatedBy FROM RequestHdr WHERE ID = @RequestHdrID) AS 'employee_code',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'TrainingOrSeminarName' AND RequestHdrID = @RequestHdrID) AS 'training_or_seminar_name',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'TrainingProvider' AND RequestHdrID = @RequestHdrID) AS 'training_provider',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'FromDate' AND RequestHdrID = @RequestHdrID) AS 'from_date',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'ToDate' AND RequestHdrID = @RequestHdrID) AS 'to_date',
      (SELECT NewValue FROM RequestDtl WHERE ColumnName = 'Venue' AND RequestHdrID = @RequestHdrID) AS 'venue'`;

      let parameters = [{ name: "RequestHdrID", dataType: SQLDataTypes.INT, value: trainingOrSeminarRequestHdrID }];
      const response = await helperMethods.executeQuery(query, parameters, transaction);
      const result = response.recordset[0];

      query = `INSERT INTO HR..EmployeeCompletedTrainingOrSeminar 
           (EmployeeCode, TrainingOrSeminarName, TrainingProvider, FromDate, ToDate, Venue, CreatedBy)
           VALUES 
           (@EmployeeCode, @TrainingOrSeminarName, @TrainingProvider, @FromDate, @ToDate, @Venue, @CreatedBy)`;

      parameters = [
        { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: result.employee_code },
        { name: "TrainingOrSeminarName", dataType: SQLDataTypes.VARCHAR, value: result.training_or_seminar_name },
        { name: "TrainingProvider", dataType: SQLDataTypes.VARCHAR, value: result.training_provider },
        { name: "FromDate", dataType: SQLDataTypes.VARCHAR, value: result.from_date },
        { name: "ToDate", dataType: SQLDataTypes.VARCHAR, value: result.to_date },
        { name: "Venue", dataType: SQLDataTypes.VARCHAR, value: result.venue },
        { name: "CreatedBy", dataType: SQLDataTypes.VARCHAR, value: result.employee_code }
      ];

      helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
    }
    // ------------------------------------------------- TRAINING OR SEMINAR -------------------------------------------------

    await usersModel.sendEmail(requestHdrID, "Your request has been approved by HR. <br/>", transaction);

    await helperMethods.commitTransaction(transaction);
  } catch (error) {
    await helperMethods.rollbackTransaction(transaction);
    throw error;
  }
}

async function setHRRemarks(employeeID, data) {
  let transaction;
  try {
    transaction = await helperMethods.beginTransaction();

    let requestHDRID = 0;

    for (const index in data.ids) {
      if (requestHDRID === 0) {
        let query = `SELECT TOP 1 
                     RequestHdrID
                     FROM RequestDtl
                     WHERE ID = @ID`;

        let parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: data.ids[index].id }];
        const response = await helperMethods.executeQuery(query, parameters, transaction);
        requestHDRID = response.recordset[0].RequestHdrID;

        query = `UPDATE [UE database]..RequestHdr 
                 SET ShouldHighlightedToRequester = 1
                 WHERE ID = @ID`;

        parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestHDRID }];
        helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
      }

      const query = `UPDATE [UE database]..RequestDtl 
                    SET RemarksBy = @RemarksBy, DateTimeRemarks = GETDATE(), HRRemarks = @HRRemarks, IsComplied = 0
                    WHERE ID = @ID`;

      const parameters = [
        { name: "RemarksBy", dataType: SQLDataTypes.VARCHAR, value: employeeID },
        { name: "HRRemarks", dataType: SQLDataTypes.VARCHAR, value: data.hr_remarks },
        { name: "ID", dataType: SQLDataTypes.INT, value: data.ids[index].id },
      ];

      helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
    }

     await usersModel.sendEmail(requestHDRID, "HR has set a remark/remarks on your request <br/>", transaction);

      await helperMethods.commitTransaction(transaction);

  } catch (error) {
    await helperMethods.rollbackTransaction(transaction);
    throw error;
  }
}



async function requestNotHighLightedToHR(requestID) {
  const query = `UPDATE [UE DATABASE]..RequestHdr 
                 SET ShouldHighlightedToHR = 0 
                 WHERE ID = @ID`;

  const parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestID }];

  helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters));
}

async function getMinimumDateWithPendingRequest() {
  const query = `SELECT TOP 1 
    CAST(H.DateTimeCreated AS DATE) AS 'DateTimeCreated'
    FROM [UE database]..RequestHdr AS H
    INNER JOIN [UE database]..RequestDtl AS D
    ON H.ID = D.RequestHdrID
    WHERE D.ApprovedBy IS NULL AND D.DateTimeApproved IS NULL
    ORDER BY H.DateTimeCreated ASC`;
  const response = await helperMethods.executeQuery(query);
  return (response.recordset[0] !== undefined) ? response.recordset[0].DateTimeCreated : '1900-01-01';
}

async function deleteRequest(employeeID, requestID) {
  const query = `UPDATE [UE DATABASE]..RequestHdr 
                 SET IsDeleted = 1, DeletedBy = @DeletedBy, DateTimeDeleted = GETDATE() 
                 WHERE ID = @ID AND IsDeleted = 0 AND DeletedBy IS NULL AND DateTimeDeleted IS NULL`;

  const parameters = [
    { name: "DeletedBy", dataType: SQLDataTypes.VARCHAR, value: employeeID },
    { name: "ID", dataType: SQLDataTypes.INT, value: requestID },
  ];

  helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters));
}


async function get(employeeID, dateRangeSearch) {
  const otherRequests = dateRangeSearch.other_requests;
  return {
    minimum_date_with_pending_request: await getMinimumDateWithPendingRequest(),
    pending: await getPending(employeeID, otherRequests.pending.date_from, otherRequests.pending.date_to),
    my_approved: await getMyApproved(employeeID, otherRequests.my_approved.date_from, otherRequests.my_approved.date_to),
  }
}


module.exports = {
  get,
  getPending,
  getMyApproved,
  approveRequest,
  setHRRemarks,
  renameColumnName,
  getDescription,
  getRequestedFields,
  requestNotHighLightedToHR,
  getMinimumDateWithPendingRequest,
  deleteRequest
}
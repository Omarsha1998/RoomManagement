const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 


function toActualColumnName(columnName) {
  if (columnName === "last_name") return "LastName";
  else if (columnName === "first_name") return "FirstName";
  else if (columnName === "middle_name") return "MiddleName";
  else if (columnName === "extension_name") return "ExtName";
  else if (columnName === "nick_name") return "Nickname";
  else if (columnName === "personal_email") return "EMail";
  else if (columnName === "mobile_no") return "MobileNo";
  else if (columnName === "telephone_no") return "Permanent_TelNo";
  else if (columnName === "height") return "Height";
  else if (columnName === "weight") return "Weight";
  else if (columnName === "address") return "Permanent_Address";
  else if (columnName === "civil_status_id") return "CivilStatus";
  else if (columnName === "religion_id") return "ReligionCode";
  else if (columnName === "contact_person_name") return "ContactPerson";
  else if (columnName === "contact_person_address") return "Contact_Address";
  else if (columnName === "contact_person_contact_no") return "Contact_TelNo";
  else if (columnName === "relationship_id") return "ContactFamilyTypeID";
  else if (columnName === "room_or_floor_or_unit_no_and_building_name") return "RoomOrFloorOrUnitNoAndBuildingName";
  else if (columnName === "house_or_lot_and_block_no") return "HouseOrLotAndBlockNo";
  else if (columnName === "street_name") return "StreetName";
  else if (columnName === "sub_division") return "Subdivision";
  else if (columnName === "region_code") return "RegionCode";
  else if (columnName === "province_code")  return "ProvinceCode";
  else if (columnName === "city_or_municipality_code") return "CityOrMunicipalityCode";
  else if (columnName === "barangay") return "Barangay";
  else if (columnName === "is_same_as_current_address") return "IsSameAsCurrentAddress";
  else throw `Cannot find the Actual Column name of ${columnName}`;
}

async function insertIntoRequestDtlTable(
  id,
  column,
  data,
  transaction,
  employeeID,
  targetTable,
  prefix = "",
) {
  let actualColumnName = toActualColumnName(column);
  if (prefix !== "") actualColumnName = prefix + actualColumnName;
  const columnValue = data[column];

  let query = `SELECT TOP 1 EmployeeCode
   FROM [UE database]..${targetTable} 
   WHERE EmployeeCode = @EmployeeCode AND ${actualColumnName} = '${columnValue}'`;

  let parameters = [
    { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: employeeID },
  ];
  let response = await helperMethods.executeQuery(
    query,
    parameters,
    transaction,
  );
  const isExist = (response.recordset.length === 0) ? false : true;

  if (isExist === false) {
    query = `SELECT TOP 1 ${actualColumnName}
     FROM [UE database]..${targetTable} 
     WHERE EmployeeCode = @EmployeeCode`;

    parameters = [
      { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: employeeID },
    ];
    response = await helperMethods.executeQuery(query, parameters, transaction);
    const columnObject = response.recordset[0];

    let columnCurrentValue = null;

    if (columnObject !== undefined) {
      columnCurrentValue = columnObject[Object.keys(columnObject)[0]];
    }

    const requestedNewValue = data[column];

    columnCurrentValue = columnCurrentValue === null ? "" : columnCurrentValue;

    if (columnCurrentValue === "" && requestedNewValue === "") return;

    if (actualColumnName === "ReligionCode" && columnCurrentValue.toString() === "0") columnCurrentValue = "";

    query = `INSERT INTO [UE database]..RequestDtl 
             (RequestHdrID, ColumnName, OldValue, NewValue)
             VALUES 
             (@RequestHdrID, @ColumnName, @OldValue, @NewValue)`;

    parameters = [
      { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: id },
      { name: "ColumnName", dataType: SQLDataTypes.VARCHAR, value: actualColumnName },
      {
        name: "OldValue",
        dataType: SQLDataTypes.VARCHAR,
        value: columnCurrentValue.toString().toUpperCase(),
      },
      {
        name: "NewValue",
        dataType: SQLDataTypes.VARCHAR,
        value: requestedNewValue.toString().toUpperCase(),
      },
    ];

    helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));
  }
}


async function get(employeeID) {
  const query = `SELECT 
  TRIM(E.EmployeeCode) AS 'employee_id',
  TRIM(E.LastName) AS 'last_name',  
  TRIM(E.FirstName) AS 'first_name',  
  ISNULL(TRIM(E.MiddleName),'') AS 'middle_name',  
  ISNULL(TRIM(E.ExtName), '') AS 'extension_name',
  ISNULL(TRIM(E.Nickname), '') AS 'nick_name',
  TRIM(E.LastName + ', ' + E.FirstName +' ' + E.MiddleName + '. ' + E.ExtName) AS 'full_name', 
  TRIM(E.LastName + ', ' + E.FirstName + ' ' + LEFT(E.MiddleName, 1) + '. ' + E.ExtName) AS 'name',
  CASE
  WHEN E.Sex = 'M' THEN 'MALE'
  WHEN E.Sex = 'F' THEN 'FEMALE'
  ELSE ''
  END AS 'gender',
  ISNULL(TRIM(E.UERMEmail),'') AS 'uerm_email',
  ISNULL(TRIM(E.EMail),'') AS 'personal_email',
  ISNULL(TRIM(E.MobileNo), '') AS 'mobile_no',  
  ISNULL(TRIM(E.Permanent_TelNo), '') AS 'telephone_no',
  ISNULL(CONVERT(DATE,E.Birthdate),  '') AS 'birth_date', 
  FLOOR(DATEDIFF(DD, CASE
  WHEN ISNULL(CAST(E.Birthdate AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
  ELSE ISNULL(CAST(E.Birthdate AS DATE),'1900-01-01')
  END, GETDATE())/365.242) AS 'age',  
  ISNULL(TRIM(E.PlaceOfBirth), '') AS 'place_of_birth',
  ISNULL(TRIM(CT.[Description]), '') AS 'citizenship', 
  ISNULL(CS.ID, 0) AS 'civil_status_id',
  ISNULL(TRIM(CS.[Description]), '') AS 'civil_status',
  ISNULL(R.ReligionCode, 0) AS 'religion_id',
  ISNULL(TRIM(R.[Description]), '') AS 'religion',
  ISNULL(TRIM(E.DeptCode), '') AS 'department_id',
  ISNULL(REPLACE(D.[DESCRIPTION],'’',''''),'') AS 'department_name',  
  ISNULL(UPPER(REPLACE(P.POSITION,'’','''')), '') AS 'job_position',
  ISNULL(CONVERT(VARCHAR(MAX),E.DateHired,23),'1900-01-01') AS 'hired_date',
  ISNULL(CONVERT(VARCHAR(MAX),E.DateRegular,23),  '') AS 'regularized_date',  
  ISNULL(TRIM(E.TIN), '') AS 'tin',  
  ISNULL(TRIM(E.PhilHealth), '') AS 'phil_health',  
  ISNULL(TRIM(E.PagIBIG_No), '') AS 'pagibig_no',  
  ISNULL(TRIM(E.SSS_No), '') AS 'sss_no',
  ISNULL(TRIM(E.ATM_No), '') AS 'atm_no',
  ISNULL(TRIM(E.ContactPerson), '') AS 'contact_person_name', 
  ISNULL(TRIM(E.Contact_Address), '') AS 'contact_person_address',  
  ISNULL(TRIM(E.Contact_TelNo), '') AS 'contact_person_contact_no',
  (CASE
    WHEN FT.ID = 0 THEN NULL
    ELSE FT.ID END) AS 'relationship_id',
  ISNULL(TRIM(UPPER(FT.[Description])), '') AS 'relationship',
  ISNULL(TRIM(UPPER(EE.CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName)), '') AS 'current_address_room_or_floor_or_unit_no_and_building_name',
  ISNULL(TRIM(UPPER(EE.CurrentAddress_HouseOrLotAndBlockNo)), '') AS 'current_address_house_or_lot_and_block_no',
  ISNULL(TRIM(UPPER(EE.CurrentAddress_StreetName)), '') AS 'current_address_street_name',
  ISNULL(TRIM(UPPER(EE.CurrentAddress_Subdivision)), '') AS 'current_address_sub_division',
  ISNULL(TRIM(UPPER((SELECT CODE FROM UERMHIMS..CodeRegion WHERE CODE = EE.CurrentAddress_RegionCode))), '') AS 'current_address_region_code',
  ISNULL(TRIM(UPPER((SELECT CODE FROM UERMHIMS..CodeProvince WHERE CODE = EE.CurrentAddress_ProvinceCode))), '') AS 'current_address_province_code',
  ISNULL(TRIM(UPPER((SELECT CODE FROM UERMHIMS..CodeMunicipalityCity WHERE CODE = EE.CurrentAddress_CityOrMunicipalityCode))), '') AS 'current_address_city_or_municipality_code',
  ISNULL(TRIM(UPPER(EE.CurrentAddress_Barangay)), '') AS 'current_address_barangay',
	  TRIM(UPPER(
	  ISNULL(TRIM(EE.CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName) + ' ', '') + 
	  ISNULL(TRIM(EE.CurrentAddress_HouseOrLotAndBlockNo) + ' ' , '') + 
	  ISNULL(TRIM(EE.CurrentAddress_StreetName) + ' ', '')  +
	  ISNULL(TRIM(EE.CurrentAddress_Subdivision) + ' ', '')  + 
	  ISNULL(TRIM((SELECT [NAME] FROM UERMHIMS..CodeRegion WHERE CODE = EE.CurrentAddress_RegionCode) + ','), '') + ' ' + 
	  ISNULL(TRIM((SELECT [NAME] FROM UERMHIMS..CodeProvince WHERE CODE = EE.CurrentAddress_ProvinceCode) + ','), '') + ' ' +
	  ISNULL(TRIM((SELECT [NAME] FROM UERMHIMS..CodeMunicipalityCity WHERE CODE = EE.CurrentAddress_CityOrMunicipalityCode) + ','), '') + ' ' +
	  ISNULL(TRIM(EE.CurrentAddress_Barangay), '')
	  )) AS 'current_address',
  ISNULL(EE.PermanentAddress_IsSameAsCurrentAddress, 'false') AS 'permanent_address_is_same_as_current_address',
  ISNULL(TRIM(UPPER(EE.PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName)), '') AS 'permanent_address_room_or_floor_or_unit_no_and_building_name',
  ISNULL(TRIM(UPPER(EE.PermanentAddress_HouseOrLotAndBlockNo)), '') AS 'permanent_address_house_or_lot_and_block_no',
  ISNULL(TRIM(UPPER(EE.PermanentAddress_StreetName)), '') AS 'permanent_address_street_name',
  ISNULL(TRIM(UPPER(EE.PermanentAddress_Subdivision)), '') AS 'permanent_address_sub_division',
  ISNULL(TRIM(UPPER((SELECT CODE FROM UERMHIMS..CodeRegion WHERE CODE = EE.PermanentAddress_RegionCode))), '') AS 'permanent_address_region_code',
  ISNULL(TRIM(UPPER((SELECT CODE FROM UERMHIMS..CodeProvince WHERE CODE = EE.PermanentAddress_ProvinceCode))), '') AS 'permanent_address_province_code',
  ISNULL(TRIM(UPPER((SELECT CODE FROM UERMHIMS..CodeMunicipalityCity WHERE CODE = EE.PermanentAddress_CityOrMunicipalityCode))), '') AS 'permanent_address_city_or_municipality_code',
  ISNULL(TRIM(UPPER(EE.PermanentAddress_Barangay)), '') AS 'permanent_address_barangay',
    TRIM(UPPER(
	  ISNULL(TRIM(EE.PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName) + ' ', '') + 
	  ISNULL(TRIM(EE.PermanentAddress_HouseOrLotAndBlockNo) + ' ' , '') + 
	  ISNULL(TRIM(EE.PermanentAddress_StreetName) + ' ', '')  +
	  ISNULL(TRIM(EE.PermanentAddress_Subdivision) + ' ', '')  + 
	  ISNULL(TRIM((SELECT [NAME] FROM UERMHIMS..CodeRegion WHERE CODE = EE.PermanentAddress_RegionCode) + ','), '') + ' ' + 
	  ISNULL(TRIM((SELECT [NAME] FROM UERMHIMS..CodeProvince WHERE CODE = EE.PermanentAddress_ProvinceCode) + ','), '') + ' ' +
	  ISNULL(TRIM((SELECT [NAME] FROM UERMHIMS..CodeMunicipalityCity WHERE CODE = EE.PermanentAddress_CityOrMunicipalityCode) + ','), '') + ' ' +
	  ISNULL(TRIM(EE.PermanentAddress_Barangay), '')
	  )) AS 'permanent_address'
  FROM [UE database]..Employee AS E
  LEFT JOIN [UE DATABASE]..POSITION AS P ON P.POSITIONCODE = E.POSITIONCODE  
  LEFT JOIN [UE database]..Citizenship AS CT ON CONVERT(VARCHAR(MAX),CT.CITIZENSHIPCODE) = CONVERT(VARCHAR(MAX),E.CITIZEN)  
  LEFT JOIN [UE DATABASE]..CIVILSTATUS AS CS ON CONVERT(VARCHAR(MAX),CS.ID) = CONVERT(VARCHAR(MAX),E.CIVILSTATUS)
  LEFT JOIN [UE DATABASE]..RELIGION AS R ON R.RELIGIONCODE = E.RELIGIONCODE
  LEFT JOIN UERMMMC..SECTIONS AS D ON D.CODE = E.DEPTCODE
  LEFT JOIN [UE DATABASE]..FamilyType AS FT ON FT.ID = E.ContactFamilyTypeID
  LEFT JOIN [UE database]..EmployeeExt AS EE ON EE.EmployeeCode = E.EmployeeCode
  WHERE E.EmployeeCode = @EmployeeID`;

  const parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: employeeID },
  ];

  return (await helperMethods.executeQuery(query, parameters)).recordset[0];
}

async function getAllReligions() {
  const query = `SELECT 
                ReligionCode AS 'religion_id', 
                ISNULL(TRIM([Description]), '') AS 'religion_name'
                FROM [UE database]..Religion 
                ORDER BY religion_name ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getAllCivilStatuses() {
  const query = `SELECT 
              ID AS 'civil_status_id',
              ISNULL(TRIM([DESCRIPTION]), '') AS 'civil_status_name'
              FROM [UE DATABASE]..CivilStatus
              WHERE [DESCRIPTION] != 'COMMON LAW' AND [DESCRIPTION] != 'OTHERS'
              ORDER BY civil_status_name ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function hasChange(data) {
  let noChangeOnEmployeeTable = false;
  let noChangeOnEmployeeExtTable = false;

  let query = `SELECT TOP 1 EmployeeCode
               FROM [UE database]..Employee 
               WHERE EmployeeCode = @EmployeeID
               AND LastName = @LastName 
               AND FirstName = @FirstName 
               AND MiddleName = @MiddleName
               AND MiddleInitial = @MiddleInitial
               AND (ExtName = @ExtName OR ExtName IS NULL)
               AND (Nickname = @Nickname OR Nickname IS NULL)
               AND Email = @Email
               AND MobileNo = @MobileNo 
               AND Permanent_TelNo = @PermanentTelNo
               AND CivilStatus = @CivilStatus
               AND ReligionCode = @ReligionCode
               AND ContactPerson = @ContactPerson
               AND Contact_Address = @ContactAddress
               AND Contact_TelNo = @ContactTelNo
               AND ContactFamilyTypeID = @RelationShipID`;

  let parameters = [
    { name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: data.employee_id },
    { name: "LastName", dataType: SQLDataTypes.VARCHAR, value: data.last_name },
    { name: "FirstName", dataType: SQLDataTypes.VARCHAR, value: data.first_name },
    { name: "MiddleName", dataType: SQLDataTypes.VARCHAR, value: data.middle_name },
    {
      name: "MiddleInitial",
      dataType: SQLDataTypes.VARCHAR,
      value: data.middle_name.charAt(0),
    },
    { name: "ExtName", dataType: SQLDataTypes.VARCHAR, value: data.extension_name },
    { name: "Nickname", dataType: SQLDataTypes.VARCHAR, value: data.nick_name },
    { name: "Email", dataType: SQLDataTypes.VARCHAR, value: data.personal_email },
    { name: "MobileNo", dataType: SQLDataTypes.VARCHAR, value: data.mobile_no },
    { name: "PermanentTelNo", dataType: SQLDataTypes.VARCHAR, value: data.telephone_no },
    { name: "CivilStatus", dataType: SQLDataTypes.INT, value: data.civil_status_id },
    { name: "ReligionCode", dataType: SQLDataTypes.INT, value: data.religion_id },
    {
      name: "ContactPerson",
      dataType: SQLDataTypes.VARCHAR,
      value: data.contact_person_name,
    },
    {
      name: "ContactAddress",
      dataType: SQLDataTypes.VARCHAR,
      value: data.contact_person_address,
    },
    {
      name: "ContactTelNo",
      dataType: SQLDataTypes.VARCHAR,
      value: data.contact_person_contact_no,
    },
    {
      name: "RelationShipID",
      dataType: SQLDataTypes.SMALLINT,
      value: data.relationship_id,
    },
  ];

  let response = await helperMethods.executeQuery(query, parameters);

  if (response.recordset.length > 0) noChangeOnEmployeeTable = true;

  query = `SELECT TOP 1 EmployeeCode
           FROM [UE database]..EmployeeExt
           WHERE EmployeeCode = @EmployeeID
           AND CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName `; 
            
         query += (data.current_address.room_or_floor_or_unit_no_and_building_name.trim() === "") ? "IS NULL" : "= @CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName";
         query += " AND CurrentAddress_HouseOrLotAndBlockNo "; 
         query += (data.current_address.house_or_lot_and_block_no.trim() === "") ? "IS NULL" : "= @CurrentAddress_HouseOrLotAndBlockNo";
         query += " AND CurrentAddress_StreetName "; 
         query += (data.current_address.street_name.trim() === "") ? "IS NULL" : "= @CurrentAddress_StreetName";
         query += " AND CurrentAddress_Subdivision "; 
         query += (data.current_address.sub_division.trim() === "") ? "IS NULL" : "= @CurrentAddress_Subdivision";
         query += " AND CurrentAddress_RegionCode "; 
         query += (data.current_address.region_code.trim() === "") ? "IS NULL" : "= @CurrentAddress_RegionCode";
         query += " AND CurrentAddress_ProvinceCode "; 
         query += (data.current_address.province_code.trim() === "") ? "IS NULL" : "= @CurrentAddress_ProvinceCode";
         query += " AND CurrentAddress_CityOrMunicipalityCode "; 
         query += (data.current_address.city_or_municipality_code.trim() === "") ? "IS NULL" : "= @CurrentAddress_CityOrMunicipalityCode";
         query += " AND CurrentAddress_Barangay "; 
         query += (data.current_address.barangay.trim() === "") ? "IS NULL" : "= @CurrentAddress_Barangay";

         query += " AND PermanentAddress_IsSameAsCurrentAddress = "; 
         query += (data.permanent_address.is_same_as_current_address === true) ? "1" : "0";
  
         query += " AND PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName "; 
         query += (data.permanent_address.room_or_floor_or_unit_no_and_building_name.trim() === "") ? "IS NULL" : "= @PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName";

         query += " AND PermanentAddress_HouseOrLotAndBlockNo "; 
         query += (data.permanent_address.house_or_lot_and_block_no.trim() === "") ? "IS NULL" : "= @PermanentAddress_HouseOrLotAndBlockNo";
         query += " AND PermanentAddress_StreetName "; 
         query += (data.permanent_address.street_name.trim() === "") ? "IS NULL" : "= @PermanentAddress_StreetName";
         query += " AND PermanentAddress_Subdivision "; 
         query += (data.permanent_address.sub_division.trim() === "") ? "IS NULL" : "= @PermanentAddress_Subdivision";
         query += " AND PermanentAddress_RegionCode "; 
         query += (data.permanent_address.region_code.trim() === "") ? "IS NULL" : "= @PermanentAddress_RegionCode";
         query += " AND PermanentAddress_ProvinceCode "; 
         query += (data.permanent_address.province_code.trim() === "") ? "IS NULL" : "= @PermanentAddress_ProvinceCode";
         query += " AND PermanentAddress_CityOrMunicipalityCode "; 
         query += (data.permanent_address.city_or_municipality_code.trim() === "") ? "IS NULL" : "= @PermanentAddress_CityOrMunicipalityCode";
         query += " AND PermanentAddress_Barangay "; 
         query += (data.permanent_address.barangay.trim() === "") ? "IS NULL" : "= @PermanentAddress_Barangay";


  parameters = [{ name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: data.employee_id }];

  if (data.current_address.room_or_floor_or_unit_no_and_building_name.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_RoomOrFloorOrUnitNoAndBuildingName", dataType: SQLDataTypes.VARCHAR, value: data.current_address.room_or_floor_or_unit_no_and_building_name });
  }

  if (data.current_address.house_or_lot_and_block_no.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_HouseOrLotAndBlockNo", dataType: SQLDataTypes.VARCHAR, value: data.current_address.house_or_lot_and_block_no });
  }

  if (data.current_address.street_name.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_StreetName", dataType: SQLDataTypes.VARCHAR, value: data.current_address.street_name });
  }

  if (data.current_address.sub_division.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_Subdivision", dataType: SQLDataTypes.VARCHAR, value: data.current_address.sub_division });
  }

  if (data.current_address.region_code.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_RegionCode", dataType: SQLDataTypes.VARCHAR, value: data.current_address.region_code });
  }

  if (data.current_address.province_code.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_ProvinceCode", dataType: SQLDataTypes.VARCHAR, value: data.current_address.province_code });
  }
 
  if (data.current_address.city_or_municipality_code.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_CityOrMunicipalityCode", dataType: SQLDataTypes.VARCHAR, value: data.current_address.city_or_municipality_code });
  }

  if (data.current_address.barangay.trim() !== "")
  {
    parameters.push({ name: "CurrentAddress_Barangay", dataType: SQLDataTypes.VARCHAR, value: data.current_address.barangay });
  }

  if (data.permanent_address.room_or_floor_or_unit_no_and_building_name.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_RoomOrFloorOrUnitNoAndBuildingName", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.room_or_floor_or_unit_no_and_building_name });
  }
  
  if (data.permanent_address.house_or_lot_and_block_no.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_HouseOrLotAndBlockNo", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.house_or_lot_and_block_no });
  }
  
  if (data.permanent_address.street_name.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_StreetName", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.street_name });
  }
  
  if (data.permanent_address.sub_division.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_Subdivision", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.sub_division });
  }
  
  if (data.permanent_address.region_code.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_RegionCode", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.region_code });
  }
  
  if (data.permanent_address.province_code.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_ProvinceCode", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.province_code });
  }
   
  if (data.permanent_address.city_or_municipality_code.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_CityOrMunicipalityCode", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.city_or_municipality_code });
  }
  
  if (data.permanent_address.barangay.trim() !== "")
  {
    parameters.push({ name: "PermanentAddress_Barangay", dataType: SQLDataTypes.VARCHAR, value: data.permanent_address.barangay });
  }

  response = await helperMethods.executeQuery(query, parameters);
  if (response.recordset.length > 0) noChangeOnEmployeeExtTable = true;

  if (noChangeOnEmployeeTable && noChangeOnEmployeeExtTable) return false;

  return true;
}


async function createRequest(data) {
  let transaction;
  try {
    transaction = await helperMethods.beginTransaction();

    const createdBy = data.employee_id;
    const destinationTable = "Employee";
    const requestType = 0; // 0 = Edit

    let query = `INSERT INTO [UE database]..RequestHdr 
             (CreatedBy, DateTimeCreated, DestinationTable, RequestType)
             VALUES 
             (@CreatedBy, GETDATE(), @DestinationTable, @RequestType)`;

    const parameters = [
      { name: "CreatedBy", dataType: SQLDataTypes.VARCHAR, value: createdBy },
      {
        name: "DestinationTable",
        dataType: SQLDataTypes.VARCHAR,
        value: destinationTable,
      },
      { name: "RequestType", dataType: SQLDataTypes.SMALLINT, value: requestType },
    ];

    helperMethods.checkRowsAffected(await helperMethods.executeQuery(query, parameters, transaction));

    query = `SELECT TOP 1 
             ID AS 'id' 
             FROM [UE database]..RequestHdr 
             ORDER BY DateTimeCreated DESC`;
    const response = await helperMethods.executeQuery(query, null, transaction);
    const id = response.recordset[0].id;

    const employeeID = data.employee_id;
    delete data.employee_id;

    for (const column in data) {
      if (column === "current_address" || column === "permanent_address")
        continue;
      await insertIntoRequestDtlTable(
        id,
        column,
        data,
        transaction,
        employeeID,
        "Employee",
      );
    }

    for (const key of Object.keys(data.current_address)) {
      await insertIntoRequestDtlTable(
        id,
        key,
        data.current_address,
        transaction,
        employeeID,
        "EmployeeExt",
        "CurrentAddress_",
      );
    }

    for (const key of Object.keys(data.permanent_address)) {
      await insertIntoRequestDtlTable(
        id,
        key,
        data.permanent_address,
        transaction,
        employeeID,
        "EmployeeExt",
        "PermanentAddress_",
      );
    }

    await helperMethods.commitTransaction(transaction);
  } catch (error) {
    await helperMethods.rollbackTransaction(transaction);
    throw error;
  }
}



async function getAllRelationships() {
  const query = `SELECT 
  ID AS 'relationship_id',
  TRIM(UPPER([Description])) AS 'relationship'
  FROM [UE database]..FamilyType
  ORDER BY [Description] ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getAllRegions() {
  const query = `SELECT 
                TRIM(CODE) AS 'region_code', 
                TRIM(UPPER([NAME])) AS 'region_name'
                FROM UERMHIMS..CodeRegion
                ORDER BY [NAME] ASC`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getAllProvinces(regionCode) {
  const query = `SELECT 
               TRIM(CODE) AS 'province_code', 
               TRIM(UPPER([NAME])) AS 'province_name'
               FROM UERMHIMS..CodeProvince
               WHERE LEFT(Code, 2) = @RegionCode
               ORDER BY [NAME] ASC`;
  const parameters = [
    { name: "RegionCode", dataType: SQLDataTypes.VARCHAR, value: regionCode },
  ];
  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

async function getAllCitiesOrMunicipalities(provinceCode) {
  const query = `SELECT 
               TRIM(CODE) AS 'city_or_municipality_code', 
               TRIM(UPPER([NAME])) AS 'city_or_municipality_name'
               FROM UERMHIMS..CodeMunicipalityCity
               WHERE Code != '133900000' 
               AND LEFT(Code, 4) = LEFT(@ProvinceCode, 4)
               ORDER BY [NAME] ASC`;
  const parameters = [
    { name: "ProvinceCode", dataType: SQLDataTypes.VARCHAR, value: provinceCode },
  ];
  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

module.exports = {
  get,
  getAllReligions,
  getAllCivilStatuses,
  createRequest,
  hasChange,
  getAllRelationships,
  getAllRegions,
  getAllProvinces,
  getAllCitiesOrMunicipalities,
};

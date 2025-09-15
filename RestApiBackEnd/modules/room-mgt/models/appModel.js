const sqlHelper = require("../../../helpers/sql");

const roomValidation = async (roomCode, bldgCode, department) => {
  return await sqlHelper.query(
    `SELECT 
        *
    FROM
        RoomMgt..Rooms
    WHERE
        RoomId = ? and BldgCode = ? and Department = ?
    `,
    [roomCode, bldgCode, department],
  );
};

const roomTypesvalidation = async (code, description) => {
  return await sqlHelper.query(
    `SELECT
        CASE
            WHEN code = ? THEN code
            ELSE ''
        END AS code,
        CASE
            WHEN description = ? THEN description
            ELSE ''
        END AS description
    FROM
        RoomMgt..RoomTypes
    WHERE
        code = ? OR description = ?;
    `,
    [code, description, code, description],
  );
};

const addRoomType = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "RoomMgt..RoomTypes",
    item,
    txn,
    creationDateTimeField,
  );
};

const buildingValidation = async (code, description, buildingName) => {
  return await sqlHelper.query(
    `SELECT
        CASE
            WHEN code = ? THEN code
            ELSE ''
        END AS code,
        CASE
            WHEN description = ? THEN description
            ELSE ''
        END AS description,
        CASE
            WHEN name = ? THEN name
            ELSE ''
        END AS name
    FROM
        RoomMgt..Buildings
    WHERE
        code = ? OR description = ? OR name = ?
    `,
    [code, description, buildingName, code, description, buildingName],
  );
};

const addBuilding = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "RoomMgt..Buildings",
    item,
    txn,
    creationDateTimeField,
  );
};

const getRoomTypes = async () => {
  return await sqlHelper.query(
    `SELECT
        code, description
    FROM
        RoomMgt..RoomTypes
    `,
  );
};

const getBuildings = async () => {
  return await sqlHelper.query(
    `SELECT
        code, description
    FROM
        RoomMgt..Buildings
    `,
  );
};

const addRoom = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "RoomMgt..Rooms",
    item,
    txn,
    creationDateTimeField,
  );
};

const getDepartments = async () => {
  return await sqlHelper.query(
    `SELECT
        DESCRIPTION DeptLabel, CODE DeptCode
    FROM
        UERMMMC..vw_Departments
    WHERE
        DESCRIPTION NOT LIKE 'INACTIVE:%'
    `,
  );
};

const getRooms = async () => {
  return await sqlHelper.query(
    `SELECT 
        Id, Name
    FROM 
        RoomMgt..Rooms
    `,
  );
};

module.exports = {
  roomValidation,
  roomTypesvalidation,
  addRoomType,
  buildingValidation,
  addBuilding,
  getRoomTypes,
  getBuildings,
  addRoom,
  getDepartments,
  getRooms,
};

const db = require("../../../helpers/sql.js");
const roomModel = require("../models/appModel.js");

const addRoom = async (req, res) => {
  const employeeId = req.user.employeeId;
  const roomId = req.body.roomId ? req.body.roomId.toUpperCase() : null;
  const name = req.body.name.toUpperCase();
  const department = req.body.department
    ? req.body.department.toUpperCase()
    : null;
  const bldgCode = req.body.bldgCode.toUpperCase();
  const floorArea = req.body.floorArea;
  const capacity = req.body.capacity;
  const floor = req.body.floor;
  const roomTypeId = req.body.roomTypeId;

  const roomValidation = await roomModel.roomValidation(
    roomId,
    bldgCode,
    department,
  );
  if (roomValidation.length > 0) {
    return res.status(409).json({ error: "Room already exist" });
  }

  const insertedRoom = await db.transact(async (txn) => {
    return await roomModel.addRoom(
      {
        Name: roomId,
        RoomTypeCodes: roomTypeId,
        Description: name,
        BldgCode: bldgCode,
        DepartmentCode: department,
        FloorArea: floorArea,
        Capacity: capacity,
        Floor: floor,
        CreatedBy: employeeId,
      },
      txn,
      "DateTimeCreated",
    );
  });
  if (!insertedRoom) return res.status(500).json(null);
  res.status(200).json({ body: "Success Inserting Another Room" });
};

const addRoomType = async (req, res) => {
  const code = req.body.code.toUpperCase();
  const employeeId = req.user.employeeId;
  const description = req.body.description.toUpperCase();
  const roomTypesValidation = await roomModel.roomTypesvalidation(
    code,
    description,
  );
  if (roomTypesValidation.length > 0) {
    const checkExisting = roomTypesValidation[0];
    const checkCode = checkExisting.code;
    const checkDescription = checkExisting.description;
    if (checkCode && checkDescription) {
      return res.status(409).json({
        error: "Room Type Code and Room Type Description already exist",
      });
    } else if (checkCode) {
      return res.status(409).json({ error: "Room Type Code already exists" });
    } else {
      return res
        .status(409)
        .json({ error: "Room Type Description already exists" });
    }
  }
  const insertedRoomType = await db.transact(async (txn) => {
    return await roomModel.addRoomType(
      {
        createdBy: employeeId,
        code: code,
        description: description,
      },
      txn,
      "dateTimeCreated",
    );
  });
  if (!insertedRoomType) return res.status(500).json(null);
  res.status(200).json({ body: "Success Inserting Another Room Types" });
};

const addBuilding = async (req, res) => {
  const code = req.body.code.toUpperCase();
  const buildingName = req.body.name.toUpperCase();
  const description = req.body.description.toUpperCase();
  const employeeId = req.user.employeeId;

  const buildingValidation = await roomModel.buildingValidation(
    code,
    description,
    buildingName,
  );

  if (buildingValidation.length > 0) {
    const checkExisting = buildingValidation[0];
    const checkCode = checkExisting.code;
    const checkDescription = checkExisting.description;
    const checkName = checkExisting.name;

    const existingFields = [];
    if (checkCode) existingFields.push("Code");
    if (checkDescription) existingFields.push("Description");
    if (checkName) existingFields.push("Name");

    if (existingFields.length > 0) {
      const errorMessage = `Room Building ${existingFields.join(", ")} already exist`;
      return res.status(409).json({ error: errorMessage });
    }
  }

  const insertedBuilding = await db.transact(async (txn) => {
    return await roomModel.addBuilding(
      {
        createdBy: employeeId,
        name: buildingName,
        code: code,
        description: description,
      },
      txn,
      "dateTimeCreated",
    );
  });

  if (!insertedBuilding) return res.status(500).json(null);
  res.status(200).json({ body: "Success Inserting Buildings" });
};

const getRoomTypes = async (req, res) => {
  try {
    const result = await roomModel.getRoomTypes();
    return res.status(200).json(result && result.length > 0 ? result : []);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBuildings = async (req, res) => {
  try {
    const result = await roomModel.getBuildings();
    return res.status(200).json(result && result.length > 0 ? result : []);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDepartments = async (req, res) => {
  try {
    const result = await roomModel.getDepartments();
    return res.status(200).json(result && result.length > 0 ? result : []);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addRoom,
  addRoomType,
  addBuilding,
  getRoomTypes,
  getBuildings,
  getDepartments,
};

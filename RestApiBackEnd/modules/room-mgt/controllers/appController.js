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

// const runTimeData = async () => {
//   // Convert UTC to UTC+8 (for READING from DB)
//   const toUTC8 = (date) => {
//     if (!date) return null;
//     const d = new Date(date);
//     d.setHours(d.getHours() + 8);
//     return d;
//   };

//   const parseDate = (str) => {
//     if (!str) return null;
//     const d = new Date(str.replace(" ", "T"));
//     d.setHours(d.getHours() + 8);
//     return d;
//   };

//   // Subtract 8 hours to convert to UTC
//   const toUTC = (date) => {
//     if (!date) return null;
//     const d = new Date(date);
//     d.setHours(d.getHours() - 8);
//     return d;
//   };

//   // Get earliest non-null date
//   const getEarliest = (...dates) => {
//     const valid = dates.filter(Boolean);
//     return valid.length ? new Date(Math.min(...valid)) : null;
//   };

//   // Get latest non-null date
//   const getLatest = (...dates) => {
//     const valid = dates.filter(Boolean);
//     return valid.length ? new Date(Math.max(...valid)) : null;
//   };

//   const normalizeTime = (value) => {
//     if (
//       value === null ||
//       value === undefined ||
//       value === "null" ||
//       value === "NULL" ||
//       String(value).trim() === ""
//     ) {
//       return null;
//     }
//     return value;
//   };

//   const data = [];

//   const result = [];

//   for (const item of data) {
//     try {
//       await db.transact(async (txn) => {
//         const periodKey = item.period.replaceAll("/", "");
//         const periodDate = item.period.replaceAll("/", "-");

//         const newTimeIn = normalizeTime(item.timeIn)
//           ? parseDate(`${periodDate} ${normalizeTime(item.timeIn)}:00.000`)
//           : null;

//         const newTimeOut = normalizeTime(item.timeOut)
//           ? parseDate(`${periodDate} ${normalizeTime(item.timeOut)}:00.000`)
//           : null;

//         const existing = await roomModel.checkTimeData(periodKey, item.code);

//         let finalTimeIn, finalTimeOut;

//         if (existing?.length) {
//           const dbTimeIn = toUTC8(existing[0].timeIn);
//           const dbTimeOut = toUTC8(existing[0].timeOut);

//           const allTimes = [dbTimeIn, dbTimeOut, newTimeIn, newTimeOut];
//           const earliest = getEarliest(...allTimes);
//           const latest = getLatest(...allTimes);

//           if (earliest && latest && earliest.getTime() === latest.getTime()) {
//             finalTimeIn = earliest;
//             finalTimeOut = null;
//           } else {
//             finalTimeIn = earliest;
//             finalTimeOut = latest;
//           }

//           // ✅ SUBTRACT 8 HOURS BEFORE SAVING
//           const update = await roomModel.updateTimeData(
//             {
//               timeIn: toUTC(finalTimeIn),
//               timeOut: toUTC(finalTimeOut),
//               updatedBy: "8958",
//             },
//             {
//               period: periodKey,
//               code: item.code,
//             },
//             txn,
//             "updatedDate",
//           );

//           console.log("✨ Update result:", update);
//         } else {
//           if (!newTimeIn && !newTimeOut) {
//             console.log(
//               `⏭️ Skipping insert - both times are null for code ${item.code}`,
//             );
//             return;
//           }

//           const allTimes = [newTimeIn, newTimeOut];
//           const earliest = getEarliest(...allTimes);
//           const latest = getLatest(...allTimes);

//           // ✅ Check if earliest and latest are equal
//           if (earliest && latest && earliest.getTime() === latest.getTime()) {
//             finalTimeIn = earliest;
//             finalTimeOut = null;
//           } else {
//             finalTimeIn = earliest;
//             finalTimeOut = latest;
//           }

//           const insert = await roomModel.insertTimeData(
//             {
//               period: periodKey,
//               code: item.code,
//               timeIn: toUTC(finalTimeIn),
//               timeOut: toUTC(finalTimeOut),
//               updatedBy: "8958",
//             },
//             txn,
//             "updatedDate",
//           );

//           console.log("✨ Insert result:", insert);
//         }
//       });
//     } catch (error) {
//       console.error("❌ Transaction error:", error);
//     }
//   }
// };

module.exports = {
  addRoom,
  addRoomType,
  addBuilding,
  getRoomTypes,
  getBuildings,
  getDepartments,
  // runTimeData,
};

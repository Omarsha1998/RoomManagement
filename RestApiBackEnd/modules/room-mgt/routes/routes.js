const { Router } = require("express");
const appController = require("../controllers/appController.js");
const schedController = require("../controllers/schedController.js");
const userController = require("../controllers/usercontroller.js");
const { validateAccessToken } = require("../../../helpers/crypto.js");
const { scheduleDailyTask } = require("../utility/helpers.js");

const router = Router();

router.post("/room", validateAccessToken, appController.addRoom);

router.post("/addRoomType", validateAccessToken, appController.addRoomType);

router.post("/addBuilding", validateAccessToken, appController.addBuilding);

router.get("/getRoomTypes", validateAccessToken, appController.getRoomTypes);

router.get("/getBuildings", validateAccessToken, appController.getBuildings);

router.get(
  "/getDepartments",
  validateAccessToken,
  appController.getDepartments,
);

router.post(
  "/createAutoRoomSchedule",
  validateAccessToken,
  schedController.createAutoRoomSchedule,
);

router.get(
  "/getAvailableRoom",
  validateAccessToken,
  schedController.getAvailableRoom,
);

router.get(
  "/subject-code",
  validateAccessToken,
  schedController.getSubjectCode,
);

router.post(
  "/scheduleBooking",
  validateAccessToken,
  schedController.scheduleBooking,
);

router.post(
  "/customScheduleBooking",
  validateAccessToken,
  schedController.customScheduleBooking,
);

router.get("/bookedRooms", validateAccessToken, schedController.bookedRooms);

router.get(
  "/bookedRoomsByEmployeeCode",
  validateAccessToken,
  schedController.bookedRoomsByEmployeeCode,
);

router.get("/getSections", schedController.getSections);

router.get("/getSemester", schedController.getSemester);

router.get(
  "/bookedRoomsView",
  validateAccessToken,
  schedController.bookedRoomsView,
);

// router.post("/checkStatus", schedController.checkStatus);

router.get("/getAllRooms", validateAccessToken, schedController.getAllRooms);

router.get("/getRooms", validateAccessToken, schedController.getRooms);

router.post(
  "/cancelSchedule",
  validateAccessToken,
  schedController.cancelSchedule,
);

// router.post(
//   "/scheduleGenEdSubjectAutomated",
//   schedController.scheduleGenEdSubjectAutomated,
// );

router.post("/login", userController.login);

router.post("/logout", userController.logout);

// scheduleDailyTask(9, 22, schedController.scheduleGenEdSubjectAutomatedEnhanced);
scheduleDailyTask(6, 0, schedController.checkStatus);
// scheduleDailyTask(16, 22, schedController.scheduleBookingManually);

// schedController.checkStatus();

// scheduleDailyTask(11, 1, schedController.scheduleBookingManually);
// scheduleDailyTask(13, 11, schedController.transformData);

router.get("*", (req, res) => {
  res.status(400).send({ error: "API not found" });
});

module.exports = router;

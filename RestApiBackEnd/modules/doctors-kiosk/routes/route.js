const express = require("express");
const router = express.Router();
const doctorsController = require("../controllers/doctorsController.js");
const userController = require("../controllers/usercontroller.js");

const { scheduleDailyTask } = require("../utility/helper.js");
const { validateAccessToken } = require("../../../helpers/crypto.js");

// const clients = [];

// // SSE Route: Establish connection with the frontend
// router.get("/sse", (req, res) => {
//   // Set headers for SSE
//   res.set({
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache",
//     Connection: "keep-alive",
//     "Access-Control-Allow-Origin": "*", // Allow all origins or set specific origin if necessary
//   });

//   // Flush headers to establish the connection
//   res.flushHeaders();

//   // Add this client to the list of clients
//   clients.push(res);

//   // Send a heartbeat every 30 seconds to keep the connection alive
//   const interval = setInterval(() => {
//     res.write(": heartbeat\n\n");
//   }, 15000);

//   // Clean up when the client disconnects
//   req.on("close", () => {
//     clearInterval(interval);
//     const index = clients.indexOf(res);
//     if (index !== -1) {
//       clients.splice(index, 1);
//     }
//   });

//   // Handle errors gracefully
//   req.on("error", (err) => {
//     if (err.code !== "ECONNRESET") {
//       console.error("SSE Connection Error:", err);
//     }
//     // Clean up the client
//     const index = clients.indexOf(res);
//     if (index !== -1) {
//       clients.splice(index, 1); // Remove client from the array on error
//     }
//   });
// });

// const sendSSEMessage = (message) => {
//   clients.forEach((client) => {
//     client.write(`data: ${JSON.stringify({ message })}\n\n`);
//   });
// };

router.post("/insertBase64", doctorsController.insertImageBase64);
router.get("/services", doctorsController.getServices);
router.get("/wellness", doctorsController.getWellness);
router.post("/doctors", doctorsController.getDoctors);
router.get("/getSpecialization", doctorsController.getSpecialization);
router.get("/hmos", doctorsController.getHmos);
router.get("/doctors-department", doctorsController.getDoctorsDepartment);
router.get("/doctors-hmo", doctorsController.getDoctorHmo);
router.get(
  "/checkDoctorAttendance",
  validateAccessToken,
  doctorsController.checkDoctorAttendance,
);
router.get(
  "/getSecretaryDoctors",
  validateAccessToken,
  doctorsController.getSecretaryDoctors,
);
router.get(
  "/getAllSecretaryWithDoctors",
  validateAccessToken,
  doctorsController.getAllSecretaryWithDoctors,
);
// router.get("/doctorSecretaries", doctorsController.doctorSecretaries);

router.get(
  "/doctorSecretaries/:doctorEhrCode",
  doctorsController.doctorSecretaries,
);

// router.post(
//   "/updateDoctorStatus",
//   validateAccessToken,
//   doctorsController.updateDoctorStatus,
// );

router.post(
  "/updateDoctorStatus",
  validateAccessToken,
  doctorsController.updateDoctorStatus,
);

// router.post("/updateDoctorStatus", validateAccessToken, async (req, res) => {
//   await doctorsController.updateDoctorStatus(req, res);
//   sendSSEMessage("doctorStatusUpdated");
// });

router.post(
  "/removeDoctorInSecretary",
  validateAccessToken,
  doctorsController.removeDoctorInSecretary,
);
router.post(
  "/addDoctorAssignment",
  validateAccessToken,
  doctorsController.addDoctorAssignment,
);

router.get("/doctorContacts/:doctorEhrCode", doctorsController.doctorContacts);
router.get("/doctorSchedule/:doctorEhrCode", doctorsController.doctorSchedule);
router.get(
  "/doctorEducation/:doctorEhrCode",
  doctorsController.doctorEducation,
);

router.post(
  "/updateDoctor",
  validateAccessToken,
  doctorsController.updateDoctor,
);

// router.get("/picture/:id", doctorsController.getPicture);
router.get("/picture", doctorsController.getPicture);
router.get("/consultationOption", doctorsController.consultationOption);
router.get("/deptSpecOption", doctorsController.deptSpecOption);

scheduleDailyTask(20, 1, doctorsController.checkDoctorTimeOutDaily);
scheduleDailyTask(20, 5, doctorsController.checkDoctorTimeOutDaily);

// doctorsController.insertDoctorData();

router.post("/login", userController.login);
router.post("/logout", userController.logout);
// router.get("/picture", doctorsController.getPicture);
// scheduleDailyTask(15, 7, doctorsController.doctorScript);
// scheduleDailyTask(14, 11, doctorsController.sendSmsSecretaryDetails);

module.exports = router;

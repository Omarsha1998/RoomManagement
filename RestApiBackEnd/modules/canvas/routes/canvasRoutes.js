const { Router } = require("express");
const canvasController = require("../controllers/canvasController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/user", canvasController.getCanvasUser);
router.get("/profile", canvasController.getCanvasProfile);
router.get("/students/semester", canvasController.getSemester);
router.get("/students/course", canvasController.getCourse);
router.get("/students/emails", canvasController.getStudentEmails);
router.get(
  "/students/student-gmail",
  canvasController.populateStudentsWithoutGmail,
);
router.get("/canvas-students", canvasController.getCanvasUser);
router.get("/google-students", canvasController.getGoogleUser);
router.get(
  "/canvas-validated-students",
  canvasController.getCanvasValidatedStudents,
);
router.get("/batch-canvas-activation", canvasController.batchCanvasActivation);
router.get("/batch-canvas-update", canvasController.batchCanvasUpdateEmail);
router.get("/course-files", canvasController.getAllFileCourses);

// POST REQUESTS
router.post("/", canvasController.insertCanvasUser);
router.post("/google", canvasController.insertGoogleStudent);
router.post("/google-canvas-accounts", canvasController.putGoogleAccountCanvas);

// PUT REQUESTS
router.put("/:code", canvasController.updateCanvasUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

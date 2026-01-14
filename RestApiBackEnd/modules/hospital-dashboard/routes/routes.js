const { Router } = require("express");
const analyticsController = require("../controllers/analyticsController");

// const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/analytics-years", analyticsController.getHospitalYears);
router.get("/analytics", analyticsController.getHospitalAnalytics);
router.get(
  "/analytics-details",
  analyticsController.getHospitalAnalyticsDetails,
);

router.post(
  "/fetch-analytics-report",
  analyticsController.fetchAnalyticsReport,
);
// router.get("/analytics/census", analyticsController.getCensusAnalytics);
// router.get("/analytics/detailed", analyticsController.getDetailedAnalytics);
// router.get("/analytics/helper", analyticsController.getHelperAnalytics);

// router.get("/user",  canvasController.getCanvasUser);
// router.get("/profile",  canvasController.getCanvasProfile);
// router.get("/students/semester",  canvasController.getSemester);
// router.get("/students/course",  canvasController.getCourse);
// router.get("/students/emails",  canvasController.getStudentEmails);
// router.get("/students/student-gmail", canvasController.populateStudentsWithoutGmail);
// router.get("/canvas-students", canvasController.getCanvasUser);
// router.get("/google-students", canvasController.getGoogleUser);
// router.get("/canvas-validated-students", canvasController.getCanvasValidatedStudents);
// router.get("/batch-canvas-activation", canvasController.batchCanvasActivation);
// router.get("/batch-canvas-update", canvasController.batchCanvasUpdateEmail);

// POST REQUESTS

// PUT REQUESTS

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

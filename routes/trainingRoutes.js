const { Router } = require("express");
const trainingController = require("../controllers/trainingController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", validateAccessToken, trainingController.getAllTrainings);
router.get(
  "/config-modules",
  validateAccessToken,
  trainingController.getTrainingConfigModules,
);
router.get(
  "/config",
  validateAccessToken,
  trainingController.getTrainingConfigs,
);
router.get(
  "/modules",
  validateAccessToken,
  trainingController.getTrainingModules,
);
router.get("/users", validateAccessToken, trainingController.getTrainingUsers);
router.get(
  "/user-quizzes",
  validateAccessToken,
  trainingController.getTrainingUserQuizzes,
);
router.get(
  "/user-surveys",
  validateAccessToken,
  trainingController.getTrainingUserSurveys,
);
router.get(
  "/module-questions",
  validateAccessToken,
  trainingController.getTrainingModuleQuestions,
);
router.get(
  "/admin/training-employees",
  trainingController.getTrainingEmployees,
);

// POST REQUESTS
router.post("/users", validateAccessToken, trainingController.postTrainingUser);
router.post(
  "/user-quizzes",
  validateAccessToken,
  trainingController.postTrainingUserQuizzes,
);
router.post(
  "/user-surveys",
  validateAccessToken,
  trainingController.postTrainingUserSurvey,
);

// PUT REQUESTS
router.put(
  "/users/:code",
  validateAccessToken,
  trainingController.putTrainingUser,
);
router.put(
  "/overall/:code/:trainingCode",
  validateAccessToken,
  trainingController.putOverallTraining,
);
// router.put("/applicant-vaccination/:code", validateAccessToken, admissionController.updateApplicantVaccination);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

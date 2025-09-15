const { Router } = require("express");
const appController = require("../controllers/appController");
const encounterController = require("../controllers/encounterController");
const patientController = require("../controllers/patientController");

const router = Router();

// GET REQUESTS
router.get("/app/client-ip", appController.getClientIP);
router.get("/app/departments", appController.getDepartments);
router.get("/app/wards", appController.getWards);
router.get("/encounter/active", encounterController.getActive);
router.get("/patient/diagnostics/:patientNo", patientController.getDiagnostics);
router.get(
  "/patient/inpatient-monitoring",
  patientController.getInpatientMonitoring,
);

// POST REQUESTS
// router.post("/", purchaseRequestController.savePurchaseRequests);

// PUT REQUESTS
// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

const { Router } = require("express");
const patientCasesController = require("../controllers/patientCasesController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", patientCasesController.getPatientCases);
router.get("/chargeslip", patientCasesController.getPatientCharges);

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

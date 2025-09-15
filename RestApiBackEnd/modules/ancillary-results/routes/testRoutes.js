const { Router } = require("express");
const testController = require("../controllers/testController");
const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", testController.getTests);
router.get("/test-details", testController.getTestDetails);

// POST REQUESTS

// // PUT REQUESTS
// router.put("/:code", validateAccessToken, chargeController.updatePatientCharge);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

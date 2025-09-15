const { Router } = require("express");
const testOrderController = require("../controllers/testOrderController");
const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", validateAccessToken, testOrderController.getTestOrders);

// POST REQUESTS

// // PUT REQUESTS
// router.put("/:code", validateAccessToken, chargeController.updatePatientCharge);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

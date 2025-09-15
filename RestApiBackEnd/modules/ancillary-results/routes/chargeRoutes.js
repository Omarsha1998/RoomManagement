const { Router } = require("express");
const chargeController = require("../controllers/chargeController");
const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", chargeController.getCharges);

// POST REQUESTS
router.post(
  "/transfer-patient-charge",
  validateAccessToken,
  chargeController.transferPatientCharge,
);

// // PUT REQUESTS
router.put("/:code", validateAccessToken, chargeController.updatePatientCharge);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

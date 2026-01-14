const { Router } = require("express");
const nursingStationController = require("../controllers/nursingStationController");
const recordsController = require("../controllers/recordsController");
const academeController = require("../controllers/academeController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get(
  "/nst-attendance/nst-census",
  nursingStationController.getNSTCensusWithWard,
);
router.get(
  "/nst-attendance/available-rooms-nurses",
  nursingStationController.getAvailableRoomsAndDutyNurses,
);
router.get("/records/boxes", recordsController.getRecordBoxes);
router.get("/academe/high-school", academeController.getHighSchools);

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

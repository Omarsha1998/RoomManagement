const { Router } = require("express");
const hospitalController = require("../controllers/hospitalController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/charges/lab", hospitalController.getChargesLab);
router.get("/xr", hospitalController.getXray);
router.get("/lab-charges", hospitalController.getLabCharges);
router.get("/laboratory-depts", hospitalController.getLaboratoryDepts);
router.get(
  "/rmanalyticsMY/:month/:year",
  hospitalController.getMyRoomAnalytics,
);
router.get("/rmanalytics", hospitalController.getRoomAnalytics);
router.get("/rmmonthyear", hospitalController.getRoomMonthYear);

// POST REQUESTS
router.post("/xr", hospitalController.saveXray);
router.post("/lab-charges", hospitalController.saveLabCharges);
// PUT REQUESTS
// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

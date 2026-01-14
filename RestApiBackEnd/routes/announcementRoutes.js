const { Router } = require("express");
const announcementController = require("../controllers/announcementController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/", announcementController.getAnnouncements);
router.get("/get-acknowledgement", announcementController.getAcknowledgement);

// POST REQUESTS
router.post(
  "/acknowledge-announcement",
  announcementController.acknowledgeAnnouncement,
);

// PUT REQUESTS
// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

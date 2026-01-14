const { Router } = require("express");
const otpController = require("../controllers/otpController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/get-otp", otpController.getOTP);

// POST REQUESTS
router.post("/verify-otp", otpController.verifyOTP);
// PUT REQUESTS
// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

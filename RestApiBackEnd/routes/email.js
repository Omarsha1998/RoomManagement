const { Router } = require("express");
const emailController = require("../controllers/emailController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/residents", emailController.sendResidents);

router.post("/app-registration", emailController.sendAppRegistration);
router.post("/forget-password", emailController.sendForgotPassword);
router.post("/send-dynamic-email", emailController.sendDynamicEmail);
router.post("/send-dynamic-sms", emailController.sendDynamicSMS);

module.exports = router;

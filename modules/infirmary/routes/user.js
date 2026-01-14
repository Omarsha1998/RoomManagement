const router = require("express").Router();

const {
  validateAccessToken,
  validatePwResetToken,
  checkWhiteList,
} = require("../../../helpers/controller.js");

const userController = require("../controllers/user.js");

router.get("/", validateAccessToken, checkWhiteList, userController.get);

router.get("/renew-access-token", userController.renewAccessToken);

router.post("/", validateAccessToken, checkWhiteList, userController.add);

router.post("/login", userController.authenticate);

router.post(
  "/logout",
  validateAccessToken,
  checkWhiteList,
  userController.deauthenticate,
);

router.post("/send-pw-reset-link", userController.sendPasswordResetLink);

router.put(
  "/change-pw",
  validateAccessToken,
  checkWhiteList,
  userController.changePasswordViaOldPassword,
);

router.put(
  "/change-pw-via-token",
  validatePwResetToken,
  userController.changePasswordViaToken,
);

module.exports = router;

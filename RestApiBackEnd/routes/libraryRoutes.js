const { Router } = require("express");
const libraryController = require("../controllers/libraryController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/current-login", libraryController.getCurrentLogin);
router.get("/detailed-report", libraryController.getLibraryDetailedReport);
router.get("/patron-login-report", libraryController.getPatronLoginReport);

// POST REQUESTS
router.post("/login", libraryController.login);

// PUT REQUESTS
// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

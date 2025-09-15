const { Router } = require("express");
const resultController = require("../controllers/resultController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/signatories", resultController.getSignatories);
router.get("/search", resultController.searchResult);

// POST REQUESTS

// PUT REQUESTS
// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

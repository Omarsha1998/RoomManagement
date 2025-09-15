const { Router } = require("express");
const clinicalAbstractController = require("../controllers/clinicalAbstractController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/search", clinicalAbstractController.search);
router.get("/result", clinicalAbstractController.getResult);

// POST REQUESTS
router.post("/result", clinicalAbstractController.saveResult);

// PUT REQUESTS
// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

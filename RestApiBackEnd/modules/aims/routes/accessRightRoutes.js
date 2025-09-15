const { Router } = require("express");
const studentsController = require("../controllers/studentsController");

// const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/students", studentsController.getStudents);

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

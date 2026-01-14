const { Router } = require("express");
const departmentController = require("../controllers/departmentController");
const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", validateAccessToken, departmentController.getDepartments);

// POST REQUESTS
router.post(
  "/",
  validateAccessToken,
  departmentController.insertDepartmentInfo,
);

// PUT REQUESTS
router.put(
  "/:code",
  validateAccessToken,
  departmentController.updateDepartmentInfo,
);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

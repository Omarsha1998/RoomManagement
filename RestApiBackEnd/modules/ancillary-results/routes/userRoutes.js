const { Router } = require("express");
const userController = require("../controllers/userController");
const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", userController.getUsers);
router.get("/roles", userController.getRoles);
router.get("/employees", userController.searchEmployees);

// POST REQUESTS
router.post("/authenticate", userController.authenticate);
router.post(
  "/inauthenticate",
  validateAccessToken,
  userController.inauthenticate,
);
router.post("/", validateAccessToken, userController.insertUser);
router.post("/roles/add", validateAccessToken, userController.insertRole);

// PUT REQUESTS
router.put("/:code", validateAccessToken, userController.updateUser);
router.put(
  "/roles/update/:code",
  validateAccessToken,
  userController.updateRole,
);
router.put(
  "/reset-password/:code",
  validateAccessToken,
  userController.resetPassword,
);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

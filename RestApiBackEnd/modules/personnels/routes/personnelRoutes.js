const { Router } = require("express");
const personnelController = require("../controllers/personnelController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", validateAccessToken, personnelController.getPersonnels);
router.get(
  "/departments",
  validateAccessToken,
  personnelController.getDepartments,
);

router.get("/sections", validateAccessToken, personnelController.getSections);

router.get("/app-users", validateAccessToken, personnelController.getAppUsers);
router.get("/picture/:id", personnelController.getFilePicture);

// POST REQUESTS
router.post("/authenticate", personnelController.authenticate);
router.post(
  "/inauthenticate",
  validateAccessToken,
  personnelController.inauthenticate,
);

router.post(
  "/inauthenticate-without-token",
  personnelController.inauthenticate,
);

// PUT REQUESTS
// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

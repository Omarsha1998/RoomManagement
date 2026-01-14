const { Router } = require("express");
const collectionsController = require("../controllers/collectionsController");
const processorsController = require("../controllers/processorsController");
const applicationsController = require("../controllers/applicationsController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get(
  "/processors",
  validateAccessToken,
  processorsController.getProcessors,
);

router.get("/billers", validateAccessToken, processorsController.getBillers);

router.get(
  "/applications",
  validateAccessToken,
  applicationsController.getApplications,
);
router.get(
  "/collections/settled",
  validateAccessToken,
  collectionsController.getCollectionsSettled,
);
router.get(
  "/collections/id",
  validateAccessToken,
  collectionsController.getCollectionsById,
);
router.get(
  "/collections/ref-no",
  validateAccessToken,
  collectionsController.getCollectionsByRefNo,
);
router.get(
  "/collections",
  validateAccessToken,
  collectionsController.getCollections,
);
router.get(
  "/app-collections",
  validateAccessToken,
  collectionsController.getApplicationCollections,
);

// POST REQUESTS
router.post("/void", collectionsController.voidTransaction);
// PUT REQUESTS
// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

const { Router } = require("express");
const configsController = require("../controllers/configsController");
const encountersController = require("../controllers/encountersController");
const studentsController = require("../controllers/studentsController");

// const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/patients", encountersController.getInfirmaryPatients);
router.get("/students", studentsController.getStudents);
router.get("/encounters", encountersController.getEncounters);
router.get("/notes", encountersController.getNotes);
router.get("/lab-pdf-list", encountersController.getLabPdfList);
router.get("/lab-pdf-file", encountersController.getLabPdfFileV1);

router.post("/lab-pdf-file", encountersController.getLabPdfFileV1);

// router.get("/test", encountersController.test);

// POST REQUESTS
router.post("/encounters", encountersController.postEncounter);
router.post("/notes", encountersController.postNotes);
// PUT REQUESTS
// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

router.get("/config/field-groups", configsController.getFieldGroups);
router.get("/config/fields", configsController.getFields);
router.put("/notes/:noteCode", encountersController.putNotes);
// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

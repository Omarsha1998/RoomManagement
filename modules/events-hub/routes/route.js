const { Router } = require("express");
const eventsController = require("../controllers/eventsController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/employees", eventsController.getEmployees);
router.get("/people", eventsController.getEventsPeople);
// router.get("/realtime-people", eventsController.getEventsPeopleRealtime);
router.get("/upload-employees", eventsController.uploadEmployees);

// POST REQUESTS
router.post("/register", validateAccessToken, eventsController.postEventPeople);

// PUT REQUESTS
// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

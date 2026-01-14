const router = require("express").Router();

router.use("/misc", require("./misc.js"));
router.use("/patient", require("./patient.js"));
router.use("/visit", require("./visit.js"));
router.use("/printout", require("./printout.js"));
router.use("/analytics", require("./analytics.js"));

module.exports = router;

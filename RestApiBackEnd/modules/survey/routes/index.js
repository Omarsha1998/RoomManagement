const router = require("express").Router();

router.use("/fam-day-movie-screening", require("./fam-day-movie-screening.js"));

module.exports = router;

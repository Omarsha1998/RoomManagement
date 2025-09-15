const router = require("express").Router();

// const {
//   validateAccessToken,
//   checkWhiteList,
// } = require("../../../helpers/controller.js");

const controller = require("../controllers/fam-day-movie-screening.js");

router.get("/employees", controller.getEmployees);
router.get("/remaining-seat-count", controller.getRemainingSeatCount);
router.post("", controller.add);

module.exports = router;

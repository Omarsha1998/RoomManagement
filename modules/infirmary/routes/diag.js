const router = require("express").Router();

const {
  validateAccessToken,
  checkWhiteList,
} = require("../../../helpers/controller.js");

const patientController = require("../controllers/diag/patient.js");

router.get(
  "/patient",
  validateAccessToken,
  checkWhiteList,
  patientController.get,
);

module.exports = router;

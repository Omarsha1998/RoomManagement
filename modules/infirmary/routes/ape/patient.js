const router = require("express").Router();

const {
  validateAccessToken,
  checkWhiteList,
} = require("../../../../helpers/controller.js");

const patientController = require("../../controllers/ape/patient.js");

router.get("/", validateAccessToken, checkWhiteList, patientController.get);

router.post("/", validateAccessToken, checkWhiteList, patientController.add);

module.exports = router;

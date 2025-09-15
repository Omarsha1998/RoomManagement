const router = require("express").Router();

const {
  validateAccessToken,
  checkWhiteList,
} = require("../../../../helpers/controller.js");

const analyticsController = require("../../controllers/ape/analytics.js");

router.get(
  "/registered-patient-count",
  validateAccessToken,
  checkWhiteList,
  analyticsController.getRegisteredPatientCount,
);

router.get(
  "/seen-patient-count",
  validateAccessToken,
  checkWhiteList,
  analyticsController.getSeenPatientCount,
);

router.get(
  "/patient-visit-progress",
  validateAccessToken,
  checkWhiteList,
  analyticsController.getPatientVisitProgress,
);

router.get(
  "/doctor-patient-count",
  validateAccessToken,
  checkWhiteList,
  analyticsController.getDoctorPatientCount,
);

router.get(
  "/doctor-xrays-read-count",
  validateAccessToken,
  checkWhiteList,
  analyticsController.getDoctorXraysReadCount,
);

router.get(
  "/not-seen-patients",
  validateAccessToken,
  checkWhiteList,
  analyticsController.getNotSeenPatients,
);

module.exports = router;

const { Router } = require("express");
// const jobOrderController = require("../controllers/jobOrderController");
const orPatientRecordsController = require("../controllers/orPatientRecordsController");

// const accessRightsController = require("../controllers/accessRightsController");

const accessRightsController = require("../../access-rights/controllers/accessRightsController"); // boiler temp access right
// const accessRightsController = require("../controllers/accessRightsController"); //own access right
// const emailController = require("../controllers/emailAsController");

const { validateAccessToken } = require("../../../helpers/crypto");
// const { tryCatch } = require("../../../helpers/util");

const router = Router();
// router.get("/qr-test", emailController.generateTestQr);
// ********************* GET ***************************

router.get(
  "/started-or",
  validateAccessToken,
  orPatientRecordsController.getFirstOREntry,
);
router.get(
  "/get-optech-procedures",
  validateAccessToken,
  orPatientRecordsController.getProcedures,
);
router.get(
  "/encounter-exists",
  validateAccessToken,
  orPatientRecordsController.getEncounterdetails,
);

router.get(
  "/all-surgeons",
  validateAccessToken,
  orPatientRecordsController.getAllSurgs,
);

router.post(
  "/print-attempt",
  validateAccessToken,
  orPatientRecordsController.insertPrintAttempt,
);

router.get(
  "/print-logs",
  validateAccessToken,
  orPatientRecordsController.getPrintLogs,
);
router.get(
  "/patient-record",
  validateAccessToken,
  orPatientRecordsController.getPatientDetails,
);
try {
  router.get(
    "/patient-record-testing",
    validateAccessToken,
    orPatientRecordsController.getTestPdets,
  );
} catch (error) {
  console.log("HERES ERROR", error);
}

router.get(
  "/patient-record-with-operatives",
  validateAccessToken,
  orPatientRecordsController.getWithOperativeOnly,
);

router.get(
  "/ue-doctors-list",
  validateAccessToken,
  orPatientRecordsController.getSurgeons,
);
router.get(
  "/selected-surgeons",
  validateAccessToken,
  orPatientRecordsController.getSurgeonsSelection,
);

router.get(
  "/ue-anesthe-list",
  validateAccessToken,
  orPatientRecordsController.getAnesthesiology,
);

router.get(
  "/sponges-list",
  validateAccessToken,
  orPatientRecordsController.getSponges,
);

router.get(
  "/orbit-signatories",
  validateAccessToken,
  orPatientRecordsController.getOrbitSignatories,
);

router.get(
  "/ue-anes",
  validateAccessToken,
  orPatientRecordsController.getUeAnes,
);
router.get(
  "/ue-visiting-anes",
  validateAccessToken,
  orPatientRecordsController.getVisitingAnes,
);

router.get(
  "/orbit-ue-assist-surgeons",
  validateAccessToken,
  orPatientRecordsController.getOrbitUeAssistantSurgeon,
);
router.get(
  "/orbit-ue-heads-surgeons",
  validateAccessToken,
  orPatientRecordsController.getOrbitUeHeadsSurgeon,
);

router.get(
  "/orbit-visiting-surg",
  validateAccessToken,
  orPatientRecordsController.getOrbitVisitingSurgeons,
);
router.get(
  "/orbit-residents",
  validateAccessToken,
  orPatientRecordsController.getOrbitResidents,
);
router.get(
  "/orbit-attending-nurse",
  validateAccessToken,
  orPatientRecordsController.getAttendingNurse,
);
router.get(
  "/orbit-circulating-nurse",
  validateAccessToken,
  orPatientRecordsController.getCirculatingNurse,
);
router.get(
  "/residents-orbt-lists",
  validateAccessToken,
  orPatientRecordsController.getResidents,
);
router.get(
  "/cnurses-orbt-lists",
  validateAccessToken,
  orPatientRecordsController.getNurses,
);

router.put(
  "/update-patient-details",
  validateAccessToken,
  orPatientRecordsController.modifyPatientDetails,
);
router.put(
  "/update-op-tech-f",
  validateAccessToken,
  orPatientRecordsController.putOpTechForms,
);
router.put(
  "/update-op-rescs-f",
  validateAccessToken,
  orPatientRecordsController.putOpRecForms,
);

// updateSponges

// router.post("/send-test-sms", emailController.sendTestSms);

// ********************* POST ***************************

router.get("/", validateAccessToken, accessRightsController.getAccessRights);

module.exports = router;

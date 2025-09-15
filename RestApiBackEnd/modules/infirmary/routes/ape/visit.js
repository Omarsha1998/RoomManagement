const router = require("express").Router();

const {
  validateAccessToken,
  checkWhiteList,
} = require("../../../../helpers/controller.js");

const visitController = require("../../controllers/ape/visit.js");

router.get("/", validateAccessToken, checkWhiteList, visitController.get);

router.get(
  "/exams/:visitId",
  validateAccessToken,
  checkWhiteList,
  visitController.getVisitExams,
);

router.get(
  "/exam-details",
  validateAccessToken,
  checkWhiteList,
  visitController.getExamDetails,
);

router.get(
  "/orders",
  validateAccessToken,
  checkWhiteList,
  visitController.getVisitOrders,
);

// IMPORTANT: ALWAYS PUT THIS ROUTE TO LAST OF `GET` ROUTES TO NOT CONFLICT WITH OTHER `GET` ROUTES
router.get("/:id", validateAccessToken, checkWhiteList, visitController.getOne);

router.get("/track/:identificationCode", visitController.track);

router.post(
  "/accept-exam",
  validateAccessToken,
  checkWhiteList,
  visitController.acceptExam,
);

router.post(
  "/complete-exam",
  validateAccessToken,
  checkWhiteList,
  visitController.completeExam,
);

router.post(
  "/schedule/:patientCode",
  validateAccessToken,
  checkWhiteList,
  visitController.schedule,
);

router.put("/", validateAccessToken, checkWhiteList, visitController.update);

router.put(
  "/exam-details",
  validateAccessToken,
  checkWhiteList,
  visitController.saveExamDetails,
);

router.put(
  "/acknowledge-order/:code",
  validateAccessToken,
  checkWhiteList,
  visitController.acknowledgeVisitOrder,
);

router.post(
  "/exam-details-raw",
  validateAccessToken,
  checkWhiteList,
  visitController.saveExamDetailsRaw,
);

module.exports = router;

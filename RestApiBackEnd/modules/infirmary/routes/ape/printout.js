const router = require("express").Router();

const {
  validateAccessToken,
  checkWhiteList,
} = require("../../../../helpers/controller.js");

const printoutController = require("../../controllers/ape/printout.js");

router.get("/visit-pdf", printoutController.getVisitPdf);
router.get("/visits-pdf", printoutController.getVisitsPdf);

router.get(
  "/visit-pdf-json/:visitId",
  validateAccessToken,
  checkWhiteList,
  printoutController.getVisitPdfJson,
);

router.post("/visit-pdf-token", printoutController.getVisitPdfToken);

module.exports = router;

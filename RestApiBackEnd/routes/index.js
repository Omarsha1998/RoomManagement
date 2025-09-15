const path = require("path");
const express = require("express");
const router = express.Router();

// STATIC ASSETS
router.use(
  "/",
  express.static(path.join(__dirname, "..", "modules/employee-central/images")),
);

router.use(
  "/",
  express.static(
    path.join(__dirname, "..", "modules/employee-central/uploaded"),
  ),
);

router.use("/public", express.static(path.join(__dirname, "..", "public")));
router.use("/images", express.static(path.join(__dirname, "..", "images")));

router.get("/", (req, res) => {
  res.json("Welcome to UERM REST API (local)");
});

// Modular Routes //
router.use("/announcements", require("./announcementRoutes.js"));
router.use("/library", require("./libraryRoutes.js"));
router.use("/admission", require("./admissionRoutes.js"));
router.use("/training", require("./trainingRoutes.js"));
router.use("/hospital", require("./hospitalRoutes.js"));
router.use("/payments", require("./paymentRoutes.js"));
router.use("/result", require("./resultRoutes.js"));
router.use("/templates", require("./templateRoutes.js"));
router.use("/clinical-abstract", require("./clinicalAbstractRoutes.js"));
router.use("/pdf", require("./pdfRoutes.js"));
router.use(
  "/purchase-request",
  require("../modules/purchase-request/routes/purchaseRequestRoutes.js"),
);
router.use(
  "/access-right",
  require("../modules/access-rights/routes/accessRightRoutes.js"),
);
router.use(
  "/personnels",
  require("../modules/personnels/routes/personnelRoutes.js"),
);
router.use(
  "/analytics",
  require("../modules/analytics/routes/analyticsRoutes.js"),
);
router.use(
  "/ehr-station-view",
  require("../modules/ehr-station-view/routes/ehrStationViewRoutes.js"),
);
router.use("/canvas", require("../modules/canvas/routes/canvasRoutes.js"));
router.use("/students", require("../modules/student-portal/routes/route.js"));
// router.use("/student-documents", require("../modules/student-documents/routes/route.js"))
router.use("/asvento", require("../modules/asvento/routes/route.js"));
router.use("/job-order", require("../modules/job-order/routes/route.js"));
router.use("/orbit", require("../modules/orbit/routes/route.js"));
router.use(
  "/employee-central",
  require("../modules/employee-central/routes/route.js"),
);
router.use(
  "/doctors-kiosk",
  require("../modules/doctors-kiosk/routes/route.js"),
);

router.use("/survey", require("../modules/survey/routes/index.js"));

router.use(
  "/hospital-dashboard",
  require("../modules/hospital-dashboard/routes/routes.js"),
);
router.use("/dragonpay", require("../modules/dragonpay/routes/route.js"));
router.use(
  "/uerm-infirmary",
  require("../modules/uerm-infirmary/routes/route.js"),
);
router.use("/events-hub", require("../modules/events-hub/routes/route.js"));
router.use("/ediagnostics", require("../modules/ediagnostics/routes/route.js"));
router.use(
  "/patient-cases",
  require("../modules/patient-cases/routes/patientCasesRoutes.js"),
);

// Modular Routes //

// Room Management //
router.use("/room-mgt", require("../modules/room-mgt/routes/routes.js"));

// Ancillary Results Project //
router.use(
  "/ancillary/users",
  require("../modules/ancillary-results/routes/userRoutes.js"),
);
router.use(
  "/ancillary/departments",
  require("../modules/ancillary-results/routes/departmentRoutes.js"),
);
router.use(
  "/ancillary/charges",
  require("../modules/ancillary-results/routes/chargeRoutes.js"),
);
router.use(
  "/ancillary/test-orders",
  require("../modules/ancillary-results/routes/testOrderRoutes.js"),
);
router.use(
  "/ancillary/process-flows",
  require("../modules/ancillary-results/routes/processFlowRoutes.js"),
);
router.use(
  "/ancillary/tests",
  require("../modules/ancillary-results/routes/testRoutes.js"),
);
router.use(
  "/ancillary/test-templates",
  require("../modules/ancillary-results/routes/testTemplateRoutes.js"),
);
// Ancillary Results Project //

router.use("/users", require("./users.js"));
router.use("/employees", require("./employees.js"));
router.use("/patients", require("./patients.js"));
router.use("/doctors", require("./doctors.js"));
router.use("/auth", require("./auth.js"));
router.use("/etriage", require("./e-triage.js"));
router.use("/email", require("./email.js"));
router.use("/radiology", require("./radiology.js"));
router.use("/it", require("./it.js"));
router.use("/e-patients", require("./e-patients.js"));
router.use("/upload", require("./upload.js"));
router.use("/monitoring", require("./monitoring.js"));
router.use("/students", require("./students.js"));
router.use("/sms", require("./sms.js"));
router.use("/covid-vaccination", require("./covid-vaccination.js"));
router.use("/emp-kiosk", require("./emp-kiosk.js"));
router.use("/qnap", require("./qnap.js"));
router.use("/doh", require("./dohStatistics.js"));
router.use("/biomed", require("./biomed.js"));
router.use("/scholarship", require("./scholarship.js"));
router.use("/view-img", require("./view-img.js"));
router.use("/philhealth", require("./philhealth.js"));
router.use("/hr", require("./hr.js"));
router.use("/infirmary", require("../modules/infirmary/routes/index.js"));
router.use("/geography", require("./geographyRoutes.js"));
router.use("/entity", require("./entityRoutes.js"));

module.exports = router;

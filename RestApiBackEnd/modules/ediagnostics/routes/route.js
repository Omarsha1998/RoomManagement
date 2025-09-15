/* eslint-disable no-unused-vars */
const { Router } = require("express");
const express = require("express");
const testOrdersController = require("../controllers/testOrdersController");
const usersController = require("../controllers/usersController");
const departmentsController = require("../controllers/departmentsController");
const testsController = require("../controllers/testsController");
const testWorkflowsController = require("../controllers/testWorkflowsController");
const patientResultsController = require("../controllers/patientResultsController");
const pdfController = require("../controllers/pdfController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/user-access", usersController.getUserAccess);
router.get("/departments", departmentsController.getDepartments);
router.get("/doctors", validateAccessToken, departmentsController.getDoctors);

router.get("/charges", testOrdersController.getTestOrders);
router.get("/test-order-workflows", testOrdersController.getTestOrderWorkFlows);
router.get("/test-components", testsController.getTestsAndComponents);
router.get("/test-flaggings", testsController.getTestFlaggings);
router.get(
  "/test-workflows",
  validateAccessToken,
  testWorkflowsController.getTestWorkFlows,
);
router.get("/patient-result", patientResultsController.getPatientResult);
router.get(
  "/patient-result-file",
  patientResultsController.getPatientResultValueFile,
);

// POST REQUESTS
router.post("/charges", testOrdersController.postTestOrders);
router.post("/patient-result", patientResultsController.postPatientResult);
router.post(
  "/patient-result-file",
  patientResultsController.postPatientResultFile,
);
router.post(
  "/test-pdf",
  // express.text({ type: "text/html" }),
  pdfController.generatePDF,
);

router.post("/patient-result-printout", pdfController.generateDynamicPDF);

// PUT REQUESTS
// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

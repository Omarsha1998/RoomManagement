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
router.get("/user-access", validateAccessToken, usersController.getUserAccess);

router.get(
  "/departments",
  validateAccessToken,
  departmentsController.getDepartments,
);
router.get("/doctors", validateAccessToken, departmentsController.getDoctors);

router.get("/charges", validateAccessToken, testOrdersController.getTestOrders);

router.get(
  "/test-order-workflows",
  validateAccessToken,
  testOrdersController.getTestOrderWorkFlows,
);

router.get(
  "/test-components",
  validateAccessToken,
  testsController.getTestsAndComponents,
);

router.get(
  "/test-flaggings",
  validateAccessToken,
  testsController.getTestFlaggings,
);

router.get(
  "/test-workflows",
  validateAccessToken,
  testWorkflowsController.getTestWorkFlows,
);

router.get(
  "/patient-result",
  validateAccessToken,
  patientResultsController.getPatientResult,
);

router.get(
  "/patient-result-file",
  validateAccessToken,
  patientResultsController.getPatientResultValueFile,
);

// POST REQUESTS
router.post(
  "/charges",
  validateAccessToken,
  testOrdersController.postTestOrders,
);

router.post(
  "/patient-result",
  validateAccessToken,
  patientResultsController.postPatientResult,
);

router.post(
  "/patient-result-file",
  validateAccessToken,
  patientResultsController.postPatientResultFile,
);

router.post(
  "/test-pdf",
  // express.text({ type: "text/html" }),
  // validateAccessToken,
  pdfController.generatePDF,
);

router.post(
  "/patient-result-printout",
  validateAccessToken,
  pdfController.generateDynamicPDF,
);

router.post(
  "/send-notification",
  validateAccessToken,
  patientResultsController.sendNotification,
);

// PUT REQUESTS
// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

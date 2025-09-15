const { Router } = require("express");

const admissionController = require("../controllers/admissions/admissionController");
const interviewerController = require("../controllers/admissions/interviewerController");
const dashboardController = require("../controllers/admissions/dashboardController");
const scholarshipController = require("../controllers/admissions/scholarshipController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// ADMIN //
// router.get("/test", admissionController.testGCAL);
router.get("/admin/applications", admissionController.getApplications);
router.get("/admin/semesters", admissionController.getSemesters);
router.get("/admin/applicant/:data", admissionController.getApplicantInfo);
router.get(
  "/admin/applicant-child-info/:data",
  admissionController.getApplicantChildInfo,
);
router.get(
  "/admin/college-declarations",
  admissionController.getCollegeDeclarations,
);
router.get(
  "/admin/student-applications",
  admissionController.getStudentApplications,
);
router.get(
  "/admin/sse/student-applications",
  admissionController.getRealtimeStudentApplications,
);
router.get(
  "/admin/student-applications-with-docs",
  admissionController.getStudentApplicationsWithDocs,
);
router.get("/admin/requirements", admissionController.getRequirements);
router.get(
  "/admin/student-requirements",
  admissionController.getStudentRequirements,
);
router.get("/admin/student-documents", admissionController.getStudentDocuments);
router.get(
  "/admin/schedule-of-classes",
  admissionController.getScheduleOfClasses,
);
router.get(
  "/admin/student-note-templates",
  admissionController.getStudentNoteTemplates,
);
router.get("/admin/student-notes", admissionController.getStudentNotes);
router.get("/admin/school-grades", admissionController.getSchoolGrades);
router.get(
  "/admin/scholastic-records",
  admissionController.getScholasticRecords,
);

router.get(
  "/dashboard/student-applications-with-proof-of-payment",
  dashboardController.getStudentApplicationsWithProofOfPayment,
);

// Scholarship //
router.get("/scholarship/applications", scholarshipController.getApplications);
router.get(
  "/scholarship/applications-raw",
  scholarshipController.getScholarshipApplications,
);

router.get(
  "/scholarship/scholarship-flow-approvals",
  scholarshipController.getScholarshipFlowApprovals,
);

router.get(
  "/scholarship/requirements",
  validateAccessToken,
  scholarshipController.getRequirements,
);

router.get(
  "/scholarship/application-details",
  validateAccessToken,
  scholarshipController.getApplicationDetails,
);

router.get(
  "/scholarship/scholarships-received",
  validateAccessToken,
  scholarshipController.getScholarshipReceived,
);
// Scholarship //

router.post(
  "/admin/student-requirements",
  validateAccessToken,
  admissionController.saveStudentRequirements,
);
router.post(
  "/admin/email-student-document",
  admissionController.emailStudentDocument,
);
router.post("/admin/student-notes", admissionController.postStudentNotes);
router.post("/admin/student-document", admissionController.postStudentDocument);
router.post("/admin/receive-admission", admissionController.receiveAdmission);
router.post(
  "/admin/scholastic-record",
  admissionController.postScholasticRecord,
);

router.post(
  "/admin/notify-student-document",
  validateAccessToken,
  admissionController.notifyStudentDocument,
);

router.put(
  "/admin/scholastic-record",
  validateAccessToken,
  admissionController.putScholasticRecord,
);
// ADMIN //

// GET REQUESTS
router.get(
  "/applications",
  validateAccessToken,
  admissionController.getApplications,
);
router.get("/applicant/file", validateAccessToken, admissionController.getFile);
router.get(
  "/applicant/personal-info-documents",
  validateAccessToken,
  admissionController.getPersonalInfoDocuments,
);

router.get("/applicant-media/", admissionController.getApplicantInfoMedia);
router.get(
  "/applicant/:data",
  validateAccessToken,
  admissionController.getApplicantInfo,
);
router.get(
  "/applicant-child-info/:data",
  validateAccessToken,
  admissionController.getApplicantChildInfo,
);
router.get("/config", admissionController.getConfig);
router.get("/colleges", admissionController.getColleges);
router.get("/schedule", admissionController.getSchedule);
router.get("/interview-schedule", admissionController.getInterviewSchedule);
router.get("/interview-list", admissionController.getInterviewList);
router.get("/walk-in", admissionController.getWalkIn);
router.get(
  "/college-declarations",
  validateAccessToken,
  admissionController.getCollegeDeclarations,
);
router.get(
  "/universities-colleges",
  validateAccessToken,
  admissionController.getUniversitiesAndColleges,
);
router.get(
  "/college-degrees",
  validateAccessToken,
  admissionController.getCollegeDegrees,
);
router.get(
  "/college-courses",
  validateAccessToken,
  admissionController.getCollegeCourses,
);
router.get(
  "/colleges/semester",
  validateAccessToken,
  admissionController.getCollegeSemester,
);
router.get(
  "/applicants/retrieve-reference",
  admissionController.retrieveApplicantReferenceNumber,
);
router.get(
  "/applicants/submission-schedule",
  admissionController.getSubmissionSchedule,
);

router.get(
  "/interviewer/applicant-appointments",
  interviewerController.getApplicantAppointments,
);

router.get(
  "/interviewer/floating-appointments",
  interviewerController.getFloatingAppointments,
);

router.get(
  "/interviewers/",
  validateAccessToken,
  interviewerController.getInterviewers,
);

router.get(
  "/analytics/dashboard",
  validateAccessToken,
  dashboardController.getAnalyticsAdmissions,
);

router.get("/analytics", validateAccessToken, dashboardController.getAnalytics);

router.get("/analytics/reports", dashboardController.getAnalyticsReport);

// POST REQUESTS

router.post("/check-applicants", admissionController.checkApplicants);
router.post("/add-batch", admissionController.addBatch);
router.post("/accept-applicants", admissionController.acceptApplicants);

router.post("/applicants/authenticate", admissionController.authenticate);
router.post(
  "/applicants/inauthenticate",
  validateAccessToken,
  admissionController.inauthenticate,
);
router.post("/applicants", admissionController.registerApplicant);
router.post(
  "/upload-file",
  validateAccessToken,
  admissionController.uploadFile,
);
router.post(
  "/upload-documents",
  validateAccessToken,
  admissionController.uploadDocuments,
);
router.post(
  "/applicant-info",
  validateAccessToken,
  admissionController.insertApplicantInfo,
);
router.post(
  "/applications",
  validateAccessToken,
  admissionController.insertApplications,
);

router.post(
  "/dashboard-documents",
  validateAccessToken,
  admissionController.postDashboardDocuments,
);

router.post(
  "/batch-accept",
  validateAccessToken,
  admissionController.batchAccept,
);

// Scholarship //
router.post(
  "/scholarship/approval",
  validateAccessToken,
  scholarshipController.postScholarshipApproval,
);
// Scholarship //

// router.get(
//   "/initialize",
//   dashboardController.initializeSocket
// );

// PUT REQUESTS

router.put(
  "/allow-exception",
  validateAccessToken,
  admissionController.putException,
);

router.put(
  "/application-info",
  validateAccessToken,
  admissionController.putApplicationInfo,
);
router.put(
  "/applications/",
  validateAccessToken,
  admissionController.updateApplications,
);
router.put(
  "/applicant-info/:code",
  validateAccessToken,
  admissionController.updateApplicantInfo,
);

router.put(
  "/applicant-appointment/:code",
  validateAccessToken,
  interviewerController.putApplicantAppointment,
);

router.put(
  "/tag-application/:code",
  validateAccessToken,
  admissionController.tagApplicationInfo,
);

router.put(
  "/applications-info/:code",
  validateAccessToken,
  admissionController.putApplicationsInfo,
);

router.put(
  "/application-status/:code",
  validateAccessToken,
  admissionController.putApplicationStatus,
);

// router.put("/applicant-vaccination/:code", validateAccessToken, admissionController.updateApplicantVaccination);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

// router.get("/interviewers/reset-accounts", validateAccessToken, interviewerController.resetAccounts); // OVERALL RESET INTERVIEWERS

module.exports = router;

const express = require("express");
const router = express.Router();
const AnnouncementController = require("../controllers/announcementController.js");
const attachmentArchivesController = require("../controllers/attachmentArchivesController.js");
const employeeDependentsController = require("../controllers/employeeDependentsController.js");
const myEmployeeDependentsController = require("../controllers/myEmployeeDependentsController.js");
const accumulatedDiscountsSummaryController = require("../controllers/accumulatedDiscountsSummaryController.js");
const DTRController = require("../controllers/DTRController.js");
const educationalBackgroundsController = require("../controllers/educationalBackgroundsController.js");
const exportPersonalInformationsController = require("../controllers/exportPersonalInformationsController.js");
const familyBackgroundsController = require("../controllers/familyBackgroundsController.js");
const { scheduleDailyTask } = require("../utility/helperMethods.js");
const LeaveController = require("../controllers/leaveController.js");
const licensesController = require("../controllers/licensesController.js");
const maintenanceController = require("../controllers/maintenanceController.js");
const myRequestsController = require("../controllers/myRequestsController.js");
const otherRequestsController = require("../controllers/otherRequestsController.js");
const personalInformationsController = require("../controllers/personalInformationsController.js");
const trainingsOrSeminarsController = require("../controllers/trainingsOrSeminarsController.js");
const uploadsController = require("../controllers/uploadsController.js");
const usersController = require("../controllers/usersController.js");
const workExperiencesController = require("../controllers/workExperiencesController.js");
const FacultyController = require("../controllers/facultyController.js");
const DutyRoster = require("../controllers/dutyRosterController.js");
const Hierarchy = require("../controllers/hierarchyController.js");
const EmployeeDetails = require("../controllers/employeeDetailsController.js");
const OvertimeModule = require("../controllers/overtimeController.js");
// const devMode = process.env.NODE_ENV === "dev" || process.env.DEV;

const { validateAccessToken } = require("../../../helpers/crypto");
let controllerName = "";

// attachmentArchives
controllerName = "/attachment-archives";

router
  .route(`${controllerName}/get-all-departments`)
  .get(validateAccessToken, attachmentArchivesController.getAllDepartments);
router
  .route(`${controllerName}/search-employee`)
  .post(validateAccessToken, attachmentArchivesController.searchEmployee);
router
  .route(`${controllerName}/get-employee-attachments`)
  .get(
    validateAccessToken,
    attachmentArchivesController.getEmployeeAttachments,
  );
// attachmentArchives

// educationalBackgrounds
controllerName = "/educational-backgrounds";
router
  .route(`${controllerName}/get`)
  .get(validateAccessToken, educationalBackgroundsController.get);
router
  .route(`${controllerName}/get-options`)
  .get(validateAccessToken, educationalBackgroundsController.getOptions);
router
  .route(`${controllerName}/get-majors`)
  .get(validateAccessToken, educationalBackgroundsController.getMajors);
router
  .route(`${controllerName}/create-request`)
  .post(validateAccessToken, educationalBackgroundsController.createRequest);
// educationalBackgrounds

// exportPersonalInformations
controllerName = "/export-personal-informations";
router
  .route(`${controllerName}/get-all-options`)
  .get(validateAccessToken, exportPersonalInformationsController.getAllOptions);
router
  .route(`${controllerName}/search-employee`)
  .post(
    validateAccessToken,
    exportPersonalInformationsController.searchEmployee,
  );
router
  .route(`${controllerName}/export-to-excel`)
  .post(
    validateAccessToken,
    exportPersonalInformationsController.exportToExcel,
  );
// exportPersonalInformations

// familyBackgrounds
controllerName = "/family-backgrounds";
router
  .route(`${controllerName}/get`)
  .get(validateAccessToken, familyBackgroundsController.get);
router
  .route(`${controllerName}/get-relationships`)
  .get(validateAccessToken, familyBackgroundsController.getRelationships);
router
  .route(`${controllerName}/get-relationship-categories`)
  .get(
    validateAccessToken,
    familyBackgroundsController.getRelationshipCategories,
  );
router
  .route(`${controllerName}/create-request`)
  .post(validateAccessToken, familyBackgroundsController.createRequest);
// familyBackgrounds

// index
controllerName = "";
router.get(controllerName, function (req, res) {
  res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `index.ejs`, {
    APP_NAME: process.env.EC_APP_NAME,
    APP_VERSION: process.env.EC_APP_VERSION,
  });
});
// index

// license
controllerName = "/licenses";
router
  .route(`${controllerName}/get`)
  .get(validateAccessToken, licensesController.get);
router
  .route(`${controllerName}/create-request`)
  .post(validateAccessToken, licensesController.createRequest);
// license

// maintenance
controllerName = "/maintenance";
router
  .route(`${controllerName}/get-all-modules`)
  .get(validateAccessToken, maintenanceController.getAllModules);
router
  .route(`${controllerName}/get-all-fields`)
  .get(validateAccessToken, maintenanceController.getAllFields);
router
  .route(`${controllerName}/get-list`)
  .get(validateAccessToken, maintenanceController.getList);
router
  .route(`${controllerName}/get-courses`)
  .get(validateAccessToken, maintenanceController.getCourses);
router
  .route(`${controllerName}/submit`)
  .post(validateAccessToken, maintenanceController.submit);
// maintenance

// myRequests
controllerName = "/my-requests";
router
  .route(`${controllerName}/get`)
  .post(validateAccessToken, myRequestsController.get);
router
  .route(`${controllerName}/submit-comply/:employee_id`)
  .put(validateAccessToken, myRequestsController.submitComply);
router
  .route(`${controllerName}/request-not-high-lighted-to-requester`)
  .put(
    validateAccessToken,
    myRequestsController.requestNotHighLightedToRequester,
  );
router
  .route(`${controllerName}/get-all-provinces`)
  .get(validateAccessToken, myRequestsController.getAllProvinces);
router
  .route(`${controllerName}/get-all-cities-or-municipalities`)
  .get(validateAccessToken, myRequestsController.getAllCitiesOrMunicipalities);

router
  .route(`${controllerName}/get-all-institutions`)
  .get(validateAccessToken, myRequestsController.getAllInstitutions);
router
  .route(`${controllerName}/get-all-degrees`)
  .get(validateAccessToken, myRequestsController.getAllDegrees);
router
  .route(`${controllerName}/get-all-courses`)
  .get(validateAccessToken, myRequestsController.getAllCourses);
router
  .route(`${controllerName}/get-all-majors`)
  .get(validateAccessToken, myRequestsController.getAllMajors);
router
  .route(`${controllerName}/delete-request/:employee_id`)
  .put(validateAccessToken, myRequestsController.deleteRequest);
// myRequests

// otherRequests
controllerName = "/other-requests";
router
  .route(`${controllerName}/get`)
  .post(validateAccessToken, otherRequestsController.get);
router
  .route(`${controllerName}/approve-request/:employee_id`)
  .put(validateAccessToken, otherRequestsController.approveRequest);
router
  .route(`${controllerName}/delete-request/:employee_id`)
  .put(validateAccessToken, otherRequestsController.deleteRequest);
router
  .route(`${controllerName}/set-hr-remarks/:employee_id`)
  .put(validateAccessToken, otherRequestsController.setHRRemarks);
router
  .route(`${controllerName}/request-not-high-lighted-to-hr`)
  .put(validateAccessToken, otherRequestsController.requestNotHighLightedToHR);
// otherRequests

// personalInformations
controllerName = "/personal-informations";
router
  .route(`${controllerName}/get`)
  .get(validateAccessToken, personalInformationsController.get);
router
  .route(`${controllerName}/create-request`)
  .post(validateAccessToken, personalInformationsController.createRequest);
router
  .route(`${controllerName}/get-all-religions`)
  .get(validateAccessToken, personalInformationsController.getAllReligions);
router
  .route(`${controllerName}/get-all-civil-statuses`)
  .get(validateAccessToken, personalInformationsController.getAllCivilStatuses);
router
  .route(`${controllerName}/get-all-relationships`)
  .get(validateAccessToken, personalInformationsController.getAllRelationships);
router
  .route(`${controllerName}/get-all-regions`)
  .get(validateAccessToken, personalInformationsController.getAllRegions);
router
  .route(`${controllerName}/get-all-provinces`)
  .get(validateAccessToken, personalInformationsController.getAllProvinces);
router
  .route(`${controllerName}/get-all-cities-or-municipalities`)
  .get(
    validateAccessToken,
    personalInformationsController.getAllCitiesOrMunicipalities,
  );
// personalInformations

// trainingsOrSeminars
controllerName = "/trainings-or-seminars";
router
  .route(`${controllerName}/get`)
  .get(validateAccessToken, trainingsOrSeminarsController.get);
router
  .route(`${controllerName}/create-request`)
  .post(validateAccessToken, trainingsOrSeminarsController.createRequest);
// trainingsOrSeminars

// uploads
controllerName = "/uploads";
router.post(`${controllerName}/`, validateAccessToken, uploadsController.index);

router
  .route(`${controllerName}/get-current-marriage-certificate`)
  .get(uploadsController.getCurrentMarriageCertificate);
router
  .route(`${controllerName}/get-current-prc-id`)
  .get(uploadsController.getCurrentPRCID);
router
  .route(`${controllerName}/get-current-tor-or-diploma`)
  .get(uploadsController.getCurrentTOROrDiploma);
router
  .route(`${controllerName}/get-current-birth-certificate`)
  .get(uploadsController.getCurrentBirthCertificate);
router
  .route(`${controllerName}/get-current-training-or-seminar-certificate`)
  .get(uploadsController.getCurrentTrainingOrSeminarCertificate);
router
  .route(`${controllerName}/get-marriage-certificate`)
  .get(uploadsController.getMarriageCertificate);
router
  .route(`${controllerName}/get-birth-certificate`)
  .get(uploadsController.getBirthCertificate);
router.route(`${controllerName}/get-prc-id`).get(uploadsController.getPRCID);
router
  .route(`${controllerName}/get-tor-or-diploma`)
  .get(uploadsController.getTOROrDiploma);
router
  .route(`${controllerName}/get-training-or-seminar-certificate`)
  .get(uploadsController.getTrainingOrSeminarCertificate);
// uploads

// workExperiences
controllerName = "/work-experiences";
router
  .route(`${controllerName}/get`)
  .get(validateAccessToken, workExperiencesController.get);
// workExperiences

// myEmployeeDependents
controllerName = "/my-employee-dependents";
router
  .route(`${controllerName}/get-details`)
  .get(validateAccessToken, myEmployeeDependentsController.getDetails);
// myEmployeeDependents

// accumulatedDiscountsSummary
controllerName = "/accumulated-discounts-summary";
router
  .route(`${controllerName}/on-search`)
  .post(validateAccessToken, accumulatedDiscountsSummaryController.onSearch);
// accumulatedDiscountsSummary

// employeeDependents
controllerName = "/employee-dependents";

router
  .route(`${controllerName}/get-all-departments`)
  .get(validateAccessToken, employeeDependentsController.getAllDepartments);
router
  .route(`${controllerName}/get-employees`)
  .post(validateAccessToken, employeeDependentsController.getEmployees);
router
  .route(`${controllerName}/get-employee-dependents`)
  .get(validateAccessToken, employeeDependentsController.getEmployeeDependents);
// employeeDependents

// users
controllerName = "/users";
router.route(`${controllerName}/login`).post(usersController.login);
router
  .route(`${controllerName}/loginViaPwHash`)
  .post(usersController.loginViaPwHash);
router
  .route(`${controllerName}/logout`)
  .post(validateAccessToken, usersController.logout);
// users

//Announcement
controllerName = "/announcement";
router.get(
  `${controllerName}/getAnnouncements`,
  validateAccessToken,
  AnnouncementController.getAnnouncements,
);
//Announcement

//DTR
controllerName = "/dtr";
router.get(
  `${controllerName}/getDTRDetails`,
  validateAccessToken,
  DTRController.getDTRDetails,
);
router.get(
  `${controllerName}/no-dtr-employee`,
  validateAccessToken,
  DTRController.noDtrEmployee,
);
//DTR

//Leave
controllerName = "/leave";
router.get(
  `${controllerName}/leave-details`,
  validateAccessToken,
  LeaveController.getLeaveDetails,
);
router.get(
  `${controllerName}/leave-balance`,
  validateAccessToken,
  LeaveController.getLeaveBalance,
);
router.get(
  `${controllerName}/leaveLedger`,
  validateAccessToken,
  LeaveController.getLeaveLedger,
);
router.post(
  `${controllerName}/user-leave-balance`,
  validateAccessToken,
  LeaveController.getUserLeaveBalanceDetails,
);
router.post(
  `${controllerName}/admin-action`,
  validateAccessToken,
  LeaveController.updateLeaveAction,
);
router.get(
  `${controllerName}/rejected-leaves`,
  validateAccessToken,
  LeaveController.getRejectedLeaves,
);
router.get(
  `${controllerName}/approved-leaves`,
  validateAccessToken,
  LeaveController.getApprovedLeaves,
);
router.get(
  `${controllerName}/pending-leaves`,
  validateAccessToken,
  LeaveController.getPendingLeaves,
);
router.post(
  `${controllerName}/leave-request`,
  validateAccessToken,
  LeaveController.createLeaveRequest,
);
router.put(
  `${controllerName}/editleave-request/:LeaveID`,
  validateAccessToken,
  LeaveController.updateLeaveRequest,
);
router.delete(
  `${controllerName}/delete-leave/:LeaveID`,
  validateAccessToken,
  LeaveController.deleteLeave,
);
router.get(
  `${controllerName}/user-approved-leaves`,
  validateAccessToken,
  LeaveController.getUserApprovedLeaves,
);
router.get(
  `${controllerName}/user-rejected-leaves`,
  validateAccessToken,
  LeaveController.getUserRejectedLeaves,
);
router.post(
  `${controllerName}/cancel-leave`,
  validateAccessToken,
  LeaveController.cancelLeave,
);
router.get(
  `${controllerName}/cancel-leave-pending`,
  validateAccessToken,
  LeaveController.cancelPending,
);
router.post(
  `${controllerName}/approvers-details`,
  validateAccessToken,
  LeaveController.getApproversDetails,
);
router.post(
  `${controllerName}/cancel-admin-action`,
  validateAccessToken,
  LeaveController.adminCancelAction,
);
router.get(
  `${controllerName}/user-cancel-approve`,
  validateAccessToken,
  LeaveController.getCancelApprovedLeave,
);
router.get(
  `${controllerName}/user-cancel-rejected`,
  validateAccessToken,
  LeaveController.getCancelRejectedLeave,
);
router.get(
  `${controllerName}/rejected-cancel-leaves`,
  validateAccessToken,
  LeaveController.getRejectedCancelLeaves,
);
router.get(
  `${controllerName}/approved-cancel-leaves`,
  validateAccessToken,
  LeaveController.getApprovedCancelLeaves,
);
router.get(
  `${controllerName}/leave-types`,
  validateAccessToken,
  LeaveController.getLeaveTypes,
);
router.get(
  `${controllerName}/employee-details`,
  validateAccessToken,
  LeaveController.getEmployeeDetails,
);
router.get(
  `${controllerName}/approver-details`,
  validateAccessToken,
  LeaveController.getApproverWithEmployees,
);
router.post(
  `${controllerName}/remove-employee-to-approve`,
  validateAccessToken,
  LeaveController.removeEmployeeToApprove,
);
router.get(
  `${controllerName}/getAllDepartment`,
  validateAccessToken,
  LeaveController.getAllDepartment,
);
router.post(
  `${controllerName}/active-employee`,
  validateAccessToken,
  LeaveController.getActiveEmployees,
);
router.post(
  `${controllerName}/updateToApprove`,
  validateAccessToken,
  LeaveController.updateToApprove,
);
router.post(
  `${controllerName}/addingApprover`,
  validateAccessToken,
  LeaveController.addingApprover,
);
router.post(
  `${controllerName}/removingApprover`,
  validateAccessToken,
  LeaveController.removingApprover,
);
router.post(
  `${controllerName}/removeDepartment`,
  validateAccessToken,
  LeaveController.removeDepartment,
);
// router.get("/send-email", validateAccessToken, LeaveController.sendEmailDaily);
scheduleDailyTask(
  9,
  32,
  LeaveController.runStoreProcedureOfLeaveApprovedButNotInLeaveLedger,
);

// if (!devMode) {
//   scheduleDailyTask(8, 0, LeaveController.sendEmailDaily);
// }
// scheduleDailyTask(8, 0, LeaveController.sendEmailDaily);

//Leave

//FacultyModule
controllerName = "/faculty";
router.get(
  `${controllerName}/getColleges`,
  validateAccessToken,
  FacultyController.getColleges,
);
router.get(
  `${controllerName}/getSemesters`,
  validateAccessToken,
  FacultyController.getSemesters,
);
router.post(
  `${controllerName}/getReports`,
  validateAccessToken,
  FacultyController.getReports,
);
//FacultyModule

//DutyRoster
controllerName = "/dutyroster";
router.get(
  `${controllerName}/getDepartment`,
  validateAccessToken,
  DutyRoster.getDepartment,
);
router.get(
  `${controllerName}/getEmployees`,
  validateAccessToken,
  DutyRoster.getEmployees,
);
router.get(
  `${controllerName}/getEmployeeDtr`,
  validateAccessToken,
  DutyRoster.getEmployeeDtr,
);
router.post(
  `${controllerName}/setSchedule`,
  validateAccessToken,
  DutyRoster.setSchedule,
);
router.post(
  `${controllerName}/submitNewSchedule`,
  validateAccessToken,
  DutyRoster.submitNewSchedule,
);
router.get(
  `${controllerName}/getPermanentScheduleList`,
  validateAccessToken,
  DutyRoster.getPermanentScheduleList,
);
router.post(
  `${controllerName}/setPermanentSched`,
  validateAccessToken,
  DutyRoster.setPermanentSched,
);

//DutyRoster

//Hierarchy
controllerName = "/hierarchy";
router.get(
  `${controllerName}/getHiearchy`,
  validateAccessToken,
  Hierarchy.getHiearchy,
);
router.get(
  `${controllerName}/getDepartments`,
  validateAccessToken,
  Hierarchy.getDepartments,
);
router.post(
  `${controllerName}/checkDeptData`,
  validateAccessToken,
  Hierarchy.checkDeptData,
);
router.post(
  `${controllerName}/setNewHierarchy`,
  validateAccessToken,
  Hierarchy.setNewHierarchy,
);
//Hierarchy

//EmployeeDetails
controllerName = "/employeeDetails";
router.get(
  `${controllerName}/getClass`,
  validateAccessToken,
  EmployeeDetails.getClass,
);
router.get(
  `${controllerName}/getInformation`,
  validateAccessToken,
  EmployeeDetails.getInformation,
);
//EmployeeDetails

//OvertimeModule
controllerName = "/overtime";
router.post(
  `${controllerName}/overtimeRequest`,
  validateAccessToken,
  OvertimeModule.overtimeRequest,
);
router.get(
  `${controllerName}/getPendingOvertime`,
  validateAccessToken,
  OvertimeModule.getPendingOvertime,
);
router.get(
  `${controllerName}/getOvertimeDetails`,
  validateAccessToken,
  OvertimeModule.getOvertimeDetails,
);
router.post(
  `${controllerName}/overtime-admin-action`,
  validateAccessToken,
  OvertimeModule.updateOvertimeAction,
);
router.post(
  `${controllerName}/editOvertime-request`,
  validateAccessToken,
  OvertimeModule.updateOvertimeRequest,
);
router.post(
  `${controllerName}/cancelOvertime`,
  validateAccessToken,
  OvertimeModule.cancelOvertime,
);
router.get(
  `${controllerName}/getPendingCancelOvertime`,
  validateAccessToken,
  OvertimeModule.getPendingCancelOvertime,
);
router.post(
  `${controllerName}/cancelOvertimeAction`,
  validateAccessToken,
  OvertimeModule.cancelOvertimeAction,
);
router.get(
  `${controllerName}/getPendingHrd`,
  validateAccessToken,
  OvertimeModule.getPendingHrd,
);
router.post(
  `${controllerName}/approveRejectHrdReview`,
  validateAccessToken,
  OvertimeModule.approveRejectHrdReview,
);
router.post(
  `${controllerName}/approvedRejectedCancelOvertime`,
  validateAccessToken,
  OvertimeModule.approvedRejectedCancelOvertime,
);
router.post(
  `${controllerName}/approvedRejectedOvertime`,
  validateAccessToken,
  OvertimeModule.approvedRejectedOvertime,
);
router.post(
  `${controllerName}/submitAccomplishment`,
  validateAccessToken,
  OvertimeModule.submitAccomplishment,
);
router.get(
  `${controllerName}/getPendingAccomplishment`,
  validateAccessToken,
  OvertimeModule.getPendingAccomplishment,
);
router.post(
  `${controllerName}/approveRejectAccomplishment`,
  validateAccessToken,
  OvertimeModule.approveRejectAccomplishment,
);
//OvertimeModule

//Payroll Notification
// cron.schedule(
//   "3 16 3,26 * *",
//   async () => {
//     const today = new Date().getDate();
//     const dayLabel = today === 3 ? "3rd" : "17th";
//     DTRController.HrdDtrNotification(dayLabel);
//   },
//   {
//     timezone: "Asia/Manila",
//   },
// );
//Payroll Notification

// Not Found
// router.get("*", (req, res) => {
//   res.status(404);
//   res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `notFound.ejs`, {
//     APP_NAME: process.env.EC_APP_NAME,
//     BODY_CONTENT: "Page Not Found",
//   });
// });
// Not Found

module.exports = router;

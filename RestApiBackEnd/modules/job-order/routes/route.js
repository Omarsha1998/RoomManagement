const { Router } = require("express");
const jobOrderController = require("../controllers/jobOrderController");
const assetsController = require("../controllers/assetsController");
const assetsComponentsController = require("../controllers/assetsComponentsController");
// const accessRightsController = require("../controllers/accessRightsController");
const buildingController = require("../controllers/buildingController");
const allotmentHistoryController = require("../controllers/allotmentHistoryController");
const employeesController = require("../controllers/employeesController");
const departmentsController = require("../controllers/departmentsController");
const categoriesController = require("../controllers/categoriesController");
const originController = require("../controllers/originController");
const suppliersController = require("../controllers/suppliersController");
const countCondemController = require("../controllers/countCondemController");

const accessRightsController = require("../../access-rights/controllers/accessRightsController"); // boiler temp access right
// const accessRightsController = require("../controllers/accessRightsController"); //own access right
const emailController = require("../controllers/emailAsController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();
// router.get("/qr-test", emailController.generateTestQr);
// ********************* GET ***************************
router.get("/j-o", validateAccessToken, jobOrderController.getJobOrders);
router.get(
  "/get-via-sn",
  //  validateAccessToken,
  jobOrderController.getEquipment,
);

router.post("/send-test-sms", emailController.sendTestSms);
router.get(
  "/get-out-of-warranties",
  validateAccessToken,
  jobOrderController.getOutOFWarranties,
);
router.get(
  "/all-posted-jo",
  validateAccessToken,
  jobOrderController.getAllPostedJO,
);

router.get(
  "/completed-medical-jo",
  validateAccessToken,
  jobOrderController.getCompletedJo,
);

router.get(
  "/all-departamenl-jo-request",
  validateAccessToken,
  jobOrderController.getDepartamentalJORequests,
);

router.get(
  "/acceptedjo",
  validateAccessToken,
  jobOrderController.getAcceptedJo,
);

router.get(
  "/read-pending-jo",
  validateAccessToken,
  jobOrderController.getJoPending,
);

router.get(
  "/start-pending-jo",
  validateAccessToken,
  jobOrderController.getJoAccept,
);

router.get(
  "/without-acknowledgement",
  validateAccessToken,
  jobOrderController.getForAcknowledgement,
);

router.get("/unread-jo", validateAccessToken, jobOrderController.getUnreadJO);

router.get(
  "/departments-jo-approved",
  validateAccessToken,
  jobOrderController.getApprovedEval,
);
router.get(
  "/depts-concerns",
  validateAccessToken,
  jobOrderController.getFiledDeptConcern,
);
router.get(
  "/all-depts-concerns",
  validateAccessToken,
  jobOrderController.getAllDeptConcerns,
);

router.get(
  "/my-completed-jo",
  validateAccessToken,
  jobOrderController.getMyCompletedJo,
);

router.get(
  "/active-whole-equipment",
  validateAccessToken,
  jobOrderController.medicalAssetActive,
);

router.get(
  "/active-med-equipments-no-duplicates",
  validateAccessToken,
  jobOrderController.medEquipNoDuplicates,
);
router.get(
  "/active-med-equipments-no-duplicates-within-department",
  validateAccessToken,
  jobOrderController.medEquipNoDuplicatesDepartment,
);

router.get(
  "/biomed-employees",
  validateAccessToken,
  employeesController.getActiveEmployeesBiomed,
);
router.get(
  "/it-employees",
  validateAccessToken,
  employeesController.getITEmployees,
);
router.get(
  "/dept-employees-group",
  validateAccessToken,
  employeesController.getEmployeeDeptGroup,
);

router.get(
  "/part-status-selection",
  validateAccessToken,
  jobOrderController.getPartStatus,
);
router.get(
  "/part-id-selection",
  validateAccessToken,
  jobOrderController.getPartId,
);

router.get(
  "/equipment-dets",
  validateAccessToken,
  jobOrderController.getEquipDetails,
);
router.get(
  "/equipment-dets-open-status",
  validateAccessToken,
  jobOrderController.getOpenConcern,
);

router.get(
  "/missed-equips-for-action",
  validateAccessToken,
  jobOrderController.missedNeedAction,
);
router.get(
  "/not-completed-jo",
  validateAccessToken,
  jobOrderController.notCompletedJO,
);

router.get(
  "/jo-number",
  validateAccessToken,
  jobOrderController.getPerformedTasks,
);

router.get(
  "/personal-emp-activities",
  validateAccessToken,
  jobOrderController.getEmpHistory,
);
router.get(
  "/ongoing-bioengineer-jo",
  validateAccessToken,
  jobOrderController.getOngoingAcceptedJo,
);

// ********************* POST ***************************
router.post(
  "/register-new-job-order",
  validateAccessToken,
  jobOrderController.postNewJO,
);
router.put(
  "/submit-assessment-result",
  validateAccessToken,
  jobOrderController.putAssesstmentResultTech,
);
router.put(
  "/save-for-later",
  validateAccessToken,
  jobOrderController.saveForlater,
);
router.put(
  "/jo-read-update",
  validateAccessToken,
  jobOrderController.putUnreadJoViewed,
);

router.put(
  "/asset-reassignment",
  validateAccessToken,
  jobOrderController.putEquipmentReassigning,
);

router.put(
  "/asset-reassignment-underwarranty",
  validateAccessToken,
  jobOrderController.putEquipmentReassigningUnderWarranty,
);

router.put(
  "/post-jo-concern",
  validateAccessToken,
  jobOrderController.acceptJoConcern,
);

router.post(
  "/medical-jo-register-asset",
  validateAccessToken,
  jobOrderController.medicalAssetJORegister,
);
router.post(
  "/file-complaint",
  validateAccessToken,
  jobOrderController.compaliantConcern,
);

router.put(
  "/update-filed-jo",
  validateAccessToken,
  jobOrderController.updateFiledJO,
);
router.put(
  "/canceled-filed-jo",
  validateAccessToken,
  jobOrderController.cancelFiledJO,
);

router.put(
  "/accept-float-jo",
  validateAccessToken,
  jobOrderController.updateAssignTo,
);
router.put(
  "/restart-accepted-jo",
  validateAccessToken,
  jobOrderController.restartJO,
);

router.put(
  "/update-filed-jo-details",
  validateAccessToken,
  jobOrderController.updateJODetails,
);

router.put(
  "/update-new-schedule",
  validateAccessToken,
  jobOrderController.putMissedJo,
);

router.put(
  "/approving-jo-by-department",
  validateAccessToken,
  jobOrderController.updateEvaluation,
);

router.put(
  "/cancel-my-jo",
  validateAccessToken,
  jobOrderController.cancelJOAccespt,
);

//transfer log history of main asset
router.get(
  "/asset-transferring-activity-log",
  validateAccessToken,
  allotmentHistoryController.transferringAssetActivityLogs,
);

//to get the assigned parts
router.get(
  "/assigned-components-parts",
  validateAccessToken,
  assetsComponentsController.getComponentParts,
);

//transfer log history of parts
router.get(
  "/activity-of-item-parts",
  validateAccessToken,
  assetsController.getPartsActivityLog,
);
//to check if main asset of the parts has been retired
router.get(
  "/main-asset-status",
  validateAccessToken,
  countCondemController.checkMainAssetStats,
);

router.get(
  "/emps",
  validateAccessToken,
  employeesController.getActiveEmployeesOnly,
);

router.get(
  "/supplier-lists",
  validateAccessToken,
  suppliersController.getSuppliers,
);
router.get(
  "/dept-of-building",
  validateAccessToken,
  buildingController.getDeptBuilding,
);

router.get("/", validateAccessToken, accessRightsController.getAccessRights);

router.get(
  "/departments",
  validateAccessToken,
  departmentsController.getDepartments,
);

router.get(
  "/depart-naming",
  validateAccessToken,
  departmentsController.getDeptNamEqui,
);

router.get(
  "/departments-live",
  // validateAccessToken,
  departmentsController.getLiveDepartments,
);

router.get(
  "/categories",
  validateAccessToken,
  categoriesController.getCategories,
);
router.get(
  "/categories-none-ls",
  validateAccessToken,
  categoriesController.getNoneLSCategories,
);
router.get(
  "/it-categories",
  validateAccessToken,
  categoriesController.getITCategories,
);
router.get(
  "/active-categories-for-it",
  validateAccessToken,
  categoriesController.getITCategoriesONly,
);

router.get(
  "/ce-only-categories",
  validateAccessToken,
  categoriesController.getCEonlyCategories,
);
router.get(
  "/non-categories",
  validateAccessToken,
  categoriesController.getNonITCategories,
);
router.get("/origin", validateAccessToken, originController.getOrigin);

module.exports = router;

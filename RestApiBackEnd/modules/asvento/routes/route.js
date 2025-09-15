const { Router } = require("express");

// const multer = require("multer");
// const fs = require("fs");

// const mainController = require("../controllers/mainController");
const assetsController = require("../controllers/assetsController");
const assetsComponentsController = require("../controllers/assetsComponentsController");
// const accessRightsController = require("../controllers/accessRightsController");
const buildingController = require("../controllers/buildingController");
const allotmentHistoryController = require("../controllers/allotmentHistoryController");
const employeesController = require("../controllers/employeesController");
const departmentsController = require("../controllers/departmentsController");
const categoriesController = require("../controllers/categoriesController");
const originController = require("../controllers/originController");
const countedByController = require("../controllers/countedByController");
const dispositionController = require("../controllers/dispositionController");
const suppliersController = require("../controllers/suppliersController");
const searchCodeController = require("../controllers/searchCodeController");
const countCondemController = require("../controllers/countCondemController");

const accessRightsController = require("../../access-rights/controllers/accessRightsController"); // boiler temp access right
// const accessRightsController = require("../controllers/accessRightsController"); //own access right
// const emailController = require("../controllers/emailAsController");
const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// router.post("/send-test-email", emailController.sendTestEmail);
// router.post("/send-test-sms", emailController.sendTestSms);
// router.get("/qr-test", emailController.generateTestQr);
// GET REQUESTS
// router.get(
//   "/last-digit-itassetcode",
//   validateAccessToken,
//   assetsController.getItLast,
// );

// ********************* GET ***************************

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

/////// AUDIT MODULE
router.get(
  "/active-whole-equipment",
  validateAccessToken,
  assetsController.getActiveEquipmentWhole,
);
router.get(
  "/homepage-parts",
  validateAccessToken,
  assetsComponentsController.getParts,
);

//////// LOCATION MODULE
router.get(
  "/location-asset-list-departamental",
  validateAccessToken,
  assetsController.getAssetsInLocationModuleTable,
);
router.get(
  "/parts-for-loc-modules",
  validateAccessToken,
  assetsComponentsController.getPartsForLocationModule,
);
router.get("/assets", validateAccessToken, assetsController.getAssets);

router.get(
  "/last-digit-itassetcode",
  validateAccessToken,
  assetsController.getItLastItemCode,
);
router.get(
  "/rr-length-checking",
  validateAccessToken,
  assetsController.allRRChecking,
);

router.get(
  "/all-itAssetCode-checking",
  validateAccessToken,
  assetsController.allItAssetCodeRChecking,
);
router.get(
  "/manual-it-asset-code",
  validateAccessToken,
  assetsController.checkITAssetCodeForManual,
);

router.get(
  "/all-assetcode-checking",
  validateAccessToken,
  assetsController.getAllAssetCodePartsPackage,
);
router.get(
  "/main-within-department",
  validateAccessToken,
  assetsController.getMainAssetWithinDepartment,
);

router.get(
  "/orig-new-assetcode-checking",
  validateAccessToken,
  assetsController.checkOrigAndNewAssetCodeExist,
);
router.get(
  "/last-accountability-ref-no",
  validateAccessToken,
  assetsController.getAcctblyRefNo,
);

router.get(
  "/activity-of-item",
  validateAccessToken,
  assetsController.getActivityLog,
);

router.get(
  "/transferred-asset-log",
  validateAccessToken,
  allotmentHistoryController.transferredAssetLog,
);
router.get(
  "/emps",
  validateAccessToken,
  employeesController.getActiveEmployeesOnly,
);

router.get(
  "/dept-asset-transferred-log",
  validateAccessToken,
  allotmentHistoryController.viewingDeptAssetTransferLog,
);

router.get(
  "/transferred-parts-log",
  validateAccessToken,
  allotmentHistoryController.transferredPartsLog,
);
router.get(
  "/dept-viewing-transferred-parts-log",
  validateAccessToken,
  allotmentHistoryController.deptViewingTransferredPartsLog,
);

router.get(
  "/asset-list-for-generation",
  validateAccessToken,
  assetsController.getAssetsForGeneration,
);
router.get(
  "/parts-list-for-generation",
  validateAccessToken,
  assetsController.getPartsForGeneration,
);

router.get(
  "/by-dept-condemn-requests",
  validateAccessToken,
  assetsController.getByDeptAssetPendingCondemn,
);

router.get(
  "/all-asset-pending-condemn",
  validateAccessToken,
  assetsController.getAllAssetCondemnRequest,
);
router.get(
  "/all-asset-pending-condemn-for-accounting",
  validateAccessToken,
  assetsController.getAllAssetCondemnRequestForAccounting,
);
router.get(
  "/check-if-pending",
  validateAccessToken,
  assetsController.mainAssetPendingCheck,
);
router.get("/rr-counts", validateAccessToken, assetsController.getRRNumber);
//PUT REQUEST
router.put(
  "/audit-updating-assets",
  validateAccessToken,
  assetsController.auditAssetUpdate,
);
router.put(
  "/accounting-capitalized-asset",
  validateAccessToken,
  assetsController.putAssetsCapitalizedUpdate,
);
router.put(
  "/update-assets-transfer-location",
  validateAccessToken,
  assetsController.updateAssetPhysicalLocation,
);
router.put(
  "/update-parts-accounting",
  validateAccessToken,
  assetsComponentsController.putPartsInfoAccounting,
);
router.put(
  "/update-parts-audit",
  validateAccessToken,
  assetsComponentsController.updatePartsInfoAudit,
);

router.put("/update-assets", validateAccessToken, assetsController.putAssets);
router.put(
  "/update-ce-assets",
  validateAccessToken,
  assetsController.putCEAssetsInfo,
);
router.put(
  "/update-parts",
  validateAccessToken,
  assetsComponentsController.putPartsInfo,
);
router.put(
  "/update-parts-ce-infor",
  validateAccessToken,
  assetsComponentsController.updatePartsCEInfor,
);
router.put(
  "/reassign-accessories",
  validateAccessToken,
  assetsComponentsController.updateAccessoriesParent,
);

router.put(
  "/ce-asset-coding",
  validateAccessToken,
  assetsController.putAssignAssetCodeCE,
);
//POST REQUEST

router.post(
  "/register-asset-ce",
  validateAccessToken,
  assetsController.postRegisterAssetCE,
);

router.post(
  "/manual-register-asset-ce",
  validateAccessToken,
  assetsController.manualRegistrationCe,
);
router.put(
  "/add-dept-view-access",
  validateAccessToken,
  assetsController.deptViewAccess,
);

router.post(
  "/register-parts-ce-non-package",
  validateAccessToken,
  assetsComponentsController.registerCEPartsNonPackage,
);
router.post(
  "/manual-register-parts-ce-non-package",
  validateAccessToken,
  assetsComponentsController.manualRegisterCEPartsNonPackage,
);

//end cleaned
//for future use
router.get(
  "/supplier-lists",
  validateAccessToken,
  suppliersController.getSuppliers,
);
// router.get("/building", validateAccessToken, buildingController.getBuildings);
router.get(
  "/dept-of-building",
  validateAccessToken,
  buildingController.getDeptBuilding,
);

//not inuse

// const upload = multer({ dest: "uploads/",
// limits: {
//   fileSize: 1024 * 1024 * 5, // 5 MB limit (adjust as needed)
// },
// });
// const upload = multer({ dest: 'uploads/' });
// router.post("/uploadMe", upload.single("file"), assetsController.convertME);
router.get(
  "/requestby",
  validateAccessToken,
  countedByController.getRequestedBy,
);
router.get(
  "/all-parts-inactive",
  validateAccessToken,
  assetsComponentsController.getAllPartsInactive,
);
router.get(
  "/included-parts",
  validateAccessToken,
  assetsComponentsController.getIncludedPartsToTransfer,
);
router.get(
  "/ara-form-asset",
  validateAccessToken,
  assetsController.getAssetToCondemn,
);
router.get(
  "/parts-included-print",
  validateAccessToken,
  assetsComponentsController.getPartsTransferPrint,
);
router.get(
  "/parts-with-whole",
  validateAccessToken,
  assetsComponentsController.getIncludedPartsWithWhole,
);
router.get(
  "/transferred-components",
  validateAccessToken,
  assetsComponentsController.getPartsApprovedPartsWithMainAssetTRANSFER,
);
router.get(
  "/assets-testing",
  validateAccessToken,
  assetsController.getAssetsTesting,
);
router.get(
  "/allotment-history-by-parts-approved",
  validateAccessToken,
  assetsComponentsController.getPartsLogApproved,
);
router.get("/max", validateAccessToken, allotmentHistoryController.getMaxId);
router.get(
  "/condem-parts-history",
  validateAccessToken,
  allotmentHistoryController.getCondemHistoryParts,
);
router.get(
  "/approval-condemn",
  validateAccessToken,
  assetsController.getAssetsCondemnApproval,
);
router.get(
  "/pending-condemn-parts",
  validateAccessToken,
  assetsController.getPartsCondemnTransfer,
);
router.get(
  "/pending-condemn",
  validateAccessToken,
  assetsController.getAssetsCondemnTransfer,
);
router.get(
  "/approval-condemn-parts",
  validateAccessToken,
  assetsController.getPartsCondemnForApproval,
);
router.get(
  "/assets-approval-transfer",
  validateAccessToken,
  assetsController.getAssetsApprovalTransfers,
);
router.get(
  "/ce-approval-transfer-parts",
  validateAccessToken,
  assetsController.getCEApprovalTransfersParts,
);
router.get("/searchCode", validateAccessToken, assetsController.getSearchCode); //test
router.get(
  "/parts-approval-transfer",
  validateAccessToken,
  assetsController.getPartsApprovalTransfers,
);
router.get(
  "/ce-approval-transfer",
  validateAccessToken,
  assetsController.getCEApprovalTransfers,
);

router.get(
  "/assets-all-active",
  validateAccessToken,
  assetsController.getAssetsActive,
);
// router.get(
//   "/ara-exist",
//   validateAccessToken,
//   assetsController.getAraNumberAvailability,
// );

router.get(
  "/parts-all-active",
  validateAccessToken,
  assetsController.getPartsActive,
);

router.get(
  "/assets-per-department",
  validateAccessToken,
  assetsController.getAssetsByDepartment,
);

router.get(
  "/assets-bypass-condem",
  validateAccessToken,
  assetsController.getAssetsByPassCondem,
);
router.get(
  "/distinct-asset",
  validateAccessToken,
  assetsController.getDistinctApprovalTransferFormNo,
);
router.get(
  "/ce-distinct-asset",
  validateAccessToken,
  assetsController.getCEDistinctApprovalTransferFormNo,
);
router.get(
  "/search-code",
  validateAccessToken,
  assetsController.getSearcAssetCode,
);
router.get(
  "/search-specific-asset-code",
  validateAccessToken,
  assetsController.getSpecificAssetCode,
);

router.get(
  "/search-code-IT",
  validateAccessToken,
  assetsController.getSearcITAssetCode,
);
router.get(
  "/search-mecode",
  validateAccessToken,
  assetsController.checkIsAssetCodeExisting,
);

router.get("/ce-assets", validateAccessToken, assetsController.getAssetsCE);
router.get(
  "/ce-parts",
  validateAccessToken,
  assetsComponentsController.getAllCEParts,
);
router.get(
  "/parts-without-parent",
  validateAccessToken,
  assetsComponentsController.getPartsWoParents,
);

router.get(
  "/ce-no-assetcode",
  validateAccessToken,
  assetsController.getAssetsCEnoAssetCode,
);
router.get("/", validateAccessToken, accessRightsController.getAccessRights);
router.get(
  "/pending-transfer",
  validateAccessToken,
  assetsController.getAssetsPendingTransfers,
);
router.get(
  "/ce-retired-whole",
  validateAccessToken,
  assetsController.getRetiredCEWholeAsset,
);

router.get(
  "/condemn-log-approved-assets",
  validateAccessToken,
  assetsController.getAllRetiredWholeAssetJoined,
);
router.get(
  "/accepted-condemn-asset",
  validateAccessToken,
  assetsController.approvedAssetCondemDeptView,
);
router.get(
  "/accepted-condemn-parts",
  validateAccessToken,
  assetsController.approvedPartsCondemDeptView,
);

router.get(
  "/ce-retired-parts",
  validateAccessToken,
  assetsController.getRetiredCEParts,
);
router.get(
  "/allotment-history",
  validateAccessToken,
  allotmentHistoryController.getAllotmentHistory,
);

router.get(
  "/allotment-history-by-parts",
  validateAccessToken,
  allotmentHistoryController.getAllotmentHistoryByParts,
);

router.get(
  "/logs-approved-parts",
  validateAccessToken,
  allotmentHistoryController.getApprovedTransferBYPartsLog,
);
router.get(
  "/approved-transfer-asset",
  validateAccessToken,
  assetsController.getApprovedAssetLogs,
);
router.get(
  "/approved-transfer-parts",
  validateAccessToken,
  allotmentHistoryController.getApprovedTransferPartsLog,
);
router.get(
  "/approved-only-parts",
  validateAccessToken,
  assetsComponentsController.getPartsApprovedPartOnly,
);
router.get("/old/assets", validateAccessToken, assetsController.getOldAssets);
router.get(
  "/assigned-components",
  validateAccessToken,
  assetsComponentsController.getCurrentAssignedComponents,
);

router.get(
  "/condemned-components",
  validateAccessToken,
  assetsComponentsController.getPartsApprovedPartsWithMainAsset,
);
router.get(
  "/assetDepts",
  validateAccessToken,
  assetsController.getAllRetiredWholeAssetDepartment,
);
router.get(
  "/condemned-components-parts",
  validateAccessToken,
  assetsComponentsController.getCondemLogInfo,
);
router.get(
  "/parts-waiting-room",
  validateAccessToken,
  assetsComponentsController.getPartsInactive,
);
router.get(
  "/active-selected-parts",
  validateAccessToken,
  assetsComponentsController.getPartsActiveInactive,
);
router.get(
  "/parts-not-approved",
  validateAccessToken,
  assetsComponentsController.getPendingPreApprovedParts,
);

router.get(
  "/active-parts-to-condem",
  validateAccessToken,
  assetsComponentsController.getPartsActiveOnly,
);
router.get(
  "/pre-approved-na-parts",
  validateAccessToken,
  assetsComponentsController.preApprovedParts,
);

router.get(
  "/parts-by-asset-code",
  validateAccessToken,
  assetsComponentsController.getPartsByAssetCode,
);
router.get(
  "/pending-condem-selected-parts",
  validateAccessToken,
  assetsComponentsController.getPendingCondemParts,
);
router.get(
  "/parts-review",
  validateAccessToken,
  assetsComponentsController.getIncludedPartsInformationReview,
);

router.get(
  "/parts-viewing-property",
  validateAccessToken,
  assetsComponentsController.getPartsActiveInactiveNoDeptLimit,
);
router.get(
  "/no-distinct",
  validateAccessToken,
  assetsController.getDistinctTransferFormNo,
);
router.get(
  "/no-distinct-parts",
  validateAccessToken,
  assetsController.getDistinctTransferFormNoParts,
);
router.get(
  "/no-distinct-parts-IT",
  validateAccessToken,
  assetsController.getDistinctTransferFormNoPartsIT,
); //by it
router.get(
  "/no-distinct-parts-property",
  validateAccessToken,
  assetsController.getDistinctTransferFormNoPartsProperty,
); //by property
router.get(
  "/no-distinct-parts-ara",
  validateAccessToken,
  assetsController.getDistinctAraFormByDeptParts,
);
router.get(
  "/parts-request-to-condem",
  validateAccessToken,
  assetsController.condemRequestParts,
);

router.get(
  "/upcoming-condem-parts",
  validateAccessToken,
  assetsController.getUpcomingPartsCondemRequest,
);
router.get(
  "/pending-condemn-assets",
  validateAccessToken,
  assetsController.getDistinctAraFormNo,
);
router.get(
  "/pending-condemn-assets-property",
  validateAccessToken,
  assetsController.getDistinctAraFormNoByProperty,
);
router.get(
  "/upcoming-request-to-condem",
  validateAccessToken,
  assetsController.getUpcomingCondemRequest,
);
router.get(
  "/asset-to-transfer",
  validateAccessToken,
  assetsController.getAssetToTransfer,
); //by dept
router.get(
  "/asset-to-transfer-property",
  validateAccessToken,
  assetsController.getAssetToTransferProperty,
); //property USED
router.get(
  "/asset-to-transfer-IT",
  validateAccessToken,
  assetsController.getAssetToTransferIT,
); //by IT USED
router.get(
  "/parts-to-transfer",
  validateAccessToken,
  assetsController.getPartsToTransfer,
); //by dept used
router.get(
  "/parts-to-transfer-IT-Equip",
  validateAccessToken,
  assetsController.getPartsToTransferITEquip,
);
router.get(
  "/parts-to-transfer-property",
  validateAccessToken,
  assetsController.getPartsToTransferProperty,
); //by property used
router.get(
  "/asset-to-condemn-approval-property",
  validateAccessToken,
  assetsController.getCondemnListProperty,
);
router.get(
  "/asset-condem-approval",
  validateAccessToken,
  assetsController.condemApprovalForPendingRequest,
);

router.get(
  "/parts-to-condemn",
  validateAccessToken,
  assetsController.getPartsToTCondemnByDept,
);
router.get(
  "/ara-parts-details",
  validateAccessToken,
  assetsController.getARAPartsDetails,
);

router.get(
  "/parts-to-condemn-accepting",
  validateAccessToken,
  assetsController.acceptingCondemRequestParts,
);

router.get(
  "/last-transfer-form-no",
  validateAccessToken,
  assetsController.getLastTransferFormNo,
);
router.get(
  "/all-parts",
  validateAccessToken,
  assetsComponentsController.getAllParts,
);

router.get(
  "/all-parts-bypass-condem",
  validateAccessToken,
  assetsComponentsController.getAllPartsByPassCondem,
);

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

// router.get(
//   "/departments",
//   validateAccessToken,
//   departmentsController.getLiveDepartments,
// );
router.get(
  "/departments-live",
  validateAccessToken,
  departmentsController.getLiveDepartments,
);
router.get(
  "/departments-primary",
  validateAccessToken,
  departmentsController.getPrimaryOnly,
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
router.get("/audit", validateAccessToken, countedByController.getAudit);

router.get(
  "/dispositions",
  validateAccessToken,
  dispositionController.getDisposition,
);
router.get("/code", validateAccessToken, searchCodeController.getCode);
router.get(
  "/retired-parts",
  validateAccessToken,
  assetsComponentsController.getRetiredPartsAll,
);
router.get(
  "/retired-parts-dept-viewing",
  validateAccessToken,
  assetsComponentsController.deptViewingRetiredParts,
);

// POST REQUESTS
router.post("/assets", validateAccessToken, assetsController.postAssets);
router.post(
  "/register-asset",
  validateAccessToken,
  assetsController.postRegisterAsset,
);

router.get(
  "/rr-counts-in-components",
  validateAccessToken,
  assetsController.getRRNumberExistInParts,
);

router.get(
  "/last-digit-itassetcode-components",
  validateAccessToken,
  assetsController.getItLastComponents,
);
router.post(
  "/register-component",
  validateAccessToken,
  assetsComponentsController.postRegisterComponent,
);
router.post(
  "/register-component-ce",
  validateAccessToken,
  assetsComponentsController.postRegisterComponentCE,
);
router.post(
  "/register-component-ce-as-package",
  validateAccessToken,
  assetsComponentsController.registerCEPackageAccessories,
);

router.post(
  "/transfer-assets",
  validateAccessToken,
  assetsController.postAssetsTransfer,
);
router.post(
  "/request-transfer-parts",
  validateAccessToken,
  assetsController.postPartsTransfer,
);
router.post(
  "/postAssetsCondemn",
  validateAccessToken,
  assetsController.postAssetsCondemn,
);
router.post(
  "/condem-direct-approval-asset",
  validateAccessToken,
  assetsController.condemDirectApproval,
);

router.post(
  "/condemn-request-parts",
  validateAccessToken,
  assetsController.postSendCondemnRequestParts,
);
router.post(
  "/condemn-direct-approved-parts",
  validateAccessToken,
  assetsController.partsCondemDirectApproval,
);

router.post(
  "/postAssetsCondemnApproved",
  validateAccessToken,
  assetsController.postAssetsCondemnApproved,
);
router.post(
  "/condemn-approving-parts",
  validateAccessToken,
  assetsController.postPartsCondemnApproved,
);
router.post("/upload-excel", assetsController.postjsonData);

// PUT REQUESTS

router.put(
  "/cancel-transfer-parts",
  validateAccessToken,
  assetsComponentsController.putPartsCancelTransfer,
);
router.put(
  "/cancel-transfer",
  validateAccessToken,
  assetsController.putAssetsCancelTransfer,
);
router.put(
  "/cancel-condemn",
  validateAccessToken,
  assetsController.putAssetsCancelCondemn,
);

router.put(
  "/disapprove-condemn-piece",
  validateAccessToken,
  assetsController.disapprovePerPieceCondem,
);

router.put(
  "/cancel-condemn-parts",
  validateAccessToken,
  assetsController.putPartsCancelCondemn,
);
router.put(
  "/cancel-condemn-parts-per-piece",
  validateAccessToken,
  assetsController.partsCondemRequestPerPieceDisapprove,
);

router.put(
  "/update-assets-transfer-approval",
  validateAccessToken,
  assetsController.putAssetsTransfer,
);
router.put(
  "/update-parts-transfer-approval",
  validateAccessToken,
  assetsController.putAssetsTransferParts,
);
router.put(
  "/it-parts-transfer-approval",
  validateAccessToken,
  assetsController.putTransferApproveParts,
);

router.put(
  "/update-components",
  validateAccessToken,
  assetsComponentsController.putUnassignedComponent,
);
router.put(
  "/reassign-component",
  validateAccessToken,
  assetsComponentsController.putReassignComponent,
);

//  router.get("/users/:code", validateAccessToken, .updateUser);

// router.put("/users/:code", validateAccessToken, userController.updateUser);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

// GET REQUESTS

module.exports = router;

const { Router } = require("express");
const itemsController = require("../controllers/itemController");
const departmentsController = require("../controllers/departmentController");
const purchaseRequestController = require("../controllers/purchaseRequestController");

const { validateAccessToken } = require("../../../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get(
  "/",
  validateAccessToken,
  purchaseRequestController.getPurchaseRequests,
);
router.get(
  "/pr-items",
  validateAccessToken,
  purchaseRequestController.getPurchaseRequestItems,
);

router.get(
  "/reorder-point-items",
  // validateAccessToken,
  itemsController.getReorderPointItems,
);
router.get("/items", validateAccessToken, itemsController.getItems);
router.get("/all-items", validateAccessToken, itemsController.getAllItems);
router.get(
  "/items-categories",
  validateAccessToken,
  itemsController.getItemCategories,
);
router.get(
  "/items-subcategories",
  validateAccessToken,
  itemsController.getItemSubcategories,
);
router.get("/allotted-items", itemsController.getAllotedItems);
router.get("/department-items", itemsController.getDepartmentItems);
router.get(
  "/departments",
  validateAccessToken,
  departmentsController.getDepartments,
);
router.get(
  "/purchasing-departments",
  validateAccessToken,
  departmentsController.getPurchasingDepartments,
);
router.get(
  "/pr-departments",
  validateAccessToken,
  departmentsController.getPRDepartments,
);
router.get(
  "/pr-departments-approver",
  validateAccessToken,
  departmentsController.getPRDepartmentsApprover,
);
router.get(
  "/pr-approvers",
  validateAccessToken,
  departmentsController.getPRApprovers,
);
router.get(
  "/pr-types",
  validateAccessToken,
  purchaseRequestController.getPurchaseRequestTypes,
);
router.get("/pr-po", purchaseRequestController.getPurchaseRequestWithPO);
router.get("/dept-item-test", itemsController.insertDepartmentItemsTest);

router.get(
  "/items-stockrooms",
  validateAccessToken,
  itemsController.getItemStockRooms,
);

// POST REQUESTS
router.post(
  "/pr",
  validateAccessToken,
  purchaseRequestController.savePurchaseRequests,
);
router.post(
  "/department-items",
  validateAccessToken,
  itemsController.insertDepartmentItems,
);
router.post(
  "/pr-approvers",
  validateAccessToken,
  departmentsController.insertPRApprovers,
);

router.post(
  "/items-subcategories",
  validateAccessToken,
  itemsController.postSubcategories,
);

router.post(
  "/assign-items",
  validateAccessToken,
  itemsController.postItemSubcategories,
);

router.post(
  "/replace-item",
  validateAccessToken,
  purchaseRequestController.replaceItem,
);

router.post("/item", validateAccessToken, itemsController.postItem);

// PUT REQUESTS
router.put("/items", validateAccessToken, itemsController.putItem);
router.put(
  "/items-subcategories",
  validateAccessToken,
  itemsController.putSubcategories,
);

router.put(
  "/pr/:code",
  validateAccessToken,
  purchaseRequestController.updatePurchaseRequest,
);
router.put(
  "/pr-items/:code",
  validateAccessToken,
  purchaseRequestController.updatePurchaseRequestItems,
);

router.put(
  "/pr-item/:code",
  validateAccessToken,
  purchaseRequestController.updatePurchaseRequestItem,
);

router.put("/items-details/", validateAccessToken, itemsController.updateItems);
router.put(
  "/department-items",
  validateAccessToken,
  itemsController.updateDepartmentItems,
);
router.put(
  "/pr-approvers/:id",
  validateAccessToken,
  departmentsController.updatePRApprover,
);

// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

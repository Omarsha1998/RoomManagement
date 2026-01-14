const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPurchaseRequestItems = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      pr.code, 
      pr.type,
      pr.description,
      pr.toDepartment,
      pr.fromDepartment,
      pr.dateNeeded,
      pri.itemCode,
      pr.status,
      pri.id itemId,
      pri.name itemName,
      pri.description itemDescription,
      pri.status itemStatus,
      pri.quantity,
      pri.maxQuantity,
      pri.others,
      pri.otherDescription,
      pri.unit,
      pri.others remarks,
      pri.alno,
      pri.alQty,
      pit.internalCategoryCode,
      pit.actionCategoryCode,
      pr.approvedBy,
      pr.reviewedBy,
      pr.completedBy,
      pr.rejectedBy,
      pr.createdBy,
      pr.updatedBy,
      pr.rejectingRemarks,
      pri.rejectionRemarks,
      pr.dateTimeApproved,
      pr.dateTimeReviewed,
      pr.dateTimeCompleted,
      pr.dateTimeRejected,
      pr.dateTimeCreated,
      pr.dateTimeUpdated,
      po.pono,
      po.itemCode poItemCode,
      po.qty poQuantity,
      po.uom poUOM,
      po.unitCost poUnitCost,
      po.transDate poTransDate
    from UERMINV..PurchaseRequests pr
    join UERMINV..PurchaseRequestItems pri on pr.Code = pri.PRCode and pri.Active = 1 AND itemCode is not null
    left join UERMINV..PurchaseOrderDetails po on po.pono = pri.pono and po.itemCode = pri.itemCode and po.prno = pr.code
	  left join UERMMMC..Phar_items pit on pit.itemCode = pri.itemCode collate SQL_Latin1_General_CP1_CI_AS
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
    [],
    txn,
  );
};

const insertPurchaseRequestItems = async function (payload, txn) {
  return await sqlHelper.insert("UERMINV..PurchaseRequestItems", payload, txn);
};

const updatePurchaseRequestItems = async function (payload, condition, txn) {
  return await sqlHelper.update(
    "UERMINV..PurchaseRequestItems",
    payload,
    condition,
    txn,
  );
};

module.exports = {
  selectPurchaseRequestItems,
  insertPurchaseRequestItems,
  updatePurchaseRequestItems,
};

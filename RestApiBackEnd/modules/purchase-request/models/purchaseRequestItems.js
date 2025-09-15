const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPurchaseRequestItems = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
          ${util.empty(options.top) ? "" : `TOP(${options.top})`}
          code, 
          type,
          pr.description,
          toDepartment,
          fromDepartment,
          dateNeeded,
          itemCode,
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
          pr.dateTimeUpdated
        from UERMINV..PurchaseRequests pr
        join UERMINV..PurchaseRequestItems pri on pr.Code = pri.PRCode and pri.Active = 1
        WHERE 1=1 ${conditions}
        ${util.empty(options.order) ? "" : `order by ${options.order}`}
        `,
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

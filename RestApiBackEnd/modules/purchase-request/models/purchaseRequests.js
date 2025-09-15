/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPurchaseRequestTypes = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        code,
        name,
        description,
        active,
        forPR,
        prDepartments,
        secondaryApproval, 
        parent,
        dateTimeCreated,
        dateTimeUpdated
      from UERMINV..PurchaseRequestTypes
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectPurchaseRequests = async function (conditions, txn, options) {
  const purchaseRequests = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        code,
        category,
        class,
        type,
        description,
				fromDepartment,
        toDepartment,
        secondaryApprovingDepartment,
        dateNeeded,
				status,
        approvedBy,
        reviewedBy,
        completedBy,
        createdBy,
        updatedBy,
        rejectedBy,
        rejectingRemarks,
        dateTimeApproved,
        dateTimeReviewed,
        dateTimeCompleted,
        dateTimeCreated,
        dateTimeUpdated,
        dateTimeRejected
      from UERMINV..PurchaseRequests
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );

  if (purchaseRequests.length > 0) {
    purchaseRequests.forEach((list) => {
      list.formattedDateNeeded = util.formatDate2({
        date: list.dateNeeded,
        withDayNameOnly: true,
      });
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
        withDayNameWithTime: true,
      });
      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
        withDayNameWithTime: true,
      });

      if (list.approvedBy !== null) {
        list.dateTimeApproved = util.formatDate2({
          date: list.dateTimeApproved,
          withDayNameOnly: true,
        });
      }

      if (list.reviewedBy !== null) {
        list.dateTimeReviewed = util.formatDate2({
          date: list.dateTimeReviewed,
          withDayNameWithTime: true,
        });
      }

      if (list.rejectedBy !== null) {
        list.dateTimeRejected = util.formatDate2({
          date: list.dateTimeRejected,
          withDayNameWithTime: true,
        });
      }

      if (list.completedBy !== null) {
        list.dateTimeCompleted = util.formatDate2({
          date: list.dateTimeCompleted,
          withDayNameWithTime: true,
        });
      }
    });
  }

  return purchaseRequests;
};

const selectPurchaseRequestsWithPO = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const rows = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      pr.itemcode,
      prpoitemcode=isnull(po.itemcode,''),
      itemtype=pp.Type,
      qty=pr.Quantity,
      uom=pr.Unit,
      unitcost=p.UnitPricePerPc,
      totalcost=round(pr.Quantity*p.UnitPricePerPc,2),
      prno=pp.COde,
      requestingdept=pp.FromDepartment,
      requestingdeptdesc=s.description,
      inventorytype=pp.[type],
      p.brandname ,
      p.genname,
      p.mg,
      p.dosageform,
      description=brandname+' '+GenName +' '+MG +' '+DosageForm,
      prpoqty=isnull(po.prpoqty,0),
      prpobal=pr.Quantity-isnull(po.prpoqty,0),
      prponos=isnull(po.prponos,''),
      prdetailsid=pr.id,
      pp.DateTimeCreated dateTimePurchaseRequest
    from UERMINV..PurchaseRequestItems pr
      inner join UERMINV..PurchaseRequests pp on pr.prCOde=pp.Code
      inner join UERMMMC..PHAR_ITEMS p on pr.itemcode=p.itemcode COLLATE Latin1_General_CI_AS
      inner join UERMMMC..SECTIONS s on pp.FromDepartment =s.CODE COLLATE Latin1_General_CI_AS
      left join UERMINV..vw_PRwithPO po on pr.Id=po.prdetailsid
    WHERE 1=1  ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (rows.length > 0) {
      rows.forEach((list) => {
        list.dateCreated = util.formatDate2({
          date: list.dateCreated,
        });
      });
    }

    return rows;
  } catch (error) {
    console.log(error);
  }
};

const insertPurchaseRequests = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..PurchaseRequests", payload, txn);
  } catch (error) {
    console.log(error);
    return error;
  }
};

const insertPRApprovals = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..PRApprovals", payload, txn);
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updatePurchaseRequest = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMINV..PurchaseRequests",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectPurchaseRequests,
  insertPurchaseRequests,
  insertPRApprovals,
  updatePurchaseRequest,
  selectPurchaseRequestTypes,
  selectPurchaseRequestsWithPO,
};

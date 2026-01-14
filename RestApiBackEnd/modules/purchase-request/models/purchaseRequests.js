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

const selectStatus = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        code,
        description,
        color,
        completion,
        active,
        dateTimeCreated,
        dateTimeUpdated,
        remarks
      from UERMINV..PRStatus
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectPRItemCat = async function (conditions, args, options, txn) {
  try {
    const rows = await sqlHelper.query(
      `SELECT distinct
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      case when c.name is null 
        then 'NO CATEGORY - NO SUBCATEGORY'
        else c.name 
      end category
      from UERMINV..PurchaseRequestItems a
      join UERMMMC..Phar_items b on b.itemCode = a.ItemCode collate SQL_Latin1_General_CP1_CI_AS
      left join UERMINV..ItemCategory d on d.CategoryCode = b.ActionCategoryCode  collate SQL_Latin1_General_CP1_CI_AS
      left join UERMINV..ItemSubcategories c on c.categoryCode = b.InternalCategoryCode collate SQL_Latin1_General_CP1_CI_AS and c.code = b.ActionCategoryCode collate SQL_Latin1_General_CP1_CI_AS
      WHERE 1=1  ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return rows;
  } catch (error) {
    console.log(error);
  }
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
        dateTimeRejected,
        case when (select count(prcode) from UERMINV..PurchaseRequestItems where prCode = code and (pono is not null or pono <> '')) > 0
          then cast (1 as bit)
        else cast(0 as bit)
        end hasPO,
        case when (select count(prCode) from UERMINV..PurchaseRequestItems b where b.prCode = code and b.status = 11) > 0
          then cast (1 as bit)
        else cast(0 as bit)
        end hasIssuance,
        (SELECT 
          STRING_AGG(name, ', ') AS cat
        FROM (
          SELECT DISTINCT
            case when c.name is null 
              then 'NO CATEGORY - NO SUBCATEGORY'
            else 
              -- c.name
              case when b.InternalCategoryCode = 10
                then concat('MEDICINES - ', c.name)
                else c.name 
              end
            end name,
            prCode
            FROM UERMINV..PurchaseRequestItems a
            JOIN UERMMMC..Phar_items b 
                ON b.itemCode = a.ItemCode COLLATE SQL_Latin1_General_CP1_CI_AS
            LEFT JOIN UERMINV..ItemCategory d 
                ON d.CategoryCode = b.ActionCategoryCode COLLATE SQL_Latin1_General_CP1_CI_AS
            LEFT JOIN UERMINV..ItemSubcategories c 
                ON c.categoryCode = b.InternalCategoryCode COLLATE SQL_Latin1_General_CP1_CI_AS 
              AND c.code = b.ActionCategoryCode COLLATE SQL_Latin1_General_CP1_CI_AS
        ) AS distinct_cats WHERE prCode = a.code) itemCategories

      from UERMINV..PurchaseRequests a
      WHERE 1=1 and active = 1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
  if (purchaseRequests.length > 0) {
    // for (const list of purchaseRequests) {
    purchaseRequests.forEach((list) => {
      list.formattedDateNeeded = util.formatDate2({
        date: list.dateNeeded,
        withDayNameOnly: true,
      });
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
      });
      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
      });

      if (list.approvedBy !== null) {
        list.dateTimeApproved = util.formatDate2({
          date: list.dateTimeApproved,
        });
      }

      if (list.reviewedBy !== null) {
        list.dateTimeReviewed = util.formatDate2({
          date: list.dateTimeReviewed,
        });
      }

      if (list.rejectedBy !== null) {
        list.dateTimeRejected = util.formatDate2({
          date: list.dateTimeRejected,
        });
      }

      if (list.dateTimeCompleted !== null) {
        list.dateTimeCompleted = util.formatDate2({
          date: list.dateTimeCompleted,
        });
      }
    });
    // }
  }

  // console.log(purchaseRequests);

  return purchaseRequests;
};

const selectWarehouseDepartmentItems = async function (
  conditions,
  args,
  options,
  txn,
) {
  const departmentItems = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        b.id,
        b.prCode, 
        a.dateNeeded, 
        b.itemCode, 
        b.name, 
        b.description, 
        b.others, 
        b.otherDescription, 
        b.unit, 
        b.quantity, 
        b.AlQty allottedQuantity, 
        b.alno allotmentNumber, 
        pit.internalCategoryCode,
        pit.actionCategoryCode,
        a.status rivStatus,
        b.status, 
        case when b.status = 11 then cast (1 as bit) else cast (0 as bit) end hasIssuance,
        b.dateTimeCreated, 
        b.dateTimeUpdated
      from 
        UERMINV..PurchaseRequests a 
        join UERMINV..PurchaseRequestItems b on b.prCode = a.code and b.status <> 0
        left join UERMMMC..Phar_items pit on pit.itemCode = b.itemCode collate SQL_Latin1_General_CP1_CI_AS
        and b.status <> 0 
        and b.active = 1 
      where 1=1  ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (departmentItems.length > 0) {
    // for (const list of departmentItems) {
    departmentItems.forEach((list) => {
      list.formattedDateNeeded = util.formatDate2({
        date: list.dateNeeded,
        withDayNameOnly: true,
      });
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
        straightDateWithTime: true,
      });
      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
        straightDateWithTime: true,
      });
    });
    // }
  }

  return departmentItems;
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
    return error;
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
  selectStatus,
  selectPurchaseRequests,
  insertPurchaseRequests,
  insertPRApprovals,
  updatePurchaseRequest,
  selectPurchaseRequestTypes,
  selectPurchaseRequestsWithPO,
  selectPRItemCat,
  selectWarehouseDepartmentItems,
};

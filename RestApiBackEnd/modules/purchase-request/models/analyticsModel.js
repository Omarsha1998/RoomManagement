/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectAnalytics = async function (conditions, args, options, txn) {
  try {
    const analytics = await sqlHelper.query(
      `SELECT       
        id, 
        code, 
        name,
        description, 
        type, 
        roles, 
        params, 
        query, 
        helperMethod,
        otherHelperMethod, 
        otherHelperCondition,
        columns,
        externalParams,
        valueParams,
        externalConditions,
        internalConditions,
        printout,
        active, 
        createdBy,
        updatedBy, 
        dateTimeCreated, 
        dateTimeUpdated, 
        remarks
      FROM UERMINV..Analytics
        where 1=1
        ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (analytics.length > 0) {
      for (const list of analytics) {
        const stringifyColumns = JSON.stringify(list.columns);
        list.columns = JSON.parse(stringifyColumns);
      }
    }

    return analytics;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getPRWarehouseItems = async function (conditions, args, options, txn) {
  try {
    const analytics = await sqlHelper.query(
      `SELECT 
        code, 
        category, 
        a.description prDescription, 
        dateNeeded, 
        approvedBy, 
        completedBy, 
        a.createdBy, 
        a.updatedBy, 
        dateTimeApproved, 
        dateTimeCompleted, 
        a.dateTimeCreated, 
        a.dateTimeUpdated, 
        a.dateTimeRejected, 
        pri.itemCode, 
        pri.name, 
        pri.description, 
        pri.OtherDescription, 
        pri.unit, 
        pri.quantity, 
        pri.poNo, 
        case when (
          select 
            count(prcode) 
          from 
            UERMINV..PurchaseRequestItems 
          where 
            prCode = code 
            and (
              pono is not null 
              or pono <> ''
            )
        ) > 0 then cast (1 as bit) else cast(0 as bit) end hasPO, 
        case when (
          select 
            count(prCode) 
          from 
            UERMINV..PurchaseRequestItems b 
          where 
            b.prCode = code 
            and b.status = 11
        ) > 0 then cast (1 as bit) else cast(0 as bit) end hasIssuance, 
        (
          SELECT 
            STRING_AGG(name, ', ') AS cat 
          FROM 
            (
              SELECT 
                DISTINCT case when c.name is null then 'NO CATEGORY - NO SUBCATEGORY' else -- c.name
                case when b.InternalCategoryCode = 10 then concat('MEDICINES - ', c.name) else c.name end end name, 
                prCode 
              FROM 
                UERMINV..PurchaseRequestItems a 
                JOIN UERMMMC..Phar_items b ON b.itemCode = a.ItemCode COLLATE SQL_Latin1_General_CP1_CI_AS 
                LEFT JOIN UERMINV..ItemCategory d ON d.CategoryCode = b.ActionCategoryCode COLLATE SQL_Latin1_General_CP1_CI_AS 
                LEFT JOIN UERMINV..ItemSubcategories c ON c.categoryCode = b.InternalCategoryCode COLLATE SQL_Latin1_General_CP1_CI_AS 
                AND c.code = b.ActionCategoryCode COLLATE SQL_Latin1_General_CP1_CI_AS
            ) AS distinct_cats 
          WHERE 
            prCode = a.code
        ) itemCategories 
      from 
        UERMINV..PurchaseRequests a 
        join UERMINV..PurchaseRequestItems pri on pri.PRCode = a.code 
      WHERE 
        1 = 1 
        ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (analytics.length > 0) {
      for (const list of analytics) {
        if (list.dateTimeCreated !== null) {
          list.dateTimeCreated = util.formatDate2({
            date: list.dateTimeCreated,
          });
        }
        if (list.dateTimeUpdated !== null) {
          list.dateTimeUpdated = util.formatDate2({
            date: list.dateTimeUpdated,
          });
        }
        if (list.dateTimeApproved !== null) {
          list.dateTimeApproved = util.formatDate2({
            date: list.dateTimeApproved,
          });
        }
      }
    }

    return analytics;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getPRWarehouseTracker = async function (conditions, args, options, txn) {
  try {
    const prTracker = await sqlHelper.query(
      `exec UERMINV..Usp_jf_GetPurchaseRequestTracker ${args}, '', ''`,
      [],
      txn,
    );

    if (prTracker.length > 0) {
      for (const list of prTracker) {
        if (list.pR_DateTimeCreated !== null) {
          list.pR_DateTimeCreated = util.formatDate2({
            date: list.pR_DateTimeCreated,
          });
        }

        if (list.pR_DateTimeApproved !== null) {
          list.pR_DateTimeApproved = util.formatDate2({
            date: list.pR_DateTimeApproved,
          });
        }

        if (list.rrdate !== null) {
          list.rrdate = util.formatDate2({
            date: list.rrdate,
          });
        }

        if (list.expirationdate !== null) {
          list.expirationdate = util.formatDate2({
            date: list.expirationdate,
          });
        }

        if (list.podate !== null) {
          list.podate = util.formatDate2({
            date: list.podate,
          });
        }

        if (list.podateapproved !== null) {
          list.podateapproved = util.formatDate2({
            date: list.podateapproved,
          });
        }

        if (list.podatecreated !== null) {
          list.podatecreated = util.formatDate2({
            date: list.podatecreated,
          });
        }
      }
    }

    return prTracker;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getPRDeptTracker = async function (conditions, args, options, txn) {
  try {
    const prTracker = await sqlHelper.query(
      `exec UERMINV..Usp_jf_GetPurchaseRequestTracker ${args}, '', ''`,
      [],
      txn,
    );

    if (prTracker.length > 0) {
      for (const list of prTracker) {
        if (list.pR_DateTimeCreated !== null) {
          list.pR_DateTimeCreated = util.formatDate2({
            date: list.pR_DateTimeCreated,
          });
        }

        if (list.pR_DateTimeApproved !== null) {
          list.pR_DateTimeApproved = util.formatDate2({
            date: list.pR_DateTimeApproved,
          });
        }

        if (list.rrdate !== null) {
          list.rrdate = util.formatDate2({
            date: list.rrdate,
          });
        }

        if (list.expirationdate !== null) {
          list.expirationdate = util.formatDate2({
            date: list.expirationdate,
          });
        }

        if (list.podate !== null) {
          list.podate = util.formatDate2({
            date: list.podate,
          });
        }

        if (list.podateapproved !== null) {
          list.podateapproved = util.formatDate2({
            date: list.podateapproved,
          });
        }

        if (list.podatecreated !== null) {
          list.podatecreated = util.formatDate2({
            date: list.podatecreated,
          });
        }
      }
    }

    return prTracker;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectAnalytics,
  getPRWarehouseItems,
  getPRWarehouseTracker,
  getPRDeptTracker,
};

/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const purchaseRequests = require("../models/purchaseRequests.js");
const purchaseRequestItems = require("../models/purchaseRequestItems.js");
// MODELS //

// BASIC SELECT STATEMENTS //
const getPurchaseRequests = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const {
      deptCode,
      purchaseDeptCode,
      reviewerDeptCode,
      userCode,
      fromDate,
      toDate,
      viewing,
      type,
      requestClass,
      fromDepartment,
    } = req.query;
    const approver = req.query.approver === "true" ? true : false;
    const approvals = req.query.approvals === "true" ? true : false;
    const prWarehouse = req.query.prWarehouse === "true" ? true : false;

    try {
      let sqlWhere = "";
      let top = {};
      let order = "";
      if (deptCode) {
        if (approver) {
          sqlWhere = `and fromDepartment IN (${deptCode}) and convert(date, dateTimeCreated) between '${fromDate}' and '${toDate}'
             -- and type not in ('warehousepr', 'rivwarehouse')
          `;
          order =
            purchaseDeptCode !== undefined
              ? "dateTimeApproved desc"
              : "dateTimeCreated desc";
        } else if (viewing) {
          sqlWhere = `and fromDepartment = '${deptCode}'`;
          top = 10;
          order = "dateTimeCreated desc";
        } else {
          if (!deptCode.includes(",")) {
            sqlWhere = `and fromDepartment = '${deptCode}'  and convert(date,  dateTimeCreated) between '${fromDate}' and '${toDate}' 
            -- and type not in ('warehousepr', 'rivwarehouse')`;
            order =
              purchaseDeptCode !== undefined
                ? "dateTimeApproved desc"
                : "dateTimeCreated desc";
          } else {
            sqlWhere = `and fromDepartment IN (${deptCode})  and convert(date,  dateTimeCreated) between '${fromDate}' and '${toDate}'
              -- and type not in ('warehousepr', 'rivwarehouse')
            `;
            order =
              purchaseDeptCode !== undefined
                ? "dateTimeApproved desc"
                : "dateTimeCreated desc";
          }
        }
      } else if (userCode) {
        sqlWhere = `and createdBy = '${userCode}'`;
        order =
          purchaseDeptCode !== undefined
            ? "dateTimeApproved asc"
            : "dateTimeCreated asc";
      } else if (purchaseDeptCode) {
        sqlWhere = `and toDepartment IN (${purchaseDeptCode}) and status = '4' and convert(date, dateTimeApproved) between '${fromDate}' and '${toDate}'`;
        order =
          purchaseDeptCode !== undefined
            ? "dateTimeApproved asc"
            : "dateTimeCreated asc";
      } else if (reviewerDeptCode) {
        sqlWhere = `and secondaryApprovingDepartment = '${reviewerDeptCode}' and convert(date, dateTimeApproved) between '${fromDate}' and '${toDate}'`;
        order =
          purchaseDeptCode !== undefined
            ? "dateTimeApproved asc"
            : "dateTimeCreated asc";
      } else if (approvals) {
        if (requestClass === "" || requestClass === "supplies") {
          sqlWhere = `and type = '${type}' and convert(date, dateTimeCreated) between '${fromDate}' and '${toDate}'`;
        } else {
          if (requestClass === undefined) {
            sqlWhere = `and type = '${type}' and convert(date, dateTimeCreated) between '${fromDate}' and '${toDate}'`;
          } else {
            sqlWhere = `and type = '${type}' and class = '${requestClass}' and convert(date, dateTimeCreated) between '${fromDate}' and '${toDate}'`;
          }
        }

        order = "dateTimeCreated asc";
      } else if (prWarehouse) {
        sqlWhere = `and fromDepartment = '${fromDepartment}' and convert(date, dateTimeCreated) between '${fromDate}' and '${toDate}'`;
        order = "dateTimeCreated asc";
      }

      const prSelect = await purchaseRequests.selectPurchaseRequests(
        sqlWhere,
        txn,
        {
          top: top,
          order: order,
        },
      );

      if (prSelect.length > 0) {
        // prSelect.forEach(async (list) => {
        // for (const list of prSelect) {
        //   const itemCats = await purchaseRequests.selectPRItemCat(
        //     "and prCode = ?",
        //     [list.code],
        //     {},
        //   );
        //   list.newProp = "test";
        //   list.itemCategories =
        //     itemCats.length > 0
        //       ? itemCats.map((item) => item.category).join(", ")
        //       : null;
        // }
        // });

        return prSelect;
      }
      return [];
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPurchaseRequestTypes = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = "and active = 1";
      return await purchaseRequests.selectPurchaseRequestTypes(sqlWhere, txn, {
        top: {},
        order: "",
      });
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPRStatus = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = "and active = 1";
      return await purchaseRequests.selectStatus(sqlWhere, txn, {
        top: {},
        order: "",
      });
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPurchaseRequestWithPO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const deptCode = req.query.deptCode;
      const fromDate = req.query.from;
      const toDate = req.query.to;

      const args = [deptCode, fromDate, toDate];
      const conditions = `and pp.FromDepartment = ?
      and convert(date, pp.DateTimeCreated)
      between ? and ?`;
      const top = {};
      const order = "";

      return await purchaseRequests.selectPurchaseRequestsWithPO(
        conditions,
        args,
        {
          top: top,
          order: order,
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPurchaseRequestItems = async function (req, res) {
  if (util.empty(req.query.prCode)) {
    return res.status(400).json({ error: "`code` query in URL is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    const prCode = req.query.prCode;

    try {
      let sqlWhere = "";
      if (prCode) {
        sqlWhere = `and pr.code = '${prCode}'`;
      }
      return await purchaseRequestItems.selectPurchaseRequestItems(
        sqlWhere,
        txn,
        {
          top: {},
          order: "pr.dateTimeCreated desc",
        },
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPRItemHistory = async function (req, res) {
  if (util.empty(req.query.itemCode) || util.empty(req.query.deptCode)) {
    return res.status(400).json({ error: "`code` query in URL is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    const itemCode = req.query.itemCode;
    const deptCode = req.query.deptCode;

    try {
      let sqlWhere = "";
      if (itemCode) {
        sqlWhere = `and pri.itemCode = '${itemCode}' 
        and pr.fromDepartment = '${deptCode}'`;
      }
      return await purchaseRequestItems.selectPurchaseRequestItems(
        sqlWhere,
        txn,
        {
          top: 1,
          order: "pr.dateTimeCreated desc",
        },
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getWarehouseDepartmentItems = async function (req, res) {
  if (util.empty(req.query.fromDate) || util.empty(req.query.toDate)) {
    return res.status(400).json({ error: "`code` query in URL is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    const { fromDate, toDate, deptCode } = req.query;

    try {
      const sqlWhere = `and a.fromDepartment = ?
        and a.active = 1 
        and a.status <> 0 
        and type = 'stockitem' 
        and convert(date, b.dateTimeCreated) between ? 
        and ? `;

      const args = [deptCode, fromDate, toDate];

      const warehouseDeptItems =
        await purchaseRequests.selectWarehouseDepartmentItems(
          sqlWhere,
          args,
          {
            top: "",
            order: "b.itemCode, dateTimeCreated desc",
          },
          txn,
        );

      return warehouseDeptItems;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const savePurchaseRequests = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const prDetails = req.body.prDetails;
    const prItems = req.body.prItems;
    try {
      prDetails.code = await sqlHelper.generateDynamicUniqueCode(
        "UERMINV..PurchaseRequests",
        prDetails.type === "stockitem" || prDetails.type === "rivpharmacy"
          ? "IR"
          : prDetails.type === "rivwarehouse"
            ? "IR"
            : "PR",
        3,
        "code",
        false,
        txn,
      );

      const getPurchaseRequests = await purchaseRequests.selectPurchaseRequests(
        `and code = '${prDetails.code}'`,
        txn,
        {
          top: {},
          order: "",
        },
      );

      if (getPurchaseRequests.length > 0) {
        throw "Error saving request. Please try again.";
      }

      prDetails.createdBy = util.currentUserToken(req).code;
      prDetails.updatedBy = util.currentUserToken(req).code;
      const prDetailStatus = await purchaseRequests.insertPurchaseRequests(
        prDetails,
        txn,
      );
      if (Object.keys(prDetailStatus).length > 0) {
        for (const items of prItems) {
          const itemDetails = {
            prCode: prDetailStatus.code,
            itemCode: items.itemCode,
            name: items.brandName,
            description: items.genName,
            quantity: items.quantity,
            maxQuantity: items.maxRequestQty,
            others: items.itemDescription,
            unit: items.dosageForm,
            otherDescription: items.mg,
            status: 1,
          };
          await purchaseRequestItems.insertPurchaseRequestItems(
            itemDetails,
            txn,
          );
        }
      }
      return prDetailStatus;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const updatePurchaseRequest = async function (req, res) {
  if (!req.body) return res.status(400).json({ error: "Invalid Parameters" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const payload = req.body;
    const code = req.params.code;
    const details = req.body.details;
    delete req.body.details;
    delete req.body.code;
    // const employeeId = "7679"
    const employeeId = util.currentUserToken(req).code;
    if (req.body.status === 1) {
      if (req.body.rejected) {
        payload.rejectedBy = employeeId;
        payload.dateTimeRejected = await util.currentDateTime();
        delete req.body.rejected;
      }
    } else if (req.body.status === 2) {
      payload.approvedBy = employeeId;
      payload.dateTimeApproved = await util.currentDateTime();
    } else if (req.body.status === 3) {
      // RIV Items
      // Reviewed
      if (req.body.hfo) {
        payload.reviewedBy = employeeId;
        payload.dateTimeReviewed = await util.currentDateTime();
      } else {
        // if (details.class === "supplies") {
        //   payload.status = 5;
        //   payload.completedBy = employeeId;
        //   payload.dateTimeCompleted = await util.currentDateTime();
        //   payload.approvedBy = employeeId;
        //   payload.dateTimeApproved = await util.currentDateTime();
        // } else {
        //   payload.approvedBy = employeeId;
        //   payload.dateTimeApproved = await util.currentDateTime();
        // }

        // payload.approvedBy = employeeId;
        // payload.dateTimeApproved = await util.currentDateTime();

        payload.status = 5;
        payload.completedBy = employeeId;
        payload.dateTimeCompleted = await util.currentDateTime();
        payload.approvedBy = employeeId;
        payload.dateTimeApproved = await util.currentDateTime();
      }
    } else if (req.body.status === 4) {
      // Non-Stock Items or PR Items
      payload.approvedBy = employeeId;
      payload.dateTimeApproved = await util.currentDateTime();
    } else if (req.body.status === 5) {
      // For PO Processing
      if (details.type === "warehousepr") {
        payload.approvedBy = employeeId;
        payload.dateTimeApproved = await util.currentDateTime();
        payload.completedBy = employeeId;
        payload.dateTimeCompleted = await util.currentDateTime();
      } else {
        payload.completedBy = employeeId;
        payload.dateTimeCompleted = await util.currentDateTime();
      }
    } else if (req.body.status === 0 || req.body.status === 20) {
      payload.rejectedBy = employeeId;
      payload.rejectingRemarks = payload.remarks;
      payload.dateTimeRejected = await util.currentDateTime();

      await purchaseRequestItems.updatePurchaseRequestItems(
        { status: 0 },
        { prCode: code },
        txn,
      );
    }

    await purchaseRequests.insertPRApprovals(
      {
        prCode: code,
        status: req.body.status,
        initialStatus: req.body.initialStatus,
        createdBy: employeeId,
        updatedBy: employeeId,
        remarks: payload.rejectingRemarks,
      },
      txn,
    );

    delete payload.hfo;
    payload.updatedBy = employeeId;
    try {
      return await purchaseRequests.updatePurchaseRequest(
        payload,
        { code: code },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const updatePurchaseRequestItems = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });
  const returnValue = await sqlHelper.transact(async (txn) => {
    const code = req.params.code;
    delete req.body.code;
    const prInfo = req.body.prInfo;
    const itemsAdd = req.body.itemsAdd;
    const itemsDelete = req.body.itemsDelete;
    const itemsUpdate = req.body.itemsUpdate;
    try {
      let prStatus = [];
      if (Object.keys(prInfo).length > 0) {
        prStatus = await purchaseRequests.updatePurchaseRequest(
          prInfo,
          { code: code },
          txn,
        );
      }

      if (itemsAdd.length > 0) {
        for (const itemAdd of itemsAdd) {
          itemAdd.prCode = code;
          await purchaseRequestItems.insertPurchaseRequestItems(itemAdd, txn);
        }
      }

      if (itemsDelete.length > 0) {
        for (const itemDelete of itemsDelete) {
          const itemId = itemDelete.id;
          delete itemDelete.id;
          itemDelete.active = 0;
          await purchaseRequestItems.updatePurchaseRequestItems(
            itemDelete,
            { id: itemId },
            txn,
          );
        }
      }

      if (itemsUpdate.length > 0) {
        for (const itemUpdate of itemsUpdate) {
          const itemId = itemUpdate.id;
          delete itemUpdate.id;
          await purchaseRequestItems.updatePurchaseRequestItems(
            itemUpdate,
            { id: itemId },
            txn,
          );
        }
      }

      return prStatus;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const updatePurchaseRequestItem = async function (req, res) {
  if (!req.body) return res.status(400).json({ error: "Invalid Parameters" });
  const returnValue = await sqlHelper.transact(async (txn) => {
    const payload = req.body;
    const code = req.params.code;
    const itemId = req.body.id;
    delete req.body.code;
    delete req.body.id;

    payload.dateTimeRejected = await util.currentDateTime();
    payload.rejectedBy = util.currentUserToken(req).code;

    try {
      return await purchaseRequestItems.updatePurchaseRequestItems(
        payload,
        { prCode: code, id: itemId },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const replaceItem = async function (req, res) {
  if (!req.body) return res.status(400).json({ error: "Invalid Parameters" });
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;

      const employeeId = util.currentUserToken(req).code;

      let insertedItem = {};
      if (Object.keys(payload.rejectItem).length > 0) {
        const rejectInitialItemPayload = {
          status: payload.rejectItem.status,
          rejectedBy: employeeId,
          dateTimeRejected: await util.currentDateTime(),
          rejectionRemarks: `ITEM REPLACED BY ITEM CODE ${payload.insertItem.itemCode}`,
        };

        const rejectedItem =
          await purchaseRequestItems.updatePurchaseRequestItems(
            rejectInitialItemPayload,
            { prCode: payload.rejectItem.code, id: payload.rejectItem.itemId },
            txn,
          );

        if (Object.keys(rejectedItem).length > 0) {
          if (Object.keys(payload.insertItem).length > 0) {
            payload.insertItem.createdBy = employeeId;
            payload.insertItem.updatedBy = employeeId;
            payload.insertItem.rejectionRemarks = `ORIGINAL ITEM CODE IS ${payload.rejectItem.itemCode}`;
            insertedItem =
              await purchaseRequestItems.insertPurchaseRequestItems(
                payload.insertItem,
                txn,
              );
          }
        }
      }
      return insertedItem;
    } catch (error) {
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getPRStatus,
  getPurchaseRequests,
  getPurchaseRequestItems,
  getPurchaseRequestTypes,
  getPurchaseRequestWithPO,
  getPRItemHistory,
  getWarehouseDepartmentItems,
  savePurchaseRequests,
  updatePurchaseRequest,
  updatePurchaseRequestItems,
  updatePurchaseRequestItem,
  replaceItem,
};

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const analytics = require("../models/analyticsModel");
// MODELS //
const getPRWarehouseItems = async function (payload) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `
        and a.active = 1 
        and fromDepartment = '1710' 
        and convert(date, a.dateTimeCreated) between ? 
        and ? 
        and a.status = 5 
        and a.code like 'PR%'`;
      const analyticsValue = await analytics[payload.analyticsName](
        conditions,
        [payload.from, payload.to],
        {
          order: "a.dateTimeCreated, a.code asc",
          top: "",
        },
        txn,
      );
      return analyticsValue;
      // return true;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    return returnValue.error;
  }
  return returnValue;
};

const getPRWarehouseTracker = async function (payload) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = ``;

      const analyticsValue = await analytics[payload.analyticsName](
        conditions,
        [
          "1710",
          payload.from.replace(/\//g, ""),
          payload.to.replace(/\//g, ""),
        ],
        {},
        txn,
      );
      return analyticsValue;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    return returnValue.error;
  }
  return returnValue;
};

const getPRDeptTracker = async function (payload) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = ``;

      const analyticsValue = await analytics[payload.analyticsName](
        conditions,
        [
          payload.department === "5023" ? "'ALL'" : payload.department,
          payload.from.replace(/\//g, ""),
          payload.to.replace(/\//g, ""),
        ],
        {},
        txn,
      );
      return analyticsValue;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    return returnValue.error;
  }
  return returnValue;
};

module.exports = {
  getPRWarehouseItems,
  getPRWarehouseTracker,
  getPRDeptTracker,
};

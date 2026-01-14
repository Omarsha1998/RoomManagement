/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const items = require("../models/items.js");
// MODELS //

// BASIC SELECT STATEMENTS //
const getItems = async function (req, res) {
  if (util.empty(req.query.searchQuery))
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const { searchQuery, isStockItem, isMeds, isWarehouse, deptCode } =
      req.query;
    const stockItem = isStockItem === "true" ? true : false;
    const warehouse = isWarehouse === "true" ? true : false;
    const meds = isMeds === "true" ? true : false;
    try {
      let sqlWhere = "";
      const sqlTop = "";

      if (stockItem) {
        if (meds) {
          sqlWhere = `and discontinue = 0 and isException = 0 and phicGroupCode = 'MED' and isStockitem = 1 and (forDeletion <> 1 or forDeletion is null) and (
            brandName LIKE '%${searchQuery}%' OR
            genName LIKE '%${searchQuery}%' OR
            a.itemCode LIKE '%${searchQuery}%' OR 
            code LIKE '%${searchQuery}%'
          )`;
        } else if (warehouse) {
          sqlWhere = `and discontinue = 0 and isException = 0  and (forDeletion <> 1 or forDeletion is null) and (
              brandName LIKE '%${searchQuery}%' OR
              genName LIKE '%${searchQuery}%' OR
              a.itemCode LIKE '%${searchQuery}%' OR
              code LIKE '%${searchQuery}%'
            )`;
        } else {
          // and phicGroupCode <> 'MED'
          sqlWhere = `and discontinue = 0 and isException = 0 and phicGroupCode <> 'MED'  and isStockitem = 1 and (forDeletion <> 1 or forDeletion is null) and (
              brandName LIKE '%${searchQuery}%' OR
              genName LIKE '%${searchQuery}%' OR
              a.itemCode LIKE '%${searchQuery}%' OR
              code LIKE '%${searchQuery}%'
            )`;
        }
      } else {
        if (warehouse) {
          sqlWhere = `and discontinue = 0 and (forDeletion <> 1 or forDeletion is null) and (
              brandName LIKE '%${searchQuery}%' OR
              genName LIKE '%${searchQuery}%' OR
              a.itemCode LIKE '%${searchQuery}%' OR
              code LIKE '%${searchQuery}%'
            )`;
        } else {
          sqlWhere = `and discontinue = 0 and (isStockitem = 0 or isStockItem is null) and (forDeletion <> 1 or forDeletion is null) and (
            brandName LIKE '%${searchQuery}%' OR
            genName LIKE '%${searchQuery}%' OR
            a.itemCode LIKE '%${searchQuery}%' OR
            code LIKE '%${searchQuery}%'
          )`;
        }
      }

      let itemResponse = await items.selectItems(sqlWhere, txn, {
        top: sqlTop,
        order: "a.itemCode",
      });

      if (itemResponse.length === 0) {
        itemResponse = await items.selectItemExceptions(
          `and discontinue = 0 and (forDeletion <> 1 or forDeletion is null) and (
            brandName LIKE '%${searchQuery}%' OR
            genName LIKE '%${searchQuery}%' OR
            a.itemCode LIKE '%${searchQuery}%' OR 
            code LIKE '%${searchQuery}%')
            and a.departmentCode = ?
          `,
          [deptCode],
          txn,
          {
            top: "",
            order: "",
          },
        );
      }

      return itemResponse;
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

const getAllotedItems = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const searchQuery = req.query.searchQuery;
    const deptCode = req.query.deptCode;
    const isHospitalUser = req.query.isHospitalUser === "true";
    const isAsset = req.query.isAsset === "true";
    const isForSale = req.query.isForSale === "true";
    // const groupCondition = req.query.groupCondition;
    try {
      let sqlWhere = "";
      const sqlTop = "";

      if (isHospitalUser) {
        if (isAsset) {
          sqlWhere = `and phi.phicGroupCode = 'ASS' and (
            phi.brandName LIKE '%${searchQuery}%' OR
            phi.genName LIKE '%${searchQuery}%' OR
            itl.itemCode LIKE '%${searchQuery}%'
          ) 
          and phi.discontinue = 0`;
        } else if (isForSale) {
          sqlWhere = `and itl.DepartmentCode = '${deptCode}' 
          and convert(char(4),getDate(),112) >='2023'
          and phi.discontinue = 0 and phi.ForSale = 1`;
        } else {
          sqlWhere = `and itl.DepartmentCode = '${deptCode}' 
          and phi.discontinue = 0 and phi.ForSale <> 1`;
        }
      } else {
        if (isAsset) {
          sqlWhere = `and phi.phicGroupCode = 'ASS' and (
            phi.brandName LIKE '%${searchQuery}%' OR
            phi.genName LIKE '%${searchQuery}%' OR
            itl.itemCode LIKE '%${searchQuery}%'
          ) 
          and phi.discontinue = 0`;
        } else {
          sqlWhere = `and itl.dept = '${deptCode}' 
          and convert(char(4),getDate(),112) >='2023'
          and phi.discontinue = 0`;
        }
      }

      // if (searchQuery) {
      //   sqlWhere = `and discontinue = 0 and departmentCode = '${deptCode}' and (
      //       brandName LIKE '%${searchQuery}%' OR
      //       genName LIKE '%${searchQuery}%'
      //     )`;
      // } else {
      //   sqlTop = "";
      //   sqlWhere = `and discontinue = 0 and active = 1 and departmentCode = '${deptCode}'`;
      // }

      let departmentItems = [];
      if (isHospitalUser) {
        departmentItems = await items.selectAllottedItemsHospital(
          sqlWhere,
          txn,
          {
            top: sqlTop,
            order: "phi.genName, itemCode  desc",
          },
        );
      } else {
        departmentItems = await items.selectAllottedItems(sqlWhere, txn, {
          top: sqlTop,
          order: "phi.genName, itemCode  desc",
        });
      }

      // if (searchQuery) {
      //   if (departmentItems.length === 0) {
      //     sqlWhere = `and discontinue = 0 and isGeneral = 1 and (
      //     brandName LIKE '%${searchQuery}%' OR
      //     genName LIKE '%${searchQuery}%'
      //   )`;
      //     departmentItems = await items.selectItems(sqlWhere, txn, {
      //       top: sqlTop,
      //       order: "itemCode",
      //     });
      //   }
      // }
      return departmentItems;
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

const getDepartmentItems = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const searchQuery = req.query.searchQuery;
    const deptCode = req.query.deptCode;
    try {
      let sqlWhere = "";
      let sqlTop = 50;
      if (searchQuery) {
        sqlWhere = `and discontinue = 0 and departmentCode = '${deptCode}' and (
            brandName LIKE '%${searchQuery}%' OR
            genName LIKE '%${searchQuery}%'
          )`;
      } else {
        sqlTop = "";
        sqlWhere = `and discontinue = 0 and active = 1 and departmentCode = '${deptCode}'`;
      }

      let departmentItems = 0;
      departmentItems = await items.selectDepartmentItems(sqlWhere, txn, {
        top: sqlTop,
        order: "d.itemCode",
      });

      if (searchQuery) {
        if (departmentItems.length === 0) {
          sqlWhere = `and discontinue = 0 and isGeneral = 1 and (
          brandName LIKE '%${searchQuery}%' OR
          genName LIKE '%${searchQuery}%'
        )`;
          departmentItems = await items.selectItems(sqlWhere, txn, {
            top: sqlTop,
            order: "itemCode",
          });
        }
      }
      return departmentItems;
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

const getReorderPointItems = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const deptCode = req.query.deptCode;
    try {
      return await items.selectReorderItems("", deptCode, txn);
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

const getItemStockRooms = async function (req, res) {
  if (util.empty(req.query.itemCode))
    return res.status(400).json({ error: "Invalid parameter." });
  const returnValue = await sqlHelper.transact(async (txn) => {
    // const { searchQuery, isStockItem, isMeds } = req.query;
    try {
      const sqlWhere = "and active = ? and itemCode = ?";
      const sqlTop = "";
      const args = [1, req.query.itemCode];

      return await items.selectItemStockRooms(sqlWhere, args, txn, {
        top: sqlTop,
        order: "itemCode",
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

const getAllItems = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // const { searchQuery, isStockItem, isMeds } = req.query;
    try {
      const sqlWhere = "and discontinue = ?";
      const sqlTop = "";
      const args = [0];

      return await items.selectAllItems(sqlWhere, args, txn, {
        top: sqlTop,
        order: "itemCode",
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

const getItemCategories = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // const { searchQuery, isStockItem, isMeds } = req.query;
    const { all } = req.query;
    try {
      let sqlWhere =
        "and active = ? and code is not null and inventoriable = ? and parentCode is null and categoryCode is not null";
      const sqlTop = "";
      let args = [1, 1];

      if (all) {
        sqlWhere =
          "and active = ? and code is not null and categoryCode is not null";
        args = [1];
      }

      return await items.selectCategories(sqlWhere, args, txn, {
        top: sqlTop,
        order: "code",
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

const getItemSubcategories = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // const { searchQuery, isStockItem, isMeds } = req.query;
    try {
      const sqlWhere = "and active = ?";
      const sqlTop = "";
      const args = [1];

      return await items.selectSubcategories(sqlWhere, args, txn, {
        top: sqlTop,
        order: "name, code",
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

const insertDepartmentItems = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const itemDetails = req.body;
    try {
      let itemStatus = "";
      if (util.isObj(itemDetails)) {
        itemDetails.createdBy = util.currentUserToken(req).code;
        itemDetails.updatedBy = util.currentUserToken(req).code;
        itemStatus = await items.insertDepartmentItems(itemDetails, txn);
      } else {
        for (const item of itemDetails) {
          item.createdBy = util.currentUserToken(req).code;
          item.updatedBy = util.currentUserToken(req).code;
          itemStatus = await items.insertDepartmentItems(item, txn);
        }
      }
      return itemStatus;
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

const insertDepartmentItemsTest = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const sqlWhere = `and
          convert(char(4),TIMESTAMP,112) >='2023'
          and TRANSCODE in('CHARGING','ALLOTMENT')
          and phi.discontinue = 0`;

    const itemDetails = await items.selectAllottedItems(sqlWhere, txn, {
      top: "",
      order: "",
    });

    let itemStatus = "";
    if (itemDetails.length > 0) {
      for (const item of itemDetails) {
        const payload = {
          itemCode: item.itemCode,
          departmentCode: item.dept,
          type: "hos",
        };
        itemStatus = await items.insertDepartmentItems(payload, txn);
      }
    }

    return itemStatus;
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const updateDepartmentItems = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const itemDetails = req.body;
    try {
      let itemStatus = "";
      if (util.isObj(itemDetails)) {
        const code = itemDetails.id;
        delete itemDetails.id;
        itemDetails.updatedBy = util.currentUserToken(req).code;
        itemStatus = await items.updateDepartmentItems(
          itemDetails,
          { id: code },
          txn,
        );
      } else {
        for (const item of itemDetails) {
          item.updatedBy = util.currentUserToken(req).code;
          const code = item.id;
          delete item.id;
          itemStatus = await items.updateItems(item, { itemCode: code }, txn);
        }
      }
      return itemStatus;
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

const updateItems = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const itemDetails = req.body;
    try {
      let itemStatus = "";
      if (util.isObj(itemDetails)) {
        const code = itemDetails.itemCode;
        delete itemDetails.itemCode;
        itemStatus = await items.updateItems(
          itemDetails,
          { itemCode: code },
          txn,
        );
      } else {
        for (const item of itemDetails) {
          item.updatedBy = util.currentUserToken(req).code;
          const itemCode = item.itemCode;
          delete item.itemCode;
          itemStatus = await items.updateItems(
            item,
            { itemCode: itemCode },
            txn,
          );
        }
      }

      // if (util.isObj(itemDetails)) {
      //   itemDetails.createdBy = util.currentUserToken(req).code;
      //   itemDetails.updatedBy = util.currentUserToken(req).code;
      //   itemStatus = await items.insertDepartmentItems(itemDetails, txn);
      // } else {
      //   for (var item of itemDetails) {
      //     item.createdBy = util.currentUserToken(req).code;
      //     item.updatedBy = util.currentUserToken(req).code;
      //     itemStatus = await items.insertDepartmentItems(item, txn);
      //   }
      // }

      return itemStatus;
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

const putItem = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const itemDetails = req.body;
    try {
      const itemCode = itemDetails.itemCode;
      delete itemDetails.itemCode;
      itemDetails.updatedBy = util.currentUserToken(req).code;
      return await items.updateItems(itemDetails, { itemCode: itemCode }, txn);
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

const putSubcategories = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const subCategories = req.body;
    try {
      const toUpdate = [];
      if (subCategories.toUpdate.length > 0) {
        for (const list of subCategories.toUpdate) {
          const toUpdateStatus = await items.updateSubCategories(
            {
              code: list.code,
              name: list.name,
              updatedBy: util.currentUserToken(req).code,
            },
            {
              id: list.id,
            },
            txn,
          );

          toUpdate.push(toUpdateStatus);
        }
      }

      const toDelete = [];
      if (subCategories.toDelete.length > 0) {
        for (const list of subCategories.toDelete) {
          const toDeleteStatus = await items.updateSubCategories(
            {
              active: 0,
              updatedBy: util.currentUserToken(req).code,
            },
            {
              id: list.id,
            },
            txn,
          );
          toDelete.push(toDeleteStatus);
        }
      }
      return {
        updated: toUpdate,
        deleted: toDelete,
      };
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

const postSubcategories = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const bodyDetails = req.body;
    try {
      let itemStatus = "";
      if (util.isObj(bodyDetails)) {
        bodyDetails.createdBy = util.currentUserToken(req).code;
        bodyDetails.updatedBy = util.currentUserToken(req).code;
        itemStatus = await items.insetSubCategories(bodyDetails, txn);
      } else {
        for (const item of bodyDetails) {
          item.createdBy = util.currentUserToken(req).code;
          item.updatedBy = util.currentUserToken(req).code;
          itemStatus = await items.insetSubCategories(item, txn);
        }
      }
      return itemStatus;
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

const postItemSubcategories = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const bodyDetails = req.body;
    try {
      const checkLastItems = await sqlHelper.query(
        `select 
          RIGHT(max(code), 3) suffixCode
        from UERMMMC..phar_items 
        where InternalCategoryCode = ? and ActionCategoryCode = ?`,
        [bodyDetails[0].category, bodyDetails[0].subCategory],
        txn,
      );

      let suffixCode = 1;
      if (checkLastItems[0].suffixCode !== null) {
        suffixCode = Number(checkLastItems[0].suffixCode) + 1;
      }

      const finalOutput = [];
      for (const list of bodyDetails) {
        const codeSuffix = suffixCode++;
        list.suffixCode = util.padValueWithLength(codeSuffix, "0", 5);
        list.subCategory = util.padValueWithLength(list.subCategory, "0", 3);
        list.code = `${list.category}${list.subCategory}${list.suffixCode}`;
        const updateStatus = await items.updateItems(
          {
            code: list.code,
            internalCategoryCode: list.category,
            actionCategoryCode: list.subCategory,
            updatedBy: util.currentUserToken(req).code,
          },
          { itemCode: list.itemCode },
          txn,
        );

        finalOutput.push(updateStatus);
      }

      return finalOutput;
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

const postItem = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const itemDetails = req.body;
    try {
      const checkLastItems = await sqlHelper.query(
        `select 
          RIGHT(max(code), 3) suffixCode
        from UERMMMC..phar_items 
        where InternalCategoryCode = ? and ActionCategoryCode = ?`,
        [itemDetails.internalCategoryCode, itemDetails.actionCategoryCode],
        txn,
      );

      let suffixCode = 1;
      if (checkLastItems[0].suffixCode !== null) {
        suffixCode = Number(checkLastItems[0].suffixCode) + 1;
      }

      const codeSuffix = suffixCode++;
      const lastNumber = util.padValueWithLength(codeSuffix, "0", 5);
      const subCat = util.padValueWithLength(
        itemDetails.actionCategoryCode,
        "0",
        3,
      );
      itemDetails.code = `${itemDetails.internalCategoryCode}${subCat}${lastNumber}`;
      itemDetails.itemCode = itemDetails.code;
      itemDetails.UserName = util.currentUserToken(req).code;
      return await items.insertItems(itemDetails, txn);
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

module.exports = {
  getItems,
  getAllItems,
  getAllotedItems,
  getDepartmentItems,
  getReorderPointItems,
  getItemCategories,
  getItemSubcategories,
  getItemStockRooms,
  insertDepartmentItems,
  insertDepartmentItemsTest,
  updateDepartmentItems,
  updateItems,
  putItem,
  putSubcategories,
  postSubcategories,
  postItemSubcategories,
  postItem,
};

/* eslint-disable no-unused-vars */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectItems = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        code newItemCode,
        a.itemCode,
        brandName,
        mg,
        genName,
        dosageForm,
        ucost,
        unitPricePerPc,
        phicCatCode,
        phicGroupCode,
        isGeneral,
        discontinue
      FROM UERMMMC..PHAR_ITEMS a
      WHERE 1=1  ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectAllItems = async function (conditions, args, txn, options) {
  const allItems = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        code,
        itemCode,
        brandName,
        mg,
        genName,
        dosageForm,
        ucost,
        unitPricePerPc,
        phicCatCode,
        phicGroupCode,
        isGeneral,
        discontinue,
        isStockItem,
        internalCategoryCode,
        actionCategoryCode,
        assigned,
        alternativeOfItemCode,
        forDeletion,
        updatedBy,
        dateTimeUpdated
      FROM UERMMMC..PHAR_ITEMS
      WHERE 1=1  ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (allItems.length > 0) {
    for (const list of allItems) {
      if (list.internalCategoryCode !== null) {
        list.internalCategoryCode = list.internalCategoryCode.toString();
      }

      if (list.actionCategoryCode !== null) {
        list.actionCategoryCode = list.actionCategoryCode.toString();
      }
    }
  }

  return allItems;
};

const selectAllottedItemsHospital = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select distinct 
      itl.itemCode,
      genName,
      phi.brandName,
      mg,
      dosageForm,
      ucost,
      unitPricePerPc,
      phicCatCode,
      phicGroupCode,
      isGeneral,
      discontinue
      from UERMINV..DepartmentItems itl
    --join UERMMMC..PHAR_ITEMS phi on itl.ITEMCODE = phi.ItemCode
    --join UERMMMC..SECTIONS s on itl.departmentCode = s.code
    join UERMMMC..PHAR_ITEMS phi on convert(varchar, itl.ITEMCODE) collate SQL_Latin1_General_CP1_CI_AS = phi.ItemCode
    join UERMMMC..SECTIONS s on   convert(varchar, itl.departmentCode) collate SQL_Latin1_General_CP1_CI_AS = s.code
    where 1=1 
    ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    [],
    txn,
  );
};

const selectAllottedItems = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select distinct 
      itl.itemCode,
      genName,
      phi.brandName,
      mg,
      dosageForm,
      ucost,
      unitPricePerPc,
      phicCatCode,
      phicGroupCode,
      isGeneral,
      discontinue
    from UERMMMC..INV_ITEMS_LOG itl
    join UERMMMC..PHAR_ITEMS phi on itl.ITEMCODE = phi.ItemCode
    join UERMMMC..SECTIONS s on itl.dept = s.code
    where 1=1 
    ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    [],
    txn,
  );
};

const selectDepartmentItems = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        d.id,
        d.itemCode,
        d.departmentCode,
        brandName,
        mg,
        genName,
        dosageForm,
        ucost,
        unitPricePerPc,
        phicCatCode,
        phicGroupCode,
        discontinue
      FROM UERMINV..DepartmentItems d
      join UERMMMC..PHAR_ITEMS p on p.itemCode = d.itemCode
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectReorderItems = async function (conditions, args, txn, options) {
  const reorderPointItems = await sqlHelper.query(
    `exec UERMINV..Usp_jf_GetReorderPoint ${args}, '', '', 'FORORDER'`,
    [],
    txn,
  );

  if (reorderPointItems.length > 0) {
    for (const list of reorderPointItems) {
      list.categoryDesc =
        list.categoryDesc === null ? "NO CATEGORY" : list.categoryDesc;
      list.subCategoryDesc =
        list.subCategoryDesc === null ? "NO CATEGORY" : list.subCategoryDesc;
      // list.brandName = list.description;
      // list.genName = list.genName;
      list.dosageForm = list.uOM;
      list.itemCode = list.itemcode;
      list.code = list.itemcode;
      list.unitPricePerPc = "";
      list.mg = list.dosage;
      list.quantity = list.qTYToOrder;
      list.itemDescription = "";
    }
  }
  // console.log(reorderPointItems);
  return reorderPointItems;
};

const selectCategories = async function (conditions, args, txn, options) {
  const categories = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        id,
        categoryCode code,
        description,
        active,
        createdBy,
        updatedBy,
        dateTimeCreated,
        dateTimeUpdated
      FROM UERMINV..ItemCategory
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (categories.length > 0) {
    for (const list of categories) {
      list.code = list.code.toString();
    }
  }

  return categories;
};

const selectSubcategories = async function (conditions, args, txn, options) {
  const subCategories = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        id,
        code,
        categoryCode,
        name,
        description,
        groupTitle,
        active,
        createdBy,
        updatedBy,
        dateTimeCreated,
        dateTimeUpdated
      FROM UERMINV..ItemSubcategories
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (subCategories.length > 0) {
    for (const list of subCategories) {
      list.code = list.code.toString();

      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
        withDayNameWithTime: true,
      });

      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
        withDayNameWithTime: true,
      });
    }
  }

  return subCategories;
};

const selectItemStockRooms = async function (conditions, args, txn, options) {
  const itemStocks = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        id,
        itemCode,
        departmentCode,
        active,
        dateTimeCreated,
        dateTimeUpdated
      FROM UERMINV..ItemStockRooms
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (itemStocks.length > 0) {
    for (const list of itemStocks) {
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
        withDayNameWithTime: true,
      });

      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
        withDayNameWithTime: true,
      });
    }
  }

  return itemStocks;
};

const selectItemExceptions = async function (conditions, args, txn, options) {
  const itemStocks = await sqlHelper.query(
    `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.id,
        b.code newItemCode,
        a.itemCode,
        a.departmentCode,
		    b.brandName,
        b.mg,
        b.genName,
        b.dosageForm,
        b.ucost,
        b.unitPricePerPc,
        b.phicCatCode,
        b.phicGroupCode,
        b.isGeneral,
        b.discontinue,
        a.active,
        1 as 'narcotics'
      FROM UERMINV..ItemExceptions a
	    join UERMMMC..Phar_Items b on b.itemCode = a.itemCode collate LATIN1_GENERAL_CI_AS
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );

  if (itemStocks.length > 0) {
    for (const list of itemStocks) {
      list.dateTimeCreated = util.formatDate2({
        date: list.dateTimeCreated,
        withDayNameWithTime: true,
      });

      list.dateTimeUpdated = util.formatDate2({
        date: list.dateTimeUpdated,
        withDayNameWithTime: true,
      });
    }
  }

  return itemStocks;
};

const insertDepartmentItems = async function (payload, txn) {
  return await sqlHelper.insert("UERMINV..DepartmentItems", payload, txn);
};

const updateItems = async function (payload, condition, txn) {
  return await sqlHelper.update(
    "UERMMMC..PHAR_ITEMS",
    payload,
    condition,
    txn,
    "dateTimeUpdated",
  );
};

const insertItems = async function (payload, txn) {
  return await sqlHelper.insert(
    "UERMMMC..PHAR_ITEMS",
    payload,
    txn,
    "lastDateTimeUpdated",
  );
};

const insetSubCategories = async function (payload, txn) {
  return await sqlHelper.insert("UERMINV..ItemSubCategories", payload, txn);
};

const updateSubCategories = async function (payload, condition, txn) {
  return await sqlHelper.update(
    "UERMINV..ItemSubCategories",
    payload,
    condition,
    txn,
    "dateTimeUpdated",
  );
};

const updateDepartmentItems = async function (payload, condition, txn) {
  return await sqlHelper.update(
    "UERMMMC..DepartmentItems",
    payload,
    condition,
    txn,
  );
};

module.exports = {
  selectItems,
  selectAllItems,
  selectAllottedItems,
  selectAllottedItemsHospital,
  selectReorderItems,
  selectCategories,
  selectSubcategories,
  selectItemStockRooms,
  selectItemExceptions,
  updateItems,
  selectDepartmentItems,
  insertDepartmentItems,
  insetSubCategories,
  insertItems,
  updateDepartmentItems,
  updateSubCategories,
};

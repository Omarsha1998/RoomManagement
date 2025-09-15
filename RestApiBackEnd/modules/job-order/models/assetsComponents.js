const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const selectAllParts = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      asstCompo.assetCode componentAssetCode,
      asstCompo.code componentCode,
      asstCompo.genericName componentGenericName,
      asstCompo.unitCost,
      asstCompo.active,
      asstCompo.brandName componentBrandName,
      asstCompo.accountableEmployee,
      asstCompo.dateReceived dateReceived,
      asstCompo.discount,
      asstCompo.originId,
      asstCompo.receivingReportNo,
      asstCompo.netCost,
      asstCompo.serialNo,
      asstCompo.remarks,
      asstCompo.donor,
      asstCompo.donationNo,
      asstCompo.itemCode,
      asstCompo.model,
      asstCompo.location,
      asstCompo.categoryId,
      asstCompo.supplier,
      asstCompo.assetCode,
      asstCompo.quantity,
      asstCompo.transferFormNo,
      asstCompo.administrator,
      asstCompo.transferStatus,
      asstCompo.specifications,
      asstCompo.assetTagStatus,
      asstCompo.receivingDepartment,
      asstCompo.transferredDepartment,
      asstCompo.internalAssetCode,
      asstCompo.transferingAssetCode,
      asstCompo.condemnReStatus,
      asstCompo.transferReStatus,
      asstCompo.araForm,
      asstCompo.accountingRefNo,
      asstCompo.capitalized,
      asstCompo.itAssetCode,
      asstCompo.transferRequestedDate,
      asstCompo.condemnRequestedDate,
      asstCompo.accountableEmployee as accountableEmployeeParts,
      asstCompo.outcome,
      asstCompo.releasedDate,
      asstCompo.condemRemarks,
      asstCompo.equipmentType,
      asstCompo.PreviousInternalAssetCode,
      asstCompo.totalSets,
        CASE 
          WHEN asstCompo.totalSets IS NULL OR asstCompo.totalSets = '' THEN asstCompo.itAssetCode
          WHEN asstCompo.itAssetCode IS NULL OR asstCompo.itAssetCode = '' THEN ''
          WHEN asstCompo.totalSets = 1 AND CHARINDEX('-', REVERSE(asstCompo.itAssetCode)) > 0 THEN
        CASE 
          WHEN RIGHT(asstCompo.itAssetCode, 2) LIKE '-%' THEN 
                LEFT(asstCompo.itAssetCode, LEN(asstCompo.itAssetCode) - CHARINDEX('-', REVERSE(asstCompo.itAssetCode)))
            ELSE asstCompo.itAssetCode
        END
    ELSE CONCAT(asstCompo.itAssetCode, '/', asstCompo.totalSets)
END AS itAssetCodeConcat
		from UERMINV..AssetsComponents asstCompo 
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};
const selectAssignedComponents = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			asst.code,
      --asst.itemCode,
      asst.categoryId,
     --asst.dateReceived,
      asst.genericName,
asstCompo.assetCode componentAssetCode,
      asstCompo.code componentCode,
      asstCompo.genericName componentGenericName,
      asstCompo.receivingDepartment,
      --asst.receivingDepartment,
      --asst.remarks,
      asst.supplierId,
      asst.poNumber,
      asst.invoiceNumber,
      asst.brandName,
      --asst.model,
      asst.serialNumber,
      asst.condemRemarks,
      --asst.specifications,
      asst.unitCost,
      asst.status,
      
      asst.oldAssetCode, 
      asst.location,
      asst.transferredDepartment,
      asstCompo.active,
      asstCompo.brandName componentBrandName,
      asstCompo.remarks componentDescription,
      asstCompo.warrantyDate,
      asstCompo.dateReceived dateReceived,
      asstCompo.discount,
      asstCompo.originId,
      asstCompo.receivingReportNo,
      asstCompo.netCost,
      asstCompo.unitCost as compoUnitCost,
        asstCompo.TotalSets,
      asstCompo.itAssetCode as compoitAssetCode,
    -- Concat(asstCompo.itAssetCode,'/', asstCompo.TotalSets) AS itAssetCodeConcat,
      asstCompo.serialNo,
      asstCompo.specifications,
      asstCompo.supplier,
      asstCompo.assetCode,
      asstCompo.categoryId as partsCatId,
      asstCompo.quantity,
      asstCompo.transferFormNo,
      asstCompo.administrator,
      asstCompo.transferStatus,
      asstCompo.transferReStatus,
      asstCompo.assetTagStatus,
      asstCompo.remarks,
        asstCompo.donationNo,
          asstCompo.donor,
      asstCompo.itemCode,
      asstCompo.model,
      asstCompo.internalAssetCode,
      asstCompo.itAssetCode,
      asstCompo.condemnRequestedDate,
      asstCompo.movedAssetCode,
         asstCompo.capitalized,
      asstCompo.condemRemarks,
      asstCompo.condemnReStatus,
      asst.condemRemarks,
       asst.createdBy,
       asst.updatedBy,
       asst.dateTimeCreated,
        asst.dateTimeUpdated,
          CASE 
    WHEN asstCompo.totalSets IS NULL OR asstCompo.totalSets = '' THEN asstCompo.itAssetCode
    WHEN asstCompo.itAssetCode IS NULL OR asstCompo.itAssetCode = '' THEN ''
    
    -- If totalSets = 1, check for "-X" pattern and remove only that part
    WHEN asstCompo.totalSets = 1 AND CHARINDEX('-', REVERSE(asstCompo.itAssetCode)) > 0 THEN
        CASE 
            -- Ensure it only removes the "-X" and doesn't affect valid parts like "20230705"
            WHEN RIGHT(asstCompo.itAssetCode, 2) LIKE '-%' THEN 
                LEFT(asstCompo.itAssetCode, LEN(asstCompo.itAssetCode) - CHARINDEX('-', REVERSE(asstCompo.itAssetCode)))
            ELSE asstCompo.itAssetCode
        END
        
    -- If totalSets > 1, concatenate the totalSets
    ELSE CONCAT(asstCompo.itAssetCode, '/', asstCompo.totalSets)
END AS itAssetCodeConcat
		from UERMINV..Assets asst
    left join UERMINV..AssetsComponents asstCompo on asst.code = asstCompo.internalAssetCode 
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const selectAllPartsDeCondemDepart = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
		
asstCompo.assetCode componentAssetCode,
      asstCompo.code ,
      asstCompo.genericName componentGenericName,
    asstCompo.unitCost,
      asstCompo.active,
      asstCompo.brandName componentBrandName,
      asstCompo.remarks componentDescription,
      asstCompo.dateReceived dateReceived,
      asstCompo.discount,
      asstCompo.originId,
      asstCompo.receivingReportNo,
      asstCompo.netCost,
      asstCompo.serialNo,
      asstCompo.remarks,
      asstCompo.itemCode,
      asstCompo.model,
      asstCompo.categoryId,
      asstCompo.supplier,
      asstCompo.assetCode,
      asstCompo.quantity,
      asstCompo.transferFormNo,
      asstCompo.administrator,
      asstCompo.transferStatus,
      asstCompo.specifications,
      asstCompo.assetTagStatus,
      asstCompo.receivingDepartment,
      asstCompo.transferredDepartment,
      asstCompo.internalAssetCode,
      asstCompo.transferingAssetCode,
      --asstCompo.condemnReStatus,
      asstCompo.transferReStatus,
      asstCompo.araForm,
      asstCompo.accountingRefNo,
      asstCompo.capitalized,
      asstCompo.itAssetCode,
      asstCompo.transferRequestedDate,
      asstCompo.condemnRequestedDate,
      asstCompo.movedAssetCode,
      asstCompo.outcome,
      asstCompo.releasedDate,
      asstCompo.condemRemarks,
      condemLog.AssetCode,
      --condemLog.AraFormNo,
      condemLog.CondemnStatus,
  
      condemLog.RequestedDepartment,
      condemLog.Outcome,
      condemLog.ReleasedDate,
      condemLog.AraForm,
      condemLog.CondemRequestedDate,
      condemLog.CondemReStatus,
      condemLog.InternalAssetCode,
      condemLog.ComponentCode ,
      condemLog.GenericName,
      condemLog.Type,
      condemLog.DateTimeCreated,
      condemLog.PreApproved
  
		from UERMINV..AssetsComponents asstCompo 
    left join UERMINV..CondemnationHistory condemLog on asstCompo.code = condemLog.componentCode 


		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const selectInactiveComponents = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      asstCompo.code componentCode,
      asstCompo.assetCode componentAssetCode,
      asstCompo.genericName componentGenericName,
      asstCompo.active,
      asstCompo.receivingDepartment,
       asstCompo.brandName componentBrandName,
        asstCompo.internalAssetCode
		from UERMINV..AssetsComponents asstCompo 
	where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const selectITAssetCodeExistence = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        asstCompo.itAssetCode

		from UERMINV..AssetsComponents asstCompo 
	where 1=1 ${conditions}
union
select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      asset.itAssetCode
          --         Concat(asset.ItAssetCode,'/',asset.TotalSets) AS itAssetCodeConcat,
		from UERMINV..Assets asset 
	where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const insertAssetsComponents = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..AssetsComponents", payload, txn);
  } catch (error) {
    return error;
  }
};

const updateAssetsComponents = async function (payload, condition, txn) {
  try {
    return await sqlHelper.updateMany(
      "UERMINV..AssetsComponents",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return error;
  }
};

module.exports = {
  selectAssignedComponents,
  selectInactiveComponents,
  insertAssetsComponents,
  updateAssetsComponents,
  selectAllParts,
  selectITAssetCodeExistence,
  selectAllPartsDeCondemDepart,
};

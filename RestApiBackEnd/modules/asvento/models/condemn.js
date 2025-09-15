const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
// const { query } = require("express");

const selectAssetsCondemn = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			code,
      --assetCode,
      receivingReportNo,
      netCost,
      discount,
      countedBy,
      accountingAssetCode,
      oldAssetCode,
      receivingDepartment,
      itemCode,
      categoryId,
      dateReceived,
      supplierId,
      originId,
    --poNumber,
      invoiceNumber,
      genericName,
      brandName,
      model,
      serialNumber,
    specifications,
      unitCost,
      status,
      location,
      transferredDepartment,
      createdBy,
      updatedBy,
      dateTimeCreated,
      dateTimeUpdated,
      remarks,
      assetTagStatus,/
      accountingRefNo,
      itAssetCode,
      active,
      quantity,
      administrator,
      transferStatus,
      transferFormNo,
      condemnStatus,
      donor,
      capitalized
    
      -- auditedBy
      -- releasedDate
   -- outcome
      
		from UERMINV..Assets
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};
const selectCondemHistory = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      [Id]
      ,[Code]
      ,[AssetCode]
      ,[AraForm]
      ,[CondemnStatus]
      ,[Active]
      ,[RequestedDepartment]
      ,[Outcome]
      ,[ReleasedDate]
      ,[AuditedBy]
      ,[CondemRequestedDate]
      ,[CreatedBy]
      ,[DateTimeCreated]
      ,[UpdatedBy]
      ,[DateTimeUpdated]
      ,[CondemReStatus]
      ,[InternalAssetCode]
      ,[ComponentCode]
      ,[Type]
      ,[GenericName]
      ,[Remarks]
      ,[PreApproved]
    from [UERMINV].[dbo].[CondemnationHistory]
    where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};
module.exports = {
  selectAssetsCondemn,
  selectCondemHistory,
};

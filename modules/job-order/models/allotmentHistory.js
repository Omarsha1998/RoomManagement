const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getApprovedAssetTransferHistory = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
	asst.code,
      asst.genericName, 
      asst.receivingDepartment,
      asst.condemRemarks,
      asst.oldAssetCode, 
      asst.transferredDepartment,
		  transferStatus.[Id]
      ,transferStatus.[Code]
      ,transferStatus.[FromDeptCode]
      ,transferStatus.[ToDeptCode]
      ,transferStatus.[AssetCode]
      ,transferStatus.[TranferringAssetCode]
      ,transferStatus.[TransferFormNo]
      ,transferStatus.[DateTimeCreated]
      ,transferStatus.[DateTimeUpdated]
      ,transferStatus.[CreatedBy]
      ,transferStatus.[UpdatedBy]
      ,transferStatus.[Remarks]
      ,transferStatus.[TransferStatus]
      ,transferStatus.[CancelStatus]
      ,transferStatus.[Type]
      ,transferStatus.[TransferReStatus]
      ,transferStatus.[InternalAssetCode]
      ,transferStatus.[TransferringRequestedDate]
      ,transferStatus.[ComponentCode]
		from UERMINV..Assets asst
     join [UERMINV].[dbo].[AssetAllotmentHistory] transferStatus on asst.code = transferStatus.internalAssetCode 
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const getTransferActivityLogs = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
	
      transferStatus.[TransferFormNo]
	  , transferStatus.DateTimeCreated
     , transferStatus.TransferReStatus
	  , transferStatus.FromDeptCode
	   , transferStatus.ToDeptCode
		from UERMINV..Assets asst
   inner  join [UERMINV].[dbo].[AssetAllotmentHistory] transferStatus on asst.code = transferStatus.internalAssetCode 
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const getPartsTransferActivityLogs = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
	
      transferStatus.[TransferFormNo]
	  , transferStatus.DateTimeCreated
     , transferStatus.TransferReStatus
	  , transferStatus.FromDeptCode
	   , transferStatus.ToDeptCode
		from UERMINV..AssetsComponents asst
    inner join [UERMINV].[dbo].[AssetAllotmentHistory] transferStatus on asst.code = transferStatus.componentCode 
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const getApprovedPartsTransferHistory = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
	asstCompo.assetCode componentAssetCode,
      asstCompo.code ,
      asstCompo.genericName componentGenericName,
      asstCompo.receivingDepartment,
      asstCompo.active,
      asstCompo.brandName componentBrandName,
      asstCompo.remarks componentDescription,
      asstCompo.warrantyDate,
      asstCompo.dateReceived dateReceived,
      asstCompo.discount,
      asstCompo.originId,
      asstCompo.receivingReportNo,
      asstCompo.netCost,
      asstCompo.itAssetCode  compoitAssetCode,
      asstCompo.serialNo,
      asstCompo.specifications,
      asstCompo.supplier,
      asstCompo.assetCode,
      asstCompo.quantity,
      asstCompo.administrator,
      asstCompo.assetTagStatus,
      asstCompo.remarks,
        asstCompo.donationNo,
          asstCompo.donor,
      asstCompo.itemCode,
      asstCompo.model,
      asstCompo.internalAssetCode,
      asstCompo.itAssetCode,
      asstCompo.movedAssetCode,
         asstCompo.capitalized,
		transferStatus.[Id]
      ,transferStatus.[Code]
      ,transferStatus.fromDeptCode
      ,transferStatus.[ToDeptCode]
      ,transferStatus.[AssetCode]
      ,transferStatus.[TranferringAssetCode]
      ,transferStatus.[TransferFormNo]
      ,transferStatus.[DateTimeCreated]
      ,transferStatus.[DateTimeUpdated]
      ,transferStatus.[CreatedBy]
      ,transferStatus.[UpdatedBy]
      ,transferStatus.[Remarks]
      ,transferStatus.[TransferStatus]
      ,transferStatus.[CancelStatus]
      ,transferStatus.[Type]
      ,transferStatus.[TransferReStatus]
      ,transferStatus.[InternalAssetCode]
      ,transferStatus.[TransferringRequestedDate]
      ,transferStatus.[ComponentCode]
		from UERMINV..AssetsComponents asstCompo
     join [UERMINV].[dbo].[AssetAllotmentHistory] transferStatus on asstCompo.code = transferStatus.ComponentCode 
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectTransferHistory = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			[Id]
      ,[Code]
      ,[FromDeptCode]
      ,[ToDeptCode]
      ,[Active]
      ,[DateTimeCreated]
      ,[DateTimeUpdated]
      ,[CreatedBy]
      ,[UpdatedBy]
      ,[Remarks]
      ,[TransferFormNo]
      ,[AssetCode]
      ,[TransferStatus]
      ,[CancelStatus]
      ,[Type]
      ,[TransferReStatus]
      ,[GenericName]
      ,[InternalAssetCode]
      ,[TransferringRequestedDate]
   ,[TranferringAssetCode]
   ,[ComponentCode]
  
		from [UERMINV].[dbo].[AssetAllotmentHistory]
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

const selectMaxTransferFormNo = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `select
    ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      MAX([TransferFormNo]) AS MaxTransferFormNo
		from [UERMINV].[dbo].[AssetAllotmentHistory]
		where 1=1 ${conditions}

      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

module.exports = {
  selectTransferHistory,
  selectMaxTransferFormNo,
  selectCondemHistory,
  getApprovedAssetTransferHistory,
  getApprovedPartsTransferHistory,

  getTransferActivityLogs,
  getPartsTransferActivityLogs,
};

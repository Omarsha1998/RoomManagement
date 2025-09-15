const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPartStatus = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ID
      ,PART
      ,DELETED
      ,DELETED_BY
      ,DATE_DELETED
      ,CreatedBy
      ,DateCreated
      ,LAST_UPDATE

      
		  FROM [ITMgt].[dbo].[PartStatus]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};
const selectPartId = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ID
      ,STATUS
      ,DELETED
     

      
		  FROM [ITMgt].[dbo].[JOStatus]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};
const updateAssetsOne = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update("UERMINV..Assets", payload, condition, txn);
  } catch (error) {
    return error;
  }
};
const updateConcern = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMINV..JoDepartmentConcern",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return error;
  }
};
const selectJobOrders = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      [ID]
      ,jonum
      ,request
      ,department
      ,complaint
      ,technician
      ,accepted
      ,completed
      ,date_completed
      ,status
      ,remarks
      ,canceled
      ,canceled_by
      ,createdby
      ,dateTimeCreated
      ,urgent
      ,part
      ,acknowledged_by
      ,scheduledCheckup
      jOProgress

      
		  FROM [ITMgt].[dbo].[JobOrder]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};
const selectActiveMedicalEquipment = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      asset.code as assetCode
      ,asset.receivingReportNo
     , asset.postTransferAssetCode
      ,asset.netCost
     , asset.discount
      , asset.dateTimeCreated
       , asset.totalSets
,asset.serviceType as AssetServiceType
,asset.serviceAction as AssetServiceAction
,asset.maintenanceCycle as AssetMaintenanceCycle
     , asset.accountingAssetCode
      ,asset.oldAssetCode
     , asset.receivingDepartment
     , asset.itemCode
     , asset.categoryId
     , asset.dateReceived
     ,asset.warrantyDate
 ,asset.isMaintenanceReassigned
    ,  asset.originId
    ,  asset.invoiceNumber
     , asset.genericName
     , asset.brandName
     , asset.model
    ,  asset.serialNumber
    ,asset.specifications
     , asset.unitCost
  , asset.supplierId
   ,   asset.location
      ,jo.jOProgress
      ,jo.Code
      ,jo.JobOrderNumber
      ,jo.ServiceActionCode
      ,jo.EquipmentType
      ,jo.InternalAssetCode
      ,jo.ComponentAssetCode
      ,jo.ServiceType
      ,jo.PriorityLevel
      ,jo.MaintenanceCycle
      ,jo.JobOrderConcern
      ,jo.RequestedBy
      ,jo.RequestedDate
      ,jo.JOAcceptedDate
      ,jo.JOCompletedDate
      ,jo.Assessor
      ,jo.Remarks
      ,jo.JOStatus
      ,jo.CreatedBy
      ,jo.UpdatedBy
      ,jo.DateTimeCreated
      ,jo.DateTimeUpdated
      ,jo.AssessmentResult
      ,jo.Recommendation
      ,jo.isEvaluated
       ,jo.scheduledCheckup
      ,jo.DepartmentApprovedBy
       ,jo.DepartmentApprovedDate
       ,jo.RequestingDepartment
		  FROM [UERMINV].[dbo].[JobOrders] as jo
right JOIN [UERMINV].[dbo].[Assets] as asset ON jo.InternalAssetCode = asset.code
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
const selectActiveMedicalEquipmentNoDuplicates = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
       asset.code AS assetCode,
    asset.receivingReportNo,
    asset.postTransferAssetCode,
    asset.netCost,
    asset.discount,
    asset.dateTimeCreated,
    asset.totalSets,
    asset.serviceType AS AssetServiceType,
    asset.serviceAction AS AssetServiceAction,
    asset.maintenanceCycle AS AssetMaintenanceCycle,
    asset.accountingAssetCode,
    asset.oldAssetCode,
    asset.receivingDepartment,
    asset.itemCode,
    asset.categoryId,
    asset.dateReceived,
    asset.warrantyDate,
    asset.isMaintenanceReassigned,
    asset.originId,
    asset.invoiceNumber,
    asset.genericName,
    asset.brandName,
    asset.model,
    asset.serialNumber,
    asset.specifications,
    asset.unitCost,
    asset.supplierId,
    asset.location,
    
    -- Job Order (latest only)
    jo.jOProgress,
    jo.Code,
    jo.JobOrderNumber,
    jo.ServiceActionCode,
    jo.EquipmentType,
    jo.InternalAssetCode,
    jo.ComponentAssetCode,
    jo.ServiceType,
    jo.PriorityLevel,
    jo.MaintenanceCycle,
    jo.JobOrderConcern,
    jo.RequestedBy,
    jo.RequestedDate,
    jo.JOAcceptedDate,
    jo.JOCompletedDate,
    jo.Assessor,
    jo.Remarks,
    jo.JOStatus,
    jo.CreatedBy,
    jo.UpdatedBy,
    jo.DateTimeCreated AS JODateTimeCreated,
    jo.DateTimeUpdated,
    jo.AssessmentResult,
    jo.Recommendation,
    jo.isEvaluated,
    jo.scheduledCheckup,
    jo.DepartmentApprovedBy,
    jo.DepartmentApprovedDate,
    jo.RequestingDepartment

FROM [UERMINV].[dbo].[Assets] AS asset
LEFT JOIN (
    SELECT jo.*
    FROM [UERMINV].[dbo].JobOrders jo
    INNER JOIN (
        SELECT InternalAssetCode,  MAX(scheduledCheckup) AS LatestCheckup
        FROM [UERMINV].[dbo].JobOrders

          WHERE MONTH(scheduledCheckup) = MONTH(GETDATE())
     -- WHERE MONTH(scheduledCheckup) = 5
          AND YEAR(scheduledCheckup) = YEAR(GETDATE())
        GROUP BY InternalAssetCode
    ) latest
    ON jo.InternalAssetCode = latest.InternalAssetCode
    AND jo.scheduledCheckup = latest.LatestCheckup  where JOProgress<>'Cancelled' 
) AS jo
ON jo.InternalAssetCode = asset.code
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

const selectPerformedTask = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
     id,
code,
jobOrderNumber,
joTaskName,
joTaskResult,
isActive,
createdBy,
updatedBy,
isStatus,

dateTimeUpdated,
dateTimeCreated
		 FROM [UERMINV].[dbo].[JobOrderTasks]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectJobOrdersNewTable = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
               Id
      ,Code
      ,JobOrderNumber
      ,ServiceActionCode
      ,EquipmentType
      ,InternalAssetCode
      ,ComponentAssetCode
      ,ServiceType
      ,PriorityLevel
      ,MaintenanceCycle
      ,JobOrderConcern
      ,RequestedBy
      ,RequestedDate
      ,JOAcceptedDate
      ,JOCompletedDate
      ,Assessor
      ,Remarks
      ,JOStatus
           ,AssessmentResult
           ,isEvaluated
      ,Recommendation
      ,CreatedBy
      ,UpdatedBy
      ,DateTimeCreated
      ,DateTimeUpdated
            ,jOProgress
            ,RequestingDepartment
              ,DepartmentApprovedBy
       ,DepartmentApprovedDate
       ,scheduledCheckup
       ,AcknowledgeSignature
       ,isRead
        ,partStatus
      ,partId
      ,startingDate
      ,endDate
		  FROM [UERMINV].[dbo].[JobOrders]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectComplaintConcern = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
         joCons.[Id]
      ,joCons.[Code]
      ,joCons.[Concern]
      ,joCons.[UpdatedBy]
      ,joCons.[CreatedBy]
      ,joCons.[DateTimeCreated]
      ,joCons.[DateTimeUpdated]
      ,joCons.[Active]
      ,joCons.[InternalAssetCode]
      ,joCons.[DeptCode]
       ,joCons.[JobOrderNumber]
            ,joCons.[Status]
	  ,assetDets.GenericName
      ,assetDets.serialNumber
      ,assetDets.BrandName
      ,assetDets.Model
      ,assetDets.Specifications
          ,assetDets.warrantyDate
  FROM [UERMINV].[dbo].[JoDepartmentConcern] joCons

     join [UERMINV].[dbo].[Assets] assetDets on joCons.internalAssetCode = assetDets.Code
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectDetailedConcern = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
           joCons.[Id]
      ,joCons.[Code]
      ,joCons.[Concern]
      ,joCons.[UpdatedBy]
      ,joCons.[CreatedBy]
      ,joCons.[DateTimeCreated]
      ,joCons.[DateTimeUpdated]
      ,joCons.[Active]
      ,joCons.[InternalAssetCode]
       ,joCons.[JobOrderNumber]
      ,joCons.[DeptCode]
        ,joCons.[Status]
	  ,assetDets.GenericName
      ,assetDets.serialNumber
      ,assetDets.BrandName
      ,assetDets.Model
      ,assetDets.Specifications
      ,assetDets.warrantyDate
  FROM [UERMINV].[dbo].[JoDepartmentConcern] joCons

     join [UERMINV].[dbo].[Assets] assetDets on joCons.internalAssetCode = assetDets.Code
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const insertNewJO = async function (payload, txn) {
  return await sqlHelper.insert("[ITMgt].[dbo].[JobOrder]", payload, txn);
};

const insertPostedJo = async function (payload, txn) {
  try {
    return await sqlHelper.insert("[UERMINV].[dbo].[JobOrders]", payload, txn);
  } catch (error) {
    return { error: error };
  }
};
const registerComplain = async function (payload, txn) {
  try {
    return await sqlHelper.insert(
      "[UERMINV].[dbo].[JoDepartmentConcern]",
      payload,
      txn,
    );
  } catch (error) {
    return { error: error };
  }
};

const registerTasks = async function (payload, txn) {
  try {
    return await sqlHelper.insert(
      "[UERMINV].[dbo].[JobOrderTasks]",
      payload,
      txn,
    );
  } catch (error) {
    return { error: error };
  }
};

const updateJO = async function (payload, condition, txn) {
  try {
    return await sqlHelper.updateMany(
      "[UERMINV].[dbo].[JobOrders]",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return { error: error };
  }
};
const updateJOTask = async function (payload, condition, txn) {
  try {
    return await sqlHelper.updateMany(
      "[UERMINV].[dbo].[JobOrderTasks]",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return { error: error };
  }
};

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

  selectJobOrders,
  selectJobOrdersNewTable,
  insertNewJO,
  insertPostedJo,
  selectActiveMedicalEquipment,

  updateJO,
  registerTasks,
  selectPerformedTask,
  updateJOTask,

  updateAssetsOne,
  selectActiveMedicalEquipmentNoDuplicates,
  selectComplaintConcern,
  registerComplain,
  updateConcern,
  selectDetailedConcern,

  selectPartStatus,
  selectPartId,
};

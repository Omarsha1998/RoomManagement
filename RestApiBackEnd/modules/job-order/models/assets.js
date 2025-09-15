const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
// const { query } = require("express");
const selectAssets = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			code,
      receivingReportNo,
      postTransferAssetCode,
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
      assetTagStatus,
      accountingRefNo,
      itAssetCode,
      PostTransferAssetCode,
      REVERSE(itAssetCode) AS reverseITASSETCODE,
      active,
      quantity,
      administrator,
      transferStatus,
      transferFormNo,
      condemnStatus,
      donor,
      donationNo,
      capitalized,
     araForm,
   auditedBy,
   cancelStatus,
   condemnReStatus,
   transferReStatus,
      releasedDate,
   outcome,
   allotmentRemarks,
   transferRequestBy,
   transferRequestedDate,
   condemRequestedDate,
   condemRemarks,
   buildingCode,
   accountabilityRefNo,
   warrantyDate,
   totalSets,
   accountableEmployee,

        CASE 
        WHEN totalSets IS NULL OR totalSets = '' THEN itAssetCode
        WHEN itAssetCode IS NULL OR itAssetCode = '' THEN ''

        WHEN totalSets = 1 THEN LEFT(itAssetCode, LEN(itAssetCode) - CHARINDEX('-', REVERSE(itAssetCode)))
        ELSE CONCAT(itAssetCode, '/', totalSets)
    END AS itAssetCodeConcat
		from UERMINV..Assets
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
const distinctPendingCondemByDepartment = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      MAX(retirementStatus.[CondemRequestedDate]) AS requestedDate
	   ,asst.[AraForm] 
			,retirementStatus.[RequestedDepartment]
		from UERMINV..Assets asst
     join [UERMINV].[dbo].[CondemnationHistory] retirementStatus on asst.code = retirementStatus.internalAssetCode 
    
		where 1=1 ${conditions}
    GROUP BY 
   asst.[AraForm],retirementStatus.[RequestedDepartment],asst.CondemnReStatus
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const getItemCode = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    itemCode,
       MAX(CAST(
        SUBSTRING(
            ItAssetCode, 
            LEN(ItAssetCode) - CHARINDEX('-', REVERSE(ItAssetCode)) + 2, 
            LEN(ItAssetCode)
        ) AS INT
    )) AS MaxLastSegment,
      REVERSE(itAssetCode) AS reverseITASSETCODE
     
		from UERMINV..Assets
		where 1=1 ${conditions}
    group by itAssetCode,
    itemCode,
               categoryId
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const getItemCodeFromAssetAndParts = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  combined_results.allItemCode AS combined_itemCode,
    combined_results.allMaxLastSegment,
    combined_results.allreverseITASSETCODE,
    combined_results.allCat,
  combined_results.allreceivingReportNo
FROM (
    SELECT
        t1.itemCode AS allItemCode,t1.categoryId as allCat,
       t1.receivingReportNo AS allreceivingReportNo,
        MAX(CAST(
            SUBSTRING(
                t1.ItAssetCode,
                LEN(t1.ItAssetCode) - CHARINDEX('-', REVERSE(t1.ItAssetCode)) + 2,
                LEN(t1.ItAssetCode)
            ) AS INT
        )) AS allMaxLastSegment,
        REVERSE(t1.ItAssetCode) AS allreverseITASSETCODE
    FROM UERMINV..Assets AS t1
	WHERE t1.itemCode IS NOT NULL AND t1.itemCode <> ''
    GROUP BY t1.itemCode, t1.ItAssetCode,t1.categoryId,
   t1.receivingReportNo

    UNION ALL

    SELECT
        t2.itemCode AS allItemCode,	t2.categoryId as allCat,
        t2.receivingReportNo AS allreceivingReportNo,
        MAX(CAST(
            SUBSTRING(
                t2.ItAssetCode,
                LEN(t2.ItAssetCode) - CHARINDEX('-', REVERSE(t2.ItAssetCode)) + 2,
                LEN(t2.ItAssetCode)
            ) AS INT
        )) AS allMaxLastSegment,
        REVERSE(t2.ItAssetCode) AS allreverseITASSETCODE
    FROM [UERMINV].[dbo].[AssetsComponents] AS t2
	WHERE t2.itemCode IS NOT NULL AND t2.itemCode <> ''
    GROUP BY t2.itemCode, t2.ItAssetCode, t2.categoryId,
    t2.receivingReportNo
) AS combined_results
		where 1=1 ${conditions}
    group by combined_results.allItemCode,
    combined_results.allMaxLastSegment,
    combined_results.allCat,
      combined_results.allreceivingReportNo  ,
    combined_results.allreverseITASSETCODE
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const getAllRR = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  	combined_results.allreceivingReportNo  ,
	count(combined_results.allreceivingReportNo) as totalCount
FROM (
    SELECT
     t1.receivingReportNo AS allreceivingReportNo  
    FROM UERMINV..Assets AS t1
	WHERE t1.receivingReportNo IS NOT NULL AND t1.receivingReportNo <> ''
    UNION ALL

    SELECT
       t2.receivingReportNo AS allreceivingReportNo
    FROM [UERMINV].[dbo].[AssetsComponents] AS t2
		WHERE t2.receivingReportNo IS NOT NULL AND t2.receivingReportNo <> ''
) AS combined_results
		where 1=1 ${conditions}
    group by
   combined_results.allreceivingReportNo
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

//once searched
const getAssetInfo = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  	 code  ,
  receivingReportNo  ,
	    OldAssetCode  ,
	    genericName ,
		transferStatus  ,
		 transferReStatus ,
		 condemnStatus  ,
		  condemnReStatus ,
		  active,
		
	  CategoryId
    FROM UERMINV..Assets 
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
const getAccountabilityRefNo = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  accountabilityRefNo
    FROM UERMINV..Assets 
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

const getAllItAssetCode = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  combined_results.AllIT,
 combined_results.allSets,
 combined_results.allConcat
FROM (
    SELECT
      
		t1.ItAssetCode as AllIT,
		t1.TotalSets as allSets,
        CONCAT(t1.ItAssetCode ,'/',t1.TotalSets)  as allConcat
    FROM [UERMINV].[dbo].Assets AS t1
    WHERE t1.ItAssetCode IS NOT NULL AND t1.ItAssetCode <> ''
    GROUP BY t1.ItAssetCode,t1.TotalSets

    UNION ALL

    SELECT
       
		t2.ItAssetCode as AllIT,
		t2.TotalSets as allSets,
		  CONCAT(t2.ItAssetCode ,'/',t2.TotalSets)  as allConcat
    FROM [UERMINV].[dbo].[AssetsComponents] AS t2
 WHERE t2.ItAssetCode IS NOT NULL AND t2.ItAssetCode <> ''
    GROUP BY t2.ItAssetCode,t2.TotalSets
) AS combined_results
		where 1=1 ${conditions}
   group by
 combined_results.AllIT,
 combined_results.allConcat,
 combined_results.allSets
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const getAssetsForRRComponents = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    receivingReportNo,
    DateTimeCreated,
       MAX(CAST(
        SUBSTRING(
            ItAssetCode, 
            LEN(ItAssetCode) - CHARINDEX('-', REVERSE(ItAssetCode)) + 2, 
            LEN(ItAssetCode)
        ) AS INT
    )) AS MaxLastSegment,
      REVERSE(itAssetCode) AS reverseITASSETCODE,
  
     COUNT(receivingReportNo) AS GroupCount, 
  COUNT(*) OVER() AS TotalReps 
     
		from UERMINV..AssetsComponents
		where 1=1 ${conditions}
    group by itAssetCode,
    DateTimeCreated,
    receivingReportNo,
               categoryId
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};
// SUM(COUNT(receivingReportNo)) OVER() AS TotalReps

//joined ALL APPROVED CONDEM ASSETS
const approvedAssetsCondemLog = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
		 assets.code,
      assets.oldAssetCode,
      assets.receivingDepartment,
      assets.genericName,
       assets.receivingReportNo,
       assets.netCost,
       assets.discount,
       assets.countedBy,
       assets.accountingAssetCode,
       assets.itemCode,
       assets.categoryId,
       assets.dateReceived,
       assets.supplierId,
       assets.originId,
       assets.invoiceNumber,
       assets.brandName,
       assets.model,
       assets.serialNumber,
     assets.specifications,
       assets.unitCost,
       assets.location,
       assets.transferredDepartment,
       assets.createdBy,
       assets.updatedBy,
       assets.dateTimeCreated,
       assets.dateTimeUpdated,
       assets.remarks,
       assets.assetTagStatus,
       assets.accountingRefNo,
       assets.itAssetCode,
     
      REVERSE( assets.itAssetCode) AS reverseITASSETCODE,
       assets.active,
       assets.quantity,
       assets.administrator,
   
        assets.donor,
       assets.donationNo,
       assets.capitalized,
   
    assets.auditedBy,
  
    assets.buildingCode,
    assets.warrantyDate,
    assets.totalSets,
	 
	  condemHisto.AraForm,
	
      condemHisto.[CondemnStatus],
     
      condemHisto.requestedDepartment
      ,condemHisto.[Outcome]
      ,condemHisto.[ReleasedDate]
      ,condemHisto.[AuditedBy]
      ,condemHisto.[CondemRequestedDate]
      ,condemHisto.[CreatedBy]
      ,condemHisto.[DateTimeCreated]
      ,condemHisto.[UpdatedBy]
      ,condemHisto.[DateTimeUpdated]
      ,condemHisto.[CondemReStatus]
      ,condemHisto.[InternalAssetCode]
      ,condemHisto.[ComponentCode]
      ,condemHisto.[Type]
      ,condemHisto.[Remarks]
      ,condemHisto.[PreApproved],
     CASE  WHEN  assets.totalSets IS NULL OR  assets.totalSets = '' THEN  assets.itAssetCode
     WHEN  assets.itAssetCode IS NULL OR  assets.itAssetCode = '' THEN ''
        ELSE CONCAT( assets.itAssetCode, '/',  assets.totalSets)
    END AS itAssetCodeConcat

      
		from UERMINV..Assets as assets FULL JOIN [UERMINV].[dbo].[CondemnationHistory] as condemHisto ON  condemHisto.InternalAssetCode = assets.code 
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

const approvedPartsCondemLog = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
		partsCompo.assetCode componentAssetCode,
      partsCompo.code ,
      partsCompo.genericName componentGenericName,
    partsCompo.unitCost,
      partsCompo.active,
      partsCompo.brandName componentBrandName,
      partsCompo.remarks componentDescription,
      partsCompo.dateReceived dateReceived,
      partsCompo.discount,
      partsCompo.originId,
      partsCompo.receivingReportNo,
      partsCompo.netCost,
      partsCompo.serialNo,
      partsCompo.remarks,
      partsCompo.itemCode,
      partsCompo.model,
      partsCompo.categoryId,
      partsCompo.supplier,
      partsCompo.assetCode,
      partsCompo.quantity,
      partsCompo.transferFormNo,
      partsCompo.administrator,
      partsCompo.transferStatus,
      partsCompo.specifications,
      partsCompo.assetTagStatus,
      partsCompo.receivingDepartment,
      partsCompo.transferredDepartment,
      partsCompo.internalAssetCode,
      partsCompo.transferingAssetCode,
      --partsCompo.condemnReStatus,
      partsCompo.transferReStatus,
      partsCompo.araForm,
      partsCompo.accountingRefNo,
      partsCompo.capitalized,
      partsCompo.itAssetCode,
      partsCompo.transferRequestedDate,
      partsCompo.condemnRequestedDate,
      partsCompo.movedAssetCode,
      partsCompo.outcome,
      partsCompo.releasedDate,
      partsCompo.condemRemarks,
      REVERSE( partsCompo.itAssetCode) AS reverseITASSETCODE,
       partsCompo.active,
   
        partsCompo.donor,
       partsCompo.donationNo,
   
    partsCompo.auditedBy,
  
    partsCompo.buildingCode,
    partsCompo.warrantyDate,
    partsCompo.totalSets,
	 
	  condemHisto.AraForm,
	
      condemHisto.[CondemnStatus],
     
      condemHisto.requestedDepartment
      ,condemHisto.[Outcome]
      ,condemHisto.[ReleasedDate]
      ,condemHisto.[AuditedBy]
      ,condemHisto.[CondemRequestedDate]
      ,condemHisto.[CreatedBy]
      ,condemHisto.[DateTimeCreated]
      ,condemHisto.[UpdatedBy]
      ,condemHisto.[DateTimeUpdated]
      ,condemHisto.[CondemReStatus]
      ,condemHisto.[InternalAssetCode]
      ,condemHisto.[ComponentCode]
      ,condemHisto.[Type]
      ,condemHisto.[Remarks]
      ,condemHisto.[PreApproved],
     CASE  WHEN  partsCompo.totalSets IS NULL OR  partsCompo.totalSets = '' THEN  partsCompo.itAssetCode
     WHEN  partsCompo.itAssetCode IS NULL OR  partsCompo.itAssetCode = '' THEN ''
        ELSE CONCAT( partsCompo.itAssetCode, '/',  partsCompo.totalSets)
    END AS itAssetCodeConcat

      
		from UERMINV..AssetsComponents as partsCompo FULL JOIN [UERMINV].[dbo].[CondemnationHistory] as condemHisto ON  condemHisto.componentCode = partsCompo.code 
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

const selectRRCountOnly = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			 COUNT(ReceivingReportNo) as receivingReportNo
		from UERMINV..Assets
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
const selectRetiredAssetsLog = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      asst.code,
      asst.oldAssetCode,
      asst.releasedDate, asst.condemRequestedDate,
      asst.itemCode,
         asst.categoryId,
      asst.dateReceived,
         asst.genericName,
         asst.receivingDepartment,
       asst.remarks,
         asst.supplierId,
         asst.poNumber,
         asst.invoiceNumber,
         asst.brandName,
      asst.model,
      asst.originId,
         asst.serialNumber,
         asst.condemRemarks,
      asst.specifications,
         asst.unitCost,
         asst.discount,
         asst.netCost,
         asst.status,
   asst.assetTagStatus,
         asst.location,
         asst.araForm,
         asst.administrator,
         asst.active,
         asst.totalSets,
         asst.quantity,
         asst.dateTimeUpdated,
         asst.transferredDepartment,
            asstCompo.AssetCode,
         asstCompo.AraFormNo,
         asstCompo.CondemnStatus,
  
         asstCompo.RequestedDepartment,
         asstCompo.Outcome,
         asstCompo.ReleasedDate,
         asstCompo.AraForm,
         asstCompo.CondemRequestedDate,
         asstCompo.CondemReStatus,
         asstCompo.InternalAssetCode,
         asstCompo.ComponentCode,
         asstCompo.GenericName,
         asstCompo.Type,
         asstCompo.DateTimeCreated,
         asstCompo.PreApproved
       from UERMINV..Assets asst
        left join UERMINV..CondemnationHistory asstCompo on asst.code = asstCompo.internalAssetCode 
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
const selectAssetsNoDuplicate = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      DISTINCT  transferFormNo, transferredDepartment, transferRequestedDate
      
		from UERMINV..Assets
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

const selectAssetsARANoDuplicate = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      DISTINCT  transferFormNo, receivingDepartment, transferredDepartment,transferRequestedDate
		from UERMINV..Assets
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

//for condemn
const ARAFormDistinct = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      araForm, receivingDepartment,MAX(CondemRequestedDate) AS requestedDate
      
		from UERMINV..Assets
    
		where 1=1 ${conditions}
    GROUP BY 
    araForm, 
    receivingDepartment
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

const selectPartsNoDuplicate = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      DISTINCT  transferFormNo, receivingDepartment, transferRequestedDate, transferingAssetCode
      
		from UERMINV..AssetsComponents
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
const selectPartsNoDuplicateARA = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
   DISTINCT araForm, receivingDepartment,condemnRequestedDate AS requestedDate
      
		from UERMINV..AssetsComponents
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

// const selectPartsNoDuplicateARA = async function (
//   conditions,
//   args,
//   options,
//   txn,
// ) {
//   try {
//     return await sqlHelper.query(
//       `select
//       ${util.empty(options.top) ? "" : `TOP(${options.top})`}
//    araForm, receivingDepartment,MAX(CondemnRequestedDate) AS requestedDate

// 		from UERMINV..AssetsComponents
// 		where 1=1 ${conditions}
//     GROUP BY
//     araForm,
//     receivingDepartment;
//       ${util.empty(options.order) ? "" : `order by ${options.order}`}
//     `,
//       args,
//       txn,
//     );
//   } catch (error) {
//     return error;
//   }
// };

const selectAssetsTesting = async function (conditions, args, options, txn) {
  try {
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
      assetTagStatus,
      accountingRefNo,
      itAssetCode,
      Concat(ItAssetCode,'/',TotalSets) AS itAssetCodeConcat,
      active,
      quantity,
      administrator,
      condemnReStatus,
      transferReStatus,
      transferRequestBy,
      condemRequestedDate,
      totalSets
		from UERMINV..Assets
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

const selectOldAssets = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			itemId,
      genericName,
      deptCode,
      categoryCode,
      unitCost,
      newUnitCost,
      setNo,
      dateReceived,
      supplierName,
      purchaseOrderNo,
      invoiceNo,
      brandName,
      brandModel,
      serialNo,
      itemSpecs,
      newAssetCode,
      assetTagStatus,
      itemRemarks,
      oldAssetCode,
      --physicalLocation,
      itemCode,
      receivingReport,
      condemned,
      salvaged,
      deleted,
      transferred, 
      dateTimeCreated,
      dateTimeUpdated,
      remarks,
      totalSets
   
		from UERMINV..fxAssets
		WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    return error;
  }
};

//
const insertAssets = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..Assets", payload, txn);
  } catch (error) {
    return error;
  }
};

const insertNewAssetCode = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..AssetCodeRegistry", payload, txn);
  } catch (error) {
    return error;
  }
};

//ALLOTMENT TRANSFER 1/29/2024
const insertAssetsTransfer = async function (payload, txn) {
  try {
    return await sqlHelper.insert(
      "UERMINV..AssetAllotmentHistory",
      payload,
      txn,
    );
  } catch (error) {
    return error;
  }
};

//condemnation requests 2/13/2024
const insertAssetsCondemn = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..CondemnationHistory", payload, txn);
  } catch (error) {
    return { error: error };
  }
};

// const updateAssetTransfer = async function (payload, condition, txn) {
//   return await sqlHelper.update("UERMINV..AssetAllotmentHistory", payload, condition, txn);
// };

const insertExcelData = async function (payload, txn) {
  try {
    return await sqlHelper.insert("UERMINV..Assets", payload, txn);
  } catch (error) {
    return error;
  }
};

const updateAssetsOne = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update("UERMINV..Assets", payload, condition, txn);
  } catch (error) {
    return error;
  }
};
const updateAssets = async function (payload, condition, txn) {
  try {
    return await sqlHelper.updateMany(
      "UERMINV..Assets",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return { error: error };
  }
};

const updateOldAssets = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update("UERMINV..fxAssets", payload, condition, txn);
  } catch (error) {
    return error;
  }
};

module.exports = {
  selectAssets,
  selectOldAssets,
  insertAssets,
  updateAssets,
  updateOldAssets,
  insertExcelData,
  selectAssetsTesting,
  insertAssetsTransfer,
  insertAssetsCondemn,
  insertNewAssetCode,
  selectAssetsNoDuplicate,
  selectPartsNoDuplicate,
  ARAFormDistinct,
  selectAssetsARANoDuplicate,
  selectPartsNoDuplicateARA,
  updateAssetsOne,
  selectRetiredAssetsLog,
  // getAssetsForRR,
  getAssetsForRRComponents,
  // updateAssetTransfer
  selectRRCountOnly,
  approvedAssetsCondemLog,
  distinctPendingCondemByDepartment,
  approvedPartsCondemLog,
  getItemCode,
  getItemCodeFromAssetAndParts,
  getAllRR,
  getAllItAssetCode,
  getAssetInfo,
  getAccountabilityRefNo,
};

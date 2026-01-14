const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

const assets = require("../models/assets.js");
const assetsComponents = require("../models/assetsComponents.js");
const allotmentHistory = require("../models/allotmentHistory.js");

//ASSET LIST MODULE
const getActiveEquipmentWhole = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and condemnReStatus<>? and categoryId = ?`;
    args = ["Approved", "22"];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//LOCATION MODULE
const getAssetsInLocationModuleTable = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];

    sqlWhere = `and receivingDepartment =? and  TransferReStatus <> 'Approved' and CondemnReStatus <> 'Approved' and categoryId<> ?`;
    args = [userDepartmentCode, "30"];
    const options = {
      top: "",
      order: "genericName asc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const getItLastItemCode = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const itemCoding = req.query.itemCode;
      const rrNo = req.query.receivingReportNo;
      let sqlWhere = "";
      let args = [];
      sqlWhere = ` and combined_results.allItemCode = ? and combined_results.allreceivingReportNo = ?`;
      args = [itemCoding, rrNo];
      const options = {
        top: "",
        order: "combined_results.allMaxLastSegment desc",
      };
      return await assets.getItemCodeFromAssetAndParts(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

const allRRChecking = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const receivingReportNo = req.query.receivingReportNo;
      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and combined_results.allreceivingReportNo = ?`;
      args = [receivingReportNo];
      const options = {
        top: "",
        order: "",
      };
      return await assets.getAllRR(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};
const getAssetsInfoResult = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      // const receivingReportNo = req.query.receivingReportNo;
      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = `OldAssetCode IS NOT NULL AND OldAssetCode <> ''`;
      args = [];
      const options = {
        top: "",
        order: "",
      };
      return await assets.getAssetInfo(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};
// const getAcctblyRefNo = async function (req, res) {
//   try {
//     const returnValue = await sqlHelper.transact(async (txn) => {
//       // if (util.empty(req.query.transferFormNo))
//       //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

//       // const receivingReportNo = req.query.receivingReportNo;
//       let sqlWhere = "";
//       // const userDepartmentCode = util.currentUserToken(req).deptCode
//       let args = [];
//       sqlWhere = `and accountabilityRefNo is not null and accountabilityRefNo <>''`;
//       args = [];
//       const options = {
//         top: "1",
//         order: "accountabilityRefNo desc",
//       };
//       return await assets.getAccountabilityRefNo(sqlWhere, args, options, txn);
//     });

//     if (returnValue.error !== undefined) {
//       return res.status(500).json({ error: `${returnValue.error}` });
//     }
//     return res.json(returnValue);
//   } catch (error) {
//     return res.json(error);
//   }
// };

const getAcctblyRefNo = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      // const receivingReportNo = req.query.receivingReportNo;
      const specificDept = req.query.specificDept;
      // const specificDept = "";
      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = `and accountabilityRefNo LIKE ?  and OriginId <> '14'`;
      args = [`%-${specificDept}-%`];
      const options = {
        top: "1",
        order:
          "  CAST(LEFT(AccountabilityRefNo, CHARINDEX('-', AccountabilityRefNo) - 1) AS INT) DESC,  CAST(RIGHT(AccountabilityRefNo, CHARINDEX('-', REVERSE(AccountabilityRefNo)) - 1) AS INT) DESC",
      };
      return await assets.getAccountabilityRefNo(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

const allItAssetCodeRChecking = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const itAssetCode = req.query.itAssetCode;

      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and  combined_results.allConcat = ?`;
      args = [itAssetCode];
      const options = {
        top: "",
        order: "",
      };
      return await assets.getAllItAssetCode(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};
const checkITAssetCodeForManual = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const itAssetCode = req.query.itAssetCode;

      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and  combined_results.allConcat = ? OR  combined_results.AllIT = ?`;
      args = [itAssetCode, itAssetCode];
      const options = {
        top: "",
        order: "",
      };
      return await assets.getAllItAssetCode(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

const getAllAssetCodePartsPackage = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const assetCode = req.query.assetCodeResult;

      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and  oldAssetCode = ? and oldAssetCode IS not NULL and  oldAssetCode != ''`;
      args = [assetCode];
      const options = {
        top: "",
        order: "",
      };
      return await assets.selectAssets(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

const checkOrigAndNewAssetCodeExist = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const assetCode = req.query.assetCodeResult;

      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and  oldAssetCode = ? and oldAssetCode IS not NULL and  oldAssetCode != '' OR postTransferAssetCode = ? `;
      args = [assetCode, assetCode];
      const options = {
        top: "",
        order: "",
      };
      return await assets.selectAssets(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

const getActivityLog = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const assetCode = req.query.assetCodeResult;

      let sqlWhere = "";
      let args = [];
      sqlWhere = ` and  transferStatus.internalAssetCode = ? and transferStatus.internalAssetCode IS not NULL and  transferStatus.internalAssetCode != '' and transferStatus.type='WHOLE'`;
      args = [assetCode];
      const options = {
        top: "",
        order: "transferStatus.dateTimeCreated desc",
      };
      return await allotmentHistory.getApprovedAssetTransferHistory(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};
const getPartsActivityLog = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const assetCode = req.query.assetCodeResult;

      let sqlWhere = "";
      let args = [];
      sqlWhere = ` and  transferStatus.componentCode = ? and transferStatus.type='PARTS'`;
      args = [assetCode];
      const options = {
        top: "",
        order: "transferStatus.dateTimeCreated desc",
      };
      return await allotmentHistory.getPartsTransferActivityLogs(
        //getApprovedPartsTransferHistory
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

const putAssets = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo, assetCodeResult, newCreatedAssetCode, partsIncluded } =
      req.body;
    try {
      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;

      // Construct the object to update
      const updateFields = {
        genericName: assetsInfo.genericName,
        receivingDepartment: assetsInfo.deptCode,
        itemCode: assetsInfo.itemCode,

        categoryId: assetsInfo.categoryId,
        assetTagStatus: assetsInfo.assetTagStatus,
        dateReceived: assetsInfo.dateReceived,
        supplierId: assetsInfo.supplierId,
        receivingReportNo: assetsInfo.receivingReportNo,
        netCost: assetsInfo.netCost,
        discount: assetsInfo.discount,
        location: assetsInfo.location,
        brandName: assetsInfo.brandName,
        unitCost: assetsInfo.unitCost,
        model: assetsInfo.model,
        serialNumber: assetsInfo.serialNumber,
        updatedBy: activeUser,
        specifications: assetsInfo.specifications,
        remarks: assetsInfo.remarks,
        donationNo: assetsInfo.donationNo,
        donor: assetsInfo.donor,
      };

      // Conditionally include assetCodeResult if it exists
      if (assetCodeResult && assetCodeResult.trim() !== "") {
        updateFields.oldAssetCode = assetCodeResult; // Update assetCode only if provided
      }
      if (newCreatedAssetCode && newCreatedAssetCode.trim() !== "") {
        updateFields.postTransferAssetCode = newCreatedAssetCode; // Update assetCode only if provided
      }

      updateAssetInfo = await assets.updateAssets(
        updateFields,
        { code: assetsInfo.code }, // Where clause
        txn,
      );

      if (partsIncluded.length > 0) {
        for (const parts of partsIncluded) {
          const updateComponentFields = {
            receivingDepartment: assetsInfo.deptCode,
            administrator: assetsInfo.administrator,
            categoryId: assetsInfo.categoryId,
            physicalLocation: assetsInfo.physicalLocation,
          };

          // Conditionally include assetCodeResult for parts if it exists
          if (assetCodeResult && assetCodeResult.trim() !== "") {
            updateComponentFields.assetCode = assetCodeResult; // Update part asset code only if provided
          }

          // Update parts info
          await assetsComponents.updateAssetsComponents(
            updateComponentFields,
            { code: parts.componentCode }, // Where clause for parts
            txn,
          );
        }
      }

      return res.status(200).json(updateAssetInfo);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

const putCEAssetsInfo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const {
      assetsInfo,
      // itAssetCode, assetCodeResult,
      itAssetCode,
      assetCodeResult,
      // newCreatedAssetCode,
      partsIncluded,
    } = req.body;
    try {
      let updateAssetInfo = "";
      // const totalNetCost = (assetsInfo.unitCost - assetsInfo.discount)

      const activeUser = util.currentUserToken(req).code;

      const updateFields = {
        genericName: assetsInfo.genericName,
        // oldAssetCode: assetCodeResult,
        // receivingDepartment: assetsInfo.deptCode,
        itemCode: assetsInfo.itemCode,
        // categoryId: assetsInfo.categoryId,
        assetTagStatus: assetsInfo.assetTagStatus,
        // dateReceived: assetsInfo.dateReceived,
        supplierId: assetsInfo.supplierId,
        // receivingReportNo: assetsInfo.receivingReportNo,
        // netCost: assetsInfo.netCost,
        // discount: assetsInfo.discount,
        location: assetsInfo.location,
        brandName: assetsInfo.brandName,
        // unitCost: assetsInfo.unitCost,
        accountableEmployee: assetsInfo.accountableEmployee,
        model: assetsInfo.model,
        serialNumber: assetsInfo.serialNumber,
        updatedBy: activeUser,
        specifications: assetsInfo.specifications,
        remarks: assetsInfo.remarks,
        donationNo: assetsInfo.donationNo,
        donor: assetsInfo.donor,
      };
      // { code: assetsInfo.code }, //where clause
      // txn,

      // Conditionally include assetCodeResult if it exists
      if (assetCodeResult && assetCodeResult.trim() !== "") {
        updateFields.oldAssetCode = assetCodeResult; // Update assetCode only if provided
      }
      // if (newCreatedAssetCode && newCreatedAssetCode.trim() !== "") {
      //   updateFields.postTransferAssetCode = newCreatedAssetCode; // Update assetCode only if provided
      // }
      if (itAssetCode && itAssetCode.trim() !== "") {
        const [pref] = itAssetCode.split("/");

        let finalCooo = pref;
        const resR = pref.split("-").length - 1;
        if (resR < 3) {
          finalCooo = `${pref}-1`;
        }
        updateFields.itAssetCode = finalCooo;
      }

      updateAssetInfo = await assets.updateAssets(
        updateFields,
        { code: assetsInfo.code }, // Where clause
        txn,
      );

      if (partsIncluded.length > 0) {
        for (const parts of partsIncluded) {
          // UPDATE PARTS INFO START//
          await assetsComponents.updateAssetsComponents(
            {
              assetCode: assetCodeResult,
              administrator: assetsInfo.administrator,
              accountableEmployee: assetsInfo.accountableEmployee,
              categoryId: assetsInfo.categoryId,
              physicalLocation: assetsInfo.physicalLocation,
            },
            { code: parts.componentCode },
            txn,
          );
          //UPDATE PARTS INFO END//
        }
      }

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};
//assets NON-IT EQUIPMENT
const getAssets = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const admin = "IT";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and administrator<>?  and active=?`;
    args = [admin, 1];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//CE without assetcode
const getAssetsCEnoAssetCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const catId = "IT";

    let args = [];
    sqlWhere = `and administrator = ? and active =? and (oldAssetCode = '' OR oldAssetCode IS NULL)  `;
    args = [catId, 1];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//Equipments per department
const getAssetsByDepartment = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];

    sqlWhere = `and active = ? and receivingDepartment =? and categoryId <> ? `;
    args = [1, userDepartmentCode, "30"];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getByDeptAssetPendingCondemn = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Pending";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and asst.condemnReStatus=? and retirementStatus.RequestedDepartment=?`;
    args = [condemnReStatus, userDepartmentCode];
    const options = {
      top: "",
      order: "requestedDate desc",
    };
    return await assets.distinctPendingCondemByDepartment(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const getAllAssetCondemnRequest = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Pending";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];

    sqlWhere = `and asst.CondemnReStatus=? and retirementStatus.condemReStatus IS NOT NULL `;
    args = [condemnReStatus];
    const options = {
      top: "",
      order: "",
    };
    return await assets.distinctPendingCondemByDepartment(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const mainAssetPendingCheck = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    args = [req.query.internalAssetCode];
    sqlWhere = `and code = ? `;

    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//accounting only
const putAssetsCapitalizedUpdate = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo, accountingRefNoInput, capitalizedInput } = req.body;

    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await assets.updateAssets(
        {
          accountingRefNo: accountingRefNoInput,
          updatedBy: activeUser,
          capitalized: capitalizedInput,
        },
        { code: assetsInfo.code }, //where clause
        txn,
      );

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};
//for accounting
const getAssetsActive = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and active=? and categoryId <> ?`;
    args = [1, "30"];
    const options = {
      top: "",
      order: "DateTimeUpdated desc ",
    };
    //  "CASE WHEN (accountingRefNo IS NULL OR accountingRefNo = '') THEN 0 WHEN (Capitalized IS NULL OR Capitalized = '') THEN 0 ELSE 1 END, DateTimeUpdated asc ",
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//for accounting parts
const getPartsActive = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and active=?`;
    args = [1];
    const options = {
      top: "",
      order: "DateTimeUpdated desc",
    };
    //   "CASE WHEN (accountingRefNo IS NULL OR accountingRefNo = '') THEN 0 WHEN (Capitalized IS NULL OR Capitalized = '') THEN 0 ELSE 1 END, DateTimeUpdated asc ",
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
// END CLEANED
const getDistinctAraFormNoByProperty = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Pending";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];

    sqlWhere = `and condemnReStatus=? and condemnStatus IS NOT NULL  `;
    args = [condemnReStatus];
    const options = {
      top: "",
      order: "",
    };
    return await assets.ARAFormDistinct(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//get distinct no duplicates ASSETS condemn/ ara
const getDistinctAraFormNo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Pending";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=? and condemnReStatus=? and condemnStatus IS NOT NULL  `;
    args = [userDepartmentCode, condemnReStatus];
    const options = {
      top: "",
      order: "",
    };
    return await assets.ARAFormDistinct(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//get all asset with same transferCode
const getAssetToTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.transferFormNo))
      return res
        .status(400)
        .json({ error: "`Transfer Form Number` is required." });

    const transferFormNo = req.query.transferFormNo;

    let sqlWhere = "";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=?  and transferFormNo = ? and active=?`;
    args = [userDepartmentCode, transferFormNo, 0];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getRRNumber = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // if (util.empty(req.query.transferFormNo))
    //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

    const receivingReportNox = req.query.receivingReportNo;
    let sqlWhere = "";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = ` and receivingReportNo = ?  and categoryId = ?`;
    args = [receivingReportNox, 21];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectRRCountOnly(sqlWhere, args, options, txn); //selectAssetsgetAssetsForRR
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
// getAlliTemCode
const getRRNumberExistInParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // if (util.empty(req.query.transferFormNo))
    //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

    const receivingReportNox = req.query.receivingReportNo;
    let sqlWhere = "";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = ` and receivingReportNo = ?  and categoryId = ?`;
    args = [receivingReportNox, 21];
    const options = {
      top: "",
      order: "",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getItLastComponents = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // if (util.empty(req.query.transferFormNo))
      //   return res.status(400).json({ error: "`Transfer Form Number` is required." });

      const receivingReportNox = req.query.receivingReportNo;
      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode
      let args = [];
      sqlWhere = ` and receivingReportNo = ? and  receivingReportNo != '' and categoryId = ?`;
      args = [receivingReportNox, 21];
      const options = {
        top: "1",
        order: "MaxLastSegment desc",
      };
      return await assets.getAssetsForRRComponents(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.json(error);
  }
};

const getAssetToTransferProperty = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.transferFormNo))
      return res
        .status(400)
        .json({ error: "`Transfer Form Number` is required." });

    const transferFormNo = req.query.transferFormNo;
    let sqlWhere = "";
    const administrator = "IT";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = ` and transferFormNo = ? and active=? and administrator<>?`;
    args = [transferFormNo, 0, administrator];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAssetToTransferIT = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.transferFormNo))
      return res
        .status(400)
        .json({ error: "`Transfer Form Number` is required." });

    const transferFormNo = req.query.transferFormNo;
    let sqlWhere = "";
    const administrator = "IT";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = ` and transferFormNo = ? and active=? and administrator=?`;
    args = [transferFormNo, 0, administrator];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAssetToCondemn = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.araForm))
      return res.status(400).json({ error: "`Ara Form No` is required." });

    const araForm = req.query.araForm;
    let sqlWhere = "";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=?  and araForm = ? and active=?`;
    args = [userDepartmentCode, araForm, 0];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const findAraNoDirect = async function (txn) {
  const sqlWhere = `and araForm LIKE 'ARA-%' and preApproved = 0`;
  const args = [];
  const options = {
    top: "1",
    order: "araForm desc",
  };

  const returnValue = await allotmentHistory.selectCondemHistory(
    sqlWhere,
    args,
    options,
    txn,
  );

  if (returnValue.error !== undefined) {
    throw new Error(returnValue.error);
  }
  return returnValue;
};

const getLastTransferFormNo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ``;
    args = [];
    const options = {
      top: "1",
      order: "transferFormNo desc",
    };
    return await allotmentHistory.selectTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//get pending condemn requests by department
const getPartsToTCondemnByDept = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      if (util.empty(req.query.araForm))
        return res
          .status(400)
          .json({ error: "`ARA Form Number` is required." });
      // let condemnRequestBy=req.query.condemnRequestBy
      const araForm = req.query.araForm;
      let sqlWhere = "";
      const userDepartmentCode = util.currentUserToken(req).deptCode;
      let args = [];
      sqlWhere = `and receivingDepartment=?  and araForm = ? and active=?`;
      args = [userDepartmentCode, araForm, 0];
      const options = {
        top: "",
        order: "",
      };
      return await assetsComponents.selectAllParts(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const acceptingCondemRequestParts = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      if (util.empty(req.query.araForm))
        return res
          .status(400)
          .json({ error: "`ARA Form Number` is required." });
      // let condemnRequestBy=req.query.condemnRequestBy
      const araForm = req.query.araForm;
      let sqlWhere = "";
      // const userDepartmentCode = util.currentUserToken(req).deptCode;
      let args = [];
      sqlWhere = `and araForm = ? and active=?`;
      args = [araForm, 0];
      const options = {
        top: "",
        order: "",
      };
      return await assetsComponents.selectAllParts(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
//get all parts with same transferCode
const getPartsToTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.transferFormNo))
      return res
        .status(400)
        .json({ error: "`Transfer Form Number` is required." });

    const transferFormNo = req.query.transferFormNo;
    let sqlWhere = "";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=?  and transferFormNo = ? and active=?`;
    args = [userDepartmentCode, transferFormNo, 0];
    const options = {
      top: "",
      order: "",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPartsToTransferITEquip = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.transferFormNo))
      return res
        .status(400)
        .json({ error: "`Transfer Form Number` is required." });

    const transferFormNo = req.query.transferFormNo;
    let sqlWhere = "";
    const administrator = "IT";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = `and administrator=?  and transferFormNo = ? and active=?`;
    args = [administrator, transferFormNo, 0];
    const options = {
      top: "",
      order: "",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//by property
const getPartsToTransferProperty = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.transferFormNo))
      return res
        .status(400)
        .json({ error: "`Transfer Form Number` is required." });

    const transferFormNo = req.query.transferFormNo;
    let sqlWhere = "";

    const administrator = "IT";
    let args = [];
    sqlWhere = `and administrator<>?  and transferFormNo = ? and active=?`;
    args = [administrator, transferFormNo, 0];
    const options = {
      top: "",
      order: "",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAssetsForGeneration = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // if (util.empty(req.query.selectedDeptCode))
    //   return res.status(400).json({ error: "`Department` is required." });

    const selectedDeptCode = req.query.selectedDeptCode;

    let sqlWhere = "";

    let args = [];

    sqlWhere = `and condemnReStatus<>? and receivingDepartment=? `;
    args = ["Approved", selectedDeptCode];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPartsForGeneration = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // const userDepartmentCode = util.currentUserToken(req).deptCode;
    const selectedDeptCode = req.query.selectedDeptCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and condemnReStatus<>? and receivingDepartment=? `;
    args = ["Approved", selectedDeptCode];

    const options = {
      top: "",
      order: "componentAssetCode asc",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const findAssetCodeDirect = async function (txn) {
  const sqlWhere = "";
  const args = [];
  const options = {
    top: "",
    order: "dateTimeUpdated desc ",
  };

  const returnValue = await assets.selectAssets(sqlWhere, args, options, txn);

  if (returnValue.error !== undefined) {
    throw new Error(returnValue.error);
  }
  return returnValue;
};

//get condemn
const getCondemnListProperty = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.araForm))
      return res.status(400).json({ error: "`ARA Form Number` is required." });

    const araForm = req.query.araForm;
    let sqlWhere = "";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=? and araForm = ? and active=?`;
    args = [userDepartmentCode, araForm, 0];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const condemApprovalForPendingRequest = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.araForm))
      return res.status(400).json({ error: "`ARA Form Number` is required." });

    const araForm = req.query.araForm;
    let sqlWhere = "";

    let args = [];
    sqlWhere = `and araForm = ? and active=?`;
    args = [araForm, 0];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//viewing for IT MONITORING
const getUpcomingCondemRequest = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Pending";
    const administrator = "IT";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];

    sqlWhere = `and condemnReStatus=?   and administrator =? and condemnStatus IS NOT NULL`; //and condemnStatus IS NOT NULL
    args = [condemnReStatus, administrator];
    const options = {
      top: "",
      order: "",
    };
    return await assets.ARAFormDistinct(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//get distinct by component ARA FORM by dept
const getDistinctAraFormByDeptParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Pending";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=? and condemnReStatus=? and araForm IS NOT NULL AND araForm <> '' `;
    args = [userDepartmentCode, condemnReStatus];
    const options = {
      top: "",
      order: "requestedDate desc",
    };
    return await assets.selectPartsNoDuplicateARA(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const condemRequestParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Pending";
    let args = [];
    sqlWhere = `and condemnReStatus=? and araForm IS NOT NULL AND araForm <> '' `;
    args = [condemnReStatus];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectPartsNoDuplicateARA(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//fortIT MONITORING
const getUpcomingPartsCondemRequest = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      const condemnReStatus = "Pending";
      const administrator = "IT";
      const userDepartmentCode = util.currentUserToken(req).deptCode;
      let args = [];
      sqlWhere = `and receivingDepartment=? and condemnReStatus=? and araForm IS NOT NULL AND araForm <> '' and administrator =?`;
      args = [userDepartmentCode, condemnReStatus, administrator];
      const options = {
        top: "",
        order: "",
      };
      return await assets.selectPartsNoDuplicateARA(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.log(error);
  }
};

//get distinct no duplicates ASSETS transfer
const getDistinctTransferFormNo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const transferReStatus = "Pending";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=? and transferReStatus=? and transferFormNo IS NOT NULL AND transferFormNo <> '' `;
    args = [userDepartmentCode, transferReStatus];
    const options = {
      top: "",
      order: "transferRequestedDate desc",
    };
    return await assets.selectAssetsNoDuplicate(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//get distinct no duplicate Components
const getDistinctTransferFormNoParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const transferReStatus = "Pending(by parts)";
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and receivingDepartment=? and transferReStatus=? and transferFormNo IS NOT NULL AND transferFormNo <> '' `;
    args = [userDepartmentCode, transferReStatus];
    const options = {
      top: "",
      order: "transferRequestedDate desc",
    };
    return await assets.selectPartsNoDuplicate(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//approved asset log
const getApprovedAssetLogs = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.code))
      return res.status(400).json({ error: "`Asset Code` is required." });

    const code = req.query.code;
    // const transferReStatus = 'Approved'
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and code = ?`;
    args = [code];

    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//by IT
const getDistinctTransferFormNoPartsIT = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const transferReStatus = "Pending(by parts)";
    const administrator = "IT";
    let args = [];
    sqlWhere = `and administrator=? and transferReStatus=? and transferFormNo IS NOT NULL AND transferFormNo <> '' `;
    args = [administrator, transferReStatus];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectPartsNoDuplicate(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getDistinctTransferFormNoPartsProperty = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const transferReStatus = "Pending(by parts)";
    const administrator = "IT";
    let args = [];
    sqlWhere = `and administrator<>? and transferReStatus=? and transferFormNo IS NOT NULL AND transferFormNo <> '' `;
    args = [administrator, transferReStatus];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectPartsNoDuplicate(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getSpecificAssetCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.inputtedAssetCode))
      return res.status(400).json({ error: "`Asset Code` is required." });

    const inputtedAssetCode = req.query.inputtedAssetCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and oldAssetCode = ? OR postTransferAssetCode = ? `;
    args = [inputtedAssetCode, inputtedAssetCode];

    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getSearcAssetCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = ``;
    args = [];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//for IT assetcode
const getSearcITAssetCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = ``;
    args = [];
    const options = {
      top: "",
      order: "",
    };
    return await assetsComponents.selectITAssetCodeExistence(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const checkIsAssetCodeExisting = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.inputAssetCode))
      return res.status(400).json({ error: "`Asset Code` is required." });

    const inputAssetCode = req.query.inputAssetCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and oldAssetCode = ? OR postTransferAssetCode = ? `;
    args = [inputAssetCode, inputAssetCode];

    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAssetsCE = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const administ = "IT";
    let args = [];
    sqlWhere = `and administrator = ? and active=?`;
    args = [administ, 1];
    const options = {
      top: "",
      order: "oldAssetCode desc , dateTimeUpdated desc ",
      // order: "itAssetCode desc , dateTimeUpdated desc ",
      // order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAssetsByPassCondem = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = `and active = ?  and categoryId <> ?`;
    args = [1, "30"];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
//display AssetsPendingTransfers
const getAssetsPendingTransfers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const activeUsera = util.currentUserToken(req).deptCode;

    let args = [];
    sqlWhere = `and transferStatus = ? and receivingDepartment =?`;
    args = [0, activeUsera];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//display Receiving Transfer mga for approval to (WHOLE) ADMIN
const getAssetsApprovalTransfers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    // const activeUsera = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = `and transferStatus = ? and active = ? and administrator <> ?`;
    args = [0, 0, "IT"];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

// by property
const getDistinctApprovalTransferFormNo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const transferReStatus = "Pending";
    const administrator = "IT";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = ` and transferReStatus=? and transferFormNo IS NOT NULL AND transferFormNo <> '' and administrator <> ?`;
    args = [transferReStatus, administrator];
    const options = {
      top: "",
      order: "transferRequestedDate desc",
    };
    return await assets.selectAssetsARANoDuplicate(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

// by IT dept
const getCEDistinctApprovalTransferFormNo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const transferReStatus = "Pending";
    const administrator = "IT";
    // const userDepartmentCode = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = ` and transferReStatus=? and transferFormNo IS NOT NULL AND transferFormNo <> '' and administrator = ?`;
    args = [transferReStatus, administrator];
    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssetsARANoDuplicate(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//display Receiving Transfer mga for approval to (PARTS) ADMIN
const getPartsApprovalTransfers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    // const activeUsera = util.currentUserToken(req).deptCode
    let args = [];
    sqlWhere = `and transferStatus = ? and active = ? and administrator <> ?`;
    args = [0, 0, "IT"];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//display Receiving Transfer IT SIDE
const getCEApprovalTransfers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = `and transferStatus = ? and administrator = ?`;
    args = [0, "IT"];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//display parts for approval to transfer IT SIDE
const getCEApprovalTransfersParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = `and transferStatus = ? and administrator = ?`;
    args = [0, "IT"];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//for condemn by department viewing WHOLE
const getAssetsCondemnTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const activeUsera = util.currentUserToken(req).deptCode;
    let args = [];
    sqlWhere = `and condemnStatus = ? and receivingDepartment =?`;
    args = [0, activeUsera];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//for condemn by department viewing Parts
const getPartsCondemnTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const userDepartment = util.currentUserToken(req).deptCode;

    let args = [];
    sqlWhere = `and active = ? and condemnStatus = ? and receivingDepartment =?`;
    args = [0, 0, userDepartment];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAllRetiredWholeAssetJoined = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Approved";
    const euipType = "WHOLE";
    let args = [];
    sqlWhere = `and condemHisto.condemReStatus = ? and condemHisto.Type=? `;
    args = [condemnReStatus, euipType];

    const options = {
      top: "",
      order: "condemHisto.dateTimeCreated asc ",
    };
    return await assets.approvedAssetsCondemLog(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const approvedAssetCondemDeptView = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;

    let sqlWhere = "";
    const condemnReStatus = "Approved";
    const euipType = "WHOLE";
    let args = [];
    sqlWhere = `and condemHisto.condemReStatus = ? and condemHisto.Type=? and assets.receivingDepartment = ? `;
    args = [condemnReStatus, euipType, userDeptCode];

    const options = {
      top: "",
      order: "condemHisto.dateTimeCreated asc ",
    };
    return await assets.approvedAssetsCondemLog(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const approvedPartsCondemDeptView = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;

    let sqlWhere = "";
    const condemnReStatus = "Approved";
    const euipType = "PARTS";
    let args = [];
    sqlWhere = `and condemHisto.condemReStatus = ? and condemHisto.Type=? and condemHisto.requestedDepartment = ? `;
    args = [condemnReStatus, euipType, userDeptCode];

    const options = {
      top: "",
      order: "condemHisto.dateTimeCreated asc ",
    };
    return await assets.approvedPartsCondemLog(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAllRetiredWholeAssetDepartment = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const internalAssetCode = req.query.code;
    const types = "WHOLE";
    const condemReStatus = "APPROVED";
    // let condemnReStatus ='Approved'
    let args = [];
    sqlWhere = `and asst.code=? and asstCompo.type=? and asstCompo.condemReStatus=? `;

    args = [internalAssetCode, types, condemReStatus];
    const options = {
      top: "",
      order: "asst.dateTimeUpdated desc ",
    };
    return await assets.selectRetiredAssetsLog(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//CE RETIRED WHOLE ASSET - IT
const getRetiredCEWholeAsset = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Approved";
    const administrator = "IT";
    let args = [];
    sqlWhere = `and condemnReStatus = ? and active=? and administrator=?`;
    args = [condemnReStatus, 0, administrator];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//CE RETIRED PARTS - IT
const getRetiredCEParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const condemnReStatus = "Approved";
    const administrator = "IT";
    let args = [];
    sqlWhere = `and condemnReStatus = ? and active=? and administrator =? `;
    args = [condemnReStatus, 0, administrator];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//for condemn property viewing all needs to be condemn WHOLEEEEE
const getAssetsCondemnApproval = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and condemnStatus = ? and active=? `;
    args = [0, 0];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//PROPERTY view condemn requests PARTS
const getPartsCondemnForApproval = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and condemnStatus = ? and active=? `;
    args = [0, 0];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//display old assets
const getOldAssets = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and (transferred = ? OR transferred IS NULL)
    and (deleted = ? OR deleted IS NULL)`;

    // const sqlWhereArr = [
    //   "(transferred = ? OR transferred IS NULL)",
    //   "(deleted = ? OR deleted IS NULL)",
    // ];

    args = [0, 0];
    const options = {
      top: "",
      order: "",
    };

    return await assets.selectOldAssets(
      // sqlWhereArr.length > 0 ? `WHERE ${sqlWhereArr.join(" AND ")}` : "",
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//POST REassignment
const postAssets = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  // const returnValue = await sqlHelper.transact(async (txn) => {
  // const assetsInfo = req.body.assetsInfo;
  const isAsset = req.body.isAsset;
  const { assetsInfo } = req.body;
  try {
    let generatedCode = "";
    if (isAsset) {
      let assetStatus = "";
      for (const asset of assetsInfo) {
        assetStatus = await sqlHelper.transact(async (txn) => {
          const catCode = asset.catCode;
          // const catCode = "catcode";
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..Assets",
            catCode.toUpperCase(),
            2,
            txn,
          );

          const activeUser = util.currentUserToken(req).code;

          const assetsPayload = {
            code: generatedCode,
            assetCode: asset.newAssetCode,
            oldAssetCode: asset.oldAssetCode,
            receivingDepartment: asset.deptCode,

            itemCode: asset.itemCode,
            categoryId: asset.categoryCode,
            dateReceived: asset.dateReceived,
            supplierId: asset.supplierName,
            poNumber: asset.purchaseOrderNo,
            invoiceNumber: asset.invoiceNo,
            genericName: asset.genericName,
            brandName: asset.brandName,
            model: asset.brandModel,
            serialNumber: asset.serialNo,
            unitCost: asset.unitCost,
            status: asset.assetTagStatus,
            location: asset.physicalLocation,
            // dateTimeUpdated: util.currentDateTime(),
            updatedBy: activeUser,
            createdBy: activeUser,
            specifications: asset.specifications,
            remarks: asset.remarks,
            administrator: asset.administrator,
          };

          // Insert Asset to the new Assets Table //
          const insertAssetStatus = await assets.insertAssets(
            assetsPayload,
            txn,
          );
          // Insert Asset to the new Assets Table //

          // Update Old Assets Table //
          await assets.updateOldAssets(
            {
              transferred: true,
              dateTimeTransferred: util.currentDateTime(),
            },
            { itemId: asset.itemId },
            txn,
          );
          // Update Old Assets Table //
          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
        });
      }
      assetStatus = { success: true };
      return assetStatus;
    } else {
      let assetComponentStatus = "";
      for (const assetComponent of assetsInfo) {
        assetComponentStatus = await sqlHelper.transact(async (txn) => {
          const catCode = assetComponent.catCode;
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..AssetsComponents",
            `${catCode.toUpperCase()}AC`,
            2,
            txn,
          );

          const assetCode = req.body.assetCode;
          const assetsComponentPayload = {
            code: generatedCode,
            assetCode: assetCode,
            genericName: assetComponent.genericName,
            brandName: assetComponent.brandName,
            internalAssetCode: assetComponent.newAssetCode,
          };

          // Insert Asset Component to the new Assets Component Table //
          //put condition inside insertAssetComponentStatus that if generated code if empty active field must be zero
          const insertAssetComponentStatus =
            await assetsComponents.insertAssetsComponents(
              assetsComponentPayload,
              txn,
            );
          // Insert Asset Component to the new Assets Component Table //

          // Update Old Assets Table //
          await assets.updateOldAssets(
            {
              transferred: true,
              dateTimeTransferred: util.currentDateTime(),
              parentAsset: assetComponent.itemId,
            },
            { itemId: assetComponent.itemId },
            txn,
          );
          // Update Old Assets Table //
          if (insertAssetComponentStatus.error) {
            return res
              .status(500)
              .json({ error: insertAssetComponentStatus.error });
          }
        });
      }
      assetComponentStatus = { success: true };
      return assetComponentStatus;
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  // });

  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

const getSearchCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.code))
      return res
        .status(400)
        .json({ error: "`Transfer Form Number` is required." });

    const transferFormNo = req.query.code;

    let sqlWhere = "";

    let args = [];
    sqlWhere = `and active=? and code =?`;
    args = [0, transferFormNo];

    const options = {
      top: "",
      order: "",
    };
    return await assets.selectAssets(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//post parts allotment transfer inserting mismo sa allotment history
const postPartsTransfer = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  // const returnValue = await sqlHelper.transact(async (txn) => {
  const { assetsInfo, transferToDeptCode, remarks, assetCodeResult, tfNumber } =
    req.body;

  // let nextTFNumber;
  let incrementedPart;

  // const formatDate = (dateStr) => {
  //   const date = new Date(dateStr);
  //   const year = date.getFullYear();
  //   return `${year}`;
  // };
  // const deff = 1;
  // const formattedDate = formatDate(util.currentDateTime());

  // const [pref, deyt, numericPart] = tfNumber.split("-");

  // if (formattedDate !== deyt) {
  //   incrementedPart = deff.toString().padStart(5, "0");
  //   nextTFNumber = `TF-${formattedDate}-${incrementedPart}`;
  // } else {
  //   const toInts = parseInt(numericPart);
  //   incrementedPart = (toInts + 1)
  //     .toString()
  //     .padStart(numericPart.length, "0");
  //   nextTFNumber = `TF-${formattedDate}-${incrementedPart}`;
  // }

  const formatDate = (dateStr) => new Date(dateStr).getFullYear().toString();
  const deff = 1;

  const formattedDate = formatDate(util.currentDateTime());
  const [pref, deyt, numericPart] = tfNumber.split("-");

  // Check if the year has changed
  if (formattedDate !== deyt) {
    incrementedPart = deff.toString().padStart(5, "0");
  } else {
    incrementedPart = (parseInt(numericPart, 10) + 1)
      .toString()
      .padStart(numericPart.length, "0");
  }

  const nextTFNumber = `TF-${formattedDate}-${incrementedPart}`;

  try {
    let generatedCode = "";
    const itemType = "PARTS";
    const codePrefix = "P";
    const transferReStatus = "Pending(by parts)";

    // let generatedTransferFormCode = "";
    // const tfPrefix = "TF";
    // generatedTransferFormCode = await sqlHelper.generateUniqueCode(
    //   "UERMINV..AssetsComponents",
    //   `${tfPrefix.toUpperCase()}`,
    //   6,
    //   txn,
    // );

    let assetStatus = "";
    for (const asset of assetsInfo) {
      assetStatus = await sqlHelper.transact(async (txn) => {
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetsComponents",
          `${codePrefix.toUpperCase()}`,
          6,
          txn,
        );

        const activeUser = util.currentUserToken(req).code;

        const assetsPayload = {
          code: generatedCode,
          assetCode: asset.assetCode,
          fromDeptCode: asset.receivingDepartment,
          toDeptCode: transferToDeptCode,
          transferReStatus: transferReStatus,
          genericName: asset.componentGenericName,
          internalAssetCode: asset.internalAssetCode,
          transferFormNo: nextTFNumber,
          updatedBy: activeUser,
          createdBy: activeUser,
          transferStatus: false,
          remarks: remarks,
          type: itemType,
          transferringRequestedDate: asset.transferRequestedDate,
          tranferringAssetCode: assetCodeResult,
          componentCode: asset.componentCode,
        };
        // Insert to allotment history tbl //
        const insertAssetStatus = await assets.insertAssetsTransfer(
          assetsPayload,
          txn,
        );

        // UPDATE PARTS INFO START//

        await assetsComponents.updateAssetsComponents(
          {
            transferredDepartment: transferToDeptCode,
            active: false,
            transferFormNo: nextTFNumber,
            transferStatus: false,
            transferReStatus: transferReStatus,
            transferingAssetCode: assetCodeResult,
            transferRequestedDate: util.currentDateTime(),
            // condemnReStatus:condemnReStatus
          },
          { code: asset.componentCode },
          txn,
        );

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      });
    }
    assetStatus = { success: true };
    return assetStatus;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  // });

  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

//updating department
const postAssetsTransferChangeDepartment = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  // const returnValue = await sqlHelper.transact(async (txn) => {
  // const assetsInfo = req.body.assetsInfo;
  // const isAsset = req.body.isAsset;
  const { assetsInfo, transferToDeptCode } = req.body;
  try {
    const generatedCode = "10001";

    let assetStatus = "";
    for (const asset of assetsInfo) {
      assetStatus = await sqlHelper.transact(async (txn) => {
        // const catCode = asset.catCode;
        // const catCode = "catcode";

        const activeUser = util.currentUserToken(req).code;

        const assetsPayload = {
          code: generatedCode,
          fromDeptCode: asset.deptCode,
          toDeptCode: transferToDeptCode,

          //  transferFormNo:transferFormNo,
          // dateTimeUpdated: util.currentDateTime(),
          updatedBy: activeUser,
          createdBy: activeUser,
          transferStatus: false,
          // remarks: remarks,
        };

        // Insert Asset to the new Assets Table //
        const insertAssetStatus = await assets.insertAssetsTransfer(
          assetsPayload,
          txn,
        );
        // Insert Asset to the new Assets Table //

        // Update Old Assets Table //
        await assets.updateAssets(
          {
            // receivingDepartment: transferToDeptCode,
            transferredDepartment: transferToDeptCode,
            // dateTimeUpdated: util.currentDateTime(),
            // transferFormNo:transferFormNo,
            updatedBy: activeUser,
            transferStatus: false,
            // remarks:remarks
            // active:false
          },
          { code: asset.code },
          txn,
        );
        // Update Old Assets Table //
        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      });
    }
    assetStatus = { success: true };
    return assetStatus;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  // });

  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

//SENDING REQUEST TO TRANSFER
const postAssetsTransfer = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    let generatedCode = "";
    const prefixs = "w";
    const transferReStat = "Pending(with Whole)";
    const transferReStatWhole = "Pending";
    const { assetsInfo, transferToDeptCode, remarks, partsInclude, tfNumber } =
      req.body;
    let nextAraNumber;
    let incrementedPart;

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      return `${year}`;
    };
    const deff = 1;
    const formattedDate = formatDate(util.currentDateTime());

    const [pref, deyt, numericPart] = tfNumber.split("-");

    if (formattedDate !== deyt) {
      incrementedPart = deff.toString().padStart(5, "0");
      nextAraNumber = `TF-${formattedDate}-${incrementedPart}`;
    } else {
      const toInts = parseInt(numericPart);
      incrementedPart = (toInts + 1)
        .toString()
        .padStart(numericPart.length, "0");
      nextAraNumber = `TF-${formattedDate}-${incrementedPart}`;
    }

    try {
      const itemType = "WHOLE";
      let assetStatus = "";
      for (const asset of assetsInfo) {
        const activeUser = util.currentUserToken(req).code;
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetAllotmentHistory",
          `${prefixs.toUpperCase()}-`,
          4,
          txn,
        );
        const assetsPayload = {
          code: generatedCode,
          assetCode: asset.oldAssetCode,
          fromDeptCode: asset.deptCode,
          toDeptCode: transferToDeptCode,
          transferFormNo: nextAraNumber,
          genericName: asset.genericName,
          transferReStatus: transferReStatWhole,
          transferringRequestedDate: util.currentDateTime(),
          internalAssetCode: asset.code,
          updatedBy: activeUser,
          createdBy: activeUser,
          transferStatus: false,
          remarks: remarks,
          type: itemType,
        };
        const insertAssetStatus = await assets.insertAssetsTransfer(
          assetsPayload,
          txn,
        );

        await assets.updateAssets(
          {
            transferredDepartment: transferToDeptCode,

            transferFormNo: nextAraNumber,
            updatedBy: activeUser,
            transferStatus: false,
            transferReStatus: transferReStatWhole,
            active: false,
            TransferRequestBy: activeUser,
            allotmentRemarks: remarks,
            transferRequestedDate: util.currentDateTime(),
          },
          { code: asset.code },
          txn,
        );

        for (const parts of partsInclude) {
          await assetsComponents.updateAssetsComponents(
            {
              transferredDepartment: transferToDeptCode,
              active: false,
              transferFormNo: nextAraNumber,
              transferReStatus: transferReStat,
              TransferRequestBy: activeUser,
              transferRequestedDate: util.currentDateTime(),
              // transferStatus:false,
            },
            { code: parts.componentCode },
            txn,
          );
        }
        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      }
      const itemTypes = "PARTS";
      const codePrefix = "P";

      const transferReStatus = "Pending(with Whole)";
      for (const parts of partsInclude) {
        assetStatus = await sqlHelper.transact(async (txn) => {
          const activeUser = util.currentUserToken(req).code;
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..AssetAllotmentHistory",
            codePrefix.toUpperCase(),
            4,
            txn,
          );
          const partsPayload = {
            code: generatedCode,
            assetCode: parts.assetCode,
            fromDeptCode: parts.receivingDepartment,
            toDeptCode: transferToDeptCode,
            transferReStatus: transferReStatus,
            genericName: parts.componentGenericName,
            internalAssetCode: parts.internalAssetCode,
            transferFormNo: nextAraNumber,
            updatedBy: activeUser,
            createdBy: activeUser,
            transferStatus: false,
            remarks: remarks,
            type: itemTypes,
            transferringRequestedDate: util.currentDateTime(),
            componentCode: parts.componentCode,
          };

          const insertAssetStatus = await assets.insertAssetsTransfer(
            partsPayload,
            txn,
          );

          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
        });
      }

      assetStatus = { success: true };
      return assetStatus;
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//post condemn 1/13/2024by department
const postAssetsCondemn = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const araTop1 = await findAraNoDirect(txn);
      let araME;
      if (araTop1.length > 0) {
        araME = araTop1[0].araForm;
      }
      const { assetsInfo, partsInclude } = req.body;
      let nextAraNumber;
      let incrementedPart;

      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        return `${year}`;
      };
      const deff = 1;
      const formattedDate = formatDate(util.currentDateTime());

      const [pref, deyt, numericPart] = araME.split("-");

      if (formattedDate !== deyt) {
        incrementedPart = deff.toString().padStart(5, "0");
        nextAraNumber = `ARA-${formattedDate}-${incrementedPart}`;
      } else {
        const toInts = parseInt(numericPart);
        incrementedPart = (toInts + 1)
          .toString()
          .padStart(numericPart.length, "0");
        nextAraNumber = `ARA-${formattedDate}-${incrementedPart}`;
      }

      const CondemnPrefix = "aclh";
      const condemnReStatus = "Pending";
      const condemnReStatusParts = "Pending(with whole)";

      let generatedCode = "";

      try {
        const types = "WHOLE";
        let assetStatus = "";
        const activeUser = util.currentUserToken(req).code;
        for (const asset of assetsInfo) {
          // assetStatus = await sqlHelper.transact(async (txn) => {
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..CondemnationHistory",
            `${CondemnPrefix.toUpperCase()}`,
            4,
            txn,
          );

          const assetsPayload = {
            code: generatedCode,
            assetCode: asset.oldAssetCode,
            internalAssetCode: asset.code,
            genericName: asset.genericName,
            requestedDepartment: asset.deptCode,
            condemRequestedDate: util.currentDateTime(),
            createdBy: activeUser,
            condemnStatus: false,
            condemReStatus: condemnReStatus,
            araForm: nextAraNumber,
            active: false,
            type: types,
          };
          const insertAssetStatus = await assets.insertAssetsCondemn(
            assetsPayload,
            txn,
          );
          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
          // });

          await assets.updateAssets(
            {
              condemnRequestBy: activeUser,
              updatedBy: activeUser,
              // auditedBy:auditedBy,
              araForm: nextAraNumber,
              condemnStatus: false,
              condemRequestedDate: util.currentDateTime(),
              condemnReStatus: condemnReStatus,
              active: false,
            },
            { code: asset.code },
            txn,
          );
          for (const parts of partsInclude) {
            await assetsComponents.updateAssetsComponents(
              {
                active: false,
                araForm: nextAraNumber,
                condemnReStatus: condemnReStatusParts,
                condemnRequestedDate: util.currentDateTime(),
                condemnRequestBy: activeUser,
              },
              { code: parts.componentCode },
              txn,
            );
          }
        }

        const itemTypes = "PARTS";
        const codePrefix = "P";
        let newCode = "";
        for (const parts of partsInclude) {
          assetStatus = await sqlHelper.transact(async (txn) => {
            newCode = await sqlHelper.generateUniqueCode(
              "UERMINV..CondemnationHistory",
              `${codePrefix.toUpperCase()}`,
              4,
              txn,
            );
            const activeUser = util.currentUserToken(req).code;

            const partsPayload = {
              code: newCode,
              assetCode: parts.componentAssetCode,
              requestedDepartment: parts.receivingDepartment,
              condemReStatus: condemnReStatus,
              createdBy: activeUser,
              genericName: parts.componentGenericName,
              internalAssetCode: parts.internalAssetCode,
              condemnStatus: false,
              type: itemTypes,
              condemRequestedDate: util.currentDateTime(),
              componentCode: parts.componentCode,
              araForm: nextAraNumber,
              active: true,
            };
            const insertAssetStatus = await assets.insertAssetsCondemn(
              partsPayload,
              txn,
            );

            if (insertAssetStatus.error) {
              return res.status(500).json({ error: insertAssetStatus.error });
            }
          });
        }

        assetStatus = { success: true };
        return assetStatus;
      } catch (error) {
        // console.log(error);
        return { error: error };
      }
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return { error: error };
  }
};

//duplicate temporary module o condem module
const condemDirectApproval = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  // const returnValue = await sqlHelper.transact(async (txn) => {
  try {
    const { assetsInfo, partsInclude, condemRequestInfo } = req.body;
    const CondemnPrefix = "aclha";
    const generatedARAForm = condemRequestInfo.araForm;
    const condemnReStatus = "Approved";
    const condemnReStatusParts = "Approved(with whole)";

    let generatedCode = "";
    const types = "WHOLE";
    let assetStatus = "";
    const activeUser = util.currentUserToken(req).code;
    const userDeptCode = util.currentUserToken(req).deptCode;
    for (const asset of assetsInfo) {
      assetStatus = await sqlHelper.transact(async (txn) => {
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${CondemnPrefix.toUpperCase()}`,
          4,
          txn,
        );
        const assetsPayload = {
          code: generatedCode,
          assetCode: asset.oldAssetCode,
          internalAssetCode: asset.code,
          genericName: asset.genericName,
          requestedDepartment: userDeptCode, //asset.deptCode
          condemRequestedDate: util.currentDateTime(),
          createdBy: activeUser,
          condemnStatus: true,
          condemReStatus: condemnReStatus,
          araForm: generatedARAForm,
          active: true,
          preapproved: true,
          type: types,
          releasedDate: condemRequestInfo.date,
          remarks: condemRequestInfo.remarks,
        };
        const insertAssetStatus = await assets.insertAssetsCondemn(
          assetsPayload,
          txn,
        );
        await assets.updateAssets(
          {
            condemnRequestBy: activeUser,
            updatedBy: activeUser,
            // auditedBy:auditedBy,
            araForm: generatedARAForm,
            condemnStatus: true,
            condemRequestedDate: util.currentDateTime(),
            condemnReStatus: condemnReStatus,
            active: false,
            releasedDate: condemRequestInfo.date,
            condemRemarks: condemRequestInfo.remarks,
          },
          { code: asset.code },
          txn,
        );
        // const actis = 1;

        for (const parts of partsInclude) {
          await assetsComponents.updateAssetsComponents(
            {
              active: false,
              araForm: generatedARAForm,
              condemnStatus: true,
              condemnReStatus: condemnReStatusParts,
              condemnRequestedDate: util.currentDateTime(),
              condemnRequestBy: activeUser,
              releasedDate: condemRequestInfo.date,
              condemRemarks: condemRequestInfo.remarks,
            },
            { code: parts.componentCode },
            txn,
          );
        }
        if (!insertAssetStatus) {
          return res.status(500).json();
        }
      });
    }

    const itemTypes = "PARTS";
    const codePrefix = "P";
    let newCode = "";
    for (const parts of partsInclude) {
      assetStatus = await sqlHelper.transact(async (txn) => {
        newCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${codePrefix.toUpperCase()}`,
          4,
          txn,
        );
        // const activeUser = util.currentUserToken(req).code

        const partsPayload = {
          code: newCode,
          assetCode: parts.componentAssetCode,
          requestedDepartment: userDeptCode, //parts.receivingDepartment
          condemReStatus: condemnReStatus,
          createdBy: activeUser,
          genericName: parts.componentGenericName,
          internalAssetCode: parts.internalAssetCode,
          condemnStatus: false,
          type: itemTypes,
          condemRequestedDate: util.currentDateTime(),
          componentCode: parts.componentCode,
          araForm: generatedARAForm,
          active: false,
          preapproved: true,
          releasedDate: condemRequestInfo.date,
          remarks: condemRequestInfo.remarks,
        };
        const insertAssetStatus = await assets.insertAssetsCondemn(
          partsPayload,
          txn,
        );

        if (!insertAssetStatus) {
          return res.status(500).json();
        }
      });
    }

    assetStatus = { success: true };
    return assetStatus;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  // });

  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

//condemn approved 1/13/2024 PROPERTY FINAL APPROVE
const postAssetsCondemnApproved = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const {
      assetsInfo,
      releasedDate,
      dispositionCode,
      // araFormInfo,
      partsIncluded,
    } = req.body;

    try {
      let generatedCode = "";
      const condemnReStatus = "Approved";
      const condemnReStatusParts = "Approved(with whole)";
      const CondemnPrefix = "ACHLA";
      let assetStatus = "";
      const types = "WHOLE";
      const activeUser = util.currentUserToken(req).code;
      for (const asset of assetsInfo) {
        assetStatus = await sqlHelper.transact(async (txn) => {
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..CondemnationHistory",
            `${CondemnPrefix.toUpperCase()}`,
            4,
            txn,
          );

          const assetsPayload = {
            code: generatedCode,
            assetCode: asset.oldAssetCode,
            requestedDepartment: asset.receivingDepartment,
            outcome: dispositionCode,
            araForm: asset.araForm,

            // dateTimeUpdated: util.currentDateTime(),
            createdBy: activeUser,
            condemnStatus: true,
            active: true,
            genericName: asset.genericName,
            type: types,
            internalAssetCode: asset.code,
            condemReStatus: condemnReStatus,
            condemRequestedDate: asset.condemRequestedDate,
            releasedDate: releasedDate,
            updatedBy: asset.condemnRequestBy,
          };

          const insertAssetStatus = await assets.insertAssetsCondemn(
            assetsPayload,
            txn,
          );

          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
        });
      }
      // Update Old Assets Table //
      for (const asset of assetsInfo) {
        await assets.updateAssets(
          {
            // dateTimeUpdated: util.currentDateTime(),
            updatedBy: activeUser,
            condemnStatus: true,
            condemnReStatus: condemnReStatus,
            condemnRequestBy: activeUser,
            active: false,
            releasedDate: releasedDate,
            outcome: dispositionCode,
          },
          { code: asset.code },
          txn,
        );
        // Update Old Assets Table //
      }
      for (const parts of partsIncluded) {
        // UPDATE PARTS INFO START//

        await assetsComponents.updateAssetsComponents(
          {
            active: false,
            // araForm:generatedTransferFormCode,
            condemnReStatus: condemnReStatusParts,
            condemnStatus: true,
            releasedDate: releasedDate,
            outcome: dispositionCode,
          },
          { code: parts.componentCode },
          txn,
        );
      }
      //UPDATE PARTS INFO END//
      const itemTypes = "PARTS";
      const codePrefix = "P";
      let newCode = "";

      for (const parts of partsIncluded) {
        assetStatus = await sqlHelper.transact(async (txn) => {
          newCode = await sqlHelper.generateUniqueCode(
            "UERMINV..CondemnationHistory",
            `${codePrefix.toUpperCase()}`,
            4,
            txn,
          );
          const activeUser = util.currentUserToken(req).code;

          const partsPayload = {
            code: newCode,
            assetCode: parts.componentAssetCode,
            requestedDepartment: parts.receivingDepartment,
            condemReStatus: condemnReStatusParts,
            createdBy: activeUser,
            outcome: dispositionCode,
            releasedDate: releasedDate,

            genericName: parts.componentGenericName,
            internalAssetCode: parts.internalAssetCode,
            condemnStatus: false,

            type: itemTypes,
            condemRequestedDate: parts.condemnRequestedDate,
            componentCode: parts.componentCode,
            araForm: parts.araForm,
            active: false,
          };
          const insertAssetStatus = await assets.insertAssetsCondemn(
            partsPayload,
            txn,
          );

          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
        });
      }

      assetStatus = { success: true };
      return assetStatus;
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const postPartsCondemnApproved = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  // const returnValue = await sqlHelper.transact(async (txn) => {
  const { assetsInfo, dispositionCode, releasedDate, partsInfo } = req.body;
  try {
    const condemnReStatus = "Approved";
    let generatedCode = "";
    const itemTypes = "PARTS";
    let assetStatus = "";
    const codePrefix = "PCHLA";
    for (const partsIncluded of partsInfo) {
      assetStatus = await sqlHelper.transact(async (txn) => {
        const activeUser = util.currentUserToken(req).code;
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${codePrefix.toUpperCase()}`,
          4,
          txn,
        );

        const assetsPayload = {
          code: generatedCode,
          assetCode: partsIncluded.componentAssetCode,
          requestedDepartment: partsIncluded.receivingDepartment,
          condemReStatus: condemnReStatus,
          createdBy: activeUser,
          genericName: partsIncluded.componentGenericName,
          internalAssetCode: partsIncluded.internalAssetCode,
          condemnStatus: true,
          type: itemTypes,
          condemRequestedDate: partsIncluded.condemnRequestedDate,
          componentCode: partsIncluded.componentCode,
          araForm: partsIncluded.araForm,
          active: true,
          releasedDate: releasedDate,
          outcome: dispositionCode,
        };

        // Insert Asset to the new CondemnationHistory //
        const insertAssetStatus = await assets.insertAssetsCondemn(
          assetsPayload,
          txn,
        );
        // Insert Asset to the new CondemnationHistory //

        // UPDATE PARTS INFO START//
        const internalAssetCodeToNull = null;
        await assetsComponents.updateAssetsComponents(
          {
            releasedDate: releasedDate,
            outcome: dispositionCode,
            updatedBy: activeUser,
            active: false,
            condemnStatus: true,
            condemnReStatus: condemnReStatus,
            movedAssetCode: partsIncluded.internalAssetCode,
            internalAssetCode: internalAssetCodeToNull,
          },
          { araForm: assetsInfo.araForm },
          txn,
        );
        //UPDATE PARTS INFO END//

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      });
    }

    assetStatus = { success: true };
    return assetStatus;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  // });

  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

const postSendCondemnRequestParts = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });
  const { assetsInfo } = req.body;
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const araTop1 = await findAraNoDirect(txn);
      let araME;
      if (araTop1.length > 0) {
        araME = araTop1[0].araForm;
      }
      let nextAraNumber;
      let incrementedPart;

      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        return `${year}`;
      };
      const deff = 1;
      const formattedDate = formatDate(util.currentDateTime());

      const [pref, deyt, numericPart] = araME.split("-");
      if (formattedDate !== deyt) {
        incrementedPart = deff.toString().padStart(5, "0");
        nextAraNumber = `ARA-${formattedDate}-${incrementedPart}`;
      } else {
        const toInts = parseInt(numericPart);
        incrementedPart = (toInts + 1)
          .toString()
          .padStart(numericPart.length, "0");
        nextAraNumber = `ARA-${formattedDate}-${incrementedPart}`;
      }

      // let AFPrefix= "ARA-"
      const condemnReStatus = "Pending";
      const chlRestatus = "Pending(parts only)";
      // let generatedARAForm = "";
      const activeUser = util.currentUserToken(req).code;
      // generatedARAForm = await sqlHelper.generateUniqueCode(
      //       "UERMINV..AssetsComponents",
      //       `${AFPrefix.toUpperCase()}`,
      //       4,
      //       txn
      //     );
      try {
        const CondemnPrefix = "PCHL";
        let generatedCode = "";
        const type = "PARTS";

        let assetStatus = "";
        for (const asset of assetsInfo) {
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..CondemnationHistory",
            `${CondemnPrefix.toUpperCase()}`,
            4,
            txn,
          );
          assetStatus = await sqlHelper.transact(async (txn) => {
            const assetsPayload = {
              code: generatedCode,
              assetCode: asset.oldAssetCode,
              requestedDepartment: asset.receivingDepartment,
              condemReStatus: chlRestatus,
              internalAssetCode: asset.internalAssetCode,
              //  requestedDepartment:transferToDeptCode,
              condemRequestedDate: util.currentDateTime(),
              componentCode: asset.componentCode,
              // assetCode: asset.assetCode,
              // dateTimeUpdated: util.currentDateTime(),
              // updatedBy: activeUser,
              genericName: asset.componentGenericName,
              createdBy: activeUser,
              condemnStatus: false,
              // auditedBy:auditedBy,
              araForm: nextAraNumber,
              type: type,
              active: false,
            };

            const insertAssetStatus = await assets.insertAssetsCondemn(
              assetsPayload,
              txn,
            );

            // let clearInternalAssetCode = null
            await assetsComponents.updateAssetsComponents(
              {
                //  movedAssetCode:asset.internalAssetCode,
                //   internalAssetCode:clearInternalAssetCode,
                active: false,
                araForm: nextAraNumber,
                condemnStatus: false,
                condemnReStatus: condemnReStatus,
                condemnRequestedDate: util.currentDateTime(),
                updatedBy: util.currentUserToken(req).code,
                condemnRequestBy: activeUser,
              },
              { code: asset.componentCode },
              txn,
            );

            if (insertAssetStatus.error) {
              return res.status(500).json({ error: insertAssetStatus.error });
            }
          });
        }

        assetStatus = { success: true };
        return assetStatus;
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const partsCondemDirectApproval = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  // const returnValue = await sqlHelper.transact(async (txn) => {
  const { assetsInfo, condemRequestInfo } = req.body;
  const generatedARAForm = condemRequestInfo.araForm;
  const condemnReStatus = "Approved";
  try {
    const CondemnPrefix = "PCHLA";
    let generatedCode = "";
    const type = "PARTS";

    let assetStatus = "";
    for (const asset of assetsInfo) {
      assetStatus = await sqlHelper.transact(async (txn) => {
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${CondemnPrefix.toUpperCase()}`,
          4,
          txn,
        );
        const activeUser = util.currentUserToken(req).code;
        const userDeptCode = util.currentUserToken(req).deptCode;

        const assetsPayload = {
          code: generatedCode,
          requestedDepartment: userDeptCode,
          condemReStatus: condemnReStatus,
          internalAssetCode: asset.internalAssetCode,
          condemRequestedDate: util.currentDateTime(),
          componentCode: asset.componentCode,
          assetCode: asset.assetCode,
          genericName: asset.componentGenericName,
          createdBy: activeUser,
          condemnStatus: true,
          araForm: generatedARAForm,
          type: type,
          preapproved: true,
          active: true,
          releasedDate: condemRequestInfo.date,
          remarks: condemRequestInfo.remarks,
        };

        const insertAssetStatus = await assets.insertAssetsCondemn(
          assetsPayload,
          txn,
        );

        const internalAssetCodeToNull = null;
        await assetsComponents.updateAssetsComponents(
          {
            releasedDate: condemRequestInfo.date,
            condemRemarks: condemRequestInfo.remarks,
            // remarks:condemRequestInfo.remarks,
            active: false,
            araForm: generatedARAForm,
            condemnStatus: true,
            condemnReStatus: condemnReStatus,
            condemnRequestedDate: util.currentDateTime(),
            updatedBy: util.currentUserToken(req).code,
            condemnRequestBy: activeUser,

            movedAssetCode: asset.internalAssetCode,
            internalAssetCode: internalAssetCodeToNull,
          },
          { code: asset.componentCode },
          txn,
        );

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      });
    }
    assetStatus = { success: true };
    return assetStatus;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  // });

  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

//POST INSERT EXCEL DATA USING
const postjsonData = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const { nonEmptyRows, departmentCode, equipmentType } = req.body;
  const trimObjectStrings = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key].trim();
      }
    }
    return obj;
  };

  // const returnValue = await sqlHelper.transact(async (txn) => {
  try {
    let assetStatus = "";
    const uploadedBy = "0000";

    assetStatus = await sqlHelper.transact(async (txn) => {
      const allAssets1 = await findAssetCodeDirect(txn);
      for (let jsonData of nonEmptyRows) {
        jsonData = trimObjectStrings(jsonData);
        const generatedCodeUniqueAsset = await sqlHelper.generateUniqueCode(
          "UERMINV..Assets",
          `AUPLOAD`,
          6,
          txn,
        );
        const originMapping = {
          "Purchase Order": "11",
          Contract: "12",
          Donation: "13",
          Audit: "14",
        };
        const classificationMapping = {
          "Computer Equipment": "21",
          "Medical Equipment": "22",
          "Office Equipment": "23",
          "GSD Equipment": "24",
          "Engineering Tools and Equipment": "25",
          "Furniture and Fixture": "26",
          Books: "28",
          "Instructional Materials": "29",
        };
        // let dispositionMapping = {

        //   'Auction (Emp)':	'31',
        //   'Separate Bidding':	'32',
        //   'Donate':	'33',
        //   'Dismantle':	'34',
        //   'Trade in'	:'35',
        //  'Scrap'	:'36'};
        if (equipmentType === "Whole" && jsonData["TYPE"] === "Whole") {
          const jsonPayload = {
            BrandName: jsonData["BRAND"],
            ItemCode: jsonData["ITEM CODE"],
            OldAssetCode: jsonData[" ASSET CODE"],
            Code: generatedCodeUniqueAsset,
            // Outcome: dispositionMapping [jsonData['DISPOSITION']]||jsonData['DISPOSITION'],
            Outcome: jsonData["DISPOSITION"],
            CategoryId:
              classificationMapping[jsonData["CLASSIFICATION"]] ||
              jsonData["CLASSIFICATION"],
            DateReceived: jsonData["PURCHASE/ DONATION DATE"],
            ReceivingDepartment: departmentCode,
            SupplierId: jsonData["SUPPLIER"],
            PONumber: jsonData.PONumber,
            InvoiceNumber: jsonData.InvoiceNumber,
            GenericName: jsonData["GENERIC NAME"],
            Donor: jsonData["DONOR"],
            Model: jsonData["MODEL"],
            SerialNumber: jsonData["SERIAL NO."],
            Specifications: jsonData["SPECIFICATIONS"],
            UnitCost: jsonData["UNIT COST"],
            Status: jsonData.Status,
            Location: jsonData["LOCATION"],
            Capitalized: jsonData["CAPITALIZED"],
            TransferredDepartment: jsonData.TransferredDepartment,
            CreatedBy: uploadedBy,
            UpdatedBy: uploadedBy,
            DateTimeUpdated: util.currentDateTime(),
            Remarks: jsonData.Remarks,
            OriginId: originMapping[jsonData["ORIGIN"]] || jsonData["ORIGIN"],
            ReceivingReportNo: jsonData["RR NO."],
            NetCost: jsonData["NET UNIT COST"],
            Discount: jsonData["DISCOUNT"],
            AccountingAssetCode: jsonData.AccountingAssetCode,
            Administrator: jsonData["ADMINISTRATOR"],
            CountedBy: jsonData["Counted By"],
            AssetTagStatus: jsonData["ASSET TAG STATUS"],
            AccountingRefNo: jsonData["ACCOUNTING REFERENCE"],
            ItAssetCode: jsonData["IT ASSET CODE"],
            totalSets: jsonData["totalSets"] ? jsonData["totalSets"] : "",
            AraForm: jsonData["ARA FORM NO."],
            CondemRequestedDate: jsonData["ARA FORM DATE"],
            AuditedBy: jsonData["AUDITED BY"],
            Active: jsonData["FINAL APPROVAL"] === "Approved" ? 0 : 1,
            CondemnReStatus: jsonData["FINAL APPROVAL"] ? "Approved" : "N/A",
          };

          const insertAssetStatus = await assets.insertExcelData(
            jsonPayload,
            txn,
          );
          if (insertAssetStatus.error) {
            throw insertAssetStatus.error;
          }
        } else if (equipmentType === "Part" && jsonData["TYPE"] === "Part") {
          const generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..AssetsComponents",
            `ACUPLOAD`,
            6,
            txn,
          );

          const checkCode =
            jsonData["ASSET CODE OF MAIN ITEM"] || jsonData[" ASSET CODE"];
          let tempoSave;
          let finalApprovalStatus = "Approved";
          const assetExists = allAssets1.find(
            (asset) => asset.oldAssetCode === checkCode,
          );
          if (assetExists) {
            tempoSave = assetExists.code;
            finalApprovalStatus = "Approved(with whole)";
          }

          const jsonPayload = {
            internalAssetCode: tempoSave,
            BrandName: jsonData["BRAND"],
            ItemCode: jsonData["ITEM CODE"],
            AssetCode:
              jsonData["ASSET CODE OF MAIN ITEM"] || jsonData[" ASSET CODE"],
            Code: generatedCode,
            GenericName: jsonData["GENERIC NAME"],
            CreatedBy: uploadedBy,
            UpdatedBy: uploadedBy,
            AuditedBy: jsonData["AUDITED BY"],
            DateTimeUpdated: util.currentDateTime(),
            CategoryId:
              classificationMapping[jsonData["CLASSIFICATION"]] ||
              jsonData["CLASSIFICATION"],
            // Outcome: dispositionMapping [jsonData['DISPOSITION']]||jsonData['DISPOSITION'],
            Outcome: jsonData["DISPOSITION"],
            OriginId: originMapping[jsonData["ORIGIN"]] || jsonData["ORIGIN"],
            ReceivingReportNo: jsonData["RR NO."],
            NetCost: jsonData["NET UNIT COST"],
            Discount: jsonData["DISCOUNT"],
            Administrator: jsonData["ADMINISTRATOR"],
            AssetTagStatus: jsonData["ASSET TAG STATUS"],
            AccountingRefNo: jsonData["ACCOUNTING REFERENCE"],
            ItAssetCode: jsonData["IT ASSET CODE"],
            DateReceived: jsonData["PURCHASE/ DONATION DATE"],
            ReceivingDepartment: departmentCode,
            Supplier: jsonData["SUPPLIER"],
            // PONumber: jsonData.PONumber,
            // InvoiceNumber: jsonData.InvoiceNumber,
            Donor: jsonData["DONOR"],
            Model: jsonData["MODEL"],
            SerialNo: jsonData["SERIAL NO."],
            Specifications: jsonData["SPECIFICATIONS"],
            UnitCost: jsonData["UNIT COST"],
            Active: jsonData["FINAL APPROVAL"] === "Approved" ? 0 : 1,
            Location: jsonData["LOCATION"],
            Capitalized: jsonData["CAPITALIZED"],
            CondemnReStatus: jsonData["FINAL APPROVAL"]
              ? finalApprovalStatus
              : "N/A",
            AraForm: jsonData["ARA FORM NO."],
            CondemnRequestedDate: jsonData["ARA FORM DATE"],
            TransferredDepartment: jsonData.TransferredDepartment,
          };
          const insertAssetStatus =
            await assetsComponents.insertAssetsComponents(jsonPayload, txn);
          if (insertAssetStatus.error) {
            throw insertAssetStatus.error;
          }
        }
      }
    });

    assetStatus = { success: true };
    return assetStatus;
  } catch (error) {
    return { error: error.message };
  }
  // });

  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

const postRegisterAssetCE = async function (req, res) {
  try {
    if (util.empty(req.body))
      return res.status(400).json({ error: "`body` is required." });
    const {
      assetsInfo,
      assetCodeUserInput,
      itAssetCodePrefixInput,
      entries,
      formattedDates,
      lastDig,
      accountableEmp,
      accountabilityRef,
    } = req.body;

    const rrLenght = lastDig.length;
    let numeratorLastDigit;

    if (rrLenght > 0) {
      numeratorLastDigit = lastDig[0].allMaxLastSegment;
    } else {
      const defaultCount = 0;
      numeratorLastDigit = defaultCount;
    }

    const [prefix, category, defaultStartPart, lastPart] = //for asset code
      assetCodeUserInput.split("-");
    const lastPartAsInt = parseInt(lastPart, 10); //for asset code

    const numEntries = parseInt(entries);
    const totalSetss = numEntries + parseInt(rrLenght);

    const returnValue = await sqlHelper.transact(async (txn) => {
      for (let i = 0; i < numEntries; i++) {
        let loopIncrement;

        if (rrLenght > 0) {
          const numeratorLastDigitInteger = parseInt(numeratorLastDigit);
          loopIncrement = `${numeratorLastDigitInteger + i}`;
        } else {
          loopIncrement = `${numeratorLastDigit + i}`;
        }
        const finalLastDigit = parseInt(loopIncrement); //11

        let newAssetsCode = "";
        let incrementedPart;
        const finalItAssetCode = `${itAssetCodePrefixInput.toUpperCase()}-${formattedDates}-${finalLastDigit + 1}`;

        if (assetCodeUserInput !== "") {
          incrementedPart = (lastPartAsInt + i).toString().padStart(3, "0");
          const combi = `${prefix.toUpperCase()}-${category.toUpperCase()}`;
          newAssetsCode = `${combi}-${defaultStartPart}-${incrementedPart}`;

          // Check if newAssetCode already exists in the database
          let existingAsset = await assets.selectAssets(
            `and oldAssetCode = ?`,
            [newAssetsCode],
            {},
            txn,
          );
          let nextAvailablePart = lastPartAsInt + 1;

          while (existingAsset.length > 0) {
            nextAvailablePart++; // Increment to check next
            incrementedPart = nextAvailablePart.toString().padStart(3, "0");
            newAssetsCode = `${combi}-${defaultStartPart}-${incrementedPart}`;

            existingAsset = await assets.selectAssets(
              `and oldAssetCode = ?`,
              [newAssetsCode],
              {},
              txn,
            );
          }
        }

        let generatedCode = "";
        const catCode = "CE";
        const admin = "IT";

        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..Assets",
          `${catCode}A`,
          6,
          txn,
        );

        const activeUser = util.currentUserToken(req).code;

        let finalCaptilstatus = "";
        const userInput = assetsInfo.netCost;
        const defaultCon = 20000.0;

        if (userInput.trim() !== "") {
          const sanitizedUserInput = parseFloat(
            userInput.replace(/[\s,]/g, ""),
          );

          if (sanitizedUserInput > defaultCon) {
            finalCaptilstatus = "Capitalized";
          }
        } else {
          finalCaptilstatus = "";
        }

        const catMeCory = 21;
        const assetsPayload = {
          code: generatedCode,
          totalSets: totalSetss,
          oldAssetCode: newAssetsCode,
          receivingDepartment: assetsInfo.deptCode,
          itAssetCode: finalItAssetCode,
          accountableEmployee: accountableEmp,
          originId: assetsInfo.originCode,
          itemCode: assetsInfo.itemCode.toUpperCase(),
          categoryId: catMeCory,
          dateReceived: assetsInfo.dateReceived,
          supplierId: assetsInfo.supplierId,
          receivingReportNo: assetsInfo.receivingReportNo.toUpperCase(),
          netCost: assetsInfo.netCost,
          discount: assetsInfo.discount,
          assetTagStatus: assetsInfo.assetTagStatus,
          administrator: admin,
          donor: assetsInfo.donor,
          capitalized: finalCaptilstatus,
          donationNo: assetsInfo.donationNo,
          accountingAssetCode: assetsInfo.accountingAssetCode,
          invoiceNumber: assetsInfo.invoiceNo,
          genericName: assetsInfo.genericName,
          brandName: assetsInfo.brandName,
          model: assetsInfo.brandModel,
          serialNumber: assetsInfo.serialNo,
          specifications: assetsInfo.specifications,
          unitCost: assetsInfo.unitCost,
          remarks: assetsInfo.remarks,
          accountabilityRefNo: accountabilityRef,
          createdBy: activeUser,
          location: assetsInfo.physicalLocation,
        };

        // Insert Asset to the new Assets Table //
        const insertAssetStatus = await assets.insertAssets(assetsPayload, txn);

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      }
      if (rrLenght > 0) {
        const updateAssets = await assets.updateAssets(
          {
            totalSets: totalSetss,
          },
          {
            itemCode: assetsInfo.itemCode,
            receivingReportNo: assetsInfo.receivingReportNo,
          },
          txn,
        );
        return res.status(200).json(updateAssets);
      }
      // If all assets inserted successfully, return success

      return { success: true };
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json({ success: true });
    // return { success: true };
    // Return success if all assets inserted successfully
    // return res.json({ success: true });
    // } catch (error) {
    //   console.log(error);
    // }
  } catch (error) {
    return { error: error };
  }
};

//manual CE Reg
const manualRegistrationCe = async function (req, res) {
  try {
    if (util.empty(req.body))
      return res.status(400).json({ error: "`body` is required." });
    const {
      assetsInfo,
      assetCodeUserInput,
      itAssetCodePrefixInput,
      catCode,
      accountableEmp,
    } = req.body;

    let digitsAfterSlash = "1";
    let partBeforeSlash = itAssetCodePrefixInput.split("/")[0];

    if (itAssetCodePrefixInput.includes("/")) {
      digitsAfterSlash = itAssetCodePrefixInput.split("/")[1];
    }

    if (
      !itAssetCodePrefixInput.includes("/") &&
      itAssetCodePrefixInput !== ""
    ) {
      if (!/-\d$/.test(partBeforeSlash)) {
        partBeforeSlash += "-1";
      }
    }
    if (itAssetCodePrefixInput === "") {
      partBeforeSlash = "";
      digitsAfterSlash = "";
    }

    const returnValue = await sqlHelper.transact(async (txn) => {
      let generatedCode = "";
      // const catCode = "CE";
      const admin = "IT";

      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..Assets",
        `${catCode}A`,
        6,
        txn,
      );

      const activeUser = util.currentUserToken(req).code;

      let finalCaptilstatus = "";
      const userInput = assetsInfo.netCost;
      const defaultCon = 20000.0;

      if (userInput.trim() !== "") {
        const sanitizedUserInput = parseFloat(userInput.replace(/[\s,]/g, ""));

        if (sanitizedUserInput > defaultCon) {
          finalCaptilstatus = "Capitalized";
        }
      } else {
        finalCaptilstatus = "";
      }

      // const catMeCory = 21;
      const assetsPayload = {
        code: generatedCode,
        totalSets: digitsAfterSlash,
        oldAssetCode: assetCodeUserInput,
        receivingDepartment: assetsInfo.deptCode,
        assetTagStatus: assetsInfo.assetTagStatus,
        itAssetCode: partBeforeSlash.toUpperCase(),
        accountableEmployee: accountableEmp.toUpperCase(),
        originId: assetsInfo.originCode,
        itemCode: assetsInfo.itemCode.toUpperCase(),
        categoryId: assetsInfo.categoryId,
        dateReceived: assetsInfo.dateReceived,
        supplierId: assetsInfo.supplierId,
        receivingReportNo: assetsInfo.receivingReportNo.toUpperCase(),
        netCost: assetsInfo.netCost,
        discount: assetsInfo.discount,
        administrator: admin,
        donor: assetsInfo.donor,
        capitalized: finalCaptilstatus,
        donationNo: assetsInfo.donationNo,
        accountingAssetCode: assetsInfo.accountingAssetCode,
        invoiceNumber: assetsInfo.invoiceNo,
        genericName: assetsInfo.genericName,
        brandName: assetsInfo.brandName,
        model: assetsInfo.brandModel,
        serialNumber: assetsInfo.serialNo,
        specifications: assetsInfo.specifications,
        unitCost: assetsInfo.unitCost,
        remarks: assetsInfo.remarks,
        createdBy: activeUser,
        location: assetsInfo.physicalLocation,
      };

      const insertAssetStatus = await assets.insertAssets(assetsPayload, txn);

      if (!insertAssetStatus) {
        return res.status(500).json();
      }

      return { success: true };
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json({ success: true });
  } catch (error) {
    return { error: error };
  }
};

const postRegisterAsset = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const {
    assetsInfo,
    catCoding,
    oldAssetCode,
    entries,
    accountableEmployee,
    accountabilityRef,
  } = req.body;

  try {
    const [prefix, category, defaultStartPart, lastPart] =
      oldAssetCode.split("-");
    const lastPartAsInt = +lastPart;
    const numEntries = +entries;

    const returnValue = await sqlHelper.transact(async (txn) => {
      const combi = `${prefix.toUpperCase()}-${category.toUpperCase()}`;
      let nextAvailablePart = lastPartAsInt; // Track available number
      // const assetsBatch = [];
      for (let i = 0; i < numEntries; i++) {
        let incrementedPart = (nextAvailablePart++).toString().padStart(3, "0");
        let newAssetsCode = `${combi}-${defaultStartPart}-${incrementedPart}`;

        // Check if newAssetsCode already exists in the database
        while (
          (
            await assets.selectAssets(
              `and oldAssetCode = ?`,
              [newAssetsCode],
              {},
              txn,
            )
          ).length > 0
        ) {
          incrementedPart = (nextAvailablePart++).toString().padStart(3, "0");
          newAssetsCode = `${combi}-${defaultStartPart}-${incrementedPart}`;
        }

        // Generate Unique Code
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..Assets",
          `${catCoding.toUpperCase()}A`,
          6,
          txn,
        );

        // Determine Capitalization Status
        const finalCaptilstatus =
          +assetsInfo.netCost.replace(/[\s,]/g, "") > 20000
            ? "Capitalized"
            : "";

        // Prepare Asset Payload
        const activeUser = util.currentUserToken(req).code;
        const assetsPayload = {
          code: generatedCode,
          accountableEmployee,
          assetCode: assetsInfo.newAssetCode,
          oldAssetCode: newAssetsCode,
          receivingDepartment: assetsInfo.deptCode,
          assetTagStatus: assetsInfo.assetTagStatus,
          accountingRefNo: assetsInfo.accountingRefNo,
          itAssetCode: assetsInfo.itAssetCode,
          originId: assetsInfo.originCode,
          itemCode: assetsInfo.itemCode,
          categoryId: assetsInfo.categoryId,
          dateReceived: assetsInfo.dateReceived,
          warrantyDate: assetsInfo.warrantyDate,
          supplierID: assetsInfo.supplierId,
          receivingReportNo: assetsInfo.receivingReportNo.toUpperCase(),
          netCost: assetsInfo.netCost,
          capitalized: finalCaptilstatus,
          discount: assetsInfo.discount,
          totalSets: numEntries,
          accountabilityRefNo: accountabilityRef,
          administrator: assetsInfo.administrator,
          accountingAssetCode: assetsInfo.accountingAssetCode,
          invoiceNumber: assetsInfo.invoiceNo,
          genericName: assetsInfo.genericName,
          brandName: assetsInfo.brandName,
          model: assetsInfo.brandModel,
          serialNumber: assetsInfo.serialNo,
          specifications: assetsInfo.specifications,
          unitCost: assetsInfo.unitCost,
          remarks: assetsInfo.remarks,
          createdBy: activeUser,
          location: assetsInfo.physicalLocation,
        };
        const insertAssetStatus = await assets.insertAssets(assetsPayload, txn);
        // assetsBatch.push(assetsPayload);
        // const insertAssetStatus = await assets.insertAssets(assetsBatch, txn);
        // if (insertAssetStatus.error) throw new Error(insertAssetStatus.error);
        // Insert into Database
        // const insertAssetStatus = await assets.insertAssets(assetsBatch, txn);
        if (insertAssetStatus.error) throw new Error(insertAssetStatus.error);
      }

      return { success: true };
    });

    return res.json(returnValue);
    // if (returnValue.error !== undefined) {
    //   return res.status(500).json({ error: `${returnValue.error}` });
    // }

    // return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//for audit update only
const auditAssetUpdate = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo } = req.body;

    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await assets.updateAssets(
        {
          genericName: assetsInfo.genericName,
          // assetCode: assetsInfo.assetCode,
          itemCode: assetsInfo.itemCode,
          // categoryId: assetsInfo.categoryId,
          // accountingRefNo: assetsInfo.accountingRefNo,
          assetTagStatus: assetsInfo.assetTagStatus,
          dateReceived: assetsInfo.dateReceived,
          supplierId: assetsInfo.supplierId,
          // poNumber: assetsInfo.poNumber,
          // invoiceNumber: assetsInfo.invoiceNumber,
          // receivingReportNo: assetsInfo.receivingReportNo,
          // netCost: assetsInfo.netCost,
          // discount: assetsInfo.discount,
          location: assetsInfo.location,
          brandName: assetsInfo.brandName,
          // unitCost: assetsInfo.unitCost,
          model: assetsInfo.model,
          serialNumber: assetsInfo.serialNumber,
          updatedBy: activeUser,
          specifications: assetsInfo.specifications,
          remarks: assetsInfo.remarks,

          // donationNo: assetsInfo.donationNo,
          // donor: assetsInfo.donor,
          // capitalized: assetsInfo.capitalized,
        },
        { code: assetsInfo.code },
        txn,
      );

      // UPDATE PARTS INFO START//
      await assetsComponents.updateAssetsComponents(
        {
          physicalLocation: assetsInfo.physicalLocation,
        },
        { internalAssetCode: assetsInfo.code },
        txn,
      );
      //UPDATE PARTS INFO END//

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

//assigning of asset code mga CE na wala pang assetcode
const putAssignAssetCodeCE = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo, assetCodeResult } = req.body;
    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await assets.updateAssets(
        {
          // dateTimeUpdated: util.currentDateTime(),
          oldAssetCode: assetCodeResult,
          updatedBy: activeUser,
        },
        { code: assetsInfo.code }, //where clause
        txn,
      );

      // UPDATE PARTS INFO START//
      await assetsComponents.updateAssetsComponents(
        {
          // receivingDepartment: assetsInfo.deptCode,
          // assetCode: assetsInfo.oldAssetCode,
          assetCode: assetCodeResult,
          updatedBy: activeUser,
        },
        { internalAssetCode: assetsInfo.code },
        txn,
      );
      //UPDATE PARTS INFO END//

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      // console.error(error);
      return res
        .status(500)
        .json({ error: "Internal server error. this is catch" });
    }
  });
  return returnValue;
};

//APPROVAL TRANSFER REQUEST WHOLE
const putAssetsTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo, assetComponents, partsLeftOut } = req.body; //assetTransferInfo,

    let updateAssetInfo = "";
    const transferReStatus = "Approved";
    const transferReStatusParts = "Approved(with whole)";
    const itemType = "WHOLE";
    try {
      for (const asset of assetsInfo) {
        // let assetStatus = "";
        // assetStatus = await sqlHelper.transact(async (txn) => {
        const activeUser = util.currentUserToken(req).code;
        // const transferReStatus = "Approved";
        const prefixs = "TFA";
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetAllotmentHistory",
          prefixs.toUpperCase(),
          4,
          txn,
        );
        const assetsPayload = {
          code: generatedCode,
          internalAssetCode: asset.code,
          assetCode: asset.oldAssetCode,
          fromDeptCode: asset.receivingDepartment,
          toDeptCode: asset.transferredDepartment,
          transferFormNo: asset.transferFormNo,
          genericName: asset.genericName,
          transferReStatus: transferReStatus,
          updatedBy: activeUser,
          createdBy: activeUser,
          transferStatus: false,
          // remarks:remarks,
          transferringRequestedDate: asset.transferRequestedDate,
          type: itemType,
        };
        await assets.insertAssetsTransfer(assetsPayload, txn);
        // });

        updateAssetInfo = await assets.updateAssets(
          {
            receivingDepartment: asset.transferredDepartment,
            active: true,
            transferStatus: true,
            transferReStatus: transferReStatus,
          },
          // { transferFormNo: assetTransferInfo.transferFormNo }, //where clause
          { code: asset.code },
          txn,
        );
        if (assetComponents.length > 0) {
          for (const compoParts of assetComponents) {
            //   let assetStatus = "";
            //   assetStatus = await sqlHelper.transact(async (txn) => {
            await assetsComponents.updateAssetsComponents(
              {
                receivingDepartment: asset.transferredDepartment,
                transferStatus: true,
                active: true,
                transferReStatus: transferReStatusParts,
              },
              { code: compoParts.componentCode },
              // { transferFormNo: assetTransferInfo.transferFormNo },
              txn,
            );
            // });
          }
        }

        if (partsLeftOut.length > 0) {
          for (const leftParts of partsLeftOut) {
            // let codeStatus = "";
            //   assetStatus = await sqlHelper.transact(async (txn) => {
            await assetsComponents.updateAssetsComponents(
              {
                previousInternalAssetCode: leftParts.internalAssetCode,
                internalAssetCode: null,
              },
              { code: leftParts.componentCode },
              // { transferFormNo: assetTransferInfo.transferFormNo },
              txn,
            );
            // });
          }
        }
      }
      const itemTypes = "PARTS";
      const codePrefix = "P";
      for (const parts of assetComponents) {
        // const assetStatus = "";
        // assetStatus = await sqlHelper.transact(async (txn) => {
        const activeUser = util.currentUserToken(req).code;
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetsComponents",
          codePrefix.toUpperCase(),
          4,
          txn,
        );
        const partsPayload = {
          code: generatedCode,
          assetCode: parts.componentAssetCode,
          fromDeptCode: parts.receivingDepartment,
          toDeptCode: parts.transferredDepartment,
          transferReStatus: transferReStatusParts,
          genericName: parts.componentGenericName,
          internalAssetCode: parts.internalAssetCode,
          transferFormNo: parts.transferFormNo,
          updatedBy: activeUser,
          createdBy: activeUser,
          transferStatus: false,
          // remarks:remarks,
          type: itemTypes,
          transferringRequestedDate: parts.transferRequestedDate,
          componentCode: parts.componentCode,
        };

        const insertAssetStatus = await assets.insertAssetsTransfer(
          partsPayload,
          txn,
        );

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
        // });
      }
      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      // console.error(error);
      return res
        .status(500)
        .json({ error: "Internal server error. this is catch" });
    }
  });
  return returnValue;
};

//APPROVAL TRANSFER REQUEST PARTS
const putAssetsTransferParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo, partsTransferInfo, assetCode } = req.body;
    const activeUser = util.currentUserToken(req).code;
    const assetCodeMain = assetCode.transferingAssetCode;
    const itemType = "PARTS";
    const prefixs = "PAHLA";

    try {
      const transferReStatusParts = "Approved";
      for (const parts of assetsInfo) {
        let assetStatus = "";
        assetStatus = await sqlHelper.transact(async (txn) => {
          const activeUser = util.currentUserToken(req).code;
          const generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..AssetAllotmentHistory",
            prefixs.toUpperCase(),
            2,
            txn,
          );
          const partsPayload = {
            code: generatedCode,
            assetCode: parts.componentAssetCode,
            fromDeptCode: parts.receivingDepartment,
            toDeptCode: parts.transferredDepartment,
            transferReStatus: transferReStatusParts,
            genericName: parts.componentGenericName,
            internalAssetCode: parts.internalAssetCode,
            transferFormNo: parts.transferFormNo,
            tranferringAssetCode: parts.transferingAssetCode,
            updatedBy: activeUser,
            createdBy: activeUser,
            transferStatus: true,
            type: itemType,
            transferringRequestedDate: parts.transferRequestedDate,
            componentCode: parts.componentCode,
          };

          const insertAssetStatus = await assets.insertAssetsTransfer(
            partsPayload,
            txn,
          );

          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
        });
      }

      const sqlWhere = "AND oldAssetCode = ?";
      const transferReStatus = "Approved";
      const args = [assetCodeMain];
      const options = {
        top: "",
        order: "dateTimeUpdated DESC",
      };
      const existingAssets = await assets.selectAssets(
        sqlWhere,
        args,
        options,
        txn,
      );

      if (existingAssets && existingAssets.length > 0) {
        const oldAsset = existingAssets[0];
        const oldAssetCode = oldAsset.code;
        const deptPartment = oldAsset.receivingDepartment;

        // Asset code exists, proceed with the update
        const updateAssetInfo = await assetsComponents.updateAssetsComponents(
          {
            // receivingDepartment: assetsInfo.transferredDepartment,
            receivingDepartment: deptPartment,
            transferStatus: true,
            active: true,
            transferReStatus: transferReStatus,
            assetCode: assetCode.transferingAssetCode,
            internalAssetCode: oldAssetCode,
            updatedBy: activeUser,
          },
          { transferFormNo: partsTransferInfo.transferFormNo },
          txn,
        );

        return res.status(200).json(updateAssetInfo);
      } else {
        return res.status(404).json({ error: "Asset code not found TEST." });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

//cancel transfer request asset mweee by department ang gumagamit
const putAssetsCancelTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { asstInfs, parts } = req.body; //assetsInfo,

    const tranferFormUpdate = "Canceled";
    const tranferFormUpdateq = "";
    const itemType = "WHOLE";
    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;
      for (const asstInf of asstInfs) {
        const prefixs = "WAHLC";
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetAllotmentHistory",
          prefixs.toUpperCase(),
          2,
          txn,
        );
        const assetsPayload = {
          code: generatedCode,
          assetCode: asstInf.oldAssetCode,
          fromDeptCode: asstInf.receivingDepartment,
          toDeptCode: asstInf.transferredDepartment,
          transferFormNo: asstInf.transferFormNo,
          genericName: asstInf.genericName,
          transferReStatus: tranferFormUpdate,
          transferringRequestedDate: asstInf.transferRequestedDate,
          createdBy: activeUser,
          transferStatus: false,
          // remarks:remarks,
          type: itemType,
          internalAssetCode: asstInf.code,
        };

        // Insert Asset to the new Assets Table //
        await assets.insertAssetsTransfer(assetsPayload, txn);

        updateAssetInfo = await assets.updateAssets(
          {
            // dateTimeUpdated: util.currentDateTime(),
            updatedBy: util.currentUserToken(req).code,
            active: true,
            transferStatus: true,
            transferReStatus: tranferFormUpdate,
            cancelStatus: true,
            transferFormNo: tranferFormUpdateq,
          },
          { code: asstInf.code }, //where clause
          txn,
        );
      }
      const cancelledWithWhole = "Canceled(with Whole)";
      for (const asstInf of parts) {
        // UPDATE PARTS INFO START//
        await assetsComponents.updateAssetsComponents(
          {
            transferStatus: true,
            transferReStatus: cancelledWithWhole,
            cancelStatus: true,
            active: true,
            transferFormNo: tranferFormUpdateq,
          },
          { code: asstInf.componentCode },
          txn,
        );
        //UPDATE PARTS INFO END//

        const prefixs = "PAHLC";
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetAllotmentHistory",
          prefixs.toUpperCase(),
          2,
          txn,
        );
        const itemTypes = "PARTS";
        const assetsPayload = {
          code: generatedCode,
          assetCode: asstInf.componentAssetCode,
          fromDeptCode: asstInf.receivingDepartment,
          toDeptCode: asstInf.transferredDepartment,
          transferFormNo: asstInf.transferFormNo,
          genericName: asstInf.componentGenericName,
          transferReStatus: cancelledWithWhole,
          transferringRequestedDate: asstInf.transferRequestedDate,
          createdBy: activeUser,
          transferStatus: false,
          type: itemTypes,
          internalAssetCode: asstInf.internalAssetCode,
          componentCode: asstInf.componentCode,
        };

        await assets.insertAssetsTransfer(assetsPayload, txn);
      }
      return res.status(200).json(updateAssetInfo);

      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      // console.error(error);
      return res
        .status(500)
        .json({ error: "Internal server error. this is catch" });
    }
  });
  return returnValue;
};

//cancel whole condemn by department
const putAssetsCancelCondemn = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { parts, assetsDetails } = req.body; //assetsInfo,
    const condemnReStatus = "Canceled";
    try {
      let updateAssetInfo = "";
      // const activeUsera = util.currentUserToken(req).deptCode
      const CondemnPrefixAsset = "WCHLC";
      const typesWhole = "WHOLE";
      for (const asset of assetsDetails) {
        let generatedCode = "";
        // let assetStatus = "";
        // assetStatus = await sqlHelper.transact(async (txn) => {
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${CondemnPrefixAsset.toUpperCase()}`,
          4,
          txn,
        );
        const activeUser = util.currentUserToken(req).code;

        const assetsPayload = {
          code: generatedCode,
          assetCode: asset.oldAssetCode,
          requestedDepartment: asset.receivingDepartment,
          condemReStatus: condemnReStatus,
          internalAssetCode: asset.code,
          condemRequestedDate: asset.condemRequestedDate,
          genericName: asset.genericName,
          createdBy: activeUser,
          condemnStatus: false,
          araForm: asset.araForm,
          type: typesWhole,
          active: false,
        };

        const insertAssetStatus = await assets.insertAssetsCondemn(
          assetsPayload,
          txn,
        );

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
        // });
      }

      const CondemnPrefix = "PCHLC";
      const types = "PARTS";

      for (const part of parts) {
        // let assetStatus = "";
        let generatedCode = "";
        // assetStatus = await sqlHelper.transact(async (txn) => {
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${CondemnPrefix.toUpperCase()}`,
          4,
          txn,
        );
        const activeUser = util.currentUserToken(req).code;

        const assetsPayload = {
          code: generatedCode,
          assetCode: part.assetCode,
          requestedDepartment: part.receivingDepartment,
          condemReStatus: condemnReStatus,
          internalAssetCode: part.movedAssetCode,
          condemRequestedDate: part.condemnRequestedDate,
          componentCode: part.componentCode,
          // assetCode: part.assetCode,
          genericName: part.componentGenericName,
          createdBy: activeUser,
          condemnStatus: false,
          araForm: part.araForm,
          type: types,
          active: false,
        };

        const insertAssetStatus = await assets.insertAssetsCondemn(
          assetsPayload,
          txn,
        );

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
        // });
      }
      for (const asset of assetsDetails) {
        updateAssetInfo = await assets.updateAssets(
          {
            // dateTimeUpdated: util.currentDateTime(),
            updatedBy: util.currentUserToken(req).code,
            active: true,
            condemnStatus: true,
            condemnReStatus: condemnReStatus,
            // araForm:tranferFormUpdate,
            cancelStatus: true,
          },
          { code: asset.code }, //where clause
          txn,
        );
      }
      for (const part of parts) {
        await assetsComponents.updateAssetsComponents(
          {
            // condemnStatus:true,
            // araForm:tranferFormUpdate,
            condemnReStatus: condemnReStatus,
            active: true,
          },
          { code: part.componentCode },
          txn,
        );
      }
      return res.status(200).json(updateAssetInfo);

      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      // console.error(error);
      return res
        .status(500)
        .json({ error: "Internal server error. this is catch" });
    }
  });
  return returnValue;
};

const disapprovePerPieceCondem = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { parts, assetsDetails, cancellationReason } = req.body;
    const condemnReStatus = "Canceled";

    try {
      let updateAssetInfo = "";
      // const activeUsera = util.currentUserToken(req).deptCode
      const CondemnPrefixAsset = "WCHLC";
      const typesWhole = "WHOLE";
      // for (const asset of assetsDetails) {
      let generatedCode = "";

      // assetStatus = await sqlHelper.transact(async (txn) => {
      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..CondemnationHistory",
        `${CondemnPrefixAsset.toUpperCase()}`,
        4,
        txn,
      );
      const activeUser = util.currentUserToken(req).code;

      const assetsPayload = {
        code: generatedCode,
        assetCode: assetsDetails.oldAssetCode,
        requestedDepartment: assetsDetails.receivingDepartment,
        condemReStatus: condemnReStatus,
        internalAssetCode: assetsDetails.code,
        condemRequestedDate: assetsDetails.condemRequestedDate,
        genericName: assetsDetails.genericName,
        createdBy: activeUser,
        condemnStatus: false,
        araForm: assetsDetails.araForm,
        type: typesWhole,
        active: false,
        remarks: cancellationReason,
      };

      const insertAssetStatus = await assets.insertAssetsCondemn(
        assetsPayload,
        txn,
      );

      if (insertAssetStatus.error) {
        return res.status(500).json({ error: insertAssetStatus.error });
      }
      // });
      // }

      const CondemnPrefix = "PCHLC";
      const types = "PARTS";

      for (const part of parts) {
        // let assetStatus = "";
        let generatedCode = "";
        // assetStatus = await sqlHelper.transact(async (txn) => {
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${CondemnPrefix.toUpperCase()}`,
          4,
          txn,
        );
        const activeUser = util.currentUserToken(req).code;

        const assetsPayload = {
          code: generatedCode,
          assetCode: part.assetCode,
          requestedDepartment: part.receivingDepartment,
          condemReStatus: condemnReStatus,
          internalAssetCode: part.movedAssetCode,
          condemRequestedDate: part.condemnRequestedDate,
          componentCode: part.componentCode,
          // assetCode: part.assetCode,
          genericName: part.componentGenericName,
          createdBy: activeUser,
          condemnStatus: false,
          araForm: part.araForm,
          type: types,
          active: false,
          remarks: cancellationReason,
        };

        const insertAssetStatus = await assets.insertAssetsCondemn(
          assetsPayload,
          txn,
        );

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
        // });
      }

      updateAssetInfo = await assets.updateAssets(
        {
          // dateTimeUpdated: util.currentDateTime(),
          updatedBy: util.currentUserToken(req).code,
          active: true,
          condemnStatus: true,
          condemnReStatus: condemnReStatus,
          araForm: null,
          cancelStatus: true,
          condemRemarks: cancellationReason,
        },
        { code: assetsDetails.code }, //where clause
        txn,
      );
      for (const part of parts) {
        await assetsComponents.updateAssetsComponents(
          {
            // condemnStatus:true,
            araForm: null,
            condemnReStatus: condemnReStatus,
            active: true,
            condemRemarks: cancellationReason,
          },
          { code: part.componentCode },
          txn,
        );
      }

      return res.status(200).json(updateAssetInfo);

      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      // console.error(error);
      return res
        .status(500)
        .json({ error: "Internal server error. this is catch" });
    }
  });
  return returnValue;
};

//cancel parts condemn by property
const putPartsCancelCondemn = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { parts } = req.body; //assetsInfo,
    const condemnReStatus = "Canceled";
    try {
      const CondemnPrefix = "PCHLC";
      let generatedCode = "";
      const types = "PARTS";

      let assetStatus = "";
      for (const asset of parts) {
        assetStatus = await sqlHelper.transact(async (txn) => {
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..CondemnationHistory",
            `${CondemnPrefix.toUpperCase()}`,
            4,
            txn,
          );
          const activeUser = util.currentUserToken(req).code;

          const assetsPayload = {
            code: generatedCode,
            // assetCode: asset.oldAssetCode,
            requestedDepartment: asset.receivingDepartment,
            condemReStatus: condemnReStatus,
            internalAssetCode: asset.componentAssetCode,
            condemRequestedDate: asset.condemnRequestedDate,
            componentCode: asset.componentCode,
            assetCode: asset.assetCode,
            genericName: asset.componentGenericName,
            createdBy: activeUser,
            condemnStatus: false,
            araForm: asset.araForm,
            type: types,
            active: false,
          };

          const insertAssetStatus = await assets.insertAssetsCondemn(
            assetsPayload,
            txn,
          );

          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
        });
      }
      let updateAssetInfo = "";
      const tranferFormUpdate = null;
      for (const part of parts) {
        updateAssetInfo = await assetsComponents.updateAssetsComponents(
          {
            // condemnStatus:true,
            araForm: tranferFormUpdate,
            condemnReStatus: condemnReStatus,
            active: true,
            // internalAssetCode:part.movedAssetCode,
            // updatedBy:util.currentUserToken(req).code
          },

          { code: part.componentCode },
          txn,
        );
      }

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      // console.error(error);
      return res
        .status(500)
        .json({ error: "Internal server error. this is catch" });
    }
  });
  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  return returnValue;
};

//per piece cancel condem request
const partsCondemRequestPerPieceDisapprove = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { partsDetails, cancellationReason } = req.body; //assetsInfo,
    const condemnReStatus = "Canceled";
    try {
      const CondemnPrefix = "PCHLC";
      let generatedCode = "";
      const types = "PARTS";

      let assetStatus = "";
      // for (const asset of parts) {
      assetStatus = await sqlHelper.transact(async (txn) => {
        generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..CondemnationHistory",
          `${CondemnPrefix.toUpperCase()}`,
          4,
          txn,
        );
        const activeUser = util.currentUserToken(req).code;

        const assetsPayload = {
          code: generatedCode,
          // assetCode: asset.oldAssetCode,
          requestedDepartment: partsDetails.receivingDepartment,
          condemReStatus: condemnReStatus,
          internalAssetCode: partsDetails.componentAssetCode,
          condemRequestedDate: partsDetails.condemnRequestedDate,
          componentCode: partsDetails.componentCode,
          assetCode: partsDetails.assetCode,
          genericName: partsDetails.componentGenericName,
          createdBy: activeUser,
          condemnStatus: false,
          araForm: partsDetails.araForm,
          type: types,
          active: false,
          remarks: cancellationReason,
        };

        const insertAssetStatus = await assets.insertAssetsCondemn(
          assetsPayload,
          txn,
        );

        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      });
      // }
      let updateAssetInfo = "";
      const tranferFormUpdate = null;
      // for (const part of parts) {
      updateAssetInfo = await assetsComponents.updateAssetsComponents(
        {
          // condemnStatus:true,
          araForm: tranferFormUpdate,
          condemnReStatus: condemnReStatus,
          active: true,
          condemRemarks: cancellationReason,
          // internalAssetCode:part.movedAssetCode,
          // updatedBy:util.currentUserToken(req).code
        },

        { code: partsDetails.componentCode },
        txn,
      );
      // }

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      // console.error(error);
      return res
        .status(500)
        .json({ error: "Internal server error. this is catch" });
    }
  });
  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  return returnValue;
};

const updateAssetPhysicalLocation = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo, includedParts, newLocation } = req.body;
    try {
      let updateAssetInfo = "";
      updateAssetInfo = await assets.updateAssets(
        {
          // location: assetsInfo.location,
          location: newLocation,
          updatedBy: util.currentUserToken(req).code,
        },
        { code: assetsInfo.code },
        txn,
      );

      for (const assetComponent of includedParts) {
        await assetsComponents.updateAssetsComponents(
          {
            // location: assetsInfo.location,
            location: newLocation,
            updatedBy: util.currentUserToken(req).code,
          },
          { code: assetComponent.componentCode },
          txn,
        );
      }

      //UPDATE PARTS INFO END//

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

//testing can be remove
const getAssetsTesting = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = `and active = ?`;
    args = [1];
    const options = {
      top: "",
      order: "dateTimeUpdated desc ",
    };
    return await assets.selectAssetsTesting(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  putAssignAssetCodeCE,
  updateAssetPhysicalLocation,
  // cleaned
  getAssets,
  getOldAssets,
  putAssets,
  postRegisterAsset,
  postAssets,
  postjsonData,
  getAssetsTesting,
  postAssetsTransfer,
  getAssetsPendingTransfers,
  getAssetsByDepartment,
  getAssetsApprovalTransfers,
  putAssetsTransfer,
  postAssetsCondemn,
  getAssetsCondemnTransfer,
  getAssetsCondemnApproval,
  postAssetsCondemnApproved,
  getCEApprovalTransfers,
  getAssetsCE,
  postRegisterAssetCE,

  putAssetsCancelTransfer,
  postAssetsTransferChangeDepartment,
  postPartsTransfer,

  getCEApprovalTransfersParts,
  putAssetsTransferParts,
  getSearchCode,
  getPartsApprovalTransfers,
  putAssetsCancelCondemn,
  getPartsCondemnTransfer,
  postSendCondemnRequestParts,
  getPartsCondemnForApproval,
  putPartsCancelCondemn,
  postPartsCondemnApproved,
  getSearcAssetCode,

  getAssetsCEnoAssetCode,
  getRetiredCEWholeAsset,
  getRetiredCEParts,
  getAssetsActive,
  getPartsActive,
  getActiveEquipmentWhole,
  getDistinctTransferFormNo,
  getAssetToTransfer,
  getDistinctTransferFormNoParts,
  getPartsToTransfer,
  getDistinctAraFormNo,
  getAssetToCondemn,
  getDistinctApprovalTransferFormNo,
  getAssetToTransferProperty,
  getAssetToTransferIT,
  getCEDistinctApprovalTransferFormNo,
  getDistinctTransferFormNoPartsIT,
  getDistinctTransferFormNoPartsProperty,
  getPartsToTransferProperty,
  getDistinctAraFormNoByProperty,
  getCondemnListProperty,
  getDistinctAraFormByDeptParts,

  getPartsToTCondemnByDept,
  getSearcITAssetCode,
  getPartsToTransferITEquip,
  getApprovedAssetLogs,
  getAssetsByPassCondem,
  condemDirectApproval,
  partsCondemDirectApproval,
  getAllRetiredWholeAssetDepartment,
  getUpcomingCondemRequest,
  getUpcomingPartsCondemRequest,
  getRRNumber,
  getRRNumberExistInParts,
  // getItLast,
  getItLastComponents,
  // getLastAraNo,
  getLastTransferFormNo,

  findAssetCodeDirect,
  findAraNoDirect,
  auditAssetUpdate,
  condemApprovalForPendingRequest,
  // getAraNumberAvailability
  // convertME
  disapprovePerPieceCondem,
  partsCondemRequestPerPieceDisapprove,
  putAssetsCapitalizedUpdate,
  getAllRetiredWholeAssetJoined,
  approvedAssetCondemDeptView,
  approvedPartsCondemDeptView,
  condemRequestParts,
  checkIsAssetCodeExisting,
  getByDeptAssetPendingCondemn,
  getAllAssetCondemnRequest,
  mainAssetPendingCheck,
  putCEAssetsInfo,
  acceptingCondemRequestParts,
  getItLastItemCode,
  allRRChecking,
  allItAssetCodeRChecking,
  checkITAssetCodeForManual,
  getAssetsInfoResult,
  getAllAssetCodePartsPackage,
  getActivityLog,
  getPartsActivityLog,
  manualRegistrationCe,
  checkOrigAndNewAssetCodeExist,
  getAssetsInLocationModuleTable,
  getAcctblyRefNo,
  getAssetsForGeneration,
  getPartsForGeneration,

  getSpecificAssetCode,
};

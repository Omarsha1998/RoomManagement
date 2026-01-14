const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const assetsComponents = require("../models/assetsComponents.js");
const assets = require("../models/assets.js");

//GET
const getParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const condemnReStatus = "Approved";
    const condemnReStatus2 = "Approved(with whole)";
    let sqlWhere = "";
    let args = [];
    args = [condemnReStatus, condemnReStatus2];
    sqlWhere = ` and condemnReStatus<>? and condemnReStatus<>? `;

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

const getPartsForLocationModule = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and receivingDepartment =? and  TransferReStatus <> 'Approved' and CondemnReStatus <> 'Approved'`;
    args = [userDepartmentCode];

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
// PUT REQUESTS
const putPartsInfo = async function (req, res) {
  const { compoCodes } = req.body; //itAssetCode

  try {
    let partsInfo = "";
    // if (!compoCodes) {
    //   return res.status(400).json({ error: "Invalid component code." });
    // }
    const activeUser = util.currentUserToken(req).code;

    partsInfo = await assetsComponents.updateAssetsComponents(
      {
        genericName: compoCodes.componentGenericName,
        updatedBy: activeUser,

        brandName: compoCodes.componentBrandName,
        receivingReportNo: compoCodes.receivingReportNo,
        itemCode: compoCodes.itemCode,
        unitCost: compoCodes.compoUnitCost,
        discount: compoCodes.discount,
        netCost: compoCodes.netCost,
        serialNo: compoCodes.serialNo,
        supplier: compoCodes.supplier,
        model: compoCodes.model,
        remarks: compoCodes.remarks,
        donor: compoCodes.donor,
        donationNo: compoCodes.donationNo,
        specifications: compoCodes.specifications,
        // location: compoCodes.location,
        // dateReceived: compoCodes.dateReceived,
        // assetTagStatus: compoCodes.assetTagStatus,
        // itAssetCode:compoCodes.itAssetCode,
        // itAssetCode: itAssetCode,
        // originId: compoCodes.originId,
        // accountingRefNo: compoCodes.accountingRefNo,
        // capitalized: compoCodes.capitalized,
      },
      { code: compoCodes.componentCode },
    );
    return res.status(200).json(partsInfo);
  } catch (error) {
    // console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const updatePartsCEInfor = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { compoCodes, assetCodeResult, itAssetCode } = req.body;
    try {
      // let partsInfo ;

      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;

      const partsInfo = {
        genericName: compoCodes.componentGenericName,
        updatedBy: activeUser,
        dateReceived: compoCodes.dateReceived,
        brandName: compoCodes.componentBrandName,
        itemCode: compoCodes.itemCode,
        serialNo: compoCodes.serialNo,
        supplier: compoCodes.supplier,
        model: compoCodes.model,
        remarks: compoCodes.remarks,
        specifications: compoCodes.specifications,
        location: compoCodes.location,
        assetTagStatus: compoCodes.assetTagStatus,
        accountableEmployee: compoCodes.accountableEmployee,
      };

      // Conditionally update fields if values exist
      if (assetCodeResult && assetCodeResult.trim() !== "") {
        partsInfo.assetCode = assetCodeResult;
      }

      if (itAssetCode && itAssetCode.trim() !== "") {
        const [pref] = itAssetCode.split("/");
        partsInfo.itAssetCode = pref;
      }

      updateAssetInfo = await assetsComponents.updateAssetsComponents(
        partsInfo,
        { code: compoCodes.componentCode },
        txn,
      );

      return res.status(200).json(updateAssetInfo);
    } catch (error) {
      // console.error(error);
      return res.status(500).json({ error: "Internal server error." });
    }
  });
  return returnValue;
};
const updateAccessoriesParent = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { compoCodes, searchedmainAsset } = req.body;
    try {
      // let partsInfo ;

      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await assetsComponents.updateAssetsComponents(
        {
          updatedBy: activeUser,
          assetCode: searchedmainAsset.oldAssetCode,
          internalAssetCode: searchedmainAsset.code,
          location: searchedmainAsset.location,
        },
        { code: compoCodes.componentCode },
        txn,
      );

      return res.status(200).json(updateAssetInfo);
    } catch (error) {
      // console.error(error);
      return res.status(500).json({ error: "Internal server error." });
    }
  });
  return returnValue;
};
const updatePartsInfoAudit = async function (req, res) {
  const { compoCodes } = req.body;

  try {
    let partsInfo = "";

    const activeUser = util.currentUserToken(req).code;

    partsInfo = await assetsComponents.updateAssetsComponents(
      {
        genericName: compoCodes.componentGenericName,
        updatedBy: activeUser,

        brandName: compoCodes.componentBrandName,
        itemCode: compoCodes.itemCode,
        model: compoCodes.model,
        remarks: compoCodes.remarks,
        specifications: compoCodes.specifications,
      },
      { code: compoCodes.componentCode },
    );
    return res.status(200).json(partsInfo);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};
const putPartsInfoAccounting = async function (req, res) {
  const { compoCodes, accountingRefNoInput, capitalizedInput } = req.body;

  try {
    let partsInfo = "";
    if (!compoCodes) {
      return res.status(400).json({ error: "Invalid component code." });
    }
    const activeUser = util.currentUserToken(req).code;
    partsInfo = await assetsComponents.updateAssetsComponents(
      {
        updatedBy: activeUser,

        accountingRefNo: accountingRefNoInput,
        capitalized: capitalizedInput,
      },
      { code: compoCodes.componentCode },
    );
    return res.status(200).json(partsInfo);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};
const getCurrentAssignedComponents = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.code))
      return res.status(400).json({ error: "`Asset Codessss` is required." });

    const code = req.query.code;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asstCompo.active= ? and asstCompo.internalAssetCode = ?`;
    args = [1, code];

    const options = {
      top: "",
      order: "",
    };
    return await assetsComponents.selectAssignedComponents(
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

const getComponentParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.code))
      return res
        .status(400)
        .json({ error: "Internal Asset Code is required." });

    const code = req.query.code;
    const condemStat = "Approved";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asstCompo.condemnReStatus <>? and asstCompo.internalAssetCode = ?`;
    args = [condemStat, code];

    const options = {
      top: "",
      order: "",
    };
    return await assetsComponents.selectAssignedComponents(
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

const getPartsLogApproved = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const code = req.query.code;
    if (util.empty(req.query.code))
      return res.status(400).json({ error: "`Code` is required." });
    let sqlWhere = "";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and active = ?  and transferReStatus=? and internalAssetCode=?`;
    args = [1, transferStatus, code];
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

const getRetiredPartsAll = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const condemnReStatus = "Approved";

    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asstCompo.active = ? and asstCompo.condemnReStatus = ? `;
    args = [0, condemnReStatus];
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

const deptViewingRetiredParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const condemnReStatus = "Approved";
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asstCompo.active = ? and asstCompo.condemnReStatus = ? and asstCompo.receivingDepartment = ?  `;
    args = [0, condemnReStatus, userDeptCode];
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

const getIncludedPartsToTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.code))
      return res.status(400).json({
        error: "`Asset Codessss getIncludedPartsToTransfer` is required.",
      });

    const code = req.query.code;
    const transferStat = "Pending(with Whole)";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asstCompo.active = ? and asstCompo.internalAssetCode = ? and asstCompo.transferReStatus = ?`;
    args = [0, code, transferStat];
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

const getAllParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and active = ? and receivingDepartment = ? `;
    args = [1, userDeptCode];

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

const getAllCEParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const administrator = "IT";
    let args = [];
    sqlWhere = `and active = ? and administrator = ?`;
    args = [1, administrator];

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
const getPartsWoParents = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const administrator = "IT";
    let args = [];
    sqlWhere = `and active = ? and administrator = ? and InternalAssetCode is null`;
    args = [1, administrator];

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
const getAllPartsByPassCondem = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and active = ? `;
    args = [1];

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

const getPartsActiveInactive = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];

    args = [req.query.assetCode, req.query.assetCode];
    sqlWhere = `and movedAssetCode = ? or internalAssetCode =? `;

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
const getPendingPreApprovedParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ` `;
    args = [];

    args = [req.query.assetCode, req.query.assetCode];
    sqlWhere =
      " and  asstCompo.condemnReStatus <> 'Approved' and movedAssetCode = ? or internalAssetCode =? ";

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

const getPartsByAssetCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ` `;
    args = [];

    if (!util.empty(req.query.assetCode)) {
      args = [req.query.assetCode];
      sqlWhere = "and internalAssetCode =?";
    }

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

const getPartsActiveOnly = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];

    let assetCodes = req.query.assetCode;
    let receivingDepartments = req.query.receivingDepartment;

    if (!Array.isArray(assetCodes)) {
      assetCodes = [assetCodes];
    }
    if (!Array.isArray(receivingDepartments)) {
      receivingDepartments = [receivingDepartments];
    }

    let allParts = [];

    for (let i = 0; i < assetCodes.length; i++) {
      const loopParts = assetCodes[i];
      const department = receivingDepartments[i];

      sqlWhere = `and active = ? and internalAssetCode = ? and receivingDepartment = ?`;
      args = [1, loopParts, department];

      const options = {
        top: "",
        order: "",
      };

      const parts = await assetsComponents.selectAllParts(
        sqlWhere,
        args,
        options,
        txn,
      );

      if (parts.error !== undefined) {
        return { error: parts.error };
      }

      allParts = allParts.concat(parts); // Combine results
    }

    return allParts;
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const preApprovedParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ` `;
    args = [];

    if (!util.empty(req.query.assetCode)) {
      args = [req.query.assetCode];
      sqlWhere = "and internalAssetCode =? ";
    }

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

const getPartsInactive = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    const reStatus = "Pending(by parts)";
    let args = [];
    sqlWhere = `and receivingDepartment = ? and transferRestatus<>?`;
    args = [userDeptCode, reStatus];

    // if (!util.empty(req.query.assetCode)) {
    //   args = [req.query.assetCode];
    //   sqlWhere = "and internalAssetCode = ?";
    // }

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

const getIncludedPartsInformationReview = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    const reStatus = "Pending(by parts)";
    let args = [];
    sqlWhere = `and receivingDepartment = ? and transferRestatus<>?  `;
    args = [userDeptCode, reStatus];

    if (!util.empty(req.query.assetCode)) {
      args = [req.query.assetCode];
      sqlWhere = "and transferFormNo = ?";
    }

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

const getPendingCondemParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    const reStatus = "Pending(with whole)";
    let args = [];
    sqlWhere = `and receivingDepartment = ? and condemnRestatus=? `;
    args = [userDeptCode, reStatus];

    if (!util.empty(req.query.araForm)) {
      args = [req.query.araForm];
      sqlWhere = "and araForm = ?";
    }

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

const getIncludedPartsWithWhole = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    const reStatus = "Pending(by parts)";
    let args = [];

    let assetCodes = req.query.assetCode;

    if (!Array.isArray(assetCodes)) {
      assetCodes = [assetCodes];
    }
    let allParts = [];
    for (const loopParts of assetCodes) {
      sqlWhere = `and receivingDepartment = ? and transferRestatus<>?  and internalAssetCode = ?`;
      args = [userDeptCode, reStatus, loopParts];
      const options = {
        top: "",
        order: "",
      };
      const parts = await assetsComponents.selectAllParts(
        sqlWhere,
        args,
        options,
        txn,
      );
      if (parts.error !== undefined) {
        return { error: parts.error };
      }

      allParts = allParts.concat(parts); // Combine results
    }
    return allParts;

    // if (!util.empty(req.query.assetCode)) {
    //   args = [req.query.assetCode]
    //   sqlWhere = 'and internalAssetCode = ?'
    // }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getPartsActiveInactiveNoDeptLimit = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ` `;
    args = [];

    if (!util.empty(req.query.transferFormNo)) {
      args = [req.query.transferFormNo];
      sqlWhere = "and transferFormNo = ?";
    }

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

const getPartsTransferPrint = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.code))
      return res.status(400).json({ error: "`ASset Code ` is required." });

    const code = req.query.code;
    const transferStat = "Pending(with Whole)";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asstCompo.active = ? and asstCompo.internalAssetCode = ? and asstCompo.transferReStatus = ?`;
    args = [0, code, transferStat];
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

const getCondemLogInfo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const internalAssetCode = req.query.code;
    const types = "PARTS";
    const condemReStatus = "APPROVED";
    let args = [];
    sqlWhere = `and asstCompo.code=? and condemLog.type=? and condemLog.condemReStatus=? `;
    args = [internalAssetCode, types, condemReStatus];
    const options = {
      top: "",
      order: "asstCompo.dateTimeUpdated desc ",
    };
    return await assetsComponents.selectAllPartsDeCondemDepart(
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

const getPartsApprovedPartsWithMainAsset = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      if (util.empty(req.query.code))
        return res.status(400).json({ error: "`Asset Code` is required." });

      const internalAssetCode = req.query.code;
      const araForm = req.query.araForm;
      const condemnReStatus = "Approved(with whole)";
      let sqlWhere = "";
      let args = [];
      sqlWhere = `and condemnReStatus=? and active =? and internalAssetCode = ?  and araForm = ?`;
      args = [condemnReStatus, 0, internalAssetCode, araForm];

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

const getPartsApprovedPartsWithMainAssetTRANSFER = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.code))
      // return res.status(400).json({ error: "`Asset Code` is required." });
      return;

    const code = req.query.code;

    const transferReStatus = "Approved(with whole)";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and transferReStatus=? and active =? and code = ?`;
    args = [transferReStatus, 1, code];

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

const getPartsApprovedPartOnly = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // if (util.empty(req.query.code))
    // return res.status(400).json({ error: "`Asset Code` is required." });

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
    return await assetsComponents.selectAllParts(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAllPartsInactive = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and active = ? and transferStatus = ? and receivingDepartment = ?`;
    args = [0, 0, userDeptCode];

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

const putPartsCancelTransfer = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { assetsInfo, parts } = req.body;

    const tranferFormUpdate = "N/A";
    const transferReStatus = "Canceled";
    const itemType = "PARTS";
    const activeUser = util.currentUserToken(req).code;
    try {
      let updatePartsInfo = "";

      for (const asstInf of parts) {
        const prefixs = "PAHLC";
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetAllotmentHistory",
          prefixs.toUpperCase(),
          2,
          txn,
        );
        const assetsPayload = {
          code: generatedCode,
          assetCode: asstInf.componentAssetCode,
          fromDeptCode: asstInf.receivingDepartment,
          toDeptCode: asstInf.transferredDepartment,
          tranferringAssetCode: asstInf.transferingAssetCode,
          transferFormNo: asstInf.transferFormNo,
          genericName: asstInf.componentGenericName,
          transferReStatus: transferReStatus,
          transferringRequestedDate: asstInf.transferRequestedDate,
          createdBy: activeUser,
          transferStatus: false,
          type: itemType,
          internalAssetCode: asstInf.internalAssetCode,
          componentCode: asstInf.componentCode,
        };

        await assets.insertAssetsTransfer(assetsPayload, txn);
      }
      updatePartsInfo = await assetsComponents.updateAssetsComponents(
        {
          transferStatus: true,
          transferReStatus: transferReStatus,
          cancelStatus: true,
          transferFormNo: tranferFormUpdate,
          active: true,
        },
        { transferFormNo: assetsInfo },
        txn,
      );

      return res.status(200).json(updatePartsInfo);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

const putUnassignedComponent = async function (req, res) {
  const { componentCode } = req.body;

  try {
    let unassignedComponent = "";
    if (!componentCode) {
      return res.status(400).json({ error: "Invalid component code." });
    }
    const activeUser = util.currentUserToken(req).code;
    const activeValue = false;
    unassignedComponent = await assetsComponents.updateAssetsComponents(
      {
        // code: componentCode,
        active: activeValue,
        // genericName: componentGenericName,
        // dateReceived:dateReceived,
        updatedBy: activeUser,
      },
      { code: componentCode },
    );
    return res.status(200).json(unassignedComponent);
  } catch (error) {
    // console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const putReassignComponent = async function (req, res) {
  const {
    componentCode,
    // componentGenericName,
    assetCode,
  } = req.body;

  try {
    let updatedComponent = "";
    // if (!componentCode || !assetCode) {
    //   return res
    //     .status(400)
    //     .json({ error: "Invalid component code or asset code." });
    // }
    const activeUser = util.currentUserToken(req).code;
    const activeValue = true;
    updatedComponent = await assetsComponents.updateAssetsComponents(
      {
        // code: componentCode,
        active: activeValue,
        // genericName: componentGenericName,
        assetCode: assetCode,
        updatedBy: activeUser,
      },
      { code: componentCode },
    );

    return res.status(200).json(updatedComponent);
  } catch (error) {
    // console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
const postRegisterComponent = async function (req, res) {
  if (util.empty(req.body)) {
    return res.status(400).json({ error: "`body` is required." });
  }

  const assetsComponentInfo = req.body;
  const catCode = assetsComponentInfo.catCoding;

  try {
    const assetStatus = await sqlHelper.transact(async (txn) => {
      // Generate Unique Code
      const generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..AssetsComponents",
        `${catCode.toUpperCase()}AC`,
        txn,
      );

      if (!generatedCode) {
        throw new Error("Failed to generate unique code.");
      }

      // Determine Capitalization Status
      let finalCapitalStatus = "";
      const userInput = assetsComponentInfo.netCost || "";
      const defaultCon = 20000.0;

      if (userInput.trim() !== "") {
        const sanitizedUserInput = parseFloat(userInput.replace(/[\s,]/g, ""));
        if (!isNaN(sanitizedUserInput) && sanitizedUserInput > defaultCon) {
          finalCapitalStatus = "Capitalized";
        }
      }

      const activeUser = util.currentUserToken(req).code;

      const assetsPayload = {
        code: generatedCode,
        internalAssetCode: assetsComponentInfo.internalAssetCode,
        receivingDepartment: assetsComponentInfo.receivingDepartment,
        assetCode: assetsComponentInfo.assetCode,
        genericName: assetsComponentInfo.componentGenericName,
        brandName: assetsComponentInfo.componentBrandName,
        dateReceived: assetsComponentInfo.dateReceived,
        createdBy: activeUser,
        accountableEmployee: assetsComponentInfo.accountableEmployee,
        capitalized: finalCapitalStatus,
        categoryId: assetsComponentInfo.categoryId,
        remarks: assetsComponentInfo.remarks,
        itemCode: assetsComponentInfo.itemCode,
        unitCost: assetsComponentInfo.unitCost,
        discount: assetsComponentInfo.discount,
        netCost: assetsComponentInfo.netCost,
        serialNo: assetsComponentInfo.serialNo,
        specifications: assetsComponentInfo.specifications,
        supplier: assetsComponentInfo.supplier,
        model: assetsComponentInfo.model,
        itAssetCode: assetsComponentInfo.itAssetCode,
        originId: assetsComponentInfo.originCode,
        administrator: assetsComponentInfo.administrator,
        transferStatus: assetsComponentInfo.transferStatus,
        receivingReportNo: assetsComponentInfo.receivingReportNo
          ? assetsComponentInfo.receivingReportNo.toUpperCase()
          : "",
        donor: assetsComponentInfo.donor,
        donationNo: assetsComponentInfo.donationNo,
        warrantyDate: assetsComponentInfo.warrantyDate,
        location: assetsComponentInfo.physicalLocation,
      };

      // Insert Asset Component
      const insertAssetStatus = await assetsComponents.insertAssetsComponents(
        assetsPayload,
        txn,
      );

      if (!insertAssetStatus || insertAssetStatus.error) {
        throw new Error(
          insertAssetStatus?.error || "Failed to insert asset component.",
        );
      }

      return { success: true };
    });

    return res.status(200).json(assetStatus);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// const postRegisterComponent = async function (req, res) {
//   if (util.empty(req.body))
//     return res.status(400).json({ error: "`body` is required." });
//   // const returnValue = await sqlHelper.transact(async (txn) => {
//   const assetsComponentInfo = req.body;

//   const catCode = assetsComponentInfo.catCoding;

//   try {
//     let generatedCode = "";
//     let assetStatus = "";
//     assetStatus = await sqlHelper.transact(async (txn) => {
//       generatedCode = await sqlHelper.generateUniqueCode(
//         "UERMINV..AssetsComponents",
//         `${catCode.toUpperCase()}AC`,

//         txn,
//       );

//       let finalCaptilstatus = "";
//       const userInput = assetsComponentInfo.netCost;
//       const defaultCon = 20000.0;

//       if (userInput.trim() !== "") {
//         const sanitizedUserInput = parseFloat(userInput.replace(/[\s,]/g, ""));

//         if (sanitizedUserInput > defaultCon) {
//           finalCaptilstatus = "Capitalized";
//         }
//       } else {
//         finalCaptilstatus = "";
//       }
//       const activeUser = util.currentUserToken(req).code;
//       const assetsPayload = {
//         code: generatedCode,
//         internalAssetCode: assetsComponentInfo.internalAssetCode,
//         receivingDepartment: assetsComponentInfo.receivingDepartment,
//         assetCode: assetsComponentInfo.assetCode,
//         genericName: assetsComponentInfo.componentGenericName,
//         brandName: assetsComponentInfo.componentBrandName,
//         dateReceived: assetsComponentInfo.dateReceived,
//         createdBy: activeUser,
//         accountableEmployee: assetsComponentInfo.accountableEmployee,
//         capitalized: finalCaptilstatus,
//         categoryId: assetsComponentInfo.categoryId,
//         remarks: assetsComponentInfo.remarks,
//         itemCode: assetsComponentInfo.itemCode,
//         unitCost: assetsComponentInfo.unitCost,
//         discount: assetsComponentInfo.discount,
//         netCost: assetsComponentInfo.netCost,
//         serialNo: assetsComponentInfo.serialNo,
//         specifications: assetsComponentInfo.specifications,
//         supplier: assetsComponentInfo.supplier,
//         model: assetsComponentInfo.model,
//         itAssetCode: assetsComponentInfo.itAssetCode,
//         originId: assetsComponentInfo.originCode,
//         administrator: assetsComponentInfo.administrator,
//         transferStatus: assetsComponentInfo.transferStatus,
//         receivingReportNo: assetsComponentInfo.receivingReportNo.toUpperCase(),
//         donor: assetsComponentInfo.donor,
//         donationNo: assetsComponentInfo.donationNo,
//         warrantyDate: assetsComponentInfo.warrantyDate,
//         location: assetsComponentInfo.physicalLocation,
//       };
//       const insertAssetStatus = await assetsComponents.insertAssetsComponents(
//         assetsPayload,
//         txn,
//       );

//       if (insertAssetStatus.error) {
//         return res.status(500).json({ error: insertAssetStatus.error });
//       }
//     });
//     assetStatus = { success: true };
//     return assetStatus;
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
//   // });

//   // if (returnValue.error !== undefined) {
//   //   return res.status(500).json({ error: `${returnValue.error}` });
//   // }
//   // return res.json(returnValue);
// };

const postRegisterComponentCE = async function (req, res) {
  try {
    if (util.empty(req.body))
      return res.status(400).json({ error: "`body` is required." });
    const returnValue = await sqlHelper.transact(async (txn) => {
      const assetsComponentInfo = req.body;
      const catCode = "CE";

      let numeratorLastDigit;
      let setsOverAll = "";

      if (
        assetsComponentInfo.lastDig.length > 0 &&
        assetsComponentInfo.receivingReportNo !== ""
      ) {
        numeratorLastDigit = assetsComponentInfo.lastDig[0].maxLastSegment;
        setsOverAll = assetsComponentInfo.lastDig[0].totalReps + 1;
      } else {
        const defaultCount = 0;
        numeratorLastDigit = defaultCount;
        setsOverAll = 1;
      }
      const toInts = parseInt(numeratorLastDigit);
      const addedME = toInts + 1;
      try {
        let generatedCode = "";
        let assetStatus = "";

        const formatDate = (dateStr) => {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}${month}${day}`;
        };
        const dash = "-";
        const formattedDate = formatDate(assetsComponentInfo.dateReceived);
        const finalAssetCoding =
          assetsComponentInfo.itAssetCode.toUpperCase() +
          dash +
          formattedDate +
          dash +
          addedME;

        assetStatus = await sqlHelper.transact(async (txn) => {
          generatedCode = await sqlHelper.generateUniqueCode(
            "UERMINV..AssetsComponents",
            `${catCode}AC`,
            // `AC`,

            txn,
          );

          let finalCaptilstatus = "";
          const userInput = assetsComponentInfo.netCost;
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
          const activeUser = util.currentUserToken(req).code;
          const assetsPayload = {
            code: generatedCode,
            internalAssetCode:
              assetsComponentInfo.internalAssetCode.toUpperCase(),
            receivingDepartment: assetsComponentInfo.receivingDepartment,
            assetCode: assetsComponentInfo.assetCode, // Use the extracted assetCode
            genericName: assetsComponentInfo.componentGenericName,
            brandName: assetsComponentInfo.componentBrandName,
            warrantyDate: assetsComponentInfo.warrantyDate,
            dateReceived: assetsComponentInfo.dateReceived,
            createdBy: activeUser,
            capitalized: finalCaptilstatus,
            categoryId: assetsComponentInfo.categoryId,
            remarks: assetsComponentInfo.remarks,
            itemCode: assetsComponentInfo.itemCode,
            unitCost: assetsComponentInfo.unitCost,
            discount: assetsComponentInfo.discount,
            netCost: assetsComponentInfo.netCost,
            serialNo: assetsComponentInfo.serialNo,
            specifications: assetsComponentInfo.specifications,
            supplier: assetsComponentInfo.supplier,
            model: assetsComponentInfo.model,
            itAssetCode: finalAssetCoding,

            originId: assetsComponentInfo.originCode,
            administrator: assetsComponentInfo.administrator,
            transferStatus: assetsComponentInfo.transferStatus,
            receivingReportNo:
              assetsComponentInfo.receivingReportNo.toUpperCase(),
            location: assetsComponentInfo.physicalLocation,
            totalSets: setsOverAll,
          };
          const insertAssetStatus =
            await assetsComponents.insertAssetsComponents(assetsPayload, txn);

          if (insertAssetStatus.error) {
            return res.status(500).json({ error: insertAssetStatus.error });
          }
        });

        if (assetsComponentInfo.lastDig.length > 0) {
          const updateParts = await assetsComponents.updateAssetsComponents(
            {
              totalSets: setsOverAll,
            },
            { receivingReportNo: assetsComponentInfo.receivingReportNo },
            txn,
          );
          return res.status(200).json(updateParts);
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
    return error;
  }
};

// const registerCEPartsNonPackage = async function (req, res) {
//   try {
//     if (util.empty(req.body))
//       return res.status(400).json({ error: "`body` is required." });
//     const {
//       assetsComponentInfo,
//       itAssetCodePrefixInput,
//       directAllotmentDetails,
//       entries,
//       formattedDates,
//       lastDig,
//     } = req.body;

//     const rrLenght = lastDig.length;
//     let numeratorLastDigit;

//     let toDept = "5050";
//     let toOldAssetCode = null;
//     let toMainAssetCode = null;
//     if (directAllotmentDetails.length > 0) {
//       toDept = directAllotmentDetails[0].receivingDepartment;
//       toOldAssetCode = directAllotmentDetails[0].oldAssetCode;
//       toMainAssetCode = directAllotmentDetails[0].code;
//     }

//     if (rrLenght > 0) {
//       numeratorLastDigit = lastDig[0].allMaxLastSegment;
//     } else {
//       const defaultCount = 0;
//       numeratorLastDigit = defaultCount;
//     }

//     const numEntries = parseInt(entries);
//     const totalSetss = numEntries + parseInt(rrLenght);
//     let finalCaptilstatus = "";
//     const userInput = assetsComponentInfo.netCost;
//     const defaultCon = 20000.0;

//     if (userInput.trim() !== "") {
//       const sanitizedUserInput = parseFloat(userInput.replace(/[\s,]/g, ""));

//       if (sanitizedUserInput > defaultCon) {
//         finalCaptilstatus = "Capitalized";
//       }
//     } else {
//       finalCaptilstatus = "";
//     }

//     const returnValue = await sqlHelper.transact(async (txn) => {
//       for (let i = 0; i < numEntries; i++) {
//         let generatedCode = "";
//         generatedCode = await sqlHelper.generateUniqueCode(
//           "UERMINV..AssetsComponents",
//           `CEAC`,
//           6,
//           txn,
//         );

//         let loopIncrement;
//         if (rrLenght > 0) {
//           const numeratorLastDigitInteger = parseInt(numeratorLastDigit);
//           loopIncrement = `${numeratorLastDigitInteger + i}`;
//         } else {
//           loopIncrement = `${numeratorLastDigit + i}`;
//         }
//         const finalLastDigit = parseInt(loopIncrement);

//         const finalItAssetCode = `${itAssetCodePrefixInput.toUpperCase()}-${formattedDates}-${finalLastDigit + 1}`;

//         const activeUser = util.currentUserToken(req).code;

//         const assetsPayload = {
//           code: generatedCode,
//           internalAssetCode: toMainAssetCode,
//           receivingDepartment: toDept,
//           assetTagStatus: assetsComponentInfo.assetTagStatus,
//           assetCode: toOldAssetCode,
//           genericName: assetsComponentInfo.componentGenericName,
//           brandName: assetsComponentInfo.componentBrandName,
//           dateReceived: assetsComponentInfo.dateReceived,
//           createdBy: activeUser,
//           capitalized: finalCaptilstatus,
//           categoryId: "21",
//           remarks: assetsComponentInfo.remarks,
//           itemCode: assetsComponentInfo.itemCode.toUpperCase(),
//           unitCost: assetsComponentInfo.unitCost,
//           discount: assetsComponentInfo.discount,
//           netCost: assetsComponentInfo.netCost,
//           serialNo: assetsComponentInfo.serialNo,
//           specifications: assetsComponentInfo.specifications,
//           supplier: assetsComponentInfo.supplier,
//           model: assetsComponentInfo.model,
//           itAssetCode: finalItAssetCode,
//           originId: assetsComponentInfo.originCode,
//           administrator: "IT",
//           receivingReportNo:
//             assetsComponentInfo.receivingReportNo.toUpperCase(),
//           totalSets: totalSetss,
//         };

//         const insertAssetStatus = await assetsComponents.insertAssetsComponents(
//           assetsPayload,
//           txn,
//         );
//         if (insertAssetStatus.error) {
//           console.error("Error", insertAssetStatus.error);
//           return res.status(500).json({ error: insertAssetStatus.error });
//         }
//       }

//       return res.status(200).json({ success: true });
//     });

//     if (returnValue.error !== undefined) {
//       return res.status(500).json({ error: `${returnValue.error}` });
//     }
//     return res.status(200).json(returnValue);
//     // return res.json({ success: true });
//   } catch (error) {
//     // return error;
//     return { error: error };
//   }
// };

const registerCEPartsNonPackage = async function (req, res) {
  try {
    if (util.empty(req.body)) {
      return res.status(400).json({ error: "`body` is required." });
    }

    const {
      assetsComponentInfo,
      itAssetCodePrefixInput,
      directAllotmentDetails,
      entries,
      formattedDates,
      lastDig,
    } = req.body;

    // Default values
    const toDept =
      directAllotmentDetails.length > 0
        ? directAllotmentDetails[0].receivingDepartment
        : assetsComponentInfo.receivingDepartment;
    const toOldAssetCode = directAllotmentDetails[0]?.oldAssetCode || null;
    const toMainAssetCode = directAllotmentDetails[0]?.code || null;
    const physicalLocation = directAllotmentDetails[0]?.location || null;

    // Determine the last digit
    const numeratorLastDigit =
      lastDig.length > 0 ? parseInt(lastDig[0].allMaxLastSegment) : 0;

    // Compute total sets
    const totalSets = parseInt(entries) + lastDig.length;

    // Determine capitalization status
    const sanitizedUserInput =
      parseFloat(assetsComponentInfo.netCost.replace(/[\s,]/g, "")) || 0;
    const finalCapitalStatus =
      sanitizedUserInput > 20000.0 ? "Capitalized" : "";

    // Transaction
    const returnValue = await sqlHelper.transact(async (txn) => {
      for (let i = 0; i < parseInt(entries); i++) {
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMINV..AssetsComponents",
          `CEAC`,
          6,
          txn,
        );
        const finalLastDigit = numeratorLastDigit + i + 1; // Ensuring last digit increments properly
        const finalItAssetCode = `${itAssetCodePrefixInput.toUpperCase()}-${formattedDates}-${finalLastDigit}`;
        const activeUser = util.currentUserToken(req).code;

        const assetsPayload = {
          code: generatedCode,
          internalAssetCode: toMainAssetCode,
          receivingDepartment: toDept,
          assetTagStatus: assetsComponentInfo.assetTagStatus,
          assetCode: toOldAssetCode,
          genericName: assetsComponentInfo.componentGenericName,
          brandName: assetsComponentInfo.componentBrandName,
          dateReceived: assetsComponentInfo.dateReceived,
          createdBy: activeUser,
          capitalized: finalCapitalStatus,
          categoryId: "21",
          remarks: assetsComponentInfo.remarks,
          itemCode: assetsComponentInfo.itemCode.toUpperCase(),
          unitCost: assetsComponentInfo.unitCost,
          discount: assetsComponentInfo.discount,
          netCost: assetsComponentInfo.netCost,
          serialNo: assetsComponentInfo.serialNo,
          specifications: assetsComponentInfo.specifications,
          supplier: assetsComponentInfo.supplier,
          model: assetsComponentInfo.model,
          itAssetCode: finalItAssetCode,
          originId: assetsComponentInfo.originCode,
          administrator: "IT",
          location: physicalLocation,
          receivingReportNo:
            assetsComponentInfo.receivingReportNo.toUpperCase(),
          totalSets,
        };

        const insertAssetStatus = await assetsComponents.insertAssetsComponents(
          assetsPayload,
          txn,
        );
        if (insertAssetStatus.error) {
          return res.status(500).json({ error: insertAssetStatus.error });
        }
      }

      return { success: true };
    });

    if (returnValue.error) {
      return res.status(500).json({ error: returnValue.error });
    }

    return res.status(200).json(returnValue);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const manualRegisterCEPartsNonPackage = async function (req, res) {
  try {
    if (util.empty(req.body))
      return res.status(400).json({ error: "`body` is required." });
    const {
      assetsComponentInfo,
      itAssetCodePrefixInput,
      directAllotmentDetails,
      // entries,
      // formattedDates,
      // lastDig,
    } = req.body;

    let finalCaptilstatus = "";
    const userInput = assetsComponentInfo.netCost;
    const defaultCon = 20000.0;

    if (userInput.trim() !== "") {
      const sanitizedUserInput = parseFloat(userInput.replace(/[\s,]/g, ""));

      if (sanitizedUserInput > defaultCon) {
        finalCaptilstatus = "Capitalized";
      }
    } else {
      finalCaptilstatus = "";
    }
    let allotmentresultInternalAssetCode = "";
    let allotmentDepartment = assetsComponentInfo.receivingDepartment;
    let allotmentAssetCode = assetsComponentInfo.assetCode;
    let allotmentLocation;

    if (
      directAllotmentDetails.length > 0 &&
      assetsComponentInfo.receivingDepartment === ""
    ) {
      allotmentresultInternalAssetCode = directAllotmentDetails[0].code;
      allotmentDepartment = directAllotmentDetails[0].receivingDepartment;
      allotmentAssetCode = directAllotmentDetails[0].oldAssetCode;
      allotmentLocation = directAllotmentDetails[0]?.location || null;
    }

    let digitsAfterSlash = "";
    let partBeforeSlash = "";
    if (itAssetCodePrefixInput !== "") {
      digitsAfterSlash = "1";
      partBeforeSlash = itAssetCodePrefixInput.split("/")[0];
      if (itAssetCodePrefixInput.includes("/")) {
        digitsAfterSlash = itAssetCodePrefixInput.split("/")[1];
      }

      if (!itAssetCodePrefixInput.includes("/")) {
        if (!/-\d$/.test(partBeforeSlash)) {
          partBeforeSlash += "-1";
        }
      }
    }

    const returnValue = await sqlHelper.transact(async (txn) => {
      let generatedCode = "";
      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..AssetsComponents",
        `CEAC`,
        6,
        txn,
      );

      const activeUser = util.currentUserToken(req).code;

      const assetsPayload = {
        code: generatedCode,
        internalAssetCode: allotmentresultInternalAssetCode,
        receivingDepartment: allotmentDepartment,
        location: allotmentLocation,
        assetCode: allotmentAssetCode,
        genericName: assetsComponentInfo.componentGenericName,
        brandName: assetsComponentInfo.componentBrandName,
        dateReceived: assetsComponentInfo.dateReceived,
        createdBy: activeUser,
        capitalized: finalCaptilstatus,
        categoryId: "21",
        assetTagStatus: assetsComponentInfo.assetTagStatus,
        // remarks: assetsComponentInfo.remarks,
        itemCode: assetsComponentInfo.itemCode.toUpperCase(),
        unitCost: assetsComponentInfo.unitCost,
        discount: assetsComponentInfo.discount,
        netCost: assetsComponentInfo.netCost,
        serialNo: assetsComponentInfo.serialNo,
        specifications: assetsComponentInfo.specifications,
        supplier: assetsComponentInfo.supplier,
        model: assetsComponentInfo.model,
        itAssetCode: partBeforeSlash,
        originId: assetsComponentInfo.originCode,
        administrator: "IT",
        receivingReportNo: assetsComponentInfo.receivingReportNo.toUpperCase(),
        totalSets: digitsAfterSlash,
      };

      const insertAssetStatus = await assetsComponents.insertAssetsComponents(
        assetsPayload,
        txn,
      );
      if (insertAssetStatus.error) {
        // console.error("Error", insertAssetStatus.error);
        return res.status(500).json({ error: insertAssetStatus.error });
      }

      return res.status(200).json({ success: true });
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.status(200).json(returnValue);
    // return res.json({ success: true });
  } catch (error) {
    // return error;
    return { error: error };
  }
};
const registerCEPackageAccessories = async (req, res) => {
  try {
    const assetsComponentInfo = req.body;
    // if (!assetsComponentInfo || Object.keys(assetsComponentInfo).length === 0) {
    //   return res.status(400).json({ error: "`body` is required." });
    // }

    const [numerator, denominator] = assetsComponentInfo.itAssetCode.split("/");

    const catCode = "CE";
    let generatedCode = "";

    const returnValue = await sqlHelper.transact(async (txn) => {
      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..AssetsComponents",
        `${catCode}AC`,
        txn, // Ensure transaction is passed
      );

      const activeUser = util.currentUserToken(req).code;

      const assetsPayload = {
        code: generatedCode,
        internalAssetCode: assetsComponentInfo.internalAssetCode.toUpperCase(),
        receivingDepartment: assetsComponentInfo.receivingDepartment,
        assetCode: assetsComponentInfo.assetCode,
        genericName: assetsComponentInfo.componentGenericName,
        brandName: assetsComponentInfo.componentBrandName,
        warrantyDate: assetsComponentInfo.warrantyDate,
        dateReceived: assetsComponentInfo.dateReceived,
        createdBy: activeUser,
        capitalized: assetsComponentInfo.capitalStat,
        categoryId: assetsComponentInfo.categoryId,
        remarks: assetsComponentInfo.remarks,
        unitCost: assetsComponentInfo.unitCost,
        discount: assetsComponentInfo.discount,
        netCost: assetsComponentInfo.netCost,
        serialNo: assetsComponentInfo.serialNo,
        specifications: assetsComponentInfo.specifications,
        supplier: assetsComponentInfo.supplier,
        model: assetsComponentInfo.model,
        itAssetCode: numerator.toUpperCase(),
        originId: assetsComponentInfo.originCode,
        administrator: assetsComponentInfo.administrator,
        transferStatus: assetsComponentInfo.transferStatus,
        location: assetsComponentInfo.location,
        totalSets: denominator,
      };

      const insertAssetStatus = await assetsComponents.insertAssetsComponents(
        assetsPayload,
        txn,
      );
      if (insertAssetStatus.error) {
        // throw new Error(insertAssetStatus.error);
        return res.status(500).json({ error: insertAssetStatus.error });
      }

      return { success: true };
    });

    return res.json(returnValue);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// const registerCEPackageAccessories = async function (req, res) {
//   try {
//     // if (util.empty(req.body))
//     //   return res.status(400).json({ error: "`body` is required." });

//     const assetsComponentInfo = req.body;
//     const str = assetsComponentInfo.itAssetCode;
//     const [numerator, denominator] = str.split("/");

//     const catCode = "CE";
//     let generatedCode = "";

//     const returnValue = await sqlHelper.transact(async (txn) => {
//       generatedCode = await sqlHelper.generateUniqueCode(
//         "UERMINV..AssetsComponents",
//         `${catCode}AC`,
//         // `AC`,
//         txn,
//       );

//       const activeUser = util.currentUserToken(req).code;
//       const assetsPayload = {
//         code: generatedCode,
//         internalAssetCode: assetsComponentInfo.internalAssetCode.toUpperCase(),
//         receivingDepartment: assetsComponentInfo.receivingDepartment,
//         assetCode: assetsComponentInfo.assetCode,
//         genericName: assetsComponentInfo.componentGenericName,
//         brandName: assetsComponentInfo.componentBrandName,
//         warrantyDate: assetsComponentInfo.warrantyDate,
//         dateReceived: assetsComponentInfo.dateReceived,
//         createdBy: activeUser,
//         // capitalized: finalCaptilstatus,
//         capitalized: assetsComponentInfo.capitalStat,
//         categoryId: assetsComponentInfo.categoryId,
//         remarks: assetsComponentInfo.remarks,
//         // itemCode: assetsComponentInfo.itemCode.toUpperCase(),
//         unitCost: assetsComponentInfo.unitCost,
//         discount: assetsComponentInfo.discount,
//         netCost: assetsComponentInfo.netCost,
//         serialNo: assetsComponentInfo.serialNo,
//         specifications: assetsComponentInfo.specifications,
//         supplier: assetsComponentInfo.supplier,
//         model: assetsComponentInfo.model,
//         // itAssetCode: assetsComponentInfo.itAssetCode.toUpperCase(),
//         itAssetCode: numerator.toUpperCase(),
//         originId: assetsComponentInfo.originCode,
//         administrator: assetsComponentInfo.administrator,
//         transferStatus: assetsComponentInfo.transferStatus,
//         // receivingReportNo: assetsComponentInfo.receivingReportNo.toUpperCase(),

//         location: assetsComponentInfo.physicalLocation,
//         totalSets: denominator,
//         // totalSets: assetsComponentInfo.totalpackage,
//       };

//       const insertAssetStatus = await assetsComponents.insertAssetsComponents(
//         assetsPayload,
//         txn,
//       );

//       if (insertAssetStatus.error) {
//         throw error.message;
//       }
//       return { success: true };
//     });

//     if (returnValue.error !== undefined) {
//       return res.status(500).json({ error: `${returnValue.error}` });
//     }
//     return res.json({ success: true });
//     // return res.json(returnValue);
//   } catch (error) {
//     // return error
//     console.error("Error in registerCEPackageAccessories:", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

module.exports = {
  getCurrentAssignedComponents,
  putPartsInfoAccounting,
  updatePartsInfoAudit,
  putUnassignedComponent,
  putReassignComponent,
  postRegisterComponent,
  putPartsInfo,
  getAllParts,
  getAllPartsInactive,
  getParts,
  getIncludedPartsToTransfer,
  getPartsTransferPrint,
  getPartsActiveInactive,
  putPartsCancelTransfer,
  getRetiredPartsAll,
  getPartsActiveInactiveNoDeptLimit,
  getPartsInactive,
  getPartsApprovedPartsWithMainAsset,
  getPartsApprovedPartsWithMainAssetTRANSFER,
  getPartsLogApproved,
  getIncludedPartsWithWhole,
  getPartsApprovedPartOnly,
  getIncludedPartsInformationReview,
  getPendingCondemParts,
  getPartsActiveOnly,
  getAllPartsByPassCondem,
  getCondemLogInfo,
  getAllCEParts,
  getPartsByAssetCode,
  getComponentParts,
  postRegisterComponentCE,
  registerCEPackageAccessories,
  deptViewingRetiredParts,
  updatePartsCEInfor,
  registerCEPartsNonPackage,
  manualRegisterCEPartsNonPackage,
  preApprovedParts,
  getPendingPreApprovedParts,
  getPartsForLocationModule,
  updateAccessoriesParent,
  getPartsWoParents,
};

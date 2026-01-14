const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const allotmentHistory = require("../models/allotmentHistory.js");

const jobOrders = require("../models/jobOrders.js");
// MODELS //

const getJobOrders = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = ` `;
    args = [];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrders(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const updateFiledJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;
    try {
      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;
      updateAssetInfo = await jobOrders.updateJO(
        {
          assessor: activeUser,
          jOStatus: false,
          // jOAcceptedDate: sqlHelper.getDateTime(),
          updatedBy: activeUser,
          JOProgress: "Pending",
        },

        { code: selectedRowJO.code },
        txn,
      );
      // for (const assetComponent of includedParts) {
      //   await jobOrders.updateAssetsComponents(
      //     {
      //       // location: assetsInfo.location,
      //       location: newLocation,
      //       updatedBy: util.currentUserToken(req).code,
      //     },
      //     { code: assetComponent.componentCode },
      //     txn,
      //   );
      // }

      //UPDATE PARTS INFO END//

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

const updateEvaluation = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;
    try {
      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;
      updateAssetInfo = await jobOrders.updateJO(
        {
          updatedBy: activeUser,

          DepartmentApprovedBy: activeUser,
          // DepartmentApprovedDate:
        },

        { code: selectedRowJO.code },
        txn,
      );
      // for (const assetComponent of includedParts) {
      //   await jobOrders.updateAssetsComponents(
      //     {
      //       // location: assetsInfo.location,
      //       location: newLocation,
      //       updatedBy: util.currentUserToken(req).code,
      //     },
      //     { code: assetComponent.componentCode },
      //     txn,
      //   );
      // }

      //UPDATE PARTS INFO END//

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

const cancelJOAccespt = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;
    try {
      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;
      updateAssetInfo = await jobOrders.updateJO(
        {
          assessor: activeUser,
          jOStatus: true,
          // jOAcceptedDate: sqlHelper.getDateTime(),
          updatedBy: activeUser,
          JOProgress: "Canceled",
        },

        { code: selectedRowJO },
        txn,
      ); // for (const assetComponent of includedParts) {
      //   await jobOrders.updateAssetsComponents(
      //     {
      //       // location: assetsInfo.location,
      //       location: newLocation,
      //       updatedBy: util.currentUserToken(req).code,
      //     },
      //     { code: assetComponent.componentCode },
      //     txn,
      //   );
      // }

      //UPDATE PARTS INFO END//

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json(error);
    }
  });
  return returnValue;
};

//ASSET LIST MODULE
const medicalAssetActive = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and jo.InternalAssetCode IS NULL and categoryId = ?`;
    args = ["22"];
    const options = {
      top: "",
      order: "asset.dateTimeUpdated desc ",
    };
    return await jobOrders.selectActiveMedicalEquipment(
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

const getEquipDetails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];

    args = [req.query.assetCode];
    sqlWhere = `and asset.code = ?  `;

    const options = {
      top: "",
      order: "",
    };
    return await jobOrders.selectActiveMedicalEquipment(
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

const getEmpHistory = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];

    args = [req.query.empCode];
    sqlWhere = `and jo.Assessor = ?  `;

    const options = {
      top: "",
      order: "",
    };
    return await jobOrders.selectActiveMedicalEquipment(
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
const getNextJoNumber = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // const userDepartmentCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and JobOrderNumber LIKE  CAST(YEAR(GETDATE()) AS VARCHAR) + '%' `;
    args = [];
    const options = {
      top: "1",
      order: "JobOrderNumber desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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
const getFloatingJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // const userDepartmentCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and JOStatus <> ? and JOProgress = ? and isEquipment = ? `;
    args = [0, "Floating", 1];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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
const getDepartamentalJORequests = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDepartmentCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";

    let args = [];
    sqlWhere = ` and isEquipment = ? and requestingDepartment = ?  and DepartmentApprovedBy is null `;
    args = [1, userDepartmentCode];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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
const getFiledJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    sqlWhere = ` and isEquipment = ? `; //and JOStatus <> ?
    args = [1];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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
const getCompletedJo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const joProgress = "Completed";
    let args = [];
    sqlWhere = `and JOProgress = ? `; //
    args = [joProgress];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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

const getAcceptedJo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    // const statusVal = false;

    let args = [];
    sqlWhere = `and assessor = ? and DepartmentApprovedBy is null `;
    args = [technicianEmployeeCode];

    // sqlWhere = ` `;
    // args = [];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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

const getDepartamentalHistory = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDepartmentCode = util.currentUserToken(req).deptCode;

    let sqlWhere = "";

    let args = [];
    sqlWhere = `and RequestingDepartment = ? and jOProgress = 'Completed' and isEvaluated = ? and DepartmentApprovedBy is not null`;
    args = [userDepartmentCode, 1];

    // sqlWhere = ` `;
    // args = [];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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

const getMyCompletedJo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    const statusVal = "Completed";

    let args = [];
    sqlWhere = `and assessor = ? and JOProgress= ? `;
    args = [technicianEmployeeCode, statusVal];

    // sqlWhere = ` `;
    // args = [];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrdersNewTable(
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
const postNewJO = async function (req, res) {
  try {
    if (util.empty(req.body)) {
      return res.status(400).json({ error: "`body` is required." });
    }

    const {
      // assetsComponentInfo,

      // entries,

      newJOPostingData,
      // formattedDates,
    } = req.body;

    // Transaction
    const returnValue = await sqlHelper.transact(async (txn) => {
      // for (let i = 0; i < parseInt(entries); i++) {
      // const generatedCode = await sqlHelper.generateUniqueCode(
      //   "[ITMgt].[dbo].[JobOrder]",
      //   `JO`,
      //   6,
      //   txn,
      // );
      // const generatedCode = "202300999";
      let generatedCode = "";
      const catCode = "JO";

      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..JobOrders",
        `${catCode}A`,
        6,
        txn,
      );

      const activeUser = util.currentUserToken(req).code;

      const newJOPayload = {
        code: generatedCode,
        JobOrderNumber: catCode,
        isEquipment: false,
        requestedBy: newJOPostingData.requestedBy,
        // department: newJOPostingData.requestingDepartment,
        JobOrderConcern: newJOPostingData.requestComplaint,
        PriorityLevel: newJOPostingData.requestJOType,
        createdBy: activeUser,
        // dateReceived: assetsComponentInfo.dateReceived,
        // createdBy: activeUser,
      };

      const insertAssetStatus = await jobOrders.registerMedicalJOAsset(
        newJOPayload,
        txn,
      ); //insertNewJO
      if (insertAssetStatus.error) {
        return res.status(500).json({ error: insertAssetStatus.error });
      }
      // }

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

const putAssesstmentResultTech = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const { assessmentEvalResult, joCode } = req.body;

      try {
        let updateAssetInfo = "";
        const activeUser = util.currentUserToken(req).code;
        updateAssetInfo = await jobOrders.updateJO(
          {
            remarks: assessmentEvalResult.remarks,
            assessmentResult: assessmentEvalResult.remarks,
            recommendation: assessmentEvalResult.remarks,
            jOStatus: true,
            // jOAcceptedDate: sqlHelper.getDateTime(),
            updatedBy: activeUser,
            JOProgress: "Completed",
            isEvaluated: true,
          },

          { code: joCode },
          txn,
        );

        // for (const assetComponent of includedParts) {
        //   await jobOrders.updateAssetsComponents(
        //     {
        //       // location: assetsInfo.location,
        //       location: newLocation,
        //       updatedBy: util.currentUserToken(req).code,
        //     },
        //     { code: assetComponent.componentCode },
        //     txn,
        //   );
        // }

        //UPDATE PARTS INFO END//

        return res.status(200).json(updateAssetInfo);
        //  return res.status(200).json({ success: true, message: "Update successful." });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    });
    return returnValue;
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
//manual CE Reg
const medicalAssetJORegister = async function (req, res) {
  try {
    if (util.empty(req.body))
      return res.status(400).json({ error: "`body` is required." });
    const {
      nextJONumber,
      selectedAssetPostJO,
      selectedMedicalAsset,
      requestingEmployeeDets,
    } = req.body;
    const returnValue = await sqlHelper.transact(async (txn) => {
      let generatedCode = "";
      const catCode = "JO";

      let finalizedNextJONumber;
      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..JobOrders",
        `${catCode}A`,
        6,
        txn,
      );

      // Recheck ONLY if `toInts` already exists
      try {
        const sqlWhere = `AND JobOrderNumber = ?`;
        const args = [nextJONumber];
        const options = { top: "", order: "dateTimeCreated DESC" };

        const existingJobOrder = await jobOrders.selectJobOrdersNewTable(
          sqlWhere,
          args,
          options,
          txn,
        );

        if (existingJobOrder.length > 0) {
          // return { error: `Job Order Number ${toInts} already exists.` };
          // Checking if `toInts` already exists
          const sqlWhere = `AND JobOrderNumber LIKE  CAST(YEAR(GETDATE()) AS VARCHAR) + '%'`;
          const args = [];
          const options = { top: "1", order: "dateTimeCreated DESC" };

          const getLatest = await jobOrders.selectJobOrdersNewTable(
            sqlWhere,
            args,
            options,
            txn,
          );

          const latestJobOrderNumber = getLatest?.[0]?.jobOrderNumber || null;

          const increAgain = parseInt(latestJobOrderNumber) + 1;
        }
      } catch (error) {
        console.log(error);
      }

      const activeUser = util.currentUserToken(req).code;
      const assetsPayload = {
        code: generatedCode,

        JobOrderNumber: toInts,
        ServiceActionCode: selectedAssetPostJO.serviceAction,
        EquipmentType: "MAIN",
        RequestingDepartment: requestingEmployeeDets.dEPT_CODE,
        ServiceType: selectedAssetPostJO.serviceType,
        PriorityLevel: selectedAssetPostJO.priorityLevel,
        MaintenanceCycle: selectedAssetPostJO.maintenanceCycle,
        JobOrderConcern: selectedAssetPostJO.concern,
        RequestedBy: selectedAssetPostJO.requestedBy,
        createdBy: activeUser,
        InternalAssetCode: selectedMedicalAsset.assetCode,

        JOProgress: "Floating",
        // ,RequestedDate
        // ,JOAcceptedDate
        // ,JOCompletedDate
        // ,Assessor
        // ,Remarks:selectedAssetPostJO.concern
        // ,JOStatus
        // ,CreatedBy
        // ,UpdatedBy
      };
      const insertAssetStatus = await jobOrders.registerMedicalJOAsset(
        assetsPayload,
        txn,
      );

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
const getAssignedJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";

    let args = [];
    sqlWhere = `and technician = ? `;
    args = [technicianEmployeeCode];

    // sqlWhere = ` `;
    // args = [];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrders(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getNewJOAssigned = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    const statusVal = false;

    let args = [];
    sqlWhere = `and technician = ? and accepted = ? and completed = ? and status is null and canceled = ?`;
    args = [technicianEmployeeCode, statusVal, statusVal, statusVal];

    // sqlWhere = ` `;
    // args = [];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrders(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAcceptedTechnicianJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    const statusVal = false;

    let args = [];
    sqlWhere = `and technician = ? and accepted = ? and completed = ? and status is null and canceled = ?`;
    args = [technicianEmployeeCode, true, statusVal, statusVal];

    // sqlWhere = ` `;
    // args = [];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await jobOrders.selectJobOrders(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

// --------------------------------------------------------------------
const transferredAssetLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "WHOLE";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=?`;
    args = [1, equipType, transferStatus];
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
};

const viewingDeptAssetTransferLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    const equipType = "WHOLE";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=? and transferStatus.fromDeptCode = ?`;
    args = [1, equipType, transferStatus, userDeptCode];
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
};

const transferredPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "PARTS";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=?`;
    args = [1, equipType, transferStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.getApprovedPartsTransferHistory(
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

const deptViewingTransferredPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;

    let sqlWhere = "";
    const equipType = "PARTS";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=? and transferStatus.fromDeptCode = ?`;
    args = [1, equipType, transferStatus, userDeptCode];

    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.getApprovedPartsTransferHistory(
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

//parts only
const getAllotmentHistoryByParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "PARTS";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and Active = ? and Type = ? and transferReStatus=?`;
    args = [1, equipType, transferStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
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
const getAllotmentHistory = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "WHOLE";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and Active = ? and Type = ? and transferReStatus=?`;
    args = [1, equipType, transferStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
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

const getCondemHistoryParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "PARTS";
    const condemReStatus = "Approved";
    let args = [];
    sqlWhere = `and Active = ? and Type = ? and condemReStatus=?`;
    args = [1, equipType, condemReStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.selectCondemHistory(
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
const getMaxId = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ``;
    args = [];
    const options = {
      top: "",
      order: "",
    };
    return await allotmentHistory.selectMaxTransferFormNo(
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

const getApprovedTransferPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.internalAssetCode))
      return res.status(400).json({ error: "`Asset Code` is required." });
    // const {internalAssetCode, transferFormNo}=req.body
    const internalAssetCode = req.query.internalAssetCode;
    const transferFormNo = req.query.transferFormNo;
    const transferReStatus = "Approved(with whole)";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and transferReStatus=? and active =? and internalAssetCode = ? and transferFormNo = ?`;
    args = [transferReStatus, 1, internalAssetCode, transferFormNo];

    const options = {
      top: "",
      order: "",
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

const getApprovedTransferBYPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.internalAssetCode))
      return res.status(400).json({ error: "`Asset Code` is required." });
    // const {internalAssetCode, transferFormNo}=req.body
    const internalAssetCode = req.query.internalAssetCode;
    const transferFormNo = req.query.transferFormNo;
    const code = req.query.code;
    const transferReStatus = "Approved";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and transferReStatus=? and active =? and internalAssetCode = ? and transferFormNo = ? and componentCode = ?`;
    args = [transferReStatus, 1, internalAssetCode, transferFormNo, code];

    const options = {
      top: "",
      order: "",
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

module.exports = {
  getAllotmentHistory,
  getAllotmentHistoryByParts,
  getApprovedTransferBYPartsLog,
  getApprovedTransferPartsLog,
  getMaxId,
  getCondemHistoryParts,
  transferredAssetLog,
  transferredPartsLog,
  viewingDeptAssetTransferLog,
  deptViewingTransferredPartsLog,
  getJobOrders,
  getFiledJO,
  getFloatingJO,
  postNewJO,
  getAssignedJO,
  getNewJOAssigned,
  getAcceptedTechnicianJO,
  medicalAssetJORegister,
  medicalAssetActive,
  updateFiledJO,
  getAcceptedJo,
  cancelJOAccespt,
  getEquipDetails,
  putAssesstmentResultTech,
  getCompletedJo,
  getEmpHistory,
  getMyCompletedJo,
  getDepartamentalJORequests,
  getDepartamentalHistory,
  updateEvaluation,
  getNextJoNumber,

  // getPartsLogApproved
};

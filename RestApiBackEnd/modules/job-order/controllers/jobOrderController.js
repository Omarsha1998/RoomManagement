const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //

const jobOrders = require("../models/jobOrders.js");
// const { schedule } = require("../../infirmary/controllers/ape/visit.js");
// MODELS //

// const getEquipment = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     // const userDepartmentCode = util.currentUserToken(req).deptCode;
//     const { inputtedNO } = req.body;
//     console.log("inputtedNO", inputtedNO);
//     let sqlWhere = "";
//     let args = [];
//     sqlWhere = ` and asset.serialNumber = ?`; //and asset.isMaintenanceReassigned <> ? and jo.InternalAssetCode IS NULL
//     args = [inputtedNO];
//     const options = {
//       top: "",
//       order: "asset.dateTimeUpdated desc ",
//     };
//     return await jobOrders.selectActiveMedicalEquipmentNoDuplicates(
//       sqlWhere,
//       args,
//       options,
//       txn,
//     );
//   });

//   // console.log("sqlWhere", sqlWhere);
//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

const getEquipment = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.inputtedNO))
      return res.status(400).json({ error: "`Asset Code` is required." });

    const inputtedNO = req.query.inputtedNO;
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asset.serialNumber = ?`;
    args = [inputtedNO];

    const options = {
      top: "",
      order: "",
    };
    return await jobOrders.selectActiveMedicalEquipmentNoDuplicates(
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

const getPartStatus = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    // const joProgress = "Completed";
    let args = [];
    sqlWhere = ` `; //
    args = [];
    const options = {
      top: "",
      order: "",
    };
    return await jobOrders.selectPartStatus(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const getPartId = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    // const joProgress = "Completed";
    let args = [];
    sqlWhere = ` `; //
    args = [];
    const options = {
      top: "",
      order: "",
    };
    return await jobOrders.selectPartId(sqlWhere, args, options, txn);
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAllPostedJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    // const joProgress = "Completed";
    let args = [];
    sqlWhere = ``; //
    args = [];
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
          jOStatus: false,
          jOAcceptedDate: util.currentDateTime(),
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
const cancelFiledJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;

    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await jobOrders.updateJO(
        {
          jOStatus: true,
          active: 0,
          jOAcceptedDate: util.currentDateTime(),
          updatedBy: activeUser,
          JOProgress: "Canceled",
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
const updateAssignTo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;
    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await jobOrders.updateJO(
        {
          jOStatus: false,
          jOAcceptedDate: util.currentDateTime(),
          updatedBy: activeUser,
          assessor: activeUser,
          JOProgress: "Floating",
        },

        { code: selectedRowJO.code },
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
const restartJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;
    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await jobOrders.updateJO(
        {
          // jOAcceptedDate: util.currentDateTime(),
          updatedBy: activeUser,
          // assessor: activeUser,
          JOProgress: "Floating",
        },

        { code: selectedRowJO.code },
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
const updateJODetails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;
    try {
      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await jobOrders.updateJO(
        {
          updatedBy: activeUser,
          serviceActionCode: selectedRowJO.assetServiceAction,
          serviceType: selectedRowJO.assetServiceType,
          priorityLevel: selectedRowJO.priorityLevel,
          maintenanceCycle: selectedRowJO.assetMaintenanceCycle,
          jobOrderConcern: selectedRowJO.jobOrderConcern,
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

const putMissedJo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO, newDate } = req.body;

    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      updateAssetInfo = await jobOrders.updateJO(
        {
          scheduledCheckup: newDate,
          updatedBy: activeUser,
        },

        { code: selectedRowJO.code },
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

const updateEvaluation = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedRowJO } = req.body;

    try {
      let updateAssetInfo = "";
      const activeUser = util.currentUserToken(req).code;
      updateAssetInfo = await jobOrders.updateJO(
        {
          updatedBy: activeUser,
          DepartmentApprovedDate: util.currentDateTime(),
          DepartmentApprovedBy: activeUser,
          active: 0,
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
      let generatedCode = "";
      const catCode = "JO";
      let finalizedNextJONumber;
      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..JobOrders",
        `${catCode}A`,
        6,
        txn,
      );

      const nextCheckupDate = new Date(selectedRowJO.scheduledCheckup);
      nextCheckupDate.setMonth(nextCheckupDate.getMonth() + 1);

      const correctedTime =
        // eslint-disable-next-line no-mixed-operators
        nextCheckupDate.getTime() -
        // eslint-disable-next-line no-mixed-operators
        nextCheckupDate.getTimezoneOffset() * 60000;
      const nextSched = new Date(correctedTime).toISOString().slice(0, 10);
      const sqlWhere = `AND JobOrderNumber LIKE  CAST(YEAR(GETDATE()) AS VARCHAR) + '%'`;
      const options = { top: "1", order: "JobOrderNumber DESC" };

      const getLatest = await jobOrders.selectJobOrdersNewTable(
        sqlWhere,
        [],
        options,
        txn,
      );

      const lastJONumber = getLatest?.[0]?.jobOrderNumber || null;

      if (lastJONumber) {
        finalizedNextJONumber = parseInt(lastJONumber) + 1;
      } else {
        const currentYear = new Date().getFullYear().toString();
        finalizedNextJONumber = `${currentYear}00001`;
      }
      let serviceActionRes = selectedRowJO.serviceActionCode;
      if (serviceActionRes === "Corrective Maintenance") {
        serviceActionRes = "Preventive Maintenance";
      }

      const jobOrderPayload = {
        code: generatedCode,
        JobOrderNumber: finalizedNextJONumber,
        ServiceActionCode: serviceActionRes,
        EquipmentType: "MAIN",
        // RequestingDepartment: requestingEmployeeDets?.dEPT_CODE || null,

        ServiceType: selectedRowJO.assetServiceType,
        PriorityLevel: selectedRowJO.priorityLevel,
        MaintenanceCycle: selectedRowJO.serviceType,
        // JobOrderConcern: selectedAssetPostJO.concern,
        // RequestedBy: selectedAssetPostJO.requestedBy,
        createdBy: activeUser,
        InternalAssetCode: selectedRowJO.assetCode,
        JOProgress: "Floating",
        ScheduledCheckup: nextSched,
        // ScheduledCheckup: selectedMedicalAsset.scheduledCheckup,
      };

      const insertJobOrder = await jobOrders.registerMedicalJOAsset(
        jobOrderPayload,
        txn,
      );

      if (!insertJobOrder) {
        return res.status(500).json({ error: "Failed to insert Job Order" });
      }

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
    sqlWhere = `and jo.InternalAssetCode IS NULL and categoryId = ? and asset.isMaintenanceReassigned = ?`;
    args = ["22", "1"];
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
const missedNeedAction = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asset.categoryId = ? and (CONVERT(DATE, jo.scheduledCheckup) < CONVERT(DATE, GETDATE())
 and (jo.jOProgress = ? or jo.jOProgress = ?))`;
    args = ["22", "Pending", "Floating"];
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
const notCompletedJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and asset.categoryId = ? and (jo.scheduledCheckup < GETDATE() and (jo.jOProgress = ? or jo.jOProgress = ?))`;
    args = ["22", "Pending", "Floating"];
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

const medEquipNoDuplicates = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ` and asset.categoryId = ? `; //and asset.isMaintenanceReassigned <> ? and jo.InternalAssetCode IS NULL
    args = ["21"];
    const options = {
      top: "",
      order: "asset.dateTimeUpdated desc ",
    };
    return await jobOrders.selectActiveMedicalEquipmentNoDuplicates(
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
const medEquipNoDuplicatesDepartment = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDepartmentCode = util.currentUserToken(req).deptCode;

    let sqlWhere = "";
    let args = [];
    sqlWhere = ` and asset.categoryId = ? and asset.receivingDepartment = ? and asset.isMaintenanceReassigned = ? `; //and asset.isMaintenanceReassigned <> ? and jo.InternalAssetCode IS NULL
    args = ["22", userDepartmentCode, 1];
    const options = {
      top: "",
      order: "asset.dateTimeUpdated desc ",
    };
    return await jobOrders.selectActiveMedicalEquipmentNoDuplicates(
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

//ASSET LIST MODULE

const getOpenConcern = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];

    args = [req.query.assetCode];
    sqlWhere = `and joCons.internalAssetCode = ?  `;

    const options = {
      top: "",
      order: "",
    };
    return await jobOrders.selectDetailedConcern(sqlWhere, args, options, txn);
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
      order: "jo.dateTimeCreated desc",
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

const getPerformedTasks = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];

    args = [req.query.joNumber];
    sqlWhere = `and jobOrderNumber = ?  `;

    const options = {
      top: "",
      order: "",
    };
    return await jobOrders.selectPerformedTask(sqlWhere, args, options, txn);
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
const getOngoingAcceptedJo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];

    args = [req.query.empCode];
    sqlWhere = `and jo.Assessor = ?  and jo.jOProgress = 'Pending' `;

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

const getDepartamentalJORequests = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const userDepartmentCode = util.currentUserToken(req).deptCode;
      let sqlWhere = "";

      let args = [];
      sqlWhere = ` and asset.receivingDepartment = ?  and jo.DepartmentApprovedBy is null  and jo.JOProgress is not null and jo.JOProgress <> 'Cancelled'  and MONTH(jo.scheduledCheckup) = MONTH(GETDATE()) AND YEAR(jo.scheduledCheckup) = YEAR(GETDATE())  `;

      args = [userDepartmentCode];
      const options = {
        top: "",
        order: "asset.dateTimeCreated desc",
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
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getApprovedEval = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const userDepartmentCode = util.currentUserToken(req).deptCode;
      let sqlWhere = "";

      let args = [];
      sqlWhere = ` and asset.receivingDepartment = ?  and jo.DepartmentApprovedBy is not null  and jo.JOProgress = 'Completed'  and jo.isEvaluated = ?`;
      args = [userDepartmentCode, 1];
      const options = {
        top: "",
        order: "asset.dateTimeCreated desc",
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
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getFiledDeptConcern = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const userDepartmentCode = util.currentUserToken(req).deptCode;
      let sqlWhere = "";

      let args = [];
      sqlWhere = ` and joCons.active = ? and joCons.deptCode = ? `;
      args = [1, userDepartmentCode];
      const options = {
        top: "",
        order: "joCons.dateTimeCreated desc",
      };
      return await jobOrders.selectComplaintConcern(
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
const getAllDeptConcerns = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";

      let args = [];
      sqlWhere = ` and joCons.active = ? `;
      args = [1];
      const options = {
        top: "",
        order: "joCons.dateTimeCreated desc",
      };
      return await jobOrders.selectDetailedConcern(
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
const getOutOFWarranties = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";

    let args = [];
    // sqlWhere = ` and asset.warrantyDate < GETDATE() and asset.categoryId = ? and asset.isMaintenanceReassigned = ? and jo.DepartmentApprovedBy is  null`; //and JOStatus <> ?
    sqlWhere = `  and asset.categoryId = ? and asset.isMaintenanceReassigned = ? and MONTH(jo.scheduledCheckup) = MONTH(GETDATE()) AND YEAR(jo.scheduledCheckup) = YEAR(GETDATE()) and jo.active =?`; //and JOStatus <> ?
    // sqlWhere = `  and asset.categoryId = ? and asset.isMaintenanceReassigned = ? and MONTH(jo.scheduledCheckup) = 5 AND YEAR(jo.scheduledCheckup) = YEAR(GETDATE()) and jo.active =?`; //and JOStatus <> ?

    args = ["22", 1, 1];
    const options = {
      top: "",
      order: "asset.dateTimeCreated desc",
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

const getUnreadJO = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    // const statusVal = false;

    let args = [];
    sqlWhere = `and assessor = ? and isRead  = ? `;
    args = [technicianEmployeeCode, 0];

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

const getJoPending = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    // const statusVal = false;

    let args = [];
    sqlWhere = `and assessor = ? and isRead  = ? and jOProgress = ?`;
    args = [technicianEmployeeCode, 1, "Pending"];

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
const getJoAccept = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    // const statusVal = false;

    let args = [];
    sqlWhere = `and assessor = ? and isRead  = ? and jOProgress = ? and JOAcceptedDate is null`;
    args = [technicianEmployeeCode, 1, "Floating"];

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
const getForAcknowledgement = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const technicianEmployeeCode = util.currentUserToken(req).code;
    let sqlWhere = "";
    // const statusVal = false;

    let args = [];
    sqlWhere = `and assessor = ? and isRead  = ? and isEvaluated = ? and AcknowledgeSignature is null and JOAcceptedDate is not null`;
    args = [technicianEmployeeCode, 1, 1];

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
    sqlWhere = `and assessor = ? and JOProgress= ? and DepartmentApprovedBy is not null`;
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

const putEquipmentReassigning = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const {
        selectedMedicalAsset,
        selectedAssetPostJO,
        requestingEmployeeDets,
        addedTasks,
        schedCheckup,
      } = req.body;
      let generatedCode = "";
      const catCode = "JO";
      let finalizedNextJONumber;

      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..JobOrders",
        `${catCode}A`,
        6,
        txn,
      );

      try {
        let updateAssetInfo = "";
        const activeUser = util.currentUserToken(req).code;
        updateAssetInfo = await jobOrders.updateAssetsOne(
          {
            ServiceAction: selectedMedicalAsset.assetServiceAction,
            updatedBy: activeUser,
            serviceType: selectedMedicalAsset.assetServiceType,
            // PriorityLevel: selectedMedicalAsset.priorityLevel,
            MaintenanceCycle: selectedMedicalAsset.assetMaintenanceCycle,
            // JobOrderConcern: selectedMedicalAsset.concern,
            // RequestedBy: selectedMedicalAsset.requestedBy,
            isMaintenanceReassigned: true,
          },

          { code: selectedMedicalAsset.assetCode },
          txn,
        );

        //UPDATE PARTS INFO END//
        const sqlWhere = `AND JobOrderNumber LIKE  CAST(YEAR(GETDATE()) AS VARCHAR) + '%'`;
        const options = { top: "1", order: "JobOrderNumber DESC" };

        const getLatest = await jobOrders.selectJobOrdersNewTable(
          sqlWhere,
          [],
          options,
          txn,
        );

        const lastJONumber = getLatest?.[0]?.jobOrderNumber || null;

        if (lastJONumber) {
          finalizedNextJONumber = parseInt(lastJONumber) + 1;
        } else {
          const currentYear = new Date().getFullYear().toString();
          finalizedNextJONumber = `${currentYear}00001`;
        }

        const jobOrderPayload = {
          code: generatedCode,
          JobOrderNumber: finalizedNextJONumber,
          ServiceActionCode: selectedMedicalAsset.assetServiceAction,
          EquipmentType: "MAIN",
          RequestingDepartment: requestingEmployeeDets?.dEPT_CODE || null,
          ServiceType: selectedMedicalAsset.assetServiceType,
          PriorityLevel: selectedAssetPostJO.priorityLevel,
          MaintenanceCycle: selectedMedicalAsset.assetMaintenanceCycle,
          JobOrderConcern: selectedAssetPostJO.concern,
          RequestedBy: selectedAssetPostJO.requestedBy,
          createdBy: activeUser,
          InternalAssetCode: selectedMedicalAsset.assetCode,
          JOProgress: "Floating",
          ScheduledCheckup: schedCheckup,
          // ScheduledCheckup: selectedMedicalAsset.scheduledCheckup,
        };

        const insertJobOrder = await jobOrders.registerMedicalJOAsset(
          jobOrderPayload,
          txn,
        );

        if (!insertJobOrder) {
          return res.status(500).json({ error: "Failed to insert Job Order" });
        }

        for (const task of addedTasks) {
          const taskCode = await sqlHelper.generateUniqueCode(
            "UERMINV..JobOrderTasks",
            `TASK`,
            4,
            txn,
          );

          const taskPayload = {
            code: taskCode,
            jobOrderNumber: finalizedNextJONumber,
            joTaskName: task.value,
            createdBy: activeUser,
          };

          const insertTask = await jobOrders.registerTasks(taskPayload, txn);

          if (!insertTask) {
            return res.status(500).json({ error: "Failed to insert Task" });
          }
        }
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

const putEquipmentReassigningUnderWarranty = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const {
        selectedMedicalAsset,
        // selectedAssetPostJO,
        // requestingEmployeeDets,
        // addedTasks,
        // schedCheckup,
      } = req.body;

      try {
        let updateAssetInfo = "";
        const activeUser = util.currentUserToken(req).code;
        updateAssetInfo = await jobOrders.updateAssetsOne(
          {
            // ServiceAction: selectedMedicalAsset.assetServiceAction,
            updatedBy: activeUser,
            // serviceType: selectedMedicalAsset.assetServiceType,
            // PriorityLevel: selectedMedicalAsset.priorityLevel,
            // MaintenanceCycle: selectedMedicalAsset.assetMaintenanceCycle,
            // JobOrderConcern: selectedMedicalAsset.concern,
            // RequestedBy: selectedMedicalAsset.requestedBy,
            isMaintenanceReassigned: true,
          },

          { code: selectedMedicalAsset.assetCode },
          txn,
        );

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
const acceptJoConcern = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const { selectedJobOrderConcern } = req.body;

      let generatedCode = "";
      const catCode = "JO";
      let finalizedNextJONumber;
      const activeUser = util.currentUserToken(req).code;
      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..JobOrders",
        `${catCode}A`,
        6,
        txn,
      );

      try {
        //UPDATE PARTS INFO END//
        let updateAssetInfo = "";

        updateAssetInfo = await jobOrders.updateConcern(
          {
            updatedBy: activeUser,
            active: false,
          },

          { code: selectedJobOrderConcern.code },
          txn,
        );

        const sqlWhere = `AND JobOrderNumber LIKE  CAST(YEAR(GETDATE()) AS VARCHAR) + '%'`;
        const options = { top: "1", order: "JobOrderNumber DESC" };

        const getLatest = await jobOrders.selectJobOrdersNewTable(
          sqlWhere,
          [],
          options,
          txn,
        );

        const lastJONumber = getLatest?.[0]?.jobOrderNumber || null;

        if (lastJONumber) {
          finalizedNextJONumber = parseInt(lastJONumber) + 1;
        } else {
          const currentYear = new Date().getFullYear().toString();
          finalizedNextJONumber = `${currentYear}00001`;
        }
        const date = new Date();
        const formattedDate = date.toISOString().replace("T", " ").slice(0, -1);
        // console.log(formattedDate); // Outputs: 2025-04-16 00:00:00.000

        const jobOrderPayload = {
          code: generatedCode,
          JobOrderNumber: finalizedNextJONumber,
          ServiceActionCode: "Corrective Maintenance",
          EquipmentType: "MAIN",
          RequestingDepartment: selectedJobOrderConcern.deptCode,
          ServiceType: "Out of Warranty",
          PriorityLevel: "URGENT",
          MaintenanceCycle: "Annual",
          JobOrderConcern: selectedJobOrderConcern.concern,
          RequestedBy: selectedJobOrderConcern.createdBy,
          createdBy: activeUser,
          requestedDate: selectedJobOrderConcern.dateTimeCreated,
          InternalAssetCode: selectedJobOrderConcern.internalAssetCode,
          JOProgress: "Floating",
          ScheduledCheckup: formattedDate,
        };

        const insertJobOrder = await jobOrders.registerMedicalJOAsset(
          jobOrderPayload,
          txn,
        );

        if (!insertJobOrder) {
          return res.status(500).json({ error: "Failed to insert Job Order" });
        }

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
const putUnreadJoViewed = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { unreadJOLists } = req.body;

    try {
      let updateAssetInfo = "";

      const activeUser = util.currentUserToken(req).code;

      for (const item of unreadJOLists) {
        updateAssetInfo = await jobOrders.updateJO(
          {
            isRead: 1,
            updatedBy: activeUser,
          },
          { code: item.code },
          txn,
        );
      }

      return res.status(200).json(updateAssetInfo);
      //  return res.status(200).json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
  return returnValue;
};

const putAssesstmentResultTech = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const { selectedJo, signatureImage, fillupDetails } = req.body;

      try {
        let updateAssetInfo = "";
        const activeUser = util.currentUserToken(req).code;

        updateAssetInfo = await jobOrders.updateJO(
          {
            remarks: selectedJo.remarks,
            jOStatus: true,
            acknowledgeSignature: signatureImage,
            updatedBy: activeUser,
            JOProgress: "Completed",
            isEvaluated: true,
            partStatus: fillupDetails.partStatus,
            partId: fillupDetails.partId,
            startingDate: fillupDetails.dateFrom,
            endDate: fillupDetails.DepartmentApprovedBy,
            EquipmentType: fillupDetails.equipmentType,
          },

          { code: selectedJo.code },
          txn,
        );

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
const saveForlater = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const { assessmentEvalResult, joCode, existingTasks, newTasks } =
        req.body;
      // console.log(performedResults);
      try {
        let updateAssetInfo = "";
        const activeUser = util.currentUserToken(req).code;

        updateAssetInfo = await jobOrders.updateJO(
          {
            remarks: assessmentEvalResult.remarks,
            assessmentResult: assessmentEvalResult.assessmentResult,
            recommendation: assessmentEvalResult.recommendation,

            updatedBy: activeUser,
          },

          { code: joCode },
          txn,
        );
        if (existingTasks) {
          for (const taskOutput of existingTasks) {
            await jobOrders.updateJOTask(
              {
                joTaskResult: taskOutput.performedResult,

                updatedBy: util.currentUserToken(req).code,
              },
              { code: taskOutput.code },
              txn,
            );
          }
        }

        //UPDATE PARTS INFO END//
        if (newTasks) {
          for (const task of newTasks) {
            const taskCode = await sqlHelper.generateUniqueCode(
              "UERMINV..JobOrderTasks",
              `TASK`,
              4,
              txn,
            );

            const taskPayload = {
              code: taskCode,
              jobOrderNumber: assessmentEvalResult.jobOrderNumber,
              joTaskName: task.joTaskName,
              joTaskResult: task.joTaskResult,
              createdBy: activeUser,
            };

            const insertTask = await jobOrders.registerTasks(taskPayload, txn);

            if (!insertTask) {
              return res.status(500).json({ error: "Failed to insert Task" });
            }
          }
        }

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

const medicalAssetJORegister = async function (req, res) {
  try {
    if (util.empty(req.body))
      return res.status(400).json({ error: "`body` is required." });

    const {
      selectedAssetPostJO,
      // selectedMedicalAsset,
      // requestingEmployeeDets,
      // addedTasks,
    } = req.body;

    if (!selectedAssetPostJO)
      return res.status(400).json({ error: "Missing required data" });

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

      try {
        const sqlWhere = `AND JobOrderNumber LIKE  CAST(YEAR(GETDATE()) AS VARCHAR) + '%'`;
        const options = { top: "1", order: "JobOrderNumber DESC" };

        const getLatest = await jobOrders.selectJobOrdersNewTable(
          sqlWhere,
          [],
          options,
          txn,
        );

        const lastJONumber = getLatest?.[0]?.jobOrderNumber || null;

        if (lastJONumber) {
          finalizedNextJONumber = parseInt(lastJONumber) + 1;
        } else {
          const currentYear = new Date().getFullYear().toString();
          finalizedNextJONumber = `${currentYear}00001`;
        }
      } catch (error) {
        return res
          .status(500)
          .json({ error: "Error fetching latest JO number" });
      }

      const activeUser = util.currentUserToken(req).code;
      const jobOrderPayload = {
        code: generatedCode,
        JobOrderNumber: finalizedNextJONumber,
        RequestingDepartment: selectedAssetPostJO.deptCode,
        // WorkLocation: selectedAssetPostJO.workLocation,
        Assessor: selectedAssetPostJO.assignTo,
        PriorityLevel: selectedAssetPostJO.priorityLevel,

        JobOrderConcern: selectedAssetPostJO.complaint,
        RequestedBy: selectedAssetPostJO.requestedBy,
        createdBy: activeUser,
        JOProgress: "Floating",
      };

      const insertJobOrder = await jobOrders.insertPostedJo(
        jobOrderPayload,
        txn,
      );

      if (!insertJobOrder) {
        return res.status(500).json({ error: "Failed to insert Job Order" });
      }

      return { success: true };
    });

    if (returnValue.error) {
      return res.status(500).json({ error: returnValue.error });
    }
    return res.json({ success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

const compaliantConcern = async function (req, res) {
  try {
    if (util.empty(req.body))
      return res.status(400).json({ error: "`body` is required." });

    const { selectedAssetPostJO, complaintConcern } = req.body;

    if (!selectedAssetPostJO)
      return res.status(400).json({ error: "Missing required data" });

    const returnValue = await sqlHelper.transact(async (txn) => {
      let generatedCode = "";
      const catCode = "CC";
      // let finalizedNextJONumber;

      generatedCode = await sqlHelper.generateUniqueCode(
        "UERMINV..JoDepartmentConcern",
        `${catCode}`,
        6,
        txn,
      );

      const activeUser = util.currentUserToken(req).code;
      const jobOrderPayload = {
        code: generatedCode,
        concern: complaintConcern,
        deptCode: selectedAssetPostJO.receivingDepartment,
        createdBy: activeUser,
        InternalAssetCode: selectedAssetPostJO.assetCode,
      };

      const insertJobOrder = await jobOrders.registerComplain(
        jobOrderPayload,
        txn,
      );

      if (!insertJobOrder) {
        return res.status(500).json({ error: "Failed to insert Job Order" });
      }

      return { success: true };
    });

    if (returnValue.error) {
      return res.status(500).json({ error: returnValue.error });
    }
    return res.json({ success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

module.exports = {
  getAllPostedJO,

  getJobOrders,

  postNewJO,

  medicalAssetJORegister,
  medicalAssetActive,
  updateFiledJO,
  cancelFiledJO,
  updateAssignTo,
  restartJO,
  getAcceptedJo,
  getUnreadJO,
  cancelJOAccespt,
  getEquipDetails,
  putAssesstmentResultTech,
  getCompletedJo,
  getEmpHistory,
  getMyCompletedJo,
  getDepartamentalJORequests,
  updateEvaluation,

  getPerformedTasks,
  getOutOFWarranties,
  putEquipmentReassigning,
  putEquipmentReassigningUnderWarranty,
  getOngoingAcceptedJo,
  getApprovedEval,
  putMissedJo,
  missedNeedAction,
  notCompletedJO,
  medEquipNoDuplicates,
  medEquipNoDuplicatesDepartment,
  saveForlater,
  compaliantConcern,
  getFiledDeptConcern,
  getAllDeptConcerns,
  acceptJoConcern,
  updateJODetails,
  getOpenConcern,
  getPartStatus,
  getPartId,
  putUnreadJoViewed,
  getJoPending,
  getJoAccept,
  getForAcknowledgement,
  getEquipment,
  // getPartsLogApproved
};

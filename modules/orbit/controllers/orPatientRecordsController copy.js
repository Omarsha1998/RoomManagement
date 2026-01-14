const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //

const orRecords = require("../models/orRecords.js");
const ehrOrbitRecords = require("../models/ehrOrbitRecords.js");
// const { schedule } = require("../../infirmary/controllers/ape/visit.js");
// MODELS //

const getAnalytics = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const sqlWhere = ``;
      const args = [];
      const options = {
        top: "",
        order: "department ASC",
      };
      // Return the clean query result directly
      return await orRecords.selectEncodingAnalytics(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getActiveEhrCases = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      // const sqlWhere =
      //   "and cases.DISCHARGE = 'N' and cases.CASENO not like '%w'";
      const sqlWhere = `and n.FieldGroupCode IN ('oprec', 'oprec2') and e.caseNo = ?`;
      const args = [selectedPatientRow];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await ehrOrbitRecords.selectActiveCases(
        sqlWhere,
        args,
        options,
        txn,
      );
    });
    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const insertPrintAttempt = async function (req, res) {
  try {
    if (util.empty(req.body)) {
      return res.status(400).json({ error: "`body` is required." });
    }

    const {
      selectedPatientRow,
      pcIpAddress,
      selectedProcedure,
      printedFormType,
    } = req.body;

    // Transaction
    const returnValue = await sqlHelper.transact(async (txn) => {
      const activeUser = util.currentUserToken(req).code;
      const prefixs = "PRNT";
      const generatedCode = await sqlHelper.generateUniqueCode(
        "UERMMMC..OrbitPrintLog",
        prefixs.toUpperCase(),
        2,
        txn,
      );

      const operativeLogs = {
        code: generatedCode,

        createdBy: activeUser,
        caseNo: selectedPatientRow.cASENO,
        ipAddress: pcIpAddress,
        procedureCode: selectedProcedure.code,
        formType: printedFormType,
      };

      const insertAssetStatus = await orRecords.insertPrintingAttemptLogs(
        operativeLogs,
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

// const getPatientDetails = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       let sqlWhere = "";
//       // const joProgress = "Completed";
//       let args = [];
//       sqlWhere = ``; //
//       args = [];
//       const options = {
//         top: "",
//         order: "",
//       };
//       return await orRecords.selectPatientRecords(sqlWhere, args, options, txn);
//     } catch (error) {
//       return res
//         .status(500)
//         .json({ error: `Internal Server Error: ${error.message}` });
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

const getPatientDetails = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      // const sqlWhere =
      //   "and cases.DISCHARGE = 'N' and cases.CASENO not like '%w'";
      const sqlWhere = `
        AND cases.DISCHARGE = 'N'
        AND cases.CASENO NOT LIKE '%w'
        AND (
          (cases.PATIENTTYPE = 'OPD'
           AND cases.DATEAD >= DATEADD(HOUR, -24, GETDATE()))
          OR
          (cases.PATIENTTYPE = 'IPD')
        )  or cases.DATEDIS >= DATEADD(HOUR, -5, GETDATE())`;
      const args = [];
      const options = {
        top: "",
        order: "px_info.LASTNAME ASC",
      };
      // Return the clean query result directly
      return await orRecords.selectPatientRecords(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getTestPdets = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      // const sqlWhere =
      //   "and  cases.DISCHARGE = 'N' and  cases.CASENO not like '%w'"; SUPER BIGAT
      const sqlWhere = `
        AND cases.DISCHARGE = 'N'
        AND cases.CASENO NOT LIKE '%w'
        AND (
          (cases.PATIENTTYPE = 'OPD'
           AND cases.DATEAD >= DATEADD(HOUR, -24, GETDATE()))
          OR
          (cases.PATIENTTYPE = 'IPD')
        ) or cases.DATEDIS >= DATEADD(HOUR, -5, GETDATE())`;
      const args = [];
      const options = {
        top: "",
        order: "px_info.LASTNAME ASC",
      };
      // Return the clean query result directly
      return await orRecords.selectTestREcords(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getCasesForOperatives = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      // const sqlWhere =
      // "and cases.CASENO not like '%w' and cases.DISCHARGE = 'N' ";
      const sqlWhere = `
        AND cases.DISCHARGE = 'N'
        AND cases.CASENO NOT LIKE '%w'
        AND (
          (cases.PATIENTTYPE = 'OPD'
           AND cases.DATEAD >= DATEADD(HOUR, -24, GETDATE()))
          OR
          (cases.PATIENTTYPE = 'IPD')
        )  or cases.DATEDIS >= DATEADD(HOUR, -5, GETDATE())`;
      const args = [];
      const options = {
        top: "",
        order: "px_info.LASTNAME ASC",
      };
      // Return the clean query result directly
      return await orRecords.selectTestREcords(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getProcedures = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;

      const sqlWhere = `and  orbitOp.caseNo = ? and orbitOp.active = ? `; //cases.CASENO
      const args = [selectedPatientRow, 1];
      const options = {
        top: "",
        order: "orbitOp.dateTimeCreated desc",
      };
      // Return the clean query result directly
      return await orRecords.selectPatientsWIthOperativeRecordstesting(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getDischargeWithProcedures = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      // const { selectedPatientRow } = req.query;

      const sqlWhere = `and t.rn = ?`;
      const args = [1];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectDischargeCases(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getProceduresPerDepartment = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const activeUser = util.currentUserToken(req).deptCode;
      const employmentClass = util.currentUserToken(req).employmentClass;
      // console.log("DEPT", activeUser);
      let sqlWhere = ``;
      let args = [];
      if (employmentClass !== "RA") {
        sqlWhere = `and orbitOp.caseNo =? and orbitOp.active = ? and orbitOp.department = ?`; //cases.CASENO = ?
        args = [selectedPatientRow, 1, activeUser];
      } else {
        sqlWhere = `and orbitOp.caseNo =? and orbitOp.active = ? `;
        args = [selectedPatientRow, 1];
      }

      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectPatientsWIthOperativeRecordstesting(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
// const getProcedures = async function (req, res) {
//   try {
//     const result = await sqlHelper.transact(async (txn) => {
//       const { selectedPatientRow } = req.query;

//       if (!selectedPatientRow) {
//         throw new Error("Missing selectedPatientRow in query");
//       }

//       const sqlWhere = `and caseNo = ? `;
//       const args = [selectedPatientRow];
//       const options = { top: "", order: "" };

//       return await orRecords.selectPatientRecords(sqlWhere, args, options, txn);
//     });

//     return res.json(result || []); // Always return an array, even if empty
//   } catch (error) {
//     console.error("Error in getProcedures:", error); // <== ADD THIS
//     return res
//       .status(500)
//       .json({ error: `Internal Server Error: ${error.message}` });
//   }
// };

const getWithOperativeOnly = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      // const sqlWhere =
      //   "and cases.DISCHARGE = ? and cases.CASENO NOT LIKE '%w' and orbitOp.active = ?   and  orbitOp.OpTechForm = ?";

      const sqlWhere = `
          AND cases.DISCHARGE = 'N'
          AND cases.CASENO NOT LIKE '%w'
          AND (
            (cases.PATIENTTYPE = 'OPD'
             AND cases.DATEAD >= DATEADD(HOUR, -24, GETDATE()))
            OR
            (cases.PATIENTTYPE = 'IPD')
          )  or cases.DATEDIS >= DATEADD(HOUR, -5, GETDATE()) and (orbitOp.active = ?   and  orbitOp.OpTechForm = ?)
       `;
      const args = [1, 1];
      const options = {
        top: "",
        order: "px_info.LASTNAME ASC",
      };
      // Return the clean query result directly
      return await orRecords.selectPatientsWIthOperativeRecords(
        sqlWhere,
        args,
        options,
        txn,
      );
    });
    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getNoDuplicatesActiveProcedure = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const sqlWhere = " and  OpTechForm = ? or OpRecForm = ? and active = ? ";
      const args = [1, 1, 1];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectDistinctActiveProcedures(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getFirstOREntry = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ?`;
      const args = [selectedPatientRow];
      const options = {
        top: "1",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectCaseORDate(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getEncounterdetails = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const activeUser = util.currentUserToken(req).deptCode;

      const sqlWhere = `and caseNo = ? and deptCode = ?`;
      const args = [selectedPatientRow, activeUser];

      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectEncounter(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getEncounterDashboard = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      // const activeUser = util.currentUserToken(req).deptCode;

      const sqlWhere = `and caseNo = ? `;
      const args = [selectedPatientRow];
      const options = {
        top: "",
        order: "dateTimeCreated desc",
      };
      // Return the clean query result directly
      return await orRecords.selectEncounter(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getPrintLogs = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and CaseNo = ? `; //and procedureCode = ?
      const args = [selectedPatientRow]; //, selectedProcedure
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectPrintLog(sqlWhere, args, options, txn);
    });
    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getSurgeons = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      // const sqlWhere = "and DELETED = ? and DEPARTMENT = ?";
      // const args = ["0", "SURG"];
      const deptCodes = ["SURG", "OPTH", "OBGY", "OTOR", "NEURO", "UEDEN"];
      const sqlWhere = `and DEPARTMENT in (?) and DELETED = ?`;
      const args = [deptCodes, "0"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectDoctors(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getSurgeonsSelection = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { endoded } = req.query;
      const deptCodes = ["SURG", "OPTH", "OBGY", "OTOR", "NEURO", "UEDEN"];
      const sqlWhere = "and DELETED = ? and DEPARTMENT in (?) and nAME LIKE  ?";
      const args = ["0", deptCodes, `%${endoded}%`];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectDoctors(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getResidents = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const sqlWhere = "and is_active = ? and emp_class_code = ?";
      const args = ["1", "RE"];
      const options = {
        top: "",
        order: "lastName asc",
      };
      // Return the clean query result directly
      return await orRecords.selectEmployeeTbl(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getNurses = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const deptCodes = ["7060", "1180", "1024", "1170"];
      const sqlWhere = `and dept_code in (?)`;
      const args = [deptCodes];

      const options = {
        top: "",
        order: "lastName asc",
      };
      // Return the clean query result directly
      return await orRecords.selectEmployeeTbl(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getAnesthesiology = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const sqlWhere = "and DELETED = ? and DEPARTMENT = ?";
      const args = ["0", "ANES"];
      const options = {
        top: "",
        order: "NAME desc",
      };
      // Return the clean query result directly
      return await orRecords.selectDoctors(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getSponges = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ?`;
      const args = [selectedPatientRow, 1];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectSponges(sqlWhere, args, options, txn);
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getOrbitSignatories = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "visAsstSurg"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getActivePrimarySurgs = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sugeType = ["ueSurg", "ueResidents", "visSurg"];
      const sqlWhere = `and procedureCode = ? and active = ? and type IN (?)`;
      const args = [selectedPatientRow, 1, sugeType];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getActiveAssistSurgs = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sugeType = ["ueAsstSurg", "assistantResidents", "visAsstSurg"];
      const sqlWhere = `and procedureCode = ? and active = ? and type IN (?)`;
      const args = [selectedPatientRow, 1, sugeType];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getUeAnes = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "ueAnes"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getVisitingAnes = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "visitingAnesthesia"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getOrbitUeAssistantSurgeon = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "ueAsstSurg"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getOrbitUeHeadsSurgeon = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;

      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "ueSurg"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getOrbitVisitingSurgeons = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "visSurg"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getOrbitResidents = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "ueResidents"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getOrbitAssistantResidents = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "assistantResidents"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getOrbitAnesthesiologistResidents = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "anestheResidents"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getAttendingNurse = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "ueScrubNurse"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const getCirculatingNurse = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? and type = ?`;
      const args = [selectedPatientRow, 1, "ueCircuNurse"];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};
const getAllSurgs = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ? and active = ? `;
      const args = [selectedPatientRow, 1];
      const options = {
        top: "",
        order: "",
      };
      // Return the clean query result directly
      return await orRecords.selectOrbitSignatories(
        sqlWhere,
        args,
        options,
        txn,
      );
    });

    return res.json(result); // This should now be safe
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
};

const modifyPatientDetails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const {
      selectedPatientRow,
      // surgRes,
      // cliNurses,
      // asstSurRes,
      spongeDatas,
      signatorys,
      removedVisitingAsst,
      visitingSS,
      removedSponges,
      ueAssisSurgs,
      removedueAssisSurgs,
      removeVisitingHeadSurgeon,
      removedUeAnnes,
      ueAnnes,
      // circu,
      ueheadSurgs,
      removedHeadSurgs,
      newResident,
      removeResi,
      // modifiedData,
      newVisitingAnesthesia,
      removeVisiAnesthesia,
      removesScrbNrs,
      // formTypes,
      // signatureImage,
    } = req.body;

    // const allToModify = [];
    // allToModify.push(signatorys);
    // allToModify.push(visitingSS);
    const allToModify = [
      ...signatorys,
      ...visitingSS,
      ...newResident,
      ...newVisitingAnesthesia,
      // ...cliNurses,
    ];
    const allToInactive = [
      ...removeVisitingHeadSurgeon,
      ...removedVisitingAsst,
      ...removeResi,
      ...removeVisiAnesthesia,
      ...removesScrbNrs,
      ...removedHeadSurgs,
      ...removedUeAnnes,
      ...removedueAssisSurgs,

      // ...removedueAssisSurgs,
    ];

    try {
      const activeUser = util.currentUserToken(req).code;

      const withOrProcedure = await orRecords.selectOrbitOperativesTbl(
        `and caseNo = ?`,
        [selectedPatientRow.cASENO],
        {},
        txn,
      );

      // if (Object.keys(modifiedData).length) {
      //   const groupInsertCode = await sqlHelper.generateUniqueCode(
      //     "UERMMMC..OrbitOperativeLogs",
      //     "GIC",
      //     4,
      //     txn,
      //   );

      // for (const fieldName in modifiedData) {
      //   const generatedCode = await sqlHelper.generateUniqueCode(
      //     "UERMMMC..OrbitOperativeLogs",
      //     "LOG",
      //     4,
      //     txn,
      //   );
      //   const change = modifiedData[fieldName]; // { old: '...', new: '...' }

      //   const payload = {
      //     code: generatedCode,
      //     caseNO: selectedPatientRow.cASENO,
      //     fieldName: fieldName, // e.g. 'operativeDiagnosis'
      //     // new value
      //     colValue: change.old, // optional, if needed
      //     createdBy: activeUser,
      //     groupCode: groupInsertCode,
      //     operativeType: formTypes,
      //   };

      //   await orRecords.insertOperativeUpdatesLogs(payload, txn);
      // }
      // }
      if (withOrProcedure.length > 0) {
        await orRecords.updatePatientInfo(
          {
            // active: false,
            OperativeDiagnosis: selectedPatientRow.operativeDiagnosis,
            diagnosisProcedure: selectedPatientRow.diagnosisProcedure,
            procedureClassification: selectedPatientRow.procedureClassification,
            // surgeon: surgRes,
            // startDateTimeOperation: selectedPatientRow.startDateTimeOperation,
            endDateTimeOperation: selectedPatientRow.endDateTimeOperation,
            surgeryIndication: selectedPatientRow.surgeryIndication,
            specimen: selectedPatientRow.specimen,
            preOperativeDiagnosis: selectedPatientRow.preOperativeDiagnosis,
            anesthesiologist: selectedPatientRow.anesthesiologist,
            operativeTechnique: selectedPatientRow.operativeTechnique,
            caseNo: selectedPatientRow.cASENO,
            // assistantSurgeon: asstSurRes,
            // visitingAssistantSurgeon: selectedPatientRow.visitingAssistantSurgeon,
            // visitingSurgeon: selectedPatientRow.visitingSurgeon,
            anesthesia: selectedPatientRow.anesthesia,
            // patientType: selectedPatientRow.patientType,
            postOpDiagnosis: selectedPatientRow.postOpDiagnosis,
            operations: selectedPatientRow.operations,
            scrubNurse: selectedPatientRow.scrubNurse,
            medications: selectedPatientRow.medications,
            circulatingNurse: selectedPatientRow.circulatingNurse,
            // spongeCountedBy: selectedPatientRow.spongeCountedBy,
            // notedBy: selectedPatientRow.notedBy,
            updatedBy: activeUser,
          },
          { caseNo: selectedPatientRow.cASENO },
          txn,
        );
      } else {
        const prefixs = "PROCE";
        const generatedCode = await sqlHelper.generateUniqueCode(
          "UERMMMC..OrbitOperatives",
          prefixs.toUpperCase(),
          2,
          txn,
        );

        const operativeLogs = {
          code: generatedCode,
          OperativeDiagnosis: selectedPatientRow.operativeDiagnosis,
          diagnosisProcedure: selectedPatientRow.diagnosisProcedure,
          procedureClassification: selectedPatientRow.procedureClassification,
          // surgeon: surgRes,
          // startDateTimeOperation: selectedPatientRow.startDateTimeOperation,
          endDateTimeOperation: selectedPatientRow.endDateTimeOperation,
          surgeryIndication: selectedPatientRow.surgeryIndication,
          specimen: selectedPatientRow.specimen,
          preOperativeDiagnosis: selectedPatientRow.preOperativeDiagnosis,
          anesthesiologist: selectedPatientRow.anesthesiologist,
          operativeTechnique: selectedPatientRow.operativeTechnique,
          caseNo: selectedPatientRow.cASENO,
          // assistantSurgeon: asstSurRes,
          // visitingAssistantSurgeon: selectedPatientRow.visitingAssistantSurgeon,
          // visitingSurgeon: selectedPatientRow.visitingSurgeon,
          anesthesia: selectedPatientRow.anesthesia,
          // patientType: selectedPatientRow.patientType,
          postOpDiagnosis: selectedPatientRow.postOpDiagnosis,
          operations: selectedPatientRow.operations,
          // scrubNurse: selectedPatientRow.scrubNurse,
          medications: selectedPatientRow.medications,
          // circulatingNurse: selectedPatientRow.circulatingNurse,
          // spongeCountedBy: selectedPatientRow.spongeCountedBy,
          // notedBy: selectedPatientRow.notedBy,
          createdBy: activeUser,
        };

        await orRecords.insertOperativeLogs(operativeLogs, txn);
      }

      if (spongeDatas.length > 0) {
        const forInsert = spongeDatas.filter((item) => item.isNew);
        const forUpdate = spongeDatas.filter((item) => !item.isNew);

        for (const task of forInsert) {
          const generatedSpongeCode = await sqlHelper.generateUniqueCode(
            "UERMMMC..OrbitOperatives",
            "SPO",
            4,
            txn,
          );

          const taskPayload = {
            code: generatedSpongeCode,
            caseNo: selectedPatientRow.cASENO,
            createdBy: activeUser,
            sponges: task.sponges,
            initialCount: task.initialCount,
            onTable: task.onTable,
            onFloor: task.onFloor,
          };

          await orRecords.insertOrbitSponges(taskPayload, txn);
        }

        for (const task of forUpdate) {
          await orRecords.updateSponges(
            {
              sponges: task.sponges,
              initialCount: task.initialCount,
              onTable: task.onTable,
              onFloor: task.onFloor,
              updatedBy: activeUser,
            },
            { code: task.code },
            txn,
          );
        }

        for (const forRemoving of removedSponges) {
          await orRecords.updateSponges(
            {
              active: false,
              updatedBy: activeUser,
            },
            { code: forRemoving.code },
            txn,
          );
        }
      }

      if (allToModify.length > 0) {
        const forInsert = allToModify.filter((item) => item.isNewSign);
        const forUpdate = allToModify.filter((item) => !item.isNewSign);

        for (const task of forInsert) {
          const generatedCode = await sqlHelper.generateUniqueCode(
            "UERMMMC..OrbitSignatories",
            "SIG",
            4,
            txn,
          );

          const payload = {
            code: generatedCode,
            // empCode: activeUser,
            caseNO: selectedPatientRow.cASENO,
            name: task.name,
            createdBy: activeUser,
            type: task.type,
            // signature: task.signature,
          };

          await orRecords.insertSignatories(payload, txn);
        }

        for (const task of forUpdate) {
          await orRecords.updateSignatories(
            {
              // empCode: activeUser,
              caseNO: selectedPatientRow.cASENO,

              name: task.name,
              // signature: task.signature,
              updatedBy: activeUser,
            },
            { code: task.code },
            txn,
          );
        }
      }

      if (ueAnnes.length > 0) {
        const forInsert = ueAnnes.filter((item) => item.isNewSign);
        //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
        for (const task of forInsert) {
          const generatedCode = await sqlHelper.generateUniqueCode(
            "UERMMMC..OrbitSignatories",
            "SIG",
            4,
            txn,
          );

          const payload = {
            code: generatedCode,
            empCode: task.empCode?.cODE ?? "", // get the actual employee code
            caseNO: selectedPatientRow.cASENO,
            name: task.empCode?.nAME ?? "", // fallback if name is empty
            createdBy: activeUser,
            type: task.type ?? "ueAnes",
          };
          await orRecords.insertSignatories(payload, txn);
        }
      }

      if (ueAssisSurgs.length > 0) {
        const forInsert = ueAssisSurgs.filter((item) => item.isNewSign);
        //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
        for (const task of forInsert) {
          const generatedCode = await sqlHelper.generateUniqueCode(
            "UERMMMC..OrbitSignatories",
            "SIG",
            4,
            txn,
          );

          const payload = {
            code: generatedCode,
            empCode: task.empCode?.cODE ?? "", // get the actual employee code
            caseNO: selectedPatientRow.cASENO,
            name: task.empCode?.nAME ?? "", // fallback if name is empty
            createdBy: activeUser,
            type: task.type ?? "ueAsstSurg",
            // type: task.empCode?.type ?? "",
          };
          await orRecords.insertSignatories(payload, txn);
        }
      }
      // if (cliNurses.length > 0) {
      //   const forInsert = cliNurses.filter((item) => item.isNewSign);
      //   //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
      //   for (const task of forInsert) {
      //     const generatedCode = await sqlHelper.generateUniqueCode(
      //       "UERMMMC..OrbitSignatories",
      //       "SIG",
      //       4,
      //       txn,
      //     );

      //     const payload = {
      //       code: generatedCode,
      //       empCode: task.empCode?.code ?? "", // get the actual employee code
      //       caseNO: selectedPatientRow.cASENO,
      //       name: task.empCode?.name ?? "", // fallback if name is empty
      //       createdBy: activeUser,
      //       type: task.type,
      //       // type: task.empCode?.type ?? "",
      //     };
      //     await orRecords.insertSignatories(payload, txn);
      //   }
      // }
      // if (circu.length > 0) {
      //   const forInsert = circu.filter((item) => item.isNewSign);
      //   //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
      //   for (const task of forInsert) {
      //     const generatedCode = await sqlHelper.generateUniqueCode(
      //       "UERMMMC..OrbitSignatories",
      //       "SIG",
      //       4,
      //       txn,
      //     );

      //     const payload = {
      //       code: generatedCode,
      //       empCode: task.empCode?.code ?? "", // get the actual employee code
      //       caseNO: selectedPatientRow.cASENO,
      //       name: task.empCode?.name ?? "", // fallback if name is empty
      //       createdBy: activeUser,
      //       type: task.type,
      //       // type: task.empCode?.type ?? "",
      //     };
      //     await orRecords.insertSignatories(payload, txn);
      //   }
      // }
      if (ueheadSurgs.length > 0) {
        const forInsert = ueheadSurgs.filter((item) => item.isNewSign);
        //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
        for (const task of forInsert) {
          const generatedCode = await sqlHelper.generateUniqueCode(
            "UERMMMC..OrbitSignatories",
            "SIG",
            4,
            txn,
          );

          const payload = {
            code: generatedCode,
            empCode: task.empCode?.cODE ?? "", // get the actual employee code
            caseNO: selectedPatientRow.cASENO,
            name: task.empCode?.nAME ?? "", // fallback if name is empty
            createdBy: activeUser,
            type: task.type ?? "ueSurg",
            // type: task.empCode?.type ?? "",
          };
          await orRecords.insertSignatories(payload, txn);
        }
      }

      // if (removedueAssisSurgs.length > 0) {
      //   for (const task of removedueAssisSurgs) {
      //     await orRecords.updateSignatories(
      //       {
      //         active: false,
      //         updatedBy: activeUser,
      //       },
      //       { code: task.code },
      //       txn,
      //     );
      //   }
      // }
      // if (removedHeadSurgs.length > 0) {
      //   for (const task of removedHeadSurgs) {
      //     await orRecords.updateSignatories(
      //       {
      //         active: false,
      //         updatedBy: activeUser,
      //       },
      //       { code: task.code },
      //       txn,
      //     );
      //   }
      // }
      // if (removesScrbNrs.length > 0) {
      //   for (const task of removesScrbNrs) {
      //     await orRecords.updateSignatories(
      //       {
      //         active: false,
      //         updatedBy: activeUser,
      //       },
      //       { code: task.code },
      //       txn,
      //     );
      //   }
      // }
      // if (removedUeAnnes.length > 0) {
      //   for (const task of removedUeAnnes) {
      //     await orRecords.updateSignatories(
      //       {
      //         active: false,
      //         updatedBy: activeUser,
      //       },
      //       { code: task.code },
      //       txn,
      //     );
      //   }
      // }

      if (allToInactive.length > 0) {
        for (const task of allToInactive) {
          await orRecords.updateSignatories(
            {
              active: false,
              updatedBy: activeUser,
            },
            { code: task.code },
            txn,
          );
        }
      }
      // if (removedueAssisSurgs.length > 0) {
      //   for (const task of removedueAssisSurgs) {
      //     await orRecords.updateSignatories(
      //       {
      //         active: false,
      //         updatedBy: activeUser,
      //       },
      //       { code: task.code },
      //       txn,
      //     );
      //   }
      // }

      return res
        .status(200)
        .json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return returnValue;
};
const putOpTechForms = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const {
      selectedPatientRow,
      newAddedOpTechProcedures,
      encounterCode,
      // datePartss,
      // newVisitingPrimarySurg
      //Assistant surgeon
      newVisitinSurg,
      removedVisiSurg,
      newSTeam, //ue assistant dropdown
      //Anesthesiologist
      newAnessThe,
      removeUeAnesthe,
      newVisiAnest,
      removedVisiAness,
      //primary surgeon
      newSurgicalTeams, //p surgeon dropdown
      ueSurgeonForRemoved,
      ueAssistPSurgRemoved,
      newVisitingPrimarySurg,
      removePrimaryVisiting,

      //Resident
      newResidents,
      removedResidentsPayload,
      removedAssistantResidentsPayload,
      removedAnesthesiologistResidentsPayload,
      newAssistantResidents,
      newAnesthResidents,
      // totalProcedure,
      //SPONGES
      // removedSpongesData,
    } = req.body;

    try {
      const activeUser = util.currentUserToken(req).code;
      const deptCodeofUser = util.currentUserToken(req).deptCode;

      const newStore = [newAddedOpTechProcedures];

      if (newStore.length > 0) {
        const forInsert = newStore.filter((item) => item.isNew);
        const forUpdate = newStore.filter((item) => !item.isNew);
        // ************************** INSERTION ONLY ********************
        if (forInsert.length > 0) {
          const prefixs = "PROCE";
          const procedureGeneratedCode = await sqlHelper.generateUniqueCode(
            "UERMMMC..OrbitOperatives",
            prefixs.toUpperCase(),
            2,
            txn,
          );
          for (const newProcedure of forInsert) {
            // const periodTime = `${datePartss} ${newProcedure.timePart}`;
            // const endPeriodTime = `${newProcedure.endDatePart} ${newProcedure.endedTimePart}`;

            const operativeLogs = {
              code: procedureGeneratedCode,
              procedureClassification: newProcedure.procedureClassification,
              EncounterCode: encounterCode,
              preOperativeDiagnosis: newProcedure.preOperativeDiagnosis,
              postOpDiagnosis: newProcedure.postOpDiagnosis,
              diagnosisProcedure: newProcedure.diagnosisProcedure,
              OperativeDiagnosis: newProcedure.operativeDiagnosis,
              anesthesia: newProcedure.anesthesia,
              // startDateTimeOperation: periodTime,
              // endDateTimeOperation: endPeriodTime,
              surgeryIndication: newProcedure.surgeryIndication,
              specimen: newProcedure.specimen,
              opTechForm: true,
              operativeTechnique: newProcedure.operativeTechnique,
              //         surgeryIndication: selectedPatientRow.surgeryIndication,
              department: deptCodeofUser,
              // anesthesiologist: selectedPatientRow.anesthesiologist,
              // operativeTechnique: selectedPatientRow.operativeTechnique,
              caseNo: selectedPatientRow.cASENO,

              createdBy: activeUser,
            };

            await orRecords.insertOperativeLogs(operativeLogs, txn);
          }

          if (newSurgicalTeams.length > 0) {
            for (const newSign of newSurgicalTeams) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                empCode: newSign.empCode?.cODE ?? "",
                caseNO: selectedPatientRow.cASENO,
                name: newSign.empCode?.nAME ?? "",
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }
          if (newResidents.length > 0) {
            for (const newSign of newResidents) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                empCode: newSign.empCode?.code ?? "",
                caseNO: selectedPatientRow.cASENO,
                name: newSign.empCode?.name ?? "",
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }
          if (newAssistantResidents.length > 0) {
            for (const newSign of newAssistantResidents) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                empCode: newSign.empCode?.code ?? "",
                caseNO: selectedPatientRow.cASENO,
                name: newSign.empCode?.name ?? "",
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }
          if (newAnesthResidents.length > 0) {
            for (const newSign of newAnesthResidents) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                empCode: newSign.empCode?.code ?? "",
                caseNO: selectedPatientRow.cASENO,
                name: newSign.empCode?.name ?? "",
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }

          if (newVisitingPrimarySurg.length > 0) {
            for (const newSign of newVisitingPrimarySurg) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                caseNO: selectedPatientRow.cASENO,
                name: newSign.name,
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }

          if (newVisiAnest.length > 0) {
            for (const newSign of newVisiAnest) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                caseNO: selectedPatientRow.cASENO,
                name: newSign.name,
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }
          if (newSTeam.length > 0) {
            for (const newSign of newSTeam) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                empCode: newSign.empCode?.cODE ?? "",
                caseNO: selectedPatientRow.cASENO,
                name: newSign.empCode?.nAME ?? "",
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }

          if (newAnessThe.length > 0) {
            for (const newSign of newAnessThe) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                empCode: newSign.empCode?.cODE ?? "",
                caseNO: selectedPatientRow.cASENO,
                name: newSign.empCode?.nAME ?? "",
                createdBy: activeUser,
                type: newSign.type,
              };
              await orRecords.insertSignatories(payload, txn);
            }
          }
          if (newVisitinSurg.length > 0) {
            for (const newSign of newVisitinSurg) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                procedureCode: procedureGeneratedCode,
                code: generatedCode,
                caseNO: selectedPatientRow.cASENO,
                name: newSign.name,
                createdBy: activeUser,
                type: newSign.type,
              };

              await orRecords.insertSignatories(payload, txn);
            }
          }
        }
        // ************************** UPDATING ONLY ********************
        if (forUpdate.length > 0) {
          for (const updateProcedure of forUpdate) {
            // const periodTime = `${datePartss} ${updateProcedure.timePart}`;
            // const endPeriodTime = `${updateProcedure.endDatePart} ${updateProcedure.endedTimePart}`;
            await orRecords.updatePatientInfo(
              {
                procedureClassification:
                  updateProcedure.procedureClassification,
                preOperativeDiagnosis: updateProcedure.preOperativeDiagnosis,
                diagnosisProcedure: updateProcedure.diagnosisProcedure,
                OperativeDiagnosis: updateProcedure.operativeDiagnosis,
                postOpDiagnosis: updateProcedure.postOpDiagnosis,
                anesthesia: updateProcedure.anesthesia,
                surgeryIndication: updateProcedure.surgeryIndication,
                specimen: updateProcedure.specimen,
                // startDateTimeOperation: periodTime,
                // endDateTimeOperation: endPeriodTime,
                operativeTechnique: updateProcedure.operativeTechnique,
                opTechForm: true,
                // anesthesiologist: selectedPatientRow.anesthesiologist,
                // operativeTechnique: selectedPatientRow.operativeTechnique,
                // caseNo: selectedPatientRow.cASENO,
                updatedBy: activeUser,
                OpTechDateUpdated: util.currentDateTime(),
              },
              {
                caseNo: updateProcedure.cASENO,
                EncounterCode: updateProcedure.encounterCode,
                code: updateProcedure.code,
              },
              txn,
            );
          }

          if (newSurgicalTeams.length > 0) {
            const resultsSurg = newSurgicalTeams.filter(
              (team) =>
                forUpdate.some((proc) => proc.code === team.procedureCode) &&
                team.isNewSign,
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  empCode: newSign.empCode?.cODE ?? "",
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.empCode?.nAME ?? "",
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }

          if (newResidents.length > 0) {
            const resultsSurg = newResidents.filter(
              (team) =>
                forUpdate.some((proc) => proc.code === team.procedureCode) &&
                team.isNewSign,
            );
            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  empCode: newSign.empCode?.code ?? "",
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.empCode?.name ?? "",
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }
          if (newAnesthResidents.length > 0) {
            const resultsSurg = newAnesthResidents.filter(
              (team) =>
                forUpdate.some((proc) => proc.code === team.procedureCode) &&
                team.isNewSign,
            );
            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  empCode: newSign.empCode?.code ?? "",
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.empCode?.name ?? "",
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }
          if (newAssistantResidents.length > 0) {
            const resultsSurg = newAssistantResidents.filter(
              (team) =>
                forUpdate.some((proc) => proc.code === team.procedureCode) &&
                team.isNewSign,
            );
            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  empCode: newSign.empCode?.code ?? "",
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.empCode?.name ?? "",
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }
          if (newVisitingPrimarySurg.length > 0) {
            const resultsSurg = newVisitingPrimarySurg.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );
            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.name,
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }
          if (newVisitinSurg.length > 0) {
            const resultsSurg = newVisitinSurg.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.name,
                  createdBy: activeUser,
                  type: newSign.type,
                };
                await orRecords.insertSignatories(payload, txn);
              }
            }
          }
          if (newVisiAnest.length > 0) {
            const forInsert = newVisiAnest.filter((item) => item.isNewSign);

            const resultsSurg = forInsert.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );
            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.name,
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }
          if (newSTeam.length > 0) {
            const resultsSurg = newSTeam.filter(
              (team) =>
                forUpdate.some((proc) => proc.code === team.procedureCode) &&
                team.isNewSign,
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  empCode: newSign.empCode?.cODE ?? "",
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.empCode?.nAME ?? "",
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }
          if (newAnessThe.length > 0) {
            const resultsSurg = newAnessThe.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                const generatedCode = await sqlHelper.generateUniqueCode(
                  "UERMMMC..OrbitSignatories",
                  "SIG",
                  4,
                  txn,
                );

                const payload = {
                  procedureCode: newSign.procedureCode,
                  code: generatedCode,
                  empCode: newSign.empCode?.cODE ?? "",
                  caseNO: selectedPatientRow.cASENO,
                  name: newSign.empCode?.nAME ?? "",
                  createdBy: activeUser,
                  type: newSign.type,
                };

                await orRecords.insertSignatories(payload, txn);
              }
            }
          }

          if (ueSurgeonForRemoved.length > 0) {
            const resultsSurg = ueSurgeonForRemoved.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }
          if (removedVisiSurg.length > 0) {
            const resultsSurg = removedVisiSurg.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }
          if (removedVisiAness.length > 0) {
            const resultsSurg = removedVisiAness.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }
          if (removedResidentsPayload.length > 0) {
            const resultsSurg = removedResidentsPayload.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }

          if (removedAssistantResidentsPayload.length > 0) {
            const resultsSurg = removedAssistantResidentsPayload.filter(
              (team) =>
                forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }
          if (removedAnesthesiologistResidentsPayload.length > 0) {
            const resultsSurg = removedAnesthesiologistResidentsPayload.filter(
              (team) =>
                forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }
          if (removeUeAnesthe.length > 0) {
            const resultsSurg = removeUeAnesthe.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }
          if (removePrimaryVisiting.length > 0) {
            const resultsSurg = removePrimaryVisiting.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }

          if (ueAssistPSurgRemoved.length > 0) {
            const resultsSurg = ueAssistPSurgRemoved.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );

            if (resultsSurg.length > 0) {
              for (const newSign of resultsSurg) {
                await orRecords.updateSignatories(
                  {
                    active: false,
                    updatedBy: activeUser,
                  },
                  {
                    code: newSign.code,
                  },
                  txn,
                );
              }
            }
          }
        }
      }

      return res
        .status(200)
        .json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return returnValue;
};
const putOpRecForms = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const {
      selectedPatientRow,
      newAddedSponges,
      newAddedOpTechProcedures,
      encounterCode,
      datePartss,
      // spongeDatas,
      removedSpongesData,
      // removedSponges,
      cliNurses,
      circu,
      removesScrbNrs,
      removeCircuNrs,
    } = req.body;
    const allToModify = [...circu, ...cliNurses];
    const allToInactive = [...removesScrbNrs, ...removeCircuNrs];

    try {
      const activeUser = util.currentUserToken(req).code;
      const deptCodeofUser = util.currentUserToken(req).deptCode;

      // clean vers
      const newStore = [newAddedOpTechProcedures];
      if (newStore.length > 0) {
        const forInsert = newStore.filter((item) => item.isNew);
        const forUpdate = newStore.filter((item) => !item.isNew);

        const prefixs = "PROCE";
        const procedureGeneratedCode = await sqlHelper.generateUniqueCode(
          "UERMMMC..OrbitOperatives",
          prefixs.toUpperCase(),
          2,
          txn,
        );
        if (forInsert.length > 0) {
          for (const newProcedure of forInsert) {
            const periodTime = `${datePartss} ${newProcedure.timePart}`;
            const endPeriodTime = `${newProcedure.endDatePart} ${newProcedure.endedTimePart}`;
            const operativeLogs = {
              code: procedureGeneratedCode,
              EncounterCode: encounterCode,
              opRecForm: true,
              caseNo: selectedPatientRow.cASENO,
              createdBy: activeUser,
              startDateTimeOperation: periodTime,
              endDateTimeOperation: endPeriodTime,
              // postOpDiagnosis: newProcedure.postOpDiagnosis,
              operations: newProcedure.operations,
              remarks: newProcedure.remarks,
              medications: newProcedure.medications,
              department: deptCodeofUser,
              OprecCreatedBy: activeUser,
              OprecDateCreated: util.currentDateTime(),
            };

            await orRecords.insertOperativeLogs(operativeLogs, txn);
          }
          if (newAddedSponges.length > 0) {
            for (const task of newAddedSponges) {
              const generatedSpongeCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSponges",
                "SPO",
                4,
                txn,
              );

              const taskPayload = {
                code: generatedSpongeCode,
                procedureCode: procedureGeneratedCode,
                caseNo: selectedPatientRow.cASENO,
                createdBy: activeUser,
                sponges: task.sponges,
                initialCount: task.initialCount,
                onTable: task.onTable,
                onFloor: task.onFloor,
              };
              await orRecords.insertOrbitSponges(taskPayload, txn);
            }
          }
          if (allToModify.length > 0) {
            const forInsert = allToModify.filter((item) => item.isNewSign);
            // const forUpdate = allToModify.filter((item) => !item.isNewSign);

            for (const task of forInsert) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                code: generatedCode,
                empCode: task.empCode?.code ?? "",
                procedureCode: procedureGeneratedCode,
                caseNO: selectedPatientRow.cASENO,
                name: task.empCode?.name ?? "",
                createdBy: activeUser,
                type: task.type,
                // signature: task.signature,
              };

              await orRecords.insertSignatories(payload, txn);
            }

            // for (const task of forUpdate) {
            //   await orRecords.updateSignatories(
            //     {
            //       active: false,
            //       updatedBy: activeUser,
            //     },
            //     { code: task.code },
            //     txn,
            //   );
            // }
          }
        }

        if (forUpdate.length > 0) {
          for (const task of forUpdate) {
            const periodTime = `${datePartss} ${task.timePart}`;
            const endPeriodTime = `${task.endDatePart} ${task.endedTimePart}`;

            await orRecords.updatePatientInfo(
              {
                // postOpDiagnosis: task.postOpDiagnosis,
                operations: task.operations,
                medications: task.medications,
                remarks: task.remarks,
                // updatedBy: activeUser,
                opRecForm: true,
                startDateTimeOperation: periodTime,
                endDateTimeOperation: endPeriodTime,
                OprecUpdatedBy: activeUser,
                OprecDateUpdated: util.currentDateTime(),
              },
              { code: task.code },
              txn,
            );
          }

          // LOGS INSERT START
          //         if (Object.keys(modifiedData).length) {
          //   const groupInsertCode = await sqlHelper.generateUniqueCode(
          //     "UERMMMC..OrbitOperativeLogs",
          //     "GIC",
          //     4,
          //     txn,
          //   );

          // for (const fieldName in modifiedData) {
          //   const generatedCode = await sqlHelper.generateUniqueCode(
          //     "UERMMMC..OrbitOperativeLogs",
          //     "LOG",
          //     4,
          //     txn,
          //   );
          //   const change = modifiedData[fieldName]; // { old: '...', new: '...' }

          //   const payload = {
          //     code: generatedCode,
          //     caseNO: selectedPatientRow.cASENO,
          //     fieldName: fieldName, // e.g. 'operativeDiagnosis'
          //     // new value
          //     colValue: change.old, // optional, if needed
          //     createdBy: activeUser,
          //     groupCode: groupInsertCode,
          //     operativeType: formTypes,
          //   };

          //   await orRecords.insertOperativeUpdatesLogs(payload, txn);
          // }
          // }
          // LONGS INSERT END
          if (newAddedSponges.length > 0) {
            const resSponges = newAddedSponges.filter((team) =>
              forUpdate.some((proc) => proc.code === team.procedureCode),
            );
            for (const task of resSponges) {
              const generatedSpongeCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSponges",
                "SPO",
                4,
                txn,
              );

              const taskPayload = {
                code: generatedSpongeCode,
                procedureCode: task.procedureCode,
                caseNo: selectedPatientRow.cASENO,
                createdBy: activeUser,
                sponges: task.sponges,
                initialCount: task.initialCount,
                onTable: task.onTable,
                onFloor: task.onFloor,
              };
              await orRecords.insertOrbitSponges(taskPayload, txn);
            }
          }

          if (removedSpongesData.length > 0) {
            // const forInsert = removedSpongesData.filter((item) => item.isNew);
            // const forUpdate = removedSpongesData.filter((item) => !item.isNew);

            // for (const task of forInsert) {
            //   const generatedSpongeCode = await sqlHelper.generateUniqueCode(
            //     "UERMMMC..OrbitOperatives",
            //     "SPO",
            //     4,
            //     txn,
            //   );

            //   const taskPayload = {
            //     code: generatedSpongeCode,
            //     caseNo: selectedPatientRow.cASENO,
            //     createdBy: activeUser,
            //     sponges: task.sponges,
            //     initialCount: task.initialCount,
            //     onTable: task.onTable,
            //     onFloor: task.onFloor,
            //   };

            //   await orRecords.insertOrbitSponges(taskPayload, txn);
            // }

            // for (const task of forUpdate) {
            //   await orRecords.updateSponges(
            //     {
            //       sponges: task.sponges,
            //       initialCount: task.initialCount,
            //       onTable: task.onTable,
            //       onFloor: task.onFloor,
            //       updatedBy: activeUser,
            //     },
            //     { code: task.code },
            //     txn,
            //   );
            // }

            for (const forRemoving of removedSpongesData) {
              await orRecords.updateSponges(
                {
                  active: false,
                  updatedBy: activeUser,
                },
                { code: forRemoving.code },
                txn,
              );
            }
          }

          if (allToModify.length > 0) {
            const forInsert = allToModify.filter((item) => item.isNewSign);
            // const forUpdate = allToModify.filter((item) => !item.isNewSign);

            for (const task of forInsert) {
              const generatedCode = await sqlHelper.generateUniqueCode(
                "UERMMMC..OrbitSignatories",
                "SIG",
                4,
                txn,
              );

              const payload = {
                code: generatedCode,
                empCode: task.empCode?.code ?? "",
                procedureCode: task.procedureCode,
                caseNO: selectedPatientRow.cASENO,
                name: task.empCode?.name ?? "",
                createdBy: activeUser,
                type: task.type,
                // signature: task.signature,
              };

              await orRecords.insertSignatories(payload, txn);
            }

            // for (const task of forUpdate) {
            //   await orRecords.updateSignatories(
            //     {
            //       active: false,
            //       updatedBy: activeUser,
            //     },
            //     { code: task.code },
            //     txn,
            //   );
            // }
          }
          if (allToInactive.length > 0) {
            for (const task of allToInactive) {
              await orRecords.updateSignatories(
                {
                  active: false,
                  updatedBy: activeUser,
                },
                { code: task.code },
                txn,
              );
            }
          }
        }
      }

      return res
        .status(200)
        .json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return returnValue;
};

const toInactiveProcedure = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { selectedProcedureToRemove } = req.body;

    try {
      const activeUser = util.currentUserToken(req).code;

      if (selectedProcedureToRemove.length > 0) {
        for (const updateProcedure of selectedProcedureToRemove) {
          await orRecords.updatePatientInfo(
            {
              active: false,
              updatedBy: activeUser,
            },
            {
              code: updateProcedure.code,
            },
            txn,
          );
        }
      }

      return res
        .status(200)
        .json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return returnValue;
};

// const registerNewProcedure = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     const { selectedRowCase, diagnosisDetails } = req.body;

//     try {
//       const activeUser = util.currentUserToken(req).code;
//       const deptCodeofUser = util.currentUserToken(req).deptCode;

//       const prefixs = "PROCE";
//       const procedureGeneratedCode = await sqlHelper.generateUniqueCode(
//         "UERMMMC..OrbitOperatives",
//         prefixs.toUpperCase(),
//         2,
//         txn,
//       );

//       const operativeLogs = {
//         code: procedureGeneratedCode,
//         procedureClassification: diagnosisDetails.procedureClassification,
//         EncounterCode: selectedRowCase.encounterCode,
//         preOperativeDiagnosis: diagnosisDetails.preOperativeDiagnosis,
//         postOpDiagnosis: diagnosisDetails.postOpDiagnosis,
//         diagnosisProcedure: diagnosisDetails.diagnosisProcedure,
//         OperativeDiagnosis: diagnosisDetails.operativeDiagnosis,
//         anesthesia: diagnosisDetails.anesthesia,
//         surgeryIndication: diagnosisDetails.surgeryIndication,
//         specimen: diagnosisDetails.specimen,
//         opTechForm: true,
//         operativeTechnique: diagnosisDetails.operativeTechnique,
//         department: deptCodeofUser,
//         caseNo: selectedRowCase.cASENO,

//         createdBy: activeUser,
//       };

//       // await orRecords.insertOperativeLogs(operativeLogs, txn);

//       // console.log("operativeLogs", operativeLogs);
//       const consultants = diagnosisDetails.ueConsultantPrimary;
//       if (consultants.length > 0) {
//         for (const primaryConsults of consultants) {
//           const generatedCode = await sqlHelper.generateUniqueCode(
//             "UERMMMC..OrbitSignatories",
//             "SIG",
//             4,
//             txn,
//           );
//           const consType = "ueSurg";
//           const payload = {
//             code: generatedCode,
//             empCode: primaryConsults.cODE ?? "",
//             procedureCode: procedureGeneratedCode,
//             caseNO: selectedRowCase.cASENO,
//             name: primaryConsults.nAME ?? "",
//             createdBy: activeUser,
//             type: consType,
//           };
//           // console.log("payload", payload);
//           // await orRecords.insertSignatories(payload, txn);
//         }
//       }

//       return res
//         .status(200)
//         .json({ success: true, message: "Update successful." });
//     } catch (error) {
//       return res.status(500).json({ error: error.message });
//     }
//   });

//   return returnValue;
// };

module.exports = {
  getPatientDetails,
  getTestPdets,
  getCasesForOperatives,
  getSurgeons,
  getFirstOREntry,
  getAnesthesiology,
  modifyPatientDetails,

  getSponges,
  getOrbitVisitingSurgeons,
  getOrbitResidents,
  getOrbitUeHeadsSurgeon,
  getOrbitUeAssistantSurgeon,
  getAllSurgs,
  getOrbitSignatories,
  getUeAnes,
  getWithOperativeOnly,
  getPrintLogs,
  insertPrintAttempt,
  getVisitingAnes,
  getResidents,
  getNurses,
  getSurgeonsSelection,
  getAttendingNurse,
  getCirculatingNurse,
  getEncounterdetails,
  getProcedures,
  getProceduresPerDepartment,

  toInactiveProcedure,
  getNoDuplicatesActiveProcedure,
  getActivePrimarySurgs,
  getActiveAssistSurgs,
  getEncounterDashboard,
  getDischargeWithProcedures,
  getOrbitAssistantResidents,
  getOrbitAnesthesiologistResidents,
  //updating
  putOpTechForms,
  putOpRecForms,

  //fetching from ehr
  getActiveEhrCases,

  //analytics
  getAnalytics,

  //register
  // registerNewProcedure,
};

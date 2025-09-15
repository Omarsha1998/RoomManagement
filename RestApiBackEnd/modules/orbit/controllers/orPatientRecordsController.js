const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //

const orRecords = require("../models/orRecords.js");
// const { schedule } = require("../../infirmary/controllers/ape/visit.js");
// MODELS //
const insertPrintAttempt = async function (req, res) {
  try {
    if (util.empty(req.body)) {
      return res.status(400).json({ error: "`body` is required." });
    }

    const { selectedPatientRow } = req.body;

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
        printCode: generatedCode,
        createdBy: activeUser,
        caseNo: selectedPatientRow.cASENO,
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
      const sqlWhere = "and cases.DATEDIS is null";
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
      const sqlWhere = "and cases.DATEDIS is null";
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
      const sqlWhere = `and cases.CASENO = ? `;
      const args = [selectedPatientRow];
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
      const sqlWhere = "and cases.DATEDIS  is null";
      const args = [];
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
      const sqlWhere = `and caseNo = ?`;
      const args = [selectedPatientRow];
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
const getPrintLogs = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and CaseNo = ?`;
      const args = [selectedPatientRow];
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
        order: "",
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
      const deptCodes = ["7060", "1180", "1024"];
      const sqlWhere = `and dept_code in (?)`;
      const args = [deptCodes];

      const options = {
        top: "",
        order: "",
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

const getSponges = async function (req, res) {
  try {
    const result = await sqlHelper.transact(async (txn) => {
      const { selectedPatientRow } = req.query;
      const sqlWhere = `and caseNo = ?`;
      const args = [selectedPatientRow];
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
      const args = [selectedPatientRow, 1, "visiResidents"];
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
      // console.log("circu", circu);
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
            spongesCode: generatedSpongeCode,
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
            { spongesCode: task.spongesCode },
            txn,
          );
        }

        for (const forRemoving of removedSponges) {
          await orRecords.updateSponges(
            {
              active: false,
              updatedBy: activeUser,
            },
            { spongesCode: forRemoving.spongesCode },
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
      datePartss,
      // ueheadSurgs,
      // removedHeadSurgs,
      // removeVisitingHeadSurgeon,
      // visitingSS,
      // signatorys,
      // removedVisitingAsst,
      // ueAssisSurgs,
      // removedueAssisSurgs,
      // removedUeAnnes,
      // ueAnnes,
      // newResident,
      // removeResi,

      // newVisitingAnesthesia,
      // removeVisiAnesthesia,

      // dateParts,
      // hourParts,
      // minuteParts,
      // periodParts,
      // endDateParts,
      // endHourParts,
      // endMinuteParts,
      // endPeriodParts,
    } = req.body;

    // const periodTime = `${dateParts} ${hourParts}:${minuteParts} ${periodParts}`;
    // const endPeriodTime = `${endDateParts} ${endHourParts}:${endMinuteParts} ${endPeriodParts}`;
    // const allToModify = [
    //   ...visitingSS,
    //   ...signatorys,

    //   ...newResident,
    //   ...newVisitingAnesthesia,

    // ];
    // const allToInactive = [
    //   ...removeVisitingHeadSurgeon,
    //   ...removedHeadSurgs,
    //   ...removedVisitingAsst,
    //   ...removedueAssisSurgs,
    //   ...removeResi,
    //   ...removeVisiAnesthesia,

    //   ...removedUeAnnes,
    // ];

    try {
      const activeUser = util.currentUserToken(req).code;

      // const withOrProcedure = await orRecords.selectOrbitOperativesTbl(
      //   `and caseNo = ? and encounterCode = ? and code =?`,
      //   [selectedPatientRow.cASENO, encounterCode, selectedPatientRow.code],
      //   {},
      //   txn,
      // );

      // if (withOrProcedure.length > 0) {
      //   await orRecords.updatePatientInfo(
      //     {
      //       procedureClassification:
      //         newAddedOpTechProcedures.procedureClassification,
      //       preOperativeDiagnosis:
      //         newAddedOpTechProcedures.preOperativeDiagnosis,
      //       diagnosisProcedure: newAddedOpTechProcedures.diagnosisProcedure,
      //       OperativeDiagnosis: newAddedOpTechProcedures.operativeDiagnosis,
      //       anesthesia: newAddedOpTechProcedures.anesthesia,

      //       surgeryIndication: newAddedOpTechProcedures.surgeryIndication,
      //       specimen: newAddedOpTechProcedures.specimen,

      //       // startDateTimeOperation: periodTime,
      //       // endDateTimeOperation: endPeriodTime,

      //       // anesthesiologist: selectedPatientRow.anesthesiologist,
      //       // operativeTechnique: selectedPatientRow.operativeTechnique,
      //       caseNo: selectedPatientRow.cASENO,

      //       updatedBy: activeUser,
      //     },
      //     { caseNo: selectedPatientRow.cASENO },
      //     txn,
      //   );
      // } else {
      //   const prefixs = "PROCE";
      //   const generatedCode = await sqlHelper.generateUniqueCode(
      //     "UERMMMC..OrbitOperatives",
      //     prefixs.toUpperCase(),
      //     2,
      //     txn,
      //   );

      //   const operativeLogs = {
      //     code: generatedCode,
      //     procedureClassification:
      //       newAddedOpTechProcedures.procedureClassification,
      //     EncounterCode: encounterCode,
      //     preOperativeDiagnosis: newAddedOpTechProcedures.preOperativeDiagnosis,
      //     diagnosisProcedure: newAddedOpTechProcedures.diagnosisProcedure,
      //     OperativeDiagnosis: newAddedOpTechProcedures.operativeDiagnosis,
      //     anesthesia: newAddedOpTechProcedures.anesthesia,

      //     surgeryIndication: newAddedOpTechProcedures.surgeryIndication,
      //     specimen: newAddedOpTechProcedures.specimen,
      //     opTechForm: true,
      //     //  endDateTimeOperation: selectedPatientRow.endDateTimeOperation,
      //     //         surgeryIndication: selectedPatientRow.surgeryIndication,

      //     // anesthesiologist: selectedPatientRow.anesthesiologist,
      //     // operativeTechnique: selectedPatientRow.operativeTechnique,
      //     caseNo: selectedPatientRow.cASENO,

      //     createdBy: activeUser,
      //   };

      //   await orRecords.insertOperativeLogs(operativeLogs, txn);
      // }

      const newStore = [newAddedOpTechProcedures];

      if (newStore.length > 0) {
        const forInsert = newStore.filter((item) => item.isNew);
        const forUpdate = newStore.filter((item) => !item.isNew);

        for (const newProcedure of forInsert) {
          const prefixs = "PROCE";
          const generatedCode = await sqlHelper.generateUniqueCode(
            "UERMMMC..OrbitOperatives",
            prefixs.toUpperCase(),
            2,
            txn,
          );

          const periodTime = `${datePartss} ${newProcedure.hourPart}:${newProcedure.minutePart} ${newProcedure.periodPart}`;
          const endPeriodTime = `${newProcedure.endDateParts} ${newProcedure.endHourParts}:${newProcedure.endMinuteParts} ${newProcedure.endPeriodParts}`;

          const operativeLogs = {
            code: generatedCode,
            procedureClassification: newProcedure.procedureClassification,
            EncounterCode: encounterCode,
            preOperativeDiagnosis: newProcedure.preOperativeDiagnosis,
            diagnosisProcedure: newProcedure.diagnosisProcedure,
            OperativeDiagnosis: newProcedure.operativeDiagnosis,
            anesthesia: newProcedure.anesthesia,
            startDateTimeOperation: periodTime,
            surgeryIndication: newProcedure.surgeryIndication,
            specimen: newProcedure.specimen,
            opTechForm: true,
            endDateTimeOperation: endPeriodTime,
            //         surgeryIndication: selectedPatientRow.surgeryIndication,

            // anesthesiologist: selectedPatientRow.anesthesiologist,
            // operativeTechnique: selectedPatientRow.operativeTechnique,
            caseNo: selectedPatientRow.cASENO,

            createdBy: activeUser,
          };

          await orRecords.insertOperativeLogs(operativeLogs, txn);
        }
        const forUpsOnly = [forUpdate];
        for (const updateProcedure of forUpsOnly) {
          const periodTime = `${datePartss} ${updateProcedure.hourPart}:${updateProcedure.minutePart} ${updateProcedure.periodPart}`;
          const endPeriodTime = `${updateProcedure.endDateParts} ${updateProcedure.endHourParts}:${updateProcedure.endMinuteParts} ${updateProcedure.endPeriodParts}`;

          await orRecords.updatePatientInfo(
            {
              procedureClassification: updateProcedure.procedureClassification,
              preOperativeDiagnosis: updateProcedure.preOperativeDiagnosis,
              diagnosisProcedure: updateProcedure.diagnosisProcedure,
              OperativeDiagnosis: updateProcedure.operativeDiagnosis,
              anesthesia: updateProcedure.anesthesia,

              surgeryIndication: updateProcedure.surgeryIndication,
              specimen: updateProcedure.specimen,

              startDateTimeOperation: periodTime,
              endDateTimeOperation: endPeriodTime,

              // anesthesiologist: selectedPatientRow.anesthesiologist,
              // operativeTechnique: selectedPatientRow.operativeTechnique,
              caseNo: selectedPatientRow.cASENO,

              updatedBy: activeUser,
            },
            {
              caseNo: selectedPatientRow.cASENO,
              EncounterCode: encounterCode,
              code: updateProcedure.code,
            },
            txn,
          );
        }
      }

      // if (allToModify.length > 0) {
      //   const forInsert = allToModify.filter((item) => item.isNewSign);
      //   const forUpdate = allToModify.filter((item) => !item.isNewSign);

      //   for (const task of forInsert) {
      //     const generatedCode = await sqlHelper.generateUniqueCode(
      //       "UERMMMC..OrbitSignatories",
      //       "SIG",
      //       4,
      //       txn,
      //     );

      //     const payload = {
      //       code: generatedCode,
      //       // empCode: activeUser,
      //       caseNO: selectedPatientRow.cASENO,
      //       name: task.name,
      //       createdBy: activeUser,
      //       type: task.type,
      //       // signature: task.signature,
      //     };

      //     await orRecords.insertSignatories(payload, txn);
      //   }

      //   for (const task of forUpdate) {
      //     await orRecords.updateSignatories(
      //       {
      //         // empCode: activeUser,
      //         caseNO: selectedPatientRow.cASENO,

      //         name: task.name,
      //         // signature: task.signature,
      //         updatedBy: activeUser,
      //       },
      //       { code: task.code },
      //       txn,
      //     );
      //   }
      // }

      // if (ueAssisSurgs.length > 0) {
      //   const forInsert = ueAssisSurgs.filter((item) => item.isNewSign);
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
      //       empCode: task.empCode?.cODE ?? "", // get the actual employee code
      //       caseNO: selectedPatientRow.cASENO,
      //       name: task.empCode?.nAME ?? "", // fallback if name is empty
      //       createdBy: activeUser,
      //       type: task.type ?? "ueAsstSurg",
      //       // type: task.empCode?.type ?? "",
      //     };
      //     await orRecords.insertSignatories(payload, txn);
      //   }
      // }

      // if (ueheadSurgs.length > 0) {
      //   const forInsert = ueheadSurgs.filter((item) => item.isNewSign);
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
      //       empCode: task.empCode?.cODE ?? "", // get the actual employee code
      //       caseNO: selectedPatientRow.cASENO,
      //       name: task.empCode?.nAME ?? "", // fallback if name is empty
      //       createdBy: activeUser,
      //       type: task.type ?? "ueSurg",
      //       // type: task.empCode?.type ?? "",
      //     };
      //     await orRecords.insertSignatories(payload, txn);
      //   }
      // }

      // if (allToInactive.length > 0) {
      //   for (const task of allToInactive) {
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
      // if (ueAnnes.length > 0) {
      //   const forInsert = ueAnnes.filter((item) => item.isNewSign);
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
      //       empCode: task.empCode?.cODE ?? "", // get the actual employee code
      //       caseNO: selectedPatientRow.cASENO,
      //       name: task.empCode?.nAME ?? "", // fallback if name is empty
      //       createdBy: activeUser,
      //       type: task.type ?? "ueAnes",
      //     };
      //     await orRecords.insertSignatories(payload, txn);
      //   }

      return res
        .status(200)
        .json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return returnValue;
};
// const putOpTechForms = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     const {
//       selectedPatientRow,
//       newAddedOpTechProcedures,
//       encounterCode,
//       // ueheadSurgs,
//       // removedHeadSurgs,
//       // removeVisitingHeadSurgeon,
//       // visitingSS,
//       // signatorys,
//       // removedVisitingAsst,
//       // ueAssisSurgs,
//       // removedueAssisSurgs,
//       // removedUeAnnes,
//       // ueAnnes,
//       // newResident,
//       // removeResi,

//       // newVisitingAnesthesia,
//       // removeVisiAnesthesia,

//       // dateParts,
//       // hourParts,
//       // minuteParts,
//       // periodParts,
//       // endDateParts,
//       // endHourParts,
//       // endMinuteParts,
//       // endPeriodParts,
//     } = req.body;

//     // const periodTime = `${dateParts} ${hourParts}:${minuteParts} ${periodParts}`;
//     // const endPeriodTime = `${endDateParts} ${endHourParts}:${endMinuteParts} ${endPeriodParts}`;
//     // const allToModify = [
//     //   ...visitingSS,
//     //   ...signatorys,

//     //   ...newResident,
//     //   ...newVisitingAnesthesia,

//     // ];
//     // const allToInactive = [
//     //   ...removeVisitingHeadSurgeon,
//     //   ...removedHeadSurgs,
//     //   ...removedVisitingAsst,
//     //   ...removedueAssisSurgs,
//     //   ...removeResi,
//     //   ...removeVisiAnesthesia,

//     //   ...removedUeAnnes,
//     // ];
//     console.log("newAddedOpTechProcedures", newAddedOpTechProcedures);
//     console.log("selectedPatientRow", selectedPatientRow);

//     try {
//       const activeUser = util.currentUserToken(req).code;

//       const withOrProcedure = await orRecords.selectOrbitOperativesTbl(
//         `and caseNo = ? and encounterCode = ? and code =?`,
//         [selectedPatientRow.cASENO, encounterCode, selectedPatientRow.code],
//         {},
//         txn,
//       );

//       if (withOrProcedure.length > 0) {
//         await orRecords.updatePatientInfo(
//           {
//             procedureClassification:
//               newAddedOpTechProcedures.procedureClassification,
//             preOperativeDiagnosis:
//               newAddedOpTechProcedures.preOperativeDiagnosis,
//             diagnosisProcedure: newAddedOpTechProcedures.diagnosisProcedure,
//             OperativeDiagnosis: newAddedOpTechProcedures.operativeDiagnosis,
//             anesthesia: newAddedOpTechProcedures.anesthesia,

//             surgeryIndication: newAddedOpTechProcedures.surgeryIndication,
//             specimen: newAddedOpTechProcedures.specimen,

//             // startDateTimeOperation: periodTime,
//             // endDateTimeOperation: endPeriodTime,

//             // anesthesiologist: selectedPatientRow.anesthesiologist,
//             // operativeTechnique: selectedPatientRow.operativeTechnique,
//             caseNo: selectedPatientRow.cASENO,

//             updatedBy: activeUser,
//           },
//           { caseNo: selectedPatientRow.cASENO },
//           txn,
//         );
//       } else {
//         const prefixs = "PROCE";
//         const generatedCode = await sqlHelper.generateUniqueCode(
//           "UERMMMC..OrbitOperatives",
//           prefixs.toUpperCase(),
//           2,
//           txn,
//         );

//         const operativeLogs = {
//           code: generatedCode,
//           procedureClassification:
//             newAddedOpTechProcedures.procedureClassification,
//           EncounterCode: encounterCode,
//           preOperativeDiagnosis: newAddedOpTechProcedures.preOperativeDiagnosis,
//           diagnosisProcedure: newAddedOpTechProcedures.diagnosisProcedure,
//           OperativeDiagnosis: newAddedOpTechProcedures.operativeDiagnosis,
//           anesthesia: newAddedOpTechProcedures.anesthesia,

//           surgeryIndication: newAddedOpTechProcedures.surgeryIndication,
//           specimen: newAddedOpTechProcedures.specimen,
//           opTechForm: true,
//           //  endDateTimeOperation: selectedPatientRow.endDateTimeOperation,
//           //         surgeryIndication: selectedPatientRow.surgeryIndication,

//           // anesthesiologist: selectedPatientRow.anesthesiologist,
//           // operativeTechnique: selectedPatientRow.operativeTechnique,
//           caseNo: selectedPatientRow.cASENO,

//           createdBy: activeUser,
//         };

//         await orRecords.insertOperativeLogs(operativeLogs, txn);
//       }

//       // if (allToModify.length > 0) {
//       //   const forInsert = allToModify.filter((item) => item.isNewSign);
//       //   const forUpdate = allToModify.filter((item) => !item.isNewSign);

//       //   for (const task of forInsert) {
//       //     const generatedCode = await sqlHelper.generateUniqueCode(
//       //       "UERMMMC..OrbitSignatories",
//       //       "SIG",
//       //       4,
//       //       txn,
//       //     );

//       //     const payload = {
//       //       code: generatedCode,
//       //       // empCode: activeUser,
//       //       caseNO: selectedPatientRow.cASENO,
//       //       name: task.name,
//       //       createdBy: activeUser,
//       //       type: task.type,
//       //       // signature: task.signature,
//       //     };

//       //     await orRecords.insertSignatories(payload, txn);
//       //   }

//       //   for (const task of forUpdate) {
//       //     await orRecords.updateSignatories(
//       //       {
//       //         // empCode: activeUser,
//       //         caseNO: selectedPatientRow.cASENO,

//       //         name: task.name,
//       //         // signature: task.signature,
//       //         updatedBy: activeUser,
//       //       },
//       //       { code: task.code },
//       //       txn,
//       //     );
//       //   }
//       // }

//       // if (ueAssisSurgs.length > 0) {
//       //   const forInsert = ueAssisSurgs.filter((item) => item.isNewSign);
//       //   //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
//       //   for (const task of forInsert) {
//       //     const generatedCode = await sqlHelper.generateUniqueCode(
//       //       "UERMMMC..OrbitSignatories",
//       //       "SIG",
//       //       4,
//       //       txn,
//       //     );

//       //     const payload = {
//       //       code: generatedCode,
//       //       empCode: task.empCode?.cODE ?? "", // get the actual employee code
//       //       caseNO: selectedPatientRow.cASENO,
//       //       name: task.empCode?.nAME ?? "", // fallback if name is empty
//       //       createdBy: activeUser,
//       //       type: task.type ?? "ueAsstSurg",
//       //       // type: task.empCode?.type ?? "",
//       //     };
//       //     await orRecords.insertSignatories(payload, txn);
//       //   }
//       // }

//       // if (ueheadSurgs.length > 0) {
//       //   const forInsert = ueheadSurgs.filter((item) => item.isNewSign);
//       //   //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
//       //   for (const task of forInsert) {
//       //     const generatedCode = await sqlHelper.generateUniqueCode(
//       //       "UERMMMC..OrbitSignatories",
//       //       "SIG",
//       //       4,
//       //       txn,
//       //     );

//       //     const payload = {
//       //       code: generatedCode,
//       //       empCode: task.empCode?.cODE ?? "", // get the actual employee code
//       //       caseNO: selectedPatientRow.cASENO,
//       //       name: task.empCode?.nAME ?? "", // fallback if name is empty
//       //       createdBy: activeUser,
//       //       type: task.type ?? "ueSurg",
//       //       // type: task.empCode?.type ?? "",
//       //     };
//       //     await orRecords.insertSignatories(payload, txn);
//       //   }
//       // }

//       // if (allToInactive.length > 0) {
//       //   for (const task of allToInactive) {
//       //     await orRecords.updateSignatories(
//       //       {
//       //         active: false,
//       //         updatedBy: activeUser,
//       //       },
//       //       { code: task.code },
//       //       txn,
//       //     );
//       //   }
//       // }
//       // if (ueAnnes.length > 0) {
//       //   const forInsert = ueAnnes.filter((item) => item.isNewSign);
//       //   //  const forUpdate = allToModify.filter((item) => !item.isNewSign);
//       //   for (const task of forInsert) {
//       //     const generatedCode = await sqlHelper.generateUniqueCode(
//       //       "UERMMMC..OrbitSignatories",
//       //       "SIG",
//       //       4,
//       //       txn,
//       //     );

//       //     const payload = {
//       //       code: generatedCode,
//       //       empCode: task.empCode?.cODE ?? "", // get the actual employee code
//       //       caseNO: selectedPatientRow.cASENO,
//       //       name: task.empCode?.nAME ?? "", // fallback if name is empty
//       //       createdBy: activeUser,
//       //       type: task.type ?? "ueAnes",
//       //     };
//       //     await orRecords.insertSignatories(payload, txn);
//       //   }

//       return res
//         .status(200)
//         .json({ success: true, message: "Update successful." });
//     } catch (error) {
//       return res.status(500).json({ error: error.message });
//     }
//   });

//   return returnValue;
// };

const putOpRecForms = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const {
      selectedPatientRow,

      spongeDatas,
      removedSponges,
      cliNurses,
      circu,
      removesScrbNrs,
      removeCircuNrs,
    } = req.body;

    const allToModify = [...circu, ...cliNurses];
    const allToInactive = [...removesScrbNrs, ...removeCircuNrs];
    // console.log("selectedPatientRow", selectedPatientRow);
    try {
      const activeUser = util.currentUserToken(req).code;

      const withOrProcedure = await orRecords.selectOrbitOperativesTbl(
        `and caseNo = ?`,
        [selectedPatientRow.cASENO],
        {},
        txn,
      );

      if (withOrProcedure.length > 0) {
        await orRecords.updatePatientInfo(
          {
            postOpDiagnosis: selectedPatientRow.postOpDiagnosis,
            operations: selectedPatientRow.operations,
            medications: selectedPatientRow.medications,
            remarks: selectedPatientRow.remarks,
            // scrubNurse: selectedPatientRow.scrubNurse,

            // circulatingNurse: selectedPatientRow.circulatingNurse,

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

          postOpDiagnosis: selectedPatientRow.postOpDiagnosis,
          operations: selectedPatientRow.operations,
          remarks: selectedPatientRow.remarks,
          medications: selectedPatientRow.medications,
          caseNo: selectedPatientRow.cASENO,
          createdBy: activeUser,
        };

        await orRecords.insertOperativeLogs(operativeLogs, txn);
      }
      if (spongeDatas.length > 0) {
        const forInsert = spongeDatas.filter((item) => item.isNew);
        const forUpdate = spongeDatas.filter((item) => !item.isNew);

        if (forInsert.length > 0) {
          for (const task of forInsert) {
            const generatedSpongeCode = await sqlHelper.generateUniqueCode(
              "UERMMMC..OrbitOperatives",
              "SPO",
              4,
              txn,
            );

            const taskPayload = {
              spongesCode: generatedSpongeCode,
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

        if (forUpdate.length > 0) {
          for (const task of forUpdate) {
            await orRecords.updateSponges(
              {
                sponges: task.sponges,
                initialCount: task.initialCount,
                onTable: task.onTable,
                onFloor: task.onFloor,
                updatedBy: activeUser,
              },
              { spongesCode: task.spongesCode },
              txn,
            );
          }
        }
        if (removedSponges.length > 0) {
          for (const forRemoving of removedSponges) {
            await orRecords.updateSponges(
              {
                active: false,
                updatedBy: activeUser,
              },
              { spongesCode: forRemoving.spongesCode },
              txn,
            );
          }
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

      return res
        .status(200)
        .json({ success: true, message: "Update successful." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return returnValue;
};

module.exports = {
  getPatientDetails,
  getTestPdets,
  getSurgeons,
  getFirstOREntry,
  getAnesthesiology,
  modifyPatientDetails,
  putOpTechForms,
  putOpRecForms,
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
};

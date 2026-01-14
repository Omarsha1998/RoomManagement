const Leave = require("../models/leaveModel.js");
const sqlHelper = require("../../../helpers/sql.js");
const util = require("../../../helpers/util.js");

const filterRequestDetailsCreate = (data = []) => {
  const hasMatchingIdCode = data.some((item) => {
    const employeeCodes = item.employeeCodes
      ?.split(",")
      .map((code) => code.trim());
    return (
      Array.isArray(employeeCodes) &&
      employeeCodes.includes(String(item.iDCode))
    );
  });

  if (hasMatchingIdCode) {
    return data.filter((item) => {
      const employeeCodes = item.employeeCodes
        ?.split(",")
        .map((code) => code.trim());
      return (
        Array.isArray(employeeCodes) &&
        employeeCodes.includes(String(item.iDCode))
      );
    });
  }

  // If no match at all, return full data
  return data;
};

const checkLeaveOverlap = async (employeeID, dateFrom, dateTo, request) => {
  const checkDateOfLeaveOverlap = await Leave.checkDateOfLeaveOverlap(
    employeeID,
    dateFrom,
    dateTo,
    request,
  );

  if (checkDateOfLeaveOverlap.length !== 0) {
    const leave = checkDateOfLeaveOverlap[0];

    const timeFrom = new Date(leave.tIME_FROM);
    const timeTo = new Date(leave.tIME_TO);

    const hoursDifference = (timeTo - timeFrom) / (1000 * 60 * 60); // Convert ms to hours

    // Check if the allotted hours are greater than 6 while daysOfLeave is not 0.5
    if (hoursDifference > 6 && leave.daysOfLeave !== 0.5) {
      return {
        hasConflict: true,
      };
    }
  }

  return { hasConflict: false };
};

const generateSchedule = (getSchedule) => {
  let mappedSchedule = [];

  if (!getSchedule || getSchedule.length === 0) {
    // Default schedule if no schedule is provided
    const defaultTimeFrom = "08:00:00.0000000";
    const defaultTimeTo = "17:00:00.0000000";
    mappedSchedule = [
      {
        schedId: "DTR",
        timeFrom: new Date(`1970-01-01T${defaultTimeFrom}Z`),
        timeTo: new Date(`1970-01-01T${defaultTimeTo}Z`),
      },
    ];
  } else {
    mappedSchedule = getSchedule.map((schedule) => {
      let timeFrom, timeTo;

      if (!schedule.schedFrom || !schedule.schedTo) {
        // Use default schedule if values are missing
        const defaultTimeFrom = "08:00:00.0000000";
        const defaultTimeTo = "17:00:00.0000000";
        timeFrom = new Date(`1970-01-01T${defaultTimeFrom}Z`);
        timeTo = new Date(`1970-01-01T${defaultTimeTo}Z`);
      } else {
        const adjustTime = (date) =>
          new Date(
            new Date(date).setUTCHours(new Date(date).getUTCHours() + 8),
          );
        timeFrom = adjustTime(schedule.schedFrom);
        timeTo = adjustTime(schedule.schedTo);
      }

      // Adjust time for UTC+8
      // timeFrom.setUTCHours(timeFrom.getUTCHours() + 8);
      // timeTo.setUTCHours(timeTo.getUTCHours() + 8);

      return {
        schedId: "DTR",
        timeFrom: timeFrom.toISOString(),
        timeTo: timeTo.toISOString(),
      };
    });
  }

  // Format the schedule output
  return mappedSchedule.map((item) => ({
    schedId: item.schedId,
    timeFrom: new Date(item.timeFrom).toLocaleString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }),
    timeTo: new Date(item.timeTo).toLocaleString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }),
  }));
};

const processVerificationLevels = (resultLevel) => {
  // // Assign employeeId to each row
  // resultLevel.forEach((row) => {
  //   row.iDCode = employeeId;
  // });

  // Filter the results
  // const resultOneAndTwo = filterRequestDetailsCreate(resultLevel);

  // Default verification flags
  let verifyLevel1 = false;
  let verifyLevel2 = false;
  let verifyLevel1and2 = false;

  if (resultLevel.length === 0) {
    verifyLevel1 = true;
    verifyLevel2 = true;
  } else {
    for (const row of resultLevel) {
      if (row.lvl !== null && row.lvl !== undefined) {
        // Check if lvl is valid
        if (row.lvl === 1) {
          verifyLevel1 = true;
        } else if (row.lvl === 2) {
          verifyLevel2 = true;
        }
      }
    }
  }

  // If both levels are verified, set verifyLevel1and2 to true and reset the others
  if (verifyLevel1 && verifyLevel2) {
    verifyLevel1and2 = true;
    verifyLevel1 = false;
    verifyLevel2 = false;
  }

  return { verifyLevel1, verifyLevel2, verifyLevel1and2 };
};

// const createLeaveRequest = async (req, res) => {
//   try {
//     const {
//       EmployeeCode,
//       LeaveType,
//       Days,
//       TimeFrom,
//       TimeTo,
//       DateFrom,
//       DateTo,
//       Reason,
//       hrModule
//     } = req.body;

//     const employeeID =
//       EmployeeCode != null ? EmployeeCode : req.user.employee_id;
//     const currentDateYear = new Date().getFullYear();
//     const currentDate = new Date();
//     const result = [];

//     const sqlWhereStrArr3 = ["Code = ?", "l.leaveType = ?"];
//     const args3 = [employeeID, LeaveType];
//     const sqlWhereStrArr2 = ["IDCode = ?", "LeaveType = ?", "status IN (?, ?)"];
//     const args2 = [employeeID, LeaveType, "Pending", "PendingLevel2"];

//     const leaveCheck = await checkLeaveOverlap(
//       employeeID,
//       DateFrom,
//       DateTo,
//       true,
//     );

//     if (leaveCheck.hasConflict) {
//       return res.status(400).json({
//         body: "You have a leave with the given from date and to date.",
//       });
//     }

//     const getSchedule = await Leave.getSchedule(employeeID, DateFrom, DateTo);
//     const formattedResult = generateSchedule(getSchedule);

//     if (
//       LeaveType === "SL" ||
//       LeaveType === "VL" ||
//       LeaveType === "BL" ||
//       LeaveType === "EL" ||
//       LeaveType === "MC" ||
//       LeaveType === "ML" ||
//       LeaveType === "OL" ||
//       LeaveType === "PARENTL" ||
//       LeaveType === "UL" ||
//       LeaveType === "VWC"
//     ) {
//       const totalValue = await Leave.calculateTotalLeaveValue(
//         sqlWhereStrArr3,
//         args3,
//         sqlWhereStrArr2,
//         args2,
//       );

//       if (Days > totalValue) {
//         return res
//           .status(400)
//           .json({ error: "Insufficient balance for LeaveType" });
//       }
//     }

//     const integerDays = Math.floor(Days);
//     const fractionalDays = Days % 1;

//     const resultLevel = await Leave.verifyLevelCreateLeave(employeeID);

//     const finalVerification = processVerificationLevels(
//       resultLevel,
//       employeeID,
//     );

//     const { verifyLevel1, verifyLevel2, verifyLevel1and2 } = finalVerification;

//     if (verifyLevel2 === true) {
//       if (integerDays > 0) {
//         const success = await sqlHelper.transact(async (txn) => {
//           const leaveIdLedger = await Leave.generateLeaveId(txn);
//           const adjustedDateFrom = new Date(`${DateFrom} GMT`);
//           const adjustedDateTo = new Date(`${DateFrom} GMT`);
//           adjustedDateTo.setDate(adjustedDateTo.getDate() + integerDays - 1);

//           if (LeaveType === "LWOP") {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: formattedResult[0].timeFrom,
//                 TIME_TO: formattedResult[0].timeTo,
//                 Remarks: Reason,
//                 reasonForLeave: Reason,
//                 LeaveType: LeaveType,
//                 daysOfLeave: integerDays,
//                 LeaveWOPay: integerDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "PendingLevel2",
//                 leaveId: leaveIdLedger,
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//                 approvedByLevel1: "0000",
//                 approvedByLevel1DateTime: currentDate,
//               },
//               txn,
//               "TransDate",
//             );
//           } else {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: formattedResult[0].timeFrom,
//                 TIME_TO: formattedResult[0].timeTo,
//                 Remarks: Reason,
//                 LeaveType: LeaveType,
//                 reasonForLeave: Reason,
//                 daysOfLeave: integerDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "PendingLevel2",
//                 leaveId: leaveIdLedger,
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//                 approvedByLevel1: "0000",
//                 approvedByLevel1DateTime: currentDate,
//               },
//               txn,
//               "TransDate",
//             );
//           }
//         });

//         if (!success) {
//           return res
//             .status(500)
//             .json({ error: "Failed to insert leave request" });
//         }
//       }

//       // Create leave request for fractional day if any
//       if (fractionalDays > 0) {
//         const success = await sqlHelper.transact(async (txn) => {
//           const leaveIdLedger = await Leave.generateLeaveId(txn);
//           const adjustedDateFrom = new Date(`${DateTo} GMT`);
//           const adjustedDateTo = new Date(`${DateTo} GMT`);

//           if (LeaveType === "LWOP") {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: TimeFrom,
//                 TIME_TO: TimeTo,
//                 Remarks: Reason,
//                 reasonForLeave: Reason,
//                 LeaveType: LeaveType,
//                 daysOfLeave: fractionalDays,
//                 LeaveWOPay: fractionalDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "PendingLevel2",
//                 leaveId: leaveIdLedger,
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//                 approvedByLevel1: "0000",
//                 approvedByLevel1DateTime: currentDate,
//               },
//               txn,
//               "TransDate",
//             );
//           } else {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: TimeFrom,
//                 TIME_TO: TimeTo,
//                 Remarks: Reason,
//                 LeaveType: LeaveType,
//                 reasonForLeave: Reason,
//                 daysOfLeave: fractionalDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "PendingLevel2",
//                 leaveId: leaveIdLedger,
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//                 approvedByLevel1: "0000",
//                 approvedByLevel1DateTime: currentDate,
//               },
//               txn,
//               "TransDate",
//             );
//           }
//         });

//         if (!success) {
//           return res
//             .status(500)
//             .json({ error: "Failed to insert leave request" });
//         }
//       }
//     } else {
//       if (integerDays > 0) {
//         const success = await sqlHelper.transact(async (txn) => {
//           const leaveIdLedger = await Leave.generateLeaveId(txn);
//           const adjustedDateFrom = new Date(`${DateFrom} GMT`);
//           const adjustedDateTo = new Date(`${DateFrom} GMT`);
//           adjustedDateTo.setDate(adjustedDateTo.getDate() + integerDays - 1);

//           if (LeaveType === "LWOP") {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: formattedResult[0].timeFrom,
//                 TIME_TO: formattedResult[0].timeTo,
//                 Remarks: Reason,
//                 reasonForLeave: Reason,
//                 LeaveType: LeaveType,
//                 daysOfLeave: integerDays,
//                 LeaveWOPay: integerDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "Pending",
//                 leaveId: leaveIdLedger,
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//               },
//               txn,
//               "TransDate",
//             );
//           } else {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: formattedResult[0].timeFrom,
//                 TIME_TO: formattedResult[0].timeTo,
//                 Remarks: Reason,
//                 LeaveType: LeaveType,
//                 reasonForLeave: Reason,
//                 daysOfLeave: integerDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "Pending",
//                 leaveId: leaveIdLedger, // Use the generated leaveIdLedger
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//               },
//               txn,
//               "TransDate",
//             );
//           }
//         });

//         if (!success) {
//           return res
//             .status(500)
//             .json({ error: "Failed to insert leave request" });
//         }
//       }

//       // Create leave request for fractional day if any
//       if (fractionalDays > 0) {
//         const success = await sqlHelper.transact(async (txn) => {
//           const leaveIdLedger = await Leave.generateLeaveId(txn);
//           const adjustedDateFrom = new Date(`${DateTo} GMT`);
//           const adjustedDateTo = new Date(`${DateTo} GMT`);

//           if (LeaveType === "LWOP") {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: TimeFrom,
//                 TIME_TO: TimeTo,
//                 Remarks: Reason,
//                 reasonForLeave: Reason,
//                 LeaveType: LeaveType,
//                 daysOfLeave: fractionalDays,
//                 LeaveWOPay: fractionalDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "Pending",
//                 leaveId: leaveIdLedger,
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//               },
//               txn,
//               "TransDate",
//             );
//           } else {
//             return await Leave.createLeaveRequest(
//               {
//                 IDCode: employeeID,
//                 DateLeavedFrom: adjustedDateFrom,
//                 DateLeavedTo: adjustedDateTo,
//                 TIME_FROM: TimeFrom,
//                 TIME_TO: TimeTo,
//                 Remarks: Reason,
//                 LeaveType: LeaveType,
//                 reasonForLeave: Reason,
//                 daysOfLeave: fractionalDays,
//                 itemType: `FILED-${LeaveType}-${currentDateYear}`,
//                 status: "Pending",
//                 leaveId: leaveIdLedger,
//                 EarnedDays: 0,
//                 EarnedHours: 0,
//               },
//               txn,
//               "TransDate",
//             );
//           }
//         });

//         if (!success) {
//           return res
//             .status(500)
//             .json({ error: "Failed to insert leave request" });
//         }
//       }
//     }

//     return res
//       .status(201)
//       .json({ body: "Leave request(s) created successfully", success: true });
//   } catch (error) {
//     return res.status(500).json({ error: "Failed to insert leave request" });
//   }
// };
const dateHelper = (data) => {
  const today = new Date();

  return data.map((item) => {
    const from = new Date(item.tIME_FROM);
    const to = new Date(item.tIME_TO);

    item.tIME_FROM = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      from.getHours(),
      from.getMinutes(),
    );
    item.tIME_TO = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      to.getHours(),
      to.getMinutes(),
    );

    return item;
  });
};

const processHrdRequest = async (data, hrdAccount, hrModule, oneLevel) => {
  const currentYear = new Date().getFullYear();
  const leaveIdDays = data.daysOfLeave;
  const leaveIdLeaveType = data.leaveType;
  const leaveIdCode = data.iDCode;
  const leaveIdYear = data.year || currentYear;

  let checkYearAttributed = [
    { year: `${leaveIdYear}`, daysOfLeave: leaveIdDays },
  ];

  if (leaveIdLeaveType !== "LWOP") {
    checkYearAttributed = await sqlHelper.transact(async (txn) => {
      return await Leave.getAttributedYear(
        leaveIdCode,
        leaveIdLeaveType,
        leaveIdDays,
        txn,
      );
    });
  }

  return await sqlHelper.transact(async (txn) => {
    for (const year of checkYearAttributed) {
      const yearAttributed = year.year;
      const daysOfLeave = year.daysOfLeave;

      const moduleCheck = hrModule || oneLevel ? true : false;

      const insertLeaveLedger = await Leave.insertLeaveLedger(
        {
          Code: data.iDCode,
          Remarks: data.remarks,
          LeaveType: data.leaveType,
          ITEMTYPE: data.itemType,
          ReferenceNo: data.leaveId,
          YearEffectivity: data.effectiveYear,
          yearAttributed: yearAttributed,
          Credit: daysOfLeave,
        },
        txn,
        "TransDate",
      );

      if (!insertLeaveLedger) {
        throw new Error("Failed to insert leave ledger.");
      }

      const leaveLedgerId = insertLeaveLedger.recNo;
      const leaveLedgerLeaveId = insertLeaveLedger.referenceNo;
      // const leaveLedgerUsedLeave = insertLeaveLedger.credit;
      const leaveLedgerYearAttributed = insertLeaveLedger.yearAttributed;

      const updateVacationSickLeave = await Leave.updateLegerIdVSL(
        {
          ...(moduleCheck && {
            approvedByLevel1: hrdAccount,
            approvedByLevel1DateTime: new Date(),
          }),
          UserID: hrdAccount,
          "[HEAD APPROVED]": 1,
          "[HEAD APPROVE BY]": hrdAccount,
          "[HEAD APPROVE DATE]": new Date(),
          ledgerId: leaveLedgerId,
          USED_LEAVE: leaveIdDays,
          Year: leaveLedgerYearAttributed,
          status: "Approved",
          approvedByLevel2: hrdAccount,
          hrReceived: 1,
          hrReceiveDate: new Date(),
        },
        { leaveId: leaveLedgerLeaveId },
        txn,
        "approvedByLevel2DateTime",
      );

      if (!updateVacationSickLeave) {
        throw new Error("Failed to update leave ledger.");
      }
    }
    return true;
  });
};

const createLeaveRequest = async (req, res) => {
  try {
    const {
      EmployeeCode,
      LeaveType,
      Days,
      TimeFrom,
      TimeTo,
      DateFrom,
      DateTo,
      Reason,
      hrModule,
    } = req.body;

    const hrdAccount = req.user.employee_id;
    const employeeID = EmployeeCode ?? req.user.employee_id;
    const currentDateYear = new Date().getFullYear();
    const currentDate = new Date();

    // const sqlWhereStrArr3 = ["Code = ?", "l.leaveType = ?"];
    // const args3 = [employeeID, LeaveType];
    // const sqlWhereStrArr2 = ["IDCode = ?", "LeaveType = ?", "status IN (?, ?)"];
    // const args2 = [employeeID, LeaveType, "Pending", "PendingLevel2"];

    // Check for overlapping leaves
    const leaveCheck = await checkLeaveOverlap(
      employeeID,
      DateFrom,
      DateTo,
      true,
    );
    if (leaveCheck.hasConflict) {
      return res
        .status(400)
        .json({ error: "You have an overlapping leave request." });
    }

    // Fetch employee schedule
    const getSchedule = await Leave.getSchedule(employeeID, DateFrom, DateTo);
    const formattedResult = generateSchedule(getSchedule);

    // Validate leave balance
    const VALID_LEAVE_TYPES = [
      "SL",
      "VL",
      "BL",
      "EL",
      "MC",
      "ML",
      "OL",
      "PARENTL",
      "UL",
      "VWC",
    ];
    if (VALID_LEAVE_TYPES.includes(LeaveType)) {
      const totalValue = await Leave.calculateTotalLeaveValue(
        employeeID,
        LeaveType,
        // sqlWhereStrArr3,
        // args3,
        // sqlWhereStrArr2,
        // args2,
      );

      if (Days > totalValue) {
        return res.status(400).json({
          error: "Insufficient balance for the requested leave type.",
        });
      }
    }

    // Split days into integer and fractional parts
    const integerDays = Math.floor(Days);
    const fractionalDays = Days % 1;

    // Determine leave approval level
    const resultLevel = await Leave.verifyLevelCreate(employeeID);
    const { verifyLevel2 } = processVerificationLevels(resultLevel);
    const leaveStatus = verifyLevel2 ? "PendingLevel2" : "Pending";

    const createLeave = async (
      dateFrom,
      dateTo,
      days,
      isFractional = false,
    ) => {
      return await sqlHelper.transact(async (txn) => {
        const leaveIdLedger = await Leave.generateLeaveId(txn);
        return await Leave.createLeaveRequest(
          {
            IDCode: employeeID,
            DateLeavedFrom: dateFrom,
            DateLeavedTo: dateTo,
            TIME_FROM: isFractional ? TimeFrom : formattedResult[0].timeFrom,
            TIME_TO: isFractional ? TimeTo : formattedResult[0].timeTo,
            Remarks: Reason,
            reasonForLeave: Reason,
            LeaveType: LeaveType,
            daysOfLeave: days,
            LeaveWOPay: LeaveType === "LWOP" ? days : null,
            itemType: `FILED-${LeaveType}-${currentDateYear}`,
            status: hrModule ? "Approved" : leaveStatus,
            leaveId: leaveIdLedger,
            EarnedDays: 0,
            EarnedHours: 0,
            approvedByLevel1: hrModule
              ? hrdAccount
              : verifyLevel2
                ? "0000"
                : null,
            approvedByLevel1DateTime: hrModule
              ? currentDate
              : verifyLevel2
                ? currentDate
                : null,
            approvedByLevel2: hrModule ? hrdAccount : null,
            approvedByLevel2DateTime: hrModule ? currentDate : null,
          },
          txn,
          "TransDate",
        );
      });
    };

    // Process leave requests
    if (integerDays > 0) {
      const success = await createLeave(DateFrom, DateTo, integerDays);
      if (!success) {
        return res
          .status(500)
          .json({ error: "Failed to insert leave request for whole days." });
      }

      if (success && hrModule === true) {
        const insertUpdate = await processHrdRequest(
          success,
          hrdAccount,
          hrModule,
        );
        if (!insertUpdate) {
          return res.status(500).json({
            error: "Failed to insert leave request for fractional day.",
          });
        }
      }
    }
    if (fractionalDays > 0) {
      const success = await createLeave(DateTo, DateTo, fractionalDays, true);
      if (!success) {
        return res.status(500).json({
          error: "Failed to insert leave request for fractional day.",
        });
      }

      if (success && hrModule === true) {
        const insertUpdate = await processHrdRequest(success, hrdAccount);
        if (!insertUpdate) {
          return res.status(500).json({
            error: "Failed to insert leave request for fractional day.",
          });
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Leave request submitted successfully." });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
};

const updateLeaveAction = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const leaveIds = req.body.LeaveID;
    const Status = req.body.Status;
    const reason = req.body.reason;
    const currentDate = new Date();
    const employeeID = req.user.employee_id;
    const arrayOfMessages = [];

    for (const leaveId of leaveIds) {
      const checkLevelStatusQuery = await Leave.checkLevelStatus(leaveId);
      const checkLevelStatus = filterRequestDetailsCreate(
        checkLevelStatusQuery,
      );

      const verifyLevel = await Leave.verifyLevel(employeeId);

      if (checkLevelStatus.length > 0) {
        const checkStatus = checkLevelStatus[0];
        if (
          checkStatus.approvedByLevel1 === null &&
          checkStatus.approvedByLevel2 === null
        ) {
          if (
            !verifyLevel.some(
              (level) =>
                level.lvl === 1 && level.deptCode === checkStatus.deptCode,
            )
          ) {
            return res.status(405).json({
              error:
                "You are not authorized to approve or reject leave requests",
            });
          }

          const rowsAffected = await sqlHelper.transact(async (txn) => {
            if (Status === "Approved") {
              let resultsArray = null;

              if (!checkLevelStatus.some((level) => level.lvl === 2)) {
                const leaveDetails = await Leave.getLeaveIdDetails(
                  leaveId,
                  txn,
                );

                resultsArray = await processHrdRequest(
                  leaveDetails[0],
                  employeeID,
                  false,
                  true,
                );

                // const currentYear = new Date().getFullYear();
                // const leaveIdDays = leaveDetails[0].daysOfLeave;
                // const leaveIdLeaveType = leaveDetails[0].leaveType;
                // const leaveIdCode = leaveDetails[0].iDCode;
                // const leaveIdYear = leaveDetails[0].year || currentYear;
                // let checkYearAttributed = [
                //   { year: `${leaveIdYear}`, daysOfLeave: leaveIdDays },
                // ];

                // if (leaveIdLeaveType !== "LWOP") {
                //   checkYearAttributed = await Leave.getAttributedYear(
                //     leaveIdCode,
                //     leaveIdLeaveType,
                //     leaveIdDays,
                //     txn,
                //   );
                // }

                // checkYearAttributed.sort((a, b) => a.year - b.year);

                // for (const year of checkYearAttributed) {
                //   const yearAttributed = year.year;
                //   const daysOfLeave = year.daysOfLeave;

                //   const codeReq = leaveDetails[0].iDCode;
                //   const leaveTypeReq = leaveDetails[0].leaveType;
                //   const itemType = leaveDetails[0].itemType;
                //   const yearEffectivity = leaveDetails[0].effectiveYear;
                //   const remarks = leaveDetails[0].remarks;
                //   const referenceNo = leaveDetails[0].leaveId;

                //   const insertLeaveLedger = await Leave.insertLeaveLedger(
                //     {
                //       Code: codeReq,
                //       Remarks: remarks,
                //       LeaveType: leaveTypeReq,
                //       ITEMTYPE: itemType,
                //       ReferenceNo: referenceNo,
                //       YearEffectivity: yearEffectivity,
                //       yearAttributed: yearAttributed,
                //       Credit: daysOfLeave,
                //     },
                //     txn,
                //     "TransDate",
                //   );

                //   const leaveLedgerId = insertLeaveLedger.recNo;
                //   const leaveLedgerLeaveId = insertLeaveLedger.referenceNo;
                //   const leaveLedgerUsedLeave = insertLeaveLedger.credit;
                //   const leaveLedgerYearAttributed =
                //     insertLeaveLedger.yearAttributed;

                //   const updateVacationSickLeave = await Leave.updateLegerIdVSL(
                //     {
                //       status: "Approved",
                //       approvedByLevel1: employeeID,
                //       approvedByLevel1DateTime: currentDate,
                //       UserID: employeeID,
                //       "[HEAD APPROVED]": 1,
                //       "[HEAD APPROVE BY]": employeeID,
                //       "[HEAD APPROVE DATE]": currentDate,
                //       approvedByLevel2: employeeID,
                //       ledgerId: leaveLedgerId,
                //       USED_LEAVE: leaveLedgerUsedLeave,
                //       Year: leaveLedgerYearAttributed,
                //       hrReceived: 1,
                //       hrReceiveDate: currentDate,
                //     },
                //     { leaveId: leaveLedgerLeaveId },
                //     txn,
                //     "approvedByLevel2DateTime",
                //   );
                //   resultsArray.push(updateVacationSickLeave);
                // }
                return resultsArray;
              } else {
                return await Leave.updateLeaveAction(
                  {
                    status: "PendingLevel2",
                    approvedByLevel1: employeeID,
                    UserID: employeeID,
                    "[HEAD APPROVED]": 1,
                    "[HEAD APPROVE BY]": employeeID,
                    "[HEAD APPROVE DATE]": currentDate,
                  },
                  { leaveId: leaveId },
                  txn,
                  "approvedByLevel1DateTime",
                );
              }
            }

            return await Leave.updateLeaveAction(
              {
                status: "RejectedByLevel1",
                rejectedByLevel1: employeeID,
                UserID: employeeID,
                reasonForRejection: reason,
                hrReceived: 1,
                hrReceiveDate: currentDate,
              },
              { leaveId: leaveId },
              txn,
              "rejectedByLevel1DateTime",
            );
          });

          if (rowsAffected.error) {
            arrayOfMessages.push(
              `Leave request ${Status} failed for LeaveID: ${leaveId}`,
            );
          } else {
            arrayOfMessages.push(
              `Leave request ${Status}d successfully for LeaveID: ${leaveId}`,
            );
          }
        }

        if (
          checkStatus.approvedByLevel1 !== null &&
          checkStatus.status === "PendingLevel2" &&
          checkStatus.approvedByLevel2 === null
        ) {
          if (
            !verifyLevel.some(
              (level) =>
                level.lvl === 2 && level.deptCode === checkStatus.deptCode,
            )
          ) {
            return res.status(405).json({
              error:
                "You are not authorized to approve or reject leave requests",
            });
          }

          const rowsAffected = await sqlHelper.transact(async (txn) => {
            if (Status === "Approved") {
              let resultsArray = null;
              const leaveDetails = await Leave.getLeaveIdDetails(leaveId, txn);
              // const currentYear = new Date().getFullYear();
              // const leaveIdDays = leaveDetails[0].daysOfLeave;
              // const leaveIdLeaveType = leaveDetails[0].leaveType;
              // const leaveIdCode = leaveDetails[0].iDCode;
              // const leaveIdYear = leaveDetails[0].year || currentYear;
              // let checkYearAttributed = [
              //   { year: `${leaveIdYear}`, daysOfLeave: leaveIdDays },
              // ];

              // if (leaveIdLeaveType !== "LWOP") {
              //   checkYearAttributed = await Leave.getAttributedYear(
              //     leaveIdCode,
              //     leaveIdLeaveType,
              //     leaveIdDays,
              //     txn,
              //   );
              // }

              // checkYearAttributed.sort((a, b) => a.year - b.year);

              resultsArray = await processHrdRequest(
                leaveDetails[0],
                employeeID,
              );
              return resultsArray;
              // if (
              //   !checkLevelStatus.some((level) => level.lvl === 1) &&
              //   checkStatus.approvedByLevel1 === 0
              // ) {
              //   resultsArray = await processHrdRequest(
              //     leaveDetails[0],
              //     employeeID,
              //   );
              //   // for (const year of checkYearAttributed) {
              //   //   const yearAttributed = year.year;
              //   //   const daysOfLeave = year.daysOfLeave;

              //   //   const codeReq = leaveDetails[0].iDCode;
              //   //   const leaveTypeReq = leaveDetails[0].leaveType;
              //   //   const itemType = leaveDetails[0].itemType;
              //   //   const yearEffectivity = leaveDetails[0].effectiveYear;
              //   //   const remarks = leaveDetails[0].remarks;
              //   //   const referenceNo = leaveDetails[0].leaveId;

              //   //   const insertLeaveLedger = await Leave.insertLeaveLedger(
              //   //     {
              //   //       Code: codeReq,
              //   //       Remarks: remarks,
              //   //       LeaveType: leaveTypeReq,
              //   //       ITEMTYPE: itemType,
              //   //       ReferenceNo: referenceNo,
              //   //       YearEffectivity: yearEffectivity,
              //   //       yearAttributed: yearAttributed,
              //   //       Credit: daysOfLeave,
              //   //     },
              //   //     txn,
              //   //     "TransDate",
              //   //   );

              //   //   const leaveLedgerId = insertLeaveLedger.recNo;
              //   //   const leaveLedgerLeaveId = insertLeaveLedger.referenceNo;
              //   //   const leaveLedgerUsedLeave = insertLeaveLedger.credit;
              //   //   const leaveLedgerYearAttributed =
              //   //     insertLeaveLedger.yearAttributed;

              //   //   const updateVacationSickLeave = await Leave.updateLegerIdVSL(
              //   //     {
              //   //       status: "Approved",
              //   //       approvedByLevel1: employeeID,
              //   //       approvedByLevel1DateTime: currentDate,
              //   //       UserID: employeeID,
              //   //       "[HEAD APPROVED]": 1,
              //   //       "[HEAD APPROVE BY]": employeeID,
              //   //       "[HEAD APPROVE DATE]": currentDate,
              //   //       approvedByLevel2: employeeID,
              //   //       ledgerId: leaveLedgerId,
              //   //       USED_LEAVE: leaveLedgerUsedLeave,
              //   //       Year: leaveLedgerYearAttributed,
              //   //       hrReceived: 1,
              //   //       hrReceiveDate: currentDate,
              //   //     },
              //   //     { leaveId: leaveLedgerLeaveId },
              //   //     txn,
              //   //     "approvedByLevel2DateTime",
              //   //   );

              //   //   resultsArray.push(updateVacationSickLeave);
              //   // }
              //   return resultsArray;
              // } else {
              //   resultsArray = await processHrdRequest(
              //     leaveDetails[0],
              //     employeeID,
              //   );
              //   return resultsArray;
              //   // const resultsArray = [];
              //   // const leaveDetails = await Leave.getLeaveIdDetails(
              //   //   leaveId,
              //   //   txn,
              //   // );
              //   // const currentYear = new Date().getFullYear();
              //   // const leaveIdDays = leaveDetails[0].daysOfLeave;
              //   // const leaveIdLeaveType = leaveDetails[0].leaveType;
              //   // const leaveIdCode = leaveDetails[0].iDCode;
              //   // const leaveIdYear = leaveDetails[0].year || currentYear;

              //   // resultsArray = await processHrdRequest(leaveDetails, employeeID);
              //   // // let checkYearAttributed = await Leave.getAttributedYear(
              //   // //   leaveIdCode,
              //   // //   leaveIdLeaveType,
              //   // //   leaveIdDays,
              //   // //   txn
              //   // // );
              //   // let checkYearAttributed = [
              //   //   { year: `${leaveIdYear}`, daysOfLeave: leaveIdDays },
              //   // ];

              //   // if (leaveIdLeaveType !== "LWOP") {
              //   //   checkYearAttributed = await Leave.getAttributedYear(
              //   //     leaveIdCode,
              //   //     leaveIdLeaveType,
              //   //     leaveIdDays,
              //   //     txn,
              //   //   );
              //   // }

              //   // checkYearAttributed.sort((a, b) => a.year - b.year);

              //   // for (const year of checkYearAttributed) {
              //   //   const yearAttributed = year.year;
              //   //   const daysOfLeave = year.daysOfLeave;

              //   //   const codeReq = leaveDetails[0].iDCode;
              //   //   const leaveTypeReq = leaveDetails[0].leaveType;
              //   //   const itemType = leaveDetails[0].itemType;
              //   //   const yearEffectivity = leaveDetails[0].effectiveYear;
              //   //   const remarks = leaveDetails[0].remarks;
              //   //   const referenceNo = leaveDetails[0].leaveId;

              //   //   const insertLeaveLedger = await Leave.insertLeaveLedger(
              //   //     {
              //   //       Code: codeReq,
              //   //       Remarks: remarks,
              //   //       LeaveType: leaveTypeReq,
              //   //       ITEMTYPE: itemType,
              //   //       ReferenceNo: referenceNo,
              //   //       YearEffectivity: yearEffectivity,
              //   //       yearAttributed: yearAttributed,
              //   //       Credit: daysOfLeave,
              //   //     },
              //   //     txn,
              //   //     "TransDate",
              //   //   );

              //   //   const leaveLedgerId = insertLeaveLedger.recNo;
              //   //   const leaveLedgerLeaveId = insertLeaveLedger.referenceNo;
              //   //   const leaveLedgerUsedLeave = insertLeaveLedger.credit;
              //   //   const leaveLedgerYearAttributed =
              //   //     insertLeaveLedger.yearAttributed;

              //   //   const updateVacationSickLeave = await Leave.updateLegerIdVSL(
              //   //     {
              //   //       status: "Approved",
              //   //       UserID: employeeID,
              //   //       approvedByLevel2: employeeID,
              //   //       ledgerId: leaveLedgerId,
              //   //       USED_LEAVE: leaveLedgerUsedLeave,
              //   //       Year: leaveLedgerYearAttributed,
              //   //       hrReceived: 1,
              //   //       hrReceiveDate: currentDate,
              //   //     },
              //   //     { leaveId: leaveLedgerLeaveId },
              //   //     txn,
              //   //     "approvedByLevel2DateTime",
              //   //   );
              //   //   resultsArray.push(updateVacationSickLeave);
              //   // }
              // }
            } else {
              if (
                !checkLevelStatus.some((level) => level.lvl === 1) &&
                checkStatus.approvedByLevel1 === 0
              ) {
                return await Leave.updateLeaveAction(
                  {
                    status: "RejectedByLevel2",
                    rejectedByLevel1: employeeID,
                    rejectedByLevel1DateTime: currentDate,
                    rejectedByLevel2: employeeID,
                    UserID: employeeID,
                    reasonForRejection: reason,
                  },
                  { leaveId: leaveId },
                  txn,
                  "rejectedByLevel2DateTime",
                );
              } else {
                return await Leave.updateLeaveAction(
                  {
                    status: "RejectedByLevel2",
                    rejectedByLevel2: employeeID,
                    UserID: employeeID,
                    reasonForRejection: reason,
                  },
                  { leaveId: leaveId },
                  txn,
                  "rejectedByLevel2DateTime",
                );
              }
            }
          });

          if (rowsAffected && rowsAffected.error) {
            arrayOfMessages.push(
              `Leave request ${Status} failed for LeaveID: ${leaveId}`,
            );
          } else {
            arrayOfMessages.push(
              `Leave request ${Status}d successfully for LeaveID: ${leaveId}`,
            );
          }
        } else {
          arrayOfMessages.push(`No records found for LeaveID: ${leaveId}`);
        }
      } else {
        return res.status(400).json({
          messages:
            "Please report to HRD to verify the department of the employee you approved.",
        });
      }
    }

    // After processing all leaveIds, send the accumulated responses
    return res.status(200).json({ messages: arrayOfMessages });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update leave request" });
  }
};

const getLeaveDetails = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    // const sqlWhereStrArr = [
    //   "vsl.IDCode = ?",
    //   "vsl.TIME_FROM IS NOT NULL",
    //   "vsl.TIME_TO IS NOT NULL",
    //   "vsl.DateLeavedFrom IS NOT NULL",
    //   "vsl.DateLeavedTo IS NOT NULL",
    //   "vsl.status IS NOT NULL",
    //   "vsl.DELETED = 0",
    // ];
    // const args = [employeeId];
    const success = await Leave.getLeaveDetails(employeeId);

    if (success) {
      const newSuccess = success.map((row) => {
        return {
          ...row,
          timeFrom: util.formatDate({ date: row.tIME_FROM, timeOnly: true }),
          timeTo: util.formatDate({ date: row.tIME_TO, timeOnly: true }),
        };
      });

      // success.map((row) => {
      //   // const dateFromStr = row.dateLeavedFrom.toISOString().substring(0, 10);
      //   // const dateToStr = row.dateLeavedTo.toISOString().substring(0, 10);
      //   // row.tIME_FROM = `${dateFromStr}T${row.tIME_FROM.toISOString().substring(11, 23)}Z`;
      //   // row.tIME_TO = `${dateToStr}T${row.tIME_TO.toISOString().substring(11, 23)}Z`;
      //   row.timeFrom = util.formatDate({ date: row.tIME_FROM, timeOnly: true });
      //   row.timeTo = util.formatDate({ date: row.tIME_TO, timeOnly: true });
      // });

      return res.status(200).json(newSuccess);
    } else {
      return res.status(400).json({ error: "No Leave Details" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server" });
  }
};

const getLeaveBalance = async (req, res) => {
  try {
    const employeeID = req.user.employee_id;
    const sqlWhereStrArr = ["code = ?"];
    const args = [employeeID];

    const success = await Leave.getLeaveBalance(
      sqlWhereStrArr,
      args,
      employeeID,
    );

    if (success) {
      return res.status(200).json(success);
    } else {
      return res.status(400).json({
        error:
          "Failed to get Leave Balance / No Leave Balance found for this User",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sumOfVacationLeave = async (data) => {
  const sumData = {};

  for (const item of data) {
    const { code, leaveType, year, remaining, ...rest } = item;
    const key = `${code}-${leaveType}`;

    if (!sumData[key]) {
      sumData[key] = { ...rest, code, leaveType, year: [], remaining: 0 };
    }

    sumData[key].year.push(year);
    sumData[key].remaining += remaining;
  }

  return Object.values(sumData).map((item) => ({
    ...item,
    year: item.year.join(", "),
  }));
};

const getUserLeaveBalanceDetails = async (req, res) => {
  try {
    const { employeeId, leaveType } = req.body;

    const success = await Leave.getUserLeaveBalanceDetails(
      employeeId,
      leaveType,
    );

    for (const item of success) {
      if (item.remaining <= 0) {
        item.remaining = 0;
      }
    }

    const resultFinal = await sumOfVacationLeave(success);

    if (resultFinal) {
      return res.status(200).json(resultFinal);
    } else {
      return res.status(400).json({ error: "Failed to get all Leave Balance" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getLeaveLedger = async (req, res) => {
  try {
    const employeeID = req.user.employee_id;
    // // const sqlWhereStrArr = ["code = ?", "debit = ?", "credit IS NOT NULL"];
    // // const args = [employeeID, "0"];
    const success = await Leave.getLeaveLedger(employeeID);
    if (success) {
      return res.status(200).json(success);
    } else {
      return res
        .status(400)
        .json({ error: "Failed to get the Forfeited Leaves for this User" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPendingLeaves = async (req, res) => {
  const employeeId = req.user.employee_id;
  const checkEmployeeToApprove = await Leave.checkEmployeeToApprove(employeeId);

  const lvl1DeptCodes = [];
  const lvl2DeptCodes = [];
  const userHasLevel1 = checkEmployeeToApprove.some((entry) => entry.lvl === 1);
  const userHasLevel2 = checkEmployeeToApprove.some((entry) => entry.lvl === 2);
  const employeeCodesLevel1 = [];
  const employeeCodesLevel2 = [];

  for (const toApprove of checkEmployeeToApprove) {
    if (toApprove.employeeCodes && Number(toApprove.lvl) === 1) {
      employeeCodesLevel1.push(...toApprove.employeeCodes.split(","));
      continue;
    }

    if (toApprove.employeeCodes && Number(toApprove.lvl) === 2) {
      employeeCodesLevel2.push(...toApprove.employeeCodes.split(","));
      continue;
    }

    if (Number(toApprove.lvl) === 1) {
      if (!lvl1DeptCodes.includes(toApprove.deptCode))
        lvl1DeptCodes.push(toApprove.deptCode);
    }

    if (Number(toApprove.lvl) === 2) {
      if (!lvl2DeptCodes.includes(toApprove.deptCode))
        lvl2DeptCodes.push(toApprove.deptCode);
    }
  }

  let result = await Leave.getPendingLeavesByEmployee(
    employeeCodesLevel1,
    employeeCodesLevel2,
    lvl1DeptCodes,
    lvl2DeptCodes,
    userHasLevel1,
    userHasLevel2,
    employeeId,
  );

  if (result) {
    // result.map((row) => {
    //   // const dateFromStr = row.dateLeavedFrom.toISOString().substring(0, 10);
    //   // const dateToStr = row.dateLeavedTo.toISOString().substring(0, 10);
    //   // row.tIME_FROM = `${dateFromStr}T${row.tIME_FROM.toISOString().substring(11, 23)}Z`;
    //   // row.tIME_TO = `${dateToStr}T${row.tIME_TO.toISOString().substring(11, 23)}Z`;
    //   row.timeFrom = new Date(row.tIME_FROM);
    //   row.timeTo = new Date(row.tIME_TO);

    //   return row;
    // });

    result = dateHelper(result);

    return res.status(200).json(result);
  } else {
    return res.status(400).json({ error: "No Leave Details" });
  }
};

const getRejectedLeaves = async (req, res) => {
  try {
    const employeeID = req.user.employee_id;

    const sqlWhereStrArr = ["code = ? AND deleted != 1"];
    const args = [employeeID];
    const sqlWhereStrArr2 = [
      "LI.status IN (?, ?)",
      "TIME_FROM IS NOT NULL",
      "TIME_TO IS NOT NULL",
      "DateLeavedFrom IS NOT NULL",
      "DateLeavedTo IS NOT NULL",
      "(rejectedByLevel1 IS NOT NULL OR rejectedByLevel2 IS NOT NULL)",
      "LI.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args2 = ["RejectedByLevel1", "RejectedByLevel2"];

    let rejectedLeaves = await Leave.getRejectedLeaves(
      sqlWhereStrArr,
      args,
      sqlWhereStrArr2,
      args2,
    );

    if (rejectedLeaves) {
      // rejectedLeaves.map((item) => {
      //   item.tIME_FROM = new Date(item.tIME_FROM);
      //   item.tIME_TO = new Date(item.tIME_TO);
      //   return item;
      // });
      rejectedLeaves = dateHelper(rejectedLeaves);
    }

    res.status(200).json(rejectedLeaves);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve rejected leave" });
  }
};

const getApprovedLeaves = async (req, res) => {
  try {
    const employeeID = req.user.employee_id;
    const sqlWhereStrArr = ["code = ?", "deleted = ?"];
    const args = [employeeID, 0];
    const sqlWhereStrArr2 = [
      "LI.status = ?",
      "TIME_FROM IS NOT NULL",
      "TIME_TO IS NOT NULL",
      "DateLeavedFrom IS NOT NULL",
      "DateLeavedTo IS NOT NULL",
      "approvedByLevel1 IS NOT NULL",
      "approvedByLevel2 IS NOT NULL",
      "LI.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args2 = ["Approved"];

    let approvedLeave = await Leave.getApprovedLeaves(
      sqlWhereStrArr,
      args,
      sqlWhereStrArr2,
      args2,
    );

    if (approvedLeave) {
      approvedLeave = dateHelper(approvedLeave);
    }

    res.status(200).json(approvedLeave);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve approved leave" });
  }
};

const deleteLeave = async (req, res) => {
  try {
    const leaveId = req.params.LeaveID;
    const result = await sqlHelper.transact(async (txn) => {
      return await Leave.deleteLeave(
        {
          DELETED: 1,
          status: "DELETED",
        },
        { leaveId: leaveId },
        txn,
        "deletedDate",
      );

      // return await Leave.deleteLeave(sqlWhereStrArr, args, txn);
    });

    if (result.length === 0) {
      return res.status(400).json({ body: "Leave request not found" });
    }
    // else if (result.rowsAffected[0] === 0) {
    //   return res.status(404).json({ body: "Failed to delete leave request" });
    // } else if (result.rowsAffected[0] > 0) {
    //   return res.status(200).json({ body: "Success Deleting Leave" });
    // }
    return res.status(200).json({ body: "Success Deleting Leave" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete leave request" });
  }
};

const updateLeaveRequest = async (req, res) => {
  try {
    const leaveId = req.params.LeaveID;

    const { LeaveType, Days, TimeFrom, TimeTo, DateFrom, DateTo, Reason } =
      req.body;

    const employeeID = req.user.employee_id;
    // const TransDated = new Date();

    const sqlWhereStrArr = ["IDCode = ?", "leaveId = ?", "status IN (?, ?)"];

    const args = [employeeID, leaveId, "Pending", "PendingLevel2"];
    const sqlWhereStrArr2 = ["IDCode = ?", "LeaveType = ?", "status IN (?, ?)"];
    const args2 = [employeeID, LeaveType, "Pending", "PendingLevel2"];
    const sqlWhereStrArr3 = ["code = ?", "l.leaveType = ?"];
    const args3 = [employeeID, LeaveType];

    // const leaveCheck = await checkLeaveOverlap(
    //   employeeID,
    //   DateFrom,
    //   DateTo,
    //   true,
    // );

    // if (leaveCheck.hasConflict) {
    //   return res.status(400).json({
    //     body: "You have a leave with the given from date and to date.",
    //   });
    // }

    // const checkDateOfLeaveOverlap = await Leave.checkDateOfLeaveOverlap(
    //   employeeID,
    //   DateFrom,
    //   DateTo,
    //   false,
    // );

    // if (checkDateOfLeaveOverlap.length !== 0) {
    //   return res.status(400).json({
    //     error: "You have a leave with the given from date and to date.",
    //   });
    // }

    // const getSchedule = await Leave.getSchedule(employeeID);
    // let mappedSchedule = [];

    // if (getSchedule.length === 0 || getSchedule === null) {
    //   const timeFrom = "08:00:00.0000000";
    //   const timeTo = "17:00:00.0000000";
    //   mappedSchedule = [
    //     {
    //       schedId: 1,
    //       timeFrom: new Date(`1970-01-01T${timeFrom}`),
    //       timeTo: new Date(`1970-01-01T${timeTo}`),
    //     },
    //   ];
    // } else {
    //   mappedSchedule = getSchedule.map((schedule) => {
    //     const timeFrom = new Date(schedule.timeFrom);
    //     const timeTo = new Date(schedule.timeTo);
    //     timeFrom.setUTCHours(timeFrom.getUTCHours() + 8);
    //     timeTo.setUTCHours(timeTo.getUTCHours() + 8);
    //     return {
    //       schedId: schedule.schedId,
    //       timeFrom: timeFrom.toISOString(),
    //       timeTo: timeTo.toISOString(),
    //     };
    //   });
    // }

    // const formattedResult = mappedSchedule.map((item) => ({
    //   schedId: item.schedId,
    //   timeFrom: new Date(item.timeFrom).toLocaleString("en-US", {
    //     hour12: true,
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     timeZone: "UTC",
    //   }),
    //   timeTo: new Date(item.timeTo).toLocaleString("en-US", {
    //     hour12: true,
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     timeZone: "UTC",
    //   }),
    // }));

    const getSchedule = await Leave.getSchedule(employeeID, DateFrom, DateTo);
    const formattedResult = generateSchedule(getSchedule);

    // let mappedSchedule = [];

    // if (getSchedule.length === 0 || getSchedule === null) {
    //   const timeFrom = "08:00:00.0000000";
    //   const timeTo = "17:00:00.0000000";
    //   mappedSchedule = [
    //     {
    //       schedId: "DTR",
    //       timeFrom: new Date(`1970-01-01T${timeFrom}`),
    //       timeTo: new Date(`1970-01-01T${timeTo}`),
    //     },
    //   ];
    // } else {
    //   mappedSchedule = getSchedule.map((schedule) => {
    //     let timeFrom = null;
    //     let timeTo = null;
    //     if (!schedule.schedFrom && !schedule.schedTo) {
    //       const timeFrom1 = "08:00:00.0000000";
    //       const timeTo1 = "17:00:00.0000000";
    //       timeFrom = new Date(`1970-01-01T${timeFrom1}`);
    //       timeTo = new Date(`1970-01-01T${timeTo1}`);
    //     } else {
    //       timeFrom = new Date(schedule.schedFrom);
    //       timeTo = new Date(schedule.schedTo);
    //     }

    //     timeFrom.setUTCHours(timeFrom.getUTCHours() + 8);
    //     timeTo.setUTCHours(timeTo.getUTCHours() + 8);
    //     return {
    //       schedId: "DTR",
    //       timeFrom: timeFrom.toISOString(),
    //       timeTo: timeTo.toISOString(),
    //     };
    //   });
    // }

    // const formattedResult = mappedSchedule.map((item) => ({
    //   schedId: item.schedId,
    //   timeFrom: new Date(item.timeFrom).toLocaleString("en-US", {
    //     hour12: true,
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     timeZone: "UTC",
    //   }),
    //   timeTo: new Date(item.timeTo).toLocaleString("en-US", {
    //     hour12: true,
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     timeZone: "UTC",
    //   }),
    // }));

    let success = false;

    if (
      LeaveType === "SL" ||
      LeaveType === "VL" ||
      LeaveType === "BL" ||
      LeaveType === "EL" ||
      LeaveType === "MC" ||
      LeaveType === "ML" ||
      LeaveType === "OL" ||
      LeaveType === "PARENTL" ||
      LeaveType === "UL" ||
      LeaveType === "VWC"
    ) {
      const totalValue = await Leave.calculateTotalLeaveValueInEdit(
        sqlWhereStrArr,
        args,
        sqlWhereStrArr2,
        args2,
        sqlWhereStrArr3,
        args3,
      );

      if (Days > totalValue) {
        return res
          .status(400)
          .json({ error: "Insufficient balance for LeaveType" }); // Condition: Insufficient balance for LeaveType
      }
    }

    const integerDays = Math.floor(Days);
    const fractionalDays = Days % 1;
    const TimeFromFormatted = formattedResult[0].timeFrom;
    const TimeToFormatted = formattedResult[0].timeTo;

    const getDaysDetails = await sqlHelper.transact(async (txn) => {
      return await Leave.getLeaveIdDetails(leaveId, txn);
    });
    const originalDays = getDaysDetails[0].daysOfLeave;

    if (Days === "0.5") {
      success = await sqlHelper.transact(async (txn) => {
        // return await Leave.updateAndValidateLeave(
        //   leaveId,
        //   employeeID,
        //   LeaveType,
        //   Days,
        //   TimeFrom,
        //   TimeTo,
        //   DateFrom,
        //   DateTo,
        //   Reason,
        //   edited,
        //   TransDated,
        //   txn,
        // );
        if (LeaveType === "LWOP") {
          return await Leave.updateAndValidateLeave(
            {
              daysOfLeave: Days,
              TIME_FROM: TimeFrom,
              TIME_TO: TimeTo,
              DateLeavedFrom: DateFrom,
              DateLeavedTo: DateTo,
              reasonForLeave: Reason,
              LeaveType: LeaveType,
              Remarks: Reason,
              LeaveWOPay: Days,
            },
            { leaveId: leaveId, IDCode: employeeID },
            txn,
            "TransDate",
          );
        } else {
          return await Leave.updateAndValidateLeave(
            {
              daysOfLeave: Days,
              TIME_FROM: TimeFrom,
              TIME_TO: TimeTo,
              DateLeavedFrom: DateFrom,
              DateLeavedTo: DateTo,
              reasonForLeave: Reason,
              LeaveType: LeaveType,
              Remarks: Reason,
            },
            { leaveId: leaveId, IDCode: employeeID },
            txn,
            "TransDate",
          );
        }
      });
    } else if (Days != originalDays) {
      if (integerDays > 0) {
        success = await sqlHelper.transact(async (txn) => {
          const adjustedDateFrom = new Date(`${DateFrom} GMT`);
          const adjustedDateTo = new Date(`${DateFrom} GMT`);
          adjustedDateTo.setDate(adjustedDateTo.getDate() + integerDays - 1);

          // return await Leave.updateAndValidateLeave(
          //   leaveId,
          //   employeeID,
          //   LeaveType,
          //   integerDays,
          //   TimeFromFormatted,
          //   TimeToFormatted,
          //   adjustedDateFrom,
          //   adjustedDateTo,
          //   Reason,
          //   edited,
          //   TransDated,
          //   txn,
          // );
          if (LeaveType === "LWOP") {
            return await Leave.updateAndValidateLeave(
              {
                daysOfLeave: Days,
                TIME_FROM: TimeFromFormatted,
                TIME_TO: TimeToFormatted,
                DateLeavedFrom: adjustedDateFrom,
                DateLeavedTo: adjustedDateTo,
                reasonForLeave: Reason,
                LeaveType: LeaveType,
                Remarks: Reason,
                LeaveWOPay: Days,
              },
              { leaveId: leaveId, IDCode: employeeID },
              txn,
              "TransDate",
            );
          } else {
            return await Leave.updateAndValidateLeave(
              {
                daysOfLeave: Days,
                TIME_FROM: TimeFromFormatted,
                TIME_TO: TimeToFormatted,
                DateLeavedFrom: adjustedDateFrom,
                DateLeavedTo: adjustedDateTo,
                reasonForLeave: Reason,
                LeaveType: LeaveType,
                Remarks: Reason,
              },
              { leaveId: leaveId, IDCode: employeeID },
              txn,
              "TransDate",
            );
          }
        });
      }
      if (fractionalDays > 0) {
        success = await sqlHelper.transact(async (txn) => {
          const currentDate = new Date().getFullYear();
          const leaveIdLedger = await Leave.generateLeaveId(txn);
          const adjustedDateFrom = new Date(`${DateTo} GMT`);
          const adjustedDateTo = new Date(`${DateTo} GMT`);
          return await Leave.createLeaveRequest(
            {
              IDCode: employeeID,
              DateLeavedFrom: adjustedDateFrom,
              DateLeavedTo: adjustedDateTo,
              TIME_FROM: TimeFrom,
              TIME_TO: TimeTo,
              Remarks: Reason,
              LeaveType: LeaveType,
              reasonForLeave: Reason,
              LeaveWOPay: fractionalDays,
              daysOfLeave: fractionalDays,
              itemType: `FILED-${LeaveType}-${currentDate}`,
              status: "Pending",
              leaveId: leaveIdLedger,
              EarnedDays: 0,
              EarnedHours: 0,
            },
            txn,
            "TransDate",
          );
        });
      }
    } else {
      success = await sqlHelper.transact(async (txn) => {
        if (LeaveType === "LWOP") {
          return await Leave.updateAndValidateLeave(
            {
              daysOfLeave: Days,
              TIME_FROM: TimeFromFormatted,
              TIME_TO: TimeToFormatted,
              DateLeavedFrom: DateFrom,
              DateLeavedTo: DateTo,
              reasonForLeave: Reason,
              LeaveType: LeaveType,
              Remarks: Reason,
              LeaveWOPay: Days,
            },
            { leaveId: leaveId, IDCode: employeeID },
            txn,
            "TransDate",
          );
        } else {
          return await Leave.updateAndValidateLeave(
            {
              daysOfLeave: Days,
              TIME_FROM: TimeFromFormatted,
              TIME_TO: TimeToFormatted,
              DateLeavedFrom: DateFrom,
              DateLeavedTo: DateTo,
              reasonForLeave: Reason,
              LeaveType: LeaveType,
              Remarks: Reason,
            },
            { leaveId: leaveId, IDCode: employeeID },
            txn,
            "TransDate",
          );
        }
        // return await Leave.updateAndValidateLeave(
        //   leaveId,
        //   employeeID,
        //   LeaveType,
        //   Days,
        //   TimeFromFormatted,
        //   TimeToFormatted,
        //   DateFrom,
        //   DateTo,
        //   Reason,
        //   edited,
        //   TransDated,
        //   txn,
        // );
      });
    }

    if (!success) {
      return res.status(500).json({ error: "Failed to update leave request" });
    }

    return res
      .status(201)
      .json({ body: "Leave request(s) created successfully", success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" }); // Condition: Internal server error
  }
};

const cancelLeave = async (req, res) => {
  try {
    const leaveId = req.body.LeaveID.toString();
    const reason = req.body.reason;
    const employeeId = req.user.employee_id;
    const currentDate = new Date();
    const hrModule = req.body.hrModule;

    // const verify = await Leave.verifyLevelCreate(employeeId);
    const getDetails = await Leave.getLeaveIdDetails(leaveId);
    const condition1 = getDetails[0].approvedByLevel1;
    const condition2 = getDetails[0].approvedByLevel2;

    let result = null; // Initialize result variable

    if (
      (condition1 === null && condition2 === null) ||
      (condition1 !== null && condition2 === null) ||
      hrModule === true
    ) {
      result = await sqlHelper.transact(async (txn) => {
        // Assign result directly
        return await Leave.cancelLeave(
          {
            status: "CANCELLED",
            cancelled: 1,
            reasonForCancel: reason,
            UserID: employeeId,
            cancelledStatusOrig: "Approved",
            cancelledByLevel1: employeeId,
            cancelledByLevel1DateTime: currentDate,
            cancelledByLevel2: employeeId,
            cancelledByLevel2DateTime: currentDate,
          },
          { leaveId: leaveId },
          txn,
          "cancelledDate",
        );
      });
    } else {
      // let verifyLevel1 = false;
      // let verifyLevel2 = false;
      // let verifyLevel1and2 = false;

      const resultLevel = await Leave.verifyLevelCreate(employeeId);

      // resultLevel.map((row) => {
      //   row.iDCode = employeeId;
      // });

      // const resultOneAndTwo = filterRequestDetailsCreate(resultLevel);

      const finalVerification = processVerificationLevels(
        resultLevel,
        employeeId,
      );

      const { verifyLevel2 } = finalVerification;

      // if (resultOneAndTwo.length === 0) {
      //   verifyLevel1 = true;
      //   verifyLevel2 = true;
      // } else {
      //   for (const row of resultOneAndTwo) {
      //     if (
      //       row.lvl !== null ||
      //       row.lvl !== undefined ||
      //       row.lvl.length !== 0
      //     ) {
      //       if (row.lvl === 1) {
      //         verifyLevel1 = true;
      //       } else if (row.lvl === 2) {
      //         verifyLevel2 = true;
      //       }
      //     }
      //   }
      // }

      // if (verifyLevel1 && verifyLevel2) {
      //   verifyLevel1and2 = true;
      //   verifyLevel1 = false;
      //   verifyLevel2 = false;
      // }

      if (verifyLevel2 === true) {
        result = await sqlHelper.transact(async (txn) => {
          return await Leave.cancelLeave(
            {
              status: "CANCELLED",
              cancelled: 1,
              reasonForCancel: reason,
              UserID: employeeId,
              cancelledStatusOrig: "PendingLevel2",
              cancelledByLevel1: "0000",
              cancelledByLevel1DateTime: currentDate,
            },
            { leaveId: leaveId },
            txn,
            "cancelledDate",
          );
        });
      } else {
        result = await sqlHelper.transact(async (txn) => {
          return await Leave.cancelLeave(
            {
              status: "CANCELLED",
              cancelled: 1,
              reasonForCancel: reason,
              UserID: employeeId,
              cancelledStatusOrig: "Pending",
            },
            { leaveId: leaveId },
            txn,
            "cancelledDate",
          );
        });
      }
    }

    if (!result) {
      // Check if result is null
      return res.status(400).json({ error: "Leave request not found" });
    } else {
      return res.status(200).json({ body: "Success Cancel of Leave" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed to cancel leave request" });
  }
};

const cancelPending = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    // const sqlWhereStrArr = ["code = ?"];
    // const args = [employeeId];

    const checkEmployeeToApprove =
      await Leave.checkEmployeeToApprove(employeeId);

    const lvl1DeptCodes = [];
    const lvl2DeptCodes = [];
    const userHasLevel1 = checkEmployeeToApprove.some(
      (entry) => entry.lvl === 1,
    );
    const userHasLevel2 = checkEmployeeToApprove.some(
      (entry) => entry.lvl === 2,
    );
    const employeeCodesLevel1 = [];
    const employeeCodesLevel2 = [];

    for (const toApprove of checkEmployeeToApprove) {
      if (toApprove.employeeCodes && Number(toApprove.lvl) === 1) {
        employeeCodesLevel1.push(...toApprove.employeeCodes.split(","));
        continue;
      }

      if (toApprove.employeeCodes && Number(toApprove.lvl) === 2) {
        employeeCodesLevel2.push(...toApprove.employeeCodes.split(","));
        continue;
      }

      if (Number(toApprove.lvl) === 1) {
        if (!lvl1DeptCodes.includes(toApprove.deptCode))
          lvl1DeptCodes.push(toApprove.deptCode);
      }

      if (Number(toApprove.lvl) === 2) {
        if (!lvl2DeptCodes.includes(toApprove.deptCode))
          lvl2DeptCodes.push(toApprove.deptCode);
      }
    }

    let success = await Leave.getCancelPending(
      employeeCodesLevel1,
      employeeCodesLevel2,
      lvl1DeptCodes,
      lvl2DeptCodes,
      userHasLevel1,
      userHasLevel2,
    );

    if (success) {
      success = success.map((row) => {
        row.timeFrom = util.formatDate({ date: row.tIME_FROM, timeOnly: true });
        row.timeTo = util.formatDate({ date: row.tIME_TO, timeOnly: true });
        return row;
      });
      res.status(200).json(success);
    } else {
      return res.status(400).json({ error: "No Leave Details" });
    }
  } catch (error) {
    console.error("Failed to fetch pending cancel leave");
  }
};

const adminCancelAction = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const leaveIds = req.body.LeaveID;
    const Status = req.body.Status;
    const reason = req.body.reason;
    const currentDate = new Date();
    const result = [];

    for (const leaveId of leaveIds) {
      const checkLevelStatusQuery = await Leave.checkLevelStatusCancel(leaveId);
      const checkLevelStatus = filterRequestDetailsCreate(
        checkLevelStatusQuery,
      );
      const checkStatus = checkLevelStatus[0];
      if (
        checkStatus.approvedByLevel1 !== null &&
        checkStatus.approvedByLevel2 !== null &&
        checkStatus.ledgerId !== null
      ) {
        if (
          checkStatus.cancelledByLevel1 === null &&
          checkStatus.cancelledByLevel2 === null
        ) {
          const rowsAffected = await sqlHelper.transact(async (txn) => {
            if (Status === "Approved") {
              const resultArray = [];

              if (!checkLevelStatus.some((level) => level.lvl === 2)) {
                const checkYearAttributed =
                  await Leave.checkYearAttributedCancel(checkStatus.leaveId);
                checkYearAttributed.sort((a, b) => a.year - b.year);

                for (const year of checkYearAttributed) {
                  const yearAttributed = year.year;
                  const daysOfLeave = year.daysOfLeave;
                  const codeReq = checkStatus.iDCode;
                  const leaveTypeReq = checkStatus.leaveType;
                  const daysOfLeaveReq = daysOfLeave;
                  const referenceNoReq = checkStatus.leaveId;
                  const remarksReq = "REVERSAL:CANCELLED APPROVED LEAVED";
                  const itemTypeReq = "CANCELLED";
                  const yearEffectivityReq = new Date().getFullYear();
                  const yearAttributedReq = yearAttributed;
                  const insertLeaveLedger = await Leave.insertLeaveLedger(
                    {
                      Code: codeReq,
                      Remarks: remarksReq,
                      LeaveType: leaveTypeReq,
                      ITEMTYPE: itemTypeReq,
                      ReferenceNo: referenceNoReq,
                      YearEffectivity: yearEffectivityReq,
                      yearAttributed: yearAttributedReq,
                      Debit: daysOfLeaveReq,
                    },
                    txn,
                    "TransDate",
                  );
                  const update = await Leave.updateLegerIdVSL(
                    {
                      status: insertLeaveLedger.iTEMTYPE,
                      cancelledByLevel1: employeeId,
                      cancelledByLevel1DateTime: currentDate,
                      cancelledByLevel2: employeeId,
                      cancelledByLevel2DateTime: currentDate,
                      cancelledStatusOrig: "Approved",
                      UserID: employeeId,
                      "[HEAD APPROVED]": 1,
                      "[HEAD APPROVE BY]": employeeId,
                      "[HEAD APPROVE DATE]": currentDate,
                      hrReceived: 1,
                      hrReceiveDate: currentDate,
                    },
                    { leaveId: leaveId },
                    txn,
                    "cancelledDate",
                  );
                  resultArray.push(update);
                }
                return resultArray;
              } else {
                return await Leave.updateLeaveAction(
                  {
                    status: "CANCELLED",
                    cancelledStatusOrig: "PendingLevel2",
                    cancelledByLevel1: employeeId,
                    UserID: employeeId,
                    "[HEAD APPROVED]": 1,
                    "[HEAD APPROVE BY]": employeeId,
                    "[HEAD APPROVE DATE]": currentDate,
                    hrReceived: 1,
                    hrReceiveDate: currentDate,
                  },
                  { leaveId: leaveId },
                  txn,
                  "cancelledByLevel1DateTime",
                );
              }
            } else {
              return await Leave.updateLeaveAction(
                {
                  status: "CANCELLED",
                  cancelRejectedByLevel1: employeeId,
                  UserID: employeeId,
                  reasonForRejection: reason,
                  cancelledStatusOrig: "RejectedByLevel1",
                  "[HEAD APPROVED]": 1,
                  "[HEAD APPROVE BY]": employeeId,
                  "[HEAD APPROVE DATE]": currentDate,
                  hrReceived: 1,
                  hrReceiveDate: currentDate,
                },
                { leaveId: leaveId },
                txn,
                "cancelRejectedByLevel1DateTime",
              );
            }
          });
          if (rowsAffected.error) {
            return res.status(405).json({
              body: "Error in approving or rejecting the cancelation leave",
            });
          } else {
            result.push(rowsAffected);
          }
        } else if (
          checkStatus.cancelledByLevel1 !== null &&
          checkStatus.cancelledStatusOrig === "PendingLevel2" &&
          checkStatus.cancelledByLevel2 === null
        ) {
          const rowsAffected = await sqlHelper.transact(async (txn) => {
            if (Status === "Approved") {
              let resultArray = [];
              const checkYearAttributed = await Leave.checkYearAttributedCancel(
                checkStatus.leaveId,
              );

              if (checkYearAttributed.length === 0) {
                return (resultArray = []);
              }
              checkYearAttributed.sort((a, b) => a.year - b.year);
              for (const year of checkYearAttributed) {
                const yearAttributed = year.year;
                const daysOfLeave = year.daysOfLeave;
                const codeReq = checkStatus.iDCode;
                const leaveTypeReq = checkStatus.leaveType;
                const daysOfLeaveReq = daysOfLeave;
                const referenceNoReq = checkStatus.leaveId;
                const remarksReq = "REVERSAL:CANCELLED APPROVED LEAVED";
                const itemTypeReq = "CANCELLED";
                const yearEffectivityReq = new Date().getFullYear();
                const yearAttributedReq = yearAttributed;
                const insertLeaveLedger = await Leave.insertLeaveLedger(
                  {
                    Code: codeReq,
                    Remarks: remarksReq,
                    LeaveType: leaveTypeReq,
                    ITEMTYPE: itemTypeReq,
                    ReferenceNo: referenceNoReq,
                    YearEffectivity: yearEffectivityReq,
                    yearAttributed: yearAttributedReq,
                    Debit: daysOfLeaveReq,
                  },
                  txn,
                  "TransDate",
                );
                const update = await Leave.updateLegerIdVSL(
                  {
                    status: insertLeaveLedger.iTEMTYPE,
                    cancelledByLevel2: employeeId,
                    cancelledByLevel2DateTime: currentDate,
                    cancelledStatusOrig: "Approved",
                    UserID: employeeId,
                    "[HEAD APPROVED]": 1,
                    "[HEAD APPROVE BY]": employeeId,
                    "[HEAD APPROVE DATE]": currentDate,
                    hrReceived: 1,
                    hrReceiveDate: currentDate,
                  },
                  { leaveId: leaveId },
                  txn,
                  "cancelledDate",
                );
                resultArray.push(update);
              }
              return resultArray;
            } else {
              return await Leave.updateLeaveAction(
                {
                  status: "CANCELLED",
                  cancelRejectedByLevel2: employeeId,
                  UserID: employeeId,
                  reasonForRejection: reason,
                  cancelledStatusOrig: "RejectedByLevel2",
                  "[HEAD APPROVED]": 1,
                  "[HEAD APPROVE BY]": employeeId,
                  "[HEAD APPROVE DATE]": currentDate,
                  hrReceived: 1,
                  hrReceiveDate: currentDate,
                },
                { leaveId: leaveId },
                txn,
                "cancelRejectedByLevel2DateTime",
              );
            }
          });
          if (rowsAffected.error) {
            return res.status(405).json({
              body: "Error in approving or rejecting the cancelation leave",
            });
          } else {
            result.push(rowsAffected);
          }
        } else {
          return res.status(405).json({ body: "No Records found" });
        }
      } else {
        return res.status(405).json({ body: "No Records found" });
      }
    }

    return res
      .status(200)
      .json({ body: "Success approving the cancelation of leave request" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update leave request" });
  }
};

const getRejectedCancelLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;

    const sqlWhereStrArr = ["code = ? AND deleted != 1"];
    const args = [employeeId];
    const sqlWhereStrArr2 = [
      "LI.cancelledStatusOrig IN (?, ?)",
      "TIME_FROM IS NOT NULL",
      "TIME_TO IS NOT NULL",
      "DateLeavedFrom IS NOT NULL",
      "DateLeavedTo IS NOT NULL",
      "(cancelRejectedByLevel1 IS NOT NULL OR cancelRejectedByLevel2 IS NOT NULL)",
      "LI.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args2 = ["RejectedByLevel1", "RejectedByLevel2"];

    let rejectedLeaves = await Leave.getRejectedCancelLeaves(
      sqlWhereStrArr,
      args,
      sqlWhereStrArr2,
      args2,
    );

    if (rejectedLeaves) {
      rejectedLeaves = dateHelper(rejectedLeaves);
    }

    res.status(200).json(rejectedLeaves);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve rejected leave" });
  }
};

const getApprovedCancelLeaves = async (req, res) => {
  try {
    const employeeID = req.user.employee_id;
    const sqlWhereStrArr = ["code = ? AND deleted != 1"];
    const args = [employeeID];
    const sqlWhereStrArr2 = [
      "LI.cancelledStatusOrig = ?",
      "TIME_FROM IS NOT NULL",
      "TIME_TO IS NOT NULL",
      "DateLeavedFrom IS NOT NULL",
      "DateLeavedTo IS NOT NULL",
      "cancelledByLevel1 IS NOT NULL",
      "cancelledByLevel2 IS NOT NULL",
      "LI.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args2 = ["Approved"];

    let approvedLeave = await Leave.getApprovedCancelLeaves(
      sqlWhereStrArr,
      args,
      sqlWhereStrArr2,
      args2,
    );

    if (approvedLeave) {
      approvedLeave = dateHelper(approvedLeave);
    }

    res.status(200).json(approvedLeave);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve approved leave" });
  }
};

const getUserApprovedLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const sqlWhereStrArr = [
      "(v.approvedByLevel1 = ? OR v.approvedByLevel2 = ?) AND v.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args = [employeeId, employeeId];

    let userApproved = await Leave.getUserApprovedLeaves(sqlWhereStrArr, args);

    if (userApproved) {
      userApproved = dateHelper(userApproved);
    }

    return res.status(200).json(userApproved);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserRejectedLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const sqlWhereStrArr = [
      "(v.rejectedByLevel1 = ? OR v.rejectedByLevel2 = ?) AND v.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args = [employeeId, employeeId];

    let userRejected = await Leave.getUserRejectedLeaves(sqlWhereStrArr, args);

    if (userRejected) {
      userRejected = dateHelper(userRejected);
    }
    return res.status(200).json(userRejected);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCancelApprovedLeave = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const sqlWhereStrArr = [
      "(v.cancelledByLevel1 = ? OR v.cancelledByLevel2 = ?) AND v.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args = [employeeId, employeeId];
    let userCancelApproved = await Leave.getUserCancelApprovedLeaves(
      sqlWhereStrArr,
      args,
    );

    if (userCancelApproved) {
      userCancelApproved = dateHelper(userCancelApproved);
    }

    return res.status(200).json(userCancelApproved);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCancelRejectedLeave = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const sqlWhereStrArr = [
      "(v.cancelRejectedByLevel1 = ? OR v.cancelRejectedByLevel2 = ?) AND v.DateLeavedFrom >= DATEADD(YEAR, -3, GETDATE())",
    ];
    const args = [employeeId, employeeId];
    let userCancelRejected = await Leave.getUserCancelRejectedLeaves(
      sqlWhereStrArr,
      args,
    );

    if (userCancelRejected) {
      userCancelRejected = dateHelper(userCancelRejected);
    }

    return res.status(200).json(userCancelRejected);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getApproversDetails = async (req, res) => {
  try {
    let employeeId = null;
    if (req.body.employeeId) {
      employeeId = req.body.employeeId;
    } else {
      employeeId = req.user.employee_id;
    }

    const result = await Leave.getApproversDetails(employeeId);

    // console.log(result);

    // const hasMatch = result.some(
    //   (item) => item.employeeCode === item.approversCode,
    // );
    // let filteredResult;
    // if (hasMatch) {
    //   filteredResult = result.filter((item) => item.lvl === 2);
    // } else {
    //   filteredResult = result;
    // }

    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getLeaveTypes = async (req, res) => {
  try {
    const result = await Leave.getLeaveTypes();
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getEmployeeDetails = async (req, res) => {
  try {
    const { activeStatus, employeeId, lastName, firstName } = req.query;
    const searchDetails = employeeId
      ? employeeId
      : lastName
        ? lastName
        : firstName;

    const result = await Leave.getEmployeeDetails(searchDetails, activeStatus);
    if (result) {
      result.leaveDetails = result.leaveDetails.map((row) => {
        row.timeFrom = util.formatDate({ date: row.tIME_FROM, timeOnly: true });
        row.timeTo = util.formatDate({ date: row.tIME_TO, timeOnly: true });
        return row;
      });
      res.status(200).json(result);
    } else {
      return res.status(400).json({ error: "No Leave Details" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getApproverWithEmployees = async (req, res) => {
  try {
    const result = await Leave.getApproverWithEmployees();

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No approvers found." });
    }

    const groupedResult = new Map(); // Use Map for faster lookups
    const allEmployeeCodes = new Set(); // Use Set to avoid duplicates

    for (const curr of result) {
      const {
        code,
        approverName,
        approverDeptCode,
        approverDeptDescription,
        approverPosition,
        deptCode,
        deptDescription,
        lvl,
        employeeCodes,
      } = curr;

      // Ensure approver exists in groupedResult
      if (!groupedResult.has(code)) {
        groupedResult.set(code, {
          code,
          approverName,
          approverDeptCode,
          approverDeptDescription,
          approverPosition,
          departments: new Map(), // Use Map for departments to prevent .find()
        });
      }

      const approver = groupedResult.get(code);

      // Ensure department exists in approver's departments
      if (!approver.departments.has(deptCode)) {
        approver.departments.set(deptCode, {
          deptCode,
          deptDescription,
          lvl,
          employeesToApprove: [],
        });
      }

      const department = approver.departments.get(deptCode);

      if (employeeCodes?.trim()) {
        const employeeArray = employeeCodes.split(",").map((empCode) => {
          const trimmedEmpCode = empCode.trim();
          allEmployeeCodes.add(trimmedEmpCode); // Collect unique employee codes
          return { employeeCode: trimmedEmpCode, lvl };
        });

        department.employeesToApprove.push(...employeeArray);
      }
    }

    // Fetch employee details in one query
    let employeeDetails = [];
    if (allEmployeeCodes.size > 0) {
      employeeDetails = await Leave.getEmployeeToApproveDetails([
        ...allEmployeeCodes,
      ]);
    }

    // Map employee details for fast lookup
    const employeeMap = new Map(
      employeeDetails.map((data) => [
        data.code,
        { fullName: data.fullName, position: data.position },
      ]),
    );

    // Assign employee details
    for (const approver of groupedResult.values()) {
      for (const department of approver.departments.values()) {
        for (const employee of department.employeesToApprove) {
          const details = employeeMap.get(employee.employeeCode) || {
            fullName: null,
            position: null,
          };
          Object.assign(employee, details);
        }
      }
      // Convert department map to array
      approver.departments = [...approver.departments.values()];
    }

    return res.status(200).json([...groupedResult.values()]);
  } catch (error) {
    console.error("Error retrieving approver with employees:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const removeEmployeeToApprove = async (req, res) => {
  const { approverCode, employeeCode, lvl, deptCode } = req.body;
  const updater = req.user.employee_id;

  const result = await Leave.getDetailsEmployeeCodes(
    approverCode,
    employeeCode,
    lvl,
    deptCode,
  );

  if (!result || result.length === 0) {
    return res.status(404).json({ message: "Approver or employee not found." });
  }

  const { id, employeeCodes } = result[0];

  let employeeCodeArray = employeeCodes.split(",").map((code) => code.trim());
  employeeCodeArray = employeeCodeArray.filter((code) => code !== employeeCode);
  const updatedEmployeeCodes = employeeCodeArray.join(",");

  let update = null;

  if (updatedEmployeeCodes.length === 0) {
    update = await sqlHelper.transact(async (txn) => {
      return await Leave.updateEmployeeToApprove(
        {
          deleted: 1,
          employeeCodes: null,
          updatedBy: updater,
        },
        { id: id },
        txn,
        "updatedDate",
      );
    });
  } else {
    update = await sqlHelper.transact(async (txn) => {
      return await Leave.updateEmployeeToApprove(
        {
          employeeCodes: updatedEmployeeCodes,
          updatedBy: updater,
        },
        { id: id },
        txn,
        "updatedDate",
      );
    });
  }

  if (update.affectedRows === 0) {
    return res
      .status(400)
      .json({ message: "Failed to update employee codes." });
  }

  return res
    .status(200)
    .json({ message: "Employee code removed successfully." });
};

const getActiveEmployees = async (req, res) => {
  const { deptCode, approverCode } = req.body;
  const activeEmployee = true;
  const lvl = null;
  const employeeCode = null;
  const byEmployeeCodes = false;

  const hrApprover = await Leave.getHRApproveDetails(
    approverCode,
    deptCode,
    lvl,
    employeeCode,
    activeEmployee,
    byEmployeeCodes,
  );

  const result = await Leave.getActiveEmployees(deptCode);

  if (!result) return res.status(500).json(null);

  let hrEmployeeCodes = [];
  if (hrApprover && hrApprover.length > 0) {
    hrEmployeeCodes = hrApprover.flatMap((approver) => {
      if (approver.employeeCodes) {
        return approver.employeeCodes
          .split(",")
          .map((code) => code.trim())
          .filter((code) => code);
      }
      return [];
    });
  }

  const exclusionList = [...hrEmployeeCodes, approverCode];

  const filteredResult = result.filter(
    (employee) =>
      employee.employeeCode !== approverCode &&
      !exclusionList?.includes(employee.employeeCode),
  );

  return res.status(200).json(filteredResult);
};

const getAllDepartment = async (req, res) => {
  const result = await Leave.getAllDepartment();
  if (!result) return res.status(500).json(null);
  return res.status(200).json(result);
};

const updateHRApprover = async (
  approverCode,
  deptCode,
  lvl,
  employeeCodes,
  updater,
) => {
  return await sqlHelper.transact(async (txn) => {
    return await Leave.insertHrApprover(
      {
        code: approverCode,
        deptCode: deptCode,
        lvl: lvl,
        employeeCodes: employeeCodes,
        createdBy: updater,
        deleted: 0,
      },
      txn,
      "createDate",
    );
  });
};

const updateToApprove = async (req, res) => {
  const { deptCode, lvl, employeeCodes, approverCode } = req.body;
  const updater = req.user.employee_id;
  const employeeCodesArray = employeeCodes
    .split(",")
    .map((code) => code.trim());

  const byEmployeeCodes = true;
  const activeEmployee = false;
  let result = null;
  let currEmployeeCode = null;
  for (const employeeCode of employeeCodesArray) {
    currEmployeeCode = employeeCode;
    result = await Leave.getHRApproveDetails(
      approverCode,
      deptCode,
      lvl,
      employeeCode,
      activeEmployee,
      byEmployeeCodes,
    );

    if (result.length > 0) {
      break;
    }
  }

  if (result && result.length > 0) {
    return res.status(422).json({
      body: `The Employee: ${currEmployeeCode} has a approver with the same approver: ${result[0].code} by level: ${result[0].lvl}`,
    });
  } else {
    const activeEmployee = false;
    const employeeCode = null;
    const byEmployeeCodes = false;

    const hrApprover = await Leave.getHRApproveDetails(
      approverCode,
      deptCode,
      lvl,
      employeeCode,
      activeEmployee,
      byEmployeeCodes,
    );

    if (hrApprover.length > 0) {
      let updateInsert = [];

      const hrEmployeeCodesArray = hrApprover[0].employeeCodes
        ? hrApprover[0].employeeCodes.split(",").map((code) => code.trim())
        : [];
      const combinedEmployeeCodes = [
        ...new Set([...hrEmployeeCodesArray, ...employeeCodesArray]),
      ];

      const employeeCodesUpdate = combinedEmployeeCodes.join(",");

      updateInsert = await sqlHelper.transact(async (txn) => {
        return await Leave.updateEmployeeToApprove(
          {
            employeeCodes: employeeCodesUpdate,
            updatedBy: updater,
          },
          { id: hrApprover[0].id },
          txn,
          "updatedDate",
        );
      });

      if (updateInsert.length === 0) {
        return res
          .status(400)
          .json({ message: "Failed to update employee codes." });
      }
    } else {
      const insert = await updateHRApprover(
        approverCode,
        deptCode,
        lvl,
        employeeCodes,
        updater,
      );
      // const insert = await sqlHelper.transact(async (txn) => {
      //   return await Leave.insertHrApprover(
      //     {
      //       code: approverCode,
      //       deptCode: deptCode,
      //       lvl: lvl,
      //       employeeCodes: employeeCodes,
      //       createdBy: updater,
      //       deleted: 0,
      //     },
      //     txn,
      //     "createDate",
      //   );
      // });
      if (insert.length === 0) {
        return res
          .status(400)
          .json({ message: "Failed to update employee codes." });
      }
    }
  }

  res.status(200).json({ message: "Processing complete", result });
};

const addingApprover = async (req, res) => {
  const { departmentCode, employeeCodes, lvl, approverCode } = req.body;
  const assignBy = req.user.employee_id;

  const checkAccess = await Leave.checkAccess(approverCode);

  if (checkAccess.length === 0 || !checkAccess) {
    await sqlHelper.transact(async (txn) => {
      await Leave.insertAccessRight(
        {
          AppId: "2098",
          code: approverCode,
          systemName: "Employee Portal",
          moduleName: "Leave Approver",
          assignBy: assignBy,
          deleteDate: null,
          deleteBy: null,
        },
        txn,
        "assignDate",
      );
    });
  }

  const updater = req.user.employee_id;
  const employeeCodesArray = employeeCodes
    .split(",")
    .map((code) => code.trim());

  const byEmployeeCodes = true;
  const activeEmployee = false;
  let result = null;
  let currEmployeeCode = null;
  for (const employeeCode of employeeCodesArray) {
    currEmployeeCode = employeeCode;
    result = await Leave.getHRApproveDetails(
      approverCode,
      departmentCode,
      lvl,
      employeeCode,
      activeEmployee,
      byEmployeeCodes,
    );

    if (result.length > 0) {
      break;
    }
  }

  if (result && result.length > 0) {
    return res.status(422).json({
      body: `The Employee: ${currEmployeeCode} has a approver with the same approver: ${result[0].code} by level: ${result[0].lvl}`,
    });
  } else {
    const check = await Leave.checkApproverInApprovers(
      approverCode,
      departmentCode,
      lvl,
    );

    const hrEmployeeCodesArray =
      check[0] && check[0].employeeCodes
        ? check[0].employeeCodes.split(",").map((code) => code.trim())
        : [];

    const combinedEmployeeCodes = [
      ...new Set([...hrEmployeeCodesArray, ...employeeCodesArray]),
    ];

    const employeeCodesUpdate = combinedEmployeeCodes.join(",");

    let updateInsert = [];

    if (check.length > 0) {
      updateInsert = await sqlHelper.transact(async (txn) => {
        return await Leave.updateEmployeeToApprove(
          {
            employeeCodes: employeeCodesUpdate,
            updatedBy: updater,
            deleted: 0,
          },
          { id: check[0].id },
          txn,
          "updatedDate",
        );
      });
    } else {
      updateInsert = await sqlHelper.transact(async (txn) => {
        return await Leave.insertHrApprover(
          {
            code: approverCode,
            deptCode: departmentCode,
            lvl: lvl,
            employeeCodes: employeeCodes,
            createdBy: updater,
            deleted: 0,
          },
          txn,
          "createDate",
        );
      });
    }

    if (updateInsert.length === 0) {
      return res
        .status(400)
        .json({ message: "Failed to update employee codes." });
    }
  }

  return res.status(200).json({ body: "Success adding approver" });
};

const removingApprover = async (req, res) => {
  const { approverCode, departments } = req.body;
  const updater = req.user.employee_id;
  for (const department of departments) {
    const deptCode = department.deptCode;
    const lvl = department.lvl;

    const update = await sqlHelper.transact(async (txn) => {
      return await Leave.removingApproverDepartment(
        {
          deleted: 1,
          updatedBy: updater,
        },
        {
          code: approverCode,
          deptCode: deptCode,
          lvl: lvl,
        },
        txn,
        "updatedDate",
      );
    });

    if (update.length === 0) {
      return res.status(400).json({ body: "Failed to update employee codes." });
    }
  }

  return res.status(200).json({ body: "Success removing approver" });
};

const removeDepartment = async (req, res) => {
  const { approverCode, deptCode } = req.body;
  const updater = req.user.employee_id;

  const update = await sqlHelper.transact(async (txn) => {
    return await Leave.removingApproverDepartment(
      {
        deleted: 1,
        updatedBy: updater,
      },
      {
        code: approverCode,
        deptCode: deptCode,
      },
      txn,
      "updatedDate",
    );
  });

  if (update.length === 0) {
    return removeDepartment
      .status(400)
      .json({ body: "Failed to update department to approve" });
  }
  return res
    .status(200)
    .json({ body: "Success removing department to approve" });
};

const runStoreProcedureOfLeaveApprovedButNotInLeaveLedger = async () => {
  const currentDate = new Date();
  const formattedCurrentDate = `${currentDate.getFullYear()}${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const pastFiveMonthDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 5,
    1,
  );
  const pastFiveMonth = `${pastFiveMonthDate.getFullYear()}${String(
    pastFiveMonthDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  await Leave.runSp(formattedCurrentDate, pastFiveMonth);
};

module.exports = {
  createLeaveRequest,
  updateLeaveAction,
  getLeaveDetails,
  getLeaveBalance,
  getUserLeaveBalanceDetails,
  getLeaveLedger,
  getPendingLeaves,
  getRejectedLeaves,
  getApprovedLeaves,
  deleteLeave,
  updateLeaveRequest,
  getUserApprovedLeaves,
  getUserRejectedLeaves,
  cancelLeave,
  cancelPending,
  getApproversDetails,
  adminCancelAction,
  getCancelApprovedLeave,
  getCancelRejectedLeave,
  getRejectedCancelLeaves,
  getApprovedCancelLeaves,
  getLeaveTypes,
  getEmployeeDetails,
  getApproverWithEmployees,
  removeEmployeeToApprove,
  getActiveEmployees,
  getAllDepartment,
  updateToApprove,
  addingApprover,
  removingApprover,
  removeDepartment,
  runStoreProcedureOfLeaveApprovedButNotInLeaveLedger,
  processVerificationLevels,
  filterRequestDetailsCreate,
  // sendEmailDaily,
  // processSendingEmail,
};

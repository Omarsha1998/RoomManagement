const LeaveCont = require("../controllers/leaveController");
const LeaveModel = require("../models/leaveModel");
const overtimeModel = require("../models/overtimeModel");
const sqlHelper = require("../../../helpers/sql.js");
const util = require("../../../helpers/util.js");

const createOvertime = async (
  dateFrom,
  dateTo,
  workLoad,
  workHours,
  timeFrom,
  timeTo,
  employeeCode,
  fileStatus,
  verifyLevel2,
) => {
  const currentDate = new Date();

  return await sqlHelper.transact(async (txn) => {
    return await overtimeModel.createOvertime(
      {
        EmployeeCode: employeeCode,
        DateFrom: dateFrom,
        DateTo: dateTo,
        FiledHours: workHours,
        WorkLoad: workLoad,
        TimeFrom: timeFrom,
        TimeTo: timeTo,
        Status: fileStatus,
        ApprovedByLevel1: verifyLevel2 ? "System" : null,
        ApprovedByLevel1DateTime: verifyLevel2 ? currentDate : null,
        OvertimeCreatedBy: employeeCode,
      },
      txn,
      "DateCreated",
    );
  });
};

const adjustTime = (date) => {
  const adjustedDate = new Date(date);
  adjustedDate.setUTCHours(adjustedDate.getUTCHours() + 8);
  return adjustedDate;
};

const formatTimeValue = (rawTime) => {
  const formatted = util.formatDate({
    date: rawTime,
    timeOnly: true,
  });

  if (formatted === "0:00AM") return "12:00NN";
  if (formatted === "0:00PM") return "12:00MN";

  return formatted;
};

const formatTimeFromTo = (data) => {
  return data.map((item) => {
    return {
      ...item,
      dateOfOvertime: adjustTime(item.dateOfOvertime),
      overtimeCreated: adjustTime(item.overtimeCreated),
      timeFrom: formatTimeValue(item.timeFrom),
      timeTo: formatTimeValue(item.timeTo),
      schedStartTime: formatTimeValue(item.schedStartTime),
      schedEndTime: formatTimeValue(item.schedEndTime),
      schedIn: formatTimeValue(item.schedIn),
      schedOut: formatTimeValue(item.schedOut),
      schedFrom: adjustTime(item.schedFrom),
      schedTo: adjustTime(item.schedTo),
    };
  });
};

const getOvertimeDetails = async (req, res) => {
  const employeeCode = req.user.employee_id;
  let request = await overtimeModel.getOvertimeDetails(employeeCode);
  if (request.length > 0) {
    request = await formatTimeFromTo(request);
    return res.status(200).json(request);
  }

  return res.status(200).json([]);
};

const overtimeRequest = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const { workHours, dateFrom, dateTo, timeFrom, timeTo, workLoad } = req.body;

  const resultLevel = await LeaveModel.verifyLevelCreate(employeeCode);

  const { verifyLevel2 } = LeaveCont.processVerificationLevels(resultLevel);

  const fileStatus = verifyLevel2 ? "PendingLevel2" : "Pending";

  const success = await createOvertime(
    dateFrom,
    dateTo,
    workLoad,
    workHours,
    timeFrom,
    timeTo,
    employeeCode,
    fileStatus,
    verifyLevel2,
  );

  if (!success) return res.status(500).json(null);

  res.status(200).json(success);
};

const checkEmployeeToApprove = async (employeeCode) => {
  const checkEmployeeToApprove =
    await LeaveModel.checkEmployeeToApprove(employeeCode);
  const employeeCodesToApprove = [];
  const deptCodesToApprove = [];

  const userHasLevel1 = checkEmployeeToApprove.some((entry) => entry.lvl === 1);
  const userHasLevel2 = checkEmployeeToApprove.some((entry) => entry.lvl === 2);

  for (const toApprove of checkEmployeeToApprove) {
    if (toApprove.employeeCodes) {
      employeeCodesToApprove.push(...toApprove.employeeCodes.split(","));
    }

    if (
      !deptCodesToApprove.includes(toApprove.deptCode) &&
      !toApprove.employeeCodes
    ) {
      deptCodesToApprove.push(toApprove.deptCode);
    }
  }

  const conditions = [];
  const parameters = [];

  if (employeeCodesToApprove.length > 0) {
    conditions.push(
      `o.EmployeeCode IN (${employeeCodesToApprove.map(() => "?").join(",")})`,
    );
    parameters.push(...employeeCodesToApprove);
  }

  if (deptCodesToApprove.length > 0) {
    conditions.push(
      `e.DEPT_CODE IN (${deptCodesToApprove.map(() => "?").join(",")})`,
    );
    parameters.push(...deptCodesToApprove);
  }

  if (employeeCodesToApprove.length > 0 && deptCodesToApprove.length > 0) {
    conditions.push(
      `(e.DEPT_CODE IN (${deptCodesToApprove.map(() => "?").join(",")}) AND o.EmployeeCode NOT IN (${employeeCodesToApprove.map(() => "?").join(",")}))`,
    );
    parameters.push(...deptCodesToApprove, ...employeeCodesToApprove);
  }

  return { conditions, parameters, userHasLevel1, userHasLevel2 };
};

const getPendingOvertime = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const { conditions, parameters, userHasLevel1, userHasLevel2 } =
    await checkEmployeeToApprove(employeeCode);

  let pending = await overtimeModel.getPendingOvertime(
    conditions,
    parameters,
    employeeCode,
    userHasLevel1,
    userHasLevel2,
    false,
  );

  if (pending.length > 0) {
    pending = await formatTimeFromTo(pending);
    return res.status(200).json(pending);
  }

  return res.status(200).json([]);
};

const processOvertime = async (
  data,
  approvedWorkHours,
  employeeCode,
  cancelModule = false,
  lvl1,
) => {
  const approvedByLevel2Field = cancelModule
    ? "CancelApprovedByLevel2"
    : "ApprovedByLevel2";
  const dateTimeField = cancelModule
    ? "CancelApprovedByLevel2DateTime"
    : "ApprovedByLevel2DateTime";
  const statusValue = cancelModule ? "CANCELLED" : "PendingAccomplishment";

  const updateFields = {
    ApprovedHours: parseFloat(approvedWorkHours).toFixed(2),
    Status: statusValue,
    [approvedByLevel2Field]: employeeCode,
  };

  if (lvl1) {
    const lvl1Field = cancelModule
      ? "CancelApprovedByLevel1"
      : "ApprovedByLevel1";
    const lvl1DateField = cancelModule
      ? "CancelApprovedByLevel1DateTime"
      : "ApprovedByLevel1DateTime";

    updateFields[lvl1Field] = employeeCode;
    updateFields[lvl1DateField] = new Date();
  }

  return await sqlHelper.transact(async (txn) => {
    return await overtimeModel.updateOvertimeAction(
      updateFields,
      { OtId: data.otId },
      txn,
      dateTimeField,
    );
  });
};

const handleOvertimeApproval = async (
  data,
  employeeCode,
  Status,
  reason,
  cancelModule = false,
) => {
  const arrayOfMessages = [];

  const { overtimeId, workHours } = data;

  const checkOvertimeStatus = await overtimeModel.checkLevelStatus(
    overtimeId,
    cancelModule,
  );
  const checkLevelStatus =
    LeaveCont.filterRequestDetailsCreate(checkOvertimeStatus);
  const verifyLevel = await LeaveModel.verifyLevel(employeeCode);

  if (checkLevelStatus.length === 0) {
    return {
      status: 400,
      message:
        "Please report to HRD to verify the department of the employee you approved.",
    };
  }

  const checkStatus = checkLevelStatus[0];

  const approvedByLevel1Field = cancelModule
    ? "CancelApprovedByLevel1"
    : "ApprovedByLevel1";

  const mappedStatus = {
    Pending: cancelModule ? "PendingCancel" : "Pending",
    PendingLevel2: cancelModule ? "PendingCancelLevel2" : "PendingLevel2",
    RejectedByLevel1: cancelModule
      ? "RejectedCancelByLevel1"
      : "RejectedByLevel1",
    RejectedByLevel2: cancelModule
      ? "RejectedCancelByLevel2"
      : "RejectedByLevel2",
    approvedByLevel1Field: cancelModule
      ? "CancelApprovedByLevel1DateTime"
      : "ApprovedByLevel1DateTime",
    rejectedField: "RejectedDateTime",
  };

  // Level 1
  if (
    checkStatus.approvedByLevel1 === null &&
    checkStatus.approvedByLevel2 === null
  ) {
    const isLevel1Authorized = verifyLevel.some(
      (level) => level.lvl === 1 && level.deptCode === checkStatus.deptCode,
    );
    if (!isLevel1Authorized) {
      return {
        status: 405,
        message: `You are not authorized to approve or reject ${cancelModule ? "overtime" : "leave"} requests`,
      };
    }
    const rowsAffected = await sqlHelper.transact(async (txn) => {
      if (Status === "Approved") {
        let resultArray;
        const isLevel2Available = checkLevelStatus.some(
          (level) => level.lvl === 2,
        );
        if (!isLevel2Available) {
          const overtimeDetails =
            await overtimeModel.getOvertimeIdDetails(overtimeId);
          resultArray = await processOvertime(
            overtimeDetails[0],
            workHours,
            employeeCode,
            cancelModule,
            true,
          );
        } else {
          resultArray = await overtimeModel.updateOvertimeAction(
            {
              ApprovedHours: parseFloat(workHours).toFixed(2),
              Status: mappedStatus.PendingLevel2,
              [approvedByLevel1Field]: employeeCode,
            },
            { OtId: overtimeId },
            txn,
            mappedStatus.approvedByLevel1Field,
          );
        }
        return resultArray;
      }
      return await overtimeModel.updateOvertimeAction(
        {
          Status: mappedStatus.RejectedByLevel1,
          RejectedBy: employeeCode,
          RejectedReason: reason,
        },
        { OtId: overtimeId },
        txn,
        mappedStatus.rejectedField,
      );
    });
    if (rowsAffected?.error) {
      arrayOfMessages.push(`${Status} failed for OvertimeId: ${overtimeId}`);
    } else {
      arrayOfMessages.push(
        `${Status}d successfully for OvertimeId: ${overtimeId}`,
      );
    }
    return { status: 200, message: arrayOfMessages };
  }

  // Level 2
  if (
    checkStatus.approvedByLevel1 !== null &&
    checkStatus.status === mappedStatus.PendingLevel2 &&
    checkStatus.approvedByLevel2 === null
  ) {
    const isLevel2Authorized = verifyLevel.some(
      (level) => level.lvl === 2 && level.deptCode === checkStatus.deptCode,
    );
    if (!isLevel2Authorized) {
      return {
        status: 405,
        message: `You are not authorized to approve or reject ${cancelModule ? "overtime" : "leave"} requests`,
      };
    }
    const rowsAffected = await sqlHelper.transact(async (txn) => {
      if (Status === "Approved") {
        const overtimeDetails =
          await overtimeModel.getOvertimeIdDetails(overtimeId);
        return await processOvertime(
          overtimeDetails[0],
          workHours,
          employeeCode,
          cancelModule,
        );
      }
      return await overtimeModel.updateOvertimeAction(
        {
          Status: mappedStatus.RejectedByLevel2,
          RejectedBy: employeeCode,
          RejectedReason: reason,
        },
        { OtId: overtimeId },
        txn,
        mappedStatus.rejectedField,
      );
    });
    if (rowsAffected?.error) {
      arrayOfMessages.push(`${Status} failed for OvertimeId: ${overtimeId}`);
    } else {
      arrayOfMessages.push(
        `${Status} successfully for OvertimeId: ${overtimeId}`,
      );
    }
    return { status: 200, message: arrayOfMessages };
  }

  return {
    status: 200,
    message: [`No records found for OvertimeId: ${overtimeId}`],
  };
};

const updateOvertimeAction = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const datas = req.body.data;
  const Status = req.body.Status;

  const reason = req.body.reason || "";
  const arrayOfMessages = [];

  for (const data of datas) {
    const result = await handleOvertimeApproval(
      data,
      employeeCode,
      Status,
      reason,
      false,
    );

    if (result.status !== 200) {
      arrayOfMessages.push(`${result.message}`);
    } else {
      arrayOfMessages.push(...result.message);
    }
  }

  const hasErrors = arrayOfMessages.some(
    (msg) =>
      msg.toLowerCase().includes("failed") ||
      msg.toLowerCase().includes("error"),
  );

  return res.status(hasErrors ? 400 : 200).json({
    success: !hasErrors,
    messages: arrayOfMessages,
  });
};

const updateOvertimeRequest = async (req, res) => {
  const {
    workHours,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    workLoad,
    overtimeId,
  } = req.body;

  const update = await sqlHelper.transact(async (txn) => {
    return await overtimeModel.updateOvertimeAction(
      {
        FiledHours: workHours,
        WorkLoad: workLoad,
        DateFrom: dateFrom,
        DateTo: dateTo,
        TimeFrom: timeFrom,
        TimeTo: timeTo,
      },
      { OtId: overtimeId },
      txn,
      "DateCreated",
    );
  });

  if (!update) {
    return res.status(500).json({ error: "Failed to update leave request" });
  }

  return res
    .status(201)
    .json({ body: "Overtime updated successfully", success: true });
};

const cancelOvertime = async (req, res) => {
  const { overtimeId, reason } = req.body;
  const employeeCode = req.user.employee_id;
  const overtimeDetails = await overtimeModel.getOvertimeIdDetails(overtimeId);
  const condition1 = overtimeDetails[0].approvedByLevel1;
  const condition2 = overtimeDetails[0].approvedByLevel2;
  const currentDate = new Date();

  let result;
  if (
    (condition1 === null && condition2 === null) ||
    (condition1 !== null && condition2 === null)
  ) {
    result = await sqlHelper.transact(async (txn) => {
      return await overtimeModel.updateOvertimeAction(
        {
          Status: "CANCELLED",
          Deleted: 1,
          CanceledBy: employeeCode,
          CanceledReason: reason,
        },
        { OtId: overtimeId.toString() },
        txn,
        "CanceledByDateTime",
      );
    });
  } else {
    const resultLevel = await LeaveModel.verifyLevelCreate(employeeCode);
    const { verifyLevel2 } = LeaveCont.processVerificationLevels(resultLevel);
    if (verifyLevel2 === true) {
      result = await sqlHelper.transact(async (txn) => {
        return await overtimeModel.updateOvertimeAction(
          {
            status: "PendingCancelLevel2",
            Deleted: 1,
            CanceledReason: reason,
            CancelApprovedByLevel1: "System",
            CancelApprovedByLevel1DateTime1: currentDate,
          },
          { OtId: overtimeId.toString() },
          txn,
          "CanceledByDateTime",
        );
      });
    } else {
      result = await sqlHelper.transact(async (txn) => {
        return await overtimeModel.updateOvertimeAction(
          {
            status: "PendingCancel",
            Deleted: 1,
            CanceledReason: reason,
          },
          { OtId: overtimeId.toString() },
          txn,
          "CanceledByDateTime",
        );
      });
    }
  }

  if (!result) {
    return res.status(400).json({ error: "Overtime request not found" });
  } else {
    return res.status(200).json({ body: "Success Cancel of Overtime" });
  }
};

const getPendingCancelOvertime = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const { conditions, parameters, userHasLevel1, userHasLevel2 } =
    await checkEmployeeToApprove(employeeCode);

  let pending = await overtimeModel.getPendingOvertime(
    conditions,
    parameters,
    employeeCode,
    userHasLevel1,
    userHasLevel2,
    true,
  );

  if (pending.length > 0) {
    pending = pending.map((item) => ({
      ...item,
      dateOfOvertime: adjustTime(item.dateOfOvertime),
      overtimeCreated: adjustTime(item.overtimeCreated),
      timeFrom: util.formatDate({ date: item.timeFrom, timeOnly: true }),
      timeTo: util.formatDate({ date: item.timeTo, timeOnly: true }),
    }));

    return res.status(200).json(pending);
  }
  return res.status(200).json([]);
};

const cancelOvertimeAction = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const OvertimeIds = req.body.OvertimeIds;
  const Status = req.body.Status;
  const reason = req.body.reason || "";
  const arrayOfMessages = [];

  for (const overtimeId of OvertimeIds) {
    const result = await handleOvertimeApproval(
      overtimeId,
      employeeCode,
      Status,
      reason,
      true,
    );

    if (result.status !== 200) {
      arrayOfMessages.push(
        `Error for OvertimeId: ${overtimeId} — ${result.message}`,
      );
    } else {
      arrayOfMessages.push(...result.message);
    }
  }

  const hasErrors = arrayOfMessages.some(
    (msg) =>
      msg.toLowerCase().includes("failed") ||
      msg.toLowerCase().includes("error"),
  );

  return res.status(hasErrors ? 400 : 200).json({
    success: !hasErrors,
    message: arrayOfMessages,
  });
};

const getPendingHrd = async (req, res) => {
  let pendingHrd = await overtimeModel.pendingHrd();
  if (pendingHrd.length > 0) {
    pendingHrd = await formatTimeFromTo(pendingHrd);
    return res.status(200).json(pendingHrd);
  }

  return res.status(200).json([]);
};

const approveRejectHrdReview = async (req, res) => {
  const hrdCode = req.user?.employee_id;
  const { data, payrollPeriod, status, reason } = req.body;

  if (!hrdCode || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      body: "Invalid request: missing HRD code or overtime data",
    });
  }

  const arrayResult = [];

  for (const overtime of data) {
    const {
      otId,
      employeeCode,
      formatedDateOvertime,
      timeFrom,
      timeTo,
      workLoad,
      filedHours,
      oTType,
    } = overtime;

    if (!otId || !employeeCode) {
      return res.status(400).json({
        body: "Invalid overtime entry: missing required fields",
      });
    }

    const processOvertime = await sqlHelper
      .transact(async (txn) => {
        if (status === "Approved") {
          const updateNewOvertimeStatus =
            await overtimeModel.updateOvertimeAction(
              {
                Status: "Approved",
                HrdProcessBy: hrdCode,
                PayrollPeriod: payrollPeriod,
                ApprovedHours: filedHours,
                OTType: oTType,
              },
              { OtId: otId },
              txn,
              "HrdProcessDate",
            );

          const insertIntoOldOvertimeTable =
            await overtimeModel.insertIntoOldOvertime(
              {
                CODE: employeeCode,
                DATE_OF_LEAVE: formatedDateOvertime,
                HOURS: filedHours,
                WORK: workLoad,
                USERID: employeeCode,
                APPROVED: 1,
                TIME_FROM: timeFrom,
                TIME_TO: timeTo,
                "[APPROVE DATE]": adjustTime(
                  updateNewOvertimeStatus.approvedByLevel2DateTime,
                ),
                "[APPROVE BY]": updateNewOvertimeStatus.approvedByLevel2,
                forPayment: 1,
                payrollPeriod: payrollPeriod,
              },
              txn,
              "DATE",
            );

          const updateNewOvertimeOtOldId =
            await overtimeModel.updateOvertimeAction(
              {
                OldOtId: insertIntoOldOvertimeTable.iD,
              },
              { OtId: otId },
              txn,
              "HrdProcessDate",
            );

          await overtimeModel.insertIntoAllowedOvertime(
            {
              CODE: employeeCode,
              "[OT ID]": updateNewOvertimeOtOldId.oldOtId,
              "[ALLOW BY]": updateNewOvertimeOtOldId.accomplishedApprovedBy,
              CANCELLED: 0,
              "[HEAD APPROVED]": 0,
              TRANSMITTAL: updateNewOvertimeOtOldId.workLoad,
              "[TRANSMITTAL DATE]":
                updateNewOvertimeOtOldId.accomplishedDateTime,
              FINAL: 1,
              "[FINAL BY]": updateNewOvertimeOtOldId.hrdProcessBy,
              "[FINAL DATE]": updateNewOvertimeOtOldId.hrdProcessDate,
              HOURS: updateNewOvertimeOtOldId.approvedHours,
              "[HEAD ALLOWED]": 1,
            },
            txn,
            "[ALLOW DATE]",
          );

          return overtimeModel.insertIntoSummary(
            {
              otId: updateNewOvertimeOtOldId.oldOtId,
              hours: updateNewOvertimeOtOldId.approvedHours,
              type: updateNewOvertimeOtOldId.oTType,
              payrollPeriod: updateNewOvertimeOtOldId.payrollPeriod,
            },
            txn,
            "createDate",
          );
        } else if (status === "Rejected") {
          return overtimeModel.updateOvertimeAction(
            {
              Status: "RejectedByHrd",
              RejectedBy: hrdCode,
              RejectedReason: reason || "No reason provided",
            },
            { OtId: otId },
            txn,
            "RejectedDateTime",
          );
        } else {
          return Promise.reject(new Error(`Invalid status: ${status}`));
        }
      })
      .catch((err) => {
        console.error(`Error processing overtime ${otId}:`, err);
        return { error: true, message: err.message, otId };
      });

    arrayResult.push(processOvertime);
  }

  if (arrayResult.some((res) => res?.error)) {
    return res.status(500).json({
      body: "Overtime HRD Review Approve/Reject Failed",
    });
  }

  return res.status(200).json({
    body: "Success Approving / Rejecting overtime process by HRD",
  });
};

// const approveRejectHrdReview = async (req, res) => {
//   const hrdCode = req.user.employee_id;
//   const { data, payrollPeriod, status, reason } = req.body;
//   const arrayResult = [];

//   for (const overtime of data) {
//     const {
//       otId,
//       employeeCode,
//       formatedDateOvertime,
//       timeFrom,
//       timeTo,
//       workLoad,
//       filedHours,
//       oTType,
//     } = overtime;

//     const processOvertime = await sqlHelper.transact(async (txn) => {
//       if (status === "Approved") {
//         const updateNewOvertimeStatus =
//           await overtimeModel.updateOvertimeAction(
//             {
//               Status: "Approved",
//               HrdProcessBy: hrdCode,
//               PayrollPeriod: payrollPeriod,
//               ApprovedHours: filedHours,
//               OTType: oTType,
//             },
//             { OtId: otId },
//             txn,
//             "HrdProcessDate",
//           );

//         const insertIntoOldOvertimeTable =
//           await overtimeModel.insertIntoOldOvertime(
//             {
//               CODE: employeeCode,
//               DATE_OF_LEAVE: formatedDateOvertime,
//               HOURS: filedHours,
//               WORK: workLoad,
//               USERID: employeeCode,
//               APPROVED: 1,
//               TIME_FROM: timeFrom,
//               TIME_TO: timeTo,
//               "[APPROVE DATE]": adjustTime(
//                 updateNewOvertimeStatus.approvedByLevel2DateTime,
//               ),
//               "[APPROVE BY]": updateNewOvertimeStatus.approvedByLevel2,
//               forPayment: 1,
//               payrollPeriod: payrollPeriod,
//             },
//             txn,
//             "DATE",
//           );

//         const updateNewOvertimeOtOldId =
//           await overtimeModel.updateOvertimeAction(
//             {
//               OldOtId: insertIntoOldOvertimeTable.iD,
//             },
//             { OtId: otId },
//             txn,
//             "HrdProcessDate",
//           );

//         const insertIntoAllowedOvertime =
//           await overtimeModel.insertIntoAllowedOvertime(
//             {
//               CODE: employeeCode,
//               "[OT ID]": updateNewOvertimeOtOldId.oldOtId,
//               "[ALLOW BY]": updateNewOvertimeOtOldId.accomplishedApprovedBy,
//               CANCELLED: 0,
//               "[HEAD APPROVED]": 0,
//               TRANSMITTAL: updateNewOvertimeOtOldId.workLoad,
//               "[TRANSMITTAL DATE]":
//                 updateNewOvertimeOtOldId.accomplishedDateTime,
//               FINAL: 1,
//               "[FINAL BY]": updateNewOvertimeOtOldId.hrdProcessBy,
//               "[FINAL DATE]": updateNewOvertimeOtOldId.hrdProcessDate,
//               HOURS: updateNewOvertimeOtOldId.approvedHours,
//               "[HEAD ALLOWED]": 1,
//             },
//             txn,
//             "[ALLOW DATE]",
//           );

//         const insertIntoOTSummary = await overtimeModel.insertIntoSummary(
//           {
//             otId: updateNewOvertimeOtOldId.oldOtId,
//             hours: updateNewOvertimeOtOldId.approvedHours,
//             type: updateNewOvertimeOtOldId.oTType,
//             payrollPeriod: updateNewOvertimeOtOldId.payrollPeriod,
//           },
//           txn,
//           "createDate",
//         );

//         return insertIntoOTSummary;
//       } else {
//         return await overtimeModel.updateOvertimeAction(
//           {
//             Status: "RejectedByHrd",
//             RejectedBy: hrdCode,
//             RejectedReason: reason,
//           },
//           { OtId: otId },
//           txn,
//           "RejectedDateTime",
//         );
//       }
//     });

//     arrayResult.push(processOvertime);
//   }

//   if (arrayResult.length === 0)
//     res.status(500).json({
//       body: "Error in approving / rejecting the overtime process by hrd",
//     });

//   res
//     .status(200)
//     .json({ body: "Success Approving / Rejecting overtime process by hrd" });
// };

const statusStatement = ({ status, employeeCode, cancelModule }) => {
  const map = {
    ApprovedUser: {
      where: cancelModule
        ? "(o.CancelApprovedByLevel1 = ? OR o.CancelApprovedByLevel2 = ?) AND (o.RejectedBy != ? OR o.RejectedBy IS NULL)"
        : "(o.ApprovedByLevel1 = ? OR o.ApprovedByLevel2 = ?) AND (o.RejectedBy != ? OR o.RejectedBy IS NULL) AND o.Status != 'CANCELLED'",
      args: [employeeCode, employeeCode, employeeCode],
    },
    RejectedUser: {
      where: "o.RejectedBy = ? AND o.Status LIKE ?",
      args: [
        employeeCode,
        cancelModule ? "%RejectedCancelBy%" : "%RejectedBy%",
      ],
    },
    Approved: {
      where: "o.Status = ?",
      args: [cancelModule ? "CANCELLED" : "Approved"],
    },
    Rejected: {
      where: "o.Status IN (?, ?)",
      args: cancelModule
        ? ["RejectedCancelByLevel1", "RejectedCancelByLevel2"]
        : ["RejectedByLevel1", "RejectedByLevel2"],
    },
  };

  return map[status] || { where: null, args: [] };
};

const filterOvertime = (data, mappedEmployeeDept) => {
  return data.filter((item) => {
    return mappedEmployeeDept.some((dept) => {
      const hasEmployeeCodes =
        dept.employeeCodes && dept.employeeCodes.trim() !== "";

      if (hasEmployeeCodes) {
        const empList = dept.employeeCodes
          .split(",")
          .map((employee) => employee.trim());
        return empList.includes(item.employeeCode);
      }

      return dept.deptCode === item.departmentCode;
    });
  });
};

const approvedRejectedCancelOvertime = async (req, res) => {
  const { status } = req.body;

  const employeeCode = req.user.employee_id;
  const cancelModule = true;

  const mappedEmployeeDept = await overtimeModel.getFilter(employeeCode);

  const { where, args } = statusStatement({
    status,
    employeeCode,
    cancelModule,
  });

  const sqlWhereStrArr = [];
  const argsState = [];

  if (where) {
    sqlWhereStrArr.push(where);
    argsState.push(...args);
  }

  let filteredData = await overtimeModel.userActionOvertime(
    sqlWhereStrArr,
    argsState,
  );

  if (filteredData.length > 0) {
    filteredData = filterOvertime(filteredData, mappedEmployeeDept);
    filteredData = await formatTimeFromTo(filteredData);
    return res.status(200).json(filteredData);
  }

  return res.status(200).json([]);
};

const approvedRejectedOvertime = async (req, res) => {
  const { status } = req.body;
  const employeeCode = req.user.employee_id;
  const cancelModule = false;

  const mappedEmployeeDept = await overtimeModel.getFilter(employeeCode);

  const { where, args } = statusStatement({
    status,
    employeeCode,
    cancelModule,
  });

  const sqlWhereStrArr = [];
  const argsState = [];

  if (where) {
    sqlWhereStrArr.push(where);
    argsState.push(...args);
  }

  let filteredData = await overtimeModel.userActionOvertime(
    sqlWhereStrArr,
    argsState,
  );

  if (filteredData.length > 0) {
    filteredData = filterOvertime(filteredData, mappedEmployeeDept);
    filteredData = await formatTimeFromTo(filteredData);
    return res.status(200).json(filteredData);
  }

  return res.status(200).json([]);
};

const submitAccomplishment = async (req, res) => {
  const { workHours, workLoad, timeFrom, timeTo, overtimeId } = req.body;

  const update = await sqlHelper.transact(async (txn) => {
    return await overtimeModel.updateOvertimeAction(
      {
        WorkLoad: workLoad,
        FiledHours: workHours,
        TimeFrom: timeFrom,
        TimeTo: timeTo,
        Accomplished: 1,
        Status: "PendingAccomplishApproval",
      },
      { OtId: overtimeId },
      txn,
      "AccomplishedDateTime",
    );
  });

  if (!update) return res.status(500).json(null);

  res.status(200).json({ body: "Success submitting accomplishment" });
};

const getPendingAccomplishment = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const { conditions, parameters } = await checkEmployeeToApprove(employeeCode);

  let pending = await overtimeModel.getPendingAccomplishment(
    conditions,
    parameters,
    employeeCode,
  );

  if (pending.length > 0) {
    pending = await formatTimeFromTo(pending);
    return res.status(200).json(pending);
  }

  return res.status(200).json([]);
};

const approveRejectAccomplishment = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const OvertimeIds = req.body.OvertimeIds;
  const Status = req.body.Status;
  const reason = req.body.reason || "";
  let arrayResult = [];

  for (const overtimeId of OvertimeIds) {
    arrayResult = await sqlHelper.transact(async (txn) => {
      if (Status === "Approved") {
        return await overtimeModel.updateOvertimeAction(
          {
            AccomplishedApprovedBy: employeeCode,
            Status: "PendingHrd",
          },
          { OtId: overtimeId },
          txn,
          "AccomplishedApprovedDateTime",
        );
      } else {
        return await overtimeModel.updateOvertimeAction(
          {
            RejectedBy: employeeCode,
            Status: "RejectedAccomplishment",
            RejectedReason: reason,
          },
          { OtId: overtimeId },
          txn,
          "RejectedDateTime",
        );
      }
    });
  }

  if (arrayResult.length === 0) {
    res.status(500).json(null);
  }

  res.status(200).json({ body: "Success approving overtime accomplishment" });
};

const unpaidOvertime = async (req, res) => {
  const { fromDate, toDate, classCode } = req.query;

  const data = await overtimeModel.unpaidOvertime(fromDate, toDate, classCode);

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(500).json({ message: "Error in getting data." });
  }

  return res.status(200).json(data);
};

module.exports = {
  overtimeRequest,
  getPendingOvertime,
  getOvertimeDetails,
  updateOvertimeAction,
  updateOvertimeRequest,
  cancelOvertime,
  getPendingCancelOvertime,
  cancelOvertimeAction,
  // userApprovedOvertime,
  // userRejectedOvertime,
  // approvedOvertime,
  // rejectedOvertime,
  getPendingHrd,
  approveRejectHrdReview,
  approvedRejectedCancelOvertime,
  approvedRejectedOvertime,
  submitAccomplishment,
  getPendingAccomplishment,
  approveRejectAccomplishment,
  unpaidOvertime,
};

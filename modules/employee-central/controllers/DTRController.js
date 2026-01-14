const DTR = require("../models/DTRModel.js");
const sqlHelper = require("../../../helpers/sql.js");

const getDTRDetails = async function (req, res) {
  try {
    const { employeeCode, department, selectedClass, dateFrom, dateTo } =
      req.query;
    const displayType = "";
    // const requestMonth = req.query.month;
    // const requestYear = req.query.year;
    let startDate;
    let endDate;

    if (dateFrom.length === 0 || dateTo.length === 0) {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1),
      );
      startDate = firstDayOfMonth.toISOString().split("T")[0];
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1,
      );
      endDate = lastDayOfMonth.toISOString().split("T")[0];
    } else {
      startDate = dateFrom;
      endDate = dateTo;
    }

    const success = await DTR.getDTRDetails(
      startDate,
      endDate,
      employeeCode,
      department,
      displayType,
      selectedClass,
    );

    const dataWithFormattedTime = success.map((entry) => {
      const transDate = new Date(entry.transDate);
      const month = (transDate.getMonth() + 1).toString().padStart(2, "0");
      const transDateFormat = `${transDate.getFullYear()}-${month}-${transDate.getDate().toString().padStart(2, "0")}`;
      const options = { weekday: "short" };
      const dayOfWeek = transDate.toLocaleDateString("en-US", options);

      const schedFrom = new Date(entry.schedFrom);
      const schedTo = new Date(entry.schedTo);
      const formattedSchedFrom = schedFrom.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const formattedSchedTo = schedTo.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const schedule = `${formattedSchedFrom} - ${formattedSchedTo}`;
      const holidayPay = Number.isInteger(entry.holidayPay)
        ? entry.holidayPay
        : entry.holidayPay.toFixed(2);

      return { ...entry, dayOfWeek, schedule, transDateFormat, holidayPay };
    });
    return res.status(200).json(dataWithFormattedTime);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No Leave Details" });
  }
};

const dateFormatDtr = (data) => {
  return data.map((entry) => {
    const transDate = new Date(entry.transDate);
    const month = (transDate.getMonth() + 1).toString().padStart(2, "0");
    const transDateFormat = `${transDate.getFullYear()}-${month}-${transDate.getDate().toString().padStart(2, "0")}`;
    const options = { weekday: "short" };
    const dayOfWeek = transDate.toLocaleDateString("en-US", options);

    const schedFrom = new Date(entry.schedFrom);
    const schedTo = new Date(entry.schedTo);
    const formattedSchedFrom = schedFrom.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const formattedSchedTo = schedTo.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const schedule = `${formattedSchedFrom} - ${formattedSchedTo}`;
    const holidayPay = Number.isInteger(entry.holidayPay)
      ? entry.holidayPay
      : entry.holidayPay.toFixed(2);

    return { ...entry, dayOfWeek, schedule, transDateFormat, holidayPay };
  });
};

const noDtrEmployee = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const result = await DTR.noDtrEmployee(employeeId);
    if (!result) {
      res.status(404).json({ body: "No Employee Details that is NO DTR" });
    }
    res.status(200).json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const manualUploadDtr = async (req, res) => {
  const data = [];

  const result = [];

  for (const item of data) {
    const { UserId, Time } = item;
    const dateStr = Time.split(" ")[0];
    const [day, month, year] = dateStr.split("/");
    const period = `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
    const timePart = Time.split(" ")[1];

    const toManilaDate = (dateObj) => {
      const utcTime = dateObj.getTime();
      const manilaOffset = 8 * 60 * 60 * 1000;
      return new Date(utcTime + manilaOffset);
    };

    const formatted = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timePart}:00`;

    const itemTime = new Date(formatted);

    const existingTimeData = await DTR.timeData(period, UserId);

    let minTimeIn, maxTimeOut;

    if (
      !existingTimeData ||
      existingTimeData.length === 0 ||
      !existingTimeData[0]
    ) {
      minTimeIn = itemTime;
      maxTimeOut = itemTime;
    } else {
      const { timeIn, timeOut } = existingTimeData[0];

      const adjustTimeIn = timeIn ? timeIn : null;
      const adjustTimeOut = timeOut ? timeOut : null;

      const times = [
        adjustTimeIn?.getTime(),
        adjustTimeOut?.getTime(),
        itemTime.getTime(),
      ].filter((t) => t);

      minTimeIn = new Date(Math.min(...times));
      maxTimeOut = new Date(Math.max(...times));
    }

    const update = await sqlHelper.transact(async (txn) => {
      return await DTR.updateTimeDate(
        {
          timeIn: minTimeIn,
          timeOut: maxTimeOut,
          updatedBy: "8958",
        },
        { period: period, code: UserId },
        txn,
        "updatedDate",
      );
    });

    if (!update || update.error) {
      result.push({
        success: false,
        message: `Failed updating on period ${period} userId ${UserId}`,
        reason: update?.error || "Update returned false/null",
        period,
        minTimeIn,
        maxTimeOut,
        userId: UserId,
      });
    } else {
      result.push({
        success: true,
        message: "Successfully updated DTR record",
        period,
        minTimeIn,
        maxTimeOut,
        userId: UserId,
      });
    }
  }
};

const employeeClass = async (req, res) => {
  const response = await DTR.employeeClass();

  if (!response) {
    return res.status(500).json(null);
  }

  return res.status(200).json(response);
};

const aggregateOvertimeData = (overtimeRecords) => {
  const otTypes = {
    "OT 35": "rawOT35",
    "OT 100": "rawOT100",
    "OT 130": "rawOT130",
    "OT 135": "rawOT135",
  };

  const result = {
    rawOT35: 0,
    rawOT100: 0,
    rawOT130: 0,
    rawOT135: 0,
  };

  if (!overtimeRecords || overtimeRecords.length === 0) {
    return result;
  }

  for (const { type, hours } of overtimeRecords) {
    const cleanType = type.trim();
    const key = otTypes[cleanType];
    if (key) {
      result[key] += hours || 0;
    }
  }

  return result;
};

const getLastMonthDates = () => {
  const currentDate = new Date();
  const lastMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1,
  );

  const startLastMonth = new Date(
    lastMonth.getFullYear(),
    lastMonth.getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];

  const endLastMonth = new Date(
    lastMonth.getFullYear(),
    lastMonth.getMonth() + 1,
    0,
  )
    .toISOString()
    .split("T")[0];

  return { startLastMonth, endLastMonth };
};

const handleSummarizeReport = async (
  payrollPeriod,
  employeeClass,
  fromDate,
  toDate,
  computeLate,
) => {
  const getEmployees = await DTR.getEmployees(payrollPeriod, employeeClass);

  if (!getEmployees || getEmployees.length === 0) {
    return [];
  }

  const { startLastMonth, endLastMonth } = computeLate
    ? getLastMonthDates()
    : { startLastMonth: null, endLastMonth: null };

  const employeeDataArray = await Promise.all(
    getEmployees.map(async (employee) => {
      const promises = [
        DTR.getDTRDetails(fromDate, toDate, employee.code, "", "", ""),
        DTR.employeeOvertime(employee.code, payrollPeriod),
      ];

      if (computeLate) {
        promises.push(
          DTR.getComputedLate(
            startLastMonth,
            endLastMonth,
            employee.code,
            "",
            "computeLate",
            "",
          ),
        );
      }

      const results = await Promise.all(promises);

      return {
        code: employee.code,
        dtr: dateFormatDtr(results[0]),
        overtime: results[1],
        ...(computeLate && results[2]?.[0]?.lateSum
          ? { computedLate: results[2][0].lateSum }
          : {}),
      };
    }),
  );

  return employeeDataArray;
};

const handleTallyReport = async (
  payrollPeriod,
  fromDate,
  toDate,
  employeeClass,
) => {
  const getFinalReport = await DTR.getSummaryReport(
    payrollPeriod,
    "",
    "",
    "",
    "",
    employeeClass,
  );

  if (!getFinalReport || getFinalReport.length === 0) {
    return [];
  }

  return await Promise.all(
    getFinalReport.map(async (employee) => {
      const [rawDtr, rawOt] = await Promise.all([
        DTR.getDTRDetails(
          fromDate,
          toDate,
          employee.employeeCode,
          "",
          "sumLateOvertimeUndertime",
          "",
        ),
        DTR.getOvertimeSummary(employee.employeeCode, payrollPeriod),
      ]);

      return {
        employeeCode: employee.employeeCode,
        employeeName: employee.employeeName,
        department: employee.department,
        payrollFrom: employee.payrollFrom,
        payrollTo: employee.payrollTo,
        absences: employee.absences,
        absencesHours: employee.absencesHours,
        lates: employee.lates,
        undertime: employee.undertime,
        oT35: employee.oT35,
        oT100: employee.oT100,
        oT130: employee.oT130,
        oT135: employee.oT135,
        diffAM: employee.diffAM,
        diffPM: employee.diffPM,
        refund: employee.refund,
        rawAbsences: rawDtr?.[0]?.absentSum ?? 0,
        rawLates: rawDtr?.[0]?.lateSum ?? 0,
        rawUndertime: rawDtr?.[0]?.undertimeSum ?? 0,
        rawDiffAM: rawDtr?.[0]?.diffAMSum ?? 0,
        rawDiffPM: rawDtr?.[0]?.diffPMSum ?? 0,
        note: employee.note,
        ...aggregateOvertimeData(rawOt),
      };
    }),
  );
};

const searchDtr = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      payrollPeriodFrom,
      payrollPeriodTo,
      employeeClass,
      payrollPeriod,
      computeLate,
      typeReport,
    } = req.query;

    let employeesDtr = null;

    if (typeReport === "summarize") {
      employeesDtr = await handleSummarizeReport(
        payrollPeriod,
        employeeClass,
        fromDate,
        toDate,
        computeLate,
      );
    } else if (typeReport === "print") {
      employeesDtr = await DTR.getSummaryReport(
        payrollPeriod,
        "",
        "",
        "",
        "",
        employeeClass,
      );
    } else if (typeReport === "tally") {
      employeesDtr = await handleTallyReport(
        payrollPeriod,
        fromDate,
        toDate,
        employeeClass,
      );
    }

    if (!employeesDtr || employeesDtr.length === 0) {
      return res.status(204).json({ message: "No data found" });
    }

    return res.status(200).json(employeesDtr);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const residentFaculty = async (req, res) => {
  const {
    employeeClass,
    employeeCode,
    payrollPeriod,
    payrollPeriodFrom,
    payrollPeriodTo,
  } = req.query;

  const employeeDtr = await DTR.getSummaryReport(
    payrollPeriod,
    "facultyResident",
    payrollPeriodFrom,
    payrollPeriodTo,
    employeeCode,
    employeeClass,
  );

  if (!employeeDtr || employeeDtr.length === 0) {
    return res.status(204).json({ message: "No data found" });
  }

  return res.status(200).json(employeeDtr);
};

// const searchDtr = async (req, res) => {
//   const {
//     fromDate,
//     toDate,
//     payrollPeriodFrom,
//     payrollPeriodTo,
//     employeeClass,
//     payrollPeriod,
//     computeLate,
//     typeReport,
//   } = req.query;

//   let startLastMonth;
//   let endLastMonth;
//   let employeesDtr;

//   if (computeLate) {
//     const currentDate = new Date();
//     const lastMonth = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth() - 1,
//       1,
//     );

//     startLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
//       .toISOString()
//       .split("T")[0];

//     endLastMonth = new Date(
//       lastMonth.getFullYear(),
//       lastMonth.getMonth() + 1,
//       0,
//     )
//       .toISOString()
//       .split("T")[0];
//   }

//   if (typeReport === "summarize") {
//     const getEmployees = await DTR.getEmployees(payrollPeriod, employeeClass);

//     if (!getEmployees) return res.status(500).json(null);

//     const employeeDataPromises = getEmployees.map(async (employee) => {
//       const promises = [
//         DTR.getDTRDetails(fromDate, toDate, employee.code, "", "", ""),
//         DTR.employeeOvertime(employee.code, payrollPeriod),
//       ];

//       if (computeLate) {
//         promises.push(
//           DTR.getComputedLate(
//             startLastMonth,
//             endLastMonth,
//             employee.code,
//             "",
//             "computeLate",
//             "",
//           ),
//         );
//       }

//       const results = await Promise.all(promises);

//       const computedLateValue =
//         computeLate === "true" || computeLate === true
//           ? results[2]?.[0]?.lateSum || null
//           : undefined;

//       return {
//         code: employee.code,
//         dtr: dateFormatDtr(results[0]),
//         overtime: results[1],
//         ...(computedLateValue !== undefined
//           ? { computedLate: computedLateValue }
//           : {}),
//       };
//     });

//     const employeeDataArray = await Promise.all(employeeDataPromises);

//     employeesDtr = employeeDataArray.reduce((acc, item) => {
//       acc[item.code] = {
//         dtr: item.dtr,
//         overtime: item.overtime,
//         ...(item.computedLate !== undefined
//           ? { computedLate: item.computedLate }
//           : {}),
//       };
//       return acc;
//     }, {});
//   }

//   if (typeReport === "print" || typeReport === "tally") {
//     const getFinalReport = await DTR.getSummaryReport(
//       payrollPeriodFrom,
//       payrollPeriodTo,
//       typeReport,
//       payrollPeriod,
//     );

//     employeesDtr = getFinalReport;
//   }

//   if (typeReport === "tally") {
//     const getFinalReport = await DTR.getSummaryReport(
//       payrollPeriodFrom,
//       payrollPeriodTo,
//       typeReport,
//       payrollPeriod,
//     );

//     if (!getFinalReport || getFinalReport.length === 0) {
//       return res.status(403).json({ error: "No finalized report found" });
//     }

//     const combinedReport = await Promise.all(
//       getFinalReport.map(async (employee) => {
//         const [rawDtr, rawOt] = await Promise.all([
//           DTR.getDTRDetails(
//             fromDate,
//             toDate,
//             employee.employeeCode,
//             "",
//             "sumLateOvertimeUndertime",
//             "",
//           ),
//           DTR.getOvertimeSummary(employee.employeeCode, payrollPeriod),
//         ]);

//         return {
//           employeeCode: employee.employeeCode,
//           employeeName: employee.employeeName,
//           department: employee.department,
//           payrollFrom: employee.payrollFrom,
//           payrollTo: employee.payrollTo,
//           absences: employee.absences,
//           lates: employee.lates,
//           undertime: employee.undertime,
//           OT35: employee.oT35,
//           OT100: employee.oT100,
//           OT130: employee.oT130,
//           OT135: employee.oT135,
//           diffAM: employee.diffAM,
//           diffPM: employee.diffPM,
//           refund: employee.refund,

//           rawAbsences: rawDtr?.[0]?.absentSum ?? 0,
//           rawLates: rawDtr?.[0]?.lateSum ?? 0,
//           rawUndertime: rawDtr?.[0]?.undertimeSum ?? 0,
//           rawDiffAM: rawDtr?.[0]?.diffAMSum ?? 0,
//           rawDiffPM: rawDtr?.[0]?.diffPMSum ?? 0,

//           ...aggregateOvertimeData(rawOt),
//         };
//       }),
//     );

//     employeesDtr = combinedReport;
//   }

//   if (!Object.keys(employeesDtr).length) return res.status(204).json(null);

//   console.log(employeesDtr);
//   return res.status(200).json(employeesDtr);
// };

const processDtrPosting = async (postingData, txn, user) => {
  const {
    code,
    absences,
    late,
    undertime,
    diffAM,
    diffPM,
    ot35,
    ot100,
    ot130,
    ot135,
    refund,
    note,
    payrollPeriod,
    timeDataFrom,
    timeDataTo,
    moduleParams,
  } = postingData;

  const result = await DTR.dtrPosting(
    code,
    absences,
    0,
    late,
    undertime,
    diffAM,
    diffPM,
    ot35,
    ot100,
    ot130,
    ot135,
    refund,
    note,
    payrollPeriod,
    timeDataFrom,
    timeDataTo,
    moduleParams,
    user,
    "Employee Central",
    txn,
  );

  if (!result || result.length === 0) {
    throw new Error("No response from database.");
  }

  const data = result[0];

  if (data?.ERR === 1) {
    throw new Error(data.MSG || "An error occurred while posting DTR.");
  }

  return data;
};

const validateOvertimeRules = (body) => {
  const otRuleMessage = {
    ot35: { limit: 36, label: "Overtime 35" },
    ot100: { limit: 36, label: "Overtime 100" },
    ot130: { limit: 100, label: "Overtime 130" },
    ot135: { limit: 100, label: "Overtime 135" },
  };

  for (const [key, rule] of Object.entries(otRuleMessage)) {
    const value = body[key];
    if (value > rule.limit) {
      return {
        isValid: false,
        message: `${rule.label} exceeds the limit of ${rule.limit} mins per payroll.`,
      };
    }
  }

  return { isValid: true };
};

const dtrPosting = async (req, res) => {
  try {
    const user = req.user.employee_id;
    const validation = validateOvertimeRules(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        status: "error",
        message: validation.message,
      });
    }

    const data = await sqlHelper.transact(async (txn) => {
      return await processDtrPosting(req.body, txn, user);
    });

    return res.status(200).json({
      status: "success",
      message: data?.MSG || "DTR successfully posted.",
      data,
    });
  } catch (error) {
    return res.status(error.message.includes("No response") ? 500 : 400).json({
      status: "error",
      message: error.message,
    });
  }
};

const finalizeTImeData = async (req, res) => {
  try {
    const { employeeData, payrollPeriodFrom, payrollPeriodTo } = req.body;
    const user = process.env.DB_USER;
    const results = [];

    for (const employee of employeeData) {
      const validation = validateOvertimeRules(employee);
      if (!validation.isValid) {
        return res.status(400).json({
          status: "error",
          message: validation.message,
        });
      }

      const data = await sqlHelper.transact(async (txn) => {
        return await processDtrPosting(employee, txn, user);
      });

      if (data.eRR || data.ERR || data.error) {
        results.push(data);
        break;
      }

      results.push({ ...data });
    }

    if (results[0]?.eRR || results[0]?.ERR || results[0]?.error) {
      return res.status(500).json({
        status: "error",
        message:
          results[0].mSG ||
          results[0].error ||
          "Failed to process employee time data.",
      });
    }

    // Finalization step commented out - not needed for this operation
    // const finalizeResult = await DTR.finalizeTimeData(
    //   payrollPeriodFrom,
    //   payrollPeriodTo,
    //   user,
    // );

    // if (finalizeResult[0].eRR) {
    //   return res.status(400).json({
    //     status: "error",
    //     message:
    //       finalizeResult[0].mSG || "Failed to process employee time data.",
    //   });
    // }

    return res.status(200).json({
      status: "success",
      message: "Time data posted successfully",
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const fetchDTRDetails = async (dtrDate, employeeCode) => {
  const dtrDetails = await DTR.getDTRDetails(
    dtrDate,
    dtrDate,
    employeeCode,
    "",
    "",
    "",
  );

  if (!dtrDetails || dtrDetails.length === 0) {
    return {
      success: false,
      message: "No DTR found after operation",
    };
  }

  const formattedDtr = dateFormatDtr(dtrDetails);
  return {
    success: true,
    data: formattedDtr,
  };
};

const insertTimeRecord = async (
  code,
  period,
  fieldToUpdate,
  valueDateTime,
  updatedBy,
) => {
  const result = await sqlHelper.transact(async (txn) => {
    return await DTR.insertTimeData(
      {
        code: code,
        period: period,
        [fieldToUpdate]: valueDateTime,
        updatedBy: updatedBy,
        Hostname: "EmployeeCentral",
      },
      txn,
      "updatedDate",
    );
  });

  if (!result || result.rowsAffected === 0) {
    return {
      success: false,
      message: "Insert failed — no rows were affected.",
    };
  }

  return { success: true };
};

const updateTimeRecord = async (
  existingRecord,
  fieldToUpdate,
  valueDateTime,
  updatedBy,
) => {
  const { id, code, period } = existingRecord;

  const result = await sqlHelper.transact(async (txn) => {
    return await DTR.updateTimeData(
      {
        [fieldToUpdate]: valueDateTime,
        updatedBy: updatedBy,
      },
      { id: id, code: code, period: period },
      txn,
      "updatedDate",
    );
  });

  if (!result || result.rowsAffected === 0) {
    return {
      success: false,
      message: "Update failed — no rows were affected.",
    };
  }

  return { success: true };
};

const insertTimeManualLog = async (
  label,
  value,
  dtrDate,
  remarks,
  employeeCode,
) => {
  const result = await sqlHelper.transact(async (txn) => {
    return await DTR.insertTimeManualLog(
      {
        code: employeeCode,
        date: dtrDate,
        time: value,
        type: label,
        reason: remarks,
      },
      txn,
      "createDate",
    );
  });

  if (!result || result.rowsAffected === 0) {
    return {
      success: false,
      message: "Failed to insert manual log - no rows were affected",
    };
  }

  return { success: true };
};

const saveTimeData = async (req, res) => {
  try {
    const updatedBy = req.user.employee_id;
    const { employeeCode, value, label, period, remarks, dtrDate } = req.body;

    const fieldMap = {
      IN: "timeIn",
      OUT: "timeOut",
      "OT IN": "overtimeIn",
      "OT OUT": "overtimeOut",
    };

    const fieldToUpdate = fieldMap[label];
    if (!fieldToUpdate) {
      return res.status(400).json({ message: `Invalid label: ${label}` });
    }

    const valueDateTime = `${dtrDate} ${value}`;

    const existingRecord = await DTR.checkTimeData(period, employeeCode);
    const recordExists = existingRecord && existingRecord.length > 0;

    const operation = recordExists
      ? await updateTimeRecord(
          existingRecord[0],
          fieldToUpdate,
          valueDateTime,
          updatedBy,
        )
      : await insertTimeRecord(
          employeeCode,
          period,
          fieldToUpdate,
          valueDateTime,
          updatedBy,
        );

    if (!operation.success) {
      return res.status(400).json({ message: operation.message });
    }

    const logResult = await insertTimeManualLog(
      label,
      value,
      dtrDate,
      remarks,
      employeeCode,
    );

    if (!logResult.success) {
      return res.status(400).json({ message: logResult.message });
    }

    const updatedDtr = await fetchDTRDetails(dtrDate, employeeCode);
    if (!updatedDtr.success) {
      return res.status(400).json({ message: updatedDtr.message });
    }

    return res.status(200).json(updatedDtr.data);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error while saving time data.",
      error: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

module.exports = {
  getDTRDetails,
  noDtrEmployee,
  manualUploadDtr,
  employeeClass,
  searchDtr,
  dtrPosting,
  finalizeTImeData,
  saveTimeData,
  residentFaculty,
};

const DutyModel = require("../models/dutyRosterModel");
const sqlHelper = require("../../../helpers/sql");

const getDepartment = async (req, res) => {
  const employeeCode = req.user.employee_id;
  const employeeGrouping = await DutyModel.checkEmployeeGrouping(employeeCode);

  if (employeeGrouping && employeeGrouping.length > 0) {
    return res.status(200).json(employeeGrouping);
  }

  const allDepartments = await DutyModel.getAllDepartment();

  if (!allDepartments) {
    return res.status(500).json(null);
  }

  return res.status(200).json(allDepartments);
};

const getEmployees = async (req, res) => {
  const { deptCode } = req.query;
  const request = await DutyModel.getEmployees(deptCode);
  if (!request) return res.status(500).json(null);
  return res.status(200).json(request);
};

const getEmployeeDtr = async (req, res) => {
  const requestMonth = req.query.month;
  const requestYear = req.query.year;
  const fromDate = req.query.dateFrom;
  const toDate = req.query.dateTo;
  let startDate;
  let endDate;

  if (fromDate && toDate) {
    startDate = fromDate;
    endDate = toDate;
  } else {
    if (requestMonth === undefined && requestYear === undefined) {
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
      const firstDayOfMonth = new Date(
        Date.UTC(requestYear, requestMonth - 1, 1),
      );
      startDate = firstDayOfMonth.toISOString().split("T")[0];
      const lastDayOfMonth = new Date(requestYear, requestMonth, 1);
      endDate = lastDayOfMonth.toISOString().split("T")[0];
    }
  }

  const employeeCode = req.query.employeeCode ? req.query.employeeCode : "";
  const deptCode = req.query.deptCode ? req.query.deptCode : "";

  const success = await DutyModel.getEmployeeDtr(
    startDate,
    endDate,
    employeeCode,
    deptCode,
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

  if (!dataWithFormattedTime) return res.status(500).json(null);

  const employeeDtr = dataWithFormattedTime;
  const scheduleResult = await DutyModel.getSchedule();

  if (!scheduleResult) return res.status(500).json(null);

  const schedule = scheduleResult.map((schedule) => {
    schedule.from = new Date(schedule.from).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    schedule.to = new Date(schedule.to).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    schedule.dateCreated = new Date(schedule.dateCreated);
    return schedule;
  });

  return res.status(200).json({ employeeDtr, schedule });
};

const setSchedule = async (req, res) => {
  try {
    const { dataArray } = req.body;
    const createdBy = req.user.employee_id;

    const result = await sqlHelper.transact(async (txn) => {
      const finalResult = [];

      for (const data of dataArray) {
        const { employeeCode, dateSelected, timeSelected } = data;

        const existingSchedule = await DutyModel.checkDuplicateSchedule(
          employeeCode,
          dateSelected,
        );

        const scheduleData = {
          SCHEDID: timeSelected,
          EMPCODE: employeeCode,
          DATE: dateSelected,
          ActiveSched: 1,
          TYPE: "SCHEDULE",
          CreatedBy: createdBy,
        };

        if (existingSchedule.length > 0) {
          const updated = await DutyModel.updateSetSchedule(
            scheduleData,
            { ID: existingSchedule[0].iD },
            txn,
            "DateCreated",
          );
          finalResult.push({ success: !!updated, action: "updated" });
        } else {
          const inserted = await DutyModel.setNewSchedule(
            scheduleData,
            txn,
            "DateCreated",
          );
          finalResult.push({ success: !!inserted, action: "inserted" });
        }
      }
      return finalResult;
    });
    const allSuccessful = result.every((result) => result.success);

    if (!allSuccessful) {
      throw new Error("Error in processing some schedules");
    }

    const updatedCount = result.filter((r) => r.action === "updated").length;
    const insertedCount = result.filter((r) => r.action === "inserted").length;

    return res.status(200).json({
      body: `Successfully processed ${dataArray.length} schedule(s): ${insertedCount} inserted, ${updatedCount} updated`,
    });
  } catch (error) {
    return res.status(500).json({ body: error.message });
  }
};

// const setSchedule = async (req, res) => {
//   try {
//     const { dataArray } = req.body;

//     const { employeeCode, dateSelected, timeSelected } = dataArray[0];
//     const createdBy = req.user.employee_id;

//     const existingSchedule = await DutyModel.checkDuplicateSchedule(
//       employeeCode,
//       dateSelected,
//     );

//     const scheduleData = {
//       SCHEDID: timeSelected,
//       EMPCODE: employeeCode,
//       DATE: dateSelected,
//       ActiveSched: 1,
//       TYPE: "SCHEDULE",
//       CreatedBy: createdBy,
//     };

//     if (existingSchedule.length > 0) {
//       const updated = await sqlHelper.transact(async (txn) => {
//         return await DutyModel.updateSetSchedule(
//           scheduleData,
//           { ID: existingSchedule[0].iD },
//           txn,
//           "DateCreated",
//         );
//       });

//       if (!updated) throw new Error("Error in updating schedule");

//       return res.status(200).json({ body: "Schedule updated successfully" });
//     }

//     const inserted = await sqlHelper.transact(async (txn) => {
//       return await DutyModel.setNewSchedule(scheduleData, txn, "DateCreated");
//     });

//     if (!inserted) throw new Error("Error in setting new schedule");

//     return res.status(200).json({ body: "New schedule set successfully" });
//   } catch (error) {
//     return res.status(500).json({ body: error.message });
//   }
// };

const submitNewSchedule = async (req, res) => {
  const { timeFrom, timeTo, restDay, dayOff, withBreak } = req.body;
  const createdBy = req.user.employee_id;

  const checkDuplicateTime = await DutyModel.checkDuplicateTime(
    timeFrom,
    timeTo,
  );

  if (checkDuplicateTime && checkDuplicateTime.length > 0)
    return res.status(409).json({
      body: "The inputted time from and time to has a duplicate in the schedule. Kindly check it.",
    });

  const insert = await sqlHelper.transact(async (txn) => {
    return await DutyModel.insertNewSchedule(
      {
        "[FROM]": timeFrom,
        "[TO]": timeTo,
        Deleted: 0,
        CreatedBy: createdBy,
        WithBreak: withBreak,
        DOFF1: dayOff,
        DOFF2: restDay,
      },
      txn,
      "DateCreated",
    );
  });

  if (!insert)
    return res.status(500).json({ body: "Error in creating a new schedule" });

  return res.status(200).json({ body: "Success on creating a new schedule" });
};

const getPermanentScheduleList = async (req, res) => {
  try {
    const response = await DutyModel.getPermanentScheduleList();
    if (response.length === 0) res.status(409).json(null);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ body: "Internal Server Error" });
  }
};

const setPermanentSched = async (req, res) => {
  try {
    const creatorCode = req.user.employee_id;
    const { employeeCode, schedId } = req.body;
    const insert = await sqlHelper.transact(async (txn) => {
      return await DutyModel.insertPermanentSched(
        {
          SCHEDID: schedId,
          EMPCODE: employeeCode,
          CreatedBy: creatorCode,
        },
        txn,
        "DateCreated",
      );
    });

    if (!insert || insert.length === 0) {
      res.status(409).json({ body: "Failed in setting permanent schedule" });
    }

    res.status(200).json({ body: "Success setting permanent schedule" });
  } catch (error) {
    res.status(500).json({ body: "Internal Server Error" });
  }
};

module.exports = {
  getDepartment,
  getEmployees,
  getEmployeeDtr,
  setSchedule,
  submitNewSchedule,
  getPermanentScheduleList,
  setPermanentSched,
};

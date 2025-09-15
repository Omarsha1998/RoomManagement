const DTR = require("../models/DTRModel.js");

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

    // if (requestMonth === undefined && requestYear === undefined) {
    //   const currentDate = new Date();
    //   const firstDayOfMonth = new Date(
    //     Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1),
    //   );
    //   startDate = firstDayOfMonth.toISOString().split("T")[0];
    //   const lastDayOfMonth = new Date(
    //     currentDate.getFullYear(),
    //     currentDate.getMonth() + 1,
    //     1,
    //   );
    //   endDate = lastDayOfMonth.toISOString().split("T")[0];
    // } else {
    //   const firstDayOfMonth = new Date(
    //     Date.UTC(requestYear, requestMonth - 1, 1),
    //   );
    //   startDate = firstDayOfMonth.toISOString().split("T")[0];
    //   const lastDayOfMonth = new Date(requestYear, requestMonth, 1);
    //   endDate = lastDayOfMonth.toISOString().split("T")[0];
    // }

    // const employeeCode = req.user.employee_id;
    // const additionalParameter = "";

    // const success = await DTR.getDTRDetails(
    //   startDate,
    //   endDate,
    //   employeeCode,
    //   additionalParameter,
    // );

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

module.exports = { getDTRDetails, noDtrEmployee };

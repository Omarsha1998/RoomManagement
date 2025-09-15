/* eslint-disable no-prototype-builtins */
/* eslint-disable no-return-assign */
/* eslint-disable no-unused-vars */
const util = require("../../../../helpers/util");
const sqlHelper = require("../../../../helpers/sql");

// MODELS //
const analytics = require("../../models/analyticsModel.js");
// MODELS //

const getAverageMonthlyCensus = async function (payload, analyticsData) {
  const dateKey = "periodMonthID";
  const dateRange = util.groupBy(payload, dateKey);
  const dateData = util.getObjectKeys(dateRange);

  await util.sortStringArr(dateData);
  const newDateData = [];
  for (const dateArr of dateData) {
    newDateData.push(analyticsData.monthsHashMap[dateArr].shortName);
  }

  const arrData = await util.groupBy(payload, "cAT1");
  const series = [];
  for (const seriesData in arrData) {
    const groupedData = arrData[seriesData];
    const arrObj = [];
    for (const key of dateData) {
      const filterDates = groupedData.filter((filterDates) => {
        return filterDates[dateKey] === key;
      });

      if (filterDates.length > 0) {
        let sum = 0;
        let count = 0;
        for (const overallTotal of filterDates) {
          sum += overallTotal.ctr;
          count += 1;
        }

        const average = util.computeAverage(sum, count).toFixed(0);
        arrObj.push(average);
      } else {
        arrObj.push(0);
      }
    }
    series.push({
      name: seriesData,
      data: arrObj,
    });
  }

  // Detailed //

  // Columns //
  const sortedCols = util.sortMonthObjMap(payload, "periodMonthID", "desc");
  const groupDetailed = util.groupBy(sortedCols, "cAT1");
  const cols = [
    {
      name: "CATEGORY",
      align: "center",
      label: "CATEGORY",
      field: "CATEGORY",
      sortable: true,
    },
  ];
  for (const group in groupDetailed) {
    for (const innerGroup of groupDetailed[group]) {
      cols.push({
        name: analyticsData.monthsHashMap[innerGroup.periodMonthID].shortName,
        align: "center",
        label: analyticsData.monthsHashMap[innerGroup.periodMonthID].shortName,
        field: analyticsData.monthsHashMap[innerGroup.periodMonthID].shortName,
        sortable: true,
      });
    }
  }

  // Columns //

  // Rows //
  const rows = [];
  for (const list of payload) {
    list.CATEGORY = list.cAT1;
    list[analyticsData.monthsHashMap[list.periodMonthID.toString()].shortName] =
      list.ctr;

    delete list.reportPeriod;
    delete list.periodyear;
    delete list.periodmonth;
    delete list.periodday;
    delete list.cAT1;
    delete list.ctr;
  }

  const cloneRows = JSON.parse(JSON.stringify(rows));
  await util.sortStringArr(cloneRows);

  const rowsAverage = calculateAverage(payload);
  // Rows

  // Total //
  const totals = { CATEGORY: "AVERAGE DAILY CENSUS" };

  let overallSum = 0;
  let overallCount = 0;
  rowsAverage.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        totals[key] = (totals[key] || 0) + Number(value);
      }
    });
  });

  Object.entries(totals).forEach(([key, value]) => {
    if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
      overallSum += Number(value);
      overallCount += 1;
    }
  });

  // Total //

  const tableData = {
    columns: util.removeDuplicates(cols),
    rows: rowsAverage,
    totals: [totals],
  };

  // Detailed //

  return {
    category: util.sortedMonths(newDateData),
    series: series,
    detailed: tableData,
  };
};

const getAverageDailyCensus = async function (payload, analyticsData) {
  const dateKey = "periodday";
  const dateRange = util.groupBy(payload, dateKey);
  const dateData = util.getObjectKeys(dateRange);
  await util.sortStringArr(dateData);

  const arrData = await util.groupBy(payload, "cAT1");
  const series = [];
  for (const seriesData in arrData) {
    const groupedData = arrData[seriesData];
    const arrObj = [];
    for (const key of dateData) {
      const filterDates = groupedData.filter((filterDates) => {
        return filterDates[dateKey] === key;
      });

      if (filterDates.length > 0) {
        arrObj.push(filterDates[0].ctr);
      } else {
        arrObj.push(0);
      }
    }
    series.push({
      name: seriesData,
      data: arrObj,
    });
  }

  // Detailed //

  // Columns //
  const groupDetailed = util.groupBy(payload, "cAT1");
  const cols = [
    {
      name: "CATEGORY",
      align: "center",
      label: "CATEGORY",
      field: "CATEGORY",
      sortable: true,
    },
  ];
  for (const group in groupDetailed) {
    for (const innerGroup of groupDetailed[group]) {
      cols.push({
        name: innerGroup.periodday,
        align: "center",
        label: innerGroup.periodday,
        field: innerGroup.periodday,
        sortable: true,
      });
    }
  }

  cols.push({
    name: "DAILY AVERAGE",
    align: "center",
    label: "DAILY AVERAGE",
    field: "DAILY AVERAGE",
    sortable: true,
  });
  // Columns //

  // Rows //
  const rows = [];
  let counter = 0;
  for (const list of payload) {
    list.CATEGORY = list.cAT1;
    list.rowKey = `${list.cAT1}${list.periodmonth}${list.periodday}${counter++}`;
    list[list.periodday] = list.ctr;
  }

  payload.forEach((item) => {
    const categoryIndex = rows.findIndex((e) => e.CATEGORY === item.CATEGORY);
    if (categoryIndex === -1) {
      rows.push({
        CATEGORY: item.CATEGORY,
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([key]) =>
              key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE",
          ),
        ),
      });
    } else {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE") {
          rows[categoryIndex][key] = value;
        }
      });
    }
  });

  const cloneRows = JSON.parse(JSON.stringify(rows));
  await util.sortStringArr(cloneRows);

  for (const cloneRow of cloneRows) {
    for (const col of util.removeDuplicates(cols)) {
      if (cloneRow[col.name] === undefined) {
        cloneRow[col.name] = 0;
      }
    }

    delete cloneRow.reportPeriod;
    delete cloneRow.periodyear;
    delete cloneRow.periodMonthID;
    delete cloneRow.periodmonth;
    delete cloneRow.periodday;
    delete cloneRow.cAT1;
    delete cloneRow.ctr;
    delete cloneRow.rowKey;
  }

  const calculateAverage = (obj) => {
    let sum = 0;
    let count = 0;

    Object.entries(obj).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        sum += value;
        count += 1;
      }
    });
    const total = sum / count;
    return util.truncateToTwoDecimalsWithoutRounding(total, 2);
  };

  const averages = {};

  Object.entries(cloneRows).forEach(([key, value]) => {
    averages[value.CATEGORY] = calculateAverage(value);
  });

  cloneRows.forEach((item, index) => {
    item["DAILY AVERAGE"] = averages[item.CATEGORY];
    // item.CATEGORY = `${index + 1}. ${item.CATEGORY.split(". ")[1]}`;
  });

  // Rows

  // Total //
  const totals = { CATEGORY: "TOTAL" };

  let overallSum = 0;
  let overallCount = 0;
  cloneRows.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        totals[key] = (totals[key] || 0) + value;
      }
    });
  });

  Object.entries(totals).forEach(([key, value]) => {
    if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
      overallSum += value;
      overallCount += 1;
    }
  });

  const average = overallSum / overallCount;
  totals["DAILY AVERAGE"] = util.truncateToTwoDecimalsWithoutRounding(
    average,
    2,
  );

  // Total //

  const tableData = {
    columns: util.removeDuplicates(cols),
    rows: cloneRows,
    totals: [totals],
  };

  // Detailed //

  return {
    category: dateData,
    series: series,
    detailed: tableData,
  };
};

const getDailyCensusByPatientType = async function (payload, analyticsData) {
  const dateKey = "periodday";
  const dateRange = util.groupBy(payload, dateKey);
  const dateData = util.getObjectKeys(dateRange);
  await util.sortStringArr(dateData);

  const arrData = await util.groupBy(payload, "cAT2");
  const series = [];
  for (const seriesData in arrData) {
    const groupedData = arrData[seriesData];
    const arrObj = [];
    for (const key of dateData) {
      const filterDates = groupedData.filter((filterDates) => {
        return filterDates[dateKey] === key;
      });

      if (filterDates.length > 0) {
        arrObj.push(filterDates[0].ctr);
      } else {
        arrObj.push(0);
      }
    }
    series.push({
      name: seriesData,
      data: arrObj,
    });
  }

  // Detailed //

  // Columns //
  const groupDetailed = util.groupBy(payload, "cAT2");
  const cols = [
    {
      name: "CATEGORY",
      align: "center",
      label: "PATIENT TYPE",
      field: "CATEGORY",
      sortable: true,
    },
  ];

  for (const group in groupDetailed) {
    for (const innerGroup of groupDetailed[group]) {
      cols.push({
        name: innerGroup.periodday,
        align: "center",
        label: innerGroup.periodday,
        field: innerGroup.periodday,
        sortable: true,
      });
    }
  }

  cols.push({
    name: "DAILY AVERAGE",
    align: "center",
    label: "TOTAL",
    field: "DAILY AVERAGE",
    sortable: true,
  });

  // Columns //

  const totals = { CATEGORY: "TOTAL" };

  // Rows //
  const rows = [];
  let counter = 0;
  for (const [index, list] of payload.entries()) {
    list.CATEGORY = list.cAT2;
    list.rowKey = `${list.cAT2}${list.periodmonth}${list.periodday}${counter++}`;
    list[list.periodday] = list.ctr;
  }

  payload.forEach((item) => {
    const categoryIndex = rows.findIndex((e) => e.CATEGORY === item.CATEGORY);
    if (categoryIndex === -1) {
      rows.push({
        CATEGORY: item.CATEGORY,
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([key]) =>
              key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE",
          ),
        ),
      });
    } else {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE") {
          rows[categoryIndex][key] = value;
        }
      });
    }
  });

  const cloneRows = JSON.parse(JSON.stringify(rows));
  await util.sortStringArr(cloneRows);

  for (const cloneRow of cloneRows) {
    for (const col of util.removeDuplicates(cols)) {
      if (cloneRow[col.name] === undefined) {
        cloneRow[col.name] = 0;
      }
    }

    delete cloneRow.reportPeriod;
    delete cloneRow.periodyear;
    delete cloneRow.periodMonthID;
    delete cloneRow.periodmonth;
    delete cloneRow.periodday;
    delete cloneRow.cAT1;
    delete cloneRow.cAT2;
    delete cloneRow.ctr;
    delete cloneRow.rowKey;
  }

  const calculateAverage = (obj) => {
    let sum = 0;
    let count = 0;

    Object.entries(obj).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        sum += value;
        count += 1;
      }
    });

    const total = sum / count;

    return util.truncateToTwoDecimalsWithoutRounding(total, 2);
  };

  const averages = {};

  Object.entries(cloneRows).forEach(([key, value]) => {
    averages[value.CATEGORY] = calculateAverage(value);
  });

  cloneRows.forEach((item, index) => {
    item["DAILY AVERAGE"] = averages[item.CATEGORY];
    // item.CATEGORY = `${index + 1}. ${item.CATEGORY.split(". ")[1]}`;
  });

  // Rows

  let overallSum = 0;
  let overallCount = 0;
  cloneRows.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        totals[key] = (totals[key] || 0) + value;
      }
    });
  });

  Object.entries(totals).forEach(([key, value]) => {
    if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
      overallSum += value;
      overallCount += 1;
    }
  });

  const average = overallSum / overallCount;
  totals["DAILY AVERAGE"] = util.truncateToTwoDecimalsWithoutRounding(
    average,
    2,
  );

  // Total //

  const tableData = {
    columns: util.removeDuplicates(cols),
    rows: cloneRows,
    totals: [totals],
  };
  // Detailed

  return {
    category: dateData,
    series: series,
    detailed: tableData,
  };
};

const getDailyRevenue = async function (payload, analyticsData) {
  const dateKey = "periodday";
  const dateRange = util.groupBy(payload, dateKey);
  const dateData = util.getObjectKeys(dateRange);

  const arrData = await util.groupBy(payload, "dEPTDESC");
  const series = [];
  for (const seriesData in arrData) {
    const groupedData = arrData[seriesData];
    const arrObj = [];
    for (const key of dateData) {
      const filterDates = groupedData.filter((filterDates) => {
        return filterDates[dateKey] === key;
      });

      if (filterDates.length > 0) {
        arrObj.push(filterDates[0].ctr);
      } else {
        arrObj.push(0);
      }
    }
    series.push({
      name: seriesData,
      data: arrObj,
    });
  }

  // Detailed //

  // Columns //
  const groupDetailed = util.groupBy(payload, "dEPTDESC");
  const cols = [
    {
      name: "CATEGORY",
      align: "center",
      label: "DEPARTMENT",
      field: "CATEGORY",
      sortable: true,
    },
  ];

  for (const group in groupDetailed) {
    for (const innerGroup of groupDetailed[group]) {
      cols.push({
        name: innerGroup.periodweekdaydesc,
        align: "center",
        label: innerGroup.periodweekdaydesc,
        field: innerGroup.periodweekdaydesc,
        sortable: true,
      });
    }
  }
  cols.push({
    name: "TOTAL",
    align: "center",
    label: "TOTAL",
    field: "TOTAL",
    sortable: true,
  });
  // Columns //

  // Rows //
  const rows = [];
  let counter = 0;
  for (const [index, list] of payload.entries()) {
    list.CATEGORY = list.dEPTDESC;
    list.rowKey = `${list.dEPTDESC}${list.periodmonth}${list.periodday}${counter++}`;
    list[list.periodweekdaydesc] = list.nETOFDISCOUNT
      .toFixed(2)
      .replace(/\d(?=(\d{3})+\.)/g, "$&,");

    delete list.reportPeriod;
    delete list.periodyear;
    delete list.periodmonth;
    delete list.periodMonthID;
    delete list.periodday;
    delete list.periodweekday;
    delete list.periodweekdaydesc;
    delete list.period;
    delete list.dEPTCODE;
    delete list.revenueorder;
    delete list.dEPTDESC;
    delete list.pATIENTCOUNT;
    delete list.cSCOUNT;
    delete list.cHARGES;
    delete list.pHIC;
    delete list.hMO;
    delete list.dISCOUNT;
    delete list.nETOFDISCOUNT;
    delete list.rowKey;
    delete list.tAG;
  }

  payload.forEach((item) => {
    const categoryIndex = rows.findIndex((e) => e.CATEGORY === item.CATEGORY);
    if (categoryIndex === -1) {
      rows.push({
        CATEGORY: item.CATEGORY,
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([key]) =>
              key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE",
          ),
        ),
      });
    } else {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE") {
          rows[categoryIndex][key] = value;
        }
      });
    }
  });

  const cloneRows = JSON.parse(JSON.stringify(rows));

  for (const cloneRow of cloneRows) {
    for (const col of util.removeDuplicates(cols)) {
      if (cloneRow[col.name] === undefined) {
        cloneRow[col.name] = 0;
      }
    }
  }

  let sum = 0;
  let count = 0;
  const calculateAverage = (obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        sum += value;
        count += 1;
      }
    });

    const total = sum / count;

    return util.truncateToTwoDecimalsWithoutRounding(total, 2);
  };

  const averages = {};

  Object.entries(cloneRows).forEach(([key, value]) => {
    averages[value.CATEGORY] = calculateAverage(value);
  });

  cloneRows.forEach((item, index) => {
    let totalSum = 0;
    for (const key in item) {
      if (key !== "CATEGORY" && key !== "TOTAL" && key !== "DAILY AVERAGE") {
        const value = parseFloat(String(item[key]).replace(/,/g, ""));
        totalSum += value;
      }
    }
    item.TOTAL = totalSum.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    // item.CATEGORY = `${index + 1}. ${item.CATEGORY.split(". ")[1]}`;
  });

  // Rows

  // Total
  const totals = { CATEGORY: "TOTAL" };
  // Iterate through each object
  cloneRows.forEach((data) => {
    for (const key in data) {
      if (key !== "CATEGORY") {
        if (!totals[key]) {
          totals[key] = 0;
        }
        totals[key] += parseFloat(String(data[key]).replace(/,/g, ""));
      }
    }
  });

  for (const key in totals) {
    if (key !== "CATEGORY" && totals[key] !== "TOTAL") {
      totals[key] = parseFloat(String(totals[key]).replace(/,/g, ""));
      totals[key] = totals[key].toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    }
  }
  // Total //
  const tableData = {
    columns: util.removeDuplicates(cols),
    rows: cloneRows,
    totals: [totals],
  };
  // Detailed

  return {
    category: dateData,
    series: series,
    detailed: tableData,
  };
};

const getMonthlyRevenueVsLastYear = async function (payload, analyticsData) {
  const dateKey = "periodMonthID";
  const dateRange = util.groupBy(payload, dateKey);
  const dateData = util.getObjectKeys(dateRange);
  const newDateData = [];
  for (const dateArr of dateData) {
    newDateData.push(analyticsData.monthsHashMap[dateArr].shortName);
  }

  const arrData = await util.groupBy(payload, "periodyear");
  const series = [];

  Object.entries(arrData).forEach(([key, value]) => {
    for (const innerKey in value) {
      value[innerKey].periodMonthIDDesc =
        analyticsData.monthsHashMap[value[innerKey].periodMonthID].shortName;
      util.sortMonthObj(value, "periodMonthIDDesc");
    }
  });

  for (const seriesData in arrData) {
    const groupedData = arrData[seriesData];
    const arrObj = [];
    for (const key of dateData) {
      const filterDates = groupedData.filter((filterDates) => {
        return filterDates[dateKey] === key;
      });

      if (filterDates.length > 0) {
        let sum = 0;
        for (const overallTotal of filterDates) {
          sum += overallTotal.nETOFDISCOUNT;
        }
        arrObj.push(sum.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,"));
      } else {
        arrObj.push(0);
      }
    }
    series.push({
      name: seriesData,
      data: arrObj,
    });
  }

  // Detailed //

  // Columns //
  const groupDetailed = util.groupBy(payload, "periodyear");
  const cols = [
    {
      name: "CATEGORY",
      align: "center",
      label: "MONTH",
      field: "CATEGORY",
      sortable: true,
    },
  ];

  for (const group in groupDetailed) {
    for (const innerGroup of groupDetailed[group]) {
      cols.push({
        name: innerGroup.periodyear,
        align: "center",
        label: innerGroup.periodyear,
        field: innerGroup.periodyear,
        sortable: true,
      });
    }
  }

  // cols.push({
  //   name: "TOTAL",
  //   align: "center",
  //   label: "TOTAL",
  //   field: "TOTAL",
  //   sortable: true,
  // });
  // Columns //

  // Rows //
  let rows = [];
  let counter = 0;
  util.sortedMonths(newDateData);
  for (const [index, list] of payload.entries()) {
    list.CATEGORY = analyticsData.monthsHashMap[[list.periodMonthID]].shortName;
    list.rowKey = `${list.periodMonthID}${list.periodmonth}${list.periodday}${counter++}`;
    list[list.periodyear] = list.nETOFDISCOUNT.toFixed(2);
    delete list.reportPeriod;
    delete list.periodmonth;
    delete list.periodMonthID;
    delete list.periodday;
    delete list.periodweekday;
    delete list.periodweekdaydesc;
    delete list.period;
    delete list.dEPTCODE;
    delete list.revenueorder;
    delete list.dEPTDESC;
    delete list.pATIENTCOUNT;
    delete list.cSCOUNT;
    delete list.cHARGES;
    delete list.pHIC;
    delete list.hMO;
    delete list.dISCOUNT;
    delete list.rowKey;
    delete list.periodyear;
    delete list.nETOFDISCOUNT;
    delete list.periodMonthID;
    delete list.tAG;
  }

  util.sortMonthObj(payload, "CATEGORY");

  // Extract unique years from dataArray
  const uniqueYears = [
    ...new Set(
      payload.flatMap((obj) =>
        Object.keys(obj).filter((key) => key !== "CATEGORY"),
      ),
    ),
  ];
  // Initialize the sum by category and year

  // Initialize the sum by category and year
  const sumByCategoryAndYear = payload.reduce((acc, obj) => {
    const year = Object.keys(obj).find((key) => key !== "CATEGORY");
    const category = obj.CATEGORY.toUpperCase();
    const value = parseFloat(obj[year].replace(/,/g, ""));

    if (!acc[category]) {
      acc[category] = { CATEGORY: category };
      uniqueYears.forEach((y) => (acc[category][y] = 0));
    }

    acc[category][year] += value;
    return acc;
  }, {});

  // Format the results and add the total
  rows = Object.values(sumByCategoryAndYear).map((obj) => {
    let total = 0;
    uniqueYears.forEach((year) => {
      obj[year] = obj[year].toFixed(2);
      total += parseFloat(obj[year]);
    });
    obj.TOTAL = total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    return obj;
  });
  // Rows //

  // Total //
  const totals = { CATEGORY: "TOTAL" };
  // Iterate through each object
  rows.forEach((data) => {
    for (const key in data) {
      if (key !== "CATEGORY") {
        uniqueYears.forEach((year) => {
          data[year] = data[year].replace(/\d(?=(\d{3})+\.)/g, "$&,");
        });
        if (!totals[key]) {
          totals[key] = 0;
        }
        totals[key] += parseFloat(String(data[key]).replace(/,/g, ""));
      }
    }
  });

  for (const key in totals) {
    if (key !== "CATEGORY" && totals[key] !== "TOTAL") {
      totals[key] = parseFloat(String(totals[key]).replace(/,/g, ""));
      totals[key] = totals[key].toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    }
  }
  // Total //

  const tableData = {
    columns: util.removeDuplicates(cols),
    rows: rows,
    totals: [totals],
  };
  // Detailed

  return {
    category: newDateData,
    series: series,
    detailed: tableData,
  };
};

const getPatientCensus = async function (payload, analyticsData) {
  const dateKey = "periodday";
  const dateRange = util.groupBy(payload, dateKey);
  const dateData = util.getObjectKeys(dateRange);

  const arrData = await util.groupBy(payload, "dEPTDESC");
  const series = [];
  for (const seriesData in arrData) {
    const groupedData = arrData[seriesData];
    const arrObj = [];
    for (const key of dateData) {
      const filterDates = groupedData.filter((filterDates) => {
        return filterDates[dateKey] === key;
      });

      if (filterDates.length > 0) {
        arrObj.push(filterDates[0].ctr);
      } else {
        arrObj.push(0);
      }
    }
    series.push({
      name: seriesData,
      data: arrObj,
    });
  }

  // Detailed //

  // Columns //
  const groupDetailed = util.groupBy(payload, "dEPTDESC");
  const cols = [
    {
      name: "CATEGORY",
      align: "center",
      label: "DEPARTMENT",
      field: "CATEGORY",
      sortable: true,
    },
  ];

  for (const group in groupDetailed) {
    for (const innerGroup of groupDetailed[group]) {
      cols.push({
        name: innerGroup.periodweekdaydesc,
        align: "center",
        label: innerGroup.periodweekdaydesc,
        field: innerGroup.periodweekdaydesc,
        sortable: true,
      });
    }
  }

  cols.push({
    name: "TOTAL",
    align: "center",
    label: "TOTAL",
    field: "TOTAL",
    sortable: true,
  });
  // Columns //

  // Rows //
  const rows = [];
  let counter = 0;
  for (const [index, list] of payload.entries()) {
    list.CATEGORY = list.dEPTDESC;
    list.rowKey = `${list.dEPTDESC}${list.periodmonth}${list.periodday}${counter++}`;
    list[list.periodweekdaydesc] = list.pATIENTCOUNT;

    delete list.reportPeriod;
    delete list.periodyear;
    delete list.periodmonth;
    delete list.periodMonthID;
    delete list.periodday;
    delete list.periodweekday;
    delete list.periodweekdaydesc;
    delete list.period;
    delete list.dEPTCODE;
    delete list.revenueorder;
    delete list.dEPTDESC;
    delete list.pATIENTCOUNT;
    delete list.cSCOUNT;
    delete list.cHARGES;
    delete list.pHIC;
    delete list.hMO;
    delete list.dISCOUNT;
    delete list.nETOFDISCOUNT;
    delete list.rowKey;
    delete list.tAG;
  }

  payload.forEach((item) => {
    const categoryIndex = rows.findIndex((e) => e.CATEGORY === item.CATEGORY);
    if (categoryIndex === -1) {
      rows.push({
        CATEGORY: item.CATEGORY,
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([key]) =>
              key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE",
          ),
        ),
      });
    } else {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE") {
          rows[categoryIndex][key] = value;
        }
      });
    }
  });

  const cloneRows = JSON.parse(JSON.stringify(rows));

  for (const cloneRow of cloneRows) {
    for (const col of util.removeDuplicates(cols)) {
      if (cloneRow[col.name] === undefined) {
        cloneRow[col.name] = 0;
      }
    }
  }

  let sum = 0;
  let count = 0;
  const calculateAverage = (obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        sum += value;
        count += 1;
      }
    });

    const total = sum / count;

    return util.truncateToTwoDecimalsWithoutRounding(total, 2);
  };

  util.sortStringArr(cloneRows, "CATEGORY");

  const averages = {};

  Object.entries(cloneRows).forEach(([key, value]) => {
    averages[value.CATEGORY] = calculateAverage(value);
  });

  cloneRows.forEach((item, index) => {
    let totalSum = 0;
    for (const key in item) {
      if (key !== "CATEGORY" && key !== "TOTAL" && key !== "DAILY AVERAGE") {
        const value = parseFloat(String(item[key]).replace(/,/g, ""));
        totalSum += value;
      }
    }
    item.TOTAL = totalSum;
    // item.CATEGORY = `${index + 1}. ${item.CATEGORY.split(". ")[1]}`;
  });

  // Rows

  // Total
  const totals = { CATEGORY: "TOTAL" };
  // Iterate through each object
  cloneRows.forEach((data) => {
    for (const key in data) {
      if (key !== "CATEGORY") {
        if (!totals[key]) {
          totals[key] = 0;
        }
        totals[key] += parseFloat(String(data[key]).replace(/,/g, ""));
      }
    }
  });

  for (const key in totals) {
    if (key !== "CATEGORY" && totals[key] !== "TOTAL") {
      totals[key] = parseFloat(String(totals[key]).replace(/,/g, ""));
      totals[key] = totals[key].toFixed(0);
    }
  }
  // Total //
  const tableData = {
    columns: util.removeDuplicates(cols),
    rows: cloneRows,
    totals: [totals],
  };
  // Detailed

  return {
    category: dateData,
    series: series,
    detailed: tableData,
  };
};

const getVolumeOfProcedures = async function (payload, analyticsData) {
  const dateKey = "periodday";
  const dateRange = util.groupBy(payload, dateKey);
  const dateData = util.getObjectKeys(dateRange);

  const arrData = await util.groupBy(payload, "dEPTDESC");
  const series = [];
  for (const seriesData in arrData) {
    const groupedData = arrData[seriesData];
    const arrObj = [];
    for (const key of dateData) {
      const filterDates = groupedData.filter((filterDates) => {
        return filterDates[dateKey] === key;
      });

      if (filterDates.length > 0) {
        arrObj.push(filterDates[0].ctr);
      } else {
        arrObj.push(0);
      }
    }
    series.push({
      name: seriesData,
      data: arrObj,
    });
  }

  // Detailed //

  // Columns //
  const groupDetailed = util.groupBy(payload, "dEPTDESC");
  const cols = [
    {
      name: "CATEGORY",
      align: "center",
      label: "DEPARTMENT",
      field: "CATEGORY",
      sortable: true,
    },
  ];

  for (const group in groupDetailed) {
    for (const innerGroup of groupDetailed[group]) {
      cols.push({
        name: innerGroup.periodweekdaydesc,
        align: "center",
        label: innerGroup.periodweekdaydesc,
        field: innerGroup.periodweekdaydesc,
        sortable: true,
      });
    }
  }

  cols.push({
    name: "TOTAL",
    align: "center",
    label: "TOTAL",
    field: "TOTAL",
    sortable: true,
  });
  // Columns //

  // Rows //
  const rows = [];
  let counter = 0;
  for (const [index, list] of payload.entries()) {
    list.CATEGORY = list.dEPTDESC;
    list.rowKey = `${list.dEPTDESC}${list.periodmonth}${list.periodday}${counter++}`;
    list[list.periodweekdaydesc] = list.cSCOUNT;

    delete list.reportPeriod;
    delete list.periodyear;
    delete list.periodmonth;
    delete list.periodMonthID;
    delete list.periodday;
    delete list.periodweekday;
    delete list.periodweekdaydesc;
    delete list.period;
    delete list.dEPTCODE;
    delete list.revenueorder;
    delete list.dEPTDESC;
    delete list.pATIENTCOUNT;
    delete list.cSCOUNT;
    delete list.cHARGES;
    delete list.pHIC;
    delete list.hMO;
    delete list.dISCOUNT;
    delete list.nETOFDISCOUNT;
    delete list.rowKey;
    delete list.tAG;
  }

  payload.forEach((item) => {
    const categoryIndex = rows.findIndex((e) => e.CATEGORY === item.CATEGORY);
    if (categoryIndex === -1) {
      rows.push({
        CATEGORY: item.CATEGORY,
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([key]) =>
              key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE",
          ),
        ),
      });
    } else {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== "CATEGORY" && key !== "key" && key !== "DAILY AVERAGE") {
          rows[categoryIndex][key] = value;
        }
      });
    }
  });

  const cloneRows = JSON.parse(JSON.stringify(rows));

  for (const cloneRow of cloneRows) {
    for (const col of util.removeDuplicates(cols)) {
      if (cloneRow[col.name] === undefined) {
        cloneRow[col.name] = 0;
      }
    }
  }

  let sum = 0;
  let count = 0;
  const calculateAverage = (obj) => {
    Object.entries(obj).forEach(([key, value]) => {
      if (key !== "CATEGORY" && key !== "DAILY AVERAGE") {
        sum += value;
        count += 1;
      }
    });

    const total = sum / count;

    return util.truncateToTwoDecimalsWithoutRounding(total, 2);
  };

  util.sortStringArr(cloneRows, "CATEGORY");

  const averages = {};

  Object.entries(cloneRows).forEach(([key, value]) => {
    averages[value.CATEGORY] = calculateAverage(value);
  });

  cloneRows.forEach((item, index) => {
    let totalSum = 0;
    for (const key in item) {
      if (key !== "CATEGORY" && key !== "TOTAL" && key !== "DAILY AVERAGE") {
        const value = parseFloat(String(item[key]).replace(/,/g, ""));
        totalSum += value;
      }
    }
    item.TOTAL = totalSum;
    // item.CATEGORY = `${index + 1}. ${item.CATEGORY.split(". ")[1]}`;
  });

  // Rows

  // Total
  const totals = { CATEGORY: "TOTAL" };
  // Iterate through each object
  cloneRows.forEach((data) => {
    for (const key in data) {
      if (key !== "CATEGORY") {
        if (!totals[key]) {
          totals[key] = 0;
        }
        totals[key] += parseFloat(String(data[key]).replace(/,/g, ""));
      }
    }
  });

  for (const key in totals) {
    if (key !== "CATEGORY" && totals[key] !== "TOTAL") {
      totals[key] = parseFloat(String(totals[key]).replace(/,/g, ""));
      totals[key] = totals[key].toFixed(0);
    }
  }
  // Total //
  const tableData = {
    columns: util.removeDuplicates(cols),
    rows: cloneRows,
    totals: [totals],
  };
  // Detailed

  return {
    category: dateData,
    series: series,
    detailed: tableData,
  };
};

function calculateAverage(data) {
  // Step 1: Group by category and collect all month fields
  const groupedData = data.reduce((acc, item) => {
    const category = item.CATEGORY;
    if (!acc[category]) {
      acc[category] = {};
    }

    // Collect all month fields dynamically
    for (const key in item) {
      if (key !== "periodMonthID" && key !== "CATEGORY") {
        if (!acc[category][key]) {
          acc[category][key] = [];
        }
        acc[category][key].push(item[key]);
      }
    }
    return acc;
  }, {});

  // Step 2: Calculate the average for each category and each month
  const averages = {};
  for (const category in groupedData) {
    averages[category] = {};
    for (const month in groupedData[category]) {
      const sum = groupedData[category][month].reduce(
        (acc, value) => (acc += value),
        0,
      );
      const avg = sum / groupedData[category][month].length;
      averages[category][month] = avg.toFixed(0);
    }
  }

  const result = [];

  for (const category in averages) {
    if (averages.hasOwnProperty(category)) {
      const entry = { ...averages[category], CATEGORY: category };
      result.push(entry);
    }
  }

  return result;
}

module.exports = {
  getAverageDailyCensus,
  getAverageMonthlyCensus,
  getDailyCensusByPatientType,
  getDailyRevenue,
  getMonthlyRevenueVsLastYear,
  getPatientCensus,
  getVolumeOfProcedures,
};

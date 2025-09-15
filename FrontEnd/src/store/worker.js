importScripts("https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js");
// importScripts("/excel.js");

self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    const result = await generateExcel(type, data);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

const parseSchedule = async (combinedSchedule) => {
  const regex = /\(([^)]+)\)/g;
  let match;
  const parsed = [];

  while ((match = regex.exec(combinedSchedule)) !== null) {
    const [fullMatch, content] = match;
    const parts = content.split(" - ");

    if (parts.length === 2) {
      const [dayAndSections, timeRange] = parts;
      const [sections, days] = dayAndSections.split(" ");
      const daysList = days
        .split(",")
        .map((day) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase());

      if (sections && timeRange && daysList.length > 0) {
        for (const day of daysList) {
          const [startTime, endTime] = timeRange.split("-");
          const start = new Date(`1970-01-01T${startTime}:00Z`);
          const end = new Date(`1970-01-01T${endTime}:00Z`);
          parsed.push({
            sections,
            day,
            timeRange,
            startTime: start,
            endTime: end,
          });
        }
      } else {
        console.error(`Invalid format in content: ${content}`);
      }
    } else {
      console.error(`Invalid time range format: ${content}`);
    }
  }

  parsed.sort((a, b) => a.startTime - b.startTime);

  return parsed.map(({ sections, day, timeRange }) => ({
    sections,
    day,
    timeRange,
  }));
};

const generateExcel = async (type, data) => {
  const workBook = new ExcelJS.Workbook();
  const allSchedule = data;

  const sheetsMap = new Map();
  const mergedCells = new Map();

  for (const schedule of allSchedule) {
    const {
      name,
      roomId,
      fromDate,
      toDate,
      combinedSchedule,
      subjectCode,
      subjectDescription,
      Days,
      intervals,
      section,
      deptLabel,
      buildingDescription,
      paramFromDate,
      paramToDate,
    } = schedule;

    const MAX_NAME_LENGTH = 31;

    const abbreviateName = (name) => {
      const words = name.split(" ");
      const abbreviation =
        words.map((word) => word.charAt(0)).join("") + `(${roomId})`;
      return abbreviation.slice(0, MAX_NAME_LENGTH);
    };

    const fullSheetName = `${name}(${roomId})`;

    const sheetNameToUse =
      fullSheetName.length > MAX_NAME_LENGTH
        ? abbreviateName(name)
        : fullSheetName;

    let workSheety = workBook.getWorksheet(sheetNameToUse);
    const times = getTimes();

    const roomIdNumber = Number(roomId);

    if (!workSheety) {
      const { workSheet, headerRow } = await createSheet(
        sheetNameToUse,
        roomId,
        workBook,
        buildingDescription,
        fromDate,
        toDate,
        paramFromDate,
        paramToDate,
        type,
        times
      );

      sheetsMap.set(roomIdNumber, { workSheet, headerRow });
    }

    const parsedSchedule = await parseSchedule(combinedSchedule);
    const { workSheet, headerRow } = sheetsMap.get(roomIdNumber);

    await appyScheduleToSheet(
      workSheet,
      times,
      parsedSchedule,
      subjectCode,
      roomId,
      mergedCells,
      subjectDescription,
      headerRow,
      deptLabel,
      type,
      fromDate,
      toDate,
      paramFromDate,
      paramToDate
    );
  }

  const borderStyle = {
    top: { style: "medium", color: { argb: "FF000000" } },
    left: { style: "medium", color: { argb: "FF000000" } },
    bottom: { style: "medium", color: { argb: "FF000000" } },
    right: { style: "medium", color: { argb: "FF000000" } },
  };

  for (const [mergedKey, details] of mergedCells) {
    const [RoomId, startRow, endRow, colIndex] = mergedKey
      .split("-")
      .map(Number);
    const detail =
      typeof details.details === "object"
        ? details.details.join(", \n")
        : details.details;

    const { headerRow, workSheet } = sheetsMap.get(RoomId);
    workSheet.mergeCells(startRow, colIndex, endRow, colIndex);

    const cell = workSheet.getCell(startRow, colIndex);
    cell.value = detail;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.font = { name: "Arial", size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: getCollegeColor(details.college) },
    };

    for (let row = startRow; row <= endRow; row++) {
      workSheet.getCell(row, colIndex).border = borderStyle;
    }

    autoFitColumns(workSheet);
  }

  const buffer = await workBook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return blob;
};

const createSheet = async (
  sheetNameToUse,
  roomId,
  workBook,
  buildingDescription,
  fromDate,
  toDate,
  paramFromDate,
  paramToDate,
  type,
  times
) => {
  const workSheet = workBook.addWorksheet(sheetNameToUse);

  if (type === "Weekly") {
    workSheet.columns = [
      { header: `${buildingDescription}`, key: "time", width: 15 },
    ];

    const headerRow = workSheet.addRow([
      "Time",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);

    workSheet.mergeCells(1, 1, 1, 8); // Row 1, Columns 1 to 8
    const firstRow = workSheet.getRow(1);
    firstRow.height = 60; // Adjust height

    firstRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Arial", size: 15, bold: true }; // Font style
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2689F8" }, // Blue background color
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Arial", size: 11, bold: true };
      cell.alignment = { horizontal: "center", vertical: "center" };
    });

    // Add time rows
    for (const time of times) {
      workSheet.addRow([time]);
    }

    return { workSheet, headerRow };
  } else {
    const fromDate = new Date(paramFromDate);
    const toDate = new Date(paramToDate);
    const monthlyDays = getMonthlyDays(fromDate, toDate);
    let rowIndex = 1;

    for (const days of monthlyDays) {
      workSheet.mergeCells(rowIndex, 1, rowIndex, days.length + 1);
      const cell = workSheet.getCell(rowIndex, 1);
      cell.value = buildingDescription;
      cell.font = { name: "Arial", size: 25, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "2689F8" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      workSheet.getRow(rowIndex).height = 50;
      rowIndex += 1;

      workSheet.getCell(rowIndex, 1).value = "Time";
      workSheet.getCell(rowIndex, 1).font = {
        name: "Arial",
        size: 11,
        bold: true,
      };

      for (const [colIndex, day] of days.entries()) {
        const cell = workSheet.getCell(rowIndex, colIndex + 2);
        cell.value = day.formatted;
        cell.font = { name: "Arial", size: 11, bold: true };
      }

      rowIndex += 1;

      // Add time rows
      for (const time of times) {
        workSheet.getCell(rowIndex, 1).value = time;
        rowIndex += 1;
      }
    }

    return { workSheet, monthlyDays };
  }
};

const appyScheduleToSheet = async (
  workSheet,
  times,
  parsedSchedule,
  subjectCode,
  roomId,
  mergedCells,
  subjectDescription,
  headerRow,
  deptLabel,
  type,
  FromDate,
  ToDate,
  paramFromDate,
  paramToDate
) => {
  const timesMap = new Map(times.map((time, index) => [time, index + 3]));
  if (type === "Weekly") {
    for (const parsed of parsedSchedule) {
      const { day, sections, timeRange } = parsed;
      const [startTime, endTime] = timeRange
        .split("-")
        .map((time) => time.trim());
      const startRow = timesMap.get(startTime);
      const endRow = timesMap.get(endTime);

      if (startRow && endRow) {
        const newColIndex = headerRow.values.indexOf(day);

        if (newColIndex >= 1) {
          let minStartRow = startRow;
          let maxEndRow = endRow;

          const result = await processAndUpdateMergedCells(
            roomId,
            minStartRow,
            maxEndRow,
            newColIndex,
            mergedCells,
            deptLabel,
            subjectCode,
            sections,
            timeRange
          );

          if (startRow >= 1) {
            mergedCells.set(
              `${roomId}-${result.minStartRow}-${result.maxEndRow}-${result.newColIndex}`,
              {
                details: result.detailString,
                college: deptLabel,
              }
            );
          }
        } else {
          console.error(`Day column not found: ${day}`);
        }
      } else {
        console.error(`Time not found: ${startTime} or ${endTime}`);
      }
    }
  } else {
    const fromDate = new Date(FromDate);
    const toDate = new Date(ToDate);
    const monthlyDays = getMonthlyDays(fromDate, toDate);
    const monthSequence = getMonthSequence(paramFromDate, paramToDate);

    let baseIndex = 1;

    for (const days of monthlyDays) {
      let indexNum = 1 + times.length;

      for (const parsed of parsedSchedule) {
        const { day: scheduleDay, timeRange, sections } = parsed;
        for (const [colIndex, day] of days.entries()) {
          const monthYear = `${day.date.getFullYear()}-${
            day.date.getMonth() + 1
          }`;
          const position = getMonthPosition(monthYear, monthSequence);

          let rowIndex = (baseIndex + indexNum) * position;

          const dateInRange = isDateInRange(day.date, fromDate, toDate);

          if (day.weekday === scheduleDay) {
            const [startTime, endTime] = timeRange
              .split("-")
              .map((time) => time.trim());
            const startRow = timesMap.get(startTime);
            const endRow = timesMap.get(endTime);

            if (startRow === undefined || endRow === undefined) {
              console.error(`Invalid time range: ${timeRange}`);
              continue;
            }

            const newColIndex = colIndex + 2;
            const timeRowIndexStart = rowIndex - 35 + startRow;
            const timeRowIndexEnd = rowIndex - 35 + endRow;

            const mergedKey = `${roomId}-${timeRowIndexStart}-${timeRowIndexEnd}-${newColIndex}`;

            let minStartRow = timeRowIndexStart;
            let maxEndRow = timeRowIndexEnd;

            const result = await processAndUpdateMergedCells(
              roomId,
              minStartRow,
              maxEndRow,
              newColIndex,
              mergedCells,
              deptLabel,
              subjectCode,
              sections,
              timeRange
            );

            if (timeRowIndexStart >= 1) {
              mergedCells.set(
                `${roomId}-${result.minStartRow}-${result.maxEndRow}-${result.newColIndex}`,
                {
                  details: result.detailString,
                  college: deptLabel,
                }
              );
            }
          }
        }
      }
    }
  }
};

const isDateInRange = (loopDate, fromDate, toDate) => {
  return loopDate >= fromDate && loopDate <= toDate;
};

const getMonthSequence = (fromDate, toDate) => {
  const months = [];
  let start = new Date(fromDate);
  let end = new Date(toDate);

  while (start <= end) {
    months.push(`${start.getFullYear()}-${start.getMonth() + 1}`); // YYYY-M format
    start.setMonth(start.getMonth() + 1);
  }

  return months;
};

const getMonthPosition = (month, monthSequence) => {
  return monthSequence.indexOf(month) + 1; // +1 to start counting from 1
};

const getCollegeAbbreviation = (department) => {
  const words = department.toUpperCase().split(" ");
  return words
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0))
    .join("");
};

const processAndUpdateMergedCells = async (
  roomId,
  startRow,
  endRow,
  newColIndex,
  mergedCells,
  deptLabel,
  subjectCode,
  sections,
  timeRange
) => {
  let minStartRow = startRow;
  let maxEndRow = endRow;
  let combinedDetails = [];

  // Process merging and updating
  for (const [key, details] of mergedCells.entries()) {
    const [
      existingRoomId,
      existingStartRow,
      existingEndRow,
      existingDayColumnIndex,
    ] = key.split("-");
    if (
      existingRoomId == roomId &&
      existingDayColumnIndex == newColIndex &&
      startRow <= parseInt(existingEndRow) &&
      endRow >= parseInt(existingStartRow)
    ) {
      minStartRow = Math.min(minStartRow, parseInt(existingStartRow));
      maxEndRow = Math.max(maxEndRow, parseInt(existingEndRow));
      combinedDetails = combinedDetails.concat(details.details);
      mergedCells.delete(key);
    }
  }

  const collegeAbbreviation = getCollegeAbbreviation(deptLabel);
  const newDetail = `${collegeAbbreviation}(${subjectCode}) ${sections} ${timeRange}`;

  // Prevent duplicate subjectCode, sections, and timeRange
  const alreadyExists = combinedDetails.some((detail) =>
    detail.includes(`(${subjectCode}) ${sections} ${timeRange}`)
  );

  if (!alreadyExists) {
    combinedDetails.push(newDetail);
  }

  const sortedDetails = combinedDetails.sort((a, b) => {
    const aTimeRange = a.match(/\d{2}:\d{2}-\d{2}:\d{2}/);
    const bTimeRange = b.match(/\d{2}:\d{2}-\d{2}:\d{2}/);
    return aTimeRange && bTimeRange
      ? aTimeRange[0].localeCompare(bTimeRange[0])
      : 0;
  });

  const detailString = sortedDetails.join(", ");

  return {
    minStartRow,
    maxEndRow,
    newColIndex,
    detailString,
  };
};

const getTimes = () => {
  const hours = Array.from({ length: 17 }, (_, i) => 6 + i); // 6 to 22
  const minutes = [0, 30];
  const times = [];

  for (const hour of hours) {
    for (const minute of minutes) {
      if (!(hour === 22 && minute === 30)) {
        // Exclude 22:30
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        times.push(timeStr);
      }
    }
  }
  return times;
};

const getMonthlyDays = (fromDate, toDate) => {
  const months = [];
  let current = new Date(fromDate);

  while (current <= toDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    let monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    if (monthEnd > toDate) monthEnd = toDate;

    const days = [];
    for (
      let day = monthStart;
      day <= monthEnd;
      day.setDate(day.getDate() + 1)
    ) {
      days.push({
        date: new Date(day),
        formatted: formatDate(new Date(day)),
        weekday: new Intl.DateTimeFormat("en-US", {
          weekday: "long",
        }).format(day),
      });
    }

    months.push(days);
    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    date
  );
  const year = date.getFullYear();
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(date);

  return `${month}-${day}-${year} (${weekday})`;
};

const getCollegeColor = (college) => {
  let color;
  switch (college) {
    case "COLLEGE OF ALLIED REHABILITATION SCIENCES":
      color = "F44336"; // Red
      break;
    case "COLLEGE OF MEDICINE":
      color = "2196F3"; // Blue
      break;
    case "COLLEGE OF ALLIED HEALTH PROFESSIONS":
      color = "FFFF00"; // Orange
      break;
    case "COLLEGE OF NURSING":
      color = "21BA45"; // Green
      break;
    case "GRADUATE SCHOOL":
      color = "551A8B";
      break;
    default:
      color = "FFFFFF";
      break;
  }

  return color;
};

const autoFitColumns = (workSheet) => {
  const columnWidths = {};
  const maxColumnWidth = 50;

  workSheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const cellValue = cell.value ? cell.value.toString() : "";

      const lines = cellValue.split("\n");
      let maxLineLength = 0;

      lines.forEach((line) => {
        const lineLength = line.trim().length + 2;
        maxLineLength = Math.max(maxLineLength, lineLength);
      });

      columnWidths[colNumber] = Math.min(
        Math.max(columnWidths[colNumber] || 25, maxLineLength),
        maxColumnWidth
      );

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  workSheet.columns.forEach((column, colIndex) => {
    column.width = columnWidths[colIndex + 1] || 20;
  });
};

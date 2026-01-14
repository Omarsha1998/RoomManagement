importScripts("https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js");
// importScripts("/excel.js");

self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    const result = await generateExcel(type, data);
    self.postMessage({ success: true, result });
  } catch (error) {
    console.error("Error generating Excel:", error);
    self.postMessage({ success: false, error: error.message });
  }
};

const scheduleParse = async (combinedSchedule) => {
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

const getTimeSlotsCount = (startTime, endTime) => {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  const diffMs = end - start;
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes / 30;
};

// Helper function to convert time to minutes (e.g., "08:30" -> 510)
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper function to check if a date is Sunday
const isSunday = (date) => {
  return date.getDay() === 0; // 0 = Sunday
};

// Function to merge overlapping time intervals
const mergeTimeIntervals = (intervals) => {
  if (intervals.length === 0) return [];

  // Sort intervals by start time
  intervals.sort((a, b) => a.start - b.start);

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    // If current interval overlaps with the last merged interval
    if (current.start <= lastMerged.end) {
      // Merge them by extending the end time
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      // No overlap, add current interval to merged array
      merged.push(current);
    }
  }

  return merged;
};

const calculateWeekdayAverageUtilization = (
  workSheet,
  mergedCells,
  roomId,
  allSchedule
) => {
  // Group columns by weekday
  const weekdayColumns = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  // Collect all columns grouped by weekday
  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 2) {
      // Header row
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1 && cell.value) {
          // Skip time column
          const dateStr = cell.value.toString();

          // Extract weekday from format: "Month-DD-YYYY (Weekday)"
          const weekdayMatch = dateStr.match(/\(([^)]+)\)/);

          if (weekdayMatch) {
            const weekday = weekdayMatch[1].trim();

            if (weekdayColumns[weekday]) {
              weekdayColumns[weekday].push(colNumber);
            }
          }
        }
      });
    }
  });

  // Calculate average utilization for each weekday
  const weekdayAverages = {};

  for (const [weekday, columns] of Object.entries(weekdayColumns)) {
    if (columns.length === 0) continue;

    let totalUtilization = 0;
    let validDays = 0;

    // Calculate utilization for each day
    for (const colIndex of columns) {
      const utilization = calculateColumnUtilizationByTime(
        mergedCells,
        roomId,
        colIndex,
        "Daily",
        { fromDate: null, toDate: null },
        allSchedule
      );

      totalUtilization += utilization;
      validDays++;
    }

    // Calculate average
    weekdayAverages[weekday] =
      validDays > 0 ? Math.round(totalUtilization / validDays) : 0;
  }

  return weekdayAverages;
};

// Enhanced utilization calculation for a single column (daily)
const calculateColumnUtilizationByTime = (
  mergedCells,
  roomId,
  colIndex,
  type,
  targetDate,
  allSchedule
) => {
  const timeIntervals = [];

  // Collect all time intervals for this room and column
  for (const [key, details] of mergedCells) {
    const [cellRoomId, startRow, endRow, cellColIndex] = key
      .split("-")
      .map(Number);

    if (cellRoomId === roomId && cellColIndex === colIndex) {
      const detailsArray = Array.isArray(details.details)
        ? details.details
        : [details.details];

      for (const detail of detailsArray) {
        const timeMatch = detail.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
        if (timeMatch) {
          const [, startTime, endTime] = timeMatch;
          const startMinutes = timeToMinutes(startTime);
          const endMinutes = timeToMinutes(endTime);

          // Only add valid time intervals (end > start)
          if (endMinutes > startMinutes) {
            timeIntervals.push({
              start: startMinutes,
              end: endMinutes,
            });
          }
        }
      }
    }
  }

  // Merge overlapping intervals to avoid double counting
  const mergedIntervals = mergeTimeIntervals(timeIntervals);

  // Calculate total used minutes from merged intervals
  const totalUsedMinutes = mergedIntervals.reduce((total, interval) => {
    return total + (interval.end - interval.start);
  }, 0);

  // Total available minutes per day (7am to 7pm = 12 hours)
  const totalAvailableMinutes = 13 * 60; // 720 minutes

  // Calculate utilization percentage, ensuring it doesn't exceed 100%
  return Math.min(
    100,
    Math.round((totalUsedMinutes / totalAvailableMinutes) * 100)
  );
};

// Enhanced helper function to get week groups (any start day to Sunday, excluding Sundays)
const getWeekGroups = (workSheet, type) => {
  const weekGroups = [];
  let currentWeek = [];
  let weekStartCol = null;

  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 2) {
      // Header row
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1 && cell.value) {
          // Skip time column
          const dateStr = cell.value.toString();
          const dateMatch = dateStr.match(/(\w+)-(\d{2})-(\d{4})/);

          if (dateMatch) {
            const [, month, day, year] = dateMatch;
            const date = new Date(`${month} ${day}, ${year}`);

            // If it's Sunday and we have a current week, end the week
            if (isSunday(date) && currentWeek.length > 0) {
              weekGroups.push({
                columns: currentWeek,
                startCol: weekStartCol,
                endCol: currentWeek[currentWeek.length - 1],
              });
              // Start new week (but don't include Sunday)
              currentWeek = [];
              weekStartCol = null;
            } else if (!isSunday(date)) {
              // Add non-Sunday days to current week
              if (currentWeek.length === 0) {
                weekStartCol = colNumber;
              }
              currentWeek.push(colNumber);
            }
          }
        }
      });

      // Add the last week if it exists
      if (currentWeek.length > 0) {
        weekGroups.push({
          columns: currentWeek,
          startCol: weekStartCol,
          endCol: currentWeek[currentWeek.length - 1],
        });
      }
    }
  });

  return weekGroups;
};

// Helper function to get month groups
const getMonthGroups = (workSheet) => {
  const monthGroups = [];
  let currentMonth = null;
  let currentMonthCols = [];
  let monthStartCol = null;

  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 2) {
      // Header row
      row.eachCell((cell, colNumber) => {
        if (colNumber > 1 && cell.value) {
          // Skip time column
          const dateStr = cell.value.toString();
          const dateMatch = dateStr.match(/(\w+)-(\d{2})-(\d{4})/);

          if (dateMatch) {
            const [, month, day, year] = dateMatch;
            const monthYear = `${month}-${year}`;

            if (currentMonth !== monthYear) {
              if (currentMonthCols.length > 0) {
                monthGroups.push({
                  month: currentMonth,
                  columns: currentMonthCols,
                  startCol: monthStartCol,
                  endCol: currentMonthCols[currentMonthCols.length - 1],
                });
              }
              currentMonth = monthYear;
              currentMonthCols = [colNumber];
              monthStartCol = colNumber;
            } else {
              currentMonthCols.push(colNumber);
            }
          }
        }
      });

      // Add the last month
      if (currentMonthCols.length > 0) {
        monthGroups.push({
          month: currentMonth,
          columns: currentMonthCols,
          startCol: monthStartCol,
          endCol: currentMonthCols[currentMonthCols.length - 1],
        });
      }
    }
  });

  return monthGroups;
};

// Enhanced utilization calculation for multiple columns (weekly/monthly)
const calculateColumnUtilizationByTimeEnhanced = (
  mergedCells,
  roomId,
  columns,
  type,
  workSheet
) => {
  let totalUsedMinutes = 0;
  let totalValidDays = 0;

  // Process each column (day) separately
  for (const colIndex of columns) {
    // Check if this column represents a Sunday
    let isSundayColumn = false;

    workSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 2) {
        // Header row
        const cell = row.getCell(colIndex);
        if (cell.value) {
          const dateStr = cell.value.toString();
          const dateMatch = dateStr.match(/(\w+)-(\d{2})-(\d{4})/);

          if (dateMatch) {
            const [, month, day, year] = dateMatch;
            const date = new Date(`${month} ${day}, ${year}`);
            isSundayColumn = isSunday(date);
          }
        }
      }
    });

    // Skip Sunday columns for utilization calculation
    if (isSundayColumn) {
      continue;
    }

    totalValidDays++;

    // Collect time intervals for this specific column
    const timeIntervals = [];

    for (const [key, details] of mergedCells) {
      const [cellRoomId, startRow, endRow, cellColIndex] = key
        .split("-")
        .map(Number);

      if (cellRoomId === roomId && cellColIndex === colIndex) {
        const detailsArray = Array.isArray(details.details)
          ? details.details
          : [details.details];

        for (const detail of detailsArray) {
          const timeMatch = detail.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (timeMatch) {
            const [, startTime, endTime] = timeMatch;
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = timeToMinutes(endTime);

            // Only add valid time intervals
            if (endMinutes > startMinutes) {
              timeIntervals.push({
                start: startMinutes,
                end: endMinutes,
              });
            }
          }
        }
      }
    }

    // Merge overlapping intervals for this day to avoid double counting
    const mergedIntervals = mergeTimeIntervals(timeIntervals);

    // Add used minutes for this day
    const dayUsedMinutes = mergedIntervals.reduce((total, interval) => {
      return total + (interval.end - interval.start);
    }, 0);

    totalUsedMinutes += dayUsedMinutes;
  }

  // Total available minutes (12 hours per valid day)
  const totalAvailableMinutes = 13 * 60 * totalValidDays;

  // Calculate utilization percentage, ensuring it doesn't exceed 100%
  const utilizationPercentage =
    totalAvailableMinutes > 0
      ? Math.min(
          100,
          Math.round((totalUsedMinutes / totalAvailableMinutes) * 100)
        )
      : 0;

  return utilizationPercentage;
};

// Debug function to help troubleshoot utilization calculations
const debugUtilizationCalculation = (
  mergedCells,
  roomId,
  columns,
  workSheet
) => {
  for (const colIndex of columns) {
    // Get column date
    let columnDate = null;
    workSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 2) {
        const cell = row.getCell(colIndex);
        if (cell.value) {
          columnDate = cell.value.toString();
        }
      }
    });

    const timeIntervals = [];

    // Collect intervals for this column
    for (const [key, details] of mergedCells) {
      const [cellRoomId, startRow, endRow, cellColIndex] = key
        .split("-")
        .map(Number);

      if (cellRoomId === roomId && cellColIndex === colIndex) {
        const detailsArray = Array.isArray(details.details)
          ? details.details
          : [details.details];

        for (const detail of detailsArray) {
          const timeMatch = detail.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (timeMatch) {
            const [, startTime, endTime] = timeMatch;

            timeIntervals.push({
              start: timeToMinutes(startTime),
              end: timeToMinutes(endTime),
              detail: detail,
            });
          }
        }
      }
    }

    // Show merged intervals
    const mergedIntervals = mergeTimeIntervals(timeIntervals);
    const totalMinutes = mergedIntervals.reduce((total, interval) => {
      return total + (interval.end - interval.start);
    }, 0);
  }
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
      departmentCode,
      buildingDescription,
      paramFromDate,
      paramToDate,
    } = schedule;

    const safeDeptLabel = departmentCode || "";
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
    const times = getTimeDaily();
    const roomIdNumber = Number(roomId);

    if (!workSheety) {
      const { workSheet, headerRow } = await createSheetMonthly(
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

    const parsedSchedule = await scheduleParse(combinedSchedule);
    const { workSheet, headerRow } = sheetsMap.get(roomIdNumber);

    await applySchedule(
      workSheet,
      times,
      parsedSchedule,
      subjectCode,
      roomId,
      mergedCells,
      subjectDescription,
      headerRow,
      safeDeptLabel,
      type,
      fromDate,
      toDate,
      paramFromDate,
      paramToDate,
      allSchedule
    );
  }

  const borderStyle = {
    top: { style: "medium", color: { argb: "FF000000" } },
    left: { style: "medium", color: { argb: "FF000000" } },
    bottom: { style: "medium", color: { argb: "FF000000" } },
    right: { style: "medium", color: { argb: "FF000000" } },
  };

  // Apply merged cells and calculate utilization
  for (const [mergedKey, details] of mergedCells) {
    const [RoomId, startRow, endRow, colIndex] = mergedKey
      .split("-")
      .map(Number);

    const detail =
      typeof details.details === "object"
        ? details.details.join("\n")
        : details.details;

    const { headerRow, workSheet } = sheetsMap.get(RoomId);
    workSheet.mergeCells(startRow, colIndex, endRow, colIndex);

    const cell = workSheet.getCell(startRow, colIndex);
    cell.value = detail;
    cell.alignment = {
      horizontal: "left",
      vertical: "center",
      wrapText: true,
    };
    cell.font = { name: "Arial", size: 11 };

    // Use the new multi-college background function
    const colleges = details.colleges || [details.college];
    cell.fill = createMultiCollegeBackground(colleges);

    for (let row = startRow; row <= endRow; row++) {
      workSheet.getCell(row, colIndex).border = borderStyle;
    }
  }

  // Add utilization row for each sheet
  for (const [roomId, { workSheet }] of sheetsMap) {
    await addUtilizationRow(workSheet, mergedCells, roomId, type, allSchedule);
    columnDesign(workSheet);
  }

  const buffer = await workBook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  return blob;
};

// Updated addUtilizationRow function with the fixed calculation
// const addUtilizationRow = async (
//   workSheet,
//   mergedCells,
//   roomId,
//   type,
//   allSchedule
// ) => {
//   // Find the last row with time data
//   let lastTimeRow = 0;
//   const times = getTimeDaily();

//   workSheet.eachRow((row, rowNumber) => {
//     const firstCell = row.getCell(1).value;
//     if (firstCell && times.includes(firstCell.toString())) {
//       lastTimeRow = Math.max(lastTimeRow, rowNumber);
//     }
//   });

//   // Add UTILIZATION row after the last time row
//   const utilizationRow = lastTimeRow + 1;
//   const utilizationCell = workSheet.getCell(utilizationRow, 1);
//   utilizationCell.value = "UTILIZATION";
//   utilizationCell.font = { name: "Arial", size: 11, bold: true };
//   utilizationCell.fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "FFE0E0E0" },
//   };

//   // Define border style for weekly separators
//   const weeklyBorderStyle = {
//     top: { style: "thick", color: { argb: "FF000000" } },
//     left: { style: "thick", color: { argb: "FF000000" } },
//     bottom: { style: "thick", color: { argb: "FF000000" } },
//     right: { style: "thick", color: { argb: "FF000000" } },
//   };

//   if (type === "Daily") {
//     // Calculate for each column individually
//     workSheet.eachRow((row, rowNumber) => {
//       if (rowNumber === 2) {
//         // Header row
//         row.eachCell((cell, colNumber) => {
//           if (colNumber > 1 && cell.value) {
//             // Skip time column
//             const utilization = calculateColumnUtilizationByTime(
//               mergedCells,
//               roomId,
//               colNumber,
//               type,
//               { fromDate: null, toDate: null },
//               allSchedule
//             );

//             const utilizationValueCell = workSheet.getCell(
//               utilizationRow,
//               colNumber
//             );
//             utilizationValueCell.value = `${utilization}%`;
//             utilizationValueCell.font = { name: "Arial", size: 10, bold: true };
//             utilizationValueCell.alignment = {
//               horizontal: "center",
//               vertical: "center",
//             };
//             utilizationValueCell.fill = {
//               type: "pattern",
//               pattern: "solid",
//               fgColor: {
//                 argb:
//                   utilization >= 80
//                     ? "FF90EE90" // Light green for high utilization
//                     : utilization >= 50
//                     ? "FFFFFF00" // Yellow for medium utilization
//                     : "FFFFA500", // Orange for low utilization
//               },
//             };
//           }
//         });
//       }
//     });
//   } else if (type === "Weekly") {
//     // Group by weeks and calculate utilization
//     const weekGroups = getWeekGroups(workSheet, type);

//     for (const week of weekGroups) {
//       const utilization = calculateColumnUtilizationByTimeEnhanced(
//         mergedCells,
//         roomId,
//         week.columns,
//         type,
//         workSheet
//       );

//       // Merge utilization cells for the week
//       if (week.startCol && week.endCol && week.startCol <= week.endCol) {
//         workSheet.mergeCells(
//           utilizationRow,
//           week.startCol,
//           utilizationRow,
//           week.endCol
//         );

//         const utilizationValueCell = workSheet.getCell(
//           utilizationRow,
//           week.startCol
//         );
//         utilizationValueCell.value = `${utilization}%`;
//         utilizationValueCell.font = { name: "Arial", size: 10, bold: true };
//         utilizationValueCell.alignment = {
//           horizontal: "center",
//           vertical: "center",
//         };
//         utilizationValueCell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: {
//             argb:
//               utilization >= 80
//                 ? "FF90EE90"
//                 : utilization >= 50
//                 ? "FFFFFF00"
//                 : "FFFFA500",
//           },
//         };

//         // Apply thick black borders to weekly utilization cells as separators
//         for (let col = week.startCol; col <= week.endCol; col++) {
//           const borderCell = workSheet.getCell(utilizationRow, col);
//           borderCell.border = weeklyBorderStyle;
//         }
//       }
//     }
//   } else if (type === "Monthly") {
//     // Group by months and calculate utilization
//     const monthGroups = getMonthGroups(workSheet);

//     for (const month of monthGroups) {
//       const utilization = calculateColumnUtilizationByTimeEnhanced(
//         mergedCells,
//         roomId,
//         month.columns,
//         type,
//         workSheet
//       );

//       // Merge utilization cells for the month
//       if (month.startCol && month.endCol && month.startCol <= month.endCol) {
//         workSheet.mergeCells(
//           utilizationRow,
//           month.startCol,
//           utilizationRow,
//           month.endCol
//         );

//         const utilizationValueCell = workSheet.getCell(
//           utilizationRow,
//           month.startCol
//         );
//         utilizationValueCell.value = `${utilization}%`;
//         utilizationValueCell.font = { name: "Arial", size: 10, bold: true };
//         utilizationValueCell.alignment = {
//           horizontal: "center",
//           vertical: "center",
//         };
//         utilizationValueCell.fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: {
//             argb:
//               utilization >= 80
//                 ? "FF90EE90"
//                 : utilization >= 50
//                 ? "FFFFFF00"
//                 : "FFFFA500",
//           },
//         };
//       }
//     }
//   }
// };

const addUtilizationRow = async (
  workSheet,
  mergedCells,
  roomId,
  type,
  allSchedule
) => {
  // Find the last row with time data
  let lastTimeRow = 0;
  const times = getTimeDaily();

  workSheet.eachRow((row, rowNumber) => {
    const firstCell = row.getCell(1).value;
    if (firstCell && times.includes(firstCell.toString())) {
      lastTimeRow = Math.max(lastTimeRow, rowNumber);
    }
  });

  // Add UTILIZATION row after the last time row
  const utilizationRow = lastTimeRow + 1;
  const utilizationCell = workSheet.getCell(utilizationRow, 1);
  utilizationCell.value = "UTILIZATION PER DAY";
  utilizationCell.font = { name: "Arial", size: 11, bold: true };
  utilizationCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Define border style for weekly separators
  const weeklyBorderStyle = {
    top: { style: "thick", color: { argb: "FF000000" } },
    left: { style: "thick", color: { argb: "FF000000" } },
    bottom: { style: "thick", color: { argb: "FF000000" } },
    right: { style: "thick", color: { argb: "FF000000" } },
  };

  if (type === "Daily") {
    // Calculate individual daily utilization
    workSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 2) {
        // Header row
        row.eachCell((cell, colNumber) => {
          if (colNumber > 1 && cell.value) {
            // Skip time column
            const utilization = calculateColumnUtilizationByTime(
              mergedCells,
              roomId,
              colNumber,
              type,
              { fromDate: null, toDate: null },
              allSchedule
            );

            const utilizationValueCell = workSheet.getCell(
              utilizationRow,
              colNumber
            );
            utilizationValueCell.value = `${utilization}%`;
            utilizationValueCell.font = { name: "Arial", size: 10, bold: true };
            utilizationValueCell.alignment = {
              horizontal: "center",
              vertical: "center",
            };
            utilizationValueCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  utilization >= 80
                    ? "FF90EE90" // Light green for high utilization
                    : utilization >= 50
                    ? "FFFFFF00" // Yellow for medium utilization
                    : "FFFFA500", // Orange for low utilization
              },
            };
          }
        });
      }
    });

    // ✅ NEW: Add AVERAGE UTILIZATION row for Daily type
    const avgUtilizationRow = utilizationRow + 1;
    const avgUtilizationCell = workSheet.getCell(avgUtilizationRow, 1);
    avgUtilizationCell.value =
      "AVERAGE UTILIZATION (Semester / Date Range Provided)";
    avgUtilizationCell.font = { name: "Arial", size: 11, bold: true };
    avgUtilizationCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" }, // Light gray
    };

    // Calculate weekday averages
    const weekdayAverages = calculateWeekdayAverageUtilization(
      workSheet,
      mergedCells,
      roomId,
      allSchedule
    );

    // Apply average utilization to each column based on its weekday
    workSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 2) {
        // Header row
        row.eachCell((cell, colNumber) => {
          if (colNumber > 1 && cell.value) {
            // Skip time column
            const dateStr = cell.value.toString();

            // Extract weekday from format: "Month-DD-YYYY (Weekday)"
            const weekdayMatch = dateStr.match(/\(([^)]+)\)/);

            if (weekdayMatch) {
              const weekday = weekdayMatch[1].trim();
              const avgUtilization = weekdayAverages[weekday] || 0;

              const avgUtilizationValueCell = workSheet.getCell(
                avgUtilizationRow,
                colNumber
              );
              avgUtilizationValueCell.value = `${avgUtilization}%`;
              avgUtilizationValueCell.font = {
                name: "Arial",
                size: 10,
                bold: true,
                italic: true,
              };
              avgUtilizationValueCell.alignment = {
                horizontal: "center",
                vertical: "center",
              };
              avgUtilizationValueCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb:
                    avgUtilization >= 80
                      ? "FF90EE90" // Light green
                      : avgUtilization >= 50
                      ? "FFFFFF00" // Yellow
                      : "FFFFA500", // Orange
                },
              };
            }
          }
        });
      }
    });
  } else if (type === "Weekly") {
    // Group by weeks and calculate utilization
    const weekGroups = getWeekGroups(workSheet, type);

    for (const week of weekGroups) {
      const utilization = calculateColumnUtilizationByTimeEnhanced(
        mergedCells,
        roomId,
        week.columns,
        type,
        workSheet
      );

      // Merge utilization cells for the week
      if (week.startCol && week.endCol && week.startCol <= week.endCol) {
        workSheet.mergeCells(
          utilizationRow,
          week.startCol,
          utilizationRow,
          week.endCol
        );

        const utilizationValueCell = workSheet.getCell(
          utilizationRow,
          week.startCol
        );
        utilizationValueCell.value = `${utilization}%`;
        utilizationValueCell.font = { name: "Arial", size: 10, bold: true };
        utilizationValueCell.alignment = {
          horizontal: "center",
          vertical: "center",
        };
        utilizationValueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb:
              utilization >= 80
                ? "FF90EE90"
                : utilization >= 50
                ? "FFFFFF00"
                : "FFFFA500",
          },
        };

        // Apply thick black borders to weekly utilization cells as separators
        for (let col = week.startCol; col <= week.endCol; col++) {
          const borderCell = workSheet.getCell(utilizationRow, col);
          borderCell.border = weeklyBorderStyle;
        }
      }
    }
  } else if (type === "Monthly") {
    // Group by months and calculate utilization
    const monthGroups = getMonthGroups(workSheet);

    for (const month of monthGroups) {
      const utilization = calculateColumnUtilizationByTimeEnhanced(
        mergedCells,
        roomId,
        month.columns,
        type,
        workSheet
      );

      // Merge utilization cells for the month
      if (month.startCol && month.endCol && month.startCol <= month.endCol) {
        workSheet.mergeCells(
          utilizationRow,
          month.startCol,
          utilizationRow,
          month.endCol
        );

        const utilizationValueCell = workSheet.getCell(
          utilizationRow,
          month.startCol
        );
        utilizationValueCell.value = `${utilization}%`;
        utilizationValueCell.font = { name: "Arial", size: 10, bold: true };
        utilizationValueCell.alignment = {
          horizontal: "center",
          vertical: "center",
        };
        utilizationValueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb:
              utilization >= 80
                ? "FF90EE90"
                : utilization >= 50
                ? "FFFFFF00"
                : "FFFFA500",
          },
        };
      }
    }
  }
};

const createSheetMonthly = async (
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

  const startDate = new Date(paramFromDate);
  const endDate = new Date(paramToDate);

  const monthlyDays = getDailyMonths(startDate, endDate);
  let rowIndex = 1;

  for (const days of monthlyDays) {
    // Title row
    workSheet.mergeCells(rowIndex, 1, rowIndex, days.length + 1);
    const cell = workSheet.getCell(rowIndex, 1);
    cell.value = buildingDescription || "Schedule";
    cell.font = { name: "Arial", size: 25, bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2689F8" },
    };
    cell.alignment = {
      horizontal: "left",
      vertical: "center",
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    workSheet.getRow(rowIndex).height = 50;
    rowIndex += 1;

    // Header row
    const headerRow = workSheet.getRow(rowIndex);
    headerRow.getCell(1).value = "Time";
    headerRow.getCell(1).font = { name: "Arial", size: 11, bold: true };

    for (const [colIndex, day] of days.entries()) {
      const cell = headerRow.getCell(colIndex + 2);
      cell.value = day.formatted;
      cell.font = { name: "Arial", size: 11, bold: true };
    }

    rowIndex += 1;

    // Add time rows
    for (const time of times) {
      workSheet.getCell(rowIndex, 1).value = time;
      workSheet.getCell(rowIndex, 1).font = { name: "Arial", size: 10 };
      rowIndex += 1;
    }
  }

  return { workSheet, headerRow: null };
};

const validateAndClampTime = (startTime, endTime, minTime, maxTime) => {
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (mins) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const minMins = timeToMinutes(minTime);
  const maxMins = timeToMinutes(maxTime);

  // Check if schedule crosses midnight (end time is earlier than start time)
  const crossesMidnight = endMins < startMins;

  if (crossesMidnight) {
    // Handle overnight schedules
    // Only keep the portion that falls within our time range

    // If start time is after max time, this schedule doesn't apply to our range
    if (startMins > maxMins) {
      return { isValid: false };
    }

    // If end time is before min time (early morning), clamp to max time
    if (endMins < minMins) {
      return {
        validStartTime: startTime,
        validEndTime: maxTime,
        isValid: true,
      };
    }
  }

  // Check if completely outside our range
  if (endMins < minMins || startMins > maxMins) {
    return { isValid: false };
  }

  // Clamp to boundaries
  const clampedStartMins = Math.max(startMins, minMins);
  const clampedEndMins = Math.min(endMins, maxMins);

  // Make sure end is after start
  if (clampedEndMins <= clampedStartMins) {
    return { isValid: false };
  }

  return {
    validStartTime: minutesToTime(clampedStartMins),
    validEndTime: minutesToTime(clampedEndMins),
    isValid: true,
  };
};

const applySchedule = async (
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
  paramToDate,
  allSchedule
) => {
  const timesMap = new Map(times.map((time, index) => [time, index + 3]));

  // Define time boundaries
  const MIN_TIME = "07:00";
  const MAX_TIME = "20:00";

  const fromDate = new Date(FromDate);
  const toDate = new Date(ToDate);
  const monthlyDays = getDailyMonths(fromDate, toDate);
  const monthSequence = getSequenceMonth(paramFromDate, paramToDate);

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

        const dateInRange = dateRangeIn(day.date, fromDate, toDate);

        if (day.weekday === scheduleDay && dateInRange) {
          const [startTime, endTime] = timeRange
            .split("-")
            .map((time) => time.trim());

          // Validate and clamp times to boundaries
          const { validStartTime, validEndTime, isValid } =
            validateAndClampTime(startTime, endTime, MIN_TIME, MAX_TIME);

          if (!isValid) {
            console.warn(
              `Skipping invalid/out-of-range time: ${timeRange} for ${scheduleDay}`
            );
            continue;
          }

          const startRow = timesMap.get(validStartTime);
          const endRow = timesMap.get(validEndTime);

          if (startRow === undefined || endRow === undefined) {
            console.warn(
              `Time not in map after validation: ${validStartTime}-${validEndTime}`
            );
            continue;
          }

          const newColIndex = colIndex + 2;
          const timeRowIndexStart = rowIndex - 29 + startRow;
          const timeRowIndexEnd = rowIndex - 29 + endRow;

          let minStartRow = timeRowIndexStart;
          let maxEndRow = timeRowIndexEnd;

          const result = await processMergedCells(
            roomId,
            minStartRow,
            maxEndRow,
            newColIndex,
            mergedCells,
            deptLabel,
            subjectCode,
            sections,
            `${validStartTime}-${validEndTime}` // Use clamped time
          );

          if (timeRowIndexStart >= 1) {
            mergedCells.set(
              `${roomId}-${result.minStartRow}-${result.maxEndRow}-${result.newColIndex}`,
              {
                details: result.detailString,
                college: deptLabel,
                colleges: result.colleges,
              }
            );
          }
        }
      }
    }
  }
};

// const applySchedule = async (
//   workSheet,
//   times,
//   parsedSchedule,
//   subjectCode,
//   roomId,
//   mergedCells,
//   subjectDescription,
//   headerRow,
//   deptLabel,
//   type,
//   FromDate,
//   ToDate,
//   paramFromDate,
//   paramToDate,
//   allSchedule
// ) => {
//   const timesMap = new Map(times.map((time, index) => [time, index + 3]));

//   const fromDate = new Date(FromDate);
//   const toDate = new Date(ToDate);
//   const monthlyDays = getDailyMonths(fromDate, toDate);
//   const monthSequence = getSequenceMonth(paramFromDate, paramToDate);

//   let baseIndex = 1;

//   for (const days of monthlyDays) {
//     let indexNum = 1 + times.length;

//     for (const parsed of parsedSchedule) {
//       const { day: scheduleDay, timeRange, sections } = parsed;
//       for (const [colIndex, day] of days.entries()) {
//         const monthYear = `${day.date.getFullYear()}-${
//           day.date.getMonth() + 1
//         }`;
//         const position = getMonthPosition(monthYear, monthSequence);

//         let rowIndex = (baseIndex + indexNum) * position;

//         const dateInRange = dateRangeIn(day.date, fromDate, toDate);

//         if (day.weekday === scheduleDay && dateInRange) {
//           const [startTime, endTime] = timeRange
//             .split("-")
//             .map((time) => time.trim());
//           const startRow = timesMap.get(startTime);
//           const endRow = timesMap.get(endTime);

//           if (startRow === undefined || endRow === undefined) {
//             console.error(`Invalid time range: ${timeRange}`);
//             continue;
//           }

//           const newColIndex = colIndex + 2;
//           const timeRowIndexStart = rowIndex - 29 + startRow;
//           const timeRowIndexEnd = rowIndex - 29 + endRow;

//           let minStartRow = timeRowIndexStart;
//           let maxEndRow = timeRowIndexEnd;

//           const result = await processMergedCells(
//             roomId,
//             minStartRow,
//             maxEndRow,
//             newColIndex,
//             mergedCells,
//             deptLabel,
//             subjectCode,
//             sections,
//             timeRange
//           );

//           if (timeRowIndexStart >= 1) {
//             mergedCells.set(
//               `${roomId}-${result.minStartRow}-${result.maxEndRow}-${result.newColIndex}`,
//               {
//                 details: result.detailString,
//                 college: deptLabel, // Keep for backward compatibility
//                 colleges: result.colleges, // New field for multiple colleges
//               }
//             );
//           }
//         }
//       }
//     }
//   }
// };
const dateRangeIn = (loopDate, fromDate, toDate) => {
  return loopDate >= fromDate && loopDate <= toDate;
};

const getSequenceMonth = (fromDate, toDate) => {
  const months = [];
  let start = new Date(fromDate);
  let end = new Date(toDate);

  while (start <= end) {
    months.push(`${start.getFullYear()}-${start.getMonth() + 1}`);
    start.setMonth(start.getMonth() + 1);
  }

  return months;
};

const getMonthPosition = (month, monthSequence) => {
  return monthSequence.indexOf(month) + 1;
};

const getAbbreviation = (department) => {
  if (!department || department.trim() === "") return "";

  // Specific mappings for known colleges
  const collegeAbbreviations = {
    "COLLEGE OF ALLIED REHABILITATION SCIENCES": "CAReS",
    "COLLEGE OF MEDICINE": "COM",
    "COLLEGE OF NURSING": "CON",
    "GRADUATE SCHOOL": "GS",
    "COLLEGE OF ALLIED HEALTH PROFESSIONS": "CAHP",
    MIXUSED: "MU",
  };

  const upperDept = department.toUpperCase().trim();

  // Check for exact matches first
  if (collegeAbbreviations[upperDept]) {
    return collegeAbbreviations[upperDept];
  }

  // If no exact match, use the original logic
  const words = upperDept.split(" ");
  return words
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0))
    .join("");
};

const processMergedCells = async (
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
  let colleges = new Set(); // Track unique colleges

  // Add current college
  if (deptLabel && deptLabel.trim() !== "") {
    colleges.add(deptLabel.trim());
  }

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

      // Add existing college to the set
      if (details.college && details.college.trim() !== "") {
        colleges.add(details.college.trim());
      }

      mergedCells.delete(key);
    }
  }

  const collegeAbbreviation = getAbbreviation(deptLabel);
  const newDetail = `${collegeAbbreviation}(${subjectCode || "N/A"}) ${
    sections || "N/A"
  } ${timeRange}`;

  const alreadyExists = combinedDetails.some((detail) =>
    detail.includes(
      `(${subjectCode || "N/A"}) ${sections || "N/A"} ${timeRange}`
    )
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

  return {
    minStartRow,
    maxEndRow,
    newColIndex,
    detailString: sortedDetails,
    colleges: Array.from(colleges), // Convert Set to Array
  };
};

const getTimeDaily = () => {
  const hours = Array.from({ length: 14 }, (_, i) => 7 + i);
  const minutes = [0, 30];
  const times = [];

  for (const hour of hours) {
    for (const minute of minutes) {
      if (!(hour === 20 && minute === 30)) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        times.push(timeStr);
      }
    }
  }
  return times;
};

const getDailyMonths = (fromDate, toDate) => {
  const months = [];
  let current = new Date(fromDate);

  while (current <= toDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    let monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    if (monthEnd > toDate) monthEnd = toDate;

    const days = [];
    for (
      let day = new Date(monthStart);
      day <= monthEnd;
      day.setDate(day.getDate() + 1)
    ) {
      days.push({
        date: new Date(day),
        formatted: formattedDate(new Date(day)),
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

const formattedDate = (date) => {
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

const getColorCollege = (college) => {
  if (!college) return "FFFFFF";

  let color;

  switch (college.toUpperCase().trim()) {
    case "4000":
      color = "F44336"; // Red
      break;
    case "2000":
      color = "2196F3"; // Blue
      break;
    case "10100":
      color = "FFFF00"; // Yellow
      break;
    case "3000":
      color = "21BA45"; // Green
      break;
    case "8000":
      color = "551A8B"; // Purple
      break;
    case "MIXUSED":
      color = "FF9800"; // Orange
      break;
    default:
      color = "FFFFFF"; // White
      break;
  }
  // switch (college.toUpperCase().trim()) {
  //   case "COLLEGE OF ALLIED REHABILITATION SCIENCES":
  //     color = "F44336"; // Red
  //     break;
  //   case "COLLEGE OF MEDICINE":
  //     color = "2196F3"; // Blue
  //     break;
  //   case "COLLEGE OF ALLIED HEALTH PROFESSIONS":
  //     color = "FFFF00"; // Yellow
  //     break;
  //   case "COLLEGE OF NURSING":
  //     color = "21BA45"; // Green
  //     break;
  //   case "GRADUATE SCHOOL":
  //     color = "551A8B"; // Purple
  //     break;
  //   case "MIXUSED":
  //     color = "FF9800"; // Orange
  //     break;
  //   default:
  //     color = "FFFFFF"; // White
  //     break;
  // }

  return color;
};

const createMultiCollegeBackground = (colleges) => {
  if (!colleges || colleges.length === 0) {
    return {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF" },
    };
  }

  if (colleges.length === 1) {
    return {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: getColorCollege(colleges[0]) },
    };
  }

  // For multiple colleges, we'll use a gradient or pattern
  // Since ExcelJS has limited pattern support, we'll use alternating colors
  // or create a mixed color approach

  // Get the first two most prominent colors
  const primaryColor = getColorCollege(colleges[0]);
  const secondaryColor =
    colleges.length > 1 ? getColorCollege(colleges[1]) : primaryColor;

  // Create a mixed color by averaging RGB values
  const mixedColor = mixColors(primaryColor, secondaryColor);

  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: mixedColor },
  };
};

const mixColors = (color1, color2) => {
  // Convert hex to RGB
  const r1 = parseInt(color1.substring(0, 2), 16);
  const g1 = parseInt(color1.substring(2, 4), 16);
  const b1 = parseInt(color1.substring(4, 6), 16);

  const r2 = parseInt(color2.substring(0, 2), 16);
  const g2 = parseInt(color2.substring(2, 4), 16);
  const b2 = parseInt(color2.substring(4, 6), 16);

  // Average the colors
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);

  // Convert back to hex
  return (
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
};

const columnDesign = (workSheet) => {
  const columnWidths = {};
  const maxColumnWidth = 50;

  workSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
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
        horizontal: rowNumber === 1 ? "left" : "center",
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  workSheet.columns.forEach((column, colIndex) => {
    column.width = columnWidths[colIndex + 1] || 20;
  });
};

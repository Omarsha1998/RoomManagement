importScripts("https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js");
// importScripts("/excel.js");

self.onmessage = async (event) => {
  const { type, data } = event.data;
  try {
    const result = await generateExcelType(data);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

const parseScheduleUtil = async (combinedSchedule) => {
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

const generateExcelType = async (data) => {
  try {
    const workbook = new ExcelJS.Workbook();

    const groupedSchedules = data.reduce((acc, item) => {
      if (!acc[item.roomId]) acc[item.roomId] = [];
      acc[item.roomId].push(item);
      return acc;
    }, {});

    for (const roomId of Object.keys(groupedSchedules)) {
      const roomData = groupedSchedules[roomId][0];

      const sheetName = `${roomData.name} (${roomId})`.substring(0, 31);
      const worksheet = workbook.addWorksheet(sheetName);

      const fromDate = new Date(roomData.fromDate);
      const toDate = new Date(roomData.toDate);

      const dateColumns = [];
      let currentDate = new Date(fromDate);

      while (currentDate <= toDate) {
        const formattedDate =
          currentDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }) +
          " - " +
          currentDate.toLocaleDateString("en-US", { weekday: "long" });

        dateColumns.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const columns = [
        {
          header: roomData.buildingDescription,
          key: "buildingDescription",
          width: 30,
        },
        ...dateColumns.map((date, index) => ({
          header: date,
          key: `date${index}`,
          width: 30,
        })),
      ];
      worksheet.columns = columns;

      const firstRow = worksheet.addRow([, ...dateColumns]);
      firstRow.getCell(1).alignment = { horizontal: "center" };
      firstRow.getCell(1).font = { bold: true };
      worksheet.mergeCells(1, 1, 1, dateColumns.length + 1);

      const scheduleByDate = {};

      for (const date of dateColumns) {
        const dateWeekday = date.split(" - ")[1];

        if (!scheduleByDate[date]) {
          scheduleByDate[date] = [];
        }

        for (const data of groupedSchedules[roomId]) {
          const parsedSchedule = await parseScheduleUtil(data.combinedSchedule);

          for (const parsed of parsedSchedule) {
            const { sections, day, timeRange } = parsed;

            let [startTime, endTime] = timeRange
              .split("-")
              .map((time) => time.trim());

            // If the day matches the weekday for the current date in the loop
            if (day === dateWeekday) {
              let newStartTime = startTime;
              let newEndTime = endTime;
              let mergedIndexes = [];

              // Merge overlapping time ranges
              for (let i = 0; i < scheduleByDate[date].length; i++) {
                let [existingStart, existingEnd] = scheduleByDate[date][i]
                  .split("-")
                  .map((time) => time.trim());

                if (
                  (newStartTime >= existingStart &&
                    newStartTime <= existingEnd) ||
                  (newEndTime >= existingStart && newEndTime <= existingEnd) ||
                  (newStartTime <= existingStart && newEndTime >= existingEnd)
                ) {
                  newStartTime =
                    newStartTime < existingStart ? newStartTime : existingStart;
                  newEndTime =
                    newEndTime > existingEnd ? newEndTime : existingEnd;
                  mergedIndexes.push(i);
                }
              }

              // Remove merged ranges and add the new merged time range
              if (mergedIndexes.length > 0) {
                scheduleByDate[date] = scheduleByDate[date].filter(
                  (_, index) => !mergedIndexes.includes(index)
                );
              }

              scheduleByDate[date].push(`${newStartTime} - ${newEndTime}`);

              // Sort the time ranges by start time
              scheduleByDate[date].sort((a, b) => {
                let [aStart] = a.split("-").map((time) => time.trim());
                let [bStart] = b.split("-").map((time) => time.trim());
                return aStart.localeCompare(bStart);
              });
            }
          }
        }

        if (scheduleByDate[date].length === 0) {
          scheduleByDate[date] = [];
        }
      }

      // Convert time in "HH:MM" format to total minutes from midnight
      function convertTimeToMinutes(time) {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      }

      const dailyStartTime = "08:00";
      const dailyEndTime = "17:00";

      const dailyStartMinutes = convertTimeToMinutes(dailyStartTime);
      const dailyEndMinutes = convertTimeToMinutes(dailyEndTime);
      const dailyAvailableMinutes = dailyEndMinutes - dailyStartMinutes;

      for (const date in scheduleByDate) {
        let totalScheduledMinutes = 0;

        if (scheduleByDate[date].length > 0) {
          for (const timeRange of scheduleByDate[date]) {
            let [startTime, endTime] = timeRange
              .split(" - ")
              .map((time) => time.trim());

            let startMinutes = convertTimeToMinutes(startTime);
            let endMinutes = convertTimeToMinutes(endTime);

            if (endMinutes > dailyEndMinutes) {
              endMinutes = dailyEndMinutes;
            }

            if (startMinutes < dailyStartMinutes) {
              startMinutes = dailyStartMinutes;
            }

            if (startMinutes < endMinutes) {
              totalScheduledMinutes += endMinutes - startMinutes;
            }
          }

          const utilizationPercentage =
            (totalScheduledMinutes / dailyAvailableMinutes) * 100;

          scheduleByDate[date] = [`${utilizationPercentage.toFixed(2)}%`];
        } else {
          scheduleByDate[date] = ["0%"];
        }
      }

      const maxRows = Math.max(
        ...Object.values(scheduleByDate).map((schedules) => schedules.length),
        1
      );

      for (let i = 0; i < maxRows; i++) {
        const rowData = [];

        for (const date of dateColumns) {
          rowData.push(scheduleByDate[date]?.[i] || "");
        }

        worksheet.addRow(rowData);
      }

      const utilizationStartRow = worksheet.rowCount - maxRows + 1;
      const utilizationRows = 10;
      for (let col = 1; col <= dateColumns.length + 1; col++) {
        const startRow = utilizationStartRow;
        const endRow = utilizationStartRow + utilizationRows - 1;

        worksheet.mergeCells(startRow, col, endRow, col);

        const mergedCell = worksheet.getCell(startRow, col);
        mergedCell.alignment = { vertical: "middle", horizontal: "center" };
      }

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          if (rowNumber > 1) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return blob;
    // const link = document.createElement("a");
    // link.href = URL.createObjectURL(blob);
    // link.download = "Room_Schedules.xlsx";
    // link.click();

    // this.$q.notify({
    //   color: "positive",
    //   message: "Excel file generated successfully!",
    //   icon: "check_circle",
    // });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    this.$q.notify({
      color: "negative",
      message: "Error generating Excel file.",
      icon: "error",
    });
  }
};

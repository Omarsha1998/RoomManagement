const { DateTime, Interval } = require("luxon");

const daysArr = ["M", "T", "W", "TH", "F", "S", "SU"];

const daysMap = daysArr.reduce((acc, val, idx) => {
  acc[val] = idx;
  return acc;
}, {});

function checkIntervals(schedule, formatter) {
  // console.log(schedule);
  const ret = [];

  // GET DATE RANGE (DEFAULT TODAY)
  const scheduleDateFrom = DateTime.fromJSDate(
    schedule?.fromDate ?? new Date(),
  );

  // ADD 1 DAY TO FIX `Interval.splitBy({ day: 1 })` EXCLUDING THE LAST DAY
  const scheduleDateTo = DateTime.fromJSDate(
    schedule?.toDate ?? new Date(),
  ).plus({
    days: 1,
  });

  // GET WEEK DAYS (MONDAY (0), TUESDAY (1), etc.) (DEFAULT ALL WEEK DAYS)
  const days = schedule?.days
    ? schedule.days.split(",").map((day) => daysMap[day])
    : Object.values(daysMap);

  // GET DATES BASED DATE RANGE AND WEEK DAYS
  const dates = Interval.fromDateTimes(scheduleDateFrom, scheduleDateTo)
    .splitBy({ day: 1 })
    .filter((dt) => days.includes(dt.start.weekday - 1)) // DateTime.start.weekday USES ONE-BASED INDEXING
    .map((dt) => dt.start.toISODate());

  // GET TIME INTERVALS (DEFAULT: 00:00 TO 24:00)
  const intervals = schedule?.intervals
    ? schedule.intervals.split(",").map((interval) => interval.split("-"))
    : [["00:00", "24:00"]];

  // GENERATE DATE & TIME INTERVALS
  for (const date of dates) {
    for (const interval of intervals) {
      const [timeFrom, timeTo] = interval;

      const dateTimeFrom = `${date}T${timeFrom}`;
      const dateTimeTo = `${date}T${timeTo}`;

      const dateTimeInterval = Interval.fromISO(
        `${dateTimeFrom}/${dateTimeTo}`,
      );

      if (formatter) {
        ret.push(formatter(dateTimeInterval));
        continue;
      }
      ret.push(dateTimeInterval);
    }
  }
  return ret;
}

function getDayOfWeek(dateString) {
  const daysOfWeekAbbr = ["SU", "M", "T", "W", "TH", "F", "S"];
  const date = new Date(dateString);
  return daysOfWeekAbbr[date.getDay()];
}

function parseDate(dateString) {
  let year, month, day;

  if (dateString.includes("-")) {
    [year, month, day] = dateString.split("-");
  } else if (dateString.includes("/")) {
    [month, day, year] = dateString.split("/");
  } else {
    throw new Error("Invalid date format");
  }

  return new Date(year, month - 1, day);
}

// function calculateAvailableIntervals(occupiedIntervalsStr, roomType) {
//   console.log(occupiedIntervalsStr, roomType);
//   const workingHours = "07:00-22:00";

//   if (roomType === "UEM" || roomType === "OC") {
//     return workingHours;
//   }

//   if (!occupiedIntervalsStr || occupiedIntervalsStr.trim() === "") {
//     return workingHours;
//   }
//   const occupiedIntervals = occupiedIntervalsStr
//     .split(",")
//     .map((intervalStr) => {
//       const [startStr, endStr] = intervalStr.split("-");
//       return Interval.fromDateTimes(
//         DateTime.fromFormat(startStr.trim(), "HH:mm"),
//         DateTime.fromFormat(endStr.trim(), "HH:mm"),
//       );
//     });

//   const allIntervalStartStr = workingHours.split("-")[0].trim();
//   const allIntervalEndStr = workingHours.split("-")[1].trim();
//   const allIntervals = Interval.fromDateTimes(
//     DateTime.fromFormat(allIntervalStartStr, "HH:mm"),
//     DateTime.fromFormat(allIntervalEndStr, "HH:mm"),
//   );

//   const availableIntervals = allIntervals.difference(...occupiedIntervals);

//   const availableIntervalsStr = availableIntervals
//     .map(
//       (interval) =>
//         `${interval.start.toFormat("HH:mm")}-${interval.end.toFormat("HH:mm")}`,
//     )
//     .join(",");

//   console.log(availableIntervals);

//   return availableIntervalsStr;
// }

function calculateAvailableIntervals(occupiedIntervalsStr, roomType) {
  const workingHours = "07:00-22:00";

  if (roomType === "UEM" || roomType === "OC") {
    return workingHours;
  }

  if (!occupiedIntervalsStr || occupiedIntervalsStr.trim() === "") {
    return workingHours;
  }

  const [whStartStr, whEndStr] = workingHours.split("-");
  const today = DateTime.now().startOf("day");

  const workingStart = DateTime.fromFormat(whStartStr, "HH:mm").set({
    year: today.year,
    month: today.month,
    day: today.day,
  });

  const workingEnd = DateTime.fromFormat(whEndStr, "HH:mm").set({
    year: today.year,
    month: today.month,
    day: today.day,
  });

  const workingInterval = Interval.fromDateTimes(workingStart, workingEnd);

  const occupiedIntervals = occupiedIntervalsStr
    .split(",")
    .map((intervalStr) => {
      const [startStr, endStr] = intervalStr.split("-").map((t) => t.trim());

      const start = DateTime.fromFormat(startStr, "HH:mm").set({
        year: today.year,
        month: today.month,
        day: today.day,
      });

      let end = DateTime.fromFormat(endStr, "HH:mm").set({
        year: today.year,
        month: today.month,
        day: today.day,
      });

      if (end <= start) {
        end = end.plus({ days: 1 });
      }

      const interval = Interval.fromDateTimes(start, end);
      const overlap = interval.intersection(workingInterval);

      return overlap;
    })
    .filter((i) => i !== null);

  let available = [workingInterval];
  occupiedIntervals.forEach((occ) => {
    available = available.flatMap((free) => free.difference(occ));
  });

  const availableIntervalsStr = available
    .map(
      (interval) =>
        `${interval.start.toFormat("HH:mm")}-${interval.end.toFormat("HH:mm")}`,
    )
    .join(",");

  return availableIntervalsStr;
}

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

function getFreeTimeSlots(roomDataList, fromDateParams, toDateParams) {
  const freeTimeSlotsMap = new Map();
  for (const roomData of roomDataList) {
    const {
      roomId,
      roomName,
      roomTypeDescription,
      roomType,
      building,
      fromDate,
      toDate,
      days,
      intervals,
      capacity,
    } = roomData;

    if (!freeTimeSlotsMap.has(roomId)) {
      freeTimeSlotsMap.set(roomId, {
        roomId,
        roomName,
        roomTypeDescription,
        roomType,
        building,
        fromDate: parseDate(fromDate),
        toDate: parseDate(toDate),
        capacity: capacity,
        freeTimeSlots: {},
      });
    }

    const existingData = freeTimeSlotsMap.get(roomId);

    existingData.fromDate = new Date(
      Math.min(existingData.fromDate, parseDate(fromDate)),
    );
    existingData.toDate = new Date(
      Math.max(existingData.toDate, parseDate(toDate)),
    );

    const startDate = new Date(parseDate(fromDate));
    const endDate = new Date(parseDate(toDate));
    const startDateParams = new Date(parseDate(fromDateParams));
    const endDateParams = new Date(parseDate(toDateParams));

    while (startDateParams <= endDateParams) {
      const currentDateStr = formatDate(startDateParams);
      const currentDay = getDayOfWeek(currentDateStr);

      if (!existingData.freeTimeSlots[currentDateStr]) {
        existingData.freeTimeSlots[currentDateStr] = {
          day: currentDay,
          intervals: "",
        };
      }

      if (
        days.includes(currentDay) &&
        startDateParams >= startDate &&
        startDateParams <= endDate
      ) {
        if (existingData.freeTimeSlots[currentDateStr].intervals) {
          existingData.freeTimeSlots[currentDateStr].intervals +=
            `,${intervals}`;
        } else {
          existingData.freeTimeSlots[currentDateStr].intervals = intervals;
        }
      }

      startDateParams.setDate(startDateParams.getDate() + 1);
    }
  }

  for (const roomData of freeTimeSlotsMap.values()) {
    const freeTimeSlotsArray = [];
    for (const date in roomData.freeTimeSlots) {
      const intervals = roomData.freeTimeSlots[date].intervals;
      const availableIntervals = calculateAvailableIntervals(
        intervals,
        roomData.roomType,
      );
      freeTimeSlotsArray.push({
        date,
        ...roomData.freeTimeSlots[date],
        intervals: availableIntervals,
      });
    }
    roomData.freeTimeSlots = freeTimeSlotsArray;
    roomData.fromDate = formatDate(roomData.fromDate);
    roomData.toDate = formatDate(roomData.toDate);
  }
  // const freeTimeSlotsArray = Array.from(freeTimeSlotsMap.values());
  // console.log(JSON.stringify(freeTimeSlotsArray, null, 2));
  return Array.from(freeTimeSlotsMap.values());
}

// function getFreeTimeSlots(roomDataList, fromDateParams, toDateParams) {
//   if (!Array.isArray(roomDataList)) {
//     roomDataList = [roomDataList];
//   }

//   const freeTimeSlotsMap = new Map();
//   for (const roomData of roomDataList) {
//     const {
//       roomId,
//       roomName,
//       roomTypeDescription,
//       roomType,
//       building,
//       fromDate,
//       toDate,
//       days,
//       intervals,
//     } = roomData;

//     if (!freeTimeSlotsMap.has(roomId)) {
//       freeTimeSlotsMap.set(roomId, {
//         roomId,
//         roomName,
//         roomTypeDescription,
//         roomType,
//         building,
//         fromDate: parseDate(fromDate),
//         toDate: parseDate(toDate),
//         freeTimeSlots: {},
//       });
//     }

//     const existingData = freeTimeSlotsMap.get(roomId);

//     existingData.fromDate = new Date(
//       Math.min(existingData.fromDate, parseDate(fromDate)),
//     );
//     existingData.toDate = new Date(
//       Math.max(existingData.toDate, parseDate(toDate)),
//     );

//     const startDate = new Date(parseDate(fromDate));
//     const endDateParams = new Date(parseDate(toDateParams));
//     const startDateParams = new Date(parseDate(fromDateParams));

//     while (startDate <= endDateParams) {
//       const startDateStr = formatDate(startDate);
//       const currentDay = getDayOfWeek(startDateStr);

//       console.log(currentDay);

//       if (!existingData.freeTimeSlots[startDateStr]) {
//         existingData.freeTimeSlots[startDateStr] = {
//           day: currentDay,
//           intervals: "",
//         };
//       }

//       if (
//         startDate >= parseDate(fromDate) &&
//         startDate <= parseDate(toDate) &&
//         days.includes(currentDay[0])
//       ) {
//         if (existingData.freeTimeSlots[startDateStr].intervals) {
//           existingData.freeTimeSlots[startDateStr].intervals += `,${intervals}`;
//         } else {
//           existingData.freeTimeSlots[startDateStr].intervals = intervals;
//         }
//       } else {
//         existingData.freeTimeSlots[startDateStr].intervals = "";
//       }

//       startDate.setDate(startDate.getDate() + 1);
//     }
//   }

//   for (const roomData of freeTimeSlotsMap.values()) {
//     const freeTimeSlotsArray = [];
//     for (const date in roomData.freeTimeSlots) {
//       const intervals = roomData.freeTimeSlots[date].intervals;
//       const availableIntervals = calculateAvailableIntervals(intervals);
//       freeTimeSlotsArray.push({
//         date,
//         ...roomData.freeTimeSlots[date],
//         intervals: availableIntervals,
//       });
//     }
//     roomData.freeTimeSlots = freeTimeSlotsArray;
//     roomData.fromDate = formatDate(roomData.fromDate);
//     roomData.toDate = formatDate(roomData.toDate);
//   }

//   const freeTimeSlotsArray = Array.from(freeTimeSlotsMap.values());
//   return Array.from(freeTimeSlotsMap.values());
// }

// function parseDate(dateString) {
//   const [month, day, year] = dateString.split("/");
//   return new Date(year, month - 1, day);
// }

// function formatToMMDDYYYY(dateString) {
//   const [year, month, day] = dateString.split("-");
//   return `${parseInt(month)}/${parseInt(day)}/${year}`;
// }

function getBookedRooms(roomDataList) {
  const freeTimeSlotsMap = new Map();

  for (const roomData of roomDataList) {
    const {
      id,
      roomId,
      roomName,
      roomDescription,
      buildingDescription,
      fromDate,
      toDate,
      days,
      intervals,
      section,
      remarks,
      professor,
      subjectCode,
      subjectDescription,
      deptLabel,
      floor,
      dateTimeCreated,
      active,
    } = roomData;

    const parseFrom = parseDate(fromDate);
    const parseTo = parseDate(toDate);
    const formatFrom = formatDate(parseFrom);
    const formatTo = formatDate(parseTo);

    if (!freeTimeSlotsMap.has(roomId)) {
      freeTimeSlotsMap.set(roomId, {
        roomId,
        roomName,
        roomDescription,
        floor,
        buildingDescription,
        fromDate: parseFrom,
        toDate: parseTo,
        dateTimeCreated: dateTimeCreated,
        booked: [],
      });
    }

    const existingData = freeTimeSlotsMap.get(roomId);

    existingData.fromDate = new Date(
      Math.min(existingData.fromDate, parseFrom),
    );
    existingData.toDate = new Date(Math.max(existingData.toDate, parseTo));

    existingData.booked.push({
      id,
      subjectDescription,
      subjectCode,
      section,
      professor,
      days,
      intervals,
      remarks,
      formatFrom,
      formatTo,
      deptLabel,
      active,
      dateTimeCreated,
    });
  }

  for (const roomData of freeTimeSlotsMap.values()) {
    roomData.fromDate = formatDate(roomData.fromDate);
    roomData.toDate = formatDate(roomData.toDate);
  }

  return Array.from(freeTimeSlotsMap.values());
}

module.exports = {
  checkIntervals,
  getFreeTimeSlots,
  getBookedRooms,
};

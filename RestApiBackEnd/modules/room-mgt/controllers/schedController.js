const db = require("../../../helpers/sql.js");
const intervalsFromSched = require("../helpers/intervalsFromSched.js");
const schedModel = require("../models/schedModel.js");
const appModel = require("../models/appModel.js");

const _intervalsOverlap = (intervals1, intervals2) => {
  return intervals1.some((int1) => {
    return intervals2.some((int2) => {
      return int1.overlaps(int2);
    });
  });
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const shuffleRandomlyRandom = (array) => {
  const times = Math.floor(Math.random() * 10) + 1; // Shuffle between 1 and 10 times
  for (let i = 0; i < times; i++) {
    shuffleArray(array);
  }
  return array;
};

const scheduleFunction = async (roomId) => {
  const result = await db.select(
    "*",
    "RoomMgt..RoomSchedules",
    { RoomId: roomId, Active: 1 },
    null,
    { camelized: true },
  );
  return result || [];
};

const insertedAndCheckIntervalItem = (
  roomId,
  fromDate,
  toDate,
  days,
  subjectCode,
  section,
  professor,
  selectedInterval,
  remarks,
  department,
  checkInterval,
) => {
  if (checkInterval) {
    return {
      roomId: roomId,
      fromDate: fromDate,
      toDate: toDate,
      days: days,
      subjectCode: subjectCode,
      section: section,
      professor: professor,
      intervals: selectedInterval,
      remarks: remarks,
      departmentCode: department,
    };
  } else {
    return {
      roomId: roomId,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      days: days,
      subjectCode: subjectCode,
      section: section,
      professor: professor,
      intervals: selectedInterval,
      remarks: remarks,
      departmentCode: department,
    };
  }
};

const insertedRoomFunction = async (newInsertSched, employeeId) => {
  return await db.transact(async (txn) => {
    return await db.insertOne(
      "RoomMgt..RoomSchedules",
      {
        ...newInsertSched,
        createdBy: employeeId,
      },
      txn,
      { camelized: false },
    );
  });
};

const createAutoRoomSchedule = async (req, res) => {
  const reqDataArray = Array.isArray(req.body) ? req.body : [req.body];
  const employeeId = req.user.employeeId;
  const employeeDeptCode = req.user.employeeDeptCode;
  const currentYear = new Date().getFullYear();
  const insertedRooms = [];

  for (const reqData of reqDataArray) {
    if (reqData.fromDate === undefined && reqData.toDate === undefined) {
      if (reqData.semester === "1") {
        reqData.fromDate = `${currentYear}-06-01`;
        reqData.toDate = `${currentYear}-12-15`;
      } else if (reqData.semester === "2") {
        reqData.fromDate = `${currentYear}-01-01`;
        reqData.toDate = `${currentYear}-05-31`;
      }
    }

    const getRoomDesignation = await schedModel.getRoomDesignation(
      reqData.roomType,
      reqData.capacity,
      employeeDeptCode,
    );
    const shuffledRooms = shuffleRandomlyRandom(getRoomDesignation);

    let roomTypeIsAvalable = false;
    let insertedRoom = null;
    let roomTypeDesignation = null;
    for (const room of shuffledRooms) {
      const formattedFromDate = new Date(reqData.fromDate).toLocaleDateString(
        "en-US",
      );
      roomTypeDesignation = room.description;
      const formattedToDate = new Date(reqData.toDate).toLocaleDateString(
        "en-US",
      );
      const defaultDays = "M,T,W,TH,F,S,SU";
      const getIntervals = await schedModel.getIntervals(room.id);

      for (const item of getIntervals) {
        item.fromDate = item.fromDate
          ? new Date(item.fromDate).toLocaleDateString("en-US")
          : formattedFromDate;
        item.toDate = item.toDate
          ? new Date(item.toDate).toLocaleDateString("en-US")
          : formattedToDate;
        item.days = item.days || defaultDays;
      }

      const shuffledFreeIntervals = intervalsFromSched.getFreeTimeSlots(
        getIntervals,
        formattedFromDate,
        formattedToDate,
      );

      const daysArray = reqData.days.split(",");
      const major = true;
      const workingHours = { start: 7, end: 22 };
      if (shuffledFreeIntervals.length === 0) {
        let selectedInterval = null;
        const requiredHours = major ? 2 : 1;
        for (
          let hour = workingHours.start;
          hour + requiredHours <= workingHours.end;
          hour++
        ) {
          selectedInterval = `${hour.toString().padStart(2, "0")}:00-${(hour + requiredHours).toString().padStart(2, "0")}:00`;
          break;
        }
        const checkInterval = insertedAndCheckIntervalItem(
          room.id,
          reqData.fromDate,
          reqData.toDate,
          reqData.days,
          reqData.subjectCode,
          reqData.section,
          reqData.professor,
          selectedInterval,
          reqData.remarks,
          employeeDeptCode,
          true,
        );
        const newInsertSched = insertedAndCheckIntervalItem(
          room.id,
          reqData.fromDate,
          reqData.toDate,
          reqData.days,
          reqData.subjectCode,
          reqData.section,
          reqData.professor,
          selectedInterval,
          reqData.remarks,
          employeeDeptCode,
          false,
        );

        const intervals1 = intervalsFromSched.checkIntervals(checkInterval);
        const schedules = await scheduleFunction(room.id);
        let isRoomAvailable = true;
        roomTypeIsAvalable = true;

        if (room.roomTypeCodes !== "OC" && room.roomTypeCodes !== "UEM") {
          for (const sched of schedules) {
            const intervals2 = intervalsFromSched.checkIntervals(sched);
            if (_intervalsOverlap(intervals1, intervals2)) {
              isRoomAvailable = false;
              break;
            }
          }
        }

        if (isRoomAvailable) {
          insertedRoom = await insertedRoomFunction(newInsertSched, employeeId);
          break;
        } else {
          return res.status(400).json({ body: "Schedule Already Taken" });
        }
      } else {
        const freeTimeSlots = shuffledFreeIntervals[0].freeTimeSlots.filter(
          (slot) => daysArray.includes(slot.day),
        );

        let selectedInterval;
        let continuousSlot;
        if (freeTimeSlots) {
          const allIntervalsSame = freeTimeSlots.every(
            (slot) => slot.intervals === freeTimeSlots[0].intervals,
          );
          if (allIntervalsSame && freeTimeSlots[0].intervals === "") {
            continue;
          }
          roomTypeIsAvalable = true;
          const requiredHours = major ? 2 : 1;
          if (!allIntervalsSame) {
            freeTimeSlots.sort((a, b) => {
              const [startA] = a.intervals.split("-");
              const [startB] = b.intervals.split("-");
              return (
                new Date(`1970/01/01 ${startA}`) -
                new Date(`1970/01/01 ${startB}`)
              );
            });
            // selectedInterval = freeTimeSlots.find((slot) => {
            //   const intervals = slot.intervals.split(",").map((interval) => {
            //     const [start, end] = interval.split("-");
            //     return { start, end };
            //   });
            //   for (let i = 0; i < intervals.length; i++) {
            //     const { start, end } = intervals[i];
            //     const startHour = parseInt(start.split(":")[0], 10);
            //     const endHour = parseInt(end.split(":")[0], 10);
            //     for (
            //       let hour = startHour;
            //       hour + requiredHours <= endHour;
            //       hour++
            //     ) {
            //       continuousSlot = {
            //         start: `${hour.toString().padStart(2, "0")}:00`,
            //         end: `${(hour + requiredHours).toString().padStart(2, "0")}:00`,
            //       };
            //       selectedInterval = `${continuousSlot.start}-${continuousSlot.end}`;
            //       console.log(selectedInterval);

            //       return true;
            //     }
            //   }
            //   return false;
            // });
            const selectedFreeTimeSlotsInterval = freeTimeSlots[0];
            const intervals = selectedFreeTimeSlotsInterval.intervals
              .split(",")
              .map((interval) => {
                const [start, end] = interval.split("-");
                return { start, end };
              });

            for (let i = 0; i < intervals.length; i++) {
              const { start, end } = intervals[i];
              const startHour = parseInt(start.split(":")[0], 10);
              const endHour = parseInt(end.split(":")[0], 10);

              for (
                let hour = startHour;
                hour + requiredHours <= endHour;
                hour++
              ) {
                continuousSlot = {
                  start: `${hour.toString().padStart(2, "0")}:00`,
                  end: `${(hour + requiredHours).toString().padStart(2, "0")}:00`,
                };
                selectedInterval = `${continuousSlot.start}-${continuousSlot.end}`;
                break;
              }

              if (continuousSlot) break;
            }

            if (!selectedInterval) {
              console.error("No valid interval found");
            }
          } else {
            const selectedFreeTimeSlotsInterval = freeTimeSlots[0];
            const intervals = selectedFreeTimeSlotsInterval.intervals
              .split(",")
              .map((interval) => {
                const [start, end] = interval.split("-");
                return { start, end };
              });
            for (let i = 0; i < intervals.length; i++) {
              const { start, end } = intervals[i];
              const startHour = parseInt(start.split(":")[0], 10);
              const endHour = parseInt(end.split(":")[0], 10);
              for (
                let hour = startHour;
                hour + requiredHours <= endHour;
                hour++
              ) {
                continuousSlot = {
                  start: `${hour.toString().padStart(2, "0")}:00`,
                  end: `${(hour + requiredHours).toString().padStart(2, "0")}:00`,
                };
                selectedInterval = `${continuousSlot.start}-${continuousSlot.end}`;
                break;
              }
              if (continuousSlot) break;
            }
          }
        } else {
          continue;
        }
        const checkInterval = insertedAndCheckIntervalItem(
          room.id,
          reqData.fromDate,
          reqData.toDate,
          reqData.days,
          reqData.subjectCode,
          reqData.section,
          reqData.professor,
          selectedInterval,
          reqData.remarks,
          employeeDeptCode,
          true,
        );
        const newInsertSched = await insertedAndCheckIntervalItem(
          room.id,
          reqData.fromDate,
          reqData.toDate,
          reqData.days,
          reqData.subjectCode,
          reqData.section,
          reqData.professor,
          selectedInterval,
          reqData.remarks,
          employeeDeptCode,
          false,
        );

        const intervals1 = intervalsFromSched.checkIntervals(checkInterval);
        const schedules = await scheduleFunction(room.id);
        let isRoomAvailable = true;
        for (const sched of schedules) {
          const intervals2 = intervalsFromSched.checkIntervals(sched);
          if (_intervalsOverlap(intervals1, intervals2)) {
            isRoomAvailable = false;
            break;
          }
        }
        if (isRoomAvailable) {
          insertedRoom = await insertedRoomFunction(newInsertSched, employeeId);
          break;
        }
      }
    }
    if (roomTypeIsAvalable === false) {
      return res.status(400).json({
        body: `All rooms of Room Type: ${roomTypeDesignation} are unavailable`,
      });
    }
    if (!insertedRoom) return res.status(500).json(null);
    insertedRooms.push(insertedRoom);
  }

  res.status(200).json(insertedRooms);
};

const getAvailableRoom = async (req, res) => {
  const { fromDate, toDate } = req.query;

  const defaultDays = "M,T,W,TH,F,S,SU";
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const formattedFromDate = from.toLocaleDateString("en-US");
  const formattedToDate = to.toLocaleDateString("en-US");

  const rooms = await schedModel.getAllRoom(fromDate, toDate);

  for (const room of rooms) {
    const roomFromDate = room.fromDate ? new Date(room.fromDate) : null;
    const roomToDate = room.toDate ? new Date(room.toDate) : null;
    if (roomFromDate) {
      room.fromDate = roomFromDate.toLocaleDateString("en-US");
    } else {
      room.fromDate = formattedFromDate;
    }

    if (roomToDate) {
      room.toDate = roomToDate.toLocaleDateString("en-US");
    } else {
      room.toDate = formattedToDate;
    }

    room.days = room.days || defaultDays;
  }

  const result = intervalsFromSched.getFreeTimeSlots(rooms, fromDate, toDate);

  if (!result) return res.status(500).json(null);
  res.status(200).json(result);
};

const getSubjectCode = async (req, res) => {
  try {
    const { semester } = req.query;
    const result = await schedModel.getSubjectCode(semester);
    return res.status(200).json(result && result.length > 0 ? result : []);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const excelData = async () => {
//   const data = [
//     {
//       roomId:,
//       fromDate: ,
//       toDate: ,
//       days: ,
//       subjectCode: ,
//       section: ,
//       professor: ,
//       intervals: ,
//       remarks: ,
//       departmentCode: ,
//     }
//   ]

// }

const scheduleBooking = async (req, res) => {
  const reqDataArray = Array.isArray(req.body) ? req.body : [req.body];
  const employeeId = req.user.employeeId;

  let insertedRoom;

  for (const data of reqDataArray) {
    const checkInterval = {
      roomId: data.roomId,
      fromDate: new Date(data.fromDate),
      toDate: new Date(data.toDate),
      days: data.days,
      intervals: data.intervals,
    };

    const newInsertSched = {
      roomId: data.roomId,
      fromDate: data.fromDate,
      toDate: data.toDate,
      days: data.days,
      intervals: data.intervals,
      remarks: data.remarks,
      departmentCode: data.department,
      active: 1,
    };
    const intervals1 = intervalsFromSched.checkIntervals(checkInterval);

    const schedules = await scheduleFunction(data.roomId);
    const roomData = await schedModel.checkRoom(data.roomId);

    let isRoomAvailable = true;

    if (
      roomData[0].roomTypeCodes !== "OC" &&
      roomData[0].roomTypeCodes !== "UEM"
    ) {
      for (const sched of schedules) {
        const intervals2 = intervalsFromSched.checkIntervals(sched);
        if (_intervalsOverlap(intervals1, intervals2)) {
          isRoomAvailable = false;
          break;
        }
      }
    }

    if (isRoomAvailable) {
      insertedRoom = await insertedRoomFunction(newInsertSched, employeeId);
    } else {
      return res.status(400).json({ body: "Schedule Already Taken" });
    }
  }
  if (!insertedRoom) return res.status(500).json(null);
  res.status(200).json(insertedRoom);
};

// const scheduleBookingManually = async (req, res) => {
//   // const reqDataArray = Array.isArray(req.body) ? req.body : [req.body];

//   const reqDataArray = [
//     {
//       roomId: "306",
//       subjectCode: "NCM118",
//       intervals: "08:00-12:00",
//       days: "M,T,W,TH,F",
//       fromDate: "08/05/2024",
//       toDate: "12/07/2024",
//       remarks: "CLASS SCHEDULE / ARRANGED WITH CAHP",
//       departmentCode: "COLLEGE OF NURSING",
//       section: "N4A,N4B,N4C,N4D",
//     },
//   ];
//   const employeeId = "8958";

//   let insertedRoom;

//   for (const data of reqDataArray) {
//     const checkInterval = {
//       roomId: data.roomId,
//       fromDate: new Date(data.fromDate),
//       toDate: new Date(data.toDate),
//       days: data.days,
//       intervals: data.intervals,
//     };

//     const newInsertSched = {
//       roomId: data.roomId,
//       fromDate: data.fromDate,
//       toDate: data.toDate,
//       subjectCode: data.subjectCode,
//       section: data.section,
//       days: data.days,
//       intervals: data.intervals,
//       remarks: data.remarks,
//       departmentCode: data.departmentCode,
//     };

//     const intervals1 = intervalsFromSched.checkIntervals(checkInterval);

//     const schedules = await scheduleFunction(data.roomId);

//     const roomData = await schedModel.checkRoom(data.roomId);

//     let isRoomAvailable = true;

//     if (
//       roomData[0].roomTypeCodes !== "OC" &&
//       roomData[0].roomTypeCodes !== "UEM" &&
//       roomData[0].roomTypeCodes !== "AFR" &&
//       roomData[0].roomTypeCodes !== "RR" &&
//       roomData[0].roomTypeCodes !== "CAST" &&
//       roomData[0].roomTypeCodes !== "GYM" &&
//       roomData[0].roomTypeCodes !== "GSLR" &&
//       !(roomData[0].roomTypeCodes === "WR" && roomData[0].bldgCode === "TYKB")
//     ) {
//       for (const sched of schedules) {
//         const intervals2 = intervalsFromSched.checkIntervals(sched);
//         if (_intervalsOverlap(intervals1, intervals2)) {
//           isRoomAvailable = false;
//           break;
//         }
//       }
//     }

//     if (isRoomAvailable) {
//       insertedRoom = await insertedRoomFunction(newInsertSched, employeeId);
//     } else {
//       return res.status(400).json({ body: "Schedule Already Taken" });
//     }
//   }
//   if (!insertedRoom) return res.status(500).json(null);
//   res.status(200).json(insertedRoom);
// };

const scheduleBookingManually = async (req, res) => {
  const reqDataArray = [];
  const employeeId = "8958";

  // Array to store results for each booking attempt
  const bookingResults = [];
  const conflictingSchedules = [];
  let successCount = 0;
  let failureCount = 0;

  for (const [i, data] of reqDataArray.entries()) {
    console.log(
      `Processing booking ${i + 1}/${reqDataArray.length} - Room ${data.roomId}`,
    );

    const checkInterval = {
      roomId: data.roomId,
      fromDate: new Date(data.fromDate),
      toDate: new Date(data.toDate),
      days: data.days,
      intervals: data.intervals,
    };

    const newInsertSched = {
      roomId: data.roomId,
      fromDate: data.fromDate,
      toDate: data.toDate,
      subjectCode: data.subjectCode,
      section: data.section,
      days: data.days,
      intervals: data.intervals,
      remarks: data.remarks,
      departmentCode: data.departmentCode ? data.departmentCode : null,
      professor: data.professor,
      active: 1,
    };

    try {
      const intervals1 = intervalsFromSched.checkIntervals(checkInterval);
      const schedules = await scheduleFunction(data.roomId);
      const roomData = await schedModel.checkRoom(data.roomId);

      let isRoomAvailable = true;
      const conflictingScheds = [];

      // Check if room type requires conflict checking
      if (
        roomData[0].roomTypeCodes !== "OC" &&
        roomData[0].roomTypeCodes !== "UEM"
      ) {
        for (const sched of schedules) {
          const intervals2 = intervalsFromSched.checkIntervals(sched);
          if (_intervalsOverlap(intervals1, intervals2)) {
            isRoomAvailable = false;
            conflictingScheds.push({
              ...sched,
              conflictType: "Time overlap detected",
            });
          }
        }
      }

      if (isRoomAvailable) {
        // Attempt to insert the schedule
        const insertedRoom = await insertedRoomFunction(
          newInsertSched,
          employeeId,
        );

        bookingResults.push({
          index: i + 1,
          status: "SUCCESS",
          data: data,
          result: insertedRoom,
          message: "Schedule booked successfully",
        });

        successCount++;
        console.log(`✅ Booking ${i + 1} successful`);
      } else {
        // Room not available - collect conflicting schedules with detailed info
        bookingResults.push({
          index: i + 1,
          status: "FAILED",
          data: data,
          result: null,
          message: "Schedule conflicts detected",
          conflicts: conflictingScheds,
        });

        conflictingSchedules.push({
          requestIndex: i + 1,
          roomId: data.roomId,
          requestedSchedule: {
            ...data,
            newInsertSched: newInsertSched, // Include the complete schedule object
          },
          conflictingSchedules: conflictingScheds.map((conflict) => ({
            ...conflict,
            conflictDetails: {
              existingSubjectCode: conflict.subjectCode,
              existingSection: conflict.section,
              existingDays: conflict.days,
              existingIntervals: conflict.intervals,
              existingFromDate: conflict.fromDate,
              existingToDate: conflict.toDate,
            },
          })),
        });

        failureCount++;
        console.log(`❌ Booking ${i + 1} failed - conflicts found`);
      }
    } catch (error) {
      // Handle any errors during processing
      bookingResults.push({
        index: i + 1,
        status: "ERROR",
        data: data,
        result: null,
        message: `Error processing booking: ${error.message}`,
        error: error.message,
      });

      failureCount++;
      console.log(`⚠️ Booking ${i + 1} error: ${error.message}`);
    }
  }

  // Display detailed conflicts at the end
  if (conflictingSchedules.length > 0) {
    console.log(`\n${"=".repeat(60)}`);
    console.log("📋 DETAILED CONFLICT REPORT");
    console.log("=".repeat(60));

    conflictingSchedules.forEach((conflict, index) => {
      console.log(`\n🔴 CONFLICT ${index + 1}:`);
      console.log(`   Request Index: ${conflict.requestIndex}`);
      console.log(`   Room ID: ${conflict.roomId}`);

      console.log("\n   📝 REQUESTED SCHEDULE:");
      console.log(
        `      Subject Code: ${conflict.requestedSchedule.subjectCode}`,
      );
      console.log(`      Section: ${conflict.requestedSchedule.section}`);
      console.log(`      Days: ${conflict.requestedSchedule.days}`);
      console.log(`      Intervals: ${conflict.requestedSchedule.intervals}`);
      console.log(`      From Date: ${conflict.requestedSchedule.fromDate}`);
      console.log(`      To Date: ${conflict.requestedSchedule.toDate}`);
      console.log(
        `      Department: ${conflict.requestedSchedule.departmentCode || "N/A"}`,
      );

      console.log("\n   ⚠️ CONFLICTING WITH:");
      conflict.conflictingSchedules.forEach((existingSched, schedIndex) => {
        console.log(`      Conflict ${schedIndex + 1}:`);
        console.log(
          `         Existing Subject: ${existingSched.conflictDetails.existingSubjectCode}`,
        );
        console.log(
          `         Existing Section: ${existingSched.conflictDetails.existingSection}`,
        );
        console.log(
          `         Existing Days: ${existingSched.conflictDetails.existingDays}`,
        );
        console.log(
          `         Existing Intervals: ${existingSched.conflictDetails.existingIntervals}`,
        );
        console.log(
          `         Existing Date Range: ${existingSched.conflictDetails.existingFromDate} to ${existingSched.conflictDetails.existingToDate}`,
        );
        console.log(`         Conflict Type: ${existingSched.conflictType}`);
      });

      console.log("\n   📋 COMPLETE newInsertSched OBJECT:");
      console.log(
        `      ${JSON.stringify(conflict.requestedSchedule.newInsertSched, null, 6)}`,
      );
    });

    console.log(`\n${"=".repeat(60)}`);
    console.log("END OF CONFLICT REPORT");
    console.log(`${"=".repeat(60)}\n`);
  }

  // Prepare comprehensive response
  const response = {
    summary: {
      total: reqDataArray.length,
      successful: successCount,
      failed: failureCount,
      hasConflicts: conflictingSchedules.length > 0,
    },
    progress: {
      completed: reqDataArray.length,
      successRate: `${((successCount / reqDataArray.length) * 100).toFixed(1)}%`,
    },
    bookingResults: bookingResults,
    conflictingSchedules:
      conflictingSchedules.length > 0 ? conflictingSchedules : null,
  };

  // Determine response status
  if (successCount === 0) {
    // All bookings failed
    return res.status(400).json({
      message: "All booking attempts failed",
      ...response,
    });
  } else if (failureCount === 0) {
    // All bookings successful
    return res.status(200).json({
      message: "All bookings completed successfully",
      ...response,
    });
  } else {
    // Mixed results
    return res.status(207).json({
      message: "Partial success - some bookings completed",
      ...response,
    });
  }
};

const customScheduleBooking = async (req, res) => {
  const reqDataArray = Array.isArray(req.body) ? req.body : [req.body];
  const employeeId = req.user.employeeId;
  // const employeeDeptCode = req.user.employeeDeptCode;

  let insertedRoom;

  for (const data of reqDataArray) {
    const checkInterval = {
      roomId: data.roomId,
      fromDate: new Date(data.fromDate),
      toDate: new Date(data.toDate),
      days: data.days,
      intervals: data.intervals,
    };

    const newInsertSched = {
      roomId: data.roomId,
      fromDate: data.fromDate,
      toDate: data.toDate,
      subjectCode: data.subjectCode,
      section: data.section,
      days: data.days,
      intervals: data.intervals,
      remarks: data.remarks,
      departmentCode: data.department,
      professor: data.facultyName,
      active: 1,
    };

    const intervals1 = intervalsFromSched.checkIntervals(checkInterval);

    const schedules = await scheduleFunction(data.roomId);
    const roomData = await schedModel.checkRoom(data.roomId);

    let isRoomAvailable = true;

    if (
      roomData[0].roomTypeCodes !== "OC" &&
      roomData[0].roomTypeCodes !== "UEM"
    ) {
      for (const sched of schedules) {
        const intervals2 = intervalsFromSched.checkIntervals(sched);
        if (_intervalsOverlap(intervals1, intervals2)) {
          isRoomAvailable = false;
          break;
        }
      }
    }

    if (isRoomAvailable) {
      insertedRoom = await insertedRoomFunction(newInsertSched, employeeId);
    } else {
      return res.status(400).json({ body: "Schedule Already Taken" });
    }
  }
  if (!insertedRoom) return res.status(500).json(null);
  res.status(200).json(insertedRoom);
};

const bookedRooms = async (req, res) => {
  try {
    const rooms = await schedModel.bookedRooms();

    if (!rooms || rooms.length === 0) {
      return res.status(200).json([]);
    }

    for (const room of rooms) {
      room.fromDate = room.fromDate
        ? new Date(room.fromDate).toLocaleDateString("en-US")
        : null;
      room.toDate = room.toDate
        ? new Date(room.toDate).toLocaleDateString("en-US")
        : null;
      // room.dateTimeCreated = room.dateTimeCreated
      //   ? new Date(room.dateTimeCreated).toLocaleDateString("en-us")
      //   : null;
    }

    const formattedResult = intervalsFromSched.getBookedRooms(rooms);

    if (!formattedResult) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.status(200).json(formattedResult);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const bookedRoomsByEmployeeCode = async (req, res) => {
  try {
    const employeeCode = req.user?.employeeId;

    if (!employeeCode) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const rooms = await schedModel.bookedRoomsByEmployeeCode(employeeCode);

    if (!rooms || rooms.length === 0) {
      return res.status(200).json([]);
    }

    for (const room of rooms) {
      room.fromDate = room.fromDate
        ? new Date(room.fromDate).toLocaleDateString("en-US")
        : null;
      room.toDate = room.toDate
        ? new Date(room.toDate).toLocaleDateString("en-US")
        : null;
    }

    const formattedResult = intervalsFromSched.getBookedRooms(rooms);

    if (!formattedResult) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.status(200).json(formattedResult);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSections = async (req, res) => {
  const { semester, subjectCode } = req.query;
  const result = await schedModel.getSections(semester, subjectCode);
  if (!result) {
    return res.status(500).json({ body: "Internal Server Error" });
  }
  res.status(200).json(result);
};

const getSemester = async (req, res) => {
  try {
    const result = await schedModel.getSemester();
    return res.status(200).json(result && result.length > 0 ? result : []);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const assignRooms = async (schedules, availableRoomIds, res) => {
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  try {
    for (const schedule of schedules) {
      const shuffledRoomIds = shuffleArray([...availableRoomIds]);

      let roomAssigned = false;

      for (const roomId of shuffledRoomIds) {
        const checkInterval = {
          roomId: roomId,
          fromDate: new Date(schedule.fromDate),
          toDate: new Date(schedule.toDate),
          days: schedule.days,
          intervals: schedule.intervals,
        };

        const intervals1 = intervalsFromSched.checkIntervals(checkInterval);
        const scheduledRoom = await scheduleFunction(roomId);
        let isRoomAvailable = true;

        for (const sched of scheduledRoom) {
          const intervals2 = intervalsFromSched.checkIntervals(sched);
          if (_intervalsOverlap(intervals1, intervals2)) {
            isRoomAvailable = false;
            break;
          }
        }

        if (isRoomAvailable) {
          await db.transact(async (txn) => {
            await schedModel.ConTrial(
              {
                roomId: roomId,
                fromDate: schedule.fromDate,
                toDate: schedule.toDate,
                days: schedule.days,
                intervals: schedule.intervals,
                subjectCode: schedule.subjectCode,
                section: schedule.section,
                departmentCode: schedule.departmentCode,
                remarks: schedule.remarks,
                createdBy: "8958",
              },
              txn,
              "DateTimeCreated",
            );
          });

          roomAssigned = true;
          break;
        }
      }

      if (!roomAssigned) {
        return res
          .status(400)
          .json({ body: "All room IDs are unavailable for schedule" });
      }
    }

    // Success response if needed
    return res.status(200).json({ body: "Schedules assigned successfully" });
  } catch (error) {
    return res.status(500).json({ body: "Error in processing schedules" });
  }
};

const scheduleBookingManuallyByGivenRooms = async () => {
  const roomIds = [230, 248, 249, 306, 309, 310, 313, 314, 315, 361];

  // Example new schedules
  const newSchedules = [];

  await assignRooms(newSchedules, roomIds);
};

const bookedRoomsView = async (req, res) => {
  let { room, department, building, fromDate, toDate } = req.query;
  room = room || "";
  department = department || "";
  building = building || "";
  fromDate = fromDate || "";
  toDate = toDate || "";

  const result = await schedModel.bookedRoomsView(
    room,
    department,
    building,
    fromDate,
    toDate,
  );

  if (!result) {
    return res.status(500).json({ body: "Internal Server Error" });
  }

  let paramFromDate = new Date();
  let paramToDate = new Date();

  if (fromDate.length === 0 && toDate.length === 0) {
    for (const item of result) {
      const itemFromDate = new Date(item.fromDate);
      const itemToDate = new Date(item.toDate);

      if (itemFromDate < paramFromDate) {
        paramFromDate = itemFromDate;
      }

      if (itemToDate > paramToDate) {
        paramToDate = itemToDate;
      }
    }

    // Convert back to ISO string format if needed
    paramFromDate = paramFromDate.toISOString().split("T")[0];
    paramToDate = paramToDate.toISOString().split("T")[0];
  } else {
    paramFromDate = fromDate;
    paramToDate = toDate;
  }

  const mappedResult = result.map((item) => {
    if (fromDate.length > 0 && toDate.length > 0) {
      item.fromDate = fromDate;
      item.toDate = toDate;
    }

    return {
      ...item,
      paramFromDate: paramFromDate,
      paramToDate: paramToDate,
    };
  });

  res.status(200).json(mappedResult);
};

const getAllRooms = async (req, res) => {
  try {
    const result = await schedModel.getAllRoomsForReport();

    return res.status(200).json(result && result.length > 0 ? result : []);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const checkStatus = async () => {
//   const result = await schedModel.checkStatus();
//   let update = [];
//   const currDate = new Date();
//   for (const item of result) {
//     if (currDate > item.toDate) {
//       try {
//         const result = await db.transact(async (txn) => {
//           return await schedModel.updateStatus(
//             {
//               Active: 0,
//               UpdatedBy: "System",
//             },
//             {
//               id: item.id,
//             },
//             txn,
//             "DateTimeUpdated",
//           );
//         });

//         if (!result || result.length > 0) {
//           update = [];
//         } else {
//           update.push(result);
//         }
//       } catch (error) {
//         console.error(`Error updating status for ID ${item.id}:`, error);
//       }
//     }
//   }

//   if (update.length === 0) {
//     console.log("No updates were made.");
//   } else {
//     console.log("Success updating the status");
//   }
// };

const getRooms = async (req, res) => {
  try {
    const result = await appModel.getRooms();
    return res.status(200).json(result && result.length > 0 ? result : []);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const cancelSchedule = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Schedule ID is required" });
    }

    const employeeId = req.user.employeeId;

    const update = await db.transact(async (txn) => {
      return await schedModel.cancelSchedule(
        {
          Active: 0,
          UpdatedBy: employeeId,
        },
        {
          id: id,
        },
        txn,
        "DateTimeUpdated",
      );
    });

    if (!update) {
      return res.status(500).json({ error: "Error cancelling schedule" });
    }

    return res.status(204).send(); // Success - No Content
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Internal Server Error" });
  }
};

// const getFirstFreeSlotWithDay = (scheduled, startDate, endDate, section) => {
//   const allSlots = [];
//   for (let hour = 7; hour < 19; hour += 2) {
//     const from = `${hour.toString().padStart(2, "0")}:00`;
//     const to = `${(hour + 2).toString().padStart(2, "0")}:00`;
//     allSlots.push(`${from}-${to}`);
//   }

//   const daysOfWeek = ["M", "T", "W", "TH", "F", "S", "SU"];
//   const freeSlots = {};
//   daysOfWeek.forEach((day) => {
//     freeSlots[day] = [...allSlots];
//   });

//   const targetStart = new Date(startDate);
//   const targetEnd = new Date(endDate);

//   for (const sched of scheduled) {
//     if (!sched.days || !sched.intervals) continue;

//     const schedStart = new Date(sched.fromDate);
//     const schedEnd = new Date(sched.toDate);

//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       const days = sched.days.split(",").map((d) => d.trim().toUpperCase());
//       const interval = sched.intervals.trim();

//       days.forEach((day) => {
//         if (freeSlots[day]) {
//           freeSlots[day] = freeSlots[day].filter((slot) => slot !== interval);
//         }
//       });
//     }
//   }

//   const priorityDays = ["S", "M", "F"];
//   for (const day of priorityDays) {
//     if (freeSlots[day] && freeSlots[day].length > 0) {
//       return {
//         day,
//         interval: freeSlots[day][0],
//       };
//     }
//   }

//   return null;
// };

// const getFirstFreeSlotWithDay = (scheduled, startDate, endDate, section) => {
//   const allSlots = [];
//   for (let hour = 7; hour < 19; hour += 2) {
//     const from = `${hour.toString().padStart(2, "0")}:00`;
//     const to = `${(hour + 2).toString().padStart(2, "0")}:00`;
//     allSlots.push(`${from}-${to}`);
//   }

//   const daysOfWeek = ["M", "T", "W", "TH", "F", "S", "SU"];
//   const freeSlots = {};
//   const sectionSchedules = {};

//   daysOfWeek.forEach((day) => {
//     freeSlots[day] = [...allSlots];
//     sectionSchedules[day] = [];
//   });

//   const targetStart = new Date(startDate);
//   const targetEnd = new Date(endDate);

//   for (const sched of scheduled) {
//     if (!sched.days || !sched.intervals) continue;

//     const schedStart = new Date(sched.fromDate);
//     const schedEnd = new Date(sched.toDate);
//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       const days = sched.days.split(",").map((d) => d.trim().toUpperCase());
//       const interval = sched.intervals.trim();

//       days.forEach((day) => {
//         if (freeSlots[day]) {
//           freeSlots[day] = freeSlots[day].filter((slot) => slot !== interval);

//           if (sched.section === section) {
//             sectionSchedules[day].push(interval);
//           }
//         }
//       });
//     }
//   }

//   const needsBreakAfterMorning = (daySchedules) => {
//     return daySchedules.some((interval) => {
//       const endTime = interval.split("-")[1];
//       const endHour = parseInt(endTime.split(":")[0]);
//       return endHour === 11 || endHour === 12;
//     });
//   };

//   const getBearingTimeEnd = (daySchedules) => {
//     const bearingSchedules = daySchedules.filter((interval) => {
//       const endHour = parseInt(interval.split("-")[1].split(":")[0]);
//       return endHour === 11 || endHour === 12;
//     });

//     if (bearingSchedules.length === 0) return null;

//     const latestBearingEnd = Math.max(
//       ...bearingSchedules.map((interval) =>
//         parseInt(interval.split("-")[1].split(":")[0]),
//       ),
//     );

//     return latestBearingEnd;
//   };

//   const getAfternoonSlot = (day) => {
//     const dayScheds = sectionSchedules[day];

//     if (needsBreakAfterMorning(dayScheds)) {
//       const bearingEndHour = getBearingTimeEnd(dayScheds);

//       const nextSlotStartHour = bearingEndHour + 1;

//       const availableAfterBreak = freeSlots[day].filter((slot) => {
//         const startHour = parseInt(slot.split(":")[0]);
//         return startHour >= nextSlotStartHour;
//       });

//       if (availableAfterBreak.length > 0) {
//         return availableAfterBreak[0];
//       }
//     }

//     return null;
//   };

//   const priorityDays = ["S", "M", "F"];

//   for (const day of priorityDays) {
//     if (sectionSchedules[day] && sectionSchedules[day].length > 0) {
//       const afternoonSlot = getAfternoonSlot(day);
//       if (afternoonSlot) {
//         return {
//           day,
//           interval: afternoonSlot,
//           note: `Scheduled after 1-hour break (section had schedule ending at ${getBearingTimeEnd(sectionSchedules[day])}:00)`,
//         };
//       }
//     }
//   }

//   for (const day of priorityDays) {
//     if (freeSlots[day] && freeSlots[day].length > 0) {
//       return {
//         day,
//         interval: freeSlots[day][0],
//       };
//     }
//   }

//   return null;
// };

// const getFreeIntervalTimeSlot = async (
//   scheduled,
//   startDate,
//   endDate,
//   section,
//   hours,
// ) => {
//   const allSlots = [];

//   // Generate slots dynamically based on required hours
//   for (let hour = 7; hour < 19; hour += hours) {
//     const from = `${hour.toString().padStart(2, "0")}:00`;
//     const to = `${(hour + hours).toString().padStart(2, "0")}:00`;

//     // Only add slot if it doesn't exceed 19:00
//     if (hour + hours <= 19) {
//       allSlots.push(`${from}-${to}`);
//     }
//   }

//   const daysOfWeek = ["M", "T", "W", "TH", "F", "S"];
//   const freeSlots = {};
//   const sectionSchedules = {};

//   for (const day of daysOfWeek) {
//     freeSlots[day] = [...allSlots];
//     sectionSchedules[day] = [];
//   }

//   const targetStart = new Date(startDate);
//   const targetEnd = new Date(endDate);

//   // First, get ALL existing schedules for this specific section across all rooms
//   const existingSectionSchedules = await schedModel.getSectionSchedule(section);

//   // Process each existing section schedule and extract day-specific intervals
//   for (const sectionSched of existingSectionSchedules) {
//     if (!sectionSched.days || !sectionSched.intervals) continue;

//     const schedStart = new Date(sectionSched.fromDate);
//     const schedEnd = new Date(sectionSched.toDate);
//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       // Handle multiple days in a single record (e.g., "M,W,F" or "M" or "M,W")
//       const days = sectionSched.days
//         .split(",")
//         .map((d) => d.trim().toUpperCase());
//       const interval = sectionSched.intervals.trim();

//       for (const day of days) {
//         if (sectionSchedules[day]) {
//           // Track section schedules for each specific day
//           sectionSchedules[day].push(interval);
//         }
//       }
//     }
//   }

//   const hasTimeOverlap = (slot1, slot2) => {
//     const slot1Start = parseInt(slot1.split("-")[0].split(":")[0]);
//     const slot1End = parseInt(slot1.split("-")[1].split(":")[0]);
//     const slot2Start = parseInt(slot2.split("-")[0].split(":")[0]);
//     const slot2End = parseInt(slot2.split("-")[1].split(":")[0]);

//     // Check if there's any overlap
//     return slot1Start < slot2End && slot1End > slot2Start;
//   };

//   // Check if classes are consecutive (no gap between end time of one and start time of next)
//   const hasConsecutiveClasses = (daySchedules) => {
//     if (daySchedules.length < 2) return false;

//     // Sort schedules by start time
//     const sortedSchedules = daySchedules.sort((a, b) => {
//       const aStart = parseInt(a.split("-")[0].split(":")[0]);
//       const bStart = parseInt(b.split("-")[0].split(":")[0]);
//       return aStart - bStart;
//     });

//     // Check if any two classes are consecutive (end time of one = start time of next)
//     for (let i = 0; i < sortedSchedules.length - 1; i++) {
//       const currentEnd = parseInt(
//         sortedSchedules[i].split("-")[1].split(":")[0],
//       );
//       const nextStart = parseInt(
//         sortedSchedules[i + 1].split("-")[0].split(":")[0],
//       );

//       // Classes are consecutive if end time equals start time
//       if (currentEnd === nextStart) {
//         return true;
//       }
//     }

//     return false;
//   };

//   const getLastClassEndTime = (daySchedules) => {
//     if (daySchedules.length === 0) return null;

//     // Get the latest end time from all classes that day
//     const latestEndHour = Math.max(
//       ...daySchedules.map((interval) =>
//         parseInt(interval.split("-")[1].split(":")[0]),
//       ),
//     );

//     return latestEndHour;
//   };

//   // Get slots that respect the 1-hour break rule
//   const getSlotsWithBreak = (day) => {
//     const dayScheds = sectionSchedules[day];

//     if (!dayScheds || dayScheds.length === 0) {
//       return freeSlots[day]; // Return all available slots if no existing classes
//     }

//     if (hasConsecutiveClasses(dayScheds)) {
//       // Section already has 2 consecutive classes, so they need 1-hour break
//       const lastClassEndHour = getLastClassEndTime(dayScheds);

//       // Only allow slots that start at least 1 hour after the last class ends
//       // AND can fit within the 19:00 room limit
//       return freeSlots[day].filter((slot) => {
//         const slotStartHour = parseInt(slot.split("-")[0].split(":")[0]);
//         const slotEndHour = parseInt(slot.split("-")[1].split(":")[0]);

//         // Must start at least 1 hour after last class AND end by 19:00
//         return slotStartHour >= lastClassEndHour + 1 && slotEndHour <= 19;
//       });
//     }

//     // If no consecutive classes exist yet, make sure new slot won't create consecutive classes
//     return freeSlots[day].filter((slot) => {
//       const slotStart = parseInt(slot.split("-")[0].split(":")[0]);
//       const slotEnd = parseInt(slot.split("-")[1].split(":")[0]);

//       // Check if this slot would be consecutive with any existing class
//       for (const existingInterval of dayScheds) {
//         const existingStart = parseInt(
//           existingInterval.split("-")[0].split(":")[0],
//         );
//         const existingEnd = parseInt(
//           existingInterval.split("-")[1].split(":")[0],
//         );

//         // Check if new slot would be consecutive (end time = start time or start time = end time)
//         if (slotEnd === existingStart || existingEnd === slotStart) {
//           return false; // This would create consecutive classes
//         }
//       }

//       return true; // This slot maintains proper breaks
//     });
//   };

//   // Remove conflicting slots for each day based on existing schedules
//   for (const day of daysOfWeek) {
//     // Remove slots that conflict with existing section schedules
//     if (sectionSchedules[day].length > 0) {
//       for (const interval of sectionSchedules[day]) {
//         freeSlots[day] = freeSlots[day].filter((slot) => {
//           return slot !== interval && !hasTimeOverlap(slot, interval);
//         });
//       }
//     }
//   }

//   // Then process room-specific schedules (for room availability)
//   for (const sched of scheduled) {
//     if (!sched.days || !sched.intervals) continue;

//     const schedStart = new Date(sched.fromDate);
//     const schedEnd = new Date(sched.toDate);
//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       const days = sched.days.split(",").map((d) => d.trim().toUpperCase());
//       const interval = sched.intervals.trim();

//       for (const day of days) {
//         if (freeSlots[day]) {
//           // Remove occupied room slots
//           freeSlots[day] = freeSlots[day].filter((slot) => {
//             return slot !== interval && !hasTimeOverlap(slot, interval);
//           });
//         }
//       }
//     }
//   }

//   const priorityDays = ["S", "M", "F"];

//   // Find available slots considering break requirements
//   for (const day of priorityDays) {
//     const availableSlots = getSlotsWithBreak(day);

//     if (availableSlots && availableSlots.length > 0) {
//       return {
//         day,
//         interval: availableSlots[0],
//       };
//     }
//   }

//   // Check other days if priority days don't have suitable slots (excluding Sunday)
//   const otherDays = ["T", "W", "TH"]; // Only weekdays, no Sunday
//   for (const day of otherDays) {
//     const availableSlots = getSlotsWithBreak(day);

//     if (availableSlots && availableSlots.length > 0) {
//       return {
//         day,
//         interval: availableSlots[0],
//       };
//     }
//   }

//   return null;
// };

// const scheduleGenEdSubjectAutomated = async (req, res) => {
//   const genEdSched = await schedModel.getGenEdSched();
//   const employeeCode = "8958";
//   const capacityNeeded = 40;

//   // const genEdSched = [
//   //   {
//   //     semester: "20251",
//   //     subjectCode: "BCHEM",
//   //     section: "N1A",
//   //     limit: "40",
//   //     subjectOfferedTo: "N",
//   //     yearLevel: "1",
//   //     roomTypeCodes: "UEM",
//   //     intervals: "08:00-11:00",
//   //     days: "T",
//   //   },
//   // ];

//   for (const sched of genEdSched) {
//     const {
//       semester,
//       subjectCode,
//       section,
//       limit,
//       intervals,
//       days,
//       subjectOfferedTo,
//       yearLevel,
//       roomTypeCodes,
//       hours,
//     } = sched;

//     const getSchedule = await schedModel.getSchedule(
//       semester,
//       subjectOfferedTo,
//       yearLevel,
//     );

//     const getRoomNeeded = await schedModel.getRoomsApplicable(
//       capacityNeeded,
//       roomTypeCodes,
//     );

//     // const startDate = new Date(getSchedule[0].startOfClasses)
//     //   .toISOString()
//     //   .slice(0, 10);
//     // const endDate = new Date(getSchedule[0].endOfClasses)
//     //   .toISOString()
//     //   .slice(0, 10);

//     const startDate = getSchedule[0].startOfClasses;
//     const endDate = getSchedule[0].endOfClasses;

//     let inserted = false;
//     let newInterval;

//     for (const room of getRoomNeeded) {
//       if (room.roomId === "377" || room.roomId === "376") {
//         newInterval = {
//           roomId: room.roomId,
//           fromDate: startDate,
//           toDate: endDate,
//           days: days,
//           subjectCode: subjectCode,
//           section: section,
//           professor: null,
//           intervals: intervals,
//           remarks: "Automated GE Schedule",
//           departmentCode: null,
//           Active: 1,
//         };

//         await insertedRoomFunction(newInterval, employeeCode);
//         inserted = true;
//         break;
//       }

//       const roomIds = room.roomId
//         .split(",")
//         .map((id) => parseInt(id.trim(), 10))
//         .filter((id) => !isNaN(id));

//       for (const roomId of roomIds) {
//         let isRoomAvailable = true;
//         const scheduled = await scheduleFunction(roomId);

//         if (scheduled.length === 0) {
//           newInterval = {
//             roomId: roomId,
//             fromDate: startDate,
//             toDate: endDate,
//             days: "S",
//             subjectCode: subjectCode,
//             section: section,
//             professor: "",
//             intervals: "07:00-09:00",
//             remarks: "Automated GE Schedule",
//             departmentCode: "",
//             Active: 1,
//           };

//           await insertedRoomFunction(newInterval, employeeCode);
//           inserted = true;
//           break; // Exit roomIds loop
//         }

//         const freeTimeSlots = await getFreeIntervalTimeSlot(
//           scheduled,
//           startDate,
//           endDate,
//           section,
//           hours,
//         );

//         if (!freeTimeSlots) {
//           continue;
//         }

//         const { day, interval } = freeTimeSlots;

//         const checkInterval = insertedAndCheckIntervalItem(
//           roomId,
//           getSchedule[0].startOfClasses,
//           getSchedule[0].endOfClasses,
//           day,
//           subjectCode,
//           section,
//           "",
//           interval,
//           "Automated GE Schedule",
//           employeeCode,
//           false,
//         );

//         const intervals1 = intervalsFromSched.checkIntervals(checkInterval);

//         for (const sched of scheduled) {
//           const intervals2 = intervalsFromSched.checkIntervals(sched);

//           if (_intervalsOverlap(intervals1, intervals2)) {
//             isRoomAvailable = false;
//             break;
//           }
//           break;
//         }

//         if (!isRoomAvailable) {
//           continue;
//         }

//         newInterval = {
//           roomId: roomId,
//           fromDate: startDate,
//           toDate: endDate,
//           days: day,
//           subjectCode: subjectCode,
//           section: section,
//           professor: "",
//           intervals: interval,
//           remarks: "Automated GE Schedule",
//           departmentCode: "",
//           Active: 1,
//         };

//         await insertedRoomFunction(newInterval, employeeCode);
//         inserted = true;
//         break;
//       }

//       if (inserted) break;
//     }

//     if (!inserted) {
//       return res.status(409).json({
//         body: "Cannot book the schedule, All time slot is fully booked.",
//       });
//     }
//   }

//   return res.status(200).json({ body: "Scheduled successfully" });
// };

// This one is working
// const getFreeIntervalTimeSlotForDay = async (
//   scheduled,
//   startDate,
//   endDate,
//   section,
//   hours,
//   targetDay,
// ) => {
//   const allSlots = [];

//   // Generate slots dynamically based on required hours
//   for (let hour = 7; hour < 19; hour += hours) {
//     const from = `${hour.toString().padStart(2, "0")}:00`;
//     const to = `${(hour + hours).toString().padStart(2, "0")}:00`;

//     // Only add slot if it doesn't exceed 19:00
//     if (hour + hours <= 19) {
//       allSlots.push(`${from}-${to}`);
//     }
//   }

//   const freeSlots = [...allSlots];
//   const sectionSchedules = [];

//   const targetStart = new Date(startDate);
//   const targetEnd = new Date(endDate);

//   // Get ALL existing schedules for this specific section across all rooms
//   const existingSectionSchedules = await schedModel.getSectionSchedule(section);

//   // Process each existing section schedule and extract day-specific intervals
//   for (const sectionSched of existingSectionSchedules) {
//     if (!sectionSched.days || !sectionSched.intervals) continue;

//     const schedStart = new Date(sectionSched.fromDate);
//     const schedEnd = new Date(sectionSched.toDate);
//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       // Handle multiple days in a single record (e.g., "M,W,F" or "M" or "M,W")
//       const days = sectionSched.days
//         .split(",")
//         .map((d) => d.trim().toUpperCase());
//       const interval = sectionSched.intervals.trim();

//       // Only consider schedules for the target day
//       if (days.includes(targetDay)) {
//         sectionSchedules.push(interval);
//       }
//     }
//   }

//   const hasTimeOverlap = (slot1, slot2) => {
//     const slot1Start = parseInt(slot1.split("-")[0].split(":")[0]);
//     const slot1End = parseInt(slot1.split("-")[1].split(":")[0]);
//     const slot2Start = parseInt(slot2.split("-")[0].split(":")[0]);
//     const slot2End = parseInt(slot2.split("-")[1].split(":")[0]);

//     // Check if there's any overlap
//     return slot1Start < slot2End && slot1End > slot2Start;
//   };

//   // Check if classes are consecutive (no gap between end time of one and start time of next)
//   const hasConsecutiveClasses = (daySchedules) => {
//     if (daySchedules.length < 2) return false;

//     // Sort schedules by start time
//     const sortedSchedules = daySchedules.sort((a, b) => {
//       const aStart = parseInt(a.split("-")[0].split(":")[0]);
//       const bStart = parseInt(b.split("-")[0].split(":")[0]);
//       return aStart - bStart;
//     });

//     // Check if any two classes are consecutive (end time of one = start time of next)
//     for (let i = 0; i < sortedSchedules.length - 1; i++) {
//       const currentEnd = parseInt(
//         sortedSchedules[i].split("-")[1].split(":")[0],
//       );
//       const nextStart = parseInt(
//         sortedSchedules[i + 1].split("-")[0].split(":")[0],
//       );

//       // Classes are consecutive if end time equals start time
//       if (currentEnd === nextStart) {
//         return true;
//       }
//     }

//     return false;
//   };

//   const getLastClassEndTime = (daySchedules) => {
//     if (daySchedules.length === 0) return null;

//     // Get the latest end time from all classes that day
//     const latestEndHour = Math.max(
//       ...daySchedules.map((interval) =>
//         parseInt(interval.split("-")[1].split(":")[0]),
//       ),
//     );

//     return latestEndHour;
//   };

//   // Get slots that respect the 1-hour break rule
//   const getSlotsWithBreak = () => {
//     if (!sectionSchedules || sectionSchedules.length === 0) {
//       return freeSlots; // Return all available slots if no existing classes
//     }

//     if (hasConsecutiveClasses(sectionSchedules)) {
//       // Section already has 2 consecutive classes, so they need 1-hour break
//       const lastClassEndHour = getLastClassEndTime(sectionSchedules);

//       // Only allow slots that start at least 1 hour after the last class ends
//       // AND can fit within the 19:00 room limit
//       return freeSlots.filter((slot) => {
//         const slotStartHour = parseInt(slot.split("-")[0].split(":")[0]);
//         const slotEndHour = parseInt(slot.split("-")[1].split(":")[0]);

//         // Must start at least 1 hour after last class AND end by 19:00
//         return slotStartHour >= lastClassEndHour + 1 && slotEndHour <= 19;
//       });
//     }

//     // If no consecutive classes exist yet, make sure new slot won't create consecutive classes
//     return freeSlots.filter((slot) => {
//       const slotStart = parseInt(slot.split("-")[0].split(":")[0]);
//       const slotEnd = parseInt(slot.split("-")[1].split(":")[0]);

//       // Check if this slot would be consecutive with any existing class
//       for (const existingInterval of sectionSchedules) {
//         const existingStart = parseInt(
//           existingInterval.split("-")[0].split(":")[0],
//         );
//         const existingEnd = parseInt(
//           existingInterval.split("-")[1].split(":")[0],
//         );

//         // Check if new slot would be consecutive (end time = start time or start time = end time)
//         if (slotEnd === existingStart || existingEnd === slotStart) {
//           return false; // This would create consecutive classes
//         }
//       }

//       return true; // This slot maintains proper breaks
//     });
//   };

//   let availableSlots = [...freeSlots];

//   // Remove slots that conflict with existing section schedules for target day
//   if (sectionSchedules.length > 0) {
//     for (const interval of sectionSchedules) {
//       availableSlots = availableSlots.filter((slot) => {
//         return slot !== interval && !hasTimeOverlap(slot, interval);
//       });
//     }
//   }

//   // Then process room-specific schedules (for room availability) for target day only
//   for (const sched of scheduled) {
//     if (!sched.days || !sched.intervals) continue;

//     const schedStart = new Date(sched.fromDate);
//     const schedEnd = new Date(sched.toDate);
//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       const days = sched.days.split(",").map((d) => d.trim().toUpperCase());
//       const interval = sched.intervals.trim();

//       // Only consider schedules for the target day
//       if (days.includes(targetDay)) {
//         // Remove occupied room slots
//         availableSlots = availableSlots.filter((slot) => {
//           return slot !== interval && !hasTimeOverlap(slot, interval);
//         });
//       }
//     }
//   }

//   // Apply break requirements
//   const finalAvailableSlots = getSlotsWithBreak().filter((slot) =>
//     availableSlots.includes(slot),
//   );

//   return finalAvailableSlots;
// };

// // NEW: Faculty management functions
// const calculateFacultyNeeded = (sections) => {
//   const subjectCounts = {};
//   const facultyAssignments = {};

//   // Count sections by subject code
//   for (const section of sections) {
//     const subjectCode = section.subjectCode.toUpperCase();
//     if (!subjectCounts[subjectCode]) {
//       subjectCounts[subjectCode] = 0;
//     }
//     subjectCounts[subjectCode]++;
//   }

//   // Calculate faculty needed: (sections × 3) ÷ 21
//   for (const [subjectCode, sectionCount] of Object.entries(subjectCounts)) {
//     const facultyNeeded = Math.ceil((sectionCount * 3) / 21);
//     facultyAssignments[subjectCode] = [];

//     // Create named faculty
//     for (let i = 1; i <= facultyNeeded; i++) {
//       const facultyName = `faculty${subjectCode.toLowerCase()}${i}`;
//       facultyAssignments[subjectCode].push({
//         name: facultyName,
//         schedule: [], // Will store their scheduled classes
//         workload: 0,
//       });
//     }
//   }

//   console.log("Faculty assignments calculated:", facultyAssignments);
//   return facultyAssignments;
// };

// const checkFacultyConflict = (
//   facultySchedule,
//   targetDay,
//   timeSlot,
//   startDate,
//   endDate,
// ) => {
//   for (const existingClass of facultySchedule) {
//     // Check date overlap
//     const existingStart = new Date(existingClass.fromDate);
//     const existingEnd = new Date(existingClass.toDate);
//     const targetStart = new Date(startDate);
//     const targetEnd = new Date(endDate);

//     if (existingStart <= targetEnd && existingEnd >= targetStart) {
//       // Check day overlap
//       const existingDays = existingClass.days
//         .split(",")
//         .map((d) => d.trim().toUpperCase());
//       if (existingDays.includes(targetDay)) {
//         // Check time overlap
//         const hasTimeOverlap = (slot1, slot2) => {
//           const slot1Start = parseInt(slot1.split("-")[0].split(":")[0]);
//           const slot1End = parseInt(slot1.split("-")[1].split(":")[0]);
//           const slot2Start = parseInt(slot2.split("-")[0].split(":")[0]);
//           const slot2End = parseInt(slot2.split("-")[1].split(":")[0]);
//           return slot1Start < slot2End && slot1End > slot2Start;
//         };

//         if (hasTimeOverlap(existingClass.intervals, timeSlot)) {
//           return true; // Conflict found
//         }
//       }
//     }
//   }
//   return false; // No conflict
// };

// const assignFacultyToSection = (
//   facultyAssignments,
//   subjectCode,
//   sectionData,
// ) => {
//   const availableFaculty = facultyAssignments[subjectCode];
//   if (!availableFaculty || availableFaculty.length === 0) {
//     return null;
//   }

//   // Find faculty with no conflict and lowest workload
//   let assignedFaculty = null;
//   let minWorkload = Infinity;

//   for (const faculty of availableFaculty) {
//     const hasConflict = checkFacultyConflict(
//       faculty.schedule,
//       sectionData.targetDay,
//       sectionData.timeSlot,
//       sectionData.startDate,
//       sectionData.endDate,
//     );

//     if (!hasConflict && faculty.workload < minWorkload) {
//       assignedFaculty = faculty;
//       minWorkload = faculty.workload;
//     }
//   }

//   if (assignedFaculty) {
//     // Add this class to faculty's schedule
//     assignedFaculty.schedule.push({
//       fromDate: sectionData.startDate,
//       toDate: sectionData.endDate,
//       days: sectionData.targetDay,
//       intervals: sectionData.timeSlot,
//       section: sectionData.section,
//       subjectCode: subjectCode,
//     });
//     assignedFaculty.workload++;
//   }

//   return assignedFaculty;
// };

// const scheduleInPhysicalRoom = async (roomIds, newInterval, employeeCode) => {
//   // Schedule in all room IDs that represent the same physical room
//   for (const roomId of roomIds) {
//     const intervalForRoom = {
//       ...newInterval,
//       roomId: roomId,
//     };
//     await insertedRoomFunction(intervalForRoom, employeeCode);
//   }
// };

// const getAllAvailableSlotsForRoom = async (
//   room,
//   targetDay,
//   startDate,
//   endDate,
//   section,
//   hours,
// ) => {
//   // Special rooms - only check conflicts, don't schedule
//   if (["377", "376", "378", "368"].includes(room.roomId)) {
//     const roomScheduled = await scheduleFunction(room.roomId);
//     const availableSlots = await getFreeIntervalTimeSlotForDay(
//       roomScheduled,
//       startDate,
//       endDate,
//       section,
//       hours,
//       targetDay,
//     );
//     return availableSlots || [];
//   } else {
//     const roomIds = room.roomId
//       .split(",")
//       .map((id) => parseInt(id.trim(), 10))
//       .filter((id) => !isNaN(id));

//     const firstRoomId = roomIds[0];
//     const scheduled = await scheduleFunction(firstRoomId);

//     const availableSlots = await getFreeIntervalTimeSlotForDay(
//       scheduled,
//       startDate,
//       endDate,
//       section,
//       hours,
//       targetDay,
//     );

//     return availableSlots || [];
//   }
// };

// // Room restriction configurations
// const restrictedWeekdayRooms = [
//   "366", // Only in restricted, not in noWeekday
//   "339",
//   "340",
//   "341",
//   "342",
//   "230",
//   "231",
//   "380",
//   "379",
//   "306",
//   "239",
//   "280",
//   "281",
//   "282",
//   "283",
//   "243",
//   "354",
//   "355",
//   "361",
//   "364",
//   "365",
//   "335",
//   "336",
//   "337",
//   "338",
//   "327",
//   "328",
//   // These are moved to noWeekdayRooms since they completely cannot schedule on weekdays
// ];

// // Rooms that CANNOT schedule on weekdays at all (weekends only)
// const noWeekdayRooms = [
//   "247",
//   "246",
//   "248",
//   "249",
//   "250",
//   "350",
//   "255",
//   "256",
//   "258",
//   "257",
//   "268",
//   "267",
//   "309",
//   "310",
//   "381",
//   "313",
//   "314",
//   "315",
//   "382",
//   "358",
//   "360",
//   "229",
// ];

// const isRoomAvailableForDayAndTime = (roomId, targetDay, timeSlot) => {
//   const weekdays = ["M", "T", "W", "TH", "F"];
//   const isWeekday = weekdays.includes(targetDay);

//   // Check if room cannot schedule on weekdays at all
//   if (noWeekdayRooms.includes(roomId) && isWeekday) {
//     return false;
//   }

//   // Check restricted weekday rooms (only 5-7 PM on weekdays)
//   if (restrictedWeekdayRooms.includes(roomId) && isWeekday) {
//     const startHour = parseInt(timeSlot.split("-")[0].split(":")[0]);
//     const endHour = parseInt(timeSlot.split("-")[1].split(":")[0]);

//     // Only allow 17:00-19:00 (5 PM - 7 PM) on weekdays
//     if (startHour < 17 || endHour > 19) {
//       return false;
//     }
//   }

//   return true;
// };

// const getSectionAllowedDays = (section) => {
//   const sectionUpper = section.toUpperCase();

//   // N4 sections: Cannot schedule Monday to Friday
//   if (sectionUpper.includes("N4")) {
//     return ["S"]; // Only Saturday allowed
//   }

//   // N2D to N2G: Cannot schedule Monday to Wednesday
//   if (sectionUpper.match(/N2[D-G]/)) {
//     return ["TH", "F", "S"]; // Thursday, Friday, Saturday allowed
//   }

//   // N2A to N2C: Cannot schedule Thursday and Saturday
//   if (
//     sectionUpper.match(/N2[A-C]/) ||
//     (sectionUpper.includes("N2") && !sectionUpper.match(/N2[D-G]/))
//   ) {
//     return ["M", "T", "W", "F"]; // Monday, Tuesday, Wednesday, Friday allowed
//   }

//   // Default: all days allowed
//   return ["M", "T", "W", "TH", "F", "S"];
// };

// const isRoomAvailableForSlot = async (
//   room,
//   targetDay,
//   timeSlot,
//   startDate,
//   endDate,
//   section,
//   hours,
// ) => {
//   // Handle special rooms - check conflicts only
//   if (["377", "376", "378", "368"].includes(room.roomId)) {
//     const roomScheduled = await scheduleFunction(room.roomId);

//     for (const existingSched of roomScheduled) {
//       if (!existingSched.days || !existingSched.intervals) continue;

//       const schedStart = new Date(existingSched.fromDate);
//       const schedEnd = new Date(existingSched.toDate);
//       const targetStart = new Date(startDate);
//       const targetEnd = new Date(endDate);

//       if (schedStart <= targetEnd && schedEnd >= targetStart) {
//         const existingDays = existingSched.days
//           .split(",")
//           .map((d) => d.trim().toUpperCase());
//         if (
//           existingDays.includes(targetDay) &&
//           existingSched.intervals === timeSlot
//         ) {
//           return false;
//         }
//       }
//     }
//     return true;
//   } else {
//     // Handle regular rooms (comma-delimited rooms are one physical room)
//     const roomIds = room.roomId
//       .split(",")
//       .map((id) => parseInt(id.trim(), 10))
//       .filter((id) => !isNaN(id));

//     // Check if specific time slot is available across all room IDs
//     for (const roomId of roomIds) {
//       const roomScheduled = await scheduleFunction(roomId);

//       const checkInterval = insertedAndCheckIntervalItem(
//         roomId,
//         startDate,
//         endDate,
//         targetDay,
//         "",
//         section,
//         "",
//         timeSlot,
//         "Automated GE Schedule",
//         "8958",
//         false,
//       );

//       const intervals1 = intervalsFromSched.checkIntervals(checkInterval);

//       for (const existingSched of roomScheduled) {
//         const intervals2 = intervalsFromSched.checkIntervals(existingSched);

//         if (_intervalsOverlap(intervals1, intervals2)) {
//           return false;
//         }
//       }
//     }

//     return true;
//   }
// };

// const scheduleGenEdSubjectAutomated = async (req, res) => {
//   const genEdSched = await schedModel.getGenEdSched();
//   const employeeCode = "8958";
//   const capacityNeeded = 40;

//   // Calculate faculty needed for all subjects
//   const facultyAssignments = calculateFacultyNeeded(genEdSched);

//   // Enhanced day priority order
//   const dayPriorityOrder = [
//     ["S"], // Saturday first
//     ["M", "F"], // Monday and Friday
//     ["T", "W", "TH"], // Tuesday, Wednesday, Thursday
//   ];

//   // STRICT PRIORITY CATEGORIZATION - Process by exact priority order
//   const n4Sections = genEdSched.filter((sched) =>
//     sched.section.toUpperCase().includes("N4"),
//   );

//   const pathfitSections = genEdSched.filter(
//     (sched) =>
//       sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/) &&
//       !sched.section.toUpperCase().includes("N4"),
//   );

//   const nstpSections = genEdSched.filter(
//     (sched) =>
//       sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.section.toUpperCase().includes("N4"),
//   );

//   const n2dToN2gSections = genEdSched.filter(
//     (sched) =>
//       sched.section.toUpperCase().match(/N2[D-G]/) &&
//       !sched.section.toUpperCase().includes("N4") &&
//       !sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/),
//   );

//   const n2aToN2cSections = genEdSched.filter(
//     (sched) =>
//       (sched.section.toUpperCase().match(/N2[A-C]/) ||
//         (sched.section.toUpperCase().includes("N2") &&
//           !sched.section.toUpperCase().match(/N2[D-G]/))) &&
//       !sched.section.toUpperCase().includes("N4") &&
//       !sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/),
//   );

//   const otherSections = genEdSched.filter(
//     (sched) =>
//       !sched.section.toUpperCase().includes("N4") &&
//       !sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.section.toUpperCase().match(/N2[A-G]/) &&
//       !sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/),
//   );

//   // ABSOLUTE PRIORITY ORDER - Must complete each group 100% before next
//   const priorityGroups = [
//     { name: "N4", sections: [...n4Sections] },
//     { name: "PATHFIT", sections: [...pathfitSections] },
//     { name: "NSTP", sections: [...nstpSections] },
//     { name: "N2D-N2G", sections: [...n2dToN2gSections] },
//     { name: "N2A-N2C", sections: [...n2aToN2cSections] },
//     { name: "Others", sections: [...otherSections] },
//   ];

//   const scheduledSections = [];

//   console.log(`\n=== AGGRESSIVE SCHEDULING MODE ===`);
//   console.log(
//     `🎯 GOAL: Schedule ALL ${genEdSched.length} sections using ALL available rooms`,
//   );

//   // Verify categorization and log room availability
//   let totalCategorized = 0;
//   for (const group of priorityGroups) {
//     console.log(`${group.name}: ${group.sections.length} sections`);
//     totalCategorized += group.sections.length;
//   }

//   if (totalCategorized !== genEdSched.length) {
//     console.log(
//       `⚠️  CATEGORIZATION ERROR: ${totalCategorized} vs ${genEdSched.length}`,
//     );
//     return res.status(500).json({ body: "Categorization error detected" });
//   }

//   // Get comprehensive room inventory
//   const getAllRooms = async () => {
//     const standardRooms = await schedModel.getRoomsApplicable(
//       capacityNeeded,
//       "",
//     );
//     console.log(`📍 Total rooms available: ${standardRooms.length}`);

//     // Log room types for debugging
//     const gymRooms = standardRooms.filter((room) =>
//       ["378", "368"].includes(room.roomId),
//     );
//     const specialRooms = standardRooms.filter((room) =>
//       ["377", "376", "378", "368"].includes(room.roomId),
//     );
//     const regularRooms = standardRooms.filter(
//       (room) => !["377", "376", "378", "368"].includes(room.roomId),
//     );

//     console.log(
//       `   - Gym rooms: ${gymRooms.length} (${gymRooms.map((r) => r.roomId).join(", ")})`,
//     );
//     console.log(
//       `   - Special rooms: ${specialRooms.length} (${specialRooms.map((r) => r.roomId).join(", ")})`,
//     );
//     console.log(`   - Regular rooms: ${regularRooms.length}`);

//     return standardRooms;
//   };

//   const allAvailableRooms = await getAllRooms();

//   // ENHANCED SCHEDULING FUNCTION - More aggressive approach
//   // ENHANCED SCHEDULING FUNCTION - With weekend room prioritization
//   // ENHANCED SCHEDULING FUNCTION - With weekend room prioritization
//   const scheduleSection = async (
//     sched,
//     priorityGroupName,
//     targetDay,
//     forceSchedule = false,
//   ) => {
//     const {
//       semester,
//       subjectCode,
//       section,
//       limit,
//       intervals,
//       days,
//       subjectOfferedTo,
//       yearLevel,
//       roomTypeCodes,
//       hours,
//     } = sched;

//     // Check allowed days
//     const allowedDays = getSectionAllowedDays(section);
//     if (!allowedDays.includes(targetDay)) {
//       return { success: false, reason: `Not allowed on ${targetDay}` };
//     }

//     const getSchedule = await schedModel.getSchedule(
//       semester,
//       subjectOfferedTo,
//       yearLevel,
//     );
//     const startDate = getSchedule[0].startOfClasses;
//     const endDate = getSchedule[0].endOfClasses;

//     // Check if target day is weekend
//     const isWeekend = targetDay === "S"; // Saturday is weekend in your context
//     const weekdays = ["M", "T", "W", "TH", "F"];
//     const isWeekday = weekdays.includes(targetDay);

//     // Determine which rooms this section can use with weekend prioritization
//     let applicableRooms = [...allAvailableRooms];

//     // WEEKEND ROOM PRIORITIZATION LOGIC
//     if (isWeekend) {
//       console.log(
//         `   🏖️  Weekend detected (${targetDay}) - Prioritizing weekend-only rooms first`,
//       );

//       // For PATHFIT: ONLY gym rooms (368, 378) are allowed
//       if (priorityGroupName === "PATHFIT") {
//         const gymRooms = allAvailableRooms.filter((room) =>
//           ["378", "368"].includes(room.roomId),
//         );

//         if (gymRooms.length === 0) {
//           return {
//             success: false,
//             reason: "No gym rooms available for PATHFIT",
//           };
//         }

//         applicableRooms = gymRooms;
//         console.log(
//           `   🏋️  PATHFIT restricted to gym rooms only: ${gymRooms.length} available`,
//         );
//       } else {
//         // For NON-PATHFIT subjects on weekends: prioritize weekend-only rooms, exclude all special rooms
//         const weekendOnlyRooms = allAvailableRooms.filter((room) => {
//           const roomIds = room.roomId.split(",").map((id) => id.trim());
//           const hasWeekendOnlyRoom = roomIds.some((roomId) =>
//             noWeekdayRooms.includes(roomId),
//           );
//           const isSpecialRoom = ["377", "376", "378", "368"].includes(
//             room.roomId,
//           );

//           // Must have weekend-only rooms AND not be special rooms
//           return hasWeekendOnlyRoom && !isSpecialRoom;
//         });

//         // Regular rooms that can work on weekends (exclude special rooms)
//         const regularRoomsForWeekend = allAvailableRooms.filter((room) => {
//           const roomIds = room.roomId.split(",").map((id) => id.trim());
//           const hasWeekendOnlyRoom = roomIds.some((roomId) =>
//             noWeekdayRooms.includes(roomId),
//           );
//           const isSpecialRoom = ["377", "376", "378", "368"].includes(
//             room.roomId,
//           );

//           // Regular rooms that are NOT weekend-only and NOT special rooms
//           return !hasWeekendOnlyRoom && !isSpecialRoom;
//         });

//         // Prioritize weekend-only rooms first, then regular rooms
//         applicableRooms = [...weekendOnlyRooms, ...regularRoomsForWeekend];

//         console.log(
//           `   📊 Weekend room distribution for non-PATHFIT: Weekend-only: ${weekendOnlyRooms.length}, Regular: ${regularRoomsForWeekend.length}`,
//         );
//       }
//     } else {
//       // WEEKDAY LOGIC
//       if (priorityGroupName === "PATHFIT") {
//         // PATHFIT MUST use gym rooms (368, 378) ONLY
//         const gymRooms = allAvailableRooms.filter((room) =>
//           ["378", "368"].includes(room.roomId),
//         );

//         if (gymRooms.length === 0) {
//           return {
//             success: false,
//             reason: "No gym rooms available for PATHFIT",
//           };
//         }

//         applicableRooms = gymRooms;
//         console.log(
//           `   🏋️  PATHFIT restricted to gym rooms only: ${gymRooms.length} available`,
//         );
//       } else {
//         // For NON-PATHFIT subjects on weekdays
//         if (!forceSchedule) {
//           // Normal scheduling: exclude special rooms (377, 376, 378, 368) and noWeekdayRooms
//           applicableRooms = allAvailableRooms.filter((room) => {
//             const roomIds = room.roomId.split(",").map((id) => id.trim());
//             const hasNoWeekdayRoom = roomIds.some((roomId) =>
//               noWeekdayRooms.includes(roomId),
//             );
//             const isSpecialRoom = ["377", "376", "378", "368"].includes(
//               room.roomId,
//             );

//             return !hasNoWeekdayRoom && !isSpecialRoom;
//           });
//         } else {
//           // Force schedule on weekdays: can use restricted rooms but NEVER noWeekdayRooms or special rooms
//           applicableRooms = allAvailableRooms.filter((room) => {
//             const roomIds = room.roomId.split(",").map((id) => id.trim());
//             const hasNoWeekdayRoom = roomIds.some((roomId) =>
//               noWeekdayRooms.includes(roomId),
//             );
//             const isSpecialRoom = ["377", "376", "378", "368"].includes(
//               room.roomId,
//             );

//             // Still cannot use noWeekdayRooms or special rooms on weekdays, even when forcing
//             return !hasNoWeekdayRoom && !isSpecialRoom;
//           });
//         }
//       }
//     }

//     // Remove duplicates and maintain priority order
//     const uniqueRooms = [];
//     const seenRoomIds = new Set();

//     for (const room of applicableRooms) {
//       if (!seenRoomIds.has(room.roomId)) {
//         seenRoomIds.add(room.roomId);
//         uniqueRooms.push(room);
//       }
//     }

//     applicableRooms = uniqueRooms;

//     console.log(
//       `   🏢 Trying ${applicableRooms.length} rooms for ${section} (${subjectCode}) on ${targetDay}${isWeekend ? " [WEEKEND]" : " [WEEKDAY]"}`,
//     );

//     // Try each applicable room in priority order
//     for (const room of applicableRooms) {
//       // Get all time slots for this room on this day
//       const availableTimeSlots = await getAllAvailableSlotsForRoom(
//         room,
//         targetDay,
//         startDate,
//         endDate,
//         section,
//         hours,
//       );

//       // Try each time slot
//       for (const timeSlot of availableTimeSlots) {
//         const isRoomAvailable = await isRoomAvailableForSlot(
//           room,
//           targetDay,
//           timeSlot,
//           startDate,
//           endDate,
//           section,
//           hours,
//         );

//         if (!isRoomAvailable) continue;

//         // Check room time restrictions (unless forced or weekend)
//         const roomIds = room.roomId.split(",").map((id) => id.trim());
//         let roomTimeRestricted = false;

//         if (!forceSchedule && isWeekday) {
//           roomTimeRestricted = roomIds.some(
//             (roomId) =>
//               !isRoomAvailableForDayAndTime(roomId, targetDay, timeSlot),
//           );
//         }

//         if (roomTimeRestricted) continue;

//         // Check faculty availability
//         const assignedFaculty = assignFacultyToSection(
//           facultyAssignments,
//           subjectCode.toUpperCase(),
//           { targetDay, timeSlot, startDate, endDate, section },
//         );

//         if (!assignedFaculty) continue;

//         // SUCCESS - Schedule the section
//         const isGymRoom = ["378", "368"].includes(room.roomId);
//         let newInterval;

//         // Only gym rooms (368, 378) can be actually scheduled, and only for PATHFIT
//         if (isGymRoom && priorityGroupName === "PATHFIT") {
//           newInterval = {
//             roomId: parseInt(room.roomId),
//             fromDate: startDate,
//             toDate: endDate,
//             days: targetDay,
//             subjectCode: subjectCode,
//             section: section,
//             professor: assignedFaculty.name,
//             intervals: timeSlot,
//             remarks: "Automated GE Schedule",
//             departmentCode: "",
//             Active: 1,
//           };
//           await insertedRoomFunction(newInterval, employeeCode);
//         } else if (!isGymRoom) {
//           // Regular rooms (non-special rooms) scheduling
//           const roomIds = room.roomId
//             .split(",")
//             .map((id) => parseInt(id.trim(), 10))
//             .filter((id) => !isNaN(id));

//           newInterval = {
//             roomId: null,
//             fromDate: startDate,
//             toDate: endDate,
//             days: targetDay,
//             subjectCode: subjectCode,
//             section: section,
//             professor: assignedFaculty.name,
//             intervals: timeSlot,
//             remarks: "Automated GE Schedule",
//             departmentCode: "",
//             Active: 1,
//           };
//           await scheduleInPhysicalRoom(roomIds, newInterval, employeeCode);
//         } else {
//           // This shouldn't happen - gym room for non-PATHFIT subject
//           console.log(
//             `   ⚠️  Warning: Attempted to schedule non-PATHFIT subject ${subjectCode} in gym room ${room.roomId}`,
//           );
//           continue;
//         }

//         // Log success with room type indication
//         const roomType =
//           isWeekend && roomIds.some((id) => noWeekdayRooms.includes(id))
//             ? "[WEEKEND-ONLY]"
//             : isGymRoom && priorityGroupName === "PATHFIT"
//               ? "[GYM-PATHFIT]"
//               : roomIds.some((id) => restrictedWeekdayRooms.includes(id))
//                 ? "[RESTRICTED]"
//                 : "[REGULAR]";

//         console.log(
//           `   ✅ ${section} scheduled on ${targetDay} at ${timeSlot} in room ${room.roomId} ${roomType}`,
//         );

//         return {
//           success: true,
//           scheduledData: {
//             ...sched,
//             scheduledDay: targetDay,
//             scheduledRoom: room.roomId,
//             scheduledTime: timeSlot,
//             assignedFaculty: assignedFaculty.name,
//             roomType: roomType,
//           },
//         };
//       }
//     }

//     return {
//       success: false,
//       reason: "No available room/time/faculty combination",
//     };
//   };

//   // PROCESS EACH PRIORITY GROUP WITH 100% SUCCESS REQUIREMENT
//   for (const priorityGroup of priorityGroups) {
//     if (priorityGroup.sections.length === 0) continue;

//     console.log(
//       `\n🎯 PROCESSING ${priorityGroup.name} - MUST SCHEDULE ALL ${priorityGroup.sections.length} SECTIONS`,
//     );

//     // Phase 1: Normal scheduling following day priorities
//     for (const dayGroup of dayPriorityOrder) {
//       if (priorityGroup.sections.length === 0) break;

//       for (const targetDay of dayGroup) {
//         if (priorityGroup.sections.length === 0) break;

//         console.log(
//           `   📅 ${targetDay}: Attempting ${priorityGroup.sections.length} remaining sections`,
//         );

//         let scheduledThisDay = 0;

//         // Keep trying until no more can be scheduled on this day
//         let madeProgress = true;
//         while (madeProgress && priorityGroup.sections.length > 0) {
//           madeProgress = false;

//           for (let i = priorityGroup.sections.length - 1; i >= 0; i--) {
//             const sched = priorityGroup.sections[i];
//             const result = await scheduleSection(
//               sched,
//               priorityGroup.name,
//               targetDay,
//               false,
//             );

//             if (result.success) {
//               priorityGroup.sections.splice(i, 1);
//               scheduledSections.push(result.scheduledData);
//               scheduledThisDay++;
//               madeProgress = true;

//               console.log(
//                 `   ✅ ${sched.section} scheduled on ${targetDay} at ${result.scheduledData.scheduledTime} in room ${result.scheduledData.scheduledRoom}`,
//               );
//             }
//           }
//         }

//         console.log(
//           `   📅 ${targetDay} completed: ${scheduledThisDay} scheduled, ${priorityGroup.sections.length} remaining`,
//         );
//       }
//     }

//     // Phase 2: FORCE SCHEDULING for any remaining sections
//     if (priorityGroup.sections.length > 0) {
//       console.log(
//         `\n🚨 FORCE SCHEDULING ${priorityGroup.sections.length} remaining ${priorityGroup.name} sections`,
//       );

//       // Try all days again with more aggressive approach
//       for (const targetDay of dayPriorityOrder.flat()) {
//         if (priorityGroup.sections.length === 0) break;

//         for (let i = priorityGroup.sections.length - 1; i >= 0; i--) {
//           const sched = priorityGroup.sections[i];
//           const result = await scheduleSection(
//             sched,
//             priorityGroup.name,
//             targetDay,
//             true,
//           );

//           if (result.success) {
//             priorityGroup.sections.splice(i, 1);
//             scheduledSections.push(result.scheduledData);

//             console.log(
//               `   🔥 FORCED: ${sched.section} scheduled on ${targetDay} at ${result.scheduledData.scheduledTime} in room ${result.scheduledData.scheduledRoom}`,
//             );
//           }
//         }
//       }
//     }

//     // Phase 3: Emergency scheduling - try ANY available combination
//     if (priorityGroup.sections.length > 0) {
//       console.log(
//         `\n🆘 EMERGENCY SCHEDULING ${priorityGroup.sections.length} remaining ${priorityGroup.name} sections`,
//       );

//       for (let i = priorityGroup.sections.length - 1; i >= 0; i--) {
//         const sched = priorityGroup.sections[i];
//         const allowedDays = getSectionAllowedDays(sched.section);

//         let scheduled = false;
//         for (const day of allowedDays) {
//           if (scheduled) break;

//           const result = await scheduleSection(
//             sched,
//             priorityGroup.name,
//             day,
//             true,
//           );
//           if (result.success) {
//             priorityGroup.sections.splice(i, 1);
//             scheduledSections.push(result.scheduledData);
//             scheduled = true;

//             console.log(
//               `   🆘 EMERGENCY: ${sched.section} scheduled on ${day} at ${result.scheduledData.scheduledTime} in room ${result.scheduledData.scheduledRoom}`,
//             );
//           }
//         }

//         if (!scheduled) {
//           console.log(
//             `   ❌ FAILED: ${sched.section} could not be scheduled despite all attempts`,
//           );
//         }
//       }
//     }

//     const groupScheduled =
//       (priorityGroup.name === "N4"
//         ? n4Sections.length
//         : priorityGroup.name === "PATHFIT"
//           ? pathfitSections.length
//           : priorityGroup.name === "NSTP"
//             ? nstpSections.length
//             : priorityGroup.name === "N2D-N2G"
//               ? n2dToN2gSections.length
//               : priorityGroup.name === "N2A-N2C"
//                 ? n2aToN2cSections.length
//                 : otherSections.length) - priorityGroup.sections.length;

//     console.log(
//       `✅ ${priorityGroup.name} COMPLETED: ${groupScheduled} scheduled, ${priorityGroup.sections.length} failed`,
//     );

//     // If this is a critical priority group, we might want to stop here
//     if (
//       priorityGroup.sections.length > 0 &&
//       ["N4", "PATHFIT", "NSTP"].includes(priorityGroup.name)
//     ) {
//       console.log(
//         `🚨 CRITICAL FAILURE: ${priorityGroup.sections.length} ${priorityGroup.name} sections could not be scheduled!`,
//       );
//     }
//   }

//   // Final analysis
//   const unscheduledSections = [];
//   for (const priorityGroup of priorityGroups) {
//     for (const section of priorityGroup.sections) {
//       const allowedDays = getSectionAllowedDays(section.section);
//       unscheduledSections.push({
//         section: section.section,
//         subjectCode: section.subjectCode,
//         allowedDays: allowedDays,
//         priorityGroup: priorityGroup.name,
//       });
//     }
//   }

//   console.log(`\n=== FINAL RESULTS ===`);
//   console.log(
//     `✅ Successfully scheduled: ${scheduledSections.length}/${genEdSched.length} sections`,
//   );
//   console.log(`❌ Failed to schedule: ${unscheduledSections.length} sections`);

//   if (unscheduledSections.length > 0) {
//     console.log(`\n🔍 UNSCHEDULED SECTIONS ANALYSIS:`);

//     const unscheduledByPriority = {};
//     for (const section of unscheduledSections) {
//       if (!unscheduledByPriority[section.priorityGroup]) {
//         unscheduledByPriority[section.priorityGroup] = [];
//       }
//       unscheduledByPriority[section.priorityGroup].push(section);
//     }

//     for (const [priority, sections] of Object.entries(unscheduledByPriority)) {
//       console.log(`\n${priority} (${sections.length} unscheduled):`);
//       for (const section of sections) {
//         console.log(
//           `   - ${section.section} (${section.subjectCode}) - Days: [${section.allowedDays.join(", ")}]`,
//         );
//       }
//     }

//     // Diagnostic information
//     console.log(`\n🔧 DIAGNOSTIC INFO:`);
//     console.log(`- Total rooms available: ${allAvailableRooms.length}`);
//     console.log(
//       `- Gym rooms for PATHFIT: ${allAvailableRooms.filter((r) => ["378", "368"].includes(r.roomId)).length}`,
//     );
//     console.log(
//       `- Regular rooms: ${allAvailableRooms.filter((r) => !["377", "376", "378", "368"].includes(r.roomId)).length}`,
//     );

//     return res.status(409).json({
//       body: `Scheduling incomplete: ${unscheduledSections.length}/${genEdSched.length} sections could not be scheduled despite using all available rooms and time slots.`,
//       unscheduledSections: unscheduledSections,
//       unscheduledByPriority: unscheduledByPriority,
//       totalRoomsAvailable: allAvailableRooms.length,
//       diagnosticInfo: {
//         totalRooms: allAvailableRooms.length,
//         gymRooms: allAvailableRooms.filter((r) =>
//           ["378", "368"].includes(r.roomId),
//         ).length,
//         regularRooms: allAvailableRooms.filter(
//           (r) => !["377", "376", "378", "368"].includes(r.roomId),
//         ).length,
//       },
//       facultyWorkload: facultyAssignments,
//     });
//   }

//   // Success - All sections scheduled!
//   console.log(
//     `\n🎉 PERFECT SUCCESS: All ${scheduledSections.length} sections scheduled!`,
//   );

//   // Distribution analysis
//   const distribution = {};
//   const allDays = dayPriorityOrder.flat();
//   for (const day of allDays) {
//     distribution[day] = scheduledSections.filter(
//       (s) => s.scheduledDay === day,
//     ).length;
//     console.log(`${day}: ${distribution[day]} sections`);
//   }

//   console.log(`\n=== SUCCESS BY PRIORITY ===`);
//   for (const priorityGroup of priorityGroups) {
//     const originalCount =
//       priorityGroup.name === "N4"
//         ? n4Sections.length
//         : priorityGroup.name === "PATHFIT"
//           ? pathfitSections.length
//           : priorityGroup.name === "NSTP"
//             ? nstpSections.length
//             : priorityGroup.name === "N2D-N2G"
//               ? n2dToN2gSections.length
//               : priorityGroup.name === "N2A-N2C"
//                 ? n2aToN2cSections.length
//                 : otherSections.length;

//     console.log(
//       `${priorityGroup.name}: ${originalCount}/${originalCount} (100%)`,
//     );
//   }

//   return res.status(200).json({
//     body: "🎉 All sections scheduled successfully!",
//     totalScheduled: scheduledSections.length,
//     distribution: distribution,
//     facultyWorkload: facultyAssignments,
//     scheduledSections: scheduledSections,
//     successRate: "100%",
//   });
// };

// const scheduleGenEdSubjectAutomated = async (req, res) => {
//   const genEdSched = await schedModel.getGenEdSched();
//   const employeeCode = "8958";
//   const capacityNeeded = 40;

//   // Calculate faculty needed for all subjects
//   const facultyAssignments = calculateFacultyNeeded(genEdSched);

//   // Enhanced day priority order
//   const dayPriorityOrder = [
//     ["S"], // Saturday first
//     ["M", "F"], // Monday and Friday
//     ["T", "W", "TH"], // Tuesday, Wednesday, Thursday
//   ];

//   // Categorize sections by priority - THESE ARE THE PROCESSING ORDER
//   const n4Sections = genEdSched.filter((sched) =>
//     sched.section.toUpperCase().includes("N4"),
//   );

//   const pathfitSections = genEdSched.filter(
//     (sched) =>
//       sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/) &&
//       !sched.section.toUpperCase().includes("N4"),
//   );

//   const nstpSections = genEdSched.filter(
//     (sched) =>
//       sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.section.toUpperCase().includes("N4"),
//   );

//   const n2dToN2gSections = genEdSched.filter(
//     (sched) =>
//       sched.section.toUpperCase().match(/N2[D-G]/) &&
//       !sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/),
//   );

//   const n2aToN2cSections = genEdSched.filter(
//     (sched) =>
//       (sched.section.toUpperCase().match(/N2[A-C]/) ||
//         (sched.section.toUpperCase().includes("N2") &&
//           !sched.section.toUpperCase().match(/N2[D-G]/))) &&
//       !sched.section.toUpperCase().includes("N4") &&
//       !sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/),
//   );

//   const otherSections = genEdSched.filter(
//     (sched) =>
//       !sched.section.toUpperCase().includes("N4") &&
//       !sched.subjectCode.toUpperCase().includes("NSTP") &&
//       !sched.section.toUpperCase().match(/N2[A-G]/) &&
//       !sched.subjectCode.toUpperCase().match(/PATHFIT[1-4]/),
//   );

//   // PRIORITY PROCESSING ORDER - Process completely one group at a time
//   const priorityGroups = [
//     { name: "N4", sections: [...n4Sections] },
//     { name: "PATHFIT", sections: [...pathfitSections] },
//     { name: "NSTP", sections: [...nstpSections] },
//     { name: "N2D-N2G", sections: [...n2dToN2gSections] },
//     { name: "N2A-N2C", sections: [...n2aToN2cSections] },
//     { name: "Others", sections: [...otherSections] },
//   ];

//   const scheduledSections = [];

//   console.log(`Total sections to schedule: ${genEdSched.length}`);
//   console.log(`N4 sections: ${n4Sections.length}`);
//   console.log(`PATHFIT sections: ${pathfitSections.length}`);
//   console.log(`NSTP sections: ${nstpSections.length}`);

//   // Helper functions
//   const isGymRoom = (roomId) => ["378", "368"].includes(roomId);

//   // Process each priority group COMPLETELY before moving to next
//   for (const priorityGroup of priorityGroups) {
//     if (priorityGroup.sections.length === 0) continue;

//     console.log(
//       `\n=== PROCESSING ALL ${priorityGroup.name} SECTIONS (${priorityGroup.sections.length} total) ===`,
//     );

//     // For this priority group, process by day priority
//     for (const dayGroup of dayPriorityOrder) {
//       if (priorityGroup.sections.length === 0) break;

//       console.log(
//         `--- Processing ${priorityGroup.name} sections on days: ${dayGroup.join(", ")} ---`,
//       );

//       for (const targetDay of dayGroup) {
//         if (priorityGroup.sections.length === 0) break;

//         console.log(
//           `--- Maximizing ${targetDay} for ${priorityGroup.name} sections ---`,
//         );

//         // Get all available rooms
//         const getRoomNeeded = await schedModel.getRoomsApplicable(
//           capacityNeeded,
//           priorityGroup.sections[0]?.roomTypeCodes || "",
//         );

//         // Keep trying to maximize this day for this priority group
//         let dayMaximized = false;
//         let scheduledThisDay = 0;

//         while (!dayMaximized && priorityGroup.sections.length > 0) {
//           let scheduledInThisRound = false;

//           // Try to schedule sections across all available rooms
//           for (const room of getRoomNeeded) {
//             if (priorityGroup.sections.length === 0) break;

//             // Room restrictions
//             const isSpecialRoom = ["377", "376", "378", "368"].includes(
//               room.roomId,
//             );
//             const isCurrentGymRoom = ["378", "368"].includes(room.roomId);

//             if (
//               isSpecialRoom &&
//               !(priorityGroup.name === "PATHFIT" && isCurrentGymRoom)
//             ) {
//               continue;
//             }

//             // For PATHFIT, only allow gym rooms
//             if (priorityGroup.name === "PATHFIT" && !isCurrentGymRoom) {
//               continue;
//             }

//             // Try to schedule any section from this priority group in this room
//             for (let i = priorityGroup.sections.length - 1; i >= 0; i--) {
//               const sched = priorityGroup.sections[i];
//               const {
//                 semester,
//                 subjectCode,
//                 section,
//                 limit,
//                 intervals,
//                 days,
//                 subjectOfferedTo,
//                 yearLevel,
//                 roomTypeCodes,
//                 hours,
//               } = sched;

//               // Check if section is allowed on this day
//               const allowedDays = getSectionAllowedDays(section);
//               if (!allowedDays.includes(targetDay)) {
//                 continue;
//               }

//               const getSchedule = await schedModel.getSchedule(
//                 semester,
//                 subjectOfferedTo,
//                 yearLevel,
//               );

//               const startDate = getSchedule[0].startOfClasses;
//               const endDate = getSchedule[0].endOfClasses;

//               // Get all available time slots for this room on this day
//               const availableTimeSlots = await getAllAvailableSlotsForRoom(
//                 room,
//                 targetDay,
//                 startDate,
//                 endDate,
//                 section,
//                 hours,
//               );

//               // Try to schedule in any available time slot
//               let sectionScheduled = false;
//               for (const timeSlot of availableTimeSlots) {
//                 const isRoomAvailable = await isRoomAvailableForSlot(
//                   room,
//                   targetDay,
//                   timeSlot,
//                   startDate,
//                   endDate,
//                   section,
//                   hours,
//                 );

//                 // Check room restrictions for day and time
//                 const roomIds = room.roomId.split(",").map((id) => id.trim());
//                 const roomTimeRestricted = roomIds.some(
//                   (roomId) =>
//                     !isRoomAvailableForDayAndTime(roomId, targetDay, timeSlot),
//                 );

//                 if (isRoomAvailable && !roomTimeRestricted) {
//                   // Check faculty availability
//                   const assignedFaculty = assignFacultyToSection(
//                     facultyAssignments,
//                     subjectCode.toUpperCase(),
//                     {
//                       targetDay,
//                       timeSlot,
//                       startDate,
//                       endDate,
//                       section,
//                     },
//                   );

//                   if (!assignedFaculty) {
//                     continue; // Try next time slot
//                   }

//                   // Schedule the section
//                   let newInterval;
//                   if (isCurrentGymRoom && priorityGroup.name === "PATHFIT") {
//                     newInterval = {
//                       roomId: parseInt(room.roomId),
//                       fromDate: startDate,
//                       toDate: endDate,
//                       days: targetDay,
//                       subjectCode: subjectCode,
//                       section: section,
//                       professor: assignedFaculty.name,
//                       intervals: timeSlot,
//                       remarks: "Automated GE Schedule",
//                       departmentCode: "",
//                       Active: 1,
//                     };

//                     await insertedRoomFunction(newInterval, employeeCode);
//                   } else {
//                     const roomIds = room.roomId
//                       .split(",")
//                       .map((id) => parseInt(id.trim(), 10))
//                       .filter((id) => !isNaN(id));

//                     newInterval = {
//                       roomId: null,
//                       fromDate: startDate,
//                       toDate: endDate,
//                       days: targetDay,
//                       subjectCode: subjectCode,
//                       section: section,
//                       professor: assignedFaculty.name,
//                       intervals: timeSlot,
//                       remarks: "Automated GE Schedule",
//                       departmentCode: "",
//                       Active: 1,
//                     };

//                     await scheduleInPhysicalRoom(
//                       roomIds,
//                       newInterval,
//                       employeeCode,
//                     );
//                   }

//                   // Remove from priority group sections
//                   priorityGroup.sections.splice(i, 1);

//                   scheduledSections.push({
//                     ...sched,
//                     scheduledDay: targetDay,
//                     scheduledRoom: room.roomId,
//                     scheduledTime: timeSlot,
//                     assignedFaculty: assignedFaculty.name,
//                   });

//                   scheduledInThisRound = true;
//                   scheduledThisDay++;
//                   sectionScheduled = true;

//                   console.log(
//                     `✓ Scheduled ${priorityGroup.name} section ${section} on ${targetDay} at ${timeSlot} in room ${room.roomId} with ${assignedFaculty.name}`,
//                   );
//                   break; // Move to next section
//                 }
//               }

//               if (sectionScheduled) break; // Move to next room after scheduling a section
//             }
//           }

//           // If no sections were scheduled in this round, the day is maximized for this priority group
//           if (!scheduledInThisRound) {
//             dayMaximized = true;
//             console.log(
//               `✓ ${targetDay} is maximized for ${priorityGroup.name} sections (${scheduledThisDay} scheduled)`,
//             );
//           }
//         }

//         console.log(
//           `${targetDay} complete for ${priorityGroup.name}. Remaining ${priorityGroup.name} sections: ${priorityGroup.sections.length}`,
//         );
//       }
//     }

//     console.log(`=== COMPLETED ALL ${priorityGroup.name} SECTIONS ===`);
//     if (priorityGroup.sections.length > 0) {
//       console.log(
//         `⚠️  ${priorityGroup.sections.length} ${priorityGroup.name} sections could not be scheduled`,
//       );
//     }
//   }

//   // Collect all unscheduled sections
//   const unscheduledSections = [];
//   for (const priorityGroup of priorityGroups) {
//     for (const section of priorityGroup.sections) {
//       const allowedDays = getSectionAllowedDays(section.section);
//       unscheduledSections.push({
//         section: section.section,
//         subjectCode: section.subjectCode,
//         allowedDays: allowedDays,
//         priorityGroup: priorityGroup.name,
//       });
//     }
//   }

//   // Check if all sections were scheduled
//   if (unscheduledSections.length > 0) {
//     console.log(
//       `✗ Failed to schedule ${unscheduledSections.length} sections - all time slots are fully booked, restricted, or no faculty available`,
//     );

//     for (const section of unscheduledSections) {
//       console.log(
//         `Unscheduled: ${section.priorityGroup} - ${section.section} (${section.subjectCode}) - allowed days: ${section.allowedDays.join(", ")}`,
//       );
//     }

//     return res.status(409).json({
//       body: `Cannot book the schedule. ${unscheduledSections.length} sections could not be scheduled - all time slots are fully booked, restricted, or no faculty available.`,
//       unscheduledSections: unscheduledSections,
//       facultyWorkload: facultyAssignments,
//     });
//   }

//   console.log("=== SCHEDULING COMPLETE ===");
//   console.log(`Total sections scheduled: ${scheduledSections.length}`);

//   // Log distribution by day
//   const allDays = dayPriorityOrder.flat();
//   const distribution = {};
//   for (const day of allDays) {
//     let count = 0;
//     for (const scheduledSection of scheduledSections) {
//       if (scheduledSection.scheduledDay === day) {
//         count++;
//       }
//     }
//     distribution[day] = count;
//     console.log(`${day} sections: ${count}`);
//   }

//   // Log distribution by priority group
//   console.log("=== FINAL DISTRIBUTION BY PRIORITY ===");
//   for (const priorityGroup of priorityGroups) {
//     const scheduledCount = scheduledSections.filter((s) => {
//       if (priorityGroup.name === "N4")
//         return s.section.toUpperCase().includes("N4");
//       if (priorityGroup.name === "PATHFIT")
//         return (
//           s.subjectCode.toUpperCase().match(/PATHFIT[1-4]/) &&
//           !s.section.toUpperCase().includes("N4")
//         );
//       if (priorityGroup.name === "NSTP")
//         return (
//           s.subjectCode.toUpperCase().includes("NSTP") &&
//           !s.section.toUpperCase().includes("N4")
//         );
//       // Add other conditions as needed
//       return false;
//     }).length;
//     console.log(`${priorityGroup.name}: ${scheduledCount} scheduled`);
//   }

//   // Log faculty workload
//   console.log("=== FACULTY WORKLOAD ===");
//   for (const [subjectCode, facultyList] of Object.entries(facultyAssignments)) {
//     console.log(`${subjectCode}:`);
//     for (const faculty of facultyList) {
//       console.log(`  ${faculty.name}: ${faculty.workload} classes`);
//     }
//   }

//   return res.status(200).json({
//     body: "Scheduled successfully",
//     totalScheduled: scheduledSections.length,
//     distribution: distribution,
//     facultyWorkload: facultyAssignments,
//     scheduledSections: scheduledSections,
//   });
// };

//This one is working

// const getFreeIntervalTimeSlotForDay = async (
//   scheduled,
//   startDate,
//   endDate,
//   section,
//   hours,
//   targetDay, // New parameter to specify which day to check
//   roomId = null, // Add roomId parameter for room-specific restrictions
// ) => {
//   const allSlots = [];

//   // Check if this room has weekday restrictions
//   const isRestrictedRoom = checkRoomRestrictions(roomId, targetDay);

//   // If room is restricted on this day, return empty slots
//   if (isRestrictedRoom.isRestricted) {
//     if (isRestrictedRoom.allowedHours) {
//       // Room has specific time restrictions (5pm-8pm for certain rooms on weekdays)
//       const restrictedStartHour = isRestrictedRoom.allowedHours.start;
//       const restrictedEndHour = isRestrictedRoom.allowedHours.end;

//       // Generate slots only within allowed hours
//       for (
//         let hour = restrictedStartHour;
//         hour < restrictedEndHour;
//         hour += hours
//       ) {
//         const from = `${hour.toString().padStart(2, "0")}:00`;
//         const to = `${(hour + hours).toString().padStart(2, "0")}:00`;

//         // Only add slot if it doesn't exceed the restricted end hour
//         if (hour + hours <= restrictedEndHour) {
//           allSlots.push(`${from}-${to}`);
//         }
//       }
//     } else {
//       // Room is completely restricted on this day
//       return [];
//     }
//   } else {
//     // Generate normal slots (7am-7pm) for unrestricted rooms
//     for (let hour = 7; hour < 19; hour += hours) {
//       const from = `${hour.toString().padStart(2, "0")}:00`;
//       const to = `${(hour + hours).toString().padStart(2, "0")}:00`;

//       // Only add slot if it doesn't exceed 19:00
//       if (hour + hours <= 19) {
//         allSlots.push(`${from}-${to}`);
//       }
//     }
//   }

//   const freeSlots = [...allSlots];
//   const sectionSchedules = [];

//   const targetStart = new Date(startDate);
//   const targetEnd = new Date(endDate);

//   // Get ALL existing schedules for this specific section across all rooms
//   const existingSectionSchedules = await schedModel.getSectionSchedule(section);

//   // Process each existing section schedule and extract day-specific intervals
//   for (const sectionSched of existingSectionSchedules) {
//     if (!sectionSched.days || !sectionSched.intervals) continue;

//     const schedStart = new Date(sectionSched.fromDate);
//     const schedEnd = new Date(sectionSched.toDate);
//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       // Handle multiple days in a single record (e.g., "M,W,F" or "M" or "M,W")
//       const days = sectionSched.days
//         .split(",")
//         .map((d) => d.trim().toUpperCase());
//       const interval = sectionSched.intervals.trim();

//       // Only consider schedules for the target day
//       if (days.includes(targetDay)) {
//         sectionSchedules.push(interval);
//       }
//     }
//   }

//   const hasTimeOverlap = (slot1, slot2) => {
//     const slot1Start = parseInt(slot1.split("-")[0].split(":")[0]);
//     const slot1End = parseInt(slot1.split("-")[1].split(":")[0]);
//     const slot2Start = parseInt(slot2.split("-")[0].split(":")[0]);
//     const slot2End = parseInt(slot2.split("-")[1].split(":")[0]);

//     // Check if there's any overlap
//     return slot1Start < slot2End && slot1End > slot2Start;
//   };

//   // Check if classes are consecutive (no gap between end time of one and start time of next)
//   const hasConsecutiveClasses = (daySchedules) => {
//     if (daySchedules.length < 2) return false;

//     // Sort schedules by start time
//     const sortedSchedules = daySchedules.sort((a, b) => {
//       const aStart = parseInt(a.split("-")[0].split(":")[0]);
//       const bStart = parseInt(b.split("-")[0].split(":")[0]);
//       return aStart - bStart;
//     });

//     // Check if any two classes are consecutive (end time of one = start time of next)
//     for (let i = 0; i < sortedSchedules.length - 1; i++) {
//       const currentEnd = parseInt(
//         sortedSchedules[i].split("-")[1].split(":")[0],
//       );
//       const nextStart = parseInt(
//         sortedSchedules[i + 1].split("-")[0].split(":")[0],
//       );

//       // Classes are consecutive if end time equals start time
//       if (currentEnd === nextStart) {
//         return true;
//       }
//     }

//     return false;
//   };

//   const getLastClassEndTime = (daySchedules) => {
//     if (daySchedules.length === 0) return null;

//     // Get the latest end time from all classes that day
//     const latestEndHour = Math.max(
//       ...daySchedules.map((interval) =>
//         parseInt(interval.split("-")[1].split(":")[0]),
//       ),
//     );

//     return latestEndHour;
//   };

//   // Get slots that respect the 1-hour break rule
//   const getSlotsWithBreak = () => {
//     if (!sectionSchedules || sectionSchedules.length === 0) {
//       return freeSlots; // Return all available slots if no existing classes
//     }

//     if (hasConsecutiveClasses(sectionSchedules)) {
//       // Section already has 2 consecutive classes, so they need 1-hour break
//       const lastClassEndHour = getLastClassEndTime(sectionSchedules);
//       const maxEndHour =
//         isRestrictedRoom.isRestricted && isRestrictedRoom.allowedHours
//           ? isRestrictedRoom.allowedHours.end
//           : 19;

//       // Only allow slots that start at least 1 hour after the last class ends
//       // AND can fit within the room's time limit
//       return freeSlots.filter((slot) => {
//         const slotStartHour = parseInt(slot.split("-")[0].split(":")[0]);
//         const slotEndHour = parseInt(slot.split("-")[1].split(":")[0]);

//         // Must start at least 1 hour after last class AND end within allowed time
//         return (
//           slotStartHour >= lastClassEndHour + 1 && slotEndHour <= maxEndHour
//         );
//       });
//     }

//     // If no consecutive classes exist yet, make sure new slot won't create consecutive classes
//     return freeSlots.filter((slot) => {
//       const slotStart = parseInt(slot.split("-")[0].split(":")[0]);
//       const slotEnd = parseInt(slot.split("-")[1].split(":")[0]);

//       // Check if this slot would be consecutive with any existing class
//       for (const existingInterval of sectionSchedules) {
//         const existingStart = parseInt(
//           existingInterval.split("-")[0].split(":")[0],
//         );
//         const existingEnd = parseInt(
//           existingInterval.split("-")[1].split(":")[0],
//         );

//         // Check if new slot would be consecutive (end time = start time or start time = end time)
//         if (slotEnd === existingStart || existingEnd === slotStart) {
//           return false; // This would create consecutive classes
//         }
//       }

//       return true; // This slot maintains proper breaks
//     });
//   };

//   let availableSlots = [...freeSlots];

//   // Remove slots that conflict with existing section schedules for target day
//   if (sectionSchedules.length > 0) {
//     for (const interval of sectionSchedules) {
//       availableSlots = availableSlots.filter((slot) => {
//         return slot !== interval && !hasTimeOverlap(slot, interval);
//       });
//     }
//   }

//   // Then process room-specific schedules (for room availability) for target day only
//   for (const sched of scheduled) {
//     if (!sched.days || !sched.intervals) continue;

//     const schedStart = new Date(sched.fromDate);
//     const schedEnd = new Date(sched.toDate);
//     const isOverlapping = schedStart <= targetEnd && schedEnd >= targetStart;

//     if (isOverlapping) {
//       const days = sched.days.split(",").map((d) => d.trim().toUpperCase());
//       const interval = sched.intervals.trim();

//       // Only consider schedules for the target day
//       if (days.includes(targetDay)) {
//         // Remove occupied room slots
//         availableSlots = availableSlots.filter((slot) => {
//           return slot !== interval && !hasTimeOverlap(slot, interval);
//         });
//       }
//     }
//   }

//   // Apply break requirements
//   const finalAvailableSlots = getSlotsWithBreak().filter((slot) =>
//     availableSlots.includes(slot),
//   );

//   return finalAvailableSlots;
// };

// // New helper function to check room restrictions
// const checkRoomRestrictions = (roomId, targetDay) => {
//   if (!roomId) return { isRestricted: false };

//   // Convert single roomId or comma-separated roomIds to array
//   const roomIds = roomId
//     .toString()
//     .split(",")
//     .map((id) => id.trim());

//   // Define weekdays
//   const weekdays = ["M", "T", "W", "TH", "F"];
//   const isWeekday = weekdays.includes(targetDay);

//   // Rooms that can only schedule 5pm-8pm (17:00-20:00) on weekdays
//   const restrictedWeekdayRooms = [
//     "280",
//     "281",
//     "282",
//     "283",
//     "243",
//     "354",
//     "355",
//     "361",
//     "364",
//     "365",
//   ];

//   // Rooms that cannot schedule on weekdays at all
//   const noWeekdayRooms = [
//     "247",
//     "246",
//     "248",
//     "249",
//     "250",
//     "350",
//     "255",
//     "256",
//     "258",
//     "257",
//     "268",
//     "280",
//     "281",
//     "282",
//     "283",
//     "267",
//     "309",
//     "310",
//     "381",
//     "313",
//     "314",
//     "315",
//     "327",
//     "328",
//     "335",
//     "336",
//     "337",
//     "338",
//     "243",
//     "382",
//     "354",
//     "355",
//     "358",
//     "360",
//     "361",
//     "364",
//     "365",
//     "229",
//   ];

//   // Check if any roomId in the list has restrictions
//   for (const id of roomIds) {
//     if (isWeekday) {
//       // Check if room is completely restricted on weekdays
//       if (noWeekdayRooms.includes(id)) {
//         return { isRestricted: true };
//       }

//       // Check if room has time restrictions on weekdays
//       if (restrictedWeekdayRooms.includes(id)) {
//         return {
//           isRestricted: true,
//           allowedHours: { start: 17, end: 20 }, // 5pm to 8pm
//         };
//       }
//     }
//   }

//   return { isRestricted: false };
// };

// // Helper function to schedule a section in all comma-delimited rooms of a physical room
// const scheduleInPhysicalRoom = async (roomIds, newInterval, employeeCode) => {
//   // Schedule in all room IDs that represent the same physical room
//   for (const roomId of roomIds) {
//     const intervalForRoom = {
//       ...newInterval,
//       roomId: roomId,
//     };
//     await insertedRoomFunction(intervalForRoom, employeeCode);
//   }
// };

// // Helper function to get all available time slots for a room on a specific day
// const getAllAvailableSlotsForRoom = async (
//   room,
//   targetDay,
//   startDate,
//   endDate,
//   section,
//   hours,
// ) => {
//   if (room.roomId === "377" || room.roomId === "376") {
//     const roomScheduled = await scheduleFunction(room.roomId);
//     const availableSlots = await getFreeIntervalTimeSlotForDay(
//       roomScheduled,
//       startDate,
//       endDate,
//       section,
//       hours,
//       targetDay,
//       room.roomId, // Pass roomId for restriction checking
//     );
//     return availableSlots || [];
//   } else {
//     const roomIds = room.roomId
//       .split(",")
//       .map((id) => parseInt(id.trim(), 10))
//       .filter((id) => !isNaN(id));

//     const firstRoomId = roomIds[0];
//     const scheduled = await scheduleFunction(firstRoomId);

//     const availableSlots = await getFreeIntervalTimeSlotForDay(
//       scheduled,
//       startDate,
//       endDate,
//       section,
//       hours,
//       targetDay,
//       room.roomId, // Pass roomId for restriction checking
//     );

//     return availableSlots || [];
//   }
// };

// // Helper function to check section scheduling restrictions
// const getSectionAllowedDays = (section) => {
//   const sectionUpper = section.toUpperCase();

//   // N4 sections: Cannot schedule Monday to Friday
//   if (sectionUpper.includes("N4")) {
//     return ["S"]; // Only Saturday allowed
//   }

//   // N2D to N2G: Cannot schedule Monday to Wednesday
//   if (sectionUpper.match(/N2[D-G]/)) {
//     return ["TH", "F", "S"]; // Thursday, Friday, Saturday allowed
//   }

//   // N2A to N2C: Cannot schedule Thursday and Saturday
//   if (
//     sectionUpper.match(/N2[A-C]/) ||
//     (sectionUpper.includes("N2") && !sectionUpper.match(/N2[D-G]/))
//   ) {
//     return ["M", "T", "W", "F"]; // Monday, Tuesday, Wednesday, Friday allowed
//   }

//   // Default: all days allowed
//   return ["M", "T", "W", "TH", "F", "S"];
// };

// // Helper function to check if a room is available for a specific day and time
// const isRoomAvailableForSlot = async (
//   room,
//   targetDay,
//   timeSlot,
//   startDate,
//   endDate,
//   section,
//   hours,
// ) => {
//   // Check room restrictions first
//   const roomRestriction = checkRoomRestrictions(room.roomId, targetDay);
//   if (roomRestriction.isRestricted && !roomRestriction.allowedHours) {
//     return false; // Room completely restricted on this day
//   }

//   // Handle special rooms 377 and 376
//   if (room.roomId === "377" || room.roomId === "376") {
//     const roomScheduled = await scheduleFunction(room.roomId);

//     for (const existingSched of roomScheduled) {
//       if (!existingSched.days || !existingSched.intervals) continue;

//       const schedStart = new Date(existingSched.fromDate);
//       const schedEnd = new Date(existingSched.toDate);
//       const targetStart = new Date(startDate);
//       const targetEnd = new Date(endDate);

//       if (schedStart <= targetEnd && schedEnd >= targetStart) {
//         const existingDays = existingSched.days
//           .split(",")
//           .map((d) => d.trim().toUpperCase());
//         if (
//           existingDays.includes(targetDay) &&
//           existingSched.intervals === timeSlot
//         ) {
//           return false;
//         }
//       }
//     }
//     return true;
//   } else {
//     // Handle regular rooms (comma-delimited rooms are one physical room)
//     const roomIds = room.roomId
//       .split(",")
//       .map((id) => parseInt(id.trim(), 10))
//       .filter((id) => !isNaN(id));

//     // Check if specific time slot is available across all room IDs
//     for (const roomId of roomIds) {
//       const roomScheduled = await scheduleFunction(roomId);

//       const checkInterval = insertedAndCheckIntervalItem(
//         roomId,
//         startDate,
//         endDate,
//         targetDay,
//         "",
//         section,
//         "",
//         timeSlot,
//         "Automated GE Schedule",
//         "8958",
//         false,
//       );

//       const intervals1 = intervalsFromSched.checkIntervals(checkInterval);

//       for (const existingSched of roomScheduled) {
//         const intervals2 = intervalsFromSched.checkIntervals(existingSched);

//         if (_intervalsOverlap(intervals1, intervals2)) {
//           return false;
//         }
//       }
//     }

//     return true;
//   }
// };

// // const scheduleGenEdSubjectAutomated = async (req, res) => {
// //   const genEdSched = await schedModel.getGenEdSched();
// //   const employeeCode = "8958";
// //   const capacityNeeded = 40;

// //   // Day priority order - ONE DAY AT A TIME
// //   const dayPriorityOrder = ["S", "M", "F", "T", "W", "TH"]; // Saturday first, then others

// //   const sectionsToSchedule = [...genEdSched];
// //   const scheduledSections = [];

// //   console.log(`Total sections to schedule: ${sectionsToSchedule.length}`);

// //   // Get all available rooms once at the beginning
// //   const allAvailableRooms = await schedModel.getRoomsApplicable(
// //     capacityNeeded,
// //     sectionsToSchedule[0]?.roomTypeCodes || "",
// //   );

// //   console.log(
// //     `Total rooms available: ${allAvailableRooms.length} (expecting 38 rooms)`,
// //   );

// //   // Process each day individually - MAXIMIZE EACH DAY COMPLETELY
// //   for (const targetDay of dayPriorityOrder) {
// //     if (sectionsToSchedule.length === 0) break;

// //     console.log(
// //       `\n=== MAXIMIZING ${targetDay} ACROSS ALL ${allAvailableRooms.length} ROOMS ===`,
// //     );

// //     let dayFullyMaximized = false;

// //     while (!dayFullyMaximized && sectionsToSchedule.length > 0) {
// //       let scheduledThisRound = false;

// //       console.log(`\n--- Attempting to schedule on ${targetDay} ---`);
// //       console.log(`Remaining sections: ${sectionsToSchedule.length}`);

// //       // Go through ALL available rooms and try to schedule something in each
// //       for (const room of allAvailableRooms) {
// //         // Check room restrictions for this day
// //         const roomRestriction = checkRoomRestrictions(room.roomId, targetDay);
// //         if (roomRestriction.isRestricted && !roomRestriction.allowedHours) {
// //           continue; // Skip this room for this day
// //         }

// //         // Try to find a section that can be scheduled in this room
// //         for (let i = sectionsToSchedule.length - 1; i >= 0; i--) {
// //           const sched = sectionsToSchedule[i];
// //           const {
// //             semester,
// //             subjectCode,
// //             section,
// //             hours,
// //             subjectOfferedTo,
// //             yearLevel,
// //           } = sched;

// //           // Check if section is allowed on this day
// //           const allowedDays = getSectionAllowedDays(section);
// //           if (!allowedDays.includes(targetDay)) {
// //             continue; // Skip this section for this day
// //           }

// //           const getSchedule = await schedModel.getSchedule(
// //             semester,
// //             subjectOfferedTo,
// //             yearLevel,
// //           );

// //           const startDate = getSchedule[0].startOfClasses;
// //           const endDate = getSchedule[0].endOfClasses;

// //           // Get all available time slots for this room on this day
// //           const availableTimeSlots = await getAllAvailableSlotsForRoom(
// //             room,
// //             targetDay,
// //             startDate,
// //             endDate,
// //             section,
// //             hours,
// //           );

// //           // Try to schedule in any available time slot
// //           for (const timeSlot of availableTimeSlots) {
// //             const isAvailable = await isRoomAvailableForSlot(
// //               room,
// //               targetDay,
// //               timeSlot,
// //               startDate,
// //               endDate,
// //               section,
// //               hours,
// //             );

// //             if (isAvailable) {
// //               const newInterval = {
// //                 roomId: room.roomId,
// //                 fromDate: startDate,
// //                 toDate: endDate,
// //                 days: targetDay,
// //                 subjectCode: subjectCode,
// //                 section: section,
// //                 professor: null,
// //                 intervals: timeSlot,
// //                 remarks: "Automated GE Schedule",
// //                 departmentCode: null,
// //                 Active: 1,
// //               };

// //               console.log(
// //                 `✓ Scheduled Room ${room.roomId} on ${targetDay} at ${timeSlot} for section ${section}`,
// //               );
// //               await insertedRoomFunction(newInterval, employeeCode);

// //               // Remove scheduled section from pending list
// //               sectionsToSchedule.splice(i, 1);
// //               scheduledSections.push({
// //                 ...sched,
// //                 scheduledDay: targetDay,
// //                 scheduledRoom: room.roomId,
// //                 scheduledTime: timeSlot,
// //               });

// //               scheduledThisRound = true;
// //               break; // Found a slot, break from time slot loop
// //             }
// //           }

// //           if (scheduledThisRound) break; // Break from section loop if we scheduled something in this room
// //         }
// //       }

// //       // If no sections were scheduled this round across all rooms, the day is fully maximized
// //       if (!scheduledThisRound) {
// //         dayFullyMaximized = true;
// //         console.log(
// //           `\n🔥 ${targetDay} is now FULLY MAXIMIZED across all ${allAvailableRooms.length} rooms!`,
// //         );
// //       }
// //     }

// //     const dayCount = scheduledSections.filter(
// //       (s) => s.scheduledDay === targetDay,
// //     ).length;
// //     console.log(`\n🎯 ${targetDay} MAXIMIZATION COMPLETE!`);
// //     console.log(`📊 Total sections scheduled on ${targetDay}: ${dayCount}`);
// //     console.log(
// //       `📋 Total sections scheduled so far: ${scheduledSections.length}`,
// //     );
// //     console.log(`📝 Remaining sections: ${sectionsToSchedule.length}`);
// //   }

// //   // Check if all sections were scheduled
// //   if (sectionsToSchedule.length > 0) {
// //     console.log(
// //       `✗ Failed to schedule ${sectionsToSchedule.length} sections - all time slots are fully booked or restricted`,
// //     );

// //     // Log which sections couldn't be scheduled
// //     const unscheduledSections = [];
// //     for (const section of sectionsToSchedule) {
// //       const allowedDays = getSectionAllowedDays(section.section);
// //       console.log(
// //         `Unscheduled: ${section.section} (allowed days: ${allowedDays.join(", ")})`,
// //       );
// //       unscheduledSections.push({
// //         section: section.section,
// //         allowedDays: allowedDays,
// //       });
// //     }

// //     return res.status(409).json({
// //       body: `Cannot book the schedule. ${sectionsToSchedule.length} sections could not be scheduled - all time slots are fully booked or restricted.`,
// //       unscheduledSections: unscheduledSections,
// //     });
// //   }

// //   console.log("=== SCHEDULING COMPLETE ===");
// //   console.log(`Total sections scheduled: ${scheduledSections.length}`);
// //   console.log(`Total rooms utilized: ${allAvailableRooms.length}`);

// //   return res.status(200).json({
// //     body: "Scheduled successfully",
// //     totalScheduled: scheduledSections.length,
// //     totalRoomsAvailable: allAvailableRooms.length,
// //   });
// // };

// const analyzeScheduleData = (scheduleData) => {
//   let dayClassCount = 0;
//   let nightClassCount = 0;
//   const roomTypeCount = {};
//   const totalRecords = scheduleData.length;

//   // Helper: Parse sections from combinedSchedule
//   const parseSections = (combinedSchedule) => {
//     // Match pattern: (SECTIONS Day - TIME)
//     const regex = /\(([^)]+)\)/;
//     const match = combinedSchedule.match(regex);

//     if (!match) return [];

//     const content = match[1]; // e.g., "PT2A,PT2B,PT2C Tuesday - 07:00-10:00"
//     const parts = content.split(" - ");

//     if (parts.length !== 2) return [];

//     const [sectionsAndDay, timeRange] = parts;
//     const sectionsDay = sectionsAndDay.split(" ");

//     if (sectionsDay.length < 2) return [];

//     // Get sections (everything before the day)
//     const sections = sectionsDay.slice(0, -1).join(" ").split(",");

//     return {
//       sections: sections.map((s) => s.trim()),
//       timeRange: timeRange.trim(),
//     };
//   };

//   // Helper: Convert time to minutes
//   const timeToMinutes = (time) => {
//     const [hours, minutes] = time.split(":").map(Number);
//     return hours * 60 + minutes;
//   };

//   // Helper: Classify schedule as day or night
//   const classifySchedule = (timeRange) => {
//     const [startTime, endTime] = timeRange.split("-").map((t) => t.trim());

//     const startMinutes = timeToMinutes(startTime);
//     const endMinutes = timeToMinutes(endTime);
//     const nightThreshold = timeToMinutes("17:00"); // 5 PM

//     // If start time is at or after 17:00, it's a night class
//     if (startMinutes >= nightThreshold) {
//       return "night";
//     }

//     // If start time is before 17:00
//     const totalDuration = endMinutes - startMinutes;
//     const nightDuration = Math.max(0, endMinutes - nightThreshold);

//     // If 2+ hours (120 minutes) are after 17:00, count as night class
//     if (nightDuration >= 120) {
//       return "night";
//     }

//     // Otherwise, it's a day class
//     return "day";
//   };

//   // Process each schedule
//   for (const schedule of scheduleData) {
//     const { combinedSchedule, roomTypeCodes } = schedule;

//     // Parse sections and time

//     const parsed = parseSections(combinedSchedule);

//     if (parsed && parsed.sections && parsed.timeRange) {
//       const { sections, timeRange } = parsed;
//       const classification = classifySchedule(timeRange);
//       const sectionCount = sections.length;

//       if (classification === "day") {
//         dayClassCount += sectionCount;
//       } else {
//         nightClassCount += sectionCount;
//       }
//     }

//     const hasSchedule = (combinedSchedule) => {
//       if (!combinedSchedule) return false;
//       const scheduleStr = combinedSchedule.trim().toLowerCase();
//       return (
//         scheduleStr !== "no schedule" &&
//         scheduleStr !== "" &&
//         scheduleStr !== "null"
//       );
//     };
//     // Count room types
//     if (roomTypeCodes) {
//       if (hasSchedule) {
//         const roomType = roomTypeCodes.trim();
//         if (!roomTypeCount[roomType]) {
//           roomTypeCount[roomType] = 0;
//         }
//         roomTypeCount[roomType]++;
//       }
//     }
//   }

//   // Calculate room type percentages
//   const roomTypePercentages = {};
//   for (const [roomType, count] of Object.entries(roomTypeCount)) {
//     roomTypePercentages[roomType] = {
//       count,
//       percentage: `${((count / totalRecords) * 100).toFixed(2)}%`,
//     };
//   }

//   return {
//     dayClassCount,
//     nightClassCount,
//     totalSections: dayClassCount + nightClassCount,
//     roomTypePercentages,
//     totalRecords,
//     summary: {
//       dayClassPercentage:
//         totalRecords > 0
//           ? `${((dayClassCount / (dayClassCount + nightClassCount)) * 100).toFixed(2)}%`
//           : "0%",
//       nightClassPercentage:
//         totalRecords > 0
//           ? `${((nightClassCount / (dayClassCount + nightClassCount)) * 100).toFixed(2)}%`
//           : "0%",
//     },
//   };
// };

// const trialReport = async () => {
//   const result = await schedModel.bookedRoomsView(
//     "",
//     "",
//     "",
//     "2025-07-14",
//     "2025-11-15",
//   );

//   console.log("STARTED");

//   const analysis = analyzeScheduleData(result);
//   console.log("Analysis:", analysis);
// };

module.exports = {
  createAutoRoomSchedule,
  getSubjectCode,
  getAvailableRoom,
  scheduleBooking,
  bookedRooms,
  getSections,
  getSemester,
  customScheduleBooking,
  bookedRoomsByEmployeeCode,
  bookedRoomsView,
  scheduleBookingManually,
  scheduleBookingManuallyByGivenRooms,
  getAllRooms,
  // checkStatus,
  getRooms,
  cancelSchedule,
  // trialReport,
  // scheduleGenEdSubjectAutomated,
  // transformData,
};

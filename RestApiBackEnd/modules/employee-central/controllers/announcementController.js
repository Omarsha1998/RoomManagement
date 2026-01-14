const Announcement = require("../models/announcementModel.js");
const sqlHelper = require("../../../helpers/sql.js");
const NodeClam = require("clamscan");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

let clamscan = null;
// ClamScan Only
// const initClamAV = async () => {
//   try {
//     clamscan = await new NodeClam().init({
//       removeInfected: false,
//       quarantineInfected: false,
//       debugMode: false,
//       clamscan: {
//         path: "C:\\Program Files\\ClamAV\\clamscan.exe",
//         db: "C:\\Program Files\\ClamAV\\database",
//         scanArchives: true,
//         active: true,
//         scanPdf: true,
//         scanOle2: true,
//         alertBrokenExecutables: true,
//         alertEncrypted: false,
//       },
//       preference: "clamscan",
//     });
//     console.log("✅ ClamAV initialized successfully");
//     return true;
//   } catch (err) {
//     console.error("❌ ClamAV initialization failed:", err.message);
//     return false;
//   }
// };

// const scanFileForVirus = async (fileBuffer, fileName) => {
//   const tempDir = os.tmpdir();
//   const tempFilePath = path.join(tempDir, `scan_${Date.now()}_${fileName}`);

//   try {
//     await fs.writeFile(tempFilePath, fileBuffer);

//     const { isInfected, file, viruses } =
//       await clamscan.isInfected(tempFilePath);

//     await fs.unlink(tempFilePath);

//     if (isInfected) {
//       return {
//         safe: false,
//         virus: viruses.join(", "),
//         message: `Virus detected: ${viruses.join(", ")}`,
//       };
//     }

//     return {
//       safe: true,
//       message: "File is clean",
//     };
//   } catch (error) {
//     await fs.unlink(tempFilePath).catch(() => {});
//     throw new Error(`Virus scan failed: ${error.message}`);
//   }
// };
//ClamScan Only

//USING ClamDeamon
const initClamAV = async () => {
  try {
    clamscan = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      debugMode: false,
      clamdscan: {
        host: "127.0.0.1",
        port: 3310,
        timeout: 60000,
        active: true,
      },
      preference: "clamdscan",
    });
    console.log("ClamAV daemon initialized successfully");
    return true;
  } catch (err) {
    console.error("ClamAV daemon initialization failed:", err.message);
    return false;
  }
};

const scanFileForVirus = async (fileBuffer, fileName) => {
  const tempFilePath = path.join(os.tmpdir(), `${Date.now()}_${fileName}`);

  try {
    await fs.writeFile(tempFilePath, fileBuffer);

    const { isInfected, viruses } = await clamscan.isInfected(tempFilePath);

    fs.unlink(tempFilePath).catch(() => {});

    if (isInfected) {
      return {
        safe: false,
        virus: viruses.join(", "),
        message: `Virus detected: ${viruses.join(", ")}`,
      };
    }

    return {
      safe: true,
      message: "File is clean",
    };
  } catch (error) {
    fs.unlink(tempFilePath).catch(() => {});
    throw new Error(`Virus scan failed: ${error.message}`);
  }
};
//USING ClamDeamon

const formatDate = ({ date, timeOnly = false, dateOnly = false }) => {
  if (!date) return null;

  const d = new Date(date);

  if (isNaN(d)) return null;

  // 🕒 TIME ONLY
  if (timeOnly) {
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes}${ampm}`;
  }

  if (dateOnly) {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;

  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${formattedHours}:${minutes}${ampm}`;
};

const getAnnouncements = async (req, res) => {
  const sqlWhereStrArr = ["Active = ?", "app = ?", "FileType != ?"];
  const args = [1, "WebApps", "videos"];

  const [announcements, events] = await Promise.all([
    Announcement.getAnnouncements(sqlWhereStrArr, args),
    Announcement.eventsInCalendar(null),
  ]);

  const formattedEvents =
    events?.length > 0
      ? events.map((row) => ({
          ...row,
          timeCombine: `${formatDate({ date: row.timeFrom, timeOnly: true })} - ${formatDate({ date: row.timeTo, timeOnly: true })}`,
          dateCombine: `${formatDate({ date: row.fromDate, dateOnly: true })} - ${formatDate({ date: row.toDate, dateOnly: true })}`,
          fileContent: row.fileContent
            ? row.fileContent.toString("base64")
            : null,
        }))
      : [];

  const combineEvents = {
    announcements: announcements || [],
    events: formattedEvents,
  };

  if (
    combineEvents.announcements.length === 0 &&
    combineEvents.events.length === 0
  ) {
    return res
      .status(404)
      .json({ message: "No events have been set in the calendar" });
  }

  return res.status(200).json(combineEvents);
};

// const setTraining = async (req, res) => {
//   const {
//     programTitle,
//     platform,
//     venue,
//     participants,
//     trainingProvider,
//     timeFrom,
//     timeTo,
//     fromDate,
//     toDate,
//     fileData,
//   } = req.body;

//   if (
//     !programTitle ||
//     !venue ||
//     !timeFrom ||
//     !timeTo ||
//     !fromDate ||
//     !toDate ||
//     !platform
//   ) {
//     return res.status(400).json({
//       message: "Missing required fields.",
//     });
//   }

//   const duplicate = await Announcement.checkTrainingDuplicate(
//     programTitle,
//     platform,
//     venue,
//     timeFrom,
//     timeTo,
//     fromDate,
//     toDate,
//   );

//   if (duplicate && duplicate.length > 0) {
//     return res.status(400).json({
//       message: "A training with same title, vanue, time and date already set.",
//     });
//   }

//   const trainingData = {
//     ProgramTitle: programTitle,
//     Platform: platform,
//     Venue: venue,
//     Participants: participants,
//     TrainingProvider: trainingProvider,
//     TimeFrom: timeFrom,
//     TimeTo: timeTo,
//     FromDate: fromDate,
//     ToDate: toDate,
//     CreatedBy: req.user.employee_id,
//   };

//   if (fileData && Object.keys(fileData).length > 0) {
//     const { fileName, fileSize, fileType, fileContent } = fileData;
//     const eventFile = await sqlHelper.transact(async (txn) => {
//       return await Announcement.setTrainingFile(
//         {
//           Name: fileName,
//           Size: fileSize,
//           Type: fileType,
//           Content: Buffer.from(fileContent, "base64"),
//           UploadedBy: req.user.employee_id,
//         },
//         txn,
//         "DateTimeUploaded",
//       );
//     });

//     console.log(eventFile);
//   }

//   // const insertTraining = await sqlHelper.transact(async (txn) => {
//   //   return await Announcement.setTraining(trainingData, txn, "DateCreated");
//   // });

//   // if (!insertTraining) return res.status(500).json("Internal Server Error");

//   // return res.status(200).json({ message: "Success schedule of training." });
// };

// const setTraining = async (req, res) => {
//   const {
//     programTitle,
//     platform,
//     venue,
//     participants,
//     trainingProvider,
//     timeFrom,
//     timeTo,
//     fromDate,
//     toDate,
//     fileData,
//   } = req.body;

//   if (
//     !programTitle ||
//     !venue ||
//     !timeFrom ||
//     !timeTo ||
//     !fromDate ||
//     !toDate ||
//     !platform
//   ) {
//     return res.status(400).json({
//       message: "Missing required fields.",
//     });
//   }

//   const duplicate = await Announcement.checkTrainingDuplicate(
//     programTitle,
//     platform,
//     venue,
//     timeFrom,
//     timeTo,
//     fromDate,
//     toDate,
//   );

//   if (duplicate && duplicate.length > 0) {
//     return res.status(400).json({
//       message: "A training with same title, venue, time and date already set.",
//     });
//   }

//   const result = await sqlHelper.transact(async (txn) => {
//     let fileId = null;

//     if (fileData && Object.keys(fileData).length > 0) {
//       const { fileName, fileSize, fileType, fileContent } = fileData;

//       const eventFile = await Announcement.setTrainingFile(
//         {
//           Name: fileName,
//           Size: fileSize,
//           Type: fileType,
//           Content: Buffer.from(fileContent, "base64"),
//           UploadedBy: req.user.employee_id,
//         },
//         txn,
//         "DateTimeUploaded",
//       );

//       fileId = eventFile.id;
//     }

//     const trainingData = {
//       ProgramTitle: programTitle,
//       Platform: platform,
//       Venue: venue,
//       Participants: participants,
//       TrainingProvider: trainingProvider,
//       TimeFrom: timeFrom,
//       TimeTo: timeTo,
//       FromDate: fromDate,
//       ToDate: toDate,
//       CreatedBy: req.user.employee_id,
//       EventFileId: fileId,
//     };

//     const insertTraining = await Announcement.setTraining(
//       trainingData,
//       txn,
//       "DateCreated",
//     );

//     return {
//       training: insertTraining,
//       fileId: fileId,
//     };
//   });

//   if (!result || !result.training) {
//     return res.status(500).json({ message: "Internal Server Error" });
//   }

//   return res.status(200).json({
//     message: "Success schedule of training.",
//     trainingId: result.training.Id,
//     fileId: result.fileId,
//   });
// };

const setTraining = async (req, res) => {
  const {
    programTitle,
    platform,
    venue,
    participants,
    trainingProvider,
    timeFrom,
    timeTo,
    fromDate,
    toDate,
    fileData,
  } = req.body;

  if (
    !programTitle ||
    !venue ||
    !timeFrom ||
    !timeTo ||
    !fromDate ||
    !toDate ||
    !platform
  ) {
    return res.status(400).json({
      message: "Missing required fields.",
    });
  }

  const duplicate = await Announcement.checkTrainingDuplicate(
    programTitle,
    platform,
    venue,
    timeFrom,
    timeTo,
    fromDate,
    toDate,
  );

  if (duplicate && duplicate.length > 0) {
    return res.status(400).json({
      message: "A training with same title, venue, time and date already set.",
    });
  }

  let fileBuffer = null;
  let fileName = null;

  if (fileData && Object.keys(fileData).length > 0) {
    fileName = fileData.fileName;
    fileBuffer = Buffer.from(fileData.fileContent, "base64");

    try {
      const scanResult = await scanFileForVirus(fileBuffer, fileName);

      if (!scanResult.safe) {
        return res.status(422).json({
          message: "File upload rejected due to security concerns.",
          error: scanResult.message,
          virus: scanResult.virus,
          fileName: fileName,
        });
      }
    } catch (scanError) {
      return res.status(503).json({
        message: "File security verification is temporarily unavailable.",
        error: scanError.message,
      });
    }
  }

  try {
    const result = await sqlHelper.transact(async (txn) => {
      let fileId = null;

      if (fileBuffer && fileName) {
        const { fileSize, fileType } = fileData;

        const eventFile = await Announcement.setTrainingFile(
          {
            Name: fileName,
            Size: fileSize,
            Type: fileType,
            Content: fileBuffer,
            UploadedBy: req.user.employee_id,
          },
          txn,
          "DateTimeUploaded",
        );

        fileId = eventFile.id;
      }

      const trainingData = {
        ProgramTitle: programTitle,
        Platform: platform,
        Venue: venue,
        Participants: participants,
        TrainingProvider: trainingProvider,
        TimeFrom: timeFrom,
        TimeTo: timeTo,
        FromDate: fromDate,
        ToDate: toDate,
        CreatedBy: req.user.employee_id,
        EventFileId: fileId,
      };

      const insertTraining = await Announcement.setTraining(
        trainingData,
        txn,
        "DateCreated",
      );

      return {
        training: insertTraining,
        fileId: fileId,
      };
    });

    if (!result || !result.training) {
      return res.status(500).json({ message: "Internal Server Error" });
    }

    return res.status(200).json({
      message: "Success schedule of training.",
      trainingId: result.training.Id,
      fileId: result.fileId,
    });
  } catch (error) {
    console.error("Transaction error:", error);
    return res.status(500).json({
      message: "Failed to create training schedule.",
      error: error.message,
    });
  }
};

const eventsInCalendar = async (req, res) => {
  const loggedUser = req.user.employee_id;

  const events = await Announcement.eventsInCalendar(loggedUser);

  if (!events || events.length === 0)
    return res
      .status(201)
      .json({ message: "No events have been set in the calendar" });

  const formattedEvents = events.map((row) => ({
    ...row,
    timeCombine: `${formatDate({ date: row.timeFrom, timeOnly: true })} - ${formatDate({ date: row.timeTo, timeOnly: true })}`,
    dateCombine: `${formatDate({ date: row.fromDate, dateOnly: true })} - ${formatDate({ date: row.toDate, dateOnly: true })}`,
    fileContent: row.fileContent ? row.fileContent.toString("base64") : null,
  }));

  return res.status(200).json(formattedEvents);
};

const verifyEventOwnership = async (loggedUser, id, res) => {
  const checkOwner = await Announcement.checkOwnership(loggedUser, id);

  if (!checkOwner || (Array.isArray(checkOwner) && checkOwner.length === 0)) {
    res.status(404).json({
      message: "You are not authorized to perform this action on this event.",
    });
    return false;
  }

  return true;
};

const executeEventUpdate = async (updateData, whereConditions, txn) => {
  const result = await Announcement.updateEvent(
    updateData,
    whereConditions,
    txn,
    "DateUpdated",
  );

  if (!result || (Array.isArray(result) && result.length === 0)) {
    return null;
  }

  return result;
};

const removeSetSchedule = async (req, res) => {
  const loggedUser = req.user.employee_id;
  const { id } = req.body;

  const isAuthorized = await verifyEventOwnership(loggedUser, id, res);
  if (!isAuthorized) return;

  const updateStatus = await sqlHelper.transact(async (txn) => {
    return await executeEventUpdate(
      { Active: 0, UpdatedBy: loggedUser },
      { Id: id, CreatedBy: loggedUser },
      txn,
    );
  });

  if (!updateStatus) {
    return res.status(404).json({ message: "No event found to remove." });
  }

  return res.status(200).json({
    message: "Successfully removed scheduled event.",
  });
};

const updateSetSchedule = async (req, res) => {
  const loggedUser = req.user.employee_id;
  const {
    id,
    programTitle,
    platform,
    venue,
    participants,
    trainingProvider,
    timeFrom,
    timeTo,
    fromDate,
    toDate,
    eventFileId,
    fileData,
  } = req.body;

  if (
    !programTitle ||
    !venue ||
    !timeFrom ||
    !timeTo ||
    !fromDate ||
    !toDate ||
    !platform
  ) {
    return res.status(400).json({
      message: "Missing required fields.",
    });
  }

  const isAuthorized = await verifyEventOwnership(loggedUser, id, res);
  if (!isAuthorized) return;

  const updateData = {
    ProgramTitle: programTitle,
    Platform: platform,
    Venue: venue,
    Participants: participants,
    TrainingProvider: trainingProvider,
    TimeFrom: timeFrom,
    TimeTo: timeTo,
    FromDate: fromDate,
    ToDate: toDate,
    UpdatedBy: loggedUser,
  };

  const updateStatus = await sqlHelper.transact(async (txn) => {
    if (!fileData || Object.keys(fileData).length === 0) {
      updateData.EventFileId = null;
    }

    const eventUpdateResult = await Announcement.updateEvent(
      "HR..TrainingCalendar",
      updateData,
      { Id: id, CreatedBy: loggedUser },
      txn,
      "DateUpdated",
    );

    if (!eventUpdateResult) {
      throw new Error("Event update failed.");
    }

    if (fileData && Object.keys(fileData).length > 0) {
      const { fileName, fileSize, fileType, fileContent } = fileData;

      await Announcement.updateEvent(
        "HR..EventFiles",
        {
          Name: fileName,
          Size: fileSize,
          Type: fileType,
          Content: Buffer.from(fileContent, "base64"),
          UploadedBy: loggedUser,
        },
        { Id: eventFileId },
        txn,
        "DateTimeUploaded",
      );
    }

    return eventUpdateResult;
  });

  if (!updateStatus || updateStatus.error) {
    return res.status(404).json({
      message: `${updateStatus.error ? updateStatus.error : "Event not found or no changes made."} `,
    });
  }

  return res.status(200).json({
    message: "Successfully updated event.",
    data: updateStatus,
  });
};

module.exports = {
  getAnnouncements,
  setTraining,
  eventsInCalendar,
  removeSetSchedule,
  updateSetSchedule,
  initClamAV,
  scanFileForVirus,
};

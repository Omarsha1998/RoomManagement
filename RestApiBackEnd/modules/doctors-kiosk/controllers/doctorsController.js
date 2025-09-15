const sqlHelper = require("../../../helpers/sql.js");
const util = require("../../../helpers/util.js");
const doctorsModel = require("../models/doctorsModel.js");
const fs = require("fs-extra");
const path = require("path");
const bcrypt = require("bcrypt");
const tools = require("../../../helpers/tools.js");

const convertImageToBase64 = async (image) => {
  const imageData = await fs.readFile(image);
  return imageData.toString("base64");
};

const insertImageBase64 = async () => {
  try {
    const imagesDirectory = path.join(__dirname, "../images");
    const imageFiles = await fs.readdir(imagesDirectory);

    for (const file of imageFiles) {
      const imagePath = path.join(imagesDirectory, file);
      const code = path.parse(file).name;
      const extension = path.extname(file).toLowerCase();

      const validImageTypes = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
      if (validImageTypes.includes(extension)) {
        const base64Image = await convertImageToBase64(imagePath);
        await doctorsModel.insertImageBase64(
          base64Image,
          code,
          extension.substring(1),
        );
      } else {
        console.warn(
          `Skipping non-image file: ${file} (extension: ${extension})`,
        );
      }
    }
  } catch (error) {
    console.error("Error processing images:", error);
  }
};

const getServices = async (req, res) => {
  const result = await doctorsModel.getServices();
  if (!result) return res.status(500).json(null);

  res.status(200).json(result);
};

const getWellness = async (req, res) => {
  const result = await doctorsModel.getWellness();
  if (!result) return res.status(500).json(null);
  res.status(200).json(result);
};

// const getDoctors = async (req, res) => {
//   const { departmentName = "", doctorName = "", hmo = "" } = req.body || {};

//   const result = await sqlHelper.transact(async (txn) => {
//     const doctors = await doctorsModel.getDoctors({
//       departmentName,
//       doctorName,
//       hmo,
//       secretaryDoctor: false,
//       secretaryCode: null,
//       txn,
//     });

//     for (const item of doctors) {
//       if (item.isOnDuty === 0 && item.dateTimeIn && !item.dateTimeOut) {
//         await doctorsModel.updateDoctorAttendance(item.id, txn);
//       }

//       if (item.picture) {
//         const base64 = Buffer.from(item.picture).toString("base64");
//         item.picture = `data:image/jpeg;base64,${base64}`;
//       }
//     }

//     return doctors;
//   });

//   if (!result || result.length === 0) {
//     return res.status(201).json({ body: "No doctors found." });
//   }

//   res.status(200).json(result);
// };

const getDoctors = async (req, res) => {
  const { departmentName = "", doctorName = "", hmo = "" } = req.body || {};

  const result = await sqlHelper.transact(async (txn) => {
    const doctors = await doctorsModel.getDoctors({
      departmentName,
      doctorName,
      hmo,
      secretaryDoctor: false,
      secretaryCode: null,
      txn,
    });

    for (const item of doctors) {
      if (item.isOnDuty === 0 && item.dateTimeIn && !item.dateTimeOut) {
        await doctorsModel.updateDoctorAttendance(item.id, txn);
      }

      // if (item.picture) {
      //   const base64 = Buffer.from(item.picture).toString("base64");
      //   item.picture = `data:image/jpeg;base64,${base64}`;
      // }
    }

    return doctors;
  });

  if (!result || result.length === 0) {
    return res.status(201).json({ body: "No doctors found." });
  }

  res.status(200).json(result);
};

const getSpecialization = async (req, res) => {
  const result = await doctorsModel.getSpecialization();
  if (!result) return res.status(500).json(null);
  res.status(200).json(result);
};

const getHmos = async (req, res) => {
  const result = await doctorsModel.getHmos();
  if (!result) return res.status(500).json(null);
  res.status(200).json(result);
};

const getDoctorsDepartment = async (req, res) => {
  const result = await doctorsModel.getDoctorsDepartment();
  if (!result) return res.status(500).json(null);
  res.status(200).json(result);
};

// const getPicture = async (req, res) => {
//   const employeeCodes = req.query.employeeCode;
//   const imageData = await doctorsModel.getPicture(employeeCodes);

//   if (imageData.length > 0) {
//     const base64Image = imageData[0].pictureImage.toString("base64");
//     return res.json({
//       pictureId: imageData[0].pictureId,
//       pictureImage: `data:image/jpeg;base64,${base64Image}`,
//     });
//   } else {
//     return res.json({
//       pictureId: imageData ? imageData.pictureId : null,
//       pictureImage: null,
//     });
//   }
// };

const getDoctorHmo = async (req, res) => {
  const { drCode } = req.query;

  const request = await doctorsModel.getDoctorHmo(drCode);
  if (!request) return res.status(500).json(null);

  for (const item of request) {
    if (item.imageFile === null || !item.imageFile) {
      item.imageFile = null;
      continue;
    }

    const base64Image = item.imageFile.toString("base64");
    item.imageFile = `data:image/jpeg;base64,${base64Image}`;
  }

  return res.status(200).json(request);
};

// const generateNewCode = async () => {
//   const year = new Date().getFullYear().toString(); // e.g., "2025"

//   const latestRecord = await sqlHelper.query(
//     "SELECT TOP 1 Code FROM UERMMMC..DoctorSecretaries ORDER BY Code DESC",
//   );

//   let newCode;

//   if (latestRecord.length === 0) {
//     newCode = `${year}001`;
//   } else {
//     const latestCode = latestRecord[0].code;
//     const latestYear = latestCode.slice(0, 4);
//     const latestNumber = parseInt(latestCode.slice(4));

//     if (latestYear === year) {
//       newCode = `${year}${(latestNumber + 1).toString().padStart(3, "0")}`;
//     } else {
//       newCode = `${year}001`;
//     }
//   }

//   return newCode;
// };

const doctorScript = async () => {
  //Updating Doctors Information
  // const items = [
  //   {
  //     doctorEhrCode: "DR05227",
  //     name: "ABELLERA, JOSE M BASSIG III, MD",
  //     areaOfSpecialty: "PEDIATRIC SURGERY",
  //     sched: "VISITING / BY APPOINTMENT",
  //     sked: "VISITING / BY APPOINTMENT",
  //     room: "SURGERY OFFICE",
  //     local: "475",
  //   },
  //   {
  //     doctorEhrCode: "DR01285",
  //     name: "ABOLA, LUIS M.D.",
  //     areaOfSpecialty: "IM-GASTROENTEROLOGY",
  //     sched: "TUES. THURS. 1PM-3PM",
  //     sked: "TUES. THURS. 1PM-3PM",
  //     room: "207",
  //     local: "219",
  //   },
  // ];
  // for (const item of items) {
  //   if (!item.doctorEhrCode || item.doctorEhrCode.trim() === "") {
  //     continue; // Skip this iteration
  //   }
  //   await sqlHelper.transact(async (txn) => {
  //     return await doctorsModel.updateDoctorInformation(
  //       item.doctorEhrCode,
  //       item.name,
  //       item.areaOfSpecialty,
  //       item.sched,
  //       item.sked,
  //       item.room,
  //       item.local,
  //       txn,
  //     );
  //   });
  // }
  //Updating Doctors Information
  //Generating password
  // const allSecretary = await doctorsModel.getAllSecretary();
  // const passwordList = [];
  // for (const item of allSecretary) {
  //   const randomStr = Math.random().toString(36).slice(-8);
  //   const salt = await bcrypt.genSalt(8);
  //   const hashedPassword = await bcrypt.hash(randomStr, salt);
  //   passwordList.push({
  //     secretaryCode: item.code,
  //     password: randomStr,
  //     secretaryName: item.name,
  //     contactNumber: item.contactNumber,
  //   });
  //   await sqlHelper.transact(async (txn) => {
  //     return await doctorsModel.updateSecretaryPassword(
  //       {
  //         Password: hashedPassword,
  //       },
  //       { Code: item.code },
  //       txn,
  //       "DateUpdated",
  //     );
  //   });
  // }
  //Inserting Assign doctors in every secretaries
  // const items = [
  //   {
  //     doctor: "ABELLA, JANELLA JILLIAN GILO  [11015]",
  //     segretaries: "",
  //   },
  //   {
  //     doctor: "ABELLERA, JOSE M BASSIG III, MD [522]",
  //     segretaries: "",
  //   },
  // ];
  // const extractCode = (text) => {
  //   if (!text) return null; // Handle null, undefined, or empty string
  //   const match = text.match(/\[(.*?)\]/);
  //   return match ? match[1] : null;
  // };
  // for (const item of items) {
  //   const extractedDoctorCode = extractCode(item.doctor);
  //   const extractedSecretaryCode = extractCode(item.segretaries);
  //   if (!extractedSecretaryCode) continue;
  //   await sqlHelper.transact(async (txn) => {
  //     return await doctorsModel.insertSecretary(
  //       {
  //         SecretaryCode: extractedSecretaryCode,
  //         DoctorCode: extractedDoctorCode,
  //         CreatedBy: "8958",
  //       },
  //       txn,
  //       "DateTimeCreated",
  //     );
  //   });
  // }
  //Inserting Secretaries
  // const secretaries = [
  //   {
  //     roomNumber: "106",
  //     secretaryName: "Carmelita Garrovillas Tubig",
  //     nickname: "Lita",
  //     contactNumber: "09065505086",
  //     address:
  //       "Unit 421 Henricson Bldg., 131 Aurora Blvd. Brgy. Salapan San Juan City",
  //     birthdate: "08/11/1963",
  //     secretaryCode: "DSEC00046",
  //   },
  //   {
  //     roomNumber: "Anesthesia Department",
  //     secretaryName: "Jocylen Bala Concepcion",
  //     nickname: "Jo",
  //     contactNumber: "09338770732",
  //     address: "#6 St. Paul St., Horseshoe Village Quezon City",
  //     birthdate: "09/01/1973",
  //     secretaryCode: "DSEC00052",
  //   },
  // ];
  // const generatePassword = async () => {
  //   const randomStr = Math.random().toString(36).slice(-10);
  //   const salt = await bcrypt.genSalt(10);
  //   return await bcrypt.hash(randomStr, salt);
  // };
  // for (const sec of secretaries) {
  //   const contactNumbers = sec.contactNumber
  //     .split("/")
  //     .map((num) => num.trim());
  //   const contactNumber = contactNumbers[0] || null;
  //   const contactNumber2 = contactNumbers[1] || null;
  //   await sqlHelper.transact(async (txn) => {
  //     return await doctorsModel.insertDoctor(
  //       {
  //         Name: sec.secretaryName,
  //         Email: sec.emailAddress ? sec.emailAddress : null,
  //         ContactNumber: contactNumber,
  //         ContactNumber2: contactNumber2,
  //         Code: sec.secretaryCode ? sec.secretaryCode : null,
  //         Password: await generatePassword(),
  //         IsActive: 1,
  //       },
  //       txn,
  //       "DateCreated",
  //     );
  //   });
  // }
};

const getSecretaryDoctors = async (req, res) => {
  try {
    const { secretaryCode } = req.query;

    if (!secretaryCode) {
      return res.status(400).json({ error: "Missing secretaryCode" });
    }

    const result = await sqlHelper.transact(async (txn) => {
      const doctors = await doctorsModel.getDoctors({
        departmentCode: "",
        doctorName: "",
        gender: "",
        hmo: "",
        secretaryDoctor: true,
        secretaryCode,
        txn,
      });
      for (const item of doctors) {
        item.dateTimeIn = item.dateTimeIn
          ? util.formatDate({ date: item.dateTimeIn })
          : null;

        item.dateTimeOut = item.dateTimeOut
          ? util.formatDate({ date: item.dateTimeOut })
          : null;

        if (item.picture) {
          const base64 = Buffer.from(item.picture).toString("base64");
          item.picture = `data:image/jpeg;base64,${base64}`;
        }
      }

      return doctors;
    });

    if (!result || result.length === 0) {
      return res
        .status(204)
        .json({ body: "No doctors found for the secretary." });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const checkDoctorAttendance = async (req, res) => {
  const { doctorCodeParam } = req.query;
  const result = await doctorsModel.checkAttendance(doctorCodeParam);

  if (result.length > 0) {
    if (result[0].dateTimeIn && result[0].dateTimeOut) {
      return res.status(200).json({
        body: "Are you sure you want to log the doctor's Time-In?",
      });
    }
    return res.status(201).json({
      body: `The doctor already has a recorded Time-In. Your update will mark the doctor as Timed-Out. Are you sure you want to proceed?  
        
        If you did not log a Time-In and are unsure, please refresh the page to see the updated the doctor's status. 
        Additionally, consider checking with other secretaries for any previous Time-In records.`,
    });
  }

  return res.status(200).json({
    body: `Are you sure you want to log the doctor's Time-In?`,
  });
};

const updateDoctorStatus = async (req, res) => {
  try {
    const { doctorEhrCode } = req.body;

    const checkAttendance = await doctorsModel.checkAttendance(doctorEhrCode);
    const { employeeId: loggedInSecretaryCode } = req.user;

    const currentDate = new Date();

    const insertTimeIn = async () => {
      return await sqlHelper.transact(async (txn) => {
        return await doctorsModel.insertDoctorAttendance(
          {
            DoctorCode: doctorEhrCode,
            CreatedBy: loggedInSecretaryCode,
            DateTimeIn: currentDate,
          },
          txn,
          "DateTimeCreated",
        );
      });
    };

    if (checkAttendance.length > 0) {
      const { dateTimeIn, dateTimeOut, id } = checkAttendance[0];

      if (dateTimeIn && dateTimeOut) {
        const insertAttendance = await insertTimeIn();
        if (!insertAttendance) {
          return res
            .status(500)
            .json({ body: "Failed to insert time-in record." });
        }
        return res
          .status(201)
          .json({ body: "Doctor time-in recorded successfully." });
      }

      if (dateTimeIn && !dateTimeOut) {
        await sqlHelper.transact(async (txn) => {
          await doctorsModel.updateDoctorAttendance(id, txn);
        });
        return res
          .status(201)
          .json({ body: "Doctor time-out recorded successfully." });
      }
    }

    const insertAttendance = await insertTimeIn();
    if (!insertAttendance) {
      return res.status(500).json({ body: "Failed to insert time-in record." });
    }
    return res
      .status(201)
      .json({ body: "Doctor time-in recorded successfully." });
  } catch (error) {
    return res.status(500).json({ body: "Internal server error." });
  }
};

const sendSmsSecretaryDetails = async (
  secretaryCode,
  secretaryName,
  contactNumber,
  password,
) => {
  const secretaryDetails = [
    {
      secretaryCode: secretaryCode,
      password: password,
      secretaryName: secretaryName,
      contactNumber: contactNumber,
    },
  ];

  const urlLogin = "https://local.uerm.edu.ph/md-link/#/login";

  for (const item of secretaryDetails) {
    const message = {
      text: `Hello, Good Morning Mr./Mrs. ${item.secretaryName}!\nThis is from UERM IT Department.\nBelow are your credentials for logging into the Doctor Kiosk:\n${urlLogin}\n\nSecretary Code: ${item.secretaryCode}\nPassword: ${item.password}\n\nYou can enter only the numbers in your Secretary Code, or you may include "DSEC"—both will work fine.\nIf you experience any login issues, please contact the UERM IT Office.`,
      destination: item.contactNumber,
    };

    await tools.sendSMSInsertDB(null, message, false);
  }
};

const getAllSecretaryWithDoctors = async (req, res) => {
  const result = await doctorsModel.getAllSecretaryWithDoctors();
  if (!result) res.status(500).json(null);
  res.status(200).json(result);
};

const removeDoctorInSecretary = async (req, res) => {
  const { id } = req.body;
  const updateDoctorAssignment = await sqlHelper.transact(async (txn) => {
    return await doctorsModel.updateDoctorAssignment(
      {
        IsDeleted: 1,
      },
      { Id: id },
      txn,
      "DateTimeUpdated",
    );
  });

  if (!updateDoctorAssignment) res.status(500).json(null);

  res
    .status(200)
    .json({ body: "Success updating doctor secretary assignment" });
};

const generatedPassword = (length = 10) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (const _ of Array.from({ length })) {
    const randomChar = charset.charAt(
      Math.floor(Math.random() * charset.length),
    );
    password += randomChar;
  }

  return password;
};

const generatePassword = async () => {
  let plainPassword;
  let hashedPassword;
  let isDuplicate = true;

  const existingPasswords = await doctorsModel.existingPassword();

  while (isDuplicate) {
    plainPassword = generatedPassword(10);
    hashedPassword = await bcrypt.hash(plainPassword, 10);

    const duplicates = await Promise.all(
      existingPasswords.map(({ password }) =>
        bcrypt.compare(plainPassword, password),
      ),
    );

    isDuplicate = duplicates.includes(true);
  }

  return { hashedPassword, plainPassword };
};

const addDoctorAssignment = async (req, res) => {
  const {
    doctorCodes,
    secretaryName,
    secretaryCode,
    secretaryNickname,
    secretaryContactNumber,
    addNew,
  } = req.body;
  const { employeeId: loggedInSecretaryCode } = req.user;

  const responses = [];

  if (addNew === true) {
    const checkSecretaryData = await doctorsModel.checkSecretaryData(
      secretaryCode,
      secretaryName,
    );

    if (checkSecretaryData.length > 0) {
      return res.status(409).json({
        body: "The Secretary code/name has already data kindly check the list of secretary.",
      });
    }

    const { hashedPassword, plainPassword } = await generatePassword();

    const insertNewSecretary = await sqlHelper.transact(async (txn) => {
      return await doctorsModel.insertNewSecretary(
        {
          Code: secretaryCode,
          Name: secretaryName,
          ContactNumber: secretaryContactNumber,
          NickName: secretaryNickname,
          Password: hashedPassword,
          IsActive: 1,
        },
        txn,
        "DateCreated",
      );
    });

    if (!insertNewSecretary || insertNewSecretary.length === 0) {
      return res.status(500).json({
        message: "Failed to insert new secretary.",
      });
    }

    await sendSmsSecretaryDetails(
      secretaryCode,
      secretaryName,
      secretaryContactNumber,
      plainPassword,
    );
  }

  for (const doctorCode of doctorCodes) {
    const checkLogs = await doctorsModel.checkLogDoctorAssignment(
      doctorCode.doctorEhrCode,
      secretaryCode,
    );

    if (checkLogs.length > 0) {
      if (checkLogs[0].isDeleted === true) {
        const updateDoctorAssignment = await sqlHelper.transact(async (txn) => {
          return await doctorsModel.updateDoctorAssignment(
            { IsDeleted: 0 },
            { Id: checkLogs[0].id },
            txn,
            "DateTimeUpdated",
          );
        });

        if (!updateDoctorAssignment) {
          return res
            .status(500)
            .json({ message: "Failed to update doctor assignment" });
        }

        responses.push(`Updated doctor ${doctorCode.doctorEhrCode}`);
        continue;
      }

      responses.push(`Doctor ${doctorCode.doctorEhrCode} already assigned`);
      continue;
    }

    const insertDoctorAssignment = await sqlHelper.transact(async (txn) => {
      return await doctorsModel.insertDoctorAssignment(
        {
          DoctorCode: doctorCode.doctorEhrCode,
          SecretaryCode: secretaryCode,
          CreatedBy: loggedInSecretaryCode,
        },
        txn,
        "DateTimeCreated",
      );
    });

    if (!insertDoctorAssignment) {
      return res
        .status(500)
        .json({ message: "Failed to add doctor assignment" });
    }

    responses.push(`Added doctor ${doctorCode.doctorEhrCode}`);
  }

  return res.status(200).json({
    message: "Adding doctor assignemnt successfull",
    results: responses,
  });
};

const resetSecretaryPassword = async (req, res) => {
  const { secretaryCode } = req.body;

  const allSecretary = await doctorsModel.getAllSecretary();
  const existing = allSecretary.find((sec) => sec.Code === secretaryCode);

  if (!existing || existing.length === 0) {
    return res.status(404).json({ message: "Secretary not found." });
  }

  const { hashedPassword, plainPassword } = await generatePassword();

  const updated = await sqlHelper.transact(async (txn) => {
    return await doctorsModel.updateSecretaryPassword(
      {
        Password: hashedPassword,
      },
      { Code: secretaryCode },
      txn,
      "DateTimeUpdated",
    );
  });

  if (!updated) {
    return res.status(500).json({ message: "Failed to reset password." });
  }

  await sendSmsSecretaryDetails(
    secretaryCode,
    existing[0].name,
    existing[0].contactNumber,
    plainPassword,
  );

  return res.status(200).json({ message: "Password reset successfully." });
};

const checkDoctorTimeOutDaily = async () => {
  await sqlHelper.transact(async (txn) => {
    const doctors = await doctorsModel.checkDoctorTimeOutDaily();
    for (const item of doctors) {
      const d = new Date(item.dateTimeIn);
      const dateTimeInWith8PMUTC = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 20),
      );

      const currentDateTime = new Date();

      if (currentDateTime > dateTimeInWith8PMUTC) {
        await doctorsModel.updateDoctorAttendance(item.id, txn);
      }
    }
  });
};

// const getFilePicture = async (req, res) => {
//   const code = req.params.id;
//   const pictureDb = await doctorsModel.getPicture(code);

//   if (pictureDb.length > 0 && pictureDb[0].picture) {
//     const imageBuffer = pictureDb[0].picture;
//     const base64Image = imageBuffer.toString("base64");
//     return res.end(base64Image);
//   }

//   // No image found, return 204 (No Content) or a default fallback
//   return res.status(204).end();
// };

const getFilePicture = async (req, res) => {
  const code = req.params.id;
  const pictureDb = await doctorsModel.getPicture(code);

  if (pictureDb.length > 0 && pictureDb[0].picture) {
    const imageBuffer = pictureDb[0].picture;
    const base64Image = imageBuffer.toString("base64");

    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    return res.json({ image: dataUrl });
  }

  return res.json({ image: null });
};

const getPicture = async (req, res) => {
  const { ehrCode, code } = req.query;
  const pictureDb = await doctorsModel.getPicture(ehrCode, code);
  let pictureImage;

  // if (item.picture) {
  //     const base64 = Buffer.from(item.picture).toString("base64");
  //     item.picture = `data:image/jpeg;base64,${base64}`;
  //   }

  if (pictureDb.length > 0) {
    for (const picture of pictureDb) {
      const base64 = Buffer.from(picture.pictureData).toString("base64");
      pictureImage = `data:image/jpeg;base64,${base64}`;
    }

    return res.status(200).json(pictureImage);
  }

  pictureImage = null;
  return res.status(204).json(pictureImage);

  // for (const picture of pictureDb) {
  //   pictureImage;
  // }
  // const pictureDb = await doctorsModel.getPicture(code);

  // for (const item of pictureDb) {
  //   if (item.picture) {
  //     const base64 = Buffer.from(item.picture).toString("base64");
  //     item.picture = `data:image/jpeg;base64,${base64}`;
  //   }
  // }

  // if (pictureDb.length > 0) {
  //   return res.end(pictureDb[0].picture);
  // }

  // return res.status(204).end();
};

const doctorContacts = async (req, res) => {
  const doctorCode = req.params.doctorEhrCode;

  const contacts = await doctorsModel.doctorContacts(doctorCode);

  if (!contacts || contacts.length === 0) {
    return res.status(204).json(null);
  }

  return res.status(200).json(contacts);
};

const doctorSchedule = async (req, res) => {
  const doctorCode = req.params.doctorEhrCode;

  const schedule = await doctorsModel.doctorSchedule(doctorCode);

  if (!schedule || schedule.length === 0) {
    return res.status(204).json(null);
  }

  return res.status(200).json(schedule);
};

const doctorEducation = async (req, res) => {
  const doctorCode = req.params.doctorEhrCode;
  const education = await doctorsModel.doctorEducation(doctorCode);

  if (!education || education.length === 0) {
    return res.status(204).json(null);
  }

  return res.status(200).json(education);
};
const updateFunction = async (
  updateData,
  whereClause,
  updateModel,
  dateTimeClause,
  txn,
) => {
  return await doctorsModel[updateModel](
    updateData,
    whereClause,
    txn,
    dateTimeClause,
  );
};

const processUpdateData = async (
  data,
  whereKey,
  updateModel,
  updatedByField,
  updatedBy,
  dateTimeClause,
  txn,
) => {
  const updateData = {};
  const whereClause = {};

  for (const object of Object.values(data)) {
    for (const [key, value] of Object.entries(object)) {
      if (key === whereKey) {
        whereClause[key] = value !== undefined ? value : null;
      } else {
        updateData[key] = value !== undefined ? value : null;
      }
    }
  }

  updateData[updatedByField] = updatedBy;

  return await updateFunction(
    updateData,
    whereClause,
    updateModel,
    dateTimeClause,
    txn,
  );
};

const processSpecialtiesAndHmo = async (
  doctorEhrCode,
  item,
  updatedBy,
  txn,
  updateModel,
  value,
) => {
  if (updateModel === "updateSpecDept") {
    return await doctorsModel[updateModel](
      {
        Active: value,
        CreatedBy: updatedBy,
      },
      { SpecialtyCode: item, DoctorEHRCode: doctorEhrCode },
      txn,
      "DateTimeCreated",
    );
  } else {
    return await doctorsModel[updateModel](
      {
        DELETED: value,
        CreatedBy: updatedBy,
      },
      { "[DR CODE]": doctorEhrCode, "[HMO CODE]": item },
      txn,
      "LastUpdate",
    );
  }

  // return await sqlHelper.transact(async (txn) => {
  //   return await doctorsModel.updateSpecDept(
  //     {
  //       Active: activeValue,
  //       CreatedBy: updatedBy,
  //     },
  //     { SpecialtyCode: specialtyCode, DoctorEHRCode: doctorEhrCode },
  //     txn,
  //     "DateTimeCreated",
  //   );
  // });
};

const processInsert = async (
  doctorEhrCode,
  codeValue,
  txn,
  dateTimeClause,
  createBy,
  table,
) => {
  if (table === "specialty") {
    return await doctorsModel.insertDoctorSpecialist(
      {
        SpecialtyCode: codeValue,
        DoctorEHRCode: doctorEhrCode,
        createdBy: createBy,
        Active: 1,
      },
      txn,
      dateTimeClause,
    );
  } else if (table === "hmo") {
    return await doctorsModel.insertDoctorHmo(
      {
        "[DR CODE]": doctorEhrCode,
        "[HMO CODE]": codeValue,
        DELETED: 0,
        CreatedBy: createBy,
      },
      txn,
      dateTimeClause,
    );
  } else if (table === "contact") {
    return await doctorsModel.insertContact(
      {
        DoctorCode: doctorEhrCode,
        Type: "LANDLINE_PHONE",
        Value: codeValue ? codeValue.value : null,
        Local: codeValue ? codeValue.local : null,
        Direct: codeValue ? codeValue.direct : null,
        CreatedBy: createBy,
      },
      txn,
      dateTimeClause,
    );
  } else if (table === "schedule") {
    return await doctorsModel.insertSchedule(
      {
        DoctorCode: doctorEhrCode,
        Day: codeValue ? codeValue.day : null,
        TimeFrom: codeValue ? codeValue.timeFrom : null,
        TimeTo: codeValue ? codeValue.timeTo : null,
        ConsultationTypeCode: codeValue ? codeValue.consultationTypeCode : null,
        CreatedBy: createBy,
      },
      txn,
      dateTimeClause,
    );
  } else {
    throw new Error(`Unknown table type: ${table}`);
  }
};

const passUpdatedData = async (
  data,
  doctorEhrCode,
  updatedBy,
  txn,
  checkModel,
) => {
  const inserts = [];
  for (const item of data) {
    const checkSpec = await doctorsModel[checkModel](doctorEhrCode, item, txn);
    if (checkSpec.length === 0) {
      const inserted = await processInsert(
        doctorEhrCode,
        item,
        txn,
        checkModel === "checkHmo" ? "DateCreated" : "DateTimeCreated",
        updatedBy,
        checkModel === "checkHmo" ? "hmo" : "specialty",
      );
      inserts.push(inserted);
    } else {
      if (checkSpec[0].dELETED === true || checkSpec[0].active === false) {
        const updateModel =
          checkModel === "checkHmo" ? "updateHmo" : "updateSpecDept";

        const value = updateModel === "updateHmo" ? 0 : 1;
        const updated = await processSpecialtiesAndHmo(
          doctorEhrCode,
          item,
          updatedBy,
          txn,
          updateModel,
          value,
        );

        inserts.push(updated);
      }
    }
  }

  return inserts;
  // return await sqlHelper.transact(async (txn) => {
  //   const inserts = [];
  //   for (const item of data) {
  //     const checkSpec = await doctorsModel.checkSpec(doctorEhrCode, item, txn);
  //     if (checkSpec.length === 0) {
  //       const inserted = await processInsert(
  //         doctorEhrCode,
  //         item,
  //         txn,
  //         "DateTimeCreated",
  //         updatedBy,
  //         "specialty",
  //       );
  //       inserts.push(inserted);
  //     } else {
  //       const inserted = await processSpecialtiesAndHmo(
  //         doctorEhrCode,
  //         item,
  //         updatedBy,
  //         1,
  //       );
  //       inserts.push(inserted);
  //     }
  //   }
  //   return inserts;
  // });
};

const updateDoctor = async (req, res) => {
  const [data] = req.body;
  const { employeeId: updatedBy } = req.user;
  const { docInfo, scheduleData, contactData, docSpecialty, docHmo } = data;

  const result = await sqlHelper.transact(async (txn) => {
    const updateResult = [];

    if (docInfo.length > 0 && Object.keys(docInfo[0]).length > 0) {
      const update = await processUpdateData(
        docInfo,
        "EHR_CODE",
        "updateDoctor",
        "LastUpdatedBy",
        updatedBy,
        "LastUpdateDate",
        txn,
      );
      updateResult.push(update);
    }

    if (contactData.length > 0 && Object.keys(contactData[0]).length > 0) {
      const { doctorEhrCode, id, value, direct, local } = contactData[0];
      const filteredData = contactData.map(
        ({ doctorEhrCode, ...rest }) => rest,
      );

      if (id) {
        const update = await processUpdateData(
          filteredData,
          "id",
          "updateContact",
          "CreatedBy",
          updatedBy,
          "DateTimeCreated",
          txn,
        );
        updateResult.push(update);
      } else {
        const insert = await processInsert(
          doctorEhrCode,
          contactData[0],
          txn,
          "DateTimeCreated",
          updatedBy,
          "contact",
        );
        updateResult.push(insert);
      }
    }

    if (scheduleData.length > 0) {
      for (const sched of scheduleData) {
        const checkIfNew =
          typeof sched.id === "string" && sched.id.startsWith("New");

        if (checkIfNew) {
          const insert = await processInsert(
            sched.doctorCode,
            sched,
            txn,
            "DateTimeCreated",
            updatedBy,
            "schedule",
          );
          updateResult.push(insert);
        } else {
          const updateData = [sched];
          const update = await processUpdateData(
            updateData,
            "id",
            "updateSchedule",
            "CreatedBy",
            updatedBy,
            "DateTimeCreated",
            txn,
          );
          updateResult.push(update);
        }
      }
    }

    if (docSpecialty.length > 0) {
      for (const item of docSpecialty) {
        const {
          doctorEhrCode,
          specialties,
          departments,
          missingOrigSpecialties,
          missingOrigDepartments,
        } = item;

        if (specialties.length > 0) {
          const insertData = await passUpdatedData(
            specialties,
            doctorEhrCode,
            updatedBy,
            txn,
            "checkSpecialty",
          );
          updateResult.push(insertData);
        }

        if (departments.length > 0) {
          const insertData = await passUpdatedData(
            departments,
            doctorEhrCode,
            updatedBy,
            txn,
            "checkSpecialty",
          );
          updateResult.push(insertData);
        }

        if (missingOrigDepartments.length > 0) {
          for (const missingDept of missingOrigDepartments) {
            const update = await processSpecialtiesAndHmo(
              doctorEhrCode,
              missingDept,
              updatedBy,
              txn,
              "updateSpecDept",
              0,
            );
            updateResult.push(update);
          }
        }

        if (missingOrigSpecialties.length > 0) {
          for (const missingSpec of missingOrigSpecialties) {
            const update = await processSpecialtiesAndHmo(
              doctorEhrCode,
              missingSpec,
              updatedBy,
              txn,
              "updateSpecDept",
              0,
            );
            updateResult.push(update);
          }
        }
      }
    }

    if (docHmo.length > 0) {
      for (const item of docHmo) {
        const { doctorEhrCode, hmo, missingHmo } = item;

        if (hmo.length > 0) {
          const insertData = await passUpdatedData(
            hmo,
            doctorEhrCode,
            updatedBy,
            txn,
            "checkHmo",
          );
          updateResult.push(insertData);
        }

        if (missingHmo.length > 0) {
          for (const hmo of missingHmo) {
            const update = await processSpecialtiesAndHmo(
              doctorEhrCode,
              hmo,
              updatedBy,
              txn,
              "updateHmo",
              1,
            );

            updateResult.push(update);
          }
        }
      }
    }

    const hasError = updateResult.some((result) => result && result.error);
    const hasSuccess = updateResult.length > 0 && !hasError;

    if (hasSuccess) {
      return {
        success: true,
        message: "Success updating doctor information",
      };
    } else {
      return {
        success: false,
        message: "Fail updating, some updates encountered an error.",
      };
    }

    // if (hasError || updateResult[0].length === 0) {
    //   return {
    //     success: false,
    //     message: "Fail updating, some updates encountered an error.",
    //   };
    // }

    // return {
    //   success: true,
    //   message: "Success updating doctor information",
    // };
  });

  if (result.success) {
    return res.status(200).json({ body: result.message });
  } else {
    return res.status(409).json({ body: result.message });
  }
};

// const updateDoctor = async (req, res) => {
//   const [data] = req.body;

//   const { employeeId: updatedBy } = req.user;

//   const { docInfo, scheduleData, contactData, docSpecialty } = data;

//   const updateResult = [];

//   if (docInfo.length > 0 && Object.keys(docInfo[0]).length > 0) {
//     const update = await processUpdateData(
//       docInfo,
//       "EHR_CODE",
//       "updateDoctor",
//       "LastUpdatedBy",
//       updatedBy,
//       "LastUpdateDate",
//     );
//     updateResult.push(update);
//   }

//   if (contactData.length > 0 && Object.keys(contactData[0]).length > 0) {
//     const { doctorEhrCode, id, value, direct, local } = contactData[0];

//     const filteredData = contactData.map(({ doctorEhrCode, ...rest }) => rest);

//     if (id) {
//       const update = await processUpdateData(
//         filteredData,
//         "id",
//         "updateContact",
//         "CreatedBy",
//         updatedBy,
//         "DateTimeCreated",
//       );
//       updateResult.push(update);
//     } else {
//       const insert = await sqlHelper.transact(async (txn) => {
//         return await await processInsert(
//           doctorEhrCode,
//           contactData[0],
//           txn,
//           "DateTimeCreated",
//           updatedBy,
//           "contact",
//         );
//       });

//       updateResult.push(insert);
//     }
//   }

//   if (scheduleData.length > 0) {
//     for (const sched of scheduleData) {
//       const checkIfNew =
//         typeof sched.id === "string" && sched.id.startsWith("New")
//           ? true
//           : false;

//       if (checkIfNew) {
//         const insert = await sqlHelper.transact(async (txn) => {
//           await processInsert(
//             sched.doctorCode,
//             sched,
//             txn,
//             "DateTimeCreated",
//             updatedBy,
//             "schedule",
//           );
//         });

//         updateResult.push(insert);
//       } else {
//         const updateData = [sched];
//         const update = await processUpdateData(
//           updateData,
//           "id",
//           "updateSchedule",
//           "CreatedBy",
//           updatedBy,
//           "DateTimeCreated",
//         );
//         updateResult.push(update);
//       }
//     }
//   }

//   if (docSpecialty.length > 0) {
//     for (const item of docSpecialty) {
//       const {
//         doctorEhrCode,
//         specialties,
//         departments,
//         missingOrigSpecialties,
//         missingOrigDepartments,
//       } = item;

//       if (specialties.length > 0) {
//         const insertData = await passUpdatedData(
//           specialties,
//           doctorEhrCode,
//           updatedBy,
//           txn,
//           "checkSpecialty"
//         );

//         updateResult.push(insertData);
//       }

//       if (departments.length > 0) {
//         const insertData = await passUpdatedData(
//           departments,
//           doctorEhrCode,
//           updatedBy,
//           txn,
//           "checkSpecialty"
//         );

//         updateResult.push(insertData);
//       }

//       if (missingOrigDepartments.length > 0) {
//         for (const missingDept of missingOrigDepartments) {
//           const update = await processSpecialtiesAndHmo(
//             doctorEhrCode,
//             missingDept,
//             updatedBy,
//             0,
//           );

//           updateResult.push(update);
//         }
//       }

//       if (missingOrigSpecialties.length > 0) {
//         for (const missingSpec of missingOrigSpecialties) {
//           const update = await processSpecialtiesAndHmo(
//             doctorEhrCode,
//             missingSpec,
//             updatedBy,
//             0,
//           );
//           updateResult.push(update);
//         }
//       }
//     }
//   }

//   const hasError = updateResult.some((result) => result && result.error);

//   if (hasError || updateResult.length === 0) {
//     return res.status(409).json({
//       body: "Fail updating, some updates encountered an error.",
//     });
//   }

//   return res.status(200).json({ body: "Success updating doctor information" });
// };

const insertDoctorData = async () => {
  const data = [
    {
      code: "522",
      ehrCode: "DR05227",
      name: "ABELLERA, JOSE M BASSIG III, MD",
      subDepartmentId: "65",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "128",
      ehrCode: "DR01285",
      name: "ABOLA, LUIS E, M.D.",
      subDepartmentId: "19",
      hmoId: "0022, 0005, 0009, 121318, 0007, 0011, 0025, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "296",
      ehrCode: "DR02965",
      name: "ABRAHAM, JOSE BENITO AGUILA, MD",
      subDepartmentId: "69",
      hmoId: "0004, 0022, 0009, 121318, 0007, 0025, 0031, 0015",
      departmentId: "11",
    },
    {
      code: "706",
      ehrCode: "DR07067",
      name: "ACLAN, BELTRAN ALEXIS AMPARO, M.D.",
      subDepartmentId: "47",
      hmoId: "0036, 0004, 0009, 121318, 0025, 0020",
      departmentId: "5",
    },
    {
      code: "2",
      ehrCode: "DR00028",
      name: "ACOSTA, ALLAN RENAN LIMCACO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "11058",
      ehrCode: "DR110587",
      name: "ADAMOS, ELIJAH NONNATUS ALISAGO",
      subDepartmentId: "19",
      hmoId:
        "0036, 0034, 0022, 0028, 0027, 0039, 121319, 0037, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "730",
      ehrCode: "DR07304",
      name: "ADAPON-SAJO, KAREN PESINO",
      subDepartmentId: "",
      hmoId: "22",
      departmentId: "1",
    },
    {
      code: "719",
      ehrCode: "DR07191",
      name: "ADRANEDA, CARLO FELIX HENANDO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "847",
      ehrCode: "DR08473",
      name: "ADUAN, JOEL MERCADO, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "677",
      ehrCode: "DR06776",
      name: "AFOS-GONZALES, IVY ELLINE M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0028, 0027, 0020",
      departmentId: "",
    },
    {
      code: "287",
      ehrCode: "DR02877",
      name: "AGSAOAY, ANTHONY FRANCIS M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "288",
      ehrCode: "DR02886",
      name: "AISON, DEXTER, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "889",
      ehrCode: "DR08899",
      name: "AJERO, MARIE FERNANDA CARDONA , M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0030, 0005, 0009, 121318, 0025",
      departmentId: "5",
    },
    {
      code: "3",
      ehrCode: "DR00037",
      name: "ALABAN, CESAR ALFRED C., M.D.",
      subDepartmentId: "69",
      hmoId:
        "0004, 0022, 0028, 0009, 121318, 0008, 0007, 0027, 0011, 0025, 0031, 0015, 0020, 0040",
      departmentId: "11",
    },
    {
      code: "879",
      ehrCode: "DR08792",
      name: "ALBA, AGNES ALARILLA, M.D., DPPS",
      subDepartmentId: "22",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "134",
      ehrCode: "DR01346",
      name: "ALCANTARA, MARIA MARTINA F., M.D.",
      subDepartmentId: "22",
      hmoId: "0004, 0009, 121318, 0007, 0025, 0015",
      departmentId: "2",
    },
    {
      code: "4",
      ehrCode: "DR00046",
      name: "ALCEDO, NAPOLEON BAGUIO JR., M.D.",
      subDepartmentId: "",
      hmoId:
        "0034, 0018, 0004, 0030, 0028, 0006, 0009, 121318, 0008, 0007, 0027, 0011, 121319, 0033, 0025, 0031, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "578",
      ehrCode: "DR05786",
      name: "ALONSO, JEAN ROSCHELLE MENESES",
      subDepartmentId: "",
      hmoId: "0018, 0004, 0009, 121318, 0011, 121319, 0025",
      departmentId: "6",
    },
    {
      code: "917",
      ehrCode: "DR09171",
      name: "ALVERO, CECILE MARIE YABUT",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "642",
      ehrCode: "DR06420",
      name: "AMABLE, GAIL CULLA",
      subDepartmentId: "20",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "196",
      ehrCode: "DR01966",
      name: "AMABLE, JAY PEE M., M.D.",
      subDepartmentId: "51",
      hmoId: "0004, 0028, 0005, 0009, 121318, 0007, 0011, 0025, 0015, 0020",
      departmentId: "6",
    },
    {
      code: "244",
      ehrCode: "DR02442",
      name: "AMANTE, ANGEL JOAQUIN MANUEL",
      subDepartmentId: "69",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "924",
      ehrCode: "DR09241",
      name: "AMANTE, ANGEL PAULO GOPEZ",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "744",
      ehrCode: "DR07447",
      name: "AMBAT, JOSE MIGUEL JUINIO, MD",
      subDepartmentId: "",
      hmoId: "0009, 121318, 0011, 0025",
      departmentId: "5",
    },
    {
      code: "916",
      ehrCode: "DR09162",
      name: "AMBAT, WILGELMYNA PARADERO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "771",
      ehrCode: "DR07711",
      name: "AMPARO, GENALIN FABUL, M.D.",
      subDepartmentId: "23",
      hmoId:
        "0036, 0034, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0039, 0037, 0033, 0025, 0020, 0035, 0040",
      departmentId: "4",
    },
    {
      code: "408",
      ehrCode: "DR04088",
      name: "AMPARO, JOSE ROBERTO G., M.D",
      subDepartmentId: "23",
      hmoId: "0030, 0028, 0009, 121318, 0027, 0025, 0020",
      departmentId: "2",
    },
    {
      code: "9",
      ehrCode: "DR00091",
      name: "AMPIL, ISAAC DAVID ESGUERRA II M.D",
      subDepartmentId: "60, 62, 23",
      hmoId: "0004, 0009, 121318, 0020",
      departmentId: "11",
    },
    {
      code: "779",
      ehrCode: "DR07793",
      name: "ANASTACIO, ALVIN ANTHONY PATRICIO",
      subDepartmentId: "69",
      hmoId: "0034, 0004, 0009, 121318, 0008, 0011, 0039, 0025, 0035",
      departmentId: "11",
    },
    {
      code: "5",
      ehrCode: "DR00055",
      name: "ANASTACIO, ANTONIO L., M.D.",
      subDepartmentId: "69",
      hmoId:
        "0034, 0004, 0028, 0006, 0009, 121318, 0008, 0007, 0027, 0039, 0025, 0031, 0015, 0020, 0035",
      departmentId: "11",
    },
    {
      code: "6",
      ehrCode: "DR00064",
      name: "ANASTACIO, ROSALINA P., M.D.",
      subDepartmentId: "20",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "8",
      ehrCode: "DR00082",
      name: "ANGELES, ARNOLD M.D.",
      subDepartmentId: "",
      hmoId: "0006, 0009, 121318, 0007, 0025, 0020",
      departmentId: "",
    },
    {
      code: "7",
      ehrCode: "DR00073",
      name: "ANGELES, CAMILLE VANESSA B., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "595",
      ehrCode: "DR05953",
      name: "ANTONIO, CLARO RAYMUNDO OSCILLADA MD",
      subDepartmentId: "21",
      hmoId: "0009, 121318, 0011, 0025",
      departmentId: "2",
    },
    {
      code: "10997",
      ehrCode: "DR109970",
      name: "ARANDIA-BALTAZAR, MARIA RICA F. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "142",
      ehrCode: "DR01425",
      name: "ARCILLA, BERNADETTE B., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "901",
      ehrCode: "DR09010",
      name: "ARELLANO-SIMON, FE-AILEEN F. M.D.",
      subDepartmentId: "14",
      hmoId: "0009, 121318, 0007, 0011, 0025, 0031",
      departmentId: "2",
    },
    {
      code: "798",
      ehrCode: "DR07988",
      name: "ARROSAS, MICHAEL RAMOS",
      subDepartmentId: "19",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0039, 121319, 0033, 0025, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "102",
      ehrCode: "DR01027",
      name: "ARTIAGA-SORIANO, FELICITAS M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "11065",
      ehrCode: "DR110655",
      name: "ASCALON, PHILIP ROMMEL VILLAMATER",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "886",
      ehrCode: "DR08862",
      name: "ASCUE, RONALD ALVIN CARLOS, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "11025",
      ehrCode: "DR110259",
      name: "ATIENZA, JESSA CRISMA MARASIGAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "11",
      ehrCode: "DR00116",
      name: "AURE, FARAH MARGARITA S., MD, DPBA",
      subDepartmentId: "",
      hmoId: "0018, 0022, 0009, 121318, 0007, 0025, 0015, 0020",
      departmentId: "1",
    },
    {
      code: "607",
      ehrCode: "DR06077",
      name: "AZARES, MANUEL RAFAEL RICAFRENTE",
      subDepartmentId: "23",
      hmoId:
        "0004, 0022, 0030, 0028, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 121319, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "13",
      ehrCode: "DR00134",
      name: "AZORES, ROMARICO ROMMEL MORILLA JR. M.D",
      subDepartmentId: "61",
      hmoId: "0009, 121318, 0007, 0011, 0025",
      departmentId: "11",
    },
    {
      code: "291",
      ehrCode: "DR02910",
      name: "AZORES-COBANKIAT, MARY CAROLINE TORRES",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "14",
      ehrCode: "DR00143",
      name: "BABARAN, ALLEN JOHN DOMINIC C., MD, DPBA",
      subDepartmentId: "",
      hmoId: "0022, 0009, 121318, 0025, 0015, 0020",
      departmentId: "1",
    },
    {
      code: "820",
      ehrCode: "DR08206",
      name: "BACUS, RAY ANDREW ALBERTO J.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "802",
      ehrCode: "DR08020",
      name: "BADILLO, STEPHANIE PATRICIA JORDAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "747",
      ehrCode: "DR07474",
      name: "BAGADIONG, ARTHUR JOAQUIN, M.D.",
      subDepartmentId: "14",
      hmoId: "0031, 0015",
      departmentId: "2",
    },
    {
      code: "626",
      ehrCode: "DR06262",
      name: "BAGO-AZARES, MARIEL JOY C. M.D.",
      subDepartmentId: "14",
      hmoId: "0004, 0022, 0009, 121318, 0011, 0025, 0020",
      departmentId: "2",
    },
    {
      code: "573",
      ehrCode: "DR05731",
      name: "BALDERAMA-CALMA, NORIETA M., MD, FPPA, FPSCAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "294",
      ehrCode: "DR02947",
      name: "BALDERAS, JULIET M.D.",
      subDepartmentId: "",
      hmoId: "0022, 0011",
      departmentId: "7",
    },
    {
      code: "915",
      ehrCode: "DR09153",
      name: "BALMORES, MARIE LEN C. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "2, 16",
    },
    {
      code: "1006",
      ehrCode: "DR10061",
      name: "BARONA, JOSUE ANTONIO LEONOR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "18",
      ehrCode: "DR00189",
      name: "BATTAD, GEOFFREY REYES M.D.",
      subDepartmentId: "68",
      hmoId:
        "0004, 0022, 0005, 0009, 121318, 0008, 0011, 121319, 0015, 0020, 0035",
      departmentId: "11",
    },
    {
      code: "17",
      ehrCode: "DR00170",
      name: "BATTAD, GRACE R., M.D.",
      subDepartmentId: "19",
      hmoId: "22",
      departmentId: "7",
    },
    {
      code: "859",
      ehrCode: "DR08598",
      name: "BAUTISTA, FAYE KARISSA LOURDES MARQUEZ",
      subDepartmentId: "24",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0005, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "11016",
      ehrCode: "DR110167",
      name: "BAUTISTA, MARY NICKILOR OSETE",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0030, 0028, 0006, 0008, 0007, 0027, 0039, 121319, 0037, 0033, 0025, 0031, 0029, 0035, 0040",
      departmentId: "",
    },
    {
      code: "298",
      ehrCode: "DR02983",
      name: "BAUTISTA, MILAGROS M.D.",
      subDepartmentId: "24",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "909",
      ehrCode: "DR09092",
      name: "BAUTISTA, REINZI LUZ S. M.D.",
      subDepartmentId: "62, 59",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "299",
      ehrCode: "DR02992",
      name: "BAYAOA, ALEXANDRIA R., M.D.",
      subDepartmentId: "",
      hmoId:
        "0004, 0022, 0030, 0028, 0009, 121318, 0027, 0011, 121319, 0025, 0020",
      departmentId: "6",
    },
    {
      code: "11017",
      ehrCode: "DR110174",
      name: "BEA, ARYANE OSANTOS",
      subDepartmentId: "24",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "20",
      ehrCode: "DR00204",
      name: "BELTRAN, CZARINA KAY C., M.D",
      subDepartmentId: "22",
      hmoId:
        "0018, 0004, 0022, 0028, 0005, 0009, 121318, 0027, 121319, 0025, 0020",
      departmentId: "2",
    },
    {
      code: "574",
      ehrCode: "DR05740",
      name: "BELTRAN-YAP, NINA MARNIE CASTAÑEDA",
      subDepartmentId: "24",
      hmoId: "0004, 0009, 121318, 0011, 0025, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "206",
      ehrCode: "DR02062",
      name: "BERNABE, JACQUELINE DOCTOR",
      subDepartmentId: "",
      hmoId:
        "0034, 0004, 0022, 0030, 0028, 0006, 0009, 121318, 0027, 0011, 0039, 121319, 0025, 0015, 0020",
      departmentId: "7",
    },
    {
      code: "10931",
      ehrCode: "DR109314",
      name: "BETITA, CHRISTIAN PROTACIO GALINATO",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0029, 0020, 0035, 0040",
      departmentId: "27",
    },
    {
      code: "211",
      ehrCode: "DR02114",
      name: "BOCALBOS, ELHAM MAE Z., MD, FPSCAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "655",
      ehrCode: "DR06554",
      name: "BONDOC, MARGARITA JUSTINE M.D",
      subDepartmentId: "45",
      hmoId: "0004, 0009, 121318, 0011, 0031, 0020",
      departmentId: "5",
    },
    {
      code: "23",
      ehrCode: "DR00231",
      name: "BONGALA, DOMINGO JR. S. M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0004, 0022, 0005, 0009, 121318, 0007, 0011, 0025, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "236",
      ehrCode: "DR02363",
      name: "BONGALA, TERESA DIANA B., M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0007, 0027, 0011, 0025, 0031, 0029, 0020",
      departmentId: "4",
    },
    {
      code: "825",
      ehrCode: "DR08251",
      name: "BONGALON-AMO, HELEN BONGALON, M.D.",
      subDepartmentId: "",
      hmoId: "20",
      departmentId: "",
    },
    {
      code: "599",
      ehrCode: "DR05999",
      name: "BONGAT, EDGAR ALLAN BUSTOS M.D",
      subDepartmentId: "19",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0015, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "1005",
      ehrCode: "DR10052",
      name: "BORLAZA, VICTOR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "890",
      ehrCode: "DR08905",
      name: "BRIONES, LEE JEROME FLOR III",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0015, 0020, 0035, 0040",
      departmentId: "5",
    },
    {
      code: "669",
      ehrCode: "DR06697",
      name: "BUENAVENTURA, ROBERT D., MD, FPPA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "838",
      ehrCode: "DR08385",
      name: "BUENVIAJE, JUANITA CARMELA CO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "867",
      ehrCode: "DR08677",
      name: "BUMANGLAG, NIÑA M. M.D.",
      subDepartmentId: "21",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "25",
      ehrCode: "DR00259",
      name: "BUNDOC, JOSEPHINE R., M.D.",
      subDepartmentId: "",
      hmoId: "0011, 0020",
      departmentId: "10",
    },
    {
      code: "183",
      ehrCode: "DR01832",
      name: "BUÑING, MA. CARMERIZA B. M.D.",
      subDepartmentId: "",
      hmoId:
        "0034, 0004, 0022, 0030, 0006, 0009, 121318, 0011, 0039, 0033, 0025, 0031, 0015, 0020",
      departmentId: "4",
    },
    {
      code: "815",
      ehrCode: "DR08154",
      name: "BUQUID, MICHEL A., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "887",
      ehrCode: "DR08871",
      name: "BUSTO, KEIFER JAN TORIO, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "129",
      ehrCode: "DR01294",
      name: "CABAHUG, OSCAR T., M.D.",
      subDepartmentId: "19",
      hmoId: "0004, 0030, 0028, 0005, 0009, 121318, 0020",
      departmentId: "2",
    },
    {
      code: "603",
      ehrCode: "DR06031",
      name: "CABALLES, MARGARITA CONCEPCION TAGBO",
      subDepartmentId: "",
      hmoId: "11",
      departmentId: "7",
    },
    {
      code: "10930",
      ehrCode: "DR109307",
      name: "CABANOS, CHRISTIANNE DEUS",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0030, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "27",
    },
    {
      code: "10951",
      ehrCode: "DR109512",
      name: "CABATAN, GABRIEL",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "557",
      ehrCode: "DR05573",
      name: "CABAZOR, RAQUEL M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0028, 0005, 0009, 121318, 0011, 121319",
      departmentId: "10",
    },
    {
      code: "11026",
      ehrCode: "DR110266",
      name: "CABEBE, CRISTINE MERCY AGUIRRE",
      subDepartmentId: "24",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "592",
      ehrCode: "DR05926",
      name: "CABLITAS, Z. RAYMOND ANTHONY TORRES M.D.",
      subDepartmentId: "69",
      hmoId:
        "0034, 0004, 0022, 0030, 0009, 121318, 0011, 0025, 0031, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "723",
      ehrCode: "DR07234",
      name: "CABUNGCAL, ARSENIO CLARO A., M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "643",
      ehrCode: "DR06439",
      name: "CACAS, MA. THERESA GUESE",
      subDepartmentId: "",
      hmoId: "0009, 121318",
      departmentId: "7",
    },
    {
      code: "10940",
      ehrCode: "DR109406",
      name: "CACERES-CALIMAG, LISSA LUZ",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11018",
      ehrCode: "DR110181",
      name: "CAINGLET, FILLE CLAUDINE NOMBRES",
      subDepartmentId: "68",
      hmoId:
        "0036, 0004, 0028, 0007, 0027, 121319, 0037, 0033, 0031, 0025, 0029, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "514",
      ehrCode: "DR05148",
      name: "CALAVERA, ALMA R., M.D.",
      subDepartmentId: "20",
      hmoId: "0004, 0022, 0030, 0028, 0006, 0009, 121318, 0011, 0025, 0020",
      departmentId: "2",
    },
    {
      code: "307",
      ehrCode: "DR03070",
      name: "CALAVERA, KENNETH ZURAEK M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0028, 0006, 0009, 121318, 0005, 0007, 0027, 0011, 0039, 121319, 0037, 0025, 0031, 0015, 0029, 0020, 0035",
      departmentId: "6",
    },
    {
      code: "28",
      ehrCode: "DR00286",
      name: "CALILAO, MELISSA C., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0009, 121318, 0008, 0011, 0025, 0031",
      departmentId: "7",
    },
    {
      code: "11035",
      ehrCode: "DR110358",
      name: "CALMA, ZEARA ANJELICA SALAVER",
      subDepartmentId: "24",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "293",
      ehrCode: "DR02938",
      name: "CALMA-BALDERRAMA, NORIETA M., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "29",
      ehrCode: "DR00295",
      name: "CAMARA-CHUA, PIA TERESA A., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "598",
      ehrCode: "DR05980",
      name: "CAMUS, KATHERINE B., MD, FPPA, FPSCAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "837",
      ehrCode: "DR08376",
      name: "CANTA, MONICA CELINA VILLAR, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "27",
      ehrCode: "DR00277",
      name: "CAPARAS, LUTGARDO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11033",
      ehrCode: "DR110334",
      name: "CAPIO, KEA TENA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "903",
      ehrCode: "DR09038",
      name: "CAPISTRANO, ROBERTO BOLIVAR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "231",
      ehrCode: "DR02318",
      name: "CAPITULO, RYAN B., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "852",
      ehrCode: "DR08525",
      name: "CARANDANG, MARIA BERNADETT P. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "279",
      ehrCode: "DR02798",
      name: "CARLOS, JOSEFINA C. M.D.",
      subDepartmentId: "",
      hmoId: "22",
      departmentId: "7",
    },
    {
      code: "303",
      ehrCode: "DR03034",
      name: "CARLOS, RENATO M., MD, FPCR, FCTMRISP, FPSVIR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "11048",
      ehrCode: "DR110488",
      name: "CASAS-SIENA, MARIA GLORIA ELISHA CAGAYAT",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "585",
      ehrCode: "DR05856",
      name: "CASTILLO, LEX LYCURGUS NORONA, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "710",
      ehrCode: "DR07100",
      name: "CASTILLO, RANDY JOSEPH DEL TREMEDAL, M.D.",
      subDepartmentId: "24",
      hmoId:
        "0034, 0004, 0028, 0009, 121318, 0007, 0011, 0033, 0025, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "253",
      ehrCode: "DR02530",
      name: "CASTRO, CYNTHIA ROSARIO C., M.D.",
      subDepartmentId: "",
      hmoId: "0022, 0006",
      departmentId: "",
    },
    {
      code: "625",
      ehrCode: "DR06253",
      name: "CASTRO, ROD TAMONDONG",
      subDepartmentId: "14",
      hmoId: "0004, 0009, 121318, 0029",
      departmentId: "2",
    },
    {
      code: "588",
      ehrCode: "DR05883",
      name: "CASURAO-TRONO, AMITY BASCO",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0009, 121318, 0011, 0025, 0020",
      departmentId: "4",
    },
    {
      code: "793",
      ehrCode: "DR07933",
      name: "CAUSAPIN, BABIE CATHERINE R. MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "679",
      ehrCode: "DR06794",
      name: "CELINO, CARLA ELISE MANLAPAT",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10983",
      ehrCode: "DR109833",
      name: "CERO, MAY PRISCILLA VILLARIN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "548",
      ehrCode: "DR05485",
      name: "CHACON, ERIC NAVALEZA M.D.",
      subDepartmentId: "",
      hmoId:
        "0004, 0022, 0006, 0009, 121318, 0005, 0007, 0027, 0011, 0025, 0015, 0020",
      departmentId: "",
    },
    {
      code: "795",
      ehrCode: "DR07951",
      name: "CHACON, HYACINTH CLAIRE TANSECO, MD",
      subDepartmentId: "",
      hmoId: "0004, 0009, 121318, 0011, 0025, 0031, 0020, 0035",
      departmentId: "7",
    },
    {
      code: "752",
      ehrCode: "DR07526",
      name: "CHAVEZ, MARIA CLAUDIA LIM",
      subDepartmentId: "20",
      hmoId: "0034, 0004, 0028, 0006, 0009, 121318, 0011, 0039, 0015",
      departmentId: "2",
    },
    {
      code: "905",
      ehrCode: "DR09056",
      name: "CHEN, ERIKA BELINDA TAN M.D",
      subDepartmentId: "20",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "549",
      ehrCode: "DR05494",
      name: "CHENG, CHERRY RICH M., M.D, DSBPP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "11042",
      ehrCode: "DR110426",
      name: "CHENG, JERMAINE KRIS ONG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "11021",
      ehrCode: "DR110211",
      name: "CHENG, KEITH GERARD REYES",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "697",
      ehrCode: "DR06970",
      name: "CHENGLIONG, GLADYS Y. MD.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "262",
      ehrCode: "DR02628",
      name: "CHENGLIONG, LIBBY YOUNG",
      subDepartmentId: "",
      hmoId: "22",
      departmentId: "4",
    },
    {
      code: "30",
      ehrCode: "DR00301",
      name: "CHUA, ALBERTO T., M.D.",
      subDepartmentId: "22",
      hmoId: "0004, 0028, 0009, 121318, 0007, 0027, 0011, 121319, 0025, 0015",
      departmentId: "2",
    },
    {
      code: "864",
      ehrCode: "DR08640",
      name: "CHUA, ANGELO RUSSEL DIONISIO M.D.",
      subDepartmentId: "69",
      hmoId: "0030, 0009, 121318, 0008, 0007, 0027, 0011, 121319, 0025, 0015",
      departmentId: "11",
    },
    {
      code: "305",
      ehrCode: "DR03052",
      name: "CHUA, ANTONIO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11030",
      ehrCode: "DR110303",
      name: "CHUA, RACHELLE RAMILO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "16",
    },
    {
      code: "168",
      ehrCode: "DR01683",
      name: "CHUA, SHIELA CHING",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "597",
      ehrCode: "DR05971",
      name: "CHUA, WILMA ANTHEA M., MD, FPPA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "674",
      ehrCode: "DR06749",
      name: "CHUA-LEY, EVELYN ONG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "862",
      ehrCode: "DR08622",
      name: "CHUN, JENNYLYN R. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "810",
      ehrCode: "DR08109",
      name: "CLAVERIA, RONALD ALLAN AGUSTIN",
      subDepartmentId: "",
      hmoId: "0004, 0028, 0011, 0025, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "306",
      ehrCode: "DR03061",
      name: "CLEOFAS, MELVIN JUAN R., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0006, 0005, 0009, 121318, 0007, 0011, 0025, 0031, 0020",
      departmentId: "5",
    },
    {
      code: "31",
      ehrCode: "DR00310",
      name: "CLOMA, LEE ALLEN DULAY",
      subDepartmentId: "43",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "32",
      ehrCode: "DR00329",
      name: "CO, JUAN MARIA IBARRA ORTIGA M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0027, 0011, 0037, 0025, 0031, 0029, 0020",
      departmentId: "",
    },
    {
      code: "11052",
      ehrCode: "DR110525",
      name: "CO, JUANITA CARMELA O.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "263",
      ehrCode: "DR02637",
      name: "CO-HIDALGO, MARIBEL EMMA E., M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "4",
    },
    {
      code: "224",
      ehrCode: "DR02248",
      name: "COLOMA, CHARO ASUNCION M.D.",
      subDepartmentId: "62",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0007, 0027, 0011, 121319, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "930",
      ehrCode: "DR09302",
      name: "COMANDAO, MARIA VERONICA PORNASDOSO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "181",
      ehrCode: "DR01814",
      name: "CONCEPCION, CHRISTOPHER O., M.D.",
      subDepartmentId: "38",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "776",
      ehrCode: "DR07766",
      name: "CONSTANTINO, DANILO VILLANUEVA II",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "803",
      ehrCode: "DR08039",
      name: "CORDERO, ALINAYA AURELIO",
      subDepartmentId: "14",
      hmoId:
        "0036, 0022, 0009, 121318, 0008, 0027, 0011, 121319, 0037, 0025, 0031, 0015, 0029, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "822",
      ehrCode: "DR08224",
      name: "CORDOVA, REED, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "888",
      ehrCode: "DR08880",
      name: "COROMINA, TIFFANY KAY KANAPI, M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0006, 0027, 0037, 0025, 0031, 0015, 0035",
      departmentId: "",
    },
    {
      code: "309",
      ehrCode: "DR03098",
      name: "CORTEZ, CARMINA ANN J., M.D.",
      subDepartmentId: "",
      hmoId: "20",
      departmentId: "10",
    },
    {
      code: "749",
      ehrCode: "DR07492",
      name: "COTAOCO, KIMBERLY ANN TINIO",
      subDepartmentId: "47",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "34",
      ehrCode: "DR00347",
      name: "CRUZ, FAY CHARMAINE STA. ANA",
      subDepartmentId: "47",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "797",
      ehrCode: "DR07979",
      name: "CRUZ, HECIL ABOBO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "630",
      ehrCode: "DR06305",
      name: "CUARESMA, EDGAR CHRISTIAN SANCHEZ M.D",
      subDepartmentId: "23",
      hmoId: "0004, 0022, 0009, 121318, 0011, 0033, 0025, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "817",
      ehrCode: "DR08172",
      name: "CUSTODIO, HAZEL, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "662",
      ehrCode: "DR06624",
      name: "CUSTODIO, TRISTAN DE GUZMAN, M.D.",
      subDepartmentId: "",
      hmoId: "0009, 121318",
      departmentId: "",
    },
    {
      code: "310",
      ehrCode: "DR03104",
      name: "DAMIAN, LUDWIG M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "868",
      ehrCode: "DR08686",
      name: "DANGA, GIORGIE DENISE O. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "1008",
      ehrCode: "DR10089",
      name: "DANGUILAN, JUSTINO LORENZO MERCADO, MD, FPCR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "569",
      ehrCode: "DR05698",
      name: "DAVID, MA. PAULA CECILIA PARAS",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "10960",
      ehrCode: "DR109604",
      name: "DE ASIS, KIA CHARISSE DAYO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "694",
      ehrCode: "DR06943",
      name: "DE CASTRO, MARICHELLE A.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "311",
      ehrCode: "DR03113",
      name: "DE GRACIA, VIRGILIO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "36",
      ehrCode: "DR00365",
      name: "DE GRANO, JOSE LUIS G. M.D.",
      subDepartmentId: "",
      hmoId:
        "0018, 0004, 0022, 0030, 0005, 0009, 121318, 0007, 0011, 0025, 0015, 0020",
      departmentId: "5",
    },
    {
      code: "801",
      ehrCode: "DR08011",
      name: "DE GUZMAN, CESAR C. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10998",
      ehrCode: "DR109987",
      name: "DE GUZMAN, JOHN ALDRIN VILLAMAYOR",
      subDepartmentId: "14, 67",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "911",
      ehrCode: "DR09117",
      name: "DE GUZMAN, MA. BERNADETTE ABUEG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "824",
      ehrCode: "DR08242",
      name: "DE GUZMAN, MINA, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "37",
      ehrCode: "DR00374",
      name: "DE GUZMAN, NAPOLEON Y., M.D.",
      subDepartmentId: "14, 67",
      hmoId: "0009, 121318",
      departmentId: "11",
    },
    {
      code: "568",
      ehrCode: "DR05689",
      name: "DE JESUS. BRIAN JOSEPH D.G., MD, FPCR, FUSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11039",
      ehrCode: "DR110396",
      name: "DE JUAN, EDWARD VICTOR GADONG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10964",
      ehrCode: "DR109642",
      name: "DE LA CRUZ, DANIEL PAGUNTALAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10992",
      ehrCode: "DR109925",
      name: "DE LA ROSA, REY THOMAS PANGAN",
      subDepartmentId: "68",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "11001",
      ehrCode: "DR110013",
      name: "DE LEON, DAWANI C. MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "133",
      ehrCode: "DR01337",
      name: "DE LOS SANTOS, MARIBETH T., M.D.",
      subDepartmentId: "14",
      hmoId: "0022, 0020",
      departmentId: "2",
    },
    {
      code: "10932",
      ehrCode: "DR109321",
      name: "DE TORRES, AILA EDZMIER DIANSUY",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 0037, 121319, 0033, 0031, 0015, 0029, 0020, 0035, 0040",
      departmentId: "",
    },
    {
      code: "10933",
      ehrCode: "DR109338",
      name: "DE TORRES, RHEY KENNETH LACAO",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0029, 0020, 0035, 0040",
      departmentId: "",
    },
    {
      code: "38",
      ehrCode: "DR00383",
      name: "DEE, GENTRY A., M.D.",
      subDepartmentId: "19",
      hmoId:
        "0034, 0004, 0022, 0006, 0005, 0009, 121318, 0007, 0011, 0025, 0031, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "935",
      ehrCode: "DR09357",
      name: "DEL MUNDO, MARIA CORAZON GARCIA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "654",
      ehrCode: "DR06545",
      name: "DEL ROSARIO, DANILO DELA CRUZ",
      subDepartmentId: "",
      hmoId: "0009, 121318, 0007",
      departmentId: "",
    },
    {
      code: "707",
      ehrCode: "DR07076",
      name: "DEL ROSARIO, EILEEN M. D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "816",
      ehrCode: "DR08163",
      name: "DEL ROSARIO, KRISTEL , M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10988",
      ehrCode: "DR109888",
      name: "DEL ROSARIO, PAULINE MELISSE SALVANO",
      subDepartmentId: "68",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "39",
      ehrCode: "DR00392",
      name: "DELA ROSA, DENKY SHOJI WI",
      subDepartmentId: "23",
      hmoId: "11",
      departmentId: "2",
    },
    {
      code: "718",
      ehrCode: "DR07182",
      name: "DEMAISIP, EVETTE LILYBELLE ALOJADO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "13",
    },
    {
      code: "830",
      ehrCode: "DR08303",
      name: "DEPAYNOS, CHRISTINE CARLOS",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "725",
      ehrCode: "DR07252",
      name: "DEPAYNOS, TERRENCE CLYDE HAFALLA",
      subDepartmentId: "69",
      hmoId: "0034, 0004, 121318, 0009, 0025, 0020",
      departmentId: "11",
    },
    {
      code: "785",
      ehrCode: "DR07854",
      name: "DEVEZA, MA. CLARICE D. OTRP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "389",
      ehrCode: "DR03894",
      name: "DIEGO-SALAZAR, CLARISSA M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "315",
      ehrCode: "DR03159",
      name: "DIMLA, CHIARA MARIE M. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "11002",
      ehrCode: "DR110020",
      name: "DIONISIO, KATRINA ANGELA T, MD",
      subDepartmentId: "62",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "42",
      ehrCode: "DR00426",
      name: "DIZON, ALEJANDRO CALDAL",
      subDepartmentId: "",
      hmoId: "0009, 121318, 0011, 0020",
      departmentId: "11",
    },
    {
      code: "563",
      ehrCode: "DR05634",
      name: "DIZON, FRANKLIN MEDINA III",
      subDepartmentId: "68",
      hmoId: "0004, 0022, 0009, 121318, 0011, 0039",
      departmentId: "11",
    },
    {
      code: "43",
      ehrCode: "DR00435",
      name: "DOCTOR, VICTOR S., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "200",
      ehrCode: "DR02008",
      name: "DOMINGO, OLIVER GLENN C., M.D",
      subDepartmentId: "",
      hmoId: "0018, 0004, 0009, 121318, 0011, 121319, 0025, 0020",
      departmentId: "6",
    },
    {
      code: "11062",
      ehrCode: "DR110624",
      name: "DOROY, ZOE ALETHINOS M. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "831",
      ehrCode: "DR08312",
      name: "DUMAPIG, MOSES JOB DORADO",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0009, 121318, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0020, 0035, 0040",
      departmentId: "5",
    },
    {
      code: "931",
      ehrCode: "DR09311",
      name: "DUMO, TED JULIUS REYES",
      subDepartmentId: "22",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0007, 0027, 0011, 0039, 0037, 0033, 0025, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "712",
      ehrCode: "DR07128",
      name: "DUQUE, CHERRIE LOU NAZARETH, MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "319",
      ehrCode: "DR03195",
      name: "DY, CHING BING M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "902",
      ehrCode: "DR09029",
      name: "DY, CRISTALLE GERALDINE CHUA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "204",
      ehrCode: "DR02044",
      name: "DY-LEDESMA, JANELYN ALEXIS L., M.D., FPSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "13",
    },
    {
      code: "841",
      ehrCode: "DR08419",
      name: "DY-LIMJOCO, ANNA MARIELLE BALAGTAS",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "320",
      ehrCode: "DR03201",
      name: "EDUARDO, EMMANUEL M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "44",
      ehrCode: "DR00444",
      name: "ELEVAZO, IDELFA S., M.D.",
      subDepartmentId: "",
      hmoId:
        "0018, 0004, 0022, 0005, 0009, 121318, 0008, 0007, 0011, 0025, 0015, 0020",
      departmentId: "4",
    },
    {
      code: "565",
      ehrCode: "DR05652",
      name: "EMERGENCY DOCTOR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "321",
      ehrCode: "DR03210",
      name: "ENCARNACION, ASIS SANTIAGO JR.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "458",
      ehrCode: "DR04583",
      name: "ER PHYSICIAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "799",
      ehrCode: "DR07997",
      name: "ERESE, RAYMUND JOAQUIN FELIZARDO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "322",
      ehrCode: "DR03229",
      name: "ESGUERRA, LUIS EMMANUEL O., M.D.",
      subDepartmentId: "",
      hmoId: "31",
      departmentId: "7",
    },
    {
      code: "286",
      ehrCode: "DR02868",
      name: "ESPALDON, ANNA MARIE DEGUZMAN",
      subDepartmentId: "20, 23",
      hmoId: "0004, 0009, 121318, 0011, 0025, 0015, 0020",
      departmentId: "7",
    },
    {
      code: "429",
      ehrCode: "DR04291",
      name: "ESPALDON, VISVANATH EREVE",
      subDepartmentId: "",
      hmoId:
        "0018, 0004, 0022, 0005, 0009, 121318, 0008, 0007, 0011, 0025, 0031, 0015, 0029, 0020",
      departmentId: "",
    },
    {
      code: "639",
      ehrCode: "DR06396",
      name: "ESPERA-LOBATON,RAMONA NERISSA M.D,",
      subDepartmentId: "22",
      hmoId: "0004, 0022, 0009, 121318, 0007, 0027, 0025, 0031, 0020",
      departmentId: "2",
    },
    {
      code: "899",
      ehrCode: "DR08996",
      name: "ESTRADA, THERESE DIANE BERNARDO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "10",
    },
    {
      code: "840",
      ehrCode: "DR08400",
      name: "ESTRELLA, KATRINA CANLAS",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "16, 3",
    },
    {
      code: "892",
      ehrCode: "DR08923",
      name: "ESTRELLA, PATRICIA ANN T. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "139",
      ehrCode: "DR01391",
      name: "EUROPA, DISRAELI M.D.",
      subDepartmentId: "",
      hmoId: "22",
      departmentId: "2",
    },
    {
      code: "652",
      ehrCode: "DR06527",
      name: "EUROPA, GIANCARLO M.D.",
      subDepartmentId: "68",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "884",
      ehrCode: "DR08844",
      name: "EUROPA, MARY LAUREN REYES, M.D.",
      subDepartmentId: "14",
      hmoId:
        "0036, 0034, 0004, 0006, 0005, 0009, 121318, 0011, 0039, 121319, 0037, 0033, 0025, 0015",
      departmentId: "2",
    },
    {
      code: "324",
      ehrCode: "DR03247",
      name: "EUSEBIO, JOSELYN A., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "325",
      ehrCode: "DR03256",
      name: "FAMADOR, JAY ARNOLD F., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "281",
      ehrCode: "DR02813",
      name: "FANDIALAN, ERMAN C., M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "663",
      ehrCode: "DR06633",
      name: "FAUSTINO , KAREN MASBANG",
      subDepartmentId: "",
      hmoId: "0009, 121318, 0031, 0020",
      departmentId: "4",
    },
    {
      code: "698",
      ehrCode: "DR06989",
      name: "FAUSTO, CHRISTINE G., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "555",
      ehrCode: "DR05555",
      name: "FELARCA, IRENE R., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "48",
      ehrCode: "DR00480",
      name: "FELARCA, RIZALINO JOSE F., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "163",
      ehrCode: "DR01638",
      name: "FERNANDEZ, FRANCIS CHARLES LAZO MD",
      subDepartmentId: "14",
      hmoId: "0004, 0028, 0009, 121318, 0007, 0027, 0011, 0025, 0031",
      departmentId: "2",
    },
    {
      code: "681",
      ehrCode: "DR06819",
      name: "FERNANDEZ, FRANCISCO MIGUEL SALAZAR",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0009, 121318, 0008, 0020",
      departmentId: "5",
    },
    {
      code: "439",
      ehrCode: "DR04398",
      name: "FERNANDEZ, MA. BRIDGET DONATO MD",
      subDepartmentId: "14",
      hmoId:
        "0004, 0022, 0030, 0028, 0006, 0009, 121318, 0027, 121319, 0025, 0031, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "848",
      ehrCode: "DR08482",
      name: "FERNANDEZ-RAMOS, JAEMELYN MARIE OBNAMIA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "201",
      ehrCode: "DR02017",
      name: "FERNANDO, ADRIAN FERNANDEZ M.D.",
      subDepartmentId: "",
      hmoId:
        "0034, 0004, 0022, 0005, 0009, 121318, 0007, 0011, 0039, 0025, 0015, 0020",
      departmentId: "6",
    },
    {
      code: "190",
      ehrCode: "DR01902",
      name: "FERNANDO, ANNA THERESA G., M.D.",
      subDepartmentId: "",
      hmoId: "0030, 0009, 121318, 0011, 0025, 0020",
      departmentId: "",
    },
    {
      code: "140",
      ehrCode: "DR01407",
      name: "FERNANDO, GRACIEUX Y., M.D.",
      subDepartmentId: "23",
      hmoId: "0007, 0011",
      departmentId: "2",
    },
    {
      code: "872",
      ehrCode: "DR08729",
      name: "FERRER, DIANNE KAY DOMENDEN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "423",
      ehrCode: "DR04237",
      name: "FERRERA-CALMA, KATRINA PURA",
      subDepartmentId: "23",
      hmoId: "0004, 0027, 0011, 0039, 0037",
      departmentId: "2",
    },
    {
      code: "912",
      ehrCode: "DR09126",
      name: "FILARCA, RENE LUIS F. M.D.",
      subDepartmentId: "",
      hmoId: "11",
      departmentId: "",
    },
    {
      code: "552",
      ehrCode: "DR05528",
      name: "FIRMALO, VICENTE FRANCISCO QUE M.D.",
      subDepartmentId: "66",
      hmoId: "0034, 0004, 0009, 121318, 0008, 0011, 0025, 0031",
      departmentId: "11",
    },
    {
      code: "437",
      ehrCode: "DR04370",
      name: "FLORENTINO, ALVIN M. D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "861",
      ehrCode: "DR08613",
      name: "FLORES, JAYMEE ANTOLLENA R. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "49",
      ehrCode: "DR00499",
      name: "FLORES, OLIVIA C., MD, DPBA, MEM",
      subDepartmentId: "",
      hmoId: "0018, 0004, 0022, 0009, 121318, 0039, 0020",
      departmentId: "1",
    },
    {
      code: "877",
      ehrCode: "DR08774",
      name: "FORMALEJO, JAN PAUL DE LEON M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0025, 0031, 0015, 0020, 0035",
      departmentId: "6",
    },
    {
      code: "50",
      ehrCode: "DR00505",
      name: "FORONDA, RUBY CARMEN N., M.D.",
      subDepartmentId: "",
      hmoId:
        "0018, 0004, 0006, 0005, 0009, 121318, 0008, 0007, 0011, 0025, 0031, 0020",
      departmentId: "7",
    },
    {
      code: "690",
      ehrCode: "DR06907",
      name: "FULLANTE, SHELLYGRACE EVANGELISTA, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "182",
      ehrCode: "DR01823",
      name: "GAGARIN, RUCHIE I. O., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0009, 121318, 0025, 0020",
      departmentId: "4",
    },
    {
      code: "10995",
      ehrCode: "DR109956",
      name: "GALUPINO, ANDREO S JR.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10938",
      ehrCode: "DR109383",
      name: "GAMMAD, JOAN JOYCE C.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10970",
      ehrCode: "DR109703",
      name: "GARCIA, ANTHONY REY GAGALANG",
      subDepartmentId: "19",
      hmoId:
        "0036, 0034, 0004, 0028, 0006, 0005, 0009, 121318, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0015, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "882",
      ehrCode: "DR08826",
      name: "GARCIA, CRISTINA M. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "51",
      ehrCode: "DR00514",
      name: "GARCIA, EFREN R., M.D",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0020, 0035, 0040",
      departmentId: "5",
    },
    {
      code: "932",
      ehrCode: "DR09320",
      name: "GARCIA, JAMES RAINER MEDALLA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "11013",
      ehrCode: "DR110136",
      name: "GARCIA, MA. CRISTINA ZAMORA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "547",
      ehrCode: "DR05476",
      name: "GARCIA, MARIANNE MONSAYAC",
      subDepartmentId: "19",
      hmoId:
        "0034, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0007, 0011, 0025, 0015, 0029",
      departmentId: "2",
    },
    {
      code: "532",
      ehrCode: "DR05324",
      name: "GARCIA-ARENAL, MARIA CECILIA PLAZA",
      subDepartmentId: "",
      hmoId: "0004, 0030, 0009, 121318, 0011, 0025",
      departmentId: "5",
    },
    {
      code: "658",
      ehrCode: "DR06581",
      name: "GASA, GODOFREDO VICTOR BOBILA",
      subDepartmentId: "69",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0028, 0006, 0009, 121318, 0008, 0027, 0011, 121319, 0037, 0033, 0025, 0031, 0015, 0029, 0020",
      departmentId: "11",
    },
    {
      code: "675",
      ehrCode: "DR06758",
      name: "GAYOS, GLENN MICHAEL L. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "906",
      ehrCode: "DR09065",
      name: "GEGUIENTO, BRYAN DANEAL ARCENAS M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "47",
      ehrCode: "DR00471",
      name: "GEOLLEGUE, DAVID JR., M.D.",
      subDepartmentId: "67",
      hmoId: "0009, 121318",
      departmentId: "11",
    },
    {
      code: "52",
      ehrCode: "DR00523",
      name: "GERMAR, MARIA CELINA H., MD, FPPA, FPSCAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "534",
      ehrCode: "DR05342",
      name: "GO, ARTHUR JASON SIA",
      subDepartmentId: "23",
      hmoId: "0009, 121318, 0025",
      departmentId: "2",
    },
    {
      code: "10953",
      ehrCode: "DR109536",
      name: "GO, JOSELITO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11010",
      ehrCode: "DR110105",
      name: "GO, KARLA UANG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "786",
      ehrCode: "DR07863",
      name: "GOCHIOCO, DIANE CHARLEEN TAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "918",
      ehrCode: "DR09180",
      name: "GOMEZ, JAMES PAUL SIASAT",
      subDepartmentId: "42",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "509",
      ehrCode: "DR05096",
      name: "GOMEZ, JOHN VICTOR ANTHONY MANALO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "258",
      ehrCode: "DR02585",
      name: "GONSALVES, JUDE ANTONIO DELA CRUZ JR., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "920",
      ehrCode: "DR09205",
      name: "GONZALES, JUAN RAPHAEL M. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "695",
      ehrCode: "DR06952",
      name: "GORGONIO, ALYSSA JOYCE D. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "740",
      ehrCode: "DR07401",
      name: "GRANA, FLORDELIZA F. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "326",
      ehrCode: "DR03265",
      name: "GUEVARA, GLENN V., MD",
      subDepartmentId: "43",
      hmoId:
        "0034, 0004, 0022, 0028, 0009, 121318, 0008, 0007, 0011, 121319, 0025, 0031, 0015, 0020, 0035",
      departmentId: "5",
    },
    {
      code: "863",
      ehrCode: "DR08631",
      name: "GUILING-DECENA, RASHIDA CAWIYA CATIPON M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "778",
      ehrCode: "DR07784",
      name: "GUILLERMO, JOSE GIL CRUZ JR.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "926",
      ehrCode: "DR09269",
      name: "HE, ENCI RACHEL DIZON",
      subDepartmentId: "",
      hmoId:
        "0034, 0004, 0022, 0030, 0028, 0005, 0009, 121318, 0008, 0007, 0027, 0039, 121319, 0037, 0033, 0025, 0031, 0035",
      departmentId: "",
    },
    {
      code: "782",
      ehrCode: "DR07827",
      name: "HERNANDEZ, APRIL FATIMA JUANDAY, M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0031",
      departmentId: "",
    },
    {
      code: "827",
      ehrCode: "DR08279",
      name: "HERNANDEZ, CARLOS LUIS ALFONSO TUMANG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10999",
      ehrCode: "DR109994",
      name: "HERNANDEZ, JOHN GABRIEL B, MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "846",
      ehrCode: "DR08464",
      name: "HERNANDEZ-TAN, JO ANNE P. , M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "10971",
      ehrCode: "DR109710",
      name: "HERRADURA, BRIAN RAINIE TALION",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "132",
      ehrCode: "DR01328",
      name: "HERRADURA, RENATO M.D.",
      subDepartmentId: "24",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "243",
      ehrCode: "DR02433",
      name: "HIPOLITO, CECILIO DELOS SANTOS JR., M.D.",
      subDepartmentId: "",
      hmoId:
        "0034, 0028, 0006, 0009, 121318, 0007, 0027, 0011, 0025, 0031, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "579",
      ehrCode: "DR05795",
      name: "HIZON, IAN BENJAMIN T., M.D",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "5",
    },
    {
      code: "259",
      ehrCode: "DR02594",
      name: "HUFANA, VLADIMIR DIZON",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "1002",
      ehrCode: "DR10025",
      name: "IBANA, AISLER, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "742",
      ehrCode: "DR07429",
      name: "ILAGAN-CARGULLO, ELAINE MARISSE HALILI, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "117",
      ehrCode: "DR01179",
      name: "IMPERIAL, MARK ANTHONY T., M.D.",
      subDepartmentId: "45",
      hmoId: "11",
      departmentId: "5",
    },
    {
      code: "327",
      ehrCode: "DR03274",
      name: "ISON, CLARO B., MD, FPCR, FCTMRISP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "328",
      ehrCode: "DR03283",
      name: "JACOBA, ARACELI P. M.D., FPSP",
      subDepartmentId: "46",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "428",
      ehrCode: "DR04282",
      name: "JAMISOLA, LIAN CRUZ M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0006, 0009, 121318, 0039, 0011, 0037, 0033, 0025, 0015, 0020, 0035",
      departmentId: "",
    },
    {
      code: "329",
      ehrCode: "DR03292",
      name: "JAVELOSA, ANA MARIE M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "56",
      ehrCode: "DR00569",
      name: "JAVELOSA, RANULFO JR. B., M.D.",
      subDepartmentId: "14",
      hmoId: "0022, 0009, 121318, 0011, 0025",
      departmentId: "2",
    },
    {
      code: "434",
      ehrCode: "DR04343",
      name: "JAVIER, ANNE MARIE GERALDINE JIMENEZ",
      subDepartmentId: "19",
      hmoId: "0004, 0022, 0005, 0009, 121318, 0007, 0011, 0031, 0020",
      departmentId: "2",
    },
    {
      code: "709",
      ehrCode: "DR07094",
      name: "JAVIER, MARCO M., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "10929",
      ehrCode: "DR109291",
      name: "JAVIER, RAMON JASON MAKALINAO",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "",
    },
    {
      code: "57",
      ehrCode: "DR00578",
      name: "JIMENEZ, RODNEY M., MD.",
      subDepartmentId: "14",
      hmoId: "0036, 0004, 0022, 0006, 0005, 0009, 121318, 0027, 0025",
      departmentId: "2",
    },
    {
      code: "893",
      ehrCode: "DR08932",
      name: "JOAQUIN, JACQUELINE ANNE KING",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10966",
      ehrCode: "DR109666",
      name: "JOYA, JEB REINARD DOCENA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "58",
      ehrCode: "DR00587",
      name: "JUNIO, ROSALIE E., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "10984",
      ehrCode: "DR109840",
      name: "KALUAG-SAWALI, ALYSTAIRE ANGELIQUE ANNE CACERES",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "737",
      ehrCode: "DR07377",
      name: "KING, KATHLEEN PE , MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "745",
      ehrCode: "DR07456",
      name: "LABAJO-PAGADUAN, HANNAH RUTH VICTA M.D.",
      subDepartmentId: "18",
      hmoId: "0034, 0004, 0009, 121318, 0025, 0031, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "891",
      ehrCode: "DR08914",
      name: "LAGMAY, MARION FRANCES DILIG",
      subDepartmentId: "14",
      hmoId:
        "0036, 0034, 0018, 0004, 0030, 0028, 0006, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0025, 0031, 0015, 0029, 0020",
      departmentId: "2",
    },
    {
      code: "331",
      ehrCode: "DR03317",
      name: "LAGO, ELMO RESANO JR.",
      subDepartmentId: "62",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "855",
      ehrCode: "DR08552",
      name: "LALAS, MIRIAM YANO, M.D.",
      subDepartmentId: "24",
      hmoId: "0009, 121318",
      departmentId: "2",
    },
    {
      code: "11009",
      ehrCode: "DR110099",
      name: "LANDRITO, ANDREA MELISSA C.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10985",
      ehrCode: "DR109857",
      name: "LAVADIA, ARIS BEETHOVEN A",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "60",
      ehrCode: "DR00602",
      name: "LAYUSA, CLARISSA ANGELA A., MD, DPBA",
      subDepartmentId: "",
      hmoId: "0022, 0005",
      departmentId: "1",
    },
    {
      code: "1001",
      ehrCode: "DR10016",
      name: "LEE, JIN, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "857",
      ehrCode: "DR08570",
      name: "LEE, PATRICIA ANN L. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "756",
      ehrCode: "DR07562",
      name: "LEE,STEPHEN Y. M.D.",
      subDepartmentId: "",
      hmoId: "0034, 0004, 0009, 121318, 0031, 0020",
      departmentId: "",
    },
    {
      code: "927",
      ehrCode: "DR09278",
      name: "LEONARDO, DANIELLE FRANCES A.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "63",
      ehrCode: "DR00639",
      name: "LEUENBERGER, EDGAR U. M.D.",
      subDepartmentId: "42",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "238",
      ehrCode: "DR02381",
      name: "LEUENBERGER, MA. PILAR ALELI JOSEFINA Q., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "1003",
      ehrCode: "DR10034",
      name: "LEVISTE, MA. CRISTINA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "693",
      ehrCode: "DR06934",
      name: "LIGAN, RACHEL ANN P. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "772",
      ehrCode: "DR07720",
      name: "LIM, CHRISTIAN EMMANUEL T., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "533",
      ehrCode: "DR05333",
      name: "LIM, DARWIN DIAMPO JAVIER",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "12",
    },
    {
      code: "871",
      ehrCode: "DR08710",
      name: "LIM, MICHAEL NELSON PEREZ M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0030, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0029, 0035",
      departmentId: "11",
    },
    {
      code: "334",
      ehrCode: "DR03344",
      name: "LIM, WILLIAM M.D.",
      subDepartmentId: "62",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "575",
      ehrCode: "DR05759",
      name: "LIM-CHAN, MICHELLE ANTHONETTE . M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0028, 0006, 0009, 121318, 0007, 0011, 0025, 0031, 0020",
      departmentId: "4",
    },
    {
      code: "11050",
      ehrCode: "DR110501",
      name: "LIN, TIM LAWRENCE TIU",
      subDepartmentId: "19",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "11059",
      ehrCode: "DR110594",
      name: "LISTANCO, OLIVIA FAYE J. M.D",
      subDepartmentId: "24",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "118",
      ehrCode: "DR01188",
      name: "LITAO, ROMMEL E., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "537",
      ehrCode: "DR05379",
      name: "LLADOC-NATIVIDAD, THERESE EILEEN B., M.D.",
      subDepartmentId: "25",
      hmoId: "0004, 0006, 0009, 121318, 0011",
      departmentId: "2",
    },
    {
      code: "64",
      ehrCode: "DR00648",
      name: "LOCNEN, SUE ANN R., M.D.",
      subDepartmentId: "14",
      hmoId: "22",
      departmentId: "2",
    },
    {
      code: "487",
      ehrCode: "DR04875",
      name: "LODRONIO, ANGELINA M. D.",
      subDepartmentId: "",
      hmoId: "0022, 0009, 121318, 0007, 0020",
      departmentId: "",
    },
    {
      code: "10961",
      ehrCode: "DR109611",
      name: "LOFRANCO, LORI BELLE MARIANO",
      subDepartmentId: "23",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "467",
      ehrCode: "DR04671",
      name: "LOPEZ, ANNELYN FATIMA M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0009, 121318, 0025",
      departmentId: "7",
    },
    {
      code: "919",
      ehrCode: "DR09199",
      name: "LOPEZ, DIANNE G. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11047",
      ehrCode: "DR110471",
      name: "LOPEZ, MARIA ELLAINE CHAVEZ",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "688",
      ehrCode: "DR06882",
      name: "LOVIDAD, JEROME B. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10975",
      ehrCode: "DR109758",
      name: "LUGTU, BIEN LAUREN JAVIER",
      subDepartmentId: "",
      hmoId:
        "0036, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0015, 0020, 0035, 0040",
      departmentId: "6",
    },
    {
      code: "687",
      ehrCode: "DR06873",
      name: "LUGUE, ANNA MARGARITA A. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "337",
      ehrCode: "DR03371",
      name: "LUSPO, MARIAN PORTIA V., MD, FPPA, FPSCAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "10968",
      ehrCode: "DR109680",
      name: "MACALINAO, EARLYN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11040",
      ehrCode: "DR110402",
      name: "MACAPAGAL, JACKY LOU FULGENCIO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "880",
      ehrCode: "DR08808",
      name: "MACLANG-SOLIMAN, HANNAH ANDRES",
      subDepartmentId: "",
      hmoId: "0004, 0030, 0009, 121318, 0007, 0011, 0040",
      departmentId: "4",
    },
    {
      code: "649",
      ehrCode: "DR06493",
      name: "MADARCOS, RAPHAEL ANGELO CARINO MD",
      subDepartmentId: "23",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0009, 121318, 0007, 0027, 0011, 0039, 0037, 0025, 0031, 0020, 0035",
      departmentId: "11",
    },
    {
      code: "870",
      ehrCode: "DR08701",
      name: "MADARCOS,FLORO,MD.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "476",
      ehrCode: "DR04769",
      name: "MAGANTE-ORTAÑEZ, CATHERINE V., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0028, 0009, 121318, 0011, 121319, 0025, 0031, 0020",
      departmentId: "4",
    },
    {
      code: "343",
      ehrCode: "DR03432",
      name: "MAGAT, MA. MILAGROS, M.D.",
      subDepartmentId: "",
      hmoId: "0009, 121318",
      departmentId: "",
    },
    {
      code: "340",
      ehrCode: "DR03405",
      name: "MAGLALANG, GIL JR., MD, DPBR, FCTMRISP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11056",
      ehrCode: "DR110563",
      name: "MAGLALANG, GIL MORALES JR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11008",
      ehrCode: "DR110082",
      name: "MAGLAQUI, MONIQUE LOUISE L., MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "427",
      ehrCode: "DR04273",
      name: "MAGLAYA, JEHAN GRACE B., M.D.",
      subDepartmentId: "62",
      hmoId: "0004, 0009, 121318, 0025",
      departmentId: "6",
    },
    {
      code: "66",
      ehrCode: "DR00666",
      name: "MALAYA, ARNEL V., M.D.",
      subDepartmentId: "",
      hmoId:
        "0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0025, 0015, 0020",
      departmentId: "10",
    },
    {
      code: "277",
      ehrCode: "DR02770",
      name: "MALINIT, JOY P., MD, FPPA, FPSCAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "627",
      ehrCode: "DR06271",
      name: "MALIWAT, LEVI M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "921",
      ehrCode: "DR09214",
      name: "MANUEL, APPLENETTE APRIL S. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "873",
      ehrCode: "DR08738",
      name: "MANUEL, MARIELLE LOIS M. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "526",
      ehrCode: "DR05263",
      name: "MARBELLA, MA. ANGELES M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "210",
      ehrCode: "DR02105",
      name: "MARIANO, MELISSA PAULITA V., MD, DSBPP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "856",
      ehrCode: "DR08561",
      name: "MARIN, RAMON REYES",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "67",
      ehrCode: "DR00675",
      name: "MARIÑAS, GLENN D., MD, DPBA",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0009, 121318, 0007, 0027, 0011, 121319, 0025",
      departmentId: "1",
    },
    {
      code: "11068",
      ehrCode: "DR110686",
      name: "MARLON, PEDROZO MARTINEZ",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "850",
      ehrCode: "DR08507",
      name: "MARTIN, ANDREI P. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "68",
      ehrCode: "DR00684",
      name: "MARTINEZ, GABRIEL L., M.D.",
      subDepartmentId: "68",
      hmoId:
        "0018, 0004, 0022, 0030, 0005, 0009, 121318, 0008, 0007, 0011, 0025, 0031, 0020",
      departmentId: "11",
    },
    {
      code: "11069",
      ehrCode: "DR110693",
      name: "MARTINEZ, MARLON PEDROZO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "11036",
      ehrCode: "DR110365",
      name: "MARTINEZ, NICOLE MAE DELA CRUZ",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0028, 0005, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0029, 0020, 0035, 0040",
      departmentId: "",
    },
    {
      code: "628",
      ehrCode: "DR06280",
      name: "MECEDA, ELMER JOSE M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "610",
      ehrCode: "DR06101",
      name: "MEDEL, ANDREW BUENO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "12",
    },
    {
      code: "826",
      ehrCode: "DR08260",
      name: "MEDEL, KRISTINE ONGTENGCO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "12",
    },
    {
      code: "70",
      ehrCode: "DR00709",
      name: "MEDEL, RUTH B. M.D.",
      subDepartmentId: "",
      hmoId: "4",
      departmentId: "",
    },
    {
      code: "71",
      ehrCode: "DR00718",
      name: "MEDEL, STEPHEN M.D.",
      subDepartmentId: "",
      hmoId: "4",
      departmentId: "",
    },
    {
      code: "876",
      ehrCode: "DR08765",
      name: "MEDINA, MARCO LUCIANO R. M.D.",
      subDepartmentId: "19",
      hmoId: "31",
      departmentId: "2",
    },
    {
      code: "11011",
      ehrCode: "DR110112",
      name: "MEJIA, PHILIP RICO PARDO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "928",
      ehrCode: "DR09287",
      name: "MENDOZA, DONNA APRIL R.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "812",
      ehrCode: "DR08127",
      name: "MENDOZA, JAMIE LEIGH LEGASPI M.D.",
      subDepartmentId: "69, 23",
      hmoId:
        "0036, 0034, 0004, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0029, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "11044",
      ehrCode: "DR110440",
      name: "MENDOZA, JOHN JACOB CABANGANGAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "69",
      ehrCode: "DR00693",
      name: "MENDOZA, MIGUEL C., M.D.",
      subDepartmentId: "64",
      hmoId: "0036, 0004, 0009, 121318, 0027, 0011, 0025, 0031, 0015",
      departmentId: "11",
    },
    {
      code: "668",
      ehrCode: "DR06688",
      name: "MENDOZA, SUZETTE M., M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11027",
      ehrCode: "DR110273",
      name: "MERCADO, ADRIENNE CAMILLE MILITANTE",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "346",
      ehrCode: "DR03469",
      name: "MESINA, MARIA JOSEFA M.D., FPSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "175",
      ehrCode: "DR01753",
      name: "MESINA-NEPOMUCENO, BELINDA LIOBA LACAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "673",
      ehrCode: "DR06730",
      name: "MILAN, ALEXIS D. M.D.",
      subDepartmentId: "",
      hmoId: "0009, 121318, 0025",
      departmentId: "",
    },
    {
      code: "755",
      ehrCode: "DR07553",
      name: "MIRANDA, RMIN SHEILA JIMENEZ, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "728",
      ehrCode: "DR07289",
      name: "MISTICA, RICA ANN SANTOS",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "844",
      ehrCode: "DR08446",
      name: "MIURA, CATHRINE PONCE M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0001, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0029, 0035",
      departmentId: "6",
    },
    {
      code: "11045",
      ehrCode: "DR110457",
      name: "MOLBOG, BRIXSON MANTALA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "348",
      ehrCode: "DR03487",
      name: "MOLO, RANDOLPH M. M.D.",
      subDepartmentId: "",
      hmoId: "0031, 0020",
      departmentId: "",
    },
    {
      code: "10965",
      ehrCode: "DR109659",
      name: "MONERA, ONAIZAH KATRINA GATUS",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "865",
      ehrCode: "DR08659",
      name: "MORTEL, BERNADETTE MAYUMI T. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "73",
      ehrCode: "DR00736",
      name: "NACARIO, FRANK C., MD, DPBA, DPBPM",
      subDepartmentId: "",
      hmoId: "0034, 0004, 0022, 0030, 0028, 0009, 121318, 0027, 121319",
      departmentId: "1",
    },
    {
      code: "74",
      ehrCode: "DR00745",
      name: "NAGTALON, ERIC V., MD, DPBA",
      subDepartmentId: "",
      hmoId: "0018, 0022, 0028, 0009, 121318, 0025, 0020",
      departmentId: "1",
    },
    {
      code: "234",
      ehrCode: "DR02345",
      name: "NAGTALON, SUSAN P., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0030, 0028, 0009, 121318, 0008, 0011, 121319, 0020",
      departmentId: "",
    },
    {
      code: "767",
      ehrCode: "DR07678",
      name: "NATIVIDAD, NADJAH S. M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0006, 0009, 121318",
      departmentId: "7",
    },
    {
      code: "851",
      ehrCode: "DR08516",
      name: "NAVARRO, MARIA ELIZA R.",
      subDepartmentId: "22",
      hmoId: "0036, 0034, 0004, 0009, 121318, 0011, 0025, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "171",
      ehrCode: "DR01717",
      name: "NEPOMUCENO, ARNEL F",
      subDepartmentId: "19",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "166",
      ehrCode: "DR01665",
      name: "NEPOMUCENO, J MEINARD JAMLIG, M.D.",
      subDepartmentId: "22",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "777",
      ehrCode: "DR07775",
      name: "NG, KRIZELDA TIMBANG M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0022, 0009, 121318, 0039, 0037, 0025, 0015, 0020, 0035",
      departmentId: "4",
    },
    {
      code: "147",
      ehrCode: "DR01470",
      name: "NIEVA, JONIDAY M., MD, DPBA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "498",
      ehrCode: "DR04981",
      name: "NOLASCO, JONATHAN C., M.D.",
      subDepartmentId: "63",
      hmoId: "0009, 121318, 0011, 0025, 0031",
      departmentId: "11",
    },
    {
      code: "11053",
      ehrCode: "DR110532",
      name: "OANDASAN, RICHMOND PHILIP A. M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0004, 0022, 0028, 0005, 0008, 0007, 0027, 0011, 0039, 121319, 0033, 0025, 0031, 0020, 0035, 0040",
      departmentId: "27",
    },
    {
      code: "720",
      ehrCode: "DR07207",
      name: "OCAMPO, MANUEL S. JR. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "510",
      ehrCode: "DR05102",
      name: "OCAMPO, OMAR O., M.D.",
      subDepartmentId: "61",
      hmoId: "0009, 121318, 0007",
      departmentId: "11",
    },
    {
      code: "255",
      ehrCode: "DR02558",
      name: "OLAIVAR, MARIETTA C., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "800",
      ehrCode: "DR08002",
      name: "OLIVA, OLIVER BRYAN S. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "875",
      ehrCode: "DR08756",
      name: "OMAÑA, PAULO CARLO RAMON D. M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0022, 0030, 0028, 0005, 0009, 121318, 0008, 0007, 121319, 0020, 0040, 0035",
      departmentId: "11",
    },
    {
      code: "922",
      ehrCode: "DR09223",
      name: "OMENGAN, ESTHER JOSEPHINE BANASAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "376",
      ehrCode: "DR03760",
      name: "ONAGAN, MERCEDES C., MD, FPCR, FUSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "10934",
      ehrCode: "DR109345",
      name: "ONG, AVA KATRINA PACLEB",
      subDepartmentId: "",
      hmoId: "0004, 0009, 121318, 0007, 0039, 0031, 0020",
      departmentId: "",
    },
    {
      code: "934",
      ehrCode: "DR09348",
      name: "ONG, BRIAN NELSON MIRANDA M.D.",
      subDepartmentId: "24, 59",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "581",
      ehrCode: "DR05810",
      name: "ONG, EDMUND T. M.D",
      subDepartmentId: "62",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "836",
      ehrCode: "DR08367",
      name: "ONG, IRIS ANNE TAN, M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0009, 121318, 0007, 0027, 0011, 0039, 121319, 0037, 0025, 0031, 0020, 0035, 0040",
      departmentId: "1",
    },
    {
      code: "765",
      ehrCode: "DR07650",
      name: "ONG, KIM ELIZABETH D M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0028, 0009, 121318, 0008, 0007, 0027, 0011, 121319, 0025, 0031, 0035",
      departmentId: "7",
    },
    {
      code: "558",
      ehrCode: "DR05582",
      name: "OPD PHYSICIAN - MEDICINE",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "805",
      ehrCode: "DR08057",
      name: "OR, ROSEMARYLIN . M.D",
      subDepartmentId: "23",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "10927",
      ehrCode: "DR109277",
      name: "ORILLAZA, TIMOTHY JOSEPH SOLPICO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "651",
      ehrCode: "DR06518",
      name: "ORTAÑEZ, CLIVE KEVIN R., M.D.",
      subDepartmentId: "",
      hmoId: "0018, 0004, 0009, 121318, 0011, 0039, 0025, 0029, 0020",
      departmentId: "11",
    },
    {
      code: "769",
      ehrCode: "DR07696",
      name: "OSIT, LINA MAY C., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "472",
      ehrCode: "DR04723",
      name: "OUTSIDE DOCTOR",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "177",
      ehrCode: "DR01771",
      name: "PABELLANO-TIONGSON, MA LUISA GWENN FLORIDO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "350",
      ehrCode: "DR03502",
      name: "PABILLO, LINO SANTIAGO S., MD, MMHA, FPCR, FUSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "422",
      ehrCode: "DR04228",
      name: "PACQUING-SONGCO, DEBBY F., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0009, 121318, 0011",
      departmentId: "4",
    },
    {
      code: "351",
      ehrCode: "DR03511",
      name: "PADLA, TOMACINO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "267",
      ehrCode: "DR02673",
      name: "PADOLINA, CHRISTIA M.D.",
      subDepartmentId: "",
      hmoId: "22",
      departmentId: "4",
    },
    {
      code: "897",
      ehrCode: "DR08978",
      name: "PAGADDU, MARIE CRESANNE R. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "77",
      ehrCode: "DR00772",
      name: "PAGADUAN, BONISUSA M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10936",
      ehrCode: "DR109369",
      name: "PAGADUAN, CHRISTOPHER RYAN PESEBRE",
      subDepartmentId: "25",
      hmoId: "0030, 0009, 121318",
      departmentId: "2",
    },
    {
      code: "789",
      ehrCode: "DR07890",
      name: "PAGGAO, JAYME NATASHA KOH, M.D.",
      subDepartmentId: "60",
      hmoId:
        "0036, 0022, 0030, 0006, 0009, 121318, 0007, 0037, 0033, 0025, 0015, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "866",
      ehrCode: "DR08668",
      name: "PAHATI, MARIA PAMELA E. M.D.",
      subDepartmentId: "",
      hmoId: "11",
      departmentId: "",
    },
    {
      code: "913",
      ehrCode: "DR09135",
      name: "PALACIOS, MARIA KATERINA A.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "78",
      ehrCode: "DR00781",
      name: "PALARUAN, MA. CRISTINA G., M.D.",
      subDepartmentId: "19",
      hmoId: "20",
      departmentId: "2",
    },
    {
      code: "900",
      ehrCode: "DR09001",
      name: "PALINES, JACQUELINE DENISE V. M.D.",
      subDepartmentId: "59",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "79",
      ehrCode: "DR00790",
      name: "PANALIGAN, MARIO M., M.D",
      subDepartmentId: "21",
      hmoId: "0004, 0028, 0006, 0009, 121318, 0007, 0025, 0031",
      departmentId: "2",
    },
    {
      code: "10944",
      ehrCode: "DR109444",
      name: "PANDATO, MEJIE BILLONES",
      subDepartmentId: "66",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "10987",
      ehrCode: "DR109871",
      name: "PANDES, ORVILLE JESS ABAY",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "145",
      ehrCode: "DR01452",
      name: "PANELO, ARACELI A., M.D.",
      subDepartmentId: "17",
      hmoId: "0004, 0006, 0025",
      departmentId: "2",
    },
    {
      code: "784",
      ehrCode: "DR07845",
      name: "PANG, JOHN PAUL T., M.D.",
      subDepartmentId: "48",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "739",
      ehrCode: "DR07395",
      name: "PANGA, GREGGY A., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "721",
      ehrCode: "DR07216",
      name: "PANGANIBAN, KATHERINE MAGNAYE, M.D.",
      subDepartmentId: "",
      hmoId: "0036, 0005, 0027, 0020",
      departmentId: "",
    },
    {
      code: "280",
      ehrCode: "DR02804",
      name: "PANLILIO, JOSEFA R. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "731",
      ehrCode: "DR07313",
      name: "PARUNGAO, DANIEL MIRANDA. M.D.",
      subDepartmentId: "19",
      hmoId: "0006, 0020",
      departmentId: "2",
    },
    {
      code: "10943",
      ehrCode: "DR109437",
      name: "PASCO-ROSETE, NONETTEE YULO",
      subDepartmentId: "",
      hmoId: "0004, 0028, 0025, 121319, 0037, 0039, 0015, 0035",
      departmentId: "5",
    },
    {
      code: "770",
      ehrCode: "DR07702",
      name: "PASCUAL, ARNOLD BENEDIC LOQUELLANO",
      subDepartmentId: "",
      hmoId:
        "0036, 0004, 0009, 121318, 0008, 121319, 0033, 0025, 0031, 0029, 0020, 0035, 0040",
      departmentId: "1",
    },
    {
      code: "874",
      ehrCode: "DR08747",
      name: "PASCUAL, PAMELA JEAN SD. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "81",
      ehrCode: "DR00815",
      name: "PAYAWAL, FIDEL C., MD, DPBA",
      subDepartmentId: "",
      hmoId: "22",
      departmentId: "1",
    },
    {
      code: "724",
      ehrCode: "DR07243",
      name: "PELAYO, MAY ANGELA MASANGKAY, M.D.",
      subDepartmentId: "21",
      hmoId:
        "0036, 0034, 0022, 0030, 0028, 0007, 0027, 0039, 121319, 0037, 0033, 0025, 0015, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "11012",
      ehrCode: "DR110129",
      name: "PEREZ, DOMINIQUE QUINTOS",
      subDepartmentId: "59",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "616",
      ehrCode: "DR06165",
      name: "PEREZ, JOANNE B. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "11031",
      ehrCode: "DR110310",
      name: "PERILLO, ENGELBERT SIMON SY",
      subDepartmentId: "19",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "593",
      ehrCode: "DR05935",
      name: "PIMENTEL, RONNIE DE LARA M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "530",
      ehrCode: "DR05306",
      name: "PINEDA, RIO CARLA FABREO, M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "86",
      ehrCode: "DR00860",
      name: "PORTUGAL, BEVERLY ANNE P., MD, DPBA",
      subDepartmentId: "",
      hmoId: "0034, 0022, 0030, 0028, 0005, 0027, 121319, 0025, 0015",
      departmentId: "1",
    },
    {
      code: "702",
      ehrCode: "DR07021",
      name: "PRECIA, JAYJHUMAR D., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "753",
      ehrCode: "DR07535",
      name: "PUNSALAN, MONIQUE THERESE SUNDIAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "365",
      ehrCode: "DR03654",
      name: "PUNSALAN, RENE B. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "925",
      ehrCode: "DR09250",
      name: "PURA, MARIA ANGELA BOBILES",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "88",
      ehrCode: "DR00888",
      name: "QUEBRAL, JOSE D., M.D.",
      subDepartmentId: "63",
      hmoId:
        "0030, 0028, 0006, 0005, 0009, 121318, 0027, 0011, 121319, 0025, 0031, 0015",
      departmentId: "11",
    },
    {
      code: "732",
      ehrCode: "DR07322",
      name: "QUERIJERO, ANN LARAE TABERNILLA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "12",
    },
    {
      code: "914",
      ehrCode: "DR09144",
      name: "QUIAMBAO, ANTONIO LORENZO RUSTIA",
      subDepartmentId: "25",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "11028",
      ehrCode: "DR110280",
      name: "QUIDILLA, ISAGANI BENDOVAL",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0018, 0004, 0022, 0030, 0028, 0006, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0020, 0035, 0040",
      departmentId: "27",
    },
    {
      code: "89",
      ehrCode: "DR00897",
      name: "QUIJANO, ADELIA M.D.",
      subDepartmentId: "",
      hmoId:
        "0034, 0004, 0022, 0030, 0028, 0006, 0009, 121318, 0007, 0027, 0011, 121319, 0025, 0015, 0020",
      departmentId: "4",
    },
    {
      code: "269",
      ehrCode: "DR02691",
      name: "QUILLAMOR, RAUL M.D.",
      subDepartmentId: "",
      hmoId: "0036, 0007, 0025",
      departmentId: "4",
    },
    {
      code: "355",
      ehrCode: "DR03557",
      name: "QUIÑONES, VINNA MARIE T. M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0028, 0006, 0009, 121318, 0007, 0027, 121319, 0025, 0015",
      departmentId: "7",
    },
    {
      code: "819",
      ehrCode: "DR08190",
      name: "QUITIQUIT, NINA , M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "883",
      ehrCode: "DR08835",
      name: "RAGAZA, ENRICO P. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "217",
      ehrCode: "DR02178",
      name: "RAMIREZ, RALLY C., MD, FPCR , FUSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "703",
      ehrCode: "DR07030",
      name: "RAMOS, CHRISTINE P. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11061",
      ehrCode: "DR110617",
      name: "RAMOS, FRANCESCA, CECILIA B. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "907",
      ehrCode: "DR09074",
      name: "RAMOS, LAURICE GIZELLE C. MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "929",
      ehrCode: "DR09296",
      name: "RAMOS, MICHAEL JOSEPH H. M.D.",
      subDepartmentId: "24",
      hmoId: "0004, 0009, 121318, 0007, 0027, 0025",
      departmentId: "2",
    },
    {
      code: "853",
      ehrCode: "DR08534",
      name: "RAMOS, NICOLE ROSE B.",
      subDepartmentId: "24",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 121319, 0037, 0033, 0025, 0031, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "141",
      ehrCode: "DR01416",
      name: "RAMOS, ROMULO F. M.D.",
      subDepartmentId: "18",
      hmoId: "0020, 0022",
      departmentId: "2",
    },
    {
      code: "821",
      ehrCode: "DR08215",
      name: "RAMOSO, MICHAEAL ABACA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "832",
      ehrCode: "DR08321",
      name: "RAYMUNDO, GRACE DIANNE G. M.D.",
      subDepartmentId: "23",
      hmoId:
        "0036, 0034, 0004, 0030, 0028, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0025, 0031, 0015, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "11032",
      ehrCode: "DR110327",
      name: "RAZON, JUNE MICHAEL VICTORIA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "27",
    },
    {
      code: "551",
      ehrCode: "DR05519",
      name: "REBOSA, ANTONIO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "11057",
      ehrCode: "DR110570",
      name: "REGALADO, JOSEPH JUSTIN HIPOLITO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "696",
      ehrCode: "DR06961",
      name: "REGIDOR, JAPHET GERARD V. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "191",
      ehrCode: "DR01911",
      name: "REMO, JOCELYN THERESE M., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0009, 121318",
      departmentId: "",
    },
    {
      code: "895",
      ehrCode: "DR08950",
      name: "REODIQUE, OLIVIA BERNADETTE P. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "481",
      ehrCode: "DR04334",
      name: "RESIDENT PHYSICIAN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "640",
      ehrCode: "DR06402",
      name: "REVILLA, REGGIE R. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "834",
      ehrCode: "DR08349",
      name: "REYES, JED CEDRIC SAN JUAN",
      subDepartmentId: "21",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "272",
      ehrCode: "DR02725",
      name: "REYES, MARIA LILIA M.D.",
      subDepartmentId: "",
      hmoId:
        "0034, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0008, 0027, 0011, 0025, 0031, 0015, 0020",
      departmentId: "4",
    },
    {
      code: "808",
      ehrCode: "DR08084",
      name: "REYES, MICHAEL ROY LAPUZ, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "11060",
      ehrCode: "DR110600",
      name: "REYES, REYNALDO ANGELO N. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "90",
      ehrCode: "DR00903",
      name: "REYES, RIGO DANIEL VICTOR EMMANUEL C. M.D.",
      subDepartmentId: "",
      hmoId: "0009, 121318",
      departmentId: "5",
    },
    {
      code: "10973",
      ehrCode: "DR109734",
      name: "REYES, THERESE FRANZ BRIONES",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "835",
      ehrCode: "DR08358",
      name: "REYES-JOAQUINO, DIANNE MARY CELL L.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "367",
      ehrCode: "DR03672",
      name: "REYNA, RONALD ANTONIO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "91",
      ehrCode: "DR00912",
      name: "RIBARGOSO, NYMPHA DAVID , MD",
      subDepartmentId: "25",
      hmoId: "22",
      departmentId: "2",
    },
    {
      code: "722",
      ehrCode: "DR07225",
      name: "RICALDE, ROSARIO R., M.D.",
      subDepartmentId: "",
      hmoId: "0009, 121318",
      departmentId: "6",
    },
    {
      code: "11046",
      ehrCode: "DR110464",
      name: "RITUALO, MICHAEL SHAUN BUHION",
      subDepartmentId: "",
      hmoId: "0036, 0004, 0022, 0008, 0039, 0033, 0025, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "713",
      ehrCode: "DR07137",
      name: "RIVERA, ABIGAIL CHIONG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10972",
      ehrCode: "DR109727",
      name: "RIVERA, CHARLES KEVIN LOYOLA",
      subDepartmentId: "21",
      hmoId:
        "0036, 0034, 0004, 0028, 0006, 0005, 0009, 121318, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "368",
      ehrCode: "DR03681",
      name: "RIVERA, IMELDA D. M.D., FPSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "13",
    },
    {
      code: "119",
      ehrCode: "DR01197",
      name: "RIVERA, JONATHAN, M.D.",
      subDepartmentId: "42",
      hmoId:
        "0034, 0004, 0028, 0009, 121318, 0007, 0027, 0011, 0039, 121319, 0025, 0015, 0020",
      departmentId: "5",
    },
    {
      code: "10962",
      ehrCode: "DR109628",
      name: "RIVERA, PAOLO MIGUEL OCAMPO",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "",
    },
    {
      code: "10989",
      ehrCode: "DR109895",
      name: "RIVERA-MAPILI, LAURA ANDREA BALBON",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "94",
      ehrCode: "DR00949",
      name: "RODRIGUEZ, ISAGANI M.D.",
      subDepartmentId: "24",
      hmoId:
        "0018, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0011, 0025, 0020",
      departmentId: "2",
    },
    {
      code: "93",
      ehrCode: "DR00930",
      name: "RODRIGUEZ, SONIA C., MD, FPPA, FPSCAP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "923",
      ehrCode: "DR09232",
      name: "ROJAS, RALEIGH LEAN P. M.D.",
      subDepartmentId: "61",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0008, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035",
      departmentId: "11",
    },
    {
      code: "97",
      ehrCode: "DR00976",
      name: "RONSAYRO, ARWIN RONAN M.D.",
      subDepartmentId: "18",
      hmoId: "11",
      departmentId: "2",
    },
    {
      code: "734",
      ehrCode: "DR07340",
      name: "ROSARIO, MAMER S., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "369",
      ehrCode: "DR03690",
      name: "ROSARIO, MICHAEL M.D.",
      subDepartmentId: "18",
      hmoId: "0004, 0022, 0005, 0009, 121318, 0011, 0025, 0031, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "137",
      ehrCode: "DR01373",
      name: "ROSARIO, MINETTE OCAMPO M.D.",
      subDepartmentId: "21",
      hmoId: "0004, 0022, 0009, 121318, 0008, 0011, 0025, 0031",
      departmentId: "2",
    },
    {
      code: "818",
      ehrCode: "DR08181",
      name: "ROY, JAMES , M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "370",
      ehrCode: "DR03706",
      name: "RUEDA-CU, JOSELLI M.D., FPSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "11037",
      ehrCode: "DR110372",
      name: "SACDALAN, DENNIS RAYMOND LEONCIO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "125",
      ehrCode: "DR01258",
      name: "SAGAYAGA, HILDA M. M.D.",
      subDepartmentId: "",
      hmoId: "0009, 121318, 0007",
      departmentId: "11",
    },
    {
      code: "189",
      ehrCode: "DR01896",
      name: "SALAFRANCA, ROAN P., M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0009, 121318, 0007, 0011, 0025, 0031, 0015, 0020",
      departmentId: "4",
    },
    {
      code: "656",
      ehrCode: "DR06563",
      name: "SALAYOG-JAMON, KATHEREEN M., MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "99",
      ehrCode: "DR00994",
      name: "SALAZAR, JOSE M.D.",
      subDepartmentId: "",
      hmoId:
        "0018, 0004, 0022, 0006, 0005, 0009, 121318, 0008, 0007, 0011, 121319, 0020",
      departmentId: "7",
    },
    {
      code: "371",
      ehrCode: "DR03715",
      name: "SALAZAR, NATIVIDAD M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "11006",
      ehrCode: "DR110068",
      name: "SALIGAN, CHRISTINE JOY D., MD.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "757",
      ehrCode: "DR07571",
      name: "SALTING, AL OMAR M., M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "6",
    },
    {
      code: "274",
      ehrCode: "DR02743",
      name: "SALUD, AIDA M.D.",
      subDepartmentId: "",
      hmoId: "22",
      departmentId: "",
    },
    {
      code: "126",
      ehrCode: "DR01267",
      name: "SALUD, JOSE ANTONIO. M.D",
      subDepartmentId: "64",
      hmoId: "0009, 121318, 0020",
      departmentId: "11",
    },
    {
      code: "10963",
      ehrCode: "DR109635",
      name: "SALVADOR, ARVIN LORENZ SAN MIGUEL",
      subDepartmentId: "19",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "100",
      ehrCode: "DR01009",
      name: "SALVADOR, LUIS G. M.D.",
      subDepartmentId: "19",
      hmoId:
        "0034, 0004, 0022, 0030, 0028, 0006, 0009, 121318, 0008, 0007, 0027, 0011, 121319, 0037, 0025, 0031, 0015, 0020",
      departmentId: "2",
    },
    {
      code: "809",
      ehrCode: "DR08093",
      name: "SALVADOR, MA. JOANNA CARLA GARCIA",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0005, 0009, 121318, 0008, 0039, 0037, 0020",
      departmentId: "5",
    },
    {
      code: "716",
      ehrCode: "DR07164",
      name: "SALVAÑA, MARIA THERESA JOY PASCUAL",
      subDepartmentId: "",
      hmoId: "36",
      departmentId: "1",
    },
    {
      code: "357",
      ehrCode: "DR03575",
      name: "SAN LUIS, AMADO M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "130",
      ehrCode: "DR01300",
      name: "SANDEJAS, JONATHAN EMMANUEL M.D.",
      subDepartmentId: "19",
      hmoId: "20",
      departmentId: "2",
    },
    {
      code: "10996",
      ehrCode: "DR109963",
      name: "SANTIAGO, JASON PAUL DELA PAZ",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "11055",
      ehrCode: "DR110556",
      name: "SANTIAGO, MADONNA C.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4, 70",
    },
    {
      code: "811",
      ehrCode: "DR08118",
      name: "SANTIAGO-EUROPA, GILLY MAY M.D.",
      subDepartmentId: "24",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0009, 121318, 0007, 0027, 0011, 121319, 0037, 0033, 0025, 0015, 0029, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "484",
      ehrCode: "DR04848",
      name: "SANTOS, ARLENE L. M.D., FPSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "13",
    },
    {
      code: "358",
      ehrCode: "DR03584",
      name: "SANTOS, EDWARD M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "11022",
      ehrCode: "DR110228",
      name: "SANTOS, JEHAN ROSELLE CAINGAT",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "11024",
      ehrCode: "DR110242",
      name: "SANTOS, MARIAN JOY SONGCO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "823",
      ehrCode: "DR08233",
      name: "SANTOS, MARIE KRISZIA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "689",
      ehrCode: "DR06891",
      name: "SANTOS, NIKOLAI R. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "10",
    },
    {
      code: "10979",
      ehrCode: "DR10979",
      name: "SANTOS, ROSITA MAE",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "854",
      ehrCode: "DR08543",
      name: "SANTOS,, MARIA REGINA C. C.",
      subDepartmentId: "18",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "10969",
      ehrCode: "DR109697",
      name: "SATO, KENJI MADRIAGA",
      subDepartmentId: "19",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0020, 0035, 0040",
      departmentId: "2",
    },
    {
      code: "849",
      ehrCode: "DR08491",
      name: "SAWALI, JOSE AMIEL ALDOVINO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "10982",
      ehrCode: "DR10982",
      name: "SEVILLE, ROSA LEE",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "806",
      ehrCode: "DR08066",
      name: "SIA, CHARLES P. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "184",
      ehrCode: "DR01841",
      name: "SIA-SANTOCILDES, RAMONA ANDREA L. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "783",
      ehrCode: "DR07836",
      name: "SIQUIAN, HAROLD LEBE S., M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0022, 0030, 0028, 0009, 121318, 0008, 0011, 0039, 121319, 0033, 0025, 0031, 0020, 0035, 0040",
      departmentId: "",
    },
    {
      code: "138",
      ehrCode: "DR01382",
      name: "SOLANTE, RONTGENE M., M.D.",
      subDepartmentId: "21",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "101",
      ehrCode: "DR01018",
      name: "SOMBILON, MA. CHRISTINA M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "359",
      ehrCode: "DR03593",
      name: "SONGCO, JANGAIL M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "DR08589",
      ehrCode: "DR08589",
      name: "SORIANO, FERNANDO ZION A. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "103",
      ehrCode: "DR01036",
      name: "SOTO, MA. FELICIDAD M.D.",
      subDepartmentId: "31",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "10986",
      ehrCode: "DR109864",
      name: "STA. ANA, MARIA LOURDES DUBAN",
      subDepartmentId: "",
      hmoId:
        "0036, 0028, 0009, 121318, 0027, 0039, 121319, 0037, 0031, 0020, 0035, 0040",
      departmentId: "2, 16",
    },
    {
      code: "787",
      ehrCode: "DR07872",
      name: "SUMADCHAT, FRANCIS GAEBRIEL G. OTRP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "104",
      ehrCode: "DR01045",
      name: "SUNDIANG, LUIS C., MD, FPPA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10993",
      ehrCode: "DR109932",
      name: "SUNGA, PAOLO LORENZO YUSON",
      subDepartmentId: "66",
      hmoId:
        "0036, 0034, 0004, 0022, 0030, 0028, 0006, 0009, 121318, 0027, 0039, 121319, 0037, 0033, 0025, 0031, 0020, 0040",
      departmentId: "11",
    },
    {
      code: "105",
      ehrCode: "DR01054",
      name: "SUNGA, PAUL ANTHONY M.D.",
      subDepartmentId: "69",
      hmoId:
        "0004, 0022, 0005, 0009, 121318, 0007, 0027, 0011, 0025, 0031, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "933",
      ehrCode: "DR09339",
      name: "TACATA, PATRICIA SANGALANG",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "748",
      ehrCode: "DR07483",
      name: "TADY, CLARISSA MARIE S., M.D.",
      subDepartmentId: "43",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "127",
      ehrCode: "DR01276",
      name: "TAGORDA, JOAN S., M.D.",
      subDepartmentId: "60, 23",
      hmoId:
        "0034, 0004, 0005, 0009, 121318, 0008, 0007, 0011, 0025, 0015, 0020, 0035",
      departmentId: "11",
    },
    {
      code: "531",
      ehrCode: "DR05315",
      name: "TAMBAN, CELITO A. M.D",
      subDepartmentId: "18",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "122",
      ehrCode: "DR01221",
      name: "TAMESIS, JESUS, J.R., MEDINA, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "5",
    },
    {
      code: "495",
      ehrCode: "DR04954",
      name: "TAN , ROBERTO M.D",
      subDepartmentId: "",
      hmoId: "0004, 0022, 0009, 121318, 0025",
      departmentId: "7",
    },
    {
      code: "106",
      ehrCode: "DR01063",
      name: "TAN, ALFREDO M.D.",
      subDepartmentId: "38",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "108",
      ehrCode: "DR01081",
      name: "TAN, DANIEL M.D.",
      subDepartmentId: "24",
      hmoId: "0009, 121318, 0011, 0020",
      departmentId: "2",
    },
    {
      code: "11054",
      ehrCode: "DR110549",
      name: "TAN, KELSEY MAXINE C.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "10991",
      ehrCode: "DR109918",
      name: "TAN, KELSEY MAXINE CUA",
      subDepartmentId: "",
      hmoId:
        "0036, 0004, 0030, 0028, 0009, 121318, 0007, 121319, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "10",
    },
    {
      code: "512",
      ehrCode: "DR05120",
      name: "TAN, TENNILLE M.D",
      subDepartmentId: "22",
      hmoId: "0004, 0028, 0009, 121318, 0007, 0027, 0011, 121319, 0025, 0020",
      departmentId: "2",
    },
    {
      code: "567",
      ehrCode: "DR05670",
      name: "TANCINCO, EILEEN GRACE FARALAN",
      subDepartmentId: "",
      hmoId:
        "0004, 0022, 0006, 0005, 0009, 121318, 0008, 0027, 0011, 121319, 0025, 0015, 0020",
      departmentId: "4",
    },
    {
      code: "109",
      ehrCode: "DR01090",
      name: "TANSECO JR, VICENTE VILLARIN",
      subDepartmentId: "22",
      hmoId: "0006, 0009, 121318, 0011, 0015",
      departmentId: "2",
    },
    {
      code: "762",
      ehrCode: "DR07623",
      name: "TANSECO, NIÑO ANTHONY PINE",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "878",
      ehrCode: "DR08783",
      name: "TANSECO, PATRICK VINCENT P. M.D.",
      subDepartmentId: "69",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0009, 121318, 0007, 0027, 0011, 0039, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "833",
      ehrCode: "DR08330",
      name: "TANSECO, VICENTE P. III M.D.",
      subDepartmentId: "22",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0009, 121318, 0008, 0027, 0011, 0039, 121319, 0037, 0025, 0031, 0015, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "761",
      ehrCode: "DR07614",
      name: "TARROZA, MARTH LOUIE Z. M.D.",
      subDepartmentId: "",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035",
      departmentId: "4",
    },
    {
      code: "179",
      ehrCode: "DR01799",
      name: "TAYAO, ANTHONY, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "360",
      ehrCode: "DR03609",
      name: "TAYENGCO-TIU, TOMMEE LYNNE M.D.",
      subDepartmentId: "39",
      hmoId: "0018, 0004, 0005, 0009, 121318, 0008, 0011, 0025, 0020",
      departmentId: "5",
    },
    {
      code: "11051",
      ehrCode: "DR110518",
      name: "TE, VINCENT CHRISTIAN REYES",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "10994",
      ehrCode: "DR109949",
      name: "TEC, LOU MERVYN ARGUEL",
      subDepartmentId: "68",
      hmoId:
        "0036, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "276",
      ehrCode: "DR02761",
      name: "TEODORO-COLE, LILLI MAY TEODORO M.D.",
      subDepartmentId: "23",
      hmoId: "0036, 0004, 0006, 0009, 121318, 0011, 0025, 0015, 0020",
      departmentId: "4",
    },
    {
      code: "839",
      ehrCode: "DR08394",
      name: "TEODOSIO, YRELE JOHN HERRERA",
      subDepartmentId: "68",
      hmoId:
        "0036, 0034, 0004, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035",
      departmentId: "11",
    },
    {
      code: "11004",
      ehrCode: "DR110044",
      name: "TIAM-LEE, JOYCE GILLIAN A., MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "361",
      ehrCode: "DR03618",
      name: "TILBE, MARIA LOURDES M.D., FPSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "13",
    },
    {
      code: "11041",
      ehrCode: "DR110419",
      name: "TINO, NEILSON CAMPO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "110",
      ehrCode: "DR01106",
      name: "TIO, PAUL JONATHAN S., MD, DPBA",
      subDepartmentId: "",
      hmoId: "0022, 0006, 0007",
      departmentId: "1",
    },
    {
      code: "807",
      ehrCode: "DR08075",
      name: "TIONGCO, ANGELICA FAITH Y. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "11064",
      ehrCode: "DR110648",
      name: "TIU, JANELLA MUNCAL",
      subDepartmentId: "21",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "708",
      ehrCode: "DR07085",
      name: "TIU, JOHN STEVEN UY MD",
      subDepartmentId: "14",
      hmoId:
        "0036, 0034, 0004, 0022, 0028, 0006, 0009, 121318, 0007, 0011, 0039, 0037, 0033, 0025, 0031, 0015, 0029, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "791",
      ehrCode: "DR07915",
      name: "TIU, TOMMEE LYNNE TAYENGCO MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "519",
      ehrCode: "DR05193",
      name: "TOLENTINO, CLARA M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "273",
      ehrCode: "DR02734",
      name: "TONGCO, CARMENCITA, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "1007",
      ehrCode: "DR10070",
      name: "TORRES, LLOYD S. M.D.",
      subDepartmentId: "19",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "774",
      ehrCode: "DR07748",
      name: "TRINIDAD, HANNAH LOIS TARROJA",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "8",
    },
    {
      code: "845",
      ehrCode: "DR08455",
      name: "TRINIDAD, TRISTAN F. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "544",
      ehrCode: "DR05449",
      name: "TUAZON, JANICE T. M. D.",
      subDepartmentId: "22",
      hmoId: "0004, 0022, 0009, 121318",
      departmentId: "7",
    },
    {
      code: "618",
      ehrCode: "DR06183",
      name: "TULIAO, PATRICK HEBRON M.D.",
      subDepartmentId: "69",
      hmoId:
        "0004, 0022, 0028, 0006, 0009, 121318, 0011, 0033, 0025, 0031, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "775",
      ehrCode: "DR07757",
      name: "TURALBA, FRANCES GAIL MATIAS, MD.",
      subDepartmentId: "15",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "10935",
      ehrCode: "DR109352",
      name: "TY, KAREN MAE ANG",
      subDepartmentId: "62",
      hmoId:
        "0036, 0018, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035, 0040",
      departmentId: "6",
    },
    {
      code: "885",
      ehrCode: "DR08853",
      name: "UDAUNDO, RALPH JAYSON CALIMAG, M.D.",
      subDepartmentId: "24",
      hmoId:
        "0036, 0004, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0027, 0011, 121319, 0037, 0033, 0025, 0031, 0015, 0020, 0035",
      departmentId: "2",
    },
    {
      code: "543",
      ehrCode: "DR05430",
      name: "UE DENTAL CLINIC",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "123",
      ehrCode: "DR01230",
      name: "UY, NORBERT LINGLING MD.",
      subDepartmentId: "14",
      hmoId: "0004, 0022, 0005, 0009, 121318, 0008, 0007, 0025, 0020",
      departmentId: "2",
    },
    {
      code: "10956",
      ehrCode: "DR109567",
      name: "VALDEHUESA, JAPHET GOMEZ",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "111",
      ehrCode: "DR01115",
      name: "VALDELLON, ERLINDA V. M.D.",
      subDepartmentId: "19",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "584",
      ehrCode: "DR05847",
      name: "VALENZUELA, RAFAEL M., MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "112",
      ehrCode: "DR01124",
      name: "VALERA, ERIC CONSTANTINE M.D.",
      subDepartmentId: "",
      hmoId: "0034, 0004, 0022, 0005, 0009, 121318, 0025, 0020",
      departmentId: "5",
    },
    {
      code: "11014",
      ehrCode: "DR110143",
      name: "VALERA, MIGUEL JULIO SALAZAR",
      subDepartmentId: "",
      hmoId: "0034, 0011, 0015",
      departmentId: "10",
    },
    {
      code: "896",
      ehrCode: "DR08969",
      name: "VALMONTE-TORRES, MA. VICTORIA S.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "741",
      ehrCode: "DR07410",
      name: "VARELA, MAJOURETTE, D. M.D.",
      subDepartmentId: "47",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "362",
      ehrCode: "DR03627",
      name: "VARGAS, LILY SIA M.D.",
      subDepartmentId: "",
      hmoId: "0030, 0028, 121319, 0031, 0004, 0009, 121318, 0008, 0027, 0020",
      departmentId: "6",
    },
    {
      code: "113",
      ehrCode: "DR01133",
      name: "VARILLA, ALEX V. M.D.",
      subDepartmentId: "21",
      hmoId:
        "0004, 0022, 0030, 0028, 0005, 0009, 121318, 0008, 0007, 0027, 121319, 0031, 0020",
      departmentId: "2",
    },
    {
      code: "11023",
      ehrCode: "DR110235",
      name: "VERSOZA, CYNTHIA ANTONETTE DEQUIÑA-VERSOZA M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "222",
      ehrCode: "DR02220",
      name: "VERSOZA, MICHAEL I. M.D.",
      subDepartmentId: "66",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "11020",
      ehrCode: "DR110204",
      name: "VERZOSA, CYNTHIA ANTONETTE DEQUIÑA",
      subDepartmentId: "14",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "648",
      ehrCode: "DR06484",
      name: "VERZOSA-CANTA, CYNTHIA V., MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "781",
      ehrCode: "DR07818",
      name: "VICTORIA, KAMYLL ANNE YU, MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "743",
      ehrCode: "DR07438",
      name: "VILLA-ABRILLE, JOHN GILDON POSAS",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "12",
    },
    {
      code: "881",
      ehrCode: "DR08817",
      name: "VILLAMAYOR, CARINA P. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "13",
    },
    {
      code: "11067",
      ehrCode: "DR110679",
      name: "VILLANUEVA, BIANCA KATRINA ESCARO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "11066",
      ehrCode: "DR110662",
      name: "VILLANUEVA, BIANCA KATRINA M.D. E.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "505",
      ehrCode: "DR05050",
      name: "VILLANUEVA, JOSE CARLO R.",
      subDepartmentId: "",
      hmoId: "11",
      departmentId: "6",
    },
    {
      code: "11049",
      ehrCode: "DR110495",
      name: "VILLANUEVA, JOYCE VIVIENNE NATARTE",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "9",
    },
    {
      code: "536",
      ehrCode: "DR05360",
      name: "VILLANUEVA, ZAB-DIEL M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "1004",
      ehrCode: "DR10043",
      name: "VILLARAZA, DUSTIN",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "",
    },
    {
      code: "660",
      ehrCode: "DR06606",
      name: "VILLARUEL, LUDUVICO R., M.D.",
      subDepartmentId: "38",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "894",
      ehrCode: "DR08941",
      name: "VILLENA, JUANITO VICENTE I. M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "10990",
      ehrCode: "DR109901",
      name: "VITUG, FRIA FRANCHESCA PEREZ",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "1",
    },
    {
      code: "10974",
      ehrCode: "DR109741",
      name: "YAÑEZ, MARK HENRI CRUZ",
      subDepartmentId: "68",
      hmoId:
        "0036, 0004, 0022, 0030, 0028, 0006, 0005, 0009, 121318, 0008, 0007, 0027, 0011, 0039, 121319, 0037, 0033, 0025, 0015, 0029, 0020, 0035, 0040",
      departmentId: "11",
    },
    {
      code: "364",
      ehrCode: "DR03645",
      name: "YANEZ, SOCORRO C. M.D., FPSP",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "13",
    },
    {
      code: "144",
      ehrCode: "DR01443",
      name: "YANG, GILBERT M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "16",
    },
    {
      code: "910",
      ehrCode: "DR09108",
      name: "YAO-ACOSTA, ABIGAIL SANDRA D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "692",
      ehrCode: "DR06925",
      name: "YAP SIEGFRIED JAMES T. M.D.",
      subDepartmentId: "",
      hmoId:
        "0034, 0018, 0006, 0009, 121318, 0008, 0007, 0027, 121319, 0037, 0033, 0025, 0031, 0015, 0035",
      departmentId: "11",
    },
    {
      code: "828",
      ehrCode: "DR08288",
      name: "YAP, ANTHONY Q. M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "11",
    },
    {
      code: "390",
      ehrCode: "DR03900",
      name: "YAP, MA. SHIELA ELEONOR , M.D.",
      subDepartmentId: "14",
      hmoId: "0004, 0022, 0009, 121318, 0025, 0031, 0020",
      departmentId: "7",
    },
    {
      code: "10928",
      ehrCode: "DR109284",
      name: "YAP, MARIA DAWN ROSARY BUENO",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "632",
      ehrCode: "DR06323",
      name: "YEE, DON IZZY T., M.D.",
      subDepartmentId: "19",
      hmoId: "0009, 121318, 0007, 0025",
      departmentId: "2",
    },
    {
      code: "115",
      ehrCode: "DR01151",
      name: "YRASTORZA, SAMUEL VINCENT, M.D.",
      subDepartmentId: "69",
      hmoId:
        "0018, 0004, 0006, 0005, 0009, 121318, 0008, 0007, 0011, 0025, 0015, 0020",
      departmentId: "11",
    },
    {
      code: "10947",
      ehrCode: "DR109475",
      name: "YU, JERYL RITZI TAN",
      subDepartmentId: "29",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "11005",
      ehrCode: "DR110051",
      name: "YU, PAMELA JOANNE C., MD",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "7",
    },
    {
      code: "754",
      ehrCode: "DR07544",
      name: "ZABAT, GELZA MAE A., M.D.",
      subDepartmentId: "21",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "446",
      ehrCode: "DR04468",
      name: "ZAMORA, BRENDA BERNADETTE, M.D",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "4",
    },
    {
      code: "10946",
      ehrCode: "DR109468",
      name: "ZAMORA, JUSTINE CERVIN ANDREI ALUMNO",
      subDepartmentId: "",
      hmoId: "11",
      departmentId: "10",
    },
    {
      code: "554",
      ehrCode: "DR05546",
      name: "ZAMORA, ROSALLY PADILLA",
      subDepartmentId: "21",
      hmoId: "0004, 0009, 121318, 0020",
      departmentId: "2",
    },
    {
      code: "176",
      ehrCode: "DR01762",
      name: "ZIALCITA, MA. KATRINA ADRIANO, M.D.",
      subDepartmentId: "",
      hmoId: "",
      departmentId: "3",
    },
    {
      code: "116",
      ehrCode: "DR01160",
      name: "ZOTOMAYOR, RICARDO C., M.D.",
      subDepartmentId: "24",
      hmoId: "",
      departmentId: "2",
    },
    {
      code: "45",
      ehrCode: "DR00453",
      name: "ZULUETA, MA. CRISTINA,E. M.D.",
      subDepartmentId: "",
      hmoId: "0004, 0005",
      departmentId: "4",
    },
  ];

  for (const item of data) {
    const splitSub = item.subDepartmentId.split(",").map((s) => s.trim());
    const splitDep = item.departmentId.split(",").map((s) => s.trim());
    const splitHmo = item.hmoId.split(",").map((s) => s.trim());

    const insertData = await sqlHelper.transact(async (txn) => {
      for (const dep of splitDep) {
        if (dep || dep.length > 0) {
          await processInsert(
            item.ehrCode,
            dep,
            txn,
            "dateTimeCreated",
            "8958",
            "specialty",
          );
        }
      }

      for (const sub of splitSub) {
        if (sub || sub.length > 0) {
          await processInsert(
            item.ehrCode,
            sub,
            txn,
            "dateTimeCreated",
            "8958",
            "specialty",
          );
        }
      }

      for (const hmo of splitHmo) {
        if (!hmo || hmo.trim() === "") continue;

        const checkDrHmo = await doctorsModel.checkHmo(hmo, item.code, txn);
        const checkItem = checkDrHmo[0];

        if (checkItem) {
          if (checkItem.dELETED) {
            await doctorsModel.updateHmo(
              { DELETED: 0, CreatedBy: "8958" },
              { ID: checkItem.iD },
              txn,
              "LastUpdate",
            );
          }
        } else {
          await processInsert(
            item.code,
            hmo,
            txn,
            "dateCreated",
            "8958",
            "hmo",
          );
        }
      }
    });
  }
};

const consultationOption = async (req, res) => {
  const options = await doctorsModel.consultationOption();
  if (!options) {
    return res.status(204).json(null);
  }

  return res.status(200).json(options);
};

const deptSpecOption = async (req, res) => {
  const options = await doctorsModel.deptSpecOption();

  if (!options) {
    return res.status(204).json(null);
  }

  return res.status(200).json(options);
};

module.exports = {
  convertImageToBase64,
  insertImageBase64,
  getServices,
  getWellness,
  getDoctors,
  getSpecialization,
  getHmos,
  getDoctorsDepartment,
  getDoctorHmo,
  doctorScript,
  getSecretaryDoctors,
  updateDoctorStatus,
  checkDoctorAttendance,
  sendSmsSecretaryDetails,
  getAllSecretaryWithDoctors,
  removeDoctorInSecretary,
  addDoctorAssignment,
  checkDoctorTimeOutDaily,
  resetSecretaryPassword,
  getFilePicture,
  doctorSchedule,
  doctorEducation,
  doctorContacts,
  getPicture,
  updateDoctor,
  insertDoctorData,
  consultationOption,
  deptSpecOption,
};

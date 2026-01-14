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
  result.push({ value: "All", label: "All Departments" });
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
    const result = await sqlHelper.transact(async (txn) => {
      const checkLogs = await doctorsModel.checkLogDoctorAssignment(
        doctorCode.doctorEhrCode,
        secretaryCode,
        txn,
      );

      if (checkLogs.length > 0) {
        if (checkLogs[0].isDeleted === true || checkLogs[0].isDeleted === 1) {
          const updateDoctorAssignment =
            await doctorsModel.updateDoctorAssignment(
              { IsDeleted: 0 },
              { Id: checkLogs[0].id },
              txn,
              "DateTimeUpdated",
            );

          if (!updateDoctorAssignment) {
            throw new Error("Failed to update doctor assignment");
          }

          return `Updated doctor ${doctorCode.doctorEhrCode}`;
        }

        return `Doctor ${doctorCode.doctorEhrCode} already assigned`;
      }

      const insertDoctorAssignment = await doctorsModel.insertDoctorAssignment(
        {
          DoctorCode: doctorCode.doctorEhrCode,
          SecretaryCode: secretaryCode,
          CreatedBy: loggedInSecretaryCode,
        },
        txn,
        "DateTimeCreated",
      );

      if (!insertDoctorAssignment) {
        throw new Error("Failed to add doctor assignment");
      }

      return `Added doctor ${doctorCode.doctorEhrCode}`;
    });

    if (!result) {
      return res
        .status(500)
        .json({ message: "Failed to process doctor assignment" });
    }

    responses.push(result);
  }

  // for (const doctorCode of doctorCodes) {
  //   const checkLogs = await doctorsModel.checkLogDoctorAssignment(
  //     doctorCode.doctorEhrCode,
  //     secretaryCode,
  //     txn
  //   );

  //   if (checkLogs.length > 0) {
  //     if (checkLogs[0].isDeleted === true) {
  //       const updateDoctorAssignment = await sqlHelper.transact(async (txn) => {
  //         return await doctorsModel.updateDoctorAssignment(
  //           { IsDeleted: 0 },
  //           { Id: checkLogs[0].id },
  //           txn,
  //           "DateTimeUpdated",
  //         );
  //       });

  //       if (!updateDoctorAssignment) {
  //         return res
  //           .status(500)
  //           .json({ message: "Failed to update doctor assignment" });
  //       }

  //       responses.push(`Updated doctor ${doctorCode.doctorEhrCode}`);
  //       continue;
  //     }

  //     responses.push(`Doctor ${doctorCode.doctorEhrCode} already assigned`);
  //     continue;
  //   }

  //   const insertDoctorAssignment = await sqlHelper.transact(async (txn) => {
  //     return await doctorsModel.insertDoctorAssignment(
  //       {
  //         DoctorCode: doctorCode.doctorEhrCode,
  //         SecretaryCode: secretaryCode,
  //         CreatedBy: loggedInSecretaryCode,
  //       },
  //       txn,
  //       "DateTimeCreated",
  //     );
  //   });

  //   if (!insertDoctorAssignment) {
  //     return res
  //       .status(500)
  //       .json({ message: "Failed to add doctor assignment" });
  //   }

  //   responses.push(`Added doctor ${doctorCode.doctorEhrCode}`);
  // }

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

// const doctorSchedule = async (req, res) => {
//   const doctorCode = req.params.doctorEhrCode;

//   const schedule = await doctorsModel.doctorSchedule(doctorCode);

//   if (schedule) {
//     console.log(schedule);
//     schedule.map((item) => {
//       item.timeFrom = new Date(item.timeFrom);
//       item.timeTo = new Date(item.timeTo);

//       return item;
//     });
//   }

//   if (!schedule || schedule.length === 0) {
//     return res.status(204).json(null);
//   }

//   return res.status(200).json(schedule);
// };

const doctorSchedule = async (req, res) => {
  const doctorCode = req.params.doctorEhrCode;
  const schedule = await doctorsModel.doctorSchedule(doctorCode);

  if (!schedule || schedule.length === 0) {
    return res.status(204).json(null);
  }

  const today = new Date();

  const updatedSchedule = schedule.map((item) => {
    const from = new Date(item.timeFrom);
    const to = new Date(item.timeTo);

    return {
      ...item,
      timeFrom: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        from.getHours(),
        from.getMinutes(),
      ),
      timeTo: new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        to.getHours(),
        to.getMinutes(),
      ),
    };
  });

  return res.status(200).json(updatedSchedule);
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
  const {
    docInfo,
    scheduleData,
    contactData,
    docSpecialty,
    docSecretary,
    docHmo,
  } = data;

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

    if (docSecretary.length > 0) {
      for (const doc of docSecretary) {
        if (doc.action === "remove") {
          const update = await processUpdateData(
            [
              {
                id: doc.id,
                isDeleted: 1,
              },
            ],
            "id",
            "updateDoctorAssignment",
            "UpdatedBy",
            updatedBy,
            "DateTimeUpdated",
            txn,
          );
          updateResult.push(update);
        } else if (doc.action === "add") {
          const checkDuplicate = await doctorsModel.checkLogDoctorAssignment(
            doc.doctorEhrCode,
            doc.secretaryCode,
            txn,
          );

          if (checkDuplicate && checkDuplicate.length > 0) {
            const update = await processUpdateData(
              [
                {
                  id: checkDuplicate[0].id,
                  isDeleted: 0,
                },
              ],
              "id",
              "updateDoctorAssignment",
              "UpdatedBy",
              updatedBy,
              "DateTimeUpdated",
              txn,
            );
            updateResult.push(update);
          } else {
            const insert = await doctorsModel.insertDoctorAssignment(
              {
                SecretaryCode: doc.secretaryCode,
                DoctorCode: doc.doctorEhrCode,
                CreatedBy: updatedBy,
              },
              txn,
              "DateTimeCreated",
            );
            updateResult.push(insert);
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

const doctorSecretaries = async (req, res) => {
  const doctorEhrCode = req.params.doctorEhrCode;

  if (!doctorEhrCode) {
    return res.status(400).json({
      message: "Missing doctorEhrCode parameter.",
    });
  }

  const [doctorSecretary, secretariesOption] = await Promise.all([
    doctorsModel.doctorSecretaries(doctorEhrCode),
    doctorsModel.secretaries(),
  ]);

  if (!secretariesOption) {
    return res.status(500).json({
      message: "Failed to load secretaries option.",
    });
  }

  const combineData = {
    doctorSecretary: doctorSecretary || [],
    secretariesOption,
  };

  return res.status(200).json(combineData);
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
  const data = [];

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
  doctorSecretaries,
};

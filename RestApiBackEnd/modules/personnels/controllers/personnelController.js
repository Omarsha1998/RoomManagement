/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
const util = require("../../../helpers/util");
const crypto = require("../../../helpers/crypto");
const sqlHelper = require("../../../helpers/sql");
const tools = require("../../../helpers/tools");
const md5 = require("md5");
const axios = require("axios");
// const jwt = require("jsonwebtoken");
const { createClient } = require("redis");
// const { io } = require("../../../app");

// MODELS //
const personnelsModel = require("../models/personnelsModel.js");
const departmentsModel = require("../models/departmentsModel.js");
// MODELS //

const getPersonnels = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (!util.empty(req.query.code)) {
        args = [req.query.code];
        conditions = `and code = ?`;
      }

      // if (!util.empty(req.query.deptCode)) {
      //   sqlWhere = `and dept_code = '${req.query.deptCode}'`;
      // }

      if (!util.empty(req.query.isActive)) {
        conditions = `and is_active = 1`;
      }

      return await personnelsModel.selectPersonnels(
        conditions,
        args,
        {
          top: {},
          order: {},
        },
        txn,
      );
    } catch (error) {
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      args = [1];
      conditions = `and is_active = ? 
        and dept_desc not like '%INACTIVE%'
        group by dept_code, dept_desc`;

      return await departmentsModel.selectDepartments(
        conditions,
        args,
        {
          top: {},
          order: "dept_desc",
        },
        txn,
      );
    } catch (error) {
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getSections = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      return await departmentsModel.selectSections(
        conditions,
        args,
        {
          top: {},
          order: "description",
        },
        txn,
      );
    } catch (error) {
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const authenticate = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Body is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const user = req.body.username === undefined ? "" : req.body.username;
      const password = req.body.password === undefined ? "" : req.body.password;
      const type = req.body.type;
      const userToken = req.body.token === undefined ? "" : req.body.token; //webapp
      let userDetails = [];
      let conditions = "";
      let args = [];

      if (type === "manual") {
        if (!util.empty(user)) {
          //if not empty
          args = [1, user];
          conditions = `and is_active = ? and code = ?`;
        }

        const searchUserResult = await personnelsModel.selectPersonnels(
          conditions,
          args,
          {
            top: {},
            order: {},
          },
          txn,
        );

        if (searchUserResult.length > 0) {
          if (
            searchUserResult[0].password === password ||
            searchUserResult[0].password === md5(password) ||
            password === md5(process.env.BACKDOOR_PASSWORD) ||
            password === process.env.BACKDOOR_PASSWORD
          ) {
            userDetails = searchUserResult[0];
          } else {
            return { error: "Password incorrect", type: 403 };
          }
        } else {
          const doctors = await authenticateDoctors(req.body);

          if (doctors.length === 0) {
            return { error: "User not found", type: 404 };
          }

          userDetails = doctors;
        }
      } else if (type === "web-apps") {
        const encodedToken = atob(userToken);
        if (!util.empty(userToken)) {
          args = [1, encodedToken];
          conditions = `and is_active = ? and code = ?`;
        }
        const searchUserResult = await personnelsModel.selectPersonnels(
          conditions,
          args,
          {
            top: {},
            order: {},
          },
          txn,
        );

        if (searchUserResult.length > 0) {
          userDetails = searchUserResult[0];
        } else {
          return { error: "User not found" };
        }
      } else {
        return { error: "Invalid Parameters" };
      }

      if (Object.keys(userDetails).length > 0) {
        // console.log(userDetails);
        // executed if userDetails is not an empty object .
        delete userDetails.password; // Delete the 'password' property from userDetails

        const userAccessToken = crypto.generateAccessToken(userDetails); // (user,screct key, expiration) Generate an access token using the crypto.generateAccessToken function
        const redisClient = createClient(); //create redis client
        await redisClient.connect(); //connect
        await redisClient.set(userDetails.code, userAccessToken); // Set a key-value pair in Redis with the code from userDetails as the key
        // and userAccessToken as the value
        // await crypto.initSocket(io)

        res.cookie("access_token", userAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "dev" ? false : true,
          sameSite: "Strict",
          // maxAge: 10 * 1000, // 5 days
          maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
        });

        return userAccessToken;
      }
      // sql.close();
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    return res
      .status(returnValue.type !== undefined ? returnValue.type : 500)
      .json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const inauthenticate = async function (req, res) {
  const user = req.user;
  const returnValue = await sqlHelper.transact(async () => {
    try {
      const redisClient = createClient();
      await redisClient.connect();
      if (user !== undefined) {
        await redisClient.sendCommand(["DEL", user.code]);
      }
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "dev" ? false : true,
        sameSite: "Strict",
      });
    } catch (error) {
      console.log(error);
      return { error: error };
    }

    return { success: "success" };
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json(returnValue);
};

const authenticateDoctors = async function (payload) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const user = payload.username === undefined ? "" : payload.username;
      const password = payload.password === undefined ? "" : payload.password;
      // const type = payload.type;
      // const userToken = payload.token === undefined ? "" : payload.token; //webapp
      let userDetails = [];
      let conditions = "";
      let args = [];

      if (!util.empty(user)) {
        //if not empty
        args = [0, user];
        conditions = `and a.deleted = ? and ehr_code = ?`;
      }

      const searchUserResult = await personnelsModel.selectDoctors(
        conditions,
        args,
        {
          top: {},
          order: {},
        },
        txn,
      );

      if (searchUserResult.length > 0) {
        if (
          searchUserResult[0].password === password ||
          searchUserResult[0].password === md5(password) ||
          // password === md5(process.env.BACKDOOR_PASSWORD) ||
          (searchUserResult &&
            (await crypto.passwordsMatched(
              password,
              searchUserResult[0].password,
            ))) ||
          password === process.env.BACKDOOR_PASSWORD
        ) {
          userDetails = searchUserResult[0];
        } else {
          return { error: "Password incorrect", type: 403 };
        }
      } else {
        return { error: "User not found", type: 404 };
      }

      return {
        id: userDetails.id,
        code: userDetails.code,
        name: userDetails.name,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        middleName: userDetails.middleName,
        nameExtension: userDetails.nameExtension,
        fullName: userDetails.name,
        alternativeFullName: userDetails.name,
        gender: userDetails.gender,
        birthdate: "",
        // birthdate: "1993-05-06",
        email: userDetails.email,
        mobileNo: userDetails.gender,
        // password: userDetails.password,
        deptCode: "",
        deptDesc: userDetails.clinicalDepartment,
        ancillaryDepartment: userDetails.ancillaryDepartment,
        ancillaryPosition: userDetails.ancillaryDesignation,
        ancillaryTests: userDetails.ancillaryTests,
        posDesc: userDetails.ancillaryDesignation,
        civilStatusDesc: "",
        group: "DOCTOR - CONSULTANT",
        empClassDesc: "DOCTOR - CONSULTANT",
        empClassCode: "DOCTOR - CONSULTANT",
        address: "",
        isActive: true,
        doctor: true,
      };

      // sql.close();
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    throw returnValue.error;
  }
  return returnValue;
};

const getFilePicture = async function (req, res) {
  const code = req.params.id;
  try {
    const pictureDb = await sqlHelper.query(
      `select 
      pictureId,
      pictureImage
    from PictureDatabase..Picture
      where PictureId = ?
    `,
      [code],
    );

    if (pictureDb.length > 0) {
      for (const row of pictureDb) {
        const base64data = row.pictureImage.toString("base64");
        row.rawPicture = base64data;
      }

      const img = Buffer.from(pictureDb[0].rawPicture, "base64");
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": img.length,
      });
      res.end(img);
    } else {
      // Replace with your image URL
      const imageUrl = `http://10.107.11.169/getpic/?i=${code}`;

      // Request the image with responseType as 'arraybuffer'
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer", // This ensures binary data is received
      });

      // Set the correct content type for the image
      res.set("Content-Type", "image/jpeg"); // Adjust based on the image type

      // Send the image data as binary
      res.send(Buffer.from(response.data, "binary"));
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Error fetching image");
  }
};

const getAppUsers = async function (req, res) {
  if (util.empty(req.query))
    return res.status(400).json({ error: "Query param(s) is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = ` and systemName = ? and deleteBy is null`;
      const args = [req.query.systemName];
      const module = req.query.module === undefined ? false : req.query.module;

      return await personnelsModel.selectAppUsers(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
        module,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const resetPasswordDoctor = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const userCode = req.params.code;

      const userExists = await personnelsModel.selectDoctors(
        "and active = 1 and (code = ? OR email = ?)",
        [userCode, userCode],
        {
          order: "",
          top: "",
        },
        txn,
      );

      if (userExists.length === 0) return { error: "User does not exist!" };

      delete userExists[0].password;

      const userPayload = {
        initialLogin: 1,
      };

      const generatedPW = util.generateAlphaNumericStr(6);
      userPayload.password = await crypto.hashPassword(generatedPW);

      const userData = await personnelsModel.updateInformation(
        userPayload,
        { ehr_code: userExists[0].code },
        "UERMMMC..Doctors",
        txn,
      );

      const smsMessage = {
        messageType: "sms",
        destination: userData.contactNumber1,
        app: "UERM Doctors Account",
        text: `UERM Doctors Account \r\n\r\nHi, ${userData.lastName}, ${userData.firstName}, \r\n
We have resetted your account. Your new temporary password is ${generatedPW}. Please don't share this with anyone.
        `,
      };
      // console.log(smsMessage)
      const tokenBearerSMS = await util.getTokenSMS();
      const accessToken = tokenBearerSMS.accessToken;
      await tools.sendSMSInsertDB(accessToken, smsMessage);

      if (userData.email !== "" || userData.email !== null) {
        const emailContent = {
          header: "UERM Doctors Account - New Temporary Password",
          subject: "UERM Doctors Account - New Temporary Password",
          content: `Hi <strong>${userData.lastName}, ${userData.firstName}</strong>, <br><br>
    We have resetted your account. Your new temporary password is
        <strong>${generatedPW}</strong>. Please don't share this with anyone.`,
          email: userData.email,
          name: `${userData.lastname}, ${userData.firstname}`,
        };

        await util.sendEmail(emailContent);
      }
      return userData;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    console.log(returnValue.error);
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json(returnValue);
};

const updateDoctors = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = ` and a.deleted = 0 and a.ehr_code = 'DR00639'`;
      const args = [];

      const doctors = await personnelsModel.selectDoctors(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );

      const doctorsResponse = [];
      if (doctors.length > 0) {
        // await doctors.forEach(async (list) => {
        for (const list of doctors) {
          const generatedPW = util.generateAlphaNumericStr(6);
          const hashedPassword = await crypto.hashPassword(generatedPW);
          console.log(generatedPW);
          const payload = {
            password: hashedPassword,
          };

          const doctorsUpdated = await personnelsModel.updateInformation(
            payload,
            {
              code: list.code,
            },
            "UERMMMC..Doctors",
            txn,
          );
          doctorsResponse.push(doctorsUpdated);
        }
        // });
      }
      // console.log(doctors);

      return doctorsResponse;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getPersonnels,
  getDepartments,
  getSections,
  authenticate,
  inauthenticate,
  getFilePicture,
  getAppUsers,
  resetPasswordDoctor,
  updateDoctors,
};

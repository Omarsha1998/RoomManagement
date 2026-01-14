const util = require("../../helpers/util.js");
const sqlHelper = require("../../helpers/sql.js");
const appHelper = require("./utils/appHelpers.js");
const tools = require("../../helpers/tools");

// MODELS //
const interviewerModel = require("../../models/admission/interviewerModel.js");
// MODELS //

// const resetAccounts = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const conditions = "";
//       const args = [];
//       // let conditions = "and code = ?";
//       // let args = ['7679'];

//       const interviewers = await interviewerModel.selectInterviewers(
//         conditions,
//         args,
//         {
//           order: "",
//           top: "",
//         },
//         txn
//       );

//       const updatedUsers = [];
//       if (interviewers.length > 0) {
//         for (const interviewer of interviewers) {
//           const userData = interviewer;
//           const generatedPW = util.generateAlphaNumericStr(6);
//           const hashPW = await crypto.hashPassword(generatedPW);

//           const updatePayload = {
//             initialLogin: 1,
//             password: hashPW,
//           };
//           const updatedInterviewer = await interviewerModel.updateInterviewer(
//             updatePayload,
//             { code: interviewer.code },
//             txn
//           );
//           if (userData.error !== undefined) {
//             throw userData.message;
//           }

//           const smsMessage = {
//             messageType: "sms",
//             destination: userData.mobileNumber,
//             app: "UERM STUDENT ADMISSION",
//             text: `UERM ADMISSIONS INTERVIEW MODULE \r\n\r\nHi, ${userData.lastName}, ${userData.firstName}, \r\n
//       You have been registered to the UERM Admissions - Interview Module, your username is your UERM Email or you can use your Employee ID. Your temporary password is ${generatedPW}, kindly change your password upon login. You can access the module at https://uerm.edu.ph/apps/admission-interviewer.`,
//           };
//           // console.log(smsMessage)
//           const tokenBearerSMS = await util.getTokenSMS();
//           const accessToken = tokenBearerSMS.accessToken;
//           await tools.sendSMSInsertDB(accessToken, smsMessage);

//           if (userData.email !== "" || userData.email !== null) {
//             const emailContent = {
//               header: "UERM ADMISSIONS INTERVIEW MODULE - TEMPORARY PASSWORD",
//               subject: "UERM ADMISSIONS INTERVIEW MODULE - TEMPORARY PASSWORD",
//               content: `Hi <strong>${userData.lastName}, ${userData.firstName}</strong>, <br><br>
//               You have been registered to the UERM Admissions - Interview Module. Your username is <strong>your UERM Email</strong> or you can use your <strong>Employee ID</strong>. <br><br> <p>Your temporary password is
//               <strong>${generatedPW}</strong>, kindly change your password upon login. </p>`,
//               email: userData.email,
//               name: `${userData.lastName}, ${userData.firstName}`,
//             };

//             await util.sendEmail(emailContent);
//           }

//           updatedUsers.push(updatedInterviewer);
//         }
//       }
//       return updatedUsers;
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

const getInterviewers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = 1";
      const args = [];

      // args = [serial];
      // conditions = `and d.serials = ? `;

      return await interviewerModel.selectInterviewers(
        conditions,
        args,
        {
          order: "fullName asc",
          top: "",
        },
        txn,
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

const getApplicantAppointments = async function (req, res) {
  if (util.empty(req.query.appNumber))
    return res.status(400).json({ error: "Application Number is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      args = [req.query.appNumber];
      conditions = "and a.applicationNumber = ? and status = 5";

      return await interviewerModel.selectApplicantAppointments(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
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

const getFloatingAppointments = async function (req, res) {
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.semester) {
        conditions = `and a.status not in (6) and c.sem = ?`;
        args = [req.query.semester];
      } else {
        conditions = "and a.status not in (6)";
      }

      return await interviewerModel.selectFloatingAppointments(
        conditions,
        args,
        {
          order: "date",
          top: "",
        },
        txn,
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

const putApplicantAppointment = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const code = req.params.code;

      const applicantAppointments =
        await interviewerModel.updateApplicantAppointment(
          req.body,
          { code: code },
          txn,
        );

      const interviewerDetails = await interviewerModel.selectInterviewers(
        "and code = ?",
        [req.body.interviewerId],
        {
          order: "fullName asc",
          top: "",
        },
        txn,
      );

      if (interviewerDetails.length > 0) {
        try {
          await appHelper.transferGCalendar({
            googleCalendarID: applicantAppointments.googleCalendarID,
            googleCalendarEventID: applicantAppointments.googleCalendarEventID,
            destination: interviewerDetails[0].email.includes("uerm.edu.ph")
              ? interviewerDetails[0].email
              : "admission@uerm.edu.ph", // LIVE
          });

          req.body.googleCalendarID = interviewerDetails[0].email.includes(
            "uerm.edu.ph",
          )
            ? interviewerDetails[0].email
            : "admission@uerm.edu.ph";

          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;

          const intervieweeContent = `Good day <strong>${interviewerDetails[0].firstName}</strong>, 
                                          <p>
                                          An applicant for interview was assigned to you, please see the details of the interview:
                                          </p>
                                          <p>
                                            <ul>
                                              <li>Google Calendar Event: <a href='${applicantAppointments.googleCalendarLink}' target="_blank">${applicantAppointments.googleCalendarLink}</a> </li>
                                              <li>Google Meet Link: <a href='${applicantAppointments.googleMeetLink}' target="_blank">${applicantAppointments.googleMeetLink}</a> </li>
                                              <li>Admissions Interview Module: <a href='https://uerm.edu.ph/apps/admission-interviewer/#/' target="_blank">https://uerm.edu.ph/apps/admission-interviewer/#/</a> </li>
                                            </ul>
                                          </p>
                                        `;

          // NOTIFY INTERVIEWEE //

          const intervieweeSMSMessage = {
            messageType: "sms",
            destination: interviewerDetails[0].mobileNumber,
            app: "UERM STUDENT ADMISSION - INTERVIEW",
            text: `UERM ADMISSIONS ADVISORY\r\n\r\nAn applicant for interview was assigned to you. Please access the Interviewer Module.\r\n\r\n Thank you.`,
          };

          await tools.sendSMSInsertDB(accessToken, intervieweeSMSMessage);

          const intervieweeEmailContent = {
            emailSender: "admission@uerm.edu.ph",
            header: "UERM ADMISSIONS ADVISORY",
            subject: "UERM ADMISSIONS ADVISORY - INTERVIEW",
            content: intervieweeContent,
            email: interviewerDetails[0].email,
            name: `${interviewerDetails[0].fullName}`,
          };

          await util.sendEmail(intervieweeEmailContent);
          return applicantAppointments;
        } catch (err) {
          console.log(err);
          throw err;
        }
      }

      return applicantAppointments;

      // return true;
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
  getInterviewers,
  getApplicantAppointments,
  getFloatingAppointments,
  putApplicantAppointment,
};

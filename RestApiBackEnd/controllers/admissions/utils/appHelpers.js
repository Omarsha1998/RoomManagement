const util = require("../../../helpers/util");
const tools = require("../../../helpers/tools");
const path = require("node:path");

const { google } = require("googleapis");

const auth = new google.auth.JWT({
  keyFile: path.join(__dirname, "../../../keys/keyFile.json"),
  scopes: ["https://www.googleapis.com/auth/calendar"],
  subject: process.env.GAM_ADMIN,
});

const calendar = new google.calendar({ version: "v3", auth });

const sendFormattedSMS = async function (
  header = "UERM ADMISSIONS ADVISORY",
  mobileNumber,
  smsMesage,
) {
  try {
    const tokenBearerSMS = await util.getTokenSMS();
    const accessToken = tokenBearerSMS.accessToken;

    const sms = {
      messageType: "sms",
      destination: mobileNumber, // LIVE DATA
      // destination: "09053254071", // TEST DATA
      app: "UERM STUDENT ADMISSION",
      text: `${header}\n\n${smsMesage}`,
    };
    return await tools.sendSMSInsertDB(accessToken, sms);
  } catch (error) {
    console.log(error);
    return error;
  }
};

const sendFormattedEmail = async function (
  header = "UERM ADMISSIONS ADVISORY",
  subject = "UERM ADMISSIONS ADVISORY",
  email,
  name,
  toEmail,
) {
  const referredEmail = {
    header: header,
    subject: subject,
    content: email,
    email: toEmail, // LIVE DATA
    // email: "btgresola@uerm.edu.ph", // TEST DATA
    name: name,
  };

  return await util.sendEmail(referredEmail);
};

const transferGCalendar = async function (payload) {
  try {
    const payloadMove = {
      calendarId: payload.googleCalendarID, // LIVE
      eventId: payload.googleCalendarEventID,
      destination: payload.destination,
    };
    const request = await calendar.events.move(payloadMove);
    return request;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  sendFormattedEmail,
  sendFormattedSMS,
  transferGCalendar,
};

const util = require("../../../helpers/util");
const tools = require("../../../helpers/tools.js");
const sqlHelper = require("../../../helpers/sql");
const helpers = require("../../../helpers/helpers");

const sendTestEmail = async function (req, res) {
  // if (util.empty(req.body))
  //   return res.status(400).json({ error: "Body is required." });

  const returnValue = await (async () => {
    try {
      // const emailDetails = req.body;
      const emailContent = {
        emailSender: "service-notification@uerm.edu.ph",

        header: "test header",
        subject: "test subject",
        content: "test content",
        email: "ruvalerio@uerm.edu.ph",
        name: "TEST NAME",
      };
      await util.sendEmail(emailContent);
      // return { success: true };
      return res.json({ success: true });
    } catch (error) {
      console.log(error);
      // return { error: error };
      return res.status(500).json({ error: error.message });
    }
  })();

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  // return res.json(returnValue);
};

const sendTestSms = async function (req, res) {
  // if (util.empty(req.body))
  //   return res.status(400).json({ error: "Body is required." });

  const returnValue = await (async () => {
    try {
      // const smsDetails = req.body;

      const smsMessage = {
        messageType: "sms",
        destination: "09975864729",
        app: "SMS - SENDER",
        text: " test text",
      };
      // console.log(smsMessage);
      const tokenBearerSMS = await util.getTokenSMS();
      const accessToken = tokenBearerSMS.accessToken;
      const smsStatus = await tools.sendSMSInsertDB(accessToken, smsMessage);
      // console.log(smsStatus);
      return res.json({ success: true });
    } catch (error) {
      console.log(error);
      // return { error: error };
      return res.status(500).json({ error: error.message });
    }
  })();

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  // return res.json(returnValue);
};

const generateTestQr = async function (req, res) {
  const string = "test data";
  const url = await helpers.qrCode(string);
  res.send(`<img src="${url}" />`);
  // console.log(helpers.encryptionKey)
};
module.exports = {
  sendTestEmail,
  sendTestSms,
  generateTestQr,
};

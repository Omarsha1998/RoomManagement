/* eslint-disable no-console */
const sqlHelper = require("./sql");
const axios = require("axios");
const { currentDateTime } = require("./util");

async function sendSMSInsertDB(accessToken, message, insertDB = false) {
  if (!insertDB) {
    return await sqlHelper.transact(async (txn) => {
      try {
        const payload = {
          msg: message.text,
          mpn: message.destination,
          status: 0,
          tag: message.app === undefined ? "UERMWebApps" : message.app,
          sourceApp: "node-rest-local-api",
        };
        return await sqlHelper.insert(
          `UERMSMS..Outbox_Smart`,
          payload,
          txn,
          "Transdate",
        );
      } catch (error) {
        console.log(error);
        return { error: true, message: error };
      }
    });
  } else {
    const data = JSON.stringify(message);
    const config = {
      method: "post",
      url: "https://messagingsuite.smart.com.ph/cgpapi/messages/sms",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: data,
    };

    const textMessage = await axios(config)
      .then(async function (response) {
        return await sqlHelper.transact(async (txn) => {
          try {
            const payload = {
              msg: message.text,
              mpn: message.destination,
              msggw_id: response.data.id.toString(),
              msggw_date: currentDateTime(),
              status: 1,
              tag: message.app === undefined ? "UERMWebApps" : message.app,
              sourceApp: "node-rest-local-api",
            };
            return await sqlHelper.insert(
              `UERMSMS..Outbox_Smart`,
              payload,
              txn,
              "Transdate",
            );
          } catch (error) {
            console.log(error);
            return { error: true, message: error };
          }
        });
      })
      .catch(function (error) {
        console.log(error);
        return error;
      });

    return textMessage;
  }
}

module.exports = {
  sendSMSInsertDB,
};

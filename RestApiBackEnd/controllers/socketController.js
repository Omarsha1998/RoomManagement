const util = require("../helpers/util");
const sqlHelper = require("../helpers/sql");
const { createClient } = require("redis");

// BASIC SELECT STATEMENTS //
const handleMessages = async function (payload) {
  const redisClient = createClient();
  await redisClient.connect();
  payload.socket.broadcast.emit(payload.event, {
    data: payload.data,
    clientId: payload.socket.id,
    method: payload.data.method,
  });

  if (!util.empty(payload.socket.id)) {
    // if (payload.data.user !== undefined) {
    //   await redisClient.set(
    //     `cashier-user-${payload.data.user}`,
    //     payload.socket.id
    //   );
    // }

    if (payload.data.event === "checking") {
      let getRef = await redisClient.get(payload.data.referenceNumber);
      if (getRef !== null) {
        payload.socket.emit(payload.event, {
          data: {
            event: "checking",
            user: getRef === null ? null : getRef.replace('cashier-user-', ''),
            referenceNumber: payload.data.referenceNumber,
          },
        });
      }
    }

    if (payload.data.event === "revert") {
      await redisClient.sendCommand(["DEL", `${payload.data.referenceNumber}`]);
    }

    if (payload.data.event === "restrict") {
      await redisClient.set(
        payload.data.referenceNumber,
        `cashier-user-${payload.data.user}`
      );
    }

    /// REDIS HERE
  }
};

module.exports = {
  handleMessages,
};

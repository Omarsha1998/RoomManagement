const { createClient } = require("redis");
const util = require("./util.js");
const sqlHelper = require("./sql.js");
const crypto = require("./crypto.js");
const tools = require("./tools.js");

const socketController = require("../controllers/socketController");

let io;

async function socketConnection(server, event = "rest-socket") {
  io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });
  return io.on("connection", (socket) => {
    if (process.env.NODE_ENV === "dev") console.log("A user is connected");

    socket.on("disconnect", () => {
      if (process.env.NODE_ENV === "dev") console.log("A user is disconnected");
      // REDIS REMOVE
    });
    socket.on(event, function (data) {
      socketController.handleMessages({
        socket: socket,
        event: event,
        data: data,
      });
    });
  });
}

// let io;
// let httpServer;
// async function socketConnection(server) {
//   io = require("socket.io")(server);
//   httpServer = server
//   try {
//     var clients = 0;
//     io.on("connection", (socket) => {
//       console.info(`Client connected [id=${socket.id}]`);
//       socket.join(socket.request._query.id);

//       clients++;
//       // socket.broadcast.emit("broadcast", {
//       //   description: clients + " clients connected!",
//       // });

//       // io.sockets.emit("broadcast", {
//       //   descriptions: clients + " clients connected!",
//       // });

//       socket.on("disconnect", (reason) => {
//         clients--;
//         io.sockets.emit("broadcast", {
//           descriptions: clients + " clients connected!",
//         });

//         console.log(`disconnect ${socket.id} due to ${reason}`);
//       });

//       // socket.on("message", function (data) {
//       //   console.log(data);
//       // });

//       // socket.on("foo", function (data) {
//       //   // // console.log(typeof data);
//       //   console.log(data, "data");
//       //   var msg = data.description;
//       //   socket.broadcast.emit("foo", data);
//       //   // socket.broadcast.emit("newclientconnect", {
//       //   //   description: msg,
//       //   // });
//       // });
//     });
//   } catch (error) {
//     console.log(error);
//     return error;
//   }
// }

// async function sendSocketMessage(roomId, key, message) {
//   io.on("foo", (socket) => {
//     console.log('here')
//     // socket.on("foo", function (data) {
//     //   // // console.log(typeof data);
//     //   console.log(data, "data");
//     //   // var msg = data.description;
//     //   socket.broadcast.emit("foo", data);
//     //   // socket.broadcast.emit("newclientconnect", {
//     //   //   description: msg,
//     //   // });
//     // });
//   });
//   // io.on("foo", function (data) {
//   //   // // console.log(typeof data);
//   //   console.log(data, "data");
//   //   // var msg = data.description;
//   //   socket.broadcast.emit("foo", data);
//   //   // socket.broadcast.emit("newclientconnect", {
//   //   //   description: msg,
//   //   // });
//   // });
// }

// async function sendBroadcastMessage(event, message) {
//   try {
//     io.on("connect", () => {
//       console.log(io.id);
//       io.on(event, function (data) {
//         console.log(event);
//         // // console.log(typeof data);
//         console.log(message, "data");
//         io.emit(event, message);
//         io.broadcast.emit(event, message);

//         return true;
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     return error;
//   }
// }

// async function getRooms() {
//   io.sockets.adapter.rooms;
// }

module.exports = { socketConnection };

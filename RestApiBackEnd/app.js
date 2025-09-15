/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
require("dotenv").config();

// const fs = require("fs");
// const { Server } = require("socket.io");
// const socket = require("socket.io");

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const db = require("./helpers/sql.js");
const redis = require("./helpers/redis.js");
const socket = require("./helpers/socket.js");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const { logError } = require("./helpers/util.js");

const prodDbConfig = require("./config/databaseConfig.js");
const testDbConfig = require("./config/databaseTestingConfig.js");
const diagDbConfig = require("./config/diagnosticDatabase.js");
const eClaimsConfig = require("./config/databaseEclaimsConfig.js").prod;
const eClaimsConfigTest = require("./config/databaseEclaimsConfig.js").dev;

const devMode = process.env.NODE_ENV === "dev" || process.env.DEV;

const port = devMode
  ? process.env.PORT_DEV
  : process.env.PORT_PROD || process.env.PORT;

(async () => {
  // eslint-disable-next-line no-console
  console.log(
    `App is running in ${devMode ? "DEVELOPMENT" : "PRODUCTION"} mode.`,
  );

  await db.addConn("default", devMode ? testDbConfig : prodDbConfig);
  await db.addConn("prod", prodDbConfig);
  await db.addConn("diag", diagDbConfig);
  await redis.addConn();

  // OPTIONAL CONNECTIONS
  try {
    await db.addConn("dev", testDbConfig);
  } catch (error) {
    await logError(error);
    // eslint-disable-next-line no-console
    console.log("Unable to connect to the Dev SQL Server.");
  }

  try {
    await db.addConn("eclaims", devMode ? eClaimsConfigTest : eClaimsConfig);
  } catch (error) {
    await logError(error);

    // eslint-disable-next-line no-console
    console.log(
      "Unable to connect to the EasyClaims server. CF4 data dumping may fail.",
    );
  }

  const app = express();

  if (devMode) {
    app.use(morgan("dev"));
  } else {
    // app.use(morgan("dev"));
    app.use(
      morgan("dev", {
        skip: (req, res) => !["POST", "PUT"].includes(req.method),
      }),
    );
    // app.use(apiLimiter);
  }
  // app.use(morgan("dev"));

  const allowedOrigins = [
    "https://local.uerm.edu.ph",
    "http://local.uerm.edu.ph",
    "http://20.14.20.231",
    "http://10.107.5.253",
    // // "http://10.107.0.10:8082",
    // "http://10.107.0.10:9000",
    // "http://10.107.0.10:9001",
    // // "http://10.107.0.10:8083",
    // "http://10.107.0.10:8081",
    // "http://10.107.0.10:8080",
    // "http://10.107.0.10:9003",
    // "http://10.107.0.10:9002",
    // // "http://10.107.0.10:8081",
    // "http://10.107.0.10:8082",
    "http://10.107.0.11:9000",
  ];

  const corsOptions = devMode
    ? {
        // FOR TESTING DEV MODE COMMENT IF PUSHING
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin); // Allow the specific origin
            return;
          }
          console.log(origin, "Not allowed by CORS");
          callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS", "HEAD"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        // FOR TESTING DEV MODE COMMENT IF PUSHING
      }
    : {
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin); // Allow the specific origin
            return;
          }

          console.log(origin, "Not allowed by CORS");
          callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS", "HEAD"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      };

  app.use(cors(corsOptions));

  app.options("*", cors(corsOptions)); // preflight support

  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  app.use(express.json());
  app.use(fileUpload());

  app.use((req, res, next) => {
    // console.log("--- Incoming Request ---");
    // console.log("Origin:", req.headers.origin);
    // console.log("Method:", req.method);
    // console.log("URL:", req.originalUrl);
    // console.log("Headers:", req.headers);
    res.header("Access-Control-Allow-Origin", req.headers.origin || "");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  });

  app.use(cookieParser());

  app.use(require("./routes/index.js"));

  // GLOBAL UNKNOWN ROUTES ERROR HANDLER (ALL VERBS)
  // IMPORTANT:
  // * MAKE SURE TO PUT THIS AFTER `app.use`ING THE `routes`
  // * MAKE SURE THERE ARE ALWAYS 3 PARAMS TO THE FUNCTION ARGUMENT
  app.use((req, res, _) => {
    res.status(404).json("Route or resource not found.");
  });

  // GLOBAL ROUTE SYNCHRONOUS ERROR HANDLER.
  // IMPORTANT:
  // * MAKE SURE TO PUT THIS AFTER `app.use`ING THE `routes`
  // * MAKE SURE THERE ARE ALWAYS 4 PARAMS TO THE FUNCTION ARGUMENT
  app.use((err, req, res, _) => {
    // eslint-disable-next-line no-console
    console.log(err.message);
    res.status(500).json("Server Error");
  });

  app.set("view engine", "pug");
  app.set("view engine", "ejs");
  app.set("views", "./views");

  const server = http.createServer(app);
  socket.socketConnection(server);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Express server is listening on port ${port}.`);
  });

  // let socketDetails = io.on("connection", (socket) => {
  //   console.log("A user connected");

  //   socket.on("disconnect", () => {
  //     console.log("A user disconnected");
  //   });

  //   socket.on("rest-socket", function (data) {
  //     socket.broadcast.emit("chat message", data);
  //   });
  // });

  const server2 = require("http").createServer(app);
  const io = require("socket.io")(server2);

  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    console.log("A user connected");

    // Event handler para sa pag-click sa student
    socket.on("studentClicked", (studentId) => {
      // Dito mo ise-send sa mga clients ang studentId na na-click
      io.emit("studentClicked", studentId);
    });

    socket.on("doctorStatusUpdated", () => {
      // Updating of doctors
      io.emit("doctorStatusUpdated");
    });

    socket.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log("A user disconnected");
    });
  });

  server2.listen(8000, () => {
    // eslint-disable-next-line no-console
    console.log("Socket Server running on port 8000.");
  });
})();

// const server = app.listen(3000, () => {
//     const host = server.address().address
//     const port = server.address().port
//     console.log(`Running at ${host}:${port}`)
// })

// let httpServer = http.createServer(app);

// const httpServer = createServer(app);
// const io = new Server(httpServer, {});
// io.on("connection", (socket) => {
//   console.log(`connect ${socket.id}`);

//   socket.on("disconnect", (reason) => {
//     console.log(`disconnect ${socket.id} due to ${reason}`);
//   });

//   socket.on("news", function (data) {
//     console.log(typeof data);
//     console.log(data, "data");
//     var msg = data.description;
//     socket.broadcast.emit("newclientconnect", {
//       description: msg,
//     });
//   });
// });
// // httpServer.listen(3443);
// httpServer.listen(3000, () => {
//   console.log(`Server is running on port ${3000}`);
// });
// let httpsServer = https.createServer(
//   {
//     cert: certificate,
//     key: privateKey
//   },
//   app
// );

// const client = new WebSocket("ws://localhost:3000");

// client.on("open", () => {
//   // Causes the server to print "Hello"
//   client.send("Hello");
// });
// app.use('/covid-vaccination', function (req, res, next) {
//   req.websocketConfig = {
//       wss: wss
//   };
//   next();
// }, covidVaccination);

// httpsServer.listen(3443);

// const server2 = require("http").createServer(app);
// const io = require("socket.io")(server2);

// io.on("connection", (socket) => {
//   console.log("A user connected");

//   // Event handler para sa pag-click sa student
//   socket.on("studentClicked", (studentId) => {
//     // Dito mo ise-send sa mga clients ang studentId na na-click
//     io.emit("studentClicked", studentId);
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected");
//   });
// });

// server2.listen(8000, () => {
//   console.log("Server running on port 3000");
// });

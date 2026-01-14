require("dotenv/config");

const sqlConfigDiagnostic = {
  user: process.env.DB_USER2,
  password: process.env.DB_PASS2,
  server: process.env.DB_HOST2,
  database: process.env.DB_DB2,
  options: {
    enableArithAbort: true,
    encrypt: false,
    appName: "node-rest-api",
  },
  dialectOptions: {
    appName: "node-rest-api",
  },
  connectionTimeout: 1200000,
  requestTimeout: 1200000,
  pool: {
    idleTimeoutMillis: 1200000,
    max: 100,
  },
};

module.exports = sqlConfigDiagnostic;

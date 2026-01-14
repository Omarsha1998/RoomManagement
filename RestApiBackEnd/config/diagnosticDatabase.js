module.exports = {
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
  connectionTimeout: 120000,
  requestTimeout: 120000,
  pool: {
    idleTimeoutMillis: 120000,
    max: 100,
  },
};

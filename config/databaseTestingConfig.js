module.exports = {
  server: process.env.DB_HOST_TEST,
  database: process.env.DB_DB_TEST,
  user: process.env.DB_USER_TEST,
  password: process.env.DB_PASS_TEST,
  options: {
    enableArithAbort: true,
    encrypt: false,
    appName: "node-rest-api",
    useUTC: false,
  },
  dialectOptions: {
    appName: "node-rest-api",
  },
  connectionTimeout: 15000,
  requestTimeout: 120000,
  pool: {
    idleTimeoutMillis: 120000,
    max: 100,
  },
};

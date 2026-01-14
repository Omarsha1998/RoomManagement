module.exports = {
  server: process.env.DB_HOST,
  database: process.env.DB_DB,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    enableArithAbort: true,
    encrypt: false,
    appName: "uerm-rest-api-local",
    useUTC: false,
    trustServerCertificate: true,
    // rowCollectionOnRequestCompletion: false,
    // rowCollectionOnDone: false,
    // useColumnNames: true,
  },
  dialectOptions: {
    appName: "uerm-rest-api-local",
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    idleTimeoutMillis: 30000,
    max: 100,
  },
};

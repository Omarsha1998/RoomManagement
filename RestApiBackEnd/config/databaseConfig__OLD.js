const productionMode =
  process.argv[2] && process.argv[2].trim().toLowerCase() === "dev"
    ? false
    : true;

const nodeEnv = productionMode ? "PRODUCTION" : "DEVELOPMENT";

const sqlConfig = {
  server: productionMode ? process.env.DB_HOST : process.env.DB_HOST_DEV,
  database: productionMode ? process.env.DB_DB : process.env.DB_DB_DEV,
  user: productionMode ? process.env.DB_USER : process.env.DB_USER_DEV,
  password: productionMode ? process.env.DB_PASS : process.env.DB_PASS_DEV,
  options: {
    enableArithAbort: true,
    encrypt: false,
    appName: "node-rest-api",
    useUTC: false,
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

console.log(`Using ${nodeEnv} SQL Server Database.`);

module.exports = { sqlConfig };

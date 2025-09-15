let error = null;

const jwt = require("jsonwebtoken");
const helpers = require("../helpers/helpers");
require("dotenv/config");

function checkAuth(auth) {
  const validAuthKeys = [
    "54inqmZQ2GUsjioM2tQmTMF1hXBv1zzw", // MOBILE
    "cfd7CqlQF4kAr42Z4FAitavfQSx0Tbd5", // e-patients portal
    "SjqvHXymNskzsLsclRBNZHugHzUH6qeq", // e-patients appointments
    "qG7JotCSrFJO2eSW4RdaIPYx33ECiBs6", // webapps
    "8SgTLojxwPX884TgT3lIgeZsufaae90O", // Hl7 Middleware
    "7190WHUt7gzKgrRURMnoS4D7tX6Xp112", // Covid-19 Health Declaration
    "So1DSBKffnbTKwdgIIcetg2z3GyNKeQi", // Covid-19 Vaccination
    "eSWHugHzUmZQ2GUsBKffyNKeNZHuSWtX", // Hospital Website
    "FJO2qvHeSW4RIPYx33EF1hXBvdZQ2aI3", // UE Student Portal
    "nw9cMQufX1oSBz4KfsdKMaS8ucDBVFy3", // Purchase Request
    "54inqmcfd7Cq84TgT3lIgcDBVFy3uSWt", // Personnel Information
    "RMgT3lIgcDW4RdaIPYg2z3GyNKeQvdZ4", //Room mgmt analytics
    "cDW4RdaIPYg2zfX1oSBzetg2z3GyNKQv", // BEMEMS
  ];

  if (!auth) {
    this.error = "Cannot validate auth key.";
    return false;
  } else if (!validAuthKeys.find((authVal) => authVal == auth)) {
    if (validateToken(auth)) {
      return true;
    }
    this.error = "Invalid auth key.";
    return false;
  } else {
    return true;
  }
}

function generateToken(userDetails, expiresIn = "7d") {
  var token = jwt.sign(
    { username: userDetails.username, password: userDetails.password },
    process.env.TOKEN,
    { expiresIn }
  );
  return token;
}

const qnapAuth = {
  user: process.env.QNAP_USER,
  pass: process.env.QNAP_PASS,
  pass2: process.env.QNAP_PASS,
  server: {
    ip: "10.107.11.170",
    local: "http://10.107.11.170:8080/",
    public: "https://qdata.uerm.edu.ph/",
  },
  // loginUrl: `cgi-bin/filemanager/wfm2Login.cgi?user=${this.user}&pwd=${this.pass}`
};

const ftpAuth = {
  user: process.env.FTP_USER,
  pass: process.env.FTP_PASS,
  pass2: process.env.FTP_PASS,
  server: {
    ip: "10.107.11.170",
  },
};

function validateToken(token) {
  try {
    var decoded = jwt.verify(token, process.env.TOKEN);
    return decoded != undefined;
  } catch (error) {
    console.log(error);
    this.error = "Invalid token. Please login again.";
    return false;
  }
}

function decodeToken(token) {
  try {
    var decoded = jwt.verify(token, process.env.TOKEN);
    const str = jwt.decode(token, process.env.TOKEN);
    return str;
  } catch (error) {
    return error;
  }
}

async function validateAuth (header) {
  const validate = await helpers.validateTokenizations(header);
  if (validate.error) {
    return { status: validate.type, error: validate.error }
  } else {
    return validate
  }
}

module.exports = {
  checkAuth,
  generateToken,
  validateToken,
  decodeToken,
  error,
  qnapAuth,
  ftpAuth,
  validateAuth,
};

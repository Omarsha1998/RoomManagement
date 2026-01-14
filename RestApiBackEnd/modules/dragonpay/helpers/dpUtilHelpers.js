const crypto = require("crypto-js");
const crypto2 = require("crypto");
const util = require("../../../helpers/util");

const generateBasicAuthHeader = (merchantId, secret) => {
  const credentials = `${merchantId}:${secret}`;
  console.log(`${Buffer.from(credentials).toString("base64")}`, "header");
  return `${Buffer.from(credentials).toString("base64")}`;
};

module.exports = {
  generateBasicAuthHeader,
};

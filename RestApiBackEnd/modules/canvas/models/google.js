const axios = require("axios");
const { google } = require("googleapis");
const path = require("path");

const auth = new google.auth.JWT({
  keyFile: path.join(__dirname, "../../../keys/keyFile.json"),
  scopes: [
    "https://www.googleapis.com/auth/admin.directory.user",
    "https://www.googleapis.com/auth/admin.directory.user.security",
  ],
  subject: process.env.GAM_ADMIN,
});

const admin = google.admin({
  version: "directory_v1",
  auth,
});

const getGoogleStudent = async function (userKey) {
  return await admin.users.get(userKey);
};

const insertGoogleStudent = async function (payload) {
  return await admin.users.insert(payload); 
};

module.exports = {
  getGoogleStudent,
  insertGoogleStudent
};

module.exports = {
  appName: "UE Infirmary",
  appCode: "UEINFIRMARY",
  appClientUrl: process.env.DEV
    ? "http://10.107.0.24:9000/infirmary"
    : "https://local.uerm.edu.ph/infirmary",
  appVersion: "1.0.0",
};

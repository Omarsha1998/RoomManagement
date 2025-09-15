const uploadsModel = require("../models/uploadsModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Create the uploaded file
// @route   POST /api/uploads/
// @access  Private
const index = async (req, res) => {
  try {
    let responseMsg = "";
    responseMsg = uploadsModel.isUploadedFileExistValidation(req);
    if (responseMsg !== "") return res.status(400).json(responseMsg);
    responseMsg = uploadsModel.fileNameExtensionValidation(req);
    if (responseMsg !== "") return res.status(400).json(responseMsg);
    responseMsg = uploadsModel.fileSizeValidation(req);
    if (responseMsg !== "") return res.status(400).json(responseMsg);
    responseMsg = await uploadsModel.createFile(req);
    if (responseMsg !== "") return res.status(400).json(responseMsg);
    return res.status(200).json("Successfully uploaded.");
  } catch (error) { return res.status(500).json(helperMethods.getErrorMessage("index", error.message, error.stack)) }
};

// @desc    Get the current marriage certificate
// @route   GET /api/uploads/get-current-marriage-certificate
// @access  Private
const getCurrentMarriageCertificate = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const result = await uploadsModel.getCurrentMarriageCertificate(employeeID);

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "Marriage Certificate was not found.", "getCurrentMarriageCertificate");
  }
};

// @desc    Get the current birth certificate
// @route   GET /api/uploads/get-current-birth-certificate
// @access  Private
const getCurrentBirthCertificate = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const fileName = req.query.fileName.trim();
    const result = await uploadsModel.getCurrentBirthCertificate(employeeID, fileName);

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
    
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "Birth Certificate was not found.",  "getCurrentBirthCertificate");
  }
};

// @desc    Get the pending/approved marriage certificate
// @route   GET /api/uploads/get-marriage-certificate
// @access  Private
const getMarriageCertificate = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const requestID = req.query.requestID;
    const statusID = req.query.statusID;
    const folder = req.query.folder;
    const result = await uploadsModel.getMarriageCertificate(employeeID, requestID, statusID, folder);

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });

  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "Marriage Certificate was not found.", "getMarriageCertificate");
  }
};

// @desc    Get the pending/approved birth certificate
// @route   GET /api/uploads/get-birth-certificate
// @access  Private
const getBirthCertificate = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const requestID = req.query.requestID;
    const statusID = req.query.statusID;
    const folder = req.query.folder;
    const fileName = req.query.fileName;
    const result = await uploadsModel.getBirthCertificate(employeeID, requestID, statusID, folder, fileName);

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
    
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "Birth Certificate was not found.",  "getBirthCertificate");
  }
};

// @desc    Get the pending/approved prc id
// @route   GET /api/uploads/get-prc-id
// @access  Private
const getPRCID = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const requestID = req.query.requestID;
    const statusID = req.query.statusID;
    const folder = req.query.folder;
    const result = await uploadsModel.getPRCID(employeeID, requestID, statusID, folder);

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
    
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "PRC ID was not found.",  "getPRCID");
  }
};

// @desc    Get the pending/approved TOR or Diploma
// @route   GET /api/uploads/get-tor-or-diploma
// @access  Private
const getTOROrDiploma = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const requestID = req.query.requestID;
    const statusID = req.query.statusID;
    const folder = req.query.folder;
    const document = req.query.document;
    const result = await uploadsModel.getTOROrDiploma(employeeID, requestID, statusID, folder, document.trim().toUpperCase());

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
    
  } catch (error) {
    return helperMethods.handleUploadsError(error, res,  `${req.query.document.trim().toUpperCase()} was not found.`,  "getTOROrDiploma");
  }
};

// @desc    Get the pending/approved training or seminar certificate
// @route   GET /api/uploads/get-training-or-seminar-certificate
// @access  Private
const getTrainingOrSeminarCertificate = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const requestID = req.query.requestID;
    const statusID = req.query.statusID;
    const folder = req.query.folder;
    const result = await uploadsModel.getTrainingOrSeminarCertificate(employeeID, requestID, statusID, folder);

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
    
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "Training or Seminar Certificate was not found.", "getTrainingOrSeminarCertificate");
  }
};

// @desc    Get the current prc id
// @route   GET /api/uploads/get-current-prc-id
// @access  Private
const getCurrentPRCID = async (req, res) => {
  try {
    if (req.query.token === undefined) throw new Error("(token) parameter is required.");
    if (req.query.licenseName === undefined) throw new Error ("(licenseName) parameter is required.");

    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const licenseName = req.query.licenseName.trim();
    const result = await uploadsModel.getCurrentPRCID(employeeID, licenseName);
    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "PRC ID was not found.", "getCurrentPRCID");
  }
};

// @desc    Get the current prc id
// @route   GET /api/uploads/get-current-tor-or-diploma
// @access  Private
const getCurrentTOROrDiploma = async (req, res) => {
  try {
    if (req.query.token === undefined) throw "(token) parameter is required.";
    if (req.query.diploma === undefined) throw "(diploma) parameter is required.";
    if (req.query.document === undefined) throw "(document) parameter is required.";

    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const diploma = req.query.diploma.trim();
    const document = req.query.document.trim();
    const result = await uploadsModel.getCurrentTOROrDiploma(employeeID, diploma, document);
    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, `${req.query.document.toUpperCase()} was not found.`, "getCurrentTOROrDiploma");
  }
};

// @desc    Get the current training or seminar certificate
// @route   GET /api/uploads/get-current-training-or-seminar-certificate
// @access  Private
const getCurrentTrainingOrSeminarCertificate = async (req, res) => {
  try {
    const employeeID = helperMethods.decodeAccessToken(req.query.token).employee_id;
    const trainingOrSeminarName = req.query.trainingOrSeminarName.trim();
    const result = await uploadsModel.getCurrentTrainingOrSeminarCertificate(employeeID, trainingOrSeminarName);

    if (result === "") throw new Error("invalid signature");
    else return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `attachFile.ejs`, { APP_NAME: process.env.EC_APP_NAME, BODY_CONTENT: result });
  
  } catch (error) {
    return helperMethods.handleUploadsError(error, res, "Training or Seminar Certificate was not found.", "getCurrentTrainingOrSeminarCertificate");
  }
};

module.exports = {
  index,
  getCurrentMarriageCertificate,
  getMarriageCertificate,
  getBirthCertificate,
  getPRCID,
  getTOROrDiploma,
  getTrainingOrSeminarCertificate,
  getCurrentPRCID,
  getCurrentTOROrDiploma,
  getCurrentBirthCertificate,
  getCurrentTrainingOrSeminarCertificate,
};

const helperMethods = require("../utility/helperMethods.js");
const usersModel = require("../models/usersModel.js");
const { SQLDataTypes } = require('../utility/enums.js'); 

function isUploadedFileExistValidation(req) {
  let responseMsg = "";
  if (!req.files) responseMsg = "Cannot found the uploaded files in req object.";

  return responseMsg;
}

async function getFileName(requestID, type, isNewValue = true) {
  const query = `SELECT TOP 1 
   OldValue AS 'old_value',
   NewValue AS 'new_value' 
   FROM RequestDtl 
   WHERE RequestHdrID = @RequestHdrID 
   AND ColumnName = @Type`;

  const parameters = [
    { name: "RequestHdrID", dataType: SQLDataTypes.INT, value: requestID },
    { name: "Type", dataType: SQLDataTypes.VARCHAR, value: type },
  ];

  const response = await helperMethods.executeQuery(query, parameters);

  let fileName = isNewValue === true ? response.recordset[0].new_value : response.recordset[0].old_value;
  if (fileName !== null) {
    fileName = fileName.trim();
  } else {
    fileName = response.recordset[0].new_value;
    if (fileName === null) { throw 'fileName is null/empty string.'; }
    else { fileName = fileName.trim(); }
  }
  return fileName;
}


async function isValidRequestID(requestID) {
  const query = `SELECT TOP 1
               ID 
               FROM RequestHdr 
               WHERE ID = @ID`;

  const parameters = [{ name: "ID", dataType: SQLDataTypes.INT, value: requestID }];
  const response = await helperMethods.executeQuery(query, parameters);
  const length = response.recordset.length;
  return (length > 0) ? true : false;
}

function fileNameExtensionValidation(req) {
  let responseMsg = "";
  // let allowedExtArray = ['.png', '.jpg', '.jpeg', '.pdf'];
  const allowedExtArray = ['.pdf'];
  const files = req.files
  const fileExtensions = []
  Object.keys(files).forEach(key => {
    const fileNameExtension = files[key].name.slice(-4);
    fileExtensions.push(fileNameExtension)
  })
  // Are the file extension allowed? 
  const allowed = fileExtensions.every(ext => allowedExtArray.includes(ext))
  if (!allowed) responseMsg = `Upload failed. Only (${allowedExtArray.toString()}) file allowed.`.replaceAll(",", ", ");
  return responseMsg;
}

function fileSizeValidation(req) {
  let responseMsg = "";
  const files = req.files
  const MB = 5; // 5 MB 
  const FILE_SIZE_LIMIT = MB * 1024 * 1024;

  const filesOverLimit = []
  // Which files are over the limit?
  Object.keys(files).forEach(key => {
    if (files[key].size > FILE_SIZE_LIMIT) {
      filesOverLimit.push(files[key].name)
    }
  })

  if (filesOverLimit.length) {
    const properVerb = filesOverLimit.length > 1 ? 'are' : 'is';

    const sentence = `Upload failed. ${filesOverLimit.toString()} ${properVerb} over the file size limit of ${MB} MB.`.replaceAll(",", ", ");

    const message = filesOverLimit.length < 3
      ? sentence.replace(",", " and")
      : sentence.replace(/,(?=[^,]*$)/, " and");

    responseMsg = message;
  }
  return responseMsg;
}


async function copyFile(sourcePath, path) {
  if (await helperMethods.isExist(`${sourcePath}pdf`) === true) {
    await helperMethods.copyFile(`${sourcePath}pdf`, path);
  }
  else {
    throw 'cannot find the path';
  }
}

async function createFile(req) {
  const fs = require('fs');
  const path = require('path');

  const responseMsg = "";
  const files = req.files;
  const requestID = req.body.request_id;
  const folder = req.body.request_type === "create" ? "value" : "to";
  let uploadedFileName;
  let licenseName;
  for (const key in files) {
   const correctFileName = decodeURIComponent(escape(key));
    licenseName = key;
    const uploadedFile = files[key];
    uploadedFileName = uploadedFile.name;
    const fileNameExtension = uploadedFile.name.toLowerCase().split('.').pop();
    const directoryPath = `${helperMethods.getUploadedFolderPath()  }/requests/pending/${  requestID  }/${folder}`;
    const filepath = path.join(directoryPath, `${correctFileName}.${fileNameExtension}`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Move the file to the desired location
    await new Promise((resolve, reject) => {
      uploadedFile.mv(filepath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }


  if (folder === "to") {
    const employeeID = req.body.employee_id;
    const attachFile = req.body.attach_file;

    const uploadedFolderPath = helperMethods.getUploadedFolderPath();

    if (attachFile === "marriage_certificate" || attachFile === "prc_id") {
      // create folder 'from'
      const path = `${uploadedFolderPath  }/requests/pending/${  requestID  }/from/`;
      await helperMethods.createFolder(path);

      // copy the file from the current files folder
      let sourcePath = `${uploadedFolderPath  }/current_files/${  employeeID}`;

      if (attachFile === "marriage_certificate") sourcePath += "/family_backgrounds/spouse/marriage_certificate.";
      else if (attachFile === "prc_id") {
          if (uploadedFileName !== "")  sourcePath += `/licenses/${licenseName}.`;
      }

      await copyFile(sourcePath, path);
    }
  }

  return responseMsg;
}


function getBasePath() {
  const _path = require('path');
  const __filename = _path.resolve();

  return `${__filename  }\\modules\\${process.env.EC_EJS_VIEWS_FOLDER}\\uploaded`;
}

function getFullPath(basePath, dynamicPath, fileNameExtension = '') {
  basePath += dynamicPath;
  basePath = basePath.replaceAll("\\", "/");
  const fullPath = basePath + fileNameExtension;
  return fullPath;
}

async function getPath(fullPath, dynamicPath, fileNameExtension = '') {
  if (await helperMethods.isExist(fullPath) === true) return dynamicPath + fileNameExtension;
  return "";
}

async function getCurrentMarriageCertificate(employeeID) {
  const basePath = getBasePath();
  const dynamicPath = `/current_files/${  employeeID  }/family_backgrounds/spouse/marriage_certificate.`;
  const fileNameExtension = "pdf";
  const fullPath = getFullPath(basePath, dynamicPath, fileNameExtension);
  return await getPath(fullPath, dynamicPath, fileNameExtension);
}

async function getCurrentBirthCertificate(employeeID, fileName) {
  const basePath = getBasePath();
  const dynamicPath = `/current_files/${  employeeID  }/family_backgrounds/children/birth_certificate/${  fileName  }.`;
  const fileNameExtension = "pdf";
  const fullPath = getFullPath(basePath, dynamicPath, fileNameExtension);
  return await getPath(fullPath, dynamicPath, fileNameExtension);
}

async function getCurrentPRCID(employeeID, licenseName) {
  const basePath = getBasePath();
  const dynamicPath = `/current_files/${  employeeID  }/licenses/${  licenseName  }.`;
  const fileNameExtension = "pdf";
  const fullPath = getFullPath(basePath, dynamicPath, fileNameExtension);
  return await getPath(fullPath, dynamicPath, fileNameExtension);
}

async function getCurrentTOROrDiploma(employeeID, diploma, document) {
  const basePath = getBasePath();
  const dynamicPath = `/current_files/${  employeeID  }/educational_backgrounds/${  diploma  }/${  document  }.`;
  const fileNameExtension = "pdf";
  const fullPath = getFullPath(basePath, dynamicPath, fileNameExtension);
  return await getPath(fullPath, dynamicPath, fileNameExtension);
}

async function getCurrentTrainingOrSeminarCertificate(employeeID, trainingOrSeminarName) {
  const basePath = getBasePath();
  const dynamicPath = `/current_files/${  employeeID  }/trainings_or_seminars/${  trainingOrSeminarName  }.`;
  const fileNameExtension = "pdf";
  const fullPath = getFullPath(basePath, dynamicPath, fileNameExtension);
  return await getPath(fullPath, dynamicPath, fileNameExtension);
}

async function getMarriageCertificate(employeeID, requestID, statusID, folder) {
  const condition = { ['E.EmployeeCode']: employeeID };
  if (await usersModel.getDetails(condition) === null) {
    return "";
  }

  if (await isValidRequestID(requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  const fileName = await getFileName(requestID, 'MARRIAGE CERTIFICATE');

  const basePath = getBasePath();
  const dynamicPath = `/requests/${  statusFolder  }/${  requestID  }/${  folder  }/${  fileName}`;
  const fullPath = getFullPath(basePath, dynamicPath);
  return await getPath(fullPath, dynamicPath);
}

async function getBirthCertificate(employeeID, requestID, statusID, folder, fileName) {
  const condition = { ['E.EmployeeCode']: employeeID };
  if (await usersModel.getDetails(condition) === null) {
    return "";
  }

  if (await isValidRequestID(requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  const basePath = getBasePath();
  const dynamicPath = `/requests/${  statusFolder  }/${  requestID  }/${  folder  }/${  fileName}`;
  const fullPath = getFullPath(basePath, dynamicPath);
  return await getPath(fullPath, dynamicPath);
}

async function getPRCID(employeeID, requestID, statusID, folder) {
  const condition = { ['E.EmployeeCode']: employeeID };

  if (await usersModel.getDetails(condition) === null) return "";

  if (await isValidRequestID(requestID) === false) return "";

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }
  
  const isNewValue = folder === "to" ? true : false;
  const fileName = await getFileName(requestID, 'PRC ID', isNewValue);

  const basePath = getBasePath();
  const dynamicPath = `/requests/${  statusFolder  }/${  requestID  }/${  folder  }/${  fileName}`;
  const fullPath = getFullPath(basePath, dynamicPath);
  return await getPath(fullPath, dynamicPath);
}

async function getTOROrDiploma(employeeID, requestID, statusID, folder, document) {
  const condition = { ['E.EmployeeCode']: employeeID };
  if (await usersModel.getDetails(condition) === null) {
    return "";
  }

  if (await isValidRequestID(requestID) === false) {
    return "";
  }

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  let fileName = await getFileName(requestID, document);
  fileName = fileName.trim().toLowerCase();

  const basePath = getBasePath();
  const dynamicPath = `/requests/${  statusFolder  }/${  requestID  }/${  folder  }/${  fileName}`;
  const fullPath = getFullPath(basePath, dynamicPath);
  return await getPath(fullPath, dynamicPath);
}

async function getTrainingOrSeminarCertificate(employeeID, requestID, statusID, folder) {
  const condition = { ['E.EmployeeCode']: employeeID };
  if (await usersModel.getDetails(condition) === null)  return "";
  if (await isValidRequestID(requestID) === false)  return "";

  let statusFolder;
  switch (statusID) {
    case "0":
      statusFolder = "pending";
      break;
    case "1":
      statusFolder = "approved";
      break;
    default:
      throw 'Invalid value of statusID';
  }

  const fileName = await getFileName(requestID, 'TRAINING OR SEMINAR CERTIFICATE');

  const basePath = getBasePath();

  const dynamicPath = `/requests/${  statusFolder  }/${  requestID  }/${  folder  }/${  fileName}`;
  const fullPath = getFullPath(basePath, dynamicPath);
  return await getPath(fullPath, dynamicPath);
}





module.exports = {
  isUploadedFileExistValidation,
  fileNameExtensionValidation,
  fileSizeValidation,
  createFile,
  getFileName,
  getMarriageCertificate,
  getPRCID,
  getBirthCertificate,
  getTrainingOrSeminarCertificate,
  getTOROrDiploma,
  getCurrentTOROrDiploma,
  getCurrentTrainingOrSeminarCertificate,
  getCurrentBirthCertificate,
  getCurrentPRCID,
  getCurrentMarriageCertificate,
}
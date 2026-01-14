const fsPromises = require("fs").promises;
const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");
const sqlHelper = require("../../../helpers/sql.js");
const mssql = require("mssql");
const { SQLDataTypes } = require("../utility/enums.js");

function removeTime(dateTime) {
  // FORMAT = 2023-05-05T00:00:00.000Z
  return dateTime.slice(0, 10);
}

function decodeAccessToken(token) {
  const [, payloadBase64] = token.split(".");
  const cleanedPayload = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
  const decodedPayload = JSON.parse(
    decodeURIComponent(escape(atob(cleanedPayload))),
    "utf-8",
  );
  decodedPayload.token = token;
  return decodedPayload;
}

function getLocationPath() {
  let locationPath = path.resolve();
  locationPath = locationPath.replaceAll("\\", "/");
  locationPath += "/";
  return locationPath;
}

function getUploadedFolderPath() {
  return getLocationPath() + process.env.EC_UPLOADED_FOLDER_PATH;
}

async function isExist(filePath) {
  try {
    await fs.promises.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function renameFile(filePath, newFileName) {
  try {
    const newFilePath = path.join(path.dirname(filePath), newFileName);
    await fsPromises.rename(filePath, newFilePath);
  } catch (err) {
    throw `Error renaming file: ${err}`;
  }
}

async function copyFiles(sourceDir, destinationDir) {
  try {
    await fsExtra.copy(sourceDir, destinationDir);
  } catch (err) {
    throw `Error copying files:${err}`;
  }
}

async function deleteFiles(filePath) {
  try {
    await fsExtra.emptyDir(filePath);
  } catch (err) {
    throw `Error deleting files:${err}`;
  }
}

async function copyFile(sourcePath, destinationDirectory) {
  const fileExists = await fs.promises
    .access(sourcePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) throw new Error("Source file does not exist.");

  const directoryExists = await fs.promises
    .access(destinationDirectory, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (!directoryExists)
    throw new Error("Destination directory does not exist.");

  const fileName = sourcePath.substring(sourcePath.lastIndexOf("/") + 1);
  const destinationPath = `${destinationDirectory}/${fileName}`;

  await fs.promises.copyFile(sourcePath, destinationPath);
}

async function deleteFile(filePath) {
  await fsPromises.unlink(filePath);
}

async function createFolder(path) {
  if (!(await isFolderExist(path))) {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

async function isFolderExist(folderPath) {
  try {
    await fs.promises.access(folderPath, fs.constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function isFolderEmpty(folderPath) {
  const files = await fs.promises.readdir(folderPath);
  return files.length === 0 ? true : false;
}

async function deleteFolder(folderPath) {
  await fs.promises.rmdir(folderPath, { recursive: true });
}

function isString(value) {
  return typeof value === "string" ? true : false;
}

function isNumber(value) {
  return typeof value === "number" ? true : false;
}

function isValidNumber(stringValue) {
  const num = Number(stringValue);
  return !isNaN(num);
}

function checkRowsAffected(response) {
  if (response.rowsAffected.length === 1){
    if (response.rowsAffected[0] === 0) throw "No rows affected";
     return;
  }

let areAllZeros = true;

for (let interval = 0; interval < response.rowsAffected.length; interval++)
{
   if (interval > 0) 
    {
      areAllZeros = false;
      break;
    }
}

if (areAllZeros) throw "No rows affected";
}

function getErrorMessage(methodName, errorMessage, errorStackTrace) {
  let response = `An error has occured in ${methodName}(). Error Message: ${errorMessage}`;
  if (process.env.NODE_ENV === "dev")
    response += ` , Stack Trace : ${errorStackTrace}`;
  // Create error logs in database soon
  return response;
}

const sqlConnection = new mssql.ConnectionPool(sqlHelper.returnSQLConfig());
sqlConnection.config.database = "UE Database";

async function executeQuery(query, parameters = null, transaction = null) {
  if (!sqlConnection._connected) await sqlConnection.connect();

  const request = new mssql.Request(
    transaction === null ? sqlConnection : transaction,
  );

  if (parameters !== null) {
    parameters.forEach((obj) => {
      // Ensure obj.dataType is set to the enum directly
      if (!Object.values(SQLDataTypes).includes(obj.dataType)) {
        throw new Error(`Invalid data type: ${obj.dataType}`);
      }
      obj.value = trimValue(obj.value);
    });

    // Add parameters using placeholders
    parameters.forEach((param) => {
      request.input(param.name, param.dataType, param.value);
    });
  }

  return await request.query(query);
}

function trimValue(value) {
  if (isString(value)) value = value.trim();
  return value;
}

function convertToBoolean(value) {
  return (value === 1);
}

function toNumber(value){
return Number(value);
}

function isNullOrUndefinedOrEmpty(value){
  if (value === null || value === undefined || value === "") return true;
  else return false;
}

async function beginTransaction() {
  if (!sqlConnection._connected) await sqlConnection.connect();
  const transaction = new mssql.Transaction(sqlConnection);
  await transaction.begin();
  return transaction;
}

async function commitTransaction(transaction) {
  // Check if the transaction object exists and if it's active
  if (transaction && transaction._aborted === false) await transaction.commit();
  else
    throw "The transaction cannot be committed. Because the transaction object does not exist or is not active.";
}

async function rollbackTransaction(transaction) {
  // Check if the transaction object exists and if it's active
  if (transaction && transaction._aborted === false)
    await transaction.rollback();
  else
    throw "Transaction cannot be rolled back. Because the transaction object does not exist or is not active..";
}

function handleUploadsError(error, res, bodyContent, methodName) {
  if (error.message === "invalid signature")
    return res.render(`${process.env.EC_EJS_VIEWS_FOLDER}/` + `notFound.ejs`, {
      APP_NAME: process.env.EC_APP_NAME,
      BODY_CONTENT: bodyContent,
    });
  else
    return res
      .status(500)
      .json(getErrorMessage(methodName, error.message, error.stack));
}

const scheduleDailyTask = function (hour, minute, task) {
  const initialDelay = calculateMillisecondsUntil(hour, minute);
  setTimeout(function () {
    task();
    setInterval(task, 24 * 60 * 60 * 1000);
  }, initialDelay);
};

const calculateMillisecondsUntil = function (hour, minute) {
  const now = new Date();
  const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
  );
  let delay = targetTime - now;
  if (delay < 0) {
    // If the target time is in the past, schedule it for the next day
    delay += 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }
  return delay;
};

function numberToWords(number) {
  if (number === null) {
    return null;
  }
  const wordsMap = {
    0: "Zero",
    1: "One",
    2: "Two",
    3: "Three",
    4: "Four",
    5: "Five",
    6: "Six",
    7: "Seven",
    8: "Eight",
    9: "Nine",
    10: "Ten",
    11: "Eleven",
    12: "Twelve",
    13: "Thirteen",
    14: "Fourteen",
    15: "Fifteen",
    16: "Sixteen",
    17: "Seventeen",
    18: "Eighteen",
    19: "Nineteen",
    20: "Twenty",
    30: "Thirty",
    40: "Forty",
    50: "Fifty",
    60: "Sixty",
    70: "Seventy",
    80: "Eighty",
    90: "Ninety",
  };

  if (number < 21) {
    return wordsMap[number];
  } else if (number < 100) {
    const tens = Math.floor(number / 10) * 10;
    const remainder = number % 10;
    return wordsMap[tens] + (remainder > 0 ? `-${wordsMap[remainder]}` : "");
  } else if (number < 1000) {
    const hundreds = Math.floor(number / 100);
    const remainder = number % 100;
    return `${wordsMap[hundreds]} Hundred${remainder > 0 ? ` ${numberToWords(remainder)}` : ""}`;
  } else if (number < 1000000) {
    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;
    return `${numberToWords(thousands)} Thousand${remainder > 0 ? ` ${numberToWords(remainder)}` : ""}`;
  } else {
    return "Number too large";
  }
}

module.exports = {
  toNumber,
  decodeAccessToken,
  removeTime,
  isExist,
  copyFile,
  deleteFile,
  createFolder,
  isFolderEmpty,
  deleteFolder,
  copyFiles,
  deleteFiles,
  isFolderExist,
  renameFile,
  isString,
  isNumber,
  isNullOrUndefinedOrEmpty,
  isValidNumber,
  checkRowsAffected,
  getErrorMessage,
  executeQuery,
  convertToBoolean,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  handleUploadsError,
  getUploadedFolderPath,
  scheduleDailyTask,
  numberToWords,
};

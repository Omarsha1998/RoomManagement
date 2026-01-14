/* eslint-disable require-await */
/* eslint-disable valid-typeof */
/* eslint-disable no-unused-vars */
/* eslint-disable no-self-assign */
/* eslint-disable eqeqeq */
/* eslint-disable no-case-declarations */
/* eslint-disable no-undef */
const sql = require("mssql");
const config = require("../config/database");
const QRCode = require("qrcode");
const cryptojs = require("crypto-js");
const btoa = require("btoa");
const atob = require("atob");
const axios = require("axios");
const redis = require("redis");
const cdigit = require("cdigit");
const mailjet = require("node-mailjet").apiConnect(
  process.env.MAIL_JET_PUBLIC_KEY,
  process.env.MAIL_JET_PRIVATE_KEY,
);
const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");

const encryptionKey = "57s8d30cs7";

function getIp(remoteAddress) {
  let ip = remoteAddress.split(":");
  ip = ip[ip.length - 1];
  return ip;
}

async function addRedisToken(tokenDetails) {
  try {
    const client = redis.createClient();
    await client.connect();
    client.on("error", (err) => console.log("Redis Client Error", err));
    const token = tokenDetails.split(" ")[1];
    await client.lPush("authToken", token);
    return true;
  } catch (error) {
    return {
      error: error.toString(),
    };
  }
}

async function validateTokenizations(tokenBearer) {
  const bearerHeader = tokenBearer;
  if (bearerHeader === undefined) {
    return {
      error: "Token is required",
      type: 401,
    };
  }
  const token = await validateToken(bearerHeader);
  if (token.error) {
    return {
      error: token.error,
      type: 403,
    };
  }
  const tokenDetails = {
    token: bearerHeader,
    status: 2,
  };
  const tokenRedis = await checkRedisToken(tokenDetails);
  if (tokenRedis.error) {
    return {
      error: tokenRedis.error,
      type: 403,
    };
  }
  return { success: "Validation success" };
}

function validateToken(bearerHeader) {
  if (typeof bearerHeader === undefined) {
    return {
      error: "Token required",
    };
  }
  const jwt = require("jsonwebtoken");
  const bearerApikey = bearerHeader;
  const bearer = bearerHeader.split(" ");
  const bearerToken = bearer[1];

  try {
    //VALIDATE ACCESS KEY FIRST
    if (bearerToken === process.env.ACCESS_TOKEN) {
      return {
        success: true,
      };
    }

    //VALIDATE ACCESS KEY FIRST
    const decoded = jwt.verify(bearerToken, process.env.TOKEN);
    return {
      success: decoded != undefined,
    };
  } catch (error) {
    return {
      error: error,
    };
  }
}

async function checkRedisToken(tokenDetails) {
  if (typeof tokenDetails === undefined) {
    return {
      error: "Token required",
    };
  }

  let jwtToken = "";
  if (tokenDetails.status === 1) {
    jwtToken = tokenDetails.token.token;
  } else {
    const bearer = tokenDetails.token.split(" ");
    jwtToken = bearer[1];
  }
  try {
    const client = redis.createClient();
    client.on("error", (err) => console.log("Redis Client Error", err));
    await client.connect();
    const result = await client.LRANGE("authToken", 0, 99999999);
    if (result.indexOf(jwtToken) > -1) {
      return {
        error: "Invalid Token",
      };
    } else {
      return {
        success: "Token accepted",
      };
    }
  } catch (err) {
    return err;
  }
}

async function getTokenBearerTextMessage() {
  const data = JSON.stringify({
    username: process.env.SMART_USERNAME,
    password: process.env.SMART_PASSWORD,
  });

  const config = {
    method: "post",
    url: "https://messagingsuite.smart.com.ph/rest/auth/login",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  const token = await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      return error;
    });
  return token;
}

async function refreshTokenBearerTextMessage(accessToken, refreshToken) {
  const data = JSON.stringify({ refreshToken: refreshToken });
  const tokenAccess = accessToken;
  const config = {
    method: "put",
    url: "https://messagingsuite.smart.com.ph/cgpapi/auth/refresh",
    headers: {
      Authorization: `Bearer ${tokenAccess}`,
      "Content-Type": "application/json",
    },
    data: data,
  };

  const tokenRefresh = await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      return error;
    });

  return tokenRefresh;
}

async function sendTextMessage(accessToken, message) {
  const data = JSON.stringify(message);
  const config = {
    method: "post",
    url: "https://messagingsuite.smart.com.ph/cgpapi/messages/sms",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: data,
  };

  const textMessage = await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      return error;
    });

  // console.log(textMessage)

  return textMessage;
}

async function sendEmailMailJet(emailFromInfo, emailToInfo) {
  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: `${emailFromInfo.email}`,
          Name: `${emailFromInfo.name}`,
        },
        To: [
          {
            Email: `${emailToInfo.email}`,
            Name: `${emailToInfo.name}`,
          },
        ],
        TemplateID: 2839265,
        TemplateLanguage: true,
        Subject: "UERM Vaccine Reservation",
        Variables: {
          fullName: `${emailToInfo.name}`,
          message: `${emailToInfo.message}`,
        },
      },
    ],
  });
  const requestResponse = await request
    .then((result) => {
      return result.body;
    })
    .catch((err) => {
      return err.statusCode;
    });

  return requestResponse;
}

async function qrCode(string, url = "") {
  const encryptedString = cryptojs.AES.encrypt(
    string,
    encryptionKey,
  ).toString();
  url = url + btoa(encryptedString);
  // console.log(url);
  const qrCode = await QRCode.toDataURL(url);
  return qrCode;
}

function randomString(length) {
  const string = Math.random()
    .toString(36)
    .substring(3, 3 + length)
    .toUpperCase();

  return string;
}

async function parsePatientResult(resultData) {
  const labResult = [];
  for (const resultItem of resultData) {
    const caseno = resultItem.caseno;
    const details = {
      recordId: resultItem.recordId,
      controlNo: resultItem.controlno,
      status: resultItem.resultStatus,
      caseno: resultItem.caseno,
      patientNo: resultItem.patientno,
      chargeSlipNo: resultItem.csno,
      lastName: resultItem.lastname,
      firstName: resultItem.firstname,
      middleName: resultItem.middlename,
      date: resultItem.resultDate,
      resultDateTime: resultItem.createDate,
      chargeDate: resultItem.chargeDate,
      patientType: resultItem.patientType,
      template: resultItem.template,
      dateAdmitted: resultItem.dateAdmitted,
      dateDischarged: resultItem.dateDischarged,
      category: resultItem.category,
      gender: resultItem.gender,
      dateOfBirth: resultItem.dateOfBirth,
      age: resultItem.age,
      room: resultItem.room,
      attendingPhysician: resultItem.attendingPhysician,
      resultType: resultItem.type.replace(/\r/g, ""),
      parser: resultItem.recParser,
      isValidated: resultItem.isValidated == true ? true : false,
      attachments: resultItem.attachments,
    };
    const lab = [];
    const labSensitivity = [];
    if (resultItem.recParser == "lab") {
      const firstSplit = resultItem.value.split("&");
      firstSplit.forEach((val, key) => {
        const secondSplit = val.split("=");
        let name = decodeURIComponent(
          secondSplit[0].replace(/\+/g, " "),
        ).replace(/^pTestValue|Res|^p/g, "");
        const value = decodeURIComponent(secondSplit[1].replace(/\+/g, " "));
        switch (name.toLowerCase()) {
          case "finrep":
            name = "Final Report";
            break;
          case "parasiteorova":
            name = "Parasite/OVA";
            break;
          case "otherinput":
            name = "Other";
            break;
          case "wbcmale":
            name = "WBC Male";
            break;
          case "wbcfemale":
            name = "WBC Female";
            break;
          default:
            name = name;
        }
        switch (name.toLowerCase()) {
          case "medtech":
            details.medTech = value;
            break;
          case "medtechpartner":
            details.medTechPartner = value;
            break;
          case "clmic":
            details.signatory = value;
            break;
        }
        if (
          !name.match(
            /caseno|chargeslipno|name|no|age|room|sex|dname|daterec|^ref|^date|^medtech|clmic|ornum|cnum|^unit|^pref/gi,
          ) &&
          value != ""
        ) {
          if (
            !name.match(/[ ]/g) &&
            !name.match(
              /WBC|RBC|SGOT|SGPT|TRIGLYCERIDES|^TOTAL|^CA|POTASSIUM|MAGNESIUM|SODIUM/g,
            )
          ) {
            name = name.replace(/([A-Z])/g, " $1");
          }
          switch (details.resultType.toLowerCase()) {
            case "gram negative organisms":
              const antimicrobialSensitivitySplit = name.split(" ");
              const header =
                antimicrobialSensitivitySplit[
                  antimicrobialSensitivitySplit.length - 1
                ];
              if (!isNaN(parseFloat(header))) {
                const labResult = antimicrobialSensitivitySplit
                  .filter((v) => {
                    if (isNaN(parseFloat(v))) {
                      return v;
                    }
                  })
                  .join(" ");
                labSensitivity.push({
                  name: labResult,
                  header,
                  result: value,
                });
              } else {
                lab.push({
                  name: name,
                  value: value,
                });
              }
              break;
            case "gram stain":
              if (!name.match(/WBC|RBC/g)) {
                name = name
                  .replace(/([A-Z0-9])/g, " $1")
                  .replace(/pairs/gi, "Gram (+) cocci Pairs")
                  .replace(/bacilli/gi, " bacilli");
              }
              if (!value.match(/\/lpf|\/oif/g)) {
                lab.push({
                  name: name,
                  value: value,
                });
              } else {
                lab.map((labItem) => {
                  if (`${labItem.name}f` == name) {
                    return (labItem.value += ` ${value}`);
                  }
                });
              }
              break;
            case "eia":
              if (name.match(/Ref$/g)) {
                lab.push({
                  name: name.replace(/Ref$/g, ""),
                  value: value,
                });
              } else {
                lab.map((labItem) => {
                  if (`${labItem.name}Rem` == name) {
                    return (labItem.value += ` ${value}`);
                  }
                });
              }
              break;
            default:
              lab.push({
                name: name,
                value: value,
              });
          }
        }
      });
      if (lab.length > 0) {
        labResult.push({
          details: details,
          result: lab,
          sensitivity: labSensitivity.length > 0 ? labSensitivity : null,
        });
      }
    } else if (resultItem.recParser == "hclab") {
      const hclab = await sql.query(`select
          s.description,
          case
              when s.freetextresult <> '' then s.freetextresult
              else s.testresult
          end result,
          s.unit,
          s.refrange
        from HCLABSQL..SysmexLab s
        where s.labno = '${resultItem.recordId}'
        order by SEQUENCE`);
      labResult.push({
        details: details,
        result: hclab.recordset,
      });
    } else if (resultItem.recParser == "xr") {
      if (resultItem.value.match(/\r\n/g)) {
        xrSplit = resultItem.value.split(/\r\n/g);
      } else {
        xrSplit = resultItem.value.split(/\n/g);
      }

      xrResult = xrSplit
        .filter((str, key) => {
          if (str != "" && key != 0) {
            return str;
          }
        })
        .join("\n\n");
      labResult.push({
        details,
        // result: xrResult,
        result: resultItem.value,
      });
    } else if (resultItem.recParser == "ftp") {
      labResult.push({
        details: details,
        result: {
          // href: `${req.baseUrl}/view-result-ftp/?auth=${req.query.auth}&file=${resultItem.value}`,
          url: `${req.protocol}://${req.get("host")}${
            req.baseUrl
          }/view-result-ftp/?auth=${req.query.auth}&file=${resultItem.value}`,
          ftpUrl: `http://10.107.11.169/uploads/diagnosticresults/${resultItem.value}`,
          file: resultItem.value,
        },
      });
    } else {
      labResult.push({
        details: details,
        result: resultItem.value,
      });
    }
  }

  // console.log(labResult);
  return labResult;
}

async function ensureDIR(folderName) {
  const dir = path.join(__dirname, `../${folderName}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  // await clearFolder(dir)
  return `DIR: ${dir}`;
}
async function clearFolder(folderName) {
  let dir = "";
  const currDate = new Date().getTime();
  const maxTime = 1200;
  await fs.readdirSync(folderName).forEach((file) => {
    dir = path.join(`${folderName}/${file}`);
    fs.stat(dir, (error, stats) => {
      if (error) {
        console.log(error);
      } else {
        if (Math.abs((currDate - stats.birthtime) / 1000) > maxTime) {
          fs.unlinkSync(dir);
        }
      }
    });
  });
}

async function sendEmailTemplate(emailFromInfo, emailToInfo) {
  const mailjet = require("node-mailjet").connect(
    process.env.MAIL_JET_PUBLIC_KEY,
    process.env.MAIL_JET_PRIVATE_KEY,
  );
  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: `${emailFromInfo.email}`,
          Name: `${emailFromInfo.name}`,
        },
        To: [
          {
            Email: `${emailToInfo.email}`,
            Name: `${emailToInfo.name}`,
          },
        ],
        TemplateID: 2916755,
        TemplateLanguage: true,
        Subject: `${emailToInfo.subject}`,
        Variables: {
          Title: `${emailToInfo.title}`,
          contactPerson: `${emailToInfo.name}`,
          message: `${emailToInfo.message}`,
        },
      },
    ],
  });

  const requestResponse = await request
    .then((result) => {
      return result.body;
    })
    .catch((err) => {
      console.log(err);
      return err.statusCode;
    });

  return requestResponse;
}

function encrypt(string) {
  const encrypted = btoa(cryptojs.AES.encrypt(string, encryptionKey));
  return encrypted;
}

function decrypt(string) {
  const decrypted = cryptojs.AES.decrypt(atob(string), encryptionKey).toString(
    cryptojs.enc.Utf8,
  );
  return decrypted;
}

function setCheckDigit(details, digit) {
  const computedDigit = cdigit.luhn.compute(digit);
  const generatedDigit = cdigit.luhn.generate(digit);
  const validatedDigit = cdigit.luhn.validate(generatedDigit);
  if (validatedDigit) {
    const uniqueDigit = `${details}${generatedDigit}`;
    return uniqueDigit;
  } else {
    return false;
  }
}

function generateNumber(length) {
  return Math.random()
    .toString(10)
    .slice(2, length + 2);
}

function generateEntityCode(prefix, suffix_length) {
  return `${prefix}${DateTime.now()
    .toISODate()
    .replace(/-/g, "")}${generateNumber(suffix_length)}`;
}

const buildTree = function (arr, nodeKey = "", parentNodeKey = "") {
  if (nodeKey === "" || parentNodeKey === "")
    throw "buildTree: `nodeKey` and `parentNodeKey` arguments are required.";

  const hashTable = {};
  const tree = [];

  arr.forEach((node) => (hashTable[node[nodeKey]] = { ...node, children: [] }));

  arr.forEach((node) => {
    if (node[parentNodeKey] && hashTable[node[parentNodeKey]]) {
      hashTable[node[parentNodeKey]].children.push(hashTable[node[nodeKey]]);
    } else {
      tree.push(hashTable[node[nodeKey]]);
    }
  });

  return tree;
};

const transact = async function (commands) {
  try {
    // Use global connection pool
    await sql.connect(config);

    // New transaction
    const txn = new sql.Transaction();

    // IMPORTANT: begin transaction here as rolling back a transaction that
    // has not been started throws an error
    await txn.begin();

    try {
      // IMPORTANT: Throw an error inside the `commands` arg to trigger a "rollback"
      const ret = await commands(txn);
      await txn.commit();

      return ret;
    } catch (error) {
      console.log(error);
      await txn.rollback();
      return { error };
    }
  } catch (error) {
    console.log(error);
    return { error: "Unable to communicate with the database." };
  }
};

async function currentDateTime() {
  // dateDetails.date can be a JS date or an ISO date string

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const date = new Date();

  const year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(
    date,
  );
  const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  const minute = date.getMinutes();
  const hour = date.getHours();

  // if (minute < 10) {
  //   minute = "0" + minute;
  // }

  // let ampm = "AM";

  // if (hour > 12) {
  //   hour -= 12;
  //   ampm = "PM";
  // }

  const time = `${hour}:${minute}`;
  return `${year}-${month}-${day} ${time} `;
}

async function sendInfoTxt(payload) {
  try {
    const sqlQuery = `insert into UERMSMS..Outbox
            (
              Msg,
              MPN,
              Status,
              Priority,
              UserID,
              COMNum,
              Datestamp,
              SourceApp
            ) VALUES (
              '${payload.text}',
              '${payload.destination}',
              '0',
              '2',
              '${payload.from}',
              '1',
              getDate(),
              '${payload.appName}'
            )`;
    await sql.connect(config);
    await sql.query(sqlQuery);
    const res = {
      success: "ENROUTE",
    };
    return res;
  } catch (error) {
    console.log(error);
    return error;
  }
}

module.exports = {
  getIp: getIp,
  parsePatientResult,
  qrCode,
  encryptionKey,
  randomString,
  getTokenBearerTextMessage,
  refreshTokenBearerTextMessage,
  sendTextMessage,
  sendEmailMailJet,
  ensureDIR,
  clearFolder,
  sendEmailTemplate,
  encrypt,
  decrypt,
  setCheckDigit,
  generateEntityCode,
  checkRedisToken,
  addRedisToken,
  validateTokenizations,
  buildTree,
  generateNumber,
  transact,
  currentDateTime,
  sendInfoTxt,
};

/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
const axios = require("axios");
const cryptojs = require("crypto-js");
const btoa = require("btoa");
const atob = require("atob");
const fs = require("fs/promises");
const path = require("path");

const mailjet = require("node-mailjet").connect(
  process.env.MAIL_JET_PUBLIC_KEY,
  process.env.MAIL_JET_PRIVATE_KEY,
);
// const fs = require("fs");
// const path = require("path");
// const { get } = require("../routes/posts");

const encryptionKey = "57s8d30cs7";

function getIp(remoteAddress) {
  let ip = remoteAddress.split(":");
  ip = ip[ip.length - 1];
  return ip;
}

function randomString(length) {
  const string = Math.random()
    .toString(36)
    .substring(3, 3 + length)
    .toUpperCase();

  return string;
}

function pad(value) {
  if (value < 10) {
    return `0${value}`;
  } else {
    return value;
  }
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

async function getTokenSMS() {
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

async function sendSMS(accessToken, message) {
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
      return response;
    })
    .catch(function (error) {
      // eslint-disable-next-line no-console
      console.log(error);
      return error;
    });

  return textMessage;
}

const sendTextMessage = async (recipient, message) => {
  if (process.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`Sending text message to ${recipient}...`);
    return;
  }

  if (!process.env.SMART_USERNAME || !process.env.SMART_PASSWORD) {
    throw new Error("Username and password are required to send text message.");
  }

  try {
    // GET ACCESS TOKEN
    const accessToken = (
      await axios({
        method: "post",
        url: "https://messagingsuite.smart.com.ph/rest/auth/login",
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          username: process.env.SMART_USERNAME,
          password: process.env.SMART_PASSWORD,
        }),
      })
    )?.data?.accessToken;

    if (!accessToken) throw new Error("Unable to get SMS access token.");

    // SEND SMS
    return (
      await axios({
        method: "post",
        url: "https://messagingsuite.smart.com.ph/cgpapi/messages/sms",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        data: JSON.stringify({
          messageType: "sms",
          destination: recipient,
          text: message,
        }),
      })
    ).data;
  } catch (err) {
    // console.log(err);
    return { error: "Unable to send SMS." };
  }
};

const sendEmail = async (email) => {
  if (process.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`Sending email to ${email.email}...`);
    return;
  }

  try {
    const result = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: email.senderEmail ?? "service-notification@uerm.edu.ph",
            Name: email.senderName ?? "UERM Service Notification",
          },
          To: [
            {
              Email: `${email.address ?? email.email}`,
              Name: `${email.name}`,
            },
          ],
          TemplateID: email.templateId ?? 4088864,
          TemplateLanguage: true,
          Subject: `${email.subject}`,
          Variables: {
            ehrHeader: `${email.header}`,
            ehrContent: `${email.content}`,
          },
          Attachments: email.attachments || [],
        },
      ],
    });

    return result.body;
  } catch (err) {
    return err.statusCode;
  }
};

const isNone = (v) => {
  return v == null || v === "";
};

const isArr = function (arg) {
  return Array.isArray(arg);
};

const isObj = function (arg) {
  return typeof arg === "object" && !Array.isArray(arg) && arg !== null;
};

// For performance, this method does not check if `arr` is really an array.
// Use `isArr` before calling this method, to check if `arr` is really an array.
const arrEmpty = function (arr) {
  return arr.length === 0;
};

// For performance, this method does not check if `obj` is really an object.
// Use `isObj` before calling this method, to check if `obj` is really an object.
const objEmpty = function (obj) {
  return Object.keys(obj).length === 0;
};

const isArrAndEmpty = function (arg) {
  return isArr(arg) && arrEmpty(arg);
};

const isObjAndEmpty = function (arg) {
  return isObj(arg) && objEmpty(arg);
};

/*
 * Returns true if the argument is:
 *    - null
 *    - undefined
 *    - an empty string
 *    - an array with 0 length
 *    - an object with no properties
 */
const empty = function (arg) {
  if (isDate(arg)) {
    return false;
  }

  return isNone(arg) || isArrAndEmpty(arg) || isObjAndEmpty(arg);
};

const isStr = function (arg) {
  return typeof arg === "string";
};

const isDecimal = (value) => {
  return Boolean(value % 1);
};

const isNumber = (value) => {
  return isInt(value) || isDecimal(value);
};

const generateNumber = function (length) {
  return Math.random()
    .toString(10)
    .slice(2, length + 2);
};

const generateAlphaNumericStr = function (length) {
  // Base 36 is alpha-numeric
  return Math.random()
    .toString(36)
    .slice(2, length + 2)
    .toUpperCase();
};

const generateEntityCode = function (entityName) {
  return entityName.replace(/[aeiou\s\W]/gi, "").toLowerCase();
};

const snakifyStr = function (str) {
  return str.replace(/([A-Z])/g, (val) => `_${val.toLowerCase()}`);
};

const camelizeStr = function (str) {
  const ret = str.replace(/_(\w{1})/g, (val) =>
    val.replace("_", "").toUpperCase(),
  );
  return ret.replace(/^[A-Z]{1}/, (val) => val.toLowerCase());
};

// Returns a copy of an object but property names are snakified
// Does not change the original object
// Object argument must be a FLAT object
const snakify = function (obj) {
  if (typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("snakify: Argument should be an object.");
  }

  const ret = {};

  if (typeof obj === "object" && !Array.isArray(obj)) {
    for (const prop in obj) {
      ret[snakifyStr(prop)] = obj[prop];
    }
  }

  return ret;
};

// Returns a copy of an object but property names are camelized
// Does not change the original object
// Object argument must be a FLAT object
const camelize = function (obj) {
  if (typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("camelize: Argument should be an object.");
  }

  const ret = {};

  if (typeof obj === "object" && !Array.isArray(obj)) {
    for (const prop in obj) {
      ret[camelizeStr(prop)] = obj[prop];
    }
  }

  return ret;
};

const createMap = (arr, keyProp, formatVal) => {
  if (!arr || !Array.isArray(arr)) {
    throw new Error("`arr` argument is required and should be an array.");
  }

  if (!keyProp) {
    keyProp = "key";
  }

  const r = {};

  for (let i = 0; i < arr.length; i++) {
    // If valueProp is not supplied, whole item will be the value.
    r[arr[i][keyProp]] = formatVal
      ? formatVal(arr[i])
      : Object.assign({}, arr[i]);
  }

  return r;
};

const buildBreadcrumbs = (node, hash_table, parent_key = "parent_key") => {
  if (empty(node) || empty(hash_table)) {
    throw new Error("Incomplete arguments.");
  }

  if (typeof node !== "object" || Array.isArray(node)) {
    throw new Error("`node` argument should be an object.");
  }

  if (typeof hash_table !== "object" || Array.isArray(hash_table)) {
    throw new Error("`hash_table` argument should be an object.");
  }

  const breadcrumbs = [];
  let parent_node = hash_table[node[parent_key]] ?? null;

  while (parent_node) {
    breadcrumbs.unshift(parent_node.name);
    // Nodes which parent does not exist in the group will be considered root nodes
    if (parent_node[parent_key] && hash_table[parent_node[parent_key]]) {
      parent_node = hash_table[parent_node[parent_key]];
      continue;
    }
    parent_node = null;
  }

  return breadcrumbs;
};

const pascalToCamel = function (str) {
  return str[0].toLowerCase() + str.substring(1, str.length);
};

/**
 * Changes the character case of property names of a shallow/flat object.
 *
 * @param {Object} obj Object to be transformed
 */
const changeCase = function (obj, transformer) {
  if (typeof obj !== "object" || Array.isArray(obj)) {
    throw new Error("Argument should be an object.");
  }

  const ret = {};

  for (const prop in obj) {
    ret[transformer(prop)] = obj[prop];
  }

  return ret;
};

// Unicode \u180E is an invisible char to differentiate "value-label string generated by the system" to "actual string from the user"
const valueLabelDelimiter = " \u180E--\u180E ";

// Objectify string with encoded "value" and "label"
const parseValueLabel = function (str) {
  const arr = str.split(valueLabelDelimiter);

  if (empty(arr[1]))
    return arr[0]; // string
  else
    return {
      value: arr[0],
      label: arr[1],
    };
};

// Stringify object with value and label property
const stringifyValueLabel = function (obj) {
  return `${
    isStr(obj.value) ? obj.value.toUpperCase() : obj.value
  }${valueLabelDelimiter}${obj.label}`;
};

/*
 * @param obj (Array or Object) -- obj of which to check a property emptiness
 * @param path (String) -- obj path to a property i.e. "a.b.c"
 */
const deepPropEmpty = (obj, path) => {
  if (!isArr(obj) && !isObj(obj)) {
    throw new Error("`obj` argument should be an array or an object.");
  }

  const routes = path.split(".");

  let prop = obj[routes.shift()];

  if (empty(prop)) return true;

  for (const route of routes) {
    // console.log(`Route ${route} is empty:`, empty(prop[route]));
    if (empty(prop[route])) return true;
    prop = prop[route];
  }

  return false;
};

const getMissingProp = function (obj, propNames) {
  for (const propName of propNames) {
    if (empty(obj[propName])) return propName;
  }

  return null;
};

const formatDate = function (dateDetails = null) {
  // dateDetails.date can be a JS date or an ISO date string
  if (!dateDetails || !dateDetails.date) return "";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const date = isDate(dateDetails.date)
    ? dateDetails.date
    : new Date(dateDetails.date);

  const year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(date);

  // const month = new Intl.DateTimeFormat("en", { month: "short" }).format(date);

  let month = new Intl.DateTimeFormat("en", { month: "short" }).format(date);

  if (
    dateDetails.straightDate ||
    dateDetails.straightDateWithMilitaryTime ||
    dateDetails.straightDateWithTime ||
    dateDetails.straightDateDashMonthFirst
  ) {
    month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date);
  }

  const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  let minute = date.getMinutes();
  let hour = date.getHours();
  const ampm = hour > 11 ? "PM" : "AM";

  if (minute < 10) minute = `0${minute}`;
  if (hour > 12) hour -= 12;

  const time = `${hour}:${minute}${ampm}`;
  const dayName = days[date.getDay()];

  if (dateDetails.withDayName)
    return `${dayName.toUpperCase()}, ${month.toUpperCase()} ${day}, ${year} ${time}`;
  else if (dateDetails.dateOnly)
    return `${month.toUpperCase()} ${day}, ${year}`;
  else if (dateDetails.timeOnly) return `${time}`;
  else if (dateDetails.militaryTime) {
    return `${date.getHours()}:${
      date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`
    } `;
  } else if (dateDetails.straightDateWithMilitaryTime) {
    return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
  } else if (dateDetails.straightDate) {
    return `${year}-${month}-${day}`;
  } else if (dateDetails.straightDateWithTime) {
    return `${year}-${month}-${day} ${time}`;
  } else if (dateDetails.straightDateDashMonthFirst) {
    return `${month}/${day}/${year}`;
  }

  return `${month.toUpperCase()} ${day}, ${year} ${time} `;
};

const formatDate2 = (dateDetails = null, delimeter = "-") => {
  // dateDetails.date can be a JS date or an ISO date string
  if (!dateDetails || !dateDetails.date) return "";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const date = isDate(dateDetails.date)
    ? dateDetails.date
    : new Date(dateDetails.date);

  const year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(date);
  let month = new Intl.DateTimeFormat("en", { month: "short" }).format(date);
  if (dateDetails.straightDate) {
    month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date);
  }
  const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  let minute = date.getMinutes();
  let hour = date.getHours();
  const ampm = hour > 11 ? " PM" : " AM";

  if (minute < 10) minute = `0${minute}`;
  if (hour > 12) hour -= 12;

  const time = `${hour}:${minute}${ampm}`;
  const dayName = days[date.getDay()];

  if (dateDetails.withDayName)
    return `${dayName.toUpperCase()}, ${month.toUpperCase()} ${day}, ${year} ${time}`;
  else if (dateDetails.dateOnly)
    return `${month.toUpperCase()} ${day}, ${year}`;
  else if (dateDetails.timeOnly) return `${time}`;
  else if (dateDetails.militaryTime) return `${convertTime12to24(time)}`;
  else if (dateDetails.straightDate)
    return `${year}${delimeter}${month}${delimeter}${day}`;
  else if (dateDetails.withDayNameWithTime)
    return `${dayName.toUpperCase()}, ${month.toUpperCase()} ${day}, ${year} ${time} `;
  else if (dateDetails.withDayNameOnly)
    return `${dayName.toUpperCase()}, ${month.toUpperCase()} ${day}, ${year}`;
  return `${month.toUpperCase()} ${day}, ${year} ${time} `;
};

const formatDateV3 = (date, options) => {
  // `date` can be a JS date or an ISO date string
  if (!date) return "";
  if (!options) options = {};

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dt = isDate(date) ? date : new Date(date);
  const year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(dt);
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(dt);
  const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(dt);
  const minute = dt.getMinutes();
  const hour = dt.getHours();

  const hourStr =
    hour === 0 ? "12" : hour > 12 ? String(hour - 12) : String(hour);

  const minuteStr = minute < 10 ? `0${minute}` : String(minute);
  const time = `${hourStr}:${minuteStr} ${hour > 11 ? "PM" : "AM"}`;
  const dayName = days[dt.getDay()];

  if (options.withDayName) {
    return `${dayName.toUpperCase()}, ${month.toUpperCase()} ${day}, ${year} ${time}`;
  }

  if (options.dateOnly) return `${month.toUpperCase()} ${day}, ${year}`;
  return `${month.toUpperCase()} ${day}, ${year} ${time}`;
};

const convertTime12to24 = function (time12h) {
  const [time, modifier] = time12h.split(" ");

  // eslint-disable-next-line prefer-const
  let [hours, minutes] = time.split(":");

  if (hours === "12") {
    hours = "00";
  }

  if (modifier === "PM") {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
};

const formatDateWithTime = function (dateDetails = null) {
  try {
    // dateDetails.date can be a JS date or an ISO date string
    if (!dateDetails || !dateDetails.date) return "";

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const date = new Date(dateDetails.date);
    const formattedMilitaryTime = new Date(date).toLocaleTimeString("en", {
      timeStyle: "short",
      hour12: false,
      timeZone: "UTC",
    });

    const year = new Intl.DateTimeFormat("en", { year: "numeric" }).format(
      date,
    );

    let month = new Intl.DateTimeFormat("en", { month: "short" }).format(date);

    if (
      dateDetails.straightDate ||
      dateDetails.straightDateWithMilitaryTime ||
      dateDetails.straightDateWithTime ||
      dateDetails.straightDateDashMonthFirst
    ) {
      month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date);
    }

    const day = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
    let minute = date.getMinutes();
    let hour = date.getHours();
    const ampm = hour > 11 ? "PM" : "AM";

    if (minute < 10) minute = `0${minute}`;
    if (hour > 12) hour -= 12;

    const time = `${hour}:${minute} ${ampm}`;
    const dayName = days[date.getDay()];

    if (dateDetails.withDayName)
      return `${dayName.toUpperCase()}, ${month.toUpperCase()} ${day}, ${year} ${time}`;
    else if (dateDetails.dateOnly)
      return `${month.toUpperCase()} ${day}, ${year}`;
    else if (dateDetails.timeOnly) return `${time}`;
    else if (dateDetails.militaryTime) {
      return formattedMilitaryTime;
    } else if (dateDetails.straightDateWithMilitaryTime) {
      return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
    } else if (dateDetails.straightDate) {
      return `${year}-${month}-${day}`;
    } else if (dateDetails.straightDateWithTime) {
      return `${year}-${month}-${day} ${time}`;
    } else if (dateDetails.straightDateDashMonthFirst) {
      return `${month}/${day}/${year}`;
    }

    return `${month.toUpperCase()} ${day}, ${year} ${time} `;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

const isDate = function (arg) {
  return Object.prototype.toString.call(arg) === "[object Date]";
};

// Checks if a value is flat/shallow
const isFlat = (val) => {
  if (isPrimitive(val)) return true;

  for (const key in val) {
    if (!isPrimitive(val[key])) return false;
  }

  return true;
};

const isPrimitive = function (val) {
  return (typeof val !== "object" && typeof val !== "function") || val === null;
};

const isError = (arg) => {
  return arg instanceof Error;
};

// Returns a one-liner presentable text from a primitive, FLAT array or FLAT object
const presentify = function (arg) {
  if (arg === undefined || arg === null || arg === "") return "";

  if (typeof arg === "function") {
    throw new Error("`arg` should not be a function");
  }

  if (isObj(arg) || isArr(arg)) {
    if (!isFlat(arg)) {
      throw new Error(
        "`arg` when an object or an array, should be shallow or flat.",
      );
    }

    return presentifyObj(arg);
  }

  return arg;
};

// Renders a one-liner presentable text from a FLAT array or object
// IMPORTANT: Make sure that the arg is an object or an array before calling this function
const presentifyObj = function (arg) {
  let arr = arg;

  if (isObj(arr)) {
    arr = [];
    for (const key in arg) {
      arr.push(`${key}: ${arg[key]}`);
    }
  }

  // return `[${arr.join(", ")}]`;
  return arr.join(", ");
};

const stringifyHWBMI = (val) => {
  return `Height: ${val.height}${val.heightUnitCode}, Weight: ${val.weight}${val.weightUnitCode}, BMI: ${val.bmi}`;
};

// Renders a delimited string from a primitive, array or an object (nested or flat) using DFS
const treeToStr = (val, leafDelimiter = ", ") => {
  if (empty(val)) return "";

  const visited = [];
  const toVisit = [val];

  while (toVisit.length > 0) {
    const node = toVisit.shift();

    if (!empty(node.bmi)) {
      // for "Height, Weight and BMI" data
      visited.push(stringifyHWBMI(node));
    } else if (!empty(node.bgImageFileName) && !empty(node.strokes)) {
      // for sketch data
      visited.push(`[Sketch]`);
    } else if (!empty(node.value) && !empty(node.label)) {
      // for "value and label" data
      visited.push(
        `(${
          typeof node.value === "string" ? node.value.toUpperCase() : node.value
        }) ${node.label}`,
      );
    } else if ((isObj(node) || isArr(node)) && isFlat(node)) {
      visited.push(presentifyObj(node));
    } else if (isPrimitive(node)) {
      // Omit null and undefined nodes
      if (node !== null && node !== undefined) {
        visited.push(node);
      }
    } else {
      for (const key in node) {
        toVisit.unshift(node[key]);
      }
    }
  }

  return visited.join(leafDelimiter);
};

const multiLineToOneLine = (str) => {
  return str.replace(/[\n\r]+/g, ", ");
};

const treeToMultiLinerStr = function (tree, indentSize = 2) {
  if (!isObj(tree)) throw new Error("`tree` should be an object.");

  const indent = Array(indentSize).fill(" ").join("");
  const result = [];
  const toVisit = [
    {
      ...tree,
      indent: "",
    },
  ];

  while (toVisit.length > 0) {
    const node = toVisit.shift();

    result.push(`${node.indent}${node.label}: ${presentify(node.value)}`);

    if (!empty(node.children)) {
      toVisit.unshift(
        ...node.children.map((n) => {
          n["indent"] = node.indent + indent;
          return n;
        }),
      );
    }
  }

  return result.join("\n");
};

// Limits and adds ellipsis to a string.
const addEllipsis = (str, limit) => {
  if (!limit || limit < 3) limit = 3;

  if (str.length > limit) {
    return `${str.substring(0, limit - 3)}...`;
  }

  return str;
};

const stringifyDiagnostic = (diagnostic, limitText = false) => {
  // For backward compatibility
  if (isStr(diagnostic)) return multiLineToOneLine(diagnostic);

  const diagStrArr = [];

  const diagDate = diagnostic.date;
  const diagName = diagnostic.label;
  const diagOthers = diagnostic.others ?? "";
  const diagRemarks = diagnostic.remarks ?? "";
  // const diagCreatedBy = diagnostic.createdBy;

  const diagValues = diagnostic.children
    .map((v) => {
      return `${v.label}: ${v.children
        .map((e) => {
          let ret = limitText ? addEllipsis(e.value, 50) : e.value;
          if (e.label === "Reference Range") {
            ret = !empty(e.value) ? ` (${e.value})` : "";
          }
          return ret;
        })
        .join("")}`;
    })
    .join(", ");

  if (!empty(diagDate)) diagStrArr.push(diagDate);
  if (!empty(diagName)) diagStrArr.push(diagName);
  if (!empty(diagValues)) diagStrArr.push(multiLineToOneLine(diagValues));
  if (!empty(diagOthers)) diagStrArr.push(multiLineToOneLine(diagOthers));
  if (!empty(diagRemarks)) diagStrArr.push(multiLineToOneLine(diagRemarks));
  // if (!empty(diagCreatedBy)) diagStrArr.push(diagCreatedBy);

  return diagStrArr.join(" | ");
};

const printifyDiagnostic = (diagnostic) => {
  // For backward compatibility
  if (isStr(diagnostic)) return diagnostic;

  const diagStrArr = [];

  const diagDate = diagnostic.date;
  const diagName = diagnostic.label;
  const diagOthers = diagnostic.others ?? "";
  const diagRemarks = diagnostic.remarks ?? "";
  // const diagCreatedBy = diagnostic.createdBy;

  const diagValues = diagnostic.children
    .map((v) => {
      return `${v.label}: ${v.children
        .map((e) => {
          let ret = e.value;
          if (e.label === "Reference Range") {
            ret = !empty(e.value) ? ` (${e.value})` : "";
          }
          return multiLineToOneLine(ret);
        })
        .join("")}`;
    })
    .join(", ");

  if (!empty(diagDate) && !empty(diagName))
    diagStrArr.push(`${diagName} (${diagDate}):`);

  if (!empty(diagValues)) diagStrArr.push(multiLineToOneLine(diagValues));
  if (!empty(diagOthers)) diagStrArr.push(multiLineToOneLine(diagOthers));
  if (!empty(diagRemarks)) diagStrArr.push(multiLineToOneLine(diagRemarks));
  // if (!empty(diagCreatedBy)) diagStrArr.push(diagCreatedBy);

  return diagStrArr.join("\n  - ");
};

const getAge = function (date) {
  const today = new Date();
  const birthDate = isDate(date) ? date : new Date(date);

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  return age;
};

const getDistinct = function (arr) {
  if (!isArr(arr)) throw new Error("Argument should be an array.");
  return [...new Set(arr)];
};

// Used to sort array of strings or objects (with string property to be used for sorting) IN PLACE
const sortStringArr = (arr, key = null, desc = false) => {
  const ret1 = desc ? -1 : 1;
  const ret2 = desc ? 1 : -1;

  arr.sort((a, b) => {
    return (a[key] ?? a) > (b[key] ?? b)
      ? ret1
      : (a[key] ?? a) < (b[key] ?? b)
        ? ret2
        : 0;
  });
};

// Used to sort array of numbers or objects (with number property to be used for sorting) IN PLACE
const sortNumberArr = (arr, key = null, desc = false) => {
  arr.sort((a, b) => {
    if (desc) return (b[key] ?? b) - (a[key] ?? a);
    return (a[key] ?? a) - (b[key] ?? b);
  });
};

const jsDateToISOString = function (jsDate, dateOnly = false, utc = false) {
  if (utc) {
    if (dateOnly) return jsDate.toISOString().substring(0, 10);
    else return jsDate.toISOString();
  }

  const year = String(jsDate.getFullYear());
  const month = String(jsDate.getMonth() + 1).padStart(2, "0");
  const date = String(jsDate.getDate()).padStart(2, "0");
  const hours = String(jsDate.getHours()).padStart(2, "0");
  const minutes = String(jsDate.getMinutes()).padStart(2, "0");
  const seconds = String(jsDate.getSeconds()).padStart(2, "0");
  const ms = String(jsDate.getMilliseconds()).padStart(3, "0");

  if (dateOnly) return `${year}-${month}-${date}`;

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${ms}`;
};

// Used to compare two array of primitives or objects
const compareArr = function (newArr, oldArr, itemKey = null, itemValue = null) {
  if (newArr.length !== oldArr.length) return false;

  for (const newArrItem of newArr) {
    const oldArrItem = oldArr.find(
      (e) =>
        (itemKey ? e[itemKey] : e) ===
        (itemKey ? newArrItem[itemKey] : newArrItem),
    );

    if (
      !oldArrItem ||
      (itemValue ? oldArrItem[itemValue] : oldArrItem) !==
        (itemValue ? newArrItem[itemValue] : newArrItem)
    ) {
      return false;
    }
  }

  return true;
};

const escapeSqlLikeVal = function (str) {
  str.replace(/[[\]%_^]/g, "");
};

// CHECKS IF VALUE IS AN INTEGER.
// NOTE: ACCEPTS AN INTEGER IN STRING FORM.
const isInt = (value) => {
  return Number.isInteger(typeof value === "string" ? Number(value) : value);
};

const icd10Letters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  // Letter U is not included in the ICD-10 letters
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const icd10SectionToDecimal = (section) => {
  const part1 = Number(section[0]);

  if (!isInt(part1) || part1 < 0 || part1 > 9) {
    throw new Error("Not a valid ICD-10 section.");
  }

  let part2 = section[1];

  if (!isInt(part2)) {
    part2 = part2.toUpperCase();

    if (icd10Letters.includes(part2)) {
      const part2DecimalValue = icd10Letters.indexOf(part2) + 1; // A = 1, B = 2 and so on

      // prettier-ignore
      return (part1 * icd10Letters.length) + 99 + part2DecimalValue;
    }

    throw new Error("Not a valid ICD-10 section.");
  }

  return Number(section);
};

const icd10DecimalToSection = (decimal) => {
  if (!isInt(decimal)) throw new Error("`decimal` should be an interger.");

  // 349 is the highest possible section. Equivalent to 9Z.
  if (decimal < 0 || decimal > 349) {
    throw new Error("ICD-10 section in decimal should be from 0 to 349 only.");
  }

  // If no letter is used
  if (decimal < 100) return String(decimal).padStart(2, "0");

  // We're sure here that the 2nd part is a letter
  const part2DecimalValue = (decimal % icd10Letters.length) + 1;

  const part1 = (decimal - (part2DecimalValue + 99)) / icd10Letters.length;
  const part2 = icd10Letters[part2DecimalValue - 1];

  return `${part1}${part2}`;
};

const isValidIcd10Code = (icd10Code) => {
  return /^[a-zA-Z][0-9][a-zA-Z0-9](?:.(?:[a-zA-Z0-9]{1,4}))?$/.test(icd10Code);
};

const sanitizeSQLLikeValue = (val) => {
  return val.replace(/[%_[\]^]/g, "");
};

const currentDateTime = () => {
  const currentdate = new Date();

  const datetime = `${currentdate.getFullYear()}-${`0${
    currentdate.getMonth() + 1
  }`.slice(-2)}-${pad(currentdate.getDate())} ${pad(
    currentdate.getHours(),
  )}:${pad(currentdate.getMinutes())}:${pad(currentdate.getSeconds())}`;

  return datetime;
};

const setInitials = (name) => {
  return name.charAt(0);
};

const currentUserToken = (req) => {
  if (req.user === undefined) {
    return JSON.parse(req.cookies.user_details);
  }
  return req.user;
};

const groupBy = function (arr, key) {
  return arr.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const removeHTMLTags = (strToSanitize) => {
  return strToSanitize
    .replace(/<br>/g, "\n")
    .replace(/(&[a-z]+;|&#[0-9]+;)/g, "")
    .replace(/<\/?[^>]+>/gi, "");
};

const padNumber = (value) => {
  if (value < 10) {
    return `0${value}`;
  } else {
    return value;
  }
};

const sanitizeUserName = (username) => {
  // SYMBOLS @ AND - ARE INTENTIONALLY OMMITTED FOR EMAIL USERNAMES
  return username
    .replace(/[ ]/g, "_")
    .replace(/[`!#$%^&*()+=[\]{};':"\\|,<>/?~]/g, "")
    .toLowerCase();
};

const httpResponse = (status, body) => {
  return {
    status: status.code ?? status,
    body: body ?? null,
  };
};

const getTokenFromRequest = (req) => {
  const reqHeaderToken = req.headers["authorization"]
    ? req.headers["authorization"].split(" ")[1]
    : null;

  const reqQueryToken = req.query.accessToken;
  return reqHeaderToken ?? reqQueryToken;
};

// "Safely" adds prop to `obj` if `val` is not "empty". Modifies the `obj` in place.
const addProp = (val, propName, obj, format = null) => {
  if (!empty(val)) obj[propName] = format ? format(val) : val;
};

const parsePhoneNosCol = (str) => {
  const matches = str
    ? str
        .replace(/\+63/g, "0")
        .replace(/-/g, "")
        .match(/09[0-9]{9}/g)
    : null;

  if (matches && matches.length > 0) return matches[0];

  return null;
};

const getFileExtension = (str) => {
  return str.split(".").pop();
};

const allPropsEmpty = (obj) => {
  return !Object.values(obj).some((val) => !empty(val));
};

const trim = (str, char) => {
  if (!char) char = " ";

  if (char.length > 1) {
    throw new Error("`char` should contain only one character.");
  }

  const escapeChar = /[.+*\-?^$()[\]{}|\\]/.test(char);

  return str
    .replace(new RegExp(`^${escapeChar ? "\\" : ""}${char}+`), "")
    .replace(new RegExp(`${escapeChar ? "\\" : ""}${char}+$`), "");
};

const removeDuplicates = (arr) => {
  const jsonObject = arr.map(JSON.stringify);
  const uniqueSet = new Set(jsonObject);
  return Array.from(uniqueSet).map(JSON.parse);
};

const getObjectKeys = (objects) => {
  if (Object.keys(objects).length > 0) {
    const keys = [];
    for (const object in objects) {
      keys.push(object);
    }
    return keys;
  }
};

const getObjectValues = (objects) => {
  if (Object.keys(objects).length > 0) {
    const values = [];
    for (const object in objects) {
      values.push(objects[object]);
    }
    return values;
  }
};

const getObjectValuesLength = (objects) => {
  if (Object.keys(objects).length > 0) {
    const length = [];
    for (const object in objects) {
      length.push(objects[object].length);
    }
    return length;
  }
};

const groupObjectsBy = (obj, key) => {
  return obj.reduce((groups, item) => {
    const group = groups[key] || [];
    group.push(item);
    groups[key] = group;
    return groups;
  }, {});
};

const getDatesInRange = (startDate, endDate, format) => {
  const dateStart = new Date(startDate);
  const dateEnd = new Date(endDate);
  const date = new Date(dateStart.getTime());

  const dates = [];

  while (date <= dateEnd) {
    if (format.dateOnly) {
      dates.push(formatDate({ date: date.toDateString(), straightDate: true }));
    } else {
      dates.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return dates;
};

const truncateToTwoDecimalsWithoutRounding = (number, decimalPlaces) => {
  const factor = Math.pow(10, decimalPlaces);

  // Multiply the number by the factor
  const tempNumber = number * factor;

  // Truncate the number to an integer
  const truncatedTempNumber = Math.trunc(tempNumber);

  // Divide by the factor to get the truncated number with the specified decimal places
  const truncatedNumber = truncatedTempNumber / factor;
  return truncatedNumber;
};

const computeAverage = (sum, count) => {
  return sum / count;
};

const sortedMonths = (months) => {
  const monthOrder = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };

  return months.sort((a, b) => monthOrder[a] - monthOrder[b]);
};

const sortMonthObj = (arr, key) => {
  const monthOrder = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };

  return arr.sort((a, b) => monthOrder[a[key]] - monthOrder[b[key]]);
};

const sortMonthObjMap = (arr, key, sort = "asc") => {
  // const monthOrder = {
  //   "01": "Jan",
  //   "02": "Feb",
  //   "03": "Mar",
  //   "04": "Apr",
  //   "05": "May",
  //   "06": "Jun",
  //   "07": "Jul",
  //   "08": "Aug",
  //   "09": "Sep",
  //   "10": "Oct",
  //   "11": "Nov",
  //   "12": "Dec",
  // };

  let sortedArr;
  if (sort === "asc") {
    sortedArr = arr.sort((a, b) => {
      return Number(a[key]) - Number(b[key]);
    });
  } else {
    sortedArr = arr.sort((a, b) => {
      return Number(b[key]) - Number(a[key]);
    });
  }

  return sortedArr;
};

// Returns a new obj NOT containing the props given
const sliceObj = (obj, ...props) => {
  const r = {};

  for (const key in obj) {
    if (props.includes(key)) {
      continue;
    }

    r[key] = obj[key];
  }

  return r;
};

const objContains = (obj1, obj2) => {
  for (const prop in obj2) {
    if (obj1[prop] !== obj2[prop]) return false;
  }

  return true;
};

const tryCatch = (fn, ...args) => {
  try {
    return [null, fn(...args)];
  } catch (err) {
    return [err];
  }
};

const tryCatchAsync = async (fn, ...args) => {
  try {
    return [null, await fn(...args)];
  } catch (err) {
    return [err];
  }
};

const match = (val, defaultVal, ...matchers) => {
  for (const match of matchers) {
    if (typeof match[0] === "function") {
      if (match[0](val)) return match[1];
    } else {
      if (match[0] === val) return match[1];
    }
  }

  return defaultVal;
};

const formatName = (firstName, middleName, lastName, extName) => {
  return `${lastName}, ${firstName}${extName ? " ".concat(extName) : ""}${
    middleName ? " ".concat(middleName[0]).concat(".") : ""
  }`;
};

const logError = async (error) => {
  const cols = [
    new Date(),
    error.stack.replace(/\n {4}/g, " | "),
    error.message,
  ];

  await fs.appendFile(
    path.join(__dirname, "..", process.env.ERROR_LOGS_FILEPATH || "errors.log"),
    `${cols.join("\t")}\n`,
    "utf8",
  );
};

const queryToStr = (query) => {
  return `?${Object.entries(query)
    .map((entry) => `${entry[0]}=${entry[1]}`)
    .join("&")}`;
};

const createTree = (arr, nodeKey, parentNodeKey) => {
  if (!nodeKey) {
    nodeKey = "id";
  }

  if (!parentNodeKey) {
    parentNodeKey = "parentId";
  }

  if (!arr || !Array.isArray(arr)) {
    arr = [];
  }

  const hashTable = {};
  const children = [];

  for (let i = 0; i < arr.length; i++) {
    hashTable[arr[i][nodeKey]] = Object.assign({ children: [] }, arr[i]);
  }

  for (let i = 0; i < arr.length; i++) {
    if (arr[i][parentNodeKey] && hashTable[arr[i][parentNodeKey]]) {
      hashTable[arr[i][parentNodeKey]].children.push(
        hashTable[arr[i][nodeKey]],
      );
      continue;
    }

    children.push(hashTable[arr[i][nodeKey]]);
  }

  return {
    [nodeKey]: 0,
    children,
  };
};

const getTreeNodes = (val) => {
  const visited = [];
  const toVisit = [];

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      toVisit.push(val[i]);
    }
  } else {
    for (let i = 0; i < val.children.length; i++) {
      toVisit.push(val.children[i]);
    }
  }

  while (toVisit.length > 0) {
    const node = toVisit.shift();
    visited.push(node);

    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        toVisit.push(node.children[i]);
      }
    }
  }

  return visited;
};

const getTreeLeaves = (val) => {
  const visited = [];
  const toVisit = [];

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      toVisit.push(val[i]);
    }
  } else {
    for (let i = 0; i < val.children.length; i++) {
      toVisit.push(val.children[i]);
    }
  }

  while (toVisit.length > 0) {
    const node = toVisit.shift();

    if (!node.children || node.children.length === 0) {
      visited.push(node);
    }

    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        toVisit.push(node.children[i]);
      }
    }
  }

  return visited;
};

const getTreeParents = (val) => {
  const visited = [];
  const toVisit = [];

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      toVisit.push(val[i]);
    }
  } else {
    for (let i = 0; i < val.children.length; i++) {
      toVisit.push(val.children[i]);
    }
  }

  while (toVisit.length > 0) {
    const node = toVisit.shift();

    if (node.children && node.children.length > 0) {
      visited.push(node);

      for (let i = 0; i < node.children.length; i++) {
        toVisit.push(node.children[i]);
      }
    }
  }

  return visited;
};

const getTreeNode = (tree, nodeValue, nodeKey) => {
  if (!nodeKey) {
    nodeKey = "id";
  }

  const toVisit = [];

  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      toVisit.push(tree[i]);
    }
  } else {
    for (let i = 0; i < tree.children.length; i++) {
      toVisit.push(tree.children[i]);
    }
  }

  while (toVisit.length > 0) {
    const node = toVisit.shift();

    if (node[nodeKey] === nodeValue) {
      return node;
    }

    if (node.children && node.children.length > 0) {
      for (let i = 0; i < node.children.length; i++) {
        toVisit.push(node.children[i]);
      }
    }
  }

  return null;
};

const delay = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

const padValueWithLength = (num, value, length) => {
  return num.toString().padStart(length, value);
};

const getDaysFromBirthdate = (birthdateString) => {
  const birthdate = new Date(birthdateString); // e.g. "1990-01-01"
  const today = new Date();

  // Clear time portion for accuracy
  birthdate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffInMs = today - birthdate;
  const days = diffInMs / (1000 * 60 * 60 * 24); // Convert ms to days
  return Math.floor(days);
};

const convertURLtoBase64 = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer", // Important for binary files
    });

    const contentType = response.headers["content-type"];
    const base64 = Buffer.from(response.data, "binary").toString("base64");

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error fetching file:", error.message);
    throw error;
  }
};

module.exports = {
  getIp,
  randomString,
  pad,
  encrypt,
  decrypt,
  getTokenSMS,
  sendSMS,
  sendTextMessage,
  empty,
  arrEmpty,
  isArrAndEmpty,
  objEmpty,
  isObjAndEmpty,
  camelize,
  snakify,
  generateNumber,
  generateEntityCode,
  createMap,
  buildHashTable: createMap, // ALIAS FOR BACKWARD COMPATIBILITY
  buildBreadcrumbs,
  sendEmail,
  generateAlphaNumericStr,
  pascalToCamel,
  changeCase,
  parseValueLabel,
  stringifyValueLabel,
  isNone,
  isObj,
  isArr,
  isStr,
  isInt,
  isPrimitive,
  isFlat,
  isDate,
  isError,
  isNumber,
  isDecimal,
  deepPropEmpty,
  getMissingProp,
  presentify,
  presentifyObj,
  treeToStr,
  treeToMultiLinerStr,
  multiLineToOneLine,
  stringifyDiagnostic,
  printifyDiagnostic,
  getAge,
  getDistinct,
  sortStringArr,
  sortNumberArr,
  jsDateToISOString,
  formatDate,
  formatDateWithTime,
  formatDate2,
  formatDateV3,
  convertTime12to24,
  compareArr,
  escapeSqlLikeVal,
  icd10SectionToDecimal,
  icd10DecimalToSection,
  isValidIcd10Code,
  sanitizeSQLLikeValue,
  currentUserToken,
  setInitials,
  groupBy,
  currentDateTime,
  removeHTMLTags,
  padNumber,
  sanitizeUserName,
  httpResponse,
  getTokenFromRequest,
  addProp,
  parsePhoneNosCol,
  getFileExtension,
  allPropsEmpty,
  addEllipsis,
  trim,
  getObjectValuesLength,
  removeDuplicates,
  getObjectKeys,
  getObjectValues,
  groupObjectsBy,
  getDatesInRange,
  truncateToTwoDecimalsWithoutRounding,
  computeAverage,
  sortedMonths,
  sortMonthObj,
  sortMonthObjMap,
  sliceObj,
  objContains,
  tryCatch,
  tryCatchAsync,
  match,
  formatName,
  logError,
  queryToStr,
  createTree,
  getTreeNodes,
  getTreeNode,
  getTreeLeaves,
  getTreeParents,
  delay,
  padValueWithLength,
  getDaysFromBirthdate,
  convertURLtoBase64,
};

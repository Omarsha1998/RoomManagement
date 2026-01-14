function refreshPage() {
  window.location.reload();
}

function redirect(url) {
  window.location.href = url;
}

function setPageTitle(title) {
  document.title = title;
}

function getDateTimeToday() {
  var currentDateTime = new Date();
  return currentDateTime;
}

function getDateToday() {
  const date = new Date();
  let d = date.getDate();
  let m = date.getMonth() + 1;
  let y = date.getFullYear();
  let response =
    y + "-" + (m <= 9 ? "0" + m : m) + "-" + (d <= 9 ? "0" + d : d);
  return response;
}

function getDateMinusDays(daysToMinus) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - daysToMinus);

  const year = sevenDaysAgo.getFullYear();
  const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, "0");
  const day = String(sevenDaysAgo.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function removeTime(dateTime) {
  // FORMAT = 12/12/1955 12:00:00 AM
  if (dateTime.split(" ")[1] !== undefined) {
    return dateTime.split(" ")[0];
  }
  // FORMAT = 2023-05-05T00:00:00.000Z
  return dateTime.slice(0, 10);
}

function convertToReadableFormatDate(dateTimeOrDate) {
  let dateOnly = dateTimeOrDate;
  if (dateTimeOrDate.length > 10) {
    dateOnly = removeTime(dateTimeOrDate);
  }
  let year = dateOnly.split("-")[0];
  let day = dateOnly.split("-")[2];
  let date = new Date(dateOnly);
  let monthWord = date.toLocaleString("default", { month: "short" });
  let response = monthWord + " " + day + ", " + year;
  return response;
}

function convertToReadableFormatDateTime(dateTimeValue) {
  var date = new Date(dateTimeValue);
  var hours = date.getHours();
  var minutes = date.getMinutes();

  // Check whether AM or PM
  var newformat = hours >= 12 ? "PM" : "AM";

  // Find current hour in AM-PM Format
  hours = hours % 12;

  // To display "0" as "12"
  hours = hours ? hours : 12;

  // Ensure hours and minutes are in two-digit format
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  let timeFormatted = hours + ":" + minutes + " " + newformat;

  let formattedDate = convertToReadableFormatDate(dateTimeValue);

  let response = formattedDate + " / " + timeFormatted;
  return response;
}

function correctDate(utcDateTime) {
  const numberOfDay = 1;
  // convert to local date
  let dateOnly = new Date(removeTime(utcDateTime));
  // toISOString() = convert to utc date time
  let response = addDays(dateOnly, numberOfDay).toISOString();
  return response;
}

function daysBetweenTwoDates(dateOne, dateTwo) {
  let date1 = new Date(dateOne);
  let date2 = new Date(dateTwo);

  let difference = date1.getTime() - date2.getTime();
  let TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
  return TotalDays;
}

function addDays(theDate, days) {
  return new Date(theDate.getTime() + days * 24 * 60 * 60 * 1000);
}

function toNumber(stringVariable) {
  return Number(stringVariable);
}

function delay(ms) {
  return new Promise((res) => setTimeout(() => res(), ms));
}

function disablePointerEvents(duration) {
  document.body.classList.add("disable-pointer-events");

  if (duration && typeof duration === "number") {
    setTimeout(() => {
      document.body.classList.remove("disable-pointer-events");
    }, duration);
  }
}

function enablePointerEvents() {
  document.body.classList.remove("disable-pointer-events");
}

function getDateRangeSearch(dateRangeSearch = null) {
  let dateToday = getDateToday();
  let dateTodayMinus7Days = getDateMinusDays(7);
  const response = {
    other_requests: {
      pending: {
        date_from:
          dateRangeSearch === null
            ? dateTodayMinus7Days
            : dateRangeSearch.other_requests.pending.date_from,
        date_to:
          dateRangeSearch === null
            ? dateToday
            : dateRangeSearch.other_requests.pending.date_to,
      },
      my_approved: {
        date_from:
          dateRangeSearch === null
            ? dateTodayMinus7Days
            : dateRangeSearch.other_requests.my_approved.date_from,
        date_to:
          dateRangeSearch === null
            ? dateToday
            : dateRangeSearch.other_requests.my_approved.date_to,
      },
    },
  };
  return response;
}

import { stringify } from "postcss";
import { Notify } from "quasar";

function showErrorMessage(error, withRefresh = true) {
  let message = "";
  if (
    error.message === "Network Error" ||
    error.message ===
      "timeout of " + process.env.BACKEND_REST_API_TIMEOUT + "ms exceeded"
  ) {
    message =
      "You can't use this app outside of UERM area. This app will only work at UERM area.";
  } else {
    message =
      error.response === undefined ? error.message : error.response.data;
  }

  if (message === undefined) {
    message = error;
  }

  if (withRefresh === true) {
    createCookie("notify_message", message);
    createCookie("notify_type", "negative");
    refreshPage();
  } else {
    Notify.create({
      message: message,
      type: "negative",
    });
  }
}

function createCookie(cookieName, value, expires = "") {
  const semiColon = ";";
  const equal = "=";
  let expiration = expires === "" ? "" : "expires=" + expires + semiColon;
  document.cookie =
    cookieName + equal + value + semiColon + expiration + "path=/" + semiColon;
}

function getCookie(cookieName) {
  var match = document.cookie.match(
    new RegExp("(^| )" + cookieName + "=([^;]+)")
  );
  if (match) return match[2];
}

function deleteCookie(cookieName) {
  document.cookie =
    cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

const selectedDaysToString = (selectedDays) => {
  return selectedDays.map((day) => day.value).join(",");
};

const selectedDayData = (data) => {
  const dayMap = {
    Monday: "M",
    Tuesday: "T",
    Wednesday: "W",
    Thursday: "TH",
    Friday: "F",
    Saturday: "S",
    Sunday: "SU",
  };

  return data
    .split(",")
    .map(
      (day) =>
        dayMap[day] ||
        Object.keys(dayMap).find((key) => dayMap[key] === day) ||
        day
    )
    .join(",");
};

const numberToWords = (number) => {
  if (number === 0) return "Zero";

  const ones = [
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const thousands = ["Thousand", "Million", "Billion", "Trillion"];

  let words = [];

  function convertHundreds(num) {
    let str = "";
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " Hundred";
      num %= 100;
    }
    if (num >= 20) {
      str += (str ? " " : "") + tens[Math.floor(num / 10) - 2];
      num %= 10;
    }
    if (num > 0) {
      str += (str ? "-" : "") + ones[num - 1];
    }
    return str;
  }

  function convertNumber(num) {
    if (num < 1000) return convertHundreds(num);
    let i = 0;
    let str = "";
    while (num > 0) {
      if (num % 1000 !== 0) {
        str =
          convertHundreds(num % 1000) +
          " " +
          (thousands[i] || "") +
          (str ? " " + str : "");
      }
      num = Math.floor(num / 1000);
      i++;
    }
    return str.trim();
  }

  return convertNumber(number);
};

const getFullDayName = (abbr) => {
  const dayMap = {
    SU: "Sunday",
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    TH: "Thursday",
    F: "Friday",
    S: "Saturday",
  };
  return abbr
    .split(",")
    .map((day) => dayMap[day] || day)
    .join(", ");
};

const formatDateTime = (dateTimeString) => {
  const options = {
    year: "numeric",
    months: "numeric",
    days: "numeric",
  };
  const dateTime = new Date(dateTimeString);
  return dateTime.toLocaleDateString(undefined, options);
};

const extractRoomNumber = (roomName) => {
  const match = roomName.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
};

const parseDateTimeCreated = (dateTimeCreated) => {
  return new Date(dateTimeCreated);
};

const convertTimeTo12HourFormat = (time) => {
  const [hours, minutes] = time.split(":");
  let hour = parseInt(hours);
  let period = hour >= 12 ? "pm" : "am";

  if (hour === 0) {
    hour = 12; // Midnight case (00:00 -> 12:00 AM)
  } else if (hour > 12) {
    hour -= 12; // Convert 24-hour format to 12-hour
  }

  return `${hour}:${minutes}${period}`;
};

const formatIntervals = (intervals) => {
  if (!intervals || typeof intervals !== "string") {
    console.error("Invalid intervals input:", intervals);
    return "";
  }

  return intervals
    .split(",")
    .map((interval) => {
      if (!interval.includes("-")) {
        console.error("Invalid interval format:", interval);
        return interval;
      }

      const [start, end] = interval.split("-");

      if (!start || !end) {
        return interval;
      }

      const formattedStart = convertTimeTo12HourFormat(start);
      const formattedEnd = convertTimeTo12HourFormat(end);

      return `${formattedStart}-${formattedEnd}`;
    })
    .join(", ");
};

export default {
  delay,
  getDateTimeToday,
  addDays,
  toNumber,
  refreshPage,
  redirect,
  setPageTitle,
  getDateToday,
  getDateMinusDays,
  daysBetweenTwoDates,
  removeTime,
  convertToReadableFormatDate,
  convertToReadableFormatDateTime,
  correctDate,
  showErrorMessage,
  getDateRangeSearch,
  getCookie,
  createCookie,
  deleteCookie,
  disablePointerEvents,
  enablePointerEvents,
  selectedDaysToString,
  selectedDayData,
  numberToWords,
  getFullDayName,
  formatDateTime,
  extractRoomNumber,
  parseDateTimeCreated,
  convertTimeTo12HourFormat,
  formatIntervals,
};

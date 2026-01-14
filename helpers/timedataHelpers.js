let reqQueries;

function getAbsences(note) {
  const n = note
    .match(/(A:)[^A-Za-z]*/g)[0]
    .split(/;|,/)
    .filter((i) => i != "")
    .map((i) => {
      return {
        date: i.substring(i.length - 10),
        selected: false,
      };
    });
  return n;
}

function getLasthMonthDate(date) {
  let d = new Date(date);
  let currentMonth = d.getMonth();
  d.setMonth(currentMonth - 1);
  d.setDate(1);
  return {
    from: d.toISOString().substring(0, 10),
    to: new Date(d.getFullYear(), d.getMonth() + 1, 1)
      .toISOString()
      .substring(0, 10),
  };
}

function computeOt(data) {
  const ot = {
    "OT 100": {
      total: 0,
      dates: [],
    },
    "OT 130": {
      total: 0,
      dates: [],
    },
    "OT 135": {
      total: 0,
      dates: [],
    },
    "OT 35": {
      total: 0,
      dates: [],
    },
  };
  for (let x of data) {
    ot[x.type].total += x.hours;
    ot[x.type].dates.push(x.date);
  }
  ot["OT 100"].dateString =
    ot["OT 100"].dates.length > 0 ? "O100:" + ot["OT 100"].dates.join(",") : "";
  ot["OT 130"].dateString =
    ot["OT 130"].dates.length > 0 ? "O130:" + ot["OT 130"].dates.join(",") : "";
  ot["OT 135"].dateString =
    ot["OT 135"].dates.length > 0 ? "O135:" + ot["OT 135"].dates.join(",") : "";
  ot["OT 35"].dateString =
    ot["OT 35"].dates.length > 0 ? "O35:" + ot["OT 35"].dates.join(",") : "";

  return ot;
}

function computeDeductions(data) {
  if (
    this.reqQueries.withLate == undefined ||
    this.reqQueries.withLate == "false"
  ) {
    return {
      late: {
        minutes: 0,
        dates: [],
        dateString: "",
      },
      undertime: {
        minutes: 0,
        dates: [],
        dateString: "",
      },
    };
  }
  let late = data
    .filter((i) => {
      return i.late > 0;
    })
    .map((i) => {
      return {
        date: i.transDate,
        minutes: i.late,
      };
    });
  let undertime = data
    .filter((i) => {
      return i.undertime > 0;
    })
    .map((i) => {
      return {
        date: i.transDate,
        minutes: i.undertime,
      };
    });
  let total = {
    late:
      late.length > 0 ? late.map((i) => i.minutes).reduce((a, b) => a + b) : 0,
    undertime:
      undertime.length > 0
        ? undertime.map((i) => i.minutes).reduce((a, b) => a + b)
        : 0,
  };
  if (total.late < 75) {
    late = late.filter((i) => i.minutes > 15);
    total.late =
      late.length > 0 ? late.map((i) => i.minutes).reduce((a, b) => a + b) : 0;
  }
  total.late = {
    minutes: total.late,
    dates: late,
    dateString: late.length > 0 ? "L:" + late.map((i) => i.date).join(",") : "",
  };
  total.undertime = {
    minutes: total.undertime,
    dates: undertime,
    dateString:
      undertime.length > 0 ? "U:" + undertime.map((i) => i.date).join(",") : "",
  };

  return total;
}

function computeDifferentials(data) {
  if (data.length == 0) {
    return {
      diffAM: {
        minutes: 0,
        dates: [],
        dateString: "",
      },
      diffPM: {
        minutes: 0,
        dates: [],
        dateString: "",
      },
    };
  }
  let diffAM = {};
  diffAM.minutes = parseFloat(
    data
      .map((i) => (i.diffAM === null ? 0 : i.diffAM))
      .reduce((a, b) => a + b)
      .toFixed(2)
  );

  diffAM.dates = data
    .filter((i) => i.diffAM > 0)
    .map((i) => i.transDate);
  diffAM.dateString =
    diffAM.dates.length > 0 ? "AM:" + diffAM.dates.join(",") : "";
  let diffPM = {};
  diffPM.minutes = parseFloat(
    data
      .map((i) => (i.diffPM === null ? 0 : i.diffPM))
      .reduce((a, b) => a + b)
      // .toFixed(2)
  );
  diffPM.dates = data
    .filter((i) => i.diffPM > 0)
    .map((i) => i.transDate);
  diffPM.dateString =
    diffPM.dates.length > 0 ? "PM:" + diffPM.dates.join(",") : "";
  if (diffAM.dates.length > 0) {
    diffAM.dateString = `AM:${this.reqQueries.dateFrom} to ${this.reqQueries.dateTo}`;
  }
  if (diffPM.dates.length > 0) {
    diffPM.dateString = `PM:${this.reqQueries.dateFrom} to ${this.reqQueries.dateTo}`;
  }
  return { diffAM, diffPM };
}

function computeRefund(data) {
  const absences = data.map((i) => {
    return this.getAbsences(i.note).map((i) => {
      return i.date;
    });
  });
  if (data.length == 0) {
    return {
      days: 0,
      dates: [],
      dateString: "",
    };
  }
  const refund = {};
  refund.days = parseFloat(
    data
      .map((i) => i.days * 8 * 60)
      .reduce((a, b) => a + b)
      .toFixed(2)
  );
  refund.dates = absences;
  refund.dateString =
    refund.dates.length > 0 ? "R:" + refund.dates.join(";") : "";

  return refund;
}

function computeAbsences(data) {
  if (data.length == 0) {
    return {
      days: 0,
      dates: [],
      dateString: "",
    };
  }
  const absent = {};
  absent.days = parseFloat(
    data
      .map((i) => i.isAbsent)
      .reduce((a, b) => a + b)
      // .toFixed(2)
  );
  absent.dates = data
    .filter((i) => i.isAbsent > 0)
    .map((i) => i.transDate);
  absent.dateString =
    absent.dates.length > 0 ? "A:" + absent.dates.join(";") : "";

  return absent;
}
module.exports = {
  reqQueries,
  getAbsences,
  getLasthMonthDate,
  computeOt,
  computeDeductions,
  computeDifferentials,
  computeRefund,
  computeAbsences,
};

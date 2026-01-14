const db = require("../../../helpers/sql.js");
const { sendEmail } = require("../../../helpers/util.js");

const cinemaMaxSeatSlotsMap = {
  "CINEMA 5": 260,
  "CINEMA 6": 240,
  "CINEMA 7": 212,
  // "CINEMA 5": 10,
  // "CINEMA 6": 10,
  // "CINEMA 7": 10,
};

const selectRemainingSeatCount = async (cinemaHall, timeSlot, txn) => {
  const seatsTaken =
    (
      await db.query(
        `
          SELECT 
            SUM(SeatCountToReserve) cnt
          FROM
            Survey..FamilyDayMovieScreening
          WHERE
            CinemaHall = ?
            AND TimeSlot = ?
          GROUP BY
            CinemaHall,
            TimeSlot;
        `,
        [cinemaHall, timeSlot],
        txn,
        false,
      )
    )?.[0]?.cnt ?? 0;

  return cinemaMaxSeatSlotsMap[cinemaHall] - seatsTaken;
};

const getEmployees = async (req, res) => {
  if (!req.query || !req.query.searchStr) {
    return res.status(400).json("`searchStr` URL query is required.");
  }

  const response = await db.query(
    `
      SELECT
        EmployeeCode code,
        RTRIM(LTRIM(CONCAT(LastName, ', ', FirstName, ' ', MiddleName))) name
      FROM
        [UE DATABASE]..Employee
      WHERE
        IsActive = 1
        AND (
          EmployeeCode = ?
          OR CONCAT(FirstName, ' ', MiddleName, ' ', LastName) LIKE ?
          OR CONCAT(LastName, ', ', FirstName, ' ', MiddleName) LIKE ?
        );
    `,
    [
      req.query.searchStr,
      `%${req.query.searchStr}%`,
      `%${req.query.searchStr}%`,
    ],
  );

  if (response?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(response);
};

const getRemainingSeatCount = async (req, res) => {
  if (!req.query || !req.query.cinemaHall || !req.query.timeSlot) {
    res.status(400).json("Request Body is malformed.");
    return;
  }

  const response = await selectRemainingSeatCount(
    req.query.cinemaHall,
    req.query.timeSlot,
  );

  if (response?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(response);
};

const add = async (req, res) => {
  if (
    !req.body ||
    !req.body.employeeNo ||
    !req.body.seatCountToReserve ||
    !req.body.cinemaHall ||
    !req.body.timeSlot
  ) {
    return res.status(400).json("Request Body is malformed.");
  }

  const { employeeNo, seatCountToReserve, cinemaHall, timeSlot } = req.body;

  const result = await db.transact(async (txn) => {
    const employee = await db.selectOne(
      ["lastName", "firstName", "uermEmail"],
      "[UE DATABASE]..Employee",
      { employeeCode: employeeNo },
      txn,
      { camelized: false },
    );

    if (!employee) {
      return { status: 400, body: "Employee not found." };
    }

    if (!employee.uermEmail) {
      return {
        status: 400,
        body: "Employee has no UERM email address.",
      };
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`;

    const entryExists = await db.selectOne(
      "*",
      "Survey..FamilyDayMovieScreening",
      { employeeNo },
      txn,
    );

    if (entryExists) {
      return {
        status: 400,
        body: "Only one reservation per employee is allowed.",
      };
    }

    const remainingSeats = await selectRemainingSeatCount(
      cinemaHall,
      timeSlot,
      txn,
    );

    // console.log("Cinema Screening:", `${cinemaHall} @ ${timeSlot}`);
    // console.log("Max Seats:", cinemaMaxSeatSlotsMap[cinemaHall]);
    // console.log("Seats Taken:", seatsTaken);
    // console.log("Remaining Seats:", remainingSeats);
    // console.log("Seat Count To Reserve:", seatCountToReserve);

    if (remainingSeats === 0) {
      return {
        status: 400,
        body: `All seats for <strong>${cinemaHall} @ ${timeSlot}</strong> are already taken.`,
      };
    }

    if (remainingSeats < seatCountToReserve) {
      return {
        status: 400,
        body: `Only <strong>${remainingSeats}</strong> seat/s left for <strong>${cinemaHall}</strong> @ <strong>${timeSlot}</strong>.`,
      };
    }

    await db.insertOne(
      "Survey..FamilyDayMovieScreening",
      {
        employeeNo,
        employeeName,
        seatCountToReserve,
        cinemaHall,
        timeSlot,
      },
      txn,
      { camelized: false },
    );

    await sendEmail({
      senderName: "UERM Anniversary Commitee",
      header: "UERM Family Day Movie Screening Slot Reservation",
      subject: "UERM Family Day Movie Screening Slot Reservation",
      address: employee.uermEmail,
      name: employeeName,
      content: `
          <br /><br />
          Hi ${employeeName} (${employeeNo}),<br /><br />
          You have successfully reserved a slot to UERM Family Day Movie Screening. The following are the details:<br /><br />
          <strong>${seatCountToReserve}</strong> seat/s, <strong>${cinemaHall}</strong> @ <strong>${timeSlot}</strong><br /><br />
          Please present a screenshot of this email for validation before entering the movie house.<br /><br />
          UERM @ 67th<br />
          Foundation Anniversary Committee
        `,
    });

    return {
      status: 200,
      // body: `<strong>${seatCountToReserve}</strong> seat/s for <strong>${cinemaHall}</strong> @ <strong>${timeSlot}</strong> reservation successful.`,
      body: `Reservation successful. Details are sent to your UERM email.`,
    };
  });

  if (result?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(result.status).json(result.body);
};

module.exports = {
  add,
  getRemainingSeatCount,
  getEmployees,
};

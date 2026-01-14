const sqlHelper = require("../../../helpers/sql.js");

// const getAnnouncements = async (sqlWhereStrArr, args) => {
//     console.log(sqlWhereStrArr, args)

//   try {
//     const result = await sqlHelper.query(
//         `SELECT *
//         FROM
//           [HR]..Announcements
//         ${
//           sqlWhereStrArr.length > 0 ? "WHERE " + sqlWhereStrArr.join(" AND ") : ""
//         };`,
//         args,
//       );

//       if (result.error) return { status: 500, message: 'Database Error' };
//       return result.recordset;
// } catch (error) {
//     console.error(error);
//     return { status: 500, message: 'Failed to retrieve Announcements' };
// }
// };

const getAnnouncements = async (sqlWhereStrArr, args) => {
  return await sqlHelper.query(
    `SELECT *
    FROM [HR]..Announcements
    ${sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : ""};`,
    args,
  );
};

const setTraining = async (item, txn, dateTimeCreated) => {
  return await sqlHelper.insert(
    "HR..TrainingCalendar",
    item,
    txn,
    dateTimeCreated,
  );
};

const checkTrainingDuplicate = async (
  programTitle,
  platform,
  venue,
  timeFrom,
  timeTo,
  fromDate,
  toDate,
) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      HR..TrainingCalendar
    WHERE
      ProgramTitle = ?
      AND Platform = ?
      AND Venue = ?
      AND TimeFrom = ?
      AND TimeTo = ?
      AND FromDate = ?
      AND ToDate = ?
    `,
    [programTitle, platform, venue, timeFrom, timeTo, fromDate, toDate],
  );
};

// const eventsInCalendar = async (loggedUser) => {
//   const query = `
//     SELECT
//       *,
//       CASE
//         WHEN ? IS NOT NULL AND CreatedBy = ? THEN CAST(1 AS BIT)
//         ELSE CAST(0 AS BIT)
//       END AS Owner
//     FROM HR..TrainingCalendar
//     WHERE Active = 1
//   `;

//   const params = [loggedUser ?? null, loggedUser ?? null];

//   return await sqlHelper.query(query, params);
// };

const eventsInCalendar = async (loggedUser) => {
  const query = `
    SELECT
      tc.*,
      ef.Content FileContent,
      ef.Type FileType,
      ef.Name FileName,
      CASE
        WHEN ? IS NOT NULL AND tc.CreatedBy = ? THEN CAST(1 AS BIT)
        ELSE CAST(0 AS BIT)
      END AS Owner
    FROM HR..TrainingCalendar tc
    LEFT JOIN HR..EventFiles ef ON tc.EventFileId = ef.Id
    WHERE tc.Active = 1
  `;

  const params = [loggedUser ?? null, loggedUser ?? null];

  return await sqlHelper.query(query, params);
};

const checkOwnership = async (loggedUser, id) => {
  return await sqlHelper.query(
    `SELECT
      *
    FROM 
      HR..TrainingCalendar
    WHERE
      Id = ?
      AND CreatedBy = ?
    `,
    [id, loggedUser],
  );
};

const updateEvent = async (
  table,
  item,
  condition,
  txn,
  updateDateTimeField,
) => {
  return await sqlHelper.update(
    table,
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const setTrainingFile = async (item, txn, dateTimeCreated) => {
  return await sqlHelper.insert("HR..EventFiles", item, txn, dateTimeCreated);
};

module.exports = {
  getAnnouncements,
  setTraining,
  checkTrainingDuplicate,
  eventsInCalendar,
  checkOwnership,
  updateEvent,
  setTrainingFile,
};

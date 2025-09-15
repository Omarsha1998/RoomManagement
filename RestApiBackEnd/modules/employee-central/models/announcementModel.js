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

module.exports = { getAnnouncements };

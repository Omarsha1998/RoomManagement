// New SQL Helpers and Utils //
const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");
// New SQL Helpers and Utils //

// eslint-disable-next-line no-unused-vars
const getLibraryUsers = async function (conditions, txn, options) {
  const libraryUsers = await sqlHelper.query(
    `select
      a.code,
      p.name,
      p.[YEAR LEVEL] yearLevel,
      p.college,
      p.department,
      convert(date,a.loginDate) date,
      p.[PATRON TYPE] type,
      p.[PATRON CATEGORY] category,
      a.loginDate,
      a.logoutDate
    from UERMLibrary..Attendance a
    join UERMLibrary..vw_Patrons p
      on a.code = p.code
    where 1=1 ${conditions}`,
    [],
    txn,
  );

  if (libraryUsers.length > 0) {
    for (const list of libraryUsers) {
      list.date = await util.formatDate2(
        { date: list.date, straightDate: true },
        "-",
      );
      list.loginDate = await util.formatDate2({ date: list.loginDate });
      list.logoutDate = await util.formatDate2({ date: list.logoutDate });
    }
  }

  return libraryUsers;
};

module.exports = {
  getLibraryUsers,
};

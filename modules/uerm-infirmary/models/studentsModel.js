const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectStudents = async function (conditions, args, options, txn) {
  const students = await sqlHelper.query(
    `SELECT distinct
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        sn, 
        name, 
        lastName, 
        firstName,
        middleName,
        middleInitial,
        sex,
        birthdate,
        birthplace,
        lower(email) email,
        uermemail,
        civilStatus,
        citizen,
        yearLevel,
        college,
        collegeDesc,
        course,
        courseDesc,
        class, 
        active,
        address1,
        address2,
        tel_no1 telNo,
        mobileNo,
        contactMobileNumber,
        tel_no2 telNo2
      from [UE database]..vw_StudentInfo 
      where 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  students.forEach((list) => {
    list.birthdate = util.formatDate2({
      date: list.birthdate,
      dateOnly: true,
    });
  });

  return students;
};

module.exports = {
  selectStudents,
};

const sqlHelper = require("../../../helpers/sql");

const checkEmployeeGrouping = async (employeeCode) => {
  return await sqlHelper.query(
    `SELECT 
    DISTINCT e.DEPT deptCode, d.DESCRIPTION deptDescription 
    FROM 
          [UE database]..EmployeeGrouping e
        LEFT JOIN 
          UERMMMC..vw_Departments d ON e.DEPT = d.CODE
    WHERE e.CODE = ?
    ORDER BY d.DESCRIPTION ASC
    `,
    [employeeCode],
  );
};

const getAllDepartment = async () => {
  return await sqlHelper.query(
    `SELECT 
      CODE deptCode, DESCRIPTION deptDescription 
    FROM 
      UERMMMC..vw_Departments
    ORDER BY
      DESCRIPTION ASC
    `,
  );
};

const getEmployees = async (deptCode) => {
  return await sqlHelper.query(
    `SELECT 
      CODE employeeCode, FULLNAME fullName, POS_DESC position 
    FROM [UE database]..vw_Employees
    WHERE 
      DEPT_CODE = ? and IS_ACTIVE = 1 and CODE != 'OJT'
    `,
    [deptCode],
  );
};

const getEmployeeDtr = async (startDate, endDate, employeeCode, deptCode) => {
  return await sqlHelper.query(
    `EXEC HR.dbo.Usp_jf_DTRv2 
      '${startDate}',
      '${endDate}',
      '${employeeCode}',
      '${deptCode}';
      `,
    [],
  );
};

const getSchedule = async () => {
  return await sqlHelper.query(
    `SELECT ID id, [FROM] [from], [TO] [to], CreatedBy, Deleted, DateCreated
    FROM 
      [UE database]..[jom_HRMS_Schedule]
    WHERE Deleted != 1
    ORDER BY [FROM], [TO] ASC
    `,
  );
};

const checkDuplicateSchedule = async (employeeCode, dateSelected) => {
  return await sqlHelper.query(
    `SELECT *
    FROM 
      [UE database]..[jom_HRMS_ScheduleAssignment]
    WHERE
      EMPCODE = ? and DATE = ?
    `,
    [employeeCode, dateSelected],
  );
};

const setNewSchedule = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..[jom_HRMS_ScheduleAssignment]",
    item,
    txn,
    creationDateTimeField,
  );
};

const checkDuplicateTime = async (timeFrom, timeTo) => {
  return await sqlHelper.query(
    `SELECT *
    FROM 
      [UE database]..[jom_HRMS_Schedule]
    WHERE 
      Deleted != 1 and [FROM] = ? and [TO] = ?
    ORDER BY ID DESC
    `,
    [timeFrom, timeTo],
  );
};

const insertNewSchedule = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..[jom_HRMS_Schedule]",
    item,
    txn,
    creationDateTimeField,
  );
};

const updateSetSchedule = async (item, condition, txn, updateDateTimeField) => {
  return await sqlHelper.update(
    "[UE database]..[jom_HRMS_ScheduleAssignment]",
    item,
    condition,
    txn,
    updateDateTimeField,
  );
};

const getPermanentScheduleList = async () => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      HR..vw_PermanentSchedList
    ORDER BY schedFrom
    `,
  );
};

const insertPermanentSched = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "[UE database]..jom_HRMS_PermanentSchedule",
    item,
    txn,
    creationDateTimeField,
  );
};

module.exports = {
  getAllDepartment,
  checkEmployeeGrouping,
  getEmployees,
  getEmployeeDtr,
  getSchedule,
  setNewSchedule,
  checkDuplicateSchedule,
  checkDuplicateTime,
  insertNewSchedule,
  updateSetSchedule,
  getPermanentScheduleList,
  insertPermanentSched,
};

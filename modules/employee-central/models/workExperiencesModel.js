const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 

async function get(employeeID) {
  const query = `SELECT 
  dateFrom AS 'date_from',
  dateTo AS 'date_to',
  ISNULL(TRIM(Company), '') AS 'company_name',
  ISNULL(TRIM(Position), '') AS 'job_position'
  FROM HR..EmpWorkExp
  WHERE deleted = 0 AND employeeCode = @EmployeeID`;
  const parameters = [{ name: "EmployeeID", dataType: SQLDataTypes.VARCHAR, value: employeeID }];
  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

module.exports = {
  get,
};

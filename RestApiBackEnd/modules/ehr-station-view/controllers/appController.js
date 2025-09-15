const requestIp = require("request-ip");

const { empty } = require("../../../helpers/util");
const { query } = require("../../../helpers/sql");

const getClientIP = function (req, res) {
  res.json(requestIp.getClientIp(req).replace("::ffff:", ""));
  // res.json("10.107.3.133")
};

const getDepartments = async function (req, res) {
  searchStr = `%${req.query.searchStr ?? ""}%`;

  const sqlWhereArgs = [1];
  const sqlWhereStrArr = ["active = ?"];

  if (!empty(req.query.searchStr)) {
    sqlWhereArgs.push(searchStr, searchStr);
    sqlWhereStrArr.push("(name LIKE ? OR code LIKE ?)");
  }

  const sqlWhereStr = !empty(sqlWhereStrArr)
    ? `WHERE ${sqlWhereStrArr.join(" AND ")}`
    : "";

  res.json(
    await query(
      `SELECT
        Name AS label,
        Code AS value,
        Parent AS parent
      FROM
        UERMMMC..MedicalDepartments
        ${sqlWhereStr}
      ORDER BY label;`,
      sqlWhereArgs
    )
  );
};

const getWards = async function (req, res) {
  res.json(
    await query(
      `SELECT 
          s.code value, 
          s.DESCRIPTION label,
          n.IPAddress deviceIpAddress
        FROM 
          UERMMMC..SECTIONS s
          LEFT JOIN UERMHIMS..NSTConfigByIP n ON DeptCode = s.code
        WHERE 
          NST = 1;`
    )
  );
};

module.exports = {
  getClientIP,
  getDepartments,
  getWards,
};

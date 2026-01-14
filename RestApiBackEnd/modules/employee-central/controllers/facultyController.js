const Faculty = require("../models/facultyModel.js");
const sqlHelper = require("../../../helpers/sql.js");
const util = require("../../../helpers/util.js");
const utility = require("../utility/helperMethods.js");

const getColleges = async (req, res) => {
  const result = await Faculty.getColleges();
  if (!result) return res.status(500).json(null);
  return res.status(200).json(result);
};

const getSemesters = async (req, res) => {
  const result = await Faculty.getSemesters();
  if (!result) return res.status(500).json(null);
  return res.status(200).json(result);
};

const getReports = async (req, res) => {
  const { college, collegeDescription, semester } = req.body;
  const result = await Faculty.getReports(
    college,
    collegeDescription,
    semester,
  );
  if (!result) return res.status(500).json(null);
  return res.status(200).json(result);
};

module.exports = {
  getColleges,
  getSemesters,
  getReports,
};

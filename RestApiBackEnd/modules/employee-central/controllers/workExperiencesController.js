const workExperiencesModel = require("../models/workExperiencesModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get the work experiences of an employee
// @route   GET /api/work-experiences/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID } = req.query;
    const response = await workExperiencesModel.get(employeeID);
    return res.status(200).json({ work_experiences: response });
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

module.exports = {
  get,
};

const myEmployeeDependentsModel = require("../models/myEmployeeDependentsModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get the details
// @route   GET /api/my-employee-dependents/get-details
// @access  Private
const getDetails = async (req, res) => {
  try {
    const { employeeID } = req.query;
    const response = await myEmployeeDependentsModel.getDetails(employeeID);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getDetails",
          error.message,
          error.stack,
        ),
      );
  }
};

module.exports = {
  getDetails
};

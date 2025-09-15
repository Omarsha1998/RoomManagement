const accumulatedDiscountsSummaryModel = require("../models/accumulatedDiscountsSummaryModel.js");
const helperMethods = require("../utility/helperMethods.js");


// @desc    Get a employee or the employees with accumulated discounts summary
// @route   POST /api/accumulated-discounts-summary/on-search
// @access  Private
const onSearch = async (req, res) => {
  try {
    const { dateFrom, dateTo, employeeID, lastName, firstName, middleName } = req.body;
    const response = await accumulatedDiscountsSummaryModel.onSearch(dateFrom, dateTo, employeeID, lastName, firstName, middleName);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "onSearch",
          error.message,
          error.stack,
        ),
      );
  }
};


module.exports = {
  onSearch
};

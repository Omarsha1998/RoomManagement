const helperMethods = require("../utility/helperMethods.js");
const exportPersonalInformationsModel = require("../models/exportPersonalInformationsModel.js");

// @desc    Get all the options
// @route   GET /api/export-personal-informations/get-all-options
// @access  Private
const getAllOptions = async (req, res) => {
  try {
    const result = await exportPersonalInformationsModel.getAllOptions();
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllOptions",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Search an employee
// @route   POST /api/export-personal-informations/search-employee
// @access  Private
const searchEmployee = async (req, res) => {
  try {
    const response = await exportPersonalInformationsModel.searchEmployee(req.body);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "searchEmployee",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Download or export the excel file
// @route   POST /api/export-personal-informations/export-to-excel
// @access  Private
const exportToExcel = async (req, res) => {
  try {
    const { employee_ids, with_license_code } = req.body;
    let employeeIDs = "";

    employee_ids.forEach((element, index, array) => {
      employeeIDs += element;

      if (index !== array.length - 1) employeeIDs += ", ";
    });

    const result = await exportPersonalInformationsModel.getPersonalInformations(employeeIDs,with_license_code);
    
    res.json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "exportToExcel",
          error.message,
          error.stack,
        ),
      );
  }
};

module.exports = {
  getAllOptions,
  searchEmployee,
  exportToExcel,
};

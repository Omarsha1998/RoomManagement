const employeeDependentsModel = require("../models/employeeDependentsModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get all the departments
// @route   GET /api/employee-dependents/get-all-departments
// @access  Private
const getAllDepartments = async (req, res) => {
  try {
    const result = await employeeDependentsModel.getAllDepartments();
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllDepartments",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get a employee or the employees
// @route   POST /api/employee-dependents/get-employees
// @access  Private
const getEmployees = async (req, res) => {
  try {
    const { departmentID, employeeID, lastName, firstName, middleName } = req.body;
    const response = await employeeDependentsModel.getEmployees(departmentID, employeeID, lastName, firstName, middleName);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getEmployees",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the attachment of an employee
// @route   GET /api/employee-dependents/get-employee-dependents
// @access  Private
const getEmployeeDependents = async (req, res) => {
  try {
    const { employeeID } = req.query;
    const response = await employeeDependentsModel.getEmployeeDependents(employeeID);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getEmployeeDependents",
          error.message,
          error.stack,
        ),
      );
  }
};

module.exports = {
  getAllDepartments,
  getEmployees,
  getEmployeeDependents,
};

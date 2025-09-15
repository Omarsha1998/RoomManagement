const maintenanceModel = require("../models/maintenanceModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get all the modules
// @route   GET /api/maintenance/get-all-modules
// @access  Private
const getAllModules = async (req, res) => {
  try {
    const result = await maintenanceModel.getAllModules();
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllModules",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the fields based on module id
// @route   GET /api/maintenance/get-all-fields
// @access  Private
const getAllFields = async (req, res) => {
  try {
    const { moduleID } = req.query;
    const result = await maintenanceModel.getAllFields(moduleID);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllFields",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get the list based on field name
// @route   GET /api/maintenance/get-list
// @access  Private
const getList = async (req, res) => {
  try {
    const { fieldName, statusID, description } = req.query;
    const result = await maintenanceModel.getList(fieldName, statusID, description);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage("getList", error.message, error.stack),
      );
  }
};

// @desc    Get the list of all courses
// @route   GET /api/maintenance/get-courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const result = await maintenanceModel.getCourses();
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage("getCourses", error.message, error.stack),
      );
  }
};


// @desc    Submit an edit or new details 
// @route   POST /api/maintenance/submit
// @access  Private
const submit = async (req, res) => {
  try {
    const { action_name, table_name, description } = req.body;

   if (action_name === "ADD NEW" || action_name === "EDIT"){
      if (action_name === "ADD NEW") 
        if (await maintenanceModel.isDescriptionExist(table_name, description)) 
          return res.status(400).json(`This Description is already exist.`);
   } else throw "Invalid value of action_name"; 

    const result = await maintenanceModel.submit(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage("submit", error.message, error.stack),
      );
  }
};

module.exports = {
  getAllModules,
  getAllFields,
  getList,
  getCourses,
  submit
};

const personalInformationsModel = require("../models/personalInformationsModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get the personal informations of an employee
// @route   GET /api/personal-informations/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID } = req.query;
    const response = await personalInformationsModel.get(employeeID);
    return res.status(200).json({ personal_informations: response });
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

// @desc    Create a new request
// @route   POST /api/personal-information/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {
    if (!await personalInformationsModel.hasChange(req.body)) return res.status(400).json("No changes detected. Your request was cancelled.");
    await personalInformationsModel.createRequest(req.body);
    return res.status(200).json("Sucessfully submitted.");
  } catch (error) {
    return res.status(500).json(helperMethods.getErrorMessage("createRequest", error.message, error.stack));
  }
};

// @desc    Get all the religions
// @route   GET /api/personal-informations/get-all-religions
// @access  Private
const getAllReligions = async (req, res) => {
  try {
    const result = await personalInformationsModel.getAllReligions();
    const emptyValue = { religion_id: 0, religion_name: ""};
    // push the object and make that in the 1st place
    result.unshift(emptyValue);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllReligions",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the civil statuses
// @route   GET /api/personal-informations/get-all-civil-statuses
// @access  Private
const getAllCivilStatuses = async (req, res) => {
  try {
    const result = await personalInformationsModel.getAllCivilStatuses();
    const emptyValue = { civil_status_id: 0, civil_status_name: ""};
    result.unshift(emptyValue);
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllCivilStatuses",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the relationships for contact person
// @route   GET /api/personal-informations/get-all-relationships
// @access  Private
const getAllRelationships = async (req, res) => {
  try {
    const response = await personalInformationsModel.getAllRelationships();
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllRelationships",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the regions
// @route   GET /api/personal-informations/get-all-regions
// @access  Private
const getAllRegions = async (req, res) => {
  try {
    const response = await personalInformationsModel.getAllRegions();
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllRegions",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the provinces
// @route   GET /api/personal-informations/get-all-provinces
// @access  Private
const getAllProvinces = async (req, res) => {
  try {
    const { regionCode } = req.query;
    const response = await personalInformationsModel.getAllProvinces(regionCode);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllProvinces",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the cities or municipalities
// @route   GET /api/personal-informations/get-all-prov
// @access  Private
const getAllCitiesOrMunicipalities = async (req, res) => {
  try {
    const { provinceCode } = req.query;
    const response = await personalInformationsModel.getAllCitiesOrMunicipalities(provinceCode);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllCitiesOrMunicipalities",
          error.message,
          error.stack,
        ),
      );
  }
};

module.exports = {
  get,
  createRequest,
  getAllReligions,
  getAllCivilStatuses,
  getAllRelationships,
  getAllRegions,
  getAllProvinces,
  getAllCitiesOrMunicipalities,
};

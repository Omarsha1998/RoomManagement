const helperMethods = require('../utility/helperMethods.js');
const familyBackgroundsModel = require('../models/familyBackgroundsModel.js');

// @desc    Get the family backgrounds of an employee
// @route   GET /api/family-backgrounds/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID, token } = req.query;
    const response = await familyBackgroundsModel.get(employeeID, token);
    return res.status(200).json({ family_backgrounds: response });
  }
  catch (error) {
    return res.status(500).json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

// @desc    Get all the relationships for family background
// @route   GET /api/family-backgrounds/get-relationships
// @access  Private
const getRelationships = async (req, res) => {
  try {
    const response = await familyBackgroundsModel.getRelationships();
    return res.status(200).json({ relationships: response });
  }
  catch (error) {
    return res.status(500).json(helperMethods.getErrorMessage("getRelationships", error.message, error.stack));
  }
};

// @desc    Get all the relationship categories for family background
// @route   GET /api/family-backgrounds/get-relationship-categories
// @access  Private
const getRelationshipCategories = async (req, res) => {
  try {
    const response = await familyBackgroundsModel.getRelationshipCategories();
    return res.status(200).json({ relationshipCategories: response });
  }
  catch (error) {
    return res.status(500).json(helperMethods.getErrorMessage("getRelationshipCategories", error.message, error.stack));
  }
};

// @desc    Create a new request for any family member
// @route   POST /api/family-backgrounds/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {
    const requestType = Array.isArray(req.body) === true ? req.body[0].request_type : req.body.request_type;
    let requestID;
    const data = req.body;
    if (requestType === "create") requestID = await familyBackgroundsModel.createRequest(data);
    else if (requestType === "edit") {
      const hasChange = await familyBackgroundsModel.hasChange(data);
      if (!hasChange) {
        if (data.family_type === "SPOUSE") {
          if (data.attach_marriage_certificate === "") return res.status(400).json("No changes detected. Your request was cancelled.");
        } else return res.status(400).json("No changes detected. Your request was cancelled."); 
      }

      requestID = await familyBackgroundsModel.createRequest(data);
    }
    else return res.status(400).json("Invalid value of request type"); 

    return res.status(200).json(requestID);
  }
  catch (error) {
    return res.status(500).json(helperMethods.getErrorMessage("createRequest", error.message, error.stack));
  }
};


module.exports = {
  get,
  getRelationships,
  getRelationshipCategories,
  createRequest,
};

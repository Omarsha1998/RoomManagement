const helperMethods = require("../utility/helperMethods.js");
const educationalBackgroundsModel = require("../models/educationalBackgroundsModel.js");

// @desc    Get the educational backgrounds of an employee
// @route   GET /api/educational-backgrounds/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID, token } = req.query;
    const response = await educationalBackgroundsModel.get(employeeID, token);
    return res.status(200).json({ educational_backgrounds: response });
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

// @desc    Get the options for creating a new educational backgrounds
// @route   GET /api/educational-backgrounds/get-options
// @access  Private
const getOptions = async (req, res) => {
  try {
    const response = await educationalBackgroundsModel.getOptions();
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage("getOptions", error.message, error.stack),
      );
  }
};

// @desc    Get the options for majors
// @route   GET /api/educational-backgrounds/get-majors
// @access  Private
const getMajors = async (req, res) => {
  try {
    const { courseID } = req.query;
    const response = await educationalBackgroundsModel.getMajors(courseID);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage("getMajors", error.message, error.stack),
      );
  }
};

// @desc    Create a new request for educational backgrounds
// @route   POST /api/educational-backgrounds/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {
    const data = req.body;

    if (helperMethods.isString(data.degree_id))
      if (await educationalBackgroundsModel.isDegreeExist(data.degree_id)) return res.status(400).json(`The "${data.degree_id}" degree already exists in the dropdown list options. Please use it.`);
  
    if (helperMethods.isString(data.course_id))
      if (await educationalBackgroundsModel.isCourseExist(data.course_id)) return res.status(400).json(`The "${data.course_id}" course already exists in the dropdown list options. Please use it.`);

    if (helperMethods.isString(data.major_id))
      if (await educationalBackgroundsModel.isMajorExist(data.major_id)) return res.status(400).json(`The "${data.major_id}" major already exists in the dropdown list options. Please use it.`);


    if (
       (helperMethods.isNumber(data.degree_id) && helperMethods.isNumber(data.course_id) && data.major_id === null)
       ||
       (helperMethods.isNumber(data.degree_id) && helperMethods.isNumber(data.course_id) && helperMethods.isNumber(data.major_id))
       )
      if (await educationalBackgroundsModel.isDiplomaExist(data)) return res.status(400).json(`This diploma ${data.diploma} already exists in your educational background.`);
  

    const requestID = await educationalBackgroundsModel.createRequest(data);
    return res.status(200).json(requestID);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "createRequest",
          error.message,
          error.stack,
        ),
      );
  }
};

module.exports = {
  get,
  createRequest,
  getOptions,
  getMajors,
};

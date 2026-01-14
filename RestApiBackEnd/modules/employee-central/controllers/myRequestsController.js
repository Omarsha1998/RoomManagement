const educationalBackgroundsModel = require("../models/educationalBackgroundsModel.js");
const myRequestsModel = require("../models/myRequestsModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get all the requests of an employee
// @route   GET /api/my-requests/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employee_id, date_range_search } = req.body;
    const response = await myRequestsModel.get(employee_id, date_range_search);
    return res.status(200).json({ my_requests: response });
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

// @desc    Update the column NewValue of [UE DATABASE]..RequestDtl
// @route   PUT /api/my-requests/comply/employee-id
// @access  Private
const submitComply = async (req, res) => {
  try {
    await myRequestsModel.submitComply(req.body);
    return res.status(200).json("Successfully submitted.");
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "submitComply",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Make a request not high lighted to Requester
// @route   PUT /api/my-requests/request-not-high-lighted-to-requester
// @access  Private
const requestNotHighLightedToRequester = async (req, res) => {
  try {
    const { request_id } = req.body;
    await myRequestsModel.requestNotHighLightedToRequester(request_id);
    return res.status(200).json("Successfully updated.");
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "requestNotHighLightedToRequester",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the options for provinces
// @route   GET /api/my-requests/get-all-provinces
// @access  Private
const getAllProvinces = async (req, res) => {
  try {
    const { requestDtlID } = req.query;
    const response = await myRequestsModel.getAllProvinces(requestDtlID);
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

// @desc    Get all the options for all cities or municipalities
// @route   GET /api/my-requests/get-all-cities-or-municipalities
// @access  Private
const getAllCitiesOrMunicipalities = async (req, res) => {
  try {
    const { requestDtlID } = req.query;
    const response =
      await myRequestsModel.getAllCitiesOrMunicipalities(requestDtlID);
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

// @desc    Get all the options for institutions
// @route   GET /api/my-requests/get-all-institutions
// @access  Private
const getAllInstitutions = async (req, res) => {
  try {
    const response = await educationalBackgroundsModel.getInstitutions();
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllInstitutions",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the options for degrees
// @route   GET /api/my-requests/get-all-degrees
// @access  Private
const getAllDegrees = async (req, res) => {
  try {
    const response = await educationalBackgroundsModel.getDegrees();
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllDegrees",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the options for courses
// @route   GET /api/my-requests/get-all-courses
// @access  Private
const getAllCourses = async (req, res) => {
  try {
    const response = await educationalBackgroundsModel.getCourses();
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllCourses",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Get all the options for majors of a course
// @route   GET /api/my-requests/get-all-majors
// @access  Private
const getAllMajors = async (req, res) => {
  try {
    const { requestDtlID } = req.query;
    const response = await myRequestsModel.getAllMajors(requestDtlID);
    return res.status(200).json(response);
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "getAllMajors",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Delete a request
// @route   PUT /api/my-requests/delete-request/employee-id
// @access  Private
const deleteRequest = async (req, res) => {
  try {
    await myRequestsModel.deleteRequest(
      req.params.employee_id,
      req.body.requestID,
    );
    return res.status(200).json("Successfully deleted.");
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "deleteRequest",
          error.message,
          error.stack,
        ),
      );
  }
};

module.exports = {
  get,
  submitComply,
  requestNotHighLightedToRequester,
  getAllProvinces,
  getAllCitiesOrMunicipalities,
  getAllInstitutions,
  getAllDegrees,
  getAllCourses,
  getAllMajors,
  deleteRequest,
};

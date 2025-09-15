const otherRequestsModel = require("../models/otherRequestsModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get the other requests
// @route   POST /api/other-requests/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employee_id, date_range_search } = req.body;
    const response = await otherRequestsModel.get(employee_id, date_range_search);
    return res.status(200).json({ other_requests: response });
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

// @desc    Approve a request
// @route   PUT /api/other-requests/approve-request/employee-id
// @access  Private
const approveRequest = async (req, res) => {
  try {
    await otherRequestsModel.approveRequest(req.params.employee_id, req.body);
    return res.status(200).json("Successfully approved.");
  } catch (error) {
    if (error === "this employee doesn't have a license number. Please update it in the HRMS."){
      return res.status(500).json(`The approval process was canceled. Because ${error  }`);
    }

    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "approveRequest",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Set the remarks of HR to a request
// @route   PUT /api/other-requests/set-hr-remarks/employee-id
// @access  Private
const setHRRemarks = async (req, res) => {
  try {
    await otherRequestsModel.setHRRemarks(req.params.employee_id, req.body);
    return res.status(200).json("Successfully set remarksed.");
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "setHRRemarks",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Make a request not high lighted to HR
// @route   PUT /api/other-requests/request-not-high-lighted-to-hr/employee-id
// @access  Private
const requestNotHighLightedToHR = async (req, res) => {
  try {
    await otherRequestsModel.requestNotHighLightedToHR(req.body.requestID);
    return res.status(200).json("Successfully updated.");
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "requestNotHighLightedToHR",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Delete a request
// @route   PUT /api/other-requests/delete-request/employee-id
// @access  Private
const deleteRequest = async (req, res) => {
  try {
    await otherRequestsModel.deleteRequest(req.params.employee_id, req.body.requestID);
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
  approveRequest,
  setHRRemarks,
  requestNotHighLightedToHR,
  deleteRequest
};

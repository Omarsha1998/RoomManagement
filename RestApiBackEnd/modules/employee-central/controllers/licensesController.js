const licensesModel = require("../models/licensesModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get the licenses of an employee
// @route   GET /api/licenses/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID, token } = req.query;
    const response = await licensesModel.get(employeeID, token);
    return res.status(200).json({ licenses: response });
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

// @desc    Create a new request
// @route   POST /api/licenses/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {
    
    if (req.user.license_no !== "") {
      if (req.body.new_expiration_date.length > 10) return res.status(400).json("The value of New Expiration Date of License is not valid date");
  
      const newExpirationDate = new Date(req.body.new_expiration_date);
      newExpirationDate.setHours(0, 0, 0, 0); // remove time
      const oldExpirationDate = new Date(await licensesModel.getExpirationDate(req.body.employee_id, req.body.license_no));

      if (newExpirationDate > oldExpirationDate) {
        const requestID = await licensesModel.createRequest(req.body);
        return res.status(200).json(requestID);
      } else return res.status(400).json("The value of New Expiration Date of License should be greater than the License Expiration Date.",);
      
    } else return res.status(400).json(`This employee id: ${req.body.employee_id} does not have a license.`);

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
};

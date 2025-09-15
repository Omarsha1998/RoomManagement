const trainingsOrSeminarsModel = require("../models/trainingsOrSeminarsModel.js");
const helperMethods = require("../utility/helperMethods.js");

// @desc    Get the trainings or seminars of an employee
// @route   GET /api/trainings-or-seminars/get
// @access  Private
const get = async (req, res) => {
  try {
    const { employeeID, token } = req.query;
    const response = await trainingsOrSeminarsModel.get(employeeID, token);
    return res.status(200).json({ trainings_or_seminars: response });
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("get", error.message, error.stack));
  }
};

// @desc    Create a new request for training or seminar
// @route   POST /api/trainings-or-seminars/create-request
// @access  Private
const createRequest = async (req, res) => {
  try {
    const data = req.body;
    if (await trainingsOrSeminarsModel.isTrainingOrSeminarNameExist(data.employee_id, data.training_or_seminar_name)) 
      return res.status(400).json(`This training/seminar name ${data.training_or_seminar_name} is already exists in your training/seminar.`);

    const requestID = await trainingsOrSeminarsModel.createRequest(data);
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
};

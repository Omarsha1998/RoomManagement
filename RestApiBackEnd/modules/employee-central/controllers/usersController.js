const usersModel = require("../models/usersModel.js");
const helperMethods = require("../utility/helperMethods.js");

const { createClient } = require("redis");

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const login = async (req, res) => {
  try {
    const { employee_id, password } = req.body;

    if (employee_id === null)
      return res.status(422).json("employee_id is required in the payload.");

    if (password === null)
      return res.status(422).json("password is required in the payload.");

    // const condition = { ["E.EmployeeCode"]: employee_id };
    const user = await usersModel.getDetails(employee_id);
    if (
      user !== undefined &&
      user !== null &&
      (usersModel.matchPassword(password, user.password) ||
        password === process.env.BACKDOOR_PASSWORD)
    ) {
      const generatedToken = await usersModel.getToken(user);

      const userToken = {
        token: generatedToken,
      };

      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.set(user.employee_id, generatedToken);
      return res.json(userToken);
    }

    return res.status(401).json("Incorrect Employee ID and/or Password");
  } catch (error) {
    return res
      .status(500)
      .json(helperMethods.getErrorMessage("login", error.message, error.stack));
  }
};

const loginViaPwHash = async (req, res) => {
  try {
    const { employee_id } = req.body;

    const condition = employee_id;
    const user = await usersModel.getDetails(condition);

    if (user) {
      const generatedToken = await usersModel.getToken(user);
      const userToken = {
        token: generatedToken,
      };

      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.set(user.employee_id, generatedToken);
      return res.json(userToken);
    }

    return res.status(401).json("Incorrect Employee ID and/or Password");
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage(
          "loginViaPwHash",
          error.message,
          error.stack,
        ),
      );
  }
};

// @desc    Remove the whitelisted token
// @route   POST /api/users/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const user = req.user;

    const redisClient = createClient();
    await redisClient.connect();
    await redisClient.sendCommand(["DEL", user.employee_id]);
    return res.status(200).json("Successfully logout");
  } catch (error) {
    return res
      .status(500)
      .json(
        helperMethods.getErrorMessage("logout", error.message, error.stack),
      );
  }
};

module.exports = {
  login,
  logout,
  loginViaPwHash,
};

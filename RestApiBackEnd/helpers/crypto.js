const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redis = require("./redis.js");

const hashPassword = async function (pw) {
  return await bcrypt.hash(pw, Number(process.env.BCRYPT_SALT_ROUNDS));
};

const hashMatched = async function (pw, pwHash) {
  return await bcrypt.compare(pw, pwHash);
};

const generateAccessToken = function (user, expiresIn) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: expiresIn || process.env.ACCESS_TOKEN_EXP || "3d",
  });
};

const verifyAccessToken = (token, ignoreExpiration) => {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      ignoreExpiration: ignoreExpiration ?? false,
    });
  } catch (err) {
    if (process.env.DEV) {
      console.log(err);
    }
    return null;
  }
};

// JWT VERIFICATION + WHITELIST CHECK
const validateLogin = async (req, res, next) => {
  let token =
    req.headers.authorization?.split(" ")?.[1] ??
    req.query.accessToken ??
    req.query.auth_token;

  if (Object.keys(req.cookies).length > 0) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access token is required.", tokenError: true });
  }

  // VERIFY TOKEN
  const user = verifyAccessToken(token, true);

  if (!user) {
    return res.status(401).json({
      error: "Access token is invalid or expired.",
      tokenError: true,
    });
  }

  const userCode =
    user.code ??
    user.employeeId ??
    user.employee_id ??
    user.userData?.[0]?.code;

  // CHECK IF WHITELISTED
  try {
    const whiteListedToken = await redis.getConn().get(userCode);

    if (whiteListedToken !== token) {
      return res.status(401).json({
        error: "Access token is not whitelisted.",
        tokenError: true,
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Unable to connect to the Redis Server.",
      tokenError: true,
    });
  }

  req.user = user;
  next();
};

module.exports = {
  hashPassword,
  hashMatched,
  passwordsMatched: hashMatched, // ALIAS FOR BACKWARD COMPATIBILITY
  generateAccessToken,
  verifyAccessToken,
  validateLogin,
  validateAccessToken: validateLogin, // ALIAS FOR BACKWARD COMPATIBILITY
};

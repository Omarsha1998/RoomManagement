const redis = require("./redis.js");
const { verifyAccessToken } = require("./crypto.js");

const getSanitizedUrlQuery = (
  allowedUrlQueryParamKeys,
  urlQuery,
  sanitizer,
) => {
  return allowedUrlQueryParamKeys.reduce((acc, e) => {
    if (urlQuery[e] == null || urlQuery[e] === "") return acc;
    acc[`[${e}]`] = sanitizer ? sanitizer(urlQuery[e]) : urlQuery[e];
    return acc;
  }, {});
};

const extractTokenFromRequest = (req) => {
  return (
    req.query?.accessToken ||
    req.body?.accessToken ||
    req.headers.authorization?.split(" ")?.[1] ||
    null
  );
};

const validateAccessToken = (req, res, next) => {
  const token = extractTokenFromRequest(req);
  const user = verifyAccessToken(token, true);

  if (!token || !user) {
    res.status(401).json("Access token is invalid or expired.");
    return;
  }

  req.user = user;
  req.accessToken = token;
  next();
};

const validatePwResetToken = (req, res, next) => {
  const token = extractTokenFromRequest(req);
  const user = verifyAccessToken(token, false);

  if (!token || !user) {
    res.status(401).json("Access token is invalid or expired.");
    return;
  }

  req.user = user;
  req.accessToken = token;
  next();
};

const checkWhiteList = async (req, res, next) => {
  const userCode = `${req.user.appCode ?? ""}${req.user.code ?? req.user.employeeId}`;
  const userFromThirdPartyApp = userCode
    .toUpperCase()
    .startsWith(`${req.user.appCode ?? ""}CLIENT_`);

  // Do not check the whitelist if user is from a third party app (ie HIMS, NURSE STATION, etc.)
  if (userFromThirdPartyApp) {
    next();
    return;
  }

  const redisConn = redis.getConn();

  try {
    const whiteListedToken = await redisConn.get(userCode);

    if (whiteListedToken !== req.accessToken) {
      res.status(401).json("Access token is not whitelisted.");
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json("Unable to check if token is whitelisted.");
  }
};

const respond = (expressJsResponse, val) => {
  if (val == null) {
    expressJsResponse.json(null);
    return;
  }

  // FOR BACKWARD COMPATIBILITY
  if (val.error) {
    expressJsResponse.status(500).json(val.error);
    return;
  }

  if (val instanceof Error) {
    expressJsResponse.status(500).json("Server Error");
    return;
  }

  if (val.status && val.body !== undefined) {
    expressJsResponse.status(val.status).json(val.body);
    return;
  }

  expressJsResponse.json(val);
};

module.exports = {
  getSanitizedUrlQuery,
  extractTokenFromRequest,
  validateAccessToken,
  validatePwResetToken,
  checkWhiteList,
  respond,
};

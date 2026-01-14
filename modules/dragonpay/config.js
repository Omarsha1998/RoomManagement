const appEnv = "prod";

module.exports = {
  merchantId: process.env.DP_MERCHANT_ID,
  secret: appEnv === "dev" ? process.env.DP_SECRET_TEST : process.env.DP_SECRET,
  apiBaseURL: appEnv === "dev" ? process.env.DP_URL_TEST : process.env.DP_URL,
  appVersion: process.env.APP_VERSION ?? "1.0.0",
};

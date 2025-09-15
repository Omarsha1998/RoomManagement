const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectHospitalYears = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT DISTINCT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      year(datead) hospitalYear
    from UERMMMC..cases
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectHospitalAnalytics = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      description,
      params,
      paramsMap,
      paramsLabel,
      appendParams,
      initialParamsValue,
      dateTimeCreated,
      dateTimeUpdated
    from ITMgt..HospitalAnalytics
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectHospitalAnalyticsDetails = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      description,
      params,
      analyticsCode,
      parentAnalyticsDetailsCode,
      sequence,
      helperComponent,
      helperMethod,
      helperQuery,
      helperColumns,
      hasGraph,
      withAverage,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from ITMgt..HospitalAnalyticsDetails
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectHospitalYears,
  selectHospitalAnalytics,
  selectHospitalAnalyticsDetails,
};

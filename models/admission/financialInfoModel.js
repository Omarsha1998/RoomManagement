const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const getApplicantFinancialInfo = async function (
  conditions,
  args,
  options,
  txn
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ref_number,
      own_resource ownResource,
      parents_resource parentsResource,
      relative_resource relativesResource,
      other_resource otherResource,
      parents_income parentsIncome,
      status,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..FinancialInfo
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};


const insertApplicantFinancialInfo = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Applicant" };
  }
  try {
    return await sqlHelper.insert(
      "UERMOnlineAdmission..FinancialInfo",
      payload,
      txn
    );
  } catch (error) {
    return { error: true, message: error };
  }
};


module.exports = {
  insertApplicantFinancialInfo,
  getApplicantFinancialInfo,
};

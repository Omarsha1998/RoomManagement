/* eslint-disable no-console */
const sqlHelper = require("../../../helpers/sql");
const util = require("../../../helpers/util");

const selectPatientCases = async function (conditions, args, txn, options) {
  try {
    const patientCases = await sqlHelper.query(
      `select 
        caseNo,
        patientNo,
        name,
        lastName,
        firstName,
        middleName,
        gender,
        mobileNo,
        dateOfBirth
      from UERMMMC..vw_Cases where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    return patientCases;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectPatientCharges = async function (conditions, args, txn, options) {
  try {
    const patientCharges = await sqlHelper.query(
      `select 
        a.chargeslipNo,
        caseNo,
        reforno,
        chargeDateTime
      from UERMMMC..CHARGES_MAIN a 
      join UERMMMC..charges_details b on b.CHARGESLIPNO = a.CHARGESLIPNO and b.CHARGE_ID = '9905' 
      where 1=1 
      ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    return patientCharges;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectPatientCases,
  selectPatientCharges,
};

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectBillers = async function (conditions, args, options, txn) {
  const payments = await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      procId,
      shortName,
      longName,
      wallet,
      parent,
      iframeEnable,
      titleOnly,
      component,
      logo,
      currencies,
      url,
      realTime,
      pwd, 
      defaultBillerId,
      hasTxnPwd,
      hasManualEnrollment,
      type, 
      status, 
      dayOfWeek, 
      startTime,
      endTime, 
      minAmount,
      maxAmount,
      mustRedirect, 
      surcharge, 
      hasAltRefNo, 
      cost,
      hasSettlement,
      active, 
      dateTimeCreated,
      dateTimeUpdated, 
      remarks
    from OnlinePayments..Billers
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  return payments;
};

module.exports = {
  selectBillers,
};

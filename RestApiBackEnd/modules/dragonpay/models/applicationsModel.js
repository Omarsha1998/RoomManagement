const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPayments = async function (conditions, args, options, txn) {
  const payments = await sqlHelper.query(
    `SELECT 
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id, 
      paymentOrderTypeId, 
      code, 
      prefix, 
      app, 
      description, 
      url,
      testURL,
      returnUrl, 
      testReturnUrl,
      initialAmount,
      payeeType, 
      paymentType,
      dateTimeCreated,
      dateTimeUpdated, 
      active,
      (select count(*) from OnlinePayments..Collections c where c.Status = 'S' and nullif(orNumber, '') is null  and c.app = a.code) census
    from OnlinePayments..PaymentOrderType a
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  return payments;
};

module.exports = {
  selectPayments,
};

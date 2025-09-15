const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectTestProcessFlows = async function (conditions, txn) {
  return await sqlHelper.query(
    `select
        pf.code,
        pf.name processFlowName,
        pfd.code processFlowDetailCode,
        pfd.name processDetailName,
        pfd.sequence,
        pf.dateTimeCreated,
        pf.dateTimeUpdated
      from UERMResults..ProcessFlows pf
      join UERMResults..ProcessFlowDetails pfd on pf.code = pfd.processFlowCode
      join UERMResults..TestProcessFlows tpf on pf.code = tpf.processFlowCode
      where tpf.testCode = ? and pfd.active = ?
      order by pfd.sequence asc`,
    [conditions.testCode, conditions.active],
    txn
  );
};

const selectProcessFlows = async function (conditions, txn) {
  return await sqlHelper.query(
    ` select
        pf.code,
        pf.name processFlowName,
        pfd.code processFlowDetailCode,
        pfd.name processDetailName,
        pfd.sequence,
        pf.dateTimeCreated,
        pf.dateTimeUpdated
      from UERMResults..ProcessFlows pf
      join UERMResults..ProcessFlowDetails pfd on pf.code = pfd.processFlowCode
      join UERMResults..TestProcessFlows tpf on pf.code = tpf.processFlowCode
      order by pfd.sequence asc`,
    [],
    txn
  );
};

// const generateTestOrderCode = async function (txn, deptCode) {
//   let code = "";
//   let codeExists = true;

//   var currentdate = new Date();

//   var datetime = `${currentdate.getFullYear()}${(
//     "0" +
//     (currentdate.getMonth() + 1)
//   ).slice(-2)}${util.pad(currentdate.getDate())}${util.pad(
//     currentdate.getHours()
//   )}${util.pad(currentdate.getMinutes())}${util.pad(currentdate.getSeconds())}`;
//   while (codeExists) {
//     code = `TO-${deptCode.toUpperCase()}-${datetime}${util.generateNumber(2)}`;
//     try {
//       let result = await sqlHelper.query(
//         `SELECT
//           COUNT(code) AS count
//         FROM UERMResults..TestOrders
//         where code = ?`,
//         [code],
//         txn
//       );
//       const codeCount = result;
//       codeExists = Boolean(codeCount.count);
//     } catch (error) {
//       console.log(error);
//       return { success: false, message: error };
//     }
//   }
//   return code;
// };

// const insertTestOrder = async function (payload, txn) {
//   return await sqlHelper.insert("TestOrders", payload, txn);
// };

// const updateTestOrder = async function (payload, condition, txn) {
//   return await sqlHelper.update("TestOrders", payload, condition, txn);
// };

module.exports = {
  selectTestProcessFlows,
  selectProcessFlows,
};

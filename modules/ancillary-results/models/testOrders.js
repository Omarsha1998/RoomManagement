const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectTestOrders = async function (conditions, txn) {
  let testOrders = await sqlHelper.query(
    `select 
      pc.code,
      enc.firstName,
      enc.lastName,
      enc.middleName,
      enc.fullName,
      enc.gender,
      enc.birthdate,
      pc.chargeslipNo,
      pc.caseNo,
      pc.chargeId,
      ch.description chargeName,
      pc.testCode,
      pc.chiefComplaint,
      pc.patientType,
      pc.requestingPhysicianId,
      pc.requestingPhysician,
      pc.ward,
      pc.room,
      pc.createdBy transferredBy,
      pc.dateTimeCreated dateTimeTransferred,
      pc.transferRemarks,
      pc.cancelledBy,
      pc.dateTimeCancelled,
      pc.dateTimeCharged,
      teo.processFlowCode,
      teo.code testOrderCode,
      t.name chargedProcedure
    from UERMResults..PatientCharges pc
    join UERMResults..Tests t on pc.TestCode = t.Code
    join UERMResults..TestOrders teo on pc.Code = teo.PatientChargeCode
    join UERMMMC..vw_EncounterCases enc on enc.caseNo = pc.caseNo
    join UERMMMC..Charges ch on pc.chargeId = ch.id
    where convert(date, pc.dateTimeCreated) between ? and ?
    and t.DepartmentCode = ?
    and pc.status = ? 
    order by ${conditions.orderBy}`,
    [
      conditions.fromDate,
      conditions.toDate,
      conditions.deptCode,
      conditions.status,
    ],
    txn
  );
  return testOrders;
};

const generateTestOrderCode = async function (txn, deptCode) {
  let code = "";
  let codeExists = true;

  var currentdate = new Date();

  var datetime = `${currentdate.getFullYear()}${(
    "0" +
    (currentdate.getMonth() + 1)
  ).slice(-2)}${util.pad(currentdate.getDate())}${util.pad(
    currentdate.getHours()
  )}${util.pad(currentdate.getMinutes())}${util.pad(currentdate.getSeconds())}`;
  while (codeExists) {
    code = `TO-${deptCode.toUpperCase()}-${datetime}${util.generateNumber(2)}`;
    try {
      let result = await sqlHelper.query(
        `SELECT
          COUNT(code) AS count
        FROM UERMResults..TestOrders
        where code = ?`,
        [code],
        txn
      );
      const codeCount = result;
      codeExists = Boolean(codeCount.count);
    } catch (error) {
      console.log(error);
      return { success: false, message: error };
    }
  }
  return code;
};

const insertTestOrder = async function (payload, txn) {
  return await sqlHelper.insert("TestOrders", payload, txn);
};

const updateTestOrder = async function (payload, condition, txn) {
  return await sqlHelper.update("TestOrders", payload, condition, txn);
};

module.exports = {
  insertTestOrder,
  generateTestOrderCode,
  updateTestOrder,
  selectTestOrders,
};

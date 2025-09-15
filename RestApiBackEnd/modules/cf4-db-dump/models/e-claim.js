const db = require("../../../helpers/sql.js");
const tableName = "EasyClaimsOffline..eClaim";

const insert = async (
  hospitalCode,
  transmittalNo,
  userCode,
  patient,
  _case,
  firstCaseRateResult,
  secondCaseRateResult,
  txn
) => {
  if (!hospitalCode) throw "`hospitalCode` is required.";
  if (!transmittalNo) throw "`transmittalNo` is required.";
  if (!userCode) throw "`userCode` is required.";
  if (!txn) throw "`txn` is required.";

  const item = {
    hospitalCode,
    transmittalNo,
    claimSeriesLhio: "",
    trackingNo: "",
    patientLastName: patient.lastName ? patient.lastName.toUpperCase() : "",
    patientFirstName: patient.firstName.toUpperCase(),
    patientMiddleName: patient.middleName
      ? patient.middleName.toUpperCase()
      : "N/A",
    patientSuffix: "",
    admissionDate: _case.dateTimeAdmitted,
    dischargeDate: _case.dateTimeDischarged,
    claimType: 1,
    patientType:
      _case.patientType === "IPD" ? 1 : _case.patientType === "OPD" ? 2 : 0,
    isEmergency: _case.isEmergency,
    isFinal: 1,
    isComplete: 1,
    isOffline: 1,
    isRefiled: null,
    xmlData: "",
    isProcessed: 0,
    processed: null,
    status: null,
    firstCaseRateCode: firstCaseRateResult
      ? firstCaseRateResult.substring(0, 6)
      : "",
    secondCaseRateCode: secondCaseRateResult
      ? secondCaseRateResult.substring(0, 6)
      : "",
  };

  return await db.upsert(
    tableName,
    item,
    { claimNo: _case.caseNo },
    userCode,
    txn,
    "CreatedBy",
    "Created",
    "UpdatedBy",
    "Updated"
  );
};

module.exports = {
  table: tableName,
  insert,
};

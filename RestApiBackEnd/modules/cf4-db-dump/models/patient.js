const db = require("../../../helpers/sql.js");
const { jsDateToISOString } = require("../../../helpers/util.js");
// const { trim } = require("../../../helpers/util.js");
const tableName = "EasyClaimsOffline..patient"; // should be camel-cased

const upsert = async (userCode, pmccNo, patient, _case, txn) => {
  if (!userCode) throw "`userCode` is required.";
  if (!pmccNo) throw "`pmccNo` is required.";
  if (!_case) throw "`_case` is required.";
  if (!patient) throw "`patient` is required.";
  if (!txn) throw "`txn` is required.";

  if (!patient.firstName || !patient.lastName)
    throw "Required patient info is missing.";

  const existingRow = (
    await db.query(
      `SELECT
          * 
        FROM 
          ${tableName}
        WHERE
          PatientFname = ?
          AND ISNULL(PatientMname, '') = ?
          AND PatientLname = ?
          AND PatientDob = ?;`,
      [
        patient.firstName,
        patient.middleName || "",
        patient.lastName,
        jsDateToISOString(patient.dateOfBirth),
      ],
      txn,
    )
  )[0];

  if (existingRow) {
    // console.log("Patient exists. Returning the existing...");
    return existingRow;
  }

  const dt = await db.getDateTime(txn);
  const year = String(dt.getFullYear());
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const hciCaseNoPrefix = `C${pmccNo}${year}${month}`;

  let lastSeriesNo = await db.query(
    `SELECT 
        MAX(CAST(SUBSTRING(HciCaseNo, LEN(HciCaseNo) - 4, LEN(HciCaseNo)) AS INT)) seriesNo
      FROM
        ${tableName}
      WHERE
        HciCaseNo LIKE ?;`,
    [`${hciCaseNoPrefix}%`],
    txn,
    false,
  );

  lastSeriesNo = lastSeriesNo[0]?.seriesNo
    ? Number(lastSeriesNo[0]?.seriesNo)
    : 0;

  const hciCaseNo = hciCaseNoPrefix + String(lastSeriesNo + 1).padStart(5, "0");
  const patientPin = patient.pin
    ? patient.pin.replace(/[- ]/g, "")
    : "000000000000";

  const patientFName = patient.firstName.toUpperCase();
  const patientMName = patient.middleName
    ? patient.middleName.toUpperCase()
    : "";
  const patientLName = patient.lastName ? patient.lastName.toUpperCase() : "";

  const newPatient = {
    hciCaseNo,
    hciTransNo: hciCaseNo,
    effYear: String(new Date(_case.dateTimeAdmitted).getFullYear()),
    enlistStat: "1",
    enlistDate: _case.dateTimeAdmitted,
    packageType: "A",

    memPin: patientPin,
    memFName: patientFName,
    memMName: patientMName,
    memLName: patientLName,
    memExtName: "",
    memDob: patient.dateOfBirth ?? "",
    memCat: "",
    memNCat: "",

    patientPin,
    patientFName,
    patientMName,
    patientLName,
    patientExtName: "",
    patientType: patient.isMember ? "MM" : "NM",
    patientSex:
      patient.gender === "MALE" ? "M" : patient.gender === "FEMALE" ? "F" : "",
    patientContactNo: "NA",
    patientDob: patient.dateOfBirth,

    // patientAddBrgy: patient.addBrgy ? trim(patient.addBrgy, "0") : "",
    // patientAddMun: patient.addMun ? trim(patient.addMun, "0") : "",
    // patientAddProv: patient.addProv ? trim(patient.addProv, "0") : "",
    // patientAddZipCode: patient.addZip ? trim(patient.addZip, "0") : "",

    patientAddBrgy: "",
    patientAddMun: "",
    patientAddProv: "",
    patientAddZipCode: "",

    patientAddReg: "",

    civilStatus: "U",
    withConsent: "X",
    withLoa: "X",
    withDisability: "X",
    dependentType: "X",
    transDate: _case.dateTimeAdmitted,
    reportStatus: "U",
    deficiencyRemarks: "",
    availFreeService: "X",
    createdBy: userCode,
  };

  // console.log("Inserting new patient...");
  return await db.insert(tableName, newPatient, txn, "Created");
};

module.exports = {
  table: tableName,
  upsert,
};

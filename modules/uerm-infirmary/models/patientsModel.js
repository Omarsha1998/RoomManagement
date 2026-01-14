/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectEncounters = async function (conditions, args, options, txn) {
  const encounters = await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      patientNo
      ,identityCode
      ,fullName
      ,age
      ,birthdate
      ,caseNo
      ,chiefComplaintHIMS
      ,dateTimeAdmitted
      ,dateTimeDischarged
      ,infirmaryPatientType
      ,admittedBy
      ,patientType
      ,patientCategory
      ,department
      ,waived
      ,encounterCode
      ,encounterStatus
      ,transferredBy
      ,dateTimeTransferred
    from Infirmary..vw_InfPatients
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  encounters.forEach((list) => {
    list.dateTimeAdmitted = util.formatDate2({
      date: list.dateTimeAdmitted,
    });

    list.birthdate = util.formatDate2({
      date: list.birthdate,
      dateOnly: true,
    });

    list.dateTimeDischarged = util.formatDate2({
      date: list.dateTimeDischarged,
    });
  });

  return encounters;
};

const selectInfirmaryPatients = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			patientNo,
			name,
			pmisid code,
      firstName,
      lastName,
      middleName
		  from Infirmary..Patients
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectNoteDetails = async function (conditions, args, options, txn) {
  const encounters = await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      caseNo,
      patientNo,
      encounterCode,
      noteCode,
      fieldGroupCode,
      fieldGroupType,
      noteStatus,
      fieldCode,
      value,
      fieldStatus,
      fieldDateTimeUpdated,
      dateTimeCreated,
      dateTimeUpdated,
      createdBy,
      updatedBy
    from Infirmary..vw_InfNoteDetails
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  encounters.forEach((list) => {
    list.initialValue = list.value;

    list.fieldDateTimeUpdated = util.formatDate2({
      date: list.fieldDateTimeUpdated,
    });
    list.dateTimeCreated = util.formatDate2({
      date: list.dateTimeCreated,
    });
    list.dateTimeUpdated = util.formatDate2({
      date: list.dateTimeUpdated,
    });
  });

  return encounters;
};

const insertEncounterData = async function (
  payload,
  table,
  requiredUniqueCode = false,
  surrogateCode = "code",
  uniqueCodePrefix = "",
  txn,
) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Encounter Data" };
  }

  try {
    if (requiredUniqueCode) {
      payload[surrogateCode] = await sqlHelper.generateDynamicUniqueCode(
        table,
        uniqueCodePrefix,
        3,
        surrogateCode,
        true,
        txn,
      );
    }
    return await sqlHelper.insert(table, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateEncounterData = async function (
  payload,
  table,
  condition,
  updateDateTimeField = "dateTimeUpdated",
  txn,
) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Encounter Data" };
  }

  try {
    return await sqlHelper.update(
      table,
      payload,
      condition,
      txn,
      updateDateTimeField,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertLogs = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Log Data" };
  }

  try {
    return await sqlHelper.insert(table, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateManyEncounterData = async function (
  payload,
  table,
  condition,
  txn,
) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Encounter Data" };
  }

  try {
    // return await sqlHelper.update(
    //   table,
    //   payload,
    //   condition,
    //   txn,
    //   updateDateTimeField,
    // );
    return await sqlHelper.updateMany(table, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectEncounters,
  selectInfirmaryPatients,
  selectNoteDetails,
  insertEncounterData,
  insertLogs,
  updateEncounterData,
  updateManyEncounterData,
};

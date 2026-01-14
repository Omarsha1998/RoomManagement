/* eslint-disable no-console */
const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const getApplications = async function (conditions, args, options, txn) {
  try {
    const applications = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ref_number refNumber,
      app_number appNumber,
      app_type appType,
      freshmenType,
      appTypeOthers,
      college,
      course,
      year_from yearFrom,
      year_to yearTo,
      sem,
      nmatTaken,
      nmatDateTaken,
      nmatScore,
      otherMedicalSchool,
      medicalSchoolName,
      accepted,
      received,
      receiveDate,
      [FOR INTERVIEW] forInterview,
      application_status applicationStatus,
      currentChoice,
      rejected,
      case RIGHT(SEM,1)
        when 1 then 'First Semester'
        when 2 then 'Second Semester'
        when 3 then 'First Trimester'
        when 4 then 'Second Trimester'
        when 5 then 'Third Trimester'
        when 0 then 'Summer'
      end semester,
      case college
        when 'G' then 'GRAD'
        when 'N' then 'UGRAD'
        when 'M' then 'DMD'
        when 'T' then 'UGRAD'
        when 'P' then 'UGRAD'
      end collegeGroupingDesc,
      case college
        when 'G' then 'GRAD'
        when 'N' then 'UGRAD'
        when 'M' then 'DMD'
        when 'T' then 'UGRAD'
        when 'P' then 'UGRAD'
      end collegeGrouping,
      cancelled,
      cancelDate,
      choice,
      acceptBy,
      acceptDate,
      status,
      acceptedListBatch,
      acceptedType,
      acceptedDocumentDate,
      acceptedNOAMessage,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..ApplicationInfo
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return applications;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantPersonalInfoCharacterReferences = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      ref_number,
      name,
      address,
      contactNumber,
      relationship,
      emailAddress,
      institution,
      designation,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..PersonalInfoCharacterReferences
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantEducationInfoColleges = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      ref_number,
      country,
      isForeignSchool,
      name,
      otherCollege,
      degree,
      otherDegree,
      course,
      otherCourse,
      educationStatus,
      otherEducationStatus,
      yearGraduated,
      address,
      awards,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from UERMOnlineAdmission..EducationInfoColleges
    WHERE 1=1 and active = 1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantPersonalInfoEmployments = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      ref_number,
      employer,
      address,
      position,
      fromDate,
      toDate,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from UERMOnlineAdmission..PersonalInfoEmployments
    WHERE 1=1 and active = 1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectSubmissionSchedule = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      apSchedId,
      refNo,
      appNo,
      a.schedId,
      walkin,
      applicantWithinManila,
      [date] schedDate,
      timeFrom schedTimeFrom,
      timeTo schedTimeTo
    from UERMOnlineAdmission..ApplicationSchedule a
    join UERMOnlineAdmission..Schedule b on a.SchedId = b.schedId
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectInterviewList = async function (conditions, args, options, txn) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      interviewId,
      interviewer,
      [date],
      LEFT([time from],5) as timeFrom,
      LEFT([time to],5) as timeTo,
      il.scheduleId,
      ref_number,
      app_number,
      il.deleted,
      completed,
      il.dateTimeCreated
    from UERMOnlineAdmission..InterviewList il
    join UERMOnlineAdmission..InterviewSchedule intSched on il.scheduleId = intSched.scheduleId
    WHERE 1=1 and il.active = 1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantFile = async function (
  conditions,
  args,
  columns,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ${columns}
    from UERMOnlineAdmission..PersonalInfoFiles
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    return { error: true, message: error };
  }
};

const insertApplicants = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Applicant" };
  }
  try {
    return await sqlHelper.insert(
      "UERMOnlineAdmission..PersonalInfo",
      payload,
      txn,
    );
  } catch (error) {
    return { error: true, message: error };
  }
};

const insertApplicantFile = async function (payload, condition, txn) {
  try {
    return await sqlHelper.insert(
      "UERMOnlineAdmission..PersonalInfoFiles",
      payload,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateApplicants = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMOnlineAdmission..PersonalInfo",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertApplicantsInfo = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Applicant" };
  }
  try {
    return await sqlHelper.insert(
      `UERMOnlineAdmission..${table}`,
      payload,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateApplicantsInfo = async function (payload, condition, table, txn) {
  try {
    const applicantsInfo = await sqlHelper.update(
      `UERMOnlineAdmission..${table}`,
      payload,
      condition,
      txn,
    );
    return applicantsInfo;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateApplicantFile = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMOnlineAdmission..PersonalInfoFiles",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateApplicantVaccination = async function (condition) {
  try {
    const rawSql = await sqlHelper.returnSQL();
    const sqlQuery = `
      UPDATE UERMOnlineAdmission..PersonalInfo
        set PrimaryVaccineCard = null, BoosterVaccineCard = null
      where 1=1 ${condition}`;
    await rawSql.query(sqlQuery);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertApplications = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Applicant" };
  }
  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateApplications = async function (payload, condition, table, txn) {
  try {
    return await sqlHelper.update(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertApplicationSchedule = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Applicant" };
  }
  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateApplicationSchedule = async function (
  payload,
  condition,
  table,
  txn,
) {
  try {
    return await sqlHelper.update(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

// const insertInterview = async function (payload, table, txn) {
//   if (!util.isObj(payload)) {
//     return { error: true, message: "Invalid Applicant" };
//   }
//   try {
//     return await sqlHelper.insert(`${table}`, payload, txn);
//   } catch (error) {
//     console.log(error);
//     return { error: true, message: error };
//   }
// };

// const updateInterviewSchedule = async function (payload, table, txn) {
//   if (!util.isObj(payload)) {
//     return { error: true, message: "Invalid Applicant" };
//   }
//   try {
//     return await sqlHelper.update(`${table}`, payload, txn);
//   } catch (error) {
//     console.log(error);
//     return { error: true, message: error };
//   }
// };

// const insertDocumentFiles = async function (payload, txn) {
//   if (!util.isObj(payload)) {
//     return { error: true, message: "Invalid Documents" };
//   }
//   try {
//     return await sqlHelper.insert(
//       "UERMOnlineAdmission..Documents",
//       payload,
//       txn
//     );
//   } catch (error) {
//     return { error: true, message: error };
//   }
// };

// const updateDocumentFiles = async function (payload, condition, txn) {
//   try {
//     return await sqlHelper.update(
//       "UERMOnlineAdmission..Documents",
//       payload,
//       condition,
//       txn
//     );
//   } catch (error) {
//     console.log(error);
//     return { error: true, message: error };
//   }
// };

const selectScholasticRecords = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applications = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      a.code,
      a.ref_number,
      a.app_number,
      term,
      description,
      generalWeightedAverage,
      subjectCode,
      grade,
      a.active,
      a.dateTimeCreated,
      a.dateTimeUpdated
    FROM UERMOnlineAdmission..[ApplicantScholasticRecords] a 
    join UERMOnlineAdmission..ApplicantScholasticRecordDetails b on a.code = b.scholasticRecordCode
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return applications;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectInterviewList,
  selectSubmissionSchedule,
  getApplications,
  getApplicantFile,
  getApplicantPersonalInfoCharacterReferences,
  getApplicantPersonalInfoEmployments,
  getApplicantEducationInfoColleges,
  selectScholasticRecords,
  insertApplicants,
  insertApplicantsInfo,
  insertApplications,
  insertApplicationSchedule,
  insertApplicantFile,
  updateApplicants,
  updateApplicantsInfo,
  updateApplicantVaccination,
  updateApplications,
  updateApplicationSchedule,
  updateApplicantFile,
};

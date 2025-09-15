const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectStudent = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT  
            SN,
            lastName,
            firstName,
            college
        FROM [UE database]..ManualGrade
        WHERE ${conditions}`,
    [],
    txn,
  );
};

const studentIfExist = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
            SN,
            lastName,
            firstName
        FROM [UE database]..ManualGrade
        WHERE ${conditions} `,
    [],
    txn,
  );
};

const subjectCodeExist = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
            subjectCode
        FROM [UE database]..ManualGradeDetails
        WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectStudentList = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT   
            mg.SN,
            mg.lastName,
            mg.firstName,
            mg.middleName,
            mg.degreeProgram,
            mg.college,
            mg.certificateOfEligibility,
            mg.dateOfGraduation,
            mg.accreditation,
            mg.soNumber,
            mg.entranceCredential
        FROM [UE database]..ManualGrade mg
        WHERE ${conditions}
        ORDER BY mg.lastName ASC`,
    [],
    txn,
  );
};

const selectSuggestedSubject = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT
        schoolYear semester,
        subjectCode,
        description subject
    FROM [UE database]..[ManualGradeSheetCourse]
    WHERE ${conditions}`,
    [],
    txn,
  );
  // return await sqlHelper.query(
  //   `SELECT subjectCode,
  //           description,
  //           units
  //     FROM [UE database].[dbo].[Subject Masterfile]
  //     UNION
  //     SELECT
  //         subjectCode,
  //         creditsLec,
  //         creditsLab
  //     FROM  [UE database]..ManualGradeDetails
  //     GROUP BY creditsLec, creditsLab, subjectCode
  //     `,
  //   [],
  //   txn,
  // );
};

const selectSuggestedSubjectCode = async function (conditions, txn) {
  // return await sqlHelper.query(
  //   `SELECT subjectCode,
  //           description,
  //           units
  //     FROM [UE database].[dbo].[Subject Masterfile]
  //     UNION
  //     SELECT
  //         subjectCode,
  //         creditsLec,
  //         creditsLab
  //     FROM  [UE database]..ManualGradeDetails
  //     GROUP BY creditsLec, creditsLab, subjectCode
  //     `,
  //   [],
  //   txn,
  // );
  return await sqlHelper.query(
    `SELECT
    schoolYear semester,
      subjectCode,
      description 
    FROM [UE database]..[ManualGradeSheetCourse]
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectSubjectCode = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT
      schoolYear semester,
      subjectCode,
      description subject
    FROM [UE database]..[ManualGradeSheetCourse]
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectSchoolYear = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
      schoolYear semester,
      description
    FROM [UE database]..[ManualGradeSheetCourse]
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectGradeData = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
            mg.SN,
            mg.lastName,
            mg.firstName,
            mg.degreeProgram,
            mg.entranceCredential,
            mg.certificateOfEligibility,
            mg.dateOfGraduation,
            mg.accreditation,
            mg.soNumber,
            mgd.id gradeID, 
            mgd.semester,
            mgd.term,
            mgd.subjectCode,
            mgd.subject,
            mgd.reexam,
            mgd.isNonAcademic,
            mgd.creditsLec,
            mgd.creditsLab,
            mgd.creditsHours,
            mgd.hoursLec,
            mgd.hoursLab,
            mgd.rleHours,
            mgd.finalGrade,
            mgd.isFinalized
        FROM [UE database]..ManualGrade mg
        LEFT JOIN [UE database]..[ManualGradeDetails] mgd on  mg.sn = mgd.sn
        WHERE ${conditions} `,
    [],
    txn,
  );
};

const selectNotesData = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
        mg.SN,
        mg.lastName,
        mg.firstName,
        mg.degreeProgram,
        mg.entranceCredential,
        mg.certificateOfEligibility,
        mg.dateOfGraduation,
        mg.accreditation,
        mg.soNumber
    FROM [UE database]..ManualGrade mg
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectTop10EntranceCredentials = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
            TOP(10) 
            *
        FROM UERMOnlineAdmission..SchoolList
        WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectSuggestEntranceCredential = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT
           *
        FROM UERMOnlineAdmission..SchoolList
        WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectNotes = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
            notes
        FROM [UE database]..[ManualGrade]
      WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectRemarks = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT
        degreeRemarks
    FROM [UE database]..ManualGrade
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const insertStudent = async function (payload, txn) {
  return await sqlHelper.insert("[UE database]..ManualGrade", payload, txn);
};

const insertGrade = async function (payload, txn) {
  return await sqlHelper.insert(
    "[UE database]..ManualGradeDetails",
    payload,
    txn,
  );
};

const insertRle = async function (payload, txn) {
  return await sqlHelper.insert("[UE database]..ManualGradeRLE", payload, txn);
};

const insertClinicalClerk = async function (payload, txn) {
  return await sqlHelper.insert(
    "[UE database]..ManualGradeClinicalClerk",
    payload,
    txn,
  );
};

const updateStudentNotes = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGrade",
    payload,
    conditions,
    txn,
  );
};

//DISABLE KO MUNA TO PARA TO SA REQUEST NI MAAM MERLYN
// const selectUERMDegreeProgram = async function(conditions, txn){
//     return await sqlHelper.query(
//         `SELECT
//             description
//         FROM [UE database]..Courses
//         WHERE ${conditions}`,
//         [],
//         txn
//     )
// }

const selectUERMDegreeProgram = async function (txn) {
  return await sqlHelper.query(
    `SELECT 
            description,
            college
        FROM [UE database]..Courses`,
    [],
    txn,
  );
};

const updateStudent = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGrade",
    payload,
    conditions,
    txn,
  );
};

const editGrade = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGradeDetails",
    payload,
    conditions,
    txn,
  );
};

const editNotesRemarks = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGrade",
    payload,
    conditions,
    txn,
  );
};

const selectCreditsUnits = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT
        subjectCode,
        description as subject
    FROM [UE database]..[ManualGradeSheetCourse] 
    WHERE ${conditions}`,
    [],
    txn,
  );
  // return await sqlHelper.query(
  //   `SELECT
  //           subjectCode,
  //           description as subject
  //     FROM [UE database].[dbo].[Subject Masterfile] WHERE ${conditions}
  //     UNION
  //     SELECT
  //           subjectCode,
  //           Subject
  //     FROM  [UE database]..ManualGradeDetails  WHERE ${conditions}`,
  //   [],
  //   txn,
  // );
};

const finalizedData = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGradeDetails",
    payload,
    conditions,
    txn,
  );
};

const selectRleDesc = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
        mgr.id,
        mgr.subjectId,
        mgr.rleDesc,
        mgr.rleDescHours,
        mgr.rleDescWeeks,
        mgr.totalDescription,
        mgr.totalHours,
        mgr.totalWeeks
      FROM [UE database]..ManualGradeRLE mgr
      LEFT JOIN [UE database]..[ManualGradeDetails] mgd on mgr.SubjectId = mgd.Id
      WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectRleTotal = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
        mgr.id,
        mgr.totalDescription,
        mgr.totalHours,
        mgr.totalWeeks
      FROM [UE database]..ManualGradeRLE mgr
      LEFT JOIN [UE database]..[ManualGradeDetails] mgd on mgr.SubjectId = mgd.Id
      WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectClerkDesc = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
        mgc.id,
        mgc.subjectId,
        mgc.clinicalClerkDesc,
        mgc.clinicalClerkMonths,
        mgc.clinicalClerkGrades
    FROM [UE database]..ManualGradeClinicalClerk mgc 
    LEFT JOIN [UE database]..ManualGradeDetails mgd on mgc.SubjectId = mgd.Id
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectClerkTotal = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
        mgc.id,
        mgc.totalClinicalClerkDesc,
        mgc.totalClinicalClerkMonths,
        mgc.totalClinicalClerkGrades
      FROM [UE database]..ManualGradeClinicalClerk mgc 
      LEFT JOIN [UE database]..[ManualGradeDetails] mgd on mgc.SubjectId = mgd.Id
      WHERE ${conditions}`,
    [],
    txn,
  );
};

const editRleDesc = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGradeRLE",
    payload,
    conditions,
    txn,
  );
};

const editClerkDesc = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGradeClinicalClerk",
    payload,
    conditions,
    txn,
  );
};

const deleteSubject = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..[ManualGradeDetails]",
    payload,
    conditions,
    txn,
  );
};

const deleteRle = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..[ManualGradeRLE]",
    payload,
    conditions,
    txn,
  );
};

const selectCourse = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
      id,
      schoolYear,
      yearLevel,
      subjectCode,
      description,
      college,
      program
    FROM [UE database]..[ManualGradeSheetCourse]
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const insertCourses = async function (payload, txn) {
  try {
    const course = await sqlHelper.insert(
      "[UE database]..ManualGradeSheetCourse",
      payload,
      txn,
    );
    return course;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const editCourse = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGradeSheetCourse",
    payload,
    conditions,
    txn,
  );
};

const editManualGradeDetails = async function (payload, conditions, txn) {
  return await sqlHelper.update(
    "[UE database]..ManualGradeDetails",
    payload,
    conditions,
    txn,
  );
};

const verifiedCourseCode = async function (conditions, txn) {
  try {
    return await sqlHelper.query(
      `SELECT 
        subjectCode
      FROM [UE database]..ManualGradeSheetCourse
      WHERE ${conditions}`,
      [],
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

const checkIfHasFailedSubject = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
      term  semester,
      subjectCode,
      subject
    FROM [UE database]..ManualGradeDetails
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const getStudentDetails = async function (condition, txn) {
  return await sqlHelper.query(
    `SELECT 
      s.lastName,
      s.firstName,
      s.SN
    FROM Clearance..Clearance c
    LEFT JOIN [UE database]..Student s ON c.StudentNo = s.SN
    WHERE ${condition}`,
    [],
    txn,
  );
};

module.exports = {
  selectStudent,
  studentIfExist,
  subjectCodeExist,
  selectSuggestedSubject,
  selectSuggestedSubjectCode,
  selectSubjectCode,
  selectSchoolYear,
  selectTop10EntranceCredentials,
  selectSuggestEntranceCredential,
  selectNotes,
  selectRemarks,
  selectGradeData,
  selectStudentList,
  insertStudent,
  insertGrade,
  updateStudentNotes,
  selectUERMDegreeProgram,
  updateStudent,
  editGrade,
  editNotesRemarks,
  selectCreditsUnits,
  finalizedData,
  insertRle,
  insertClinicalClerk,
  selectRleDesc,
  selectClerkDesc,
  editRleDesc,
  editClerkDesc,
  selectRleTotal,
  selectClerkTotal,
  deleteSubject,
  deleteRle,
  selectNotesData,

  selectCourse,
  insertCourses,
  editCourse,
  editManualGradeDetails,
  verifiedCourseCode,

  checkIfHasFailedSubject,

  getStudentDetails,
};

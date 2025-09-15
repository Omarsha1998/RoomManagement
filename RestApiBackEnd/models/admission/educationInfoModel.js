const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const getApplicantEducationInfo = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ref_number,
      graduated,
      last_school lastSchool,
      degree_earned degreeEarned,
      [primary],
      primary_address primaryAddress,
      primary_years primaryYearGraduate,
      primaryStatus,
      primaryStatusOthers,
      primaryReceiveAcademicAward,
      primaryAcademicAward,
      primaryCoCurricularAwards,
      primaryOtherCocurricularAwards,
      intermediate,
      intermediate_address intermediateAddress,
      intermediate_years intermediateYearGraduate,
      intermediateStatus,
      intermediateStatusOthers,
      intermediateReceiveAcademicAward,
      intermediateAcademicAward,
      intermediateCoCurricularAwards,
      intermediateOtherCocurricularAwards,
      highschool,
      highschool_address highschoolAddress,
      highschool_years highschoolYearGraduate,
      highschoolStatus,
      highschoolStatusOthers,
      highschoolReceiveAcademicAward,
      highschoolAcademicAward,
      highschoolCoCurricularAwards,
      highschoolOtherCocurricularAwards,
      highschoolStrand,
      alternativeLearningSystem,
      alsYear,
      alsStatus,
      alsStatusOthers,
      honors,
      extra_curricular extraCurricular,
      other_admission otherAdmission,
      other_school otherSchool,
      other_status otherStatus,
      alumni_child alumniChild,
      alumni_father_class,
      alumni_father_college,
      alumni_mother_class,
      alumni_mother_college,
      with_honors with_honors,
      graduatingWithHonors,
      nmat,
      nmat_date nmatDate,
      nmat_score nmatScore,
      is_med_school isMedSchool,
      med_school medSchool,
      is_thesis,
      thesis,
      shortEssay,
      interestForResearch,
      interestForResearchRemarks,
      stemStrand,
      status,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..EducationInfo
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

module.exports = {
  getApplicantEducationInfo,
};

const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectAdmissions = async function (conditions, args, options, txn) {
  try {
    const applications = await sqlHelper.query(
      `select 
        ref_number,
        app_number,
        application_status,
        isEnrolled,
        isOfficiallyEnrolled,
        isWaitListed,
        accepted,
        acceptDate,
        officialEnrollmentDate,
        currentChoice,
        college,
        course,
        case college
          when 'G' then 'GRADUATE SCHOOL'
          when 'N' then 'UNDERGRADUATE'
          when 'M' then 'MEDICINE'
          when 'T' then 'UNDERGRADUATE'
          when 'P' then 'UNDERGRADUATE'
        end collegeGroupingDesc
      from UERMOnlineAdmission..vw_Applications where  1=1
      --and isEnrolled = 0 and isOfficiallyEnrolled = 0 and isWaitListed = 1 -- WAITLISTED
      --and isEnrolled = 1 and isOfficiallyEnrolled = 0 and isWaitListed = 0 -- CONDITIONALLY ENROLLED
      --and isEnrolled = 1 and isOfficiallyEnrolled = 1 and isWaitListed = 1 -- OFFICIALLY ENROLLED
        ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    applications.forEach(async (list) => {
      list.acceptDate = await util.formatDate2(
        {
          date: list.acceptDate,
          straightDate: true,
        },
        "-",
      );
      list.officialEnrollmentDate = await util.formatDate2(
        {
          date: list.officialEnrollmentDate,
          straightDate: true,
        },
        "-",
      );
    });

    return applications;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectAnalytics = async function (conditions, args, options, txn) {
  try {
    const analytics = await sqlHelper.query(
      `SELECT       
        id, 
        code, 
        name,
        description, 
        type, 
        roles, 
        params, 
        query, 
        helperMethod,
        otherHelperMethod, 
        otherHelperCondition,
        columns,
        externalParams,
        valueParams,
        externalConditions,
        internalConditions,
        printout,
        active, 
        createdBy,
        updatedBy, 
        dateTimeCreated, 
        dateTimeUpdated, 
        remarks
      FROM UERMOnlineAdmission..Analytics
        where 1=1
        ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return analytics;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getUndergraduatesMasterlist = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const analytics = await sqlHelper.query(
      `select 
        a.ref_number,
        a.app_number,
        a.app_type,
        a.application_status,
        concat(a.last_name, ', ', a.first_name, ' ', a.middle_name) name,
        a.undergradGWA gwa,
        a.underGradGWAdetails gwaDetails,
        case when  c.Highschool = '' then c.AlternativeLearningSystem  else c.Highschool end seniorHighSchool,
        a.Mobile_Number mobileNumber,
        lower(a.email) emailAddress, 
        b.FullAddress fullAddress,
        a.COURSE_DESC degreeProgram,
        a.acceptDate,
        a.isEnrolled,
        a.isOfficiallyEnrolled,
        a.isWithdrawn,
        a.isWaitListed
      from UERMOnlineAdmission..vw_Applications a
      join UERMOnlineAdmission..PersonalInfo b on b.Ref_Number = a.REF_NUMBER
      join UERMOnlineAdmission..EducationInfo c on c.Ref_Number = a.REF_NUMBER
      where 1=1
        ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
      false,
    );

    if (analytics.length > 0) {
      analytics.forEach(async (list) => {
        if (list.application_status === "ACCEPTED") {
          if (list.isEnrolled && !list.isOfficiallyEnrolled) {
            list.application_status = "CONDITIONALLY ENROLLED";
          }

          if (list.isOfficiallyEnrolled) {
            list.application_status = "OFFICIALLY ENROLLED";
          }
          if (list.isWaitListed && !list.isOfficiallyEnrolled) {
            list.application_status = "WAITLISTED";
          }

          if (list.isWithdrawn) {
            list.application_status = "WITHDRAWN";
          }
        }

        list.acceptDate = await util.formatDate2({
          date: list.acceptDate,
          straightDate: true,
        });
      });
    }

    return analytics;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantsWithSchool = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const analytics = await sqlHelper.query(
      `SELECT
		    a.ref_number,
        a.app_number,
        a.app_type,
        a.application_status,
        upper(concat(a.last_name, ', ', a.first_name, ' ', a.middle_name)) name,
        case when  c.Highschool = '' then upper(isnull(c.AlternativeLearningSystem, ''))  else upper(isnull(c.Highschool, '')) end seniorHighSchool,
        a.COURSE_DESC degreeProgram
      from UERMOnlineAdmission..vw_Applications a
      left join UERMOnlineAdmission..EducationInfo c on c.Ref_Number = a.REF_NUMBER
      where 1=1
        ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
      false,
    );

    if (analytics.length > 0) {
      analytics.forEach((list) => {
        if (list.application_status === null) {
          list.application_status = "PENDING";
        }
      });
    }

    return analytics;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantsIncompleteWithSchool = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const analytics = await sqlHelper.query(
      `SELECT
		    a.ref_number,
        a.app_number,
        a.app_type,
        a.application_status,
        upper(concat(a.last_name, ', ', a.first_name, ' ', a.middle_name)) name,
        case when  c.Highschool = '' then upper(isnull(c.AlternativeLearningSystem, ''))  else upper(isnull(c.Highschool, '')) end seniorHighSchool,
        a.COURSE_DESC degreeProgram
      from UERMOnlineAdmission..vw_Applications a
      left join UERMOnlineAdmission..EducationInfo c on c.Ref_Number = a.REF_NUMBER
      where 1=1
        ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
      false,
    );

    if (analytics.length > 0) {
      analytics.forEach((list) => {
        if (list.application_status === null) {
          list.application_status = "PENDING";
        }
      });
    }

    return analytics;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectAdmissions,
  selectAnalytics,
  getUndergraduatesMasterlist,
  getApplicantsWithSchool,
  getApplicantsIncompleteWithSchool,
};

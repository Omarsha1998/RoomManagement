/* eslint-disable no-console */
const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectConfig = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      applicationStart appStart,
      applicationEnd appEnd,
      appStartMd,
      appEndMd,
      appStartGs,
      appEndGs,
      appAnnouncementUgrad,
      appAnnouncementMd,
      appAnnouncementGs,
      semester,
      semesterGs
    from UERMOnlineAdmission..Config
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    return { error: true, message: error };
  }
};

const selectSemesters = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      semester,
      [UE database].dbo.SemDescription(semester) semesterName
    from [UE database]..ConfigBySem
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectColleges = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      college_code collegeCode,
      college_desc collegeDesc,
      collegeShort,
      collegeSemester,
      course_code courseCode,
      course_desc courseDesc,
      collegeGrouping,
      targetEnrollment
    from UERMOnlineAdmission..vw_Courses
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    return { error: true, message: error };
  }
};

const selectCollegeSemester = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      sem_code semesterCode,
      sem_desc semesterDesc,
      sem_year_from semesterYearFrom,
      sem_year_to semesterYearTo,
      semtri
    from UERMOnlineAdmission..[vw_ActiveSem]
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectUniversitiesAndColleges = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      [desc] name,
      foreignSchool
    from UERMOnlineAdmission..SchoolList
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectCollegeDegrees = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..CollegeDegrees
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectCollegeCourses = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..CollegeCourses
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectCollegeDeclarations = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      name,
      signedAgreement,
      college,
      collegeSchedAnnouncement,
      applicationFeeLocal,
      applicationFeeForeign,
      collegeEmail,
      dateTimeCreated,
      dateTimeUpdated,
      reservationFee,
      enrollmentPeriod
    from UERMOnlineAdmission..CollegeDeclarations
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectWalkIn = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      refNo ref_number,
      lastName,
      firstName,
      middleName,
      email,
    from UERMOnlineAdmission..CollegeDeclarations
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectSchedule = async function (conditions, args, options, txn) {
  try {
    const config = await sqlHelper.query(
      `select
        s.schedId as id,
        MAX(s.date) as Date,
        MAX(LEFT(s.timeFrom,5)) as timeFrom,
        MAX(LEFT(s.timeTo,5)) as timeTo,
        MAX(s.quota) as quota,
        COUNT(a.appNo) as applicants
      from UERMOnlineAdmission..vw_Schedule s
      left join UERMOnlineAdmission..ApplicationSchedule a
        on s.schedId = a.schedId
        and a.deleted = 0
      where DATE >= CONVERT(DATE,GETDATE())
      group by s.schedId
      order by Date,timeFrom,timeTo
    `,
      args,
      txn,
    );

    if (config.length > 0) {
      for (const configSched of config) {
        configSched.date = util.formatDate({
          straightDate: true,
          date: configSched.date,
        });
      }
    }

    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectInterviewSchedule = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const config = await sqlHelper.query(
      `select 
        scheduleId,
        [date],
        [time from] timeFrom,
        [time to] timeTo,
        [max interview] maxInterview,
        [available interview] availableInterview
      from [UERMOnlineAdmission].dbo.fn_ScheduleList(
        '%'
      )
      where [AVAILABLE INTERVIEW] > 0
      and [DATE] not between '2019-01-07' and '2019-01-11'
      order by DATE, [TIME FROM]
    `,
      args,
      txn,
    );

    if (config.length > 0) {
      for (const configSched of config) {
        configSched.date = util.formatDate({
          straightDate: true,
          date: configSched.date,
        });
      }
    }

    return config;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectRequirements = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select 
        code,
        name,
        description,
        college,
        sequence,
        active,
        requiredOnApplication,
        requiredOnReceived,
        requiredUponInterview,
        requiredUponAcceptance,
        originalCopy,
        payment,
        required,
        template,
        fileType,
        dateTimeCreated,
        dateTimeUpdated,
        remarks
      from UERMOnlineAdmission..Requirements
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectScheduleOfClasses = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    return await sqlHelper.query(
      `select 
        semester,
        college,
        openingOfClasses,
        closingOfClasses,
        applicationFee,
        reservationFee
      from [UE database]..ScheduleOfClasses
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectSchoolGrade = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select 
        gradeId,
        school,
        uermGrade,
        value,
        dateCreated,
        createdBy
      from UERMOnlineAdmission..SchoolGrade
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectNmatDates = async function (conditions, args, options, txn) {
  try {
    const nmatDates = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id,
      name,
      description, 
      effectivity,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..NmatDates
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    // if (nmatDates.length > 0) {
    //   nmatDates = nmatDates.filter((rows) => {
    //     const givenDate = new Date(rows.effectivity);
    //     const targetDate = new Date(util.currentDateTime());
    //     return !innerUtil.compareMonthAndYear(givenDate, targetDate);
    //   });
    // }

    return nmatDates;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectConfig,
  selectSemesters,
  selectColleges,
  selectCollegeSemester,
  selectUniversitiesAndColleges,
  selectCollegeCourses,
  selectCollegeDegrees,
  selectCollegeDeclarations,
  selectSchedule,
  selectInterviewSchedule,
  selectWalkIn,
  selectRequirements,
  selectScheduleOfClasses,
  selectSchoolGrade,
  selectNmatDates,
};

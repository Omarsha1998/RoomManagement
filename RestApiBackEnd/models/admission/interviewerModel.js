/* eslint-disable no-console */
const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectInterviewers = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
    ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    code,
    email,
    password,
    concat(lastName, ', ', firstName, ' ', middleName) fullName,
    firstName,
    lastName,
    middleName,
    college,
    mobileNumber,
    initialLogin,
    interviewerLevel,
    active,
    createdBy,
    updatedBy,
    dateTimeCreated,
    dateTimeUpdated,
    remarks
  from UERMOnlineAdmission..Interviewers
  WHERE 1=1 ${conditions}
  ${util.empty(options.order) ? "" : `order by ${options.order}`}
  `,
    args,
    txn,
  );
};

const updateInterviewer = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMOnlineAdmission..Interviewers",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return { error: true, message: error };
  }
};

const selectApplicantAppointments = async function (
  conditions,
  args,
  options,
  txn,
) {
  const applicantAppointments = await sqlHelper.query(
    `SELECT
    ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    a.code,
    a.referenceNumber,
    a.applicationNumber,
    c.sem,
    c.college,
    c.course,
    c.last_name lastName,
    c.first_name firstName,
    c.middle_name middleName,
    concat(c.last_name, ', ', c.first_name, ' ', c.middle_name) fullName,
	  lower(c.email) email,
    c.Mobile_Number mobileNumber,
    a.interviewerId,
    referralInterviewerId,
    d.code appointmentCode,
    d.date dateScheduled,
    d.periodFrom,
    d.periodTo,
    a.googleMeetLink,
    b.googleMeetLink interviewerGoogleMeetLink,
    googleCalendarLink,
    googleCalendarID,
    googleCalendarEventID,
    assessment,
    assessmentFile,
    assessmentFileName,
    assessmentFileStatus,
    a.status,
    a.noShow,
    a.remarks,
    a.active,
    initialAssessmentBy,
    finalAssessmentBy,
    cancelledBy,
    cancellingRemarks,
    a.createdBy,
    a.updatedBy,
    dateTimeInitialAssessment,
    dateTimeFinalAssessment,
    dateTimeCancelled,
    a.dateTimeCreated,
    a.dateTimeUpdated
  FROM [UERMOnlineAdmission].[dbo].[ApplicantAppointments] a
    left join UERMOnlineAdmission..Interviewers b on b.code = a.InterviewerId
    join UERMOnlineAdmission..vw_Applications c on c.App_Number = a.ApplicationNumber
    join UERMOnlineAdmission..Appointments d on d.code = a.AppointmentId
  WHERE 1=1 ${conditions}
  ${util.empty(options.order) ? "" : `order by ${options.order}`}
  `,
    args,
    txn,
  );

  applicantAppointments.forEach((list) => {
    list.dateAppointment = util.formatDate2({
      date: list.dateScheduled,
      dateOnly: true,
    });

    list.dateOfAppointment = util.formatDate2(
      {
        date: list.dateScheduled,
        straightDate: true,
      },
      "/",
    );
    list.formattedPeriodFrom = util.formatDate2({
      date: list.periodFrom,
      timeOnly: true,
    });
    list.formattedPeriodTo = util.formatDate2({
      date: list.periodTo,
      timeOnly: true,
    });

    if (list.dateTimeFinalAssessment !== null) {
      list.formattedDateTimeFinalAssessment = util.formatDate2({
        date: list.dateTimeFinalAssessment,
      });
    }

    if (list.assessmentFile !== null) {
      list.assessmentFile = Buffer.from(list.assessmentFile).toString("base64");
    }

    list.militaryTimeFrom = util.convertTime12to24(list.formattedPeriodFrom);
    list.militaryTimeTo = util.convertTime12to24(list.formattedPeriodTo);
    list.fromAndTo = `${list.formattedPeriodFrom} - ${list.formattedPeriodTo}`;
    list.schedule = `${list.dateAppointment} ${list.formattedPeriodFrom} - ${list.formattedPeriodTo}`;
  });

  return applicantAppointments;
};

const selectFloatingAppointments = async function (
  conditions,
  args,
  options,
  txn,
) {
  const applicantAppointments = await sqlHelper.query(
    `SELECT
    ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    a.code appointmentCode,
    a.applicationNumber,
    a.referenceNumber,
    concat(c.last_name, ', ', c.first_name, ' ', c.middle_name) applicantName,
    c.Mobile_Number mobileNumber,
    lower(c.email) emailAddress,
    b.code,
    b.date,
    b.periodFrom,
    b.periodTo,
    b.degreeProgram,
    a.assigned,
    d.code interviewerCode,
    case when d.code is not null 
      then concat(d.lastname, ', ', d.firstname, ' ', d.middlename)
      else null
    end interviewerName
    from UERMOnlineAdmission..ApplicantAppointments a
    join UERMOnlineAdmission..Appointments b on b.code = a.AppointmentId
    join UERMOnlineAdmission..vw_Applications c on c.app_number = a.ApplicationNumber
    left join UERMOnlineAdmission..Interviewers d on d.code = a.InterviewerId
    where 1=1 ${conditions}
  ${util.empty(options.order) ? "" : `order by ${options.order}`}
  `,
    args,
    txn,
  );

  applicantAppointments.forEach(async (list) => {
    list.dateAppointment = await util.formatDate2({
      date: list.date,
      dateOnly: true,
    });

    list.dateOfAppointment = await util.formatDate2(
      {
        date: list.date,
        straightDate: true,
      },
      "/",
    );
    list.formattedPeriodFrom = await util.formatDate2({
      date: list.periodFrom,
      timeOnly: true,
    });
    list.formattedPeriodTo = await util.formatDate2({
      date: list.periodTo,
      timeOnly: true,
    });

    list.militaryTimeFrom = await util.convertTime12to24(
      list.formattedPeriodFrom,
    );
    list.militaryTimeTo = await util.convertTime12to24(list.formattedPeriodTo);
    list.fromAndTo = `${list.formattedPeriodFrom} - ${list.formattedPeriodTo}`;
    list.schedule = `${list.dateAppointment} ${list.formattedPeriodFrom} - ${list.formattedPeriodTo}`;
  });

  // for (const list of applicantAppointments) {
  //   list.dateAppointment = await util.formatDate2({
  //     date: list.date,
  //     dateOnly: true,
  //   });

  //   list.dateOfAppointment = await util.formatDate2(
  //     {
  //       date: list.date,
  //       straightDate: true,
  //     },
  //     "/",
  //   );
  //   list.formattedPeriodFrom = await util.formatDate2({
  //     date: list.periodFrom,
  //     timeOnly: true,
  //   });
  //   list.formattedPeriodTo = await util.formatDate2({
  //     date: list.periodTo,
  //     timeOnly: true,
  //   });

  //   list.militaryTimeFrom = await util.convertTime12to24(
  //     list.formattedPeriodFrom,
  //   );
  //   list.militaryTimeTo = await util.convertTime12to24(list.formattedPeriodTo);
  //   list.fromAndTo = `${list.formattedPeriodFrom} - ${list.formattedPeriodTo}`;
  //   list.schedule = `${list.dateAppointment} ${list.formattedPeriodFrom} - ${list.formattedPeriodTo}`;
  // }

  return applicantAppointments;
};

const updateApplicantAppointment = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "UERMOnlineAdmission..ApplicantAppointments",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertApplicantAppointments = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid applicant appointment" };
  }
  try {
    const applicantAppointments = await sqlHelper.insert(
      "UERMOnlineAdmission..ApplicantAppointments",
      payload,
      txn,
    );

    return applicantAppointments;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectInterviewers,
  selectApplicantAppointments,
  selectFloatingAppointments,
  updateInterviewer,
  updateApplicantAppointment,
  insertApplicantAppointments,
};

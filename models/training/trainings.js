/* eslint-disable no-console */
const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectTrainings = async function (conditions, args, options, txn) {
  try {
    const trainings = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      description,
      deptCode,
      media,
      attestation,
      additionalNotes,
      requiredSurvey,
      questionCount,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from ITMgt..Trainings
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return trainings;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingConfigs = async function (conditions, args, options, txn) {
  try {
    const trainings = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      description,
      trainingCode,
      config,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from ITMgt..TrainingConfigurations
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return trainings;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingConfigModules = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const trainings = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      description,
      icon,
      link,
      active,
      trainingConfigModuleCode,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from ITMgt..TrainingConfigModules
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return trainings;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingModules = async function (conditions, args, options, txn) {
  try {
    const trainingModules = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      name,
      description,
      trainingCode,
      sequence,
      media,
      hasQuiz,
      skippable,
      viewAfterCompletion,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from ITMgt..TrainingModules
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return trainingModules;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingModuleQuestions = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const trainingQuestions = await sqlHelper.query(
      `
    SELECT 
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      a.code questionCode,
      a.trainingModuleCode,
      a.name question,
      a.sequence,
      a.active,
      b.code choiceCode,
      b.name choice,
      b.answer
      from ITMgt..TrainingQuestions a
    join ITMgt..TrainingQuestionChoices b on a.Code = b.TrainingQuestionCode
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return trainingQuestions;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingUsers = async function (conditions, args, options, txn) {
  try {
    const trainingUsers = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      id trainingUserId, 
      employeeCode,
      trainingModuleCode,
      trainingCode,
      overallStatus,
      status,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from ITMgt..TrainingUsers
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (trainingUsers.length > 0) {
      for (const user of trainingUsers) {
        user.dateTimeUpdated = util.formatDate({
          dateOnly: true,
          date: user.dateTimeUpdated,
        });
      }
    }

    return trainingUsers;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingUserSurveys = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const trainingUsers = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code,
      questions,
      feedback,
      rating,
      attested,
      trainingCode,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks
    from ITMgt..TrainingUserSurveys
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return trainingUsers;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingUserQuizzes = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const trainingUsers = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      trainingUserId, 
      a.trainingModuleCode,
      employeeCode,
      totalScore,
      quizContent,
      b.active,
      b.dateTimeCreated,
      b.dateTimeUpdated,
      b.remarks
    from ITMgt..TrainingUsers a 
    join ITMgt..TrainingUserQuizzes b on a.id = b.trainingUserId
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return trainingUsers;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const selectTrainingEmployees = async function (
  conditions,
  joinCondition,
  args,
  options,
  txn,
) {
  //   select distinct
  // 	code,
  // 	fullname,
  // 	pos_desc position,
  // 	cast (
  // 	  case
  // 		when b.OverallStatus is null then 0 else 1
  // 	  end
  // 	as bit) status
  // from [UE database]..vw_Employees a
  // left join  ITMgt..TrainingUsers b on a.code = b.EmployeeCode and b.trainingCode = 'dpa-orientation'
  // where DEPT_CODE = '5050' and is_active = 1
  // order by fullName
  try {
    return await sqlHelper.query(
      `SELECT DISTINCT
        code,
        fullname,
        pos_desc position,
        cast (
          case
          when b.OverallStatus = '0' then 0 else 1
          end
        as bit) status
      from [UE database]..vw_Employees a
      left join  ITMgt..TrainingUsers b on a.code = b.EmployeeCode ${joinCondition}
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

const insertTrainingUsers = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }

  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateTrainingUsers = async function (payload, condition, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }

  try {
    return await sqlHelper.update(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateOverallStatus = async function (payload, condition, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }

  try {
    return await sqlHelper.updateMany(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertTrainingUsersQuizzes = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }

  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertTrainingUserSurvey = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }

  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectTrainings,
  selectTrainingConfigs,
  selectTrainingConfigModules,
  selectTrainingModules,
  selectTrainingModuleQuestions,
  selectTrainingUsers,
  selectTrainingUserQuizzes,
  selectTrainingUserSurveys,
  selectTrainingEmployees,
  insertTrainingUsers,
  insertTrainingUsersQuizzes,
  insertTrainingUserSurvey,
  updateTrainingUsers,
  updateOverallStatus,
};

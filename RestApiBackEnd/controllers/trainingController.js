/* eslint-disable no-console */
const util = require("../helpers/util");
const sqlHelper = require("../helpers/sql");

// MODELS //
const trainings = require("../models/training/trainings.js");
// MODELS //

const getAllTrainings = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "and active = ?";
      const args = [1];

      // if () {
      //   conditions = `and '${util.currentDateTime().substring(0, 10)}'`
      // }
      conditions = `and active = ? and '${util
        .currentDateTime()
        .substring(0, 10)}' between availableDate and expirationDate
        or noExpiration = 1  
      `;

      return await trainings.selectTrainings(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingConfigModules = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = ?";
      const args = [1];

      return await trainings.selectTrainingConfigModules(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingConfigs = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = ?";
      const args = [1];

      return await trainings.selectTrainingConfigs(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingModules = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (!util.empty(req.query.trainingCode)) {
        conditions = "and trainingCode = ? and active = ?";
        args = [req.query.trainingCode, 1];
      }

      if (!util.empty(req.query.code)) {
        conditions = "and code = ? and active = ?";
        args = [req.query.code, 1];
      }

      return await trainings.selectTrainingModules(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingUsers = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (
        !util.empty(req.query.employeeCode) &&
        !util.empty(req.query.trainingCode)
      ) {
        conditions = "and employeeCode = ? and trainingCode = ? and active = ?";
        args = [req.query.employeeCode, req.query.trainingCode, 1];
      }

      if (
        !util.empty(req.query.trainingModuleCode) &&
        !util.empty(req.query.employeeCode)
      ) {
        conditions =
          "and employeeCode = ? and trainingModuleCode = ? and active = ?";
        args = [req.query.employeeCode, req.query.trainingModuleCode, 1];
      }

      return await trainings.selectTrainingUsers(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingUserQuizzes = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (
        !util.empty(req.query.trainingModuleCode) &&
        !util.empty(req.query.employeeCode)
      ) {
        conditions =
          "and employeeCode = ? and trainingModuleCode = ? and b.active = ?";
        args = [req.query.employeeCode, req.query.trainingModuleCode, 1];
      }

      return await trainings.selectTrainingUserQuizzes(
        conditions,
        args,
        {
          order: "b.dateTimeCreated desc",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingModuleQuestions = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (!util.empty(req.query.trainingModuleCode)) {
        conditions = "and a.TrainingModuleCode = ? and a.active = ?";
        args = [req.query.trainingModuleCode, 1];
      }

      return await trainings.selectTrainingModuleQuestions(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingUserSurveys = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (!util.empty(req.query.trainingCode)) {
        conditions = "and trainingCode = ? and code = ? and active = ?";
        args = [req.query.trainingCode, req.query.code, 1];
      }

      return await trainings.selectTrainingUserSurveys(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getTrainingEmployees = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let joinCondition = "";
      let args = [];

      if (!util.empty(req.query.deptCode)) {
        joinCondition = `and b.trainingCode = '${req.query.trainingCode}'`;
        conditions = "and dept_code = ? and is_active = ?";
        args = [req.query.deptCode, 1];
      }

      return await trainings.selectTrainingEmployees(
        conditions,
        joinCondition,
        args,
        {
          order: "fullname",
          top: "",
        },
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const postTrainingUser = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` payload is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      return await trainings.insertTrainingUsers(
        payload,
        "ITMgt..TrainingUsers",
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const putTrainingUser = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` payload is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const code = req.params.code;
      const payload = req.body;
      const finalModuleWithoutQuiz = req.body.finalModuleWithoutQuiz;
      delete req.body.finalModuleWithoutQuiz;

      const updateTrainingUsers = await trainings.updateTrainingUsers(
        payload,
        { id: code },
        "ITMgt..TrainingUsers",
        txn,
      );

      if (Object.keys(updateTrainingUsers).length > 0) {
        if (finalModuleWithoutQuiz !== undefined) {
          await sqlHelper.query(
            `UPDATE ITMgt..TrainingUsers set OverallStatus = ? where employeeCode = ? and trainingCode = ?`,
            [1, req.user.code, payload.trainingCode],
            txn,
          );
        }
      }

      return updateTrainingUsers;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const putOverallTraining = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` payload is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const code = req.params.code;
      const trainingCode = req.params.trainingCode;
      const payload = req.body;

      return await trainings.updateTrainingUsers(
        payload,
        { employeeCode: code, trainingCode: trainingCode },
        "ITMgt..TrainingUsers",
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const postTrainingUserQuizzes = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` payload is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      return await trainings.insertTrainingUsersQuizzes(
        payload,
        "ITMgt..TrainingUserQuizzes",
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const postTrainingUserSurvey = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` payload is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      return await trainings.insertTrainingUserSurvey(
        payload,
        "ITMgt..TrainingUserSurveys",
        txn,
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getAllTrainings,
  getTrainingConfigs,
  getTrainingConfigModules,
  getTrainingModules,
  getTrainingUsers,
  getTrainingUserQuizzes,
  getTrainingModuleQuestions,
  getTrainingUserSurveys,
  getTrainingEmployees,
  postTrainingUser,
  putTrainingUser,
  postTrainingUserQuizzes,
  postTrainingUserSurvey,
  putOverallTraining,
};

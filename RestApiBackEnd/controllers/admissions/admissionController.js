/* eslint-disable no-console */
// const path = require("node:path");
const appMain = require("../../auth/auth.js");
const helpers = require("../../helpers/helpers.js");
const { createClient } = require("redis");
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../../config/database.js");
// /SQL CONN
// router.use(sanitize);

const util = require("../../helpers/util.js");
const sqlHelper = require("../../helpers/sql.js");
const crypto = require("../../helpers/crypto.js");
const tools = require("../../helpers/tools.js");
const appHelpers = require("./utils/appHelpers.js");

// MODELS //
const configsModel = require("../../models/admission/configsModel.js");
const applicantsModel = require("../../models/admission/applicantsModel.js");
const personalInfoModel = require("../../models/admission/personalInfoModel.js");
const applicationsModel = require("../../models/admission/applicationsModel.js");
const personalInfoDocumentsModel = require("../../models/admission/personalInfoDocumentsModel.js");
const interviewerModel = require("../../models/admission/interviewerModel.js");
// MODELS //

// UTILS //

// const folder = path.join(__dirname, "../files/admissions");
// UTILS //
const checkApplicants = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const appNos = req.body.appNos.split(";").join("','");
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        a.APP_NUMBER appNo,
        a.REF_NUMBER refNo,
        a.accepted,
        isnull(a.APPLICATION_STATUS,'') status,
        p.MOBILE_NUMBER mobileNo,
        --isnull(b.batchId,'') batchId
        isnull(
          case
            when a.APPLICATION_STATUS = 'ACCEPTED' then b.batchId
          end
        ,'') batchId
      from UERMOnlineAdmission..ApplicationInfo a
      join UERMOnlineAdmission..PersonalInfo p
        on a.REF_NUMBER = p.REF_NUMBER
      left join UERMOnlineAdmission..BatchAccept b
        on b.appNo = a.APP_NUMBER
      where convert(varchar(max),a.app_number) in ('${appNos}')`;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const addBatch = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      const batchId = `${helpers.randomString(5)}-${helpers.randomString(3)}`;
      await sql.connect(sqlConfig);
      const sqlQuery = `exec UERMOnlineAdmission..sp_AddBatch
        '${batchId}',
        '${req.body.username}',
        '${req.body.appNo}',
        '${req.body.sms}',
        '${req.body.portal}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const acceptApplicants = function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `exec UERMOnlineAdmission..sp_BatchAcceptApplicants
        '${req.body.batchId}',
        '${req.body.username}',
        '${helpers.getIp(req.socket.remoteAddress)}'
      `;
      const result = await sql.query(sqlQuery);
      // sql.close();
      res.send(result.recordset[0]);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const getConfig = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      // args = [serial];
      // conditions = `and d.serials = ? `;

      return await configsModel.selectConfig(
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

const getSchedule = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      // args = [serial];
      // conditions = `and d.serials = ? `;

      return await configsModel.selectSchedule(
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

const getInterviewSchedule = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      // args = [serial];
      // conditions = `and d.serials = ? `;

      return await configsModel.selectInterviewSchedule(
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

const getInterviewList = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.refNo) {
        args = [req.query.refNo, req.query.appNo];
        conditions = `and ref_number = ? and app_number = ?`;
      }
      // args = [serial];
      // conditions = `and d.serials = ? `;

      return await applicantsModel.selectInterviewList(
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

const getWalkIn = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      args = [req.query.referenceNumber];
      conditions = `w.refNo = ? `;

      return await configsModel.selectWalkIn(
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

const getColleges = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      args = [1];
      conditions = `and isAdmission = ? `;

      return await configsModel.selectColleges(
        conditions,
        args,
        {
          order: "courseDesc, seq",
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

const getUniversitiesAndColleges = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      const args = [];

      // args = [serial];
      conditions = `and deleted = 0`;

      return await configsModel.selectUniversitiesAndColleges(
        conditions,
        args,
        {
          order: "name",
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

const getCollegeDegrees = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = ?";
      const args = [1];

      // args = [serial];
      // conditions = `and deleted = 0`;

      return await configsModel.selectCollegeDegrees(
        conditions,
        args,
        {
          order: "name",
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

const getCollegeCourses = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      // args = [serial];
      // conditions = `and deleted = 0`;

      return await configsModel.selectCollegeCourses(
        conditions,
        args,
        {
          order: "name",
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

const getCollegeSemester = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and semtri = ?";
      const args = [req.query.collegeSemester];

      return await configsModel.selectCollegeSemester(
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

const getSemesters = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      return await configsModel.selectSemesters(
        conditions,
        args,
        {
          order: "semester desc",
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

const getCollegeDeclarations = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = ?";
      const args = [1];

      return await configsModel.selectCollegeDeclarations(
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

const getRequirements = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      // and active = 1
      const args = [];

      return await configsModel.selectRequirements(
        conditions,
        args,
        {
          order: "sequence",
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

const getStudentApplications = async function (req, res) {
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      // ADMISSIONS OFFICE //
      if (!util.empty(req.query.semester)) {
        if (Number(req.query.semester) >= "20241") {
          if (req.query.college === "G") {
            conditions = ` currentChoice = 1 and appStatus = 1 and sem = ? and active = 1 and college = 'G'`;
            args = [req.query.semester];
          } else {
            if (req.query.degreeProgramGroup) {
              conditions = ` currentChoice = 1 and appStatus = 1 and sem = ? and active = 1 and degreeGrouping = ?`;
              args = [req.query.semester, req.query.degreeProgramGroup];
            } else {
              conditions = ` currentChoice = 1 and appStatus = 1 and sem = ? and active = 1 and college <> 'G'`;
              args = [req.query.semester];
            }
          }
        } else {
          conditions = " sem = ? and currentChoice = 1";
        }
      }

      // ADMISSIONS OFFICE //

      if (!util.empty(req.query.college)) {
        conditions =
          " sem = ? and currentChoice = 1 and appStatus = 1 and college = ? and active = 1";
        args = [req.query.semester, req.query.college];
      }

      // ADMISSION DASHBOARD //
      if (!util.empty(req.query.withEnrollment)) {
        if (req.query.college === "G") {
          conditions =
            "  sem = ? and currentChoice = 1 and appStatus = 1 and college = ? and active = 1";
          args = [req.query.semester.replace("1", "3"), req.query.college];
        } else {
          conditions =
            "  sem = ? and currentChoice = 1 and appStatus = 1 and college = ? and active = 1";
          args = [req.query.semester, req.query.college];
        }
      }

      if (!util.empty(req.query.forAcceptance)) {
        conditions = ` (forAcceptance = ? or accepted = ?) and sem = '${req.query.semester}' and college not in ('G') and currentChoice = 1 and appStatus = 1  and active = 1`;
        args = [1, 1];
      }
      // ADMISSION DASHBOARD //

      let studentApps = [];
      if (req.query.college === "G") {
        studentApps = await applicationsModel.selectStudentApplicationsGS(
          conditions,
          args,
          {
            order: "fullName",
            top: "",
          },
          txn,
        );
      } else {
        studentApps = await applicationsModel.selectStudentApplications(
          conditions,
          args,
          {
            order: "fullName",
            top: "",
          },
          txn,
        );
      }
      return studentApps;
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

const getRealtimeStudentApplications = async function (req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Flush the headers to establish the SSE connection

  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Semester is required." });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const intervalId = await setInterval(async () => {
    const returnValue = await sqlHelper.transact(async (txn) => {
      try {
        let conditions = "";
        let args = [];

        if (!util.empty(req.query.semester)) {
          if (Number(req.query.semester) >= "20241") {
            conditions = ` currentChoice = 1 and appStatus = 1 and sem = ? and active = 1`;
          } else {
            conditions = " sem = ? and currentChoice = 1";
          }

          args = [req.query.semester];
        }

        if (!util.empty(req.query.college)) {
          conditions =
            " sem = ? and currentChoice = 1 and appStatus = 1 and college = ? and active = 1";
          args = [req.query.semester, req.query.college];
        }

        if (!util.empty(req.query.withEnrollment)) {
          if (req.query.college === "G") {
            conditions =
              "  sem = ? and currentChoice = 1 and appStatus = 1 and college = ? and active = 1";
            args = [req.query.semester.replace("1", "3"), req.query.college];
          } else {
            conditions =
              "  sem = ? and currentChoice = 1 and appStatus = 1 and college = ? and active = 1";
            args = [req.query.semester, req.query.college];
          }
        }

        if (!util.empty(req.query.forAcceptance)) {
          conditions = ` (forAcceptance = ? or accepted = ?) and sem = '${req.query.semester}' and college not in ('G') and currentChoice = 1 and appStatus = 1  and active = 1`;
          args = [1, 1];
        }

        let studentApps = [];
        if (req.query.college === "G") {
          studentApps = await applicationsModel.selectStudentApplicationsGS(
            conditions,
            args,
            {
              order: "fullName",
              top: "",
            },
            txn,
          );
        } else {
          studentApps = await applicationsModel.selectStudentApplications(
            conditions,
            args,
            {
              order: "fullName",
              top: "",
            },
            txn,
          );
        }
        return studentApps;
      } catch (error) {
        console.log(error);
        return { error: error };
      }
    });
    sendEvent(returnValue);
  }, 30000);

  req.on("close", () => {
    clearInterval(intervalId);
    res.end();
  });
};

const getStudentApplicationsWithDocs = async function (req, res) {
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (!util.empty(req.query.semester)) {
        conditions = "and sem = ? and currentChoice = 1";
        args = [req.query.semester];
      }

      return await applicationsModel.selectStudentWithDocs(
        conditions,
        args,
        {
          order: "fullName",
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

const getStudentDocuments = async function (req, res) {
  if (util.empty(req.query.referenceNumber))
    return res.status(400).json({ error: "Reference Number are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.referenceNumber) {
        conditions =
          "and ref_number = ? and active = ?  and college = ? and semester = ?";
        args = [
          req.query.referenceNumber,
          1,
          req.query.college,
          req.query.semester,
        ];
      }

      if (req.query.documentFile) {
        conditions = `and ref_number = ? and active = ?  and college = ? and documentFile like '%${req.query.documentFile}%'`;
        args = [req.query.referenceNumber, 1, req.query.college];
      }

      return await personalInfoDocumentsModel.getPersonalInfoDocuments(
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

const getStudentRequirements = async function (req, res) {
  if (
    util.empty(req.query.referenceNumber) ||
    util.empty(req.query.applicationNumber)
  )
    return res
      .status(400)
      .json({ error: "Reference Number and Application Number are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.referenceNumber) {
        conditions =
          "and referenceNumber = ? and applicationNumber = ? and active = ?";
        args = [req.query.referenceNumber, req.query.applicationNumber, 1];
      }

      return await applicationsModel.selectStudentRequirements(
        conditions,
        args,
        {
          order: "dateTimeUpdated desc",
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

const getScheduleOfClasses = async function (req, res) {
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.referenceNumber) {
        conditions = "and semester = ?";
        args = [req.query.semester];
      }

      return await configsModel.selectScheduleOfClasses(
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

const getApplications = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      const applicantInfo = req.query;
      if (applicantInfo.referenceNumber) {
        conditions = "and ref_number = ?";
        args = [applicantInfo.referenceNumber];
      }

      if (applicantInfo.appNumber) {
        conditions = "and app_number = ?";
        args = [applicantInfo.appNumber];
      }

      return await applicantsModel.getApplications(
        conditions,
        args,
        {
          order: "choice",
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

const getStudentNotes = async function (req, res) {
  if (util.empty(req.query.appNumber))
    return res.status(400).json({ error: "Application Number is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (!util.empty(req.query.appNumber)) {
        conditions = "and appNo = ?";
        args = [req.query.appNumber];
      }

      return await applicationsModel.selectStudentNotes(
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

const getStudentNoteTemplates = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = ?";
      const args = [1];

      return await applicationsModel.selectStudentNoteTemplates(
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

const getSchoolGrades = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "";
      const args = [];

      return await configsModel.selectSchoolGrade(
        conditions,
        args,
        {
          order: "school asc",
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

const getScholasticRecords = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.refNumber) {
        conditions = "and ref_number = ? and a.active = 1";
        args = [req.query.refNumber];
      }

      return await applicationsModel.selectScholasticRecords(
        conditions,
        args,
        {
          order: "term desc",
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

const getApplicantInfo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "and active = ?";
      let args = [1];
      const applicantData = req.params.data;
      const applicantInfo = req.query;
      if (applicantInfo.referenceNumber) {
        conditions = "and ref_number = ?";
        args = [applicantInfo.referenceNumber];
      }

      const modelAppData =
        applicantData.charAt(0).toLowerCase() + applicantData.slice(1);

      const dynamicModel = require(
        `../../models/admission/${modelAppData}Model.js`,
      );
      const modelData =
        applicantData.charAt(0).toUpperCase() + applicantData.slice(1);

      return await dynamicModel[`getApplicant${modelData}`](
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

const getApplicantChildInfo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "and active = ?";
      let args = [1];
      const applicantData = req.params.data;
      const applicantInfo = req.query;
      if (applicantInfo.referenceNumber) {
        conditions = "and ref_number = ?";
        args = [applicantInfo.referenceNumber];
      }
      return await applicantsModel[`getApplicant${applicantData}`](
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

const getSubmissionSchedule = async function (req, res) {
  if (util.empty(req.query.appNumber))
    return res.status(400).json({ error: "App Number is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      args = [req.query.appNumber, 0];
      conditions = `and appNo = ? and a.deleted = ?`;

      const submissionSched = await applicantsModel.selectSubmissionSchedule(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );

      if (submissionSched.length > 0) {
        for (const subSched of submissionSched) {
          subSched.schedDate = util.formatDate({
            date: subSched.schedDate,
            straightDate: true,
          });
          subSched.schedTimeFrom = util.formatDate({
            date: subSched.schedTimeFrom,
            timeOnly: true,
          });
          subSched.schedTimeTo = util.formatDate({
            date: subSched.schedTimeTo,
            timeOnly: true,
          });
        }
      }

      return submissionSched;
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

// BASIC SELECT STATEMENTS //
const authenticate = async function (req, res) {
  const loginCredentials = req.body;
  if (
    util.empty(loginCredentials.referenceNumber) ||
    util.empty(loginCredentials.emailAddress)
  )
    return res
      .status(400)
      .json({ error: "Reference Number and Email are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const refNo = loginCredentials.referenceNumber;
      const email = loginCredentials.emailAddress;
      const ip = helpers.getIp(req.connection.remoteAddress);
      const conditions = "";

      const args = [Number(refNo), email, ip];
      const userData = await applicantsModel.authenticate(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
      if (Object.keys(userData).length === 0) {
        return null;
      }

      if (userData.error) {
        return null;
      }
      const userAccessToken = crypto.generateAccessToken(userData);
      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.set(
        userData.referenceNumber.toString(),
        userAccessToken,
      );

      return userAccessToken;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue === null)
    return res.status(403).json({ error: "Username or password incorrect." });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json(returnValue);
};

const inauthenticate = async function (req, res) {
  const user = req.user;
  const returnValue = await sqlHelper.transact(async () => {
    try {
      const redisClient = createClient();
      await redisClient.connect();
      await redisClient.sendCommand(["DEL", user.code]);
    } catch (error) {
      console.log(error);
      return { error: error };
    }

    return { success: "success" };
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }

  return res.json(returnValue);
};

const retrieveApplicantReferenceNumber = async function (req, res) {
  if (util.empty(req.query.emailAddress))
    return res.status(400).json({ error: "Email is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const emailAddress = req.query.emailAddress;
      const conditions = "and email = ?";
      const args = [emailAddress];

      const applicantInfo = await personalInfoModel.getApplicantPersonalInfo(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );

      if (applicantInfo.length > 0) {
        try {
          const applicantInformation = applicantInfo[0];
          const emailContent = {
            header: "UERM Student Admission Portal",
            subject:
              "UERM Student Admission - Retrieve Applicant Reference Number",
            content: `Hi <strong>${applicantInformation.lastName.toUpperCase()}, ${applicantInformation.firstName.toUpperCase()}</strong>, <br><br>
          We've received a request that you forgotten your <em>Applicant Reference Number</em> on the Student Admission Portal. Your Reference Number is 
          <strong>${
            applicantInformation.refNumber
          }</strong>. <br><br>If you haven't requested this, please disregard this email.`,
            email: applicantInformation.emailAddress,
            name: `${applicantInformation.lastName}, ${applicantInformation.firstName}`,
          };
          await util.sendEmail(emailContent);
          return { success: true };
        } catch (error) {
          return { error: error };
        }
      } else {
        return { error: "Applicant does not exist!" };
      }
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

const registerApplicant = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` payload is required" });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const applicantRegInfo = req.body;
      const emailAddress = applicantRegInfo.emailAddress;
      const conditions = "and email = ?";
      const args = [emailAddress];
      const applicantInfo = await personalInfoModel.getApplicantPersonalInfo(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
      if (applicantInfo.length > 0) {
        const existingApplicant = applicantInfo[0];
        existingApplicant.existing = true;
        return existingApplicant;
      } else {
        const schedConditions = `and getdate() between applicationStart and applicationEnd
        or getdate() between appStartMd and appEndMd
        or getdate() between appStartGs and appEndGs`;
        const schedArgs = "";
        await configsModel.selectConfig(
          schedConditions,
          schedArgs,
          {
            order: "",
            top: "",
          },
          txn,
        );

        // if (getApplicationSched.length === 0) {
        //   return { error: 'Application period is CLOSED!'}
        // }

        const generatedRefNumber = await sqlHelper.generateDynamicUniqueCode(
          "UERMOnlineAdmission..PersonalInfo",
          "",
          2,
          "REF_NUMBER",
          false,
          txn,
        );

        const applicationPayload = {
          ref_number: generatedRefNumber,
          last_name: applicantRegInfo.lastName,
          first_name: applicantRegInfo.firstName,
          middle_name: applicantRegInfo.middleName,
          email: applicantRegInfo.emailAddress,
        };
        const insertedApplicant = await applicantsModel.insertApplicants(
          applicationPayload,
          txn,
        );
        // console.log(insertedApplicant, 'inserted')

        const returnApplicantData = {
          referenceNumber: insertedApplicant.ref_Number,
          lastName: insertedApplicant.last_Name,
          firstName: insertedApplicant.first_Name,
          middleName: insertedApplicant.middle_Name,
          emailAddress: insertedApplicant.email,
        };

        if (Object.keys(insertedApplicant).length > 0) {
          const emailContent = {
            header: "UERM Student Admission Portal",
            subject: "UERM Student Admission - Applicant Reference Number",
            content: `Hi <strong>${returnApplicantData.lastName.toUpperCase()}, ${returnApplicantData.firstName.toUpperCase()}</strong>, <br><br>
                Thank you very much for your interest on applying! You have been successfully registered to the UERM Student Admission Portal. Your Reference Number is 
                <strong>${returnApplicantData.referenceNumber}</strong>.`,
            email: returnApplicantData.emailAddress,
            name: `${returnApplicantData.lastName}, ${returnApplicantData.firstName}`,
          };
          await util.sendEmail(emailContent);
        }

        return returnApplicantData;
      }
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

const uploadFile = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let payload = {};
      const type = req.body.type;
      const referenceNumber = req.body.referenceNumber;
      let fileType = "";

      if (type !== "photo") {
        fileType = {
          [`${type}Type`]: req.query.type,
        };
      }
      for (const file in req.files) {
        const filePayload = {
          fileValue: req.files[file].data,
          ...fileType,
        };
        payload = filePayload;
      }

      const fileData = await applicantsModel.getApplicantFile(
        "and referenceNumber = ?",
        [referenceNumber],
        "fileValue",
        { order: "", top: "" },
        txn,
      );

      let applicantFile = [];
      if (fileData.length > 0) {
        applicantFile = await applicantsModel.updateApplicantFile(
          payload,
          { referenceNumber: referenceNumber },
          txn,
        );
      } else {
        payload.referenceNumber = referenceNumber;
        payload.fileName = type;
        payload.fileType = "img/jpg";
        applicantFile = await applicantsModel.insertApplicantFile(payload, txn);
      }
      return applicantFile;
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

// const uploadDocumentFile = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       let payload = {};
//       const type = req.body.type;
//       const referenceNumber = req.body.referenceNumber;
//       let fileType = "";
//       let conditions = `and ref_number = ? and name = ?`;
//       let args = [referenceNumber, type];

//       const applicantPersonalInfoDocuments =
//         await personalInfoDocuments.getPersonalInfoDocuments(
//           conditions,
//           args,
//           {
//             order: "",
//             top: "",
//           },
//           txn
//         );

//       if (type !== "photo") {
//         fileType = {
//           [`${type}Type`]: req.query.type,
//         };
//       }
//       for (let file in req.files) {
//         const filePayload = {
//           name: type,
//           documentFile: req.files[file].data,
//           fileType: req.query.type,
//         };
//         payload = filePayload;
//       }

//       if (applicantPersonalInfoDocuments.length > 0) {
//         return await personalInfoDocuments.updateDocumentFiles(
//           payload,
//           { ref_number: referenceNumber, name: type },
//           txn
//         );
//       } else {
//         payload.ref_number = referenceNumber;
//         // payload.createdBy = util.currentUserToken(req).code;
//         // payload.updatedBy = util.currentUserToken(req).code;
//         return await personalInfoDocuments.insertDocumentFiles(
//           payload,
//           { ref_number: referenceNumber },
//           txn
//         );
//         // return await personalInfoDocuments.insertDocumentFiles(
//         //   payload,
//         //   "PersonalInfoDocuments",
//         //   txn
//         // );
//       }
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

const getPersonalInfoDocuments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and ref_number = ? and active = ?";
      const admissionData = req.query;
      const args = [admissionData.referenceNumber, 1];
      return await personalInfoModel.getApplicantPersonalInfoDocuments(
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

const getFile = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const conditions = "and referenceNumber = ?";
    const args = [req.query.referenceNumber];
    const column = req.query.column === "photo" ? "fileValue" : "fileValue";

    try {
      const getFile = await applicantsModel.getApplicantFile(
        conditions,
        args,
        column,
        {
          order: "",
          top: "",
        },
        txn,
      );

      if (getFile.length > 0) {
        if (getFile[0][column] !== null) {
          return {
            value: Buffer.from(getFile[0][column], "base64"),
          };
        }
      }

      return { value: "" };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue.value);
};

const getApplicantInfoMedia = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "and active = ?";
      let args = [1];
      const applicantInfo = req.query;
      if (applicantInfo.referenceNumber) {
        conditions = "and ref_number = ?";
        args = [applicantInfo.referenceNumber];
      }

      return await personalInfoModel.getApplicantPersonalInfoMedia(
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

const insertApplicantInfo = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const appData = req.body;
      appData.ref_number = req.body.code;
      appData.status = 1;
      delete req.body.code;
      const formType = appData.formType;
      delete appData.formType;
      const childTableName = appData.childTable;
      delete appData.childTable;

      const finalPayload = {};

      for (const key in appData) {
        if (util.isStr(appData[key])) {
          finalPayload[key] = appData[key].toUpperCase();
        } else {
          finalPayload[key] = appData[key];
        }
      }

      if (finalPayload.children !== undefined) {
        for (const childTableOnly of childTableName) {
          const childTable = finalPayload.children[childTableOnly];
          for (const childRows of childTable) {
            const editMode = childRows.editMode;
            const id = childRows.id;
            if (childRows.universitiesCollegesVal !== undefined) {
              delete childRows.universitiesCollegesVal;
            }

            if (childRows.universitiesCollegesOptionsVal !== undefined) {
              delete childRows.universitiesCollegesOptionsVal;
            }
            if (childRows.status !== undefined) {
              delete childRows.status;
            }

            const finalChildPayload = {};

            for (const key in childRows) {
              if (util.isStr(childRows[key])) {
                finalChildPayload[key] = childRows[key].toUpperCase();
              } else {
                finalChildPayload[key] = childRows[key];
              }
            }

            if (editMode) {
              delete finalChildPayload.editMode;
              delete finalChildPayload.id;
              await applicantsModel.updateApplicantsInfo(
                finalChildPayload,
                { id: id },
                childTableOnly,
                txn,
              );
            } else {
              // INSERTION HERE
              finalChildPayload.ref_number = finalPayload.ref_number;
              finalChildPayload.createdBy = util.currentUserToken(req).code;
              finalChildPayload.updatedBy = util.currentUserToken(req).code;
              await applicantsModel.insertApplicantsInfo(
                finalChildPayload,
                childTableOnly,
                txn,
              );
            }
          }
        }
        delete finalPayload.children;
      }
      appData.createdBy = util.currentUserToken(req).code;
      appData.updatedBy = util.currentUserToken(req).code;
      return await applicantsModel.insertApplicantsInfo(
        finalPayload,
        formType,
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

const updateApplicantInfo = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const code = req.params.code;
      const applicantPayload = req.body;
      const formType = applicantPayload.formType;
      delete applicantPayload.formType;
      const childTableName = applicantPayload.childTable;
      delete applicantPayload.childTable;

      applicantPayload.status = 1;
      // FOR VACCINATION //
      if (applicantPayload.isVaccinated !== undefined) {
        if (!applicantPayload.isVaccinated) {
          applicantsModel.updateApplicantVaccination(
            `and ref_number = ${code}`,
          );
        }
      }
      // FOR VACCINATION //

      if (applicantPayload.children !== undefined) {
        for (const childTableOnly of childTableName) {
          const childTable = applicantPayload.children[childTableOnly];
          for (const childRows of childTable) {
            const editMode = childRows.editMode;
            const id = childRows.id;

            if (childRows.universitiesCollegesVal !== undefined) {
              delete childRows.universitiesCollegesVal;
            }

            if (childRows.universitiesCollegesOptionsVal !== undefined) {
              delete childRows.universitiesCollegesOptionsVal;
            }
            if (childRows.status !== undefined) {
              delete childRows.status;
            }

            const finalChildPayload = {};

            for (const key in childRows) {
              if (util.isStr(childRows[key])) {
                finalChildPayload[key] = childRows[key].toUpperCase();
              } else {
                finalChildPayload[key] = childRows[key];
              }
            }

            if (editMode) {
              delete finalChildPayload.editMode;
              delete finalChildPayload.id;
              delete finalChildPayload.dateTimeUpdated;
              await applicantsModel.updateApplicantsInfo(
                finalChildPayload,
                { id: id },
                childTableOnly,
                txn,
              );
            } else {
              // INSERTION HERE
              finalChildPayload.ref_number = code;
              finalChildPayload.createdBy = util.currentUserToken(req).code;
              finalChildPayload.updatedBy = util.currentUserToken(req).code;
              await applicantsModel.insertApplicantsInfo(
                finalChildPayload,
                childTableOnly,
                txn,
              );
            }
          }
        }
        delete applicantPayload.children;
      }

      // FOR PARENT ALUMNI //
      if (applicantPayload.parentsAlumni !== undefined) {
        for (const alumniParents in applicantPayload.parentsAlumni) {
          if (
            applicantPayload.parentsAlumni[alumniParents]
              .alumni_father_active !== undefined
          ) {
            if (
              !applicantPayload.parentsAlumni[alumniParents]
                .alumni_father_active
            ) {
              applicantPayload.parentsAlumni[
                alumniParents
              ].alumni_father_class = null;
              applicantPayload.parentsAlumni[
                alumniParents
              ].alumni_father_college = null;
            }
            delete applicantPayload.parentsAlumni[alumniParents]
              .alumni_father_active;
          }

          if (
            applicantPayload.parentsAlumni[alumniParents]
              .alumni_mother_active !== undefined
          ) {
            if (
              !applicantPayload.parentsAlumni[alumniParents]
                .alumni_mother_active
            ) {
              applicantPayload.parentsAlumni[
                alumniParents
              ].alumni_mother_class = null;
              applicantPayload.parentsAlumni[
                alumniParents
              ].alumni_mother_college = null;
            }
            delete applicantPayload.parentsAlumni[alumniParents]
              .alumni_mother_active;
          }

          Object.assign(
            applicantPayload,
            applicantPayload.parentsAlumni[alumniParents],
          );
        }
        delete applicantPayload.parentsAlumni;
      }

      const finalPayload = {};

      for (const key in applicantPayload) {
        if (util.isStr(applicantPayload[key])) {
          finalPayload[key] = applicantPayload[key].toUpperCase();
        } else {
          finalPayload[key] = applicantPayload[key];
        }
      }
      // FOR PARENT ALUMNI //
      const appInfo = await applicantsModel.updateApplicantsInfo(
        finalPayload,
        { ref_number: code },
        formType,
        txn,
      );
      return appInfo;
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

const insertApplications = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`code` query in URL is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const appData = req.body;
      const tableName = "UERMOnlineAdmission..ApplicationInfo";
      const applications = [];
      const degree = [];

      if (util.isArr(appData.applications)) {
        let appNumber = "";
        for (const app of appData.applications) {
          app.ref_number = appData.code;
          app.app_type = appData.app_type;
          app.freshmenType = appData.freshmenType;
          app.appTypeOthers = appData.appTypeOthers;
          degree.push(app.course);
          delete app.semester;
          delete app.signedDeclaration;
          delete app.signedDeclarationStatus;
          const conditions = "and ref_number = ? and course = ? and active = ?";
          const args = [app.ref_number, app.course, 1];
          const applicationInfo = await applicantsModel.getApplications(
            conditions,
            args,
            {
              order: "",
              top: "",
            },
            txn,
          );

          if (applicationInfo.length > 0) {
            return { error: "Application exist!" };
          }

          app.app_number = await sqlHelper.generateUniqueCode(
            tableName,
            "",
            2,
            txn,
          );

          appNumber = app.app_number;

          const insertedApps = await applicantsModel.insertApplications(
            app,
            tableName,
            txn,
          );
          if (insertedApps.length > 0) {
            applications.push(insertedApps);
          }
        }

        // SCHEDULING OF SUBMISSION FOR MD ONLY //
        if (degree.indexOf("MD") === -1) {
          if (appData.children !== undefined) {
            if (appData.children.applicationSchedule !== undefined) {
              for (const appSched of appData.children.applicationSchedule) {
                const appSchedPayload = appSched;
                appSchedPayload.schedId = util.empty(appSchedPayload.schedId)
                  ? null
                  : appSchedPayload.schedId;
                appSchedPayload.appNo = appNumber;
                appSchedPayload.refNo = appData.code;
                await applicantsModel.insertApplicationSchedule(
                  appSchedPayload,
                  "UERMOnlineAdmission..ApplicationSchedule",
                  txn,
                );
              }
            }
          }
        }
        // SCHEDULING OF SUBMISSION FOR MD ONLY //
      }
      delete appData.formType;
      delete appData.code;
      return applications;
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

const updateApplications = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const appData = req.body;
      const tableName = "UERMOnlineAdmission..ApplicationInfo";
      const applicationInfo = [];
      if (util.isArr(appData)) {
        for (const app of appData) {
          app.choice = Number(app.choice);
          const appNumber = app.app_number.toString();
          delete app.app_number;
          const apps = await applicantsModel.updateApplications(
            app,
            { app_number: appNumber.toString() },
            tableName,
            txn,
          );
          applicationInfo.push(apps);
        }
      } else if (util.isObj(appData)) {
        const appNumber = appData.app_number.toString();
        delete appData.app_number;
        return await applicantsModel.updateApplications(
          appData,
          { app_number: appNumber },
          tableName,
          txn,
        );
      }
      return applicationInfo;
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

// const updateApplicantVaccination = async function (req, res) {
//   if (util.empty(req.body))
//     return res
//       .status(400)
//       .json({ error: "`parameters` in body are required." });

//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const code = req.params.code;
//       const applicantPayload = req.body;

//       return await applicantsModel.updateApplicantsInfo(
//         applicantPayload,
//         { ref_number: code },
//         formType,
//         txn
//       );
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

const saveStudentRequirements = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const appData = req.body;
      // INSERT NEW DATA //
      for (const newItem of appData.new) {
        newItem.createdBy = util.currentUserToken(req).code;
        newItem.updatedBy = util.currentUserToken(req).code;
        await applicationsModel.insertStudentRequirements(newItem, txn);
      }
      // INSERT NEW DATA //

      if (appData.deletion.length > 0) {
        for (const deleteItem of appData.deletion) {
          const deleteItemId = deleteItem.id;
          deleteItem.updatedBy = util.currentUserToken(req).code;
          delete deleteItem.id;
          await applicationsModel.updateStudentRequirements(
            deleteItem,
            {
              id: deleteItemId,
            },
            txn,
          );
        }
      }
      const conditions =
        "and referenceNumber = ? and applicationNumber = ? and active = ?";
      const args = [
        appData.admissionDetails.referenceNumber,
        appData.admissionDetails.applicationNumber.toString(),
        1,
      ];

      return await applicationsModel.selectStudentRequirements(
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

const receiveAdmission = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async () => {
    try {
      const appData = req.body;

      await util.sendEmail({
        email: "btgresola@uerm.edu.ph",
        name: "Bernard Gresola",
        subject: "TESTING",
        content: "Testing Content",
        contentType: "application/pdf",
        attachments: [
          {
            ContentType: "application/pdf",
            Filename: "APPLICATION FEE.pdf",
            Base64Content: appData.base64,
          },
        ],
      });
      return true;
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

const emailStudentDocument = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async () => {
    try {
      const appData = req.body;
      const Base64Content = Buffer.from(
        appData.attachments[0].Base64Content,
      ).toString("base64");
      appData.attachments[0].Base64Content = Base64Content;
      await util.sendEmail(appData);
      return true;
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

// const testSMS = async function (req, res) {

//   const returnValue = await sqlHelper.transact(async (txn) => {
//     const tokenBearerSMS = await util.getTokenSMS();
//     const accessToken = tokenBearerSMS.accessToken;
//     const message = {
//       messageType: "sms",
//       destination: '09053254071',
//       app: 'ADMISSION',
//       text: `TEST NEW ONLY`,
//     };
//     // await util.sendSMS(accessToken, message);
//     const sent = await tools.sendSMSInsertDB(accessToken,
//       message
//     );
//     // console.log(sent)

//     return sent
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

const postStudentNotes = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      const studentNotePayload = {
        refNo: payload.refNo,
        appNo: payload.appNo,
        remarks: payload.remarks,
        createBy: util.currentUserToken(req).code,
      };
      const note = await applicationsModel.insertStudentNotes(
        studentNotePayload,
        txn,
      );

      const smsMessage = {
        messageType: "sms",
        destination: payload.mobileNumber,
        app: "UERM STUDENT ADMISSION",
        text: payload.remarks,
      };
      // console.log(smsMessage)
      const tokenBearerSMS = await util.getTokenSMS();
      const accessToken = tokenBearerSMS.accessToken;
      await tools.sendSMSInsertDB(accessToken, smsMessage);

      const emailContent = {
        header: "UERM Student Admission",
        subject: "UERM Student Admission - Update",
        content: `Hi <strong>${payload.name}</strong>, <br /> <br />${payload.remarks}`,
        email: payload.email,
        name: `${payload.name}`,
      };
      await util.sendEmail(emailContent);

      return note;
      // return true
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

const postStudentDocument = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      const updateDocument = await applicationsModel.updateStudentDocument(
        {
          status: payload.status,
          notified: false,
        },
        { ref_number: payload.ref_number, documentFile: payload.documentFile },
        txn,
      );

      if (Object.keys(updateDocument).length > 0) {
        // const reqPayload = {
        //   applicationNumber: payload.appNumber.toString(),
        //   referenceNumber: payload.ref_number,
        //   requirementCode: payload.documentFile,
        //   active: payload.status,
        // };
        // if (payload.status === 1) {
        //   await applicationsModel.insertStudentRequirements(reqPayload, txn);
        // } else {
        //   await applicationsModel.updateStudentRequirements(
        //     reqPayload,
        //     {
        //       referenceNumber: reqPayload.referenceNumber,
        //       applicationNumber: reqPayload.applicationNumber,
        //       requirementCode: reqPayload.requirementCode,
        //     },
        //     txn,
        //   );
        // }

        if (payload.contactApplicant) {
          const smsMessage = {
            messageType: "sms",
            destination: payload.mobileNumber,
            app: "UERM STUDENT ADMISSION",
            text: payload.textMessage,
          };
          // console.log(smsMessage)
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          await tools.sendSMSInsertDB(accessToken, smsMessage);

          const emailContent = {
            header: "UERM Student Admission",
            subject: "UERM Student Admission - Uploaded Documents Update",
            content: `Hi <strong>${payload.applicantName}</strong>, <br /> <br />${payload.emailMessage}`,
            email: payload.email,
            name: `${payload.name}`,
          };
          await util.sendEmail(emailContent);
        }

        if (!payload.receiveApplication) {
          const receiveAppPayload = {
            received: false,
            receiveDate: null,
            application_status: null,
            code: null,
            receivedBy: null,
          };

          await applicationsModel.updateStudentApplicationStatus(
            receiveAppPayload,
            { app_number: payload.appNumber.toString() },
            txn,
          );
        }
      }

      return updateDocument;
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

const notifyStudentDocument = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;

      const updateDocument = await applicationsModel.updateStudentDocument(
        {
          notified: 1,
        },
        {
          ref_number: payload.referenceNumber,
          college: payload.college,
        },
        txn,
      );

      if (Object.keys(updateDocument).length > 0) {
        if (payload.mobileNumber !== null) {
          const smsMessage = {
            messageType: "sms",
            destination: payload.mobileNumber,
            app: "UERM STUDENT ADMISSION",
            text: payload.textMessage,
          };
          // console.log(smsMessage)
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          await tools.sendSMSInsertDB(accessToken, smsMessage);
        }

        const emailContent = {
          header: "UERM Student Admission",
          subject: "UERM Student Admission - Uploaded Documents Update",
          content: `Hi <strong>${payload.applicantName}</strong>, <br /> <br />${payload.emailMessage}`,
          email: payload.email,
          name: `${payload.name}`,
        };
        await util.sendEmail(emailContent);
      }

      if (payload.receiveApplication) {
        let receiveAppPayload = {};
        if (payload.isGraduateSchool) {
          receiveAppPayload = {
            received: "1",
            receiveDate: await util.currentDateTime(),
            application_status: "RECEIVED",
            code: util.currentUserToken(req).code,
            receivedBy: util.currentUserToken(req).code,
          };
        } else {
          receiveAppPayload = {
            received: "1",
            ["[FOR INTERVIEW]"]: "1",
            receiveDate: await util.currentDateTime(),
            forInterviewDate: await util.currentDateTime(),
            application_status: "FOR INTERVIEW",
            code: util.currentUserToken(req).code,
            receivedBy: util.currentUserToken(req).code,
          };
        }
        await applicationsModel.updateStudentApplicationStatus(
          receiveAppPayload,
          { app_number: payload.applicationNumber.toString() },
          txn,
        );
      }
      return true;
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

const postScholasticRecord = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const scholasticData = req.body.scholasticData;
      const admissionDetails = req.body.admissionDetails;

      const conditions = "and ref_number = ?";
      const args = [admissionDetails.refNumber];
      const scholasticRecords = await applicationsModel.selectScholasticRecords(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );
      if (scholasticRecords.length > 0) {
        return { error: "Scholastic Record already exist" };
      }

      const returnVal = [];
      for (const termDetails of scholasticData) {
        const initPayload = {
          ref_number: admissionDetails.refNumber,
          app_number: admissionDetails.appNumber.toString(),
          term: termDetails.term,
          description: termDetails.remarks,
          generalWeightedAverage: termDetails.totalGWA,
        };

        initPayload.code = await sqlHelper.generateUniqueCode(
          "UERMOnlineAdmission..ApplicantScholasticRecords",
          "SR",
          2,
          txn,
        );

        await applicationsModel.insertScholasticRecords(initPayload, txn);

        for (const grades of termDetails.grades) {
          const finalPayload = {
            scholasticRecordCode: initPayload.code,
            subjectCode: grades.code,
            grade: grades.value,
          };
          const insertedData =
            await applicationsModel.insertScholasticRecordDetails(
              finalPayload,
              txn,
            );
          returnVal.push(insertedData);
        }
      }

      return returnVal;
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

const putScholasticRecord = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const scholasticData = req.body.scholasticData;
      const admissionDetails = req.body.admissionDetails;
      const returnVal = [];
      for (const termDetails of scholasticData) {
        const initPayload = {
          code: termDetails.code,
          ref_number: admissionDetails.refNumber,
          app_number: admissionDetails.appNumber.toString(),
          term: termDetails.term,
          description: termDetails.remarks,
          generalWeightedAverage: termDetails.totalGWA,
          active: termDetails.active,
        };

        if (termDetails.code === undefined) {
          const initPayload = {
            ref_number: admissionDetails.refNumber,
            app_number: admissionDetails.appNumber.toString(),
            term: termDetails.term,
            description: termDetails.remarks,
            generalWeightedAverage: termDetails.totalGWA,
          };

          initPayload.code = await sqlHelper.generateUniqueCode(
            "UERMOnlineAdmission..ApplicantScholasticRecords",
            "SR",
            2,
            txn,
          );

          await applicationsModel.insertScholasticRecords(initPayload, txn);

          for (const grades of termDetails.grades) {
            const finalPayload = {
              scholasticRecordCode: initPayload.code,
              subjectCode: grades.code,
              grade: grades.value,
            };
            const insertedData =
              await applicationsModel.insertScholasticRecordDetails(
                finalPayload,
                txn,
              );
            returnVal.push(insertedData);
          }
        } else {
          await applicationsModel.updateScholaticRecords(
            initPayload,
            {
              code: initPayload.code,
            },
            txn,
          );

          for (const grades of termDetails.grades) {
            const finalPayload = {
              subjectCode: grades.code,
              grade: grades.value,
              active: grades.active,
            };
            const insertedData =
              await applicationsModel.updateScholaticRecordDetails(
                finalPayload,
                {
                  scholasticRecordCode: initPayload.code,
                  subjectCode: grades.code,
                },
                txn,
              );
            returnVal.push(insertedData);
          }
        }
      }

      return returnVal;
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

const postDashboardDocuments = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      const updateDocument = await applicationsModel.updateStudentDocument(
        {
          status: payload.status,
          notified: false,
        },
        { ref_number: payload.ref_number, documentFile: payload.documentFile },
        txn,
      );

      if (Object.keys(updateDocument).length > 0) {
        const reqPayload = {
          applicationNumber: payload.appNumber.toString(),
          referenceNumber: payload.ref_number,
          requirementCode: payload.documentFile,
          active: payload.status,
        };
        if (payload.status === 1) {
          await applicationsModel.insertStudentRequirements(reqPayload, txn);
        } else {
          await applicationsModel.updateStudentRequirements(
            reqPayload,
            {
              referenceNumber: reqPayload.referenceNumber,
              applicationNumber: reqPayload.applicationNumber,
              requirementCode: reqPayload.requirementCode,
            },
            txn,
          );
        }

        // if (payload.contactApplicant) {
        //   const smsMessage = {
        //     messageType: "sms",
        //     destination: payload.mobileNumber,
        //     app: "UERM STUDENT ADMISSION",
        //     text: payload.textMessage,
        //   };
        //   // console.log(smsMessage)
        //   const tokenBearerSMS = await util.getTokenSMS();
        //   const accessToken = tokenBearerSMS.accessToken;
        //   await tools.sendSMSInsertDB(accessToken, smsMessage);

        //   const emailContent = {
        //     header: "UERM Student Admission",
        //     subject: "UERM Student Admission - Uploaded Documents Update",
        //     content: `Hi <strong>${payload.applicantName}</strong>, <br /> <br />${payload.emailMessage}`,
        //     email: payload.email,
        //     name: `${payload.name}`,
        //   };
        //   await util.sendEmail(emailContent);
        // }

        // const receiveAppPayload = {
        //   received: false,
        //   receiveDate: null,
        //   application_status: null,
        //   code: null,
        //   receivedBy: null,
        // };

        const applicationPayload = req.body.applicationDetails;

        await applicationsModel.updateStudentApplicationStatus(
          applicationPayload,
          { app_number: payload.appNumber.toString() },
          txn,
        );
      }

      return updateDocument;
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

const putApplicationInfo = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const acceptanceDetails = req.body.acceptanceDetails;
      const applicantDetails = req.body.applicantDetails;
      const notificationDetails = req.body.notificationDetails;

      // LOGIC TO CHECK FOR TARGET ENROLLMENT //
      const currentCensus = await sqlHelper.query(
        `select count(*) census
          from UERMOnlineAdmission..vw_Applications 
        where sem = '${applicantDetails.semester}' 
        and currentChoice = 1 
        and course = '${applicantDetails.course}' 
        and isWithdrawn <> 1
        --and isOfficiallyEnrolled = 1
        AND (isEnrolled = 1 or isOfficiallyEnrolled = 1)`,
        [],
        txn,
      );

      if (currentCensus.length > 0) {
        if (currentCensus[0].census >= req.body.target) {
          throw `Target enrollees for ${applicantDetails.course} already reached!`;
        }
      }
      // LOGIC TO CHECK FOR TARGET ENROLLMENT //

      const acceptPayload = {
        accepted: 1,
        acceptDate: await util.currentDateTime(),
        acceptBy: await util.currentUserToken(req).code,
        application_status: "ACCEPTED",
      };
      const finalAcceptance = Object.assign(acceptanceDetails, acceptPayload);
      const updateApplicationInfo = await applicantsModel.updateApplicantsInfo(
        finalAcceptance,
        { app_number: req.body.appNumber },
        "ApplicationInfo",
        txn,
      );

      if (Object.keys(updateApplicationInfo).length > 0) {
        const emailContent = {
          header: "UERM Student Admission Advisory",
          subject: "UERM Student Admission Advisory",
          content: notificationDetails.email,
          email: applicantDetails.email,
          name: `${applicantDetails.fullName}`,
        };
        await util.sendEmail(emailContent);

        const smsMessage = {
          messageType: "sms",
          destination: applicantDetails.mobileNumber,
          app: "UERM STUDENT ADMISSION",
          text: notificationDetails.sms,
        };
        const tokenBearerSMS = await util.getTokenSMS();
        const accessToken = tokenBearerSMS.accessToken;
        await tools.sendSMSInsertDB(accessToken, smsMessage);
      }
      return updateApplicationInfo;
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

const tagApplicationInfo = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const applicationInfo = req.body.applicationInfo;
      const admissionDetails = req.body.admissionDetails;

      // console.log(admissionDetails);

      if (applicationInfo.application_status === "FOR ACCEPTANCE") {
        applicationInfo.forAcceptanceDate = await util.currentDateTime();
        applicationInfo.forAcceptanceBy = await util.currentUserToken(req).code;
        applicationInfo.forInterviewDate = await util.currentDateTime();
        applicationInfo.received = 1;
        applicationInfo.receiveDate = await util.currentDateTime();
        applicationInfo.receivedBy = await util.currentUserToken(req).code;
      } else if (applicationInfo.application_status === "FOR INTERVIEW") {
        if (admissionDetails.course !== "APMD") {
          /* REFER TO LEVEL 2 INTERVIEWER */
          const level2Interviewer = await interviewerModel.selectInterviewers(
            "and interviewerLevel = 2 and (college = ? or secondaryCollege = ?)",
            [admissionDetails.course, admissionDetails.course],
            {
              order: "fullName asc",
              top: "",
            },
            txn,
          );

          const interviewerLevel2 = level2Interviewer[0];
          const appointmentCode = await sqlHelper.generateUniqueCode(
            "UERMOnlineAdmission..ApplicantAppointments",
            `${admissionDetails.college}`,
            2,
            txn,
          );

          const payload = {
            code: appointmentCode,
            referenceNumber: admissionDetails.refNumber,
            applicationNumber: admissionDetails.appNumber,
            interviewerId: interviewerLevel2.code,
            status: 3,
          };

          const appointments =
            await interviewerModel.selectApplicantAppointments(
              "and referenceNumber = ?",
              [payload.referenceNumber],
              {},
              txn,
            );

          if (appointments.length === 0) {
            await interviewerModel.insertApplicantAppointments(payload, txn);

            const tokenBearerSMS = await util.getTokenSMS();
            const accessToken = tokenBearerSMS.accessToken;
            const level2SMS = {
              messageType: "sms",
              destination: interviewerLevel2.mobileNumber, // LIVE DATA
              // destination: "09053254071", // TEST DATA
              app: "UERM STUDENT ADMISSION",
              text: `UERM ADMISSIONS ADVISORY\n
      One of our applicants is forwarded to you for further evaluation.\n
      Please check your UERM Student Admission Interviewer Module and provide a feedback within three working days.`,
            };
            await tools.sendSMSInsertDB(accessToken, level2SMS);

            const referredEmail = {
              header: "UERM ADMISSIONS ADVISORY",
              subject: "UERM ADMISSIONS ADVISORY",
              content: `The application of <strong>${interviewerLevel2.fullName}</strong> is forwarded to the Office of the Dean for further evaluation.
                                  <br><br>
                                  Please check your UERM Student Admission Interviewer Module and provide a feedback on the said application within three working days upon receipt of this e-mail notification.
                                  <br><br>
                                  Otherwise, the above-named applicant will be scheduled for an interview to the next degree program of choice. `,
              email: interviewerLevel2.email, // LIVE DATA
              // email: "btgresola@uerm.edu.ph", // TEST DATA
              name: interviewerLevel2.fullName,
            };

            await util.sendEmail(referredEmail);
            /* REFER TO LEVEL 2 INTERVIEWER */
          }

          applicationInfo.received = 1;
          applicationInfo.receiveDate = await util.currentDateTime();
          applicationInfo.receivedBy = await util.currentUserToken(req).code;
          applicationInfo.forInterviewDate = await util.currentDateTime();
          applicationInfo.code = await util.currentUserToken(req).code;
        }
      }

      const applicants = await applicantsModel.updateApplicantsInfo(
        applicationInfo,
        { app_number: req.params.code },
        "ApplicationInfo",
        txn,
      );
      return applicants;
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

const putApplicationsInfo = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const applicationInfo = req.body;
      const applicationNumber = req.params.code;

      return await applicantsModel.updateApplicantsInfo(
        applicationInfo,
        { app_number: applicationNumber },
        "ApplicationInfo",
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

const putApplicationStatus = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const applicationNumber = req.params.code;
      const admissionDetails = req.body.admissionDetails;
      const notifications = req.body.notifications;
      const payload = {
        [req.body.statusDetails.columnTag]: 1,
        [req.body.statusDetails.userUpdateColumn]:
          await util.currentUserToken(req).code,
        [req.body.statusDetails.updateDateColumn]: await util.currentDateTime(),
        application_status: req.body.statusDetails.appStatus,
      };

      const updateAppInfo = await applicantsModel.updateApplicantsInfo(
        payload,
        { app_number: applicationNumber },
        "ApplicationInfo",
        txn,
      );

      if (updateAppInfo.error === undefined) {
        const tokenBearerSMS = await util.getTokenSMS();
        const accessToken = tokenBearerSMS.accessToken;
        if (req.body.statusDetails.appStatus === "ACCEPTED") {
          const smsMessage = {
            messageType: "sms",
            destination: admissionDetails.mobileNumber,
            app: "UERM STUDENT ADMISSION",
            text: notifications.sms,
          };
          await tools.sendSMSInsertDB(accessToken, smsMessage);
          const emailContent = {
            header: "UERM Student Admission",
            subject: "UERM Student Admission - Update",
            content: `Hi <strong>${admissionDetails.fullName}</strong>, <br /> <br />${notifications.email}`,
            email: admissionDetails.email,
            name: `${admissionDetails.fullName}`,
          };
          await util.sendEmail(emailContent);
        } else if (req.body.statusDetails.appStatus === "FOR INTERVIEW") {
          const smsMessage = {
            messageType: "sms",
            destination: admissionDetails.mobileNumber,
            app: "UERM STUDENT ADMISSION",
            text: notifications.sms,
          };
          await tools.sendSMSInsertDB(accessToken, smsMessage);
          const emailContent = {
            header: "UERM Student Admission",
            subject: "UERM Student Admission - Update",
            content: `Hi <strong>${admissionDetails.fullName}</strong>, <br /> <br />${notifications.email}`,
            email: admissionDetails.email,
            name: `${admissionDetails.fullName}`,
          };
          await util.sendEmail(emailContent);

          let college = "";
          switch (admissionDetails.college) {
            case "G":
              college = "GRAD";
              break;
            case "M":
              college = "DMD";
              break;
            default:
              college = "UGRAD";
          }
          await applicationsModel.updateStudentDocument(
            {
              notified: 1,
              status: 1,
            },
            {
              ref_number: admissionDetails.refNumber,
              college: college,
            },
            txn,
          );
        } else if (req.body.statusDetails.appStatus === "RECEIVED") {
          if (req.body.admissionDetails.course === "APMD") {
            const smsMessage = {
              messageType: "sms",
              destination: admissionDetails.mobileNumber,
              app: "UERM STUDENT ADMISSION",
              text: notifications.sms,
            };
            await tools.sendSMSInsertDB(accessToken, smsMessage);
            const emailContent = {
              header: "UERM Student Admission",
              subject: "UERM Student Admission - Update",
              content: `${notifications.email}`,
              email: admissionDetails.email,
              name: `${admissionDetails.fullName}`,
            };
            await util.sendEmail(emailContent);
          }
        }
      }

      return updateAppInfo;
    } catch (error) {
      console.log(error);
      return { error: error };
    }

    // return true;
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const batchAccept = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const appNumber = req.body.appNumber;
      const refNumber = req.body.refNumber;
      const acceptancePayload = req.body.acceptancePayload;
      const notificationPayload = req.body.notificationPayload;
      acceptancePayload.accepted = 1;
      acceptancePayload.acceptDate = await util.currentDateTime();
      acceptancePayload.acceptBy = await util.currentUserToken(req).code;
      acceptancePayload.acceptedNOAMessage = notificationPayload.emailTemplate;

      const applicantInfo = await applicantsModel.updateApplicantsInfo(
        acceptancePayload,
        { app_number: appNumber },
        "ApplicationInfo",
        txn,
      );

      if (Object.keys(applicantInfo).length > 0) {
        if (acceptancePayload.acceptedType === 3) {
          await applicantsModel.updateApplicantsInfo(
            {
              isForeign: 1,
            },
            { ref_number: refNumber },
            "PersonalInfo",
            txn,
          );
        }
        if (notificationPayload.sendNotification) {
          await appHelpers.sendFormattedEmail(
            undefined,
            undefined,
            notificationPayload.emailTemplate,
            notificationPayload.fullName,
            notificationPayload.email,
          );

          await appHelpers.sendFormattedSMS(
            undefined,
            notificationPayload.mobileNumber,
            notificationPayload.smsTemplate,
          );
        }
      }
      return applicantInfo;
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

const getNmatDates = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = 1";
      const args = [];

      // args = [serial];
      // conditions = `and d.serials = ? `;

      return await configsModel.selectNmatDates(
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

const uploadDocuments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const admissionData = req.body;

      const payloadForUpdate = [];
      const payloadForInsert = [];
      const docFiles = {};

      if (util.isArr(admissionData.documentFile)) {
        for (const docFile of admissionData.documentFile) {
          Object.assign(docFiles, JSON.parse(docFile));
        }
      } else {
        Object.assign(docFiles, JSON.parse(admissionData.documentFile));
      }

      for (const file in req.files) {
        const conditions =
          "and ref_number = ? and college = ? and active = ? and documentFile = ?";
        const args = [
          admissionData.referenceNumber,
          admissionData.collegeGroup,
          1,
          file,
        ];
        const documents =
          await personalInfoModel.getApplicantPersonalInfoDocumentsWithoutRaw(
            conditions,
            args,
            {
              order: "",
              top: "",
            },
            txn,
          );

        const filePayload = {
          fileValue: req.files[file].data,
          ref_number: admissionData.referenceNumber,
          college: admissionData.collegeGroup,
          name: docFiles[file].name,
          documentFile: file,
          fileType: docFiles[file].fileType,
          fileName: `${admissionData.referenceNumber} - ${docFiles[file].name}`,
          status: 0,
        };

        if (documents.length === 0) {
          payloadForInsert.push(filePayload);
        } else {
          payloadForUpdate.push(filePayload);
        }
      }

      const columnsToSelect = [
        "ref_number",
        "name",
        "active",
        "dateTimeCreated",
        "dateTimeUpdated",
      ];

      if (payloadForUpdate.length > 0) {
        for (const finalPayload of payloadForUpdate) {
          await personalInfoModel.updatePersonalInfoDocuments(
            finalPayload,
            {
              documentFile: finalPayload.documentFile,
              ref_number: finalPayload.ref_number,
            },
            txn,
            columnsToSelect,
          );
        }
      }

      if (payloadForInsert.length > 0) {
        for (const finalPayload of payloadForInsert) {
          await personalInfoModel.insertPersonalInfoDocuments(
            finalPayload,
            txn,
            columnsToSelect,
          );
        }
      }
      return true;
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

const putException = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const applicationInfo = req.body;

      return await applicantsModel.updateApplicantsInfo(
        applicationInfo,
        { ref_number: applicationInfo.ref_number },
        "PersonalInfo",
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
  checkApplicants,
  addBatch,
  acceptApplicants,
  getConfig,
  getSemesters,
  getRequirements,
  getSchedule,
  getInterviewSchedule,
  getInterviewList,
  getWalkIn,
  getColleges,
  getUniversitiesAndColleges,
  getCollegeCourses,
  getCollegeDegrees,
  getCollegeSemester,
  getCollegeDeclarations,
  getStudentApplications,
  getStudentApplicationsWithDocs,
  getRealtimeStudentApplications,
  getStudentDocuments,
  getStudentRequirements,
  getScheduleOfClasses,
  getStudentNotes,
  getStudentNoteTemplates,
  getSubmissionSchedule,
  getSchoolGrades,
  getScholasticRecords,
  getPersonalInfoDocuments,
  getApplicantInfoMedia,
  getFile,
  getApplications,
  getApplicantInfo,
  getApplicantChildInfo,
  authenticate,
  inauthenticate,
  registerApplicant,
  retrieveApplicantReferenceNumber,
  uploadFile,
  // uploadDocumentFile,
  insertApplicantInfo,
  insertApplications,
  postStudentNotes,
  postStudentDocument,
  postDashboardDocuments,
  updateApplicantInfo,
  updateApplications,
  postScholasticRecord,
  putScholasticRecord,
  putApplicationsInfo,
  putApplicationStatus,

  saveStudentRequirements,
  receiveAdmission,
  emailStudentDocument,
  notifyStudentDocument,

  putApplicationInfo,
  tagApplicationInfo,
  batchAccept,
  getNmatDates,
  uploadDocuments,
  putException,
};

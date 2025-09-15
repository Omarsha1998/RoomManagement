/* eslint-disable no-console */
const util = require("../../helpers/util.js");
const sqlHelper = require("../../helpers/sql.js");
// const crypto = require("../../helpers/crypto.js");
// const tools = require("../../helpers/tools.js");

// MODELS //
const scholarshipModel = require("../../models/admission/scholarshipModel.js");
// MODELS //

const getScholarshipFlowApprovals = async function (req, res) {
  if (util.empty(req.query.scholarshipCode))
    return res.status(400).json({ error: "Scholarship Code is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and a.code = ? and a.degreeProgram = ?`;
      const args = [req.query.scholarshipCode, req.query.degreeProgram];

      return await scholarshipModel.selectScholarshipFlowApprovals(
        conditions,
        args,
        {
          order: "levelApproval, sequence",
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

const getScholarshipApplications = async function (req, res) {
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and a.active = ? and a.semester = ?`;
      const args = [1, "20251"];
      // req.query.semester

      const scholarshipApp =
        await scholarshipModel.selectScholarshipApplicationsRaw(
          conditions,
          args,
          {
            order: "",
            top: "",
          },
          txn,
        );

      return scholarshipApp;
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
  if (util.empty(req.query.semester))
    return res.status(400).json({ error: "Semester is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and a.active = ? and a.semester = ?`;
      const args = [1, req.query.semester];

      const scholarshipApp =
        await scholarshipModel.selectScholarshipApplications(
          conditions,
          args,
          {
            order: " c.approvalLevelCode",
            top: "",
          },
          txn,
        );

      if (scholarshipApp.length > 0) {
        for (const track of scholarshipApp) {
          const tracking = await sqlHelper.query(
            `select 
            b.approvalLevelCode,
            a.approvalLevel,
            a.color,
            case when c.status is null
              then 'next level processing'
              else c.status
            end status,
            case when c.status is null or c.status = 'pending'
              then null
              else c.DateTimeUpdated 
	          end dateTimeApproved
          from Scholarship..ScholarshipApprovalLevels a
          left join Scholarship..ScholarshipApprovalFlows b on b.ApprovalLevelCode = a.code
          left join Scholarship..ScholarshipApplicationApprovals c on c.ApprovalLevelCode = b.ApprovalLevelCode and  scholarshipCode = ?
          where  b.DegreeProgram = ?`,
            [track.code, track.degreeProgram],
            txn,
          );

          if (tracking.length > 0) {
            const transformed = {};

            tracking.forEach((item) => {
              const {
                approvalLevelCode,
                approvalLevel,
                status,
                color,
                dateTimeApproved,
              } = item;
              if (approvalLevelCode.includes("level2college")) {
                // transformed["levelLabel"] = "level2collegeLabel";
                transformed["level2college"] = status;
                transformed[`level2collegeLevel`] = approvalLevel;
                transformed[`level2collegeColor`] = color;
                transformed[`level2collegeDateTimeApproved`] = util.formatDate2(
                  { date: dateTimeApproved },
                );
              } else {
                // transformed["levelLabel"] = approvalLevelCode;
                transformed[approvalLevelCode] = status;
                transformed[`${approvalLevelCode}Level`] = approvalLevel;
                transformed[`${approvalLevelCode}Color`] = color;
                transformed[`${approvalLevelCode}DateTimeApproved`] =
                  util.formatDate2({ date: dateTimeApproved });
              }
            });

            Object.assign(track, transformed);
          }
        }
      }
      return scholarshipApp;
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

const getApplicationDetails = async function (req, res) {
  if (util.empty(req.query.applicationNumber))
    return res.status(400).json({ error: "`applicationNumber` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and applicationNumber = ? and active = ?`;
      const args = [req.query.applicationNumber, 1];

      const scholarshipApp =
        await scholarshipModel.selectScholarshipApplicationDetails(
          conditions,
          args,
          {
            order: "",
            top: "",
          },
          txn,
        );

      if (scholarshipApp.length > 0) {
        const scholarshipFiles = await scholarshipModel.selectScholarshipFile(
          `and scholarshipCode = ?`,
          [scholarshipApp[0].code],
          {
            order: "",
            top: "",
          },
          txn,
        );

        scholarshipApp[0].files = scholarshipFiles;
      }

      return scholarshipApp;
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
      const args = [];

      return await scholarshipModel.selectScholarshipRequirements(
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

const getScholarshipReceived = async function (req, res) {
  if (util.empty(req.query.scholarshipCode))
    return res.status(400).json({ error: "`scholarshipCode` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = `and scholarshipCode = ? and active = ?`;
      const args = [req.query.scholarshipCode, 1];

      const scholarshipApp = await scholarshipModel.selectScholarshipsReceived(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );

      return scholarshipApp;
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

const postScholarshipApproval = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const appData = req.body;

      // Add to Application Approval Levels //

      const scholarshipFlowLevels =
        await scholarshipModel.selectScholarshipFlowApprovals(
          `and a.degreeProgram = ? and a.code = ?`,
          [appData.degreeProgram, appData.scholarshipCode],
          {
            order: "levelApproval, sequence",
            top: "",
          },
        );

      let updateCurrentLevel = {};
      if (scholarshipFlowLevels.length > 0) {
        if (appData.approvalLevelCode === "level1osa") {
          await scholarshipModel.updateScholarshipApplication(
            {
              status: "received",
            },
            {
              code: appData.scholarshipCode,
            },
            "Scholarship..ScholarshipApplications",
            txn,
          );
        }

        // Update pending levels //
        updateCurrentLevel =
          await scholarshipModel.updateScholarshipApplication(
            {
              status: "approved",
            },
            {
              scholarshipCode: appData.scholarshipCode,
              approvalLevelCode: appData.approvalLevelCode,
            },
            "Scholarship..ScholarshipApplicationApprovals",
            txn,
          );
        // Update pending levels //

        if (!updateCurrentLevel) {
          throw updateCurrentLevel;
        }

        const filterCurrentLevel = scholarshipFlowLevels.filter(
          (filterCurrentLevel) =>
            filterCurrentLevel.approvalLevelCode ===
              appData.approvalLevelCode &&
            filterCurrentLevel.status === "pending",
        );

        if (filterCurrentLevel.length > 0) {
          // Check if there is an existing pending //
          const filterPendings = scholarshipFlowLevels.filter(
            (filterPendings) =>
              Number(filterPendings.levelApproval) ===
                Number(filterCurrentLevel[0].levelApproval) &&
              filterPendings.approvalLevelCode !== appData.approvalLevelCode &&
              filterPendings.status === "pending",
          );
          // Check if there is an existing pending //

          if (filterPendings.length === 0) {
            // Get next level process //
            const filterNextLevel = scholarshipFlowLevels.filter(
              (filterNextLevel) =>
                Number(filterNextLevel.levelApproval) ===
                Number(filterCurrentLevel[0].levelApproval) + 1,
            );
            // Get next level process //

            // Insert next level process //
            if (filterNextLevel.length > 0) {
              for (const nextLevel of filterNextLevel) {
                await scholarshipModel.insertScholarshipApplication(
                  {
                    scholarshipCode: appData.scholarshipCode,
                    approvalLevelCode: nextLevel.approvalLevelCode,
                    status: "pending",
                  },
                  "Scholarship..ScholarshipApplicationApprovals",
                  txn,
                );
              }
            } else {
              await scholarshipModel.updateScholarshipApplication(
                {
                  status: "approved",
                },
                {
                  code: appData.scholarshipCode,
                },
                "Scholarship..ScholarshipApplications",
                txn,
              );
            }
            // Insert next level process //
          }
        }
      }

      return updateCurrentLevel;
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
  getScholarshipFlowApprovals,
  getRequirements,
  getScholarshipApplications,
  getApplications,
  getApplicationDetails,
  getScholarshipReceived,
  postScholarshipApproval,
};

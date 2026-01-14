/* eslint-disable no-console */
const util = require("../../../helpers/util.js");
const tools = require("../../../helpers/tools.js");
const sqlHelper = require("../../../helpers/sql.js");
const utilsHelpers = require("../helpers/utilsHelpers.js");

// MODELS //
const patientresultModel = require("../models/patientResultModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getPatientResult = async function (req, res) {
  if (util.empty(req.query.testOrderCode)) {
    return res.status(400).json({ error: "URL query is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { testOrderCode } = req.query;
      let conditions = "";
      let args = [];

      if (testOrderCode) {
        conditions = `and testOrderCode = ?`;
        args = [testOrderCode];
      }

      return await patientresultModel.selectPatientResults(
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

  return __handleTransactionResponse(returnValue, res);
};

const getPatientResultValueFile = async function (req, res) {
  if (util.empty(req.query.testComponentCode)) {
    return res.status(400).json({ error: "URL query is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { testComponentCode, resultId } = req.query;
      let conditions = "";
      let args = [];

      if (testComponentCode) {
        conditions = `and testComponentCode = ? and patientResultId = ?`;
        args = [testComponentCode, resultId];
      }

      const returnResultValueFiles =
        await patientresultModel.selectPatientResultValueFiles(
          conditions,
          args,
          {
            order: "",
            top: "",
          },
          txn,
        );

      if (returnResultValueFiles.length > 0) {
        return returnResultValueFiles[0];
      }

      return {
        fileType: "",
        fileValue: "",
      };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  // res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", returnValue.fileType);
  // res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(returnValue.fileValue); // Send raw binary
};

const postPatientResult = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      let returnVal = [];

      const patientResultResponseReturn = [];
      const patientResultValueResponseReturn = [];

      let currentWorkFlow = [];
      if (payload.length > 0) {
        const existTestResult = await patientresultModel.selectPatientResults(
          "and testOrderCode = ? and testCode = ?",
          [
            payload[0].patientResults.testOrderCode,
            payload[0].patientResults.testCode,
          ],
          {},
          txn,
        );

        const smsResultFormat = payload[0].patientResults.smsResultFormat;

        delete payload[0].patientResults.smsResultFormat;

        if (existTestResult.length === 0) {
          const patientResultInsertResponse =
            await patientresultModel.insertToTable(
              {
                ...payload[0].patientResults,
                ...payload[0].completionDetails,
                createdBy: util.currentUserToken(req).code,
                updatedBy: util.currentUserToken(req).code,
              },
              "UERMResults..PatientResults",
              txn,
            );

          if (!patientResultInsertResponse) {
            throw "Error inserting";
          }

          if (Object.keys(patientResultInsertResponse).length > 0) {
            for (const result of payload) {
              result.patientResultValues.patientResultId =
                patientResultInsertResponse.id;

              result.patientResultValues.value = result.hasFile
                ? `/patient-result-file?testComponentCode=${result.patientResultValues.testComponentCode}&resultId=${patientResultInsertResponse.id}`
                : result.patientResultValues.value;

              result.patientResultValues.createdBy =
                util.currentUserToken(req).code;
              result.patientResultValues.updatedBy =
                util.currentUserToken(req).code;

              const patientResultInsertValue =
                await patientresultModel.insertToTable(
                  result.patientResultValues,
                  "UERMResults..PatientResultValues",
                  txn,
                );

              patientResultValueResponseReturn.push(patientResultInsertValue);
            }

            patientResultResponseReturn.push(patientResultInsertResponse);
          }
        } else {
          const patientResultUpdateResponse =
            await patientresultModel.updateToTable(
              {
                status: payload[0].completeResult ? "complete" : "draft",
                ...payload[0].completionDetails,
                updatedBy: util.currentUserToken(req).code,
              },
              {
                testOrderCode: payload[0].patientResults.testOrderCode,
                testCode: payload[0].patientResults.testCode,
              },
              "UERMResults..PatientResults",
              txn,
            );

          if (!patientResultUpdateResponse) {
            throw "Error updating";
          }
          if (Object.keys(patientResultUpdateResponse).length > 0) {
            for (const result of payload) {
              result.patientResultValues.updatedBy =
                util.currentUserToken(req).code;

              result.patientResultValues.value = result.hasFile
                ? `/patient-result-file?testComponentCode=${result.patientResultValues.testComponentCode}&resultId=${patientResultUpdateResponse.id}`
                : result.patientResultValues.value;

              let patientUpdateResultValue =
                await patientresultModel.updateToTable(
                  result.patientResultValues,
                  {
                    patientResultId: patientResultUpdateResponse.id,
                    testComponentCode:
                      result.patientResultValues.testComponentCode,
                  },
                  "UERMResults..PatientResultValues",
                  txn,
                );

              if (patientUpdateResultValue === null) {
                result.patientResultValues.createdBy =
                  util.currentUserToken(req).code;
                result.patientResultValues.patientResultId =
                  patientResultUpdateResponse.id;
                patientUpdateResultValue =
                  await patientresultModel.insertToTable(
                    result.patientResultValues,
                    "UERMResults..PatientResultValues",
                    txn,
                  );
              }

              patientResultValueResponseReturn.push(patientUpdateResultValue);
            }

            patientResultResponseReturn.push(patientResultUpdateResponse);
          }
        }

        if (payload[0].completeResult) {
          const emailDetails = payload[0].emailDetails;

          const residents =
            emailDetails.ccEmails.length > 0
              ? emailDetails.ccEmails.filter(
                  (filterResidents) => filterResidents.department === undefined,
                )
              : [];

          const currentStepTestOrderWorkflow =
            await patientresultModel.updateToTable(
              {
                status: "completed",
                ...payload[0].completionDetails,
                residents:
                  residents.length > 0
                    ? residents.map((item) => item.code).join(", ")
                    : null,
                updatedBy: util.currentUserToken(req).code,
              },
              {
                testOrderCode: payload[0].patientResults.testOrderCode,
                stepId: payload[0].currentStepWorkflow.stepId,
              },
              "UERMResults..TestOrderWorkFlows",
              txn,
            );

          if (!currentStepTestOrderWorkflow) {
            console.log(payload);
            throw "Unable to complete result -- Test Order Workflow Issue";
          }

          // Notification //
          // console.log(payload);
          // console.log(emailDetails.ccEmails);

          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;

          const uniqueCCEmails = [
            ...new Map(
              emailDetails.ccEmails.map((item) => [item.code, item]),
            ).values(),
          ];

          // console.log(emailDetails.ccEmails);
          if (emailDetails.sendSMSResidents !== undefined) {
            if (uniqueCCEmails.length > 0) {
              uniqueCCEmails.forEach((list) => {
                const smsMessage = {
                  messageType: "sms",
                  destination: list.mobileNo.toString(), // LIVE DATA
                  // destination: "09053254071", // TEST DATA
                  app: "UERM eDiagnostics",
                  text: emailDetails.smsContent,
                };
                tools.sendSMSInsertDB(accessToken, smsMessage, false);
              });

              // // TEST DATA REMOVE AFTER PILOT //
              // const smsMessage = {
              //   messageType: "sms",
              //   // destination: list.mobileNo.toString(), // LIVE DATA
              //   destination: "09053254071", // TEST DATA
              //   app: "UERM eDiagnostics",
              //   text: emailDetails.smsContent,
              // };
              // tools.sendSMSInsertDB(accessToken, smsMessage, false);
              // // TEST DATA REMOVE AFTER PILOT //
            }
          }

          if (emailDetails.sendSMSConsultant !== undefined) {
            const smsMessage = {
              messageType: "sms",
              destination: emailDetails.consultantMobileNumber.toString(), // LIVE DATA
              // destination: "09053254071", // TEST DATA
              app: "UERM eDiagnostics",
              text: emailDetails.smsContent,
            };
            tools.sendSMSInsertDB(accessToken, smsMessage, false);
          }

          if (emailDetails.sendEmailConsultant !== undefined) {
            const ccEmail = uniqueCCEmails.map((mapCCEmail) => {
              return {
                name: mapCCEmail.fullName,
                email: mapCCEmail.uermEmail ?? mapCCEmail.email,
              };
            });

            // // Remove after testing //
            // utilsHelpers.sendEmail({
            //   // senderEmail: emailDetails.fromEmail, // LIVE DATA
            //   // email: emailDetails.toEmail, // LIVE DATA
            //   // cc: ccEmail, // LIVE DATA
            //   email: "gresolabernard@gmail.com", // TEST DATA
            //   senderEmail: "dev.it@uerm.edu.ph", // TEST DATA
            //   // cc: [{ email: emailDetails.ccEmail, name: emailDetails.ccName }], // TEST DATA
            //   cc: [],
            //   senderName: emailDetails.fromName,
            //   name: emailDetails.toName,
            //   subject: emailDetails.subject,
            //   header: "UERM eDiagnostics",
            //   content: emailDetails.emailContent,
            // });
            // // Remove after testing //

            utilsHelpers.sendEmail({
              senderEmail: emailDetails.fromEmail, // LIVE DATA
              email: emailDetails.toEmail, // LIVE DATA
              cc: ccEmail, // LIVE DATA
              // email: "gresolabernard@gmail.com",  // TEST DATA
              // senderEmail: "dev.it@uerm.edu.ph", // TEST DATA
              // cc: [{ email: emailDetails.ccEmail, name: emailDetails.ccName }], // TEST DATA
              senderName: emailDetails.fromName,
              name: emailDetails.toName,
              subject: emailDetails.subject,
              header: "UERM eDiagnostics",
              content: emailDetails.emailContent,
            });
          }
          // Notification //

          if (Object.keys(currentStepTestOrderWorkflow).length > 0) {
            if (payload[0].nextStepWorkflow !== "") {
              // Add checking if TestOrderWorkFlows already exists //
              // Add checking if TestOrderWorkFlows already exists //

              currentWorkFlow = await patientresultModel.insertToTable(
                {
                  testOrderCode: payload[0].patientResults.testOrderCode,
                  status: "pending",
                  stepId: payload[0].nextStepWorkflow.stepId,
                  consultantId:
                    payload[0].completionDetails.consultantId ?? null,
                  residents:
                    residents.length > 0
                      ? residents.map((item) => item.code).join(", ")
                      : null,
                  createdBy: util.currentUserToken(req).code,
                  updatedBy: util.currentUserToken(req).code,
                },
                "UERMResults..TestOrderWorkFlows",
                txn,
              );
            } else {
              const testOrder = await patientresultModel.updateToTable(
                {
                  releasedBy: util.currentUserToken(req).code,
                  status: "released",
                  dateTimeReleased: util.currentDateTime(),
                  updatedBy: util.currentUserToken(req).code,
                },
                {
                  code: payload[0].patientResults.testOrderCode,
                },
                "UERMResults..TestOrders",
                txn,
              );

              // Send SMS to patient //
              if (process.env.NODE_ENV !== "development") {
                const patientInfo = payload[0].patientInfo;
                if (
                  patientInfo.contactNumbers !== null &&
                  patientInfo.contactNumbers.includes(",")
                ) {
                  const contactNumbers = patientInfo.contactNumbers.split(",");
                  contactNumbers.forEach(async (element) => {
                    const smsMessage = {
                      messageType: "sms",
                      destination: element, // LIVE DATA
                      // destination: "09053254071", // TEST DATA
                      app: "UERM eDiagnostics",
                      text: smsResultFormat,
                    };
                    await tools.sendSMSInsertDB(accessToken, smsMessage, false);
                  });
                } else {
                  // LIVE //
                  const smsMessage = {
                    messageType: "sms",
                    // destination: element, // LIVE DATA
                    destination: patientInfo.contactNumbers, // TEST DATA
                    app: "UERM eDiagnostics",
                    text: smsResultFormat,
                  };
                  console.log(smsMessage);
                  const smsInsertDB = await tools.sendSMSInsertDB(
                    accessToken,
                    smsMessage,
                    false,
                  );
                  console.log(smsInsertDB);
                  // LIVE //

                  // const contactNumbers = ["09053254071", "09156555969"];
                  // contactNumbers.forEach(async (element) => {
                  //   const smsMessage = {
                  //     messageType: "sms",
                  //     destination: element, // LIVE DATA
                  //     // destination: "09156555969", // TEST DATA
                  //     app: "UERM eDiagnostics",
                  //     text: smsResultFormat,
                  //   };
                  //   await tools.sendSMSInsertDB(accessToken, smsMessage, false);
                  // });
                }
              }
              // Send SMS to patient //

              if (!testOrder) {
                throw "Test Order failed to update";
              }
            }
          }
        } else {
          currentWorkFlow = payload[0].currentStepWorkflow;
        }

        // console.log(patientResultValueResponseReturn, "return");

        returnVal = {
          result:
            patientResultResponseReturn.length === 1
              ? patientResultResponseReturn[0]
              : patientResultResponseReturn,
          resultValues: patientResultValueResponseReturn,
          currentWorkflow: currentWorkFlow,
        };
      }

      return returnVal;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  // const returnValue = true;

  return __handleTransactionResponse(returnValue, res);
};

const postPatientResultFile = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;

      const patientResultFile =
        await patientresultModel.selectPatientResultValueFiles(
          `and patientResultValueId = ? and patientResultId = ?`,
          [payload.patientResultValueId, payload.patientResultId],
          {},
          txn,
        );

      let resultFilePayload = {};
      let returnValue = {};

      if (Object.keys(req.files).length > 0) {
        for (const file in req.files) {
          resultFilePayload = {
            patientResultValueId: payload.patientResultValueId,
            patientResultId: payload.patientResultId,
            testComponentCode: payload.testComponentCode,
            fileName: req.files[file].name,
            fileType: req.files[file].mimetype,
            fileSize: req.files[file].size,
            fileValue: req.files[file].data,
            createdBy: util.currentUserToken(req).code,
            updatedBy: util.currentUserToken(req).code,
          };
        }
      }

      if (patientResultFile.length > 0) {
        // Existing
        returnValue = await patientresultModel.updateToTableWithColumns(
          resultFilePayload,
          {
            patientResultValueId: payload.patientResultValueId,
            patientResultId: payload.patientResultId,
          },
          "UERMResults..PatientResultValueFiles",
          txn,
          [
            "patientResultValueId",
            "patientResultId",
            "fileName",
            "fileType",
            "fileSize",
            "createdBy",
            "updatedBy",
            "dateTimeCreated",
            "dateTimeUpdated",
          ],
        );
      } else {
        // New
        returnValue = await patientresultModel.insertToTableWithColumns(
          resultFilePayload,
          "UERMResults..PatientResultValueFiles",
          txn,
          [
            "patientResultValueId",
            "patientResultId",
            "fileName",
            "fileType",
            "fileSize",
            "createdBy",
            "updatedBy",
            "dateTimeCreated",
            "dateTimeUpdated",
          ],
        );
      }

      return returnValue;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const sendNotification = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  // console.log(req.body);
  // return { success: true };

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;

      const emailDetails = payload[0].emailDetails;
      const tokenBearerSMS = await util.getTokenSMS();
      const accessToken = tokenBearerSMS.accessToken;

      const uniqueCCEmails = [
        ...new Map(
          emailDetails.ccEmails.map((item) => [item.code, item]),
        ).values(),
      ];

      // return { succes: true };
      // console.log(emailDetails.ccEmails);
      if (emailDetails.sendSMSResidents !== undefined) {
        if (uniqueCCEmails.length > 0) {
          uniqueCCEmails.forEach((list) => {
            const smsMessage = {
              messageType: "sms",
              destination: list.mobileNo.toString(), // LIVE DATA
              // destination: "09053254071", // TEST DATA
              app: "UERM eDiagnostics",
              text: emailDetails.smsContent,
            };
            tools.sendSMSInsertDB(accessToken, smsMessage, false);
          });

          // // TEST DATA REMOVE AFTER PILOT //
          // const smsMessage = {
          //   messageType: "sms",
          //   // destination: list.mobileNo.toString(), // LIVE DATA
          //   destination: "09053254071", // TEST DATA
          //   app: "UERM eDiagnostics",
          //   text: emailDetails.smsContent,
          // };
          // tools.sendSMSInsertDB(accessToken, smsMessage, false);
          // // TEST DATA REMOVE AFTER PILOT //
        }
      }

      if (emailDetails.sendSMSConsultant !== undefined) {
        const smsMessage = {
          messageType: "sms",
          destination: emailDetails.consultantMobileNumber.toString(), // LIVE DATA
          // destination: "09053254071", // TEST DATA
          app: "UERM eDiagnostics",
          text: emailDetails.smsContent,
        };
        tools.sendSMSInsertDB(accessToken, smsMessage, false);
      }

      if (emailDetails.sendEmailConsultant !== undefined) {
        const ccEmail = uniqueCCEmails.map((mapCCEmail) => {
          return {
            name: mapCCEmail.fullName,
            email: mapCCEmail.uermEmail ?? mapCCEmail.email,
          };
        });
        console.log(ccEmail);

        // Remove after testing //
        utilsHelpers.sendEmail({
          // senderEmail: emailDetails.fromEmail, // LIVE DATA
          // email: emailDetails.toEmail, // LIVE DATA
          // cc: ccEmail, // LIVE DATA
          email: "gresolabernard@gmail.com", // TEST DATA
          senderEmail: "dev.it@uerm.edu.ph", // TEST DATA
          // cc: [{ email: emailDetails.ccEmail, name: emailDetails.ccName }], // TEST DATA
          cc: [],
          senderName: emailDetails.fromName,
          name: emailDetails.toName,
          subject: emailDetails.subject,
          header: "UERM eDiagnostics",
          content: emailDetails.emailContent,
        });
        // Remove after testing //

        utilsHelpers.sendEmail({
          senderEmail: emailDetails.fromEmail, // LIVE DATA
          email: emailDetails.toEmail, // LIVE DATA
          cc: ccEmail, // LIVE DATA
          // email: "gresolabernard@gmail.com", // TEST DATA
          // senderEmail: "dev.it@uerm.edu.ph", // TEST DATA
          // cc: [{ email: "btgresola@uerm.edu.ph", name: "Bernard Test" }], // TEST DATA
          senderName: emailDetails.fromName,
          name: emailDetails.toName,
          subject: emailDetails.subject,
          header: "UERM eDiagnostics",
          content: emailDetails.emailContent,
        });
      }
      // Notification //

      return { success: true };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getPatientResult,
  getPatientResultValueFile,
  postPatientResult,
  postPatientResultFile,
  sendNotification,
};

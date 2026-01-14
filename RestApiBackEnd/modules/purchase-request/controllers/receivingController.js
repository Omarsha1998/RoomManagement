/* eslint-disable require-await */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const sqlHelper = require("../../../helpers/sql");
const util = require("../../../helpers/util");
// MODELS //
const receivingDetails = require("../models/receivingDetails.js");
// MODELS //

const getReceivingDetails = async function (req, res) {
  if (util.empty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let args = [1, req.query.fromDate, req.query.toDate];
      let conditions = `and active = ? and convert(date, dateTimeCreated) between ? and ?`;
      const top = {};
      const order = "";

      if (req.query.poNumber) {
        args = [1, req.query.poNumber];
        conditions = `and active = ? and poNumber = ?`;
      }

      return await receivingDetails.selectReceivingDetails(
        conditions,
        args,
        {
          top: top,
          order: order,
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

const getReceivingDetailItems = async function (req, res) {
  if (util.empty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const args = [1, req.query.receivingDetailId];
      const conditions = `and a.active = ? and receivingDetailId = ?`;
      const top = {};
      const order = "";

      return await receivingDetails.selectReceivingDetailItems(
        conditions,
        args,
        {
          top: top,
          order: order,
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

const getReceivingDetailDocs = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const code = req.params.code;
      let conditions = "";
      let args = [];

      if (code) {
        conditions = `and code = ?`;
        args = [code];
      }

      const returnDocs = await receivingDetails.selectReceivingDetailDocs(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );

      if (returnDocs.length > 0) {
        return returnDocs[0];
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

// const getPatientResultValueFile = async function (req, res) {
//   if (util.empty(req.query.testComponentCode)) {
//     return res.status(400).json({ error: "URL query is required." });
//   }

//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const { testComponentCode, resultId } = req.query;
//       let conditions = "";
//       let args = [];

//       if (testComponentCode) {
//         conditions = `and testComponentCode = ? and patientResultId = ?`;
//         args = [testComponentCode, resultId];
//       }

//       const returnResultValueFiles =
//         await patientresultModel.selectPatientResultValueFiles(
//           conditions,
//           args,
//           {
//             order: "",
//             top: "",
//           },
//           txn,
//         );

//       if (returnResultValueFiles.length > 0) {
//         return returnResultValueFiles[0];
//       }

//       return {
//         fileType: "",
//         fileValue: "",
//       };
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   // res.setHeader("Cache-Control", "no-store");
//   res.setHeader("Content-Type", returnValue.fileType);
//   // res.setHeader("Cache-Control", "public, max-age=3600");
//   res.send(returnValue.fileValue); // Send raw binary
// };

const postReceivingDetails = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;

      const receivingDetailsResponse =
        await receivingDetails.selectReceivingDetails(
          `and poNumber = ?`,
          [payload.poNumber],
          {},
          txn,
        );

      let returnVal = receivingDetailsResponse;
      if (receivingDetailsResponse.length === 0) {
        const receivingDetailsInsert =
          await receivingDetails.insertReceivingDetails({
            poNumber: payload.poNumber,
            description: payload.description,
            createdBy: util.currentUserToken(req).code,
            updatedBy: util.currentUserToken(req).code,
          });

        returnVal = receivingDetailsInsert;

        if (Object.keys(receivingDetailsInsert).length > 0) {
          const receiveItems =
            await receivingDetails.insertReceivingDetailItems(
              {
                receivingDetailId: receivingDetailsInsert.id,
                rrNumber: payload.rrNumber,
                externalNumber: payload.externalNumber,
                dateTimeReceived: payload.dateTimeReceived,
                remarks: payload.remarks,
                createdBy: util.currentUserToken(req).code,
                updatedBy: util.currentUserToken(req).code,
              },
              txn,
            );

          if (Object.keys(req.files).length > 0) {
            for (const file in req.files) {
              const code = await sqlHelper.generateDynamicUniqueCode(
                "UERMINV..ReceivingDetailDocuments",
                "RR",
                5,
                "code",
                false,
                txn,
              );

              await receivingDetails.insertReceivingDetailDocs(
                {
                  code: code,
                  receivingDetailItemId: receiveItems.id,
                  fileName: req.files[file].name,
                  fileType: req.files[file].mimetype,
                  fileSize: req.files[file].size,
                  fileValue: req.files[file].data,
                  createdBy: util.currentUserToken(req).code,
                  updatedBy: util.currentUserToken(req).code,
                },
                txn,
              );

              await receivingDetails.updateReceivingDetailItems(
                {
                  fileUrl: `/receiving-docs/${code}`,
                  updatedBy: util.currentUserToken(req).code,
                },
                {
                  id: receiveItems.id,
                },
                txn,
              );
            }
          }
        }
      } else {
        const receiveItems = await receivingDetails.insertReceivingDetailItems(
          {
            receivingDetailId: receivingDetailsResponse[0].id,
            rrNumber: payload.rrNumber,
            externalNumber: payload.externalNumber,
            dateTimeReceived: payload.dateTimeReceived,
            remarks: payload.remarks,
            createdBy: util.currentUserToken(req).code,
            updatedBy: util.currentUserToken(req).code,
          },
          txn,
        );

        if (Object.keys(req.files).length > 0) {
          for (const file in req.files) {
            const code = await sqlHelper.generateDynamicUniqueCode(
              "UERMINV..ReceivingDetailDocuments",
              "RR",
              5,
              "code",
              false,
              txn,
            );

            await receivingDetails.insertReceivingDetailDocs(
              {
                code: code,
                receivingDetailItemId: receiveItems.id,
                fileName: req.files[file].name,
                fileType: req.files[file].mimetype,
                fileSize: req.files[file].size,
                fileValue: req.files[file].data,
                createdBy: util.currentUserToken(req).code,
                updatedBy: util.currentUserToken(req).code,
              },
              txn,
            );

            await receivingDetails.updateReceivingDetailItems(
              {
                fileUrl: `/receiving-docs/${code}`,
                updatedBy: util.currentUserToken(req).code,
              },
              {
                id: receiveItems.id,
              },
              txn,
            );
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

const putReceivingDetailItems = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const payload = req.body;
    try {
      const id = payload.id;
      delete payload.id;
      payload.updatedBy = util.currentUserToken(req).code;
      await receivingDetails.updateReceivingDetailDocs(
        payload,
        {
          receivingDetailItemId: id,
        },
        txn,
      );
      return await receivingDetails.updateReceivingDetailItems(
        payload,
        {
          id: id,
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

const putReceivingDetail = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const payload = req.body;
    try {
      const id = payload.id;
      delete payload.id;
      payload.updatedBy = util.currentUserToken(req).code;

      let receiveDetails = {};
      if (req.files === null) {
        receiveDetails = await receivingDetails.updateReceivingDetails(
          payload,
          {
            id: id,
          },
          txn,
        );
      } else {
        receiveDetails = await receivingDetails.updateReceivingDetails(
          {
            poNumber: payload.poNumber,
            description: payload.description,
          },
          {
            id: id,
          },
          txn,
        );
        const receiveItems = await receivingDetails.insertReceivingDetailItems(
          {
            receivingDetailId: id,
            rrNumber: payload.rrNumber,
            externalNumber: payload.externalNumber,
            dateTimeReceived: payload.dateTimeReceived,
            remarks: payload.remarks,
            createdBy: util.currentUserToken(req).code,
            updatedBy: util.currentUserToken(req).code,
          },
          txn,
        );
        for (const file in req.files) {
          const code = await sqlHelper.generateDynamicUniqueCode(
            "UERMINV..ReceivingDetailDocuments",
            "RR",
            5,
            "code",
            false,
            txn,
          );

          await receivingDetails.insertReceivingDetailDocs(
            {
              code: code,
              receivingDetailItemId: receiveItems.id,
              fileName: req.files[file].name,
              fileType: req.files[file].mimetype,
              fileSize: req.files[file].size,
              fileValue: req.files[file].data,
              createdBy: util.currentUserToken(req).code,
              updatedBy: util.currentUserToken(req).code,
            },
            txn,
          );

          await receivingDetails.updateReceivingDetailItems(
            {
              fileUrl: `/receiving-docs/${code}`,
            },
            {
              id: receiveItems.id,
            },
            txn,
          );
        }
      }

      return receiveDetails;
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
  getReceivingDetails,
  getReceivingDetailDocs,
  getReceivingDetailItems,
  postReceivingDetails,
  putReceivingDetailItems,
  putReceivingDetail,
};

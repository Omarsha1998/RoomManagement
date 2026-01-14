/* eslint-disable no-console */
const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// // MODELS //
const testOrderModel = require("../models/testOrderModel.js");
const testWorkflowModel = require("../models/testWorkflowModel.js");
// // MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getTestOrders = async function (req, res) {
  if (util.empty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const { deptCode, fromDate, toDate, dateFilter, processing } = req.query;
      let conditions = "";
      let args = [];
      let testOrders = [];
      let orderCondition = {};
      if (deptCode) {
        // if (processing) {
        //   conditions = `and convert(date, t0w.dateTimeUpdated) between ? and ?
        //     and t.DepartmentCode = ?`;
        //   args = [fromDate, toDate, deptCode];
        //   orderCondition = {
        //     order: "c.patientType, t0w.dateTimeUpdated asc",
        //     top: "",
        //   };
        // } else {
        //   conditions = `
        // and convert(date, cm.CHARGEDATETIME) between ? and ?
        // and t.DepartmentCode = ?`;
        //   args = [fromDate, toDate, deptCode];

        //   orderCondition = {
        //     order: "c.patientType, cm.chargeDateTime asc",
        //     top: "",
        //   };
        // }

        conditions = `
            and convert(date, ${dateFilter}) between ? and ?
            and t.DepartmentCode = ?`;
        // conditions = `
        //     and ${dateFilter} >= ? and ${dateFilter} <= ?
        //     and t.DepartmentCode = ?`;
        args = [fromDate, toDate, deptCode];
        orderCondition = {
          order: `c.patientType, ${dateFilter} asc`,
          top: "",
          processing: processing,
        };

        if (processing) {
          testOrders = await testOrderModel.selectTestOrderProcessing(
            conditions,
            args,
            orderCondition,
            txn,
          );
        } else {
          testOrders = await testOrderModel.selectTestOrders(
            conditions,
            args,
            orderCondition,
            txn,
          );
        }
      }

      return testOrders;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const postTestOrders = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const {
        patientNo,
        chargeslipNo,
        deptCode,
        transferRemarks,
        testCode,
        chargeId,
        shortDeptCode,
        versionSetId,
        resultComponentTemplate,
      } = req.body;

      const payloadToInsert = {
        code: await sqlHelper.generateDynamicUniqueCode(
          "UERMResults..TestOrders",
          shortDeptCode,
          4,
          "code",
          false,
          txn,
        ),
        patientNo: patientNo,
        chargeslipNo: chargeslipNo,
        chargeId: chargeId,
        departmentCode: deptCode,
        testCode: testCode,
        transferRemarks: transferRemarks,
        status: "transferred",
        versionSetId: versionSetId,
        resultComponent: resultComponentTemplate,
        createdBy: util.currentUserToken(req).code,
        updatedBy: util.currentUserToken(req).code,
      };

      const testOrder = await testOrderModel.insertCharge(
        payloadToInsert,
        "UERMResults..TestOrders",
        txn,
      );

      let testOrderWorkFlow = {};
      if (Object.keys(testOrder).length > 0) {
        const activeWorkFlow = await testWorkflowModel.selectTestWorkFlows(
          `and a.testCode = ?`,
          [testCode],
          {
            order: "b.stepNumber asc",
            top: "",
          },
          txn,
        );

        // console.log(activeWorkFlow);

        if (activeWorkFlow.length > 0) {
          const filterFirstActiveWorkFlow = activeWorkFlow.filter(
            (filterActiveWorkFlow) => filterActiveWorkFlow.stepNumber === 1,
          );
          const testOrderWorkFlowResponse = await testOrderModel.insertToTable(
            {
              testOrderCode: testOrder.code,
              stepId:
                filterFirstActiveWorkFlow.length > 0
                  ? filterFirstActiveWorkFlow[0].stepId
                  : null,
              status: "pending",
              createdBy: util.currentUserToken(req).code,
              updatedBy: util.currentUserToken(req).code,
            },
            "UERMResults..TestOrderWorkFlows",
            txn,
          );

          if (!testOrderWorkFlowResponse) {
            throw "Error inserting TestOrderWorkFlow";
          }

          testOrderWorkFlow = testOrderWorkFlowResponse;
        }
      }

      return {
        testOrder: testOrder,
        testOrderWorkFlow: testOrderWorkFlow,
      };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getTestOrderWorkFlows = async function (req, res) {
  if (util.empty(req.query)) {
    return res.status(400).json({ error: "URL query is required." });
  }

  const returnValue = await sqlHelper.transact(async (txn) => {
    const { code } = req.query;
    const conditions = "and a.code = ?";
    const args = [code];
    const options = {
      order: "c.stepNumber ",
      top: "",
    };

    return await testOrderModel.selectTestOrderWorkflows(
      conditions,
      args,
      options,
      txn,
    );
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getTestOrders,
  getTestOrderWorkFlows,
  postTestOrders,
};

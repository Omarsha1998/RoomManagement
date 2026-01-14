const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const testModel = require("../models/testModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getTestsAndComponents = async function (req, res) {
  const { testCode, gender, birthdate } = req.query;
  if (util.empty(testCode))
    return res.status(400).json({ error: "Test code is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const ageDays = await util.getDaysFromBirthdate(birthdate);

    const tests = await testModel.selectTestComponents(
      ` and (? BETWEEN d.AgeMinDays AND d.AgeMaxDays OR (d.AgeMinDays IS NULL AND d.AgeMaxDays IS NULL))
        AND (? = d.gender OR d.gender IS NULL)
      `,
      "and a.code = ?",
      [ageDays, gender, testCode],
      {
        order: "b.sequence",
        top: "",
      },
      txn,
    );

    return tests;
  });

  return __handleTransactionResponse(returnValue, res);
};

const getTestFlaggings = async function (req, res) {
  const { testCode, gender, birthdate } = req.query;
  if (util.empty(testCode))
    return res.status(400).json({ error: "Test code is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    const ageDays = await util.getDaysFromBirthdate(birthdate);

    const testFlaggings = await testModel.selectTestComponentFlagging(
      ` and (? BETWEEN b.AgeMinDays AND b.AgeMaxDays OR (b.AgeMinDays IS NULL AND b.AgeMaxDays IS NULL))
        AND (? = b.gender OR b.gender IS NULL) and a.testCode = ?
      `,
      [ageDays, gender, testCode],
      {
        order: "",
        top: "",
      },
      txn,
    );

    return testFlaggings;
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getTestsAndComponents,
  getTestFlaggings,
};

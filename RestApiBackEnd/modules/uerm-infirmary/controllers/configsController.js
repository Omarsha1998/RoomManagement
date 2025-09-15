const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const innerUtil = require("../helpers/util.js");

// MODELS //
const configsModel = require("../models/configsModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getFieldGroups = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = 1";
      const args = [];

      const fieldGroups = await configsModel.selectFieldGroups(
        conditions,
        args,
        {
          order: "sequence asc",
          top: "",
        },
        txn,
      );

      const fieldGroupsGroupedConditions =
        innerUtil.groupFieldGroupUserConditions(fieldGroups);

      const fieldGroupsGrouped = util.groupBy(
        fieldGroupsGroupedConditions,
        "fieldGroupTypeCode",
      );

      const fieldGroupsHashMap = util.buildHashTable(
        fieldGroupsGroupedConditions,
        "code",
      );

      return {
        raw: fieldGroupsGroupedConditions,
        grouped: fieldGroupsGrouped,
        hashMap: fieldGroupsHashMap,
      };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

const getFields = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const conditions = "and active = 1";
      const args = [];

      const fields = await configsModel.selectFields(
        conditions,
        args,
        {
          order: "sequence asc",
          top: "",
        },
        txn,
      );

      const fieldUserConditions =
        innerUtil.groupFieldsUserConditionsAndOptions(fields);

      const fieldGroupsGrouped = util.groupBy(
        fieldUserConditions,
        "fieldGroupCode",
      );

      const fieldsHashMap = util.buildHashTable(fieldUserConditions, "code");

      return {
        raw: fieldUserConditions,
        grouped: fieldGroupsGrouped,
        hashMap: fieldsHashMap,
      };
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getFieldGroups,
  getFields,
};

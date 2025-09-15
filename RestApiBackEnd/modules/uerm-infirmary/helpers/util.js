const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// MODELS //
const patientsModel = require("../models/patientsModel.js");
// MODELS //

const groupFieldGroupUserConditions = (
  arr,
  itemCode = "code",
  arrKey = "userCode",
) => {
  const result = [];

  // Helper map to store merged user codes
  const mergedData = {};

  arr.forEach((item) => {
    const key = item[itemCode];

    // If the code already exists, add the userCode to the existing array
    if (mergedData[key]) {
      if (item[arrKey]) {
        mergedData[key][arrKey].push(item[arrKey]);
      }
    } else {
      // Initialize the object and userCode as an array
      mergedData[key] = {
        ...item,
        [arrKey]: item[arrKey] ? [item[arrKey]] : [],
      };
    }
  });

  // Convert the merged data back to an array
  for (const key in mergedData) {
    result.push(mergedData[key]);
  }

  return result;
};

const groupFieldsUserConditionsAndOptions = (inputArray) => {
  const result = [];

  inputArray.forEach((item) => {
    // Find if the code already exists in the result array
    let existingField = result.find((field) => field.code === item.code);

    if (item.type === "selectfield") {
      // If it's a select field and doesn't exist, create the initial structure
      if (!existingField) {
        existingField = {
          ...item,
          userTypeConditions: [],
          fieldOptions: [],
        };
        delete existingField.optionLabel;
        delete existingField.optionValue;
        delete existingField.optionSequence;
        result.push(existingField);
      }
      // Add the options
      existingField.fieldOptions.push({
        label: item.optionLabel,
        value: item.optionValue,
        sequence: item.optionSequence,
      });
    } else {
      // For other fields, just push them into the result array
      result.push({
        ...item,
        userTypeConditions: item.userTypeConditions
          ? [item.userTypeConditions]
          : [],
      });
    }
  });

  return result;
};

const postLogs = async (
  payload,
  referenceTable,
  table,
  conditions,
  args,
  indicatorColumn,
  txn,
) => {
  try {
    const refTable = await sqlHelper.query(
      `select 
        ${indicatorColumn} 
      from ${referenceTable} 
      where 1=1 ${conditions}`,
      args,
      txn,
    );

    if (refTable.length > 0) {
      if (payload[indicatorColumn] !== refTable[0][indicatorColumn]) {
        return await patientsModel.insertEncounterData(
          payload,
          table,
          false,
          "",
          "",
          txn,
        );
      } else {
        return true;
      }
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  groupFieldGroupUserConditions,
  groupFieldsUserConditionsAndOptions,
  postLogs,
};

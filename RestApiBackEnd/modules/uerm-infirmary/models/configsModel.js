const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectFieldGroups = async function (conditions, args, options, txn) {
  const fieldGroups = await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			code,
      name,
      description,
      sequence,
      type,
      printout,
      component,
      historicalComponent,
      active,
      userCode,
      dateTimeCreated,
      dateTimeUpdated
    FROM Infirmary..vw_InfFieldGroups
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  fieldGroups.forEach((list) => {
    list.fieldGroupType = list.type === 1 ? "ENCOUNTER NOTES" : "GENERAL NOTES";
    list.fieldGroupTypeCode =
      list.type === 1 ? "encounterNotes" : "generalNotes";
  });

  return fieldGroups;
};

const selectFields = async function (conditions, args, options, txn) {
  const fields = await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			code,
      name,
      label,
      type,
      fieldGroupCode,
      required,
      requiredMessage,
      sequence,
      active,
      dateTimeCreated,
      dateTimeUpdated,
      remarks,
      role userTypeConditions,
      optionLabel,
      optionValue,
      optionSequence
    FROM Infirmary..vw_InfFields
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );

  return fields;
};

module.exports = {
  selectFieldGroups,
  selectFields,
};

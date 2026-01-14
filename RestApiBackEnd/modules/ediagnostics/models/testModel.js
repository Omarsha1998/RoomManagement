/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectTestComponents = async function (
  joinCondition,
  conditions,
  args,
  options,
  txn,
) {
  try {
    const testComponents = await sqlHelper.query(
      `select 
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.code testCode, 
        a.name, 
        a.departmentCode, 
        a.component, 
        a.alternativeTestName,
        a.resultComponent, 
        a.smsResultFormat,
        b.code testComponentCode, 
        b.name testComponentName,  
        b.sequence, 
        b.groupTitle, 
        b.inputType, 
        b.versionSetId, 
        b.defaultValue,
        b.applicableChargeId,
        b.options,
        b.required,
        b.allowPrintout, 
        b.showName,
        c.headerHtml,
        c.contentHtml,
        c.footerHtml,
        d.id referenceRangeId,
        d.ageMinDays,
        d.ageMaxDays,
        d.normalMin,
        d.normalMax,
        d.unit,
        b.active, 
        b.dateTimeCreated, 
        b.dateTimeUpdated 
      from 
        UERMResults..Tests a 
        join UERMResults..TestComponents b on b.TestCode = a.Code 
        left join UERMResults..TestTemplates c on c.TestCode = a.code and c.active = 1
        left join UERMResults..TestComponentReferenceRanges d on d.TestComponentId = b.id 
        ${joinCondition}
      where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    return testComponents;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectTestComponentFlagging = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const testComponentFlagging = await sqlHelper.query(
      `select 
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.id,
        a.code,
        a.name,
        a.testCode,
        a.sequence,
        b.gender,
        b.normalMin,
        b.normalMax,
        c.minValue,
        c.maxValue,
        comparisonOperator,
        c.flagType,
        c.label,
        c.createdBy,
        c.updatedBy,
        c.dateTimeCreated,
        c.dateTimeUpdated
      from 
      UERMResults..TestComponents a 
      join UERMResults..TestComponentReferenceRanges b on b.TestComponentId = a.Id and b.active = 1
      join UERMResults..TestComponentFlagging c on c.ComponentReferenceRangeId = b.id and c.active = 1
      where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    return testComponentFlagging;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectTestComponents,
  selectTestComponentFlagging,
};

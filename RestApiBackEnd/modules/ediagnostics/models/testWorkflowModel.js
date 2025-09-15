/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectTestWorkFlows = async function (conditions, args, options, txn) {
  try {
    const testWorkflows = await sqlHelper.query(
      `select 
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.testCode, 
        a.description, 
        a.withManualVerifier,
        a.withManualValidator,
        a.withManualConsultant,
        b.id stepId,
        b.stepNumber, 
        b.accessRoleModule, 
        b.isFinalStep, 
        b.withVerifier, 
        b.withValidator, 
        b.withConsultant, 
        b.allowEdit, 
        b.allowPrint,
        a.active, 
        a.dateTimeCreated, 
        a.dateTimeUpdated, 
        a.remarks  
      from 
        UERMResults..TestWorkFlows a 
        join UERMResults..TestWorkflowSteps b on b.WorkFlowId = a.Id 
        and b.active = 1 
      where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    return testWorkflows;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectTestWorkFlows,
};

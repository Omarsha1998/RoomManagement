/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectCharges = async function (conditions, args, options, txn) {
  try {
    const charges = await sqlHelper.query(
      `select 
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
	    c.caseNo, 
      c.patientNo, 
      c.fullName, 
      c.firstName, 
      c.lastName, 
      c.middleName, 
      c.gender, 
      c.birthdate, 
      cm.chargeslipNo, 
      cd.charge_id chargeId, 
      tm.testCode, 
      t.name testName, 
      t.alternativeTestName,
      t.departmentCode deptCode, 
      t.component, 
      c.chiefComplaint, 
      c.patientType, 
      c.dateTimeAdmitted, 
      -- d.name requestingPhysician, 
      -- cm.dr_code requestingPhysicianId, 
      d.ehr_code requestingPhysicianId, 
      ward = CASE WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END WHEN c.patientType = 'OPD' THEN CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY' ELSE 'OPD' END ELSE (
        SELECT 
          ISNULL(B.[DESCRIPTION], 'N/A') 
        FROM 
          UERMMMC..SECTIONS B WITH(NOLOCK) 
        WHERE 
          B.CODE = r.UNIT
      ) END, 
      wardCode = CASE WHEN c.patientType = 'OPD' THEN 'OPD' WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END ELSE r.unit END, 
      room = CASE WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END WHEN c.patientType = 'OPD' THEN CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY' ELSE 'OPD' END ELSE c.lastRoom END, 
      cm.chargeDateTime dateTimeCharged, 
      cd.description chargedProcedure, 
      t0.code testOrderCode, 
      t0.createdBy transferredBy, 
      t0.scheduledBy, 
      t0.releasedby, 
      t0.resultComponent, 
      t.resultComponent resultComponentTemplate, 
      v.id versionSetId, 
      case when t0.status is null then 'PENDING' else t0.status end status, 
      t0.dateTimeCreated dateTimeTransferred, 
      t0.dateTimeScheduled, 
      t0.dateTimeReleased 
    from 
      UERMMMC..vw_EncounterCases c 
      join UERMMMC..Charges_Main cm on c.caseNo = cm.caseNo 
      and CANCELED = 'N' 
      join UERMMMC..Charges_Details cd on cm.chargeslipNo = cd.chargeslipNo 
      join UERMMMC..Doctors d on cm.dr_code = d.CODE 
      join UERMResults..TestMappings tm on cd.charge_id = tm.ChargeId 
      join UERMResults..Tests t on tm.TestCode = t.Code 
      left join UERMResults..VersionSets v on v.TestCode = t.Code 
      and v.active = 1 
      left join UERMMMC..rooms r on r.ROOMNO = c.lastRoom 
      left join UERMResults..TestOrders t0 on cm.chargeSlipNo = t0.chargeSlipNo 
      and t0.chargeId = cd.CHARGE_ID 
    where 
      1 = 1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    for (const list of charges) {
      list.birthdate = util.formatDate2({
        date: list.birthdate,
        dateOnly: true,
      });

      list.dateTimeCharged = util.formatDate2({ date: list.dateTimeCharged });
      list.dateTimeAdmitted = util.formatDate2({ date: list.dateTimeAdmitted });

      if (!util.empty(list.dateTimeTransferred)) {
        list.dateTimeTransferred = util.formatDate2({
          date: list.dateTimeTransferred,
        });
      }

      if (!util.empty(list.dateTimeScheduled)) {
        list.dateTimeScheduled = util.formatDate2({
          date: list.dateTimeScheduled,
        });
      }

      if (!util.empty(list.dateTimeReleased)) {
        list.dateTimeReleased = util.formatDate2({
          date: list.dateTimeReleased,
        });
      }

      if (
        list.ward === "OPD" ||
        list.ward === "ER" ||
        list.ward === "OPD-CHARITY"
      ) {
        list.wardRoom = list.ward;
      } else {
        list.wardRoom = `${list.ward} - ${list.room}`;
      }
    }

    return charges;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectTestOrders = async function (conditions, args, options, txn) {
  try {
    const charges = await sqlHelper.query(
      `select 
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
	    c.caseNo, 
      c.patientNo, 
      c.fullName, 
      c.firstName, 
      c.lastName, 
      c.middleName, 
      c.gender, 
      c.birthdate, 
      c.phoneNumber,
      c.mobileNumber,
      c.email,
      cm.chargeslipNo, 
      cd.charge_id chargeId, 
      tm.testCode,
      tm.exceptionComponent,
      tm.exceptionMethod, 
      t.name testName, 
      t.alternativeTestName,
      t.departmentCode deptCode, 
      t.component, 
      c.chiefComplaint, 
      c.patientType, 
      c.dateTimeAdmitted, 
      -- cm.dr_code requestingPhysicianId,
	    (select ehr_code from UERMMMC..Doctors where code = cm.dr_code) requestingPhysicianId,
      ward = CASE WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END WHEN c.patientType = 'OPD' THEN CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY' ELSE 'OPD' END ELSE (
        SELECT 
          ISNULL(B.[DESCRIPTION], 'N/A') 
        FROM 
          UERMMMC..SECTIONS B WITH(NOLOCK) 
        WHERE 
          B.CODE = r.UNIT
      ) END, 
      wardCode = CASE WHEN c.patientType = 'OPD' THEN 'OPD' WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END ELSE r.unit END, 
      room = CASE WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END WHEN c.patientType = 'OPD' THEN CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY' ELSE 'OPD' END ELSE c.lastRoom END, 
      cm.chargeDateTime dateTimeCharged, 
      cd.description chargedProcedure, 
      t0.code testOrderCode, 
      t0.createdBy transferredBy, 
      t0.scheduledBy, 
      t0.releasedby, 
      t0.resultComponent, 
      t.resultComponent resultComponentTemplate, 
      t0w.status testOrderWorkFlowStatus,
      t0w.isProxy,
      t0w.consultantId,
      t0w.residents,
      t0w.dateTimeCreated testOrderWorkFlowDateTimeCreated,
      t0w.dateTimeUpdated testOrderWorkFlowDateTimeUpdated,
      t0w.updatedBy testOrderWorkFlowProcessedBy,
      twfs.stepNumber,
      twfs.accessRoleModule,
      twfs.isFinalStep,
      twfs.withVerifier,
      twfs.withValidator,
      twfs.withConsultant,
      twfs.withResidents,
      twfs.allowEdit,
      twfs.patientAssignment,
      twfs.sendSMSConsultant,
      twfs.sendEmailConsultant,
      twfs.sendSMSResidents,
      twfs.sendEmailResidents,
      twfs.popupReleasing,
      v.id versionSetId, 
      case when t0.status is null then 'PENDING' else t0.status end status, 
      t0.dateTimeCreated dateTimeTransferred, 
      t0.dateTimeScheduled, 
      t0.dateTimeReleased,
      t0.transferRemarks,
      case when (select count(tw.id) counter from UERMResults..TestOrderWorkFlows tw
        join UERMResults..TestWorkFlowSteps twf1 on twf1.id = tw.stepId
        where testOrderCode = t0.code
        and twf1.accessRoleModule = 'Module - Residents' and tw.status = 'completed') > 0
        then cast (1 as bit) 
        else cast(0 as bit)
      end initiallyRead
    from 
      UERMMMC..vw_EncounterCases c 
      join UERMMMC..Charges_Main cm on c.caseNo = cm.caseNo 
      and CANCELED = 'N' 
      join UERMMMC..Charges_Details cd on cm.chargeslipNo = cd.chargeslipNo 
      join UERMResults..TestMappings tm on cd.charge_id = tm.ChargeId and tm.active = 1
      join UERMResults..Tests t on tm.TestCode = t.Code 
      left join UERMResults..VersionSets v on v.TestCode = t.Code 
      and v.active = 1 
      left join UERMMMC..rooms r on r.ROOMNO = c.lastRoom 
      left join UERMResults..TestOrders t0 on cm.chargeSlipNo = t0.chargeSlipNo 
      and t0.chargeId = cd.CHARGE_ID 
      left join UERMResults..TestOrderWorkFlows t0w on t0w.TestOrderCode = t0.code and t0w.active = 1   
      left join UERMResults..TestWorkFlowSteps twfs on twfs.Id = t0w.StepId and twfs.active = 1 
    where 
      1 = 1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    if (charges.length > 0) {
      for (const list of charges) {
        list.birthdate = util.formatDate2({
          date: list.birthdate,
          dateOnly: true,
        });

        list.dateTimeCharged = util.formatDate2({ date: list.dateTimeCharged });
        list.dateTimeAdmitted = util.formatDate2({
          date: list.dateTimeAdmitted,
        });

        if (!util.empty(list.dateTimeTransferred)) {
          list.dateTimeTransferred = util.formatDate2({
            date: list.dateTimeTransferred,
          });
        }

        if (!util.empty(list.dateTimeScheduled)) {
          list.dateTimeScheduled = util.formatDate2({
            date: list.dateTimeScheduled,
          });
        }

        if (!util.empty(list.testOrderWorkFlowDateTimeUpdated)) {
          list.testOrderWorkFlowDateTimeUpdated = util.formatDate2({
            date: list.testOrderWorkFlowDateTimeUpdated,
          });
        }

        if (!util.empty(list.testOrderWorkFlowDateTimeCreated)) {
          list.testOrderWorkFlowDateTimeCreated = util.formatDate2({
            date: list.testOrderWorkFlowDateTimeCreated,
          });
        }

        if (!util.empty(list.dateTimeReleased)) {
          list.dateTimeReleased = util.formatDate2({
            date: list.dateTimeReleased,
          });
        }

        if (list.phoneNumber && list.mobileNumber) {
          if (list.phoneNumber !== list.mobileNumber) {
            list.contactNumbers = `${list.phoneNumber}, ${list.mobileNumber}`;
          } else {
            list.contactNumbers = list.phoneNumber || list.mobileNumber;
          }
        } else {
          list.contactNumbers = list.phoneNumber || list.mobileNumber || null;
        }

        if (
          list.ward === "OPD" ||
          list.ward === "ER" ||
          list.ward === "OPD-CHARITY"
        ) {
          list.wardRoom = list.ward;
        } else {
          list.wardRoom = `${list.ward} - ${list.room}`;
        }

        if (!options.processing) {
          // Check for exception of reading //
          if (list.exceptionComponent !== null) {
            const dynamicComponent = await require(
              `../controllers/components/${list.exceptionComponent}`,
            );
            list.exempt = await dynamicComponent[list.exceptionMethod](list);
          } else {
            list.exempt = false;
          }
          // Check for exception of reading //
        }
      }
    }
    return charges;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectTestOrderProcessing = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    console.time("query");
    const charges = await sqlHelper.query(
      `select 
        c.caseNo, 
        c.patientNo, 
        c.fullName, 
        c.firstName, 
        c.lastName, 
        c.middleName, 
        c.gender, 
        c.birthdate,
        c.phoneNumber,
        c.mobileNumber,
        c.email,
        cm.chargeslipNo, 
        cd.charge_id chargeId, 
        tm.testCode, 
        tm.exceptionComponent, 
        tm.exceptionMethod, 
        t.name testName, 
        t.alternativeTestName, 
        t.departmentCode deptCode, 
        t.component, 
        c.chiefComplaint, 
        c.patientType, 
        c.dateTimeAdmitted, 
        -- cm.dr_code requestingPhysicianId,
        (
          select 
            ehr_code 
          from 
            UERMMMC..Doctors 
          where 
            code = cm.dr_code
        ) requestingPhysicianId, 
        ward = CASE WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END WHEN c.patientType = 'OPD' THEN CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY' ELSE 'OPD' END ELSE (
          SELECT 
            ISNULL(B.[DESCRIPTION], 'N/A') 
          FROM 
            UERMMMC..SECTIONS B WITH(NOLOCK) 
          WHERE 
            B.CODE = r.UNIT
        ) END, 
        wardCode = CASE WHEN c.patientType = 'OPD' THEN 'OPD' WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END ELSE r.unit END, 
        room = CASE WHEN c.caseDepartment = 'ER' THEN CASE WHEN c.hostname LIKE '%COVID%' THEN 'ER' ELSE 'ER' END WHEN c.patientType = 'OPD' THEN CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY' ELSE 'OPD' END ELSE c.lastRoom END, 
        cm.chargeDateTime dateTimeCharged, 
        cd.description chargedProcedure, 
        t0.code testOrderCode, 
        t0.createdBy transferredBy, 
        t0.scheduledBy, 
        t0.releasedby, 
        t0.resultComponent, 
        t.resultComponent resultComponentTemplate, 
        t0w.status testOrderWorkFlowStatus, 
        t0w.isProxy, 
        t0w.consultantId, 
        t0w.residents, 
        t0w.dateTimeCreated testOrderWorkFlowDateTimeCreated, 
        t0w.dateTimeUpdated testOrderWorkFlowDateTimeUpdated, 
        t0w.updatedBy testOrderWorkFlowProcessedBy, 
        twfs.stepNumber, 
        twfs.accessRoleModule, 
        twfs.isFinalStep, 
        twfs.withVerifier, 
        twfs.withValidator, 
        twfs.withConsultant, 
        twfs.withResidents, 
        twfs.allowEdit, 
        twfs.patientAssignment, 
        twfs.sendSMSConsultant, 
        twfs.sendEmailConsultant, 
        twfs.sendSMSResidents, 
        twfs.sendEmailResidents, 
        twfs.popupReleasing,
        v.id versionSetId, 
        case when t0.status is null then 'PENDING' else t0.status end status, 
        t0.dateTimeCreated dateTimeTransferred, 
        t0.dateTimeScheduled, 
        t0.dateTimeReleased, 
        t0.transferRemarks, 
        case when (
          select 
            count(tw.id) counter 
          from 
            UERMResults..TestOrderWorkFlows tw 
            join UERMResults..TestWorkFlowSteps twf1 on twf1.id = tw.stepId 
          where 
            testOrderCode = t0.code 
            and twf1.accessRoleModule = 'Module - Residents' 
            and tw.status = 'completed'
        ) > 0 then cast (1 as bit) else cast(0 as bit) end initiallyRead 
      from 
        UERMResults..TestOrders t0 
        left join UERMResults..TestOrderWorkFlows t0w on t0w.TestOrderCode = t0.code 
        and t0w.active = 1 
        left join UERMResults..TestWorkFlowSteps twfs on twfs.Id = t0w.StepId 
        and twfs.active = 1 
        join UERMMMC..Charges_Main cm on cm.chargeslipNo = t0.ChargeslipNo 
        and CANCELED = 'N' 
        join UERMMMC..Charges_Details cd on cd.chargeslipNo = t0.ChargeslipNo 
        and t0.ChargeId = cd.CHARGE_ID 
        join UERMMMC..vw_EncounterCases c on c.caseno = cm.caseno 
        join UERMResults..TestMappings tm on cd.charge_id = tm.ChargeId 
        and tm.active = 1 
        join UERMResults..Tests t on tm.TestCode = t.Code 
        left join UERMResults..VersionSets v on v.TestCode = t.Code 
        and v.active = 1 
        left join UERMMMC..rooms r on r.ROOMNO = c.lastRoom 
      where 
        1 = 1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    console.timeEnd("query");
    if (charges.length > 0) {
      for (const list of charges) {
        list.birthdate = util.formatDate2({
          date: list.birthdate,
          dateOnly: true,
        });

        list.dateTimeCharged = util.formatDate2({ date: list.dateTimeCharged });
        list.dateTimeAdmitted = util.formatDate2({
          date: list.dateTimeAdmitted,
        });

        if (!util.empty(list.dateTimeTransferred)) {
          list.dateTimeTransferred = util.formatDate2({
            date: list.dateTimeTransferred,
          });
        }

        if (!util.empty(list.dateTimeScheduled)) {
          list.dateTimeScheduled = util.formatDate2({
            date: list.dateTimeScheduled,
          });
        }

        if (!util.empty(list.testOrderWorkFlowDateTimeUpdated)) {
          list.testOrderWorkFlowDateTimeUpdated = util.formatDate2({
            date: list.testOrderWorkFlowDateTimeUpdated,
          });
        }

        if (!util.empty(list.testOrderWorkFlowDateTimeCreated)) {
          list.testOrderWorkFlowDateTimeCreated = util.formatDate2({
            date: list.testOrderWorkFlowDateTimeCreated,
          });
        }

        if (!util.empty(list.dateTimeReleased)) {
          list.dateTimeReleased = util.formatDate2({
            date: list.dateTimeReleased,
          });
        }

        if (list.phoneNumber && list.mobileNumber) {
          if (list.phoneNumber !== list.mobileNumber) {
            list.contactNumbers = `${list.phoneNumber}, ${list.mobileNumber}`;
          } else {
            list.contactNumbers = list.phoneNumber || list.mobileNumber;
          }
        } else {
          list.contactNumbers = list.phoneNumber || list.mobileNumber || null;
        }

        if (
          list.ward === "OPD" ||
          list.ward === "ER" ||
          list.ward === "OPD-CHARITY"
        ) {
          list.wardRoom = list.ward;
        } else {
          list.wardRoom = `${list.ward} - ${list.room}`;
        }
      }
    }

    return charges;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectTestOrderWorkflows = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const testOrderWorkflows = await sqlHelper.query(
      `select 
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        a.code,
        a.dateTimeCreated dateTimeTransferred, 
        a.updatedBy transferredBy,
        b.stepId, 
        c.stepNumber,
        b.createdBy,
        b.updatedBy,
        b.status,
        b.dateTimeUpdated dateTimeCompleted,
        b.completionRemarks,
        b.verifierId,
        b.validatorId,
        b.consultantId,
        c.accessRoleModule
      from UERMResults..TestOrders a
        join UERMResults..TestOrderWorkFlows b on b.TestOrderCode = a.Code 
        join UERMResults..TestWorkFlowSteps c on c.Id = b.StepId
      where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}`,
      args,
      txn,
    );

    for (const list of testOrderWorkflows) {
      if (!util.empty(list.dateTimeTransferred)) {
        list.dateTimeTransferred = util.formatDate2({
          date: list.dateTimeTransferred,
        });
      }
      if (!util.empty(list.dateTimeCompleted)) {
        list.dateTimeCompleted = util.formatDate2({
          date: list.dateTimeCompleted,
        });
      }
    }

    return testOrderWorkflows;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const insertCharge = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }
  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertChargeWithColumns = async function (
  payload,
  table,
  txn,
  columnsToSelect,
) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }
  try {
    return await sqlHelper.insert(
      `${table}`,
      payload,
      txn,
      "dateTimeCreated",
      true,
      columnsToSelect,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateCharge = async function (payload, condition, table, txn) {
  try {
    return await sqlHelper.update(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateChargeWithColumns = async function (
  payload,
  condition,
  table,
  txn,
  columnsToSelect,
) {
  try {
    return await sqlHelper.update(
      `${table}`,
      payload,
      condition,
      txn,
      "dateTimeUpdated",
      true,
      columnsToSelect,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateToTable = async function (payload, condition, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }
  try {
    return await sqlHelper.update(`${table}`, payload, condition, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertToTable = async function (payload, table, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid payload" };
  }
  try {
    return await sqlHelper.insert(`${table}`, payload, txn);
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectCharges,
  selectTestOrders,
  selectTestOrderProcessing,
  selectTestOrderWorkflows,
  insertCharge,
  insertToTable,
  insertChargeWithColumns,
  updateCharge,
  updateChargeWithColumns,
  updateToTable,
};

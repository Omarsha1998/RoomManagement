const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectCharges = async function (conditions, txn) {
  return await sqlHelper.query(
    `select 
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
      t.departmentCode deptCode,
      c.chiefComplaint,
      c.patientType,
      d.name requestingPhysician,
      d.code requestingPhysicianId,
      ward = CASE
                WHEN c.caseDepartment = 'ER' THEN CASE
                  WHEN c.hostname LIKE '%COVID%' THEN 'OLD-ER'
                  ELSE 'NEW-ER'
                END
                WHEN c.patientType = 'OPD' THEN 
                    CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY'
                    ELSE 'OPD'
                  END
                ELSE (
                  SELECT
                    ISNULL(B.[DESCRIPTION], 'N/A')
                  FROM
                    UERMMMC..SECTIONS B WITH(NOLOCK)
                  WHERE
                    B.CODE = r.UNIT
              )
              END ,
        wardCode = CASE WHEN c.patientType = 'OPD' THEN 'OPD'
                   WHEN c.caseDepartment = 'ER' THEN CASE
                      WHEN c.hostname LIKE '%COVID%' THEN 'OLD-ER'
                      ELSE 'NEW-ER'
                      END
                  ELSE r.unit
                END,
        room = CASE
                WHEN c.caseDepartment = 'ER' THEN CASE
                  WHEN c.hostname LIKE '%COVID%' THEN 'OLD-ER'
                  ELSE 'NEW-ER'
                END
                WHEN c.patientType = 'OPD' THEN 
                    CASE WHEN c.caseDepartment = 'OPDCHA' THEN 'OPD-CHARITY'
                    ELSE 'OPD'
                  END
                ELSE c.lastRoom
              END,
        cm.chargeDateTime dateTimeCharged,
        cd.description chargedProcedure,
        pc.code patientChargeCode,
        pc.dateTimeCreated dateTimeTransferred,
        pc.dateTimeCancelled,
        pc.cancelledBy,
        pc.cancellationRemarks,
        pc.createdBy transferredBy,
        pc.status,
        pfd.code processFlowCode,
        anciRequest=cast(case when isnull(pc.code,'') in ('', null) then 0 else 1 end as bit)
    from UERMMMC..vw_EncounterCases c
    join UERMMMC..Charges_Main cm on c.caseNo = cm.caseNo
    join UERMMMC..Charges_Details cd on cm.chargeslipNo = cd.chargeslipNo
    join UERMMMC..Doctors d on cm.dr_code = d.ID
    join UERMResults..TestMappings tm on cd.charge_id = tm.ChargeId
    join UERMResults..Tests t on tm.TestCode = t.Code
    left join UERMResults..TestProcessFlows tpf on t.Code = tpf.TestCode
    left join UERMResults..ProcessFlows pf on tpf.processFlowCode = pf.code
    left join UERMResults..ProcessFlowDetails pfd on pf.code = pfd.processFlowCode and sequence = 1
    left join UERMMMC..rooms r on r.ROOMNO = c.lastRoom
    left join UERMResults..PatientCharges pc on cm.chargeSlipNo = pc.chargeSlipNo
    where convert(date, cm.CHARGEDATETIME) between ? and ?
    and t.DepartmentCode = ?
    order by ${conditions.orderBy}`,
    [conditions.fromDate, conditions.toDate, conditions.deptCode],
    txn
  );
};


const generatePatientChargeCode = async function (txn, deptCode) {
  let code = "";
  let codeExists = true;

  var currentdate = new Date();

  var datetime = `${currentdate.getFullYear()}${(
    "0" +
    (currentdate.getMonth() + 1)
  ).slice(-2)}${util.pad(currentdate.getDate())}${util.pad(currentdate.getHours())}${util.pad(
    currentdate.getMinutes()
  )}${util.pad(currentdate.getSeconds())}`;
  while (codeExists) {
    code = `${deptCode.toUpperCase()}-${datetime}${util.generateNumber(3)}`;
    try {
      let result = await sqlHelper.query(
        `SELECT
          COUNT(code) AS count
        FROM UERMResults..PatientCharges
        where code = ?`,
        [code],
        txn
      );
      const codeCount = result;
      codeExists = Boolean(codeCount.count);
    } catch (error) {
      console.log(error);
      return { success: false, message: error };
    }
  }
  return code;
};

const insertPatientCharge = async function (payload, txn) {
  return await sqlHelper.insert("PatientCharges", payload, txn);
};

const updatePatientCharge = async function (payload, condition, txn) {
  return await sqlHelper.update("PatientCharges", payload, condition, txn);
};


module.exports = {
  selectCharges,
  insertPatientCharge,
  generatePatientChargeCode,
  updatePatientCharge,
};

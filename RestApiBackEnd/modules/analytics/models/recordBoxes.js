const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getRecordBoxes = async function (conditions, txn, options) {
  return await sqlHelper.query(`select
		id, 
		boxId, 
		caseNo, 
		createdBy, 
		dateCreated,
		deleted,
		[delete by] deleteBy,
		[delete date] deleteDate
	from UERMEMR..Boxes
	
	where boxid between '5221' and '5226'
	`, [], txn);
};

const getPatientCases = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select 
			caseNo, 
			patientNo, 
			lastName, 
			firstName, 
			middleName, 
			dateAdmitted dateAd, 
			dateDischarged dateDis
		from UERMMMC..vw_Cases 
		where 1=1 and ${conditions.sqlWhere}
  `,
    [],
    txn
  );
};

const getPatientCasesOldHIS = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select 
			CONVERT(varchar(max),c.RefNo) caseNo, 
			p.Case_No patientNo,
			p.Lastname lastName,
			p.FirstName firstName,
			p.MiddleName middleName,
			c.AdmissionDate dateAd,
			c.DischargeDate dateDis
    from UERMHospital..Admissions c
    join UERMHospital..Patient p on c.Case_no = p.Case_No
     where 1=1 and ${conditions.sqlWhere}
  `,
    [],
    txn
  );
};

module.exports = {
  getRecordBoxes,
  getPatientCases,
  getPatientCasesOldHIS,
};

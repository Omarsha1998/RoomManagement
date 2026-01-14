const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectDepartments = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
			deptCode,
      deptName,
   refCode,
      createdBy,
      updatedBy,
      dateTimeCreated,
      dateTimeUpdated,
      remarks,
      buildingCode,
      segmentCode
		from UERMINV..fxDepartment
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const liveDepartments = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
[CODE] as deptCode
      ,[DESCRIPTION] as deptName
      ,[ASSETCODE]
      ,[GROUP]
     
		from [UERMMMC].[dbo].[SECTIONS]
		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

const primaryDept = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `select
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
 hrDepts.CODE,
hrDepts.DESCRIPTION, 
    subDept.primaryDeptCode,
	  subDept.deptStatus,
     subDept.subDeptCode,
      subDept.createdBy,
      subDept.updatedBy,
      subDept.dateTimeCreated,
      subDept.dateTimeUpdated,
	  CONCAT(subDept.primaryDeptCode,' ,',subDept.subDeptCode) allDepts
	from [UERMMMC].[dbo].[SECTIONS] hrDepts
JOIN [UERMINV].[dbo].[AsventoSubDepartments] subDept
    ON hrDepts.CODE COLLATE Latin1_General_CI_AS = subDept.primaryDeptCode 
	COLLATE Latin1_General_CI_AS 

		where 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
    args,
    txn,
  );
};

module.exports = {
  selectDepartments,
  liveDepartments,
  primaryDept,
};

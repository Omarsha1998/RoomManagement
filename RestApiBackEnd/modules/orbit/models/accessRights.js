// const util = require("../../../helpers/util");
// const sqlHelper = require("../../../helpers/sql");

// const getAccessRights = async function (conditions, txn, options) {
//   return await sqlHelper.query(
//     `select ITMgt.dbo.[fn_isAccess](
// 			${conditions}
// 		) isAccess`,
//     [],
//     txn,
//   );
// };

// const getAccessRightsAsvento = async function (conditions, txn, options) {
//   return await sqlHelper.query(
//     `select UERMINV.dbo.[AccessAsventoTest](
// 			${conditions}
// 		)`,
//     [],
//     txn,
//   );
// };
// module.exports = {
//   getAccessRights,
//   getAccessRightsAsvento,
// };

const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getAccessRights = async function (conditions, txn, options) {
  // console.time();
  const isAccess = await sqlHelper.query(
    `select ITMgt.dbo.[fn_isAccess](
			${conditions}
		) isAccess`,
    [],
    txn,
  );
  // console.timeEnd();
  return isAccess;
};

// const selectRoles = async function (conditions, args, options, txn) {
//   return await sqlHelper.query(
//     `select * from emr..userRoles
//     WHERE 1=1 ${conditions}
//     ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
//     `,
//     args,
//     txn,
//   );
// };
const selectRoles = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
    e.IsActive active,
    LTRIM(RTRIM(e.EmployeeCode)) value,
    LTRIM(RTRIM(e.EmployeeCode)) code,
    CONCAT(e.LastName, ', ', e.FirstName) label,
    CONCAT(e.LastName, ', ', e.FirstName) name,
    e.firstName,
    e.middleName,
    e.lastName,
    e.extName,
  -- e.WebPassword password,
  	  u.passwordHash  password,
    NULLIF(e.Sex, '') gender,
    e.mobileNo mobileNumber,
    e.uermEmail emailAddress,
    p.PositionCode positionCode,
    p.Position positionDescription,
    e.Class employmentClass,
    LTRIM(RTRIM(e.EmployeeStatus)) employmentStatus,
    e.birthDate,
    l.license licenseName,
    l.licenseNo licenseNumber,
    l.YearTaken licenseYearTaken,
    ur.deptCode
  FROM
    [UE DATABASE]..Employee e
    LEFT JOIN [emr]..users u ON u.Code  = e.EmployeeCode
    LEFT JOIN [UE DATABASE]..License l ON l.EmployeeCode = LTRIM(RTRIM(e.EmployeeCode))
    LEFT JOIN [UE DATABASE]..Position p ON p.PositionCode = e.PositionCode
    LEFT JOIN (
      SELECT * FROM EMR..UserRoles WHERE Id IN (
        SELECT MAX(Id) FROM EMR..UserRoles GROUP BY UserCode
      )
    ) ur ON ur.UserCode = e.EmployeeCode
    LEFT JOIN EMR..Roles r ON r.Code = ur.RoleCode
  WHERE
    e.IsActive = 1
    AND ur.RoleCode in (
      'con',
  'fel',
  'res',
  'cle',
  'preres',
  'adm',
  'nst',
  'hosuser','aud', 'con')  ${conditions}
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};
module.exports = {
  getAccessRights,
  selectRoles,
};

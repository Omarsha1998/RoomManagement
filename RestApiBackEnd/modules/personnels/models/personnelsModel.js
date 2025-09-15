/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectPersonnels = async function (conditions, args, options, txn) {
  try {
    return await sqlHelper.query(
      `select
			${util.empty(options.top) ? "" : `TOP(${options.top})`}
			code,
			name,
			firstName,
			lastName,
			middleName,
			concat(lastName, ', ', firstName) fullName,
			concat(firstName, ' ', lastName) alternativeFullName,
			gender,
			bdate birthdate,
			email = case when UERMEmail is not null
				then UERMEmail
			else
				email
			end,
			mobileNo,
			pass password,
			dept_code deptCode,
			dept_desc deptDesc,
			pos_desc posDesc,
			civil_status_desc civilStatusDesc,
			[group],
			emp_class_desc empClassDesc,
			emp_class_code empClassCode,
			address,
			[SERVICE YEARS] serviceYears,
			is_active isActive
		from [UE Database]..vw_Employees
		where 1=1 ${conditions}
		${util.empty(options.order) ? "" : `order by ${options.order}`}
		`,
      args,
      txn,
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

const selectAppUsers = async function (
  conditions,
  args,
  options,
  txn,
  module = false,
) {
  try {
    const users = await sqlHelper.query(
      `select 
        ${module ? "" : "distinct"} 
        b.code,
        b.name,
        b.lastName,
        b.firstName,
        b.middleName,
        CONCAT(
          b.firstName,
          CASE 
            WHEN b.middleName IS NOT NULL AND b.middleName <> '' THEN ' ' + LEFT(b.middleName, 1) + '.'
            ELSE ''
          END,
          ' ', b.lastName,
          CASE 
            WHEN b.extname IS NOT NULL AND b.extname <> '' THEN ', ' + b.extname
            ELSE ''
          END
        ) AS fullName,
        b.mobileNo,
        b.email,
        b.uermEmail,
        b.dept_code deptCode,
        b.dept_desc deptDesc,
        b.pos_code positionCode,
        b.pos_desc positionDesc,
        b.is_active isActive,
        a.moduleName
      from ITMgt..UserAccess a
      join [UE database]..vw_Employees b on b.code = a.code
      where 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return users;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  selectPersonnels,
  selectAppUsers,
};

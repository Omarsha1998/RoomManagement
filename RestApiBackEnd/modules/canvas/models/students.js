const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getCanvasStudents = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `exec Canvas..Usp_Canvas_STU_Users ${conditions}`,
    [],
    txn,
  );
};

const getSemester = async function (conditions, txn, options) {
  const semester = await sqlHelper.query(
    `select distinct top(5)
		semester 
	from [UE database]..[Student Registration]
	order by semester desc
    ${conditions}`,
    [],
    txn,
  );
  // console.log(semester);
  return semester;
};

const getCourse = async function (conditions, txn, options) {
  // `select distinct
  // 	course
  // 		from [UE database]..[Student Registration] sr
  // 		where 1=1 ${conditions}
  // 		order by course`,
  return await sqlHelper.query(
    `select course_code course from [UE database]..vw_Courses`,
    [],
    txn,
  );
};

const getStudentEmail = async function (conditions, txn, options) {
  const query = await sqlHelper.query(
    `SELECT distinct
			se.id,
			se.sn,
			s.firstName,
			s.lastName,
			s.middleName,
			concat(s.lastname, ', ', s.firstname, ' ', s.middlename) fullName,
			s.YearLevel yearLevel,
			s.course,
			employeeId,
			s.semester,
			s.college,
			uermEmail,
			password,
			statusEmail,
			canvasPassword,
			statusCanvas,
			canvasId,
			transDate,
			uermEmailId,
			se.emailCreationDate,
			se.canvasCreationDate,
			convert(date, sr.Date_Validated) dateValidated
		FROM [UE database]..CANVAS_StudentEmail se  WITH (NOLOCK)
		JOIN [UE database]..student s on s.SN = se.SN
		join [UE database]..[Student Registration] sr on s.SN = sr.SN
			where 1=1 
    ${conditions}
		ORDER BY TransDate desc`,
    [],
    txn,
  );
  return query;
};

const getCanvasValidatedStudents = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT 
			user_id,
			login_id,
			password,
			first_name,
			last_name,
			full_name,
			sortable_name,
			short_name,
			email,
			status,
			date_validated,
			yearLevel,
			course,
			semester,
			sn,
			id,
			uermEmailId
		FROM Canvas..vw_CanvasValidatedStudents WITH (NOLOCK) 
		  where 1=1
	  ${conditions} ${options.order}`,
    [],
    txn,
  );
};

const getCanvasForActivation = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `select top(500)
			user_id = cast(S.SN as nvarchar(20)),
			canvasId = cast(se.CanvasID as nvarchar(20)),
			login_id = cast(UERMEmail + '@uerm.edu.ph' as nvarchar(150)),
			status = cast('active' as nvarchar(10))
		from [UE database]..student s with (nolock)
			INNER JOIN [UE database]..[Student Registration] SR with (nolock) ON S.SN=SR.sn ${conditions.joinConditions}
			inner join [UE database]..CANVAS_StudentEmail se with (nolock) on s.sn=se.SN
			inner join [UE database]..[Student Reference] ref with (nolock) on s.sn=ref.sn
			join [UE database]..Courses c with (nolock) on s.course = c.course
		where 
			SR.Date_Validated IS NOT NULL 
			and convert(date, sr.date_validated) <= convert(date, getDate())
			and se.StatusCanvas is null and canvasId is not null
			--and s.sn = '20202100536'
	  ${conditions.sqlWhere} ${options.order}`,
    [],
    txn,
  );
};

const getStudentsWithSpecialCharacter = async function (
  conditions,
  txn,
  options,
  args,
) {
  const rawSql = await sqlHelper.returnSQL();
  const sqlQuery = `select 
		s.sn,
		concat(REPLACE(uermEmail, '?', 'n'),'@uerm.edu.ph') uermEmail,
		canvasId,
		sr.Date_Validated dateValidated
	from [UE database]..Canvas_STudentEMail s
		INNER JOIN [UE database]..[Student Registration] SR with (nolock) ON S.SN=SR.sn ${conditions.joinConditions}
		where UERMEmail like '%?%' and Date_Validated is not null`;
  const result = await rawSql.query(sqlQuery);
  return result.recordset;
};

const updateStudentEmail = async function (payload, condition, txn) {
  return await sqlHelper.update(
    "[UE database]..CANVAS_StudentEmail",
    payload,
    condition,
    txn,
  );
};

module.exports = {
  getCanvasStudents,
  getSemester,
  getCourse,
  getStudentEmail,
  updateStudentEmail,
  getCanvasValidatedStudents,
  getCanvasForActivation,
  getStudentsWithSpecialCharacter,
};

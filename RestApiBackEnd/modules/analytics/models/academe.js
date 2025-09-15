const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const getHighSchools = async function (conditions, txn, options) {
	const rawSql = await sqlHelper.returnSQL();
  const sqlQuery = ` select 
		distinct replace(HighSchoolDesc, '?', 'ñ') highSchool
		from [UE database]..[Student Reference] sr 
	join [UE database]..[Student Registration] srr on sr.sn = srr.sn
	where HighSchoolDesc not in ('N/A', '',
		'N/A (Not K-12)',
		'N/A - Foreign School',
		'N/N',
		'NA',
		'(not a student of K-12 Program)')
		and srr.Date_Validated >= DATEFROMPARTS(YEAR(GETDATE())-5,1,1)
		order by highSchool
	`;
  const result = await rawSql.query(sqlQuery);
  return result.recordset;
};

module.exports = {
  getHighSchools,
};

const sqlHelper = require("../../../helpers/sql.js");

const getColleges = async () => {
  return await sqlHelper.query(
    `SELECT college, description
    FROM [UE database]..Courses
    ORDER BY description ASC
    `,
  );
};

const getSemesters = async () => {
  return await sqlHelper.query(
    `SELECT DISTINCT a.semester, [UE database].dbo.SemDescription(a.semester) semDescription
    FROM [UE database]..[subject offered] a
    ORDER by a.semester DESC
    `,
  );
};

const getReports = async (college, collegeDesc, semester) => {
  return await sqlHelper.query(
    `SELECT DISTINCT 
        f.employeeid, 
        RTRIM(LastName) + ', ' + RTRIM(FirstName) + ' ' + LEFT(MiddleName, 1) name,
        a.EmployeeID professorId,
        a.ComputerCode computerCode,
        a.SubjectCode subjectCode,
        sm.Description subjectDesc,
        [UE database].dbo.SemDescription(a.semester) semDescription, 
        a.section,
        LTRIM(RTRIM(CONCAT(a.time, ' ', a.days, ' ', a.room))) schedule,
        a.OpenBy openBy,
        a.college,
        c.description collegeDescription,
        a.semester
    FROM 
        [UE database]..[subject offered] a
    INNER JOIN 
        [UE database]..Faculty f ON a.ComputerCode = f.ComputerCode
    INNER JOIN 
        [UE database]..employee b ON f.EmployeeID = b.employeecode
    INNER JOIN 
        [UE database]..Courses c ON a.College = c.college
    INNER JOIN
		    [UE database]..[Subject Masterfile] sm ON a.SubjectCode = sm.SubjectCode
    WHERE 
        (? IS NULL OR a.OpenBy = ?)  
        AND (? IS NULL OR a.semester = ?) 
        AND a.OpenBy IS NOT NULL
    ORDER BY  name, a.section ASC
    `,
    [college, college, semester, semester],
  );
};

module.exports = {
  getColleges,
  getSemesters,
  getReports,
};

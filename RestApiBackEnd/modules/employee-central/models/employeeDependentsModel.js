const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 

async function getAllDepartments() {
  const query = `SELECT T.* FROM
                    (SELECT 
                    '0' AS 'department_id', 
                      'ANY DEPARTMENT' AS 'department_name'
                    UNION
                      SELECT 
                        TRIM(Code) AS 'department_id', 
                        TRIM([Description]) AS 'department_name'
                        FROM UERMMMC..SECTIONS
							         WHERE Deleted = 0
                    ) AS T
                  ORDER BY IIF(T.department_id = '0', 0, 1), T.department_name ASC;`;
  return (await helperMethods.executeQuery(query)).recordset;
}

async function getEmployees(departmentID, employeeCode, lastName, firstName, middleName) {
  let query = `SELECT 
                  E.EmployeeCode AS 'employee_id',
                  E.LastName AS 'last_name',
                  E.FirstName AS 'first_name',
                  E.MiddleName AS 'middle_name',
                  S.[Description] AS 'department',
                  (CASE 
                      WHEN (E.ResignationDate IS NULL OR E.ResignationDate = '1900-01-01 00:00:00') 
                      THEN '' 
                    ELSE FORMAT(E.ResignationDate, 'MM/dd/yyyy')
                  END)  AS 'resignation_date',
                  ISNULL(E.ClassBenefitCode, '') AS 'benefit_classification_code',
				          ISNULL(B.[Description], '') AS 'benefit_classification_description',
                  ISNULL(CONVERT(VARCHAR, (CONVERT(MONEY, B.MaxAnnualBenefit)), 1), '') AS 'max_annual_benefit',
                  CONVERT(VARCHAR, 
                      CONVERT(MONEY, 
                          (SELECT ISNULL(SUM(SubCB.EmployeeBenefitDiscount), 0.00)
                          FROM UERMMMC..PATIENTINFO AS SubP 
                          INNER JOIN UERMMMC..CASES AS SubC WITH(NOLOCK) 
                          ON SubC.PATIENTNO = SubP.PATIENTNO
                          INNER JOIN [UE database]..Family AS SubF 
                          ON SubF.RECNO = SubP.FamilyRecno
                          INNER JOIN [UE database]..Employee AS SubE
                          ON SubF.EmployeeCode = SubE.EmployeeCode
                          INNER JOIN UERMMMC..CASES_BALANCES AS SubCB
                          ON SubCB.CASENO = SubC.CaseNo
                          WHERE SubP.FamilyRecno IS NOT NULL
                            AND CONVERT(CHAR(4), SubC.DATEAD, 112) = YEAR(GETDATE())
                            AND SubE.EmployeeCode = E.EmployeeCode
                          )
                  ), 1) AS total_accumulated_discounts
                  FROM [UE database]..Employee AS E
        			  	INNER JOIN UERMMMC..SECTIONS AS S
                  ON E.DeptCode = S.Code 
                  LEFT JOIN [UE database]..EmployeeClassBenefit AS B 
				          ON B.ClassBenefits = E.ClassBenefitCode
                  WHERE E.IsActive IN (1,0) `;

  if (departmentID !== '0') query += `AND S.Code = @DepartmentID `;
  if (!helperMethods.isNullOrUndefinedOrEmpty(employeeCode)) query += "AND E.EmployeeCode LIKE @EmployeeCode ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(lastName))  query += "AND E.LastName LIKE @LastName ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(firstName)) query += "AND E.FirstName LIKE @FirstName ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(middleName)) query += "AND E.MiddleName LIKE @MiddleName ";

  query += `ORDER BY E.LastName ASC`;

  const parameters = [];

  if (departmentID !== "0") parameters.push({ name: "DepartmentID", dataType: SQLDataTypes.VARCHAR, value: departmentID });
  if (!helperMethods.isNullOrUndefinedOrEmpty(employeeCode)) parameters.push({ name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value:  employeeCode });
  if (!helperMethods.isNullOrUndefinedOrEmpty(lastName)) parameters.push({ name: "LastName", dataType: SQLDataTypes.VARCHAR, value: `%${  lastName   }%`});
  if (!helperMethods.isNullOrUndefinedOrEmpty(firstName)) parameters.push({ name: "FirstName", dataType: SQLDataTypes.VARCHAR, value: `%${  firstName   }%`});
  if (!helperMethods.isNullOrUndefinedOrEmpty(middleName)) parameters.push({ name: "MiddleName", dataType: SQLDataTypes.VARCHAR, value: `%${  middleName   }%`});
  return (await helperMethods.executeQuery(query, parameters)).recordset;
}


async function getEmployeeDependents(employeeID) {
  const query = `				  
	    DECLARE @tbl table(current_status VARCHAR(8), patient_no VARCHAR(14), full_name VARCHAR(80), relationship VARCHAR(50), birth_date VARCHAR(10), age TINYINT, occupation VARCHAR(100),  
				          company_or_school VARCHAR(MAX), accumulated_discount VARCHAR(MAX), approved_by VARCHAR(200), date_time_approved DATETIME)

				              ---------------------- GET APPROVED ----------------------
				               INSERT INTO @tbl
				               SELECT A.* FROM 
				               (SELECT 
					              'Approved' AS 'current_status',
							      	  ISNULL(TRIM(F1.PatientNo), '') AS 'patient_no',
					              TRIM(F1.FullName) AS 'full_name',
					              TRIM(F1.FamType) AS 'relationship',
					              ISNULL(CONVERT(DATE, F1.Birthdate),  '') AS 'birth_date', 
					              FLOOR(DATEDIFF(DD, CASE
					              WHEN ISNULL(CAST(F1.Birthdate AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
					              ELSE ISNULL(CAST(F1.Birthdate AS DATE),'1900-01-01')
					              END, GETDATE())/365.242) AS 'age',  
					              ISNULL(TRIM(F1.Occupation), '') AS 'occupation',
                        ISNULL(TRIM(F1.CompanySchool), '') AS 'company_or_school',
                        CONVERT(VARCHAR, CONVERT(MONEY, 
                            (SELECT ISNULL(SUM(SubCB.EmployeeBenefitDiscount), 0.00)
                            FROM UERMMMC..PATIENTINFO AS SubP
                            INNER JOIN UERMMMC..CASES AS SubC WITH(NOLOCK) 
                            ON SubC.PATIENTNO = SubP.PATIENTNO
                            INNER JOIN [UE database]..Family AS SubF
                            ON SubF.RECNO = SubP.FamilyRecno
                            INNER JOIN [UE database]..Employee AS SubE
                            ON SubF.EmployeeCode = SubE.EmployeeCode
                            INNER JOIN UERMMMC..CASES_BALANCES AS SubCB
                            ON SubCB.CASENO = SubC.CaseNo
                            WHERE SubP.FamilyRecno IS NOT NULL
                              AND CONVERT(CHAR(4), SubC.DATEAD, 112) = YEAR(GETDATE())
                              AND SubE.EmployeeCode = F1.EmployeeCode
                              AND SubF.Recno = F1.Recno
                          )), 1) AS 'accumulated_discount',
					               (SELECT TOP 1 
					                    (TRIM(E.LastName) + ', ' + TRIM(E.FirstName) + ' ' + E.MiddleName)
						                FROM [UE database]..RequestDtl AS D
							            INNER JOIN [UE database]..Employee AS E ON E.EmployeeCode = D.ApprovedBy
							            WHERE D.FamilyRecno = F1.Recno AND D.CurrentStatus = 1 AND D.ApprovedBy IS NOT NULL AND D.DateTimeApproved IS NOT NULL
					               ) AS 'approved_by',
					              (SELECT TOP 1 
					                    DateTimeApproved 
					                    FROM [UE database]..RequestDtl 
					                    WHERE FamilyRecno = F1.Recno AND CurrentStatus = 1 AND ApprovedBy IS NOT NULL AND DateTimeApproved IS NOT NULL
					              ) AS 'date_time_approved'
                   FROM [UE database]..Family AS F1
                        WHERE F1.PIS_IsDependent = 1 
                          AND F1.EmployeeCode = @EmployeeCode 
                          AND F1.FullName IS NOT NULL 
                          AND (F1.Birthdate IS NOT NULL OR F1.Birthdate != '1900-01-01 00:00:00.000')
					              ) AS A
				              ---------------------- GET APPROVED ----------------------
				  

				              ---------------------- GET PENDING ----------------------
				              INSERT INTO @tbl
                              ----------------------- EDIT REQUEST -----------------------
				              SELECT P.* FROM
					              (SELECT
					              'Pending' AS 'current_status',
							      	  ('') AS 'patient_no',
					              TRIM(FullName) AS 'full_name',
					              TRIM(FamType) AS 'relationship',
					              ISNULL(CONVERT(DATE, Birthdate),  '') AS 'birth_date', 
						            FLOOR(DATEDIFF(DD, CASE
						            WHEN ISNULL(CAST(Birthdate AS DATE),'1900-01-01') < '1900-01-01' THEN '1900-01-01'
						            ELSE ISNULL(CAST(Birthdate AS DATE),'1900-01-01')
						            END, GETDATE())/365.242) AS 'age',  
					              ISNULL(TRIM(Occupation), '') AS 'occupation',
                                  ISNULL(TRIM(CompanySchool), '') AS 'company_or_school',
	                      (CONVERT(DECIMAL(10, 2), 0)) AS 'accumulated_discount',
					              '' AS 'approved_by',
					              '' AS 'date_time_approved'
					              FROM [UE database]..Family
					              WHERE Recno IN
						            (SELECT 
						              DISTINCT
						              D.FamilyRecno
						              FROM [UE database]..RequestHdr AS H
						              INNER JOIN [UE database]..RequestDtl AS D
						              ON D.RequestHdrID = H.ID
						              WHERE D.CurrentStatus = 0 -- 0 = Pending
						              AND D.ApprovedBy IS NULL
						              AND D.ApprovedBy IS NULL
						              AND IsDeleted = 0
						              AND H.DestinationTable = 'Family'
						              AND H.CreatedBy = @EmployeeCode
						              AND H.RequestType = 0 -- 0 = Edit
						              )
                             ----------------------- EDIT REQUEST -----------------------
					                   UNION
                             ----------------------- CREATE REQUEST -----------------------
						              SELECT 
						              DISTINCT
						              'Pending' AS 'current_status',
									        ('') AS 'patient_no',
						               (SELECT TOP 1 TRIM(NewValue) FROM [UE database]..RequestDtl 
						               WHERE RequestHdrID = D.RequestHdrID AND ColumnName = 'FullName'
						               ) AS 'full_name',
						               (SELECT TOP 1 TRIM([Description]) FROM [UE database]..FamilyType
							            WHERE ID = H.FamilyType
						               ) AS 'relationship',
						              ISNULL(CONVERT(DATE, 
							              (SELECT TOP 1 TRIM(NewValue) FROM [UE database]..RequestDtl 
							              WHERE RequestHdrID = D.RequestHdrID AND ColumnName = 'Birthdate')
							            ),  '') AS 'birth_date', 
						              FLOOR(DATEDIFF(DD, 
						              (SELECT TOP 1 TRIM(NewValue) FROM [UE database]..RequestDtl 
							              WHERE RequestHdrID = D.RequestHdrID AND ColumnName = 'Birthdate'
						               ), GETDATE())/365.242) AS 'age',  
						              ISNULL(
							            (SELECT TOP 1 TRIM(NewValue) FROM [UE database]..RequestDtl 
							             WHERE RequestHdrID = D.RequestHdrID AND ColumnName = 'Occupation'
							            ), '') AS 'occupation',
                                      ISNULL(
							            (SELECT TOP 1 TRIM(NewValue) FROM [UE database]..RequestDtl 
							             WHERE RequestHdrID = D.RequestHdrID AND ColumnName = 'CompanySchool'
							            ), '') AS 'company_or_school',
						              (CONVERT(DECIMAL(10, 2), 0)) AS 'accumulated_discount',
						              '' AS 'approved_by',
					                  '' AS 'date_time_approved'
						              FROM [UE database]..RequestHdr AS H
						              INNER JOIN [UE database]..RequestDtl AS D
						              ON D.RequestHdrID = H.ID
						              WHERE D.CurrentStatus = 0 AND IsDeleted = 0
						              AND H.DestinationTable = 'Family'
						              AND H.CreatedBy = @EmployeeCode
						              AND H.RequestType = 1 -- 1 = Create 
						             ) AS P
                                     WHERE NOT EXISTS (
								            SELECT 1
								            FROM @tbl AS Temp
								            WHERE Temp.full_name = P.full_name
								              AND Temp.relationship = P.relationship
						             )
                             ----------------------- CREATE REQUEST -----------------------
						                 ---------------------- GET PENDING ----------------------

						                SELECT 
                             current_status, 
                             approved_by,
                             (CASE
                               WHEN date_time_approved = '1900-01-01 00:00:00.000' THEN '' 
                               ELSE FORMAT(date_time_approved, 'MM/dd/yyyy / hh:mm tt') 
                             END) AS 'date_time_approved',
                             patient_no, 
                             full_name, 
                             relationship, 
                             birth_date, 
                             age, 
							               occupation, 
                             company_or_school, 
                             accumulated_discount
							       FROM @tbl
            `;

    const parameters = [
      { name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: employeeID }
    ];
  
  return (await helperMethods.executeQuery(query, parameters)).recordset;
}

module.exports = {
  getAllDepartments,
  getEmployees,
  getEmployeeDependents
}
const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 


async function onSearch(dateFrom, dateTo, employeeCode, lastName, firstName, middleName) {
  let query = `WITH MonthlyDiscounts AS 
                (
                    SELECT 
                        SubE.EmployeeCode,
                        YEAR(SubC.DATEAD) AS YearNumber,
                        MONTH(SubC.DATEAD) AS MonthNumber,
                        SUM(SubCB.EmployeeBenefitDiscount) AS TotalDiscount
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
                          AND SubC.DATEAD BETWEEN @DateFrom AND @DateTo
                    GROUP BY SubE.EmployeeCode, YEAR(SubC.DATEAD), MONTH(SubC.DATEAD)
                )

                SELECT 
                    E.EmployeeCode AS employee_id,
                    E.LastName AS last_name,
                    E.FirstName AS first_name,
                    E.MiddleName AS middle_name,
                    M.YearNumber AS 'year',
                    CONVERT(VARCHAR, ISNULL([1], 0.00), 1) AS 'jan',
                    CONVERT(VARCHAR, ISNULL([2], 0.00), 1) AS 'feb',
                    CONVERT(VARCHAR, ISNULL([3], 0.00), 1) AS 'mar',
                    CONVERT(VARCHAR, ISNULL([4], 0.00), 1) AS 'apr',
                    CONVERT(VARCHAR, ISNULL([5], 0.00), 1) AS 'may',
                    CONVERT(VARCHAR, ISNULL([6], 0.00), 1) AS 'jun',
                    CONVERT(VARCHAR, ISNULL([7], 0.00), 1) AS 'jul',
                    CONVERT(VARCHAR, ISNULL([8], 0.00), 1) AS 'aug',
                    CONVERT(VARCHAR, ISNULL([9], 0.00), 1) AS 'sep',
                    CONVERT(VARCHAR, ISNULL([10], 0.00), 1) AS 'oct',
                    CONVERT(VARCHAR, ISNULL([11], 0.00), 1) AS 'nov',
                    CONVERT(VARCHAR, ISNULL([12], 0.00), 1) AS 'dec',                   
                    CONVERT(VARCHAR, 
					(ISNULL([1], 0) + ISNULL([2], 0) + ISNULL([3], 0) + ISNULL([4], 0) + 
                    ISNULL([5], 0) + ISNULL([6], 0) + ISNULL([7], 0) + ISNULL([8], 0) + 
                    ISNULL([9], 0) + ISNULL([10], 0) + ISNULL([11], 0) + ISNULL([12], 0)) 
					,1) AS 'total_accumulated_discounts'
                FROM [UE database]..Employee AS E
                INNER JOIN 
                (
                    -- Pivot the monthly discounts to create columns dynamically
                    SELECT EmployeeCode, YearNumber, [1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12]
                    FROM 
                    (
                        SELECT EmployeeCode, YearNumber, MonthNumber, TotalDiscount 
                        FROM MonthlyDiscounts
                    ) AS SourceTable
                    PIVOT
                    (
                        SUM(TotalDiscount) 
                        FOR MonthNumber IN ([1], [2], [3], [4], [5], [6], [7], [8], [9], [10], [11], [12])
                    ) AS PivotedData
                ) AS M
                ON E.EmployeeCode = M.EmployeeCode AND M.YearNumber BETWEEN YEAR(@DateFrom) AND YEAR(@DateTo)

                WHERE (ISNULL([1], 0) + ISNULL([2], 0) + ISNULL([3], 0) + ISNULL([4], 0) + 
                    ISNULL([5], 0) + ISNULL([6], 0) + ISNULL([7], 0) + ISNULL([8], 0) + 
                    ISNULL([9], 0) + ISNULL([10], 0) + ISNULL([11], 0) + ISNULL([12], 0)) > 0
                     `;


  if (!helperMethods.isNullOrUndefinedOrEmpty(employeeCode)) query += "AND E.EmployeeCode LIKE @EmployeeCode ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(lastName))  query += "AND E.LastName LIKE @LastName ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(firstName)) query += "AND E.FirstName LIKE @FirstName ";
  if (!helperMethods.isNullOrUndefinedOrEmpty(middleName)) query += "AND E.MiddleName LIKE @MiddleName ";

  query += `ORDER BY E.LastName ASC`;

  const parameters = [
    { name: "DateFrom", dataType: SQLDataTypes.VARCHAR, value:  dateFrom },
    { name: "DateTo", dataType: SQLDataTypes.VARCHAR, value:  dateTo },
  ];

  if (!helperMethods.isNullOrUndefinedOrEmpty(employeeCode)) parameters.push({ name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value:  employeeCode });
  if (!helperMethods.isNullOrUndefinedOrEmpty(lastName)) parameters.push({ name: "LastName", dataType: SQLDataTypes.VARCHAR, value: `%${  lastName   }%`});
  if (!helperMethods.isNullOrUndefinedOrEmpty(firstName)) parameters.push({ name: "FirstName", dataType: SQLDataTypes.VARCHAR, value: `%${  firstName   }%`});
  if (!helperMethods.isNullOrUndefinedOrEmpty(middleName)) parameters.push({ name: "MiddleName", dataType: SQLDataTypes.VARCHAR, value: `%${  middleName   }%`});

return  (await helperMethods.executeQuery(query, parameters)).recordset;
}



module.exports = {
  onSearch
}
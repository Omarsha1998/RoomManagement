const helperMethods = require("../utility/helperMethods.js");
const { SQLDataTypes } = require('../utility/enums.js'); 
const employeeDependentsModel = require("./employeeDependentsModel.js");

async function getDetails(employeeID) {
  const query = `WITH EmployeeDiscount AS (
                    SELECT 
                        SubE.EmployeeCode,
                        SUM(ISNULL(SubCB.EmployeeBenefitDiscount, 0.00)) AS total_discount
                    FROM UERMMMC..PATIENTINFO AS SubP 
                    INNER JOIN UERMMMC..CASES AS SubC WITH(NOLOCK) ON SubC.PATIENTNO = SubP.PATIENTNO
                    INNER JOIN [UE database]..Family AS SubF ON SubF.RECNO = SubP.FamilyRecno
                    INNER JOIN [UE database]..Employee AS SubE ON SubF.EmployeeCode = SubE.EmployeeCode
                    INNER JOIN UERMMMC..CASES_BALANCES AS SubCB ON SubCB.CASENO = SubC.CaseNo
                    WHERE SubP.FamilyRecno IS NOT NULL
                        AND YEAR(SubC.DATEAD) = YEAR(GETDATE()) -- Fixed year extraction
                    GROUP BY SubE.EmployeeCode
                )

                SELECT 
                    (LTRIM(RTRIM(E.LastName)) + ', ' + LTRIM(RTRIM(E.FirstName)) + ' ' + LTRIM(RTRIM(E.MiddleName))) AS employee_full_name,
                    S.[Description] AS department_name,
                    ES.[Description] AS employment_status,
                    ISNULL(E.ClassBenefitCode, '') AS benefit_classification_code,
                    ISNULL(B.[Description], '') AS benefit_classification_description,
                    CONVERT(VARCHAR, CONVERT(MONEY, ISNULL(B.MaxAnnualBenefit, 0.00)), 1) AS max_annual_benefit,
                    CONVERT(VARCHAR, CONVERT(MONEY, ISNULL(ED.total_discount, 0.00)), 1) AS total_accumulated_discounts,
                    CONVERT(VARCHAR, CONVERT(MONEY, ISNULL(B.MaxAnnualBenefit, 0.00), 1) - CONVERT(MONEY, ISNULL(ED.total_discount, 0.00), 1), 1) AS balance
                FROM [UE database]..Employee AS E
                LEFT JOIN UERMMMC..SECTIONS AS S ON E.DeptCode = S.Code 
                LEFT JOIN [UE database]..EmployeeStatus AS ES ON CAST(ES.NUM AS VARCHAR(10)) = E.EmployeeStatus
                LEFT JOIN [UE database]..EmployeeClassBenefit AS B ON B.ClassBenefits = E.ClassBenefitCode
                LEFT JOIN EmployeeDiscount AS ED ON ED.EmployeeCode = E.EmployeeCode
                WHERE E.IsActive IN (1,0) 
                AND E.EmployeeCode = @EmployeeCode 
                ORDER BY E.LastName ASC;`;

  const parameters = [{ name: "EmployeeCode", dataType: SQLDataTypes.VARCHAR, value: employeeID }];
  const recordset = (await helperMethods.executeQuery(query, parameters)).recordset[0];

  const response = {
    employee_full_name: recordset.employee_full_name,
    department_name: recordset.department_name,
    employment_status: recordset.employment_status,
    benefit_classification_code: recordset.benefit_classification_code,
    benefit_classification_description: recordset.benefit_classification_description,
    max_annual_benefit: recordset.max_annual_benefit,
    total_accumulated_discounts: recordset.total_accumulated_discounts,
    balance: recordset.balance,
    table_rows :  await employeeDependentsModel.getEmployeeDependents(employeeID)
   };
  
  return response;
}

module.exports = {
  getDetails
}
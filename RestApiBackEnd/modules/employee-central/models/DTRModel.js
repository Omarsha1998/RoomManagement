const sqlHelper = require("../../../helpers/sql");

const getDTRDetails = async (
  startDate,
  endDate,
  employeeCode,
  departmentCode,
  displayType,
  classType,
) => {
  // try {
  //     const DTRQuery = `
  //       EXEC HR.dbo.Usp_jf_DTRv2
  //         ${sqlWhereStrArr.join(', ')};
  //     `;

  //     const result = await conn
  //       .request()
  //       .input('startDate', sql.VarChar, args.startDate)
  //       .input('endDate', sql.VarChar, args.endDate)
  //       .input('employeeCode', sql.VarChar, args.employeeCode)
  //       .input('additionalParameter', sql.VarChar, args.additionalParameter)
  //       .query(DTRQuery);

  //     return result.recordset;
  // } catch (error) {
  //     console.error(error);
  //     return { status: 500, message: 'Failed to retrieve DTR Details' };
  // }

  return await sqlHelper.query(
    `EXEC HR.dbo.Usp_jf_DTRv2 
      '${startDate}',
      '${endDate}',
      '${employeeCode}',
      '${departmentCode}',
      '${displayType}',
      '${classType}'
      `,
    [],
  );
};

const noDtrEmployee = async (employeeId) => {
  // return await sqlHelper.query(
  //   `SELECT Position, PositionCode
  //     FROM [UE database]..NoDtrEmployee
  //     `,
  // );

  return await sqlHelper.query(
    `SELECT CASE 
      WHEN EXISTS (
          SELECT 1
          FROM [UERMATT].[dbo].[NoDtr]
          WHERE code = ?
        ) THEN 1
        ELSE 0
      END AS result
    `,
    [employeeId],
  );
};

module.exports = { getDTRDetails, noDtrEmployee };

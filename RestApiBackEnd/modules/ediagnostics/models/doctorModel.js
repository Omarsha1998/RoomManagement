/* eslint-disable no-console */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectDoctors = async function (conditions, args, options, txn) {
  try {
    const doctors = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      code, 
      name,
      concat([LAST NAME], ', ', [FIRST NAME], ' ', [MIDDLE NAME], CASE 
        WHEN [EXT NAME] IS NOT NULL AND [EXT NAME] <> '' THEN ', ' + [EXT NAME] 
        ELSE '' 
      END, CASE 
        WHEN suffix IS NOT NULL AND suffix <> '' THEN ', ' + suffix 
        ELSE '' 
      END) fullName,
      CONCAT(
          [FIRST NAME],
          CASE 
            WHEN [MIDDLE NAME] IS NOT NULL AND [MIDDLE NAME] <> '' THEN ' ' + LEFT([MIDDLE NAME], 1) + '.'
            ELSE ''
          END,
          ' ', [LAST NAME],
          CASE 
            WHEN [EXT NAME] IS NOT NULL AND [EXT NAME] <> '' THEN ', ' + [EXT NAME]
            ELSE ''
          END, CASE 
        WHEN suffix IS NOT NULL AND suffix <> '' THEN ', ' + suffix 
        ELSE '' 
      END
        ) AS alternativeFullName,
      [FIRST NAME] firstName,
      [MIDDLE NAME] middleName,
      [LAST NAME] lastName,
      [EXT NAME] extensionName,
      suffix,
      [AREA OF SPECIALTY] specialization,
      department,
      phic,
      tin,
      lic,
      contactnos,
      clinicalDepartment,
      [PHIC EXP DATE] phicExpirationDate,
      [LIC EXP DATE] licenseExpirationDate,
      ancillaryDepartment,
      ancillaryDesignation
    from UERMMMC..Doctors
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return doctors;
  } catch (error) {
    console.log(error);
    return error;
  }
};

module.exports = {
  selectDoctors,
};

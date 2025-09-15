const sqlHelper = require("../../../helpers/sql.js");
const insertImageBase64 = async (base64Image, code, imageFileType) => {
  const bufferedImage = Buffer.from(base64Image, "base64");
  return await sqlHelper.query(
    `UPDATE UERMMMC..HMO
    SET ImageFile = ?, ImageFileType = ?
    WHERE CODE = ?`,
    [bufferedImage, imageFileType, code],
  );
};

const getServices = async () => {
  return await sqlHelper.query(
    `SELECT ppd.Code, ppd.Description contentDescription, ppd.Details contentDetails, act.Description serviceDescription, ImageFileType,
    CAST('' AS XML).value('xs:base64Binary(sql:column("imageFile"))', 'VARCHAR(MAX)') base64StringPicture
    FROM EMR..PatientPortalDiagCenters ppd
    LEFT JOIN UERMMMC..ACC_TITLES act ON ppd.Code = act.code
    ORDER BY act.Description ASC
    `,
  );
};

const getWellness = async () => {
  return await sqlHelper.query(
    `SELECT Description contentDescription,  CAST('' AS XML).value('xs:base64Binary(sql:column("ImageFile"))', 'VARCHAR(MAX)') base64StringPicture, ImageFileType
    FROM EMR..PatientPortalServices
    ORDER BY Description ASC
    `,
  );
};

// const getDoctors = async ({
//   departmentName,
//   doctorName,
//   hmo,
//   secretaryDoctor,
//   secretaryCode,
//   txn,
// }) => {
//   //   WITH RecentAttendance AS (
//   //     SELECT
//   //         da.DoctorCode,
//   //         da.DateTimeIn,
//   //         da.DateTimeOut,
//   //         da.id,
//   //         ROW_NUMBER() OVER (PARTITION BY da.DoctorCode ORDER BY da.DateTimeIn DESC) AS rn
//   //     FROM UERMMMC..DoctorAttendance da
//   // ),
//   let sqlQuery = `
//     WITH RecentAttendance AS (
//         SELECT
//             da.DoctorCode,
//             da.DateTimeIn,
//             da.DateTimeOut,
//             da.id,
//             ROW_NUMBER() OVER (PARTITION BY da.DoctorCode ORDER BY da.DateTimeIn DESC) AS rn
//         FROM UERMMMC..DoctorAttendance da
//         WHERE CAST(da.DateTimeIn AS DATE) = CAST(GETDATE() AS DATE)  -- Ensure only today's data is considered
//     ),
//     DoctorSecretaries AS (
//         SELECT
//           dsa.DoctorCode,
//           sec.IsDeleted,
//           STRING_AGG(dsa.SecretaryCode, ', ') AS SecretaryCodes,
//           MAX(CASE WHEN sec.rn = 1 THEN ds.[NickName] END) AS SecName1,
//           MAX(CASE WHEN sec.rn = 1 THEN ds.ContactNumber END) AS SecMPN1,
//           MAX(CASE WHEN sec.rn = 2 THEN ds.[NickName] END) AS SecName2,
//           MAX(CASE WHEN sec.rn = 2 THEN ds.ContactNumber END) AS SecMPN2
//         FROM UERMMMC..DoctorSecretaryAssignments dsa
//         LEFT JOIN (
//           SELECT
//             DoctorCode,
//             SecretaryCode,
//             Isdeleted,
//             ROW_NUMBER() OVER (PARTITION BY DoctorCode ORDER BY SecretaryCode) AS rn
//           FROM UERMMMC..DoctorSecretaryAssignments
//         ) sec ON dsa.DoctorCode = sec.DoctorCode AND dsa.SecretaryCode = sec.SecretaryCode
//         LEFT JOIN UERMMMC..DoctorSecretaries ds ON dsa.SecretaryCode = ds.Code
//         GROUP BY dsa.DoctorCode, sec.IsDeleted
//     )
//     SELECT
//         dr.CODE AS doctorCode,
//         dr.GENDER,
//         dr.EMP_CODE AS employeeCode,
//         dr.EHR_Code doctorEhrCode,
//         dr.[NAME] AS doctorName,
//         dr.LIC,
//         dr.PHIC,
//         dr.CONTACTNOS,
//         dr.DEPARTMENT,
//         dr.SKED,
//         dr.SCHED,
//         dr.ROOM,
//         dr.DOC_CLASS,
//         dr.SERVICE_TYPE,
//         sec.SecName1,
//         sec.SecMPN1,
//         sec.SecName2,
//         sec.SecMPN2,
//         dr.HMOAccred,
//         dr.[AREA OF SPECIALTY] AS specialization,
//         dr.SPECIALTY AS specialty,
//         dr.SUB_SPECIALTY AS subSpecialty,
//         drs.SPECIALTY AS specialtyDesc,
//         drs2.SPECIALTY AS subSpecialtyDesc,
//         dr.DEPARTMENT AS departmentCode,
//         dept.[Name] AS departmentName,
//         STRING_AGG(drh.[HMO CODE], ', ') AS hmoCodes,
//         STRING_AGG(hmo.NAME, ', ') AS hmoNames,
//         CASE
//             WHEN ra.DoctorCode IS NULL THEN 0
//             WHEN ra.DateTimeIn IS NULL AND ra.DateTimeOut IS NULL THEN 0
//             WHEN ra.DateTimeOut IS NULL THEN
//                 CASE
//                     WHEN CAST(ra.DateTimeIn AS DATE) = CAST(GETDATE() AS DATE) THEN 1
//                     WHEN GETDATE() > DATEADD(HOUR, 20, CAST(ra.DateTimeIn AS DATETIME)) THEN 0
//                     ELSE 0
//                 END
//             ELSE 0
//         END AS isOnDuty,
//         ra.DateTimeIn,
//         ra.DateTimeOut,
//         ra.id
//     FROM UERMMMC..DOCTORS dr
//     LEFT JOIN UERMMMC..DR_HMO drh ON dr.CODE = drh.[DR CODE]
//     LEFT JOIN UERMMMC..MedicalDepartments dept ON dept.Code = dr.Department
//     LEFT JOIN UERMMMC..HMO hmo ON drh.[HMO CODE] = hmo.CODE
//     LEFT JOIN UERMMMC..DR_SPECIALTY drs ON dr.SPECIALTY = drs.ID
//     LEFT JOIN UERMMMC..DR_SPECIALTY drs2 ON TRY_CONVERT(INT, dr.SUB_SPECIALTY) = drs2.ID
//     LEFT JOIN RecentAttendance ra ON dr.EHR_CODE = ra.DoctorCode AND ra.rn = 1
//     LEFT JOIN DoctorSecretaries sec ON dr.EHR_CODE = sec.DoctorCode
//   `;

//   const queryParams = [];

//   if (secretaryDoctor) {
//     sqlQuery += `
//       WHERE sec.SecretaryCodes LIKE '%' + ? + '%' and sec.IsDeleted IS NULL
//     `;
//     queryParams.push(secretaryCode);
//   } else {
//     sqlQuery += `
//       WHERE
//       (ISNULL(dr.Deleted, '') = '' OR dr.Deleted = 0)
//       AND (? = '' OR dept.[NAME] LIKE '%' + ? + '%' OR drs.SPECIALTY LIKE '%' + ? + '%' OR drs2.SPECIALTY LIKE '%' + ? + '%')
//       AND (? = '' OR dr.[NAME] LIKE '%' + ? + '%')
//       AND (? = '' OR drh.[HMO CODE] = ?)
//       AND dept.Code NOT IN ('UEDEN', 'EMED')
//     `;

//     queryParams.push(
//       departmentName,
//       departmentName,
//       departmentName,
//       departmentName,
//     );
//     queryParams.push(doctorName, doctorName);
//     queryParams.push(hmo, hmo);
//   }

//   sqlQuery += `
//     GROUP BY
//         dr.CODE, dr.EMP_CODE, dr.EHR_Code, dr.[NAME], dr.LIC, dr.PHIC, dr.CONTACTNOS,
//         dr.[AREA OF SPECIALTY], dr.DEPARTMENT, dr.SKED, dr.SCHED, dr.ROOM,
//         dr.DOC_CLASS, dr.SERVICE_TYPE, dr.HMOAccred, dr.SUB_SPECIALTY, dr.SPECIALTY,
//         drs.SPECIALTY, drs2.SPECIALTY, dept.[Name], dr.GENDER,
//         ra.DoctorCode, ra.DateTimeIn, ra.DateTimeOut, ra.id,
//         sec.SecName1, sec.SecMPN1, sec.SecName2, sec.SecMPN2
//     ORDER BY dr.[NAME];
//   `;

//   return await sqlHelper.query(sqlQuery, queryParams, txn);
// };

// const getDoctors = async ({
//   departmentName,
//   doctorName,
//   hmo,
//   secretaryDoctor,
//   secretaryCode,
//   txn,
// }) => {
//   //   WITH RecentAttendance AS (
//   //     SELECT
//   //         da.DoctorCode,
//   //         da.DateTimeIn,
//   //         da.DateTimeOut,
//   //         da.id,
//   //         ROW_NUMBER() OVER (PARTITION BY da.DoctorCode ORDER BY da.DateTimeIn DESC) AS rn
//   //     FROM UERMMMC..DoctorAttendance da
//   // ),

//   let sqlQuery = `
//     WITH RecentAttendance AS (
//         SELECT
//             da.DoctorCode,
//             da.DateTimeIn,
//             da.DateTimeOut,
//             da.id,
//             ROW_NUMBER() OVER (PARTITION BY da.DoctorCode ORDER BY da.DateTimeIn DESC) AS rn
//         FROM UERMMMC..DoctorAttendance da
//         WHERE CAST(da.DateTimeIn AS DATE) = CAST(GETDATE() AS DATE)
//     ),
//     SecretaryRanks AS (
//         SELECT
//             dsa.DoctorCode,
//             dsa.SecretaryCode,
//             ds.NickName,
//             ds.ContactNumber +
//                 CASE
//                     WHEN ds.ContactNumber2 IS NOT NULL AND ds.ContactNumber2 <> ''
//                     THEN ', ' + ds.ContactNumber2
//                     ELSE ''
//                 END AS ContactNumbers,
//             ROW_NUMBER() OVER (PARTITION BY dsa.DoctorCode ORDER BY dsa.SecretaryCode) AS rn
//         FROM UERMMMC..DoctorSecretaryAssignments dsa
//         LEFT JOIN UERMMMC..DoctorSecretaries ds ON dsa.SecretaryCode = ds.Code
//         WHERE dsa.IsDeleted IS NULL OR dsa.IsDeleted = 0
//     ),
//     DoctorSecretaries AS (
//         SELECT
//             sr.DoctorCode,
//             STRING_AGG(sr.SecretaryCode, ', ') AS SecretaryCodes,
//             MAX(CASE WHEN sr.rn = 1 THEN sr.NickName END) AS SecName1,
//             MAX(CASE WHEN sr.rn = 1 THEN sr.ContactNumbers END) AS SecMPN1,
//             MAX(CASE WHEN sr.rn = 2 THEN sr.NickName END) AS SecName2,
//             MAX(CASE WHEN sr.rn = 2 THEN sr.ContactNumbers END) AS SecMPN2
//         FROM SecretaryRanks sr
//         WHERE sr.rn <= 2
//         GROUP BY sr.DoctorCode
//     )
//     SELECT
//         dr.CODE AS doctorCode,
//         dr.GENDER,
//         dr.EMP_CODE AS employeeCode,
//         dr.EHR_Code AS doctorEhrCode,
//         dr.[NAME] AS doctorName,
//         dr.LIC,
//         dr.PHIC,
//         dr.CONTACTNOS,
//         dr.DEPARTMENT,
//         dr.SKED,
//         dr.SCHED,
//         dr.ROOM,
//         dr.DOC_CLASS,
//         dr.SERVICE_TYPE,
//         sec.SecName1,
//         sec.SecMPN1,
//         sec.SecName2,
//         sec.SecMPN2,
//         dr.HMOAccred,
//         dr.[AREA OF SPECIALTY] AS specialization,
//         dr.SPECIALTY AS specialty,
//         dr.SUB_SPECIALTY AS subSpecialty,
//         drs.SPECIALTY AS specialtyDesc,
//         drs2.SPECIALTY AS subSpecialtyDesc,
//         dr.DEPARTMENT AS departmentCode,
//         dept.[Name] AS departmentName,
//         STRING_AGG(drh.[HMO CODE], ', ') AS hmoCodes,
//         STRING_AGG(hmo.NAME, ', ') AS hmoNames,
//         CASE
//             WHEN ra.DoctorCode IS NULL THEN 0
//             WHEN ra.DateTimeIn IS NULL AND ra.DateTimeOut IS NULL THEN 0
//             WHEN ra.DateTimeOut IS NULL THEN
//                 CASE
//                     WHEN CAST(ra.DateTimeIn AS DATE) = CAST(GETDATE() AS DATE) THEN 1
//                     WHEN GETDATE() > DATEADD(HOUR, 20, CAST(ra.DateTimeIn AS DATETIME)) THEN 0
//                     ELSE 0
//                 END
//             ELSE 0
//         END AS isOnDuty,
//         ra.DateTimeIn,
//         ra.DateTimeOut,
//         ra.id
//     FROM UERMMMC..DOCTORS dr
//     LEFT JOIN UERMMMC..DR_HMO drh ON dr.CODE = drh.[DR CODE]
//     LEFT JOIN UERMMMC..MedicalDepartments dept ON dept.Code = dr.Department
//     LEFT JOIN UERMMMC..HMO hmo ON drh.[HMO CODE] = hmo.CODE
//     LEFT JOIN UERMMMC..DR_SPECIALTY drs ON dr.SPECIALTY = drs.ID
//     LEFT JOIN UERMMMC..DR_SPECIALTY drs2
//         ON CASE WHEN ISNUMERIC(dr.SUB_SPECIALTY) = 1 THEN CAST(dr.SUB_SPECIALTY AS INT) ELSE NULL END = drs2.ID
//     LEFT JOIN RecentAttendance ra ON dr.EHR_CODE = ra.DoctorCode AND ra.rn = 1
//     LEFT JOIN DoctorSecretaries sec ON dr.EHR_CODE = sec.DoctorCode
//   `;

//   const queryParams = [];

//   if (secretaryDoctor) {
//     sqlQuery += `
//       WHERE sec.SecretaryCodes LIKE '%' + ? + '%'
//     `;
//     queryParams.push(secretaryCode);
//   } else {
//     sqlQuery += `
//       WHERE
//       (ISNULL(dr.Deleted, '') = '' OR dr.Deleted = 0)
//       AND (? = '' OR dept.[NAME] LIKE '%' + ? + '%' OR drs.SPECIALTY LIKE '%' + ? + '%' OR drs2.SPECIALTY LIKE '%' + ? + '%')
//       AND (? = '' OR dr.[NAME] LIKE '%' + ? + '%')
//       AND (? = '' OR drh.[HMO CODE] = ?)
//       AND dept.Code NOT IN ('UEDEN', 'EMED')
//     `;

//     queryParams.push(
//       departmentName,
//       departmentName,
//       departmentName,
//       departmentName,
//     );
//     queryParams.push(doctorName, doctorName);
//     queryParams.push(hmo, hmo);
//   }

//   sqlQuery += `
//     GROUP BY
//         dr.CODE, dr.GENDER, dr.EMP_CODE, dr.EHR_Code, dr.[NAME], dr.LIC, dr.PHIC, dr.CONTACTNOS,
//         dr.DEPARTMENT, dr.SKED, dr.SCHED, dr.ROOM, dr.DOC_CLASS, dr.SERVICE_TYPE,
//         sec.SecName1, sec.SecMPN1, sec.SecName2, sec.SecMPN2, dr.HMOAccred,
//         dr.[AREA OF SPECIALTY], dr.SPECIALTY, dr.SUB_SPECIALTY, drs.SPECIALTY,
//         drs2.SPECIALTY, dr.DEPARTMENT, dept.[Name], ra.DoctorCode, ra.DateTimeIn, ra.DateTimeOut, ra.id
//     ORDER BY dr.[NAME]
//   `;

//   return await sqlHelper.query(sqlQuery, queryParams, txn);
// };

const getDoctors = async ({
  departmentName,
  doctorName,
  hmo,
  secretaryDoctor,
  secretaryCode,
  txn,
}) => {
  let sqlQuery = `
    WITH RecentAttendance AS (
        SELECT 
            da.DoctorCode,
            da.DateTimeIn,
            da.DateTimeOut,
            da.id,
            ROW_NUMBER() OVER (PARTITION BY da.DoctorCode ORDER BY da.DateTimeIn DESC) AS rn
        FROM UERMMMC..DoctorAttendance da
        WHERE CAST(da.DateTimeIn AS DATE) = CAST(GETDATE() AS DATE)
    ),
    SecretaryRanks AS (
        SELECT 
            dsa.DoctorCode,
            dsa.SecretaryCode,
            ds.NickName,
            ds.ContactNumber + 
                CASE 
                    WHEN ds.ContactNumber2 IS NOT NULL AND ds.ContactNumber2 <> '' 
                    THEN ', ' + ds.ContactNumber2 
                    ELSE '' 
                END AS ContactNumbers,
            ROW_NUMBER() OVER (PARTITION BY dsa.DoctorCode ORDER BY dsa.SecretaryCode) AS rn
        FROM UERMMMC..DoctorSecretaryAssignments dsa
        LEFT JOIN UERMMMC..DoctorSecretaries ds ON dsa.SecretaryCode = ds.Code
        WHERE dsa.IsDeleted IS NULL OR dsa.IsDeleted = 0
    ),
    DoctorSecretaries AS (
        SELECT 
            sr.DoctorCode,
            STRING_AGG(sr.SecretaryCode, ', ') AS SecretaryCodes,
            MAX(CASE WHEN sr.rn = 1 THEN sr.NickName END) AS SecName1,
            MAX(CASE WHEN sr.rn = 1 THEN sr.ContactNumbers END) AS SecMPN1,
            MAX(CASE WHEN sr.rn = 2 THEN sr.NickName END) AS SecName2,
            MAX(CASE WHEN sr.rn = 2 THEN sr.ContactNumbers END) AS SecMPN2
        FROM SecretaryRanks sr
        WHERE sr.rn <= 2
        GROUP BY sr.DoctorCode
    ),
    DoctorConsultSchedules AS (
        SELECT 
            dcs.DoctorCode,
            STRING_AGG(
                dcs.Day + ' - (' +
                REPLACE(RIGHT(CONVERT(VARCHAR(20), dcs.TimeFrom, 100), 7), ' ', '') + ' to ' +
                REPLACE(RIGHT(CONVERT(VARCHAR(20), dcs.TimeTo, 100), 7), ' ', '') + ') - ' +
                dct.Name,
                ', '
            ) AS DoctorSchedule
        FROM UERMMMC..DoctorConsultationSchedules dcs
		LEFT JOIN UERMMMC..DoctorConsultationTypes dct ON dcs.ConsultationTypeCode = dct.Code
        GROUP BY dcs.DoctorCode
    ),
    DoctorDeptSpecialty AS (
      SELECT 
        ds.DoctorEhrCode,
      
        Department = STRING_AGG(CASE WHEN md.Parent IS NULL THEN md.Name END, ', ') 
                WITHIN GROUP (ORDER BY md.Name),

        DepartmentCodes = STRING_AGG(CASE WHEN md.Parent IS NULL THEN CAST(md.Code AS VARCHAR) END, ', ') 
                  WITHIN GROUP (ORDER BY md.Name),
      
        Specialties = STRING_AGG(CASE WHEN md.Parent IS NOT NULL THEN md.Name END, ', ') 
                WITHIN GROUP (ORDER BY md.Name),

        SpecialtyCodes = STRING_AGG(CASE WHEN md.Parent IS NOT NULL THEN CAST(md.Code AS VARCHAR) END, ', ') 
                  WITHIN GROUP (ORDER BY md.Name),
        ds.Active
      FROM UERMMMC..DoctorSpecialties ds
      LEFT JOIN UERMMMC..MedicalDepartments md 
        ON ds.SpecialtyCode = md.Code
      WHERE ds.Active = 1
      GROUP BY ds.DoctorEhrCode, ds.Active
    ),

    BaseDoctors AS (
      SELECT
          dr.CODE doctorCode,
          dr.GENDER,
          dr.EMP_CODE employeeCode,
          dr.EHR_Code doctorEhrCode,
          CASE 
            WHEN dr.[FIRST NAME] IS NULL OR dr.[FIRST NAME] = '' 
              OR dr.[MIDDLE NAME] IS NULL OR dr.[MIDDLE NAME] = '' 
              OR dr.[LAST NAME] IS NULL OR dr.[LAST NAME] = '' 
            THEN dr.name 
            ELSE dr.[LAST NAME] + ', ' + dr.[FIRST NAME] + ' ' +  + LEFT(dr.[MIDDLE NAME], 1) + ISNULL(dr.Suffix, '') 
          END AS doctorName,
          dr.[FIRST NAME] firstName,
          dr.[LAST NAME] lastName,
          dr.[MIDDLE NAME] middleName,
          dr.Suffix,
          dr.LIC,
          dr.PHIC,
          dr.CONTACTNOS,
          dr.DEPARTMENT,
          dr.SKED,
          dr.SCHED,
          dr.ROOM,
          dr.DOC_CLASS,
          dr.SERVICE_TYPE,
          sec.SecName1,
          sec.SecMPN1,
          sec.SecName2,
          sec.SecMPN2,
          dr.HMOAccred,
          dr.[AREA OF SPECIALTY] specialization,
          ISNULL(specDept.Department, md.Name) departmentName,
          ISNULL(specDept.DepartmentCodes, dr.DEPARTMENT) departmentCode,
          ISNULL(specDept.Specialties, dr.[AREA OF SPECIALTY]) specialties,
          specDept.SpecialtyCodes specialtyCodes,
          STRING_AGG(drh.[HMO CODE], ', ') hmoCodes,
          STRING_AGG(hmo.NAME, ', ') hmoNames,
          ISNULL(sched.DoctorSchedule, dr.SKED) doctorSchedule,
          CASE
              WHEN ra.DoctorCode IS NULL THEN 0
              WHEN ra.DateTimeIn IS NULL AND ra.DateTimeOut IS NULL THEN 0
              WHEN ra.DateTimeOut IS NULL THEN
                  CASE
                      WHEN CAST(ra.DateTimeIn AS DATE) = CAST(GETDATE() AS DATE) THEN 1
                      WHEN GETDATE() > DATEADD(HOUR, 20, CAST(ra.DateTimeIn AS DATETIME)) THEN 0
                      ELSE 0
                  END
              ELSE 0
          END AS isOnDuty,
          ra.DateTimeIn,
          ra.DateTimeOut,
          ra.id
      FROM UERMMMC..DOCTORS dr
      LEFT JOIN UERMMMC..DR_HMO drh ON dr.CODE = drh.[DR CODE]
      LEFT JOIN UERMMMC..HMO hmo ON drh.[HMO CODE] = hmo.CODE
      LEFT JOIN RecentAttendance ra ON dr.EHR_CODE = ra.DoctorCode AND ra.rn = 1
      LEFT JOIN DoctorSecretaries sec ON dr.EHR_CODE = sec.DoctorCode
      LEFT JOIN DoctorConsultSchedules sched ON dr.EHR_CODE = sched.DoctorCode
      LEFT JOIN DoctorDeptSpecialty specDept ON dr.EHR_CODE = specDept.DoctorEhrCode
      LEFT JOIN UERMMMC..MedicalDepartments md ON dr.DEPARTMENT = md.Code
      WHERE (ISNULL(dr.Deleted, '') = '' OR dr.Deleted = 0)
      GROUP BY
          dr.CODE, dr.GENDER, dr.EMP_CODE, dr.EHR_Code, dr.[NAME], dr.LIC, dr.PHIC, dr.CONTACTNOS,
          dr.DEPARTMENT, dr.SKED, dr.SCHED, dr.ROOM, dr.DOC_CLASS, dr.SERVICE_TYPE,
          sec.SecName1, sec.SecMPN1, sec.SecName2, sec.SecMPN2, dr.HMOAccred,
          dr.[AREA OF SPECIALTY], dr.SPECIALTY, dr.SUB_SPECIALTY, dr.DEPARTMENT, ra.DoctorCode, ra.DateTimeIn, ra.DateTimeOut, ra.id,
          sched.DoctorSchedule, dr.[FIRST NAME], dr.[LAST NAME], dr.[MIDDLE NAME], 
          specDept.Department, specDept.Specialties, specDept.DepartmentCodes, specDept.SpecialtyCodes, md.name,
          dr.suffix
    )

    SELECT bd.*
    FROM BaseDoctors bd

    `;

  const queryParams = [];

  if (secretaryDoctor) {
    sqlQuery += `
     WHERE bd.SecName1 IS NOT NULL 
       AND EXISTS (
         SELECT 1
         FROM DoctorSecretaries ds
         WHERE ds.DoctorCode = bd.doctorEhrCode
           AND ds.SecretaryCodes LIKE '%' + ? + '%'
       )
    `;
    queryParams.push(secretaryCode);
  } else {
    sqlQuery += `
      WHERE 
        (
          ? = '' OR 
          (bd.departmentCode IS NOT NULL AND bd.departmentCode LIKE '%' + ? + '%') OR 
          (bd.specialties IS NOT NULL AND bd.specialties LIKE '%' + ? + '%')
        )
        AND (? = '' OR bd.doctorName LIKE '%' + ? + '%')
        AND (? = '' OR bd.hmoCodes LIKE '%' + ? + '%')
        AND (bd.departmentCode IS NULL OR ',' + bd.departmentCode + ',' NOT LIKE '%,UEDEN,%')
        AND (bd.departmentCode IS NULL OR ',' + bd.departmentCode + ',' NOT LIKE '%,EMED,%')
    `;
    queryParams.push(
      departmentName,
      departmentName,
      departmentName,
      doctorName,
      doctorName,
      hmo,
      hmo,
    );
  }

  sqlQuery += `
    ORDER BY bd.doctorName ASC
  `;

  return await sqlHelper.query(sqlQuery, queryParams, txn);
};

const getSpecialization = async () => {
  return await sqlHelper.query(
    `SELECT ID id, SPECIALTY specialty
    FROM
      UERMMMC..DR_SPECIALTY
    WHERE
      DELETED != 1
    ORDER BY SPECIALTY ASC
    `,
  );
};

const getHmos = async () => {
  return await sqlHelper.query(
    `SELECT
      CODE, NAME, SHORTDESC
    FROM
      UERMMMC..HMO
    WHERE
      Deleted != 1 and CODE != 'N/A'
    ORDER BY
      NAME ASC
    `,
  );
};

const getPicture = async (doctorEhrCode, doctorCode) => {
  // return await sqlHelper.query(
  //   `SELECT *
  //   FROM
  //     PictureDatabase..PictureMD
  //   WHERE
  //     EHRCode = ?
  //   `,
  //   [employeeCode],
  // );
  return await sqlHelper.query(
    `SELECT TOP 1 * 
		FROM (
			SELECT Picture PictureData, 1 AS Priority 
			FROM PictureDatabase..PictureMD 
			WHERE EHRCode = ?

			UNION ALL

			SELECT PictureImage PictureData, 2 AS Priority 
			FROM PictureDatabase..Picture 
			WHERE PictureId = ?
		) AS Combined
		ORDER BY Priority
    `,
    [doctorEhrCode, doctorCode],
  );
};

const getDoctorsDepartment = async () => {
  // return await sqlHelper.query(
  //   `WITH MedicalDept AS (
  //       SELECT
  //           CASE
  //               WHEN Name = 'Otorhinolaryngology' THEN 'ENT'
  //               WHEN Name = 'Trauma' AND Code = 'SURG-TRAUMA' THEN 'Surgery Trauma'
  //               WHEN Name = 'Trauma' AND Code = 'NEURO-TRAUMA' THEN 'Neuro Trauma'
  //               ELSE Name
  //           END AS label,
  //           Code AS value
  //       FROM UERMMMC..MedicalDepartments
  //       WHERE Code NOT IN ('UEDEN', 'EMED')
  //   )

  //   SELECT
  //       md.label,
  //       md.value
  //   FROM MedicalDept md
  //   WHERE
  //       EXISTS (
  //           SELECT 1
  //           FROM UERMMMC..DOCTORS d
  //           LEFT JOIN UERMMMC..MedicalDepartments dept ON d.DEPARTMENT = dept.Code
  //           LEFT JOIN UERMMMC..DR_SPECIALTY drs ON d.SPECIALTY = drs.ID
  //           LEFT JOIN UERMMMC..DR_SPECIALTY drs2
  //               ON CASE
  //                     WHEN ISNUMERIC(d.SUB_SPECIALTY) = 1 THEN CONVERT(INT, d.SUB_SPECIALTY)
  //                     ELSE NULL
  //                 END = drs2.ID
  //           WHERE
  //               drs.SPECIALTY LIKE '%' + md.label + '%'
  //               OR drs2.SPECIALTY LIKE '%' + md.label + '%'
  //               OR dept.Name LIKE '%' + md.label + '%'
  //       )
  //   ORDER BY
  //       md.label ASC
  //   `,
  // );

  return await sqlHelper.query(
    `WITH MedicalDept AS (
        SELECT 
            CASE 
                WHEN Name = 'Otorhinolaryngology' THEN 'ENT' 
                WHEN Name = 'Trauma' AND Code = 'SURG-TRAUMA' THEN 'Surgery Trauma'
                WHEN Name = 'Trauma' AND Code = 'NEURO-TRAUMA' THEN 'Neuro Trauma'
                ELSE Name 
            END AS label,
            Code AS value
        FROM UERMMMC..MedicalDepartments
        WHERE Code NOT IN ('UEDEN', 'EMED') 
    )

    SELECT 
        md.label,
        md.value
    FROM MedicalDept md
    `,
  );
};

const getDoctorHmo = async (drCode) => {
  return await sqlHelper.query(
    `SELECT 
      drh.[DR CODE] drCode, 
      drh.[HMO CODE] hmoCode, 
      hmo.NAME hmoDescription, 
      imageFile
    FROM 
      UERMMMC..DR_HMO drh
    LEFT JOIN 
      UERMMMC..HMO hmo ON drh.[HMO CODE] = hmo.CODE
    WHERE 
      drh.DELETED = 0 
      AND drh.[DR CODE] = ?
    `,
    [drCode],
  );
};

const insertNewSecretary = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DoctorSecretaries",
    item,
    txn,
    creationDateTimeField,
  );
};

const insertSecretaryAssignments = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DoctorSecretaryAssignments",
    item,
    txn,
    creationDateTimeField,
  );
};

const updateSecretaryPassword = async (
  item,
  condition,
  txn,
  updateTimeField,
) => {
  return await sqlHelper.update(
    "UERMMMC..DoctorSecretaries",
    item,
    condition,
    txn,
    updateTimeField,
  );
};

const checkAttendance = async (doctorCode) => {
  return await sqlHelper.query(
    `SELECT 
      TOP 1 *  
    FROM 
      UERMMMC..DoctorAttendance  
    WHERE 
      DoctorCode = ? 
      AND CAST(DateTimeIn AS DATE) = CAST(GETDATE() AS DATE)  
    ORDER BY 
      DateTimeIn DESC;
    `,
    [doctorCode],
  );
};

const insertDoctorAttendance = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DoctorAttendance",
    item,
    txn,
    creationDateTimeField,
  );
};

const updateDoctorAttendance = async (id, txn) => {
  return await sqlHelper.query(
    `UPDATE UERMMMC..DoctorAttendance
    SET DateTimeOut = GETDATE()
    WHERE Id = ?
    `,
    [id],
    txn,
  );
};

const getAllSecretary = async () => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      UERMMMC..DoctorSecretaries
    WHERE
      IsActive = 1
    `,
  );
};

const updateDoctorInformation = async (
  doctorEhrCode,
  name,
  areaOfSpecialty,
  sched,
  sked,
  room,
  local,
  txn,
) => {
  return await sqlHelper.query(
    `UPDATE UERMMMC..DOCTORS
    SET 
      NAME = CASE WHEN NAME <> ? OR NAME IS NULL THEN ? ELSE NAME END,
      [AREA OF SPECIALTY] = ?, 
      ROOM = ?, 
      SKED = ?, 
      SCHED = ?, 
      LOCAL = ?, 
      LastUpdatedBy = '8958', 
      LastUpdateDate = GETDATE()
    WHERE EHR_CODE = ?`,
    [name, name, areaOfSpecialty, room, sked, sched, local, doctorEhrCode],
    txn,
  );
};

const getAllSecretaryWithDoctors = async () => {
  return await sqlHelper.query(
    `SELECT dsa.Id, ds.Code secretaryCode, ds.Name secretaryName, dsa.DoctorCode, d.NAME doctorName
    FROM UERMMMC..DoctorSecretaryAssignments dsa
    LEFT JOIN UERMMMC..DoctorSecretaries ds ON dsa.SecretaryCode = ds.Code
    LEFT JOIN UERMMMC..DOCTORS d ON dsa.DoctorCode = d.EHR_CODE
    WHERE (dsa.IsDeleted IS NULL OR dsa.IsDeleted = 0)
    GROUP BY dsa.Id, ds.Code, ds.Name, d.NAME, dsa.DoctorCode
    ORDER BY ds.Name ASC
    `,
  );
};

const updateDoctorAssignment = async (
  item,
  condition,
  txn,
  updateTimeField,
) => {
  return await sqlHelper.update(
    "UERMMMC..DoctorSecretaryAssignments",
    item,
    condition,
    txn,
    updateTimeField,
  );
};

const checkLogDoctorAssignment = async (doctorCode, secretaryCode) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      UERMMMC..DoctorSecretaryAssignments
    WHERE SecretaryCode = ? AND DoctorCode = ?
    `,
    [secretaryCode, doctorCode],
  );
};

const insertDoctorAssignment = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DoctorSecretaryAssignments",
    item,
    txn,
    creationDateTimeField,
  );
};

const checkSecretaryData = async (secretaryCode, secretaryName) => {
  return await sqlHelper.query(
    `SELECT *
    FROM 
      UERMMMC..DoctorSecretaries
    WHERE
      Code = ? OR Name = ?
    `,
    [secretaryCode, secretaryName],
  );
};

const checkDoctorTimeOutDaily = async () => {
  return await sqlHelper.query(
    // `SELECT
    //   *,
    //   CASE
    //       WHEN DoctorCode IS NULL THEN 0
    //       WHEN DateTimeIn IS NULL AND DateTimeOut IS NULL THEN 0
    //       WHEN DateTimeOut IS NULL THEN
    //           CASE
    //               WHEN CAST(DateTimeIn AS DATE) = CAST(GETDATE() AS DATE) THEN 1
    //               WHEN GETDATE() > DATEADD(HOUR, 20, CAST(DateTimeIn AS DATETIME)) THEN 0
    //               ELSE 0
    //           END
    //       ELSE 0
    //   END AS isOnDuty
    // FROM
    //   UERMMMC..DoctorAttendance
    // WHERE
    //   DateTimeOut IS NULL
    // `,
    `SELECT 
        *
    FROM
        UERMMMC..DoctorAttendance
    WHERE
        DateTimeOut IS NULL
    `,
  );
};

const existingPassword = async () => {
  return await sqlHelper.query(
    `SELECT
      password
    FROM
      UERMMMC..DoctorSecretaries
    `,
  );
};

const doctorContacts = async (doctorCode) => {
  return await sqlHelper.query(
    `SELECT
      *
    FROM 
      UERMMMC..DoctorContactInfo
    WHERE 
      DoctorCode = ? AND Type = 'LANDLINE_PHONE'
    `,
    [doctorCode],
  );
};

const doctorSchedule = async (doctorCode) => {
  return await sqlHelper.query(
    `SELECT
        dc.Id,
        dc.DoctorCode,
        dc.Day,
        dc.TimeFrom,
        dc.TimeTo,
        dc.Remarks,
        dct.name ConsultationTypeDesc
    FROM 
        UERMMMC..DoctorConsultationSchedules dc
	  LEFT JOIN
		UERMMMC..DoctorConsultationTypes dct ON dc.ConsultationTypeCode = dct.Code
    WHERE 
        DoctorCode = ?;
    `,
    [doctorCode],
  );
};

const doctorEducation = async (doctorCode) => {
  return await sqlHelper.query(
    `SELECT
      *
    FROM 
      UERMMMC..DoctorQualifications
    WHERE 
      DoctorCode = ?
    ORDER BY
      YearTo DESC
    `,
    [doctorCode],
  );
};

const updateDoctor = async (item, condition, txn, updateTimeField) => {
  return await sqlHelper.update(
    "UERMMMC..DOCTORS",
    item,
    condition,
    txn,
    updateTimeField,
  );
};

const updateSchedule = async (item, condition, txn, updateTimeField) => {
  return await sqlHelper.update(
    "UERMMMC..DoctorConsultationSchedules",
    item,
    condition,
    txn,
    updateTimeField,
  );
};

const insertDoctorSpecialist = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DoctorSpecialties",
    item,
    txn,
    creationDateTimeField,
  );
};

const insertDoctorHmo = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DR_HMO",
    item,
    txn,
    creationDateTimeField,
  );
};

const checkHmo = async (hmoCode, drCode, txn) => {
  return await sqlHelper.query(
    `SELECT * FROM UERMMMC..DR_HMO
    WHERE [DR CODE] = ? and [HMO CODE] = ?
    `,
    [drCode, hmoCode],
    txn,
  );
};

const updateHmo = async (item, condition, txn, updateTimeField) => {
  return await sqlHelper.update(
    "UERMMMC..DR_HMO",
    item,
    condition,
    txn,
    updateTimeField,
  );
};

const consultationOption = async () => {
  return await sqlHelper.query(
    `SELECT 
      Code value,
      Name label 
    FROM UERMMMC..DoctorConsultationTypes
    `,
  );
};

const deptSpecOption = async () => {
  return await sqlHelper.query(
    `SELECT
      TRIM(Code) value,
      Name label,
      Parent,
      Id
    FROM UERMMMC..MedicalDepartments
    WHERE Code NOT IN ('UEDEN', 'EMED')
    ORDER BY 
      Name ASC
    `,
  );
};

const checkSpecialty = async (doctorEhrCode, specialtyCode, txn) => {
  return await sqlHelper.query(
    `SELECT *
    FROM
      UERMMMC..DoctorSpecialties
    WHERE
      DoctorEHRCode = ?
      AND SpecialtyCode = ?
    `,
    [doctorEhrCode, specialtyCode],
    txn,
  );
};

const updateSpecDept = async (item, condition, txn, updateTimeField) => {
  return await sqlHelper.update(
    "UERMMMC..DoctorSpecialties",
    item,
    condition,
    txn,
    updateTimeField,
  );
};

const insertContact = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DoctorContactInfo",
    item,
    txn,
    creationDateTimeField,
  );
};

const updateContact = async (item, condition, txn, updateTimeField) => {
  return await sqlHelper.update(
    "UERMMMC..DoctorContactInfo",
    item,
    condition,
    txn,
    updateTimeField,
  );
};

const insertSchedule = async (item, txn, creationDateTimeField) => {
  return await sqlHelper.insert(
    "UERMMMC..DoctorConsultationSchedules",
    item,
    txn,
    creationDateTimeField,
  );
};

module.exports = {
  insertImageBase64,
  getServices,
  getWellness,
  getDoctors,
  getSpecialization,
  getHmos,
  getPicture,
  getDoctorsDepartment,
  getDoctorHmo,
  insertNewSecretary,
  insertSecretaryAssignments,
  updateSecretaryPassword,
  checkAttendance,
  insertDoctorAttendance,
  updateDoctorAttendance,
  getAllSecretary,
  updateDoctorInformation,
  getAllSecretaryWithDoctors,
  updateDoctorAssignment,
  checkLogDoctorAssignment,
  insertDoctorAssignment,
  checkSecretaryData,
  checkDoctorTimeOutDaily,
  existingPassword,
  doctorSchedule,
  doctorEducation,
  doctorContacts,
  updateDoctor,
  updateSchedule,
  insertDoctorSpecialist,
  checkHmo,
  updateHmo,
  insertDoctorHmo,
  consultationOption,
  deptSpecOption,
  checkSpecialty,
  updateSpecDept,
  insertContact,
  updateContact,
  insertSchedule,
};

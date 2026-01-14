const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectProcedureName = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
 [id]
      ,[code]
      ,[caseNo]
      ,[encounterCode]
	   ,[ProcedureCode]
	   	      ,[diagnosisProcedure]
      ,[isBedsideProcedure]
      ,[OpTechForm]
      ,[createdBy]
      ,[dateTimeCreated]
      ,[OpTechDateUpdated]
      ,[dateTimeUpdated]
      ,[updatedBy]
      ,[OpRecForm]
      ,[OprecCreatedBy]
      ,[OprecDateCreated]
      ,[OprecUpdatedBy]
      ,[OprecDateUpdated]
      ,[active]
     
  FROM [UERMMMC].[dbo].[OrbitOperatives]
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectEncodingAnalytics = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `SELECT distinct
department as Department, count(department) as Total  
    
  FROM [UERMMMC].[dbo].[OrbitOperatives]

    WHERE 1=1 ${conditions}  group by department
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectPatientRecords = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `
    WITH DoctorAgg AS (
    SELECT 
        p.CASENO,
        STRING_AGG(d.NAME, ', ') AS PHYSICIANS,
        MAX(p.DR_CODE) AS DR_CODE
    FROM [UERMMMC].[dbo].PROFEE p
    JOIN [UERMMMC].[dbo].DOCTORS d ON p.DR_CODE = d.code
    GROUP BY p.CASENO
)
    
    SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      	  orbitOp.code,
      STRING_AGG(case when signatoriess.type= 'visAsstSurg' and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingAssistant,
		 STRING_AGG(case when signatoriess.type= 'visSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingSurgeon,
		 STRING_AGG(case when signatoriess.type= 'ueSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UESurgeon,
		  STRING_AGG(case when signatoriess.type= 'ueAsstSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEAssistant,
   STRING_AGG(case when signatoriess.type= 'visitingAnesthesia'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVistAnesthesss,
		  STRING_AGG(case when signatoriess.type= 'ueAnes'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEAness,
     da.PHYSICIANS,
       LEFT(orbitOp.startDateTimeOperation, 10) AS DatePart,                      
                    
    da.DR_CODE,
      cases.id,
      cases.datead,
      cases.CASENO,
      CONCAT(px_info.LASTNAME,', ', px_info.FIRSTNAME, ' ', px_info.MIDDLENAME) AS PATIENTNAME,
        CONCAT(px_info.AGE, '/',LEFT( px_info.SEX, 1)) AS sex_age,
         --TIMESTAMPDIFF(YEAR, px_info.DBIRTH, CURDATE()) AS automatedAge,
         	  cases.ADMITTED_BY,
      px_info.LASTNAME,
       px_info.FIRSTNAME,
       px_info.MIDDLENAME,
       px_info.PATIENTNO,
      px_info.DBIRTH,
      px_info.SEX,
       px_info.AGE,
      px_info.ADDRESS,
      phic_codes.PHIC_DESC,
      diagnosis.ADMISSION,
      diagnosis.FINAL,
      cases.DISPOSITION,
      cases.DISCHARGE,
      cases.DATEDIS,
         cases.patienttype,
      cases.patient_category,
      cases.last_room,
        orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
            orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        orbitOp.EncounterCode,
                orbitOp.ProcedureCode,
                 orbitOp.OpTechForm,
     orbitOp.OpRecForm,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,

        orbitOp.endDateTimeOperation,
           LEFT(orbitOp.endDateTimeOperation, 10) AS EndDatePart,                
      RIGHT(CONVERT(VARCHAR(20), orbitOp.startDateTimeOperation, 100), 8) AS timePart,
       RIGHT(CONVERT(VARCHAR(20), orbitOp.endDateTimeOperation, 100), 8) AS endedTimePart,
  
     orbitOp.surgeryIndication,
      orbitOp.preOperativeDiagnosis,
   
      orbitOp.operativeTechnique,
        orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
        orbitOp.remarks,
        
      orbitOp.dateTimeCreated,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
     
      orbitOp.medications,
     
    
      orbitOp.createdBy

    FROM [UERMMMC].[dbo].[CASES] cases
    JOIN [UERMMMC].[dbo].[PATIENTINFO] px_info ON cases.PATIENTNO = px_info.PATIENTNO
    JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes ON cases.PHIC_CODE = phic_codes.PHIC_CODE
    JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis ON cases.CASENO = diagnosis.CASENO
  --  JOIN [UERMMMC].[dbo].[PROFEE] profee ON cases.CASENO = profee.CASENO
   -- JOIN [UERMMMC].[dbo].[DOCTORS] doctors ON profee.DR_CODE = doctors.code
   JOIN DoctorAgg da ON cases.CASENO = da.CASENO
   left join  [UERMMMC].[dbo].[OrbitOperatives] orbitOp  ON diagnosis.CASENO = orbitOp.caseNo
 left  join  [UERMMMC].[dbo].[OrbitSignatories] signatoriess  ON cases.CASENO = signatoriess.caseNo
    WHERE 1=1 ${conditions}

    GROUP BY
    	  orbitOp.code,
      cases.id, cases.CASENO,      cases.datead,
        cases.patient_category,
             orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        
      cases.last_room,
  da.PHYSICIANS,
    da.DR_CODE,
       cases.patienttype,
        orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
      
orbitOp.EncounterCode,
 orbitOp.OpTechForm,
     orbitOp.OpRecForm,
                orbitOp.ProcedureCode,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
orbitOp.remarks,
        orbitOp.endDateTimeOperation,
      
     orbitOp.surgeryIndication,
          orbitOp.department,
      orbitOp.preOperativeDiagnosis,
     
      orbitOp.operativeTechnique,
       orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
      
      orbitOp.medications,
   
    
      orbitOp.createdBy,

             px_info.AGE,

      px_info.DBIRTH, px_info.SEX, px_info.ADDRESS,     px_info.PATIENTNO,
      phic_codes.PHIC_DESC,
       orbitOp.dateTimeUpdated,
      diagnosis.ADMISSION, diagnosis.FINAL,
      cases.DISPOSITION, cases.DISCHARGE,  cases.DATEDIS,
      cases.ADMITTED_BY, px_info.LASTNAME, px_info.MIDDLENAME, px_info.FIRSTNAME

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};
//noah maintenence
//  SELECT
//       cases.CASENO AS CaseNo,
//       px_info.DeptCode AS encountsDepts,
//       px_info.Code AS ecode
//   FROM [UERMMMC].[dbo].[CASES] cases
//   JOIN  [EMR].[dbo].[Encounters] px_info ON cases.CASENO = px_info.CaseNo
//   GROUP BY cases.CASENO, px_info.DeptCode, px_info.Code
const selectedEncodedProcedureMaintenance = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `
WITH DoctorAgg AS (
    SELECT 
        p.CASENO,
        STRING_AGG(d.NAME, ', ') AS PHYSICIANS,
        MAX(p.DR_CODE) AS DR_CODE
    FROM [UERMMMC].[dbo].PROFEE p 
    JOIN [UERMMMC].[dbo].DOCTORS d ON p.DR_CODE = d.code
    GROUP BY p.CASENO
),
encounters AS (
 

     SELECT 
        cases.CASENO AS CaseNo,
		 STRING_AGG(px_info.DeptCode, ', ') AS encountsDepts,
		 MAX(px_info.CaseNo) AS casesMax,
		  MAX(px_info.Code) AS ecode
 
    FROM [UERMMMC].[dbo].[CASES] cases
    JOIN  [EMR].[dbo].[Encounters] px_info ON cases.CASENO = px_info.CaseNo
    GROUP BY cases.CASENO
)
    SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    x.surgicalTeams, 
	x.ecode, 
	x.encountsDepts,
    x.PHYSICIANS,
    x.cASENO,
    x.diagnosisProcedure,
    x.datead,
    x.ADMITTED_BY,
    x.DISCHARGE,
    x.DATEDIS,
    x.PATIENTNO,
    x.PATIENTTYPE,
    x.operativeDiagnosis,
    x.procedureClassification,
    x.OprecCreatedBy,
    x.OprecUpdatedBy,
    x.OprecDateCreated,
    x.OprecDateUpdated,
    x.OpTechDateUpdated,
  
    x.ProcedureCode,
    x.OpTechForm,
    x.OpRecForm,
    x.anesthesia,
    x.startDateTimeOperation,
    x.endDateTimeOperation,
    x.code,
    x.surgeryIndication,
    x.preOperativeDiagnosis,
    x.operativeTechnique,
    x.intraOperative,
    x.isBedsideProcedure,
    x.dateTimeUpdated,
    x.updatedBy,
    x.remarks,
    x.dateTimeCreated,
    x.specimen,
    x.postOpDiagnosis,
    x.operations,
    x.active,
    x.medications,
    x.department,
    x.LASTNAME,
    x.FIRSTNAME,
    x.MIDDLENAME,
    x.DBIRTH,
    x.SEX,
    x.AGE,
    CONCAT(x.LASTNAME, ', ', x.FIRSTNAME, ' ', x.MIDDLENAME) AS PATIENTNAME,
    CONCAT(x.AGE, '/', LEFT(x.SEX, 1)) AS sex_age,
    x.ADMISSION,
    x.FINAL,
    x.PHIC_DESC
FROM (
    SELECT 
        orbitSign.surgicalTeams,
        da.PHYSICIANS,
        enct.ecode,
		  enct.encountsDepts,
        cases.caseNo as cASENO,
        oo.diagnosisProcedure,
        cases.DATEAD,
        cases.ADMITTED_BY,
        cases.DISCHARGE,
        cases.DATEDIS,
        cases.PATIENTNO,
        cases.PATIENTTYPE,
        oo.operativeDiagnosis,
        oo.procedureClassification,
        oo.OprecCreatedBy,
        oo.OprecUpdatedBy,
        oo.OprecDateCreated,
        oo.OprecDateUpdated,
        oo.OpTechDateUpdated,
        oo.EncounterCode,
        oo.ProcedureCode,
        oo.OpTechForm,
        oo.OpRecForm,
        oo.anesthesia,
        oo.startDateTimeOperation,
        oo.endDateTimeOperation,
        oo.code,
        oo.surgeryIndication,
        oo.preOperativeDiagnosis,
        oo.operativeTechnique,
        oo.intraOperative,
        oo.isBedsideProcedure,
        oo.dateTimeUpdated,
        oo.updatedBy,
        oo.remarks,
        oo.dateTimeCreated,
        oo.specimen,
        oo.postOpDiagnosis,
        oo.operations,
        oo.active,
        oo.medications,
        oo.department,
        diagnosis.ADMISSION,
        diagnosis.FINAL,
        phic_codes.PHIC_DESC,
        px_info.LASTNAME,
        px_info.FIRSTNAME,
        px_info.MIDDLENAME,
        px_info.DBIRTH,
        px_info.SEX,
        px_info.AGE,
        px_info.ADDRESS,
        ROW_NUMBER() OVER (
            PARTITION BY cases.caseNo 
            ORDER BY cases.DATEAD DESC
        ) AS rn
    FROM [UERMMMC].[dbo].[CASES] AS cases
    INNER JOIN [UERMMMC].[dbo].[OrbitOperatives] AS oo 
        ON cases.CASENO = oo.caseNo
    INNER JOIN [UERMMMC].[dbo].[PATIENTINFO] AS px_info 
        ON cases.PATIENTNO = px_info.PATIENTNO
    LEFT JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis 
        ON cases.CASENO = diagnosis.CASENO
    LEFT JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes 
        ON cases.PHIC_CODE = phic_codes.PHIC_CODE
    LEFT JOIN DoctorAgg da 
        ON cases.CASENO = da.CASENO
    LEFT JOIN encounters enct 
        ON cases.CASENO = enct.CaseNo
    OUTER APPLY (
        SELECT 
            CONCAT(
                '[', 
                STRING_AGG(
                    CONCAT(
                        '{"type":"', os.[type], 
                        '","procedureCode":"', os.[procedureCode], 
                        '","code":"', os.[code], 
                        '","names":"', os.[name], '"}'
                    ), ','
                ), 
                ']'
            ) AS surgicalTeams
        FROM [UERMMMC].[dbo].[OrbitSignatories] os
        WHERE os.CASENO = cases.CASENO AND os.active = 1
    ) orbitSign
) x

    WHERE 1=1 ${conditions}

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

//dashboard
const selectTestREcords = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `
    WITH DoctorAgg AS (
     SELECT 
        p.CASENO,
        STRING_AGG(d.NAME, ', ') AS PHYSICIANS,
        MAX(p.DR_CODE) AS DR_CODE
    FROM [UERMMMC].[dbo].PROFEE p 
    JOIN [UERMMMC].[dbo].DOCTORS d ON p.DR_CODE = d.code
    GROUP BY p.CASENO
)
    SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
	 da.PHYSICIANS,
    cases.CASENO,
   cases.ADMITTED_BY,
    encounterInfo.LastEncounter,
    cases.id,
      cases.datead,
       cases.DISPOSITION,
      cases.DISCHARGE,
      cases.DATEDIS,
         cases.patienttype,
      cases.patient_category,
      cases.last_room,
    diagnosis.ADMISSION,
    diagnosis.FINAL,
    px_info.LASTNAME,
    px_info.FIRSTNAME,

       px_info.MIDDLENAME,
    px_info.PATIENTNO,
    px_info.DBIRTH,
    px_info.SEX,
    px_info.AGE,
    px_info.ADDRESS,
	 phic_codes.PHIC_DESC,
 orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
             orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        orbitOp.EncounterCode,
        orbitOp.ProcedureCode,
        orbitOp.OpTechForm,
        orbitOp.OpRecForm,
         LEFT(orbitOp.startDateTimeOperation, 10) AS DatePart,       
                            
          CONCAT(px_info.LASTNAME,', ', px_info.FIRSTNAME, ' ', px_info.MIDDLENAME) AS PATIENTNAME,
       CONCAT(px_info.AGE, '/',LEFT( px_info.SEX, 1)) AS sex_age,
		LEFT(orbitOp.endDateTimeOperation, 10) AS EndDatePart,
         RIGHT(CONVERT(VARCHAR(20), orbitOp.startDateTimeOperation, 100), 8) AS timePart,
          RIGHT(CONVERT(VARCHAR(20), orbitOp.endDateTimeOperation, 100), 8) AS endedTimePart,
        orbitOp.anesthesia,
        orbitOp.startDateTimeOperation,
        orbitOp.endDateTimeOperation,
      orbitOp.code,
 
        orbitOp.surgeryIndication,
             orbitOp.department,
        orbitOp.preOperativeDiagnosis,
   
        orbitOp.operativeTechnique,
         orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
        orbitOp.dateTimeUpdated,
        orbitOp.updatedBy,
        orbitOp.remarks,
        orbitOp.dateTimeCreated,
        orbitOp.specimen,
        orbitOp.postOpDiagnosis,
        orbitOp.operations,
      
        orbitOp.medications,
       
        orbitOp.active,
      
        orbitSign.surgicalTeams

FROM [UERMMMC].[dbo].[CASES] cases
JOIN [UERMMMC].[dbo].[PATIENTINFO] px_info ON cases.PATIENTNO = px_info.PATIENTNO
left JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis ON cases.CASENO = diagnosis.CASENO
	left JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes ON cases.PHIC_CODE = phic_codes.PHIC_CODE
		left join DoctorAgg da ON cases.CASENO = da.CASENO
    	 
		LEFT JOIN (
    SELECT CaseNo, MAX(CaseNo) AS LastEncounter
    FROM [EMR].[dbo].[Encounters]
    GROUP BY CaseNo
) encounterInfo ON cases.CASENO = encounterInfo.CaseNo
OUTER APPLY (
    SELECT TOP 1
        oo.operativeDiagnosis,
        oo.diagnosisProcedure,
        oo.procedureClassification,
        oo.OprecCreatedBy,
        oo.OprecUpdatedBy,
               oo.OprecDateCreated,
                      oo.OprecDateUpdated,
                             oo.OpTechDateUpdated,

        oo.EncounterCode,
        oo.ProcedureCode,
        oo.OpTechForm,
        oo.OpRecForm,
        oo.anesthesia,
        oo.startDateTimeOperation,
        oo.endDateTimeOperation,
     oo.code,
      
        oo.surgeryIndication,
        oo.preOperativeDiagnosis,
      
        oo.operativeTechnique,
         oo.intraOperative,
          oo.isBedsideProcedure,
        oo.dateTimeUpdated,
        oo.updatedBy,
        oo.remarks,
        oo.dateTimeCreated,
        oo.specimen,
        oo.postOpDiagnosis,
        oo.operations,
       
        oo.active,
        oo.medications,
    
             oo.department
      
    FROM [UERMMMC].[dbo].[OrbitOperatives] oo
    WHERE oo.CASENO = cases.CASENO and oo.active = 1
    ORDER BY oo.dateTimeCreated asc  
) orbitOp

-- OrbitSignatories aggregated per case
OUTER APPLY (
    SELECT 
        CONCAT(
            '[', 
            STRING_AGG(
                CONCAT(
                    '{"type":"', os.[type], 
                    '","procedureCode":"', os.[procedureCode], 
                    '","code":"', os.[code], 
                    '","names":"', os.[name], '"}'
                ), ','
            ), 
            ']'
        ) AS surgicalTeams
    FROM [UERMMMC].[dbo].[OrbitSignatories] os
    WHERE os.CASENO = cases.CASENO AND os.active = 1
) orbitSign

    WHERE 1=1 ${conditions}

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};
//Only with Orbit procedure
//  SELECT
//      *
// 	FROM (
//     SELECT
//         orbitOp.*,
//         cases.id AS CaseID,
//         cases.datead,
//         cases.DATEDIS,
//         ROW_NUMBER() OVER (
//             PARTITION BY orbitOp.CASENO
//             ORDER BY orbitOp.dateTimeCreated ASC
//         ) AS rn
//     FROM [UERMMMC].[dbo].[OrbitOperatives] orbitOp
//     JOIN [UERMMMC].[dbo].[CASES] cases
//         ON orbitOp.CASENO = cases.CASENO
//     WHERE cases.DATEDIS IS NOT NULL
// ) t
const selectDischargeCases = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `
   WITH DoctorAgg AS (
     SELECT 
        p.CASENO,
        STRING_AGG(d.NAME, ', ') AS PHYSICIANS,
        MAX(p.DR_CODE) AS DR_CODE
    FROM [UERMMMC].[dbo].PROFEE p 
    JOIN [UERMMMC].[dbo].DOCTORS d ON p.DR_CODE = d.code
    GROUP BY p.CASENO
)

SELECT *
FROM (
    SELECT 
	  diagnosis.ADMISSION,
    diagnosis.FINAL,
	 phic_codes.PHIC_DESC,
	    orbitSign.surgicalTeams,
	  orbitOp.caseNo as orbCaseNo,
	 orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
             orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        orbitOp.EncounterCode,
        orbitOp.ProcedureCode,
        orbitOp.OpTechForm,
        orbitOp.OpRecForm,
         LEFT(orbitOp.startDateTimeOperation, 10) AS DatePart,       
                            
          CONCAT(px_info.LASTNAME,', ', px_info.FIRSTNAME, ' ', px_info.MIDDLENAME) AS PATIENTNAME,
       CONCAT(px_info.AGE, '/',LEFT( px_info.SEX, 1)) AS sex_age,
		LEFT(orbitOp.endDateTimeOperation, 10) AS EndDatePart,
         RIGHT(CONVERT(VARCHAR(20), orbitOp.startDateTimeOperation, 100), 8) AS timePart,
          RIGHT(CONVERT(VARCHAR(20), orbitOp.endDateTimeOperation, 100), 8) AS endedTimePart,
        orbitOp.anesthesia,
        orbitOp.startDateTimeOperation,
        orbitOp.endDateTimeOperation,
      orbitOp.code,
 
        orbitOp.surgeryIndication,
             orbitOp.department,
        orbitOp.preOperativeDiagnosis,
   
        orbitOp.operativeTechnique,
         orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
        orbitOp.dateTimeUpdated,
        orbitOp.updatedBy,
        orbitOp.remarks,
        orbitOp.dateTimeCreated,
        orbitOp.specimen,
        orbitOp.postOpDiagnosis,
        orbitOp.operations,
      
        orbitOp.medications,
       
        orbitOp.active,
		 da.PHYSICIANS,
	 px_info.LASTNAME,
	  px_info.FIRSTNAME,
     px_info.MIDDLENAME,
    px_info.PATIENTNO,
    px_info.DBIRTH,
    px_info.SEX,
    px_info.AGE,
    px_info.ADDRESS,
      
    

        cases.id AS CaseID,
        cases.datead,
        cases.DATEDIS,
		 cases.id,
		 cases.CASENO,
       cases.DISPOSITION,
      cases.DISCHARGE,

         cases.patienttype,
      cases.patient_category,
      cases.last_room,
        ROW_NUMBER() OVER (
            PARTITION BY orbitOp.caseNo 
            ORDER BY orbitOp.dateTimeCreated ASC
        ) AS rn
    FROM [UERMMMC].[dbo].[OrbitOperatives] orbitOp
    JOIN [UERMMMC].[dbo].[CASES] cases ON orbitOp.caseNo = cases.CASENO
	JOIN [UERMMMC].[dbo].[PATIENTINFO] px_info ON cases.PATIENTNO = px_info.PATIENTNO
	left JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis ON cases.CASENO = diagnosis.CASENO
	left JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes ON cases.PHIC_CODE = phic_codes.PHIC_CODE
	left join DoctorAgg da ON cases.CASENO = da.CASENO
	OUTER APPLY (
    SELECT 
        CONCAT(
            '[', 
            STRING_AGG(
                CONCAT(
                    '{"type":"', os.[type], 
                    '","procedureCode":"', os.[procedureCode], 
                    '","code":"', os.[code], 
                    '","names":"', os.[name], '"}'
                ), ','
            ), 
            ']'
        ) AS surgicalTeams
    FROM [UERMMMC].[dbo].[OrbitSignatories] os
    WHERE os.CASENO = cases.CASENO AND os.active = 1
) orbitSign

    WHERE cases.DISCHARGE = 'Y'
          AND cases.CASENO NOT LIKE '%w'
          and orbitOp.active = 1  and  orbitOp.OpTechForm = 1
) t
    WHERE 1=1 ${conditions}

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectPatientsWIthOperativeRecordstesting = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `
     WITH DoctorAgg AS (
    SELECT 
        p.CASENO,
        STRING_AGG(d.NAME, ', ') AS PHYSICIANS,
        MAX(p.DR_CODE) AS DR_CODE
    FROM [UERMMMC].[dbo].PROFEE p
    JOIN [UERMMMC].[dbo].DOCTORS d ON p.DR_CODE = d.code
    GROUP BY p.CASENO
)
   
    SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      cases.id,	  orbitOp.code,
      LEFT(orbitOp.startDateTimeOperation, 10) AS DatePart,    
          
    LEFT(orbitOp.endDateTimeOperation, 10) AS EndDatePart,
            RIGHT(CONVERT(VARCHAR(20), orbitOp.startDateTimeOperation, 100), 8) AS timePart,
             RIGHT(CONVERT(VARCHAR(20), orbitOp.endDateTimeOperation, 100), 8) AS endedTimePart,
       STRING_AGG(case when signatoriess.type= 'visAsstSurg' and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingAssistant,
		 STRING_AGG(case when signatoriess.type= 'visSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingSurgeon,
		 STRING_AGG(case when signatoriess.type= 'ueSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UESurgeon,
		  STRING_AGG(case when signatoriess.type= 'ueAsstSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEAssistant,
 da.PHYSICIANS,
    da.DR_CODE,
      cases.datead,
      cases.CASENO,
      CONCAT(px_info.LASTNAME,', ', px_info.FIRSTNAME, ' ', px_info.MIDDLENAME) AS PATIENTNAME,
       CONCAT(px_info.AGE, '/',LEFT( px_info.SEX, 1)) AS sex_age,
         --TIMESTAMPDIFF(YEAR, px_info.DBIRTH, CURDATE()) AS automatedAge,
         	  cases.ADMITTED_BY,
      px_info.LASTNAME,
       px_info.FIRSTNAME,
        px_info.MIDDLENAME,
      px_info.DBIRTH,
      px_info.SEX,
       px_info.AGE,
          px_info.PATIENTNO,
      px_info.ADDRESS,
      phic_codes.PHIC_DESC,
      diagnosis.ADMISSION,
      diagnosis.FINAL,
      cases.DISPOSITION,
      cases.DISCHARGE,
      cases.DATEDIS,
         cases.patienttype,
      cases.patient_category,
      cases.last_room,
         orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
             orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        orbitOp.remarks,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
             orbitOp.EncounterCode,
                orbitOp.ProcedureCode,
        orbitOp.endDateTimeOperation,
   
     orbitOp.surgeryIndication,
     orbitOp.OpTechForm,
          orbitOp.department,
     orbitOp.OpRecForm,
      orbitOp.preOperativeDiagnosis,
    
      orbitOp.operativeTechnique,
       orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
      orbitOp.active,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
    
      orbitOp.medications,
     

      orbitOp.createdBy
       
    FROM [UERMMMC].[dbo].[CASES] cases
    JOIN [UERMMMC].[dbo].[PATIENTINFO] px_info ON cases.PATIENTNO = px_info.PATIENTNO
    JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes ON cases.PHIC_CODE = phic_codes.PHIC_CODE
    JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis ON cases.CASENO = diagnosis.CASENO
    JOIN DoctorAgg da ON cases.CASENO = da.CASENO
-- JOIN [UERMMMC].[dbo].[PROFEE] profee ON cases.CASENO = profee.CASENO
 --JOIN [UERMMMC].[dbo].[DOCTORS] doctors ON profee.DR_CODE = doctors.code
    -- left join  [UERMMMC].[dbo].[OrbitOperatives] orbitOp  ON diagnosis.CASENO = orbitOp.caseNo
     right join  [UERMMMC].[dbo].[OrbitOperatives] orbitOp  ON diagnosis.CASENO = orbitOp.caseNo
 left  join  [UERMMMC].[dbo].[OrbitSignatories] signatoriess    ON orbitOp.code = signatoriess.procedureCode
 --ON cases.CASENO = signatoriess.caseNo

    WHERE 1=1 ${conditions}

    GROUP BY
      cases.id, cases.CASENO,      cases.datead,  orbitOp.code,
        cases.patient_category, 
     
      cases.last_room,  da.PHYSICIANS,
    da.DR_CODE,

       orbitOp.specimen,
       cases.patienttype,
         orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
            orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        orbitOp.EncounterCode,
         orbitOp.OpTechForm,
     orbitOp.OpRecForm,
          orbitOp.department,
                orbitOp.ProcedureCode,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
              orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.remarks,
     
      orbitOp.medications,
    
        orbitOp.endDateTimeOperation,
    
     orbitOp.surgeryIndication,
      orbitOp.preOperativeDiagnosis,
    
      orbitOp.operativeTechnique,
       orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
          orbitOp.active,
      orbitOp.createdBy,
             px_info.AGE,

           
      px_info.DBIRTH, px_info.SEX, px_info.ADDRESS,    px_info.PATIENTNO,
      phic_codes.PHIC_DESC,
       orbitOp.dateTimeUpdated,
      diagnosis.ADMISSION, diagnosis.FINAL,
      cases.DISPOSITION, cases.DISCHARGE,  cases.DATEDIS,
      cases.ADMITTED_BY, px_info.LASTNAME, px_info.MIDDLENAME,px_info.FIRSTNAME

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectDistinctActiveProcedures = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `SELECT distinct
[caseNo]
    
  FROM [UERMMMC].[dbo].[OrbitOperatives]
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};
const selectPatientsWIthOperativeRecords = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `
     WITH DoctorAgg AS (
    SELECT 
        p.CASENO,
        STRING_AGG(d.NAME, ', ') AS PHYSICIANS,
        MAX(p.DR_CODE) AS DR_CODE
    FROM [UERMMMC].[dbo].PROFEE p
    JOIN [UERMMMC].[dbo].DOCTORS d ON p.DR_CODE = d.code
    GROUP BY p.CASENO
)
   
    SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      cases.id,	  orbitOp.code,
       STRING_AGG(case when signatoriess.type= 'visAsstSurg' and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingAssistant,
		 STRING_AGG(case when signatoriess.type= 'visSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingSurgeon,
		 STRING_AGG(case when signatoriess.type= 'ueSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UESurgeon,
		  STRING_AGG(case when signatoriess.type= 'ueAsstSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEAssistant,
 da.PHYSICIANS,
    da.DR_CODE,
      cases.datead,
      cases.CASENO,
      CONCAT(px_info.LASTNAME,', ', px_info.FIRSTNAME, ' ', px_info.MIDDLENAME) AS PATIENTNAME,
       CONCAT(px_info.AGE, '/',LEFT( px_info.SEX, 1)) AS sex_age,
         --TIMESTAMPDIFF(YEAR, px_info.DBIRTH, CURDATE()) AS automatedAge,
         	  cases.ADMITTED_BY,
      px_info.LASTNAME,
       px_info.FIRSTNAME,
      px_info.MIDDLENAME,
      px_info.DBIRTH,
      px_info.SEX,
       px_info.AGE,
          px_info.PATIENTNO,
      px_info.ADDRESS,
      phic_codes.PHIC_DESC,
      diagnosis.ADMISSION,
      diagnosis.FINAL,
      cases.DISPOSITION,
      cases.DISCHARGE,
      cases.DATEDIS,
         cases.patienttype,
      cases.patient_category,
      cases.last_room,
         orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
             orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
        orbitOp.remarks,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
             orbitOp.EncounterCode,
                orbitOp.ProcedureCode,
        orbitOp.endDateTimeOperation,
  
     orbitOp.surgeryIndication,
     orbitOp.OpTechForm,
          orbitOp.department,
     orbitOp.OpRecForm,
      orbitOp.preOperativeDiagnosis,
    
      orbitOp.operativeTechnique,
       orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
     
      orbitOp.medications,
     
       orbitOp.active,
      orbitOp.createdBy
       
    FROM [UERMMMC].[dbo].[CASES] cases
    JOIN [UERMMMC].[dbo].[PATIENTINFO] px_info ON cases.PATIENTNO = px_info.PATIENTNO
    JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes ON cases.PHIC_CODE = phic_codes.PHIC_CODE
    JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis ON cases.CASENO = diagnosis.CASENO
    JOIN DoctorAgg da ON cases.CASENO = da.CASENO
-- JOIN [UERMMMC].[dbo].[PROFEE] profee ON cases.CASENO = profee.CASENO
 --JOIN [UERMMMC].[dbo].[DOCTORS] doctors ON profee.DR_CODE = doctors.code
    -- left join  [UERMMMC].[dbo].[OrbitOperatives] orbitOp  ON diagnosis.CASENO = orbitOp.caseNo
     right join  [UERMMMC].[dbo].[OrbitOperatives] orbitOp  ON diagnosis.CASENO = orbitOp.caseNo
 left  join  [UERMMMC].[dbo].[OrbitSignatories] signatoriess  ON cases.CASENO = signatoriess.caseNo

    WHERE 1=1 ${conditions}

    GROUP BY
      cases.id, cases.CASENO,      cases.datead,  orbitOp.code,
        cases.patient_category, 
      cases.last_room,  da.PHYSICIANS,
    da.DR_CODE,       orbitOp.OprecCreatedBy,
        orbitOp.OprecUpdatedBy,
               orbitOp.OprecDateCreated,
                      orbitOp.OprecDateUpdated,
                             orbitOp.OpTechDateUpdated,
       orbitOp.specimen,
       cases.patienttype,
         orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
      
        orbitOp.EncounterCode,
         orbitOp.OpTechForm,
          orbitOp.active,
     orbitOp.OpRecForm,
                orbitOp.ProcedureCode,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
              orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.remarks,
    
      orbitOp.medications,
    
           orbitOp.department,
        orbitOp.endDateTimeOperation,
    
     orbitOp.surgeryIndication,
      orbitOp.preOperativeDiagnosis,
     
      orbitOp.operativeTechnique,
       orbitOp.intraOperative,
          orbitOp.isBedsideProcedure,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
    
      orbitOp.createdBy,
             px_info.AGE,

           px_info.MIDDLENAME,
      px_info.DBIRTH, px_info.SEX, px_info.ADDRESS,    px_info.PATIENTNO,
      phic_codes.PHIC_DESC,
       orbitOp.dateTimeUpdated,
      diagnosis.ADMISSION, diagnosis.FINAL,
      cases.DISPOSITION, cases.DISCHARGE,  cases.DATEDIS,
       cases.ADMITTED_BY, px_info.LASTNAME, px_info.FIRSTNAME

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectOrbitOperativesTbl = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    [id]
      ,[code]
      ,[caseNo]
      ,[operativeDiagnosis]
      ,[diagnosisProcedure]
      ,[procedureClassification]
   ,department
      
      ,[anesthesia]
      ,[startDateTimeOperation]
      ,[endDateTimeOperation]
      ,[surgeryIndication]
      ,[preOperativeDiagnosis]

      ,[operativeTechnique]
       ,[intraOperative]
	    ,[isBedsideProcedure]
       
      ,[dateTimeUpdated]
      ,[updatedBy]
      ,[dateTimeCreated]
      ,[createdBy]
      ,[specimen]
      ,[postOpDiagnosis]
      ,[operations]
    
  FROM [UERMMMC].[dbo].[OrbitOperatives]
    WHERE 1=1 ${conditions}

   

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};
const selectCaseORDate = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      caseNo
    -- ,operativeDiagnosis
    -- ,diagnosisProcedure
    -- ,procedureClassification
    -- ,patientType
    -- ,surgeon
    -- ,assistantSurgeon
    -- ,visitingAssistantSurgeon
    -- ,visitingSurgeon
    -- ,anesthesia
    -- ,startDateTimeOperation
    -- ,endDateTimeOperation
    -- ,surgeryIndication
    -- ,preOperativeDiagnosis
    -- ,anesthesiologist
    -- ,operativeTechnique
      ,dateTimeUpdated
      ,updatedBy
      ,dateTimeCreated
      ,createdBy
     -- ,specimen
     -- ,postOpDiagnosis
     -- ,operations
     -- ,scrubNurse
     -- ,medications
     -- ,circulatingNurse
     -- ,spongeCountedBy
     -- ,notedBy
  FROM [UERMMMC].[dbo].[OrbitOperatives]

    WHERE 1=1 ${conditions}

    
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};
const selectEncounter = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
     [Id]
      ,[Code]
      ,[PatientNo]
      ,[CaseNo]
      ,[DeptCode]
      ,[PatientType]
      ,[Ward]
      ,[Room]
      ,[ResInCharge]
      ,[ResInChargeAssignedBy]
      ,[DateTimeAssignedResInCharge]
      ,[Status]
      ,[DateTimeAdmitted]
      ,[DateTimeDischarged]
      ,[CreatedBy]
      ,[DateTimeCreated]
      ,[ReleasedBy]
      ,[DateTimeReleased]
      ,[ReferredBy]
      ,[DateTimeReferred]
      ,[ReferringDeptCode]
      ,[ReferralReason]
      ,[UpdatedBy]
      ,[DateTimeUpdated]
      ,[CancelledBy]
      ,[DateTimeCancelled]
      ,[CancellationReason]
      ,[DateTimeAllowedPrintCA]
      ,[DateTimeAllowedPrintDS]
      ,[Remarks]
      ,[ConsInCharge]
      ,[ConsInChargeAssignedBy]
      ,[DateTimeAssignedConsInCharge]
      ,[FelsInCharge]
      ,[FelsInChargeAssignedBy]
      ,[DateTimeAssignedFelsInCharge]
      ,[ClerksInCharge]
      ,[ClerksInChargeAssignedBy]
      ,[DateTimeAssignedClerksInCharge]
      ,[InternsInCharge]
      ,[InternsInChargeAssignedBy]
      ,[DateTimeAssignedInternsInCharge]
  FROM [EMR].[dbo].[Encounters]

    WHERE 1=1 ${conditions}

    
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectPrintLog = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
   [id]
      ,[code]

      ,[CaseNo]
      ,[CreatedBy]
      ,[UpdatedBy]
      ,[DateTimeUpdated]
      ,[DateTimeCreated]
      ,[Active]
      ,ipAddress
            ,[procedureCode]
            ,formType

  FROM [UERMMMC].[dbo].[OrbitPrintLog]

    WHERE 1=1 ${conditions}

    
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectSponges = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  [id]
      ,[code]
         ,[procedureCode]
      ,[caseNo]
      ,[sponges]
      ,[initialCount]
      ,[onTable]
      ,[onFloor]
      ,[createdBy]
      ,[dateTimeCreated]
        ,[dateTimeUpdated]
      ,[updatedBy]
      ,[Active]
  FROM [UERMMMC].[dbo].[OrbitSponges]
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectOrbitSignatories = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  [id]
        ,[code]
      ,[empCode]
      ,[caseNO]
       ,procedureCode
      ,[name]
      ,[type]
      ,[signature]
      ,[dateTimeCreated]
      ,[dateTimeUpdated]
      ,[createdBy]
      ,[updatedBy]
      ,[active]
     
  FROM [UERMMMC].[dbo].[OrbitSignatories]
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectDoctors = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  [CODE]

      ,[EHR_CODE]
      ,[NAME]
      ,[AREA OF SPECIALTY]

      ,[SKED]
      ,[ROOM]
    , DELETED
    ,DEPARTMENT
      ,[FIRST NAME]
      ,[MIDDLE NAME]
      ,[LAST NAME]
      ,[EXT NAME]
      ,[GENDER]
     
      ,[email]
      FROM [UERMMMC].[dbo].[DOCTORS]
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const selectEmployeeTbl = async function (conditions, args, options, txn) {
  return await sqlHelper.query(
    `SELECT
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
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

const insertPrintingAttemptLogs = async function (payload, txn) {
  return await sqlHelper.insert(
    "[UERMMMC].[dbo].[OrbitPrintLog]",
    payload,
    txn,
  );
};

const insertOrbitSponges = async function (payload, txn) {
  return await sqlHelper.insert("[UERMMMC].[dbo].[OrbitSponges]", payload, txn);
};
const updateSponges = async function (payload, condition, txn) {
  try {
    return await sqlHelper.updateMany(
      "[UERMMMC].[dbo].[OrbitSponges]",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return error;
  }
};
const insertOperativeUpdatesLogs = async function (payload, txn) {
  return await sqlHelper.insert(
    "[UERMMMC].[dbo].[OrbitOperativeLogs]",
    payload,
    txn,
  );
};
const insertSignatories = async function (payload, txn) {
  return await sqlHelper.insert(
    "[UERMMMC].[dbo].[OrbitSignatories]",
    payload,
    txn,
  );
};
const updateSignatories = async function (payload, condition, txn) {
  try {
    return await sqlHelper.updateMany(
      "[UERMMMC].[dbo].[OrbitSignatories]",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return error;
  }
};
const insertOperativeLogs = async function (payload, txn) {
  return await sqlHelper.insert(
    "[UERMMMC].[dbo].[OrbitOperatives]",
    payload,
    txn,
  );
};
const updatePatientInfo = async function (payload, condition, txn) {
  try {
    return await sqlHelper.updateMany(
      // "[UERMMMC].[dbo].[DIAGNOSIS]",
      "[UERMMMC].[dbo].[OrbitOperatives]",
      payload,
      condition,
      txn,
    );
  } catch (error) {
    return error;
  }
};

// const updateOperativeTechnique = async function (payload, condition, txn) {
//   try {
//     return await sqlHelper.updateMany(
//       "[UERMMMC].[dbo].[OrbitOperatives]",
//       payload,
//       condition,
//       txn,
//     );
//   } catch (error) {
//     return error;
//   }
// };
module.exports = {
  selectPatientRecords,
  selectTestREcords,
  selectPatientsWIthOperativeRecordstesting,
  selectPatientsWIthOperativeRecords,
  selectOrbitOperativesTbl,
  selectCaseORDate,
  selectDoctors,
  selectSponges,
  updatePatientInfo,
  updateSponges,
  insertOperativeLogs,
  insertPrintingAttemptLogs,
  insertOrbitSponges,
  selectOrbitSignatories,
  insertSignatories,
  insertOperativeUpdatesLogs,
  updateSignatories,
  selectPrintLog,
  selectEmployeeTbl,
  selectEncounter,
  selectDistinctActiveProcedures,
  selectDischargeCases,
  selectEncodingAnalytics,
  // updateOperativeTechnique,
  selectedEncodedProcedureMaintenance,
  selectProcedureName,
};

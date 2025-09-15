const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

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
    LEFT(LTRIM(RIGHT(orbitOp.startDateTimeOperation, LEN(orbitOp.startDateTimeOperation) - 11)), 2) AS HourPart, 
    SUBSTRING(orbitOp.startDateTimeOperation, 15, 2) AS MinutePart,            
    RIGHT(orbitOp.startDateTimeOperation, 2) AS PeriodPart ,                     
    da.DR_CODE,
      cases.id,
      cases.datead,
      cases.CASENO,
      CONCAT(px_info.LASTNAME, ' ', px_info.FIRSTNAME) AS PATIENTNAME,
        CONCAT(LEFT( px_info.SEX, 1), '/',  px_info.AGE) AS sex_age,
         --TIMESTAMPDIFF(YEAR, px_info.DBIRTH, CURDATE()) AS automatedAge,
      px_info.LASTNAME,
       px_info.FIRSTNAME,
       px_info.PATIENTNO,
      px_info.DBIRTH,
      px_info.SEX,
       px_info.AGE,
      px_info.ADDRESS,
      phic_codes.PHIC_DESC,
      diagnosis.ADMISSION,
      diagnosis.FINAL,
    --  STRING_AGG(doctors.NAME, ', ') WITHIN GROUP (ORDER BY doctors.NAME) AS PHYSICIANS,
      cases.DISPOSITION,
      cases.DISCHARGE,
      cases.DATEDIS,
         cases.patienttype,
      cases.patient_category,
      cases.last_room,
        orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
        orbitOp.surgeon,
        orbitOp.assistantSurgeon,
        orbitOp.EncounterCode,
                orbitOp.ProcedureCode,
                 orbitOp.OpTechForm,
     orbitOp.OpRecForm,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,

        orbitOp.endDateTimeOperation,
           LEFT(orbitOp.endDateTimeOperation, 10) AS EndDatePart,                
    LEFT(LTRIM(RIGHT(orbitOp.endDateTimeOperation, LEN(orbitOp.endDateTimeOperation) - 11)), 2) AS EndHourPart,
    SUBSTRING(orbitOp.endDateTimeOperation, 15, 2) AS EndMinutePart,           
    RIGHT(orbitOp.endDateTimeOperation, 2) AS EndPeriodPart ,
      orbitOp.visitingAssistantSurgeon,
     orbitOp.surgeryIndication,
      orbitOp.preOperativeDiagnosis,
      orbitOp.anesthesiologist,
      orbitOp.operativeTechnique,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
        orbitOp.remarks,
        
      orbitOp.dateTimeCreated,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.scrubNurse,
      orbitOp.medications,
      orbitOp.circulatingNurse,
      orbitOp.spongeCountedBy,
      orbitOp.notedBy,
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
        cases.patient_category, orbitOp.visitingAssistantSurgeon,
        orbitOp.visitingSurgeon,
      cases.last_room,
  da.PHYSICIANS,
    da.DR_CODE,
       cases.patienttype,
        orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
        orbitOp.surgeon,
        orbitOp.assistantSurgeon,
orbitOp.EncounterCode,
 orbitOp.OpTechForm,
     orbitOp.OpRecForm,
                orbitOp.ProcedureCode,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
orbitOp.remarks,
        orbitOp.endDateTimeOperation,
      orbitOp.visitingAssistantSurgeon,
     orbitOp.surgeryIndication,
      orbitOp.preOperativeDiagnosis,
      orbitOp.anesthesiologist,
      orbitOp.operativeTechnique,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.scrubNurse,
      orbitOp.medications,
      orbitOp.circulatingNurse,
      orbitOp.spongeCountedBy,
      orbitOp.notedBy,
      orbitOp.createdBy,

             px_info.AGE,

      px_info.DBIRTH, px_info.SEX, px_info.ADDRESS,     px_info.PATIENTNO,
      phic_codes.PHIC_DESC,
       orbitOp.dateTimeUpdated,
      diagnosis.ADMISSION, diagnosis.FINAL,
      cases.DISPOSITION, cases.DISCHARGE,  cases.DATEDIS,
      px_info.LASTNAME, px_info.FIRSTNAME

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

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
    px_info.PATIENTNO,
    px_info.DBIRTH,
    px_info.SEX,
    px_info.AGE,
    px_info.ADDRESS,
	 phic_codes.PHIC_DESC,
 orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
        orbitOp.surgeon,
        orbitOp.assistantSurgeon,
        orbitOp.EncounterCode,
        orbitOp.ProcedureCode,
        orbitOp.OpTechForm,
        orbitOp.OpRecForm,
         LEFT(orbitOp.startDateTimeOperation, 10) AS DatePart,                      
    LEFT(LTRIM(RIGHT(orbitOp.startDateTimeOperation, LEN(orbitOp.startDateTimeOperation) - 11)), 2) AS HourPart, 
    SUBSTRING(orbitOp.startDateTimeOperation, 15, 2) AS MinutePart,            
    RIGHT(orbitOp.startDateTimeOperation, 2) AS PeriodPart ,      
          CONCAT(px_info.LASTNAME, ' ', px_info.FIRSTNAME) AS PATIENTNAME,
        CONCAT(LEFT( px_info.SEX, 1), '/',  px_info.AGE) AS sex_age,
		LEFT(orbitOp.endDateTimeOperation, 10) AS EndDatePart,
        LEFT(LTRIM(RIGHT(orbitOp.endDateTimeOperation, LEN(orbitOp.endDateTimeOperation) - 11)), 2) AS EndHourPart,
        SUBSTRING(orbitOp.endDateTimeOperation, 15, 2) AS EndMinutePart,
        RIGHT(orbitOp.endDateTimeOperation, 2) AS EndPeriodPart,
        orbitOp.anesthesia,
        orbitOp.startDateTimeOperation,
        orbitOp.endDateTimeOperation,
    
        orbitOp.visitingAssistantSurgeon,
        orbitOp.surgeryIndication,
        orbitOp.preOperativeDiagnosis,
        orbitOp.anesthesiologist,
        orbitOp.operativeTechnique,
        orbitOp.dateTimeUpdated,
        orbitOp.updatedBy,
        orbitOp.remarks,
        orbitOp.dateTimeCreated,
        orbitOp.specimen,
        orbitOp.postOpDiagnosis,
        orbitOp.operations,
        orbitOp.scrubNurse,
        orbitOp.medications,
        orbitOp.circulatingNurse,
        orbitOp.spongeCountedBy,
        orbitOp.notedBy

FROM [UERMMMC].[dbo].[CASES] cases
JOIN [UERMMMC].[dbo].[PATIENTINFO] px_info ON cases.PATIENTNO = px_info.PATIENTNO
left JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis ON cases.CASENO = diagnosis.CASENO
	left JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes ON cases.PHIC_CODE = phic_codes.PHIC_CODE
		left join DoctorAgg da ON cases.CASENO = da.CASENO
OUTER APPLY (
    SELECT TOP 1
        oo.operativeDiagnosis,
        oo.diagnosisProcedure,
        oo.procedureClassification,
        oo.surgeon,
        oo.assistantSurgeon,
        oo.EncounterCode,
        oo.ProcedureCode,
        oo.OpTechForm,
        oo.OpRecForm,
        oo.anesthesia,
        oo.startDateTimeOperation,
        oo.endDateTimeOperation,
    
        oo.visitingAssistantSurgeon,
        oo.surgeryIndication,
        oo.preOperativeDiagnosis,
        oo.anesthesiologist,
        oo.operativeTechnique,
        oo.dateTimeUpdated,
        oo.updatedBy,
        oo.remarks,
        oo.dateTimeCreated,
        oo.specimen,
        oo.postOpDiagnosis,
        oo.operations,
        oo.scrubNurse,
        oo.medications,
        oo.circulatingNurse,
        oo.spongeCountedBy,
        oo.notedBy
    FROM [UERMMMC].[dbo].[OrbitOperatives] oo
    WHERE oo.CASENO = cases.CASENO
    ORDER BY oo.dateTimeCreated DESC  
) orbitOp
    WHERE 1=1 ${conditions}

    ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
    `,
    args,
    txn,
  );
};

// const selectPatientRecords = async function (conditions, args, options, txn) {
//   return await sqlHelper.query(
//     `SELECT
//       ${util.empty(options.top) ? "" : `TOP(${options.top})`}
//       STRING_AGG(case when signatoriess.type= 'visAsstSurg' and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingAssistant,
// 		 STRING_AGG(case when signatoriess.type= 'visSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingSurgeon,
// 		 STRING_AGG(case when signatoriess.type= 'ueSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UESurgeon,
// 		  STRING_AGG(case when signatoriess.type= 'ueAsstSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEAssistant,
//     cases.id,
//       cases.datead,
//       cases.CASENO,
//       CONCAT(px_info.LASTNAME, ' ', px_info.FIRSTNAME) AS PATIENTNAME,
//         CONCAT(LEFT( px_info.SEX, 1), '/',  px_info.AGE) AS sex_age,
//          --TIMESTAMPDIFF(YEAR, px_info.DBIRTH, CURDATE()) AS automatedAge,
//       px_info.LASTNAME,
//        px_info.FIRSTNAME,
//       px_info.DBIRTH,
//       px_info.SEX,
//       pa.PHYSICIANS,
//        px_info.AGE,
//       px_info.ADDRESS,
//       phic_codes.PHIC_DESC,
//       diagnosis.ADMISSION,
//       diagnosis.FINAL,
//       --STRING_AGG(doctors.NAME, ', ') WITHIN GROUP (ORDER BY doctors.NAME) AS PHYSICIANS,
//       cases.DISPOSITION,
//       cases.DISCHARGE,
//       cases.DATEDIS,
//          cases.patienttype,
//       cases.patient_category,
//       cases.last_room,
//         orbitOp.operativeDiagnosis,
//         orbitOp.diagnosisProcedure,
//         orbitOp.procedureClassification,
//         orbitOp.surgeon,
//         orbitOp.assistantSurgeon,

//           orbitOp.anesthesia,
//          orbitOp.startDateTimeOperation,

//         orbitOp.endDateTimeOperation,
//       orbitOp.visitingAssistantSurgeon,
//      orbitOp.surgeryIndication,
//       orbitOp.preOperativeDiagnosis,
//       orbitOp.anesthesiologist,
//       orbitOp.operativeTechnique,
//       orbitOp.dateTimeUpdated,
//       orbitOp.updatedBy,
//       orbitOp.dateTimeCreated,
//        orbitOp.specimen,
//          orbitOp.postOpDiagnosis,
//       orbitOp.operations,
//       orbitOp.scrubNurse,
//       orbitOp.medications,
//       orbitOp.circulatingNurse,
//       orbitOp.spongeCountedBy,
//       orbitOp.notedBy,
//       orbitOp.createdBy

//     FROM [UERMMMC].[dbo].[CASES] cases
//     JOIN [UERMMMC].[dbo].[PATIENTINFO] px_info ON cases.PATIENTNO = px_info.PATIENTNO
//     JOIN [UERMMMC].[dbo].[PHIC_CODES] phic_codes ON cases.PHIC_CODE = phic_codes.PHIC_CODE
//     JOIN [UERMMMC].[dbo].[DIAGNOSIS] diagnosis ON cases.CASENO = diagnosis.CASENO
//    -- JOIN [UERMMMC].[dbo].[PROFEE] profee ON cases.CASENO = profee.CASENO
//   --  JOIN [UERMMMC].[dbo].[DOCTORS] doctors ON profee.DR_CODE = doctors.code
//    left join  [UERMMMC].[dbo].[OrbitOperatives] orbitOp  ON diagnosis.CASENO = orbitOp.caseNo
//  left  join  [UERMMMC].[dbo].[OrbitSignatories] signatoriess  ON cases.CASENO = signatoriess.caseNo
//  LEFT JOIN (
//     SELECT
//         p.CASENO,
//         STRING_AGG( d.NAME, ', ') AS PHYSICIANS
//     FROM [UERMMMC].[dbo].[PROFEE] p
//     JOIN [DOCTORS] d ON p.DR_CODE = d.code
//     GROUP BY p.CASENO
// ) pa ON cases.CASENO = pa.CASENO

//  WHERE 1=1 ${conditions}

//     GROUP BY
//       cases.id, cases.CASENO,      cases.datead,
//         cases.patient_category, orbitOp.visitingAssistantSurgeon,
//         orbitOp.visitingSurgeon,
//       cases.last_room,

//        cases.patienttype,
//         orbitOp.operativeDiagnosis,
//         orbitOp.diagnosisProcedure,
//         orbitOp.procedureClassification,
//         orbitOp.surgeon,
//         orbitOp.assistantSurgeon,

//           orbitOp.anesthesia,
//          orbitOp.startDateTimeOperation,

//         orbitOp.endDateTimeOperation,
//       orbitOp.visitingAssistantSurgeon,
//      orbitOp.surgeryIndication,
//       orbitOp.preOperativeDiagnosis,
//       orbitOp.anesthesiologist,
//       orbitOp.operativeTechnique,
//       orbitOp.dateTimeUpdated,
//       orbitOp.updatedBy,
//       orbitOp.dateTimeCreated,
//        orbitOp.specimen,
//          orbitOp.postOpDiagnosis,
//       orbitOp.operations,
//       orbitOp.scrubNurse,
//       orbitOp.medications,
//       orbitOp.circulatingNurse,
//       orbitOp.spongeCountedBy,
//       orbitOp.notedBy,
//       orbitOp.createdBy,

//              px_info.AGE,

//       px_info.DBIRTH, px_info.SEX, px_info.ADDRESS,
//       phic_codes.PHIC_DESC,
//        orbitOp.dateTimeUpdated,
//       diagnosis.ADMISSION, diagnosis.FINAL,
//       cases.DISPOSITION, cases.DISCHARGE,  cases.DATEDIS,
//       px_info.LASTNAME, px_info.FIRSTNAME, pa.PHYSICIANS,

//     ${util.empty(options.order) ? "" : `ORDER BY ${options.order}`}
//     `,
//     args,
//     txn,
//   );
// };
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
    LEFT(LTRIM(RIGHT(orbitOp.startDateTimeOperation, LEN(orbitOp.startDateTimeOperation) - 11)), 2) AS HourPart, 
    SUBSTRING(orbitOp.startDateTimeOperation, 15, 2) AS MinutePart,    
    LEFT(orbitOp.endDateTimeOperation, 10) AS EndDatePart,
        LEFT(LTRIM(RIGHT(orbitOp.endDateTimeOperation, LEN(orbitOp.endDateTimeOperation) - 11)), 2) AS EndHourPart,
        SUBSTRING(orbitOp.endDateTimeOperation, 15, 2) AS EndMinutePart,
        RIGHT(orbitOp.endDateTimeOperation, 2) AS EndPeriodPart,        
    RIGHT(orbitOp.startDateTimeOperation, 2) AS PeriodPart ,
       STRING_AGG(case when signatoriess.type= 'visAsstSurg' and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingAssistant,
		 STRING_AGG(case when signatoriess.type= 'visSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEVisitingSurgeon,
		 STRING_AGG(case when signatoriess.type= 'ueSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UESurgeon,
		  STRING_AGG(case when signatoriess.type= 'ueAsstSurg'  and signatoriess.active = 1  then signatoriess.name end, ', ') AS UEAssistant,
 da.PHYSICIANS,
    da.DR_CODE,
      cases.datead,
      cases.CASENO,
      CONCAT(px_info.LASTNAME, ' ', px_info.FIRSTNAME) AS PATIENTNAME,
        CONCAT(LEFT( px_info.SEX, 1), '/',  px_info.AGE) AS sex_age,
         --TIMESTAMPDIFF(YEAR, px_info.DBIRTH, CURDATE()) AS automatedAge,
      px_info.LASTNAME,
       px_info.FIRSTNAME,
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
        orbitOp.surgeon,
        orbitOp.assistantSurgeon,
        orbitOp.remarks,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
             orbitOp.EncounterCode,
                orbitOp.ProcedureCode,
        orbitOp.endDateTimeOperation,
      orbitOp.visitingAssistantSurgeon,
     orbitOp.surgeryIndication,
     orbitOp.OpTechForm,
     orbitOp.OpRecForm,
      orbitOp.preOperativeDiagnosis,
      orbitOp.anesthesiologist,
      orbitOp.operativeTechnique,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.scrubNurse,
      orbitOp.medications,
      orbitOp.circulatingNurse,
      orbitOp.spongeCountedBy,
      orbitOp.notedBy,
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
        cases.patient_category, orbitOp.visitingAssistantSurgeon,
        orbitOp.visitingSurgeon,
      cases.last_room,  da.PHYSICIANS,
    da.DR_CODE,

       orbitOp.specimen,
       cases.patienttype,
         orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
        orbitOp.surgeon,
        orbitOp.assistantSurgeon,
        orbitOp.EncounterCode,
         orbitOp.OpTechForm,
     orbitOp.OpRecForm,
                orbitOp.ProcedureCode,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
              orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.remarks,
      orbitOp.scrubNurse,
      orbitOp.medications,
      orbitOp.circulatingNurse,
      orbitOp.spongeCountedBy,
      orbitOp.notedBy,
        orbitOp.endDateTimeOperation,
      orbitOp.visitingAssistantSurgeon,
     orbitOp.surgeryIndication,
      orbitOp.preOperativeDiagnosis,
      orbitOp.anesthesiologist,
      orbitOp.operativeTechnique,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
    
      orbitOp.createdBy,
             px_info.AGE,

           
      px_info.DBIRTH, px_info.SEX, px_info.ADDRESS,    px_info.PATIENTNO,
      phic_codes.PHIC_DESC,
       orbitOp.dateTimeUpdated,
      diagnosis.ADMISSION, diagnosis.FINAL,
      cases.DISPOSITION, cases.DISCHARGE,  cases.DATEDIS,
      px_info.LASTNAME, px_info.FIRSTNAME

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
      CONCAT(px_info.LASTNAME, ' ', px_info.FIRSTNAME) AS PATIENTNAME,
        CONCAT(LEFT( px_info.SEX, 1), '/',  px_info.AGE) AS sex_age,
         --TIMESTAMPDIFF(YEAR, px_info.DBIRTH, CURDATE()) AS automatedAge,
      px_info.LASTNAME,
       px_info.FIRSTNAME,
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
        orbitOp.surgeon,
        orbitOp.assistantSurgeon,
        orbitOp.remarks,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
             orbitOp.EncounterCode,
                orbitOp.ProcedureCode,
        orbitOp.endDateTimeOperation,
      orbitOp.visitingAssistantSurgeon,
     orbitOp.surgeryIndication,
     orbitOp.OpTechForm,
     orbitOp.OpRecForm,
      orbitOp.preOperativeDiagnosis,
      orbitOp.anesthesiologist,
      orbitOp.operativeTechnique,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
       orbitOp.specimen,
         orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.scrubNurse,
      orbitOp.medications,
      orbitOp.circulatingNurse,
      orbitOp.spongeCountedBy,
      orbitOp.notedBy,
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
        cases.patient_category, orbitOp.visitingAssistantSurgeon,
        orbitOp.visitingSurgeon,
      cases.last_room,  da.PHYSICIANS,
    da.DR_CODE,
       orbitOp.specimen,
       cases.patienttype,
         orbitOp.operativeDiagnosis,
        orbitOp.diagnosisProcedure,
        orbitOp.procedureClassification,
        orbitOp.surgeon,
        orbitOp.assistantSurgeon,
        orbitOp.EncounterCode,
         orbitOp.OpTechForm,
     orbitOp.OpRecForm,
                orbitOp.ProcedureCode,
          orbitOp.anesthesia,
         orbitOp.startDateTimeOperation,
              orbitOp.postOpDiagnosis,
      orbitOp.operations,
      orbitOp.remarks,
      orbitOp.scrubNurse,
      orbitOp.medications,
      orbitOp.circulatingNurse,
      orbitOp.spongeCountedBy,
      orbitOp.notedBy,
        orbitOp.endDateTimeOperation,
      orbitOp.visitingAssistantSurgeon,
     orbitOp.surgeryIndication,
      orbitOp.preOperativeDiagnosis,
      orbitOp.anesthesiologist,
      orbitOp.operativeTechnique,
      orbitOp.dateTimeUpdated,
      orbitOp.updatedBy,
      orbitOp.dateTimeCreated,
    
      orbitOp.createdBy,
             px_info.AGE,

           
      px_info.DBIRTH, px_info.SEX, px_info.ADDRESS,    px_info.PATIENTNO,
      phic_codes.PHIC_DESC,
       orbitOp.dateTimeUpdated,
      diagnosis.ADMISSION, diagnosis.FINAL,
      cases.DISPOSITION, cases.DISCHARGE,  cases.DATEDIS,
      px_info.LASTNAME, px_info.FIRSTNAME

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

      ,[surgeon]
      ,[assistantSurgeon]
      ,[visitingAssistantSurgeon]
      ,[visitingSurgeon]
      ,[anesthesia]
      ,[startDateTimeOperation]
      ,[endDateTimeOperation]
      ,[surgeryIndication]
      ,[preOperativeDiagnosis]
      ,[anesthesiologist]
      ,[operativeTechnique]
      ,[dateTimeUpdated]
      ,[updatedBy]
      ,[dateTimeCreated]
      ,[createdBy]
      ,[specimen]
      ,[postOpDiagnosis]
      ,[operations]
      ,[scrubNurse]
      ,[medications]
      ,[circulatingNurse]
      ,[spongeCountedBy]
      ,[notedBy]
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
      ,[PhysicianId__UNUSED]
      ,[ResidentInCharge__UNUSED]
      ,[ResInCharge]
      ,[ResInChargeAssignedBy]
      ,[DateTimeAssignedResInCharge]
      ,[CaseRecordNumber__UNUSED]
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
      ,[ReferringPhysician__UNUSED]
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
      ,[PrintCode]
      ,[CaseNo]
      ,[CreatedBy]
      ,[UpdatedBy]
      ,[DateTimeUpdated]
      ,[DateTimeCreated]
      ,[Active]
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
      ,[spongesCode]
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
      ,[DEPARTMENT]
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

  // updateOperativeTechnique,
};

const db = require("../../../helpers/sql.js");

const patientModel = require("./patient.js");
const profileModel = require("./profile.js");
const medHistModel = require("./med-hist.js");
const mensHistModel = require("./mens-hist.js");

const consultationModel = require("./consultation.js");
// const eClaimModel = require("./e-claim.js");
// const cf4ClaimModel = require("./cf4-claim.js");

const pePertModel = require("./pe-pert.js");
const peModel = require("./pe.js");
const subjectiveModel = require("./subjective.js");
const courseWardModel = require("./course-ward.js");
const medicineModel = require("./medicine.js");

const errorLoggerModel = require("./error-logger.js");

const modelsMap = {
  [patientModel.table]: patientModel,
  [profileModel.table]: profileModel,
  [medHistModel.table]: medHistModel,
  [mensHistModel.table]: mensHistModel,

  [consultationModel.table]: consultationModel,
  // [eClaimModel.table]: eClaimModel,
  // [cf4ClaimModel.table]: cf4ClaimModel,

  [pePertModel.table]: pePertModel,
  [peModel.table]: peModel,
  [subjectiveModel.table]: subjectiveModel,
  [courseWardModel.table]: courseWardModel,
  [medicineModel.table]: medicineModel,
};

const columns = Object.values(modelsMap).reduce((prev, curr) => {
  if (curr.columns) prev.push(...curr.columns);
  return prev;
}, []);

const _removeForbiddenChars = (val) => {
  return typeof val === "string"
    ? val
        .replace(/ñ/g, "n")
        .replace(/Ñ/g, "N")
        .replace(/[^a-zA-Z0-9\s.,+\-=~"'/&%#@*:;()_]/g, "")
    : val;
};

const _parseJson = (val) => {
  if (!val) return null;

  // IF WEIRD JSON
  if (
    (val.startsWith('["[') && val.endsWith(']"]')) ||
    (val.startsWith('["{') && val.endsWith('}"]'))
  ) {
    return JSON.parse(JSON.parse(val)[0], (key, value) =>
      _removeForbiddenChars(value),
    );
  }

  // IF JSON
  try {
    return JSON.parse(val, (key, value) => _removeForbiddenChars(value));
  } catch (e) {}

  // IF PRIMITIVE
  return _removeForbiddenChars(val);
};

const dumpClaim = async (caseNo, txn) => {
  if (!caseNo || !txn) throw "cf4-db-dump: `caseNo` and `txn` are required.";

  const cf4DbDumpConn = db.getConn("eclaims");

  if (!cf4DbDumpConn) {
    await errorLoggerModel.insert(
      caseNo,
      "Unable to dump CF4 data. EClaims server is not available.",
      txn,
    );

    return null;
  }

  const _case = (
    await db.query(
      `SELECT
          caseNo,
          patientNo,
          patientType,
          DateAd dateTimeAdmitted,
          DateDis dateTimeDischarged,
          CASE WHEN (UDF_CASEDEPT = 'ER') THEN 1 ELSE 0 END isEmergency
        FROM
          UERMMMC..Cases
        WHERE
          CaseNo = ?;`,
      [caseNo],
      txn,
      false,
    )
  )[0];

  // const claim =
  //   (
  //     await db.query(
  //       `SELECT
  //           a.firstName,
  //           a.middleName,
  //           a.lastName,
  //           a.isMember,
  //           a.sex,
  //           a.dob,
  //           b.id_no pin,
  //           b.add_bgy addBrgy,
  //           b.add_municipality addMun,
  //           b.add_province addProv,
  //           b.add_zip addZip,
  //           c.TransNo transmittalNo
  //         FROM
  //           UERMMMC_PHILHEALTH..PATIENT_INFO a
  //           LEFT JOIN UERMMMC_PHILHEALTH..MEMBERS_INFO b ON b.CaseNo = a.CaseNo
  //           LEFT JOIN UERMMMC_PHILHEALTH..TRANSMITTAL_MAIN c ON c.CaseNo = a.CaseNo
  //         WHERE
  //           a.CaseNo = ?;`,
  //       [caseNo],
  //       null,
  //       false
  //     )
  //   )[0];

  if (!_case) {
    await errorLoggerModel.insert(caseNo, "Case not found.", txn);
    return null;
  }

  const patient = (
    await db.query(
      `SELECT
          PatientNo code,
          TRIM(p.firstName) firstName,
          TRIM(p.middleName) middleName,
          TRIM(p.lastName) lastName,
          CASE WHEN (ISNULL(TRIM(p.UDF_PHILHEALTHNO), '') = '') THEN 0 ELSE 1 END isMember,
          p.sex gender,
          p.DBIRTH dateOfBirth,
          p.bPlace placeOfBirth,
          p.UDF_PHILHEALTHNO pin,
          p.Barangay addBrgy,
          p.Municipality addMun,
          '' addProv,
          p.ZipCode addZip,
          r.DESCRIPTION religion
        FROM
          UERMMMC..PATIENTINFO p
          LEFT JOIN UERMMMC..RELIGION r ON r.Code = p.Religion
        WHERE
          p.PatientNo = ?;`,
      [_case.patientNo],
      txn,
      false,
    )
  )[0];

  if (!patient) {
    await errorLoggerModel.insert(caseNo, "Patient not found.", txn);
    return null;
  }

  const pxProfile = await profileModel.select(patient.code, txn);
  const pxMedHist = await medHistModel.selectMedHist(patient.code, txn);
  const pxFamMedHist = await medHistModel.selectFamMedHist(patient.code, txn);

  const pxMensHist = await mensHistModel.select(
    {
      code: patient.code,
      gender: patient.gender,
    },
    txn,
  );

  const claim = (
    await db.query(
      `SELECT
          id,
          code
        FROM
          DocumentMgt..Cf4Claims
        WHERE
          CaseNo = ?;`,
      [caseNo],
      txn,
      false,
    )
  )[0];

  const claimDetailRows = [];

  if (claim) {
    claimDetailRows.push(
      ...(await db.query(
        `SELECT
            fieldCode,
            value
          FROM
            DocumentMgt..Cf4ClaimDetails
          WHERE
            Status = 1
            AND ClaimId = ?;`,
        [claim.code],
        txn,
        false,
      )),
    );
  }

  if (!claim || claimDetailRows.length === 0) {
    await errorLoggerModel.insert(caseNo, "CF4 not found.", txn);
    return null;
  }

  // let firstCaseRateCode = null;
  // let secondCaseRateCode = null;
  const rowsToInsertMap = {};
  const claimDetails = [];

  // Pre-process cf4 special case rows [START]
  for (const row of claimDetailRows) {
    row.value = _parseJson(row.value);

    // if (row.fieldCode === "firstCaseRateResult") {
    //   firstCaseRateCode = row.value;
    //   continue;
    // }

    // if (row.fieldCode === "secondCaseRateResult") {
    //   secondCaseRateCode = row.value;
    //   continue;
    // }

    if (row.fieldCode === "courseInTheWardResult") {
      rowsToInsertMap[courseWardModel.table] = courseWardModel.format(
        row.value,
      );
    }

    if (row.fieldCode === "drugsOrMedicinesResult") {
      rowsToInsertMap[medicineModel.table] = medicineModel.format(row.value);
    }

    claimDetails.push(row);
  }
  // Pre-process cf4 special case rows [END]

  for (const column of columns) {
    const claimDetail = claimDetails.find((e) => {
      return e.fieldCode === column.source;
    });

    if (claimDetail) {
      if (!rowsToInsertMap[column.table]) {
        rowsToInsertMap[column.table] = [{}];
      }

      rowsToInsertMap[column.table][0][column.name] = column.format
        ? column.format(claimDetail.value)
        : claimDetail.value;
    }
  }

  // console.log(rowsToInsertMap);
  // console.log(patient);
  // console.log(pxMensHist);
  // console.log(_case);
  // return null;

  // eclaims admin account
  const userCode = process.env.DEV
    ? "64c9e2d4-93e8-462d-8225-7ce30c2b2a36"
    : "ccfd0310-37b4-4153-afd4-5b6d2e3797b7";

  const pmccNo = "300837";
  const hospitalCode = "H93005943";

  const addedConsultation = await db.transact(async (txn) => {
    // console.log("Adding patient...");
    const addedPatient = await patientModel.upsert(
      userCode,
      pmccNo,
      patient,
      _case,
      txn,
    );

    // console.log("Adding profile...");
    const addedProfile = await profileModel.upsert(
      userCode,
      addedPatient.id,
      {
        ...(pxProfile ?? {}),
        profDate: _case.dateTimeAdmitted,
        // patientPOB: patient.placeOfBirth,
        // patientAge: getAge(patient.dateOfBirth),
        // patientReligion: patient.religion,
      },
      txn,
    );

    // console.log("Adding med hist...");
    if (pxMedHist) {
      const addedMedHist = await medHistModel.upsert(
        userCode,
        addedPatient.id,
        true,
        false,
        pxMedHist,
        txn,
      );
    }

    // console.log("Adding fam med hist...");
    if (pxFamMedHist) {
      const addedFamMedHist = await medHistModel.upsert(
        userCode,
        addedPatient.id,
        false,
        true,
        pxFamMedHist,
        txn,
      );
    }

    // console.log("Adding mens hist...");
    const addedMensHist = await mensHistModel.upsert(
      userCode,
      addedPatient.id,
      patient.gender,
      pxMensHist,
      txn,
    );

    // console.log("Adding eclaim...");
    // const addedEClaim = await eClaimModel.upsert(
    //   hospitalCode,
    //   null,
    //   userCode,
    //   patient,
    //   _case,
    //   firstCaseRateCode,
    //   secondCaseRateCode,
    //   txn
    // );

    // console.log("Adding consultation..");
    const addedConsultation = await consultationModel.upsert(
      userCode,
      _case.caseNo,
      {
        patientId: addedPatient.id,
        soapDate: _case.dateTimeAdmitted,
      },
      txn,
    );

    // console.log("Adding cf4claim...");
    // const addedCf4Claim = await cf4ClaimModel.upsert(
    //   addedPatient.id,
    //   addedConsultation.id,
    //   addedEClaim.id,
    //   txn
    // );

    // CF4 DETAILS
    for (const table in rowsToInsertMap) {
      for (const item of rowsToInsertMap[table]) {
        // console.log(`Inserting into table ${table}...`);

        await modelsMap[table].upsert(
          userCode,
          addedConsultation.id,
          item,
          txn,
        );
      }
    }

    // return addedCf4Claim;
    return addedConsultation;
  }, cf4DbDumpConn);

  if (addedConsultation.error) {
    await errorLoggerModel.insert(caseNo, addedConsultation.error, txn);
    return null;
  }

  return addedConsultation;
};

const mergePatients = async (originalPxId, duplicatePxId) => {
  const cf4DbDumpConn = db.getConn("eclaims");

  if (!cf4DbDumpConn) {
    console.log("EClaims server is not available.");
    return null;
  }

  // console.log(`Merging px ${originalPxId} and ${duplicatePxId}`);
  // return null;

  return await db.query(
    `
      DECLARE @OrigPatientId INT = ?;
      DECLARE @DupedPatientId INT = ?;
      
      IF (@OrigPatientId = @DupedPatientId) BEGIN
        RAISERROR('OrigPatientId and DupedPatientId should not be the same.', 16, 1);
      END ELSE BEGIN
        /* ROLLBACK AUTOMATICALLY ON ERROR */
        SET XACT_ABORT ON;
        
        BEGIN TRANSACTION
      
          UPDATE EasyClaimsOffline..CF4Claim SET
          PatientId = @OrigPatientId
          WHERE PatientId = @DupedPatientId;
      
          UPDATE EasyClaimsOffline..Consultation SET
          PatientId = @OrigPatientId
          WHERE PatientId = @DupedPatientId;
      
          DELETE FROM EasyClaimsOffline..MenstrualHistory
          WHERE PatientId = @DupedPatientId;
      
          DELETE FROM EasyClaimsOffline..MedicalHistory
          WHERE PatientId = @DupedPatientId;
      
          DELETE FROM EasyClaimsOffline..Profile
          WHERE PatientId = @DupedPatientId;
      
          DELETE FROM EasyClaimsOffline..Patient
          WHERE Id = @DupedPatientId;

          SELECT
            Id,
            HciCaseNo,
            HciTransNo,
            PatientFName,
            PatientLname,
            PatientMname,
            PatientExtname,
            PatientPin,
            PatientDob
          FROM
            EasyClaimsOffline..Patient
          WHERE
            Id = @OrigPatientId;
      
        COMMIT TRANSACTION
      END
    `,
    [originalPxId, duplicatePxId],
    cf4DbDumpConn,
  );
};

const getPatientsByName = async (firstName, middleName, lastName, extName) => {
  if (!middleName) middleName = "";
  if (!extName) extName = "";

  const cf4DbDumpConn = db.getConn("eclaims");

  if (!cf4DbDumpConn) {
    console.log("EClaims server is not available.");
    return null;
  }

  return await db.query(
    `      
      SELECT 
        id,
        patientFName,
        patientMname,
        patientLname,
        patientExtname,
        patientDob,
        patientPin,
        hciCaseNo
      FROM
        EasyClaimsOffline..Patient
      WHERE
        RTRIM(LTRIM(REPLACE(PatientFName, '  ', ' '))) LIKE CONCAT('%', ?, '%')
        AND RTRIM(LTRIM(REPLACE(ISNULL(PatientMName, ''), '  ', ' '))) LIKE CONCAT('%', ?, '%')
        AND RTRIM(LTRIM(REPLACE(PatientLName, '  ', ' '))) LIKE CONCAT('%', ?, '%')
        AND RTRIM(LTRIM(REPLACE(ISNULL(PatientExtname, ''), '  ', ' '))) LIKE CONCAT('%', ?, '%');
    `,
    [firstName, middleName, lastName, extName],
    cf4DbDumpConn,
    false,
  );
};

module.exports = { dumpClaim, mergePatients, getPatientsByName };

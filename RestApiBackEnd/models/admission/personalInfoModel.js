/* eslint-disable no-console */
const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const getApplicantPersonalInfo = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ref_number refNumber,
      sn,
      last_name lastName,
      first_name firstName,
      middle_name middleName,
      nameExtension,
      birthdate,
      birthplace,
      gender,
      civil_status civilStatus,
      otherCivilStatus,
      religionCode religion,
      otherReligion,
      mobile_number mobileNumber,
      landline_number landlineNumber,
      email emailAddress,
      isFilipino,
      isDualCitizen,
      citizenship,
      otherCitizenship,
      permanent_resident,
      holderForeignPassport,
      spouse_name spouseName,
      spouse_occupation spouseOccupation,
      permanentCountry country,
      unitNo,
      lotNumber,
      street,
      region,
      province,
      city,
      barangay,
      zipCode,
      fulladdress permanentAddress,
      currentCountry,
      currentUnitNo,
      currentLotNumber,
      currentStreet,
      currentRegion,
      currentProvince,
      currentCity,
      currentBarangay,
      currentZipCode,
      currentFullAddress currentAddress,
      isFatherAlive,
      fathersFirstname,
      fathersLastname,
      fathersMiddlename,
      fathersExtension,
      fathersCitizenship,
      father_occupation fathersOccupation,
      fathersCompany,
      father_office fathersCompanyAddress,
      father_contactno fathersContactNumber,
      fathersLandline,
      father_email fathersEmailAddress,
      fathersHomeAddress,
      isFatherAlumni,
      fatherAlumniClass,
      fatherAlumniCollege,
      fatherUERMEmployee,
      fatherEmployeeDept,
      isFatherUEAlumni,
      fatherUEHighestLevel,
      fatherUEClass,
      isFatherUEEmployee, 
      fatherUEDepartment, 
      isFatherLTGEmployee, 
      fatherLTGCompany, 
      fatherAnnualIncome,
      isMotherAlive,
      mothersFirstname,
      mothersLastname,
      mothersMiddlename,
      mothersCitizenship,
      mother_occupation mothersOccupation,
      mothersCompany,
      mother_office mothersCompanyAddress,
      mother_contactno mothersContactNumber,
      mothersLandline,
      mother_email mothersEmailAddress,
      mothersHomeAddress,
      isMotherAlumni,
      motherAlumniClass,
      motherAlumniCollege,
      motherUERMEmployee,
      motherEmployeeDept,
      isMotherUEAlumni, 
      motherUEHighestLevel, 
      motherUEClass,
      isMotherUEEmployee, 
      motherUEDepartment, 
      isMotherLTGEmployee, 
      motherLTGCompany, 
      motherAnnualIncome,
      isGuardianAlive,
      guardiansFirstname,
      guardiansLastname,
      guardiansMiddlename,
      guardiansExtension,
      guardiansCitizenship,
      guardian_occupation guardiansOccupation,
      guardiansCompany,
      guardiansCompanyAddress,
      guardian_contactno guardiansContactNumber,
      guardiansLandline,
      guardian_email guardiansEmailAddress,
      guardiansHomeAddress,
      isGuardianAlumni,
      guardianAlumniClass,
      guardianAlumniCollege,
      guardianUERMEmployee,
      guardianEmployeeDept,
      isGuardianUEAlumni, 
      guardianUEHighestLevel, 
      guardianUEClass,
      isGuardianUEEmployee, 
      guardianUEDepartment, 
      isGuardianLTGEmployee, 
      guardianLTGCompany
      guardianAnnualIncome,
      emergencyName,
      emergencyContact,
      emergencyRelationship,
      emergencyAddress,
      applicantType,
      isVaccinated,
      philhealthDependent,
      philhealthMember,
      philhealthMemberDependents,
      philhealthMemberOtherDependents,
      philhealthMemberRegistration,
      philhealthNumber,
      otherVaccination,
      specialNeeds,
      allowExceptionAdmission,
      fatherEducationalAttainment,
      motherEducationalAttainment,
      guardianEducationalAttainment,
      fatherGrossIncome,
      motherGrossIncome,
      guardianGrossIncome,
      status,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..PersonalInfo
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (applicants.length > 0) {
      applicants.forEach(async (list) => {
        if (!util.empty(list.photo)) {
          list.photoBase64 = Buffer.from(list.photo).toString("base64");
        }
        // if (!util.empty(list.primaryVaccineCard)) {
        //   list.primaryVaccineCardBase64 = Buffer.from(
        //     list.primaryVaccineCard,
        //   ).toString("base64");
        // }
        // if (!util.empty(list.boosterVaccineCard)) {
        //   list.boosterVaccineCardBase64 = Buffer.from(
        //     list.boosterVaccineCard,
        //   ).toString("base64");
        // }

        if (list.birthdate !== null) {
          list.age = await util.getAge(list.birthdate.substring(0, 10));
        }
      });
    }
    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantPersonalInfoMedia = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      
    from UERMOnlineAdmission..PersonalInfo
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (applicants.length > 0) {
      // for (const app of applicants) {
      //   if (!util.empty(app.photo)) {
      //     app.photoBase64 = Buffer.from(app.photo).toString("base64");
      //   }
      //   if (!util.empty(app.primaryVaccineCard)) {
      //     app.primaryVaccineCardBase64 = Buffer.from(
      //       app.primaryVaccineCard,
      //     ).toString("base64");
      //   }
      //   if (!util.empty(app.boosterVaccineCard)) {
      //     app.boosterVaccineCardBase64 = Buffer.from(
      //       app.boosterVaccineCard,
      //     ).toString("base64");
      //   }
      // }

      applicants.forEach((list) => {
        if (!util.empty(list.photo)) {
          list.photoBase64 = Buffer.from(list.photo).toString("base64");
        }
        if (!util.empty(list.primaryVaccineCard)) {
          list.primaryVaccineCardBase64 = Buffer.from(
            list.primaryVaccineCard,
          ).toString("base64");
        }
        if (!util.empty(list.boosterVaccineCard)) {
          list.boosterVaccineCardBase64 = Buffer.from(
            list.boosterVaccineCard,
          ).toString("base64");
        }
      });
    }
    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantPersonalInfoDocuments = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    console.time();
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      ref_number,
      name,
      fileValue,
      fileName,
      fileValue,
      fileType,
      documentFile,
      college,
      status,
      active,
      dateTimeCreated, 
      dateTimeUpdated
    from UERMOnlineAdmission..PersonalInfoDocuments
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    if (applicants.length > 0) {
      applicants.forEach((list) => {
        if (list.fileValue !== null) {
          list.fileValue = Buffer.from(list.fileValue).toString("base64");
        }
      });
    }
    console.timeEnd();
    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const getApplicantPersonalInfoDocumentsWithoutRaw = async function (
  conditions,
  args,
  options,
  txn,
) {
  try {
    const applicants = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      name,
      fileName,
      fileType,
      documentFile,
      college,
      status,
      active,
      dateTimeCreated,
      dateTimeUpdated
    from UERMOnlineAdmission..PersonalInfoDocuments
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn,
    );

    return applicants;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const insertPersonalInfoDocuments = async function (payload, txn) {
  if (!util.isObj(payload)) {
    return { error: true, message: "Invalid Applicant" };
  }
  try {
    return await sqlHelper.insert(
      `UERMOnlineAdmission..PersonalInfoDocuments`,
      payload,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updatePersonalInfoDocuments = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      `UERMOnlineAdmission..PersonalInfoDocuments`,
      payload,
      condition,
      txn,
    );
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

module.exports = {
  getApplicantPersonalInfo,
  getApplicantPersonalInfoMedia,
  getApplicantPersonalInfoDocuments,
  getApplicantPersonalInfoDocumentsWithoutRaw,
  insertPersonalInfoDocuments,
  updatePersonalInfoDocuments,
};

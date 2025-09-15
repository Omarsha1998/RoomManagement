const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..subjective";

// UERM CF4 SIGNS AND SYMPTOMS FIELDS VS EASY CLAIMS SIGNS AND SYMPTOMS IDS
const signsAndSymptomsIdsMap = {
  symptomsAlteredMentalSensorium: 1,
  symptomsAbdominalCrampOrPain: 2,
  symptomsAnorexia: 3,
  symptomsBleedingGums: 4,
  symptomsBodyWeakness: 5,
  symptomsBlurringOfVision: 6,
  symptomsConstipation: 7,
  symptomsChestPainOrDiscomfort: 8,
  symptomsCough: 9,
  symptomsDiarrhea: 10,
  symptomsDizziness: 11,
  symptomsDysphagia: 12,
  symptomsDsypnea: 13,
  symptomsDysuria: 14,
  symptomsEpistaxis: 15,
  symptomsFrequencyOfUrination: 17,
  symptomsHeadache: 18,
  symptomsHematemesis: 19,
  symptomsHematuria: 20,
  symptomsHemoptysis: 21,
  symptomsIrritability: 22,
  symptomsJaundice: 23,
  symptomsLowerExtermityEdema: 25,
  symptomsMyalgia: 26,
  symptomsOrthopnea: 27,
  symptomsPalpitations: 28,
  symptomsSkinRashes: 29,
  symptomsStoolBloodOrBlackTrarryOrMucoid: 30,
  symptomsSweating: 32,
  symptomsSeizures: 33,
  symptomsUrgency: 34,
  symptomsVomiting: 35,
  symptomsWeightLoss: 36,
  symptomsFever: 37,
  symptomsPain: 38,
  symptomsOthers: "X",
};

const columns = [
  {
    name: "chiefComplaint",
    required: true,
    source: "chiefComplaint",
    size: 2000,
    format: (val) => val.toUpperCase(),
  },
  {
    name: "illnessHistory",
    default: "",
    source: "historyOfPresentIllnessResult",
    size: 2000,
    format: (val) => val?.toUpperCase() ?? "",
  },
  {
    name: "signsSymptoms",
    default: "X",
    source: "pertinentSignsAndSymptomsOnAdmissionList",
    format: (val) => {
      if (!val) return "X";
      if (!Array.isArray(val) || val.length === 0) return "X";

      return val
        .map((e) => {
          const fieldCode = e.code ?? e.value;
          return signsAndSymptomsIdsMap[fieldCode];
        })
        .join(";");
    },
    size: 2000,
  },
  {
    name: "otherComplaint",
    default: "",
    source: "symptomsOthersRemarks",
    size: 2000,
    format: (val) => val?.toUpperCase() ?? "",
  },
  {
    name: "painSite",
    default: "",
    source: "symptomsPainRemarks",
    size: 2000,
    format: (val) => val?.toUpperCase() ?? "",
  },
  {
    name: "reportStatus",
    default: "U",
  },
  {
    name: "deficiencyRemarks",
    default: "",
  },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

const insert = async (userCode, consultationId, item, txn) => {
  const row = db.createRow(item, columns);

  // USE CHIEF COMPLAINT IF SIGNS AND SYMPTOMS AND OTHER COMPLAINT ARE NOT AVAILABLE
  if (row.signsSymptoms === "X" && !row.otherComplaint) {
    row.otherComplaint = row.chiefComplaint;
  }

  return await db.upsert(
    tableName,
    row,
    { consultationId },
    userCode,
    txn,
    "CreatedBy",
    "Created",
    "UpdatedBy",
    "Updated",
  );
};

module.exports = {
  table: tableName,
  columns,
  columnsMap,
  insert,
};

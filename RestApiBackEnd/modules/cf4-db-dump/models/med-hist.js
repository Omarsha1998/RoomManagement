const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..medicalHistory";

const columns = [
  { name: "allergy", default: null },
  {
    name: "allergySpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "asthma", default: null },
  {
    name: "asthmaSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "cancer", default: null },
  {
    name: "cancerSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "cerebrovascularDisease", default: null },
  {
    name: "cerebrovascularDiseaseSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "coronaryArteryDisease", default: null },
  {
    name: "coronaryArteryDiseaseSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "diabetesMellitus", default: null },
  {
    name: "diabetesMellitusSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "emphysema", default: null },
  {
    name: "emphysemaSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "epilepsySeizureDisorder", default: null },
  {
    name: "epilepsySeizureDisorderSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "hepatitis", default: null },
  {
    name: "hepatitisSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "hyperlipidemia", default: null },
  {
    name: "hyperlipidemiaSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "hypertension", default: null },
  {
    name: "hypertensionSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "pepticUlcer", default: null },
  {
    name: "pepticUlcerSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "pneumonia", default: null },
  {
    name: "pneumoniaSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "thyroidDisease", default: null },
  {
    name: "thyroidDiseaseSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "pulmonaryTuberculosis", default: null },
  {
    name: "pulmonaryTuberculosisSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "extrapulmonaryTuberculosis", default: null },
  {
    name: "extrapulmonaryTuberculosisSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "urinaryTractInfection", default: null },
  {
    name: "urinaryTractInfectionSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "mentalIllness", default: null },
  {
    name: "mentalIllnessSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "others", default: null },
  {
    name: "othersSpecDesc",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "none", default: null },
  { name: "reportStatus", default: "U" },
  { name: "deficiencyRemarks", default: "" },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

const selectMedHist = async (patientCode, conn) => {
  const rows = await db.query(
    `SELECT
          n.id,
          nd.fieldCode,
          nd.value
        FROM
          EMR..Notes n
          LEFT JOIN EMR..NoteDetails nd ON nd.NoteId = n.Id
        WHERE
          n.Active = 1
          AND n.FieldGroupCode = 'ohtm'
          AND n.PatientNo = ?;`,
    [patientCode],
    conn,
    false,
  );

  if (rows.error) return null;
  if (rows.length === 0) return null;

  const illnesses = [];

  for (const row of rows) {
    if (row.fieldCode === "ohtmillness") illnesses.push(JSON.parse(row.value));
  }

  return {
    others: true,
    othersSpecDesc: illnesses.join("; "),
  };
};

const selectFamMedHist = async (patientCode, conn) => {
  const rows = await db.query(
    `SELECT
        n.id,
        nd.fieldCode,
        nd.value
      FROM
        EMR..Notes n
        LEFT JOIN EMR..NoteDetails nd ON nd.NoteId = n.Id
      WHERE
        n.Active = 1
        AND n.FieldGroupCode = 'famhist'
        AND n.PatientNo = ?;`,
    [patientCode],
    conn,
    false,
  );

  if (rows.error) return null;
  if (rows.length === 0) return null;

  const familyIllnesses = [];

  for (const row of rows) {
    if (row.fieldCode === "famhistillness")
      familyIllnesses.push(JSON.parse(row.value));
  }

  return {
    others: true,
    othersSpecDesc: familyIllnesses.join("; "),
  };
};

const insert = async (
  userCode,
  patientCode,
  forPatient,
  forPatientFamily,
  item,
  txn,
) => {
  if (!userCode) throw "`userCode` is required.";
  if (!patientCode) throw "`patientCode` is required.";
  if (!txn) throw "`txn` is required.";

  if (forPatient == null) forPatient = true;
  if (forPatientFamily == null) forPatientFamily = false;

  if (!item) item = {};
  const row = db.createRow(item, columns);

  return await db.upsert(
    tableName,
    row,
    {
      patientId: patientCode,
      patient: forPatient,
      family: forPatientFamily,
    },
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
  selectMedHist,
  selectFamMedHist,
  insert,
};

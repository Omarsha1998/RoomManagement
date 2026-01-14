const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const __isEssentiallyNormal = (bodyPart, bodyPartStatus) => {
  if (!bodyPart) throw "`bodyPart` is required.";

  if (
    !bodyPartStatus ||
    (Array.isArray(bodyPartStatus) && bodyPartStatus.length === 0)
  )
    return null;

  return bodyPartStatus.some((e) => {
    return (
      e.code.toUpperCase() === `${bodyPart}EssentiallyNormal`.toUpperCase()
    );
  });
};

const __abnormalityFound = (bodyPart, bodyPartStatus, abnormality) => {
  if (!abnormality) throw "abnormality is required.";

  const isEssentiallyNormal = __isEssentiallyNormal(bodyPart, bodyPartStatus);
  if (isEssentiallyNormal === null || isEssentiallyNormal === true) return null;

  return bodyPartStatus.some((e) => {
    return e.code.toUpperCase() === (bodyPart + abnormality).toUpperCase();
  });
};

const tableName = "EasyClaimsOffline..physicalExamination";

const columns = [
  {
    name: "GenSurveyId",
    required: true,
    source: "physicalExaminationOnAdmissionGeneralSurveyResult",
    format: (val) => {
      if (!val) return null;
      return val?.code === "surveyAwakeAndAlert" ? "1" : "2";
    },
  },
  {
    name: "GenSurveyRem",
    default: "",
    source: "surveyAlteredSensoriumRemarks",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  // SKIN
  {
    name: "SkinEssentiallyNormal",
    default: 1,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __isEssentiallyNormal("skinExtremities", val);
    },
  },
  {
    name: "Clubbing",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "Clubbing");
    },
  },
  {
    name: "ColdClammy",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "ColdClammySkin");
    },
  },
  {
    name: "CyanosisMottledSkin",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound(
        "skinExtremities",
        val,
        "CyanosisOrMottledSkin",
      );
    },
  },
  {
    name: "EdemaSwelling",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "EdemaOrSwelling");
    },
  },
  {
    name: "DecreasedMobility",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "DecreasedMobility");
    },
  },
  {
    name: "PaleNailbeds",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "PaleNailbeds");
    },
  },
  {
    name: "PoorSkinTurgor",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "PoorSkinTurgor");
    },
  },
  {
    name: "RashesPetechiae",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "RashesOrPetechiae");
    },
  },
  {
    name: "WeakPulses",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "WeakPulses");
    },
  },
  {
    name: "SkinOthers",
    default: null,
    source: "physicalExaminationOnAdmissionSkinExtremitiesResult",
    format: (val) => {
      return __abnormalityFound("skinExtremities", val, "Others");
    },
  },
  {
    name: "SkinRem",
    default: null,
    source: "skinExtremitiesOthersResult",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  // HEENT
  // NOT FOUND IN THE CURRENT CF4 FIELDS
  { name: "AnictericSclerae", default: null },
  { name: "IntactTympanicMebrane", default: null },
  { name: "PupilsBriskyReactiveToLight", default: null },
  { name: "TonsillopharyngealCongestion", default: null },
  { name: "HypertropicTonsils", default: null },
  { name: "AlarFlaring", default: null },
  { name: "NasalDischarge", default: null },
  { name: "AuralDischarge", default: null },
  { name: "HeentPalpableMass", default: null },
  { name: "Exudates", default: null },
  {
    name: "HeentEssentiallyNormal",
    default: 1,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __isEssentiallyNormal("heent", val);
    },
  },
  {
    name: "AbnormalPupillaryReaction",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "AbnormalPupillaryReaction");
    },
  },
  {
    name: "CervicalLympadenopathy",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "CervicalLymphadenopathy");
    },
  },
  {
    name: "DryMucousMembrane",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "DryMucousMembrane");
    },
  },
  {
    name: "IctericSclerae",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "IctericSclerae");
    },
  },
  {
    name: "PaleConjunctivae",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "PaleConjunctivae");
    },
  },
  {
    name: "SunkenEyeballs",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "SunkenEyeballs");
    },
  },
  {
    name: "SunkenFontanelle",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "SunkenFontanelle");
    },
  },
  {
    name: "HeentOthers",
    default: null,
    source: "physicalExaminationOnAdmissionHEENTResult",
    format: (val) => {
      return __abnormalityFound("heent", val, "Others");
    },
  },
  {
    name: "HeentRem",
    default: null,
    source: "heentOthersResult",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  // CHEST & LUNGS
  {
    name: "ChestEssentiallyNormal",
    default: 1,
    source: "physicalExaminationOnAdmissionChestOrLungsResult",
    format: (val) => {
      return __isEssentiallyNormal("chestLungs", val);
    },
  },
  {
    name: "CracklesRales",
    default: null,
    source: "physicalExaminationOnAdmissionChestOrLungsResult",
    format: (val) => {
      return __abnormalityFound("chestLungs", val, "RalesOrCracklesRhonchi");
    },
  },
  { name: "SymmetricalChestExpansion", default: null },
  { name: "ClearBreathSounds", default: null },
  { name: "Retractions", default: null },
  {
    name: "Wheezes",
    default: null,
    source: "physicalExaminationOnAdmissionChestOrLungsResult",
    format: (val) => {
      return __abnormalityFound("chestLungs", val, "Wheezes");
    },
  },
  {
    name: "AsymmetricalChestExpansion",
    default: null,
    source: "physicalExaminationOnAdmissionChestOrLungsResult",
    format: (val) => {
      return __abnormalityFound(
        "chestLungs",
        val,
        "AsymmetricalChestExpansion",
      );
    },
  },
  {
    name: "DecreasedBreathSounds",
    default: null,
    source: "physicalExaminationOnAdmissionChestOrLungsResult",
    format: (val) => {
      return __abnormalityFound("chestLungs", val, "DecreasedBreathSounds");
    },
  },
  { name: "EnlargeAxillaryLymphNodes", default: null },
  {
    name: "LumpsOverBreasts",
    default: null,
    source: "physicalExaminationOnAdmissionChestOrLungsResult",
    format: (val) => {
      return __abnormalityFound("chestLungs", val, "LumpsOverBreasts");
    },
  },
  {
    name: "ChestOthers",
    default: null,
    source: "physicalExaminationOnAdmissionChestOrLungsResult",
    format: (val) => {
      return __abnormalityFound("chestLungs", val, "Others");
    },
  },
  {
    name: "ChestRem",
    default: null,
    source: "chestLungsOthersResult",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  // ABDOMEN
  {
    name: "AbdomenEssentiallyNormal",
    default: 1,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __isEssentiallyNormal("abdomen", val);
    },
  },
  { name: "AbdomenPalpableMass", default: null },
  {
    name: "AbdominalRigidity",
    default: null,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __abnormalityFound("abdomen", val, "AbdominalRigidity");
    },
  },
  {
    name: "AbdominalTenderness",
    default: null,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __abnormalityFound("abdomen", val, "AbdomenTenderness");
    },
  },
  {
    name: "HyperactiveBowelSounds",
    default: null,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __abnormalityFound("abdomen", val, "HyperactiveBowelSounds");
    },
  },
  {
    name: "AbdomenPalpableMasses",
    default: null,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __abnormalityFound("abdomen", val, "PalpableMasses");
    },
  },
  {
    name: "TympaniticDullAbdomen",
    default: null,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __abnormalityFound("abdomen", val, "TympaniticDullAbdomen");
    },
  },

  {
    name: "UterineContraction",
    default: null,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __abnormalityFound("abdomen", val, "UterineContraction");
    },
  },
  {
    name: "AbdomenOthers",
    default: null,
    source: "physicalExaminationOnAdmissionAbdomenResult",
    format: (val) => {
      return __abnormalityFound("abdomen", val, "Others");
    },
  },
  {
    name: "AbdomenRem",
    default: null,
    source: "abdomenOthersResult",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  // HEART
  {
    name: "HeartEssentiallyNormal",
    default: 1,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __isEssentiallyNormal("cvs", val);
    },
  },
  {
    name: "IrregularRhythm",
    default: null,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __abnormalityFound("cvs", val, "IrregularRhythm");
    },
  },
  { name: "AdynamicPrecordium", default: null },
  { name: "NormalRateRegularRhythm", default: null },
  {
    name: "HeavesTrills",
    default: null,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __abnormalityFound("cvs", val, "HeavesAndOrThrills");
    },
  },
  {
    name: "Murmurs",
    default: null,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __abnormalityFound("cvs", val, "Murmur");
    },
  },
  {
    name: "DisplacedApexBeat",
    default: null,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __abnormalityFound("cvs", val, "DisplacedApexBeat");
    },
  },
  {
    name: "MuffledHeartSounds",
    default: null,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __abnormalityFound("cvs", val, "MuffledHeartSounds");
    },
  },
  {
    name: "PericardialBulge",
    default: null,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __abnormalityFound("cvs", val, "PericardialBulge");
    },
  },
  {
    name: "HeartOthers",
    default: null,
    source: "physicalExaminationOnAdmissionCVSResult",
    format: (val) => {
      return __abnormalityFound("cvs", val, "Others");
    },
  },
  {
    name: "HeartRem",
    default: null,
    source: "cvsOthersResult",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  // NEURO
  { name: "DevelopmentalDelay", default: null },
  { name: "Seizures", default: null },
  { name: "Normal", default: null },
  { name: "MotorDeficit", default: null },
  { name: "SensoryDeficit", default: null },
  {
    name: "NeuroEssentiallyNormal",
    default: 1,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __isEssentiallyNormal("neuroExam", val);
    },
  },
  {
    name: "AbnormalGait",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound("neuroExam", val, "AbnormalGait");
    },
  },
  {
    name: "PoorAlteredMemory",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound("neuroExam", val, "PoorAlteredMemory");
    },
  },
  {
    name: "PoorMuscleToneStrength",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound("neuroExam", val, "PoorMuscleToneOrStrength");
    },
  },
  {
    name: "AbnormalSensation",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound(
        "neuroExam",
        val,
        "AbnormalOrDecreasedSensation",
      );
    },
  },
  {
    name: "PoorCoordination",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound("neuroExam", val, "PoorCoordination");
    },
  },
  {
    name: "AbnormalPositionSense",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound("neuroExam", val, "AbnormalPositionSense");
    },
  },
  {
    name: "AbnormalReflexes",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound("neuroExam", val, "AbnormalReflexes");
    },
  },
  {
    name: "NeuroOthers",
    default: null,
    source: "physicalExaminationNeuroExamResult",
    format: (val) => {
      return __abnormalityFound("neuroExam", val, "Others");
    },
  },
  {
    name: "NeuroRem",
    default: null,
    source: "neuroExamOthersResult",
    format: (val) => (val ? val.toUpperCase() : null),
  },
  // GENITO URINARY
  {
    name: "GenitourinaryEssentiallyNormal",
    default: 1,
    source: "physicalExaminationOnAdmissionGUIEResult",
    format: (val) => {
      return __isEssentiallyNormal("guIE", val);
    },
  },
  {
    name: "BloodStainedInExamFinger",
    default: null,
    source: "physicalExaminationOnAdmissionGUIEResult",
    format: (val) => {
      return __abnormalityFound("guIE", val, "BloodStainedInExamFinger");
    },
  },
  {
    name: "CervicalDilatation",
    default: null,
    source: "physicalExaminationOnAdmissionGUIEResult",
    format: (val) => {
      return __abnormalityFound("guIE", val, "CervicalDilatation");
    },
  },
  {
    name: "PresenceOfAbnormalDischarge",
    default: null,
    source: "physicalExaminationOnAdmissionGUIEResult",
    format: (val) => {
      return __abnormalityFound("guIE", val, "PresenceOfAbnormalDischarge");
    },
  },
  {
    name: "GenitourinaryOthers",
    default: null,
    source: "physicalExaminationOnAdmissionGUIEResult",
    format: (val) => {
      return __abnormalityFound("guIE", val, "Others");
    },
  },
  {
    name: "GuRem",
    default: null,
    source: "guIEOthersResult",
    format: (val) => (val ? val.toUpperCase() : null),
  },

  // RECTAL
  { name: "RectalEssentiallyNormal", default: 1 },
  { name: "EnlargeProspate", default: null },
  { name: "Mass", default: null },
  { name: "Hemorrhoids", default: null },
  { name: "Pus", default: null },
  {
    name: "RectalRem",
    default: null,
    format: (val) => (val ? val.toUpperCase() : null),
  },

  { name: "Flat", default: null },
  { name: "Flabby", default: null },
  { name: "Globullar", default: null },
  { name: "MuscleGuarding", default: null },
  { name: "Tenderness", default: null },

  { name: "reportStatus", default: "U" },
  { name: "deficiencyRemarks", default: "" },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

const upsert = async (userCode, consultationId, item, txn) => {
  const row = db.createRow(item, columns);

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
  upsert,
};

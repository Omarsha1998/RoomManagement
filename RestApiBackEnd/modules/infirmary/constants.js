const CAMPUSES = {
  MANILA: "MNL",
  CALOOCAN: "CAL",
  UERM: "UERM",
};

const AFFILIATIONS = {
  EMPLOYEE: "EMP",
  STUDENT: "STU",
};

const EXAMS = {
  MED_HIST: "MED_HIST",
  PHYSICAL_EXAM: "PE",
  LAB_CBC: "LAB_CBC",
  LAB_URI: "LAB_URI",
  LAB_FECA: "LAB_FCL",
  RAD_XRAY_CHEST: "RAD_XR_CHST",
};

const examCodes = Object.values(EXAMS);

const USER_ROLES = {
  ADMIN: { code: "ADMIN", name: "Administrator" },
  DR: { code: "DR", name: "Physician" },
  NURSE: { code: "NURSE", name: "Nurse" },
  RAD: { code: "RAD", name: "Radiologist" },
  RADTECH: { code: "RADTECH", name: "Radiologic Technologist" },
  LAB: { code: "LAB", name: "Pathologist" },
  LABTECH: { code: "LABTECH", name: "Laboratory Technologist" },
  STAFF: { code: "STAFF", name: "Staff" },
  FACULTY: { code: "FAC", name: "Faculty" },
};

// ALLOW `LABFCL` FOR UE CALOOCAN EMPLOYEES
// NOTE:
// - `null` MEANS ALL PATIENTS MUST DO THE EXAM/PROCEDURE
// - LOGICAL `OR` WILL BE USED FOR THE ARRAY ITEMS WHILE
//   LOGICAL `AND` WILL BE USED FOR THE ITEM PROPS.

const examPxCriteria = {
  [EXAMS.MED_HIST]: null,
  [EXAMS.PHYSICAL_EXAM]: null,
  [EXAMS.LAB_CBC]: null,
  [EXAMS.LAB_URI]: null,
  [EXAMS.LAB_FECA]: [
    {
      affiliationCode: AFFILIATIONS.EMPLOYEE,
      campusCode: CAMPUSES.CALOOCAN,
    },
  ],
  [EXAMS.RAD_XRAY_CHEST]: null,
};

const userRoleToExamsHandledMap = {
  [USER_ROLES.DR.code]: examCodes,
  [USER_ROLES.ADMIN.code]: examCodes,
  [USER_ROLES.NURSE.code]: [EXAMS.PHYSICAL_EXAM],
  [USER_ROLES.RAD.code]: [EXAMS.RAD_XRAY_CHEST],
  [USER_ROLES.RADTECH.code]: [EXAMS.RAD_XRAY_CHEST],
  [USER_ROLES.LAB.code]: [EXAMS.LAB_CBC, EXAMS.LAB_URI, EXAMS.LAB_FECA],
  [USER_ROLES.LABTECH.code]: [EXAMS.LAB_CBC, EXAMS.LAB_URI, EXAMS.LAB_FECA],
  [USER_ROLES.STAFF.code]: [],
  [USER_ROLES.FACULTY.code]: [],
};

const VISIT_ORDER_ACTIONS = {
  ACKNOWLEDGE: "ACKNOWLEDGE",
  RESET: "RESET",
};

module.exports = {
  CAMPUSES,
  AFFILIATIONS,
  EXAMS,
  USER_ROLES,
  examPxCriteria,
  userRoleToExamsHandledMap,
  VISIT_ORDER_ACTIONS,
};

const {
  empty,
  isArr,
  isObj,
  removeHTMLTags,
  jsDateToISOString,
} = require("../../../helpers/util.js");
const db = require("../../../helpers/sql.js");

const selectPatientLabsOutside = async (conditions, txn) => {
  const sqlWhereStrArr = [];
  const sqlWhereArgs = [];
  let sqlWhereStr = "";

  if (isArr(conditions)) {
    for (const noteCode of conditions) {
      sqlWhereStrArr.push("?");
      sqlWhereArgs.push(noteCode);
    }

    sqlWhereStr =
      sqlWhereStrArr.length > 0
        ? `WHERE noteCode IN (${sqlWhereStrArr.join(",")})`
        : "";
  } else if (isObj(conditions)) {
    conditions["fieldCode"] = "diagflowlab";

    for (const key in conditions) {
      sqlWhereStrArr.push(`${key} = ?`);
      sqlWhereArgs.push(conditions[key]);
    }

    sqlWhereStr =
      sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : "";
  }

  const sqlStr = `SELECT * FROM (SELECT
    n.PatientNo patientNo,
    n.Code noteCode,
    n.Active active,
    nd.FieldCode fieldCode,
    nd.Value value,
    CONCAT(u.LastName, ', ', u.FirstName, ' ', u.MiddleName, ' (', n.createdByRoleCode, ')') createdBy
  FROM
    EMR..NoteDetails nd
    LEFT JOIN EMR..Notes n ON n.Id = nd.NoteId
    LEFT JOIN EMR..Users u ON u.EmployeeId = n.CreatedBy) tb
  ${sqlWhereStr};`;

  // console.log(sqlStr);
  // console.log(sqlWhereArgs);

  diagRows = await db.query(sqlStr, sqlWhereArgs, txn);

  for (const diag of diagRows) {
    diag.value = JSON.parse(diag.value);
    diag.value.date = `${diag.value.date.replace(/\//g, "-")} 00:00:00`;
    diag.value.type = diag.value.type ?? "lab";
  }

  return diagRows;
};

const selectPatientLabsLocal = async (conditions, txn) => {
  const sqlWhereStrArr = [];
  const sqlWhereStrArgs = [];
  let sqlWhereStr = "";

  if (isArr(conditions)) {
    for (const noteCode of conditions) {
      // Additional "noteCode LIKE ?" is for backward compatibility only (Lab Pertinent tags without "dash and diag code" suffix)
      sqlWhereStrArr.push(`(noteCode = ? OR noteCode LIKE ?)`);
      sqlWhereStrArgs.push(noteCode);
      sqlWhereStrArgs.push(`${noteCode}%`);
    }

    sqlWhereStr =
      sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" OR ")}` : "";
  } else if (isObj(conditions)) {
    for (const key in conditions) {
      if (key === "noteCode") {
        // Additional "noteCode LIKE ?" is for backward compatibility only (Lab Pertinent tags without "dash and diag code" suffix)
        sqlWhereStrArr.push(`(noteCode = ? OR noteCode LIKE ?)`);
        sqlWhereStrArgs.push(conditions[key]);
        sqlWhereStrArgs.push(`${conditions[key]}%`);
        continue;
      }

      sqlWhereStrArr.push(`${key} = ?`);
      sqlWhereStrArgs.push(conditions[key]);
    }

    sqlWhereStr =
      sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : "";
  }

  const sqlStr = `SELECT * FROM (SELECT
    /* lab.chargeslipNo,
    lab.testName,
    lab.lisTestCode, */

    lab.PatientId patientNo,

    /* Combine multiple fields from UERMResults..LaboratoryRawResults to act as a noteCode (row's natural key) */ 
    CONCAT(
      lab.PatientId, 
      '-', 
      lab.ChargeId, 
      '-', 
      FORMAT(lab.DateTimeReleased, 'yyyy-MM-dd-HH-mm-ss'),
      '-',
      diag.code
    ) noteCode,
    
    diagparams.code diagParamCode,
    diagparams.name diagParamName,
    diagparams.fieldTypeCode diagParamFieldTypeCode,
    diagparams.hasRange diagParamHasRange,
    diagparams.sequence diagParamSequence,
    lab.ReferenceRange diagParamNormalRange,
    lab.Result diagParamValue,
    lab.resultFlag diagParamValueFlag,
    lab.resultType diagParamMetric,
    lab.resultUnit diagParamMetricUnit,
    
    lab.dateTimeReleased diagDate,
    diag.Code diagCode,
    diag.name diagName,
    diag.type diagCenterType
  FROM
    UERMResults..LaboratoryRawResults lab WITH(NOLOCK)
    JOIN EMR..DiagnosticListDetails diagparams ON diagparams.LISCode = lab.LISTestCode
    JOIN EMR..DiagnosticLists diag ON diag.code = diagparams.diagnosticListsCode
    /* JOIN UERMMMC..CHARGES_MAIN cha ON cha.CHARGESLIPNO = lab.ChargeSlipNo */
  ) tb
  ${sqlWhereStr}
  ORDER BY diagDate, diagName, diagParamName, diagParamMetric;`;

  // console.log(sqlStr);
  // console.log(sqlWhereStrArgs);

  const rows = await db.query(sqlStr, sqlWhereStrArgs, txn);

  // Merge rows containing the SI and Conv Values
  const localDiagRows = [];
  const convValues = [];
  const siValues = [];

  for (const row of rows) {
    const param = {
      ...row,
      diagParamValue: removeHTMLTags(row.diagParamValue),
      diagDate: row.diagDate
        ? jsDateToISOString(row.diagDate).substring(0, 19)
        : null,
    };

    const isConventional =
      param.diagParamMetric &&
      param.diagParamMetric.toLowerCase() === "conventional";

    if (isConventional) {
      convValues.push(param);
    } else {
      siValues.push(param);
    }
  }

  for (const siValue of siValues) {
    const newLocalDiagRow = {
      ...siValue,
    };

    const convValue = convValues.find(
      (val) =>
        val.diagParamCode === siValue.diagParamCode &&
        val.noteCode === siValue.noteCode,
    );

    if (convValue) {
      newLocalDiagRow["diagParamConvValue"] = convValue.diagParamValue;

      newLocalDiagRow["diagParamConvNormalRange"] =
        convValue.diagParamNormalRange;

      newLocalDiagRow["diagParamConvMetric"] = convValue.diagParamMetric;

      newLocalDiagRow["diagParamConvMetricUnit"] =
        convValue.diagParamMetricUnit;
    }

    localDiagRows.push(newLocalDiagRow);
  }

  // Group rows using noteCode
  const localDiagsMap = {};

  for (const localDiagRow of localDiagRows) {
    if (empty(localDiagRow.diagParamValue)) continue;

    if (localDiagsMap[localDiagRow.noteCode] === undefined) {
      localDiagsMap[localDiagRow.noteCode] = {
        noteCode: localDiagRow.noteCode,
        value: {
          allParamsVisible: true,
          center: "UERMMMC",
          date: localDiagRow.diagDate,
          label: localDiagRow.diagName,
          value: localDiagRow.diagCode,
          type: localDiagRow.diagCenterType,
          children: [],
        },
      };
    }

    const diagParam = {
      value: localDiagRow.diagParamCode,
      label: localDiagRow.diagParamName,
      type: localDiagRow.diagParamFieldTypeCode,
      hasRange: localDiagRow.diagParamHasRange,
      sequence: localDiagRow.diagParamSequence,
      children: [
        {
          value: localDiagRow.diagParamValue,
          label: "Value",
        },
        {
          value: localDiagRow.diagParamNormalRange ?? "",
          label: "Reference Range",
        },
        {
          value: localDiagRow.diagParamMetric ?? "",
          label: "Metric",
        },
        {
          value: localDiagRow.diagParamMetricUnit ?? "",
          label: "Unit",
        },
        {
          value: localDiagRow.diagParamConvValue,
          label: "Value (CONV)",
        },
        {
          value: localDiagRow.diagParamConvNormalRange ?? "",
          label: "Reference Range (CONV)",
        },
        {
          value: localDiagRow.diagParamConvMetric ?? "",
          label: "Metric (CONV)",
        },
        {
          value: localDiagRow.diagParamConvMetricUnit ?? "",
          label: "Unit (CONV)",
        },
        {
          value: localDiagRow.diagParamValueFlag ?? "",
          label: "Value Flag",
        },
      ],
    };

    localDiagsMap[localDiagRow.noteCode].value.children.push(diagParam);
  }

  return Object.values(localDiagsMap);
};

const selectPatientRadsLocal = async (conditions, txn) => {
  const sqlWhereArgs = ["undefined", "2023-05-30"];
  const sqlWhereStrArr = [
    "oru.resultUrl <> ?",
    "CONVERT(DATE, oru.dateCreated) >= ?",
  ];

  if (conditions.patientNo) {
    sqlWhereStrArr.push("c.patientNo = ?");
    sqlWhereArgs.push(conditions.patientNo);
  }

  const sqlWhereStr =
    sqlWhereStrArr.length > 0 ? `WHERE ${sqlWhereStrArr.join(" AND ")}` : "";

  const sqlStr = `SELECT DISTINCT
    --oru.chargeSlipNo,
    --orm.patientType,
    --c.patientNo,
    oru.hl7resultId noteCode,
    oru.dateCreated dateTimeCreated,
    orm.chargeDescription diagParamName,
    oru.resultUrl imageURL,
    oru.RawResult initImpression
  FROM
    UERM_LIS..HISRadiologyORU oru
    JOIN UERM_LIS..HISRadiologyORM orm ON orm.hl7orderId = oru.hl7resultID
    JOIN UERMMMC..CASES c ON c.CaseNo = orm.CaseNo
  ${sqlWhereStr};`;

  // console.log(sqlStr);
  // console.log(sqlWhereArgs);

  const rows = await db.query(sqlStr, sqlWhereArgs, txn);
  const radioDiagsMap = {};

  for (const row of rows) {
    if (radioDiagsMap[row.noteCode] === undefined) {
      radioDiagsMap[row.noteCode] = {
        noteCode: row.noteCode,
        value: {
          allParamsVisible: true,
          center: "UERMMMC",
          date: row.dateTimeCreated
            ? jsDateToISOString(row.dateTimeCreated).substring(0, 19)
            : null,
          type: "rad",
          label: "Radiology",
          value: "radio",
          children: [],
        },
      };
    }

    radioDiagsMap[row.noteCode].value.children.push({
      value: row.diagParamName.replace(/ /g, ""),
      label: `${row.diagParamName} (Image)`,
      type: "link",
      hasRange: 0,
      sequence: 1,
      children: [
        {
          value: row.imageURL.replace(
            "http://10.107.3.214",
            "https://uerm.novarad.net.ph",
          ),
          label: "Value",
        },
      ],
    });

    radioDiagsMap[row.noteCode].value.children.push({
      value: `initimpression${row.diagParamName.replace(/ /g, "")}`,
      label: `${row.diagParamName} (Initial Impression)`,
      type: "text",
      hasRange: 0,
      sequence: 1,
      children: [
        {
          value: `[INITIAL IMPRESSION]\n\n${removeHTMLTags(row.initImpression)}`,
          label: "Value",
        },
      ],
    });
  }

  return Object.values(radioDiagsMap);
};

const getDiagnostics = async (req, res) => {
  if (empty(req.params.patientNo))
    return res
      .status(400)
      .json({ error: "`patientNo` param in URL is required." });

  res.json(
    await db.transact(async (txn) => {
      const outsideLabs = await selectPatientLabsOutside(
        {
          active: 1,
          patientNo: req.params.patientNo,
        },
        txn,
      );

      const localLabs = await selectPatientLabsLocal(
        {
          patientNo: req.params.patientNo,
        },
        txn,
      );

      const localRads = await selectPatientRadsLocal(
        {
          patientNo: req.params.patientNo,
        },
        txn,
      );

      return [...outsideLabs, ...localLabs, ...localRads];
    }),
  );
};

const getInpatientMonitoring = async (req, res) => {
  if (empty(req.query)) {
    return res
      .status(400)
      .json({ error: "At least one Request Query is required." });
  }

  const [whereStr, whereArgs] = db.where(req.query);

  const rows = await db.query(
    `SELECT
        im.id id,
        im.caseNo caseNo,
        --im.createdBy createdBy,
        CONCAT(u.LastName, ', ', u.FirstName, ' ', u.MiddleName) createdBy,
        im.dateTimeCreated dateTimeCreated,
        im.updatedBy updatedBy,
        im.dateTimeUpdated dateTimeUpdate,
        imd.id fieldId,
        imd.fieldCode fieldCode,
        imd.value fieldValue,
        imd.createdBy fieldCreatedBy,
        imd.dateTimeCreated fieldDateTimeCreated,
        imd.updatedBy fieldUpdatedBy,
        imd.dateTimeUpdated fieldDateTimeUpdated
      FROM
        EMR..InpatientMonitoring im
        LEFT JOIN EMR..InpatientMonitoringDetails imd ON imd.InpatientMonitoringId = im.Id
        LEFT JOIN EMR..Users u ON u.EmployeeId = im.CreatedBy
      ${whereStr};`,
    whereArgs,
  );

  const ipdMonMap = {};

  for (const row of rows) {
    if (ipdMonMap[row.id] === undefined) {
      ipdMonMap[row.id] = {
        id: row.id,
        caseNo: row.caseNo,
        createdBy: row.createdBy,
        dateTimeCreated: row.dateTimeCreated,
        updatedBy: row.updatedBy,
        dateTimeUpdated: row.dateTimeUpdate,
        details: [],
      };
    }

    ipdMonMap[row.id].details.push({
      id: row.fieldId,
      code: row.fieldCode,
      value: row.fieldValue,
      createdBy: row.fieldCreatedBy,
      dateTimeCreated: row.fieldDateTimeCreated,
      updatedBy: row.fieldUpdatedBy,
      dateTimeUpdated: row.fieldDateTimeUpdated,
    });
  }

  res.json(Object.values(ipdMonMap));
};

module.exports = {
  getDiagnostics,
  getInpatientMonitoring,
};

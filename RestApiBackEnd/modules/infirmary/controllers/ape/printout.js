const path = require("path");
const stream = require("stream");
const pdfMakePrinter = require("pdfmake/src/printer.js");
const pdftk = require("node-pdftk");

const db = require("../../../../helpers/sql.js");

const {
  hashMatched,
  generateAccessToken,
  verifyAccessToken,
} = require("../../../../helpers/crypto.js");

const {
  formatName,
  formatDateV3,
  isError,
  sliceObj,
  delay,
} = require("../../../../helpers/util.js");

const {
  extractTokenFromRequest,
  respond,
} = require("../../../../helpers/controller.js");

const visitModel = require("../../models/ape/visit.js");
const miscModel = require("../../models/ape/misc.js");

const fontDescriptors = {
  Roboto: {
    normal: path.join(
      __dirname,
      "..",
      "..",
      "helpers/pdfmake-fonts/Roboto-Regular.ttf",
    ),
    bold: path.join(
      __dirname,
      "..",
      "..",
      "helpers/pdfmake-fonts/Roboto-Medium.ttf",
    ),
    italics: path.join(
      __dirname,
      "..",
      "..",
      "helpers/pdfmake-fonts/Roboto-Italic.ttf",
    ),
    bolditalics: path.join(
      __dirname,
      "..",
      "..",
      "helpers/pdfmake-fonts/Roboto-MediumItalic.ttf",
    ),
  },
};

const printer = new pdfMakePrinter(fontDescriptors);

pdftk.configure({
  bin: path.join(__dirname, "..", "..", "helpers/pdftk-server/pdftk.exe"),
});

const _formatVisitExamDetails = (exams, details) => {
  const ret = {
    patient: details.patient,
    visit: details.visit,
    additionalVisitExamDetailsMap: details.additionalVisitExamDetailsMap,
    exams: {},
  };

  for (const exam of exams) {
    ret.exams[exam.code] = details.details
      .filter((e) => e.examCode === exam.code)
      .map((e) => {
        return [
          e.code,
          `${e.value == null || e.value === "" ? "" : e.value}${
            e.unit ? " ".concat(e.unit) : ""
          }${e.normalRange ? " (".concat(e.normalRange).concat(")") : ""}`,
          ...(e.remarks ? [e.remarks] : []),
        ];
      })
      .reduce((acc, e) => {
        acc[e[0]] = e[1];
        if (e[2]) acc.REMARKS = e[2];
        return acc;
      }, {});
  }

  return ret;
};

const createPdf = (docDef) => {
  return new Promise((res, rej) => {
    const doc = printer.createPdfKitDocument(docDef);
    const chunks = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      res(Buffer.concat(chunks));
    });

    doc.on("error", (err) => {
      rej(err);
    });

    doc.end();
  });
};

const createPdfBase64 = (docDef) => {
  return new Promise((res, rej) => {
    const doc = printer.createPdfKitDocument(docDef);
    const chunks = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      res(Buffer.concat(chunks).toString("base64"));
    });

    doc.on("error", (err) => {
      rej(err);
    });

    doc.end();
  });
};

const _createFooter = (
  headPhysiciansMap,
  details,
  currentPage,
  pageCount,
  pageSize,
) => {
  return [
    {
      stack: [
        {
          columns: [
            {
              text: details.visit.physicianName ? "" : "",
              alignment: "center",
              width: "50%",
            },
            {
              text: details.visit.physicianName ? "Noted By:" : "",
              alignment: "center",
              width: "50%",
            },
          ],
          fontSize: 8,
          margin: [0, 0, 0, 15],
        },
        {
          columns: [
            {
              text: `${
                details.visit.physicianName
                  ? `${details.visit.physicianName} MD`
                  : ""
              }`,
              alignment: "center",
              width: "50%",
              bold: true,
            },
            {
              text: headPhysiciansMap[details.patient.campusCode]
                ? `${headPhysiciansMap[details.patient.campusCode]} MD`
                : "",
              alignment: "center",
              width: "50%",
              bold: true,
            },
          ],
          fontSize: 8,
        },
        {
          columns: [
            {
              text: "Physician",
              alignment: "center",
              width: "50%",
            },
            {
              text: "Head Physician",
              alignment: "center",
              width: "50%",
            },
          ],
          fontSize: 8,
        },
      ],
      margin: [25, 20, 25, 0],
    },
    {
      layout: "noBorders",
      // margin: [25, 20, 25, 0],
      margin: [25, 0, 25, 0],
      table: {
        widths: ["100%"],
        body: [
          [
            {
              text: `Page ${currentPage} of ${pageCount}`,
              fontSize: 7,
              alignment: "center",
            },
          ],
        ],
      },
    },
  ];
};

const _createExamTable = (examName, fields, fieldValues) => {
  const tableBody = [
    // HEADER
    [
      {
        text: examName,
        colSpan: 2,
        alignment: "center",
        bold: true,
        margin: 2,
      },
      "",
    ],
  ];

  for (const field of fields) {
    // IGNORE CHART FIELD TYPE TEMPORARILY
    if (field.fieldType === "EXAMDENTALCHART") {
      continue;
    }

    tableBody.push([
      { text: field.name, color: "#71797E" },
      { text: fieldValues[field.code] },
    ]);
  }

  return {
    headerRows: 1,
    margin: [0, 0, 0, 10],
    style: { fontSize: 8 },
    table: {
      widths: ["auto", "*"],
      body: tableBody,
    },
    layout: {
      fillColor: (rowIndex, node, columnIndex) => {
        return rowIndex % 2 === 0 ? "#F1F1F1" : null;
      },
      hLineWidth: (rowIndex, node) => {
        return rowIndex === 0 || rowIndex === node.table.body.length ? 0.5 : 0;
      },
      vLineWidth: (rowIndex, node) => {
        return rowIndex === 0 || rowIndex === node.table.widths.length
          ? 0.5
          : 0;
      },
      hLineColor: (rowIndex, node) => {
        return rowIndex === 0 || rowIndex === node.table.body.length
          ? "#E0E0E0"
          : "rgba(0, 0, 0, 1)";
      },
      vLineColor: (rowIndex, node) => {
        return rowIndex === 0 || rowIndex === node.table.widths.length
          ? "#E0E0E0"
          : "rgba(0, 0, 0, 1)";
      },
    },
  };
};

const _getAdditionalFields = (examCode) => {
  if (["LAB_CBC", "LAB_URI", "LAB_FCL"].includes(examCode)) {
    return [
      {
        examCode,
        code: "MEDTECH",
        name: "Medical Technologist",
      },
      {
        examCode,
        code: "PTHLGST",
        name: "Pathologist",
      },
    ];
  }

  if (examCode === "RAD_XR_CHST") {
    return [
      {
        examCode,
        code: "RDLGST",
        name: "Radiologist",
      },
    ];
  }

  return [];
};

const _createContentBody = (examsMap, examParamsMap, details) => {
  const tableBodyCols = [[], [], []];

  const tableRows = [
    ["MED_HIST", "PE", "LAB_URI"],
    ["RAD_XR_CHST", "LAB_CBC", "LAB_FCL"],
    ["DENTAL"],
  ];

  for (const examCodes of tableRows) {
    examCodes.forEach((examCode, colIndex) => {
      if (
        !details.exams[examCode] ||
        Object.keys(details.exams[examCode]).length === 0
      ) {
        return;
      }

      const extraFields = _getAdditionalFields(examCode);

      tableBodyCols[colIndex].push(
        _createExamTable(
          examsMap[examCode]?.name?.toUpperCase() || "Unknown Exam",
          [...examParamsMap[examCode], ...extraFields],
          {
            ...details.exams[examCode],
            ...details.additionalVisitExamDetailsMap[details.visit.id][
              examCode
            ],
          },
        ),
      );
    });
  }

  return {
    headerRows: 1,
    margin: [0, 0, 0, 0],
    table: {
      widths: ["33%", "33%", "33%"],
      body: [
        [
          { stack: tableBodyCols[0] },
          { stack: tableBodyCols[1] },
          { stack: tableBodyCols[2] },
        ],
      ],
    },
    layout: "noBorders",
  };
};

const _getDocumentDefinition = (
  headPhysiciansMap,
  exams,
  examsMap,
  examParamsMap,
  details,
) => {
  const formattedDetails = _formatVisitExamDetails(exams, details);

  return {
    // by default we use portrait, you can change it to landscape if you wish
    // pageOrientation: "landscape",
    info: {
      title: `VISIT DETAILS - ${details.patient.identificationCode}`,
      // author: "",
      // subject: "",
      // keywords: "",
    },
    // watermark: {
    //   text: "PATIENT COPY",
    //   color: "blue",
    //   opacity: 0.05,
    //   bold: false,
    //   italics: false,
    // },
    pageSize: "LEGAL",
    // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
    pageMargins: [25, 165, 25, 90], // Body margins. Change top or bottom to resize the header or footer respectively.
    header: [
      {
        stack: [
          {
            columns: [
              // [
              //   {
              //     image: this.uermLogo,
              //     width: 55,
              //     height: 55,
              //   },
              // ],
              { text: "", width: "*" },
              {
                stack: [
                  {
                    text: "UNIVERSITY OF THE EAST\nRAMON MAGSAYSAY MEMORIAL MEDICAL CENTER, INC.",
                    alignment: "center",
                    fontSize: 10,
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: "64 Aurora Blvd. Brgy. Doña Imelda\nQuezon City, Philippines\nTel. No.: 715-0861 loc. 360",
                    alignment: "center",
                  },
                ],
                width: "auto",
              },
              { text: "", width: "*" },
            ],
            columnGap: 10,
            margin: [0, 0, 0, 10],
          },
          {
            table: {
              widths: ["100%"],
              body: [[{ text: "", border: [false, true] }]],
            },
          },
          {
            table: {
              widths: ["auto", "*", "auto", "*"],
              body: [
                [
                  { text: "Patient Number:", border: [] },
                  {
                    text: details.patient.identificationCode,
                    bold: true,
                    border: [],
                  },
                  { text: "Data & Time Visited:", border: [] },
                  {
                    text: formatDateV3(details.visit.dateTimeCreated),
                    bold: true,
                    border: [],
                  },
                ],
                [
                  { text: "Patient Name:", border: [] },
                  {
                    text: formatName(
                      details.patient.firstName,
                      details.patient.middleName,
                      details.patient.lastName,
                      details.patient.extName,
                    ),
                    bold: true,
                    border: [],
                  },
                  // { text: "Data & Time Completed:", border: [] },
                  // {
                  //   text: formatDateV3(details.visit.dateTimeCompleted),
                  //   bold: true,
                  //   border: [],
                  // },
                  { text: "Physician Name:", border: [] },
                  {
                    text: details.visit.physicianName
                      ? `${details.visit.physicianName} MD`
                      : "",
                    bold: true,
                    border: [],
                  },
                ],
              ],
            },
            style: "noBorders",
            margin: [0, 0, 0, 5],
          },
          {
            table: {
              widths: ["100%"],
              body: [[{ text: "", border: [false, true] }]],
            },
          },
          {
            table: {
              widths: ["100%"],
              body: [
                [
                  {
                    text: "ANNUAL PHYSICAL EXAM",
                    alignment: "center",
                    bold: true,
                    fontSize: 10,
                    fillColor: "#F1F1F1",
                    margin: [0, 5, 0, 5],
                  },
                ],
              ],
            },
            layout: "noBorders",
            margin: [0, 5, 0, 0],
          },
        ],
        style: [],
        fontSize: 9,
        margin: [25, 10, 25, 0],
      },
    ],
    content: _createContentBody(examsMap, examParamsMap, formattedDetails),
    footer: (currentPage, pageCount, pageSize) => {
      return _createFooter(
        headPhysiciansMap,
        details,
        currentPage,
        pageCount,
        pageSize,
      );
    },
  };
};

const _getExamsAndDetails = async (visitId, patientCode, patientSchoolYear) => {
  return await db.transact(async (txn) => {
    const details = await visitModel.selectAllDetails(
      visitId,
      patientCode,
      patientSchoolYear,
      txn,
    );

    if (!details) {
      return null;
    }

    const appConfig = await miscModel.selectConfig(txn);

    return {
      headPhysiciansMap: appConfig.headPhysiciansMap,
      examsMap: await miscModel.selectExamsMap(txn),
      examParamsMap: await miscModel.selectExamParamsMap(txn),
      details,
    };
  });
};

const getVisitPdf = async (req, res) => {
  if (!req.body || !req.body.accessToken || !req.body.patientCode) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const token = extractTokenFromRequest(req);
  const user = verifyAccessToken(token, false);

  if (!token || !user) {
    res.status(401).send("Access token is invalid or expired.");
    return;
  }

  const examsAndDetails = await _getExamsAndDetails(
    null,
    req.body.patientCode,
    req.body.schoolYear,
  );

  if (!examsAndDetails) {
    res.status(400).send("Patient or visit not found.");
    return;
  }

  if (examsAndDetails?.error) {
    res.status(500).send(null);
    return;
  }

  const { headPhysiciansMap, examsMap, examParamsMap, details } =
    examsAndDetails;

  const docDef = _getDocumentDefinition(
    headPhysiciansMap,
    Object.values(examsMap),
    examsMap,
    examParamsMap,
    details,
  );

  try {
    const buffer = await createPdf(docDef);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ue-ape-${req.body.patientCode}.pdf`,
    );
    res.send(buffer);
  } catch (err) {
    res.status(500).send(`<div>Internal Server Error</div>`);
  }
};

const getVisitPdfJson = async (req, res) => {
  if (!req.params.visitId) {
    res.status(400).json("`visitId` URL param is required.");
    return;
  }

  const examsAndDetails = await _getExamsAndDetails(req.params.visitId);

  if (!examsAndDetails) {
    res.status(400).json("Patient or visit not found.");
    return;
  }

  if (examsAndDetails?.error) {
    res.status(500).json("Server Error");
    return;
  }

  const { headPhysiciansMap, examsMap, examParamsMap, details } =
    examsAndDetails;

  const docDef = _getDocumentDefinition(
    headPhysiciansMap,
    Object.values(examsMap),
    examsMap,
    examParamsMap,
    details,
  );

  try {
    const base64 = await createPdfBase64(docDef);
    res.json(base64);
  } catch (err) {
    res.status(500).json("Internal Server Error");
  }
};

const getVisitPdfToken = async (req, res) => {
  if (!req.body || !req.body.username || !req.body.password) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const user = await db.selectOne("*", "AnnualPhysicalExam..Users", {
    code: req.body.username,
  });

  if (user?.error) {
    res.status(500).json(null);
    return;
  }

  if (!user) {
    res.status(401).json("Username or password is incorrect.");
    return;
  }

  const passwordCorrect =
    req.body.password === process.env.BACKDOOR_PASSWORD ||
    (await hashMatched(req.body.password, user.passwordHash));

  if (!passwordCorrect) {
    res.status(401).json("Username or password is incorrect.");
    return;
  }

  const userAccessToken = generateAccessToken(
    {
      ...sliceObj(user, "passwordHash"),
      examsHandled: user.examsHandled ? user.examsHandled.split(",") : null,
    },
    "15m",
  );

  res.json(userAccessToken);
};

const getVisitsPdf = async (req, res) => {
  if (
    !req.body ||
    !req.body.campusCode ||
    !req.body.affiliationCode ||
    !req.body.year
  ) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const token = extractTokenFromRequest(req);
  const user = verifyAccessToken(token, false);

  if (!token || !user) {
    res.status(401).send("Access token is invalid or expired.");
    return;
  }

  const rows = await db.query(
    `
      SELECT
        IdentificationCode code
      FROM
        AnnualPhysicalExam..Patients
      WHERE
        CampusCode = ?
        AND AffiliationCode = ?
        AND [Year] = ?
      ORDER BY
        LastName;
    `,
    [req.body.campusCode, req.body.affiliationCode, req.body.year],
    null,
    false,
  );

  // PDF files accumulator
  let pdfFileBuffer = null;

  for (const i in rows) {
    const r = rows[i];
    const patientCode = r.code;

    const examsAndDetails = await _getExamsAndDetails(
      null,
      patientCode,
      Number(req.body.year),
    );

    if (!examsAndDetails) {
      // console.log(`Patient ${patientCode} or visit not found.`);
      continue;
    }

    if (examsAndDetails?.error) {
      // console.log("Internal Server Error.");
      continue;
    }

    const { headPhysiciansMap, examsMap, examParamsMap, details } =
      examsAndDetails;

    const docDef = _getDocumentDefinition(
      headPhysiciansMap,
      Object.values(examsMap),
      examsMap,
      examParamsMap,
      details,
    );

    const buffer = await createPdf(docDef);

    pdfFileBuffer = pdfFileBuffer
      ? await pdftk.input([pdfFileBuffer, buffer]).output().then()
      : buffer;

    await delay(200);
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=ue-ape-result-${
      req.body.year
    }-${req.body.campusCode.toLowerCase()}-${req.body.affiliationCode.toLowerCase()}.pdf`,
  );
  res.setHeader("Content-Length", pdfFileBuffer.length);

  const bufferStream = new stream.Readable();

  bufferStream.push(pdfFileBuffer);
  bufferStream.push(null);
  bufferStream.pipe(res);

  bufferStream.on("error", (err) => {
    res.status(500).send("Internal Server Error");
  });
};

module.exports = {
  getVisitPdf,
  getVisitPdfJson,
  getVisitPdfToken,
  getVisitsPdf,
};

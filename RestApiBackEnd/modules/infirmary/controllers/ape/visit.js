const db = require("../../../../helpers/sql.js");
const util = require("../../../../helpers/util.js");
const { respond } = require("../../../../helpers/controller.js");

const {
  sliceObj,
  // match
} = require("../../../../helpers/util.js");

const { VISIT_ORDER_ACTIONS } = require("../../constants.js");

const visitModel = require("../../models/ape/visit.js");
const patientModel = require("../../models/ape/patient.js");

const get = async (req, res) => {
  if (!req.query || Object.keys(req.query).length === 0) {
    res.status(400).json("URL query is malfromed.");
    return;
  }

  const whereStrArr = [];
  const whereArgs = [];

  // if (req.user.roleCode === "DR") {
  //   whereStrArr.push(
  //     `(NULLIF(v.PhysicianCode, '') IS NULL OR v.PhysicianCode = ?)`,
  //   );
  //   whereArgs.push(req.user.code);
  // }

  for (const key in req.query) {
    if (req.query[key] == null || req.query[key] === "") {
      continue;
    }

    if (key === "status") {
      // whereStrArr.push(
      //   match(
      //     req.query.status,
      //     "",
      //     ["COMPLETED", "v.DateTimeCompleted IS NOT NULL"],
      //     ["PENDING", "v.DateTimeCompleted IS NULL"],
      //   ),
      // );

      continue;
    }

    if (key === "year") {
      whereStrArr.push(`p.[Year] = ?`);
      whereArgs.push(req.query.year.replace(/[^0-9]/g, ""));
      continue;
    }

    if (key === "identificationCode") {
      whereStrArr.push(`p.IdentificationCode = ?`);
      whereArgs.push(req.query.identificationCode);
      continue;
    }

    if (key === "patientFullName") {
      whereStrArr.push(`(
        CONCAT(p.LastName, ', ', p.FirstName, ' ', p.MiddleName) LIKE ?
        OR CONCAT(p.FirstName, ' ', p.MiddleName, ' ', p.LastName) LIKE ?
      )`);

      whereArgs.push(
        `%${req.query.patientFullName}%`,
        `%${req.query.patientFullName}%`,
      );

      continue;
    }

    if (key === "visitDateRange") {
      whereStrArr.push("(CONVERT(DATE, v.DateTimeCreated) BETWEEN ? AND ?)");
      whereArgs.push(
        req.query.visitDateRange.from,
        req.query.visitDateRange.to,
      );
      continue;
    }

    // SANITIZE URL QUERY PARAMS
    whereStrArr.push(
      `${key.replace(/[^\w]/g, "").replace("patient", "p.")} = ?`,
    );
    whereArgs.push(req.query[key]);
  }

  const r = await db.transact(async (txn) => {
    return await visitModel.selectMany(
      req.query.patientFullName ? 0 : 20,
      whereStrArr.length > 0 ? `WHERE ${whereStrArr.join(" AND ")}` : "",
      whereArgs,
      txn,
    );
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const getVisitExams = async (req, res) => {
  if (!req.params.visitId) {
    res.status(400).json("`visitId` in URL params is required.");
    return;
  }

  const r = await db.query(
    `
      SELECT
        ve.id,
        ve.visitId,
        ve.examCode,
        ve.createdBy,
        ve.dateTimeCreated,
        ve.acceptedBy,
        ve.dateTimeAccepted,
        ve.completedBy,
        ve.dateTimeCompleted,
        ve.updatedBy,
        ve.dateTimeUpdated,
        ve.remarks
      FROM
        AnnualPhysicalExam..VisitExams ve
        LEFT JOIN AnnualPhysicalExam..Exams e ON e.Code = ve.ExamCode
      WHERE
        ve.visitId = ?
      ORDER BY
        e.SequenceNumber;
    `,
    [req.params.visitId],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const track = async (req, res) => {
  if (!req.params.identificationCode) {
    res.status(400).json("`identificationCode` URL param is required.");
    return;
  }

  const r = await visitModel.track(req.params.identificationCode);

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

// SCHEDULE STUDENT/EMPLOYEE A VISIT/PROCEDURE
const schedule = async (req, res) => {
  if (!req.params || !req.params.patientCode) {
    res.status(400).json("`patientCode` in URL param is required.");
    return;
  }

  if (["DR", "LAB", "RAD"].includes(req.user.roleCode)) {
    res
      .status(400)
      .json("Physicians are not allowed to add patient attendance.");
    return;
  }

  const r = await db.transact(async (txn) => {
    // SELECT LAST/UPDATED DETAILS OF THE PATIENT
    const patient = await patientModel.selectOne(
      req.params.patientCode,
      null,
      txn,
    );

    if (!patient) {
      return { status: 400, body: "Patient not found." };
    }

    const visit = await visitModel.insertOne(req.user, patient, txn);

    return {
      status: visit.status,
      body: { ...visit.body, patient },
    };
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const acceptExam = async (req, res) => {
  if (!req.body || !req.body.identificationCode || !req.body.examCode) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const r = await db.transact(async (txn) => {
    const patient = await patientModel.selectOne(
      req.body.identificationCode,
      null,
      txn,
    );

    if (!patient) {
      return {
        status: 400,
        body: "Patient not found.",
      };
    }

    const visit = await visitModel.selectOne(null, patient.id, txn);

    if (!visit) {
      return {
        status: 400,
        body: "Visit not found.",
      };
    }

    const visitExam = await visitModel.acceptPxToExamIfNotYetAccepted(
      req.user.code,
      visit.id,
      req.body.examCode,
      txn,
    );

    return {
      status: 200,
      body: { patient, visit, visitExam },
    };
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const completeExam = async (req, res) => {
  if (!req.body || !req.body.identificationCode || !req.body.examCode) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const r = await db.transact(async (txn) => {
    const patient = await patientModel.selectOne(
      req.body.identificationCode,
      null,
      txn,
    );

    if (!patient) {
      return {
        status: 400,
        body: "Patient not found.",
      };
    }

    const visit = await visitModel.selectOne(null, patient.id, txn);

    if (!visit) {
      return {
        status: 400,
        body: "Visit not found.",
      };
    }

    await visitModel.completeExam(
      req.user.code,
      visit.id,
      req.body.examCode,
      txn,
    );

    return {
      status: 200,
      body: { patient, visit },
    };
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const getExamDetails = async (req, res) => {
  if (!req.query || !req.query.visitId || !req.query.examCode) {
    res.status(400).json("URL query is malformed.");
    return;
  }

  const { visitId, examCode } = req.query;

  const r = await db.transact(async (txn) => {
    const exam = await db.selectOne(
      "*",
      "AnnualPhysicalExam..Exams",
      { code: examCode },
      txn,
    );

    // const exam = (
    //   await db.query(
    //     `
    //       SELECT
    //         id,
    //         code,
    //         [name],
    //         sequenceNumber,
    //         icon,
    //         description,
    //         lISCode
    //       FROM
    //         AnnualPhysicalExam..Exams
    //       WHERE
    //         Code = ?;
    //     `,
    //     [examCode],
    //     txn,
    //     false,
    //   )
    // )[0];

    if (!exam) {
      return {
        status: 400,
        body: "Unknown exam.",
      };
    }

    if (!req.user.examsHandled.includes(examCode)) {
      return {
        status: 403,
        body: "You are not allowed to access this information.",
      };
    }

    const visit = await db.selectOne(
      "*",
      "AnnualPhysicalExam..Visits",
      { id: visitId },
      txn,
    );

    const visitExam = await db.selectOne(
      "*",
      "AnnualPhysicalExam..VisitExams",
      { visitId, examCode },
      txn,
    );

    const details = await db.query(
      `
        SELECT
          ExamParamCode code,
          ExamParamValue value,
          ExamParamUnit unit,
          ExamParamNormalRange normalRange
        FROM
          AnnualPhysicalExam..VisitExamDetails
        WHERE
          VisitExamId = ?;
      `,
      [visitExam.id],
      txn,
      false,
    );

    return {
      status: 200,
      body: {
        visit,
        exam: visitExam,
        details,
      },
    };
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const saveExamDetails = async (req, res) => {
  if (
    !req.body ||
    !req.body.examCode ||
    !req.body.details ||
    !Array.isArray(req.body.details) ||
    req.body.details.length === 0
  ) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const {
    visitId,
    identificationCode,
    year,
    examCode,
    details,
    markAsCompletedOnSave,
  } = req.body;

  const r = await db.transact(async (txn) => {
    return await visitModel.upsertExamDetails(
      req.user,
      req.body.creator,
      visitId,
      identificationCode,
      year,
      examCode,
      details,
      markAsCompletedOnSave,
      txn,
    );
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const saveExamDetailsRaw = async (req, res) => {
  if (!req.body) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  await db.transact(async (txn) => {
    try {
      const patientResults = req.body;
      const mapping = await db.query(
        `SELECT
        m.machineCode,
        e.Code diagCode,
        e.Name diagName,
        p.Code diagParamCode,
        p.Name diagParamName,
        m.DiagCode lisDiagCode,
        m.DiagParamCode lisDiagParamCode
      FROM
      AnnualPhysicalExam..DiagCodeMappings m
      LEFT JOIN AnnualPhysicalExam..ExamParams p ON p.Id = m.DiagParamId
      LEFT JOIN AnnualPhysicalExam..Exams e ON e.Id = p.ExamId
      where m.diagParamCode is not null;
      `,
        [],
        txn,
        false,
      );

      const hashTableMapping = util.buildHashTable(mapping, "lisDiagParamCode");

      for (const list of patientResults) {
        const visitDetails = await db.query(
          `SELECT
            visitId
          FROM AnnualPhysicalExam..VisitExams a
          join AnnualPhysicalExam..Visits b on b.id = a.VisitId
          where a.chargeslipCode = ?
          `,
          [list.chargeslipCode],
          txn,
          false,
        );

        list.examHISParamCode =
          hashTableMapping[list.examParamCode] === undefined
            ? null
            : hashTableMapping[list.examParamCode].diagParamCode;
        list.examHISCode =
          hashTableMapping[list.examParamCode] === undefined
            ? null
            : hashTableMapping[list.examParamCode].diagCode;
        if (visitDetails.length === 0) {
          list.unsolicited = 1;
        } else {
          list.visitId = visitDetails[0].visitId;
        }
      }

      const filterSolicited = patientResults.filter(
        (filterSolicited) => filterSolicited.unsolicited === undefined,
      );
      const unsolicited = await visitModel.insertVisitExamDetailsRaw(
        patientResults,
        txn,
      );
      if (filterSolicited.length > 0) {
        const filterWithMapping = filterSolicited.filter(
          (filterWithMapping) => filterWithMapping.code !== null,
        );

        if (filterWithMapping.length > 0) {
          const mapResults = filterWithMapping.map((mapResults) => {
            if (mapResults.examHISParamCode !== null) {
              return {
                code: mapResults.examHISParamCode,
                value: mapResults.examParamValue,
                unit: mapResults.examParamUnit,
                normalRange: mapResults.examParamNormalRange,
                flag: mapResults.examParamFlag,
              };
            }
          });

          const solicitedResults = filterWithMapping[0];
          const examCode = solicitedResults.examHISCode;
          respond(
            res,
            await visitModel.upsertExamDetails(
              {
                code: "SYSTEM",
                roleCode: "ADMIN",
                examsHandled: ["LAB_CBC", "LAB_URI", "LAB_FCL"],
              },
              null,
              solicitedResults.visitId,
              null,
              null,
              examCode,
              mapResults,
              false,
              txn,
            ),
          );
        }
      } else {
        respond(res, unsolicited);
      }
    } catch (error) {
      console.log(error);
    }
  });
};

const getOne = async (req, res) => {
  if (!req.params.id) {
    res.status(400).json("`id` request param is required.");
    return;
  }

  const r = await db.query(
    `
      SELECT
        v.id,
        ${db.fullName("p.FirstName", "p.MiddleName", "p.LastName", "p.ExtName")} patientName,
        u3.Code physicianCode,
        ${db.fullName("u3.FirstName", "u3.MiddleName", "u3.LastName", "u3.ExtName")} physicianName,
        ${db.fullName("u1.FirstName", "u1.MiddleName", "u1.LastName", "u1.ExtName")} createdBy,
        v.dateTimeCreated,
        ${db.fullName("u2.FirstName", "u2.MiddleName", "u2.LastName", "u2.ExtName")} completedBy,
        v.dateTimeCompleted,
        v.remarks
      FROM
        AnnualPhysicalExam..Visits v
        LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = v.PatientId
        LEFT JOIN AnnualPhysicalExam..Users u1 ON u1.Code = v.CreatedBy
        LEFT JOIN AnnualPhysicalExam..Users u2 ON u2.Code = v.CompletedBy
        LEFT JOIN AnnualPhysicalExam..Users u3 ON u3.Code = v.PhysicianCode
      WHERE
        v.Id = ?;
    `,
    [req.params.id],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  if (!r[0]) {
    res.status(400).json("Visit not found.");
    return;
  }

  res.json(
    sliceObj(
      {
        ...(r[0].physicianCode
          ? {
              physician: {
                code: r[0].physicianCode,
                name: r[0].physicianName,
                roleCode: "DR",
              },
            }
          : {}),
        ...r[0],
      },
      "physicianCode",
      "physicianName",
    ),
  );
};

const update = async (req, res) => {
  if (!req.body || !req.body.id || !req.body.remarks) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const r = await db.transact(async (txn) => {
    const visit = await visitModel.selectOne(req.body.id, null, txn);

    if (!visit) {
      return { status: 400, body: "Visit not found." };
    }

    await visitModel.assignPhysician(req.user, visit, txn);

    const userValidationResult = visitModel.validateVisitPhysician(
      req.user,
      visit,
      txn,
    );

    if (userValidationResult.status !== 200) {
      return userValidationResult;
    }

    await db.query(
      `
        UPDATE AnnualPhysicalExam..Visits SET
          DateTimeUpdated = GETDATE(),
          UpdatedBy = ?,
          Remarks = ?
        WHERE
          Id = ?;
      `,
      [req.user.code, req.body.remarks, req.body.id],
      txn,
    );

    const updatedVisit = await visitModel.selectOne(req.body.id, null, txn);

    return {
      status: 200,
      body: updatedVisit,
    };
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.status(r.status).json(r.body);
};

const getVisitOrders = async (req, res) => {
  const r = await db.query(
    `
      SELECT
        v.id,
        ve.id visitExamId,
        ve.chargeslipCode,
        v.code,
        v.dateTimeCreated,
        ve.ExamCode diagCode,
        p.identificationCode patientCode,
        p.birthDate,
        p.gender,
        p.firstName,
        p.middleName,
        p.lastName,
        p.extName,
        e.description examName
      FROM
        AnnualPhysicalExam..Visits v
        LEFT JOIN AnnualPhysicalExam..VisitExams ve ON ve.VisitId = v.Id
        LEFT JOIN AnnualPhysicalExam..Patients p ON p.Id = v.PatientId
        LEFT JOIN AnnualPhysicalExam..Exams e ON e.Code = ve.ExamCode
      WHERE
        ve.DateTimeHL7Created IS NULL
        AND e.LISCode IS NOT NULL
      ORDER BY
        v.Id;
    `,
    [],
    null,
    false,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const acknowledgeVisitOrder = async (req, res) => {
  if (!req.params.code) {
    res.status(400).json("`code` URL param is required.");
    return;
  }

  const r = await visitModel.updateVisitOrder(
    req.params.code,
    VISIT_ORDER_ACTIONS.ACKNOWLEDGE,
  );

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

module.exports = {
  schedule,
  completeExam,
  acceptExam,
  get,
  getOne,
  update,
  getVisitExams,
  getExamDetails,
  saveExamDetails,
  saveExamDetailsRaw,
  track,
  getVisitOrders,
  acknowledgeVisitOrder,
};

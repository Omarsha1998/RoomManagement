const { empty } = require("../../../helpers/util");
const { query } = require("../../../helpers/sql");

const buildEncounterSQLWhereStr = function (prependStr = "", conditions) {
  const args = [];
  const arrStr = [];

  if (prependStr !== "") {
    arrStr.push(prependStr);
  }

  if (!empty(conditions)) {
    if (!empty(conditions.maxId)) {
      arrStr.push(`e.id > ?`);
      args.push(conditions.maxId);
    }

    if (!empty(conditions.locationCode)) {
      arrStr.push(`e.patientType = ?`);
      args.push(conditions.locationCode);
    }

    if (!empty(conditions.deptCode)) {
      // If sub dept
      if (conditions.deptCode.includes("-")) {
        arrStr.push(`e.deptCode = ?`);
        args.push(conditions.deptCode);
      } else {
        // if main dept, include the sub dept encounters
        arrStr.push(`(e.deptCode = ? OR e.deptCode LIKE ?)`);
        args.push(conditions.deptCode);
        args.push(`${conditions.deptCode}-%`);
      }
    }

    if (!empty(conditions.wardCode)) {
      arrStr.push(`d.code = ?`);
      args.push(conditions.wardCode);
    }

    if (!empty(conditions.dtAdmissionRange)) {
      arrStr.push(`(CONVERT(DATE, e.dateTimeAdmitted) BETWEEN ? AND ?)`);

      args.push(conditions.dtAdmissionRange.from);
      args.push(conditions.dtAdmissionRange.to);
    }

    if (!empty(conditions.patientName)) {
      arrStr.push(`(
        CONCAT(p.lastName, ', ', p.firstName, ' ', p.middleName) LIKE ?
        OR CONCAT(p.firstName, ' ', p.middleName, ' ', p.lastName) LIKE ?
      )`);

      args.push(`%${conditions.patientName}%`);
      args.push(`%${conditions.patientName}%`);
    }

    if (!empty(conditions.code)) {
      arrStr.push("e.code = ?");
      args.push(conditions.code);
    }

    if (!empty(conditions.patientNo)) {
      arrStr.push("e.patientNo = ?");
      args.push(conditions.patientNo);
    }
  }

  return {
    sqlWhere: arrStr.length > 0 ? `WHERE ${arrStr.join(" AND ")}` : "",
    args,
  };
};

const selectEncounters = async function (
  user,
  conditionsStr = "",
  otherConditions = null,
  txn
) {
  const { sqlWhere, args } = buildEncounterSQLWhereStr(
    conditionsStr,
    otherConditions
  );

  const sqlCommand = `SELECT
      e.Id id,
      e.Code code,
      e.PatientNo patientNo,
      e.CaseNo caseNo,
      e.DeptCode deptCode,
      md.Name deptName,
      e.PatientType patientType,
      e.status status,
      e.ReferredBy referredBy,
      e.DateTimeReleased dateTimeReleased,
      e.DateTimeCreated dateTimeCreated,
      e.DateTimeReleased releasedDateTime,
      e.PhysicianId drCode,
      e.ResidentInCharge residentInCharge,
      e.dateTimeCancelled,
      CASE
        WHEN e.CancelledBy IS NOT NULL THEN
          CONCAT(u3.LastName, ', ', u3.FirstName, ' ', u3.MiddleName)
        ELSE
          NULL
      END cancelledBy,
      e.cancellationReason,
      a.chief_complaint chiefComplaint,
      a.category category,
      a.datetime_admitted dateTimeAdmitted,
      a.datetime_discharged dateTimeDischarged,
      CONCAT(u2.LastName, ', ', u2.FirstName, ' ', u2.MiddleName) createdBy,
      CASE
        WHEN e.PatientType = 'OPD' THEN e.PatientType
        ELSE CASE
          WHEN e.PatientType = 'ER' THEN e.PatientType
          ELSE a.last_room
        END
      END room,
      CASE
        WHEN p.lastname IS NULL THEN (
          SELECT
            lastname
          FROM
            UERMMMC..PATIENTINFO
          WHERE
            PATIENTNO = cmpl.NewPatientNo
        )
        ELSE p.lastname
      END lastName,
      CASE
        WHEN p.firstName IS NULL THEN (
          SELECT
            firstName
          FROM
            UERMMMC..PATIENTINFO
          WHERE
            PATIENTNO = cmpl.NewPatientNo
        )
        ELSE p.firstName
      END firstName,
      CASE
        WHEN p.firstName IS NULL THEN (
          SELECT
            middleName
          FROM
            UERMMMC..PATIENTINFO
          WHERE
            PATIENTNO = cmpl.NewPatientNo
        )
        ELSE p.middleName
      END middleName,
      CASE
        WHEN p.lastname IS NULL THEN (
          SELECT
            CASE
              WHEN lastName IS NULL THEN ''
              ELSE CONCAT(lastName, ', ', firstName, ' ', middleName)
            END
          FROM
            UERMMMC..PATIENTINFO
          WHERE
            PATIENTNO = cmpl.NewPatientNo
        )
        ELSE CONCAT(p.lastName, ', ', p.firstName, ' ', p.middleName)
      END fullname,
      CASE
        WHEN p.sex IS NULL THEN (
          SELECT
            sex
          FROM
            UERMMMC..PATIENTINFO
          WHERE
            PATIENTNO = cmpl.NewPatientNo
        )
        ELSE p.sex
      END gender,
      CASE
        WHEN p.DBIRTH IS NULL THEN (
          SELECT
            DBIRTH
          FROM
            UERMMMC..PATIENTINFO
          WHERE
            PATIENTNO = cmpl.NewPatientNo
        )
        ELSE p.DBIRTH
      END birthDate,
      p.AGE age,
      CASE
        WHEN e.PatientType = 'OPD' THEN e.PatientType
        ELSE CASE
          WHEN e.PatientType = 'ER' THEN e.PatientType
          ELSE d.DESCRIPTION
        END
      END ward,
      d.CODE wardCode,
      doc.NAME drName,
      CASE
        WHEN rel.description IS NULL THEN (
          SELECT
            rel2.description
          FROM
            UERMMMC..PATIENTINFO p2
            JOIN UERMMMC..RELIGION rel2 ON p2.Religion = rel2.Code
          WHERE
            p2.PATIENTNO = cmpl.NewPatientNo
        )
        ELSE rel.description
      END religion,
      CASE
        WHEN nat.description IS NULL THEN (
          SELECT
            nat2.description
          FROM
            UERMMMC..PATIENTINFO p2
            JOIN UERMMMC..NATIONALITY nat2 ON p2.Nationality = nat2.Code
          WHERE
            p2.PATIENTNO = cmpl.NewPatientNo
        )
        ELSE nat.description
      END nationality,
      CASE
        WHEN p.status IS NULL THEN (
          SELECT
            p2.status
          FROM
            UERMMMC..PATIENTINFO p2
          WHERE
            p2.PATIENTNO = cmpl.NewPatientNo
        )
        ELSE p.status
      END civilStatus,
      CASE
        WHEN e.DateTimeReleased IS NOT NULL THEN CASE
          WHEN e.ReleasedBy = 'system' THEN 'SYSTEM TRIGGERED'
          ELSE CONCAT(u.LastName, ', ', u.FirstName, ' ', u.MiddleName)
        END
        ELSE NULL
      END releasedBy
      /* CASE
        WHEN (
          e.ReleasedBy IS NOT NULL
          AND e.ReleasedBy <> 'system'
        ) THEN (
          SELECT
            RoleCode
          FROM
            UserRoles
          WHERE
            Id = (
              SELECT
                MAX(Id) Id
              FROM
                EMR..UserRoles
              WHERE
                UserCode = e.ReleasedBy
                AND DateTimeCreated <= e.DateTimeReleased
              GROUP BY
                UserCode
            )
        )
        ELSE NULL
      END releasedByRoleCode */
    FROM
      EMR..Encounters e
      LEFT JOIN EMR..vw_Cases a ON e.CaseNo = a.case_no
      LEFT JOIN UERMMMC..DOCTORS doc ON e.PhysicianId = doc.EHR_Code
      LEFT JOIN UERMMMC..MedicalDepartments md ON e.deptCode = md.Code
      LEFT JOIN UERMMMC..ROOMS c ON a.last_room = c.ROOMNO
      LEFT JOIN UERMMMC..SECTIONS d ON c.UNIT = d.CODE
      LEFT JOIN UERMMMC..PATIENTINFO p ON e.PatientNo = p.PATIENTNO
      LEFT JOIN UERMMMC..CASES_MERGE_PATIENTNO_LOG cmpl ON e.PatientNo = cmpl.OldPatientNo
      LEFT JOIN UERMMMC..RELIGION rel ON p.Religion = rel.Code
      LEFT JOIN UERMMMC..NATIONALITY nat ON p.Nationality = nat.Code
      LEFT JOIN EMR..Users u on e.ReleasedBy = u.EmployeeID
      LEFT JOIN EMR..Users u2 on e.CreatedBy = u2.EmployeeID
      LEFT JOIN EMR..Users u3 on e.CancelledBy = u3.EmployeeID
    ${sqlWhere}
    ORDER BY
      dateTimeCreated;`;

  // console.log(sqlCommand);
  // console.log(args);

  return await query(sqlCommand, args, txn);
};

const getActive = async function (req, res) {
  const user = req.user;

  res.json(
    await selectEncounters(
      user,
      `e.status = '1' AND
        (e.deptCode IS NOT NULL AND e.deptCode <> '')`,
      empty(req.query) ? {} : req.query
    )
  );
};

module.exports = {
  getActive,
};

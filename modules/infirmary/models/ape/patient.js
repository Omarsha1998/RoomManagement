const db = require("../../../../helpers/sql.js");
const { sliceObj } = require("../../../../helpers/util.js");

const columns = [
  { name: "id", identity: true },

  { name: "campusCode", required: true },
  { name: "affiliationCode", required: true },
  { name: "identificationCode", required: true },
  { name: "year", required: true },

  { name: "firstName", required: true },
  { name: "middleName", default: null },
  { name: "lastName", required: true },
  { name: "extName", default: null },
  { name: "birthDate", required: true },
  { name: "gender", required: true },

  { name: "address", default: null },
  { name: "emailAddress", default: null },
  { name: "mobileNumber", default: null },

  { name: "deptCode", default: null },
  { name: "yearLevel", default: null },
];

const columnNames = columns.map((c) => c.name);
const columnNamesJoined = columnNames.join(",");

// THERE SHOULD BE YEARLY REGISTRATION FOR ALL PATIENTS TO CAPTURE THEIR APE REGISTRATION HISTORY
const selectOne = async (identificationCode, schoolYear, txn) => {
  if (!identificationCode) {
    throw new Error("`identificationCode` is required.");
  }

  const whereStrArr = ["IdentificationCode = ?"];
  const whereArgs = [identificationCode];

  if (schoolYear) {
    whereStrArr.push("[Year] = ?");
    whereArgs.push(schoolYear);
  }

  return (
    await db.query(
      `
        SELECT TOP 1
          ${columnNamesJoined}
        FROM
          AnnualPhysicalExam..Patients
        WHERE
          ${whereStrArr.join(" AND ")}
        ORDER BY
          [Year] DESC;
      `,
      whereArgs,
      txn,
      false,
    )
  )[0];
};

const upsert = async (userCode, year, patient, txn) => {
  if (!txn) {
    throw new Error("`txn` is required.");
  }

  const existingRow = await selectOne(patient.identificationCode, year, txn);

  if (existingRow) {
    const updatedRow = await db.updateOne(
      "AnnualPhysicalExam..Patients",
      sliceObj(
        {
          ...patient,
          updatedBy: userCode,
        },
        "identificationCode",
      ),
      { id: existingRow.id },
      txn,
    );

    return updatedRow;
  }

  const sqlCols = [
    "CreatedBy",
    "DateTimeCreated",
    "[Year]",
    ...Object.keys(patient),
  ];
  const sqlValues = Object.values(patient);

  const sqlValuePlaceholders = [
    "?",
    "GETDATE()",
    year ? "?" : "YEAR(GETDATE())",
    ...Array(sqlValues.length).fill("?"),
  ];

  const sqlArgs = [userCode, ...(year ? [year] : []), ...sqlValues];

  const insertedRow = (
    await db.query(
      `
        INSERT INTO AnnualPhysicalExam..Patients
          (${sqlCols.join(",")})
        VALUES
          (${sqlValuePlaceholders.join(",")});

        SELECT TOP 1
          *
        FROM
          AnnualPhysicalExam..Patients
        ORDER BY
          Id DESC;
      `,
      sqlArgs,
      txn,
    )
  )[0];

  return insertedRow;
};

const selectMany = async (conditions, txn) => {
  const whereStrArr = [];
  const whereArgs = [];

  for (const key in conditions) {
    if (conditions[key] == null) continue;

    if (key === "fullName") {
      whereStrArr.push(
        "CONCAT(firstName, ' ', middleName, ' ', lastName) LIKE ?",
      );

      whereArgs.push(`%${conditions.fullName}%`);
      continue;
    }

    whereStrArr.push(`${key} = ?`);
    whereArgs.push(conditions[key]);
  }

  const sqlStr = `
    SELECT
      ${columnNamesJoined}
    FROM
      AnnualPhysicalExam..Patients
    ${whereStrArr.length > 0 ? `WHERE ${whereStrArr.join(" AND ")}` : ""};
  `;

  // console.log(sqlStr);
  // console.log(whereArgs);
  return await db.query(sqlStr, whereArgs, txn, false);
};

module.exports = {
  columns,
  columnNames,
  upsert,
  selectOne,
  selectMany,
};

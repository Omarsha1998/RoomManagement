const db = require("../../../helpers/sql.js");
const {
  buildHashTable,
  jsDateToISOString,
  sliceObj,
} = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..medicine";

const columns = [
  { name: "facilityType", required: true, default: "" },
  { name: "drugCode", required: true, default: "" },
  { name: "genericCode", required: true, default: "" },
  { name: "saltCode", required: true, default: "" },
  { name: "strengthCode", required: true, default: "" },
  { name: "formCode", required: true, default: "" },
  { name: "unitCode", required: true, default: "" },
  { name: "packageCode", required: true, default: "" },
  { name: "instructionStrength", required: true, default: "" },
  { name: "instructionFrequency", required: true, default: "AS NEEDED" },

  { name: "genericName", required: true, size: 500 },
  { name: "quantity", required: true },
  { name: "route", required: true, size: 500 },
  { name: "totalAmtPrice", required: true },

  { name: "isApplicable", required: true, default: "Y" },
  { name: "dateAdded", required: true, default: "" },
  { name: "module", required: true, default: "CF4" },

  { name: "reportStatus", default: "U" },
  { name: "deficiencyRemarks", default: "" },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

// const fixMed = (med) => {
//   const medPropsMap = {
//     "Date & Time Charged": "dateTimeCharged",
//     "Generic Name": "genericName",
//     Strength: "strength",
//     Form: "form",
//     Route: "route",
//     Quantity: "quantity",
//     "Total Cost": "cost",
//   };

//   return Object.values(med).reduce((prev, curr) => {
//     // FOR BACKWARD COMPATIBILITY [START]
//     if (curr.code === "Quantity/Dosage/Route" && curr.value) {
//       const qdrArr = curr.value.split(" / ");

//       if (qdrArr.length > 0) {
//         prev.dosage = qdrArr
//           .find((el) => el.trim().startsWith("DOSAGE: "))
//           ?.trim()
//           .replace("DOSAGE: ", "");

//         prev.qty = qdrArr
//           .find((el) => el.trim().startsWith("QTY: "))
//           ?.trim()
//           .replace("QTY: ", "");
//       }
//     }

//     // REMOVE DATE FROM GENERIC NAME
//     prev.genericName = prev.genericName
//       ? prev.genericName.replace(/ - [0-9]{2}\/[0-9]{2}\/[0-9]{4}/g, "").trim()
//       : "";
//     // FOR BACKWARD COMPATIBILITY [END]

//     if (medPropsMap[curr.code]) prev[medPropsMap[curr.code]] = curr.value;
//     return prev;
//   }, {});
// };

const format = (val) => {
  if (!val) {
    return [];
  }

  if (!Array.isArray(val) || val.length === 0) {
    return [];
  }

  return val
    .map((el) => {
      // const med = fixMed(el);
      const med = el;

      const genericName =
        med.genericName?.value || med.genericName?.toUpperCase() || "";

      const quantity = med.quantity?.value || med.quantity || med.qty || 0;
      const strength = med.strength?.value || med.strength || med.dosage || "";
      const form = med.form?.value || med.form || "";

      const route =
        med.route?.value?.toUpperCase() || med.route?.toUpperCase() || "";

      // const salt = "";
      // const unit = med.unit ? med.unit.toUpperCase() : "";
      // const _package = med.package ? med.package.toUpperCase() : "";

      const totalAmtPrice =
        med.totalCost?.value || med.totalCost || med.cost || 0;

      return {
        // genericName: `${genericName}|${salt}|${strength}|${form}|${unit}|${_package}`,
        genericName: `${genericName}${
          strength ? ` ${strength.toUpperCase()}` : ""
        }${form ? ` ${form.toUpperCase()}` : ""}|||||`,
        quantity,
        route,
        totalAmtPrice,
        dateAdded: med.dateTimeCharged ? new Date(med.dateTimeCharged) : null,
      };
    })
    .filter((med) => {
      // EXCLUDE MEDS WITH INCOMPLETE DETAILS
      return (
        med.genericName &&
        med.totalAmtPrice != null &&
        med.totalAmtPrice !== "" &&
        med.dateAdded
      );
    });
};

const select = async (caseNo) => {
  if (!caseNo) {
    throw "`caseNo` is required.";
  }

  const rows = await db.query(
    `
      SELECT
        T0.caseNo,
        T0.CHARGESLIPNO chargeSlipNo,
        T0.CHARGEDATETIME dateTimeCharged,
        T3.itemCode,
        T3.brandName,
        T3.GenName genericName,
        T3.MG strength, /* IN PHAR_ITEMS strength AND/OR unit CAN BE FOUND IN Mg */
        T3.MG unit,
        T3.DosageForm form, /* IN PHAR_ITEMS form AND/OR package CAN BE FOUND IN DosageForm */
        T3.DosageForm package,
        '' route,
        T2.SellingPrice sellingPrice,
        T2.DiscAmt discountAmount,
        T2.Qty quantity,
        ((T2.SellingPrice * T2.Qty) - T2.DiscAmt) totalCost
      FROM 
        [UERMMMC]..[CHARGES_MAIN] T0 WITH(NOLOCK)
        INNER JOIN [UERMMMC]..[PHAR_Sales_Parent] T1 WITH(NOLOCK) ON T0.CHARGESLIPNO = T1.CSNo
        INNER JOIN [UERMMMC]..[PHAR_Sales_Details] T2 WITH(NOLOCK) ON T1.SalesNo = T2.SalesNo
        INNER JOIN [UERMMMC]..[PHAR_ITEMS] T3 WITH(NOLOCK) ON T2.ItemCode = T3.ItemCode
      WHERE
        (T0.CANCELED = 'N' AND T1.Cancelled = 0)
        AND T3.PhicGroupCode = 'MED'
        AND T0.CASENO = ?;
    `,
    [caseNo],
  );

  if (rows?.error) {
    // console.log(rows.error);
    return [];
  }

  return rows;
};

// const insert__OLD = async (userCode, consultationId, item, txn) => {
//   if (!userCode) throw "`userCode` is required.";
//   if (!consultationId) throw "`consultationId` is required.";
//   if (!txn) throw "`txn` is required.";

//   if (!item) item = {};
//   const row = db.createRow(item, columns);

//   const genericName = row.genericName;

//   return await db.upsert(
//     tableName,
//     row,
//     {
//       consultationId,
//       genericName,
//     },
//     userCode,
//     txn,
//     "CreatedBy",
//     "Created",
//     "UpdatedBy",
//     "Updated",
//   );
// };

const insert = async (userCode, consultationId, item, txn) => {
  if (!userCode) throw "`userCode` is required.";
  if (!consultationId) throw "`consultationId` is required.";
  if (!txn) throw "`txn` is required.";

  if (!item) item = {};

  const genericName = item.genericName;
  const dateAdded = jsDateToISOString(item.dateAdded);

  const row = db.createRow(item, columns);

  const existingMed = (
    await db.query(
      `SELECT
            *
          FROM 
            ${tableName}
          WHERE
            ConsultationId = ?
            AND GenericName = ?
            AND DateAdded = ?;`,
      [consultationId, genericName, dateAdded],
      txn,
    )
  )[0];

  if (existingMed) {
    // console.log("Med exists. Updating the existing...");
    return await db.update(
      tableName,
      {
        ...sliceObj(row, "genericName", "dateAdded"),
        updatedBy: userCode,
      },
      { consultationId, genericName, dateAdded },
      txn,
      "Updated",
    );
  }

  // console.log("Inserting new med...");
  return await db.insert(
    tableName,
    {
      ...row,
      createdBy: userCode,
      consultationId,
      genericName,
      dateAdded,
    },
    txn,
    "Created",
  );
};

module.exports = {
  table: tableName,
  columns,
  columnsMap,
  format,
  select,
  insert,
};

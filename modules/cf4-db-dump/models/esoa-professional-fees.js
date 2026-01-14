const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..medicine";

const columns = [
  { name: "eclaimId", required: true, default: "" },
  { name: "pan", required: true },
  { name: "firstName", required: true, size: 250 },
  { name: "middleName", required: true, size: 250, default: "N/A" },
  { name: "lastName", required: true, size: 250 },
  { name: "suffixName", size: 250 },
  { name: "fee", required: true },
  { name: "chargeNetVAT", required: true },
  { name: "seniorCitizenDiscount" },
  { name: "pwdDiscount" },
  { name: "pcso" },
  { name: "dswd" },
  { name: "dohmap" },
  { name: "hmo" },
  { name: "docPhilHealth", required: true },
  { name: "balance", required: true },
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

// QUERY SOURCE: UERMFinancials..Usp_jf_GetPatientSOA_PH_PF STORED PROCEDURE
// SAMPLE CASE NUMBER: 0048177
const select = async (caseNo, txn) => {
  return await db.query(
    `
      SELECT
        philHealthAccredNo pan,
        firstName,
        middleName,
        lastName,
        suffixName,
        professionalFee fee,
        0.00 chargeNetVAT,
        CASE
          WHEN discountCode = 'SEN' THEN discountAmount
          ELSE 0.00
        END seniorCitizenDiscount,
        CASE
          WHEN discountCode = 'DISAB' THEN discountAmount
          ELSE 0.00
        END pwdDiscount,
        0.00 pcso,
        0.00 dswd,
        0.00 dohmap,
        hmoAmount hmo,
        docPhilHealthAmount docPhilHealth,
        professionalFee - (docPhilHealthAmount + discountAmount + hmoAmount) balance
      FROM
        (
          SELECT
            d.PHIC philHealthAccredNo,
            d.[FIRST NAME] firstName,
            d.[MIDDLE NAME] middleName,
            d.[LAST NAME] lastName,
            d.[EXT NAME] suffixName,
            CASE
              WHEN c.DISC_CODE IN ('SEN', 'DISAB') THEN
                CAST(df.PF AS DECIMAL(20, 2)) * 1.2
              ELSE
                CAST(df.PF AS DECIMAL(20, 2))
            END professionalFee,
            c.DISC_CODE discountCode,
            CASE 
              WHEN c.DISC_CODE IN ('SEN', 'DISAB') THEN
                (CAST(df.PF AS DECIMAL(20, 2)) * 1.2) - CAST(df.PF AS DECIMAL(20, 2))
              ELSE
                0.00
            END discountAmount,
            CAST(df.HMOAmount AS DECIMAL(20, 2)) hmoAmount,
            CAST(df.Philhealth AS DECIMAL(20, 2)) docPhilHealthAmount,
            c.caseNo
          FROM
            UERMMMC..PAO_DoctorsFee df
            INNER JOIN UERMMMC..DOCTORS d on df.DoctorID = d.CODE  
            INNER JOIN UERMMMC..CASES c on c.Caseno = df.CaseNo
        ) tb
      WHERE
        caseNo = ?;
    `,
    [caseNo],
    txn,
    false,
  );
};

const selectPayment = async (caseNo, txn) => {
  return await db.query(
    `
      SELECT DISTINCT
        m.PFOrReferenceNo paymentReceiptNumber,
        m.Amount paymentTotalAmountPaid,
        m.TDATE paymentDateTimePaid
      FROM
        UERMMMC..PAO_CashierPFDistribution o
        INNER JOIN UERMMMC..PAYMENTS_MAIN m on m.PFOrReferenceNo = o.ORReference
      WHERE
        ISNULL(o.ORNo, '') <> ''
        AND o.CaseNo = ?
        AND m.Cancelled = 0;
    `,
    [caseNo],
    txn,
    false,
  );
};

module.exports = {
  table: tableName,
  columns,
  columnsMap,
  select,
  selectPayment,
};

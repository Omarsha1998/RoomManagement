const db = require("../../../helpers/sql.js");
const { buildHashTable } = require("../../../helpers/util.js");

const tableName = "EasyClaimsOffline..medicine";

const BILLING_ITEM_CATEGORIES = {
  ROOM_AND_BOARD: 1,
  DRUGS_AND_MEDICINE: 2,
  LABORATORY_AND_DIAGNOSTIC: 3,
  OPERATING_ROOM_FEES: 4,
  MEDICAL_SUPPLIES: 5,
  PROFESSIONAL_FEES: 10,
  OTHERS: 7,
};

const columns = [
  { name: "eclaimId", required: true, default: "" },
  { name: "serviceDate", required: true },
  { name: "itemCode", size: 100, default: "" },
  { name: "itemName", required: true, size: 100 },
  { name: "unitOfMeasurement", required: true, size: 100 },
  { name: "unitPrice", required: true },
  { name: "quantity", required: true },
  { name: "categoryId", required: true }, // reference: BILLING_ITEM_CATEGORIES
  { name: "totalAmount", required: true }, // unitPrice * quantity
];

for (const column of columns) {
  column.table = tableName;
}

const columnsMap = buildHashTable(columns, "name");

const select = async (caseNo, txn) => {
  return await db.query(
    `
      SELECT 
        serviceDate,
        itemName,
        unitOfMeasurement,
        easyClaimsItemCategoryId,
        quantity,
        (unitPrice * (1 - unitDiscountRate)) discountedUnitPrice
      FROM (
        SELECT
          serviceDate,
          itemName,
          unitOfMeasurement,
          easyClaimsItemCategoryId,
          quantity,
          unitPrice,
          ROUND(((totalDiscount / quantity) / unitPrice), 1) unitDiscountRate
        FROM (
          SELECT
            cm.CHARGEDATETIME serviceDate,
            cd.DESCRIPTION itemName,
            'N/A' unitOfMeasurement,
            cd.QTY quantity,
            cd.price unitPrice,
            cd.DISCOUNT totalDiscount,
            CASE
              WHEN ch.REV_CODE = 'PH' THEN ${BILLING_ITEM_CATEGORIES.DRUGS_AND_MEDICINE}
              WHEN ch.REV_CODE = 'CSR' THEN ${BILLING_ITEM_CATEGORIES.MEDICAL_SUPPLIES}
              WHEN t.IsDiagnosticCenter = 1 THEN ${BILLING_ITEM_CATEGORIES.LABORATORY_AND_DIAGNOSTIC}
              ELSE ${BILLING_ITEM_CATEGORIES.OTHERS}
            END easyClaimsItemCategoryId
          FROM
            UERMMMC..CHARGES_MAIN cm
            INNER JOIN UERMMMC..CHARGES_DETAILS cd ON cm.ChargeSlipNo = cd.ChargeSlipNo
            LEFT JOIN UERMMMC..CHARGES ch ON ch.Id = cd.CHARGE_ID
            LEFT JOIN UERMMMC..ACC_TITLES t ON t.Code = ch.REV_CODE
          WHERE
            (cm.CANCELED IS NULL OR cm.CANCELED <> 'Y')
            AND cm.CaseNo = ?

          UNION ALL

          SELECT
            cm.CHARGEDATETIME serviceDate,
            phi.GenName itemName,
            phi.DosageForm unitOfMeasurement,
            phsd.Qty quantity,
            phsd.SellingPrice unitPrice,
            phsd.DiscAmt totalDiscount,
            CASE
              WHEN phi.PhicGroupCode = 'MED' THEN ${BILLING_ITEM_CATEGORIES.DRUGS_AND_MEDICINE}
              WHEN phi.PhicGroupCode = 'SUP' THEN ${BILLING_ITEM_CATEGORIES.MEDICAL_SUPPLIES}
              ELSE ${BILLING_ITEM_CATEGORIES.OTHERS}
            END easyClaimsItemCategoryId
          FROM 
            UERMMMC..CHARGES_MAIN cm
            INNER JOIN UERMMMC..PHAR_Sales_Parent phs ON cm.ChargeSlipNo = phs.CSNo
            INNER JOIN UERMMMC..PHAR_Sales_Details phsd ON phs.SalesNo = phsd.SalesNo
            INNER JOIN UERMMMC..PHAR_ITEMS phi ON phi.ItemCode = phsd.ItemCode
          WHERE
            (cm.CANCELED IS NULL OR cm.CANCELED <> 'Y')
            AND cm.CaseNo = ?
        ) SubTb
      ) tb;
    `,
    [caseNo, caseNo],
    txn,
    false,
  );
};

module.exports = {
  table: tableName,
  columns,
  columnsMap,
  select,
};

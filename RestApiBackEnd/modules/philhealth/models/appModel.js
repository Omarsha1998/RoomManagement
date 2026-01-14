const db = require("../../../helpers/sql.js");
const { cf4Status } = require("../config/constants.js");

const insertClaimDetail = async (userCode, item, txn) => {
  await db.query(
    `UPDATE DocumentMgt..CF4ClaimDetails SET
        Status = 0,
        DateTimeDeleted = GETDATE(),
        DeletedBy = ?
      WHERE
        Status = 1
        AND ClaimId = ?
        AND FieldCode = ?;`,
    [userCode, item.claimCode, item.code],
    txn,
    false,
  );

  await db.query(
    `INSERT INTO DocumentMgt..CF4ClaimDetails (
        ClaimId,
        FieldCode,
        Value,
        CreatedBy,
        Status,
        DateTimeCreated
      ) VALUES (?, ?, ?, ?, 1, GETDATE());`,
    [item.claimCode, item.code, item.value, userCode],
    txn,
    false,
  );
};

const updateClaimDetail = async (userCode, claimDetailId, value, txn) => {
  await db.query(
    `UPDATE DocumentMgt..CF4ClaimDetails SET
        Value = ?,
        UpdatedBy = ?,
        DateTimeUpdated = GETDATE()
      WHERE
        Id = ?;`,
    [value, userCode, claimDetailId],
    txn,
    false,
  );
};

const deleteClaimDetail = async (userCode, id, txn) => {
  await db.query(
    `UPDATE DocumentMgt..CF4ClaimDetails SET
        Status = ?,
        DeletedBy = ?,
        DateTimeDeleted = GETDATE()
      WHERE
        Id = ?;`,
    [0, userCode, id],
    txn,
    false,
  );
};

const upsertClaim = async (userCode, claim, txn) => {
  if (claim.id) {
    return await db.updateOne(
      "DocumentMgt..CF4Claims",
      {
        status: claim.status,
        updatedBy: userCode,
        remarks: claim.remarks,
      },
      { id: claim.id },
      txn,
    );
  }

  return await db.insertOne(
    "DocumentMgt..CF4Claims",
    {
      code: await db.generateRowCode(
        "DocumentMgt..CF4Claims",
        "code",
        "CF4",
        5,
        txn,
        { includeMs: false },
      ),
      caseNo: claim.caseNo,
      patientNo: claim.patientNo,
      status: cf4Status.DRAFT,
      createdBy: userCode,
      remarks: claim.remarks,
    },
    txn,
  );
};

const upsertClaimDetails = async (userCode, claimCode, details, txn) => {
  for (const detail of details) {
    if (detail.id && (detail.value == null || detail.value === "")) {
      await deleteClaimDetail(userCode, detail.id, txn);
      continue;
    }

    if (detail.value != null) {
      // detail.value = JSON.stringify(detail.value);

      if (!detail.id) {
        await insertClaimDetail(
          userCode,
          {
            claimCode,
            code: detail.fieldCode,
            value: detail.value,
            status: 1,
          },
          txn,
        );
        continue;
      }

      await updateClaimDetail(userCode, detail.id, detail.value, txn);
    }
  }
};

const acceptClaim = async (userCode, claimId, txn) => {
  await db.query(
    `UPDATE DocumentMgt..CF4Claims SET
        Status = ?,
        AcceptedBy = ?,
        DateTimeAccepted = GETDATE()
      WHERE
        Id = ?;`,
    [cf4Status.ACCEPTED, userCode, claimId],
    txn,
    false,
  );
};

const rejectClaim = async (userCode, claimId, remarks, txn) => {
  await db.query(
    `UPDATE DocumentMgt..CF4Claims SET
        Status = ?,
        RejectedBy = ?,
        DateTimeRejected = GETDATE(),
        Remarks = ?
      WHERE
        Id = ?;`,
    [cf4Status.DRAFT, userCode, remarks, claimId],
    txn,
    false,
  );
};

const completeClaim = async (userCode, claimId, txn) => {
  await db.query(
    `UPDATE DocumentMgt..CF4Claims SET
        Status = ?,
        CompletedBy = ?,
        DateTimeCompleted = GETDATE()
      WHERE
        Id = ?;`,
    [cf4Status.COMPLETED, userCode, claimId],
    txn,
    false,
  );
};

const insertClaimHistory = async (payload, txn) => {
  await db.query(
    `INSERT INTO DocumentMgt..ClaimHistories (
      ClaimId,
      Status,
      CreatedBy,
      Remarks,
      DateTimeCreated
    ) VALUES (?, ?, ?, ?, GETDATE());`,
    [payload.claimCode, payload.status, payload.userCode, payload.remarks],
    txn,
    false,
  );
};

module.exports = {
  upsertClaim,
  insertClaimDetail,
  updateClaimDetail,
  deleteClaimDetail,
  upsertClaimDetails,
  acceptClaim,
  rejectClaim,
  completeClaim,
  insertClaimHistory,
};

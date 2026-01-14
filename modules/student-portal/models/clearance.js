const sqlHelper = require("../../../helpers/sql");
const util = require("../../../helpers/util");

const searchClearance = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
      clearanceCode
    FROM Clearance..ClearanceDetails
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const acceptClearance = async function (payload, conditons, txn) {
  return await sqlHelper.update(
    "Clearance..ClearanceDetails",
    payload,
    conditons,
    txn,
  );
};

const selectForApproval = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT
      s.firstName,
      s.lastName,
      s.middleName,
      c.code,
      c.studentNo,
      c.collegeLevel,
      c.type,
      c.lastSchoolAttended,
      c.degreeProgramObtained,
      c.dateOfGraduation,
      c.email,
      c.mobileNo,
      c.landlineNo,
      c.country,
      c.roomNo,
      c.lotNo,
      c.street,
      c.barangay,
      c.region,
      c.province,
      c.city,
      c.zipCode,
      c.fullAddress,
      c.status clearanceStatus
    FROM [Clearance]..[Clearance] c
    LEFT JOIN [UE database]..Student s on s.SN = c.StudentNo
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const selectProofOfPayment = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT
        s.firstname,
        s.lastname,
        rd.status documentStatus,
        pp.sn, 
        pp.paymentMethod,
        pp.referenceNo,
        pp.transactionDate,
        pp.amount,
        pp.uploadedFile,
        pp.orNo
      FROM [OnlinePayments]..ProofPayment pp
      LEFT JOIN [UE database]..Student s ON s.sn = pp.sn
      LEFT JOIN Clearance..Clearance c ON c.StudentNo = pp.sn
      LEFT JOIN [Clearance]..[RequestDocuments] rd ON s.sn = rd.StudentNo
      WHERE ${conditions}
      GROUP BY
        s.lastname,
        s.firstname,
        rd.status,
        pp.sn, 
        pp.paymentMethod,
        pp.referenceNo,
        pp.transactionDate,
        pp.amount,
        pp.uploadedFile,
        pp.orNo
      `,
    [],
    txn,
  );
};

const selectAllClearedStudents = async function (txn) {
  return await sqlHelper.query(
    `SELECT
      c.StudentNo,
      s.lastName,
      s.FirstName,
      s.middleName,
      s.ledgerBalance,
      COUNT(cd.ClearanceCode) AS TotalClearances,
      SUM(CASE WHEN cd.Status = 2 THEN 1 ELSE 0 END) AS ClearedClearances
    FROM Clearance..Clearance c
    INNER JOIN Clearance..ClearanceDetails cd ON c.Code = cd.ClearanceCode
    INNER JOIN  [UE database]..Student s ON c.StudentNo = s.SN
    GROUP BY
      c.StudentNo,
      s.lastName,
      s.FirstName,
      s.middleName,
      s.ledgerBalance
  HAVING COUNT(cd.ClearanceCode) = SUM(CASE WHEN cd.Status = 2 THEN 1 ELSE 0 END)`,
    [],
    txn,
  );
};

const selectClearance = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
        c.code,
        c.studentNo,
        c.collegeLevel,
        c.createdBy,
        c.remarks studentRemarks,
        c.type,
        c.departmentLevel,
        FORMAT(cd.dateTimeCleared, 'dd-MMMM-yyyy hh:mm:ss')  dateTime,
        cd.status,
        cd.active,
        cd.remarks departmentRemarks,
        cd.clearedBy,
        s.firstName,
        s.lastName,
        s.course,
        s.college,
        s.ledgerBalance,
        sr.mobileNo,
        sr.email
    FROM Clearance..Clearance c 
    LEFT JOIN Clearance..ClearanceDetails cd ON c.code = cd.clearanceCode 
    LEFT JOIN [UE database]..Student s ON c.StudentNo = s.sn
    LEFT JOIN [UE database]..[Student Reference] sr ON sr.sn = s.sn
    WHERE ${conditions}
    ORDER BY lastName ASC`,
    [],
    txn,
  );
};

const selectClearanceWithSearch = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
          c.code,
          c.studentNo,
          c.collegeLevel,
          c.createdBy,
          c.remarks studentRemarks,
          c.type,
          c.departmentLevel,
          FORMAT(cd.dateTimeCleared, 'dd-MMMM-yyyy hh:mm:ss') dateTime,
          cd.status,
          cd.active,
          cd.remarks departmentRemarks,
          cd.clearedBy,
          s.firstName,
          s.lastName,
          s.course,
          s.college,
          s.ledgerBalance,
          sr.mobileNo,
          sr.email
      FROM Clearance..Clearance  c 
      LEFT JOIN Clearance..ClearanceDetails cd ON c.code = cd.clearanceCode 
      LEFT JOIN [UE database]..Student s ON c.studentNo = s.sn
      LEFT JOIN [UE database]..[Student Reference] sr ON sr.sn = s.sn
      WHERE ${conditions}
      ORDER BY lastName ASC`,
    [],
    txn,
  );
};

const generateClearanceStatus = async function (txn) {
  return await sqlHelper.query(`[Usp_Fil_GenerateClearanceStatus]`, [], txn);
};

const selectForVerification = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT 
        na.sN,
        na.lastName,
        na.firstName,
        na.middleName,
        na.email,
        na.mobileNo,
        na.birthDate,
        na.verifiedBy,
		    na.dateTimeVerified
    FROM Clearance..NewAccount na
    WHERE ${conditions}`,
    [],
    txn,
  );
};

const updateStudentNo = async function (payload, conditions, txn) {
  try {
    const here = await sqlHelper.update(
      "[Clearance]..NewAccount",
      payload,
      conditions,
      txn,
    );
    return here;
  } catch (error) {
    return { error: true, message: error };
  }
};

const selectRequestedList = async function (conditions, txn) {
  return await sqlHelper.query(
    `SELECT DISTINCT
      tl.sn,
      CONCAT(s.lastName, ', ' , s.firstName,  ' ', s.middleName) AS fullName,
      s.lastName,
      s.firstName,
      s.middleName,
      tl.transactionId,
      FORMAT(tl.transactionDate, 'MMMM dd, yyyy') AS transactionDate,
      rd.Status
    FROM Clearance..TransactionLogs tl
    LEFT JOIN Clearance..RequestDocuments rd ON tl.sn = rd.StudentNo AND tl.TransactionId = rd.TransactionId 
    LEFT JOIN Clearance..DocumentInventory di on rd.docuCode = di.DocuCode 
    LEFT JOIN [UE database]..Student s ON tl.SN = s.SN
    WHERE ${conditions}`,
    [],
    txn,
  );
};

module.exports = {
  searchClearance,
  acceptClearance,
  selectForApproval,
  selectProofOfPayment,
  selectAllClearedStudents,
  selectClearance,
  selectClearanceWithSearch,
  generateClearanceStatus,
  selectForVerification,
  updateStudentNo,
  selectRequestedList,
};

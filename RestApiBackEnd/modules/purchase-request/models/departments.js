const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const selectDepartments = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        DISTINCT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        code code,
        description name
      FROM UERMMMC..sections
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
  // return await sqlHelper.query(
  //   `SELECT
  //       DISTINCT
  //       ${util.empty(options.top) ? "" : `TOP(${options.top})`}
  //       dept_code code,
  //       dept_desc name
  //     FROM [UE database]..vw_Employees
  //     WHERE 1=1 ${conditions}
  //     ${util.empty(options.order) ? "" : `order by ${options.order}`}
  //     `,
  //   [],
  //   txn
  // );
};

const selectPRDepartments = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        departmentCode,
        parentCode,
        active,
        dateTimeCreated,
        dateTimeUpdated
      FROM UERMINV..PurchaseRequestDepts
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectPRDepartmentsApprover = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        deptCode,
        approvingDeptCode,
        active,
        dateTimeCreated,
        dateTimeUpdated
      FROM UERMINV..PRDepartmentApprovers
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectPurchasingDepartments = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        departmentCode,
        active,
        externalApproving,
        dateTimeCreated,
        dateTimeUpdated
      FROM UERMINV..PurchasingDepartments
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectPRApprovers = async function (conditions, txn, options) {
  return await sqlHelper.query(
    `SELECT
        id,
        employeeId,
        deptCode,
        active,
        dateTimeCreated,
        dateTimeUpdated
      FROM UERMINV..PurchaseRequestApprovers
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    [],
    txn,
  );
};

const selectMedicineDepartments = async function (
  conditions,
  args,
  options,
  txn,
) {
  return await sqlHelper.query(
    `SELECT
        id,
        departmentCode,
        type,
        active,
        dateTimeCreated,
        dateTimeUpdated,
        remarks
      FROM UERMINV..MedicineDepartments
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
      `,
    args,
    txn,
  );
};

const updatePRApprover = async function (payload, condition, txn) {
  return await sqlHelper.update(
    "UERMINV..PurchaseRequestApprovers",
    payload,
    condition,
    txn,
  );
};

const insertPRApprover = async function (payload, txn) {
  return await sqlHelper.insert(
    "UERMINV..PurchaseRequestApprovers",
    payload,
    txn,
  );
};

module.exports = {
  selectDepartments,
  selectPRDepartments,
  selectPRApprovers,
  selectPurchasingDepartments,
  selectPRDepartmentsApprover,
  selectMedicineDepartments,
  updatePRApprover,
  insertPRApprover,
};

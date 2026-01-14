const md5 = require("md5");
const sqlHelper = require("../../../helpers/sql.js");
const helpers = require("../../../helpers/crypto.js");
const {
  getAccessRights,
} = require("../../access-rights/controllers/accessRightsController.js");
const helperMethods = require("../utility/helperMethods.js");
const util = require("../../../helpers/util.js");
const { SQLDataTypes } = require("../utility/enums.js");

async function getDetails(condition) {
  return (
    await sqlHelper.query(
      `
      SELECT
        TRIM(E.CODE) AS 'employee_id',
        TRIM(U.[PASSWORD]) AS 'password',
        TRIM(E.LastName + ', ' + E.FirstName + ' ' + E.MiddleName + '. ' + E.ExtName) AS 'employee_full_name',
        E.POS_CODE position,
        E.IS_OFFICER,
        CASE
          WHEN (SELECT COUNT(RecNo) FROM HR..EmpWorkExp AS W WHERE W.Deleted = 0 AND W.EmployeeCode = E.CODE) > 0 THEN 1
          ELSE 0
        END AS 'has_work_experience',
        CASE
          WHEN (SELECT COUNT(RecNo) FROM [UE database]..License AS L WHERE L.Deleted = 0 AND L.PrcLicense = 1 AND L.deleted = 0 AND L.EmployeeCode = E.CODE) > 0 THEN 1
          ELSE 0
        END AS 'is_license',
        CASE
          WHEN E.DEPT_CODE = '5040' THEN 1
          ELSE 0
        END AS 'isHR',
        TRIM(E.DEPT_CODE) AS 'department_code',
        e.DEPT_DESC deptDescription,
        e.POS_DESC posDescription
      FROM [UE database]..vw_Employees AS E
      INNER JOIN ITMgt..Users U ON U.CODE = E.CODE
      WHERE E.CODE = ?
      `,
      [condition],
    )
  )[0];
}

async function getApproverAccess(code, moduleName, appName) {
  const req = {
    query: {
      code: code,
      moduleName: moduleName,
      appName: appName,
    },
  };

  let capturedResult;
  const res = {
    json: function (data) {
      capturedResult = data;
    },
  };
  await getAccessRights(req, res);

  const result = capturedResult[0].isAccess;
  return result;
}

// async function getPISAccess(condition) {
//   const response = await sqlHelper.query(
//     `SELECT COALESCE((
//         SELECT G.HasAccess
//         FROM UERMMMC..SECTIONS AS S
//         LEFT JOIN HR..PISAccessRightGroups AS G
//         ON G.GroupName = S.[Group]
//         WHERE S.Code = ?
//     ), 0) AS HasAccess

//     `,
//     [condition],
//   );
//   return (response[0].hasAccess === 1);
// }

async function generateAccessRights(employeeId) {
  const accessModules = [
    { key: "has_pis_access", value: true },
    { key: "is_pis_approver", module: "PIS Approver", app: "Employee Portal" },
    {
      key: "is_leave_approver",
      module: "Leave Approver",
      app: "Employee Portal",
    },
    {
      key: "facultyReportAccess",
      module: "Faculty Report",
      app: "Employee Portal",
    },
    { key: "dutyRosterManage", module: "Manage Schedule", app: "Duty Roster" },
    { key: "dutyRosterCreate", module: "Create Schedule", app: "Duty Roster" },
    { key: "dutyRosterView", module: "View Schedule", app: "Duty Roster" },
    {
      key: "employeeLeaveDetails",
      module: "Employee Leave Details",
      app: "Employee Portal",
    },
    {
      key: "approverDetails",
      module: "Approver Details",
      app: "Employee Portal",
    },
    {
      key: "eventAccess",
      module: "Input",
      app: "Calendar Event",
    },
    {
      key: "unpaidOvertime",
      module: "Unpaid Overtime Report",
      app: "Employee Portal",
    },
  ];

  const access_rights = {};
  for (const item of accessModules) {
    access_rights[item.key] =
      item.value !== undefined
        ? item.value
        : await getApproverAccess(employeeId, item.module, item.app);
  }

  return access_rights;
}

async function getToken(userData) {
  const user = {
    employee_id: userData.employee_id,
    employee_full_name: userData.employee_full_name,
    has_work_experience: helperMethods.convertToBoolean(
      userData.has_work_experience,
    ),
    deptCode: userData.department_code,
    deptDescription: userData.deptDescription,
    position: userData.positionCode,
    posDescription: userData.posDescription,
    isOfficer: userData.officer,
    is_license: helperMethods.convertToBoolean(userData.is_license),
    access_rights: await generateAccessRights(userData.employee_id),
  };

  return helpers.generateAccessToken(user);
}

function matchPassword(enteredPassword, correctPassword) {
  return md5(enteredPassword.trim()) === correctPassword.trim();
}

async function sendEmail(requestHeaderID, header, transaction) {
  const query = `SELECT 
                  TRIM(E.UERMEmail) AS 'UERMEmail' 
                  FROM [UE database]..RequestHdr AS H
                  INNER JOIN [UE database]..Employee AS E
                  ON E.EmployeeCode = H.CreatedBy
                  WHERE H.ID = @ID`;

  const parameters = [
    { name: "ID", dataType: SQLDataTypes.INT, value: requestHeaderID },
  ];
  const response = await helperMethods.executeQuery(
    query,
    parameters,
    transaction,
  );
  const uermEmail = response.recordset[0].UERMEmail;

  const loginURL = "https://local.uerm.edu.ph/employee-central/#/account/login";
  const myRequestURL =
    "https://local.uerm.edu.ph/employee-central/#/my-request";
  const emailContent = {
    header: header,
    subject:
      "UERM Employee Central - Personnel Information System (Notification)",
    content: `Good day! <br /> <br/> `,
    email: uermEmail,
  };
  emailContent.content += `To view this, if you already logged in, please <a href="${myRequestURL}">  click here</a>. But if you are not logged in, <a href="${loginURL}">  click here</a> to log in to your <strong>UERM EMPLOYEE CENTRAL</strong>, Then go to <strong>Personnel Information System</strong> and click the <strong>My Request</strong>.`;

  await util.sendEmail(emailContent);
}

module.exports = {
  getDetails,
  matchPassword,
  getToken,
  sendEmail,
};

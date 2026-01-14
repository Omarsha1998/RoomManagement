// const jwt = require("jsonwebtoken");

const date = require("date-and-time");
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const clearance = require("../models/clearance");

const {
  where,
  args,
  transact,
  query,
  select,
  selectOne,
  update,
  insert,
} = require("../../../helpers/sql");

// const getAllClearance2 = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       let sqlWhere = "";

//       // return await evaluation.getNursingEvalType(sqlWhere, txn);
//       if (req.query.type === "cleared" && req.query.search === 0) {
//         sqlWhere = `
//           cd.departmentID = '${req.user.deptCode}' AND
//           cd.status = 2 AND CONVERT(date, cd.dateTimeCleared)
//           BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'`;
//         return await clearance.selectClearance(sqlWhere, txn);
//       } else if (req.query.type === "cleared" && req.query.search !== 0) {
//         sqlWhere = `cd.departmentID = '${req.user.deptCode}' AND cd.active = 1 AND  cd.status = 2 AND
//                     CONVERT(date, cd.dateTimeCleared) BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'
//                     AND (s.lastName LIKE '${req.query.search}%' OR
//                           s.firstName LIKE  '${req.query.search}%'  OR
//                           C.type LIKE  '${req.query.search}%' )`;
//         return await clearance.selectClearanceWithSearch(sqlWhere, txn);
//       } else if (req.query.type === "uncleared" && req.query.search === 0) {
//         sqlWhere = `cd.departmentID = '${req.user.deptCode}' AND cd.active = 1 AND  cd.status = 3 AND
//                       CONVERT(date, cd.dateTimeRejected) BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'`;
//         return await clearance.selectClearance(sqlWhere, txn);
//       } else if (req.query.type === "uncleared" && req.query.search !== 0) {
//         sqlWhere = `cd.departmentID = '${req.user.deptCode}' AND cd.active = 1 AND cd.status = 3 AND
//                       CONVERT(date, cd.dateTimeRejected) BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'
//                       AND (s.lastName LIKE '${req.query.search}%' OR s.firstName LIKE  '${req.query.search}%'  OR C.type LIKE  '${req.query.search}%' )`;
//         return await clearance.selectClearanceWithSearch(sqlWhere, txn);
//       } else if (req.query.type === "accepted" && req.query.search === 0) {
//         sqlWhere = `cd.departmentID = '${req.user.deptCode}' AND cd.active = 1 AND cd.status = 1 AND
//                     CONVERT(date, cd.dateTimeAccepted) BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'`;
//         return await clearance.selectClearance(sqlWhere, txn);
//       } else if (req.query.type === "accepted" && req.query.search !== 0) {
//         sqlWhere = `cd.departmentID = '${req.user.deptCode}' AND cd.active = 1 AND cd.status = 1 AND
//                           CONVERT(date, cd.dateTimeAccepted) BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'
//                           AND (S.lastName LIKE '${req.query.search}%' OR
//                           S.firstName LIKE  '${req.query.search}%'  OR
//                           C.type LIKE  '${req.query.search}%' )`;
//         return await clearance.selectClearanceWithSearch(sqlWhere, txn);
//       } else if (req.query.type === "new" && req.query.search === 0) {
//         sqlWhere = `cd.departmentID = '${req.user.deptCode}' AND cd.active = 1 AND cd.status is null AND
//                     CONVERT(date, cd.DateTimeCreated) BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'`;
//         return await clearance.selectClearance(sqlWhere, txn);
//       } else if (req.query.type === "new" && req.query.search !== 0) {
//         sqlWhere = `cd.departmentID = '${req.user.deptCode}' AND cd.active = 1 AND cd.status is null AND
//                           CONVERT(date, cd.dateTimeCreated) BETWEEN '${req.query.selectedDateFrom}' AND '${req.query.selectedDateTo}'
//                           AND (s.lastName LIKE '${req.query.search}%'
//                           OR s.firstName LIKE '${req.query.search}%'
//                           OR C.type LIKE  '${req.query.search}%' )`;
//         return await clearance.selectClearanceWithSearch(sqlWhere, txn);
//       }
//     } catch (error) {
//       console.log(error);
//       res.json({ error });
//     }
//   });
//   return res.json(returnValue);
// };

const getAllClearance = async function (req, res) {
  void (async function () {
    try {
      if (req.query.type == "cleared" && req.query.search == 0) {
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
        ];

        const sqlSearch = await query(
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
                    WHERE cd.departmentID = ? AND  cd.status = 2 AND
                    CONVERT(date, cd.dateTimeCleared) BETWEEN ? AND ?
                    ORDER BY lastName ASC
                    `,
          args,
        );
        res.status(200).json(sqlSearch);
      } else if (req.query.type == "cleared" && req.query.search != 0) {
        const searchBar = `%${req.query.search}%`;
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
          searchBar,
          searchBar,
          searchBar,
        ];
        const sqlSearch = await query(
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
                  WHERE cd.departmentID = ? AND cd.active = 1 AND  cd.status = 2 AND
                  CONVERT(date, cd.dateTimeCleared) BETWEEN ? AND ?
                  AND (s.lastName LIKE ? OR s.firstName LIKE  ?  OR C.type LIKE  ? )
                  ORDER BY lastName ASC
                  `,
          args,
        );
        res.status(200).json(sqlSearch);
      } else if (req.query.type == "uncleared" && req.query.search == 0) {
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
        ];

        const sqlSearch = await query(
          `SELECT 
                          c.code,
                          c.studentNo,
                          c.collegeLevel,
                          c.createdBy,
                          c.remarks studentRemarks,
                          c.type,
                          c.departmentLevel,
                          FORMAT(cd.dateTimeRejected, 'dd-MMMM-yyyy hh:mm:ss') dateTime,
                          cd.status,
                          cd.active,
                          cd.rejectedBy,
                          cd.remarks departmentRemarks,
                          S.firstName,
                          S.lastName,
                          S.course,
                          S.college,
                          S.ledgerBalance,
                          SR.mobileNo,
                          SR.email
                      FROM Clearance..Clearance  c 
                      LEFT JOIN Clearance..ClearanceDetails cd ON c.CODE = cd.clearanceCode 
                      LEFT JOIN [UE database]..Student  S ON c.studentNo = s.sn
                      LEFT JOIN [UE database]..[Student Reference] sr ON sr.sn = s.sn
                      WHERE cd.departmentID = ? AND cd.active = 1 AND  cd.status = 3 AND
                      CONVERT(date, cd.dateTimeRejected) BETWEEN ? AND ?
                      ORDER BY lastName ASC
                      `,
          args,
        );
        res.status(200).json(sqlSearch);
      } else if (req.query.type == "uncleared" && req.query.search != 0) {
        const searchBar = `%${req.query.search}%`;
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
          searchBar,
          searchBar,
          searchBar,
        ];

        const sqlSearch = await query(
          `SELECT 
                          c.code,
                          c.studentNo,
                          c.collegeLevel,
                          c.createdBy,
                          c.remarks studentRemarks,
                          c.type,
                          c.departmentLevel,
                          FORMAT(cd.DateTimeRejected, 'dd-MMMM-yyyy hh:mm:ss') dateTime,
                          cd.status,
                          cd.active,
                          cd.rejectedBy,
                          cd.remarks  departmentRemarks,
                          s.firstName,
                          s.lastName,
                          s.course,
                          s.college,
                          s.ledgerBalance,
                          sr.mobileNo,
                          sr.email
                      FROM Clearance..Clearance c 
                      LEFT JOIN Clearance..ClearanceDetails cd ON c.code = cd.clearanceCode 
                      LEFT JOIN [UE database]..Student s ON c.studentNo = s.sn
                      LEFT JOIN [UE database]..[Student Reference] sr ON sr.sn = s.sn
                      WHERE cd.departmentID = ? AND cd.active = 1 AND cd.status = 3 AND
                      CONVERT(date, cd.dateTimeRejected) BETWEEN ? AND ?
                      AND (s.lastName LIKE ? OR s.firstName LIKE  ?  OR C.type LIKE  ? )
                      ORDER BY lastName ASC
                      `,
          args,
        );
        res.status(200).json(sqlSearch);
      } else if (req.query.type == "accepted" && req.query.search == 0) {
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
        ];

        const sqlSearch = await query(
          `SELECT 
                        c.code,
                        c.studentNo,
                        c.collegeLevel,
                        c.createdBy,
                        c.remarks studentRemarks,
                        c.type,
                        c.departmentLevel,
                        FORMAT(cd.dateTimeAccepted, 'dd-MMMM-yyyy hh:mm:ss') dateTime,
                        cd.status,
                        cd.active,
                        cd.acceptedBy,
                        s.firstName,
                        s.lastName,
                        s.course,
                        s.college,
                        s.ledgerBalance,
                        sr.mobileNo,
                        sr.email
                    FROM Clearance..Clearance c 
                    LEFT JOIN Clearance..ClearanceDetails cd ON c.code = cd.clearanceCode 
                    LEFT JOIN [UE database]..Student s ON c.studentNo = s.sn
                    LEFT JOIN [UE database]..[Student Reference] sr ON sr.sn = s.sn
                    WHERE cd.departmentID = ? AND cd.active = 1 AND cd.status = 1 AND
                    CONVERT(date, cd.dateTimeAccepted) BETWEEN ? AND ?
                    ORDER BY lastName ASC
                    `,
          args,
        );
        res.status(200).json(sqlSearch);
      } else if (req.query.type == "accepted" && req.query.search != 0) {
        const searchBar = `%${req.query.search}%`;
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
          searchBar,
          searchBar,
          searchBar,
        ];

        const sqlSearch = await query(
          `SELECT 
                              c.code,
                              c.studentNo,
                              c.collegeLevel,
                              c.createdBy,
                              c.remarks studentRemarks,
                              c.type,
                              c.departmentLevel,
                              FORMAT(c.dateTimeCreated, 'dd-MMMM-yyyy hh:mm:ss') dateTime,
                              cd.status,
                              cd.active,
                              cd.acceptedBy,
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
                          WHERE cd.departmentID = ? AND cd.active = 1 AND cd.status = 1 AND
                          CONVERT(date, cd.dateTimeAccepted) BETWEEN ? AND ?
                          AND (S.lastName LIKE ? OR S.firstName LIKE  ?  OR C.type LIKE  ? )
                          ORDER BY lastName ASC
                          `,
          args,
        );
        res.status(200).json(sqlSearch);
      } else if (req.query.type == "new" && req.query.search == 0) {
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
        ];

        const sqlSearch = await query(
          `SELECT 
                        c.code,
                        c.studentNo,
                        c.collegeLevel,
                        c.createdBy,
                        c.remarks studentRemarks,
                        c.type,
                        c.departmentLevel,
                        FORMAT(c.dateTimeCreated, 'dd-MMMM-yyyy hh:mm:ss') DateTime,
                        cd.status,
                        cd.active,
                        s.firstName,
                        s.lastName,
                        s.course,
                        s.college,
                        s.ledgerBalance,
                        sr.mobileNo,
                        sr.email
                    FROM Clearance..Clearance AS c 
                    LEFT JOIN Clearance..ClearanceDetails cd ON c.code = cd.clearanceCode 
                    LEFT JOIN [UE database]..Student s ON c.studentNo = s.sn
                    LEFT JOIN [UE database]..[Student Reference] sr ON sr.sn = s.sn
                    WHERE cd.departmentID = ? AND cd.active = 1 AND cd.status is null AND
                    CONVERT(date, cd.DateTimeCreated) BETWEEN ? AND ?
                    ORDER BY lastName ASC
                    `,
          args,
        );
        res.status(200).json(sqlSearch);
      } else if (req.query.type == "new" && req.query.search != 0) {
        const searchBar = `%${req.query.search}%`;
        const args = [
          req.user.deptCode,
          req.query.selectedDateFrom,
          req.query.selectedDateTo,
          searchBar,
          searchBar,
          searchBar,
        ];
        const sqlSearch = await query(
          `SELECT 
                              c.code,
                              c.studentNo,
                              c.collegeLevel,
                              c.createdBy,
                              c.remarks studentRemarks,
                              c.type,
                              c.departmentLevel,
                              FORMAT(c.dateTimeCreated, 'dd-MMMM-yyyy hh:mm:ss') dateTime,
                              cd.status,
                              cd.active,
                              s.firstName,
                              s.lastName,
                              s.course,
                              s.college,
                              s.ledgerBalance,
                              sr.mobileNo,
                              sr.email
                          FROM Clearance..Clearance c 
                          LEFT JOIN Clearance..ClearanceDetails cd ON c.code = cd.clearanceCode 
                          LEFT JOIN [UE database]..Student s ON c.studentNo = s.sn
                          LEFT JOIN [UE database]..[Student Reference] sr ON sr.sn = s.sn
                          WHERE cd.departmentID = ? AND cd.active = 1 AND cd.status is null AND
                          CONVERT(date, cd.dateTimeCreated) BETWEEN ? AND ?
                          AND (s.lastName LIKE ? OR s.firstName LIKE  ?  OR C.type LIKE  ? )
                          ORDER BY lastname ASC
                          `,
          args,
        );
        res.status(200).json(sqlSearch);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  })();
}; //END OF getAllClearance FUNCTION

const acceptOrRejectClearance = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const now = new Date();
    const studentFirstName = req.body.studentFirstName; //This is only for email notifications.
    const studentLastName = req.body.studentLastName; //This is only for email notifications.
    const clearanceCode = req.body.clearanceCode;
    const mobileNo = req.body.mobileNo; ///This is for cleared or uncleared only.
    const email = req.body.email; ///This is for cleared or uncleared only.
    const clearedRemarks = req.body.clearedRemarks;
    const rejectRemarks = req.body.rejectRemarks;
    const currentDate = date.format(now, "YYYY/MM/DD HH:mm:ss");

    const clearanceType = req.body.clearanceType;
    // let collegeLevel = req.body.collegeLevel;
    const user = req.user.code;
    const departmentId = req.user.deptCode;
    const department = req.user.deptDesc;

    //IF DEPARTMENT USER CLICKS ACCEPTED
    if (req.body.status === "accepted") {
      const args = [clearanceCode, departmentId];

      const sqlSearchQuery = await query(
        `SELECT 
                      clearanceCode
                  FROM Clearance..ClearanceDetails
                  WHERE clearanceCode = ? AND departmentId = ? AND Status is null AND active = 1
                  `,
        args,
      );

      if (sqlSearchQuery.length === 1) {
        const result = await transact(async (txn) => {
          return await update(
            "Clearance..ClearanceDetails",
            {
              status: "1",
              remarks: "Processing",
              acceptedBy: user,
              dateTimeAccepted: currentDate,
              updatedBy: user,
            },
            {
              clearanceCode: clearanceCode,
              departmentId: departmentId,
              active: 1,
            },
            txn,
            "DateTimeUpdated",
          );
        });
        res.status(200).json(result);
      } else {
        res.status(200).json({ message: "Clearance is already accepted" });
      }
      // res.status(200).json(result);
    } else if (
      req.body.status == "rejected" &&
      (req.body.tab == "new" || req.body.tab == "uncleared")
    ) {
      //IF DEPARTMENT USER CLICKS REJECT IN NEW TAB OR NOT YET CLEARED TAB
      const args = [clearanceCode, departmentId];
      const sqlSearchQuery = await query(
        `SELECT 
                clearanceCode
            FROM Clearance..ClearanceDetails
            WHERE clearanceCode = ? AND departmentId = ? AND active = 1
            `,
        args,
      );

      if (sqlSearchQuery.length === 1) {
        const result = await transact(async (txn) => {
          return await update(
            "Clearance..ClearanceDetails",
            {
              status: "3",
              remarks: rejectRemarks,
              rejectedBy: user,
              dateTimeRejected: currentDate,
              updatedBy: user,
            },
            {
              clearanceCode: clearanceCode,
              departmentId: departmentId,
              active: 1,
            },
            txn,
            "DateTimeUpdated",
          );
        });
        res.status(200).json(result);

        /////////////////////////////////////////////////////////
        //EMAIL NOTIF PROD
        if (email !== null && !process.env.DEV) {
          //IF STUDENT HAS EMAIL
          const department = req.user.deptDesc;
          const emailContent = {
            header: `STUDENT CLEARANCE`,
            subject: `UERM STUDENT CLEARANCE UPDATE – PLEASE SETTLE YOUR DEFICIENCY AT THE ${req.user.deptDesc}`,
            content: `
                                Good day! <br /> <br />   
                                <b>Please settle immediately your deficiency in the ${department}, as follows:<b>
                          ${rejectRemarks}`,
            email: email,
            name: `${studentLastName} ${studentFirstName}`,
          };

          await util.sendEmail(emailContent);
        }

        //SMS NOTIF PROD
        if (mobileNo !== null && !process.env.DEV) {
          ///IF STUDENT HAS SMS SEND THIS MESSAGE
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          const message = {
            messageType: "sms",
            destination: mobileNo,
            text: `PLEASE CONTACT US! \n\nPlease immediately settle your deficiency at the ${department}.\n\nThank you.`,
          };
          await util.sendSMS(accessToken, message);
        } //END OF IF MOBILE NUMBER NOT EQUAL TO NULL
        ///////////////////////////////////////////////////////////

        if (mobileNo !== null && process.env.DEV) {
          ///IF STUDENT HAS SMS SEND THIS MESSAGE
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          const message = {
            messageType: "sms",
            destination: "09751824840",
            text: `PLEASE CONTACT US! \n\nPlease immediately settle your deficiency at the ${department}.\n\nThank you.`,
          };
          await util.sendSMS(accessToken, message);
        }

        //EMAIL NOTIF DEV
        if (email !== null && process.env.DEV) {
          //IF STUDENT HAS EMAIL
          const department = req.user.deptDesc;
          const emailContent = {
            header: `STUDENT CLEARANCE`,
            subject: `UERM STUDENT CLEARANCE UPDATE – PLEASE SETTLE YOUR DEFICIENCY AT THE ${req.user.deptDesc}`,
            content: `
                              Good day! <br /> <br />   
                              <b>Please settle immediately your deficiency in the ${department}, as follows:<b>
                        ${rejectRemarks}`,
            email: "faliongson@uerm.edu.ph",
            name: `${studentLastName} ${studentFirstName}`,
          };

          await util.sendEmail(emailContent);
        } //END OF IF EMAIL NOT EQUAL TO NULL
      } else {
        res.status(200).json({ message: "Clearance is rejected accepted" });
      }
    } else if (req.body.status == "rejected" && req.body.tab == "accepted") {
      //ELSE IF DEPARTMENT USER CLICKS REJECT IN ACCEPTED TAB
      const args = [clearanceCode, departmentId];
      const sqlSearchQuery = await query(
        `SELECT 
                    clearanceCode
                FROM Clearance..ClearanceDetails
                WHERE clearanceCode = ? AND departmentId = ? AND active = 1
                `,
        args,
      );

      if (sqlSearchQuery.length === 1) {
        const result = await transact(async (txn) => {
          return await update(
            "Clearance..ClearanceDetails",
            {
              status: "3",
              remarks: rejectRemarks,
              rejectedBy: user,
              dateTimeRejected: currentDate,
              updatedBy: user,
            },
            {
              clearanceCode: clearanceCode,
              departmentId: departmentId,
              active: 1,
            },
            txn,
            "DateTimeUpdated",
          );
        });
        // console.log("Reject Result", result)
        res.status(200).json(result);

        ///////////////////////////////////////////////////
        //EMAIL NOTIF PROD
        if (email !== null && !process.env.DEV) {
          //IF STUDENT HAS EMAIL
          const emailContent = {
            header: `STUDENT CLEARANCE`,
            subject: `UERM STUDENT CLEARANCE UPDATE – PLEASE SETTLE YOUR DEFICIENCY AT THE ${req.user.deptDesc}`,
            content: `Good day! <br /> <br /> 
                                  <b>Please settle immediately your deficiency in the ${req.user.deptDesc}, 
                                  as follows:<b> <br />
                            ${rejectRemarks}`,
            email: email,
            name: `${studentLastName} ${studentFirstName}`,
          };

          await util.sendEmail(emailContent);
        } //END OF IF EMAIL NOT EQUAL TO NULL

        //SMS NOTIF
        if (mobileNo !== null && !process.env.DEV) {
          ///IF STUDENT HAS SMS SEND THIS MESSAGE
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          const message = {
            messageType: "sms",
            destination: mobileNo, //real mobile number of student uncomment this in production
            text: `PLEASE CONTACT US! \n\nPlease immediately settle your deficiency at the ${req.user.deptDesc}.\n\nThank you.`,
          };
          await util.sendSMS(accessToken, message);
        } //END OF IF MOBILE NUMBER NOT EQUAL TO NULL
        ///////////////////////////////////////////////////

        //EMAIL NOTIF
        if (email !== null && process.env.DEV) {
          //IF STUDENT HAS EMAIL
          // const department = req.user.userData[0].deptDesc
          const emailContent = {
            header: `STUDENT CLEARANCE`,
            subject: `UERM STUDENT CLEARANCE UPDATE – PLEASE SETTLE YOUR DEFICIENCY AT THE ${req.user.deptDesc}`,
            content: `Good day! <br /> <br /> 
                                <b>Please settle immediately your deficiency in the ${req.user.deptDesc}, 
                                as follows:<b> <br />
                          ${rejectRemarks}`,
            // email: email, //real email of student uncomment this in production
            // email: 'jrebio@uerm.edu.ph',
            email: "filqwerty.uiop03@gmail.com",
            name: `${studentLastName} ${studentFirstName}`,
          };

          await util.sendEmail(emailContent);
        } //END OF IF EMAIL NOT EQUAL TO NULL

        //SMS NOTIF
        if (mobileNo !== null && process.env.DEV) {
          ///IF STUDENT HAS SMS SEND THIS MESSAGE
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          const message = {
            messageType: "sms",
            // destination: mobileNo,   //real mobile number of student uncomment this in production
            destination: "09751824840",
            text: `PLEASE CONTACT US! \n\nPlease immediately settle your deficiency at the ${req.user.deptDesc}.\n\nThank you.`,
          };
          await util.sendSMS(accessToken, message);
        } //END OF IF MOBILE NUMBER NOT EQUAL TO NULL
      } else {
        res.status(200).json({ message: "Clearance is rejected accepted" });
      }
    } else if (req.body.status == "cleared") {
      //ELSE IF DEPARTMENT USER CLICKS CLEARED BUTTON
      const args = [clearanceCode, departmentId];
      const sqlSearchQuery = await query(
        `SELECT 
                    ClearanceCode
                FROM Clearance..ClearanceDetails
                WHERE ClearanceCode = ? AND DepartmentId = ? AND Active = 1
                `,
        args,
      );

      if (sqlSearchQuery.length === 1) {
        const result = await transact(async (txn) => {
          return await update(
            "Clearance..ClearanceDetails",
            {
              status: "2",
              remarks: clearedRemarks,
              clearedBy: user,
              dateTimeCleared: currentDate,
              updatedBy: user,
            },
            {
              clearanceCode: clearanceCode,
              departmentId: departmentId,
              active: 1,
            },
            txn,
            "DateTimeUpdated",
          );
        });
        const argsCleared = [clearanceCode];
        const sqlCountUniversityLevelCleared = await query(
          `SELECT 
            COUNT(*) AS clearanceCleared
          FROM 
              Clearance..ClearanceDetails
          WHERE 
              DepartmentId IN (1280, 5021, 11500, 11300, 11200, 5013) AND
              ClearanceCode  = ? AND  status = 2
            `,
          argsCleared,
        );

        // console.log(
        //   "sqlCountUniversityLevelCleared",
        //   sqlCountUniversityLevelCleared[0].clearanceCleared,
        // );

        if (sqlCountUniversityLevelCleared[0].clearanceCleared === 6) {
          const updateStatus = await transact(async (txn) => {
            return await update(
              "Clearance..ClearanceDetails",
              {
                Active: 1,
              },
              {
                clearanceCode: clearanceCode,
                departmentId: 2010,
              },
              txn,
              "DateTimeUpdated",
            );
          });
          console.log("UPDATE", updateStatus);

          //dito lagyan ko email na cleared na sila sa sa clearance tracking
        }

        // console.log("Cleared Result", result)
        res.status(200).json(result);

        /////////////////////////////////////////////////////////////////
        //SMS NOTIF PROD
        if (mobileNo !== null && !process.env.DEV) {
          ///IF STUDENT HAS SMS SEND THIS MESSAGE
          const department = req.user.deptDesc;
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          const message = {
            messageType: "sms",
            destination: mobileNo,
            text: `CONGRATULATIONS! \n\nYou are now cleared at the ${department}. \n\nPlease log on to your UERM STUDENT PORTAL for details.\n\nThank you`,
          };
          await util.sendSMS(accessToken, message);
        } //END OF IF MOBILE NUMBER NOT EQUAL TO NULL
        if (email !== null && !process.env.DEV) {
          //IF STUDENT HAS EMAIL
          const department = req.user.deptDesc;
          const emailContent = {
            header: `CONGRATULATIONS! <br />`,
            subject: "Student Clearance",
            content: `Good day! <br /> <br />  
                            You are now cleared at the ${department}. <br /> <br />Please log on to your UERM STUDENT PORTAL for details.`,
            email: email,
            name: `${studentLastName} ${studentFirstName}`,
          };
          await util.sendEmail(emailContent);
        }
        /////////////////////////////////////////////////////////////////////

        //SMS NOTIF
        if (mobileNo !== null && process.env.DEV) {
          ///IF STUDENT HAS SMS SEND THIS MESSAGE
          const department = req.user.deptDesc;
          const tokenBearerSMS = await util.getTokenSMS();
          const accessToken = tokenBearerSMS.accessToken;
          const message = {
            messageType: "sms",
            destination: "09751824840",
            text: `CONGRATULATIONS! \n\nYou are now cleared at the ${department}. \n\nPlease log on to your UERM STUDENT PORTAL for details.\n\nThank you`,
          };
          await util.sendSMS(accessToken, message);
        } //END OF IF MOBILE NUMBER NOT EQUAL TO NULL

        if (email !== null && process.env.DEV) {
          //IF STUDENT HAS EMAIL
          const department = req.user.deptDesc;
          const emailContent = {
            header: `CONGRATULATIONS! <br />`,
            subject: "Student Clearance",
            content: `Good day! <br /> <br />  
                            You are now cleared at the ${department}. <br /> <br />Please log on to your UERM STUDENT PORTAL for details.`,
            email: "faliongson@uerm.edu.ph",
            name: `${studentLastName} ${studentFirstName}`,
          };
          await util.sendEmail(emailContent);
        } //END OF IF EMAIL NOT EQUAL TO NULL

        const sequence = result.sequence;
        const sequencePlusOne = sequence + 1;
        const sequencePlusTwo = sequence + 2;
        //ETO YUNG MAGIGING TOTAL KUNG ILAN SA BAWAT CATEGORY EXAMPLE (TOTAL CLEARED / DEPARTMENT LENGTH)
        const args2 = [clearanceCode, result.sequence];
        const departmentLength = await query(
          `SELECT 
                                    COUNT(*) AS category 
                              FROM Clearance..ClearanceDetails
                              WHERE ClearanceCode = ? AND Sequence = ? AND Active = 1
                              `,
          args2,
        );

        //CHECK IF CLEARANCE CLEARED IN SPECIFIC SEQUENCE OR VERIFIED IF ALL CLEARED
        const args3 = [clearanceCode];
        const verifyIfAllCleared = await query(
          `SELECT COUNT(*) AS verified_count
                              FROM Clearance..ClearanceDetails
                              WHERE ClearanceCode = ? AND Status = 2 AND Active = 1
                              `,
          args3,
        );

        //if TOTAL CLEARED == DEPARTMENT PROCEED TO NEXT SEQUENCE
        if (
          verifyIfAllCleared[0].verified_count ===
            departmentLength[0].category &&
          clearanceType === "Withdrawal of Enrollment"
        ) {
          if (departmentLength[0].category === 1) {
            //DEANS TO UNIV LEVEL
            //CHANGE ACTIVE 1 TO 0 TO PROCEED IN NEXT SEQUENCE
            await transact(async (txn) => {
              return await update(
                "Clearance..ClearanceDetails",
                {
                  Active: 1,
                },
                {
                  ClearanceCode: clearanceCode,
                  Sequence: sequence,
                  Active: 1,
                },
                txn,
                "DateTimeUpdated",
              );
            });

            //CHANGE ACTIVE 0 TO 1 TO PROCEED IN NEXT SEQUENCE
            await transact(async (txn) => {
              return await update(
                "Clearance..ClearanceDetails",
                {
                  active: 1,
                },
                {
                  clearanceCode: clearanceCode,
                  sequence: sequencePlusTwo,
                  active: 0,
                },
                txn,
                "DateTimeUpdated",
              );
            });
          } else if (departmentLength[0].category === 5) {
            //UNIV LEVEL TO DEANS
            //CHANGE ACTIVE 1 TO 0 TO PROCEED IN NEXT SEQUENCE
            await transact(async (txn) => {
              return await update(
                "Clearance..ClearanceDetails",
                {
                  active: 1,
                },
                {
                  clearanceCode: clearanceCode,
                  sequence: sequence,
                  active: 1,
                },
                txn,
                "DateTimeUpdated",
              );
            });

            //CHANGE ACTIVE 0 TO 1 TO PROCEED IN NEXT SEQUENCE
            await transact(async (txn) => {
              return await update(
                "Clearance..ClearanceDetails",
                {
                  active: 1,
                },
                {
                  clearanceCode: clearanceCode,
                  sequence: sequencePlusOne,
                  active: 0,
                },
                txn,
                "DateTimeUpdated",
              );
            });
          } //END OF INNER ELSE IF
        } else if (
          verifyIfAllCleared[0].verified_count ===
            departmentLength[0].category &&
          clearanceType !== "Withdrawal of Enrollment"
        ) {
          //CHANGE ACTIVE 1 TO 0 TO PROCEED IN NEXT SEQUENCE
          await transact(async (txn) => {
            return await update(
              "Clearance..ClearanceDetails",
              {
                active: 1,
              },
              {
                clearanceCode: clearanceCode,
                sequence: sequence,
                active: 1,
              },
              txn,
              "DateTimeUpdated",
            );
          });

          //CHANGE ACTIVE 0 TO 1 TO PROCEED IN NEXT SEQUENCE
          await transact(async (txn) => {
            return await update(
              "Clearance..ClearanceDetails",
              {
                active: 1,
              },
              {
                clearanceCode: clearanceCode,
                sequence: sequencePlusOne,
                active: 0,
              },
              txn,
              "DateTimeUpdated",
            );
          });
        }

        ///KAPAG CLEARED NA LAHAT SA DEPARTMENT
        //PWEDE NA MAG PROCEED YUNG STUDENT SA DOCUMENT REQUEST
        const checkIfAllCleared = [clearanceCode];
        const studentClearedDept = await query(
          `SELECT 
              COUNT(*) AS cleared 
            FROM Clearance..ClearanceDetails
            WHERE ClearanceCode = ? AND Status = 2 AND Active = 1
                              `,
          checkIfAllCleared,
        );

        const studentTotalDept = await query(
          `SELECT 
              COUNT(*) AS totalDept 
            FROM Clearance..ClearanceDetails
            WHERE ClearanceCode = ? AND Active = 1
                              `,
          checkIfAllCleared,
        );

        if (studentClearedDept[0].cleared === studentTotalDept[0].totalDept) {
          await transact(async (txn) => {
            return await update(
              "Clearance..Clearance",
              {
                status: "2",
              },
              {
                Code: clearanceCode,
              },
              txn,
              "DateTimeUpdated",
            );
          });
        }
      } else {
        res.status(200).json({ message: "Clearance is rejected" });
      }
    }
  });
  return res.status(200).json(returnValue);
}; //END OF acceptOrRejectClearance FUNCTION

const retractClearance = async function (req, res) {
  void (async function () {
    const result = await transact(async (txn) => {
      return await update(
        "Clearance..ClearanceDetails",
        {
          status: "1",
          remarks: "Processing",
          dateTimeCleared: null,
        },
        {
          clearanceCode: req.body.clearanceCode,
          departmentID: req.user.deptCode,
        },
        txn,
        "DateTimeAccepted",
      ); //END OF UPDATE HELPER
    }); //END OF TRANSACT HELPER
    res.status(200).json({ result });
  })();
};

const getApplicationRequest = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const requestType = req.query.type;
      const search = req.query.search;

      if (requestType === "approval" && search === "") {
        const sqlWhere = "c.Status = '4'";
        return await clearance.selectForApproval(sqlWhere, txn);
      }
      // else if (requestType === "rejected" && search === "") {
      //   const sqlWhere = "c.Status = '5'";
      //   return await clearance.selectForApproval(sqlWhere, txn);
      // } else if (requestType === "releasing" && search === "") {
      // } else if (requestType === "releasing" && search !== "") {
      // }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  });

  return res.json(returnValue);
};

const getProofOfPayment = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = `pp.Remarks = 'Payment for Documents Request' AND pp.Deleted != 1`;
      const response = await clearance.selectProofOfPayment(sqlWhere, txn);
      // console.log("RESPONSE", response);
      return response;
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  });
  return res.json(returnValue);
};

const getAllClearedStudents = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const response = await clearance.selectAllClearedStudents(txn);
    return response;
  });
  return res.json(returnValue);
};

const generateClearanceStatus = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const response = await clearance.generateClearanceStatus(txn);
    return response;
  });

  return res.json(returnValue);
};

const getForVerification = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    sqlWhere = `na.Active = '1'`;
    const response = await clearance.selectForVerification(sqlWhere, txn);

    return response;
  });
  return res.json(returnValue);
};

const submitStudentNo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();

      const lastName = req.body.lastName;
      const firstName = req.body.firstName;
      const email = req.body.email;
      const birth = req.body.birthDate;

      const birthDate = new Date(birth);

      const studentno = req.body.studentno;

      const payload = {
        SN: studentno,
        VerifiedBy: req.user.code,
        DateTimeVerified: formattedDate,
        UpdatedBy: req.user.code,
      };

      const sqlWhere = {
        LastName: lastName,
        FirstName: firstName,
        Email: email,
        BirthDate: birthDate,
      };

      const studentNo = await clearance.updateStudentNo(payload, sqlWhere, txn);

      // if (Object.keys(studentNo).length > 0) {
      const emailContent = {
        header: `Your Student Number Information`,
        subject: `Your Student Number Information`,
        content: `Dear ${req.user.lastName}, ${req.user.firstName},
                    We are writing to inform you of your Student Number, which is an important piece of information for your studies at [School Name]. <br /> <br />
                    Your Student Number is: <b>${studentno}</b>. <br /> <br />
                    Please keep this number safe and use it for all future transactions and communications related to your education at our institution. <br /> <br />
                    If you have any questions or need further assistance feel free to contact us at <br /> <b>(632) 8-713-3315; (632) 8-715-0861 Local 261 or registrar@uerm.edu.ph. </b> <br />
                    `,
        // email: req.body.email,
        email: `faliongson@uerm.edu.ph`,
        // email: `rbbuan@uerm.edu.ph`,
        name: `${req.user.lastName}, ${req.user.firstName}`,
      };

      // const recipients = [
      //   "faliongson@uerm.edu.ph",
      //   "rbbuan@uerm.edu.ph",
      //   "filqwerty.uiop03@gmail.com",
      // ];

      // for (const recipient of recipients) {
      //   emailContent.email = recipient;
      //   await util.sendEmail(emailContent);
      // }

      await util.sendEmail(emailContent);
      // }

      return studentNo;
    } catch (error) {
      return { error: error };
    }
  });
  return res.json(returnValue);
};

const getRequestedList = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `rd.Active = '1'`;

      const response = await clearance.selectRequestedList(sqlWhere, txn);

      return response;
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  });
  return res.json(returnValue);
};

module.exports = {
  getAllClearance,
  acceptOrRejectClearance,
  retractClearance,
  getApplicationRequest,
  getProofOfPayment,
  getAllClearedStudents,
  generateClearanceStatus,
  getForVerification,
  submitStudentNo,
  getRequestedList,
};

const express = require("express");
const router = express.Router();
// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const webpush = require("web-push");

router.use(sanitize);

router.get("/result", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        e.code,
        e.name name,
        e.dept_desc department,
        e.pos_desc position,
        e.emp_class_desc class,
        d.SymptomAndHistory_Code symptomsAndHistory,
        d.temperature,
        d.DateDeclared date
      from [HR]..HDFHealthDeclarations d
      left join [ue database]..vw_Employees e
        on e.code = d.usercode
      order by date,name`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/timedata-no-triage", (req, res) => {
  var sqlWhere = "";
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select distinct
        t.code,
        ee.name,
        ee.DEPT_DESC department,
        ee.POS_DESC position,
        ee.EMP_CLASS_DESC class,
        t.date
      from HR..vw_TimedataPivot t
      left join HR..vw_EmployeeTriage e
        on t.code = e.code
        and t.date = convert(date,e.date)
      left join [UE database]..vw_Employees ee
        on t.code = ee.code
      where e.code is null
      and t.date = ${req.query.date ? '\''+req.query.date+'\'' : "convert(date,getdate())"}
      order by name`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/dashboard", (req, res) => {
  var sqlWhere = "";
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (req.query.isToday == 1) {
    var sqlWhere = "where convert(date,e.date) = convert(date,getdate())";
  }

  if(req.query.withDateRange == 1) {
    var sqlWhere = `where convert(date,e.date) >= '${req.query.dateFrom}' and convert(date,e.date) <= '${req.query.dateTo}'`;
  }

  if (req.query.date) {
    var sqlWhere = `where convert(date,e.date) = convert(date,'${req.query.date}')`
  }

  if (req.query.isForCovidER == 1) {
    var sqlWhere = `where isForCovidEr = 1 and isCleared = 0`
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from hr..vw_employeetriage e
      ${sqlWhere}
      order by date,name`;
      
      const result = await sql.query(sqlQuery);
      
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/etriage-cif", (req, res) => {
  var sqlWhere = "";
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from hr..vw_EmployeeETriageCIF
      ${sqlWhere}`;
      
      const result = await sql.query(sqlQuery);
      
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.get("/hdf-users", (req, res) => {
  var sqlWhere = "";
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (req.query.isToday == 1) {
    var sqlWhere = "where convert(date,e.date) = convert(date,getdate())";
  }
  if (req.query.date) {
    var sqlWhere = `where convert(date,e.date) = convert(date,'${req.query.date}')`
  }

  if (req.query.isForCovidER == 1) {
    var sqlWhere = `where isForCovidEr = 1 and isCleared = 0`
  }

  if(req.query.withDateRange == 1) {
    var sqlWhere = `where convert(date,e.date) >= '${req.query.dateFrom}' and convert(date,e.date) <= '${req.query.dateTo}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from [HR]..vw_OtherUsersETriage e
      ${sqlWhere}
      order by date,name`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/clear-employee", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.id) {
    res.send({ error: 'ID Required.' });
    return;
  }

  if (!req.body.isPastData) {
    res.send({ error: 'Past data Required.' });
    return;
  }

  if (!req.body.user) {
    res.send({ error: 'User Required.' });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_ClearHDFEmployee
                '${req.body.id}',
                '${req.body.isPastData == 'true' ? 1 : 0}',
                '${req.body.user}',
                '${helpers.getIp(req.connection.remoteAddress)}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/symptoms", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [HR]..HDFSymptomsAndHistories where type = 1`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/user-histories", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from [HR]..HDFSymptomsAndHistories where type = 2`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search-secretary", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  
  if (!req.query.code) {
    res.send({ error: 'User Code Required.' });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select * from ITMgt..vw_DoctorsSecretaryId 
      where isValid = 1 and code = '${req.query.code}'`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/search-user-code", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  var sqlAnd = "";
  if(req.query.UserType == 'tpc') {
    var sqlAnd = "and UserType = 'tpc'";
  }

  if(req.query.UserType == 'visitor') {
    var sqlAnd = "and UserType = 'visitor'";
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select top(1) * from [HR]..HDFHealthDeclarations
        where UserCode = '${req.query.UserCode}'
        ${sqlAnd}
        order by DateDeclared desc`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.get("/search-student", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select top(1) 
        CODE, PASS, LASTNAME, FIRSTNAME, MIDDLENAME, COLLEGE_DESC, COURSE_DESC, ADDRESS, MOBILENO, TEL_NO 
        from [UE database]..vw_Student
        where CODE = '${req.query.UserCode}' 
        and IS_ACTIVE = 1`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/check-user", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  
  if (!req.query.FirstName) {
    res.send({ error: 'FirstName Required.' });
    return;
  }

  if (!req.query.LastName) {
    res.send({ error: 'LastName Required.' });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `select * from [HR]..HDFHealthDeclarations d
        where 
        LastName = '${req.query.LastName}' and 
        FirstName = '${req.query.FirstName}'`;

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();

      res.send({ result: result.recordset });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/health-declaration", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (req.query.userType == 'tpc') {
    var sqlAnd = `and FirstName = '${req.query.firstName}' and LastName = '${req.query.lastName}'`;
    if (!req.query.firstName) {
      res.send({ error: 'Firstname Required.' });
      return;
    }

    if (!req.query.lastName) {
      res.send({ error: 'Lastname Required.' });
      return;
    }

  } else {
    if (!req.query.code) {
      res.send({ error: 'Code Required.' });
      return;
    }
    var sqlAnd = `and d.UserCode = '${req.query.code}'`;
  }

  void (async function () {
    try {
      const sqlQuery = `select
          d.UserCode,
          d.Temperature,
          d.SymptomAndHistory_Code symptoms,
          d.isCleared,
          d.score,
          d.DateDeclared,
          d.FirstName,
          d.LastName,
          d.MiddleInitial,
          d.UserType,
          d.UserCategory
        from HR..HDFHealthDeclarations d  
        where convert(date,d.DateDeclared) = convert(date,GETDATE())
        ${sqlAnd}
        `;

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();

      res.send({ result: result.recordset });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-hdf-user", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_UpdateHDFUser
                '${req.body.Code}',
                '${req.body.LastName}',
                '${req.body.FirstName}',
                '${req.body.MiddleInitial}',
                '${req.body.ContactNo}',
                '${req.body.Address}',
                '${req.body.UserCategory}'
            `;

      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR) {
        res.send({
          error: true,
          message: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: true,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-department-hdf", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_AddHDFDepartmentUser
                '${req.body.UserCode}',
                '${req.body.SymptomAndHistory_Code}',
                '${req.body.Temperature}',
                '${req.body.LastName}',
                '${req.body.FirstName}',
                '${req.body.MiddleInitial}',
                '${req.body.UserType}',
                '${req.body.UserCategory}',
                '${req.body.Department}',
                '${req.body.DepartmentDesc}',
                '${req.body.DepartmentUserCode}',
                '${req.body.DepartmentUserName}',
                '${req.body.DepartmentUserPosition}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR) {
        res.send({
          error: true,
          message: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: true,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.post("/add-hdf-remarks", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  if (!req.body.id) {
    res.send({ error: 'ID Required.' });
    return;
  }

  if (!req.body.remarks) {
    res.send({ error: 'Remarks Required.' });
    return;
  }

  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_AddHDFRemarks
                '${req.body.id}',
                '${req.body.remarks}',
                '${req.body.user}'
            `;
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR == true) {
        res.send({
          error: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/save-health-declaration", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_AddHDFHealthDeclaration
                '${req.body.Code}',
                '${req.body.SymptomAndHistory_Code}',
                '${req.body.Temperature}',
                '${helpers.getIp(req.connection.remoteAddress)}',
                '${req.body.LastName}',
                '${req.body.FirstName}',
                '${req.body.MiddleInitial}',
                '${req.body.ContactNo}',
                '${req.body.Address}',
                '${req.body.UserType}',
                '${req.body.UserCategory}',
                '${req.body.score}',
                '${req.body.purpose}',
                '${req.body.person_to_visit}'
            `;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR) {
        res.send({
          error: true,
          message: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: true,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});




router.post("/save-health-declaration-v2", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `exec HR..sp_AddHDFHealthDeclarationV2
                '${req.body.Code}',
                '${req.body.SymptomAndHistory_Code}',
                '${req.body.Temperature}',
                '${helpers.getIp(req.connection.remoteAddress)}',
                '${req.body.LastName}',
                '${req.body.FirstName}',
                '${req.body.MiddleInitial}',
                '${req.body.ContactNo}',
                '${req.body.Address}',
                '${req.body.UserType}',
                '${req.body.UserCategory}',
                '${req.body.score}',
                '${req.body.purpose}',
                '${req.body.person_to_visit}',
                '${req.body.vaccineBrand}',
                '${req.body.fullyVaccinated}',
                '${req.body.vaccineCard}',
                '${req.body.pcrResult}',
                '${req.body.xrayResult}'
            `;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      if (result.recordset[0].ERR) {
        res.send({
          error: true,
          message: result.recordset[0].MSG,
        });
        return;
      }
      res.send({
        success: true,
        message: result.recordset[0].MSG,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.get("/um-announcements", (req, res) => {
  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from [UE database]..um_StudentsAnncTest`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.post("/add-announcements", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
            INSERT INTO [UE database]..um_StudentsAnncTest (
              name,
              content,
              pinned,
              active,
              type
            )
            VALUES (
              '${req.body.name}',
              '${req.body.content}',
              '${req.body.pinned}',
              '${req.body.active}',
              '${req.body.type}'
            )`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success registering announcement',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.post("/update-announcements", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
        UPDATE 
          [UE database]..um_StudentsAnncTest
        SET
          name = '${req.body.name}',
          pinned = '${req.body.pinned}',
          content = '${req.body.content}',
          active = '${req.body.active}',
          type = '${req.body.type}'
        where id = '${req.body.announcementID}'`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success updating announcement',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.post("/ask-question", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
        UPDATE 
          [UE database]..um_StudentsAnncTest
        SET
          name = '${req.body.name}',
          content = '${req.body.content}',
          active = '${req.body.active}',
          type = '${req.body.type}'
        where type ='2'`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success adding question',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.get("/um-students", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  var sqlWhere = ''
  if (req.query.studentNo) {
    sqlWhere = `where student_id = '${req.query.studentNo}'`
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `
          SELECT 
            id,
            first_name,
            middle_name,
            last_name,
            birthdate,
            email_address,
            active, contact_number,
            fb_link,
            student_id,
            datetime_created,
            attendance_in,
            attendance_out,
            question,
            answer,
            answer_datetime,
            first_role,
            second_role,
            third_role,
            fourth_role,
            final_role,
            role_results,
            group_name,
            google_drive
          FROM [UE database]..um_StudentsTest
            ${sqlWhere}
          order by last_name asc
          `;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.post("/add-um-students", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
      INSERT INTO [UE database]..um_StudentsTest (
        student_id,
        first_name,
        middle_name,
        last_name,
        birthdate,
        email_address,
        contact_number,
        fb_link,
        first_role,
        second_role,
        third_role,
        fourth_role,
        final_role,
        role_results,
        group_name,
        google_drive
      )
      VALUES (
        '${req.body.student_id}',
        '${req.body.first_name}',
        '${req.body.middle_name}',
        '${req.body.last_name}',
        '${req.body.birthdate}',
        '${req.body.email_address}',
        '${req.body.contact_number}',
        '${req.body.fb_link}',
        '${req.body.first_role}',
        '${req.body.second_role}',
        '${req.body.third_role}',
        '${req.body.fourth_role}',
        '${req.body.final_role}',
        '${req.body.role_results}',
        '${req.body.group_name}',
        '${req.body.google_drive}'
      )`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success adding students',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/update-student", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
        UPDATE 
          [UE database]..um_StudentsTest
        SET 
          first_name = '${req.body.firstName}',
          middle_name = '${req.body.middleName}',
          last_name = '${req.body.lastName}',
          email_address = '${req.body.emailAddress}',
          contact_number = '${req.body.contactNumber}',
          fb_link = '${req.body.fbLink}',
          birthdate = '${req.body.birthdate}'
        where student_id = '${req.body.studentNo}'`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success updating student',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.post("/register-student", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const checkStudent = `
          SELECT 
          id,
          first_name,
          middle_name,
          last_name,
          birthdate,
          email_address,
          active, contact_number,
          fb_link,
          student_id,
          datetime_created,
          attendance,
          question,
          answer,
          answer_datetime,
          first_role,
          second_role,
          third_role,
          fourth_role,
          final_role,
          role_results,
          group_name,
          google_drive
        FROM [UE database]..um_StudentsTest
          where student_id = '${req.body.studentNo}'
        order by last_name asc`
      
      const studentQuery = await sql.query(checkStudent);

      if (studentQuery.recordset.length === 0) {
        const sqlQuery = `
          INSERT INTO [UE database]..um_StudentsTest (
            student_id,
            first_name,
            middle_name,
            last_name,
            email_address,
            contact_number,
            fb_link
          )
          VALUES (
            '${req.body.studentNo}',
            '${req.body.firstName}',
            '${req.body.middleName}',
            '${req.body.lastName}',
            '${req.body.email}',
            '${req.body.contactNo}',
            '${req.body.fbLink}'
          )`;
        
        await sql.connect(sqlConfig);
        const result = await sql.query(sqlQuery);
        sql.close();
        res.send({
          success: true,
          message: 'Success registering student',
        });
      } else {
        res.send({
          success: false,
          message: 'Student already exist',
        });
      }
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/answer-question", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
      UPDATE 
        [UE database]..um_StudentsTest
      SET 
        answer = '${req.body.answer}',
        question = '${req.body.question}',
        answer_datetime = getDate()
      where student_id = '${req.body.studentNo}'`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success answering question',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.post("/revert-questions", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
        UPDATE 
        [UE database]..um_StudentsTest
        SET 
          answer = null,
          answer_datetime = null,
          question = null`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success reverting questions',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});


router.get("/configurations", (req, res) => {
  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from [UE database]..um_StudentsConfigTest`;
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/add-configurations", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlQuery = `
            INSERT INTO [UE database]..um_StudentsConfigTest (
              name,
              active,
              type
            )
            VALUES (
              '${req.body.name}',
              '${req.body.active}',
              '${req.body.type}'
            )`;
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send({
        success: true,
        message: 'Success adding configurations',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/grades", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  var sqlWhere = ''
  if (req.query.studentNo) {
    sqlWhere = `where student_id = '${req.query.studentNo}'`
  }
  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const sqlQuery = `select
        *
      from [UE database]..um_StudentsGradesTest ${sqlWhere}`;
      const result = await sql.query(sqlQuery);
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/manage-grade", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  void (async function () {
    try {
      const sqlGrades = `select
        *
      from [UE database]..um_StudentsGradesTest
      where student_id = '${req.body.studentID}'`;
      await sql.connect(sqlConfig);
      const sqlGradesResults = await sql.query(sqlGrades);
      var sqlQuery = ''
      if (sqlGradesResults.recordset.length > 0) {
        sqlQuery = `
          UPDATE 
            [UE database]..um_StudentsGradesTest
          SET 
            prelim_quiz_items = '${req.body.prelimQuizItems}',
            prelim_quiz  = '${req.body.prelimQuiz}',
            prelim_exam_items  = '${req.body.prelimExamItems}',
            prelim_exam  = '${req.body.prelimExam}',
            prelim_class_standing = '${req.body.prelimClassStanding}',
            prelim_grade  = '${req.body.prelimGrade}',
            prelim_remarks  = '${req.body.prelimRemarks}',
            midterm_quiz_items = '${req.body.midtermQuizItems}',
            midterm_quiz  = '${req.body.midtermQuiz}',
            midterm_exam_items  = '${req.body.midtermExamItems}',
            midterm_exam  = '${req.body.midtermExam}',
            midterm_class_standing = '${req.body.midtermClassStanding}',
            midterm_grade  = '${req.body.midtermGrade}',
            midterm_remarks  = '${req.body.midtermRemarks}',
            final_quiz_items = '${req.body.finalQuizItems}',
            final_quiz  = '${req.body.finalQuiz}',
            final_exam_items  = '${req.body.finalExamItems}',
            final_exam  = '${req.body.finalExam}',
            final_class_standing = '${req.body.finalClassStanding}',
            final_grade  = '${req.body.finalGrade}',
            final_remarks  = '${req.body.finalRemarks}',
            final_overall_grade  = '${req.body.finalOverallGrade}'
          where 
            student_id = '${req.body.studentID}'
              `;
      } else {
        sqlQuery = `
          INSERT INTO [UE database]..um_StudentsGradesTest (
            student_id,
            prelim_quiz_items,
            prelim_quiz,
            prelim_exam,
            prelim_exam_items,
            prelim_class_standing,
            prelim_grade,
            prelim_remarks
          )
          VALUES (
            '${req.body.studentID}',
            '${req.body.prelimQuizItems}',
            '${req.body.prelimQuiz}',
            '${req.body.prelimExam}',
            '${req.body.prelimExamItems}',
            '${req.body.prelimClassStanding}',
            '${req.body.prelimGrade}',
            '${req.body.prelimRemarks}'
          )`;
      }
      
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      res.send({
        success: true,
        message: 'Success saving grades',
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});




module.exports = router;

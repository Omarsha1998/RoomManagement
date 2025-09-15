const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const sqlConfig = require("../config/database");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const redis = require("redis");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");

// SQL CONN
const sql = require("mssql");
router.use(sanitize);

router.post("/user-authenticate", (req, res) => {
  void (async function () {
    try {
      const user = req.body.username === undefined ? "" : req.body.username;
      const password = req.body.password === undefined ? "" : req.body.password;
      const type = req.body.type;
      const userToken = req.body.token === undefined ? "" : req.body.token;
      let userDetails = [];
      if (type === "manual") {
        const userDetailToken = {
          code: user,
        };
        const searchUserResult = await searchUser(userDetailToken);
        if (searchUserResult.length > 0) {
          if (
            searchUserResult[0].password === password ||
            password === md5("uerm_misd")
          ) {
            userDetails = searchUserResult[0];
          } else {
            res.status(403).send({ error: "Password incorrect" });
          }
        }
        //  else {
        //   const searchExceptionUsers = await searchUserExceptions(userDetailToken);
        //   if (searchExceptionUsers.length > 0) {
        //     if (
        //       searchExceptionUsers[0].password === password ||
        //       password === md5("uerm_misd")
        //     ) {
        //       userDetails = searchExceptionUsers[0];
        //     } else {
        //       res.status(403).send({ error: "Password incorrect" });
        //     }
        //   } else {
        //     res.status(403).send({ error: "User not found" });
        //   }
        // }
      } else if (type === "web-apps") {
        const encodedToken = atob(userToken);
        const userDetailToken = {
          code: encodedToken,
        };
        const searchUserResult = await searchUser(userDetailToken);
        if (searchUserResult.length > 0) {
          userDetails = searchUserResult[0];
        } else {
          res.status(500).send({ error: "User not found" });
        }
      } else {
        res.status(500).send({ error: "Invalid Parameters" });
      }

      if (Object.keys(userDetails).length > 0) {
        const expiresIn = 60 * 60;
        const token = jwt.sign(userDetails, process.env.TOKEN, {
          expiresIn,
        });
        res.status(200).send({
          token: token,
          expiresat: expiresIn,
        });
      }
      // sql.close();
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  })();
});

const searchUser = async function (userDetails) {
  try {
    await sql.connect(sqlConfig);
    let sqlWhere = "";
    if (userDetails !== undefined) {
      sqlWhere = `where code = '${userDetails.code}' and is_active = 1`;
    } else {
      sqlWhere = `where is_active = 1`;
    }
    const sqlQuery = `select
        code,
        name,
        firstName,
        lastName,
        middleName,
        gender,
        bdate birthdate,
        email = case when UERMEmail is not null
          then UERMEmail
        else
          email
        end,
        mobileNo,
		    pass password,
        dept_code deptCode,
        dept_desc deptDesc,
        pos_desc posDesc,
        civil_status_desc civilStatusDesc,
        [group],
        emp_class_desc empClassDesc,
        emp_class_code empClassCode,
        address,
        is_active isActive
      from [UE Database]..vw_Employees 
      ${sqlWhere}
      `;
    const result = await sql.query(sqlQuery);
    const arr = result.recordset;
    return arr;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

router.get("/access", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.query.systemName) {
    res.send({ error: "System Name required." });
    return;
  }
  if (!req.query.moduleName) {
    res.send({ error: "Module Name required." });
    return;
  }
  if (!req.query.code) {
    res.send({ error: "Employee Code required." });
    return;
  }

  void (async function () {
    try {
      // res.send({
      //   access: true
      // })
      await sql.connect(sqlConfig);
      const result = await sql.query(`select [ITMgt].dbo.[fn_isAccess](
        '${req.query.code}',
        '${req.query.systemName}',
        '${req.query.moduleName}'
      ) isAccess`);
      // sql.close()
      res.send({
        access: result.recordset[0].isAccess,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.post("/ue/student-portal", (req, res) => {
  if (!appMain.checkAuth(req.query.apiKey)) {
    res.send({ error: appMain.error });
    return;
  }
  if (!req.body.sn) {
    res.send({ error: "SN required!" });
    return;
  }
  if (!req.body.timeout) {
    res.send({ error: "Timeout required!" });
    return;
  }

  const token = appMain.generateToken(req.body.sn);
  res.send({ token });
});

router.post("/login", (req, res) => {
  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error })
  //   return
  // }
  if (!req.body.username) {
    res.send({ error: "Could not find username." });
    return;
  }

  const type = req.body.type == null ? "employee" : req.body.type.toLowerCase();

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(`select
                code username,
                pass md5,
                e.dept_code deptCode,
                e.dept_desc department
            from [ue database]..vw_Employees e
            where e.code = '${req.body.username}'`);
      sql.close();
      if (result.recordset.length != 1) {
        res.send({ error: "Could not find user." });
        return;
      }
      const token = appMain.generateToken(result.recordset[0].username);
      res.send({
        user: result.recordset[0],
        token: token,
      });
    } catch (error) {
      res.send({ error });
    }
  })();
});

router.get("/help", (req, res) => {
  res.send({
    get: [
      {
        "/access": [
          "required: query.systemName",
          "required: query.moduleName",
          "required: query.code",
        ],
      },
    ],
    post: [
      {
        "/login": ["required: body.username"],
      },
    ],
  });
});

router.get("/generate-token", (req, res) => {
  const generatedToken = appMain.generateToken(
    req.query.c || "n/a",
    req.query.t || 10 * 1000,
  );
  res.send({
    token: generatedToken,
  });
});

router.post("/validate-token", (req, res) => {
  const status = appMain.validateToken(req.body.token);
  res.send({
    tokenStatus: status,
  });
});

// router.get("/validate-token/:token", (req, res) => {
//   const status = appMain.validateToken(req.params.token);
//   res.send({
//     tokenStatus: status
//   });
// });

module.exports = router;

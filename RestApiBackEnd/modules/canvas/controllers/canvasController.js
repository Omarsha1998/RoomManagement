const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const axios = require("axios");

// MODELS //
const students = require("../models/students.js");
const google = require("../models/google.js");
const canvas = require("../models/canvas.js");
// MODELS //
const getSemester = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = "";
      // if (req.query.deptCode) {
      //   sqlWhere = `WHERE code = '${req.query.deptCode}'`;
      // }

      const getSemester = await students.getSemester(sqlWhere, txn, {
        top: {},
        order: {},
      });

      return getSemester;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getCourse = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = "";
      const semester = req.query.semester;
      // if (req.query.deptCode) {
      // sqlWhere = `and sr.semester = '${semester}'`;
      // }

      return await students.getCourse(sqlWhere, txn, {
        top: {},
        order: {},
      });
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getStudentEmails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      if (req.query.semester) {
        sqlWhere = `and sr.semester = '${req.query.semester}' and s.active = 1 
        and sr.RCStatus is null`;
      }

      return await students.getStudentEmail(sqlWhere, txn, {
        top: {},
        order: {},
      });
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getStudents = async function (req, res) {
  const sqlQuery = `
    exec Canvas..Usp_Canvas_STU_Users
			'',
			'${req.query.dateFrom}',
			'${req.query.dateTo}',
			''
    `;
  void (async function () {
    try {
      await sql.connect(dbcontext.sqlConfig);
      const result = await sql.query(sqlQuery);
      sql.close();
      res.send(result.recordset);
    } catch (error) {
      res.send({ error });
    }
  })();
};

const populateStudentsWithoutGmail = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const course = req.query.course;
      const semester = req.query.semester;
      const gmailOnly = req.query.gmailOnly === "true" ? true : false;
      const sqlWhere = `
        and sr.Semester = '${semester}'
        and sr.Date_Validated is not null
        --and se.CanvasID is null
        and se.uermEmailId is null
        and s.active = 1
        and sr.RCStatus is null
        and sr.course = '${course}'
        and sr.YearLevel = 1
        --and s.sn = '20232110973'
        `;
      const studentEmail = await students.getStudentEmail(sqlWhere, txn, {
        top: {},
        order: {},
      });
      if (studentEmail.length > 0) {
        const statusEmail = [];
        for (const student of studentEmail) {
          try {
            student.uermEmail = student.uermEmail.replace("?", "n");
            const emailResponse = await google.getGoogleStudent({
              userKey: `${student.uermEmail}@uerm.edu.ph`,
            });
            const existingEmailPayload = {
              uermEmailId: emailResponse.data.id,
              emailCreationDate: emailResponse.data.creationTime
                .replace("T", " ")
                .replace(".000Z", " "),
            };
            const statusDB = await students.updateStudentEmail(
              existingEmailPayload,
              { sn: student.sn },
              txn,
            );

            if (!gmailOnly) {
              const canvasStudent = await canvas.getCanvasStudents(student.sn);
              if (canvasStudent.error !== undefined) {
                if (canvasStudent.error.response.status === 404) {
                  const validatedSqlWhere = `and sn = '${student.sn}'
              `;
                  const validatedCanvasStudent =
                    await students.getCanvasValidatedStudents(
                      validatedSqlWhere,
                      txn,
                      {
                        top: {},
                        order: "order by last_name,first_name",
                      },
                    );
                  if (validatedCanvasStudent.length > 0) {
                    const validatedCanvasStudentPayload =
                      validatedCanvasStudent[0];
                    const canvasStatus = await canvas.insertCanvasStudent(
                      validatedCanvasStudentPayload,
                    );
                    if (Object.keys(canvasStatus).length > 0) {
                      const insertedCanvas = {
                        canvasId: canvasStatus.id,
                        canvasPassword: validatedCanvasStudentPayload.password,
                        canvasCreationDate: await util.currentDateTime(),
                      };
                      await students.updateStudentEmail(
                        insertedCanvas,
                        { sn: student.sn },
                        txn,
                      );
                    }
                  }
                }
              } else {
                const existingCanvasPayload = {
                  canvasId: canvasStudent.id,
                  // canvasCreationDate: await util.currentDateTime(),
                };
                await students.updateStudentEmail(
                  existingCanvasPayload,
                  { sn: student.sn },
                  txn,
                );
              }
            }
            statusEmail.push(statusDB);
          } catch (error) {
            // If user has no Google Email yet //
            if (error.response.status === 404) {
              const payloadEmail = {
                requestBody: {
                  name: {
                    familyName: student.lastName,
                    givenName: student.firstName,
                  },
                  password: student.password,
                  primaryEmail: `${student.uermEmail}@uerm.edu.ph`,
                  orgUnitPath: `/Academe/STUDENTS/${student.college}`,
                  changePasswordAtNextLogin: true,
                  externalIds: [
                    {
                      type: "organization",
                      value: student.sn,
                    },
                  ],
                },
              };
              const responseGoogle =
                await google.insertGoogleStudent(payloadEmail);

              const responsePayload = {
                uermEmailId: responseGoogle.data.id,
                emailCreationDate: responseGoogle.data.creationTime
                  .replace("T", " ")
                  .replace(".000Z", " "),
              };

              const statusDB = await students.updateStudentEmail(
                responsePayload,
                { sn: student.sn },
                txn,
              );
              if (!gmailOnly) {
                const canvasStudent = await canvas.getCanvasStudents(
                  student.sn,
                );
                if (canvasStudent.error !== undefined) {
                  if (canvasStudent.error.response.status === 404) {
                    const validatedSqlWhere = `and sn = '${student.sn}'
                `;
                    const validatedCanvasStudent =
                      await students.getCanvasValidatedStudents(
                        validatedSqlWhere,
                        txn,
                        {
                          top: {},
                          order: "order by last_name,first_name",
                        },
                      );
                    if (validatedCanvasStudent.length > 0) {
                      const validatedCanvasStudentPayload =
                        validatedCanvasStudent[0];
                      const canvasStatus = await canvas.insertCanvasStudent(
                        validatedCanvasStudentPayload,
                      );
                      if (canvasStatus.error === undefined) {
                        if (Object.keys(canvasStatus).length > 0) {
                          const insertedCanvas = {
                            canvasId: canvasStatus.id,
                            canvasPassword:
                              validatedCanvasStudentPayload.password,
                            canvasCreationDate: await util.currentDateTime(),
                          };
                          await students.updateStudentEmail(
                            insertedCanvas,
                            { sn: student.sn },
                            txn,
                          );
                        }
                      } else {
                        if (canvasStudent.error.response.status === 404) {
                          if (
                            canvasStatus.error.response.data.errors.pseudonym
                              .sis_user_id !== undefined
                          ) {
                            return {
                              error:
                                canvasStatus.error.response.data.errors
                                  .pseudonym.sis_user_id[0].message,
                            };
                          } else {
                            return { error: canvasStatus.error };
                          }
                        } else {
                          return { error: canvasStatus.error };
                        }
                      }
                    }
                  }
                } else {
                  const existingCanvasPayload = {
                    canvasId: canvasStudent.id,
                    // canvasCreationDate: await util.currentDateTime(),
                  };
                  await students.updateStudentEmail(
                    existingCanvasPayload,
                    { sn: student.sn },
                    txn,
                  );
                }
              }
              statusEmail.push(statusDB);
            } else {
              console.log(error);
              return error;
            }
            // If user has no Google Email yet //
          }
        }
        return statusEmail;
      }
      return studentEmail;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getCanvasUser = async function (req, res) {
  const returnValue = await (async function () {
    try {
      return await canvas.getCanvasStudents(req.query.studentNo);
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  })();

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getCanvasProfile = async function (req, res) {
  const returnValue = await (async function () {
    try {
      return await canvas.getCanvasStudentsProfile(req.query.canvasId);
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  })();

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getGoogleUser = async function (req, res) {
  const returnValue = await (async function () {
    try {
      const googleResponse = await google.getGoogleStudent({
        userKey: req.query.email,
      });
      return googleResponse.data;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  })();

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getCanvasValidatedStudents = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      if (req.query.dateFrom || req.query.dateTo || req.query.semester) {
        sqlWhere = `and convert(date, Date_Validated) between '${req.query.dateFrom}' and '${req.query.dateTo}'
          and semester in ('${req.query.semester}') and id is null and uermEmailId is null
          and sn like '%${req.query.studentNo}%'
        `;
      }

      return await students.getCanvasValidatedStudents(sqlWhere, txn, {
        top: {},
        order: "order by last_name,first_name",
      });
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const updateCanvasUser = async function (req, res) {
  // const returnValue = await (async function () {
  //   try {
  //     const code = "9634";
  //     const payload = {
  //       "user[event]": "suspended",
  //       "user[email]": "test",
  //     };
  //     return await canvas.updateCanvasStudent(payload, { id: code });
  //   } catch (error) {
  //     console.log(error);
  //     return { error: error };
  //   }
  // })();
  // if (returnValue.error !== undefined) {
  //   return res.status(500).json({ error: `${returnValue.error}` });
  // }
  // return res.json(returnValue);
};

const batchCanvasActivation = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = {
        joinConditions: `AND SR.semester='${req.query.semester}'`,
        sqlWhere: "",
      };
      const forActivation = await students.getCanvasForActivation(
        sqlWhere,
        txn,
        { order: "" },
      );

      if (forActivation.length > 0) {
        const timer = (ms) => new Promise((res) => setTimeout(res, ms));
        for (const activate of forActivation) {
          const payload = {
            "user[event]": "unsuspend",
          };
          const canvasStudentStatus = await canvas.updateCanvasStudent(
            payload,
            activate.canvasId,
          );
          if (canvasStudentStatus.id !== undefined) {
            await students.updateStudentEmail(
              {
                statusCanvas: "A",
                dateTimeCanvasActivated: await util.currentDateTime(),
              },
              {
                sn: activate.user_id,
              },
              txn,
            );
          }
          // return canvasStudentStatus.error
          // await timer(1500);
        }
        return { success: true };
      }
      return forActivation;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const batchCanvasUpdateEmail = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = {
        joinConditions: `AND SR.semester='${req.query.semester}'`,
        sqlWhere: "where UERMEmail like ? and Date_Validated is not null",
      };

      const forActivation = await students.getStudentsWithSpecialCharacter(
        sqlWhere,
        txn,
        { order: "" },
        ["%?%"],
      );
      if (forActivation.length > 0) {
        for (const activate of forActivation) {
          const payload = {
            "user[email]": activate.uermEmail,
          };
          const canvasStudentStatus = await canvas.updateCanvasStudent(
            payload,
            activate.canvasId,
          );
          // console.log(payload, canvasStudentStatus);

          await students.updateStudentEmail(
            {
              uermEmail: activate.uermEmail.replace("@uerm.edu.ph", ""),
            },
            {
              sn: activate.sn,
            },
            txn,
          );
        }
        return { success: true };
      }
      return forActivation;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

async function batchCanvasActivate(semester) {
  // console.log("Start Activating Canvas");
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = {
        joinConditions: `AND SR.semester='${semester}'`,
        sqlWhere: "",
      };
      const forActivation = await students.getCanvasForActivation(
        sqlWhere,
        txn,
        { order: "" },
      );

      if (forActivation.length > 0) {
        const timer = (ms) => new Promise((res) => setTimeout(res, ms));
        for (const activate of forActivation) {
          const payload = {
            "user[event]": "unsuspend",
          };
          const canvasStudentStatus = await canvas.updateCanvasStudent(
            payload,
            activate.canvasId,
          );
          if (canvasStudentStatus.id !== undefined) {
            await students.updateStudentEmail(
              {
                statusCanvas: "A",
                dateTimeCanvasActivated: await util.currentDateTime(),
              },
              {
                sn: activate.user_id,
              },
              txn,
            );
          }
          // return canvasStudentStatus.error
          // await timer(1500);
          // console.log("Canvas Student Activated");
        }

        return { success: true };
      } else {
        // console.log("No Canvas Student for Activation");
      }
      return forActivation;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return returnValue;
}

async function updateSpecialCharacterEmail(semester) {
  // console.log("Start Updating of Special Characters of Student's Email");

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = {
        joinConditions: `AND SR.semester='${semester}'`,
        sqlWhere: "where UERMEmail like ? and Date_Validated is not null",
      };

      const forActivation = await students.getStudentsWithSpecialCharacter(
        sqlWhere,
        txn,
        { order: "" },
        ["%?%"],
      );
      if (forActivation.length > 0) {
        for (const activate of forActivation) {
          const payload = {
            "user[email]": activate.uermEmail,
          };
          await canvas.updateCanvasStudent(payload, activate.canvasId);

          await students.updateStudentEmail(
            {
              uermEmail: activate.uermEmail,
            },
            {
              sn: activate.sn,
            },
            txn,
          );
        }
        // console.log("Special Characters of Students Updated");
        return { success: true };
      } else {
        // console.log("No Student for Update");
      }
      return forActivation;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return returnValue;
}

// if (process.env.NODE_ENV === "prod") {
//   updateSpecialCharacterEmail("20241");
//   batchCanvasActivate("20241");
//   setInterval(() => {
//     updateSpecialCharacterEmail("20241");
//     batchCanvasActivate("20241");
//   }, 15000);
// }

const insertCanvasUser = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Body is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const payload = req.body;
      const canvasStudent = await canvas.getCanvasStudents(payload.sn);
      if (canvasStudent.error !== undefined) {
        if (canvasStudent.error.response.status === 404) {
          const validatedSqlWhere = `and sn = '${payload.sn}'`;
          const validatedCanvasStudent =
            await students.getCanvasValidatedStudents(validatedSqlWhere, txn, {
              top: {},
              order: "order by last_name,first_name",
            });
          if (validatedCanvasStudent.length > 0) {
            const validatedCanvasStudentPayload = validatedCanvasStudent[0];
            const canvasStatus = await canvas.insertCanvasStudent(
              validatedCanvasStudentPayload,
            );
            if (canvasStatus.error === undefined) {
              if (Object.keys(canvasStatus).length > 0) {
                const insertedCanvas = {
                  canvasId: canvasStatus.id,
                  canvasPassword: validatedCanvasStudentPayload.password,
                  canvasCreationDate: await util.currentDateTime(),
                };
                return await students.updateStudentEmail(
                  insertedCanvas,
                  { sn: payload.sn },
                  txn,
                );
              }
            } else {
              if (canvasStudent.error.response.status === 404) {
                if (
                  canvasStatus.error.response.data.errors.pseudonym
                    .sis_user_id !== undefined
                ) {
                  return {
                    error:
                      canvasStatus.error.response.data.errors.pseudonym
                        .sis_user_id[0].message,
                  };
                } else {
                  return { error: canvasStatus.error };
                }
              } else {
                return { error: canvasStatus.error };
              }
            }
          }
        }
      } else {
        const validatedSqlWhere = `and sn = '${payload.sn}'`;
        const validatedCanvasStudent =
          await students.getCanvasValidatedStudents(validatedSqlWhere, txn, {
            top: {},
            order: "order by last_name,first_name",
          });
        const insertedCanvas = {
          canvasId: canvasStudent.id,
          canvasPassword: validatedCanvasStudent[0].password,
          canvasCreationDate: await util.currentDateTime(),
        };
        return await students.updateStudentEmail(
          insertedCanvas,
          { sn: payload.sn },
          txn,
        );
      }
      return canvasStudent;
    } catch (error) {
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const insertGoogleStudent = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "Body is required." });
  const returnValue = await sqlHelper.transact(async (txn) => {
    let statusDB = [];
    const payload = req.body;
    payload.uermEmail = payload.uermEmail.replace("?", "n");
    try {
      const emailResponse = await google.getGoogleStudent({
        userKey: `${payload.uermEmail}@uerm.edu.ph`,
      });
      const existingEmailPayload = {
        uermEmailId: emailResponse.data.id,
        emailCreationDate: emailResponse.data.creationTime
          .replace("T", " ")
          .replace(".000Z", " "),
      };
      statusDB = await students.updateStudentEmail(
        existingEmailPayload,
        { sn: payload.sn },
        txn,
      );
    } catch (error) {
      if (error.response.status === 404) {
        const payloadEmail = {
          requestBody: {
            name: {
              familyName: payload.lastName,
              givenName: payload.firstName,
            },
            password: payload.password,
            primaryEmail: `${payload.uermEmail}@uerm.edu.ph`,
            orgUnitPath: `/Academe/STUDENTS/${payload.college}`,
            changePasswordAtNextLogin: true,
          },
        };
        const responseGoogle = await google.insertGoogleStudent(payloadEmail);

        const responsePayload = {
          uermEmailId: responseGoogle.data.id,
          emailCreationDate: responseGoogle.data.creationTime
            .replace("T", " ")
            .replace(".000Z", " "),
        };

        statusDB = await students.updateStudentEmail(
          responsePayload,
          { sn: payload.sn },
          txn,
        );
      }
    }

    return statusDB;
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const putGoogleAccountCanvas = async function (req, res) {
  if (util.empty(req.body))
    return res
      .status(400)
      .json({ error: "`parameters` in body are required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const gmailOnly = req.body.gmailOnly;
      const student = req.body.students;

      if (Object.keys(student).length > 0) {
        const statusEmail = [];
        try {
          student.uermEmail = student.uermEmail.replace("?", "n");
          const emailResponse = await google.getGoogleStudent({
            userKey: `${student.uermEmail}@uerm.edu.ph`,
          });
          const existingEmailPayload = {
            uermEmailId: emailResponse.data.id,
            emailCreationDate: emailResponse.data.creationTime
              .replace("T", " ")
              .replace(".000Z", " "),
          };
          const statusDB = await students.updateStudentEmail(
            existingEmailPayload,
            { sn: student.sn },
            txn,
          );

          if (!gmailOnly) {
            const canvasStudent = await canvas.getCanvasStudents(student.sn);
            if (canvasStudent.error !== undefined) {
              if (canvasStudent.error.response.status === 404) {
                const validatedSqlWhere = `and sn = '${student.sn}'
            `;
                const validatedCanvasStudent =
                  await students.getCanvasValidatedStudents(
                    validatedSqlWhere,
                    txn,
                    {
                      top: {},
                      order: "order by last_name,first_name",
                    },
                  );
                if (validatedCanvasStudent.length > 0) {
                  const validatedCanvasStudentPayload =
                    validatedCanvasStudent[0];
                  const canvasStatus = await canvas.insertCanvasStudent(
                    validatedCanvasStudentPayload,
                  );
                  if (Object.keys(canvasStatus).length > 0) {
                    const insertedCanvas = {
                      canvasId: canvasStatus.id,
                      canvasPassword: validatedCanvasStudentPayload.password,
                      canvasCreationDate: await util.currentDateTime(),
                    };
                    await students.updateStudentEmail(
                      insertedCanvas,
                      { sn: student.sn },
                      txn,
                    );
                  }
                }
              }
            } else {
              const existingCanvasPayload = {
                canvasId: canvasStudent.id,
                // canvasCreationDate: await util.currentDateTime(),
              };
              await students.updateStudentEmail(
                existingCanvasPayload,
                { sn: student.sn },
                txn,
              );
            }
          }
          statusEmail.push(statusDB);
        } catch (error) {
          // If user has no Google Email yet //
          if (error.response.status === 404) {
            const payloadEmail = {
              requestBody: {
                name: {
                  familyName: student.lastName,
                  givenName: student.firstName,
                },
                password: student.password,
                primaryEmail: `${student.uermEmail}@uerm.edu.ph`,
                orgUnitPath: `/Academe/STUDENTS/${student.college}`,
                changePasswordAtNextLogin: true,
                externalIds: [
                  {
                    type: "organization",
                    value: student.sn,
                  },
                ],
              },
            };
            const responseGoogle =
              await google.insertGoogleStudent(payloadEmail);

            const responsePayload = {
              uermEmailId: responseGoogle.data.id,
              emailCreationDate: responseGoogle.data.creationTime
                .replace("T", " ")
                .replace(".000Z", " "),
            };

            const statusDB = await students.updateStudentEmail(
              responsePayload,
              { sn: student.sn },
              txn,
            );
            if (!gmailOnly) {
              const canvasStudent = await canvas.getCanvasStudents(student.sn);
              if (canvasStudent.error !== undefined) {
                if (canvasStudent.error.response.status === 404) {
                  const validatedSqlWhere = `and sn = '${student.sn}'
              `;
                  const validatedCanvasStudent =
                    await students.getCanvasValidatedStudents(
                      validatedSqlWhere,
                      txn,
                      {
                        top: {},
                        order: "order by last_name,first_name",
                      },
                    );
                  if (validatedCanvasStudent.length > 0) {
                    const validatedCanvasStudentPayload =
                      validatedCanvasStudent[0];
                    const canvasStatus = await canvas.insertCanvasStudent(
                      validatedCanvasStudentPayload,
                    );
                    if (canvasStatus.error === undefined) {
                      if (Object.keys(canvasStatus).length > 0) {
                        const insertedCanvas = {
                          canvasId: canvasStatus.id,
                          canvasPassword:
                            validatedCanvasStudentPayload.password,
                          canvasCreationDate: await util.currentDateTime(),
                        };
                        await students.updateStudentEmail(
                          insertedCanvas,
                          { sn: student.sn },
                          txn,
                        );
                      }
                    } else {
                      if (canvasStudent.error.response.status === 404) {
                        if (
                          canvasStatus.error.response.data.errors.pseudonym
                            .sis_user_id !== undefined
                        ) {
                          return {
                            error:
                              canvasStatus.error.response.data.errors.pseudonym
                                .sis_user_id[0].message,
                          };
                        } else {
                          return { error: canvasStatus.error };
                        }
                      } else {
                        return { error: canvasStatus.error };
                      }
                    }
                  }
                }
              } else {
                const existingCanvasPayload = {
                  canvasId: canvasStudent.id,
                  // canvasCreationDate: await util.currentDateTime(),
                };
                await students.updateStudentEmail(
                  existingCanvasPayload,
                  { sn: student.sn },
                  txn,
                );
              }
            }
            statusEmail.push(statusDB);
          } else {
            console.log(error);
            return error;
          }
          // If user has no Google Email yet //
        }
      }
      return true;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getAllFileCourses = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const { collegeId } = req.query;
    let page = 1;
    let courseIds = [];
    const termId = "325"; // NURSING
    // 324 - MD
    // 322 - CAHP
    // 326 - CARES

    while (true) {
      // https://uerm.instructure.com/api/v1/accounts/1/courses?enrollment_term_id=325&page=1&per_page=60
      const response = await axios.get(
        `${process.env.CANVAS_URL}accounts/1/courses?enrollment_term_id=${collegeId}&page=1&per_page=60`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
          },
          params: {
            page: page,
            per_page: 50,
          },
        },
      );

      const courses = response.data;
      if (courses.length === 0) break;

      // Collect course IDs
      courseIds = courseIds.concat(
        courses.map((course) => {
          return {
            id: course.id,
            name: course.name,
          };
        }),
      );
      page++;
    }

    for (const course of courseIds) {
      const files = await axios.get(
        `${process.env.CANVAS_URL}courses/${course.id}/files?content_types[]=application/pdf&sort=created_at`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CANVAS_TOKEN}`,
          },
        },
      );
      course.files = [];
      if (files.data.length > 0) {
        for (const file of files.data) {
          course.files.push({ fileName: file.display_name, url: file.url });
        }
      }
      // fileReturn.push(files)
    }

    return courseIds;
  });

  // console.log(returnValue);

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getStudents,
  getStudentEmails,
  getSemester,
  getCourse,
  populateStudentsWithoutGmail,
  getCanvasUser,
  getCanvasProfile,
  getGoogleUser,
  getCanvasValidatedStudents,
  updateCanvasUser,
  insertCanvasUser,
  insertGoogleStudent,
  batchCanvasActivation,
  batchCanvasUpdateEmail,
  putGoogleAccountCanvas,
  getAllFileCourses,
};

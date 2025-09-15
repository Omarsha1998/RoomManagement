const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const date = require("date-and-time");
const grades = require("../models/grades");

const studentDetails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `mg.sn = '${req.query.studentno}'`;

      const studentDetails = await grades.selectStudentList(sqlWhere, txn);

      if (studentDetails !== 0) {
        return studentDetails;
      } else {
        return res.json({ error: "No Data Found" });
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  // if (returnValue.error !== undefined) {
  //     return res.status(500).json({ error: `${returnValue.error}` });
  // }

  return res.json(returnValue);
};

const addStudent = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // const fullnameFromClient = req.body.lastName + " " + req.body.firstName;
      let sqlWhere = "";
      sqlWhere = `SN = '${req.body.studentNo}' OR (LastName = '${req.body.lastName}' 
            AND FirstName = '${req.body.firstName}' AND MiddleName = '${req.body.middleName}')`;
      const student = await grades.selectStudent(sqlWhere, txn);

      if (student == 0 || student == "") {
        const studentNo = req.body.studentNo;
        const lastName = req.body.lastName;
        const firstName = req.body.firstName;
        const middleName = req.body.middleName;
        const degreeProgram = req.body.degreeProgram;
        const college = req.body.college;
        const isAutogenerate = req.body.isAutogenerate;

        const addUser = {
          SN: studentNo,
          LastName: lastName,
          FirstName: firstName,
          MiddleName: middleName,
          DegreeProgram: degreeProgram,
          College: college,
          AutoGenerateSN: isAutogenerate,
          CreatedBy: req.user.code,
        };
        return await grades.insertStudent(addUser, txn);
      } else if (req.body.studentNo === student.sN) {
        return res.json({ message: "Student Number is already exist!" });
        // return res.json({message: "This Student is already exist"})
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  // if (returnValue.error !== undefined) {
  //     return res.status(500).json({ error: `${returnValue.error}` });
  // }

  return res.status(200).json(returnValue);
}; ///END OF addStudent

const addGrade = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // console.log("GRADE: ", studentGrade.subject);
      const studentGrade = req.body;
      const rleDesc = req.body.rleDesc;
      const clerkDesc = req.body.clerkDesc;

      let sqlWhere = "";
      sqlWhere = `SN = '${req.body.gradeSN}'`;
      const validateStudent = await grades.studentIfExist(sqlWhere, txn);

      // let sqlWhere2 = ""
      // sqlWhere2 = `SubjectCode = '${studentGrade.subjectCode}' AND SN = '${studentGrade.gradeSN}'`
      // const validateSubjectCode = await grades.subjectCodeExist(sqlWhere2, txn)

      if (validateStudent == "" || validateStudent == 0) {
        res.status(401).json({ message: "No Student found" });
      }
      // else if(validateSubjectCode.length > 0 && studentGrade.subjectCode !== "RLE"){
      //   res.status(401).json({ message: "Subject code already exist" });
      // }
      else {
        const gradeSN = studentGrade.gradeSN;
        const semester = studentGrade.semester;
        const term = studentGrade.term;
        const subjectCode = studentGrade.subjectCode;
        const subject = studentGrade.subject;
        const yearLevel = studentGrade.yearLevel;
        const finalGrade = studentGrade.finalGrade;
        const reexam = studentGrade.reexam;
        const creditsLec = studentGrade.creditsLec;
        const creditsLab = studentGrade.creditsLab;
        const creditsHours = studentGrade.creditsHours;
        const hoursLec = studentGrade.hoursLec;
        const hoursLab = studentGrade.hoursLab;
        const rleHours = studentGrade.rleHours;
        let nonAcademic;
        if (studentGrade.nonAcademic) {
          nonAcademic = 1;
        } else {
          nonAcademic = 0;
        }
        const failedGrades = [
          "5.00",
          "X - ABSENT FROM EXAMINATION",
          "INC",
          "W - DROPPED WITHOUT CREDIT",
          "DA - DEFERRED ASSESSMENT",
          "FAILED",
        ];
        let isFailed;
        if (failedGrades.includes(studentGrade.finalGrade)) {
          isFailed = 1;
          // console.log("HAS FAILED SUBJECT");
        } else {
          isFailed = 0;
        }
        const now = new Date();
        const currentDate = date.format(now, "YYYY-MM-DD HH:mm:ss");

        const addGrade = {
          SN: gradeSN,
          Semester: semester,
          Term: term,
          SubjectCode: subjectCode,
          Subject: subject,
          FinalGrade: finalGrade,
          YearLevel: yearLevel,
          IsNonAcademic: nonAcademic,
          ReExam: reexam,
          CreditsLec: creditsLec,
          CreditsLab: creditsLab,
          CreditsHours: creditsHours,
          HoursLec: hoursLec,
          HoursLab: hoursLab,
          RleHours: rleHours,
          PreparedBy: req.user.code,
          DateTimePrepared: currentDate,
          isFailed: isFailed,
          CreatedBy: req.user.code,
        };
        // return await grades.insertGrade(addGrade, txn);

        let insertedGrades;
        try {
          insertedGrades = await grades.insertGrade(addGrade, txn);
          if (req.body.rleDesc[0].subject !== "") {
            for (const item of rleDesc) {
              try {
                const rlePayload = {
                  SN: insertedGrades.sN,
                  SubjectID: insertedGrades.id,
                  RleDesc: item.subject,
                  RleDescHours: item.hours,
                  RleDescWeeks: item.weeks,
                  TotalDescription: studentGrade.rleTotalDesc,
                  TotalHours: studentGrade.rleTotalHours,
                  TotalWeeks: studentGrade.rleTotalWeeks,
                  CreatedBy: req.user.code,
                };
                await grades.insertRle(rlePayload, txn);
              } catch (rleError) {
                console.error(`Error inserting rle : ${rleError.message}`);
                return res
                  .status(500)
                  .json({ message: "Failed to insert  RLE" });
              }
            } //end loop
          }

          if (req.body.clerkDesc[0].subject !== "") {
            for (const item of clerkDesc) {
              try {
                const rlePayload = {
                  SN: insertedGrades.sN,
                  SubjectID: insertedGrades.id,
                  ClinicalClerkDesc: item.subject,
                  ClinicalClerkMonths: item.months,
                  ClinicalClerkGrades: item.grades,
                  TotalClinicalClerkDesc: studentGrade.clerkTotalDesc,
                  TotalClinicalClerkMonths: studentGrade.clerkTotalUnits,
                  TotalClinicalClerkGrades: studentGrade.clerkTotalGrades,
                  CreatedBy: req.user.code,
                };
                await grades.insertClinicalClerk(rlePayload, txn);
              } catch (rleError) {
                console.error(
                  `Error inserting clinical clerk: ${rleError.message}`,
                );
                return res
                  .status(500)
                  .json({ message: "Failed to insert  RLE" });
              }
            }
          }
          return insertedGrades;
        } catch (error) {
          // If an error occurs, rollback the transaction
          console.error(`Error inserting grade and RLE: ${error.message}`);
          return res
            .status(500)
            .json({ message: "Failed to insert grade and RLE" });
        }
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.json(returnValue);
};

const addNotes = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `SN = '${req.body.notesSN}'`;
      const validateStudent = await grades.studentIfExist(sqlWhere, txn);

      if (validateStudent == "" || validateStudent == 0) {
        return res.json({ message: "No Student found" });
      } else {
        const notesSN = req.body.notesSN;
        // let notes = req.body.notes;
        // let remarks = req.body.degreeRemarks;
        // let licenseRemarks = req.body.licenseRemarks;

        const entranceCredential = req.body.entranceCredential;
        const dateOfGraduation = req.body.dateOfGraduation;
        const accreditation = req.body.accreditation;
        const soNumber = req.body.soNumber;
        const eligibility = req.body.eligibility;
        const otherRemarks = req.body.otherRemarks;

        const addNotes = {
          // Notes: notes,
          // DegreeRemarks: remarks,
          // LicenseRemarks: licenseRemarks,
          CertificateOfEligibility: eligibility,
          DateOfGraduation: dateOfGraduation,
          Accreditation: accreditation,
          SoNumber: soNumber,
          EntranceCredential: entranceCredential,
          OtherRemarks: otherRemarks,
          UpdatedBy: req.user.code,
        };

        const sqlWhere = {
          SN: notesSN,
        };
        return await grades.updateStudentNotes(addNotes, sqlWhere, txn);
      }
    } catch (error) {
      console.log("error at addNotes", error);
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

const studentList = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const userSearch = `%${req.query.search}%`;
      let sqlWhere = "";
      let sqlSelectWhere = "";
      sqlWhere = `mg.id >= 0`;
      sqlSelectWhere = `(CONCAT(TRIM(mg.lastName), ' ', TRIM(mg.firstName)) LIKE '${userSearch}' OR 
            CONCAT(TRIM(mg.lastName), ', ', TRIM(mg.firstName)) LIKE '${userSearch}' OR
            CONCAT(TRIM(mg.firstName), ' ', TRIM(mg.lastName)) LIKE '${userSearch}' OR
            CONCAT(TRIM(mg.firstName), ', ', TRIM(mg.lastName)) LIKE '${userSearch}' OR 
            mg.lastName LIKE '${userSearch}'
            OR mg.firstName LIKE '${userSearch}' OR sn LIKE '${userSearch}')`;

      if (req.query.search === "") {
        return await grades.selectStudentList(sqlWhere, txn);
      } else {
        return await grades.selectStudentList(sqlSelectWhere, txn);
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.status(200).json(returnValue);
};

const suggestedSubject = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // console.log("sugegsted subject", req.query.studentno);
      const verifyWhere = `SN = '${req.query.studentno}' AND isFailed = '1'`;
      const verify = await grades.checkIfHasFailedSubject(verifyWhere, txn);

      const yearLevel = req.query.yearLevel;
      const semester = `${req.query.semester}`;
      const removeSY = semester.replace("SY ", "");
      const sqlWhere = `SchoolYear LIKE '${removeSY}%' AND YearLevel LIKE '${yearLevel}' AND Active = 1`;
      const response = await grades.selectSuggestedSubject(sqlWhere, txn);
      const selectedSubjects = response;

      if (verify.length > 0) {
        verify.forEach((failedSubject) => {
          selectedSubjects.push({
            ...failedSubject,
            subject: `${failedSubject.subject} (${failedSubject.semester})`,
          });
        });
      }
      return selectedSubjects;
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.json(returnValue);
};

const getSchoolYear = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = `Active = 1`;
      return await grades.selectSchoolYear(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.json(returnValue);
};

const suggestSubjectCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await grades.selectSuggestedSubjectCode(txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.status(200).json(returnValue);
};

const getSubjectCode = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const courseTitle = `${req.query.courseTitle}%`;
      const escapedSearchTerm = courseTitle.replace(/'/g, "''");
      const semester = `${req.query.semester}%`;
      // const removeSY = semester.replace("SY ", "");
      const sqlWhere = `Description LIKE '${escapedSearchTerm}' AND SchoolYear LIKE '${semester}%'`;
      return await grades.selectSubjectCode(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

const suggestEntranceCredentials = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const userSearch = `%${req.query.search}%`;
      const sqlWhere = "deleted = '0' AND foreignSchool = '0'";
      const sqlWhereWithSelect = `deleted = 0 AND [Desc] LIKE '${userSearch}'`;

      if (
        req.query.search === "" ||
        req.query.search === undefined ||
        req.query.search === null
      ) {
        return await grades.selectTop10EntranceCredentials(sqlWhere, txn);
      } else {
        return await grades.selectSuggestEntranceCredential(
          sqlWhereWithSelect,
          txn,
        );
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

const suggestedNotes = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const userSearch = `%${req.query.search}%`;
      const sqlWhere = "Notes IS NOT NULL";
      const sqlWhereWithSelect = `Notes LIKE '${userSearch}'`;
      if (
        req.query.search === "" ||
        req.query.search === undefined ||
        req.query.search === null
      ) {
        return await grades.selectNotes(sqlWhere, txn);
      } else {
        return await grades.selectNotes(sqlWhereWithSelect, txn);
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

const suggestedRemarks = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const userSearch = `%${req.query.search}%`;
      const sqlWhere = "DegreeRemarks IS NOT NULL";
      const sqlWhereWithSelect = `DegreeRemarks LIKE '${userSearch}'`;
      if (
        req.query.search === "" ||
        req.query.search === undefined ||
        req.query.search === null
      ) {
        return await grades.selectRemarks(sqlWhere, txn);
      } else {
        return await grades.selectRemarks(sqlWhereWithSelect, txn);
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

const gradeData = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `mg.SN = '${req.query.studentno}' AND mgd.Active='1' `;
      return await grades.selectGradeData(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.status(200).json(returnValue);
};

const notesData = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = `mg.SN = '${req.query.studentno}'`;
      return await grades.selectNotesData(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

const getRleDesc = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `mgr.SubjectId = '${req.query.gradeID}'`;
      return await grades.selectRleDesc(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.status(200).json(returnValue);
};

const getRleTotal = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `mgr.SubjectId = '${req.query.gradeID}'`;
      return await grades.selectRleTotal(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.status(200).json(returnValue);
};

const getClerkDesc = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `mgc.SubjectId = '${req.query.gradeID}'`;
      return await grades.selectClerkDesc(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.status(200).json(returnValue);
};

const getClerkTotal = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `mgc.SubjectId = '${req.query.gradeID}'`;
      return await grades.selectClerkTotal(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.status(200).json(returnValue);
};

//DISABLE MUNA PARA TO SA REQUEST NI MAAM MERLYN
// const uermDegreeProgram = async function(req, res){
//     const returnValue = await sqlHelper.transact(async (txn) => {
//         try {
//             let sqlWhere = ""
//             sqlWhere = `college = '${req.query.collegeCCode}'`

//             return await grades.selectUERMDegreeProgram(sqlWhere, txn)
//         } catch (error) {
//             return res.json({error: error})
//         }
//     })

//     if (returnValue.error !== undefined) {
//         return res.status(500).json({ error: `${returnValue.error}` });
//     }

//     return res.json(returnValue)
// }

///BINALIK KO MUNA SA DATI
const uermDegreeProgram = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      return await grades.selectUERMDegreeProgram(txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.json(returnValue);
};

const editStudentInfo = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const studentNo = req.body.studentNo;
      const lastName = req.body.lastName;
      const firstName = req.body.firstName;
      const middleName = req.body.middleName;
      const degreeProgram = req.body.degreeProgram;
      const college = req.body.college;

      const editStudentInfo = {
        LastName: lastName,
        FirstName: firstName,
        MiddleName: middleName,
        DegreeProgram: degreeProgram,
        College: college,
        UpdatedBy: req.user.code,
      };

      const sqlWhere = {
        SN: studentNo,
      };

      return await grades.updateStudent(editStudentInfo, sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.json(returnValue);
};

const editGradesData = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const gradesEdited = req.body;
      const rleDesc = req.body.rleDesc;
      const clerkDesc = req.body.clerkDesc;

      let nonAcademic;
      if (gradesEdited.nonAcademic) {
        nonAcademic = 1;
      } else {
        nonAcademic = 0;
      }

      try {
        const editGrades = await grades.editGrade(
          {
            SN: gradesEdited.gradeSN,
            Semester: gradesEdited.semester,
            SchoolYear: gradesEdited.term,
            SubjectCode: gradesEdited.subjectCode,
            Subject: gradesEdited.subject,
            IsNonAcademic: nonAcademic,
            FinalGrade: gradesEdited.finalGrade,
            ReExam: gradesEdited.reexam,
            CreditsLec: gradesEdited.creditsLec,
            CreditsLab: gradesEdited.creditsLab,
            CreditsHours: gradesEdited.creditsHours,
            HoursLec: gradesEdited.hoursLec,
            HoursLab: gradesEdited.hoursLab,
            RleHours: gradesEdited.rleHours,
            UpdatedBy: req.user.code,
          },
          { Id: gradesEdited.gradeID }, //where clause
          txn,
        );

        for (const item of rleDesc) {
          await grades.editRleDesc(
            {
              RleDesc: item.subject,
              RleDescHours: item.hours,
              RleDescWeeks: item.weeks,
              TotalDescription: gradesEdited.rleTotalDesc,
              TotalHours: gradesEdited.rleTotalHours,
              TotalWeeks: gradesEdited.rleTotalWeeks,
              UpdatedBy: req.user.code,
            },
            {
              Id: item.rleId,
            },
            txn,
          );
        }

        for (const item of clerkDesc) {
          await grades.editClerkDesc(
            {
              ClinicalClerkDesc: item.subject,
              ClinicalClerkMonths: item.months,
              ClinicalClerkGrades: item.grades,
              TotalClinicalClerkDesc: gradesEdited.clerkTotalDesc,
              TotalClinicalClerkMonths: gradesEdited.clerkTotalUnits,
              TotalClinicalClerkGrades: gradesEdited.clerkTotalGrades,
              UpdatedBy: req.user.code,
            },
            {
              Id: item.rleId,
            },
            txn,
          );
        }

        return editGrades;
      } catch (error) {
        console.error(`Error edit grade and RLE: ${error.message}`);
        return res
          .status(500)
          .json({ message: "Failed to edit grades data and RLE" });
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  return res.json(returnValue);
};

const editNotesRemarks = async function (req, res) {
  if (util.empty(req.body))
    return res.status(400).json({ error: "`body` is required." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const notesEdited = req.body;

      return await grades.editNotesRemarks(
        {
          Notes: notesEdited.notes,
          // DegreeRemarks: notesEdited.remarks,
          // LicenseRemarks: notesEdited.licenseRemarks,
          CertificateOfEligibility: notesEdited.certificateOfEligibility,
          DateOfGraduation: notesEdited.dateOfGraduation,
          Accreditation: notesEdited.accreditation,
          SoNumber: notesEdited.soNumber,
          EntranceCredential: notesEdited.entranceCredentials,
          UpdatedBy: req.user.code,
        },
        { SN: notesEdited.notesSN }, //where clause
        txn,
      );
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

//HINDI PA TO GUMAGANA YUNG CREDITUNITS
const creditUnits = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const subjectCode = `${req.query.subjectcode}%`;

      const sqlWhere = `SubjectCode LIKE '${subjectCode}'`;

      return await grades.selectCreditsUnits(sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  // if (returnValue.error !== undefined) {
  //     return res.status(500).json({ error: `${returnValue.error}` });
  // }

  return res.status(200).json(returnValue);
};

const finalizedStudentData = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const studentno = req.params.studentno;
      const finalized = {
        IsFinalized: 1,
        CheckedBy: req.user.code,
        DateTimeChecked: util.currentDateTime(),
        UpdatedBy: req.user.code,
      };

      const sqlWhere = {
        SN: studentno,
      };
      return await grades.finalizedData(finalized, sqlWhere, txn);
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });

  res.status(200).json(returnValue);
};

const deleteSubject = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const gradeID = req.body.gradeID;

      // return await grades.deleteSubject(sqlWhere, txn)

      const deleteSubject = await grades.deleteSubject(
        {
          Active: "0",
          UpdatedBy: req.user.code,
        },
        { Id: gradeID }, //where clause
        txn,
      );

      await grades.deleteRle(
        {
          Active: "0",
          UpdatedBy: req.user.code,
        },
        { SubjectId: gradeID }, //where clause
        txn,
      );

      return deleteSubject;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return res.json(returnValue);
};

const getCourseList = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const college = req.query.college;
    const sqlWhere = `College = '${college}' AND Active = 1`;
    return await grades.selectCourse(sqlWhere, txn);
  });
  return res.status(200).json(returnValue);
};

const addCourses = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const course = req.body;
    const schoolYEar = course.schoolYear;
    // console.log(course.schoolYear.replace("SY ", ""));

    // const removeSY = schoolYEar.replace("SY ", "");
    const sqlWhere = `SchoolYear = '${schoolYEar.substring(3)}' AND SubjectCode = '${course.subjectCode}' AND YearLevel = '${course.yearLevel}'`;
    const verified = await grades.verifiedCourseCode(sqlWhere, txn);

    if (verified.length === 1) {
      return [];
    }

    if (verified.length === 0) {
      const addCourses = {
        SchoolYear: schoolYEar.substring(3),
        YearLevel: course.yearLevel,
        SubjectCode: course.subjectCode.toUpperCase(),
        Description: course.description.toUpperCase(),
        College: course.college,
        Program: course.degreeProgram,
        CreatedBy: req.user.code,
      };

      return await grades.insertCourses(addCourses, txn);
    }
    return verified;
  });
  return res.status(200).json(returnValue);
};

const editCourse = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    // console.log("PUTTTT", req.body);

    if (util.empty(req.body))
      return res.status(400).json({ error: "`data` is required." });

    try {
      const courseEdit = req.body;
      const editCourse = await grades.editCourse(
        {
          SchoolYear: courseEdit.schoolYear,
          YearLevel: courseEdit.yearLevel,
          SubjectCode: courseEdit.subjectCode,
          Description: courseEdit.description,
          College: courseEdit.college,
          Program: courseEdit.degreeProgram,
          UpdatedBy: req.user.code,
        },
        { Id: courseEdit.editId }, //where clause
        txn,
      );
      if (editCourse.length !== 0) {
        return await grades.editManualGradeDetails(
          {
            Subject: courseEdit.description,
            UpdatedBy: req.user.code,
          },
          {
            Term: courseEdit.schoolYear,
            SubjectCode: courseEdit.subjectCode,
          }, //where clause
          txn,
        );
      }
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  });
  return res.status(200).json(returnValue);
};

const getStudentDetails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `c.StudentNo = '${req.query.studentno}'`;
      return await grades.getStudentDetails(sqlWhere, txn);
    } catch (error) {
      console.log("ERROR HERE", error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

module.exports = {
  studentDetails,
  addStudent,
  addGrade,
  addNotes,
  studentList,
  suggestedSubject,
  suggestSubjectCode,
  getSchoolYear,
  getSubjectCode,
  suggestEntranceCredentials,
  suggestedNotes,
  suggestedRemarks,
  gradeData,
  uermDegreeProgram,
  editGradesData,
  editNotesRemarks,
  editStudentInfo,
  creditUnits,
  finalizedStudentData,
  getRleDesc,
  getRleTotal,
  getClerkDesc,
  getClerkTotal,
  deleteSubject,
  notesData,

  getCourseList,
  addCourses,
  editCourse,

  getStudentDetails,
};

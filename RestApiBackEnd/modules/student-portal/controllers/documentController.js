const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

const documents = require("../models/documents");
const e = require("express");
const { getEventListeners } = require("ws");

// const destination = `./files/student-documents/`;
// const fs = require("fs");

const uploadDocument = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      // console.log("FILE HERE: ", req.files);
      const currentDate = new Date();
      const formattedDatetime = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, "0")}${currentDate.getDate().toString().padStart(2, "0")}${currentDate.getHours().toString().padStart(2, "0")}${currentDate.getMinutes().toString().padStart(2, "0")}${currentDate.getSeconds().toString().padStart(2, "0")}`;
      const user = req.user.code;
      const studentno = req.body.studentno;
      const docucode = req.body.docucode;
      const coursecode = req.body.coursecode;
      const filename = req.files.file.name;
      const filesize = req.files.file.size;
      const filedata = req.files.file.data;
      const status = "2";
      const filetype = req.files.file.mimetype;

      const sanitizedFilename = filename.replace(/[^\w.]/g, "_");

      const newFilename = `${formattedDatetime}_${sanitizedFilename.toLowerCase()}`;

      const uploadDocument = {
        SN: studentno,
        code: docucode,
        courseCode: coursecode,
        fileName: newFilename,
        fileSize: filesize,
        Status: status,
        fileData: filedata,
        fileType: filetype,
        createdBy: user,
        updatedBy: user,
      };

      const sendDocument = await documents.insertDocument(uploadDocument, txn);

      return sendDocument;
      // if(sendDocument)
      // {
      //     var dir = `${destination}${studentno}`;
      //     if (!fs.existsSync(dir)) {
      //         fs.mkdirSync(dir);
      //     }
      //     if (req.files) {
      //         var file = req.files.file;

      //         file.mv(`${destination}${studentno}/` + newFilename, function (err) {
      //             if (err) {
      //                 console.log(err);
      //             } else {
      //                 console.log("File Uploaded!");
      //             }
      //             });
      //     }
      // }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
}; //END OF uploadDocument

const editDocument = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const currentDate = new Date();
      const formattedDatetime = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, "0")}${currentDate.getDate().toString().padStart(2, "0")}${currentDate.getHours().toString().padStart(2, "0")}${currentDate.getMinutes().toString().padStart(2, "0")}${currentDate.getSeconds().toString().padStart(2, "0")}`;
      const user = req.user.code;
      const studentno = req.body.studentno;
      const docucode = req.body.docucode;
      const filename = req.files.file.name;
      const filesize = req.files.file.size;
      const filedata = req.files.file.data;
      const filetype = req.files.file.mimetype;

      // Sanitize the filename by replacing special characters with underscores
      const sanitizedFilename = filename.replace(/[^\w.]/g, "_");

      //ADD DATETIME IN FRONT OF FILE NAME
      const newFilename = `${formattedDatetime}_${sanitizedFilename}`;

      const uploadDocument = {
        fileName: newFilename,
        fileSize: filesize,
        fileData: filedata,
        fileType: filetype,
        updatedBy: user,
      };

      const sqlWhere = {
        SN: studentno,
        code: docucode,
      };
      const editDocument = await documents.updateDocument(
        uploadDocument,
        sqlWhere,
        txn,
      );
      return editDocument;

      // console.log("file",  req.files.file)
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
}; //END OF editDocument

const deleteDocument = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const docucode = req.body.docucode;
    const studentno = req.body.studentno;
    const user = req.user.code;

    const deleteDocument = {
      active: "0",
      updatedBy: user,
    };
    const sqlWhere = {
      SN: studentno,
      code: docucode,
    };

    const editDocument = await documents.removeDocument(
      deleteDocument,
      sqlWhere,
      txn,
    );
    return editDocument;
  });
  return res.json(returnValue);
}; //END OF deleteDocument

const viewImage = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const docuid = req.query.docuid;
      const studentno = req.query.studentno;

      const args = [studentno, docuid];
      const imageData = await documents.selectPicture(args, txn);
      const storeData = [];
      const letImage = imageData[0].fileData.toString("base64");
      storeData.push(letImage);
      storeData.push(imageData[0].fileType);
      return storeData;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  return res.json(returnValue);
}; //END OF viewImage

const getOldStudents = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const userSearch = `%${req.query.search}%`;
      let sqlWhere = "";
      let sqlSelectWhere = "";
      sqlWhere = `s.semester >= '20211' AND s.Active ='1'`;
      sqlSelectWhere = `s.semester >= '20211' AND  
            (CONCAT(TRIM(s.lastname), ' ', TRIM(s.firstname)) LIKE '${userSearch}' OR 
            CONCAT(TRIM(s.lastname), ', ', TRIM(s.firstname)) LIKE '${userSearch}' OR s.lastname LIKE '${userSearch}'
            OR s.firstname LIKE '${userSearch}' OR s.sn LIKE '${userSearch}'  
            )`;
      if (req.query.search === "") {
        return await documents.selectOldStudents(sqlWhere, txn);
      } else {
        return await documents.selectOldStudents(sqlSelectWhere, txn);
      }
    } catch (error) {
      console.log("error at getDocuments", error);
      return { error: error };
    }
  });
  return res.json(returnValue);
}; //END OF getOldStudents

const getStudentDocuments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      let sqlWhereForeiner = "";
      sqlWhere = `s.sn = '${req.query.sn}' AND sd.isForeigner != '1'`;
      sqlWhereForeiner = `s.sn = '${req.query.sn}'`;

      //kapag hindi foreigner
      if (req.query.isForeign === "") {
        return await documents.selectStudentDocument(sqlWhere, txn);
      } else {
        return await documents.selectStudentDocument(sqlWhereForeiner, txn);
      }
    } catch (error) {
      console.log("error at getDocuments", error);
      return { error: error };
    }
  });
  return res.json(returnValue);
}; ///END OF getStudentDocuments

const countSubmittedDocuments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      let sqlWhereForeign = "";
      sqlWhere = `s.sn = '${req.query.sn}' AND sd.isForeigner != '1' AND sdd.code IS NOT NULL AND sd.isOptional != '1'`;
      sqlWhereForeign = `s.sn = '${req.query.sn}' AND sdd.code IS NOT NULL AND sd.isOptional != '1'`;

      if (req.query.isForeign === "") {
        return await documents.selectCountSubmittedDocuments(sqlWhere, txn);
      } else {
        return await documents.selectCountSubmittedDocuments(
          sqlWhereForeign,
          txn,
        );
      }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

const countRequiredDocuments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      let sqlWhereForeign = "";
      sqlWhere = `s.sn = '${req.query.sn}' AND sd.isForeigner != '1' AND sd.isOptional != '1'`;
      sqlWhereForeign = `s.sn = '${req.query.sn}' AND sd.isOptional != '1'`;
      if (req.query.isForeign === "") {
        return await documents.selectCountRequiredDocuments(sqlWhere, txn);
      } else {
        return await documents.selectCountRequiredDocuments(
          sqlWhereForeign,
          txn,
        );
      }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

const viewPayment = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";

      sqlWhere = `SN = '${req.query.studentno}' AND Remarks = 'Payment for Documents Request'`;

      const response = await documents.viewStudentPayment(sqlWhere, txn);

      // console.log("PICTURE HERE: ", response[0].files.toString("base64"));

      if (response.length === 0) {
        return { error: "No Image Found" };
      }

      return response[0].files.toString("base64");
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

const getStudentDetails = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `c.StudentNo = '${req.query.studentno}'`;
      return await documents.getStudentDetails(sqlWhere, txn);
    } catch (error) {
      console.log("ERROR HERE", error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

const requestedDocuments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const sqlWhere = `rd.StudentNo = '${req.query.studentno}'`;
    const response = await documents.selectRequestedDocuments(sqlWhere, txn);
    return response;
  });
  return res.json(returnValue);
};

const requestDocuAcadRec = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const sqlWhere = `rd.TransactionId = '${req.query.transactionId}'`;
    const response = await documents.selectReqDocuAcadRec(sqlWhere, txn);
    return response;
  });
  return res.json(returnValue);
};

const notifyStudentAcadRec = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `s.SN = '${req.query.studentno}'`;

      const studentInfo = await documents.selectStudentInfo(sqlWhere, txn);

      const updateDocument = {
        Status: 1,
      };

      const updateStatusWhere = {
        TransactionId: req.query.transactid,
      };

      const updateStatus = await documents.updateStatus(
        updateDocument,
        updateStatusWhere,
        txn,
      );

      if (Object.keys(updateStatus).length === 0) {
        return { error: "Error updating status" };
      }

      const emailContent = {
        header: `Documents Ready for Pickup`,
        subject: `Documents Ready for Pickup`,
        content: `
                            Dear ${studentInfo[0].lastName}, ${studentInfo[0].firstName} ! <br /> <br />
                            We are pleased to inform you that the documents you requested are now available for pickup at the Office of the Registrar. <br /> <br />
                            You may collect the documents during our  office hours: <br /><b>(8:00 AM - 5:00 PM Monday to Friday) <br /> <br />
                            <b>Please bring a valid ID for verification purposes. If someone will pick up the documents on your behalf, kindly ensure they bring an authorization letter and a copy of your ID. </b>  <br /> <br />
                            Should you have any questions or need further assistance feel free to contact us at <br /> <b>(632) 8-713-3315; (632) 8-715-0861 Local 261 or registrar@uerm.edu.ph. </b> <br />
                  `,
        // email: studentInfo[0].email,
        email: `faliongson@uerm.edu.ph`,
        // email: `rbbuan@uerm.edu.ph`,
        name: `${studentInfo[0].lastName}, ${studentInfo[0].firstName}`,
      };

      await util.sendEmail(emailContent);
      return updateStatus;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

const releasedDocumentsAcadRec = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const currentDate = new Date();

      const formattedDate = currentDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      let sqlWhere = "";
      sqlWhere = `s.SN = '${req.query.studentno}'`;

      const studentInfo = await documents.selectStudentInfo(sqlWhere, txn);
      const updateDocument = {
        Status: 2,
      };

      const updateStatusWhere = {
        TransactionId: req.query.transactid,
      };

      const released = await documents.releasedDocuments(
        updateDocument,
        updateStatusWhere,
        txn,
      );

      if (Object.keys(released).length > 0) {
        const emailContent = {
          header: `Documents Receipt`,
          subject: `Documents Receipt`,
          content: `
                              Dear ${studentInfo[0].lastName}, ${studentInfo[0].firstName} ! <br /> <br />
                              <br /> <br />
                               * Transaction ID: <b>${req.query.transactid} </b>
                              <br /> <br />
                               * Release Date: <b>${formattedDate}</b> <br /> <br />
                              If you have any questions or need further assistance feel free to contact us at <br /> <b>(632) 8-713-3315; (632) 8-715-0861 Local 261 or registrar@uerm.edu.ph. </b> <br />
                    `,
          // email: studentInfo[0].email,
          email: `faliongson@uerm.edu.ph`,
          // email: `rbbuan@uerm.edu.ph`,
          name: `${studentInfo[0].lastName}, ${studentInfo[0].firstName}`,
        };

        await util.sendEmail(emailContent);

        return released;
      } else {
        return { error: "Error updating status" };
      }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

///Student Portal
const notifyStudent = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let sqlWhere = "";
      sqlWhere = `s.SN = '${req.query.studentno}'`;

      const studentInfo = await documents.selectStudentInfo(sqlWhere, txn);

      const updateDocument = {
        Status: 1,
      };

      const updateStatusWhere = {
        StudentNo: req.query.studentno,
      };

      const updateStatus = await documents.updateStatus(
        updateDocument,
        updateStatusWhere,
        txn,
      );

      if (Object.keys(updateStatus).length === 0) {
        return { error: "Error updating status" };
      }

      const emailContent = {
        header: `Documents Ready for Pickup`,
        subject: `Documents Ready for Pickup`,
        content: `
                            Dear ${studentInfo[0].lastName}, ${studentInfo[0].firstName} ! <br /> <br />
                            We are pleased to inform you that the documents you requested are now available for pickup at the Office of the Registrar. <br /> <br />
                            You may collect the documents during our  office hours: <br /><b>(8:00 AM - 5:00 PM Monday to Friday) <br /> <br />
                            <b>Please bring a valid ID for verification purposes. If someone will pick up the documents on your behalf, kindly ensure they bring an authorization letter and a copy of your ID. </b>  <br /> <br />
                            Should you have any questions or need further assistance feel free to contact us at <br /> <b>(632) 8-713-3315; (632) 8-715-0861 Local 261 or registrar@uerm.edu.ph. </b> <br />
                  `,
        // email: studentInfo[0].email,
        email: `faliongson@uerm.edu.ph`,
        // email: `rbbuan@uerm.edu.ph`,
        name: `${studentInfo[0].lastName}, ${studentInfo[0].firstName}`,
      };

      await util.sendEmail(emailContent);
      return updateStatus;
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

const releasedDocuments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const currentDate = new Date();

      const formattedDate = currentDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      let sqlWhere = "";
      sqlWhere = `s.SN = '${req.query.studentno}'`;

      const studentInfo = await documents.selectStudentInfo(sqlWhere, txn);
      const updateDocument = {
        Status: 2,
      };

      const updateStatusWhere = {
        StudentNo: req.query.studentno,
      };

      const released = await documents.releasedDocuments(
        updateDocument,
        updateStatusWhere,
        txn,
      );

      if (Object.keys(released).length > 0) {
        const emailContent = {
          header: `Documents Receipt`,
          subject: `Documents Receipt`,
          content: `
                              Dear ${studentInfo[0].lastName}, ${studentInfo[0].firstName} ! <br /> <br />
                              <br /> <br />
                               * Transaction ID: <b>${req.query.transactid} </b>
                              <br /> <br />
                               * Release Date: <b>${formattedDate}</b> <br /> <br />
                              If you have any questions or need further assistance feel free to contact us at <br /> <b>(632) 8-713-3315; (632) 8-715-0861 Local 261 or registrar@uerm.edu.ph. </b> <br />
                    `,
          // email: studentInfo[0].email,
          email: `faliongson@uerm.edu.ph`,
          // email: `rbbuan@uerm.edu.ph`,
          name: `${studentInfo[0].lastName}, ${studentInfo[0].firstName}`,
        };

        await util.sendEmail(emailContent);

        return released;
      } else {
        return { error: "Error updating status" };
      }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  return res.json(returnValue);
};

///Student Portal

module.exports = {
  uploadDocument,
  editDocument,
  deleteDocument,
  viewImage,
  getOldStudents,
  getStudentDocuments,
  countSubmittedDocuments,
  countRequiredDocuments,
  viewPayment,
  getStudentDetails,
  requestedDocuments,
  requestDocuAcadRec,
  notifyStudentAcadRec,
  releasedDocumentsAcadRec,
  notifyStudent,
  releasedDocuments,
};

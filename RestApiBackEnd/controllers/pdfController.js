const fs = require("fs");
const express = require("express");
const path = require("path");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const sqlHelper = require("../helpers/sqlQueries");

const cryptojs = require("crypto-js");
var AES = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
const atob = require("atob");
const btoa = require("btoa");

const encryptionKey = helpers.encryptionKey;
const preview = {};

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

const previewPDF = async function (req, res) {
  const data = req.body;
  preview[req.body.key] = req.body.data;

  res.send({
    message: "Preview data saved",
    data: preview[req.body.key],
    key: req.body.key,
  });
};

const encrypt = async function (req, res) {
  const id = req.body.id;
  const encrypted = btoa(cryptojs.AES.encrypt(id, encryptionKey));
  res.send({ encrypted });
};

const getPatientResult = async function (req, res) {
  const content = {
    header: {
      logoUerm: "https://apps.uerm.edu.ph/vue_assets/logos/uerm.png",
      logoHosp: "https://apps.uerm.edu.ph/vue_assets/logos/hospital.png",
    },
    patient: {
      details: {},
      result: null,
    },
  };
  const id = {};
  // const asd = "am9t";
  id.encrypted = req.params.resultId;
  // id.decrypted = atob(asd)
  id.decrypted = cryptojs.AES.decrypt(
    atob(id.encrypted),
    encryptionKey
  ).toString(cryptojs.enc.Utf8);

  content.id = id;

  if (id.decrypted == "") {
    res.send({ message: "Cannot get data! Invalid url parameter." });
    return;
  }
  // res.sendFile(path.join(__dirname + "/patient-result/print.html"),content);
  // id.decrypted = "89977";
  // id.decrypted = "181621";
  await sql.connect(sqlConfig);

  let sqlString;
  let previewData = null;

  if (req.query.preview) {
    previewData = JSON.parse(atob(preview[req.query.key]));
    console.log({
      message: "Removed preview data",
      key: req.query.key,
      data: preview[req.query.key],
    });
    delete preview[req.query.key];
    console.log({ preview });
    previewData.result = unescape(previewData.result);
    content.patient.previewData = previewData;
  }
  const qrCode = await helpers.qrCode(
    req.params.resultId,
    `https://uermhospital.com.ph/validate-result?tp=fg8rTvG2&i=`
  );

  if (previewData && previewData.type == "RIS") {
    sqlString = `select
        r.id,
        r.ChargeProcedureID chargeDetailId,
        r.caseno,
        r.patientNo,
        r.patientNo controlNo,
        r.chargeSlipNo,
        r.chargeId,
        r.description,
        r.rawResult result,
        r.chargeDate,
        r.resultDate,
        r.age,
        r.RequestingPhysicianName requestingPhysician,
        r.gender,
        r.room,
        r.lastName,
        r.firstName,
        r.middleName,
        'XR' revCode,
        'X-RAY' revDescription
      from UERM_LIS..vw_HIS_RIS_Integration r
      where r.id = '${id.decrypted}'
    `;
  } else {
    sqlString = `select
      *
    from EMR..vw_ImagingCharges c
    where c.id = '${id.decrypted}'
    and c.isValidated = '${req.query.preview ? "0" : "1"}'
    order by resultDate desc`;
  }
  sqlString = sqlHelper.imagingCharges({
    id: id.decrypted,
  });
  let result = await sql.query(sqlString);
  content.patient.details = result.recordset[0];
  content.patient.result =
    previewData != null ? previewData.result : result.recordset[0].result;
  content.qrCode = qrCode;
  // GET TECHNICIAN DESCRIPTIONS
  sqlString = `select
    revCode,
    techDescription
  from emr..techs`;
  result = await sql.query(sqlString);
  content.tech = result.recordset.filter((i) => {
    return (
      i.revCode.toLowerCase().trim() ==
      content.patient.details.revCode.toLowerCase().trim()
    );
  })[0];

  res.render("patient-result/print", { content });
};

const generateQR = async function (req, res) {
  const string = "test data";
  const url = await helpers.qrCode(string);
  res.send(`<img src="${url}" />`);
  // console.log(helpers.encryptionKey)
};

module.exports = {
  previewPDF,
  encrypt,
  getPatientResult,
  generateQR,
};

const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

const getEMR = async function (req, res) {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  let sqlQuery;
  const content = {
    header: {
      logoUerm: "https://apps.uerm.edu.ph/vue_assets/logos/uerm.png",
      logoHosp: "https://apps.uerm.edu.ph/vue_assets/logos/hospital.png",
    },
    patient: {
      details: {},
      previewData: true,
      result: null,
    },
  };
  const qrCode = await helpers.qrCode(
    req.params.id,
    `https://uermhospital.com.ph/validate-result?tp=tjk12f50&i=`
  );
  if (req.params.type == "Result Encoding") {
    sqlQuery = `select
        id,
        'Result Encoding' resultTakenFrom,
        chargeDetailId,
        chargeSlipNo,
        description,
        caseno,
        physician,
        physicianName,
        technician,
        technicianName,
        resultDate,
        resultTime,
        convert(varchar(max),result) result,
        attachments,
        patientName,
        revCode,
        '' url,
        requestingPhysician,
        chargeDate,
        age,
        gender,
        chargeTime,
        patientNo,
        room
      from emr..vw_ImagingCharges c
      where c.chargeDetailId = '${req.params.id}'`;
  }

  void (async function () {
    try {
      await sql.connect(sqlConfig);
      const result = await sql.query(sqlQuery);
      content.patient.details = result.recordset[0];
      content.patient.details.revDescription = "- TEMPLATE -";
      content.qrCode = qrCode;
      content.tech = {};
      content.tech.techDescription = "";
      res.render("emr-template/index", { content });
      // document.getElementById("header").innerHTML = "asd";
    } catch (error) {
      res.send({ error });
    }
  })();
};

module.exports = {
  getEMR,
};

/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");
const puppeteer = require("puppeteer");
const mustache = require("mustache");

const fs = require("fs");
const path = require("path");

// // MODELS //
const userModel = require("../models/userModel.js");
const patientresultModel = require("../models/patientResultModel.js");
// // MODELS //

const toBase64 = (filePath) =>
  `data:image/png;base64,${fs.readFileSync(filePath, "base64")}`;

const cachedLogos = {
  uermLogo: toBase64(path.resolve(__dirname, "../../../images/uerm.png")),
  uermMedLogo: toBase64(
    path.resolve(__dirname, "../../../images/uerm-med-logo.png"),
  ),
};

// const crypto = require("../../../helpers/crypto");

// MODELS //
// const departmentModel = require("../models/departmentModel.js");
// MODELS //

const generatePDF = async function (req, res) {
  const { headerHtml, bodyHtml, data, footerHtml } = req.body;
  // const start = Date.now();

  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      const signature1 = await userModel.selectUsers(
        `and code = ?`,
        [data.releasedby],
        {},
        txn,
      );

      if (signature1.length > 0) {
        return {
          signature1: signature1[0].signature,
        };
      }

      return {
        signature1: "",
      };
    });

    const mergedData = {
      ...data,
      uermLogo: cachedLogos.uermLogo,
      uermMedLogo: cachedLogos.uermMedLogo,
      currentDate: util.formatDate2({ date: util.currentDateTime() }),
      signature1: returnValue.signature1,
    };

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const contentHtml = `
    <html>
      <head>
        <style>
          .watermark {
            position: fixed;
            top: -15%;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background-image: url('${cachedLogos.uermLogo}'); /* shortened */
            background-repeat: no-repeat;
            background-position: center;
            background-size: 30%;
            opacity: 0.1;
            pointer-events: none;
          }
          .text-watermark {
            position: fixed;
            top: 20%;
            left: 3%;
            width: 80%;
            text-align: center;
            font-size: 100px;
            font-weight: 600;
            color: rgba(150, 150, 150, 0.2);
            transform: rotate(-30deg);
            z-index: 5;
            pointer-events: none;
            font-family: helvetica;
            user-select: none;
            padding: 40px;
            letter-spacing: 30px; /* space between characters */
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        <div class="watermark"></div>
        {{#showPreviewWatermark}}
        <div class="text-watermark">PREVIEW</div>
        {{/showPreviewWatermark}}
        ${bodyHtml}
      </body>
    </html>`;

    const renderedHtml = mustache.render(contentHtml, mergedData || {});

    const headerHTML = mustache.render(headerHtml, mergedData || {});
    const footerHTML = mustache.render(footerHtml, mergedData || {});

    await page.setContent(renderedHtml, { waitUntil: "networkidle0" });
    // console.log("Page loaded in", Date.now() - start, "ms");
    // const startRender = Date.now();
    const pdfBuffer = await page.pdf({
      format: "LETTER",
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: "340px", // reserve space for header
        bottom: "120px", // reserve space for footer
        left: "25px",
        right: "25px",
      },
      headerTemplate: headerHTML,
      footerTemplate: footerHTML,
      // `<div style="font-size:10px; text-align:center; width:100%;">
      //   Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      // </div>`,
    });

    // console.log("PDF rendered in", Date.now() - startRender, "ms");

    await browser.close();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=output.pdf",
      "Content-Length": pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    res.status(500).send("Error generating PDF.");
  }
};

const generateDynamicPDF = async function (req, res) {
  const { headerHtml, bodyHtml, data, footerHtml } = req.body;
  // const start = Date.now();

  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      // const result = await patientresultModel.selectPatientResults(
      //   "and testOrderCode = ?",
      //   [data.testOrderCode],
      //   {
      //     order: "",
      //     top: "",
      //   },
      //   txn,
      // );

      // console.log(result);

      const signature1 = await userModel.selectUsers(
        `and code = ?`,
        [data.releasedby],
        {},
        txn,
      );

      if (signature1.length > 0) {
        return {
          signature1: signature1[0].signature,
        };
      }

      return {
        signature1: "",
      };
    });

    if (data.results.length > 0) {
      for (const list of data.results) {
        list.value = list.value.includes("patient-result-file")
          ? `<img src="${await util.convertURLtoBase64(
              `http://localhost:3000/ediagnostics${list.value}`,
            )}" height="620" width="800"`
          : list.value;
      }
    }

    const mergedData = {
      ...data,
      uermLogo: cachedLogos.uermLogo,
      uermMedLogo: cachedLogos.uermMedLogo,
      currentDate: util.formatDate2({ date: util.currentDateTime() }),
      signature1: returnValue.signature1,
    };

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const contentHtml = `
    <html>
      <head>
        <style>
          .watermark {
            position: fixed;
            top: -15%;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background-image: url('${cachedLogos.uermLogo}'); /* shortened */
            background-repeat: no-repeat;
            background-position: center;
            background-size: 30%;
            opacity: 0.1;
            pointer-events: none;
          }
          .text-watermark {
            position: fixed;
            top: 20%;
            left: 3%;
            width: 80%;
            text-align: center;
            font-size: 100px;
            font-weight: 600;
            color: rgba(150, 150, 150, 0.2);
            transform: rotate(-30deg);
            z-index: 5;
            pointer-events: none;
            font-family: helvetica;
            user-select: none;
            padding: 40px;
            letter-spacing: 30px; /* space between characters */
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        <div class="watermark"></div>
        {{#showPreviewWatermark}}
        <div class="text-watermark">PREVIEW</div>
        {{/showPreviewWatermark}}
        ${bodyHtml}
      </body>
    </html>`;

    const renderedHtml = mustache.render(contentHtml, mergedData || {});

    const headerHTML = mustache.render(headerHtml, mergedData || {});
    const footerHTML = mustache.render(footerHtml, mergedData || {});

    await page.setContent(renderedHtml, { waitUntil: "networkidle0" });
    // console.log("Page loaded in", Date.now() - start, "ms");
    // const startRender = Date.now();
    const pdfBuffer = await page.pdf({
      format: "LETTER",
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: "340px", // reserve space for header
        bottom: "120px", // reserve space for footer
        left: "25px",
        right: "25px",
      },
      headerTemplate: headerHTML,
      footerTemplate: footerHTML,
      // `<div style="font-size:10px; text-align:center; width:100%;">
      //   Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      // </div>`,
    });

    // console.log("PDF rendered in", Date.now() - startRender, "ms");

    await browser.close();
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=output.pdf",
      "Content-Length": pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    res.status(500).send("Error generating PDF.");
  }
};

module.exports = {
  generatePDF,
  generateDynamicPDF,
};

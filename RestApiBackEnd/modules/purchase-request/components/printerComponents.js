/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
const { exec } = require("child_process");
// const util = require("../../../helpers/util");
// const path = require("path");
const { print } = require("pdf-to-printer");
const bwipjs = require("@bwip-js/node");
const fs = require("fs-extra");
const PDFDocument = require("pdfkit");
// const printer = require("@thiagoelg/node-printer");

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const w of words) {
    if ((current + w).length > maxChars) {
      lines.push(current.trim());
      current = `${w} `;
    } else {
      current += `${w} `;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

const generateBarcode = async function (req, res) {
  const { itemCode, name, description, dosage, printerName } = req.body;

  if (!itemCode) {
    return res.status(400).send("itemCode is required");
  }

  try {
    // 1️⃣ Generate barcode (no text inside, we’ll add below)

    const mmToPt = (mm) => (mm / 25.4) * 72; // exact mm→pt

    const barcode = await bwipjs.toBuffer({
      bcid: "code128",
      text: itemCode,
      scale: 3,
      height: 15,
      includetext: false,
    });

    // 2️⃣ Define label size: ~60mm × 24mm
    const labelWidth = mmToPt(68); // ~170 pt
    const labelHeight = mmToPt(24); // ~68 pt

    const pdfPath = `label-${Date.now()}.pdf`;

    const doc = new PDFDocument({
      size: [labelWidth, labelHeight],
      margins: { top: 2, left: 2, right: 2, bottom: 2 },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const baseY = 8;
    // 3️⃣ Text block (left)
    // doc.fontSize(8).text(`ITEM CODE: ${itemCode}`, 5, 10, { width: 80 });
    doc.fontSize(7).text(name, 5, 10, { width: 100 });
    doc.fontSize(7).text(description, 5, 20, { width: 100 });
    doc.fontSize(7).text(dosage, 5, 36, { width: 100 });

    // 4️⃣ Barcode block (right)
    const barcodeX = 115;
    // const barcodeY = 8;
    // doc.image(barcode, barcodeX, 5, { fit: [60, 40] });
    doc.image(barcode, barcodeX, 5, { width: 70 });

    // Human-readable code under barcode
    doc.fontSize(8).text(itemCode, barcodeX, baseY + 42, {
      width: 70,
      align: "center",
    });
    // doc.fontSize(8).text(itemCode, barcodeX, baseY + 42, {
    //   width: 60,
    //   align: "center",
    // });

    doc.end();

    // 5️⃣ Print
    stream.on("finish", async () => {
      try {
        await print(pdfPath, {
          printer: printerName || "Brother PT-D610BT", // default
          scale: "noscale", // important: no resizing to A4/Letter
        });

        fs.unlink(pdfPath, (err) => {
          if (err) console.error("Error deleting PDF:", err);
          else console.log(`Deleted ${pdfPath}`);
        });

        res.json({
          status: "success",
          message: `Label sent to ${printerName || "Brother PT-D610BT"}`,
          pdfPath,
        });
      } catch (err) {
        console.error("Print error:", err);
        res.status(500).send("Failed to print label");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating label");
  }
};

const generateXprinterBarcode = function (payload) {
  const { itemCode, name, description, dosage, printerName, printCount } =
    payload;
  // Build TSPL dynamically

  let command = `
SIZE 70 mm,30 mm
GAP 2 mm,0
DIRECTION 1
CLS
`;

  // ==== Left column (text) ====
  let y = 20;
  wrapText(name, 18).forEach((line) => {
    command += `TEXT 20,${y},"2",0,1,1,"${line}"\n`;
    y += 30;
  });

  wrapText(description, 18).forEach((line) => {
    command += `TEXT 20,${y},"2",0,1,1,"${line}"\n`;
    y += 30;
  });

  wrapText(dosage, 18).forEach((line) => {
    command += `TEXT 20,${y},"2",0,1,1,"${line}"\n`;
    y += 30;
  });

  // ==== Right column (barcode + code) ====
  // Shift barcode to the right (x=350)
  command += `BARCODE 280,60,"128",80,0,0,3,3,"${itemCode}"\n`;
  // command += `BARCODE 125,110,"128",80,0,0,4,4,"${itemCode}"\n`;
  command += `TEXT 350,150,"2",0,1,1,"${itemCode}"\n`;

  // ==== Print ====
  command += `PRINT ${printCount},1\n`;

  const tempFile = `label_${Date.now()}.txt`;
  // const tempFile = path.join("C:\\temp", `label_${Date.now()}.txt`);
  fs.writeFileSync(tempFile, command);

  return new Promise((resolve, reject) => {
    exec(`print /D:${printerName} "${tempFile}"`, (err, stdout, stderr) => {
      if (err) {
        fs.unlink(tempFile, (err) => {
          if (err) console.error("Error deleting PDF:", err);
          else console.log(`Deleted ${tempFile}`);
        });
        console.error("Print error:", stderr);
        return resolve({
          success: false,
          message: "Failed to print",
        });
      }

      fs.unlink(tempFile, (err) => {
        if (err) console.error("Error deleting PDF:", err);
        else console.log(`Deleted ${tempFile}`);
      });
      return resolve({
        success: true,
        message: "Label sent to printer",
      });
    });
  });
};

module.exports = {
  generateXprinterBarcode,
  generateBarcode,
};

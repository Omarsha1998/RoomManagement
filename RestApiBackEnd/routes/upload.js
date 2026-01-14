const path = require("path");
const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const sanitize = require("../helpers/sanitize");
const helpers = require("../helpers/helpers");
const fs = require("fs");

const formidable = require("formidable");
const http = require("http");
const util = require("util");

const ftp = require("basic-ftp");

const ftpConfig = {
  // server: appMain.qnapAuth.server.ip,
  // username: appMain.qnapAuth.user,
  // password: appMain.qnapAuth.pass,
  // server: "10.107.11.170",
  // username: "admin",
  // password: "Myayat091300@",
  server: appMain.ftpAuth.server.ip,
  username: appMain.ftpAuth.user,
  password: appMain.ftpAuth.pass,
  // dir: "/share/CACHEDEV1_DATA/Web/Web"
  dir: "/uploads",
};

// SQL CONN
const sql = require("mssql");
const sqlConfig = require("../config/database");
// /SQL CONN
router.use(sanitize);

function removeFiles(dir, file) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f == file) {
      return;
    }
    const stat = fs.statSync(`${dir}/${f}`);
    const age = new Date().getTime() - stat.birthtimeMs;
    const ageMins = parseInt(age / 1000 / 60);
    if (ageMins > 10) {
      // console.log({
      //   status: "deleted",
      //   file: f,
      //   ageMins,
      // });
      fs.unlinkSync(`${dir}/${f}`);
    }
  }
}

router.post("/stud-vaccine/:sn", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    const withHeaders = fields.withHeaders || false;
    if (err) {
      console.error(err.message);
      return;
    }
    // console.log(files);
    // return;
    files = files["vax-cert"];
    let prefix = helpers.randomString(8);
    if (files.name.search("_") >= 0) {
      prefix = files.name.split("_")[0];
    }
    const fileData = {
      attachment: files,
      timeStamp: Date.now(),
      fileType: files.type.split("/").pop(),
      prefix,
      suffix: helpers.randomString(8),
    };
    // fileData.fileName = `${fileData.prefix}-${fileData.timeStamp}-${fileData.suffix}.${fileData.fileType}`;
    fileData.fileName = `${req.params.sn}-${fileData.suffix}.${fileData.fileType}`;

    // upload to ftp
    const client = new ftp.Client();
    // client.ftp.verbose = false;
    try {
      await client.access({
        host: ftpConfig.server,
        user: ftpConfig.username,
        password: ftpConfig.password,
        // secure: true
      });
      // console.log(await client.list());

      await client.ensureDir(`${ftpConfig.dir}/students/vaccine`);
      // await client.ensureDir(`${ftpConfig.dir}/test-path`);
      // await client.clearWorkingDir();
      await client.uploadFrom(
        fileData.attachment.path,
        // "app.js",
        `${fileData.fileName}`,
      );
      res.send({
        error: false,
        message: "Upload complete.",
        fileName: fileData.fileName,
      });
    } catch (err) {
      console.log(err);
      res.send({
        error: true,
        message: err,
        fileName: null,
      });
    }
    client.close();

    // console.log(fileData.attachment);
    // res.end(util.inspect({ fields: fields, files: files }));
  });
});

router.get("/view/emr-result/:fileName", async (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // await helpers.ensureDIR("emr-downloads");
  const client = new ftp.Client();
  // client.ftp.verbose = true;
  try {
    const filename = path.join(
      __dirname,
      `../emr-downloads/${req.params.fileName}`,
    );
    await client.access({
      host: ftpConfig.server,
      user: ftpConfig.username,
      password: ftpConfig.password,
    });

    await client.ensureDir(`${ftpConfig.dir}/emr-results`);
    await client.downloadTo(filename, req.params.fileName);

    if (req.query.viewPdf) {
      const viewPdf = filename;
      // Ideally this should strip them
      console.log(viewPdf);

      res.setHeader("Content-disposition", `inline; filename="${viewPdf}"`);
      res.setHeader("Content-type", "application/pdf");

      fs.readFile(viewPdf, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
      });
      return;
    }
    res.download(filename);
  } catch (err) {
    console.log(err);
  }
  client.close();
});

router.get("/view/emr-result/:fileName", async (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  // await helpers.ensureDIR("emr-downloads");
  const client = new ftp.Client();
  // client.ftp.verbose = true;
  try {
    const filename = path.join(
      __dirname,
      `../emr-downloads/${req.params.fileName}`,
    );
    await client.access({
      host: ftpConfig.server,
      user: ftpConfig.username,
      password: ftpConfig.password,
    });

    await client.ensureDir(`${ftpConfig.dir}/emr-results`);
    await client.downloadTo(filename, req.params.fileName);

    res.download(filename);
  } catch (err) {
    console.log(err);
  }
  client.close();
});

router.post("/emr-result", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    const withHeaders = fields.withHeaders || false;
    if (err) {
      console.error(err.message);
      return;
    }
    let prefix = helpers.randomString(3);
    if (files.attachment.name.search("_") >= 0) {
      prefix = files.attachment.name.split("_")[0];
    }
    // if (withHeaders) {
    //   emr.appendHeader(files.attachment);
    //   return;
    // }
    // const attachment = new File(files.attachment);
    const fileData = {
      attachment: files.attachment,
      timeStamp: Date.now(),
      fileType: files.attachment.type.split("/").pop(),
      prefix,
      suffix: helpers.randomString(3),
    };
    fileData.fileName = `${fileData.prefix}-${fileData.timeStamp}-${fileData.suffix}.${fileData.fileType}`;

    // upload to ftp
    const client = new ftp.Client();
    // client.ftp.verbose = false;
    try {
      await client.access({
        host: ftpConfig.server,
        user: ftpConfig.username,
        password: ftpConfig.password,
        // secure: true
      });
      // console.log(await client.list());

      await client.ensureDir(`${ftpConfig.dir}/emr-results`);
      // await client.ensureDir(`${ftpConfig.dir}/test-path`);
      // await client.clearWorkingDir();
      await client.uploadFrom(
        fileData.attachment.path,
        // "app.js",
        `${fileData.fileName}`,
      );
    } catch (err) {
      console.log(err);
    }
    client.close();

    // console.log(fileData.attachment);
    res.send({
      error: false,
      message: "Upload complete.",
      fileName: fileData.fileName,
    });
    // res.end(util.inspect({ fields: fields, files: files }));
  });
});

router.get("/view/pis-upload/:fileName", async (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const client = new ftp.Client();
  // client.ftp.verbose = true;
  try {
    await helpers.ensureDIR("hr-files");
    const filename = path.join(__dirname, `../hr-files/${req.params.fileName}`);
    await client.access({
      host: ftpConfig.server,
      user: ftpConfig.username,
      password: ftpConfig.password,
    });
    // HELPER CREATE FOLDER

    await client.ensureDir(`${ftpConfig.dir}/hr-files`);
    await client.downloadTo(filename, req.params.fileName);

    res.download(filename);
    // HELPER DELETE FILE
  } catch (err) {
    console.log(err);
  }
  client.close();
});

router.get("/view/pis-upload/:fileName", async (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }
  await helpers.ensureDIR("hr-files");
  const client = new ftp.Client();
  // client.ftp.verbose = true;
  try {
    const filename = path.join(__dirname, `../hr-files/${req.params.fileName}`);
    await client.access({
      host: ftpConfig.server,
      user: ftpConfig.username,
      password: ftpConfig.password,
    });
    // HELPER CREATE FOLDER

    await client.ensureDir(`${ftpConfig.dir}/hr-files`);
    await client.downloadTo(filename, req.params.fileName);

    res.download(filename);
  } catch (err) {
    console.log(err);
  }
  client.close();
});

router.post("/pis-upload", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    if (err) {
      console.error(err.message);
      return;
    }
    // const attachment = new File(files.attachment);
    const fileData = {
      attachment: files.attachment,
      timeStamp: Date.now(),
      fileType: files.attachment.type.split("/").pop(),
      prefix: helpers.randomString(3),
      suffix: helpers.randomString(3),
    };
    fileData.fileName = `PIS_${fileData.prefix}-${fileData.timeStamp}-${fileData.suffix}.${fileData.fileType}`;

    // upload to ftp
    const client = new ftp.Client();
    // client.ftp.verbose = true;
    try {
      await client.access({
        host: ftpConfig.server,
        user: ftpConfig.username,
        password: ftpConfig.password,
        // secure: true
      });
      // console.log(await client.list());

      await client.ensureDir(`${ftpConfig.dir}/hr-files`);
      // await client.ensureDir(`${ftpConfig.dir}/test-path`);
      // await client.clearWorkingDir();
      await client.uploadFrom(
        fileData.attachment.path,
        // "app.js",
        `${fileData.fileName}`,
      );
    } catch (err) {
      console.log(err);
    }
    client.close();

    // console.log(fileData.attachment);
    res.send({
      error: false,
      message: "Upload complete.",
      fileName: fileData.fileName,
    });
    // res.end(util.inspect({ fields: fields, files: files }));
  });
});

router.post("/scholarship-bills", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    const withHeaders = fields.withHeaders || false;
    if (err) {
      console.error(err.message);
      return;
    }
    let prefix = helpers.randomString(3);
    if (files.attachment.name.search("_") >= 0) {
      prefix = files.attachment.name.split("_")[0];
    }
    const fileData = {
      attachment: files.attachment,
      timeStamp: Date.now(),
      fileType: files.attachment.type.split("/").pop(),
      prefix,
      suffix: helpers.randomString(3),
    };
    fileData.fileName = `${fileData.prefix}-${fileData.timeStamp}-${fileData.suffix}.${fileData.fileType}`;

    // upload to ftp
    const client = new ftp.Client();
    try {
      await client.access({
        host: ftpConfig.server,
        user: ftpConfig.username,
        password: ftpConfig.password,
      });

      await client.ensureDir(`${ftpConfig.dir}/scholarship-bills`);
      await client.uploadFrom(fileData.attachment.path, `${fileData.fileName}`);
    } catch (err) {
      console.log(err);
    }
    client.close();

    // console.log(fileData.attachment);
    res.send({
      error: false,
      message: "Upload complete.",
      fileName: fileData.fileName,
    });
  });
});
router.get("/view/scholarship-bills/:fileName", async (req, res) => {
  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }

  const client = new ftp.Client();
  try {
    const dir = "scholarship-bills";
    removeFiles(dir, req.params.fileName);
    await helpers.ensureDIR(dir);
    const filename = path.join(__dirname, `../${dir}/${req.params.fileName}`);
    await client.access({
      host: ftpConfig.server,
      user: ftpConfig.username,
      password: ftpConfig.password,
    });
    // HELPER CREATE FOLDER

    await client.ensureDir(`${ftpConfig.dir}/${dir}`);
    await client.downloadTo(filename, req.params.fileName);

    // res.download(filename);
    res.send({ filename: req.params.fileName });
    // HELPER DELETE FILE
  } catch (err) {
    console.log(err);
  }
  client.close();
});

router.post("/scholarship-letter", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    const withHeaders = fields.withHeaders || false;
    if (err) {
      console.error(err.message);
      return;
    }
    let prefix = helpers.randomString(3);
    if (files.attachment.name.search("_") >= 0) {
      prefix = files.attachment.name.split("_")[0];
    }
    const fileData = {
      attachment: files.attachment,
      timeStamp: Date.now(),
      fileType: files.attachment.type.split("/").pop(),
      prefix,
      suffix: helpers.randomString(3),
    };
    fileData.fileName = `${fileData.prefix}-${fileData.timeStamp}-${fileData.suffix}.${fileData.fileType}`;

    // upload to ftp
    const client = new ftp.Client();
    try {
      await client.access({
        host: ftpConfig.server,
        user: ftpConfig.username,
        password: ftpConfig.password,
      });

      await client.ensureDir(`${ftpConfig.dir}/scholarship-letter`);
      await client.uploadFrom(fileData.attachment.path, `${fileData.fileName}`);
    } catch (err) {
      console.log(err);
    }
    client.close();

    // console.log(fileData.attachment);
    res.send({
      error: false,
      message: "Upload complete.",
      fileName: fileData.fileName,
    });
  });
});

router.post("/scholarship-itr", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    const withHeaders = fields.withHeaders || false;
    if (err) {
      console.error(err.message);
      return;
    }
    let prefix = helpers.randomString(3);
    if (files.attachment.name.search("_") >= 0) {
      prefix = files.attachment.name.split("_")[0];
    }
    const fileData = {
      attachment: files.attachment,
      timeStamp: Date.now(),
      fileType: files.attachment.type.split("/").pop(),
      prefix,
      suffix: helpers.randomString(3),
    };
    fileData.fileName = `${fileData.prefix}-${fileData.timeStamp}-${fileData.suffix}.${fileData.fileType}`;

    // upload to ftp
    const client = new ftp.Client();
    try {
      await client.access({
        host: ftpConfig.server,
        user: ftpConfig.username,
        password: ftpConfig.password,
      });

      await client.ensureDir(`${ftpConfig.dir}/scholarship-itr`);
      await client.uploadFrom(fileData.attachment.path, `${fileData.fileName}`);
    } catch (err) {
      console.log(err);
    }
    client.close();

    // console.log(fileData.attachment);
    res.send({
      error: false,
      message: "Upload complete.",
      fileName: fileData.fileName,
    });
  });
});

router.post("/vaccine-cert", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    const withHeaders = fields.withHeaders || false;
    if (err) {
      console.error(err.message);
      return;
    }
    let prefix = helpers.randomString(3);
    if (files.attachment.name.search("_") >= 0) {
      prefix = files.attachment.name.split("_")[0];
    }
    const fileData = {
      attachment: files.attachment,
      timeStamp: Date.now(),
      fileType: files.attachment.type.split("/").pop(),
      prefix,
      suffix: helpers.randomString(3),
    };
    fileData.fileName = `${fileData.prefix}-${fileData.timeStamp}-${fileData.suffix}.${fileData.fileType}`;

    // upload to ftp
    const client = new ftp.Client();
    try {
      await client.access({
        host: ftpConfig.server,
        user: ftpConfig.username,
        password: ftpConfig.password,
      });

      await client.ensureDir(`${ftpConfig.dir}/students/vaccine`);
      await client.uploadFrom(fileData.attachment.path, `${fileData.fileName}`);
    } catch (err) {
      console.log(err);
    }
    client.close();

    // console.log(fileData.attachment);
    res.send({
      error: false,
      message: "Upload complete.",
      fileName: fileData.fileName,
    });
  });
});

router.post("/scholarship-csv", (req, res) => {
  if (!appMain.checkAuth(req.query.auth)) {
    res.send({ error: appMain.error });
    return;
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    console.log(fields);
    console.log(files);

    res.send({ asd: 123 });
  });
});

module.exports = router;

const db = require("../../../../helpers/sql.js");
const { tryCatch } = require("../../../../helpers/util.js");

const patientModel = require("../../models/ape/patient.js");

const add = async (req, res) => {
  if (!req.body) {
    res.status(400).json("Request body is malformed.");
    return;
  }

  const [err, row] = tryCatch(db.createRow, req.body, patientModel.columns);

  if (err) {
    res.status(400).json(err.message);
    return;
  }

  const r = await db.transact(async (txn) => {
    return await patientModel.upsert(req.user.code, req.body.year, row, txn);
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

const get = async (req, res) => {
  if (!req.query || !req.query.campusCode || !req.query.affiliationCode) {
    res.status(400).json("URL query is malformed");
    return;
  }

  const { campusCode, affiliationCode, deptCode, yearLevel, fullName } =
    req.query;

  const r = await patientModel.selectMany({
    campusCode,
    affiliationCode,
    deptCode,
    yearLevel,
    fullName,
  });

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

module.exports = {
  add,
  get,
};

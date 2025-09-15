const db = require("../../../../helpers/sql.js");

const get = async (req, res) => {
  const r = await db.query(`SELECT TOP 10 * FROM UERMMMC..PatientInfo;`);

  if (r?.error) {
    res.status(500).json(null);
    return;
  }

  res.json(r);
};

module.exports = {
  get,
};

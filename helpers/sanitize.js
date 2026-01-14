const sanitize = (req, res, next) => {
  let escapedString;
  for (val in req.body) {
    if (val != null) {
      let input = String(req.body[val]);
      escapedString = input
        .replace(/[\']/gi, "''")
        .replace(/(-{2})/gi, "-")
        .replace(/[’“”]/gi, "''")
        .trim();
      req.body[val] = escapedString == 'null' ? '' : escapedString;
    }
  }
  for (val in req.query) {
    if (val != null) {
      let input = String(req.query[val]);
      escapedString = input
        .replace(/[\']/gi, "''")
        .replace(/(-{2})/gi, "-")
        .replace(/[’“”]/gi, "''")
        .trim();
      req.query[val] = escapedString == 'null' ? '' : escapedString;
    }
  }
  next();
};
module.exports = sanitize;

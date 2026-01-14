const router = require("express").Router();

router.use("/user", require("./user.js"));
router.use("/diag", require("./diag.js"));
router.use("/ape", require("./ape/index.js"));

module.exports = router;

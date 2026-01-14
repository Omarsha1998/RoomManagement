const express = require("express");
const router = express.Router();
const appMain = require("../auth/auth");
const stream = require("stream");
const fs = require("fs");

router.get("/scholarship/:filename", (req, res) => {
  // res.sendFile(`/scholarship-bills/${req.params.filename}`);
  const dir = "scholarship-bills";
  const file = `${dir}/${req.params.filename}`;
  const r = fs.createReadStream(file); // or any other way to get a readable stream
  const ps = new stream.PassThrough(); // <---- this makes a trick with stream error handling
  stream.pipeline(
    r,
    ps, // <---- this makes a trick with stream error handling
    (err) => {
      if (err) {
        console.log({ error: err }); // No such file or any other kind of error
        return res.sendStatus(400);
      }
    },
  );
  ps.pipe(res); // <---- this makes a trick with stream error handling
});

module.exports = router;

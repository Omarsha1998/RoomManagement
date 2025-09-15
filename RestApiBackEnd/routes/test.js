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

function randomNo(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function checkUnique(card, number, letter) {
  const isUnique = card[letter].includes(number);
  return !isUnique;
}

router.get("/generate-card", (req, res) => {
  // if (!appMain.checkAuth(req.query.auth)) {
  //   res.send({ error: appMain.error });
  //   return;
  // }

  const numbers = [
    { letter: "B", min: 1, max: 15 },
    { letter: "I", min: 16, max: 30 },
    { letter: "N", min: 31, max: 45 },
    { letter: "G", min: 46, max: 60 },
    { letter: "O", min: 61, max: 75 },
  ];
  const card = {
    B: [],
    I: [],
    N: [],
    G: [],
    O: [],
  };
  const repeated = [];
  for (const x of numbers) {
    let ctr = 0;
    while (ctr < 5) {
      const rand = randomNo(x.min, x.max);
      const isUnique = checkUnique(card, rand, x.letter);
      if (x.letter == "N" && ctr == 2) {
        card[x.letter].push("FREE");
        ctr += 1;
      } else {
        if (isUnique) {
          card[x.letter].push(rand);
          ctr += 1;
        } else {
          repeated.push(rand);
        }
      }
    }
    // card[x.letter] = array;
  }
  res.send({ card });
});

module.exports = router;

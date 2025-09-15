const util = require("../helpers/util");
const sqlHelper = require("../helpers/sql");

// MODELS //
const entity = require("../models/entity.js");

// MODELS //

// BASIC SELECT STATEMENTS //
const index = async function (req, res) {
  return res.json({
    message: "Welcome to UERM Entity API",
  });
};

const getNationality = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "and description <> 'N/A'";
      let args = [];
      let order = "";

      if (req.query.code) {
        args = [req.query.code];
        conditions = "and citizenshipCode = ?";
      }

      if (req.query.name) {
        args = [];
        conditions = `and description like '%${req.query.name}%'`;
      }

      return await entity.selectNationality(
        conditions,
        args,
        {
          order: order,
          top: "",
        },
        txn
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getReligion = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "and common = 1";
      let args = [];
      let order = "displaySequence";

      if (req.query.code) {
        args = [req.query.code];
        conditions = "and religionCode = ? and common = 1";
      }

      if (req.query.name) {
        args = [];
        conditions = `and description like '%${req.query.name}%' and common = 1`;
      }

      return await entity.selectReligion(
        conditions,
        args,
        {
          order: order,
          top: "",
        },
        txn
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });
  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getCivilStatus = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "and common = 1";
      let args = [];

      if (req.query.code) {
        args = [req.query.code];
        conditions = "and id = ?";
      }

      if (req.query.name) {
        args = [];
        conditions = `and description like '%${req.query.name}%' and common = 1`;
      }

      return await entity.selectCivilStatus(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn
      );
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  index,
  getCivilStatus,
  getNationality,
  getReligion,
};

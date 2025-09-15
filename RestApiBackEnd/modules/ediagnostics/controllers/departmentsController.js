/* eslint-disable no-unused-vars */
const util = require("../../../helpers/util");
const sqlHelper = require("../../../helpers/sql");

// const crypto = require("../../../helpers/crypto");

// MODELS //
const departmentModel = require("../models/departmentModel.js");
const doctorModel = require("../models/doctorModel.js");
// MODELS //

const __handleTransactionResponse = (returnValue, res) => {
  if (returnValue.error) {
    return res.status(500).json({ error: returnValue.error });
  }
  return res.json(returnValue);
};

const getDepartments = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const departments = await departmentModel.selectDepartments(
      "and active = ?",
      [1],
      {
        order: "",
        top: "",
      },
      txn,
    );

    return departments;
  });

  return __handleTransactionResponse(returnValue, res);
};

const getDoctors = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const departments = await doctorModel.selectDoctors(
      "and deleted = ?",
      [0],
      {
        order: "name, lastName ",
        top: "",
      },
      txn,
    );

    return departments;
  });

  return __handleTransactionResponse(returnValue, res);
};

module.exports = {
  getDepartments,
  getDoctors,
};

const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const categories = require("../models/categories.js");
// MODELS //

//all
const getCategories = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      let args = [];
      sqlWhere = ``;
      args = [];
      const options = {
        top: "",
        order: "",
      };
      return await categories.selectCategories(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.error(error);
  }
};

const getITCategoriesONly = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      let args = [];
      sqlWhere = ` and active = ? and categoryCode = ?
  OR  categoryCode = ?`;
      args = [1, "30", "21"];
      const options = {
        top: "",
        order: "",
      };
      return await categories.selectCategories(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.error(error);
  }
};

// const getItemCategories = async function (req, res) {
//   const returnValue = await sqlHelper.transact(async (txn) => {
//     let sqlWhere = "";
//     let parentCode= "FA"
//     let args = [];
//     sqlWhere = `and parentCode = ? `;
//     args = [parentCode];
//     let options = {
//       top: "",
//       order: "",
//     };
//     return await categories.selectItemCategories(sqlWhere, args, options, txn);
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

//without Computer Equipment
const getNonITCategories = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      const CEequipment = 21;
      const LSequipment = 30;
      // const CEequipment = 'IT'
      let args = [];
      sqlWhere = `and active = ? and categoryCode <> ? and categoryCode <> ?   `;
      args = [1, CEequipment, LSequipment];
      const options = {
        top: "",
        order: "",
      };
      return await categories.selectCategories(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.error(error);
  }
};

//IT and LS only
const getITCategories = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      const CEequipment = 21;

      let args = [];
      sqlWhere = `and active = ? and categoryCode = ?   `;
      args = [1, CEequipment];
      const options = {
        top: "",
        order: "",
      };
      return await categories.selectCategories(sqlWhere, args, options, txn);
    });
    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.error(error);
  }
};

const getCEonlyCategories = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";
      const CEequipment = 21;
      let args = [];
      sqlWhere = `and active = ? and categoryCode = ? `;
      args = [1, CEequipment];
      const options = {
        top: "",
        order: "",
      };
      return await categories.selectCategories(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.error(error);
  }
};

const getNoneLSCategories = async function (req, res) {
  try {
    const returnValue = await sqlHelper.transact(async (txn) => {
      let sqlWhere = "";

      // const LSequipment = 30
      let args = [];
      sqlWhere = `and active = ?  `;
      args = [1];
      const options = {
        top: "",
        order: "",
      };
      return await categories.selectCategories(sqlWhere, args, options, txn);
    });

    if (returnValue.error !== undefined) {
      return res.status(500).json({ error: `${returnValue.error}` });
    }
    return res.json(returnValue);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  getCategories,
  getNonITCategories,
  getITCategories,
  getNoneLSCategories,
  getCEonlyCategories,
  getITCategoriesONly,
  // getItemCategories
};

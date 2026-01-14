// const util = require("../../../helpers/util");
// const sqlHelper = require("../../../helpers/sql");

// // MODELS //
// const accessRights = require("../models/accessRights.js");
// // MODELS //

// const getAccessRights = async function (req, res) {
//   if (
//     util.empty(req.query.moduleName) ||
//     util.empty(req.query.code) ||
//     util.empty(req.query.appName)
//   )
//     return res.status(400).json({ error: "Invalid parameter." });

//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const sqlWhere = `'${req.query.code}',
// 			'${req.query.appName}',
// 			'${req.query.moduleName}'`;

//       return await accessRights.getAccessRights(sqlWhere, txn, {
//         top: {},
//         order: {},
//       });
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };

// const getAccessRightsAsContr = async function (req, res) {
//   if (
//     util.empty(req.query.moduleName) ||
//     util.empty(req.query.code) ||
//     util.empty(req.query.appName)
//   )
//     return res.status(400).json({ error: "Invalid parameter." });

//   const returnValue = await sqlHelper.transact(async (txn) => {
//     try {
//       const sqlWhere = `'${req.query.code}',
// 			'${req.query.appName}',
// 			'${req.query.moduleName}'`;

//       return await accessRights.getAccessRightsAsvento(sqlWhere, txn, {
//         top: {},
//         order: {},
//       });
//     } catch (error) {
//       console.log(error);
//       return { error: error };
//     }
//   });

//   if (returnValue.error !== undefined) {
//     return res.status(500).json({ error: `${returnValue.error}` });
//   }
//   return res.json(returnValue);
// };
// module.exports = {
//   getAccessRights,
//   getAccessRightsAsContr,
// };

const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const accessRights = require("../models/accessRights.js");
// MODELS //

const getAccessRights = async function (req, res) {
  if (
    util.empty(req.query.moduleName) ||
    util.empty(req.query.code) ||
    util.empty(req.query.appName)
  )
    return res.status(400).json({ error: "Invalid parameter." });

  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      const sqlWhere = `'${req.query.code}',
			'${req.query.appName}',
			'${req.query.moduleName}'`;

      return await accessRights.getAccessRights(sqlWhere, txn, {
        top: {},
        order: {},
      });
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
  getAccessRights,
};

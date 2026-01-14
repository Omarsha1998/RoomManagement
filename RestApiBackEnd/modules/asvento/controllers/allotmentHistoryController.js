const util = require("../../../helpers/util.js");
const sqlHelper = require("../../../helpers/sql.js");

// MODELS //
const allotmentHistory = require("../models/allotmentHistory.js");
// MODELS //

const transferringAssetActivityLogs = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const assetCode = req.query.assetCodeResult;
    let sqlWhere = "";
    const equipType = "WHOLE";
    let args = [];
    sqlWhere = `and transferStatus.Type=? and transferStatus.internalAssetCode = ? `;
    args = [equipType, assetCode];
    const options = {
      top: "",
      order: "transferStatus.dateTimeCreated desc",
    };
    return await allotmentHistory.getTransferActivityLogs(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const transferredAssetLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "WHOLE";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=?`;
    args = [1, equipType, transferStatus];
    const options = {
      top: "",
      order: "transferStatus.dateTimeCreated desc",
    };
    return await allotmentHistory.getApprovedAssetTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const viewingDeptAssetTransferLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;
    let sqlWhere = "";
    const equipType = "WHOLE";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=? and transferStatus.fromDeptCode = ?`;
    args = [1, equipType, transferStatus, userDeptCode];
    const options = {
      top: "",
      order: "transferStatus.dateTimeCreated desc",
    };
    return await allotmentHistory.getApprovedAssetTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const transferredPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "PARTS";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=?`;
    args = [1, equipType, transferStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.getApprovedPartsTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const deptViewingTransferredPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const userDeptCode = util.currentUserToken(req).deptCode;

    let sqlWhere = "";
    const equipType = "PARTS";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and transferStatus.Active = ? and transferStatus.Type = ? and transferStatus.transferReStatus=? and transferStatus.fromDeptCode = ?`;
    args = [1, equipType, transferStatus, userDeptCode];

    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.getApprovedPartsTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

//parts only
const getAllotmentHistoryByParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "PARTS";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and Active = ? and Type = ? and transferReStatus=?`;
    args = [1, equipType, transferStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.selectTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const getAllotmentHistory = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "WHOLE";
    const transferStatus = "Approved";
    let args = [];
    sqlWhere = `and Active = ? and Type = ? and transferReStatus=?`;
    args = [1, equipType, transferStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.selectTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getCondemHistoryParts = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    const equipType = "PARTS";
    const condemReStatus = "Approved";
    let args = [];
    sqlWhere = `and Active = ? and Type = ? and condemReStatus=?`;
    args = [1, equipType, condemReStatus];
    const options = {
      top: "",
      order: "dateTimeCreated desc",
    };
    return await allotmentHistory.selectCondemHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};
const getMaxId = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    let sqlWhere = "";
    let args = [];
    sqlWhere = ``;
    args = [];
    const options = {
      top: "",
      order: "",
    };
    return await allotmentHistory.selectMaxTransferFormNo(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getApprovedTransferPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.internalAssetCode))
      return res.status(400).json({ error: "`Asset Code` is required." });
    // const {internalAssetCode, transferFormNo}=req.body
    const internalAssetCode = req.query.internalAssetCode;
    const transferFormNo = req.query.transferFormNo;
    const transferReStatus = "Approved(with whole)";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and transferReStatus=? and active =? and internalAssetCode = ? and transferFormNo = ?`;
    args = [transferReStatus, 1, internalAssetCode, transferFormNo];

    const options = {
      top: "",
      order: "",
    };
    return await allotmentHistory.selectTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

const getApprovedTransferBYPartsLog = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    if (util.empty(req.query.internalAssetCode))
      return res.status(400).json({ error: "`Asset Code` is required." });
    // const {internalAssetCode, transferFormNo}=req.body
    const internalAssetCode = req.query.internalAssetCode;
    const transferFormNo = req.query.transferFormNo;
    const code = req.query.code;
    const transferReStatus = "Approved";
    let sqlWhere = "";
    let args = [];
    sqlWhere = `and transferReStatus=? and active =? and internalAssetCode = ? and transferFormNo = ? and componentCode = ?`;
    args = [transferReStatus, 1, internalAssetCode, transferFormNo, code];

    const options = {
      top: "",
      order: "",
    };
    return await allotmentHistory.selectTransferHistory(
      sqlWhere,
      args,
      options,
      txn,
    );
  });

  if (returnValue.error !== undefined) {
    return res.status(500).json({ error: `${returnValue.error}` });
  }
  return res.json(returnValue);
};

module.exports = {
  getAllotmentHistory,
  getAllotmentHistoryByParts,
  getApprovedTransferBYPartsLog,
  getApprovedTransferPartsLog,
  getMaxId,
  getCondemHistoryParts,
  transferredAssetLog,
  transferredPartsLog,
  viewingDeptAssetTransferLog,
  deptViewingTransferredPartsLog,
  transferringAssetActivityLogs,

  // getPartsLogApproved
};

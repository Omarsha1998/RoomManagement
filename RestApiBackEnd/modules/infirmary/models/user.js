const db = require("../../../helpers/sql.js");
const redis = require("../../../helpers/redis.js");
const config = require("../config.js");
const { hashPassword } = require("../../../helpers/crypto.js");
const { sliceObj } = require("../../../helpers/util.js");

const columns = [
  { name: "id", identity: true },
  { name: "code", required: true },
  { name: "passwordHash", default: null },
  { name: "roleCode", required: true },

  { name: "firstName", required: true },
  { name: "middleName", default: null },
  { name: "lastName", required: true },
  { name: "extName", default: null },

  { name: "emailAddress", default: null },
  { name: "mobileNumber", default: null },
  { name: "examsHandled", default: null },
];

const columnNames = columns.map((c) => c.name);
const columnNamesJoined = columnNames.join(",");

const selectOne = async (conditions, txn) => {
  const row = await db.selectOne(
    columnNames,
    "AnnualPhysicalExam..Users",
    conditions,
    txn,
    { camelized: false },
  );

  return row
    ? { ...row, examsHandled: (row.examsHandled || "").split(",") }
    : null;
};

const deauthenticate = async (userCode) => {
  await redis.getConn().sendCommand(["DEL", `${config.appCode}${userCode}`]);
};

const updatePassword = async (userCode, newPassword) => {
  if (!userCode || !newPassword) {
    throw new Error("Incomplete arguments.");
  }

  return await db.transact(async (txn) => {
    const updatedUser = await db.updateOne(
      "AnnualPhysicalExam..Users",
      {
        passwordHash: await hashPassword(newPassword),
        updatedBy: userCode,
      },
      { code: userCode },
      txn,
    );

    await deauthenticate(userCode);
    return sliceObj(updatedUser, "passwordHash");
  });
};

module.exports = {
  columns,
  columnNames,
  columnNamesJoined,
  selectOne,
  deauthenticate,
  updatePassword,
};

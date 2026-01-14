/* eslint-disable no-console */
const mssql = require("mssql");
const prodDbConfig = require("../config/databaseConfig.js");
const testDbConfig = require("../config/databaseTestingConfig.js");

const {
  empty,
  isStr,
  isArr,
  isObj,
  objEmpty,
  changeCase,
  pascalToCamel,
  generateNumber,
  pad,
  allPropsEmpty,
  addEllipsis,
  logError,
} = require("./util.js");

const __conns = {};

const __defaultDbConfig =
  process.env.NODE_ENV === "dev" || process.env.DEV
    ? testDbConfig
    : prodDbConfig;

const wrapWithAutoRollbackTransaction = (sqlStr) => {
  return `
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;

    ${sqlStr}

    COMMIT TRANSACTION;
    SET XACT_ABORT OFF;
  `;
};

// Validates and supplies default column values to the given row object
// column format:
// {
//   name (string, REQUIRED),
//   identity (string, optional),
//   default (any, optional),
//   absoluteValue (any, optional),
//   size (number, optional),
//   required (boolean, optional),
// }
const createRow = (item, columns) => {
  return columns.reduce((row, col) => {
    if (col.identity) return row;

    row[col.name] = item[col.name];

    // false, "", 0 are valid values, only check for null or undefined
    if (row[col.name] == null) row[col.name] = col.default;

    if (col.absoluteValue !== undefined) {
      row[col.name] = col.absoluteValue;
    }

    if (col.size && row[col.name] && row[col.name].length > col.size) {
      row[col.name] = addEllipsis(row[col.name], col.size);
    }

    // null and undefined are not allowed if required = true
    if (col.required && row[col.name] == null) {
      throw new Error(`\`${col.name}\` column is required.`);
    }

    return row;
  }, {});
};

const formatError = async (error) => {
  await logError(error);

  // console.log(error);

  const isSqlError =
    error instanceof mssql.ConnectionError ||
    error instanceof mssql.TransactionError ||
    error instanceof mssql.RequestError ||
    error instanceof mssql.PreparedStatementError;

  return {
    error: isSqlError ? "Internal Server Error" : error?.message || error,
  };
};

const addConn = async (name, config) => {
  const newConn = new mssql.ConnectionPool(config);

  process.stdout.write(`Connecting to "${name}" MSSQL server... `);
  await newConn.connect();
  console.log("Connected.");

  __conns[name] = newConn;
};

const getConn = (name) => {
  return __conns[name || "default"];
};

const where = (obj, colPrefix = "") => {
  if (empty(obj)) {
    return ["", []];
  }

  if (!isStr(colPrefix)) {
    throw new Error("`colPrefix` should be a string.");
  }

  if (!isObj(obj)) {
    throw new Error("`obj` should be an object.");
  }

  const prefix = colPrefix ? colPrefix.concat(".") : "";
  const whereStrArr = [];
  const whereArgs = [];

  for (const key in obj) {
    const colName = `${prefix}${key}`;

    if (obj[key] == null) {
      whereStrArr.push(`${colName} IS NULL`);
      continue;
    }

    whereStrArr.push(`${colName} = ?`);
    whereArgs.push(obj[key]);
  }

  return [`WHERE ${whereStrArr.join(" AND ")}`, whereArgs];
};

const query = async (command, args, conn, camelized) => {
  if (!command) {
    throw new Error("`command` is required.");
  }

  if (!args) {
    args = [];
  }

  if (!conn) {
    conn = __conns.default;
  }

  if (camelized == null) {
    camelized = true;
  }

  if (
    !(conn instanceof mssql.ConnectionPool) &&
    !(conn instanceof mssql.Transaction)
  ) {
    throw new Error(
      "`conn` argument must be a ConnectionPool or a Transaction.",
    );
  }

  // console.log("query helper, commands: ", command);
  // console.log("query helper, args: ", args);

  try {
    const result = await conn.request().query(command.split("?"), ...args);

    if (result.recordset) {
      if (camelized) {
        const r = [];

        for (let i = 0; i < result.recordset.length; i++) {
          r.push(changeCase(result.recordset[i], pascalToCamel));
        }

        return r;
      }

      return result.recordset;
    }

    return null;
  } catch (error) {
    // Let `transact` handle the error if this is ran inside `transact`
    if (conn instanceof mssql.Transaction) {
      throw error;
    }

    return await formatError(error);
  }
};

const transact = async (commands, conn) => {
  if (!conn) {
    conn = __conns.default;
  }

  const txn = new mssql.Transaction(conn);

  try {
    // IMPORTANT: begin transaction here as rolling back a transaction that
    // has not been started throws an error
    // console.log("Starting transaction...");
    await txn.begin();

    try {
      // IMPORTANT: Throw an error inside the `commands` arg to force a "rollback"
      const ret = await commands(txn);
      // console.log("Committing transaction...");
      await txn.commit();

      return ret;
    } catch (error) {
      // console.log("Error occured in a transaction. Rolling back...");
      await txn.rollback();
      // console.log("Rolled back.");
      return await formatError(error);
    }
  } catch (error) {
    return await formatError(error);
  }
};

const select = async (columns, table, conditions, txn, options) => {
  if (empty(columns) || !table) {
    throw new Error("`columns` and `table` arguments are required.");
  }

  if (!options) {
    options = {};
  }

  //  For backward compatibility [START]
  if (options.order) {
    options.orderBy = options.order;
  }

  delete options.order;
  //  For backward compatibility [END]

  const [whereStr, whereArgs] = where(conditions);

  const command = `
    SELECT ${options.limitTo ? "TOP (".concat(options.limitTo, ")") : ""}
      ${isArr(columns) ? columns.join(",") : columns}
    FROM ${table}
    ${empty(conditions) ? "" : whereStr}
    ${options.orderBy ? `ORDER BY ${options.orderBy}` : ""};
  `;

  return await query(command, whereArgs, txn, options.camelized);
};

const selectOne = async (columns, table, conditions, txn, options) => {
  return (
    (
      await select(columns, table, conditions, txn, {
        ...(options ?? {}),
        limitTo: 1,
      })
    )[0] ?? null
  );
};

const insertMany = async (table, items, txn, options) => {
  if (!table || !items) {
    throw new Error("`table` and `items` arguments are required.");
  }

  if (!options) {
    options = {};
  }

  if (!options.skipTimestampCol) {
    options.skipTimestampCol = false;
  }

  if (!options.timestampColName) {
    options.timestampColName = "dateTimeCreated";
  }

  if (!options.columnsToSelect) {
    options.columnsToSelect = ["*"];
  }

  const cols = [
    ...(options.skipTimestampCol ? [] : [options.timestampColName]),
    ...Object.keys(items[0]),
  ];

  const args = [];
  const values = [];

  for (const item of items) {
    const placeholders = options.skipTimestampCol ? [] : ["GETDATE()"];

    for (const key in item) {
      placeholders.push("?");
      args.push(item[key]);
    }

    values.push(`(${placeholders.join(",")})`);
  }

  return await query(
    `
      INSERT INTO ${table} (${cols.join(",")})
      OUTPUT ${options.columnsToSelect.map((c) => `INSERTED.${c}`).join(",")}
      VALUES ${values.join(",")};
    `,
    args,
    txn,
    options.camelized,
  );
};

const insertManyV2 = async (table, items, txn, options) => {
  if (!table || !items) {
    throw new Error("`table` and `items` arguments are required.");
  }

  if (!options) {
    options = {};
  }

  if (!options.skipTimestampCol) {
    options.skipTimestampCol = false;
  }

  if (!options.timestampColName) {
    options.timestampColName = "dateTimeCreated";
  }

  if (!options.columnsToSelect) {
    options.columnsToSelect = ["*"];
  }

  const cols = [
    ...(options.skipTimestampCol ? [] : [options.timestampColName]),
    ...Object.keys(items[0]),
  ];

  const sqlArgs = [];
  const values = [];

  for (const item of items) {
    const placeholders = options.skipTimestampCol ? [] : ["GETDATE()"];

    for (const key in item) {
      placeholders.push("?");
      sqlArgs.push(item[key]);
    }

    values.push(`(${placeholders.join(",")})`);
  }

  const sqlStr = `
    INSERT INTO ${table} (${cols.join(",")})
    VALUES ${values.join(",")};

    SELECT TOP ${items.length}
      ${options.columnsToSelect.join(",")}
    FROM
      ${table}
    ORDER BY
      ${options.timestampColName} DESC;
  `;

  return await query(
    txn ? sqlStr : wrapWithAutoRollbackTransaction(sqlStr),
    sqlArgs,
    txn,
    options.camelized,
  );
};

const insertOne = async (table, item, txn, options) => {
  return (await insertMany(table, [item], txn, options))[0] ?? null;
};

const insert = async (
  table,
  item,
  txn,
  timestampColName,
  camelized,
  columnsToSelect,
) => {
  return (
    await insertMany(table, [item], txn, {
      timestampColName,
      camelized,
      columnsToSelect,
    })
  )[0];
};

const updateMany = async (table, item, conditions, txn, options) => {
  if (!table || empty(item) || empty(conditions) || !txn) {
    throw new Error(
      "`table`, `item`, `conditions` and `txn` arguments are required.",
    );
  }

  if (allPropsEmpty(conditions)) {
    throw new Error("All props of `conditions` are empty.");
  }

  if (!options) {
    options = {};
  }

  if (!options.skipTimestampCol) {
    options.skipTimestampCol = false;
  }

  if (!options.timestampColName) {
    options.timestampColName = "dateTimeUpdated";
  }

  // `ORDER BY` is invalid without the `TOP`. Use both or none.
  if (
    (options.limitTo && !options.orderBy) ||
    (!options.limitTo && options.orderBy)
  ) {
    throw new Error(
      "`options.limitTo` and `options.orderBy` should be supplied together.",
    );
  }

  if (!options.columnsToSelect) {
    options.columnsToSelect = ["*"];
  }

  const setClauseArr = options.skipTimestampCol
    ? []
    : [`${options.timestampColName} = GETDATE()`];

  const setClauseArgs = [];
  const [whereStr, whereArgs] = where(conditions);

  for (const key in item) {
    if (item[key] !== undefined) {
      setClauseArr.push(`${key} = ?`);
      setClauseArgs.push(item[key]);
    }
  }

  const sqlSelectStrArrItem1 = `SELECT ${
    options.limitTo ? "TOP ".concat(options.limitTo) : ""
  }`;

  const sqlSelectStrArrItem3 = `
    FROM ${table}
    ${whereStr}
    ${options.orderBy ? "ORDER BY ".concat(options.orderBy) : ""}
  `;

  const sqlSelectStr1 = [sqlSelectStrArrItem1, "*", sqlSelectStrArrItem3].join(
    " ",
  );

  const sqlSelectStr2 = options.skipOutput
    ? ""
    : [
        sqlSelectStrArrItem1,
        options.columnsToSelect.join(","),
        sqlSelectStrArrItem3,
        ";",
      ].join(" ");

  return await query(
    `
      ;WITH _cte AS (${sqlSelectStr1}) UPDATE _cte SET ${setClauseArr.join(",")};
      ${sqlSelectStr2}
    `,
    [...whereArgs, ...setClauseArgs, ...(options.skipOutput ? [] : whereArgs)],
    txn,
    options.camelized,
  );
};

const updateOne = async (table, item, conditions, txn, options) => {
  return (
    (
      await updateMany(table, item, conditions, txn, {
        orderBy: conditions ? Object.keys(conditions).join(",") : null, // DEFAULT `orderBy`. CAN BE OVERRIDDEN.
        ...(options ?? {}),
        limitTo: 1,
      })
    )[0] ?? null
  );
};

const update = async (
  table,
  item,
  conditions,
  txn,
  timestampColName,
  camelized,
  columnsToSelect,
) => {
  return (
    (
      await updateMany(table, item, conditions, txn, {
        orderBy: conditions ? Object.keys(conditions).join(",") : null, // DEFAULT
        timestampColName,
        camelized,
        limitTo: 1, // OVERRIDE `limitTo`,
        columnsToSelect,
      })
    )[0] ?? null
  );
};

const upsert = async (
  table,
  item,
  identityColumnsMap,
  createdOrUpdatedBy,
  txn,
  creatorColName,
  creationDateTimeColName,
  updatorColName,
  updateDateTimeColName,
  camelized,
) => {
  if (
    !table ||
    objEmpty(item) ||
    objEmpty(identityColumnsMap) ||
    !createdOrUpdatedBy ||
    !txn
  ) {
    throw new Error(
      "`table`, `item`, `identityColumnsMap`, `createdOrUpdatedBy` and `txn` arguments are required.",
    );
  }

  if (!creatorColName) {
    creatorColName = "createdBy";
  }

  if (!creationDateTimeColName) {
    creationDateTimeColName = "dateTimeCreated";
  }

  if (!updatorColName) {
    updatorColName = "updatedBy";
  }

  if (!updateDateTimeColName) {
    updateDateTimeColName = "dateTimeUpdated";
  }

  if (Object.keys(identityColumnsMap).length === 0) {
    throw new Error("`identityColumnsMap` should have one or more items.");
  }

  const existingItem = await selectOne("*", table, identityColumnsMap, txn);

  if (existingItem) {
    // let noChanges = true;

    // for (const key in item) {
    //   if (item[key] !== existingItem[key]) {
    //     noChanges = false;
    //     break;
    //   }
    // }

    // if (noChanges) {
    //   // console.log("No Changes to the item. Returning the existing one...");
    //   return existingItem;
    // }

    // console.log("upsert: Updating existing item...");
    return await updateOne(
      table,
      { ...item, [updatorColName]: createdOrUpdatedBy },
      identityColumnsMap,
      txn,
      { timestampColName: updateDateTimeColName, camelized },
    );
  }

  // console.log("upsert: Inserting new item...");
  return await insertOne(
    table,
    { ...item, ...identityColumnsMap, [creatorColName]: createdOrUpdatedBy },
    txn,
    { timestampColName: creationDateTimeColName, camelized },
  );
};

const del = async (table, conditions, txn, options) => {
  if (!table || empty(conditions) || !txn) {
    throw new Error("`table`, `conditions` and `txn` arguments are required.");
  }

  if (!options) {
    options = {};
  }

  if (allPropsEmpty(conditions)) {
    throw new Error("All props of `conditions` are empty.");
  }

  const [whereStr, whereArgs] = where(conditions);

  return await query(
    `DELETE FROM ${table} 
      OUTPUT DELETED.*
      ${whereStr};`,
    whereArgs,
    txn,
    options.camelized,
  );
};

const generateRowCode = async (
  table,
  column,
  prefix,
  seriesLength,
  txn,
  options,
) => {
  if (!txn) {
    throw new Error("generateRowCode: `txn` arg is required.");
  }

  if (!seriesLength) {
    seriesLength = 5;
  }

  if (!options) {
    options = {};
  }

  if (options.includeMs == null) {
    options.includeMs = true;
  }

  let code = "";
  let codeExists = true;

  const dateTimeStr = (
    await query(
      `SELECT FORMAT(GETDATE(), 'yyyyMMddhhmmss${options.includeMs ? "fff" : ""}') dateTimeStr;`,
    )
  )[0].dateTimeStr;

  while (codeExists) {
    code = `${prefix}${dateTimeStr}${generateNumber(seriesLength)}`;
    codeExists = await selectOne([column], table, { [column]: code }, txn, {
      camelized: false,
    });
  }

  return code;
};

const getDateTime = async (txn) => {
  return (await query(`SELECT GETDATE() AS now;`, [], txn, false))[0].now;
};

const getTime = async (txn) => {
  return (
    await query(
      `SELECT CONVERT(VARCHAR(5), GETDATE(), 108) AS currentTime;`,
      [],
      txn,
      false,
    )
  )[0].currentTime;
};

const nullifyIfEmptyStr = (expr) => {
  return `NULLIF(${expr}, '')`;
};

const isEmpty = (expr) => {
  return `${nullifyIfEmptyStr(expr)} IS NULL`;
};

const isNotEmpty = (expr) => {
  return `${nullifyIfEmptyStr(expr)} IS NOT NULL`;
};

const isFalsy = (expr) => {
  return `(${isEmpty(expr)} OR CAST(${expr} AS VARCHAR) = '0')`;
};

const isTruthy = (expr) => {
  return `(${isNotEmpty(expr)} AND CAST(${expr} AS VARCHAR) <> '0')`;
};

const either = (expr1, expr2) => {
  return `IIF(${isFalsy(expr1)}, ${expr2}, ${expr1})`;
};

const fullName = (
  firstNameExpr,
  middleNameExpr,
  lastNameExpr,
  extNameExpr,
  options,
) => {
  if (!firstNameExpr) {
    throw new Error("`firstNameExpr` is required.");
  }

  if (!options) {
    options = {};
  }

  const extName = extNameExpr
    ? `IIF(${isEmpty(extNameExpr)}, '', CONCAT(' ', ${extNameExpr}))`
    : "NULL";

  const lastName = lastNameExpr
    ? `IIF(${isEmpty(lastNameExpr)}, '', ${lastNameExpr})`
    : "NULL";

  const lastAndExtName = `IIF(${lastName} IS NULL AND ${extName} IS NULL, NULL, CONCAT(${lastName}, ${extName}, ', '))`;

  const middleName = middleNameExpr
    ? `IIF(${isEmpty(middleNameExpr)}, '', CONCAT(' ', ${
        options.abbreviateMiddleName
          ? `CONCAT(LEFT(${middleNameExpr}, 1), '.')`
          : middleNameExpr
      }))`
    : "NULL";

  return `
    IIF(
      ${isEmpty(firstNameExpr)},
      NULL,
      CONCAT(${lastAndExtName}, ${firstNameExpr}, ${middleName})
    )
  `;
};

const generateUniqueCode = async (
  table,
  prefix,
  count,
  // surrogateCode = "code",
  txn,
) => {
  let code = "";
  let codeExists = true;

  const currentdate = new Date();

  const datetime = `${currentdate.getFullYear()}${"0"
    .concat(currentdate.getMonth() + 1)
    .slice(-2)}${pad(currentdate.getDate())}${pad(currentdate.getHours())}${pad(
    currentdate.getMinutes(),
  )}${pad(currentdate.getSeconds())}`;
  while (codeExists) {
    code = `${prefix}${datetime}${generateNumber(count)}`;
    try {
      const result = await query(
        `SELECT
          COUNT(code) AS count
        FROM ${table} WITH (NOLOCK)
        where code = ?`,
        [code],
        txn,
      );
      const codeCount = result;
      codeExists = Boolean(codeCount.count);
    } catch (error) {
      console.log(error);
      return { success: false, message: error };
    }
  }
  return code;
};

const generateDynamicUniqueCode = async (
  table,
  prefix,
  count,
  surrogateCode = "code",
  withTime = true,
  txn,
) => {
  let code = "";
  let codeExists = true;

  const currentdate = new Date();

  let time = ``;
  if (withTime) {
    time = `${pad(currentdate.getHours())}${pad(currentdate.getMinutes())}${pad(
      currentdate.getSeconds(),
    )}`;
  }
  const datetime = `${currentdate.getFullYear()}${`0${
    currentdate.getMonth() + 1
  }`.slice(-2)}${pad(currentdate.getDate())}${time}`;
  while (codeExists) {
    code = `${prefix}${datetime}${generateNumber(count)}`;
    try {
      const result = await query(
        `SELECT
          COUNT(${surrogateCode}) AS count
        FROM ${table} WITH (NOLOCK)
        where ${surrogateCode} = ?`,
        [code],
        txn,
      );
      const codeCount = result;
      codeExists = Boolean(codeCount.count);
    } catch (error) {
      console.log(error);
      return { success: false, message: error };
    }
  }
  return code;
};

const returnSQL = () => {
  return __conns.default;
};

const returnSQLConfig = () => {
  return __defaultDbConfig;
};

module.exports = {
  createRow,
  addConn,
  getConn,
  where,
  query,
  transact,
  select,
  selectMany: select, // ALIAS
  selectOne,
  insert,
  insertOne,
  insertMany,
  insertManyV2,
  update,
  updateOne,
  updateMany,
  upsert,
  del,
  generateRowCode,
  getDateTime,
  getTime,
  nullifyIfEmptyStr,
  isEmpty,
  isNotEmpty,
  isFalsy,
  isTruthy,
  either,
  fullName,
  generateUniqueCode,
  returnSQL,
  returnSQLConfig,
  generateDynamicUniqueCode,
  wrapWithAutoRollbackTransaction,
};

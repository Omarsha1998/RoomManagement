const mssql = require("mssql");

const SQLDataTypes = {
    VARCHAR:  mssql.VarChar,
    CHAR:  mssql.Char,
    BIT: mssql.Bit,
    INT: mssql.Int,
    SMALLINT: mssql.SmallInt,
    DATE: mssql.Date,
    DATETIME: mssql.DateTime
  };
  
  Object.freeze(SQLDataTypes); // Prevents modification
  
  module.exports = {
    SQLDataTypes
  };
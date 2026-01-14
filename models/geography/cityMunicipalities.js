const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectCityMunicipalities = async function (
  conditions,
  args,
  options,
  txn
) {
  try {
    const cityMunicipalities = await sqlHelper.query(
      `SELECT
        ${util.empty(options.top) ? "" : `TOP(${options.top})`}
        shortCode,
        townCity,
        name
      from HR..TownCity
      WHERE 1=1 ${conditions}
      ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );

    // if (cityMunicipalities.length > 0) {
    //   for (let province of cityMunicipalities) {
    //     const splittedProvince = province.townCity.split("_");
    //     // const shortCode = splittedProvince[1].replace("0", "_");
    //     const shortCode = splittedProvince[1]
    //     const formattedShortCode = `_${shortCode}`;
    //     if (formattedShortCode.includes("__")) {
    //       province.shortCode = formattedShortCode.replace("_", "");
    //     } else {
    //       province.shortCode = formattedShortCode;
    //     }
    //     const name1 =
    //       splittedProvince[2] !== undefined ? splittedProvince[2] : "";
    //     const name2 =
    //       splittedProvince[3] !== undefined ? splittedProvince[3] : "";
    //     const name3 =
    //       splittedProvince[4] !== undefined ? splittedProvince[4] : "";
    //     const name4 =
    //       splittedProvince[5] !== undefined ? splittedProvince[5] : "";
    //     const name5 =
    //       splittedProvince[6] !== undefined ? splittedProvince[6] : "";
    //     const name6 =
    //       splittedProvince[7] !== undefined ? splittedProvince[7] : "";
    //     const name7 =
    //       splittedProvince[8] !== undefined ? splittedProvince[8] : "";
    //     const name8 =
    //       splittedProvince[9] !== undefined ? splittedProvince[9] : "";
    //     const name9 =
    //       splittedProvince[10] !== undefined ? splittedProvince[10] : "";
    //     const name10 =
    //       splittedProvince[11] !== undefined ? splittedProvince[11] : "";

    //       const name11 =
    //       splittedProvince[12] !== undefined ? splittedProvince[12] : "";
    //     const name12 =
    //       splittedProvince[13] !== undefined ? splittedProvince[13] : "";
    //     const name13 =
    //       splittedProvince[14] !== undefined ? splittedProvince[14] : "";
    //     const name14 =
    //       splittedProvince[15] !== undefined ? splittedProvince[15] : "";
    //     const name15 =
    //       splittedProvince[16] !== undefined ? splittedProvince[16] : "";
    //     const name16 =
    //       splittedProvince[17] !== undefined ? splittedProvince[17] : "";

    //     const trimName = `${name1} ${name2} ${name3} ${name4} ${name5} ${name6} ${name7} ${name8} ${name9} ${name10}  ${name11} ${name12} ${name13} ${name14} ${name15} ${name16}`;
    //     let provinceName = trimName.trimRight();
    //     province.name = provinceName;
    //   }
    // }

    return cityMunicipalities;

    // const rawSql = await sqlHelper.returnSQL();
    // const sqlQuery = `SELECT
    //   ${util.empty(options.top) ? "" : `TOP(${options.top})`}
    //   townCity
    // from HR..TownCity
    // WHERE 1=1 ${conditions}
    // ${util.empty(options.order) ? "" : `order by ${options.order}`}
    // `;
    // const result = await rawSql.query(sqlQuery, args);
    // return result.recordset;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateCityMunicipalities = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "HR..TownCity",
      payload,
      condition,
      txn
    );
  } catch (error) {
    console.log(error)
    return { error: true, message: error };
  }
};

module.exports = {
  selectCityMunicipalities,
  updateCityMunicipalities
};

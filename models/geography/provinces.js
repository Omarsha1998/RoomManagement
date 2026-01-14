const util = require("../../helpers/util");
const sqlHelper = require("../../helpers/sql");

const selectProvinces = async function (conditions, args, options, txn) {
  try {
    const provinces = await sqlHelper.query(
      `SELECT
      ${util.empty(options.top) ? "" : `TOP(${options.top})`}
      shortCode,
      region,
      province,
      name,
      otherName
    from HR..RegionProvince
    WHERE 1=1 ${conditions}
    ${util.empty(options.order) ? "" : `order by ${options.order}`}
    `,
      args,
      txn
    );

    // if (provinces.length > 0) {
    //   for (let province of provinces) {
    //     const splittedProvince = province.province.split("_");
    //     // const shortCode = splittedProvince[1].replace("0", "_");
    //     let shortCode = ''
    //     if (splittedProvince[1].charAt(0) === '0') {
    //       shortCode = splittedProvince[1].replace("0", "");
    //     } else {
    //       shortCode = splittedProvince[1]
    //     }
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
    //     const trimName = `${name1} ${name2} ${name3} ${name4} ${name5} ${name6} ${name7} ${name8} ${name9} ${name10}`;
    //     let provinceName = trimName.trimRight();
    //     province.name = provinceName
    //     if (province.region === 'NationalCapitalRegion') {
    //       if (splittedProvince[1] === '1339') {
    //         province.name = `${provinceName}`
    //       } else if (splittedProvince[1] === '1374') {
    //         province.name = `${provinceName}: MARIKINA, PASIG, SAN JUAN, QUEZON CITY, MANDALUYONG`
    //       } else if (splittedProvince[1] === '1375') {
    //         province.name = `${provinceName}: MALABON, NAVOTAS, VALENZUELA, CALOOCAN`
    //       } else {
    //         province.name = `${provinceName}: PARANAQUE, PATEROS, MUNTINLUPA, TAGUIG, PASAY, LAS PINAS, MAKATI`
    //       }
    //     } else {
    //       province.name = provinceName
    //     }
    //   }
    // }
    return provinces;
  } catch (error) {
    console.log(error);
    return { error: true, message: error };
  }
};

const updateProvince = async function (payload, condition, txn) {
  try {
    return await sqlHelper.update(
      "HR..RegionProvince",
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
  selectProvinces,
  updateProvince,
};

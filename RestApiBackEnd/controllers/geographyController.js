/* eslint-disable no-console */
const util = require("../helpers/util");
const sqlHelper = require("../helpers/sql");

// MODELS //
const countries = require("../models/geography/countries.js");
const regions = require("../models/geography/regions.js");
const provinces = require("../models/geography/provinces.js");
const cityMunicipalities = require("../models/geography/cityMunicipalities.js");
const barangays = require("../models/geography/barangays.js");
// MODELS //

// BASIC SELECT STATEMENTS //
const index = async function (req, res) {
  return res.json({
    message: "Welcome to UERM Geography API",
  });
};

const getCountries = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];
      let order = "";

      if (req.query.code) {
        args = [req.query.code];
        conditions = "and code = ?";
      }

      if (req.query.name) {
        args = [];
        conditions = `and name like '%${req.query.name}%'`;
      }

      if (req.query.orderSequence) {
        args = [];
        order = `sequence`;
      }

      return await countries.selectCountries(
        conditions,
        args,
        {
          order: order,
          top: "",
        },
        txn,
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

const getRegions = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];

      if (req.query.code) {
        args = [req.query.code];
        conditions = "and code = ?";
      }

      if (req.query.name) {
        args = [];
        conditions = `and name like '%${req.query.name}%'`;
      }

      return await regions.selectRegions(
        conditions,
        args,
        {
          order: "displaySequence",
          top: "",
        },
        txn,
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

// BASIC SELECT STATEMENTS //
const getProvinces = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];
      // args = [serial];
      // conditions = `and d.serials = ? `;

      if (req.query.region) {
        args = [req.query.region];
        conditions = `and Region = ?`;
      }

      const selectProvinces = await provinces.selectProvinces(
        conditions,
        args,
        {
          order: "",
          top: "",
        },
        txn,
      );

      // for (let selectProvince of selectProvinces) {
      //   const payload = {
      //     shortCode: selectProvince.shortCode
      //   }
      //   await provinces.updateProvince(payload, { province: selectProvince.province }, txn);
      // }

      return selectProvinces;
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

const getCityMunicipalities = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      const args = [];
      // args = [serial];
      // conditions = `and d.serials = ? `;

      if (req.query.province) {
        conditions = `and townCity like '${req.query.province}%'`;
      }

      const cityMunicipality =
        await cityMunicipalities.selectCityMunicipalities(
          conditions,
          args,
          {
            order: "",
            top: "",
          },
          txn,
        );

      // for (let selectProvince of cityMunicipality) {
      //   const payload = {
      //     provinceCode: selectProvince.shortCode.substring(0, 4)
      //   }
      //   await cityMunicipalities.updateCityMunicipalities(payload, { townCity: selectProvince.townCity }, txn);
      // }

      return cityMunicipality;
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

const getBarangays = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      const args = [];
      // args = [serial];
      // conditions = `and d.serials = ? `;

      if (req.query.cityMunicipalities) {
        // args = [req.query.cityMunicipalities]
        // conditions = `and townCity like '?%'`
        conditions = `and barangay like '${req.query.cityMunicipalities}%'`;
      }

      return await barangays.selectBarangays(
        conditions,
        args,
        {
          order: "barangay",
          top: "",
        },
        txn,
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

const registerRegion = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const payload = [
      {
        name: "Ilocos",
        code: "Ilocos",
        other_code: "01_Ilocos",
      },
      {
        name: "Cagayan Valley",
        code: "CagayanValley",
        other_code: "02_Cagayan_Valley",
      },
      {
        name: "Central Luzon",
        code: "CentralLuzon",
        other_code: "03_Central_Luzon",
      },
      {
        name: "CALABARZON",
        code: "CALABARZON",
        other_code: "04_CALABARZON",
      },
      {
        name: "Bicol Region",
        code: "BicolRegion",
        other_code: "05_Bicol_Region",
      },
      {
        name: "Western Visayas",
        code: "WesternVisayas",
        other_code: "06_Western_Visayas",
      },
      {
        name: "Central Visayas",
        code: "CentralVisayas",
        other_code: "07_Central_Visayas",
      },
      {
        name: "Eastern Visayas",
        code: "EasternVisayas",
        other_code: "08_Eastern_Visayas",
      },
      {
        name: "Zamboanga Peninsula",
        code: "ZamboangaPeninsula",
        other_code: "09_Zamboanga_Peninsula",
      },
      {
        name: "Northern Mindanao",
        code: "NorthernMindanao",
        other_code: "10_Northern_Mindanao",
      },
      {
        name: "Davao Region",
        code: "DavaoRegion",
        other_code: "11_Davao_Region",
      },
      {
        name: "SOCCSKSARGEN",
        code: "Soccsksargen",
        other_code: "12_Soccsksargen",
      },
      {
        name: "National Capital Region",
        code: "NationalCapitalRegion",
        other_code: "13_National_Capital_Region",
      },
      {
        name: "Cordillera Administration Region",
        code: "CordilleraAdministrativeRegion",
        other_code: "14_Cordillera_Administrative_Region",
      },
      {
        name: "Bangsamoro Autonomous Region in Muslim Mindanao",
        code: "BangsamoroAutonomousRegioninMuslimMindanao",
        other_code: "15_Bangsamoro_Autonomous_Region_in_Muslim_Mindanao",
      },
      {
        name: "CARAGA",
        code: "CARAGA",
        other_code: "16_CARAGA",
      },
      {
        name: "MIMAROPA",
        code: "MIMAROPA",
        other_code: "17_MIMAROPA",
      },
    ];
    try {
      for (const region of payload) {
        const payloadRegion = {
          code: region.code,
          otherCode: region.other_code,
          name: region.name,
          description: region.name,
        };
        await regions.insertRegion(payloadRegion, txn);
      }

      return { success: true };
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
  getCountries,
  getRegions,
  getProvinces,
  getCityMunicipalities,
  getBarangays,
  registerRegion,
  // getGraduates,
  // getRoles,
  // searchEmployees,

  // authenticate,
  // logout,

  // insertUser,
  // insertRole,

  // updateUser,
  // updateRole,
};

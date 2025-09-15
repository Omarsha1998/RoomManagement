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
    message: "Welcome to UERM Geography API"
  });
};

const getCountries = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    try {
      let conditions = "";
      let args = [];
      let order = "";

      if (req.query.code) {
        args = [req.query.code]
        conditions = 'and code = ?'
      }
      
      if (req.query.name) {
        args = []
        conditions = `and name like '%${req.query.name}%'`
      }

      if (req.query.orderSequence) {
        args = []
        order = `sequence`
      }

      return await countries.selectCountries(
        conditions,
        args,
        {
          order: order,
          top: "",
        },
        txn
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
        args = [req.query.code]
        conditions = 'and code = ?'
      }
      
      if (req.query.name) {
        args = []
        conditions = `and name like '%${req.query.name}%'`
      }

      return await regions.selectRegions(
        conditions,
        args,
        {
          order: "displaySequence",
          top: "",
        },
        txn
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
        txn
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
      let args = [];
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
          txn
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
      let args = [];
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
        txn
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
      for (let region of payload) {
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

const registerCountries = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const payload = [
      { name: "Afghanistan", code: "AF" },
      { name: "Åland Islands", code: "AX" },
      { name: "Albania", code: "AL" },
      { name: "Algeria", code: "DZ" },
      { name: "American Samoa", code: "AS" },
      { name: "AndorrA", code: "AD" },
      { name: "Angola", code: "AO" },
      { name: "Anguilla", code: "AI" },
      { name: "Antarctica", code: "AQ" },
      { name: "Antigua and Barbuda", code: "AG" },
      { name: "Argentina", code: "AR" },
      { name: "Armenia", code: "AM" },
      { name: "Aruba", code: "AW" },
      { name: "Australia", code: "AU" },
      { name: "Austria", code: "AT" },
      { name: "Azerbaijan", code: "AZ" },
      { name: "Bahamas", code: "BS" },
      { name: "Bahrain", code: "BH" },
      { name: "Bangladesh", code: "BD" },
      { name: "Barbados", code: "BB" },
      { name: "Belarus", code: "BY" },
      { name: "Belgium", code: "BE" },
      { name: "Belize", code: "BZ" },
      { name: "Benin", code: "BJ" },
      { name: "Bermuda", code: "BM" },
      { name: "Bhutan", code: "BT" },
      { name: "Bolivia", code: "BO" },
      { name: "Bosnia and Herzegovina", code: "BA" },
      { name: "Botswana", code: "BW" },
      { name: "Bouvet Island", code: "BV" },
      { name: "Brazil", code: "BR" },
      { name: "British Indian Ocean Territory", code: "IO" },
      { name: "Brunei Darussalam", code: "BN" },
      { name: "Bulgaria", code: "BG" },
      { name: "Burkina Faso", code: "BF" },
      { name: "Burundi", code: "BI" },
      { name: "Cambodia", code: "KH" },
      { name: "Cameroon", code: "CM" },
      { name: "Canada", code: "CA" },
      { name: "Cape Verde", code: "CV" },
      { name: "Cayman Islands", code: "KY" },
      { name: "Central African Republic", code: "CF" },
      { name: "Chad", code: "TD" },
      { name: "Chile", code: "CL" },
      { name: "China", code: "CN" },
      { name: "Christmas Island", code: "CX" },
      { name: "Cocos (Keeling) Islands", code: "CC" },
      { name: "Colombia", code: "CO" },
      { name: "Comoros", code: "KM" },
      { name: "Congo", code: "CG" },
      { name: "Congo, The Democratic Republic of the", code: "CD" },
      { name: "Cook Islands", code: "CK" },
      { name: "Costa Rica", code: "CR" },
      { name: "Cote D'Ivoire", code: "CI" },
      { name: "Croatia", code: "HR" },
      { name: "Cuba", code: "CU" },
      { name: "Cyprus", code: "CY" },
      { name: "Czech Republic", code: "CZ" },
      { name: "Denmark", code: "DK" },
      { name: "Djibouti", code: "DJ" },
      { name: "Dominica", code: "DM" },
      { name: "Dominican Republic", code: "DO" },
      { name: "Ecuador", code: "EC" },
      { name: "Egypt", code: "EG" },
      { name: "El Salvador", code: "SV" },
      { name: "Equatorial Guinea", code: "GQ" },
      { name: "Eritrea", code: "ER" },
      { name: "Estonia", code: "EE" },
      { name: "Ethiopia", code: "ET" },
      { name: "Falkland Islands (Malvinas)", code: "FK" },
      { name: "Faroe Islands", code: "FO" },
      { name: "Fiji", code: "FJ" },
      { name: "Finland", code: "FI" },
      { name: "France", code: "FR" },
      { name: "French Guiana", code: "GF" },
      { name: "French Polynesia", code: "PF" },
      { name: "French Southern Territories", code: "TF" },
      { name: "Gabon", code: "GA" },
      { name: "Gambia", code: "GM" },
      { name: "Georgia", code: "GE" },
      { name: "Germany", code: "DE" },
      { name: "Ghana", code: "GH" },
      { name: "Gibraltar", code: "GI" },
      { name: "Greece", code: "GR" },
      { name: "Greenland", code: "GL" },
      { name: "Grenada", code: "GD" },
      { name: "Guadeloupe", code: "GP" },
      { name: "Guam", code: "GU" },
      { name: "Guatemala", code: "GT" },
      { name: "Guernsey", code: "GG" },
      { name: "Guinea", code: "GN" },
      { name: "Guinea-Bissau", code: "GW" },
      { name: "Guyana", code: "GY" },
      { name: "Haiti", code: "HT" },
      { name: "Heard Island and Mcdonald Islands", code: "HM" },
      { name: "Holy See (Vatican City State)", code: "VA" },
      { name: "Honduras", code: "HN" },
      { name: "Hong Kong", code: "HK" },
      { name: "Hungary", code: "HU" },
      { name: "Iceland", code: "IS" },
      { name: "India", code: "IN" },
      { name: "Indonesia", code: "ID" },
      { name: "Iran, Islamic Republic Of", code: "IR" },
      { name: "Iraq", code: "IQ" },
      { name: "Ireland", code: "IE" },
      { name: "Isle of Man", code: "IM" },
      { name: "Israel", code: "IL" },
      { name: "Italy", code: "IT" },
      { name: "Jamaica", code: "JM" },
      { name: "Japan", code: "JP" },
      { name: "Jersey", code: "JE" },
      { name: "Jordan", code: "JO" },
      { name: "Kazakhstan", code: "KZ" },
      { name: "Kenya", code: "KE" },
      { name: "Kiribati", code: "KI" },
      { name: "Korea, Democratic People'S Republic of", code: "KP" },
      { name: "Korea, Republic of", code: "KR" },
      { name: "Kuwait", code: "KW" },
      { name: "Kyrgyzstan", code: "KG" },
      { name: "Lao People'S Democratic Republic", code: "LA" },
      { name: "Latvia", code: "LV" },
      { name: "Lebanon", code: "LB" },
      { name: "Lesotho", code: "LS" },
      { name: "Liberia", code: "LR" },
      { name: "Libyan Arab Jamahiriya", code: "LY" },
      { name: "Liechtenstein", code: "LI" },
      { name: "Lithuania", code: "LT" },
      { name: "Luxembourg", code: "LU" },
      { name: "Macao", code: "MO" },
      { name: "Macedonia, The Former Yugoslav Republic of", code: "MK" },
      { name: "Madagascar", code: "MG" },
      { name: "Malawi", code: "MW" },
      { name: "Malaysia", code: "MY" },
      { name: "Maldives", code: "MV" },
      { name: "Mali", code: "ML" },
      { name: "Malta", code: "MT" },
      { name: "Marshall Islands", code: "MH" },
      { name: "Martinique", code: "MQ" },
      { name: "Mauritania", code: "MR" },
      { name: "Mauritius", code: "MU" },
      { name: "Mayotte", code: "YT" },
      { name: "Mexico", code: "MX" },
      { name: "Micronesia, Federated States of", code: "FM" },
      { name: "Moldova, Republic of", code: "MD" },
      { name: "Monaco", code: "MC" },
      { name: "Mongolia", code: "MN" },
      { name: "Montserrat", code: "MS" },
      { name: "Morocco", code: "MA" },
      { name: "Mozambique", code: "MZ" },
      { name: "Myanmar", code: "MM" },
      { name: "Namibia", code: "NA" },
      { name: "Nauru", code: "NR" },
      { name: "Nepal", code: "NP" },
      { name: "Netherlands", code: "NL" },
      { name: "Netherlands Antilles", code: "AN" },
      { name: "New Caledonia", code: "NC" },
      { name: "New Zealand", code: "NZ" },
      { name: "Nicaragua", code: "NI" },
      { name: "Niger", code: "NE" },
      { name: "Nigeria", code: "NG" },
      { name: "Niue", code: "NU" },
      { name: "Norfolk Island", code: "NF" },
      { name: "Northern Mariana Islands", code: "MP" },
      { name: "Norway", code: "NO" },
      { name: "Oman", code: "OM" },
      { name: "Pakistan", code: "PK" },
      { name: "Palau", code: "PW" },
      { name: "Palestinian Territory, Occupied", code: "PS" },
      { name: "Panama", code: "PA" },
      { name: "Papua New Guinea", code: "PG" },
      { name: "Paraguay", code: "PY" },
      { name: "Peru", code: "PE" },
      { name: "Philippines", code: "PH" },
      { name: "Pitcairn", code: "PN" },
      { name: "Poland", code: "PL" },
      { name: "Portugal", code: "PT" },
      { name: "Puerto Rico", code: "PR" },
      { name: "Qatar", code: "QA" },
      { name: "Reunion", code: "RE" },
      { name: "Romania", code: "RO" },
      { name: "Russian Federation", code: "RU" },
      { name: "RWANDA", code: "RW" },
      { name: "Saint Helena", code: "SH" },
      { name: "Saint Kitts and Nevis", code: "KN" },
      { name: "Saint Lucia", code: "LC" },
      { name: "Saint Pierre and Miquelon", code: "PM" },
      { name: "Saint Vincent and the Grenadines", code: "VC" },
      { name: "Samoa", code: "WS" },
      { name: "San Marino", code: "SM" },
      { name: "Sao Tome and Principe", code: "ST" },
      { name: "Saudi Arabia", code: "SA" },
      { name: "Senegal", code: "SN" },
      { name: "Serbia and Montenegro", code: "CS" },
      { name: "Seychelles", code: "SC" },
      { name: "Sierra Leone", code: "SL" },
      { name: "Singapore", code: "SG" },
      { name: "Slovakia", code: "SK" },
      { name: "Slovenia", code: "SI" },
      { name: "Solomon Islands", code: "SB" },
      { name: "Somalia", code: "SO" },
      { name: "South Africa", code: "ZA" },
      { name: "South Georgia and the South Sandwich Islands", code: "GS" },
      { name: "Spain", code: "ES" },
      { name: "Sri Lanka", code: "LK" },
      { name: "Sudan", code: "SD" },
      { name: "Suriname", code: "SR" },
      { name: "Svalbard and Jan Mayen", code: "SJ" },
      { name: "Swaziland", code: "SZ" },
      { name: "Sweden", code: "SE" },
      { name: "Switzerland", code: "CH" },
      { name: "Syrian Arab Republic", code: "SY" },
      { name: "Taiwan, Province of China", code: "TW" },
      { name: "Tajikistan", code: "TJ" },
      { name: "Tanzania, United Republic of", code: "TZ" },
      { name: "Thailand", code: "TH" },
      { name: "Timor-Leste", code: "TL" },
      { name: "Togo", code: "TG" },
      { name: "Tokelau", code: "TK" },
      { name: "Tonga", code: "TO" },
      { name: "Trinidad and Tobago", code: "TT" },
      { name: "Tunisia", code: "TN" },
      { name: "Turkey", code: "TR" },
      { name: "Turkmenistan", code: "TM" },
      { name: "Turks and Caicos Islands", code: "TC" },
      { name: "Tuvalu", code: "TV" },
      { name: "Uganda", code: "UG" },
      { name: "Ukraine", code: "UA" },
      { name: "United Arab Emirates", code: "AE" },
      { name: "United Kingdom", code: "GB" },
      { name: "United States", code: "US" },
      { name: "United States Minor Outlying Islands", code: "UM" },
      { name: "Uruguay", code: "UY" },
      { name: "Uzbekistan", code: "UZ" },
      { name: "Vanuatu", code: "VU" },
      { name: "Venezuela", code: "VE" },
      { name: "Viet Nam", code: "VN" },
      { name: "Virgin Islands, British", code: "VG" },
      { name: "Virgin Islands, U.S.", code: "VI" },
      { name: "Wallis and Futuna", code: "WF" },
      { name: "Western Sahara", code: "EH" },
      { name: "Yemen", code: "YE" },
      { name: "Zambia", code: "ZM" },
      { name: "Zimbabwe", code: "ZW" },
    ];
    try {
      for (let country of payload) {
        const payloadCountries = {
          code: country.code,
          name: country.name,
          description: country.name,
        };
        await countries.insertCountries(payloadCountries, txn);
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

const registerInstitutions = async function (req, res) {
  const returnValue = await sqlHelper.transact(async (txn) => {
    const payload = [
      {
       "region": "07 - Central Visayas",
       "desc": "AMA Computer College-Cebu City",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(032) 233-0553"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Asian College of Technology",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Talisay City",
       "website": "http://www.act.edu.ph/",
       "faxTelephoneNo": "(032) 238-2381; (032) 238-2384; (032) 238-2380"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "BIT International College - Siquijor",
       "institutionType": "Private HEI",
       "province": "Siquijor",
       "municipalityCity": "Siquijor",
       "website": "https://bit-icschools.com/",
       "faxTelephoneNo": "(038) 501-8042; (035) 480-9415"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Baptist Theological College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "http://btccgst.org/",
       "faxTelephoneNo": "(032) 345-0148"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Blessed Trinity College",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Talibon",
       "website": "https://www.blessedtrinitycollege.com/",
       "faxTelephoneNo": "(038) 515-5840"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "BIT International College-Tagbilaran",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "https://bit-icschools.com/",
       "faxTelephoneNo": "(038) 501-8456; (038) 501-8640"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Institute of Technology-Jagna",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Jagna",
       "website": "https://bit-icschools.com/",
       "faxTelephoneNo": "(038) 531-8152; (038) 531-8640"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "BIT International College-Talibon",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Talibon",
       "website": "https://bit-icschools.com/",
       "faxTelephoneNo": "(038) 510-7530; (038) 411-4856"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Island State University - Tagbilaran",
       "institutionType": "SUC Satellite",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "https://bisu.edu.ph/",
       "faxTelephoneNo": "(038) 411-3289; (038) 501-7516; (038) 411-3289; (038) 501-7516"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Island State University - Candijay",
       "institutionType": "SUC Satellite",
       "province": "Bohol",
       "municipalityCity": "Candijay",
       "website": "https://bisu.edu.ph/",
       "faxTelephoneNo": "9562534801"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Island State University - Calape Polytechnic College",
       "institutionType": "SUC Satellite",
       "province": "Bohol",
       "municipalityCity": "Calape",
       "website": "https://bisu.edu.ph/",
       "faxTelephoneNo": "(038) 507-9017"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "CATS Aero College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://cats.edu.ph/",
       "faxTelephoneNo": "(032) 233-0002; (032) 233-0097; (032) 233-0090"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Doctor's University",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://cebudoctorsuniversity.edu/",
       "faxTelephoneNo": "(032) 238-8333 Local 8186; (032) 238-8764; (032) 255-5555 Local 207"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Doctor's University College of Medicine",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://cebudoctorsuniversity.edu/",
       "faxTelephoneNo": "(032) 238-8764; (032) 238-8333 Local 8186"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Eastern College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 254-22761 (032) 256-2523; (032) 256-2526"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Institute of Medicine",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.cim.edu.ph/",
       "faxTelephoneNo": "(032) 253-9498; (032) 253-9127; (032) 253-7412"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Institute of Technology-University",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.cit.edu/",
       "faxTelephoneNo": "(032) 261-7741 local 131; (032) 261-7743"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Roosevelt Memorial College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Bogo City",
       "website": "http://www.crmci.com/",
       "faxTelephoneNo": "(032) 434-7488; (032) 434-7365"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Saint Paul College Foundation",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.spcfi.edu.ph/",
       "faxTelephoneNo": "(032) 272-2985; (032) 272-8475 loc 9"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu School of Midwifery",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 254-9731 loc 207; (032) 255-4792; (032) 418-7169"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Normal University",
       "institutionType": "SUC Main",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://cnu.edu.ph/",
       "faxTelephoneNo": "(032) 253-9611; (032) 253-6211"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Normal University - Balamban",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Balamban",
       "website": "https://cnu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Normal University - Medellin",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Medellin",
       "website": "https://cnu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University - Main",
       "institutionType": "SUC Main",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032) 412-1400; (032) 256-1537; (032) 412-1270"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "College of Technological Sciences-Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://cts.edu.ph/",
       "faxTelephoneNo": "(032) 256-1303; (032) 256-1304; (032) 254-2434; (032) 256-1303 local 123"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Oriental State University-Main Campus",
       "institutionType": "SUC Main",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "http://www.norsu.edu.ph/",
       "faxTelephoneNo": "(035) 225-9400 local 101; (035) 225-0777; (035) 225-9400 local 119"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Oriental State University-Mabinay Institute of Technology",
       "institutionType": "SUC Satellite",
       "province": "Negros Oriental",
       "municipalityCity": "Mabinay",
       "website": "http://www.norsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Colegio De Santa Catalina De Alejandria",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://cosca.edu.ph/",
       "faxTelephoneNo": "(035) 422-3174; (035) 225-7435; (035) 422-7652"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Concord Technical Institute",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 418-9503; (032) 236-4546; (032) 266-4937"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University-Argao Campus",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Argao",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032) 485-8290"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University-Daanbantayan Campus",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Daanbantayan",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032) 437-8526"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University-Danao City Campus",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Danao City",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032)354-3660"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University-Barili Campus",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Barili",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University-Moalboal Campus",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Moalboal",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032) 474-8196"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University-San Francisco Campus",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "San Francisco",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032) 402-4060 loc. 1205; 09496852745"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University-Tuburan Campus",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Tuburan",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032) 463-9313; (032) 463-9492"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Oriental State University-Bais1",
       "institutionType": "SUC Satellite",
       "province": "Negros Oriental",
       "municipalityCity": "Bais City",
       "website": "http://www.norsu.edu.ph/",
       "faxTelephoneNo": "(035) 402-9190; (035) 541-5500; (035) 225-0777"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Oriental State University-Guihulngan",
       "institutionType": "SUC Satellite",
       "province": "Negros Oriental",
       "municipalityCity": "Guihulngan City",
       "website": "http://www.norsu.edu.ph/",
       "faxTelephoneNo": "(035) 336-1416; (035) 336-1083"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Holy Name University",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "https://hnu.edu.ph/",
       "faxTelephoneNo": "(038) 412-3432; (038) 412-3387"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Diaz College",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Tanjay City",
       "website": "https://diazcollege.net/",
       "faxTelephoneNo": "(035) 415-9157; (035) 527-0152"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Felipe R. Verallo Memorial Foundation-Bogo",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Bogo City",
       "website": "http://frvcollege.com/",
       "faxTelephoneNo": "(032) 434-8210"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Foundation University",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://www.foundationu.com/",
       "faxTelephoneNo": "(035) 522-1693; (035) 422-9167 local 100"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Oriental State University -Bais II",
       "institutionType": "SUC Satellite",
       "province": "Negros Oriental",
       "municipalityCity": "Bais City",
       "website": "http://www.norsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of the Visayas-Gullas College of Medicine",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://uv.edu.ph/",
       "faxTelephoneNo": "(032) 345-21-59; (032) 255-2561"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Holy Trinity College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Ginatilan",
       "website": "",
       "faxTelephoneNo": "(032) 478-9005"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Immaculate Heart of Mary Seminary",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "https://www.ihmseminary.org/",
       "faxTelephoneNo": "(038) 412-5198; (038) 412-5651"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Indiana School of Aeronautics",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Lapu-Lapu City",
       "website": "http://iau.com.ph/",
       "faxTelephoneNo": "(032) 505-7445; (032) 495-6636; (032) 495-6884"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Siquijor State College",
       "institutionType": "SUC Main",
       "province": "Siquijor",
       "municipalityCity": "Larena",
       "website": "https://siquijorstate.edu.ph/",
       "faxTelephoneNo": "(035) 377-2223; (035) 377-2222"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of the Visayas-Mandaue Campus",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://uv.edu.ph/",
       "faxTelephoneNo": "(032) 268-9432; (032) 420-3148; (032) 253-2752"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Mater Dei College-Bohol",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tubigon",
       "website": "http://ww1.mdc.ph/",
       "faxTelephoneNo": "(038) 508-8166"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Oriental State University-Bayawan",
       "institutionType": "SUC Satellite",
       "province": "Negros Oriental",
       "municipalityCity": "Bayawan",
       "website": "http://www.norsu.edu.ph/",
       "faxTelephoneNo": "(035) 531-0501; (035) 228-3207"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Northern Cebu College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Bogo City",
       "website": "",
       "faxTelephoneNo": "(032) 251-2643"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "PMI Colleges-Bohol",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "",
       "faxTelephoneNo": "(038) 411-2601 (038) 235-25611; (038) 501-9804; (038) 235-5611"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Philippine State College of Aeronautics-Mactan Air Base",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Lapu-Lapu City",
       "website": "",
       "faxTelephoneNo": "(032) 340-8046"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Saint Francis College-Guihulngan",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Guihulngan City",
       "website": "https://saintfranciscollegeguihulngan.weebly.com/",
       "faxTelephoneNo": "(035) 231-3120"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Saint Joseph College of Canlaon",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Canlaon City",
       "website": "",
       "faxTelephoneNo": "09176891166; 0928-9413783"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Saint Joseph Seminary College",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Sibulan",
       "website": "https://www.sjasc.edu/",
       "faxTelephoneNo": "(035) 419-7118; (035) 419-7118"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "St. Paul University Dumaguete",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://www.spud.edu.ph/",
       "faxTelephoneNo": "(035) 225-1506; (035) 225-7217; (035) 422-4520"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Saint Theresa's College of Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.stccebu.edu.ph/",
       "faxTelephoneNo": "(032) 253-6339; (032) 253-3468"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Salazar Colleges of Science and Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "http://scsit.edu.ph/",
       "faxTelephoneNo": "(032) 261-0235; (032) 418-5538"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "San Carlos Seminary College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://scsccebu.com/",
       "faxTelephoneNo": "(032) 232-8503; (032) 233-0128; (032) 231-4514"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Oriental State University-Siaton Community College",
       "institutionType": "SUC Satellite",
       "province": "Negros Oriental",
       "municipalityCity": "Siaton",
       "website": "http://www.norsu.edu.ph/",
       "faxTelephoneNo": "(035) 922-5592"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Silliman University",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://su.edu.ph/",
       "faxTelephoneNo": "(035) 422-6002; (035) 422-8880; (035) 422-7195"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Southwestern University",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://swu.phinma.edu.ph/",
       "faxTelephoneNo": "(032) 256-2040; (032) 253-7501"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "St. Catherine'S College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Carcar City",
       "website": "http://scc.edu.ph/",
       "faxTelephoneNo": "(032) 487-9708; (032) 487-8361; (032) 487-8454"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Southwestern University-Matias H. Aznar Memorial College of Medicine",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "http://mham.edu.ph/",
       "faxTelephoneNo": "(032) 412-2942; (032) 412-2940; (032) 412-2501"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of the Visayas-Toledo City Campus",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Toledo City",
       "website": "https://toledo.uv.edu.ph/",
       "faxTelephoneNo": "(032) 322-5177; (032) 322-5629; (032) 383-5933"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Trinidad Municipal College",
       "institutionType": "LUC",
       "province": "Bohol",
       "municipalityCity": "Trinidad",
       "website": "http://trinidad-bohol.gov.ph/",
       "faxTelephoneNo": "(038) 516-1023"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of Bohol",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "https://universityofbohol.edu.ph/",
       "faxTelephoneNo": "(038) 411-3484; (038) 412-2081; (038) 411-3101; (038) 411-2603"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://uc.edu.ph/",
       "faxTelephoneNo": "(032) 255-7777; (032) 412-3542; (032) 253-0729; (032) 255-0655"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of San Carlos",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.usc.edu.ph/",
       "faxTelephoneNo": "(032) 253-1000 loc 252; (032) 255-4341; (032) 254-1006"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of San Jose-Recoletos",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://usjr.edu.ph/",
       "faxTelephoneNo": "(032) 253-7900 local 210; (032) 254-1720; (032) 253-6763"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of Southern Philippines Foundation",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "http://www.uspf.edu.ph/",
       "faxTelephoneNo": "(032) 414-8773 loc 126; (032) 414-7772"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of the Visayas",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://uv.edu.ph/",
       "faxTelephoneNo": "(032) 253-6875; (032) 416-7991; (032) 255-2561; (032) 255-7877"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of the Philippines-College of Cebu",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.upcebu.edu.ph/",
       "faxTelephoneNo": "(032) 231-3086; (032) 232-8104"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Quezon Memorial Institute of Siquijor",
       "institutionType": "Private HEI",
       "province": "Siquijor",
       "municipalityCity": "Siquijor",
       "website": "",
       "faxTelephoneNo": "(035) 480-9086; (035) 480-9214"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Velez College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "http://www.velezcollege.com/",
       "faxTelephoneNo": "(032) 253-6830; (032) 253-6887"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Villaflores College",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Tanjay City",
       "website": "https://villaflorescollege.wordpress.com/",
       "faxTelephoneNo": "(035) 415-9015"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Technological University - College of Fisheries Technology - Carmen",
       "institutionType": "SUC Satellite",
       "province": "Cebu",
       "municipalityCity": "Carmen",
       "website": "https://www.ctu.edu.ph/carmen/about/",
       "faxTelephoneNo": "(032) 429-9898"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Batuan Colleges",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Batuan",
       "website": "",
       "faxTelephoneNo": "(038) 533-9016"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Don Bosco Technology Center",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.dbtc-cebu.edu.ph/",
       "faxTelephoneNo": "(032) 414-3433; (032) 272-1127 loc 135; (032) 273-1127 loc 117"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros Maritime College Foundation",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Sibulan",
       "website": "http://www.negrosmaritimecollege.edu.ph/",
       "faxTelephoneNo": "(035) 225-5215; (035) 225-5408"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Royal Christian College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "",
       "faxTelephoneNo": "(032) 343-9399; (032) 420-2090; (032) 422-2355"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of Cebu-Lapulapu and Mandaue",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://uc.edu.ph/",
       "faxTelephoneNo": "(032) 345-6666 Local 204; (032) 346-7462; (032) 346-3153"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Asian College of Science and Technology-Dumaguete",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://www.asiancollege.edu.ph/",
       "faxTelephoneNo": "(035) 225-4714; (035) 225-4804; (035) 421-0469"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "De La Salle Andres Soriano Memorial College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Toledo City",
       "website": "https://dlsasmc.edu.ph/",
       "faxTelephoneNo": "(032) 325-2026"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bantayan Southern Institute",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Bantayan",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Mount Moriah College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Poro",
       "website": "",
       "faxTelephoneNo": "09778301241; (032) 272-00-03"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Presbyterian Theological College",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://www.pu-edu.asia/",
       "faxTelephoneNo": "(035) 421-2754; (035) 420-0468"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "STI College-Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(032) 234-2265; (032) 231-4984; (032) 234-2267"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Visayan Nazarene Bible College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.vnbc.edu.ph/",
       "faxTelephoneNo": "(032) 231-2812; (032) 416-2588"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Island State University - Bilar",
       "institutionType": "SUC Main",
       "province": "Bohol",
       "municipalityCity": "Bilar",
       "website": "https://bisu.edu.ph/",
       "faxTelephoneNo": "(038) 535-9003"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Northern Star College",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Ubay",
       "website": "https://www.bnsc.edu.ph/",
       "faxTelephoneNo": "(038) 518-8173; (038) 5443563; (038) 5443565"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "CBD College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 272-7810; (032) 273-4186; (032) 272-7819"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Consolatrix College of Toledo City",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Toledo City",
       "website": "http://cctc.edu.ph/",
       "faxTelephoneNo": "(032) 322-5644; (032) 467-9184"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Evangelical Theological College of the Philippines",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 254-0070"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Saint Louise de Marillac College-Bogo",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Bogo City",
       "website": "https://www.slmcb.edu.ph/main.php",
       "faxTelephoneNo": "(032) 434-7160; (032) 434-8687"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Seminaryo Mayor de San Carlos",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 231-2670; (032) 412-7505; (032) 4162080"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Advanced Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Lapu-Lapu City",
       "website": "",
       "faxTelephoneNo": "(032) 340-5534"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Collegium Societatis Angeli Pacis",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Talisay City",
       "website": "",
       "faxTelephoneNo": "(032) 505-5659; (032) 272-7775"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Centre for International Education Global Colleges",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://cie.edu/",
       "faxTelephoneNo": "(032) 233-2500; (032) 233-2566; (032) 233-2522"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "BIT International College-Carmen",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Carmen",
       "website": "https://bit-icschools.com/",
       "faxTelephoneNo": "(038) 411-4556; (038) 411-4856"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "AMA Computer College-Dumaguete City",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://www.ama.edu.ph/",
       "faxTelephoneNo": "(035) 422-9407; (035) 225-8840"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of the Visayas -Gullas College Danao City Branch",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Danao City",
       "website": "https://uv.edu.ph/",
       "faxTelephoneNo": "(032) 343-0068; (032) 343-0050; (032) 343-0075"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Negros College",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Ayungon",
       "website": "https://nanci.edu.ph/",
       "faxTelephoneNo": "(035) 400-6974; 0917-3170700"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Benedicto College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://benedictocollege.edu.ph/",
       "faxTelephoneNo": "(032) 345-5790; (032) 345-6873"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Northeastern Cebu Colleges",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Danao City",
       "website": "",
       "faxTelephoneNo": "(032) 233-9660; (032) 233-9637; (032) 253-3083"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Island State University - Clarin",
       "institutionType": "SUC Satellite",
       "province": "Bohol",
       "municipalityCity": "Clarin",
       "website": "https://www.bisuclarin.edu.ph/",
       "faxTelephoneNo": "(038) 509-9061"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "St. Paul College Foundation-Mandaue",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://www.spcfi.edu.ph/",
       "faxTelephoneNo": "(032) 346-5763; (032) 422-3646; (032) 272-2985"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of Cebu-Banilad",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://uc.edu.ph/",
       "faxTelephoneNo": "(032) 233-8116; (032) 233-8888; (032) 260-6742"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Northwestern Colleges",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Catigbian",
       "website": "",
       "faxTelephoneNo": "(038) 5443416"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Sacred Heart College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Talisay City",
       "website": "",
       "faxTelephoneNo": "(032) 272-4347 "
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Larmen De Guia Memorial College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "http://www.larmendeguia.com/",
       "faxTelephoneNo": "(032) 328-4044; (032) 328-4045; (032) 346-8255"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Interface Computer College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://home.interface.edu.ph/",
       "faxTelephoneNo": "(032) 254-2688; (032) 412-5986; 0922-8448859"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Mary's Children Formation College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Minglanilla",
       "website": "",
       "faxTelephoneNo": "(032) 272-6749; (032) 273-3445"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Rogationist Seminary College-Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 272-0947; (032) 406-7219; (032) 272-4198; (032) 406-7219"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Colegio de San Antonio de Padua",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Danao City",
       "website": "",
       "faxTelephoneNo": "(032) 260-0748; (032) 260-0704; (032) 260-0749"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cristal e-College-Tagbilaran",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "https://cec.edu.ph/",
       "faxTelephoneNo": "(038) 412-2509"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "STI College-Bohol",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Dauis",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(038) 235-5166; (038) 235-5165; (038) 510-8149; 0917-5430634; 0922-8140202; (038) 510-8149; 0922-8110625; 0917-5599371"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of the Visayas-Gullas College Minglanilla Campus",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Minglanilla",
       "website": "https://uv.edu.ph/",
       "faxTelephoneNo": "(032) 272-8562; (032) 272-3249"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Wisdom School",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "https://bws.edu.ph/bws/",
       "faxTelephoneNo": "(032) 501-9410; (032) 412-5150 local 807"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Buenavista Community College",
       "institutionType": "LUC",
       "province": "Bohol",
       "municipalityCity": "Buenavista",
       "website": "",
       "faxTelephoneNo": "(038) 513-9169; (038) 513-9179; (038) 513-9005"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Talisay City College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Talisay City",
       "website": "",
       "faxTelephoneNo": "(032) 273 8170; (032) 272-1454"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Central Philippine Bible College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 254-9116; 0917-3016252"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cebu Mary Immaculate College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 345-8870; (032) 415-9289; (032) 344-8710"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "ACLC College of Mandaue",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(032) 238-2381; (032) 238-2384; (032) 238-2380"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Immanuel Bible College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 255-4965; (032) 505-5016"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Trade-Tech International Science Institute",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "",
       "faxTelephoneNo": "(032) 3464433; (032) 346-4436"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cristal e-College (Panglao Campus)",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Panglao",
       "website": "https://cec.edu.ph/",
       "faxTelephoneNo": "(038) 502-8408; (038) 502-8409"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Cordova Public College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Cordova",
       "website": "https://simplecpc.wordpress.com/",
       "faxTelephoneNo": "(032) 494-1410; (032) 236-6170"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Professional Academy of the Philippines",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 273-6484"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "La Consolacion College-Liloan",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Liloan",
       "website": "https://lcc-l.weebly.com/",
       "faxTelephoneNo": "(032) 564-2866; (032) 424-4648"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Sto. Tomas College-Danao City",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Danao City",
       "website": "",
       "faxTelephoneNo": "(032) 260-4389; (032) 260-3648"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Madridejos Community College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Madridejos",
       "website": "",
       "faxTelephoneNo": "(032) 516-0802"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Microsystem International Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Naga City",
       "website": "",
       "faxTelephoneNo": "(032) 489-6112 "
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Metro Dumaguete College",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://mdci.edu.ph/",
       "faxTelephoneNo": "(035) 422-9728(035) 422-4605"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of The Visayas-Dalaguete Campus",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Dalaguete",
       "website": "https://dalaguete.uv.edu.ph/",
       "faxTelephoneNo": "(032) 484-8483; (032) 484-8717"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Maxino College-Dumaguete",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "",
       "faxTelephoneNo": "(035) 422-6703; (035) 225-1612"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "La Consolacion College-Bais",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Bais City",
       "website": "",
       "faxTelephoneNo": "(035) 541-5097"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Mandaue City College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "",
       "faxTelephoneNo": "(032) 236-5520"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Lyceum of Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "https://www.lyceumofcebu.edu.ph/cebu-campus-main/",
       "faxTelephoneNo": "(032) 255 1981"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Golden Success College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "http://college.golden-success.com/",
       "faxTelephoneNo": "(032) 261-8210; (032) 255-6691"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "ACLC-Tagbilaran",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City",
       "website": "http://www.aclc.edu.ph/",
       "faxTelephoneNo": "(038) 501-9631"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "St. Cecilia's College - Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Minglanilla",
       "website": "https://stcecilia.edu.ph/",
       "faxTelephoneNo": "(032) 268-4746; (032) 490-0767"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Consolacion Community College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Consolacion",
       "website": "https://www.ctu.edu.ph/",
       "faxTelephoneNo": "(032) 514-4202; (032) 239-2908; (032) 512-6743"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Sibonga Community College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Sibonga",
       "website": "https://sibongahei.com/",
       "faxTelephoneNo": "(032) 486-8232; (032) 486-9416"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol Island State University-Balilihan Campus",
       "institutionType": "SUC Satellite",
       "province": "Bohol",
       "municipalityCity": "Balilihan",
       "website": "https://bisubalilihan.com/",
       "faxTelephoneNo": "(038) 401-0797"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Lapu-lapu City College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Lapu-Lapu City",
       "website": "https://llcc.edu.ph/",
       "faxTelephoneNo": "(032) 263-1832; (032) 268-4229"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Saint Louis College -Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://slccebu.edu.ph/",
       "faxTelephoneNo": "(032) 345-6749; (032) 236-4352; (032) 345-1228 local 110; (032) 236-4352"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Mary Our Help Technical Institute for Women",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Minglanilla",
       "website": "https://maryourhelp-cebu.edu.ph/",
       "faxTelephoneNo": "(032) 490-7001; (032) 490-7378"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Carmelite College - Siquijor",
       "institutionType": "Private HEI",
       "province": "Siquijor",
       "municipalityCity": "Siquijor",
       "website": "https://www.carmelitecollegesiquijor.com/",
       "faxTelephoneNo": "(035) 344-2098; (035) 226-1417"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Rosemont Hills Montessori College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Danao City",
       "website": "https://rosemonthills.com/",
       "faxTelephoneNo": "(032) 511-1798; 0922-8687318; (032) 346-6879; 0922-8687314"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Salazar Colleges of Science and Institute of Technology-Madredijos",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Madridejos",
       "website": "http://scsit.edu.ph/",
       "faxTelephoneNo": "(032) 439-7926"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Tabor Hills College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 511-5282"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Carcar City College",
       "institutionType": "LUC",
       "province": "Cebu",
       "municipalityCity": "Carcar City",
       "website": "",
       "faxTelephoneNo": "(032) 487-7289; (032) 231-3044"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Rizwoods Colleges",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 383-6586"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Informatics College Cebu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "",
       "faxTelephoneNo": "(032) 231-0384; (032) 231-0380"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Bohol International Learning College",
       "institutionType": "Private HEI",
       "province": "Bohol",
       "municipalityCity": "Cortes ",
       "website": "",
       "faxTelephoneNo": "(038) 503-9400; (038) 503-9405"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "STI College - Dumaguete",
       "institutionType": "Private HEI",
       "province": "Negros Oriental",
       "municipalityCity": "Dumaguete City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(035) 422-9570; (035) 225-3888"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "University of Cebu College of Medicine Foundation",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Mandaue City",
       "website": "https://uc.edu.ph/",
       "faxTelephoneNo": "(032) 232-1525"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Benthel Asia School of Technology",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Lapu-Lapu City",
       "website": "https://benthelasia.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Salazar Colleges of Science and Institute of Technology-Talisay City",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Talisay City",
       "website": "http://scsit.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Rizwoods College-Lapulapu",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Lapu-Lapu City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Sto. Niño Mactan College",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Lapu-Lapu City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Asian College of Technology International Educational Foundation",
       "institutionType": "Private HEI",
       "province": "Cebu",
       "municipalityCity": "Cebu City",
       "website": "http://www.act.edu.ph/",
       "faxTelephoneNo": "(032)-2551773; (032)-2382381; (032)-2382380"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Tagbilaran City College",
       "institutionType": "LUC",
       "province": "Bohol",
       "municipalityCity": "Tagbilaran City ",
       "website": "",
       "faxTelephoneNo": "(038) 411-2464"
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Talibon Polytechnic College",
       "institutionType": "LUC",
       "province": "Bohol",
       "municipalityCity": "Talibon",
       "website": "https://www.tpc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "07 - Central Visayas",
       "desc": "Colegio de Getafe",
       "institutionType": "LUC",
       "province": "BOHOL",
       "municipalityCity": "GETAFE",
       "website": "",
       "faxTelephoneNo": "(63)9177085682"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Abuyog Community College",
       "institutionType": "LUC",
       "province": "Leyte",
       "municipalityCity": "Abuyog",
       "website": "",
       "faxTelephoneNo": "0921-5697971"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Asian Development Foundation College",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://adfcollege.net/",
       "faxTelephoneNo": "(053) 325-7654; (053) 325-8698"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Biliran Province State University-Biliran Campus",
       "institutionType": "SUC Satellite",
       "province": "Biliran",
       "municipalityCity": "Biliran",
       "website": "https://bipsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Samar State University-Can-Avid Campus",
       "institutionType": "SUC Satellite",
       "province": "Eastern Samar",
       "municipalityCity": "Can-Avid",
       "website": "https://essu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Visayas State University-Carigara Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Carigara",
       "website": "https://www.evsu.edu.ph/",
       "faxTelephoneNo": "(053) 530-2139"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Christ the King College-Calbayog City",
       "institutionType": "Private HEI",
       "province": "Western Samar",
       "municipalityCity": "Calbayog City",
       "website": "",
       "faxTelephoneNo": "(055) 209-3363; (055) 533-9521"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "The College of Maasin",
       "institutionType": "Private HEI",
       "province": "Southern Leyte",
       "municipalityCity": "Maasin City",
       "website": "https://www.cm.edu.ph/",
       "faxTelephoneNo": "(053) 862-0092; (053) 570-9575; (053) 570-8671"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Dr. V. Orestes Romualdez Educational Foundation",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "",
       "faxTelephoneNo": "(053) 325-8353; 0917-1063497"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Doña Remedios Trinidad-Romualdez Medical Foundation",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://www.rmcedu.com/",
       "faxTelephoneNo": "(053) 325-8353"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Samar State University",
       "institutionType": "SUC Main",
       "province": "Eastern Samar",
       "municipalityCity": "Borongan City",
       "website": "https://essu.edu.ph/",
       "faxTelephoneNo": "(055) 261-2725"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Samar State University-Guiuan Campus",
       "institutionType": "SUC Satellite",
       "province": "Eastern Samar",
       "municipalityCity": "Guiuan",
       "website": "https://essu.edu.ph/",
       "faxTelephoneNo": "(055) 332-1230; (055) 271-2073"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Franciscan College of the Immaculate Conception",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Baybay City",
       "website": "http://fcic.edu.ph/",
       "faxTelephoneNo": "(053) 335-2282"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Holy Infant College",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "",
       "faxTelephoneNo": "(053) 832-2455; (053) 832-2344; (053) 832-5544"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Visayas State University-Isabel Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Isabel",
       "website": "https://www.vsu.edu.ph/academe/satellite-campuses/isabel",
       "faxTelephoneNo": ""
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "University of Eastern Philippines-Laoang Campus",
       "institutionType": "SUC Satellite",
       "province": "Northern Samar",
       "municipalityCity": "Laoang",
       "website": "http://uep.edu.ph/",
       "faxTelephoneNo": "(055) 251-9149"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Leyte Colleges",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "",
       "faxTelephoneNo": "(053) 325-2433"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Visayas State University",
       "institutionType": "SUC Main",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://www.evsu.edu.ph/",
       "faxTelephoneNo": "(053) 321-1084"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Visayas State University-Villaba Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Villaba",
       "website": "https://www.vsu.edu.ph/academe/satellite-campuses/villaba",
       "faxTelephoneNo": "0939-9132245"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Leyte Normal University",
       "institutionType": "SUC Main",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://www.lnu.edu.ph/",
       "faxTelephoneNo": "(053) 321-2176; (053) 325-6122"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Visayas State University-Tanauan Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Tanauan",
       "website": "https://www.evsu.edu.ph/",
       "faxTelephoneNo": "(053) 322-4290; (053) 322-5166; (053) 322-5308"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Visayas State University-Alang-Alang Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Alang-Alang",
       "website": "https://www.vsu.edu.ph/academe/satellite-campuses/alangalang",
       "faxTelephoneNo": "0977-8160015; 0917-6341478; 0907-3621511"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Visayas State University-Tolosa Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Tolosa",
       "website": "https://www.vsu.edu.ph/academe/satellite-campuses/tolosa",
       "faxTelephoneNo": "(053) 530-3373"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Biliran Province State University-Main",
       "institutionType": "SUC Main",
       "province": "Biliran",
       "municipalityCity": "Naval",
       "website": "https://bipsu.edu.ph/",
       "faxTelephoneNo": "(053) 500-9045"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Palompon Institute of Technology",
       "institutionType": "SUC Main",
       "province": "Leyte",
       "municipalityCity": "Palompon",
       "website": "https://pit.edu.ph/pitsuc/",
       "faxTelephoneNo": "(053) 555-9841"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "University of Eastern Philippines-Catubig Campus",
       "institutionType": "SUC Satellite",
       "province": "Northern Samar",
       "municipalityCity": "Catubig",
       "website": "http://uep.edu.ph/",
       "faxTelephoneNo": "0917-3120190; 0906-1122008"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Southern Leyte State University-Bontoc Campus",
       "institutionType": "SUC Satellite",
       "province": "Southern Leyte",
       "municipalityCity": "Bontoc",
       "website": "https://southernleytestateu.edu.ph/index.php/en/bontoc-campus",
       "faxTelephoneNo": "(053) 382-3121"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "St. Mary's College of Catbalogan",
       "institutionType": "Private HEI",
       "province": "Western Samar",
       "municipalityCity": "Catbalogan City",
       "website": "http://www.rvmonline.org/smccatbalogan/SMCC_VisionMission.html",
       "faxTelephoneNo": "(055) 543-8192"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Sacred Heart Seminary",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Palo",
       "website": "",
       "faxTelephoneNo": "(053) 832-0462"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Saint Joseph College",
       "institutionType": "Private HEI",
       "province": "Southern Leyte",
       "municipalityCity": "Maasin City",
       "website": "https://www.sjc.edu.ph/",
       "faxTelephoneNo": "(053) 0381-0893; (053) 570-9843; (053) 381-2283; (053) 381-2098"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "St. Mary's College of Borongan",
       "institutionType": "Private HEI",
       "province": "Eastern Samar",
       "municipalityCity": "Borongan City",
       "website": "",
       "faxTelephoneNo": "(055) 261-2038"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "St. Peter's College of Ormoc",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Ormoc City",
       "website": "https://spcormoc.edu.ph/",
       "faxTelephoneNo": "(053) 255-4391; (053) 561-8248; (053) 255-3406"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Saint Vincent De Paul College Seminary",
       "institutionType": "Private HEI",
       "province": "Western Samar",
       "municipalityCity": "Calbayog City",
       "website": "",
       "faxTelephoneNo": "(055) 209-1273"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Samar Colleges",
       "institutionType": "Private HEI",
       "province": "Western Samar",
       "municipalityCity": "Catbalogan City",
       "website": "",
       "faxTelephoneNo": "(055) 251-3021; (055) 543-8381"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Northwest Samar State University-San Jorge Campus",
       "institutionType": "SUC Satellite",
       "province": "Western Samar",
       "municipalityCity": "San Jorge",
       "website": "https://nwssu.edu.ph/",
       "faxTelephoneNo": "(055) 2093-657"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Samar State University-Mercedes Campus",
       "institutionType": "SUC Satellite",
       "province": "Western Samar",
       "municipalityCity": "Catbalogan City",
       "website": "https://ssu.edu.ph/",
       "faxTelephoneNo": "(053) 251-2661"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Samar State University",
       "institutionType": "SUC Main",
       "province": "Western Samar",
       "municipalityCity": "Catbalogan City",
       "website": "https://ssu.edu.ph/",
       "faxTelephoneNo": "(055) 543-8394; (055) 251-2139"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Samar State University-Basey Campus",
       "institutionType": "SUC Satellite",
       "province": "Western Samar",
       "municipalityCity": "Basey",
       "website": "https://ssu.edu.ph/",
       "faxTelephoneNo": "(055) 543-8394; (055) 251-2139"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Southern Leyte State University-San Juan Campus",
       "institutionType": "SUC Satellite",
       "province": "Southern Leyte",
       "municipalityCity": "San Juan",
       "website": "https://southernleytestateu.edu.ph/",
       "faxTelephoneNo": "0935-4910051"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Colegio de San Lorenzo Ruiz de Manila of Northern Samar",
       "institutionType": "Private HEI",
       "province": "Northern Samar",
       "municipalityCity": "Catarman",
       "website": "",
       "faxTelephoneNo": "(055) 500-9260"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Southern Leyte State University-Hinunangan Campus",
       "institutionType": "SUC Satellite",
       "province": "Southern Leyte",
       "municipalityCity": "Hinunangan",
       "website": "https://southernleytestateu.edu.ph/",
       "faxTelephoneNo": "(053) 589-1056; 0936-2384430"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Southern Leyte State University",
       "institutionType": "SUC Main",
       "province": "Southern Leyte",
       "municipalityCity": "Sogod",
       "website": "https://southernleytestateu.edu.ph/",
       "faxTelephoneNo": "(053) 382-3294"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Samar State University-Salcedo Campus",
       "institutionType": "SUC Satellite",
       "province": "Eastern Samar",
       "municipalityCity": "Salcedo",
       "website": "https://www.essu.edu.ph/",
       "faxTelephoneNo": "09212-621986; 0906-4439260"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Saint Paul School of Professional Studies",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Palo",
       "website": "http://spsps.edu.ph/",
       "faxTelephoneNo": "(053) 323-7558; (053) 323-4402; (053) 323-7778"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Saint Thomas Aquinas College",
       "institutionType": "Private HEI",
       "province": "Southern Leyte",
       "municipalityCity": "Sogod",
       "website": "",
       "faxTelephoneNo": "(053) 577-8330; 0917-1506010; 0917-6207225; 0926-2600978"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Sto. Niño College of Ormoc",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Ormoc City",
       "website": "https://sncoi.edu.ph/",
       "faxTelephoneNo": "(053) 561-4338"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Northwest Samar State University",
       "institutionType": "SUC Main",
       "province": "Western Samar",
       "municipalityCity": "Calbayog City",
       "website": "https://nwssu.edu.ph/",
       "faxTelephoneNo": "(055) 2093-657"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Southern Leyte State University-Tomas Oppus Campus",
       "institutionType": "SUC Satellite",
       "province": "Southern Leyte",
       "municipalityCity": "Tomas Oppus",
       "website": "https://southernleytestateu.edu.ph/",
       "faxTelephoneNo": "(053) 382-3294"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "University of Eastern Philippines",
       "institutionType": "SUC Main",
       "province": "Northern Samar",
       "municipalityCity": "Catarman",
       "website": "http://uep.edu.ph/",
       "faxTelephoneNo": "(055) 251-8611"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "University of the Philippines in the Visayas Tacloban College",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://tac.upv.edu.ph/",
       "faxTelephoneNo": "(053) 832-2897"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Visayas State University",
       "institutionType": "SUC Main",
       "province": "Leyte",
       "municipalityCity": "Baybay City",
       "website": "https://www.vsu.edu.ph/",
       "faxTelephoneNo": "(053) 563-7067"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Western Leyte College of Ormoc City",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Ormoc City",
       "website": "https://wlcormoc.edu.ph/",
       "faxTelephoneNo": "(053) 255-2599; (053) 561-5308"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Visayas State University-Burauen Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Burauen",
       "website": "https://burauen.evsu.edu.ph/",
       "faxTelephoneNo": "(053) 332-2176"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "JE Mondejar Computer College",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://mondejar.edu/",
       "faxTelephoneNo": "(053) 530-4739; (053) 321-5967; (053) 321-3249"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Mater Divinae Gratiae College",
       "institutionType": "Private HEI",
       "province": "Eastern Samar",
       "municipalityCity": "Dolores",
       "website": "",
       "faxTelephoneNo": "0946-8286067"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Palompon Institute of Technology-Tabango Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Tabango",
       "website": "https://pit.edu.ph/pitsuc/",
       "faxTelephoneNo": "(053) 551-9014; (053) 551-9550; 0998-1634750"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Our Lady of Mercy College",
       "institutionType": "Private HEI",
       "province": "Eastern Samar",
       "municipalityCity": "Borongan City",
       "website": "",
       "faxTelephoneNo": "0917-3118114; 0997-2304551"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Bato Institute of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Bato",
       "website": "https://bistleyte.info/",
       "faxTelephoneNo": "(053) 336-2589"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Holy Cross College of Carigara",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Carigara",
       "website": "",
       "faxTelephoneNo": "0915-5505948"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "STI College-Ormoc",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Ormoc City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(053) 561-8520; (053) 255-3357"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Visayas State University-Ormoc Campus",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Ormoc City",
       "website": "https://ormoc.evsu.edu.ph/",
       "faxTelephoneNo": "(053) 255-7497; (053) 255-7303"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Visayas Central Colleges",
       "institutionType": "Private HEI",
       "province": "Northern Samar",
       "municipalityCity": "Catarman",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "AMA Computer College-Tacloban City",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(053) 888-0266"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Saint Scholastica's College-Tacloban",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Palo",
       "website": "https://stscholasticascollegetacloban.weebly.com/",
       "faxTelephoneNo": "0917-8037568; 0917-6376416"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "ABE International College of Business and Economics-Tacloban City",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "https://abe.edu.ph/",
       "faxTelephoneNo": "(053) 325-3333; (053) 325-3168"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Saint Michael College of Hindang",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Hindang",
       "website": "https://www.smchindang.edu.ph/",
       "faxTelephoneNo": "0917-1007219"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Holy Spirit College Foundation of Leyte",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "",
       "faxTelephoneNo": "0917-7290740; 0966-7015359"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Montano Lamberte Go Collegeof Learning",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Hilangos",
       "website": "https://mlgcl.edu.ph/",
       "faxTelephoneNo": "(053) 336-2034; (053)-336-2932"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Northern Samar Colleges",
       "institutionType": "Private HEI",
       "province": "Northern Samar",
       "municipalityCity": "Catarman",
       "website": "",
       "faxTelephoneNo": "(055) 500-9116"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Asia College of Advance Studies In Arts Sciences and Technology",
       "institutionType": "Private HEI",
       "province": "Northern Samar",
       "municipalityCity": "Bobon",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "St. John the Evangelist School of Theology",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Palo",
       "website": "",
       "faxTelephoneNo": "(053) 323-3115; 0915-8256312; (053) 323-9299; 0917-3170885"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Colegio de San Juan Samar",
       "institutionType": "Private HEI",
       "province": "Northern Samar",
       "municipalityCity": "Lavezares",
       "website": "https://colegiodesanjuansamar.wordpress.com/",
       "faxTelephoneNo": "0908-2385145"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Colegio De Sta. Lourdes of Leyte Foundation",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tabontabon",
       "website": "https://csllfi.wordpress.com/",
       "faxTelephoneNo": "0905-7244430; 0917-3261139"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Colegio de la Salle Fondation de Tacloban",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "",
       "faxTelephoneNo": "(053) 888-0469"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Holy Virgin of Salvacion Foundation College",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "",
       "faxTelephoneNo": "(053) 338-9268"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "San Lorenzo Ruiz College of Ormoc",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Ormoc City",
       "website": "https://slrcormoc.edu.ph/",
       "faxTelephoneNo": "(053) 561-5975"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "ACLC College-Tacloban City",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Tacloban City",
       "website": "http://www.aclc.edu.ph/p/aclc-campuses-eastern-visayas.html",
       "faxTelephoneNo": "(053) 325-9888"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Colegio De Las Navas",
       "institutionType": "LUC",
       "province": "Northern Samar",
       "municipalityCity": "Las Navas",
       "website": "",
       "faxTelephoneNo": "0905-8714802"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Eastern Samar State University-Maydolong Campus",
       "institutionType": "SUC Satellite",
       "province": "Eastern Samar",
       "municipalityCity": "Maydolong",
       "website": "https://www.essu.edu.ph/",
       "faxTelephoneNo": "0916-1801271"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Samar State University-Paranas Campus",
       "institutionType": "SUC Satellite",
       "province": "Western Samar",
       "municipalityCity": "Paranas",
       "website": "https://ssu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "ACLC College-Ormoc",
       "institutionType": "Private HEI",
       "province": "Leyte",
       "municipalityCity": "Ormoc City",
       "website": "http://www.aclc.edu.ph/",
       "faxTelephoneNo": "(053) 560-8000"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Southern Leyte State University-Maasin Campus",
       "institutionType": "SUC Satellite",
       "province": "Southern Leyte",
       "municipalityCity": "Maasin City",
       "website": "https://southernleytestateu.edu.ph/index.php/en/maasin-campus",
       "faxTelephoneNo": "(053) 381-3268; (053) 381-2138; (053) 570-8325"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Tan Ting Bing Memorial Colleges Foundation",
       "institutionType": "Private HEI",
       "province": "Northern Samar",
       "municipalityCity": "San Isidro",
       "website": "",
       "faxTelephoneNo": "0918-6483281; 0916-5070304; (055) 500-9046; '0929-6976432"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Global School for Technological Studies",
       "institutionType": "Private HEI",
       "province": "Northern Samar",
       "municipalityCity": "Catarman",
       "website": "",
       "faxTelephoneNo": "0909-1749223; 0909-8695328"
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "Burauen Community College",
       "institutionType": "LUC",
       "province": "Leyte",
       "municipalityCity": "Burauen",
       "website": "https://burauen.evsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "08 - Eastern Visayas",
       "desc": "University of the Philippines Manila - School of Health Sciences",
       "institutionType": "SUC Satellite",
       "province": "Leyte",
       "municipalityCity": "Palo",
       "website": "https://shs.upm.edu.ph/",
       "faxTelephoneNo": "(053) 832-2442"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Andres Bonifacio College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dipolog City",
       "website": "https://abcollege.edu.ph/",
       "faxTelephoneNo": "(065) 212-4884; (065) 212-2937; (065) 212-8462"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Ateneo de Zamboanga University",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "https://www.adzu.edu.ph/",
       "faxTelephoneNo": "(062) 991-0871 local 1000; (062) 991-0870"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Basilan State College",
       "institutionType": "SUC Main",
       "province": "Basilan",
       "municipalityCity": "Isabela City",
       "website": "https://bassc.edu.ph/basc/",
       "faxTelephoneNo": "(062) 200-7523; (062) 200-3817; (062) 200-7705"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Brent Hospital and Colleges",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": "(062) 991-5358; (062) 992-4447"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Claret College of Isabela",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Isabela City",
       "website": "https://claretcollegeofisabelabasilan.com/",
       "faxTelephoneNo": "(062) 200-3866; (062) 200-3865; (062) 200-3867"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "DMC College Foundation",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dipolog City",
       "website": "https://www.vsu.edu.ph/academe/satellite-campuses/tolosa",
       "faxTelephoneNo": "(065) 212-3827; (065); (065) 212-4029"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Dr. Aurelio Mendoza Memorial Colleges",
       "institutionType": "Private HEI",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Ipil",
       "website": "http://ammcipil.edu.ph/ammc_site/",
       "faxTelephoneNo": "(062) 215-1856; (062) 955-8050;  (062) 333-2381"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Immaculate Conception Archdiocesan School",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": "(062) 991-2490; (062) 992-0306; (062) 993-2575; (062) 926-7843"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Juan S. Alano Memorial School",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Isabela City",
       "website": "",
       "faxTelephoneNo": "(062) 200-7866"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Jose Rizal Memorial State University-Katipunan Campus",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dapitan City",
       "website": "http://katipunan.jrmsu.edu.ph/",
       "faxTelephoneNo": "(065) 918-0251; 0949-5060865"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Marian College",
       "institutionType": "Private HEI",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Ipil",
       "website": "https://mariancollege.edu.ph/",
       "faxTelephoneNo": "(062) 333-2747; (062) 333-2841"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Blancia College Foundation",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Molave",
       "website": "",
       "faxTelephoneNo": "(062) 225-1840; (062) 225-1406"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Philippine Advent College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Sindangan",
       "website": "http://philippineadventcollege.edu.ph/",
       "faxTelephoneNo": "(065) 224-2038; (065) 224-2700; (065) 918-0186"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Pilar Colege of Zamboanga City",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "http://www.pczc.edu.ph/",
       "faxTelephoneNo": "(062) 991-5410; (062) 991-1098"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Rizal Memorial Institute of Dapitan City",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dapitan City",
       "website": "",
       "faxTelephoneNo": "(065) 213-6620; (065) 213-6287; (065) 212-2691; (065) 212-2817"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Saint Columban College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "https://www.sccpag.edu.ph/",
       "faxTelephoneNo": "(062) 214-1290; (062) 215-1800; (062) 215-1799 loc 104"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "St. John College of Buug Foundation",
       "institutionType": "Private HEI",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Buug",
       "website": "",
       "faxTelephoneNo": "(062) 983-1067"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Saint Joseph College of Sindangan",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Sindangan",
       "website": "",
       "faxTelephoneNo": "(065) 224-2710; (065) 212-6292"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Saint Vincent's College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dipolog City",
       "website": "https://svc.edu.ph/",
       "faxTelephoneNo": "(065) 908-1133; (065) 212-6292 local 111"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Saint Estanislao Kostka College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Manukan",
       "website": "",
       "faxTelephoneNo": "0912-2675210"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Southern Mindanao College-Agro Tech",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Dumalinao",
       "website": "",
       "faxTelephoneNo": "(062) 215-2589; (062) 214-4804; (062) 215 1624"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Southern City Colleges",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "https://scci.edu.ph/",
       "faxTelephoneNo": "(062) 992-0819; (062) 991-1847; (062) 992-2241"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Southern Mindanao Colleges",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": "(062) 215-2589; (062) 214-4804; (062) 215-1624"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University",
       "institutionType": "SUC Main",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 992-4238; (062) 991-1771; (062) 992-5102"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Alicia",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Alicia",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Aurora",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Aurora",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 992-4238; (062) 991-1040; (062) 992-5102"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Diplahan",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Diplahan",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Imelda",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Imelda",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Ipil",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Ipil",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "333-5449"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Mabuhay",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Mabuhay",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Malangas",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Malangas",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 991-1040; (062) 992-4238; (062) 992-5102"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Molave",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Molave",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 225-2403; (062) 225-1507; (062) 225-1507"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Olutanga",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Olutanga",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 992-4238; (062) 992-5102"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Pagadian",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 214-4353"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Siay",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Siay",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 991-1040; (062) 992-4238; (062) 992-5102"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Tungawan",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Tungawan",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Naga",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Naga",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": "(062) 991-1040; (062) 992-4238; 0916-4302467"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao State University-Curuan",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "http://wmsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Universidad de Zamboanga",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "https://uz.edu.ph/",
       "faxTelephoneNo": "(062) 991-1135 (062) 991-5677; (062) 991-9102; (062) 991-5390; (062) 992-7677"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Zamboanga Peninsula Polytechnic State University",
       "institutionType": "SUC Main",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "https://www.zppsu.edu.ph/",
       "faxTelephoneNo": "(062) 991-3815"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Zamboanga State College of Marine Sciences and Technology",
       "institutionType": "SUC Main",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "http://zscmst.edu.ph/",
       "faxTelephoneNo": "(062) 991-0777; (062) 992-3092"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Josefina H. Cerilles State College",
       "institutionType": "SUC Main",
       "province": "Zamboanga del Sur",
       "municipalityCity": "San Miguel",
       "website": "https://jhcsc.edu.ph/",
       "faxTelephoneNo": "(062) 945-0025"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Josefina H. Cerilles State College - Dumingag",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Dumingag",
       "website": "https://jhcsc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "STI College-Zamboanga",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(062) 993-1457; (062) 991-2956"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Medina College-Pagadian",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": "(062) 214-1822; (062) 215-3721; (088) 521-1466"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Zamboanga Del Sur Maritime Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": "(062) 214-1336; (062) 214-3613; (062) 215-2232"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Pagadian Capitol College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": "(062) 214-4364"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Aurora Pioneers Memorial College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Aurora",
       "website": "",
       "faxTelephoneNo": "(062) 945-0256; 0910-5411397"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Dipolog City Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dipolog City",
       "website": "",
       "faxTelephoneNo": "(065) 908-0064; (065) 212-2979"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Jose Rizal Memorial State University - Main",
       "institutionType": "SUC Main",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dapitan City",
       "website": "http://jrmsu.edu.ph/",
       "faxTelephoneNo": "(065) 908-8294; (065) 908 1349"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Ebenezer Bible College and Seminary",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": "(062) 983-0628; (062) 991-3039"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "St. Mary's College of Labason",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Labason",
       "website": "https://www.smclabason.com/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Josefina H. Cerilles State College-Canuto M.S. Enerio College of Arts and Trades",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Lakewood",
       "website": "https://jhcsc.edu.ph/",
       "faxTelephoneNo": "(062) 945-0025"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Jose Rizal Memorial State University-Dipolog",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dipolog City",
       "website": "http://jrmsu.edu.ph/",
       "faxTelephoneNo": "(065) 212-2292"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Jose Rizal Memorial State University-Siocon",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Siocon",
       "website": "http://jrmsu.edu.ph/",
       "faxTelephoneNo": "0917-3119220; 0917-9465584"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "AMA Computer College-Zamboanga City",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(062) 955-7843; (02) 955-7842"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Colegio de San Francisco Javier of Rizal Zamboanga del Norte",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Rizal",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Computer Technologies Institute of Zamboanga City",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": "(062) 991-2365"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Computer Technologies Institute of Basilan",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Isabela City",
       "website": "",
       "faxTelephoneNo": "(062) 991-2365"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "HMIJ Foundation Philippine Islamic College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": "(062) 993-1783; (062) 991-7788"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Mindanao State University-Buug College",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Buug",
       "website": "https://msubuug.edu.ph/",
       "faxTelephoneNo": "(062) 984-0603; (062) 984-0603; (062) 984-0603"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Eastern Mindanao College of Technology",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "https://emcotechonline.com/",
       "faxTelephoneNo": "(062) 215-4258; (062) 214-4171"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Universidad de Zamboanga-Ipil",
       "institutionType": "Private HEI",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Ipil",
       "website": "https://uz.edu.ph/",
       "faxTelephoneNo": "(062) 333-5506; (062) 333-5634; (062) 955-8035"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Medina College-Ipil",
       "institutionType": "Private HEI",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Ipil",
       "website": "",
       "faxTelephoneNo": "(062) 333-5615; (062) 333-5702"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Philippine Technological and Marine Sciences-Zamboanga del Sur",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": "(062) 214-4348; (062) 214-4348; (062) 214-4348"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Western Mindanao Foundation College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": "(062) 955-7556"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Southern Peninsula College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Labason",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Lucan Central Colleges",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": "(062) 215-3307"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Sibugay Technical Institute",
       "institutionType": "Private HEI",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Ipil",
       "website": "",
       "faxTelephoneNo": "(062) 333-2469"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Universidad de Zamboanga - Pagadian",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "https://uz.edu.ph/",
       "faxTelephoneNo": "(062) 215-4206; 0926-2301047"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Aim High College",
       "institutionType": "Private HEI",
       "province": "Zamboanga Sibugay",
       "municipalityCity": "Ipil",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Ave Maria College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Liloy",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Hyrons College Philippines",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Tukuran",
       "website": "",
       "faxTelephoneNo": "(062) 945-0158"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Jose Rizal Memorial State University-Sibuco",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Sibuco",
       "website": "http://jrmsu.edu.ph/",
       "faxTelephoneNo": "0917-8283474"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Jose Rizal Memorial State University-Tampilisan",
       "institutionType": "SUC Satellite",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dapitan City",
       "website": "http://jrmsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Nuevo Zamboanga College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": "(062) 990-1134; (062) 991-2033 local 202; (062) 991-1626"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Philippine Advent College-Salug",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Salug",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Yllana Bay View College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": "(062) 215-4176; (062) 215-8182"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Alhadeetha Mindanao College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Labangan",
       "website": "https://www.amcedu.org/",
       "faxTelephoneNo": "0935-8902518"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Zamboanga del Sur Provincial Government College",
       "institutionType": "LUC",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Aurora",
       "website": "",
       "faxTelephoneNo": "(062) 945-0109"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "STI College - Dipolog",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Dipolog City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(065) 212-8210"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Southern City Colleges-West Campus",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "https://scci.edu.ph/",
       "faxTelephoneNo": "(062) 991-1954; (062 )992-0819; (062) 992-2241"
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "ZAMSULA Everlasting College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Salug",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Our Lady of Triumph Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "https://olt.edu.ph/ozamiz/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "West Prime Horizon Institute",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Colegio de La Ciudad de Zamboanga",
       "institutionType": "LUC",
       "province": "Zamboanga Del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Zamboanga del Sur Provincial Government College - Pagadian",
       "institutionType": "LUC",
       "province": "Zamboanga Del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Ferndale College ñZamboanga Peninsula",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur ",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Metro Zampen College",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Emmauss College of Theology Foundation",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Zamboanga City",
       "website": "http://www.emmauscollegeoftheology.com/",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Pagadian City International College",
       "institutionType": "LUC",
       "province": "Zamboanga del Sur",
       "municipalityCity": "Pagadian City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "09 - Zamboanga Peninsula",
       "desc": "Philippine Advent College - Leon B. Postigo Campus",
       "institutionType": "Private HEI",
       "province": "Zamboanga del Norte",
       "municipalityCity": "Sindangan",
       "website": "http://philippineadventcollege.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Blessed Mother College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "",
       "faxTelephoneNo": "(08822) 852-4283"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University",
       "institutionType": "SUC Main",
       "province": "Bukidnon",
       "municipalityCity": "Malaybalay City",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": "(088) 813-2717; (088) 221-2196"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Alubijid ESC",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Alubijid",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": "(088) 756-156"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Libona",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Libona",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Baungon BSU",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Baungon",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Kalilangan BSU",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Kalilangan",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": "(088) 813-2717; (088) 221-2237"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Medina ESC",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Medina",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Sugbongcogon ESC",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Sugbongcogon",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Talakag BSU",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Talakag",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Talisayan ESC",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Talisayan",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Malitbog",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Malitbog ",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": "0926-5207289"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Kadingilan",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Kadingilan",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Capitol University",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.cu.edu.ph/",
       "faxTelephoneNo": "(088) 856-1272; (08822) 723-349"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Cagayan De Oro College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://coc.phinma.edu.ph/",
       "faxTelephoneNo": "(088) 858-3880; (088) 858-5869"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Camiguin Polytechnic State College",
       "institutionType": "SUC Main",
       "province": "Camiguin",
       "municipalityCity": "Mambajao",
       "website": "https://cpsc.ph/",
       "faxTelephoneNo": "(088) 387-1268; (088) 387-0044; (088) 387-0495"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Central Mindanao University",
       "institutionType": "SUC Main",
       "province": "Bukidnon",
       "municipalityCity": "Maramag",
       "website": "https://www.cmu.edu.ph/",
       "faxTelephoneNo": "0917-7060347"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Christ the King College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Gingoog City",
       "website": "http://ckcgingoog.edu.ph/",
       "faxTelephoneNo": "(088) 427-437; (088) 861-2192; (088) 861-0149"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Colegio De Santo Niño De Jasaan",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Jasaan",
       "website": "",
       "faxTelephoneNo": "(088) 906-417; 0949-8144413"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Fatima College of Camiguin",
       "institutionType": "Private HEI",
       "province": "Camiguin",
       "municipalityCity": "Mambajao",
       "website": "",
       "faxTelephoneNo": "(008) 387-1038; (008) 387-0953"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Gingoog City College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Gingoog City",
       "website": "https://gcci.edu.ph/",
       "faxTelephoneNo": "(088) 861-1432; (08842) 7385"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Gingoog Christian College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Gingoog City",
       "website": "",
       "faxTelephoneNo": "(08842) 7376; (08842) 7914"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Gov. Alfonso D. Tan College",
       "institutionType": "LUC",
       "province": "Misamis Occidental",
       "municipalityCity": "Tangub City",
       "website": "http://www.gadtc.edu.ph/",
       "faxTelephoneNo": "(088) 545-2793; 0928-4075104"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "La Salle University",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Ozamiz City",
       "website": "https://www.lsu.edu.ph/",
       "faxTelephoneNo": "(088) 521-1010"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Liceo De Cagayan University",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.liceo.edu.ph",
       "faxTelephoneNo": "(088) 858-4093 to 95; (088) 858-4086; (088) 858-3664; (08822) 727-044; (08822) 714-253; (08822) 722-244; (08822) 728-516 local 107; (088) 858-3123"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Lourdes College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.lccdo.edu.ph/",
       "faxTelephoneNo": "(088) 857-1487; (088) 857-1423 local 102"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Medina College",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Ozamiz City",
       "website": "https://www.medinacollegeozedu.com/",
       "faxTelephoneNo": "(088) 521-1466; (088) 521-0036; (088) 521-0435; (088) 521-4033"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Medina Foundation College",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Sapang Dalaga",
       "website": "",
       "faxTelephoneNo": "(088) 586-0088"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Mindanao Arts and Technological Institute",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Malaybalay City",
       "website": "",
       "faxTelephoneNo": "(088) 813-3039; (088) 813-2748"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology of Southern Philippines",
       "institutionType": "SUC Main",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": "(088) 856-4696; (088) 856-1739"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology of Southern Philippines - Jasaan",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Jasaan",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": "0917-4308125"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology of Southern Philippines - Oroquieta",
       "institutionType": "SUC Satellite",
       "province": "Misamis Occidental",
       "municipalityCity": "Oroquieta City",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology of Southern Philippines - Panaon",
       "institutionType": "SUC Satellite",
       "province": "Misamis Occidental",
       "municipalityCity": "Panaon",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": "0917-7076572"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Misamis Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Ozamiz City",
       "website": "https://www.mitincph.com/",
       "faxTelephoneNo": "(088) 521-2189"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology of Southern Philippines - Claveria",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Claveria",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": "0997-9558595"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Misamis University",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Ozamiz City",
       "website": "https://www.mu.edu.ph/",
       "faxTelephoneNo": "(088) 521-2917; (088) 521-0367"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Misamis University-Oroquieta City",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Oroquieta City",
       "website": "https://www.mu.edu.ph/",
       "faxTelephoneNo": "(088) 531-1153"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Mountain View College",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Valencia City",
       "website": "https://mvc.edu.ph/wp/",
       "faxTelephoneNo": "0936-0757891"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Golden Heritage Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://goldenheritage.edu.ph/",
       "faxTelephoneNo": "(088) 858-7326; (08822) 711-522"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Northwestern Mindanao Christian Colleges",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Tudela",
       "website": "https://nmcci-ph.education/",
       "faxTelephoneNo": "0946-7196229"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Philippine College Foundation",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Valencia City",
       "website": "https://www.pcf.edu.ph/",
       "faxTelephoneNo": "(088) 828-6569"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Pilgrim Christian College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://pilgrimchristiancollege.edu.ph/",
       "faxTelephoneNo": "(088) 856-4239; (08822) 724-498"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Quezon Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Quezon",
       "website": "",
       "faxTelephoneNo": "0917-6430130"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Sacred Heart College of Calamba",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Calamba",
       "website": "",
       "faxTelephoneNo": "(088) 271-3372; (088) 564-8138"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "St. John Vianney Theological Seminary",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://vianneycdo.ph/",
       "faxTelephoneNo": "(088) 857-4486; (088) 857-2806"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "St. Peter's College of Misamis Oriental",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Balingasag",
       "website": "",
       "faxTelephoneNo": "(088) 333-2072"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "St. Rita's College of Balingasag",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Balingasag",
       "website": "http://www.srcb.edu.ph/",
       "faxTelephoneNo": "(8822) 333-2018"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "San Agustin Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Valencia City",
       "website": "https://sait.edu.ph/",
       "faxTelephoneNo": "(088) 828-1499; (088) 828-6058"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "San Isidro College",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Malaybalay City",
       "website": "https://sic.edu.ph/",
       "faxTelephoneNo": "(088) 221-2368; (088) 221-2440"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Southern Bukidnon Foundation Academy",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Don Carlos",
       "website": "",
       "faxTelephoneNo": "(882) 262-424; 0955-7205567; 0975-6405775"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Southern Capital Colleges",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Oroquieta City",
       "website": "",
       "faxTelephoneNo": "(088) 531-1170"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Southern De Oro Philippines College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://southphilcollege.com/",
       "faxTelephoneNo": "(088) 856-2610; (088) 856-2609"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Stella Maris College",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Oroquieta City",
       "website": "",
       "faxTelephoneNo": "(088) 531-1675"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Northwestern Mindanao State College of Science and Technology",
       "institutionType": "SUC Main",
       "province": "Misamis Occidental",
       "municipalityCity": "Tangub City",
       "website": "https://www.nmsc.edu.ph/",
       "faxTelephoneNo": "(088) 586-0173"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Valencia Colleges-Bukidnon",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Valencia City",
       "website": "",
       "faxTelephoneNo": "(088) 828-3142; (088) 254-7419"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Xavier University (Ateneo de Cagayan)",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.xu.edu.ph/",
       "faxTelephoneNo": "(088) 853-9800; (088) 853-9888; (8822) 727-163(8822) 722-725"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "STI College-Cagayan De Oro",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(088) 857-3788"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Philippine Countryville College",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Maramag",
       "website": "",
       "faxTelephoneNo": "0908-8723124; (088) 828-4862"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Roman C. Villalon Memorial Colleges Foundation",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Kibawe",
       "website": "",
       "faxTelephoneNo": "(088) 357-1434; 0905-2760154"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Oro Bible College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "",
       "faxTelephoneNo": "(088) 858-3209"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Dr. Solomon U. Molina College",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Oroquieta City",
       "website": "",
       "faxTelephoneNo": "0956-6346944"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Mindanao State University-Naawan",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Naawan",
       "website": "https://www.msunaawan.edu.ph/",
       "faxTelephoneNo": "(088) 555-0187; 0920-9171595"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Adventist Technological Institute",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Jimenez",
       "website": "",
       "faxTelephoneNo": "0907-6385524"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Southern Maramag Colleges",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Maramag",
       "website": "",
       "faxTelephoneNo": "0926-0363488"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Tagoloan Community College",
       "institutionType": "LUC",
       "province": "Misamis Oriental",
       "municipalityCity": "Tagoloan",
       "website": "",
       "faxTelephoneNo": "(088) 890-4653"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Initao College",
       "institutionType": "LUC",
       "province": "Misamis Oriental",
       "municipalityCity": "Initao",
       "website": "",
       "faxTelephoneNo": "0917-8456277"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Opol Community College",
       "institutionType": "LUC",
       "province": "Misamis Oriental",
       "municipalityCity": "Opol",
       "website": "https://www.occ.edu.ph/",
       "faxTelephoneNo": "(088) 555-0518"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Northern Bukidnon State College",
       "institutionType": "SUC Main",
       "province": "Bukidnon",
       "municipalityCity": "Manolo Fortich",
       "website": "https://nbsc.ph/",
       "faxTelephoneNo": "0917-1426080; 0917-7243823"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "ACLC College of Bukidnon",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Valencia City",
       "website": "https://www.aclcbukidnon.com/",
       "faxTelephoneNo": "(088) 828-3585"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Don Carlos Polytechnic College",
       "institutionType": "LUC",
       "province": "Bukidnon",
       "municipalityCity": "Don Carlos",
       "website": "",
       "faxTelephoneNo": "0977-8527030; 0917-3203840"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "IBA College of Mindanao",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Valencia City",
       "website": "https://ibacmi.edu.ph/",
       "faxTelephoneNo": "(088) 828-1337; (088) 828-3660"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Misamis Oriental Institute of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Balingasag",
       "website": "http://moist.ph/",
       "faxTelephoneNo": "(088) 333-5054; (088) 333-5047"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "The New El Salvador Colleges",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "El Salvador City",
       "website": "",
       "faxTelephoneNo": "(088) 583-0910; (088) 555-0089; (088) 583-0342"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Our Lady of Triumph Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Ozamiz City",
       "website": "https://olt.edu.ph",
       "faxTelephoneNo": "(088) 545-9078"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Vineyard International Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.vipc.edu.ph/",
       "faxTelephoneNo": "(088) 856-8646; (08822) 721-065"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Northwestern Mindanao Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Misamis Occidental",
       "municipalityCity": "Ozamiz City",
       "website": "https://www.nmsc.edu.ph/",
       "faxTelephoneNo": "(088) 545-9505"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Pangantucan Bukidnon Community College",
       "institutionType": "LUC",
       "province": "Bukidnon",
       "municipalityCity": "Pangantucan ",
       "website": "",
       "faxTelephoneNo": "0917-5529806; 0906-3038695; 0917-5549806"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "City College of El Salvador",
       "institutionType": "LUC",
       "province": "Misamis Oriental",
       "municipalityCity": "El Salvador City",
       "website": "https://cce.edu.ph/",
       "faxTelephoneNo": "0927-596-2118; 0926-194-0537"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Community College of Gingoog City",
       "institutionType": "LUC",
       "province": "Misamis Oriental",
       "municipalityCity": "Gingoog City",
       "website": "",
       "faxTelephoneNo": "0956-1723141"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Magsaysay College",
       "institutionType": "LUC",
       "province": "Misamis Oriental",
       "municipalityCity": "Magsaysay",
       "website": "",
       "faxTelephoneNo": "0906-6425914; 0917-7196115"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Salay Community College",
       "institutionType": "LUC",
       "province": "Misamis Oriental",
       "municipalityCity": "Salay",
       "website": "",
       "faxTelephoneNo": "0917-7092134; 0906-9265611"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "STI College-Iligan",
       "institutionType": "Private HEI",
       "province": "Lanao del Norte",
       "municipalityCity": "Iligan City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(063) 221-9698; (063) 492-1445; (063) 228-3048"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "STI College-Malaybalay",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Malaybalay City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(088) 813-3877"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "STI College-Valencia",
       "institutionType": "Private HEI",
       "province": "Bukidnon",
       "municipalityCity": "Valencia City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(088) 828-3413"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Tubod College",
       "institutionType": "LUC",
       "province": "Lanao del Norte",
       "municipalityCity": "Tubod",
       "website": "",
       "faxTelephoneNo": "(063) 227-6460; (063) 341-5596"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Cabanglasan ESC",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Cabanglasan",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Damulog Satellite ESC",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Damulog",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Kitaotao Satellite ESC",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Kitaotao",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Quezon Satellite ESC",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Quezon",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-San Fernando Satellite ESC",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "San Fernando",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Bukidnon State University-Impasugong",
       "institutionType": "SUC Satellite",
       "province": "Bukidnon",
       "municipalityCity": "Impasugong",
       "website": "https://buksu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "North Central Mindanao College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Lala",
       "website": "https://ncmc.edu.ph/",
       "faxTelephoneNo": "(063) 227-8004"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Iligan Capitol College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "http://www.icc.edu.ph/",
       "faxTelephoneNo": "(063) 221-2621; (063) 221-2247"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Iligan Medical Center College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "https://www.imcc.edu.ph/",
       "faxTelephoneNo": "(063) 221-4661 local 1102; (063) 221-6584; (063) 221-4661 local 216"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Mindanao State University-Lanao Del Norte Agricultural College",
       "institutionType": "SUC Satellite",
       "province": "Lanao Del Norte",
       "municipalityCity": "Sultan Naga Dimaporo",
       "website": "https://www.msulnac.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Mindanao State University-Maigo School of Arts and Trades",
       "institutionType": "SUC Satellite",
       "province": "Lanao Del Norte",
       "municipalityCity": "Maigo",
       "website": "",
       "faxTelephoneNo": "(063) 227-4210; 0926-2086182"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Adventist Medical Center College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "https://www.amcc.edu.ph/",
       "faxTelephoneNo": "(063) 223-2114; (063) 221-9219 local 156"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Mindanao State University - Iligan Institute of Technology",
       "institutionType": "SUC Satellite",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "https://www.msuiit.edu.ph/",
       "faxTelephoneNo": "(063) 351-6173; (063) 221-4050; (063) 221-4056"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "St. Michael's College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "https://www.smciligan.edu.ph/",
       "faxTelephoneNo": "(063) 221-5325; (063) 221-3812"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "St. Peter's College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "https://www.spc.edu.ph/",
       "faxTelephoneNo": "(063) 221-5680; (063) 221-6246"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Santa Monica Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "",
       "faxTelephoneNo": "(063) 221-2678"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Lyceum of Iligan Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "",
       "faxTelephoneNo": "(063) 221-1817; (063) 221-1818"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Christ The King College De Maranding",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Lala",
       "website": "",
       "faxTelephoneNo": "(063) 388-7373; (063) 388-7039"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Lanao School of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Lala",
       "website": "",
       "faxTelephoneNo": "(063) 496-0757; (063) 388-7199"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Masters Technological Institute of Mindanao",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "",
       "faxTelephoneNo": "(063) 221-6472"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "Picardal Institute of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Lanao Del Norte",
       "municipalityCity": "Iligan City",
       "website": "http://pist.edu.ph/",
       "faxTelephoneNo": "(063) 221-3067"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology in Southern Philippines-Alubijid",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Alubijid",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": "856-1736 Loc 159"
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology in Southern Philippines-Balubal",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Cagayan de Oro City",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": "088-856-4696 / 63888561738"
     },
     {
       "region": "",
       "desc": "",
       "institutionType": "",
       "province": "",
       "municipalityCity": "",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": " ",
       "desc": "",
       "institutionType": "",
       "province": "",
       "municipalityCity": "",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "10 - Northern Mindanao",
       "desc": "University of Science and Technology in Southern Philippines-Villanueva",
       "institutionType": "SUC Satellite",
       "province": "Misamis Oriental",
       "municipalityCity": "Villanueva",
       "website": "https://www.ustp.edu.ph/",
       "faxTelephoneNo": "0996-504-37552 / 0917-346-1973"
     },
     {
       "region": "",
       "desc": "",
       "institutionType": "",
       "province": "",
       "municipalityCity": "",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Agro-Industrial Foundation College of the Philippines-Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://agrodavao.com/",
       "faxTelephoneNo": "(082) 285-0315"
     },
     {
       "region": "11 - Davao Region",
       "desc": "AMA Computer College-Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.ama.edu.ph/",
       "faxTelephoneNo": "(082) 221-5193; (082) 300-3907"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Arriesgado College Foundation",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "",
       "faxTelephoneNo": "(084) 655-6641; (084) 655-6583"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Assumption College of Nabunturan",
       "institutionType": "Private HEI",
       "province": "Davao de Oro",
       "municipalityCity": "Nabunturan",
       "website": "",
       "faxTelephoneNo": "(084) 376-0607"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Ateneo de Davao University",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.addu.edu.ph/",
       "faxTelephoneNo": "(082) 226-4416; (082) 221-2411 loc 8200"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Brokenshire College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://www.brokenshire.edu.ph/index.php/home",
       "faxTelephoneNo": "(082) 222-4085 local 114 or 117"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Cor Jesu College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Digos City",
       "website": "https://www.cjc.edu.ph/",
       "faxTelephoneNo": "(082) 553-2333; (082) 552-2433 loc 102"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Central College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://www.davaocentralcollege.com/",
       "faxTelephoneNo": "(082) 291-2053; (082) 291-1882"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao del Norte State College",
       "institutionType": "SUC Main",
       "province": "Davao Del Norte",
       "municipalityCity": "Panabo City",
       "website": "https://dnsc.edu.ph/",
       "faxTelephoneNo": "(084) 628-4301"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Doctors College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.davaodoctors.edu.ph/",
       "faxTelephoneNo": "(082)222-0664; (082)222-0850"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Medical School Foundation",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://www.dmsf.edu.ph/",
       "faxTelephoneNo": "(082) 225-3102; (082) 226-2344 local 228"
     },
     {
       "region": "11 - Davao Region",
       "desc": "DMMA College of Southern Philippines",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://dmmacsp.edu.ph/",
       "faxTelephoneNo": "(082) 241-1351; (082) 241-1356; (082) 241-1350"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Oriental State University",
       "institutionType": "SUC Main",
       "province": "Davao Oriental",
       "municipalityCity": "Mati City",
       "website": "",
       "faxTelephoneNo": "(087) 388-3195"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Oriental State University-Cateel Extension Campus",
       "institutionType": "SUC Satellite",
       "province": "Davao Oriental",
       "municipalityCity": "Cateel",
       "website": "",
       "faxTelephoneNo": "(087) 388-3195; (087) 388-3195"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Oriental State University-San Isidro Campus",
       "institutionType": "SUC Satellite",
       "province": "Davao Oriental",
       "municipalityCity": "San Isidro",
       "website": "",
       "faxTelephoneNo": "(087) 388-3195; (087) 388-3195"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Oriental State University-Banaybanay Campus",
       "institutionType": "SUC Satellite",
       "province": "Davao Oriental",
       "municipalityCity": "Banaybanay",
       "website": "",
       "faxTelephoneNo": "(087) 388-3195"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Evelyn E. Fabie College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": "(082) 227-3686; (082) 227-3469"
     },
     {
       "region": "11 - Davao Region",
       "desc": "General Baptist Bible College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.gbbc.edu.ph/",
       "faxTelephoneNo": "(082) 297-2949"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Holy Cross College of Calinan",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://hccc.edu.ph/",
       "faxTelephoneNo": "(082) 295-0145; (082) 295-0797"
     },
     {
       "region": "11 - Davao Region",
       "desc": "St. Mary'S College of Bansalan",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Bansalan",
       "website": "",
       "faxTelephoneNo": "(082) 553-9246; (082) 272-1797"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Holy Cross of Davao College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.hcdc.edu.ph/",
       "faxTelephoneNo": "(082) 221-3008; (082) 221-9071 to 79 local 126 or 107"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Liceo De Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "",
       "faxTelephoneNo": "(084) 216-6102; (084) 216-4356"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Mati Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Davao Oriental",
       "municipalityCity": "Mati City",
       "website": "",
       "faxTelephoneNo": "(087) 388-4347; (087) 388-4820"
     },
     {
       "region": "11 - Davao Region",
       "desc": "MATS College of Technology",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.matscollegeoftechnology.com/",
       "faxTelephoneNo": "(082) 225-3576; (082) 226-4560"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Mindanao Medical Foundation College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://mmfcdavao.com.ph/",
       "faxTelephoneNo": "(082) 221-6225"
     },
     {
       "region": "11 - Davao Region",
       "desc": "North Davao College-Tagum Foundation",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "",
       "faxTelephoneNo": "(084) 218-0744"
     },
     {
       "region": "11 - Davao Region",
       "desc": "North Davao Colleges-Panabo",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Panabo City",
       "website": "",
       "faxTelephoneNo": "(084) 628-5264"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Philippine Women's College of Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://pwc.edu.ph/",
       "faxTelephoneNo": "(082) 296-9303; (082) 297-8035"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Polytechnic College of Davao del Sur",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Digos City",
       "website": "",
       "faxTelephoneNo": "(082) 553-1662; (082) 553-3441"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Queen of Apostles College Seminary",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "",
       "faxTelephoneNo": "(084) 218-3397; (084) 308-1790"
     },
     {
       "region": "11 - Davao Region",
       "desc": "The Rizal Memorial Colleges",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://rmc.edu.ph/",
       "faxTelephoneNo": "(082) 300-2930; (082) 300-7173"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Saint Francis Xavier College Seminary",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": "(082) 295-7375; (082) 299-0161"
     },
     {
       "region": "11 - Davao Region",
       "desc": "St. Mary's College of Tagum",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://smctagum.edu.ph/main/",
       "faxTelephoneNo": "(084) 655-9028; (084) 216-6205; (084) 400-3130"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Saint Peter's College of Toril",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://spct.edu.ph/",
       "faxTelephoneNo": "(082) 291-0257; (082) 291-2007"
     },
     {
       "region": "11 - Davao Region",
       "desc": "San Pedro College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.spcdavao.edu.ph/",
       "faxTelephoneNo": "(082) 221-0257; (082) 224-1481; (082) 226-4118; (082) 226-4461"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Serapion C. Basalo Memorial Colleges",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Kiblawan",
       "website": "",
       "faxTelephoneNo": "9488083951"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Southeastern College of Padada",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Padada",
       "website": "",
       "faxTelephoneNo": "(082) 272-0360"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Southern Philippines Agriculture Business Marine and Aquatic School of Technology",
       "institutionType": "SUC Main",
       "province": "Davao Occidental",
       "municipalityCity": "Malita",
       "website": "http://www.spamast.edu.ph/",
       "faxTelephoneNo": "(082) 553-8894; (082) 276-1234"
     },
     {
       "region": "11 - Davao Region",
       "desc": "South Philippine Adventist College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Matanao",
       "website": "https://spac.edu.ph/",
       "faxTelephoneNo": "(082) 284-6283; 0917-6335222"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Tecarro College Foundation",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": "(082) 297-2511"
     },
     {
       "region": "11 - Davao Region",
       "desc": "UM Bansalan College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Bansalan",
       "website": "http://bansalan.umindanao.edu.ph/",
       "faxTelephoneNo": "(082) 272-4080"
     },
     {
       "region": "11 - Davao Region",
       "desc": "UM Digos College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Digos City",
       "website": "http://www.digos.umindanao.edu.ph/",
       "faxTelephoneNo": "(082) 553-2914; (082) 553-2538"
     },
     {
       "region": "11 - Davao Region",
       "desc": "UM Panabo College",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Panabo City",
       "website": "https://umindanao.edu.ph/",
       "faxTelephoneNo": "(084) 628-6437; (084) 628-5427; (084) 628-6227"
     },
     {
       "region": "11 - Davao Region",
       "desc": "UM Tagum College",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://tagum.umindanao.edu.ph/",
       "faxTelephoneNo": "(084) 655-9607 local 101"
     },
     {
       "region": "11 - Davao Region",
       "desc": "University of Mindanao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://umindanao.edu.ph/",
       "faxTelephoneNo": "(082) 227-2902; (082) 227-5456 local 116"
     },
     {
       "region": "11 - Davao Region",
       "desc": "University of Southeastern Philippines-Main",
       "institutionType": "SUC Main",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.usep.edu.ph/",
       "faxTelephoneNo": "(082) 221-7737"
     },
     {
       "region": "11 - Davao Region",
       "desc": "University of the Immaculate Conception",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.uic.edu.ph/",
       "faxTelephoneNo": "(082) 226-3676; (082) 221-8090"
     },
     {
       "region": "11 - Davao Region",
       "desc": "University of Southeastern Philippines-College of Agriculture-Tagum Mabini",
       "institutionType": "SUC Satellite",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://www.usep.edu.ph/",
       "faxTelephoneNo": "(084) 216-9163"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao del Sur State College-Main",
       "institutionType": "SUC Main",
       "province": "Davao Del Sur",
       "municipalityCity": "Digos City",
       "website": "http://www.spamast.edu.ph/",
       "faxTelephoneNo": "(082) 553-8894; (082) 276-1234"
     },
     {
       "region": "11 - Davao Region",
       "desc": "University of Southeastern Philippines-Mintal",
       "institutionType": "SUC Satellite",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.usep.edu.ph/",
       "faxTelephoneNo": "(082) 293-0390"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Joji Ilagan Career Center Foundation",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.jojiilagancareercenter.com/",
       "faxTelephoneNo": "(082) 221-0315; (082) 226-3783; (082) 227-5602"
     },
     {
       "region": "11 - Davao Region",
       "desc": "St. Francis Xavier Regional Major Seminary of Mindanao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://sfx-remase.edu.ph/",
       "faxTelephoneNo": "(082) 297-0180; (082) 298-0991 to 92"
     },
     {
       "region": "11 - Davao Region",
       "desc": "University of the Philippines-Mindanao",
       "institutionType": "SUC Satellite",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www2.upmin.edu.ph/",
       "faxTelephoneNo": "(082) 293-0310"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Assumption College of Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://www.assumptiondavao.edu.ph/acd/",
       "faxTelephoneNo": "(082) 221-4726; (082) 227-6818; (082) 225-0720 to 23 loc 1000"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Interface Computer College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://home.interface.edu.ph/",
       "faxTelephoneNo": "(082) 221-8843"
     },
     {
       "region": "11 - Davao Region",
       "desc": "UM Peñaplata College",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Island Garden City of Samal",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Aces Tagum College",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "",
       "faxTelephoneNo": "(084) 216-4241"
     },
     {
       "region": "11 - Davao Region",
       "desc": "St. John Paul II College of Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://sjp2cd.edu.ph/",
       "faxTelephoneNo": "(082) 299-3375; (082) 297-5586; (082) 297-5586"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Philippine College of Technology",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://www.pctdavao.edu.ph/",
       "faxTelephoneNo": "(082) 221-0381; (082) 222-4808"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Mindanao Kokusai Daigaku",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://mkdph.com/",
       "faxTelephoneNo": "(082) 233;0081; (082) 233-0013"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Holy Child College of Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.theholychilddavao.com/",
       "faxTelephoneNo": "(082) 295-1565"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Mati Doctors College",
       "institutionType": "Private HEI",
       "province": "Davao Oriental",
       "municipalityCity": "Mati City",
       "website": "",
       "faxTelephoneNo": "(087) 388-3761; (087) 388-3714; (087) 388-3965"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Southern Philippines Baptist Theological Seminary",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://spbts.ph/",
       "faxTelephoneNo": "(082) 299-1764"
     },
     {
       "region": "11 - Davao Region",
       "desc": "STI College-Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(082) 305-2192;  (082) 222-0914;  (082) 282-1906"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Jose Maria College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://jmc.edu.ph/",
       "faxTelephoneNo": "(082) 234-7272"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Christian Colleges of Southeast Asia",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.ccsa.edu.ph/",
       "faxTelephoneNo": "(082) 287-8398; (082) 296-9455"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Winchester Colleges",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Sto. Tomas",
       "website": "",
       "faxTelephoneNo": "(084) 829-2525; 829-0010"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Legacy College of Compostela",
       "institutionType": "Private HEI",
       "province": "Davao de Oro",
       "municipalityCity": "Compostela",
       "website": "",
       "faxTelephoneNo": "09399369083; 09088930171; 09481376690"
     },
     {
       "region": "11 - Davao Region",
       "desc": "St. Mary's College Baganga",
       "institutionType": "Private HEI",
       "province": "Davao Oriental",
       "municipalityCity": "Baganga",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Kapalong College of Agriculture Sciences and Technology",
       "institutionType": "LUC",
       "province": "Davao Del Norte",
       "municipalityCity": "Kapalong",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Holy Cross College of Sasa",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "http://www.hccsi.org/",
       "faxTelephoneNo": "(082) 234-3385"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Laak Institute Foundation",
       "institutionType": "Private HEI",
       "province": "Davao de Oro",
       "municipalityCity": "Laak",
       "website": "",
       "faxTelephoneNo": "0917-1395017; 0998-5494230"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Tagum Doctors College",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://tagumdoctors.edu.ph/",
       "faxTelephoneNo": "(084) 655-6971; (084) 308-1560; (084) 655-6971"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Gabriel Taborin College of Davao Foundation",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": "(082) 236-0452; (082) 236-0554"
     },
     {
       "region": "11 - Davao Region",
       "desc": "ACES Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Davao del Norte",
       "municipalityCity": "Panabo City",
       "website": "",
       "faxTelephoneNo": "(084) 628-6915"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Governor Generoso College of Arts Sciences and Technology",
       "institutionType": "LUC",
       "province": "Davao Oriental",
       "municipalityCity": "Gov. Generoso",
       "website": "",
       "faxTelephoneNo": "(082) 440-3541"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao Vision Colleges",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": "(082) 297-4750; (082) 295-6696"
     },
     {
       "region": "11 - Davao Region",
       "desc": "St. Thomas More School of Law and Business",
       "institutionType": "Private HEI",
       "province": "Davao del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://stms.edu.ph/school/",
       "faxTelephoneNo": "(084) 216-3866; 0917-7172547; 0917-7241144"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Monkayo College of Arts Sciences and Technology",
       "institutionType": "LUC",
       "province": "Davao de Oro",
       "municipalityCity": "Monkayo",
       "website": "",
       "faxTelephoneNo": "0917-3058459"
     },
     {
       "region": "11 - Davao Region",
       "desc": "ACQ College of Ministries",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": "(082) 234-2866 Loc 109; (082) 234-7272"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Koinonia Theological Seminary Foundation",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "https://ktsfi.edu.ph/",
       "faxTelephoneNo": "(082) 224-4933; (082) 221 -7802 local 103"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Evangelical Mission College",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": "(082) 297-7298; 0915-1856211"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Samson Polytechnic College of Davao",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "https://samsonpcd.edu.ph/",
       "faxTelephoneNo": "(082) 300-1493; (082) 227-2392"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Mt. Apo Science Foundation College",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://umindanao.edu.ph/",
       "faxTelephoneNo": "(082) 300-11364"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Kolehiyo ng Pantukan",
       "institutionType": "LUC",
       "province": "Davao de Oro",
       "municipalityCity": "Pantukan",
       "website": "https://knp.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Northlink Technological College",
       "institutionType": "Private HEI",
       "province": "Davao del Norte",
       "municipalityCity": "Panabo City",
       "website": "https://www.northlink.edu.ph/",
       "faxTelephoneNo": "(084) 628-8351; (084) 628-6884"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Tagum City College of Science and Technology Foundation",
       "institutionType": "Private HEI",
       "province": "Davao Del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://tccstfi.edu.ph/",
       "faxTelephoneNo": "(084) 216-6824 Local 108"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao De Oro State College",
       "institutionType": "SUC Main",
       "province": "Davao de Oro",
       "municipalityCity": "Compostela",
       "website": "https://ddosc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Institute of International Culinary and Hospitality Entrepreneurship Inc.",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.ichef.com.ph/",
       "faxTelephoneNo": "(082) 305-8833; (082) 305-7788"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Asian International School of Aeronautics and Technology",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "https://aisat.edu.ph/",
       "faxTelephoneNo": "(082) 295-7219; (082) 305-7992"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao De Oro State College-Maragusan Branch",
       "institutionType": "SUC Satellite",
       "province": "Davao de Oro",
       "municipalityCity": "Maragusan",
       "website": "https://ddosc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao De Oro State College-Montevista Branch",
       "institutionType": "SUC Satellite",
       "province": "Davao de Oro",
       "municipalityCity": "Montevista",
       "website": "https://ddosc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Davao De Oro State College-New Bataan Branch",
       "institutionType": "SUC Satellite",
       "province": "Davao de Oro",
       "municipalityCity": "New Bataan",
       "website": "https://ddosc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "JojiñIlaganñInternational ManagementñSchool",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.theinternationalmanagementschool.com/",
       "faxTelephoneNo": "(082) 305-8833; (082) 227-5602"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Malayan Colleges Mindanao",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "https://mcm.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Card-MRI Development Institute",
       "institutionType": "Private HEI",
       "province": "Davao del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://cmdi.edu.ph/",
       "faxTelephoneNo": "(084) 216-0955"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Sto. Tomas College of Agriculture Sciences and Technology",
       "institutionType": "LUC",
       "province": "Davao del Norte",
       "municipalityCity": "Sto. Tomas",
       "website": "https://stcast.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Lyceum of the Philippines-Davao",
       "institutionType": "Private HEI",
       "province": "Davao Del Sur",
       "municipalityCity": "Davao City",
       "website": "https://www.lpudavao.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Maryknoll College of Panabo",
       "institutionType": "Private HEI",
       "province": "Davao del Norte",
       "municipalityCity": "Panabo City",
       "website": "https://mcpi.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Samal Island City College",
       "institutionType": "LUC",
       "province": "Davao Del Norte",
       "municipalityCity": "Island Garden City of Samal",
       "website": "https://sicc.education/",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "STI College-Tagum",
       "institutionType": "Private HEI",
       "province": "Davao del Norte",
       "municipalityCity": "Tagum City",
       "website": "https://www.sti.edu/campuses-details.aspñcampus_id=TAG",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Philippine College of Technology-Calinan Campus",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "http://www.pctdavao.edu.ph/",
       "faxTelephoneNo": "(082) 287-2258"
     },
     {
       "region": "11 - Davao Region",
       "desc": "Colegio de Caraga",
       "institutionType": "Private HEI",
       "province": "Davao Oriental",
       "municipalityCity": "Caraga",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "AMYA Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Davao del Sur",
       "municipalityCity": "Davao City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "11 - Davao Region",
       "desc": "Maco de Oro College",
       "institutionType": "LUC",
       "province": "Davao de Oro",
       "municipalityCity": "Maco",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "St. Alexius College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "https://stalexiuscollege.edu.ph/",
       "faxTelephoneNo": "(083) 228-2019; (083) 228-4015"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Edenton Mission College",
       "institutionType": "Private HEI",
       "province": "Sarangani",
       "municipalityCity": "Maitum",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Gensantos Foundation College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "http://www.gficollege.com/",
       "faxTelephoneNo": "(083) 554-6285; (083) 552-3008"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Holy Trinity College of General Santos City",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://htcgsc.edu.ph/",
       "faxTelephoneNo": "(083) 552-3905; (083) 552-5578 local 122"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "King's College of Marbel",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": "(083) 228-1922"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Mindanao Polytechnic College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://www.mpcgensan.edu.ph/",
       "faxTelephoneNo": "(083) 554-0592; (083) 553-4992"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Mindanao State University-General Santos",
       "institutionType": "SUC Satellite",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://msugensan.edu.ph/",
       "faxTelephoneNo": "(083) 302-9616; (083) 302-9617; 0917-5081960"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Notre Dame of Dadiangas University",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://www.nddu.edu.ph/",
       "faxTelephoneNo": "(083) 552-4351; (083) 552-4444; (083) 552-3385; (083) 552-5196"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Notre Dame of Marbel University",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "http://www.ndmu.edu.ph/",
       "faxTelephoneNo": "(083) 228-2218; (083) 228-2819; (083) 228-3979"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Schola de San Jose",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Polomolok",
       "website": "",
       "faxTelephoneNo": "(083) 225-2653"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Ramon Magsaysay Memorial Colleges",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://rmmc.edu.ph/",
       "faxTelephoneNo": "(083) 552-3264; (083) 301-1927"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Santa Cruz Mission School",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Lake Sebu",
       "website": "",
       "faxTelephoneNo": "(083) 228-2313; 0906-6091738"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "South Cotabato State College",
       "institutionType": "SUC Main",
       "province": "South Cotabato",
       "municipalityCity": "Surallah",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "STI College-Gen. Santos",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://www.sti.edu/campuses-details.aspñcampus_id=GEN",
       "faxTelephoneNo": "(083) 552-8517; (083) 552-8518"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Green Valley College Foundation",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "https://greenvalleyph.com/official/",
       "faxTelephoneNo": "(083) 228-9722; (083) 228-4034"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Marbel School of Science and Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": "(083) 228-3147; (083) 520-1647"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "AMA Computer College-General Santos City",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(083) 552-8100; (083) 301-2719"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Central Mindanao Colleges",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "https://cmc.edu.ph/",
       "faxTelephoneNo": "(064) 577-1708; (064) 577-5038"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Regency Polytechnic College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": "(083) 228-1994"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Cotabato Foundation College of Science and Technology",
       "institutionType": "SUC Main",
       "province": "Cotabato",
       "municipalityCity": "Arakan",
       "website": "https://cfcst.edu.ph/",
       "faxTelephoneNo": "(064) 577-1343"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Cotabato Foundation College of Science and Technology-Antipas Campus",
       "institutionType": "SUC Satellite",
       "province": "Cotabato",
       "municipalityCity": "Antipas",
       "website": "https://cfcst.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Cotabato Foundation College of Science and Technology-Katipunan Campus",
       "institutionType": "SUC Satellite",
       "province": "South Cotabato",
       "municipalityCity": "Sto. Nino",
       "website": "https://cfcst.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Cotabato Foundation College of Science and Technology-Pikit Campus",
       "institutionType": "SUC Satellite",
       "province": "Cotabato",
       "municipalityCity": "Pikit",
       "website": "https://cfcst.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Cotabato Medical Foundation College",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Midsayap",
       "website": "",
       "faxTelephoneNo": "(064) 229-8207; (064) 229-9277; (064) 229-8426"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Dr. Domingo B. Tamondong Memorial Hospital and College Foundation",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Esperanza",
       "website": "",
       "faxTelephoneNo": "0915-7784566"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "King's College of Isulan",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Isulan",
       "website": "",
       "faxTelephoneNo": "(064) 201-3386; (064) 201-3389; 0917-7008187"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Lebak Family Doctors' School of Midwifery",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Lebak",
       "website": "",
       "faxTelephoneNo": "(064) 205-3251"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "University of Southern Mindanao-Kidapawan City Campus",
       "institutionType": "SUC Satellite",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "https://www.usm.edu.ph/academics/kidapawan-city-campus/",
       "faxTelephoneNo": "(064) 288-1624; (064) 577-1536"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Colegio de Kidapawan",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "https://cdk.edu.ph/",
       "faxTelephoneNo": "(064) 577-1340"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Notre Dame of Kidapawan College",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "https://www.ndkc.edu.ph/",
       "faxTelephoneNo": "(064) 577-1673 loc 135; (064) 577-5235"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Notre Dame of Midsayap College",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Midsayap",
       "website": "https://www.ndmc.edu.ph/",
       "faxTelephoneNo": "(064) 521-9878"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Notre Dame of Salaman College",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Lebak",
       "website": "https://ndsci.ckgroup.ph/",
       "faxTelephoneNo": "(064) 205-3041"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Notre Dame of Tacurong College",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "https://www.ndtc.edu.ph/",
       "faxTelephoneNo": "(064) 200-3364; (064) 200-6182; (064) 200-4131; (064) 200-3631"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Quezon Colleges of Southern Philippines",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "",
       "faxTelephoneNo": "(064) 562-0219"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "St. Luke's Institute",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kabacan",
       "website": "",
       "faxTelephoneNo": "(064) 572-1130"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Senator Ninoy Aquino College Foundation",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Sen. Ninoy Aquino",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Southern Baptist College",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Mlang",
       "website": "https://www.sobapco.org/",
       "faxTelephoneNo": "(064) 572-4020"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Southern Christian College",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Midsayap",
       "website": "https://southernchristiancollege.edu.ph/",
       "faxTelephoneNo": "(064) 229-9115; (064) 229-8323; (064) 229-9323"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Southern Mindanao Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "",
       "faxTelephoneNo": "(064) 200-3549"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Southern Philippines Methodist College",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "",
       "faxTelephoneNo": "(064) 577-4297"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat Educational Institution",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "",
       "faxTelephoneNo": "(064) 200-3012; (064) 477-0050"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat State University",
       "institutionType": "SUC Main",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "https://sksu.edu.ph/",
       "faxTelephoneNo": "(064) 200-7336; 0917-7770754"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat State University-Isulan",
       "institutionType": "SUC Satellite",
       "province": "Sultan Kudarat",
       "municipalityCity": "Isulan",
       "website": "https://sksu.edu.ph/",
       "faxTelephoneNo": "0929-3371804"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat State University-Lutayan",
       "institutionType": "SUC Satellite",
       "province": "Sultan Kudarat",
       "municipalityCity": "Lutayan",
       "website": "https://sksu.edu.ph/",
       "faxTelephoneNo": "0930-974-5740"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat State University-Kalamansig",
       "institutionType": "SUC Satellite",
       "province": "Sultan Kudarat",
       "municipalityCity": "Kalamansig",
       "website": "https://sksu.edu.ph/",
       "faxTelephoneNo": "0918-2132340"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat State University-Bagumbayan",
       "institutionType": "SUC Satellite",
       "province": "Sultan Kudarat",
       "municipalityCity": "Bagumbayan",
       "website": "https://sksu.edu.ph/",
       "faxTelephoneNo": "0917-3097779"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat State University-Palimbang",
       "institutionType": "SUC Satellite",
       "province": "Sultan Kudarat",
       "municipalityCity": "Palimbang",
       "website": "https://sksu.edu.ph/",
       "faxTelephoneNo": "0926-5115638"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Sultan Kudarat State University-Tacurong",
       "institutionType": "SUC Satellite",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "https://sksu.edu.ph/",
       "faxTelephoneNo": "0927-5847194"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "University of Southern Mindanao-Main",
       "institutionType": "SUC Main",
       "province": "Cotabato",
       "municipalityCity": "Kabacan",
       "website": "https://www.usm.edu.ph/",
       "faxTelephoneNo": "(064) 248-2138; (064) 454-0175"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "North Valley College Foundation",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "https://northvalleycollege.edu.ph/",
       "faxTelephoneNo": "(064) 572-6381"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Central Mindanao Computer School",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Mlang",
       "website": "",
       "faxTelephoneNo": "(064) 572-0319"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Adventist College of Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Tupi",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Goldenstate College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://www.goldenstate.edu.ph/",
       "faxTelephoneNo": "(083) 552-5544"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "General Santos Doctors' Medical School Foundation",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": "(083) 552-7877; (083) 302-3507; (083) 552-9793"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Notre Dame-Siena College of Polomolok",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Polomolok",
       "website": "",
       "faxTelephoneNo": "(083) 500-8414"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Brokenshire College SOCSKSARGEN",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": "(083) 301-4202"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Holy Child College of Information Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Surallah",
       "website": "",
       "faxTelephoneNo": "(083) 238-3036; (083) 878-1066"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "South East Asian Institute of Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Tupi",
       "website": "http://seait-edu.ph/",
       "faxTelephoneNo": "(083) 226-1203"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "VMC Asian College Foundation",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "",
       "faxTelephoneNo": "(064) 200-6466; (064) 477-0354"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Asian Colleges and Technological Institute",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kabacan",
       "website": "",
       "faxTelephoneNo": "0950-1451430; 0999-7763700"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Stratford International School",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": "(083) 554-1615"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "ACLC College of Marbel",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": "(083) 228-4823; (083) 228-4824"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Korbel Foundation College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": "(83) 877-2051"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "STI College of Koronadal City",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(083) 228-5989 to 90; (083) 228-6805"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "i-Link College of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Midsayap",
       "website": "https://ilinkcst.edu.ph/",
       "faxTelephoneNo": "(064) 229-8045; (064) 229-5465"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Goldenstate College of Koronadal City",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "https://www.goldenstate.edu.ph/",
       "faxTelephoneNo": "(083) 228-8593"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Marvelous College of Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": "(083) 228-8756"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "STI College - Koronadal City - Tacurong City Branch",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(064) 477-0332; (064) 200-4628"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "B.E.S.T. College of Polomolok",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Polomolok",
       "website": "",
       "faxTelephoneNo": "(083) 500-2258"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Ramon Magsaysay Memorial College - Marbel",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "https://www.rmmc-mi.com/",
       "faxTelephoneNo": "(083) 228-2880; (083) 228-6392"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "General Santos Academy",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Polomolok",
       "website": "",
       "faxTelephoneNo": "(083) 500-2593"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Marbel Institute of Technical College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": "(083) 228-2816; (083) 887-7941"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Joji Ilagan International School of Hotel & Tourism Management",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://jojiilaganinternationalschool.com/",
       "faxTelephoneNo": "(083) 554-8498"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "North Point College of Arts and Technology",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "",
       "faxTelephoneNo": "(064) 577-3206"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "MMG College of General Santos City",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": "(083) 302-0596"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Villamor College of Business and Arts",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": "(083) 553-0006; (083) 302-3187; (083) 552-7895"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Cronasia Foundation College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://www.cronasia.com/",
       "faxTelephoneNo": "(083) 554-6323"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Green Valley College Foundation - Isulan Campus",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Isulan",
       "website": "",
       "faxTelephoneNo": "(064) 201-4993"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Kidapawan Doctors College",
       "institutionType": "Private HEI",
       "province": "Cotabato",
       "municipalityCity": "Kidapawan City",
       "website": "https://records.kdci.edu.ph/",
       "faxTelephoneNo": "(064) 577-3830"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Kulaman Academy",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Sen. Ninoy Aquino",
       "website": "",
       "faxTelephoneNo": "(064) 562-0326"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Gensan College of Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": "(083) 301-8274"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Primasia Foundation College",
       "institutionType": "Private HEI",
       "province": "Sarangani",
       "municipalityCity": "Alabel",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Southpoint College of Arts and Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://www.southpointcollege-gsc.education/",
       "faxTelephoneNo": "(083) 552-1991"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Makilala Institute of Science and Technology",
       "institutionType": "LUC",
       "province": "Cotabato",
       "municipalityCity": "Makilala",
       "website": "",
       "faxTelephoneNo": "(064) 268-2132; (064) 268-2130"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "West Celebes College of Technology",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Lebak",
       "website": "",
       "faxTelephoneNo": "(064) 205-3623"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Saint Albert Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "",
       "faxTelephoneNo": "(064) 562-3587"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Filipino Canadian Community College Foundation",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://filcancollege.com/",
       "faxTelephoneNo": "(083) 301-8568;  (083) 552-5516"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "New Era University-General Santos City",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://neu.edu.ph/",
       "faxTelephoneNo": "(083) 887-7039"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Glan Institute of Technology",
       "institutionType": "LUC",
       "province": "Sarangani",
       "municipalityCity": "Glan",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Southern Philippine Technical College of Koronadal",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Koronadal City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Salaman Intitute",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Lebak",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Goldenstate College of Kiamba",
       "institutionType": "Private HEI",
       "province": "Sarangani",
       "municipalityCity": "Kiamba",
       "website": "https://www.goldenstate.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Goldenstate College of Maasim",
       "institutionType": "Private HEI",
       "province": "Sarangani",
       "municipalityCity": "Maasim",
       "website": "https://www.goldenstate.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Goldenstate College of Malungon",
       "institutionType": "Private HEI",
       "province": "Sarangani",
       "municipalityCity": "Malungon",
       "website": "https://www.goldenstate.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "New Brighton School of the Philippines",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://newbrighton.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Pacific Southbay College",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Goodwill Colleges of North Eastern Philippines",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "Tacurong City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "King Solomon Institute",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "https://kingsolomoninstitute.com/",
       "faxTelephoneNo": "639771007851 / 083-552-9868"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Santo Niño College Foundation",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Banga",
       "website": "https://sncfi.edu.ph/",
       "faxTelephoneNo": "9513609369"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "VMC Asian College of President Quirino",
       "institutionType": "Private HEI",
       "province": "Sultan Kudarat",
       "municipalityCity": "President Quirino",
       "website": "",
       "faxTelephoneNo": "064-200-6466 / 064-477-0354 / 064-200-6466"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "Envirogreen School of Technology",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "General Santos City",
       "website": "",
       "faxTelephoneNo": "(083) 553-4909"
     },
     {
       "region": "12 - Soccsksargen",
       "desc": "New Hope School of Agriculture and Fishery",
       "institutionType": "Private HEI",
       "province": "South Cotabato",
       "municipalityCity": "Polomolok",
       "website": "",
       "faxTelephoneNo": "083-878-0499 / 09608296437"
     },
     {
       "region": "",
       "desc": "",
       "institutionType": "",
       "province": "",
       "municipalityCity": "",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Adamson University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Ermita",
       "website": "https://www.adamson.edu.ph/",
       "faxTelephoneNo": "(02) 525-7013; (02) 522-5526; (02) 521-2630"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Air Link International Aviation College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "https://aliac.edu.ph/",
       "faxTelephoneNo": "(02) 851-4428; (02) 854-5419"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Alliance Graduate School",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.ags.edu.ph/",
       "faxTelephoneNo": "(02) 411-4357 to 58; (02) 373-6439; (02) 371-3984"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer College-Makati",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 751-7132"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer University",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 359-0262; (02) 496-1736"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Arellano University-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://www.arellano.edu.ph/",
       "faxTelephoneNo": "(02) 734-7371 to 74; (02) 735-3684; (02) 735-3215; (02) 734-7371 loc 220"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Arellano University-Malabon",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Malabon City",
       "website": "https://www.arellano.edu.ph/",
       "faxTelephoneNo": "(02) 579-7289; (02) 281-0025"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Arellano University-Pasay",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "https://www.arellano.edu.ph/",
       "faxTelephoneNo": "(02) 832-5525; (02) 831-8077; (02) 834-7487; (02) 822-1204"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Arellano University-Pasig",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://www.arellano.edu.ph/",
       "faxTelephoneNo": "(02) 404-1644; (02) 642-1310"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asia Pacific College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.apc.edu.ph/",
       "faxTelephoneNo": "(02) 852-9232; (02) 853-0201; (02) 852-2648; (02) 757-1953"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute for Distance Education",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.aide.edu.ph/",
       "faxTelephoneNo": "(02) 810-0968; (02) 813-0565"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute of Journalism and Communication",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://aijc.com.ph/",
       "faxTelephoneNo": "(02) 740-0396; (02) 743-4321"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute of Management",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.aim.edu/",
       "faxTelephoneNo": "(02) 892-4011; (02) 893-7631"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute of Maritime Studies",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "https://www.aims.edu.ph/",
       "faxTelephoneNo": "(02) 832-2467; (02) 551-5157; (02) 556-1840"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Social Institute",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "http://www.asinet-online.org/",
       "faxTelephoneNo": "(02) 523-3483; (02) 523-8265 to 67; (02) 526-6154; (02) 526-6155"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Theological Seminary",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://ats.ph/",
       "faxTelephoneNo": "(02) 928-6717; (02) 928-5105; (02) 923-0669; (02) 928-5114; (02) 928-6722"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Assumption College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.assumption.edu.ph/",
       "faxTelephoneNo": "(02) 817-0757; (02) 893-0427; (02) 894-3603"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Ateneo de Manila University-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.ateneo.edu/",
       "faxTelephoneNo": "(02) 426-6001; (02) 426 6079; (02) 426-6001 ext. 4000-4006"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Ateneo De Manila University School of Medicine and Public Health",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://www.ateneo.edu/",
       "faxTelephoneNo": "(02) 706-3085; (02) 706-3174; (02) 426-6078"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Ateneo de Manila University Graduate School of Business",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://gsb.ateneo.edu/",
       "faxTelephoneNo": "(02) 899-7691; (02) 899-5548"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Bernardo College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.bernardocollege.edu.ph/",
       "faxTelephoneNo": "(02) 872-6204; (02) 873-3330; (02) 872-1129"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Biblical Seminary of the Philippines",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "https://bsop.edu.ph/",
       "faxTelephoneNo": "(02) 292-6795; (02) 292-6798; (02) 292-6675; (02) 292-6656"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "CAP College Foundation",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://capcow.com/",
       "faxTelephoneNo": "(02) 812-6923; (02) 759-2155"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of Asia and the Pacific",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://uap.asia/",
       "faxTelephoneNo": "(02) 637-0912 loc 226 322 406 ; (02) 631-2174; (02) 631-2178"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Central Colleges of the Philippines",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.ccp.edu.ph/",
       "faxTelephoneNo": "(02) 715-5770 loc. 110 to 147; (02) 713-8454; (02) 715-0846; (02) 713-6806; (02) 715-5170 loc. 124;  (02) 715-0845"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Centro Escolar University-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "San Miguel",
       "website": "https://www.ceu.edu.ph/",
       "faxTelephoneNo": "(02) 735-6861 to 69; (02) 735-5991"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Chiang Kai Shek College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Tondo",
       "website": "https://www.cksc.edu.ph/",
       "faxTelephoneNo": "(02) 252-6161; (02) 252-3331"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Chinese General Hospital Colleges",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "http://www.cghc.edu.ph/",
       "faxTelephoneNo": "(02) 711-0075; (02) 711-4141 Local 601; (02) 743-8941"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Saint Anthony Mary Claret College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.icla.org.ph/",
       "faxTelephoneNo": "(02) 932-0343; (02) 954-0252; (02) 920-1442; (02) 932-0346"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Colegio de San Juan de Letran",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Intramuros",
       "website": "https://www.letran.edu.ph/",
       "faxTelephoneNo": "(02) 527-7693 to 96; (02) 301-0720; (02) 527-1776"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Colegio de San Lorenzo",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 926-9999 loc 120;  (02) 453-0659"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Concordia College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Paco",
       "website": "https://laconcordia.edu.ph/",
       "faxTelephoneNo": "(02)564-2001 to 02; (02) 564-2002; (02) 563-4352"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "De La Salle University-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://www.dlsu.edu.ph/",
       "faxTelephoneNo": "(02) 524-4611; (02) 521-9094 (02) 523-4152; (02) 523-4148"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "De Ocampo Memorial College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Mesa",
       "website": "https://deocampomemorialcollege.ph/",
       "faxTelephoneNo": "(02) 715-6445; (02) 716-3428; (02) 715-0967"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Divine Word Mission Seminary",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 726-5002; (02) 726-5004; (02) 726-5002 Local 201"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "De La Salle-College of Saint Benilde",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://www.benilde.edu.ph/",
       "faxTelephoneNo": "(02) 230-5100; (02) 230-5100 local 3103"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Dominican College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "San Juan City",
       "website": "http://www.dominican.edu.ph/",
       "faxTelephoneNo": "(02) 724-5406 to 09; (02) 952-4770; (02) 724-5406 to 09 loc 115"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Don Bosco Technical College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "https://dbmanda.one-bosco.org/",
       "faxTelephoneNo": "(02) 531-8081; (02) 531-8082; (02) 531-8083; (02) 531-6644"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Dr. Carlos S. Lanting College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://lantingcollege.edu.ph/",
       "faxTelephoneNo": "(02) 939-1930; (02) 939-7229"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Emilio Aguinaldo College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Paco",
       "website": "https://www.eac.edu.ph/",
       "faxTelephoneNo": "(02) 521-2710; (02) 524-0008"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Eulogio \"Amang\" Rodriguez Institute of Science and Technology",
       "institutionType": "SUC Main",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://earist.edu.ph/",
       "faxTelephoneNo": "(02) 243-9437; (02) 230-2216"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Far Eastern University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://www.feu.edu.ph/",
       "faxTelephoneNo": "(02) 735-5621; (02) 735-0232; (02) 735-0039"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "FEATI University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "http://www.featiu.edu.ph/",
       "faxTelephoneNo": "(02) 733-8321 to 25; (02) 733-7043; (02) 733-3982"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Febias College of Bible",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "https://febias.edu.ph/",
       "faxTelephoneNo": "(02) 445-5947; (02) 293-0947"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "FEU-FERN College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.feudiliman.edu.ph/",
       "faxTelephoneNo": "(02) 932-0104; (02) 361-7986; (02) 361-7786"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "FEU-Dr. Nicanor Reyes Medical Foundation",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.feu-nrmf.ph/",
       "faxTelephoneNo": "(02) 427-0213; (02) 427-5624; (02) 938-4851"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Governor Andres Pascual College",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Navotas City",
       "website": "",
       "faxTelephoneNo": "(02) 282-9036; (02) 282-9035"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Greenville College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "",
       "faxTelephoneNo": "(02) 682-3712; (02) 681-3554"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "De La Salle-Araneta University",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Malabon City",
       "website": "https://www.dlsau.edu.ph/",
       "faxTelephoneNo": "(02) 330-9128 to 31; (02) 361-9054"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Guzman College of Science and Technology",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Quiapo",
       "website": "",
       "faxTelephoneNo": "(02) 733-9866; (02) 734-8446"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Holy Rosary College Foundation",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.holyrosarycolleges.com/",
       "faxTelephoneNo": "(02) 662-0354"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Institute of Community and Family Health",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.icfhi.com/",
       "faxTelephoneNo": "(02) 712-0815"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Institute of Formation and Religious Studies",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.ifrs.com.ph/",
       "faxTelephoneNo": "(02) 721-9932; (02) 724-7173; (02) 725-6605"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Interface Computer College-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://home.interface.edu.ph/",
       "faxTelephoneNo": "(02) 736-3912; (02) 736-4150"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "International Baptist College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City ",
       "website": "http://www.ibcs.edu.ph/",
       "faxTelephoneNo": "(02) 533-6378; (02) 531-4227"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "International Graduate School of Leadership",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://igsl.asia/",
       "faxTelephoneNo": "(02) 454-4546 to 50; (02) 454-4552; (02) (02) 984-1216"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Jose Rizal University",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "https://www.jru.edu/",
       "faxTelephoneNo": "(02) 531-8031; (02) 532-1418; (02) 531-8031 loc 14"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of Caloocan City",
       "institutionType": "LUC",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://ucc-caloocan.edu.ph/",
       "faxTelephoneNo": "(02) 310-6855; (02) 310-6581"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "La Consolacion College-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "San Miguel",
       "website": "https://www.lccm.edu.ph/",
       "faxTelephoneNo": "(02) 736-0235; (02) 736-7602; (02) 310-0512"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "La Consolacion College-Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.lccm.edu.ph/",
       "faxTelephoneNo": "(02) 287-9703; (02) 287-9715; (02) 287-5373"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Lacson College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "",
       "faxTelephoneNo": "(02) 521-4988; (02) 241-5788"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Centro Escolar Las Piñas",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.celp.edu.ph/",
       "faxTelephoneNo": "(02) 801-7211 to 14; (02) 801-7215; (02) 801-7211"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Regis Marie College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "",
       "faxTelephoneNo": "(02) 826-9267"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Lyceum of the Philippines University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Intramuros",
       "website": "https://www.lpu.edu.ph/",
       "faxTelephoneNo": "(02) 527-8251 to 56; (02) 527-1761; (02) 527-1757; (02) 572-5548"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "City of Malabon University",
       "institutionType": "LUC",
       "province": "Third District",
       "municipalityCity": "Malabon City",
       "website": "https://cityofmalabonuniversity.edu.ph/",
       "faxTelephoneNo": "(02) 287-8948 (02) 289-9924; (02) 287-7859; (02) 287-7835"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Manila Central University",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://mcu.edu.ph/",
       "faxTelephoneNo": "(02) 364-1071; (02) 364-2748"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Manila Tytana Colleges",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "http://www.mtc.edu.ph/",
       "faxTelephoneNo": "(02) 859-0888; (02) 859-0820; (02) 859-0804; (02) 859-0855; (02) 859-0810"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Manila Law College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "https://www.mlc.edu.ph/",
       "faxTelephoneNo": "(02) 733-7707; (02) 735-8624; (02) 314-8513"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Manila Adventist College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "https://mac.edu.ph/",
       "faxTelephoneNo": "(02) 525-9191; (02) 524-3256; (02) 525-9191 ext 434"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Manila Theological College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "http://www.mtcslshs.edu.ph/",
       "faxTelephoneNo": "(02) 714-1583; (02) 713-2727"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Manuel L. Quezon University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Quiapo",
       "website": "https://www.mlqu.ph/",
       "faxTelephoneNo": "(02) 734-0121 to 24; (02) 733-7976; (02) 733-9938; (02) 736-5241"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Mapua University-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Intramuros",
       "website": "https://www.mapua.edu.ph/",
       "faxTelephoneNo": "(02) 247-5000; (02) 527-3680; (02) 301-0105"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Mapua University-Makati",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.mapua.edu.ph/",
       "faxTelephoneNo": "(02) 247-5000; (02) 891-0790; (02) 891-0843"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Marikina Polytechnic College",
       "institutionType": "SUC Main",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "https://mpc.edu.ph/",
       "faxTelephoneNo": "(02) 369-7216; (02) 682-0596"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Martinez Memorial College",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "",
       "faxTelephoneNo": "(02) 288-8861 to 63; (02) 288-4279"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Mary Chiles College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "",
       "faxTelephoneNo": "(02) 735-5341 loc 281; (02) 711-4233; (02) 735-5341 loc 209"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "CICM Maryhill School of Theology",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 721-2695; (02) 722-4566"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Metro Business College-Pasay",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "",
       "faxTelephoneNo": "(02) 888-0432; (02) 887-7236"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Metro Manila College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 418-0084; (02) 419-1482"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Metropolitan Medical Center College of Arts Science and Technology",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "https://www.metro.edu.ph/",
       "faxTelephoneNo": "(02) 253-8769; (02) 254-1111; (02) 255-2737"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Miriam College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.mc.edu.ph/",
       "faxTelephoneNo": "(02) 580-5400 to 29; (02) 426-0169; (02) 435-9232; (02) 435-9236"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Mother of Life Center",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://motheroflifecenter.edu.ph/",
       "faxTelephoneNo": "(02) 939-3433; (02) 985-5501"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pamantasan ng Lungsod ng Muntinlupa",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "http://www.plmun.edu.ph/",
       "faxTelephoneNo": "(02) 659-2113; (02) 893-3368; (02) 659-2113 loc 217"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "NAMEI Polytechnic Institute",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "",
       "faxTelephoneNo": "(02) 531-7328 local 103 or 107"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "National College of Business and Arts-Cubao",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "http://www.ncba.edu.ph/",
       "faxTelephoneNo": "(02) 913-8785 loc. 162; (02) 913-1985"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "National College of Business and Arts-Fairview",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "http://www.ncba.edu.ph/",
       "faxTelephoneNo": "(02) 427-0290; (02) 427-0289; (02) 930-9505"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "The National Teachers College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Quiapo",
       "website": "https://ntc.edu.ph/",
       "faxTelephoneNo": "(02) 734-5601; (02) 734-1885"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "National University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://national-u.edu.ph/",
       "faxTelephoneNo": "(02) 712-1900; (02) 749-8209; (02) 712-1900 loc 405"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Navotas Polytechnic College",
       "institutionType": "LUC",
       "province": "Third District",
       "municipalityCity": "Navotas City",
       "website": "https://navotaspolytechniccollege.edu.ph/",
       "faxTelephoneNo": "(02) 281-9132"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "New Era University",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.neu.edu.ph/main/",
       "faxTelephoneNo": "(02) 981-4221; (02) 981-4240"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Olivarez College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://olivarezcollege.edu.ph/",
       "faxTelephoneNo": "(02) 829-0704; (02) 826-0750 loc 107; (02) 825-8712; (02) 826-0750 loc 119"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Our Lady of Fatima University-Valenzuela",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "https://www.fatima.edu.ph/",
       "faxTelephoneNo": "(02) 291-6556; (02) 293-2713; (02) 293-2703; (02) 432-2809; (02) 432-6026; (02) 444-5939; (02) 291-6504"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Our Lady of Lourdes College",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "https://ollcf.edu.ph/",
       "faxTelephoneNo": "(02) 922-0070; (02) 922-0077; (02) 922-0072"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Our Lady of the Angels Seminary",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://ofmschools.com/olas/",
       "faxTelephoneNo": "(02) 283-8850; (02) 936-4083"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "PACE Graduate School of Christian Education",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://pgsce.wordpress.com/",
       "faxTelephoneNo": "(02) 398-2350"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pamantasan ng Lungsod ng Maynila",
       "institutionType": "LUC",
       "province": "City of Manila First District",
       "municipalityCity": "Intramuros",
       "website": "http://www.plm.edu.ph/",
       "faxTelephoneNo": "(02) 527-1466"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "City University of Pasay",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "",
       "faxTelephoneNo": "(02) 846-7554; (02) 551-1342"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of Makati",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.umak.edu.ph/",
       "faxTelephoneNo": "(02) 882-0675; (02) 883-1867; (02) 882-0679"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pasig Catholic College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://www.pasigcatholic.edu.ph/",
       "faxTelephoneNo": "(02) 642-7967; (02) 642-7481; (02) 641-3134; (02) 643-6486 "
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "PATTS College of Aeronautics",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://www.patts.edu.ph/",
       "faxTelephoneNo": "(02) 825-8823; (02) 825-8824"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Perpetual Help College of Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://manila.uphsl.edu.ph/",
       "faxTelephoneNo": "(02) 731-1550"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of Perpetual Help System Dalta",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://perpetualdalta.edu.ph/",
       "faxTelephoneNo": "(02) 871-0639 to 46; (02) 875-0194; (02) 874-8515"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Dominican Center of Institutional Studies",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 354-4494; (02) 354-4581"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Christian University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://pcu.edu.ph/",
       "faxTelephoneNo": "(02) 523-2162; (02) 523-2372"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine College of Criminology",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "https://pccr.edu.ph/",
       "faxTelephoneNo": "(02) 733-1607; (02) 735-8624; (02) 733-1608"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine College of Health Sciences",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Quiapo",
       "website": "http://pchsmanila.edu.ph/",
       "faxTelephoneNo": "(02) 734-0340; (02) 736-2433"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Louis College-Valenzuela",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "https://www.slcv.edu.ph/",
       "faxTelephoneNo": "(02) 292-0481; (02) 292-3137; (02) 292-3121"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Law School",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "https://phillaw.edu.ph/",
       "faxTelephoneNo": "(02) 521-4988"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Merchant Marine School-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "",
       "faxTelephoneNo": "(02) 742-3372; (02) 742-3375"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Merchant Marine School-Las Piñas",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "",
       "faxTelephoneNo": "(02) 805-0241; (02) 801-9110; (02) 805-0243; (02) 877-3300"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Normal University-Main",
       "institutionType": "SUC Main",
       "province": "City of Manila First District",
       "municipalityCity": "Ermita",
       "website": "https://www.pnu.edu.ph/",
       "faxTelephoneNo": "(02) 527-0375"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine School of Business Administration-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://psba.edu/",
       "faxTelephoneNo": "(02) 437-5129; (02) 913-9659; (02) 913-9657; (02) 437-5129; (02) 421-2881; (02) 913-9658"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine School of Business Administration-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://psba.edu/",
       "faxTelephoneNo": "(02) 735-1353; (02) 735-1355; (02) 735-1384; (02) 735-1351"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine State College of Aeronautics-Main",
       "institutionType": "SUC Main",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "http://philsca-edu.com/",
       "faxTelephoneNo": "(02) 401-5527"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "The Philippine Women's University-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://www.pwu.edu.ph/",
       "faxTelephoneNo": "(02) 526-8421; (02) 526-6935"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "PHILSIN College Foundation",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Mesa",
       "website": "",
       "faxTelephoneNo": "(02) 715-0018; (02) 715-2238; (02) 715-4410"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "PMI Colleges-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "",
       "faxTelephoneNo": "(02) 354-7204; (02) 242-4540; (02) 244-3146"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "PMI Colleges-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 374-4770; (02) 242-4540; (02) 244-3146"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Polytechnic University of the Philippines",
       "institutionType": "SUC Main",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Mesa",
       "website": "https://www.pup.edu.ph/",
       "faxTelephoneNo": "(02) 716-4034; (02) 716-2644"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Polytechnic University of The Philippines-Open University",
       "institutionType": "SUC Satellite",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Mesa",
       "website": "https://www.pup.edu.ph/",
       "faxTelephoneNo": "(02) 716-4034; (02) 716-2644"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Polytechnic University of the Philippines-San Juan Campus",
       "institutionType": "SUC Satellite",
       "province": "Second District",
       "municipalityCity": "San Juan City",
       "website": "https://www.pup.edu.ph/",
       "faxTelephoneNo": "(02) 632-7738; (02) 724-6322; (02) 497-4459; (02) 579-4792"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Polytechnic University of the Philippines-Parañaque Campus",
       "institutionType": "SUC Satellite",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://www.pup.edu.ph/",
       "faxTelephoneNo": "(02) 553-8623; (02) 478-6917; (02) 554-8623"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Polytechnic University of the Philippines-Taguig",
       "institutionType": "SUC Satellite",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://www.pup.edu.ph/",
       "faxTelephoneNo": "(02) 837-5858; (02) 837-5859; (02) 837-5860"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "World Citi Colleges-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.worldciti.edu.ph/",
       "faxTelephoneNo": "(02) 913-8380 local 422 423; (02) 913-8380 local 421; (02) 913-8380 local 336"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Makati Medical Center College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://medicicollege.com/",
       "faxTelephoneNo": "(063) 893-3284; (02) 815-9910; (02) 812-0100"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Republican College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 912-1286; (02) 912-5579"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Rizal Technological University",
       "institutionType": "SUC Main",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "https://www.rtu.edu.ph/",
       "faxTelephoneNo": "(02) 534-8267; (02) 534-9710; (02) 534-8267 local 110"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Roosevelt College-Marikina",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "https://feuroosevelt.edu.ph/",
       "faxTelephoneNo": "(02) 941-4093; (02) 941-3584"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Camillus College Seminary",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "",
       "faxTelephoneNo": "(02) 941-5194; (02) 941-5196; (02) 941-5195"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Francis Divine College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 939-9304"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Saint Francis of Assisi College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://stfrancis.edu.ph/",
       "faxTelephoneNo": "(02) 800-4507; (02) 805-8014; (02) 801-0394"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Joseph's College of Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://sjcqc.edu.ph/",
       "faxTelephoneNo": "(02) 721-5045; (02) 725-5197; (02) 723-0222 to 23"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Jude College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://www.stjude.edu.ph/",
       "faxTelephoneNo": "(02) 338-5833; (02) 740-4149; (02) 314-5528"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Paul University-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://www.spumanila.edu.ph/",
       "faxTelephoneNo": "02) 524-5687; (02) 526-0410; (02) 536-1473"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Paul University-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://spuqc.edu.ph/",
       "faxTelephoneNo": "(02) 726-7986; (02) 726-7987; (02) 726-7988; (02) 726-0552; (02) 722-1865"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Saint Rita College-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Quiapo",
       "website": "http://srcm.edu.ph/",
       "faxTelephoneNo": "(02) 734-4360; (02) 736-3988"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Scholastica's College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "http://ssc.edu.ph/",
       "faxTelephoneNo": "(02) 567-7686; (02) 559-7593"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Samson College of Science and Technology-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://samson.edu.ph/",
       "faxTelephoneNo": "(02) 721-4129; (02) 414-6429; (02) 723-1648"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "San Beda University",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "San Miguel",
       "website": "https://www.sanbeda.edu.ph/",
       "faxTelephoneNo": "(02) 735-6011 to 15; (02) 735-5994"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "San Carlos Seminary",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.scs.edu.ph/",
       "faxTelephoneNo": "(02) 895-8855; (02) 890-9563"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "San Juan de Dios Educational Foundation",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "https://sjdefi.edu.ph/",
       "faxTelephoneNo": "(02) 551-2763; (02) 551-9214; (02) 551-2755"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "San Sebastian College-Recoletos",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://sscrmnl.edu.ph/",
       "faxTelephoneNo": "(02) 734-8931; (02) 734-8918; (02) 734-8931 loc 100"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Sta. Catalina College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://stacatalinacollegemla.com/",
       "faxTelephoneNo": "(02) 734-6861; (02) 734-6817; (02) 735-2449"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Santa Isabel College of Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Ermita",
       "website": "https://santaisabel.edu.ph/",
       "faxTelephoneNo": "(02) 525-9416 to 19; (02) 524-7340"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Siena College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://scqc.edu.ph/",
       "faxTelephoneNo": "(02) 415-1280; (02) 414-1155 to 58 loc 201"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Southeastern College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "http://www.southeastern.com.ph/",
       "faxTelephoneNo": "(02) 831-8484; (02) 551-5693; (02) 834-5052; (02) 899-3877; (02)  831-7532; (02) 834-0704"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Luke's College of Medicine-William H. Quasha Memorial",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://slmc-cm.edu.ph/",
       "faxTelephoneNo": "(02) 723-0101 loc. 3808; (02) 727-7610; (02) 727-7609"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Stella Maris College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "http://stellamariscollegeqc.edu.ph/",
       "faxTelephoneNo": "(02) 912-4085; (02) 912-4210; (02) 911-0867"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Systems Plus Computer College-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.spcf.edu.ph/",
       "faxTelephoneNo": "(02) 724-9047; (02) 365-4743; (02) 925-1784"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Technological Institute of the Philippines-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Quiapo",
       "website": "https://www.tip.edu.ph/",
       "faxTelephoneNo": "(02) 736-4208; (02) 733-9117; (02) 913-8084; (02) 911-0107; (02) 911-0966"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Technological Institute of the Philippines-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.tip.edu.ph/",
       "faxTelephoneNo": "(02) 912-1539; (02) 911-0107"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Technological University of the Philippines-Manila",
       "institutionType": "SUC Main",
       "province": "City of Manila First District",
       "municipalityCity": "Ermita",
       "website": "https://www.tip.edu.ph/",
       "faxTelephoneNo": "(02) 301-3001; (02) 521-4063; (02) 523-2293"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Trinity University of Asia",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "http://www.tua.edu.ph/",
       "faxTelephoneNo": "(02) 702-2882; (02) (02) 410-1726"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Technological University of the Philippines-Taguig",
       "institutionType": "SUC Satellite",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "http://www.tup.edu.ph/",
       "faxTelephoneNo": "(02) 301-3001; (02) 521-4063; (02) 523-2293"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Unciano Colleges and General Hospital",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Mesa",
       "website": "",
       "faxTelephoneNo": "(02) 714-3977; (02) 245-5106; (02)-716-7291"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Southeast Asian College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://saci.edu.ph/",
       "faxTelephoneNo": "(02) 712-3640 local 130; (02) 712-3209; (02) 781-6362"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of the East-Ramon Magsaysay Memorial Medical Center",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.uerm.edu.ph/#/",
       "faxTelephoneNo": "(02) 713-3315; (02) 715-0861 Local 261"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "The University of Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "http://www.um.edu.ph/",
       "faxTelephoneNo": "(02) 735-5098; (02) 735-5085; (02) 735-5084; (02) 735-5094; (02) 735-5089"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of Santo Tomas",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://www.ust.edu.ph/",
       "faxTelephoneNo": "(02) 731-5709; (02) 786-1734; (02) 731-3123"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of the East-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://www.ue.edu.ph/mla/",
       "faxTelephoneNo": "(02) 735-5471; (02) 735-6972; (02) 735-6973"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of the East-Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.ue.edu.ph/mla/",
       "faxTelephoneNo": "(02) 364-2396; (02) 361-1398; (02) 364-2659"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of the Philippines-Diliman",
       "institutionType": "SUC Main",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://upd.edu.ph/",
       "faxTelephoneNo": "(02) 981-8500"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "University of the Philippines-Manila",
       "institutionType": "SUC Satellite",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://www.upm.edu.ph/",
       "faxTelephoneNo": "(02) 521-0184; (02) 741-66-03; (02) 302-2180"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Angelicum College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.ustangelicum.edu.ph/",
       "faxTelephoneNo": "(02) 712-1745; (02) 414-5708"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian College of Science and Technology-Cubao",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.asiancollege.edu.ph/",
       "faxTelephoneNo": "(02) 912-3236; (02) 912-3238; (02) 912-3239; (02) 912-3236 loc 208; (02) 621-9059; (02) 621-9059"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Universidad de Manila",
       "institutionType": "LUC",
       "province": "City of Manila First District",
       "municipalityCity": "Ermita",
       "website": "https://udm.edu.ph/udm2/",
       "faxTelephoneNo": "(02) 336-8960; (02) 336-6582; (02) 336-6552; (02) 484-5295"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Don Bosco Center of Studies",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "http://dbcs.edu.ph/",
       "faxTelephoneNo": "(02) 823-3290 loc 100 or 101; (02) 822-3613; (02) 822-3612 loc 102"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "IETI College-Alabang",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "http://www.ieti.edu.ph/",
       "faxTelephoneNo": "(02) 772-5290; (02) 850-0937; (02) 869-7775"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Our Lady of Perpetual Succor College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "https://olopsc.edu.ph/",
       "faxTelephoneNo": "(02) 997-7777; (02) 941-1571; (02) 997-0760"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "San Beda College-Alabang",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://www.sanbeda-alabang.edu.ph/ (under construction)",
       "faxTelephoneNo": "(02) 236-7222; (02) 842-3511"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Dominic Savio College",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.sdsc.edu.ph/",
       "faxTelephoneNo": "(02) 961-5497; (02) 961-5499"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. John Technological College of the Philippines",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://sjtcp.edu.ph/",
       "faxTelephoneNo": "(02) 937-9956; (02) 283-4862; (02) 938-4167"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Alabang",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 842-0947; (02) 842-0979; (02) 807-7025; (02) 807-2752"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Cubao",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 911-1824; (02) 911-1804 loc 110; (02) 911-1824 loc 201"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Shaw",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 632-9694; (02) 632-9695"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Global City",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 551-4984; (02) 551-4984 loc 5100"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 294-4001; (02) 294-4002"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Muñoz EDSA",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 927-3979; (02) 927-3967; (02) 225-5926"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Novaliches",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 930-0050"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Fairview",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 939-8266; (02) 417-1394; (02) 939-8262; (02) 419-6099; (02) 939-8266 loc 201"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College Pasay-EDSA",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 524-0941; (02) 524-0941 local 102  or 103; (02) 524-0941 local 101"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Rehabilitation Institute Foundation",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 712-9721; (02) 413-7962; (02) 743-7592"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Immaculada Concepcion College",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "",
       "faxTelephoneNo": "(02) 709-4225; (02) 937-5428; (02) 935-9986"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "West Bay College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://wbc.edu.ph/",
       "faxTelephoneNo": "(02) 850-2958; (02) 850-3027; (02) 850-3029"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "System Plus Computer College-Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.spcc.edu.ph/",
       "faxTelephoneNo": "(02) 365-4743; (02) 364-4320"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Saint Bernadette College of Alabang",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://www.sbca.edu.ph/",
       "faxTelephoneNo": "(02) 842-2139; (02) 850-5709 "
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Children of Mary Immaculate College",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "",
       "faxTelephoneNo": "(02) 292-0161; (02) 291-8821; (02) 291-8822"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Informatics College-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "http://www.informatics.edu.ph/",
       "faxTelephoneNo": "(02) 488-3358; (02) 488-3033"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "The Fisher Valley College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://tfvc.edu.ph/",
       "faxTelephoneNo": "(02) 837-4261  (02) 293-1903 "
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "La Consolacion College-Novaliches",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.lccn.edu.ph/",
       "faxTelephoneNo": "(02) 938-8502; (02) 930-8155; (02) 935-8182; (02) 938-8502"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "National Defense College",
       "institutionType": "OGS",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.ndcp.edu.ph/",
       "faxTelephoneNo": "(02) 911-9029; (02) 912-9117; (02) 912-9138; (02) 712-3973; (02) 912-3973; (02) 912-1510; (02) 911-8469"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Public Safety College",
       "institutionType": "OGS",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "",
       "faxTelephoneNo": "(02) 843-9501; (02) 816-3226"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer College-Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 363-8551; (02) 367-7227"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer College-Fairview",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 921-5781; (02) 921-1115"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer College-Parañaque",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 825-2725; (02) 826-6603; (02) 825-2725"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer College-Sta. Mesa",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Mesa",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 714-8881; (02) 714-8882"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Divine Mercy College Foundation",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "",
       "faxTelephoneNo": "(02) 361-1922; (02) 366-6922; (02) 361-0762; (02) 362-3147"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Interface Computer College-Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://home.interface.edu.ph/",
       "faxTelephoneNo": "(02) 366-7271; (02) 736-4150"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Our Lady of Fatima University-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.fatima.edu.ph/",
       "faxTelephoneNo": "(02) 935-2947; (02) 419-1288 loc 12; (02) 935-2947 loc 23; (02) 291-6556"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Our Lady of Lourdes Technological College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 508-5176"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Clare College of Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://stclarecollege.com/home",
       "faxTelephoneNo": "(02) 962-1643"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Las Piñas",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 871-8327; (02) 871-9437"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Dr. Filemon C. Aguilar Memorial College of Las Piñas",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "",
       "faxTelephoneNo": "(02) 403-1985; (02) 869-8027"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asia Graduate School of Theology",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.agstphil.org/",
       "faxTelephoneNo": "(02) 410-0312"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer College-Las Piñas",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 802-0129; (02) 800-1127; (02) 806-4311; (02) 802-0129"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA Computer College-Pasig City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 637-8041 (02) 637-8040; (02) 637-8020"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pamantasan ng Lungsod ng Pasig",
       "institutionType": "LUC",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "",
       "faxTelephoneNo": "(02) 628-1014; (02) 628-1013; (02) 642-4100; (02) 628-1014 loc 101"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Wesleyan College of Manila",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "https://wcmanila.edu.ph/",
       "faxTelephoneNo": "(02) 310-4131 to 32"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Loral Douglas Woosley Bethany Colleges",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://ldwbc.com/",
       "faxTelephoneNo": "(02) 833-4576 loc 114; (02) 833-4577 loc 114; (02) 551-9778; (02) 831-7734"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "STI College-Marikina",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(02) 942-3307; (02) 997-6683; (02) 948-2978; (02) 997-6601"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "IETI College of Science and Technology-Marikina",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "http://www.ieti.edu.ph/",
       "faxTelephoneNo": "(02) 682-3445; (02) 682-5482; (02) 682-2984"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Manila Business College Foundation",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "https://www.mbc.edu.ph/",
       "faxTelephoneNo": "(02) 741-3489; (02) 313-8253; (02) 313-7884"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Access Computer and Technical Colleges-Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Quiapo",
       "website": "http://accesscomputercollege.com.ph/",
       "faxTelephoneNo": "(02) 733-9474; (02) 734-8517"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Kalayaan College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.kalayaan.edu.ph/",
       "faxTelephoneNo": "(02) 726-6291"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Criminal Justice College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "",
       "faxTelephoneNo": "(02) 862-5392"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Entrepreneurs School of Asia",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 638-1188"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute of Computer Studies",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://aics.edu.ph/",
       "faxTelephoneNo": "(02) 363-0497"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Mary's College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://smcqc.edu.ph/",
       "faxTelephoneNo": "(02) 373-6846-49; (02) 374-3076; (02) 376-6295; (02) 373-6846-49 loc 202; (02) 376-6294"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ABE International College of Business and Accountancy-Cubao",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://abe.edu.ph/",
       "faxTelephoneNo": "(02) 912-8366; (02) 912-9578"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ABE International College of Business and Economics-Las Piñas",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://abe.edu.ph/",
       "faxTelephoneNo": "(02) 872-0183; (02) 872-0220"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Development Academy of the Philippines",
       "institutionType": "OGS",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://dap.edu.ph/",
       "faxTelephoneNo": "(632) 631-0921 to 30 local 175 and 177; (02) 631-2167; (02) 631-2123; (02) 633-5569"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "National Christian Life College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "",
       "faxTelephoneNo": "(02) 941-7401; (02) 941-4048"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Global City Innovative College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://global.edu.ph/",
       "faxTelephoneNo": "(02) 882-4242 to 45; (02) 882-8858; (02) 666-8881"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Southville International School and Colleges",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.southville.edu.ph/",
       "faxTelephoneNo": "(02) 825-2358; (02) 825-6374; (02) 820-8703; (02) 820-0935; (02) 825-6284; (02) 829-1675; (02) 820-8259; (02) 820-5161; (02) 820-8715; (02) 820-8714; (02) 825-0766"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Information and Communications Technology Academy",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://iacademy.edu.ph/index.php",
       "faxTelephoneNo": "(02) 889-5555"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Our Lady of Guadalupe Colleges",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "https://olgc.edu.ph/",
       "faxTelephoneNo": "(02) 535-5885 to 86; (02) 535-5885 to 87 loc 108; (02) 535-5885 to 87 loc 101"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "The Manila Times College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Intramuros",
       "website": "https://tmtc.edu.ph/",
       "faxTelephoneNo": "(02) 524-5665"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Access Computer and Technical Colleges-Cubao",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://access.edu.ph/",
       "faxTelephoneNo": "(02) 911-4669; (02) 709-2976; (02) 283-4245"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Immaculate Heart of Mary College-Parañaque",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://www.immaculatinian.webs.com/",
       "faxTelephoneNo": "(02) 823-4109; (02) 824-5408; (02) 823-4109 loc 121"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Polytechnic University of the Philippines-Quezon City Campus",
       "institutionType": "SUC Satellite",
       "province": "Second District",
       "municipalityCity": "http://www.pup.edu.ph",
       "website": "https://www.pup.edu.ph/quezoncity/",
       "faxTelephoneNo": "(02) 428-9144 (02) 952-7818 (02) 952-7817"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Lyceum of Alabang",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://lyceumalabang.edu.ph/",
       "faxTelephoneNo": "(02) 856-9323; (02) 856-9324; (02) 862-4974"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Rogationist Seminary College of Philosophy",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://www.rcj.ph/",
       "faxTelephoneNo": "(02) 544-3676; (02) 828-3422; (02) 828-3415 to 16"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "La Consolacion College-Pasig",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://lccpasig.wordpress.com/",
       "faxTelephoneNo": "(02) 641-8599"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Gardner College Diliman",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://gardner.edu.ph/",
       "faxTelephoneNo": "(02) 925-5640; (02) 929-0281"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ABE International Business College-Caloocan City",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://abe.edu.ph/",
       "faxTelephoneNo": "(02) 363-6065; (02) 367-1431"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "WCC Aeronautical & Technological College-North Manila",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://www.wccaviation.com/north-manila-campus",
       "faxTelephoneNo": "(02) 363-8080; (02) 367-8562"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Informatics College-Northgate",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "http://informatics.edu.ph/",
       "faxTelephoneNo": "(02) 772-2474; (02) 772-2476; (02) 772-3082"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pamantasan ng Lungsod ng Valenzuela",
       "institutionType": "LUC",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "https://valenzuela.plv.edu.ph/PLVWeb/home",
       "faxTelephoneNo": "(02) 277-6100"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Marie-Bernarde College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.mariebernardecollege.edu.ph/",
       "faxTelephoneNo": "(02) 930-4358; (02) 938-2309"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Mary the Queen College of Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://mqc.edu.ph/",
       "faxTelephoneNo": "(02) 434-7192; (02) 434-4460; (02) 436-4468"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Bernadette of Lourdes College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 930-7494; (02) 939-4763"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Flight School International",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "http://www.fsicollege.com/ (under construction)",
       "faxTelephoneNo": "0917-6731099"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Capitol Medical Center Colleges",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.capitolmedical.com.ph/",
       "faxTelephoneNo": "(02) 742-7179; (02) 742-7191"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "New England College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.nec.edu.ph/",
       "faxTelephoneNo": "(02) 711-3406; (02) 742-4050; (02) 708-8996; (02) 711-0857; (02) 711-0857"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Universal Colleges of Parañaque",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://www.ucp.edu.ph/index/",
       "faxTelephoneNo": "(02) 820-4276; (02) 829-3624"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Quezon City University",
       "institutionType": "LUC",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://qcu.edu.ph/",
       "faxTelephoneNo": "(02) 806-3165 (02) 806-3461 (02) 936-0526; (02) 988-4242 local 1201 to 1202"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pamantasan ng Lungsod ng Marikina",
       "institutionType": "LUC",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "https://plmar.edu.ph/",
       "faxTelephoneNo": "(02) 369-8650; (02) 369-7277"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Valenzuela City Polytechnic College",
       "institutionType": "LUC",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "",
       "faxTelephoneNo": "(02) 292-0480"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "South Mansfield College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://www.smc.edu.ph/",
       "faxTelephoneNo": "(02) 862-3036; (02) 862-1976"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. John of Beverly School",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://sjb.edu.ph/",
       "faxTelephoneNo": "(02) 936-1603; (02) 936-1605"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Jesus Reigns Christian College Foundation",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "",
       "faxTelephoneNo": "(02) 354-3188; (02) 400-3819"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Villagers Montessori College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://vmc.edu.ph/",
       "faxTelephoneNo": "(02) 926-2431; (02) 929-0857"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "AMA School of Medicine",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(02) 751-7132"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Enderun Colleges",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://www.enderuncolleges.com/",
       "faxTelephoneNo": "(02) 856-5000; (02) 856-4656; (02) 856-5000 loc 501"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pateros Technological College",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Pateros",
       "website": "http://www.paterostechnologicalcollege.edu.ph/",
       "faxTelephoneNo": "(02) 640-5375 (02) 640-8896; (02) 640-5389"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Messiah College Foundation",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "https://messiahcollege.edu.ph/",
       "faxTelephoneNo": "(02) 727-1506; (02) 727-6986; (02) 727-1506"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "National Polytechnic College of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 967-6663; (02) 419-7890"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Lady of Lourdes Hospital & Colleges of Caybiga",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "",
       "faxTelephoneNo": "(02) 983-5582"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "College of St. Catherine",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 330-3620; (02) 330-4883"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Grace Christian College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.gcc.edu.ph/",
       "faxTelephoneNo": "(02) 387-0240; (02) 364-1971; (02) 366-2000 loc 101"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Taguig City University",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://tcu.taguig.gov.ph/",
       "faxTelephoneNo": "(02) 628-1999 (02) 838-4301 loc 3388; (02) 789-3296; (02) 837-1962; (02) 642-3588"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Centro Escolar University-Makati",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://makati.ceu.edu.ph/",
       "faxTelephoneNo": "(02) 735-6861 to 69; (02) 735-6877; (02) 735-5991"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Philippine Cultural College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.philippineculturalcollege.edu.ph/",
       "faxTelephoneNo": "(02) 241-5522 local 8104; (02) 254-0814; (02) 241-5522 local 8101"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Diliman College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.thedilimancollege.edu.ph/ (under construction)",
       "faxTelephoneNo": "(02) 9310-1089; (02) 931-0728; (02) 931-0731 loc 831 or 824"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Colegio de Sta. Teresa de Avila Foundation",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 399-9115 or 995; (02) 355-9116"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "The One Nation Entrepreneur School",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://one.edu.ph/",
       "faxTelephoneNo": "(02) 744-4444; (02) 751-9445; 0927-7495897"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Bestlink College of the Philippines",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.bcp.edu.ph/",
       "faxTelephoneNo": "(02) 417-4355; (02) 930-1565"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Global Reciprocal Colleges",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://grc.edu.ph/",
       "faxTelephoneNo": "(02) 361-6330"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Golden Link College Foundation",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "http://theosophy.com/",
       "faxTelephoneNo": "(02) 961-5836"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Pacific InterContinental College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.pic.edu.ph/",
       "faxTelephoneNo": "(02) 872-0773; (02) 478-7747; (02) 478-7710"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ACLC College of Taguig",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "http://www.aclc.edu.ph/",
       "faxTelephoneNo": "(02) 556-1104"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute of Computer Studies-Quezon City",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://aics.edu.ph/",
       "faxTelephoneNo": "(02) 952-0308; (02) 430-4651; (02) 430-0040"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Far Eastern University-Makati",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.feu.edu.ph/",
       "faxTelephoneNo": "(02) 836-9870; (02) 836-2033; (02) 817-8800"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Infotech College of Arts and Sciences Philippines",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "",
       "faxTelephoneNo": "(02) 945-6278; (02) 628-2583; (02) 945-6278"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Dominic Institute",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 418-4284; (02) 461-7051"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Treston International College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://treston.edu.ph/",
       "faxTelephoneNo": "(02) 459-7400; (02) 819-6162; (02) 525-7013"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Access Computer and Technical Colleges-Lagro",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://access.edu.ph/",
       "faxTelephoneNo": "(02) 461-7603; (02) 461-7524; (02) 358-4906"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "UBIX Institute of Technologies",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "",
       "faxTelephoneNo": "(02) 850-1645; (02) 850-1517; (02) 807-0322"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "College of Divine Wisdom",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "",
       "faxTelephoneNo": "(02) 503-0159; (02) 503-0111; (02) 503-0048"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Meridian International College of Business and Arts",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://mintcollege.com/",
       "faxTelephoneNo": "(02) 919-0819; (02) 403-8676"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "La Consolacion College-Valenzuela",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "",
       "faxTelephoneNo": "(02) 294-6089; (02) 291-1655"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "South SEED LPDH College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://sslc.edu.ph/",
       "faxTelephoneNo": "(02) 825-6374; (02) 820-8702 to 03 loc 320; (02) 820-2537; (02) 825-6374 loc 199"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Bethel Bible College of the Assemblies of God",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "",
       "faxTelephoneNo": "(02) 294-6135"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Christ the King College of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "",
       "faxTelephoneNo": "(02) 862-6930; (02) 403-2581"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Colegio de San Gabriel Archangel of Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "",
       "faxTelephoneNo": "(02) 785-6950; (02) 788-3087"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Vincent de Ferrer College of Camarin",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://svfc.com.ph/",
       "faxTelephoneNo": "(02) 407-6653; (02)  369-4451"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Datamex College of Saint Adeline-Fairview",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.stadeline.education/",
       "faxTelephoneNo": "(02) 921-8350"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute of Computer Studies-Bicutan",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://aics.edu.ph/",
       "faxTelephoneNo": "(02) 776-0978; (02) 776-0486; (02) 430-0040"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Access Computer and Technical Colleges-Camarin",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://access.edu.ph/",
       "faxTelephoneNo": "(02) 442-1785; (02) 962-9386"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Datamex College of Saint Adeline-Valenzuela",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Valenzuela City",
       "website": "https://www.stadeline.education/",
       "faxTelephoneNo": "(02) 292-7536"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "School of Fashion and the Arts",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Makati City",
       "website": "https://www.sofa.edu.ph/",
       "faxTelephoneNo": "(02) 478-4622 loc 101 113 125"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ICI Global University",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "",
       "faxTelephoneNo": "(02) 914-9800; (02) 914-9810"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Southville International School",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.sisfu.edu.ph/",
       "faxTelephoneNo": "(02) 820-9181; (02) 825-5147"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Therese of the Child Jesus Institute of Arts and Sciences",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Pasay City",
       "website": "",
       "faxTelephoneNo": "(02) 521-7362"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Arellano University-Mandaluyong",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "https://www.arellano.edu.ph/",
       "faxTelephoneNo": "(02) 532-7741"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "La Verdad Christian College-Caloocan",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "https://laverdad.edu.ph/",
       "faxTelephoneNo": "(02) 225-0974"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Rizal Technological University-Pasig",
       "institutionType": "SUC Satellite",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://www.rtu.edu.ph/",
       "faxTelephoneNo": "(02) 642-6152"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "College of Arts and Sciences of Asia and the Pacific",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Pasig City",
       "website": "https://www.casap.edu.ph/",
       "faxTelephoneNo": "(02) 647-5011; (02) 201-3711"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Eclaro Academy",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://eclaro.edu.ph/",
       "faxTelephoneNo": "(02) 441-0501"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Romarinda International College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://ris-education.com/",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asia Harvesters College and Seminary",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "http://ahcs.edu.ph/",
       "faxTelephoneNo": "(02) 952-9987"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Don Carlo Cavina School",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Las Piñas City",
       "website": "https://www.doncarlocavinaschool.com/",
       "faxTelephoneNo": "(02) 805-0319; (02) 805-0344"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Integrated Innovation and Hospitality Colleges",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "",
       "faxTelephoneNo": "(02) 754-9645"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Recoletos School of Theology",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://rst.edu.ph/",
       "faxTelephoneNo": "(02) 951-2861"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Dr. Jose Fabella Memorial Hospital School of Midwifery",
       "institutionType": "OGS",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Cruz",
       "website": "https://fabella.doh.gov.ph/",
       "faxTelephoneNo": "(02) 875-7208 loc 405"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "CIIT College of Arts and Technology",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://ciit.edu.ph/",
       "faxTelephoneNo": "(02) 411-1196 loc 810; (02) 411-1196 loc 888"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Southeast Asia Christian College",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "",
       "faxTelephoneNo": "(02) 930-8260"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Datamex College of Saint Adeline-Parañaque",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "",
       "faxTelephoneNo": "(02) 553-2069; (02) 825-8723"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Guang Ming College",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Malate",
       "website": "https://guangmingcollege.edu.ph/",
       "faxTelephoneNo": "(02) 523-4909; (02) 522-1475"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Asian Institute of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.asiancollege.edu.ph/",
       "faxTelephoneNo": "(02) 912-3236; (02) 912-3238; (02) 912-3239; 02) 621-9059"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "FEU Institute of Technology",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "https://www.feutech.edu.ph/",
       "faxTelephoneNo": "(02) 281-8888; (02) 835-3388"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Makati Science Technological Institute of the Philippines",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sta. Mesa",
       "website": "http://mstip.edu.ph/",
       "faxTelephoneNo": "(02) 742-2076"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Electron College of Technical Education",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.electroncollege.edu.ph/",
       "faxTelephoneNo": "(02) 352-0081; (02) 703-0863; (02) 546-3476"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Marianum College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "",
       "faxTelephoneNo": "(02) 834-6437"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Metropolitan Institute of Arts and Sciences",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "http://mias.com.ph/",
       "faxTelephoneNo": "(02) 283-5332; (02) 428-3042"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Sapphire International Aviation Academy",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://sapphireaviationacademy.com/",
       "faxTelephoneNo": "(02) 826-8611; (02) 833-9105"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ACLC College of Marikina",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Marikina City",
       "website": "http://www.aclc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "FEU Alabang",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://feualabang.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "GK College of Business Arts and Technology",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Mandaluyong City",
       "website": "https://www.gkphilippines.com/",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "NBS College",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "http://www.nbscollege.edu.ph/",
       "faxTelephoneNo": "(02) 216-5716; (02) 376-4960"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Chamuel College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Taguig City",
       "website": "https://www.chamuel.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "College of Saint Amatiel",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Malabon City",
       "website": "",
       "faxTelephoneNo": "(02) 351-4993; 736-9230; 351-4993"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "South CompEdge College",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "United Christian Academy College of Asia",
       "institutionType": "Private HEI",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "https://www.ucaphil.online/",
       "faxTelephoneNo": "(02) 8478-1113"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Colegio de Muntinlupa",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Muntinlupa City",
       "website": "https://www.cdm.edu.ph/",
       "faxTelephoneNo": "(8)424-87-80 loc. 207"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "Parañaque City College",
       "institutionType": "LUC",
       "province": "Fourth District",
       "municipalityCity": "Parañaque City",
       "website": "",
       "faxTelephoneNo": "(02)8962-6958 / 639566720076"
     },
     {
       "region": "",
       "desc": "",
       "institutionType": "",
       "province": "",
       "municipalityCity": "",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ACLC College of Commonwealth",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "http://www.aclc.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "ACLC College of Manila",
       "institutionType": "Private HEI",
       "province": "City of Manila First District",
       "municipalityCity": "Sampaloc",
       "website": "http://www.aclc.edu.ph/",
       "faxTelephoneNo": "02-8735-0385"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "FEU Diliman",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://www.feudiliman.edu.ph/",
       "faxTelephoneNo": "8990-0430"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "NU Fairview",
       "institutionType": "Private HEI",
       "province": "Second District",
       "municipalityCity": "Quezon City",
       "website": "https://national-u.edu.ph/",
       "faxTelephoneNo": "02-8410-6760"
     },
     {
       "region": "13 - Nat. Capital Region",
       "desc": "St. Francis Technical Institute",
       "institutionType": "Private HEI",
       "province": "Third District",
       "municipalityCity": "Caloocan City",
       "website": "",
       "faxTelephoneNo": "02-2853297"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Abra State Institute of Science and Technology-Bangued",
       "institutionType": "SUC Satellite",
       "province": "Abra",
       "municipalityCity": "Bangued",
       "website": "www.asist.edu.ph",
       "faxTelephoneNo": "(074) 752-8171; (074) 752-5243"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Abra State Institute of Science and Technology-Main",
       "institutionType": "SUC Main",
       "province": "Abra",
       "municipalityCity": "Lagangilang",
       "website": "https://www.asist.edu.ph/",
       "faxTelephoneNo": "(074) 752-8171"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Abra Valley Colleges",
       "institutionType": "Private HEI",
       "province": "Abra",
       "municipalityCity": "Bangued",
       "website": "",
       "faxTelephoneNo": "(074) 752-5491"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Apayao State College-Main",
       "institutionType": "SUC Main",
       "province": "Apayao",
       "municipalityCity": "Conner",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Baguio Central University",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "http://www.bcu.edu.ph/",
       "faxTelephoneNo": "(074) 444-9247; (074) 424-8216"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "University of the Cordilleras",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://www.uc-bcf.edu.ph/",
       "faxTelephoneNo": "(074) 442-6268; (074) 442-3316 Local 110"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Benguet State University-Bokod Campus",
       "institutionType": "SUC Satellite",
       "province": "Benguet",
       "municipalityCity": "Bokod",
       "website": "http://www.bsu.edu.ph/",
       "faxTelephoneNo": "0918-4367784"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Benguet State University-Main",
       "institutionType": "SUC Main",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "http://www.bsu.edu.ph/",
       "faxTelephoneNo": "(074) 422-2127; (074) 422-2009; (074) 422-2401"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Benguet State University-Open University",
       "institutionType": "SUC Satellite",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "http://www.bsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Benguet State University-Buguias Campus",
       "institutionType": "SUC Satellite",
       "province": "Benguet",
       "municipalityCity": "Buguias",
       "website": "http://www.bsu.edu.ph/",
       "faxTelephoneNo": "0920-8957584"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Cordillera Career Development College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "http://ccdc.edu.ph/",
       "faxTelephoneNo": "(074) 422-2737; (074) 422-2221"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Divine Word College of Bangued",
       "institutionType": "Private HEI",
       "province": "Abra",
       "municipalityCity": "Bangued",
       "website": "",
       "faxTelephoneNo": "(074) 752-8373; (074) 752-8003"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Ifugao State University - Lagawe Campus",
       "institutionType": "SUC Satellite",
       "province": "Ifugao",
       "municipalityCity": "Lagawe",
       "website": "https://ifsu.edu.ph/",
       "faxTelephoneNo": "(078) 305-1351; 0917-5720345"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Ifugao State University - Main",
       "institutionType": "SUC Main",
       "province": "Ifugao",
       "municipalityCity": "Lamut",
       "website": "https://ifsu.edu.ph/",
       "faxTelephoneNo": "0917-5742363"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Ifugao State University - Potia",
       "institutionType": "SUC Satellite",
       "province": "Ifugao",
       "municipalityCity": "Alfonso Lista",
       "website": "https://ifsu.edu.ph/",
       "faxTelephoneNo": "(078) 305-1351; 0917-5720345"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Kalinga State University-Main",
       "institutionType": "SUC Main",
       "province": "Kalinga",
       "municipalityCity": "Tabuk City",
       "website": "https://ksu.edu.ph/",
       "faxTelephoneNo": "0917-8226145; 0917-5680618"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Philippine Nazarene College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "https://www.philnazcollege.edu.ph/",
       "faxTelephoneNo": "(074) 422-2017; (074) 422-5151; (074) 422-6728"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Mountain Province State University-Main",
       "institutionType": "SUC Main",
       "province": "Mt. Province",
       "municipalityCity": "Bontoc",
       "website": "https://www.mpspc.edu.ph/",
       "faxTelephoneNo": "0939-9020840"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Mountain Province State University-Tadian",
       "institutionType": "SUC Satellite",
       "province": "Mt. Province",
       "municipalityCity": "Tadian",
       "website": "https://www.mpspc.edu.ph/",
       "faxTelephoneNo": "(074) 602-1014"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Pines City Colleges",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://pcc.edu.ph/",
       "faxTelephoneNo": "(074) 445-9064; (074) 445-2208; (074) 445-2204"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Saint Louis College of Bulanao",
       "institutionType": "Private HEI",
       "province": "Kalinga",
       "municipalityCity": "Tabuk City",
       "website": "",
       "faxTelephoneNo": "(074) 423-1497; 0915-9660633"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Saint Louis University",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "http://www.slu.edu.ph/",
       "faxTelephoneNo": "(074) 442-3043; (074) 422-2793; (074) 422-2193; (074) 442-2842"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "San Pablo Major Seminary",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "",
       "faxTelephoneNo": "(074) 442-2847; (074) 442-5790"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Casiciaco Recoletos Seminary",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://www.recoletosdebaguio.edu.ph/",
       "faxTelephoneNo": "(074) 244-0231; (074) 442-2823"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "University of Baguio",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://ubaguio.edu/",
       "faxTelephoneNo": "(074) 442-3071"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "University of the Philippines-Baguio",
       "institutionType": "SUC Satellite",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://www.upb.edu.ph/",
       "faxTelephoneNo": "(074) 442-3888 (074) 442-5592"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Easter College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://eastercollege.ph/public/",
       "faxTelephoneNo": "(074) 443-6764"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Kalinga State University-Dagupan",
       "institutionType": "SUC Satellite",
       "province": "Kalinga",
       "municipalityCity": "Tabuk City",
       "website": "https://ksu.edu.ph/tour/dagupan-campus",
       "faxTelephoneNo": ""
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Philippine Military Academy",
       "institutionType": "OGS",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "",
       "faxTelephoneNo": "(074) 442-0102"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Apayao State College-Luna",
       "institutionType": "SUC Satellite",
       "province": "Apayao",
       "municipalityCity": "Luna",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Keystone College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "",
       "faxTelephoneNo": "(074) 422-1890"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Ifugao State University - Tinoc",
       "institutionType": "SUC Satellite",
       "province": "Ifugao",
       "municipalityCity": "Tinoc",
       "website": "https://ifsu.edu.ph/",
       "faxTelephoneNo": "(078) 305-1351;09166981941"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "STI College-Baguio",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(074) 422-4573; (074) 447-0021"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Baguio College of Technology",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "http://bct.edu.ph/",
       "faxTelephoneNo": "(074) 442-3743; (074) 424-0859; (074) 244-0126; (074) 442-6561"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "BVS College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "",
       "faxTelephoneNo": "(074) 422-4992"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Cordillera A+ Computer Technology College",
       "institutionType": "Private HEI",
       "province": "Kalinga",
       "municipalityCity": "Tabuk City",
       "website": "",
       "faxTelephoneNo": "0927-9132286; 09950598939"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "AMA Computer College-Baguio",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://www.ama.edu.ph/",
       "faxTelephoneNo": "(074) 424-1901"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Data Center College of the Philippines of Bangued-Abra",
       "institutionType": "Private HEI",
       "province": "Abra",
       "municipalityCity": "Bangued",
       "website": "",
       "faxTelephoneNo": "(074) 752-5162"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Kalinga Colleges of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Kalinga",
       "municipalityCity": "Tabuk City",
       "website": "",
       "faxTelephoneNo": "0916-2271891; 0921-9836503"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Data Center College of the Philippines of Baguio City",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "http://dccp.edu.ph/",
       "faxTelephoneNo": "(074) 442-4160; (074) 444-3539"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "King's College of the Philippines-Benguet",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "https://kcp.edu.ph/",
       "faxTelephoneNo": "(074) 422-3576"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Saint Tonis College",
       "institutionType": "Private HEI",
       "province": "Kalinga",
       "municipalityCity": "Tabuk City",
       "website": "",
       "faxTelephoneNo": "0929-1275618"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "BSBT College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "",
       "faxTelephoneNo": "(074) 442-2986; (074) 424-3703"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Xijen College of Mt. Province",
       "institutionType": "Private HEI",
       "province": "Mt. Province",
       "municipalityCity": "Bontoc",
       "website": "",
       "faxTelephoneNo": "0907-3999992; 0919-5285203"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Kalinga State University-Rizal",
       "institutionType": "SUC Satellite",
       "province": "Kalinga",
       "municipalityCity": "Rizal",
       "website": "https://ksu.edu.ph/tour/rizal-campus",
       "faxTelephoneNo": ""
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Remnant International College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://remnantschools.com/",
       "faxTelephoneNo": "074-422-3324 / 074-446-6789"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "International School of Asia and the Pacific",
       "institutionType": "Private HEI",
       "province": "Kalinga",
       "municipalityCity": "Tabuk City",
       "website": "https://isap.edu.ph/",
       "faxTelephoneNo": "0919-8498739; 0927-3559099"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Philippine College of Ministry",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "https://www.pcm.ph/",
       "faxTelephoneNo": "0921-2321593; 0917-8624550"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Ifugao State University-Hapao",
       "institutionType": "SUC Satellite",
       "province": "Ifugao",
       "municipalityCity": "Hungduan",
       "website": "https://www.ifsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Ifugao State University-Aguinaldo",
       "institutionType": "SUC Satellite",
       "province": "Ifugao",
       "municipalityCity": "Aguinaldo",
       "website": "https://www.ifsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Theological Foundation for Asia (Asia Pacific Theological Seminary)",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "Baguio City",
       "website": "https://apts.edu/",
       "faxTelephoneNo": "(63) (074) 442 2779; 442 7068"
     },
     {
       "region": "14 - Cordillera Adm. Region",
       "desc": "Star College",
       "institutionType": "Private HEI",
       "province": "Benguet",
       "municipalityCity": "La Trinidad",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Basilan State College-Lamitan",
       "institutionType": "SUC Satellite",
       "province": "Basilan",
       "municipalityCity": "Lamitan City",
       "website": "https://bassc.edu.ph/basc/",
       "faxTelephoneNo": "(062) 200-7523; (062) 200-3817; (062) 200-7705"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Basilan State College-Maluso",
       "institutionType": "SUC Satellite",
       "province": "Basilan",
       "municipalityCity": "Maluso",
       "website": "https://bassc.edu.ph/basc/",
       "faxTelephoneNo": "(062) 200-7523; (062) 200-3817; (062) 200-7705"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Basilan State College-Sta. Clara",
       "institutionType": "SUC Satellite",
       "province": "Basilan",
       "municipalityCity": "Lamitan City",
       "website": "https://bassc.edu.ph/basc/",
       "faxTelephoneNo": "(062) 200-7523; (062) 200-3817; (062) 200-7705"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Basilan State College-Tipo-Tipo",
       "institutionType": "SUC Satellite",
       "province": "Basilan",
       "municipalityCity": "Tipo-Tipo",
       "website": "https://bassc.edu.ph/basc/",
       "faxTelephoneNo": "(062) 200-7523; (062) 200-3817; (062) 200-7705"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Cotabato State University",
       "institutionType": "SUC Main",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "http://www.cotsu.edu.ph/",
       "faxTelephoneNo": "(064) 421-5146"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Cotabato Foundation College of Science and Technology-Datu Montawal Campus",
       "institutionType": "SUC Satellite",
       "province": "Maguindanao",
       "municipalityCity": "Pagagawan",
       "website": "https://cfcst.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "De La Vida College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-2567"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Dr. P. Ocampo Colleges",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-6548; (064) 421-6549; (064) 421-2797"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Headstart College of Cotabato",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-6571; (064) 421-7338"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Jamiatu Marawi Al-Islamia Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0935-2580434; 0998-4731485; 0920-9779657"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Jamiatu Muslim Mindanao",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "https://www.jmm.edu.ph/",
       "faxTelephoneNo": "0917-7042706; 0917-7042707"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Jamiatul Philippine Al-Islamia",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0917-7106654 ; 0999-8840565"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao State University-Lanao National College of Arts and Trades",
       "institutionType": "SUC Satellite",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "https://sites.google.com/site/msulncat/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mapandi Memorial College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "https://mapandicenter.tripod.com/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Marawi Capitol College Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao Capitol College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 552-0642"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao State University-Main Campus Marawi City",
       "institutionType": "SUC Main",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "https://msumain.edu.ph/",
       "faxTelephoneNo": "0930-2245678; 0918-9322399; 0919-3998655"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Notre Dame Center For Catechesis",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-2644"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Notre Dame Hospital and School of Midwifery",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-5133"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Notre Dame University",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-2698; (064) 421-1684; (064) 421-4312"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Pacasum College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "St. Benedict College of Cotabato",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "https://sbcinc.edu.ph/",
       "faxTelephoneNo": "(064) 421-1969"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Shariff Kabunsuan College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-8601; (064) 421-8865"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao Islamic Computer College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0919-8584940"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "STI College-Cotabato",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(064) 421-3628"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Datu Mala Muslim Mindanao Islamic College Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0917-3874858; 0916-3027662; 0907-6122110"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Antonio R. Pacheco College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-2061; (064) 557-4854"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "AMA Computer College-Cotabato City",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "https://www.amaes.edu.ph/",
       "faxTelephoneNo": "(064) 421-1271; (064) 552-1343"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Bubong Marzok Memorial Foundation College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "(062) 352-0220"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Senator Ninoy Aquino College Foundation-Marawi",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0920-6075090"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Kutawato Darrusalam College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "http://kdci.collegesforums.com/",
       "faxTelephoneNo": "0916-9392190"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Notre Dame RVM College of Cotabato",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "http://ndrvmcotabato.com/",
       "faxTelephoneNo": "(064) 421-2845; (064) 421-5134"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Coland Systems Technology",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 421-9539; (064) 421-2833"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Academia de Tecnologia in Mindanao",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "",
       "faxTelephoneNo": "(064) 577-4162"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Jamiat Cotabato and Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Cotabato City",
       "website": "https://www.jamiatcotabato.net/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Gani L. Abpi College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Datu Piang",
       "website": "https://www.glacicmi.com/",
       "faxTelephoneNo": "0909-3943862; 0922-8076050"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Central Sulu College",
       "institutionType": "Private HEI",
       "province": "Sulu",
       "municipalityCity": "Siasi",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Hadji Butu School of Arts and Trades",
       "institutionType": "OGS",
       "province": "Sulu",
       "municipalityCity": "Jolo",
       "website": "",
       "faxTelephoneNo": "0905-9063550"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Lanao Agricultural College",
       "institutionType": "OGS",
       "province": "Lanao Del Sur",
       "municipalityCity": "Lumbatan",
       "website": "",
       "faxTelephoneNo": "0916-1397275"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Lapak Agricultural School",
       "institutionType": "OGS",
       "province": "Sulu",
       "municipalityCity": "Siasi",
       "website": "",
       "faxTelephoneNo": "0906-3419005"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao State University-Maguindanao",
       "institutionType": "SUC Satellite",
       "province": "Maguindanao",
       "municipalityCity": "Datu Odin Sinsuat",
       "website": "https://msumaguindanao.edu.ph/",
       "faxTelephoneNo": "(064) 546-0503; (064) 486-0039; (064) 421-7136; (064) 645-460503"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao State University-Sulu Development Technical College",
       "institutionType": "SUC Satellite",
       "province": "Sulu",
       "municipalityCity": "Jolo",
       "website": "https://www.msusulu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao State University-Tawi-Tawi College of Technology and Oceanography",
       "institutionType": "SUC Satellite",
       "province": "Tawi-Tawi",
       "municipalityCity": "Bongao",
       "website": "https://www.msutawi-tawi.edu.ph/",
       "faxTelephoneNo": "(02) 533-8855; (02) 533-8856; 0907-7625738; 0927-4961950"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Notre Dame of Jolo College",
       "institutionType": "Private HEI",
       "province": "Sulu",
       "municipalityCity": "Jolo",
       "website": "https://ndjc.edu.ph/wp/",
       "faxTelephoneNo": "(085) 341-8911 Local 2340; 0917-6207142"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Parang Foundation College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Parang",
       "website": "",
       "faxTelephoneNo": "0906-9011044"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Shariff Kabunsuan College (Annex)",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Parang",
       "website": "",
       "faxTelephoneNo": "(064) 421-8601; 0939-2906821"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Sultan Kudarat Islamic Academy Foundation College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Sultan Kudarat",
       "website": "https://skia.edu.ph/",
       "faxTelephoneNo": "(064) 421-4386"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Sulu State College",
       "institutionType": "SUC Main",
       "province": "Sulu",
       "municipalityCity": "Jolo",
       "website": "http://www.sulustatecollege.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Tawi-Tawi Regional Agricultural College",
       "institutionType": "SUC Main",
       "province": "Tawi-Tawi",
       "municipalityCity": "Bongao",
       "website": "http://www.trac.edu.ph/",
       "faxTelephoneNo": "(068) 468-1192; (068)-268-1549"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Tawi-Tawi Regional Agricultural College - Tarawakan",
       "institutionType": "SUC Satellite",
       "province": "Tawi-Tawi",
       "municipalityCity": "Bongao",
       "website": "http://www.trac.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Tawi-Tawi Regional Agricultural College - Languyan",
       "institutionType": "SUC Satellite",
       "province": "Tawi-Tawi",
       "municipalityCity": "Languyan",
       "website": "http://www.trac.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Tawi-Tawi Regional Agricultural College-Simunul",
       "institutionType": "SUC Satellite",
       "province": "Tawi-Tawi",
       "municipalityCity": "Simunul",
       "website": "http://www.trac.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Tawi-Tawi Regional Agricultural College - Sibutu",
       "institutionType": "SUC Satellite",
       "province": "Tawi-Tawi",
       "municipalityCity": "Sibutu",
       "website": "http://www.trac.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Unda Memorial National Agricultural School",
       "institutionType": "OGS",
       "province": "Lanao Del Sur",
       "municipalityCity": "Masiu",
       "website": "",
       "faxTelephoneNo": "0919-5917297"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Upi Agricultural School-Provincial Technical Institute of Agriculture",
       "institutionType": "OGS",
       "province": "Maguindanao",
       "municipalityCity": "Upi",
       "website": "",
       "faxTelephoneNo": "0918-2488223"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Adiong Memorial Polytechnic State College",
       "institutionType": "SUC Main",
       "province": "Lanao Del Sur",
       "municipalityCity": "Ditsaan Ramain",
       "website": "",
       "faxTelephoneNo": "0920-2721901; 0939-9249075"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Balabagan Trade School",
       "institutionType": "OGS",
       "province": "Lanao Del Sur",
       "municipalityCity": "Balabagan",
       "website": "",
       "faxTelephoneNo": "0948-1520226"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Del Sur Good Shepherd College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Wao",
       "website": "",
       "faxTelephoneNo": "0935-9538691"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Southwestern Mindanao Islamic Institute",
       "institutionType": "Private HEI",
       "province": "Sulu",
       "municipalityCity": "Jolo",
       "website": "http://smii.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Tawi-Tawi School of Midwifery",
       "institutionType": "Private HEI",
       "province": "Tawi-Tawi",
       "municipalityCity": "Bongao",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Abubakar Computer Learning Center Foundation",
       "institutionType": "Private HEI",
       "province": "Tawi-Tawi",
       "municipalityCity": "Bongao",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Lanao Educational Institute",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Malabang",
       "website": "",
       "faxTelephoneNo": "0946-5766410"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mahardika Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Tawi-Tawi",
       "municipalityCity": "Bongao",
       "website": "",
       "faxTelephoneNo": "(068) 268-1259; 0920-9458951"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Dansalan Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0948-8991428"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Philippine Muslim Teachers' College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0919-6499279"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "SAL Foundation College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Parang",
       "website": "",
       "faxTelephoneNo": "0919-4156869"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao Autonomous College Foundation",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Lamitan City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "SPA College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Datu Piang",
       "website": "",
       "faxTelephoneNo": "0906-2690275"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Datu Ibrahim Paglas Memorial College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Datu Paglas",
       "website": "",
       "faxTelephoneNo": "0915-8416094"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Cali Paramedical College Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Masiricampo Abantas Memorial Educational Center",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Marawi Islamic College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0948-8447919; 0907-7290506"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Saffrullah M. Dipatuan Foundation Academy",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0921-4624040; 0919-5296218"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "South Upi College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "South Upi",
       "website": "",
       "faxTelephoneNo": "0916-1292645"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "St. Benedict College of Maguindanao",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Parang",
       "website": "",
       "faxTelephoneNo": "(064) 421-1969"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mariam School of Nursing",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Lamitan City",
       "website": "",
       "faxTelephoneNo": "(062) 991-4367; 0910-7053623; (062) 991-2365"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Lanao Islamic Paramedical College Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0929-4130948"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Regional Madrasah Graduate Academy",
       "institutionType": "OGS",
       "province": "Maguindanao",
       "municipalityCity": "Buluan",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Lake Lanao College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0916-2730229"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Wisdom International School for Higher Education Studies",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0923-4248120"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Datu Blo Umpar Adiong Agricultural School Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0999-9945841"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Bai Malgen Mama College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Datu Odin Sinsuat",
       "website": "",
       "faxTelephoneNo": "0939-2631295"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Eastern Kutawato College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Buluan",
       "website": "",
       "faxTelephoneNo": "0917-9764499"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "RC-Al Khwarizmi International College Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "https://www.ranaocouncil.com/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao Institute of Healthcare Professionals",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0906-9150234"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Hardam Furigay Colleges Foundation",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Lamitan City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "University of Southern Mindanao - Buluan",
       "institutionType": "SUC Satellite",
       "province": "Maguindanao",
       "municipalityCity": "Buluan",
       "website": "https://www.usm.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Philippine Engineering and Agro-Industrial College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0919-9941974"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Illana Bay Integrated Computer College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Parang",
       "website": "",
       "faxTelephoneNo": "(064) 425-0257; 0915-7330154; 0917-6243187"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Khadijah Mohammad Islamic Academy",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0939-9193045"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Iranun Foundation College",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Kapatagan",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Lanao Central College",
       "institutionType": "Private HEI",
       "province": "Lanao Del Sur",
       "municipalityCity": "Marawi City",
       "website": "https://lanaocentralcollege.com/",
       "faxTelephoneNo": "0921-2999364"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Sulu College of Technology",
       "institutionType": "Private HEI",
       "province": "Sulu",
       "municipalityCity": "Indanan",
       "website": "",
       "faxTelephoneNo": "0926-1612507; 0927-4074930"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Enthusiastic College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Buldon",
       "website": "https://www.enthusiasticcollege.com/",
       "faxTelephoneNo": "(064)557-4854"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Hadji Datu Saidona Pendatun Foundation College",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Gen. S.K. Pendatun",
       "website": "",
       "faxTelephoneNo": "0915-6662716"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "General Diamongun K. Mangondato College of Agriculture and Fisheries",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Masiu",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Al Bangsamoro Shari'ah and Professional Education College",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "099-9945213"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "As-Salihein Integrated School Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Tamparan",
       "website": "",
       "faxTelephoneNo": "9282078147"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanao Autonomous College Foundation-Maluso",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Maluso",
       "website": "",
       "faxTelephoneNo": "9772372785"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Jamiatu Dansalan Al-Islamia Foundation",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": "0916-8492716; 0930-6153600; 0920-9779657"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Muslim Mindanao Integrated College Academy",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Marawi City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Maranao Islamic Institute - Ma'Had Maranao Al-Islamie",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Tamparan",
       "website": "",
       "faxTelephoneNo": "0915-8223959; 0947-9679255"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Binnor Pangandaman Integrated College",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Wao",
       "website": "",
       "faxTelephoneNo": "0909-5934330; 0906-5554782"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Colegio de Upi",
       "institutionType": "Private HEI",
       "province": "Maguindanao",
       "municipalityCity": "Upi",
       "website": "",
       "faxTelephoneNo": "0936-4208616"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Lamitan Technical Institute",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Lamitan City",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Mindanaoan Integrated Academy",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Wao",
       "website": "",
       "faxTelephoneNo": "0919-5044381"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Universal College Foundation of Southeast Asia and the Pacific",
       "institutionType": "Private HEI",
       "province": "Basilan",
       "municipalityCity": "Lamitan City",
       "website": "",
       "faxTelephoneNo": "(062) 955-3899"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Tamparan Populace Islamic College",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Tamparan",
       "website": "",
       "faxTelephoneNo": "0916-4535005"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Philippine Last Frontier College",
       "institutionType": "Private HEI",
       "province": "Tawi-Tawi",
       "municipalityCity": "Bongao",
       "website": "",
       "faxTelephoneNo": "0997-9435384"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Iqra Development Academy",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Tamparan",
       "website": "https://iqra.edu.ph/",
       "faxTelephoneNo": "0977-7200247; 0945-2146767"
     },
     {
       "region": "15 - Bangsamoro Autonomous Region in Muslim Mindanao",
       "desc": "Asma Khadijah Islamic Academy",
       "institutionType": "Private HEI",
       "province": "Lanao del Sur",
       "municipalityCity": "Picong",
       "website": "",
       "faxTelephoneNo": "0938-1746019"
     },
     {
       "region": "16 - Caraga",
       "desc": "Agusan Colleges",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "http://agusancollegesinc.com/",
       "faxTelephoneNo": "(085) 342-8004; (085) 225-2330"
     },
     {
       "region": "16 - Caraga",
       "desc": "Agusan del Sur College",
       "institutionType": "Private HEI",
       "province": "Agusan Del Sur",
       "municipalityCity": "Bayugan City",
       "website": "https://agusandelsurcollege.com/",
       "faxTelephoneNo": "(085) 231-2150"
     },
     {
       "region": "16 - Caraga",
       "desc": "Agusan Del Sur State College of Agriculture and Technology",
       "institutionType": "SUC Main",
       "province": "Agusan Del Sur",
       "municipalityCity": "Bunawan",
       "website": "https://asscat.edu.ph/",
       "faxTelephoneNo": "0999-7490294"
     },
     {
       "region": "16 - Caraga",
       "desc": "Asian College Foundation",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "",
       "faxTelephoneNo": "(085) 815-3646"
     },
     {
       "region": "16 - Caraga",
       "desc": "Butuan City Colleges",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "https://www.bcc1950.edu.ph/",
       "faxTelephoneNo": "(085) 300-3179; 0948-7538168"
     },
     {
       "region": "16 - Caraga",
       "desc": "Butuan Doctors' College",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "",
       "faxTelephoneNo": "(085) 342-8572; (085) 225-3616"
     },
     {
       "region": "16 - Caraga",
       "desc": "Don Jose Ecleo Memorial Foundation College of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Dinagat Islands",
       "municipalityCity": "San Jose",
       "website": "http://www.djemfcst.com/",
       "faxTelephoneNo": "0917-002009; 0919-3907506"
     },
     {
       "region": "16 - Caraga",
       "desc": "Elisa R. Ochoa Memorial Northern Mindanao School of Midwifery",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "",
       "faxTelephoneNo": "(085) 342-5563; (085) 815-1279; (085) 342-5017"
     },
     {
       "region": "16 - Caraga",
       "desc": "Northern Mindanao Colleges",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Cabadbaran City",
       "website": "https://www.normi.edu.ph/site/",
       "faxTelephoneNo": "(085) 818-5051"
     },
     {
       "region": "16 - Caraga",
       "desc": "Caraga State University-Cabadbaran Campus",
       "institutionType": "SUC Satellite",
       "province": "Agusan Del Norte",
       "municipalityCity": "Cabadbaran City",
       "website": "https://csucc.edu.ph/",
       "faxTelephoneNo": "(085) 343-1020"
     },
     {
       "region": "16 - Caraga",
       "desc": "Caraga State University-Main Campus",
       "institutionType": "SUC Main",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "https://www.carsu.edu.ph/",
       "faxTelephoneNo": "(085) 342-3047; (085) 342-1079; (085) 341-8677"
     },
     {
       "region": "16 - Caraga",
       "desc": "Northwestern Agusan Colleges",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Nasipit",
       "website": "",
       "faxTelephoneNo": "(085) 283-3759; (085) 343-2122"
     },
     {
       "region": "16 - Caraga",
       "desc": "Philippine Normal University-Mindanao Campus",
       "institutionType": "SUC Satellite",
       "province": "Agusan Del Sur",
       "municipalityCity": "Prosperidad",
       "website": "https://www.pnumindanao.com/",
       "faxTelephoneNo": "(085) 241-3085; (085) 342-7106"
     },
     {
       "region": "16 - Caraga",
       "desc": "Saint Francis Xavier College",
       "institutionType": "Private HEI",
       "province": "Agusan Del Sur",
       "municipalityCity": "San Francisco",
       "website": "",
       "faxTelephoneNo": "(085) 839-2284; (085) 343-8327; (085) 242-2016"
     },
     {
       "region": "16 - Caraga",
       "desc": "Saint Joseph Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "https://sjit.edu.ph/",
       "faxTelephoneNo": "(085) 225-5039; (085) 225-6228; (085) 342-5448; (085) 342-5695; (085) 342-5694"
     },
     {
       "region": "16 - Caraga",
       "desc": "St. Jude Thaddeus Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Surigao Del Norte",
       "municipalityCity": "Surigao City",
       "website": "",
       "faxTelephoneNo": "(086) 826-6112; (086) 826-7390"
     },
     {
       "region": "16 - Caraga",
       "desc": "San Francisco Colleges",
       "institutionType": "Private HEI",
       "province": "Agusan Del Sur",
       "municipalityCity": "San Francisco",
       "website": "",
       "faxTelephoneNo": "(085) 839-2200; (085) 343-8575; 0918-9178436"
     },
     {
       "region": "16 - Caraga",
       "desc": "St. Paul University Surigao",
       "institutionType": "Private HEI",
       "province": "Surigao Del Norte",
       "municipalityCity": "Surigao City",
       "website": "https://spus.edu.ph/",
       "faxTelephoneNo": "(086) 826-4325; (086) 826-1724; (086) 826-2567; (086) 826-4325; (086) 231-7440"
     },
     {
       "region": "16 - Caraga",
       "desc": "Surigao State College of Technology-Main",
       "institutionType": "SUC Main",
       "province": "Surigao Del Norte",
       "municipalityCity": "Surigao City",
       "website": "https://snsu.edu.ph/",
       "faxTelephoneNo": "(086) 826-6346; (086) 826-6443"
     },
     {
       "region": "16 - Caraga",
       "desc": "Surigao Education Center",
       "institutionType": "Private HEI",
       "province": "Surigao Del Norte",
       "municipalityCity": "Surigao City",
       "website": "https://my.sec.edu.ph/",
       "faxTelephoneNo": "(086) 231-7048; (086) 826-2007"
     },
     {
       "region": "16 - Caraga",
       "desc": "Father Saturnino Urios University",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "http://www.urios.edu.ph",
       "faxTelephoneNo": "(085) 342-1830 loc 1102; (085) 815-3418; (085) 342-1830 loc 1102"
     },
     {
       "region": "16 - Caraga",
       "desc": "Northeastern Mindanao Colleges",
       "institutionType": "Private HEI",
       "province": "Surigao Del Norte",
       "municipalityCity": "Surigao City",
       "website": "https://nemco.edu.ph/",
       "faxTelephoneNo": "(086) 826-5488; (086) 826-1764"
     },
     {
       "region": "16 - Caraga",
       "desc": "Surigao State College of Technology-Del Carmen",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Norte",
       "municipalityCity": "Del Carmen",
       "website": "https://snsu.edu.ph/",
       "faxTelephoneNo": "0946-8982586; (086) 826-3908; 0998-5445426"
     },
     {
       "region": "16 - Caraga",
       "desc": "Andres Soriano Colleges of Bislig",
       "institutionType": "Private HEI",
       "province": "Surigao Del Sur",
       "municipalityCity": "Bislig City",
       "website": "http://andressorianocollege.com/",
       "faxTelephoneNo": "(086) 853-2306; (086) 853-2241"
     },
     {
       "region": "16 - Caraga",
       "desc": "Saint Michael College-Cantilan",
       "institutionType": "Private HEI",
       "province": "Surigao Del Sur",
       "municipalityCity": "Cantilan",
       "website": "",
       "faxTelephoneNo": "(086) 212-5194"
     },
     {
       "region": "16 - Caraga",
       "desc": "Saint Theresa College of Tandag",
       "institutionType": "Private HEI",
       "province": "Surigao Del Sur",
       "municipalityCity": "Tandag City",
       "website": "https://www.stctandag.edu.ph/",
       "faxTelephoneNo": "(086) 211-3046"
     },
     {
       "region": "16 - Caraga",
       "desc": "Saint Vincent de Paul Diocesan College",
       "institutionType": "Private HEI",
       "province": "Surigao Del Sur",
       "municipalityCity": "Bislig City",
       "website": "",
       "faxTelephoneNo": "(086) 853-1635; (086) 628-2004"
     },
     {
       "region": "16 - Caraga",
       "desc": "North Eastern Mindanao State University-Cagwait",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Sur",
       "municipalityCity": "Cagwait",
       "website": "https://www.sdssu.edu.ph/",
       "faxTelephoneNo": "(086) 214-4221; 0909-6342646"
     },
     {
       "region": "16 - Caraga",
       "desc": "North Eastern Mindanao State University-Lianga",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Sur",
       "municipalityCity": "Lianga",
       "website": "https://www.sdssu.edu.ph/",
       "faxTelephoneNo": "(086) 214-4221; 0920-6609263"
     },
     {
       "region": "16 - Caraga",
       "desc": "North Eastern Mindanao State University-Tagbina",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Sur",
       "municipalityCity": "Tagbina",
       "website": "https://www.sdssu.edu.ph/",
       "faxTelephoneNo": "0920-3051288; (086) 214-4221; 0939-9263797"
     },
     {
       "region": "16 - Caraga",
       "desc": "North Eastern Mindanao State University-San Miguel",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Sur",
       "municipalityCity": "San Miguel",
       "website": "https://www.sdssu.edu.ph/",
       "faxTelephoneNo": "0920-3069011; (086) 214-4221"
     },
     {
       "region": "16 - Caraga",
       "desc": "Southern Technological Institute of the Philippines",
       "institutionType": "Private HEI",
       "province": "Surigao Del Sur",
       "municipalityCity": "Bislig City",
       "website": "https://stipbislig.webs.com/",
       "faxTelephoneNo": "(086) 853-5005; (086) 628-2125"
     },
     {
       "region": "16 - Caraga",
       "desc": "Surigao Sur Colleges",
       "institutionType": "Private HEI",
       "province": "Surigao Del Sur",
       "municipalityCity": "Barobo",
       "website": "",
       "faxTelephoneNo": "0930-2548194; 0946-5588188"
     },
     {
       "region": "16 - Caraga",
       "desc": "North Eastern Mindanao State University-Cantilan",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Sur",
       "municipalityCity": "Cantilan",
       "website": "https://www.sdssu.edu.ph/",
       "faxTelephoneNo": "(086) 212-5132; (086) 212-5237"
     },
     {
       "region": "16 - Caraga",
       "desc": "North Eastern Mindanao State University-Main",
       "institutionType": "SUC Main",
       "province": "Surigao Del Sur",
       "municipalityCity": "Tandag City",
       "website": "https://www.sdssu.edu.ph/",
       "faxTelephoneNo": "(086) 214-4221"
     },
     {
       "region": "16 - Caraga",
       "desc": "University of Southeastern Philippines-Bislig Campus",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Sur",
       "municipalityCity": "Bislig City",
       "website": "https://www.usep.edu.ph/",
       "faxTelephoneNo": "0948-6072624"
     },
     {
       "region": "16 - Caraga",
       "desc": "Siargao Island Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Surigao Del Norte",
       "municipalityCity": "Dapa",
       "website": "https://www.siit.edu.ph/",
       "faxTelephoneNo": "0947-9979464"
     },
     {
       "region": "16 - Caraga",
       "desc": "Caraga Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Kitcharao",
       "website": "https://www.citkitcharao.edu.ph/",
       "faxTelephoneNo": "0905-4894181; 0906-3664053; 0917-7173008"
     },
     {
       "region": "16 - Caraga",
       "desc": "De La Salle John Bosco College",
       "institutionType": "Private HEI",
       "province": "Surigao Del Sur",
       "municipalityCity": "Bislig City",
       "website": "https://dlsjbc.edu.ph/",
       "faxTelephoneNo": "(086) 853-5235; (086) 853-3415"
     },
     {
       "region": "16 - Caraga",
       "desc": "Mt. Carmel College of San Francisco",
       "institutionType": "Private HEI",
       "province": "Agusan Del Sur",
       "municipalityCity": "San Francisco",
       "website": "",
       "faxTelephoneNo": "(085) 839-2161"
     },
     {
       "region": "16 - Caraga",
       "desc": "Surigao State College of Technology-Malimono",
       "institutionType": "SUC Satellite",
       "province": "Surigao Del Norte",
       "municipalityCity": "Malimono",
       "website": "https://snsu.edu.ph/",
       "faxTelephoneNo": "0918-3128954; 0948-2644051; 0921-5313072"
     },
     {
       "region": "16 - Caraga",
       "desc": "Saint Michael College of Caraga",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Nasipit",
       "website": "https://smccnasipit.edu.ph/",
       "faxTelephoneNo": "(085) 343-3251; (085) 343-3607; (085) 343-3251 local 102"
     },
     {
       "region": "16 - Caraga",
       "desc": "Southway College of Technology",
       "institutionType": "Private HEI",
       "province": "Agusan Del Sur",
       "municipalityCity": "San Francisco",
       "website": "https://www.socotech.edu.ph/",
       "faxTelephoneNo": "(085) 839-1170; (085) 839-4476"
     },
     {
       "region": "16 - Caraga",
       "desc": "Holy Child Colleges of Butuan City",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "https://hccb.edu.ph/",
       "faxTelephoneNo": "(085) 342-3975"
     },
     {
       "region": "16 - Caraga",
       "desc": "STI College-Surigao",
       "institutionType": "Private HEI",
       "province": "Surigao Del Norte",
       "municipalityCity": "Surigao City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(086) 826-8087"
     },
     {
       "region": "16 - Caraga",
       "desc": "Balite Institute of Technology-Butuan",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "https://bit-icschools.com/",
       "faxTelephoneNo": "(085) 815-4113"
     },
     {
       "region": "16 - Caraga",
       "desc": "Saint Peter College Seminary",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "",
       "faxTelephoneNo": "(085) 342-3757"
     },
     {
       "region": "16 - Caraga",
       "desc": "Bucas Grande Foundation College",
       "institutionType": "Private HEI",
       "province": "Surigao Del Norte",
       "municipalityCity": "Socorro",
       "website": "https://bgfc.edu.ph/",
       "faxTelephoneNo": "0939-9072205; 0949-7520474"
     },
     {
       "region": "16 - Caraga",
       "desc": "ACLC College of Butuan City",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "http://www.aclcbutuan.edu.ph/",
       "faxTelephoneNo": "(085) 341-5719; (085) 225-6200; 0908-8944410"
     },
     {
       "region": "16 - Caraga",
       "desc": "Hinatuan Southern College",
       "institutionType": "LUC",
       "province": "Surigao Del Sur",
       "municipalityCity": "Hinatuan",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "16 - Caraga",
       "desc": "Philippine Electronics and Communication Institute of Technology",
       "institutionType": "Private HEI",
       "province": "Agusan del Norte",
       "municipalityCity": "Butuan City",
       "website": "http://pecit.edu.ph/",
       "faxTelephoneNo": "(085) 341-7660; (085) 341-5882; (085) 225-5543"
     },
     {
       "region": "16 - Caraga",
       "desc": "Candelaria Institute of Technology of Cabadbaran",
       "institutionType": "Private HEI",
       "province": "Agusan del Norte",
       "municipalityCity": "Cabadbaran City",
       "website": "",
       "faxTelephoneNo": "(085) 343-0994; (085) 343-0176; (085) 343-0941"
     },
     {
       "region": "16 - Caraga",
       "desc": "Surigao Doctors' College",
       "institutionType": "Private HEI",
       "province": "Surigao del Norte",
       "municipalityCity": "Surigao City",
       "website": "",
       "faxTelephoneNo": "(086) 826-0417"
     },
     {
       "region": "16 - Caraga",
       "desc": "Surigao State College of Technology-Mainit",
       "institutionType": "SUC Satellite",
       "province": "Surigao del Norte",
       "municipalityCity": "Mainit",
       "website": "https://snsu.edu.ph/",
       "faxTelephoneNo": "0907-3749953; 0947-1414746; 0948-4062491; 0918-4469060"
     },
     {
       "region": "16 - Caraga",
       "desc": "Merchant Marine Academy of Caraga",
       "institutionType": "Private HEI",
       "province": "Agusan Del Norte",
       "municipalityCity": "Butuan City",
       "website": "https://mmacibutuan.edu.ph/",
       "faxTelephoneNo": "(085) 817-0475"
     },
     {
       "region": "16 - Caraga",
       "desc": "Caraga School of Business",
       "institutionType": "Private HEI",
       "province": "Agusan Del Sur",
       "municipalityCity": "Bayugan City",
       "website": "https://csb.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Abada College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Pinamalayan",
       "website": "",
       "faxTelephoneNo": "(043) 284-4387; (043) 284-4150; ;(043) 284-4063"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Colegio De San Sebastian-Sablayan",
       "institutionType": "Private HEI",
       "province": "Occidental Mindoro",
       "municipalityCity": "Sablayan",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Divine Word College of Calapan",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "https://dwcc.edu.ph/",
       "faxTelephoneNo": "(043) 288-8686 local 104; (043) 288-5085; (043) 288 4567"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Divine Word College of San Jose",
       "institutionType": "Private HEI",
       "province": "Occidental Mindoro",
       "municipalityCity": "San Jose",
       "website": "https://www.dwcsj.edu.ph/",
       "faxTelephoneNo": "(043) 491-1523; (043) 491-4503"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Eastern Mindoro College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Bongabong",
       "website": "",
       "faxTelephoneNo": "(043- 283-5479"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "EMA EMITS College Philippines",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Pinamalayan",
       "website": "",
       "faxTelephoneNo": "(043) 284-3974"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Grace Mission College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Socorro",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Holy Trinity University",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "http://www.htu.edu.ph/",
       "faxTelephoneNo": "(048) 433-2061; (048) 433-2161"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "St. Mary's College of Marinduque",
       "institutionType": "Private HEI",
       "province": "Marinduque",
       "municipalityCity": "Boac",
       "website": "",
       "faxTelephoneNo": "(042) 332-1870"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Luna Goco Colleges-Calapan",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "",
       "faxTelephoneNo": "(043) 286-7208"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Marinduque State University-Main Campus",
       "institutionType": "SUC Main",
       "province": "Marinduque",
       "municipalityCity": "Boac",
       "website": "https://www.mscmarinduque.edu.ph/",
       "faxTelephoneNo": "(042) 332-2028"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Mindoro State University-Main Campus",
       "institutionType": "SUC Main",
       "province": "Oriental Mindoro",
       "municipalityCity": "Victoria",
       "website": "http://minsu.edu.ph/",
       "faxTelephoneNo": "(043) 286-2368; 0917-3137288"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Marinduque State University-Torrijos Campus",
       "institutionType": "SUC Satellite",
       "province": "Marinduque",
       "municipalityCity": "Torrijos",
       "website": "https://www.mscmarinduque.edu.ph/",
       "faxTelephoneNo": "(042) 753-0385"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Occidental Mindoro State College",
       "institutionType": "SUC Main",
       "province": "Occidental Mindoro",
       "municipalityCity": "San Jose",
       "website": "https://www.omsc.edu.ph/",
       "faxTelephoneNo": "(043) 457-0259"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Western Philippines University",
       "institutionType": "SUC Main",
       "province": "Palawan",
       "municipalityCity": "Aborlan",
       "website": "",
       "faxTelephoneNo": "(048) 433-4367; 0919-3836791; 0921-3769389; 0998-8686989"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Western Philippines University-El Nido",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "El Nido",
       "website": "",
       "faxTelephoneNo": "(048) 433-4367; 0919-3836791; 0921-3769389; 0998-8686989"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Western Philippines University-Busuanga",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Busuanga",
       "website": "",
       "faxTelephoneNo": "(048) 433-4367; 0919-3836791; 0921-3769389; 0998-8686989"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Western Philippines University-Culion",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Culion",
       "website": "",
       "faxTelephoneNo": "(048) 433-4367; 0919-3836791; 0921-3769389; 0998-8686989"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Western Philippines University-Quezon",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Quezon",
       "website": "",
       "faxTelephoneNo": "(048) 433-4367; 0919-3836791; 0921-3769389; 0998-8686989"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Western Philippines University-Rio Tuba",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Bataraza",
       "website": "",
       "faxTelephoneNo": "(048) 433-4367; 0919-3836791; 0921-3769389; 0998-8686989"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan Polytechnic College",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "",
       "faxTelephoneNo": "(048) 434-2393"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University",
       "institutionType": "SUC Main",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Narra",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Narra",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Dumaran",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Dumaran",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University- Balabac",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Balabac",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Bataraza",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Bataraza",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Sofronio Española",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Sofronio Española",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-San Andres Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "San Andres",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": "0949-6984643"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-Main",
       "institutionType": "SUC Main",
       "province": "Romblon",
       "municipalityCity": "Odiongan",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": "(042) 567-5271; (042) 567-5859; (042) 567-5273"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Saint Augustine Seminary",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": "(043) 288- 1535"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "San Francisco Javier College",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Narra",
       "website": "",
       "faxTelephoneNo": "0919-8569422"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Santa Cruz Institute-Marinduque",
       "institutionType": "Private HEI",
       "province": "Marinduque",
       "municipalityCity": "Sta. Cruz",
       "website": "",
       "faxTelephoneNo": "(042) 321-1037"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Seminario De San Jose",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "",
       "faxTelephoneNo": "(048) 433-2507; (048) 434-3310"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Educational Systems Technological Institute",
       "institutionType": "Private HEI",
       "province": "Marinduque",
       "municipalityCity": "Boac",
       "website": "",
       "faxTelephoneNo": "(042) 332-1459; (042) 332-2068"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Occidental Mindoro State College-Labangan Campus",
       "institutionType": "SUC Satellite",
       "province": "Occidental Mindoro",
       "municipalityCity": "San Jose",
       "website": "https://www.omsc.edu.ph/",
       "faxTelephoneNo": "(043) 457-0259"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-San Fernando Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "San Fernando",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": "0916-4706284"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "CLCC Institute of Computer Arts & Technology",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "",
       "faxTelephoneNo": "(043) 288-2389"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Mindoro State University-Calapan City Campus",
       "institutionType": "SUC Satellite",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "http://minsu.edu.ph/",
       "faxTelephoneNo": "(043) 286-7371; (043) 286-2368; (043) 286-2422"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Fullbright College",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "",
       "faxTelephoneNo": "(048) 434-3097; (048) 434-3095"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Marinduque Midwest College",
       "institutionType": "Private HEI",
       "province": "Marinduque",
       "municipalityCity": "Gasan",
       "website": "",
       "faxTelephoneNo": "(042) 342 1014; (042) 342 1378"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Mindoro State University-Bongabong Campus",
       "institutionType": "SUC Satellite",
       "province": "Oriental Mindoro",
       "municipalityCity": "Bongabong",
       "website": "http://minsu.edu.ph/",
       "faxTelephoneNo": "(043) 283-5570"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Occidental Mindoro State College-Murtha Campus",
       "institutionType": "SUC Satellite",
       "province": "Occidental Mindoro",
       "municipalityCity": "San Jose",
       "website": "https://www.omsc.edu.ph/",
       "faxTelephoneNo": "(043) 457-0259"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Occidental Mindoro State College-Mamburao",
       "institutionType": "SUC Satellite",
       "province": "Occidental Mindoro",
       "municipalityCity": "Mamburao",
       "website": "https://www.omsc.edu.ph/",
       "faxTelephoneNo": "(043) 457-0259"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Occidental Mindoro State College-Sablayan Campus",
       "institutionType": "SUC Satellite",
       "province": "Occidental Mindoro",
       "municipalityCity": "Sablayan",
       "website": "https://www.omsc.edu.ph/",
       "faxTelephoneNo": "(043) 457-0259"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Prince of Peace College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Puerto Galera",
       "website": "",
       "faxTelephoneNo": "(043) 287-3012"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "John Paul College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Roxas",
       "website": "http://jpcroxas.com/",
       "faxTelephoneNo": "(043) 289-2240"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Marinduque State University-Gasan Campus",
       "institutionType": "SUC Satellite",
       "province": "Marinduque",
       "municipalityCity": "Gasan",
       "website": "https://www.mscmarinduque.edu.ph/",
       "faxTelephoneNo": "(042) 753-0386; (042) 332-2028"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Marinduque State University-Sta. Cruz Campus",
       "institutionType": "SUC Satellite",
       "province": "Marinduque",
       "municipalityCity": "Sta. Cruz",
       "website": "https://www.mscmarinduque.edu.ph/",
       "faxTelephoneNo": "(042) 332-2028"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Araceli",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Araceli",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University- Brooke's Point",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Brooke's Point",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Coron",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Coron",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Cuyo",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Cuyo",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Quezon",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Quezon",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Roxas",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Roxas",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Taytay",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Taytay",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-Calatrava Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "Calatrava",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": "0950-4328059"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-San Agustin Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "San Agustin",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-Cajidiocan Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "Cajidiocan",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": "0917-7358033"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-Sta. Fe Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "Sta. Fe",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-Sta. Maria Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "Sta. Maria",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": "0949-8196635"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-Romblon Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "Romblon",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Western Philippines University-Puerto Princesa",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "",
       "faxTelephoneNo": "(048) 433-4367; 0919-3836791; 0921-3769389; 0998-8686989"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "San Lorenzo Ruiz Seminary",
       "institutionType": "Private HEI",
       "province": "Romblon",
       "municipalityCity": "Odiongan",
       "website": "",
       "faxTelephoneNo": "0918-6856150"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-New Ibajay El Nido",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "El Nido",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Rizal",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Rizal",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Clarendon College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Roxas",
       "website": "",
       "faxTelephoneNo": "(043) 289-2538; (043) 289-2389"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Mina de Oro Institute of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Victoria",
       "website": "",
       "faxTelephoneNo": "(043) 285-5384"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Ark of the Covenant Montessori Chamber of Learning College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Victoria",
       "website": "www.acmclcollege.com/",
       "faxTelephoneNo": "(043) 285-5381"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan Technological College",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "",
       "faxTelephoneNo": "(048) 434-4518"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Innovative College of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Bongabong",
       "website": "www.home.icst.edu.ph/",
       "faxTelephoneNo": "(043) 283-5561; (043) 283-5521"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "St. Anthony College-Calapan City",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "https://www.sacci-online.com/",
       "faxTelephoneNo": "(043) 286-2323; (043) 286- 2364; (043) 441-6634"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Polytechnic University of the Philippines-Bansud Campus",
       "institutionType": "SUC Satellite",
       "province": "Oriental Mindoro",
       "municipalityCity": "Bansud",
       "website": "https://www.pup.edu.ph/",
       "faxTelephoneNo": "(043) 298-7022"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Polytechnic University of the Philippines-Sablayan Campus",
       "institutionType": "SUC Satellite",
       "province": "Occidental Mindoro",
       "municipalityCity": "Sablayan",
       "website": "https://www.pup.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Southwestern Institute of Business and Technology",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Pinamalayan",
       "website": "",
       "faxTelephoneNo": "0918-9918031"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Paradigm Colleges of Science and Technology",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Roxas",
       "website": "",
       "faxTelephoneNo": "(043) 289-2827; (043) 289-2016"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Erhard Systems Technological Institute",
       "institutionType": "Private HEI",
       "province": "Romblon",
       "municipalityCity": "Odiongan",
       "website": "",
       "faxTelephoneNo": "(042) 567-5561; (042) 567-6264"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Institute of Business Science and Medical Arts",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Pinamalayan",
       "website": "https://ibsmainc.weebly.com/",
       "faxTelephoneNo": "(043) 284-3056"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Philippine Central Islands College Foundation",
       "institutionType": "Private HEI",
       "province": "Occidental Mindoro",
       "municipalityCity": "San Jose",
       "website": "",
       "faxTelephoneNo": "(043) 457-0140"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "ACLC College of Calapan",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "http://www.aclc.edu.ph/",
       "faxTelephoneNo": "(043) 441-0183"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Pinamalayan Maritime Foundation and Technological College",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Pinamalayan ",
       "website": "https://pmftciv2.edufrog.online/",
       "faxTelephoneNo": "(043) 284-3566; (043) 284-3777"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "STI College-Puerto Princesa",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "https://www.sti.edu/",
       "faxTelephoneNo": "(048) 434-2765; (048) 434-7043"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "City College of Calapan",
       "institutionType": "LUC",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "",
       "faxTelephoneNo": "(043) 288-7013"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-Linapacan",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Linapacan",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-San Rafael Puerto Princesa City",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "Puerto Princesa City",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Romblon State University-San Jose Campus",
       "institutionType": "SUC Satellite",
       "province": "Romblon",
       "municipalityCity": "San Jose",
       "website": "https://rsu.edu.ph/",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Palawan State University-San Vicente",
       "institutionType": "SUC Satellite",
       "province": "Palawan",
       "municipalityCity": "San Vicente",
       "website": "https://www.psu.palawan.edu.ph/",
       "faxTelephoneNo": "(048) 433-5303; (048) 433-2379"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Baco Community College",
       "institutionType": "LUC",
       "province": "Oriental Mindoro",
       "municipalityCity": "Baco",
       "website": "",
       "faxTelephoneNo": "0926-7435829"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Erhard Science and Technological Institute-Oriental Mindoro",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Gloria",
       "website": "",
       "faxTelephoneNo": "(02) 871-2886"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Malindig Institute Foundation",
       "institutionType": "Private HEI",
       "province": "Marinduque",
       "municipalityCity": "Sta. Cruz",
       "website": "",
       "faxTelephoneNo": "(042) 704-5156"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Southwestern College of Maritime Business and Technology",
       "institutionType": "Private HEI",
       "province": "Oriental Mindoro",
       "municipalityCity": "Calapan City",
       "website": "https://scmbt.edu.ph/",
       "faxTelephoneNo": "(043) 288-3038; (043) 441-6819; 0906-3514158"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Occidental Mindoro State College-Lubang Campus",
       "institutionType": "SUC Satellite",
       "province": "Occidental Mindoro",
       "municipalityCity": "Lubang",
       "website": "",
       "faxTelephoneNo": ""
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "Pola Community College",
       "institutionType": "LUC",
       "province": "Oriental Mindoro",
       "municipalityCity": "Pola",
       "website": "",
       "faxTelephoneNo": "9632082677"
     },
     {
       "region": "17 - MIMAROPA",
       "desc": "San Brendan College",
       "institutionType": "Private HEI",
       "province": "Palawan",
       "municipalityCity": "Taytay",
       "website": "",
       "faxTelephoneNo": "639176514806 / 639068014806"
     }
    ]
    try {
      for (let region of payload) {
        region.code = util.onlyCapitalLetters(region.desc)
        const payloadRegion = {
          code: region.code,
          [`[desc]`]: region.desc,
          institutionType: region.institutionType,
          region: region.region,
          province: region.province,
          municipalityCity: region.municipalityCity,
          website: region.website,
          faxTelephoneNo: region.faxTelephoneNo
        };
        console.log(payloadRegion)
        await regions.insertInstitutions(payloadRegion, txn);
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
  registerCountries,
  registerInstitutions,
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

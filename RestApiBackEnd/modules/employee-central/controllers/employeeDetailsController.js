const EmpModel = require("../models/employeeDetailsModel");

const getClass = async (req, res) => {
  const request = await EmpModel.getClass();
  if (!request) return res.status(500).json(null);

  const trimmedRequest = request.map((item) => ({
    ...item,
    description: item.description.trim(),
  }));

  return res.status(200).json(trimmedRequest);
};

const getInformation = async (req, res) => {
  const {
    division,
    group,
    department,
    section,
    area,
    employeeCode,
    firstName,
    lastName,
    middleName,
    selectedClass,
    withLicense,
    gender,
    active,
  } = req.query;

  const filters = {
    Division: division,
    Group: group,
    Department: department,
    Section: section,
    Area: area,
  };

  let highestLevel = null;
  for (const [level, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined) {
      highestLevel = level;
    }
  }

  const levelConditions = {
    Division: `(cte.Division = ? OR ? IS NULL)`,
    Group: `(cte.[Group] = ? OR ? IS NULL)`,
    Department: `(cte.Department = ? OR ? IS NULL)`,
    Section: `(cte.Section = ? OR ? IS NULL)`,
    Area: `(cte.Area = ? OR ? IS NULL)`,
  };

  const whereConditionLevel = highestLevel
    ? levelConditions[highestLevel]
    : `1 = 1`;

  const hieararchy = await EmpModel.getHierarchy(
    whereConditionLevel,
    highestLevel,
    filters,
  );

  const combineCodes = hieararchy.map((item) => item.code);

  const information = await EmpModel.getInformation(
    employeeCode,
    firstName,
    lastName,
    middleName,
    selectedClass,
    withLicense,
    gender,
    active,
    combineCodes,
  );

  if (!information) return res.status(500).json(null);

  return res.status(200).json(information);
};

module.exports = {
  getClass,
  getInformation,
};

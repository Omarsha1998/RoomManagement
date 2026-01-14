const HierarchyModel = require("../models/hierarchyModel");
const sqlHelper = require("../../../helpers/sql");

// const buildHierarchyTree = (data) => {
//   const levels = {
//     1: "CorporateOfficer1",
//     2: "CorporateOfficer2",
//     3: "Division1",
//     4: "Division2",
//     5: "Group",
//     6: "Department",
//     7: "Section",
//     8: "Area",
//   };

//   const map = {};
//   const tree = {};

//   for (const item of data) {
//     const node = {
//       code: item.code,
//       name: item.description || item.code,
//       level: levels[item.level] || `Level${item.level}`,
//       children: {},
//     };

//     map[item.code] = node;

//     if (item.parent) {
//       if (!map[item.parent]) {
//         map[item.parent] = { children: {} };
//       }
//       map[item.parent].children[item.code] = node;
//     } else {
//       tree[item.code] = node;
//     }
//   }

//   return tree;
// };

const buildHierarchyTree = (data) => {
  const levels = {
    1: "CorporateOfficer1",
    2: "CorporateOfficer2",
    3: "Division1",
    4: "Division2",
    5: "Group",
    6: "Department",
    7: "Section",
    8: "Area",
  };

  // First pass: create all nodes
  const map = {};
  for (const item of data) {
    map[item.code] = {
      code: item.code,
      name: item.description || item.code,
      level: levels[item.level] || `Level${item.level}`,
      children: {},
      parent: item.parent,
    };
  }

  // Second pass: build the tree
  const tree = {};
  for (const code in map) {
    const node = map[code];
    const parentCode = node.parent;
    delete node.parent; // Clean up temporary property

    if (parentCode && map[parentCode]) {
      map[parentCode].children[code] = node;
    } else {
      tree[code] = node;
    }
  }

  return tree;
};

const getHiearchy = async (req, res) => {
  const request = await HierarchyModel.getHiearchy();
  const rawData = request;

  if (!request) return res.status(500).json(null);
  // const tree = buildTree(request);
  const tree = buildHierarchyTree(rawData);

  return res.status(200).json({ tree, rawData });
};

const getDepartments = async (req, res) => {
  const request = await HierarchyModel.getDepartments();
  if (!request) res.status(500).json(null);
  return res.status(200).json(request);
};

const checkDeptData = async (req, res) => {
  const { selectedDepartment } = req.body;

  let hierarchyText = "";

  const checkParent = async (department, isFirstCheck = true) => {
    const result = await HierarchyModel.checkDuplicate(department);

    if (!isFirstCheck) {
      let message = "";
      switch (result[0].level) {
        case 1:
          message += `parent division of ${result[0].code} - (${result[0].description})`;
          break;
        case 2:
          message += `parent group of ${result[0].code} - (${result[0].description}), `;
          break;
        case 3:
          message += `parent department of ${result[0].code} - (${result[0].description}), `;
          break;
        case 4:
          message += `parent section of ${result[0].code} - (${result[0].description}), `;
          break;
        default:
          message += `Unknown Level ${result[0].level} for Code: ${result[0].code}, `;
      }

      hierarchyText += (hierarchyText ? " then " : "") + message;
    }

    if (result[0]?.parent) {
      return checkParent(result[0].parent, false);
    }

    return result[0];
  };

  await checkParent(selectedDepartment);

  if (hierarchyText.length === 0) {
    hierarchyText = "No Parent Data / No Parent Conflict";
  }

  res.status(200).json({ body: `${hierarchyText}` });
};

const updateChildrenLevels = async (
  parentCode,
  levelDifference,
  updater,
  txn,
  depth = 0,
) => {
  const children = await HierarchyModel.getChildrenByParent(parentCode, txn);

  if (!children || children.length === 0) {
    return;
  }

  for (const child of children) {
    const oldLevel = child.level;
    const newLevel = oldLevel + levelDifference;

    await HierarchyModel.setNewHierarchy(
      {
        level: newLevel,
        UpdatedBy: updater,
      },
      { Code: child.code },
      txn,
      "DateTimeUpdated",
    );

    await updateChildrenLevels(
      child.Code,
      levelDifference,
      updater,
      txn,
      depth + 1,
    );
  }
};

const setHierarchyData = async (department, parent, level, updater) => {
  const check = await HierarchyModel.checkDuplicate(department);

  const updateInsert = await sqlHelper.transact(async (txn) => {
    const existingDept = check && check.length > 0 ? check[0] : null;
    const oldLevel = existingDept ? existingDept.level : null;

    let result;
    if (existingDept) {
      result = await HierarchyModel.setNewHierarchy(
        {
          parent: parent,
          level: level,
          UpdatedBy: updater,
          Deleted: 0,
        },
        { Code: department },
        txn,
        "DateTimeUpdated",
      );
    } else {
      result = await HierarchyModel.insertNewHierarchy(
        {
          Code: department,
          level: level,
          parent: parent,
          UpdatedBy: updater,
        },
        txn,
        "DateTimeUpdated",
      );
    }

    if (oldLevel !== null && oldLevel !== level) {
      const levelDifference = level - oldLevel;
      await updateChildrenLevels(department, levelDifference, updater, txn);
    }

    return result;
  });

  return updateInsert;
};

// const setHierarchyData = async (department, parent, level, updater) => {
//   const check = await HierarchyModel.checkDuplicate(department);
//   const updateInsert = await sqlHelper.transact(async (txn) => {
//     if (check && check.length > 0) {
//       return await HierarchyModel.setNewHierarchy(
//         {
//           parent: parent,
//           level: level,
//           UpdatedBy: updater,
//           Deleted: false,
//         },
//         { Code: department },
//         txn,
//         "DateTimeUpdated",
//       );
//     }

//     return await HierarchyModel.insertNewHierarchy(
//       {
//         Code: department,
//         level: level,
//         parent: parent,
//         UpdatedBy: updater,
//       },
//       txn,
//       "DateTimeUpdated",
//     );
//   });

//   return updateInsert;
// };

// const setNewHierarchy = async (req, res) => {
//   const updater = req.user.employee_id;
//   const {
//     selectedDepartment,
//     selectedLevel,
//     parentDivision,
//     parentGroup,
//     parentDepartment,
//     parentSection,
//   } = req.body;

//   let updateInsert;

//   switch (selectedLevel) {
//     case 1:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         null,
//         selectedLevel,
//         updater,
//       );
//       break;
//     case 2:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentDivision,
//         selectedLevel,
//         updater,
//       );

//       break;
//     case 3:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentGroup || parentDivision,
//         selectedLevel,
//         updater,
//       );

//       if (parentGroup) {
//         updateInsert = await setHierarchyData(
//           parentGroup,
//           parentDivision,
//           2,
//           updater,
//         );
//       }

//       break;
//     case 4:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentDepartment || parentGroup || parentDivision,
//         selectedLevel,
//         updater,
//       );

//       if (parentDepartment) {
//         updateInsert = await setHierarchyData(
//           parentDepartment || parentGroup || parentDivision,
//           parentGroup,
//           3,
//           updater,
//         );
//       }

//       if (parentGroup) {
//         updateInsert = await setHierarchyData(
//           parentGroup || parentDivision,
//           parentDivision,
//           2,
//           updater,
//         );
//       }

//       break;
//     case 5:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentSection || parentDepartment || parentGroup || parentDivision,
//         selectedLevel,
//         updater,
//       );

//       if (parentSection) {
//         updateInsert = await setHierarchyData(
//           parentSection,
//           parentDepartment || parentGroup || parentDivision,
//           4,
//           updater,
//         );
//       }

//       if (parentDepartment) {
//         updateInsert = await setHierarchyData(
//           parentDepartment,
//           parentGroup || parentDivision,
//           3,
//           updater,
//         );
//       }

//       if (parentGroup) {
//         updateInsert = await setHierarchyData(
//           parentGroup,
//           parentDivision,
//           2,
//           updater,
//         );
//       }

//       break;
//   }

//   if (!updateInsert)
//     return res
//       .status(500)
//       .json({ body: "Error in updating or inserting new set hierarchy tree" });
//   return res.status(200).json({
//     body: "Success on inserting or updating new set of hierarchy tree",
//   });
// };

// const setNewHierarchy = async (req, res) => {
//   const updater = req.user.employee_id;
//   const {
//     selectedDepartment,
//     selectedLevel,
//     parentCorporate,
//     parentDivision1,
//     parentDivision2,
//     parentGroup,
//     parentDepartment,
//     parentSection,
//   } = req.body;

//   let updateInsert;

//   switch (selectedLevel) {
//     case 1:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         null,
//         selectedLevel,
//         updater,
//       );
//       break;

//     case 2:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentCorporate,
//         selectedLevel,
//         updater,
//       );

//       break;

//     case 3:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentDivision1 || parentCorporate,
//         selectedLevel,
//         updater,
//       );

//       if (parentDivision1) {
//         updateInsert = await setHierarchyData(
//           parentGroup,
//           parentCorporate,
//           2,
//           updater,
//         );
//       }

//       break;

//     case 4:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentDivision2 || parentDivision1 || parentCorporate,
//         selectedLevel,
//         updater,
//       );

//       if (parentDivision2) {
//         updateInsert = await setHierarchyData(
//           parentDivision1 || parentCorporate,
//           parentDivision2,
//           3,
//           updater,
//         );
//       }

//       if (parentDivision1) {
//         updateInsert = await setHierarchyData(
//           parentCorporate,
//           parentDivision1,
//           2,
//           updater,
//         );
//       }

//       break;

//     case 5:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentGroup || parentDivision2 || parentDivision1 || parentCorporate,
//         selectedLevel,
//         updater,
//       );

//       if (parentGroup) {
//         updateInsert = await setHierarchyData(
//           parentGroup,
//           parentDivision2 || parentDivision1 || parentCorporate,
//           4,
//           updater,
//         );
//       }

//       if (parentDivision2) {
//         updateInsert = await setHierarchyData(
//           parentDivision2,
//           parentDivision1 || parentCorporate,
//           3,
//           updater,
//         );
//       }

//       if (parentDivision1) {
//         updateInsert = await setHierarchyData(
//           parentDivision1,
//           parentCorporate,
//           2,
//           updater,
//         );
//       }

//       break;

//     case 6:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentDepartment ||
//           parentGroup ||
//           parentDivision2 ||
//           parentDivision1 ||
//           parentCorporate,
//         selectedLevel,
//         updater,
//       );

//       if (parentDepartment) {
//         updateInsert = await setHierarchyData(
//           parentDepartment,
//           parentGroup || parentDivision2 || parentDivision1 || parentCorporate,
//           5,
//           updater,
//         );
//       }

//       if (parentGroup) {
//         updateInsert = await setHierarchyData(
//           parentGroup,
//           parentDivision2 || parentDivision1 || parentCorporate,
//           4,
//           updater,
//         );
//       }

//       if (parentDivision2) {
//         updateInsert = await setHierarchyData(
//           parentDivision2,
//           parentDivision1 || parentCorporate,
//           3,
//           updater,
//         );
//       }

//       if (parentDivision1) {
//         updateInsert = await setHierarchyData(
//           parentDivision1,
//           parentCorporate,
//           2,
//           updater,
//         );
//       }

//       break;

//     case 7:
//       updateInsert = await setHierarchyData(
//         selectedDepartment,
//         parentSection ||
//           parentDepartment ||
//           parentGroup ||
//           parentDivision2 ||
//           parentDivision1 ||
//           parentCorporate,
//         selectedLevel,
//         updater,
//       );

//       if (parentSection) {
//         updateInsert = await setHierarchyData(
//           parentSection,
//           parentDepartment ||
//             parentGroup ||
//             parentDivision2 ||
//             parentDivision1 ||
//             parentCorporate,
//           6,
//           updater,
//         );
//       }

//       if (parentDepartment) {
//         updateInsert = await setHierarchyData(
//           parentDepartment,
//           parentGroup || parentDivision2 || parentDivision1 || parentCorporate,
//           5,
//           updater,
//         );
//       }

//       if (parentGroup) {
//         updateInsert = await setHierarchyData(
//           parentGroup,
//           parentDivision2 || parentDivision1 || parentCorporate,
//           4,
//           updater,
//         );
//       }

//       if (parentDivision2) {
//         updateInsert = await setHierarchyData(
//           parentDivision2,
//           parentDivision1 || parentCorporate,
//           3,
//           updater,
//         );
//       }

//       if (parentDivision1) {
//         updateInsert = await setHierarchyData(
//           parentDivision1,
//           parentCorporate,
//           2,
//           updater,
//         );
//       }

//       break;
//   }

//   if (!updateInsert)
//     return res
//       .status(500)
//       .json({ body: "Error in updating or inserting new set hierarchy tree" });
//   return res.status(200).json({
//     body: "Success on inserting or updating new set of hierarchy tree",
//   });
// };

const setNewHierarchy = async (req, res) => {
  const updater = req.user.employee_id;
  const {
    selectedDepartment,
    selectedLevel,
    parentCorporate1,
    parentCorporate2,
    parentDivision1,
    parentDivision2,
    parentGroup,
    parentDepartment,
    parentSection,
  } = req.body;

  const levelParents = [
    null,
    parentCorporate1,
    parentCorporate2 || parentCorporate1,
    parentDivision1 || parentCorporate2 || parentCorporate1,
    parentDivision2 || parentDivision1 || parentCorporate2 || parentCorporate1,
    parentGroup ||
      parentDivision2 ||
      parentDivision1 ||
      parentCorporate2 ||
      parentCorporate1,
    parentDepartment ||
      parentGroup ||
      parentDivision2 ||
      parentDivision1 ||
      parentCorporate2 ||
      parentCorporate1,
    parentSection ||
      parentDepartment ||
      parentGroup ||
      parentDivision2 ||
      parentDivision1 ||
      parentCorporate2 ||
      parentCorporate1,
  ];

  const hierarchyChain = [
    { parent: parentSection, level: 7 },
    { parent: parentDepartment, level: 6 },
    { parent: parentGroup, level: 5 },
    { parent: parentDivision2, level: 4 },
    { parent: parentDivision1, level: 3 },
    { parent: parentCorporate2, level: 2 },
    { parent: parentCorporate1, level: 1 },
  ];

  const updateInsert = await setHierarchyData(
    selectedDepartment,
    levelParents[selectedLevel - 1],
    selectedLevel,
    updater,
  );

  for (const { parent, level } of hierarchyChain) {
    if (selectedLevel > level && parent) {
      const parentOfParent = levelParents[level - 1];
      await setHierarchyData(parent, parentOfParent, level, updater);
    }
  }

  if (!updateInsert) {
    return res.status(500).json({
      body: "Error in updating or inserting new set hierarchy tree",
    });
  }

  return res.status(200).json({
    body: "Success on inserting or updating new set of hierarchy tree",
  });
};

const addHierarchy = async (req, res) => {
  const loggedUser = req.user.employee_id;
  const { code, parent, level } = req.body;

  const result = await setHierarchyData(code, parent, level, loggedUser);

  if (!result)
    return res.status(500).json({ message: "Failed to add hierarchy" });

  res.status(200).json({
    message: "Hierarchy added successfully",
  });
};

const removeHierarchy = async (req, res) => {
  const { code } = req.body;
  const loggedUser = req.user.employee_id;

  const updateStatus = await sqlHelper.transact(async (txn) => {
    const deletedMain = await HierarchyModel.updateHierarchy(
      {
        Deleted: 1,
        UpdatedBy: loggedUser,
        Parent: null,
      },
      { Code: code },
      txn,
      "DateTimeUpdated",
    );

    const deletedChildren = await HierarchyModel.updateHierarchy(
      {
        Parent: null,
        UpdatedBy: loggedUser,
      },
      { Parent: code },
      txn,
      "DateTimeUpdated",
    );

    return {
      main: deletedMain,
      children: deletedChildren,
    };
  });

  if (!updateStatus) {
    return res
      .status(500)
      .json({ message: `Failed to remove hierarchy for code ${code}` });
  }

  res.status(200).json({
    message: `Hierarchy ${code} and its children updated successfully`,
  });
};

module.exports = {
  getHiearchy,
  getDepartments,
  checkDeptData,
  setNewHierarchy,
  addHierarchy,
  removeHierarchy,
};

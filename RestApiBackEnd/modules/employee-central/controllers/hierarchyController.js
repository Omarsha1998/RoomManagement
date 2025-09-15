const HierarchyModel = require("../models/hierarchyModel");
const sqlHelper = require("../../../helpers/sql");

// const buildTree = (data) => {
//   const tree = {};

//   for (const item of data) {
//     if (!item.division && !item.parent) {
//       if (!tree[item.code]) {
//         tree[item.code] = {
//           level: "Department",
//           code: item.code,
//           name: item.codeDescription,
//           children: {},
//         };
//       }
//       continue;
//     }

//     if (item.division) {
//       if (!tree[item.division]) {
//         tree[item.division] = {
//           level: "Division",
//           code: item.division,
//           name: item.divisionDescription,
//           children: {},
//         };
//       }
//     }

//     const divisionNode = tree[item.division];

//     if (item.group && divisionNode && !divisionNode.children[item.group]) {
//       divisionNode.children[item.group] = [
//         {
//           level: "Group",
//           code: item.group,
//           name: item.groupDescription,
//           children: {},
//         },
//       ];
//     }
//     const groupNode = item.group
//       ? divisionNode?.children[item.group][0]
//       : divisionNode;

//     if (item.department && groupNode && !groupNode.children[item.department]) {
//       groupNode.children[item.department] = [
//         {
//           level: "Department",
//           code: item.department,
//           name: item.departmentDescription,
//           children: {},
//         },
//       ];
//     }
//     const departmentNode = item.department
//       ? groupNode?.children[item.department][0]
//       : groupNode;

//     if (
//       item.section &&
//       departmentNode &&
//       !departmentNode.children[item.section]
//     ) {
//       departmentNode.children[item.section] = [
//         {
//           level: "Section",
//           code: item.section,
//           name: item.sectionDescription,
//           children: {},
//         },
//       ];
//     }
//     const sectionNode = item.section
//       ? departmentNode?.children[item.section][0]
//       : departmentNode;

//     if (item.area && sectionNode && !sectionNode.children[item.area]) {
//       sectionNode.children[item.area] = [
//         {
//           level: "Area",
//           code: item.area,
//           name: item.areaOfAssignment,
//         },
//       ];
//     }
//   }

//   return tree;
// };
// const buildTree = (data) => {
//   const tree = {};

//   for (const item of data) {
//     if (!item.corporateOfficer && !item.parent) {
//       if (!tree[item.code]) {
//         tree[item.code] = {
//           level: "Department",
//           code: item.code,
//           name: item.codeDescription,
//           children: {},
//         };
//       }
//       continue;
//     }

//     // Ensure Corporate2 Officer exists
//     if (item.corporateOfficer) {
//       if (!tree[item.corporateOfficer]) {
//         tree[item.corporateOfficer] = {
//           level: "CorporateOfficer",
//           code: item.corporateOfficer,
//           name: item.corporateOfficerDescription,
//           children: {},
//         };
//       }
//     }

//     const corporateNode = tree[item.corporateOfficer];

//     // Ensure Division1 exists under Corporate Officer
//     if (item.division1) {
//       if (!corporateNode.children[item.division1]) {
//         corporateNode.children[item.division1] = {
//           level: "Division1",
//           code: item.division1,
//           name: item.division1Description,
//           children: {},
//         };
//       }
//     }

//     const division1Node =
//       corporateNode.children[item.division1] || corporateNode;

//     // Ensure Division2 exists under Division1
//     if (item.division2) {
//       if (!division1Node.children[item.division2]) {
//         division1Node.children[item.division2] = {
//           level: "Division2",
//           code: item.division2,
//           name: item.division2Description,
//           children: {},
//         };
//       }
//     }

//     const division2Node =
//       division1Node.children[item.division2] || division1Node;

//     // Ensure Group exists under Division2
//     if (item.group) {
//       if (!division2Node.children[item.group]) {
//         division2Node.children[item.group] = {
//           level: "Group",
//           code: item.group,
//           name: item.groupDescription,
//           children: {},
//         };
//       }
//     }

//     const groupNode = division2Node.children[item.group] || division2Node;

//     // Ensure Department exists under Group
//     if (item.department) {
//       if (!groupNode.children[item.department]) {
//         groupNode.children[item.department] = {
//           level: "Department",
//           code: item.department,
//           name: item.departmentDescription,
//           children: {},
//         };
//       }
//     }

//     const departmentNode = groupNode.children[item.department] || groupNode;

//     // Ensure Section exists under Department
//     if (item.section) {
//       if (!departmentNode.children[item.section]) {
//         departmentNode.children[item.section] = {
//           level: "Section",
//           code: item.section,
//           name: item.sectionDescription,
//           children: {},
//         };
//       }
//     }

//     const sectionNode = departmentNode.children[item.section] || departmentNode;

//     // Ensure Area exists under Section
//     if (item.area) {
//       if (!sectionNode.children[item.area]) {
//         sectionNode.children[item.area] = {
//           level: "Area",
//           code: item.area,
//           name: item.areaOfAssignment,
//           children: {},
//         };
//       }
//     }
//   }

//   return tree;
// };

const buildTree = (data) => {
  const tree = {};

  for (const item of data) {
    // Establish top-most node
    if (!item.corporateOfficer1 && !item.corporateOfficer2 && !item.parent) {
      if (!tree[item.code]) {
        tree[item.code] = {
          level: "Department",
          code: item.code,
          name: item.codeDescription,
          children: {},
        };
      }
      continue;
    }

    // Ensure CorporateOfficer1 exists
    if (item.corporateOfficer1) {
      if (!tree[item.corporateOfficer1]) {
        tree[item.corporateOfficer1] = {
          level: "CorporateOfficer1",
          code: item.corporateOfficer1,
          name: item.corporateOfficer1Description,
          children: {},
        };
      }
    }

    // Ensure CorporateOfficer2 exists under CorporateOfficer1
    let currentRoot = tree[item.corporateOfficer1];

    if (item.corporateOfficer2) {
      if (!currentRoot.children[item.corporateOfficer2]) {
        currentRoot.children[item.corporateOfficer2] = {
          level: "CorporateOfficer2",
          code: item.corporateOfficer2,
          name: item.corporateOfficer2Description,
          children: {},
        };
      }
      currentRoot = currentRoot.children[item.corporateOfficer2];
    }

    // Division1 under CorporateOfficer2
    if (item.division1) {
      if (!currentRoot.children[item.division1]) {
        currentRoot.children[item.division1] = {
          level: "Division1",
          code: item.division1,
          name: item.division1Description,
          children: {},
        };
      }
    }

    const division1Node = currentRoot.children[item.division1] || currentRoot;

    // Division2 under Division1
    if (item.division2) {
      if (!division1Node.children[item.division2]) {
        division1Node.children[item.division2] = {
          level: "Division2",
          code: item.division2,
          name: item.division2Description,
          children: {},
        };
      }
    }

    const division2Node =
      division1Node.children[item.division2] || division1Node;

    // Group under Division2
    if (item.group) {
      if (!division2Node.children[item.group]) {
        division2Node.children[item.group] = {
          level: "Group",
          code: item.group,
          name: item.groupDescription,
          children: {},
        };
      }
    }

    const groupNode = division2Node.children[item.group] || division2Node;

    // Department under Group
    if (item.department) {
      if (!groupNode.children[item.department]) {
        groupNode.children[item.department] = {
          level: "Department",
          code: item.department,
          name: item.departmentDescription,
          children: {},
        };
      }
    }

    const departmentNode = groupNode.children[item.department] || groupNode;

    // Section under Department
    if (item.section) {
      if (!departmentNode.children[item.section]) {
        departmentNode.children[item.section] = {
          level: "Section",
          code: item.section,
          name: item.sectionDescription,
          children: {},
        };
      }
    }

    const sectionNode = departmentNode.children[item.section] || departmentNode;

    // Area under Section
    if (item.area) {
      if (!sectionNode.children[item.area]) {
        sectionNode.children[item.area] = {
          level: "Area",
          code: item.area,
          name: item.areaDescription,
          children: {},
        };
      }
    }
  }

  return tree;
};

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

  const map = {};
  const tree = {};

  for (const item of data) {
    const node = {
      code: item.code,
      name: item.description || item.code,
      level: levels[item.level] || `Level${item.level}`,
      children: {},
    };

    map[item.code] = node;

    if (item.parent) {
      if (!map[item.parent]) {
        map[item.parent] = { children: {} };
      }
      map[item.parent].children[item.code] = node;
    } else {
      tree[item.code] = node;
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

const setHierarchyData = async (department, parent, level, updater) => {
  const check = await HierarchyModel.checkDuplicate(department);
  const updateInsert = await sqlHelper.transact(async (txn) => {
    if (check && check.length > 0) {
      return await HierarchyModel.setNewHierarchy(
        {
          parent: parent,
          level: level,
          UpdatedBy: updater,
        },
        { Code: department },
        txn,
        "DateTimeUpdated",
      );
    }

    return await HierarchyModel.insertNewHierarchy(
      {
        Code: department,
        level: level,
        parent: parent,
        UpdatedBy: updater,
      },
      txn,
      "DateTimeUpdated",
    );
  });

  return updateInsert;
};

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

module.exports = {
  getHiearchy,
  getDepartments,
  checkDeptData,
  setNewHierarchy,
};

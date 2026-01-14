const router = require("express").Router();

const {
  validateAccessToken,
  checkWhiteList,
} = require("../../../../helpers/controller.js");

const miscController = require("../../controllers/ape/misc.js");

router.get(
  "/departments",
  validateAccessToken,
  checkWhiteList,
  miscController.getDepartments,
);

router.get(
  "/exams",
  validateAccessToken,
  checkWhiteList,
  miscController.getExams,
);

router.get(
  "/campuses",
  validateAccessToken,
  checkWhiteList,
  miscController.getCampuses,
);

router.post(
  "/time-in-out/:employeeCode",
  validateAccessToken,
  checkWhiteList,
  miscController.timeInOut,
);

router.post(
  "/attendance",
  validateAccessToken,
  checkWhiteList,
  miscController.attendance,
);

router.get(
  "/xray-chest-result-templates",
  validateAccessToken,
  checkWhiteList,
  miscController.getXrayChestResultTemplates,
);

router.get(
  "/app-config",
  validateAccessToken,
  checkWhiteList,
  miscController.getAppConfig,
);

module.exports = router;

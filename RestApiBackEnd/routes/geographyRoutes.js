const { Router } = require("express");
const geographyController = require("../controllers/geographyController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS
router.get("/", geographyController.index);
router.get("/countries", geographyController.getCountries);
router.get("/regions", geographyController.getRegions);
router.get("/provinces", geographyController.getProvinces);
router.get("/city-municipalities", geographyController.getCityMunicipalities);
router.get("/barangays", geographyController.getBarangays);
router.get("/institutions", geographyController.registerInstitutions);

// POST REQUESTS
// router.post("/regions", geographyController.registerRegion);
// router.post("/countries", geographyController.registerCountries);
// router.post("/update-countries", geographyController.updateCountries);

// PUT REQUESTS
// router.put("/update", userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

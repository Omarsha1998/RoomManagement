const { Router } = require("express");
const pdfController = require("../controllers/pdfController");
const { validateAccessToken } = require("../helpers/crypto");

const router = Router();

// GET REQUESTS

router.get("/patient-result/:resultId", pdfController.getPatientResult);
router.get("/qr", pdfController.generateQR);

// POST REQUESTS
router.post("/preview", pdfController.previewPDF);
router.post("/encrypt", pdfController.encrypt);

// PUT REQUESTS
// router.put("/update", userController.updateUser);

// router.put("/reset-pw", validatePwResetToken, userController.resetPassword);

// IMPORTANT: ROUTE WITH ARBITRARY params SHOULD BE PLACED LAST TO AVOID CONFLICTS WITH OTHER ADJACENT ROUTES
// router.put("/:code", validateAccessToken, userController.updateUser);

// DELETE REQUESTS //

module.exports = router;

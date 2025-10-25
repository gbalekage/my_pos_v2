const express = require('express');
const { createCompany, getCompany, updateCompany, uploadCompanyLogo } = require('../controllers/company.controller');
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/", createCompany)
router.get("/", getCompany);;
router.put("/:id", updateCompany);
router.post(
  "/upload-logo/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  uploadCompanyLogo
);

module.exports = router;
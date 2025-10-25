const express = require("express");
const { createAdminUser, getAdmin } = require("../controllers/admin.controller");

const router = express.Router();

router.post("/create", createAdminUser);
router.get("/", getAdmin)

module.exports = router;

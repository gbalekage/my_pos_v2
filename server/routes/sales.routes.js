const express = require("express");
const { getSales, getSalesForAdmin } = require("../controllers/sales.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/", getSales);
router.get("/chart/sales", authMiddleware, roleMiddleware("ADMIN"), getSalesForAdmin)

module.exports = router

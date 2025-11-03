const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getOrderSummary,
  getTodaySalesSummary,
  getTodayExpensesSummary,
  getTodaySignedBillsSummary,
} = require("../controllers/report.controller");

const router = express.Router();

router.get("/orders/today/pending-total", authMiddleware, getOrderSummary);
router.get("/sales/today/total", authMiddleware, getTodaySalesSummary);
router.get("/signedBills/today/total", getTodaySignedBillsSummary);
router.get("/expenses/today/total", authMiddleware, getTodayExpensesSummary);

module.exports = router;

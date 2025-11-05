const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  getOrderSummary,
  getTodaySalesSummary,
  getTodayExpensesSummary,
  getTodaySignedBillsSummary,
  closeDay,
} = require("../controllers/report.controller");

const router = express.Router();

router.get("/orders/today/pending-total", authMiddleware, getOrderSummary);
router.get("/sales/today/total", getTodaySalesSummary);
router.get("/signedBills/today/total", getTodaySignedBillsSummary);
router.get("/expenses/today/total", authMiddleware, getTodayExpensesSummary);
router.post(
  "/close/:date",
  authMiddleware,
  roleMiddleware("CASHIER"),
  closeDay
);

module.exports = router;

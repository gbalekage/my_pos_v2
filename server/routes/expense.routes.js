const express = require("express");
const {
  addExpenses,
  deleteExpenses,
} = require("../controllers/expenses.controller");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/add-expense/:storeId", authMiddleware, addExpenses);
router.delete("/delete/:expenseId", deleteExpenses);

module.exports = router;

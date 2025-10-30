const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createOrder,
  getOrderByTable,
  printBill,
  addItemsToOrder,
  removeItems,
  discountOrder
} = require("../controllers/order.controller");
const router = express.Router();

router.post("/create", authMiddleware, createOrder);
router.get("/table/:id", authMiddleware, getOrderByTable);
router.get("/print-bill/:tableId", authMiddleware, printBill);
router.post("/new-items", authMiddleware, addItemsToOrder)
router.delete("/remove-item/:orderId", removeItems)
router.post("/:orderId/discount/", authMiddleware, discountOrder)

module.exports = router;

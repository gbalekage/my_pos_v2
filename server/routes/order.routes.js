const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createOrder,
  getOrderByTable,
  printBill,
  addItemsToOrder,
  removeItems,
  discountOrder,
  splitBill,
  breakItemInOrder,
  getActiveOrders,
  signBill,
} = require("../controllers/order.controller");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.get("/active", getActiveOrders);
router.post("/create", authMiddleware, createOrder);
router.get("/table/:id", authMiddleware, getOrderByTable);
router.get("/print-bill/:tableId", authMiddleware, printBill);
router.post("/new-items", authMiddleware, addItemsToOrder);
router.delete("/remove-item/:orderId", removeItems);
router.post("/:orderId/discount/", authMiddleware, discountOrder);
router.post("/:orderId/split-bill/", authMiddleware, splitBill);
router.post("/:orderId/break-items", authMiddleware, breakItemInOrder);
router.post(
  "/sign/:orderId/:clientId",
  authMiddleware,
  roleMiddleware("CASHIER"),
  signBill
);

module.exports = router;

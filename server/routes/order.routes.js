const express = require("express")
const authMiddleware = require("../middlewares/authMiddleware")
const { createOrder } = require("../controllers/order.controller")
const router = express.Router()

router.post("/create/:storeId", authMiddleware, createOrder)

module.exports = router
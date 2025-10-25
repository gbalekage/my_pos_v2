const express = require("express");
const {
  addPrinter,
  getPrinters,
  getPrinter,
  updatePrinter,
  deletePrinter,
  testPrinter
} = require("../controllers/printer.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post(
  "/add-printer",
  authMiddleware,
  roleMiddleware("ADMIN"),
  addPrinter
);

router.get("/", getPrinters);

router.get("/:id", authMiddleware, roleMiddleware("ADMIN"), getPrinter);

router.put(
  "/update/:printerId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updatePrinter
);

router.delete(
  "/delete/:printerId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deletePrinter
);

router.post(
  "/test/:printerId",
  authMiddleware,
  roleMiddleware("ADMIN"),
  testPrinter
);

module.exports = router;

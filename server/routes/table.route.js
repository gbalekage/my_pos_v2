const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createTables,
  getTables,
  getTableById,
} = require("../controllers/table.controller");

const router = express.Router();

router.post(
  "/create-tables",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createTables
);
router.get("/", getTables);
router.get("/:id", getTableById);

module.exports = router

const express = require("express");
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/items.controller");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.get("/", getAllItems);
router.get("/:id", getItemById);
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  createItem
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  updateItem
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  deleteItem
);

module.exports = router;

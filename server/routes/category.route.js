const express = require("express");
const roleMiddleware = require("../middlewares/roleMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  addCategory,
  getCategories,
  getCategryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const router = express.Router();

router.post(
  "/add-category",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  addCategory
);

router.get("/", getCategories);
router.get("/:id", getCategryById);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  updateCategory
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  deleteCategory
);

module.exports = router;

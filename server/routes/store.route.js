const express = require("express");
const roleMiddleware = require("../middlewares/roleMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createStore,
  getStoreById,
  getStores,
  updateStore,
  deleteStore,
} = require("../controllers/store.controller");

const router = express.Router();

router.post(
  "/add-store",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  createStore
);

router.get("/", getStores);
router.get("/:id", getStoreById);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  updateStore
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  deleteStore
);

module.exports = router
const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  addClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} = require("../controllers/client.controller");

const router = express.Router();

router.get("/", getClients);
router.get("/client/:id", getClientById);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  updateClient
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteClient
);
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  addClient
);

module.exports = router;

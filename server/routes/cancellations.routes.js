const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getCancellations } = require("../controllers/cancellations.controller");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  getCancellations
);

module.exports = router;
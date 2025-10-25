const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createUser,
  loginUser,
  updateUser,
  logoutUser,
  getUser,
  getUsers,
  deactivateUser,
  suspendUser,
  deleteUser,
  updateUserPassword,
} = require("../controllers/user.controller");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  createUser
);
router.post("/login-user", loginUser);
router.put("/update-user/:id", authMiddleware, updateUser);
router.post("/logout-user", logoutUser);
router.get("/userId", getUser);
router.get("/", getUsers);
router.post(
  "/users/deactivate/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  deactivateUser
);
router.post(
  "/users/suspend/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  suspendUser
);
router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  deleteUser
);

router.put(
  "/password/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  updateUserPassword
);

module.exports = router;

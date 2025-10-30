const { PrismaClient } = require("../generated/prisma");
const HttpError = require("../models/error.model");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, password2, role } = req.body;
    if (!name || !username || !email || !password || !role) {
      return next(new HttpError("Fill in all fields", 400));
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingUser) {
      return next(new HttpError("User with the same email already exits", 400));
    }

    if (password !== password2) {
      return next(new HttpError("Passwords do not macth", 400));
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPass = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPass,
        role,
      },
    });
    const { password: _, ...userData } = newUser;
    res.status(201).json({ user: userData });
  } catch (error) {
    console.error("Error creating admin user", error);
    return next(
      new HttpError("Erreur creating admin user, please try again", 500)
    );
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return next(new HttpError("Please fill in all fields", 400));
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return next(new HttpError("Invalid credentials", 403));
    }

    // Only allow active and not suspended users
    if (!user.isActive || user.suspended) {
      return next(
        new HttpError(
          !user.isActive
            ? "This account is not active, contact your manager"
            : "This account is suspended, contact your manager",
          403
        )
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return next(new HttpError("Invalid credentials", 403));
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user;

    return res.status(200).json({
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return next(new HttpError("Login failed, please try again", 500));
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    return res.status(200).json({ success: true, message: "Admin verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie("auth_token");
  res.status(200).json({ message: "Logged out successfully" });
};

const getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    const { password: _, ...userData } = user;
    res.status(200).json({
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return next(new HttpError("Login failed, please try again", 500));
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        suspended: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!users || users.length === 0) {
      return next(new HttpError("No users found", 404));
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return next(new HttpError("Failed to fetch users", 500));
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, username, role, isActive, suspended } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return next(new HttpError("User not found", 404));
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (username !== undefined) data.username = username;
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = isActive;
    if (suspended !== undefined) data.suspended = suspended;

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        suspended: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return next(new HttpError("Failed to update user", 500));
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return next(new HttpError("User not found", 404));
    }

    if (existingUser.isActive === false) {
      return next(new HttpError("User is already deactivated", 400));
    }

    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      message: "User deactivated successfully",
      user: deactivatedUser,
    });
  } catch (error) {
    console.error("❌ Error deactivating user:", error);
    return next(new HttpError("Failed to deactivate user", 500));
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return next(new HttpError("User not found", 404));
    }

    if (existingUser.suspended === true) {
      return next(new HttpError("User is already suspended", 400));
    }

    const suspendedUser = await prisma.user.update({
      where: { id },
      data: { suspended: true },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        suspended: true,
      },
    });

    res.status(200).json({
      message: "User suspended successfully",
      user: suspendedUser,
    });
  } catch (error) {
    console.error("❌ Error suspending user:", error);
    return next(new HttpError("Failed to suspend user", 500));
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return next(new HttpError("User not found", 404));
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({
      message: "User deleted successfully",
      userId: id,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return next(new HttpError("Failed to delete user", 500));
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 4) {
      return next(new HttpError("Password must be at least 6 characters", 400));
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new HttpError("User not found", 404));

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("❌ Error updating password:", error);
    return next(new HttpError("Failed to update password", 500));
  }
};

module.exports = {
  createUser,
  loginUser,
  logoutUser,
  getUser,
  getUsers,
  updateUser,
  deactivateUser,
  suspendUser,
  deleteUser,
  updateUserPassword,
  verifyAdmin
};

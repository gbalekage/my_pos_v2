const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");
const bcrypt = require("bcryptjs");

const createAdminUser = async (req, res, next) => {
  try {
    const { name, username, email, password, password2 } = req.body;

    if (!name || !username || !email || !password) {
      return next(new HttpError("Fill in all fields", 400));
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return next(new HttpError("Admin with this email already exists", 409));
    }

    if (password !== password2) {
      return next(new HttpError("Passwords do not match", 400));
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPass = await bcrypt.hash(password, salt);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        username,
        password: hashedPass,
        role: "ADMIN",
      },
    });

    res.status(201).json({ admin: newAdmin });
  } catch (error) {
    console.error("Error creating admin user", error);
    return next(
      new HttpError("Erreur creating admin user, please try again", 500)
    );
  }
};

const getAdmin = async (req, res, next) => {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return res.status(200).json({
        admin: null,
        message: "No admin user found. Please create an admin.",
      });
    }
    return res.status(200).json({ admin });
  } catch (error) {
    console.error("❌ Error fetching admin:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createAdminUser, getAdmin };

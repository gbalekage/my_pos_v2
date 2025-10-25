const jwt = require("jsonwebtoken");
const HttpError = require("../models/error.model");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return next(new HttpError("Not authenticated", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return next(new HttpError("Session expired, please log in again", 401));
      }
      if (error.name === "JsonWebTokenError") {
        return next(new HttpError("Invalid authentication token", 401));
      }
      return next(new HttpError("Authentication failed", 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive || user.suspended) {
      return next(new HttpError("User not authorized", 403));
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Auth middleware error:", error);
    return next(new HttpError("Authentication failed, please try again", 401));
  }
};


module.exports = authMiddleware;

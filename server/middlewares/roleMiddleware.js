const HttpError = require("../models/error.model");

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(new HttpError("User not found", 401));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new HttpError("Access denied: insufficient permissions", 403));
    }

    next();
  };
};

module.exports = roleMiddleware;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const checkSubscription = async (req, res, next) => {
  try {
    const restaurantId =
      req.body.restaurantId || req.query.restaurantId || req.user?.restaurantId;

    if (!restaurantId) {
      return next(new HttpError("Restaurant ID is required", 400));
    }

    const subscription = await prisma.subscription.findFirst({
      where: { restaurantId, isActive: true },
    });

    if (!subscription) {
      return next(
        new HttpError("No active subscription found for this restaurant", 403)
      );
    }

    const now = new Date();

    if (subscription.endDate && now > subscription.endDate) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "EXPIRED",
          isActive: false,
        },
      });

      return res.status(403).json({
        message:
          "Your subscription has expired. Please renew your plan to continue.",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    return next(new HttpError("Internal server error", 500));
  }
};

module.exports = checkSubscription;

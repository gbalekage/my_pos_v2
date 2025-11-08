const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const chooseSubscription = async (req, res, next) => {
  try {
    const { restaurantId, planType, duration } = req.body;

    if (!restaurantId || !planType || !duration) {
      return next(new HttpError("Restaurant, plan type and duration are required", 400));
    }

    if (!["MONTHLY", "YEARLY"].includes(planType)) {
      return next(new HttpError("Invalid plan type", 400));
    }

    if (duration <= 0) {
      return next(new HttpError("Duration must be greater than 0", 400));
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return next(new HttpError("Restaurant not found", 404));
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: { restaurantId, isActive: true, status: "ACTIVE" },
    });

    if (activeSubscription) {
      return next(
        new HttpError(
          "This restaurant already has an active subscription. Please deactivate it first.",
          409
        )
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    if (planType === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + duration);
    } else if (planType === "YEARLY") {
      endDate.setFullYear(endDate.getFullYear() + duration);
    }

    const newSubscription = await prisma.subscription.create({
      data: {
        restaurantId,
        planType,
        duration,
        startDate,
        endDate,
        isActive: false,
        status: "INACTIVE",
      },
    });

    res.status(201).json({
      message: `Subscription created for ${duration} ${planType.toLowerCase()} period(s).`,
      subscription: newSubscription,
    });
  } catch (error) {
    console.log("Error in chooseSubscription:", error);
    return next(
      new HttpError("Creating subscription failed, please try again", 500)
    );
  }
};

const activateSubscription = async (req, res, next) => {
    try {
        const { subscriptionId, activationCode } = req.body;
        const adminCode = process.env.ADMIN_ACTIVATION_CODE

        if (!subscriptionId || !activationCode) {
            return next(new HttpError("All fields are required", 400));
        }

        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        if (!subscription) {
            return next(new HttpError("Subscription not found", 404));
        }

        if (activationCode !== adminCode) {
            return next(new HttpError("Invalid activation code", 400));
        }

        if (subscription.isActive) {
            return next(new HttpError("Subscription is already active", 409));
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                isActive: true,
                status: "ACTIVE",
            },
        });

        res.json({
            message: "Subscription activated successfully",
            subscription: updatedSubscription,
        });

    } catch (error) {
        console.log("Error in activateSubscription:", error);
        return next(new HttpError("Activating subscription failed, please try again", 500));
    }
}

const renewSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return next(new HttpError("All fields are required", 400));
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return next(new HttpError("Subscription not found", 404));
    }

    if (subscription.isActive && subscription.status === "ACTIVE") {
      return next(new HttpError("Subscription is already active", 409));
    }

    const newStartDate = new Date();
    const newEndDate = new Date(newStartDate);

    const duration = subscription.duration || 1;

    if (subscription.planType === "MONTHLY") {
      newEndDate.setMonth(newEndDate.getMonth() + duration);
    } else if (subscription.planType === "YEARLY") {
      newEndDate.setFullYear(newEndDate.getFullYear() + duration);
    }

    const renewedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
        isActive: true,
        status: "INACTIVE",
      },
    });

    res.status(200).json({
      message: `Subscription renewed successfully for ${duration} ${subscription.planType.toLowerCase()} period(s). now activate.`,
      subscription: renewedSubscription,
    });
  } catch (error) {
    console.log("Error in renewSubscription:", error);
    return next(
      new HttpError("Renewing subscription failed, please try again", 500)
    );
  }
};

const changeSubscriptionPlan = async (req, res, next) => {
  try {
    const { subscriptionId, newPlanType, duration } = req.body;

    if (!subscriptionId || !newPlanType || !duration) {
      return next(new HttpError("All fields are required", 400));
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return next(new HttpError("Subscription not found", 404));
    }

    if (!["MONTHLY", "YEARLY"].includes(newPlanType)) {
      return next(new HttpError("Invalid plan type", 400));
    }

    if (duration <= 0) {
      return next(new HttpError("Duration must be greater than 0", 400));
    }

    const newStartDate = new Date();
    const newEndDate = new Date(newStartDate);

    if (newPlanType === "MONTHLY") {
      newEndDate.setMonth(newEndDate.getMonth() + duration);
    } else if (newPlanType === "YEARLY") {
      newEndDate.setFullYear(newEndDate.getFullYear() + duration);
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planType: newPlanType,
        duration,
        startDate: newStartDate,
        endDate: newEndDate,
        isActive: false,
        status: "INACTIVE",
      },
    });

    res.status(200).json({
      message: `Subscription plan changed to ${newPlanType} for ${duration} ${newPlanType.toLowerCase()} period(s). It must now be activated.`,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.log("Error in changeSubscriptionPlan:", error);
    return next(
      new HttpError("Changing subscription plan failed, please try again", 500)
    );
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return next(new HttpError("Restaurant ID is required", 400));
    }

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        restaurantId,
      },
    });

    if (!activeSubscription) {
      return res.status(404).json({
        message: "No active subscription found for this restaurant",
      });
    }

    res.status(200).json({
      message: "Active subscription retrieved successfully",
      subscription: activeSubscription,
    });
  } catch (error) {
    console.log("Error in getActiveSubscription:", error);
    return next(
      new HttpError("Fetching active subscription failed, please try again", 500)
    );
  }
};

module.exports = { chooseSubscription, activateSubscription, renewSubscription, changeSubscriptionPlan, getSubscription };

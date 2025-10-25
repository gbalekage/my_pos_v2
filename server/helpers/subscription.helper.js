const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const checkSubscriptionDurations = async () => {
  try {
    const now = new Date();

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: { lte: now },
      },
    });

    for (const sub of expiredSubscriptions) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          isActive: false,
          status: "EXPIRED",
        },
      });
    }

    if (expiredSubscriptions.length === 0) return;

    console.log(
      `Updated ${expiredSubscriptions.length} subscription(s) to EXPIRED`
    );

    
  } catch (error) {
    console.error("Error checking subscription durations:", error);
  }
};

module.exports = { checkSubscriptionDurations };

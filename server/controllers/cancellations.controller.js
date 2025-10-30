const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const getCancellations = async (req, res, next) => {
  try {
    const cancellations = await prisma.cancellations.findMany({
      orderBy: { cancelledAt: "desc" },
      include: { user: true },
    });
    console.log("Cancellations fetched:", cancellations);
    res.status(200).json({ cancellations });
  } catch (error) {
    console.log("Error in get cancellation", error);
    next(new HttpError("Erreur lors de la récupération des annulations.", 500));
  }
};

module.exports = {
  getCancellations,
};

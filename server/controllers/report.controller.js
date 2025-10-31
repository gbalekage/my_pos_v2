const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const getTodayRange = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

const getOrderSummary = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getTodayRange();

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        attendant: true,
        Table: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAmount = pendingOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    console.log("Pending Orders:", pendingOrders);

    res.status(200).json({
      success: true,
      totalAmount,
      count: pendingOrders.length,
      pendingOrders,
    });
  } catch (error) {
    console.error("Error getting total amount for pending orders:", error);
    next(new HttpError("Failed to retrieve today's pending orders total."));
  }
};

const getTodaySalesSummary = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getTodayRange();

    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        attendant: true,
        table: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAmount = todaySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    res.status(200).json({
      success: true,
      totalAmount,
      count: todaySales.length,
      todaySales,
    });
  } catch (error) {
    console.error("Error getting total amount for today sales:", error);
    next(new HttpError("Failed to retrieve today's sales total."));
  }
};

const getTodaySignedBillsSummary = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getTodayRange();

    const signedBills = await prisma.signedBills.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        attendant: true,
        client: true,
        order: {
          include: {
            Table: true,
            attendant: true,
            Discounts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ⚠️ If signedBills don’t have a totalAmount field, use order.totalAmount
    const totalAmount = signedBills.reduce(
      (sum, bill) => sum + (bill.order?.totalAmount || 0),
      0
    );

    res.status(200).json({
      success: true,
      totalAmount,
      count: signedBills.length,
      signedBills,
    });
  } catch (error) {
    console.error("Error getting total amount for today signed bills:", error);
    next(new HttpError("Failed to retrieve today's signed bills total."));
  }
};

const getTodayExpensesSummary = async (req, res, next) => {
  try {
    const { startOfDay, endOfDay } = getTodayRange();

    const expenses = await prisma.expences.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: true,
        store: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAmount = expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    res.status(200).json({
      success: true,
      totalAmount,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    console.error("Error getting total amount for today expenses:", error);
    next(new HttpError("Failed to retrieve today's expenses total."));
  }
};

module.exports = {
  getOrderSummary,
  getTodaySalesSummary,
  getTodaySignedBillsSummary,
  getTodayExpensesSummary,
};

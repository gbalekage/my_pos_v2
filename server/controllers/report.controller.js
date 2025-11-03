const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");
const { printReport } = require("../services/printer");

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
        sale: {
          include: {
            table: true,
            attendant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalAmount = signedBills.reduce(
      (sum, bill) => sum + (bill.sale?.totalAmount || 0),
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

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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

const closeDay = async (req, res, next) => {
  try {
    const { declaredAmounts, notes } = req.body;
    const userId = req.user.id;
    const { date } = req.params;

    console.log("Date from params:", req.params)

    if (!date) return next(new HttpError("La date est requise.", 400));

    // Check if closeDay already exists
    const existingClose = await prisma.closeDay.findUnique({
      where: { date: new Date(date) }
    });
    if (existingClose) {
      return next(new HttpError("La journée a déjà été clôturée pour cette date.", 400));
    }

    // Get cashier info
    const cashier = await prisma.user.findUnique({ where: { id: userId } });
    const cashierName = cashier?.name || "Unknown";

    // Check active tables
    const activeTables = await prisma.table.findFirst({
      where: { status: "OCCUPIED" }
    });
    if (activeTables) {
      return next(new HttpError("Il y a encore des tables occupées. Impossible de clôturer la journée.", 400));
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // --- Sales by payment methods ---
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: "PAID"
      },
      include: { attendant: true }
    });

    const paymentMethods = ["CASH", "CARD", "AIRTEL_MONEY", "ORANGE_MONEY", "AFRI_MONEY", "MPESA"];
    const salesByPayment = paymentMethods.map(method => {
      const total = sales
        .filter(s => s.paymentMethod === method)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      return { method, total };
    });

    // --- Sales by attendant ---
    const salesByAttendantMap = {};
    for (const s of sales) {
      const name = s.attendant.name;
      salesByAttendantMap[name] = (salesByAttendantMap[name] || 0) + s.totalAmount;
    }

    // Discounts by attendant
    const discounts = await prisma.discount.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { discountedBy: true }
    });
    discounts.forEach(d => {
      const name = d.discountedBy.name;
      salesByAttendantMap[name] = (salesByAttendantMap[name] || 0) + d.discountAmount;
    });

    const salesByAttendant = Object.entries(salesByAttendantMap).map(([attendant, total]) => ({ attendant, total }));

    // Payment summary with declared amounts
    const paymentSummary = salesByPayment.map(p => {
      const declared = declaredAmounts[p.method] || 0;
      return {
        ...p,
        declared,
        difference: declared - p.total
      };
    });

    const declaredTotal = paymentSummary.reduce((sum, p) => sum + p.declared, 0);
    const realTotal = paymentSummary.reduce((sum, p) => sum + p.total, 0);
    const totalDifference = declaredTotal - realTotal;

    let status = "BALLENCE", message = "Balance : tout est OK";
    if (totalDifference > 0) {
      status = "EXCEES";
      message = `Excès de ${totalDifference.toLocaleString()} FC`;
    } else if (totalDifference < 0) {
      status = "PERTE";
      message = `Perte de ${Math.abs(totalDifference).toLocaleString()} FC`;
    }

    // --- Discounts, Cancellations, Expenses ---
    const discountTotal = discounts.reduce((sum, d) => sum + d.discountAmount, 0);

    const cancellations = await prisma.cancellations.aggregate({
      _sum: { totalPrice: true },
      where: { cancelledAt: { gte: startOfDay, lte: endOfDay } }
    });

    const expenses = await prisma.expences.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startOfDay, lte: endOfDay } }
    });

    const signedBills = await prisma.signedBills.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { sale: true }
    });

    const signedBillsTotal = signedBills.reduce((sum, sb) => sum + sb.sale.totalAmount, 0);

    // --- Sales by store ---
    const salesItems = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: startOfDay, lte: endOfDay }, status: "PAID" } },
      include: { item: { include: { store: true } } }
    });

    const storeMap = {};
    salesItems.forEach(si => {
      const storeName = si.item.store.name;
      if (!storeMap[storeName]) storeMap[storeName] = { items: {}, storeTotal: 0 };
      if (!storeMap[storeName].items[si.item.name]) storeMap[storeName].items[si.item.name] = { quantity: 0, total: 0 };
      storeMap[storeName].items[si.item.name].quantity += si.quantity;
      storeMap[storeName].items[si.item.name].total += si.total;
      storeMap[storeName].storeTotal += si.total;
    });

    const salesByStore = Object.entries(storeMap).map(([storeName, data]) => ({
      _id: storeName,
      storeTotal: data.storeTotal,
      items: Object.entries(data.items).map(([name, vals]) => ({
        name, quantity: vals.quantity, total: vals.total
      }))
    }));

    // --- Save CloseDay ---
    const newCloseDay = await prisma.closeDay.create({
      data: {
        date: new Date(date),
        cashierName,
        paymentSummary,
        salesByStore,
        salesByAttendant,
        discounts: discountTotal,
        cancellations: cancellations._sum.totalPrice || 0,
        expenses: expenses._sum.amount || 0,
        signedBills: signedBillsTotal,
        status,
        totalDifference,
        totalSales: realTotal,
        totalCollections: realTotal,
        message,
        notes
      }
    });

    // --- Print report ---
    await printReport(newCloseDay);

    res.status(200).json({
      message: "Clôture de journée enregistrée avec succès.",
      report: newCloseDay
    });
  } catch (err) {
    console.error(err);
    return next(new HttpError("Une erreur est survenue lors de la fermeture de la journée.", 500));
  }
};


module.exports = {
  getOrderSummary,
  getTodaySalesSummary,
  getTodaySignedBillsSummary,
  getTodayExpensesSummary,
  closeDay
};

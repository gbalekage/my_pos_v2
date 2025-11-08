const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");
const { printReport, printCloseDayReport } = require("../services/printer");
const { startOfDay, endOfDay } = require("date-fns");

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
    console.log("Error getting total amount for pending orders:", error);
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
    console.log("Error getting total amount for today sales:", error);
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
    console.log("Error getting total amount for today signed bills:", error);
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
    console.log("Error getting total amount for today expenses:", error);
    next(new HttpError("Failed to retrieve today's expenses total."));
  }
};
//   try {
//     const { declaredAmounts, notes } = req.body;
//     const cashierId = req.user.id;
//     const { date } = req.params;

//     if (!cashierId || !date || !declaredAmounts) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing parameters" });
//     }

//     // 1️⃣ Get cashier info
//     const cashier = await prisma.user.findUnique({
//       where: { id: cashierId },
//       select: { id: true, name: true, username: true },
//     });
//     if (!cashier)
//       return res
//         .status(404)
//         .json({ success: false, message: "Cashier not found" });

//     // 2️⃣ Define payment methods
//     const paymentMethods = [
//       "CASH",
//       "CARD",
//       "MPESA",
//       "AIRTEL_MONEY",
//       "ORANGE_MONEY",
//       "AFRI_MONEY",
//       "UNPAID",
//     ];

//     // 3️⃣ Date range
//     const startOfDay = new Date(date);
//     startOfDay.setUTCHours(0, 0, 0, 0);
//     const endOfDay = new Date(date);
//     endOfDay.setUTCHours(23, 59, 59, 999);

//     // 4️⃣ Get all today's sales
//     const todaySales = await prisma.sale.findMany({
//       where: {
//         createdAt: { gte: startOfDay, lte: endOfDay },
//       },
//       include: {
//         items: { include: { item: true } },
//         table: true,
//       },
//     });

//     // Separate UNPAID (signed) sales from normal sales
//     const signedSales = todaySales.filter(
//       (sale) => sale.paymentMethod === "UNPAID"
//     );
//     const paidSales = todaySales.filter(
//       (sale) => sale.paymentMethod !== "UNPAID"
//     );

//     // 5️⃣ Aggregate actual totals by payment method
//     const actualTotals = {};
//     paymentMethods.forEach((method) => {
//       const source = method === "UNPAID" ? signedSales : paidSales;
//       actualTotals[method] = source
//         .filter((sale) => sale.paymentMethod === method)
//         .reduce((sum, sale) => sum + sale.totalAmount, 0);
//     });

//     // 6️⃣ Calculate differences (❌ exclude UNPAID)
//     const differences = {};
//     paymentMethods.forEach((method) => {
//       if (method === "UNPAID") {
//         differences[method] = 0; // not compared
//       } else {
//         differences[method] =
//           (declaredAmounts[method] || 0) - (actualTotals[method] || 0);
//       }
//     });

//     // 7️⃣ Total difference & status (❌ exclude UNPAID)
//     const totalDifference = Object.entries(differences)
//       .filter(([method]) => method !== "UNPAID")
//       .reduce((a, [, diff]) => a + diff, 0);

//     let status = "BALLENCE";
//     if (totalDifference < 0) status = "PERTE"; // short: collected < system
//     if (totalDifference > 0) status = "EXCEES"; // excess: collected > system

//     // 8️⃣ Totals and metrics (exclude UNPAID)
//     const totalSales = paidSales.reduce(
//       (sum, sale) => sum + sale.totalAmount,
//       0
//     );
//     const totalCollections = paidSales.reduce(
//       (sum, sale) => sum + sale.receivedAmount,
//       0
//     );

//     const discounts = 0;
//     const cancellations = 0;
//     const signedBillsTotal = signedSales.reduce(
//       (sum, sale) => sum + sale.totalAmount,
//       0
//     );

//     // 9️⃣ Group by store using SaleItem
//     const salesByStore = {};
//     for (const sale of paidSales) {
//       for (const saleItem of sale.items) {
//         const storeId = saleItem.item?.storeId || "unknown";
//         const itemName = saleItem.item?.name || "Unknown Item";

//         if (!salesByStore[storeId]) {
//           salesByStore[storeId] = { totalSales: 0, items: {} };
//         }

//         salesByStore[storeId].totalSales += sale.totalAmount;

//         if (!salesByStore[storeId].items[itemName]) {
//           salesByStore[storeId].items[itemName] = { quantity: 0, total: 0 };
//         }

//         salesByStore[storeId].items[itemName].quantity += saleItem.quantity;
//         salesByStore[storeId].items[itemName].total += saleItem.total;
//       }
//     }

//     // 🔟 Items summary (exclude UNPAID)
//     const itemsSold = await prisma.saleItem.groupBy({
//       by: ["itemId"],
//       where: {
//         sale: {
//           createdAt: { gte: startOfDay, lte: endOfDay },
//           paymentMethod: { not: "UNPAID" },
//         },
//       },
//       _sum: { quantity: true },
//     });

//     const items = await prisma.item.findMany({
//       where: { id: { in: itemsSold.map((i) => i.itemId) } },
//       select: { id: true, name: true },
//     });

//     const itemsSummary = itemsSold.map((i) => {
//       const name = items.find((it) => it.id === i.itemId)?.name || "—";
//       return { name, quantity: i._sum.quantity || 0 };
//     });

//     const salesByAttendant = {};
//     salesByAttendant[cashier.id] = totalSales;

//     // 1️⃣1️⃣ Save Close Day record
//     const newCloseDay = await prisma.closeDay.create({
//       data: {
//         date: startOfDay,
//         cashierName: cashier.name,
//         paymentSummary: {
//           actual: actualTotals,
//           declared: declaredAmounts,
//           differences,
//         },
//         discounts,
//         cancellations,
//         totalSales,
//         totalCollections,
//         expenses: 0,
//         signedBills: signedBillsTotal,
//         itemsSummary,
//         salesByStore,
//         salesByAttendant,
//         totalDifference,
//         status,
//         notes,
//       },
//     });

//     // 1️⃣2️⃣ Print report
//     await printReport(newCloseDay);

//     return res.json({ success: true, closeDay: newCloseDay });
//   } catch (error) {
//     console.log("❌ Close day error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

const closeDay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;
    const { declaredAmounts = {}, declaredExpenses, note } = req.body;

    const start = startOfDay(new Date(date));
    const end = endOfDay(new Date(date));

    // 1️⃣ Get logged-in user
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // 2️⃣ Check for active tables
    const activeTables = await prisma.table.findMany({
      where: { status: "OCCUPIED" },
    });
    if (activeTables.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot close the day — there are still active tables.",
      });
    }

    // 3️⃣ Check for duplicate close day
    const existingCloseDay = await prisma.closeDay.findFirst({
      where: { date: start },
    });
    if (existingCloseDay) {
      return res.status(400).json({
        success: false,
        message: "Close day for this date already exists.",
      });
    }

    // 4️⃣ Fetch PAID and SIGNED sales
    const [paidSales, signedBills] = await Promise.all([
      prisma.sale.findMany({
        where: { status: "PAID", createdAt: { gte: start, lte: end } },
        include: {
          attendant: true,
          table: true,
          items: {
            include: {
              item: {
                include: { store: true },
              },
            },
          },
        },
      }),
      prisma.sale.findMany({
        where: { status: "SIGNED", createdAt: { gte: start, lte: end } },
        include: {
          attendant: true,
          table: true,
          items: {
            include: {
              item: {
                include: { store: true },
              },
            },
          },
        },
      }),
    ]);

    // 5️⃣ Fetch expenses
    const expenses = await prisma.expences.findMany({
      where: { date: { gte: start, lte: end } },
      include: { store: true },
    });

    // 6️⃣ Compute totals
    const totalPaidSales = paidSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSignedBills = signedBills.reduce(
      (sum, s) => sum + s.totalAmount,
      0
    );
    const totalActualExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const totalDeclaredPayments = Object.values(declaredAmounts).reduce(
      (a, b) => a + Number(b || 0),
      0
    );
    const totalDeclaredExpenses = Object.values(declaredExpenses).reduce(
      (a, b) => a + Number(b || 0),
      0
    );

    // 7️⃣ Final totals logic
    const totalSales = totalPaidSales + totalSignedBills;
    const totalCollections =
      totalSales - totalActualExpenses - totalSignedBills;
    const totalDifference = totalDeclaredPayments - totalCollections;

    // 8️⃣ Determine status
    let status = "BALLENCE";
    let message = "All amounts match correctly.";
    if (totalDifference > 0) {
      status = "EXCEES";
      message = `Excess of ${totalDifference.toLocaleString()}`;
    } else if (totalDifference < 0) {
      status = "PERTE";
      message = `Shortage of ${Math.abs(totalDifference).toLocaleString()}`;
    }

    // 9️⃣ Sales by attendant
    const salesByAttendant = {};
    [...paidSales, ...signedBills].forEach((sale) => {
      const name = sale.attendant?.name || "Unknown";
      salesByAttendant[name] = (salesByAttendant[name] || 0) + sale.totalAmount;
    });

    const allSales = [...paidSales, ...signedBills];

    // Sales by store
    const salesByStore = {};
    allSales.forEach((sale) => {
      sale.items.forEach((saleItem) => {
        const storeName = saleItem.item?.store?.name;
        if (!storeName) return; // skip if no store

        // Sum totals per store
        salesByStore[storeName] =
          (salesByStore[storeName] || 0) + saleItem.total;
      });
    });

    // 1️⃣1️⃣ Items summary
    const itemsSummary = {};
    [...paidSales, ...signedBills].forEach((sale) => {
      sale.items.forEach((item) => {
        const name = item.item.name;
        const qty = item.quantity;
        const total = item.total;
        if (!itemsSummary[name]) itemsSummary[name] = { quantity: 0, total: 0 };
        itemsSummary[name].quantity += qty;
        itemsSummary[name].total += total;
      });
    });

    // 1️⃣2️⃣ Expenses by store (for report, not comparison)
    const expensesByStore = {};
    expenses.forEach((e) => {
      const storeName = e.store?.name || "Unknown Store";
      expensesByStore[storeName] = (expensesByStore[storeName] || 0) + e.amount;
    });

    // 1️⃣3️⃣ Save close day
    const closeDay = await prisma.closeDay.create({
      data: {
        date: start,
        cashierName: user.name,
        paymentSummary: {
          actual: { totalPaidSales, totalSignedBills, totalActualExpenses },
          declared: { declaredAmounts, declaredExpenses },
        },
        discounts: 0,
        cancellations: 0,
        totalSales,
        totalCollections,
        expenses: totalActualExpenses,
        signedBills: totalSignedBills,
        salesByStore,
        itemsSummary,
        salesByAttendant,
        totalDifference,
        status,
        notes: note || "",
      },
    });

    console.log("Repport:", closeDay);

    await printCloseDayReport(closeDay);

    return res.status(200).json({
      success: true,
      message: "Close day completed successfully.",
      closeDay: closeDay,
    });
  } catch (error) {
    console.log("Error in close day:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports = {
  getOrderSummary,
  getTodaySalesSummary,
  getTodaySignedBillsSummary,
  getTodayExpensesSummary,
  closeDay,
};

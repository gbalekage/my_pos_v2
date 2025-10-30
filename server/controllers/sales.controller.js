const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        attendant: true,
        table: {
          include: {
            order: {
              include: {
                items: {
                  include: {
                    item: true,
                  },
                },
              },
            },
          },
        },
        items: {
          include: {
            item: true,
            sale: {
              include: {
                table: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ sales });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error fetching sales.", error: error.message });
  }
};

const getSalesForAdmin = async (req, res) => {
  try {
    const { store, attendant, date } = req.query;

    const where = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    if (attendant) {
      where.attendant = { name: attendant };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        attendant: true,
        table: true,
        items: {
          include: {
            item: {
              include: {
                store: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filteredSales = sales;
    if (store) {
      filteredSales = sales.filter((s) =>
        s.items.some((i) => i.item.store?.name === store)
      );
    }

    const salesWithTotal = filteredSales.map((s) => {
      const totalAmount = s.items.reduce(
        (acc, i) => acc + i.price * i.quantity,
        0
      );
      return { ...s, totalAmount };
    });

    return res.status(200).json({ sales: salesWithTotal });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error fetching sales", error: error.message });
  }
};

module.exports = { getSales, getSalesForAdmin };

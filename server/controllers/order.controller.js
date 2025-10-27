const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const createOrder = async (req, res, next) => {
  try {
    const { items, tableId } = req.body;
    const { userId } = req.user.user;
    const { storeId } = req.params;

    if (!items || !items.length) {
      return next(new HttpError("No items provided", 400));
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return next(new HttpError("Store not found", 404));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new HttpError("User not found", 404));

    // Check table if provided
    let table = null;
    if (tableId) {
      table = await prisma.table.findUnique({ where: { id: tableId } });
      if (!table) return next(new HttpError("Table not found", 404));
      if (table.status === "OCCUPIED") {
        return next(new HttpError("Table is already occupied", 400));
      }
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbItem = await prisma.item.findUnique({ where: { id: item.itemId } });
      if (!dbItem) return next(new HttpError(`Item ${item.itemId} not found`));
      if (dbItem.stock < item.quantity) {
        return next(new HttpError(`Insufficient stock for item ${dbItem.name}`));
      }

      totalAmount += dbItem.price * item.quantity;

      orderItemsData.push({
        itemId: dbItem.id,
        quantity: item.quantity,
        price: dbItem.price,
      });

      await prisma.item.update({
        where: { id: dbItem.id },
        data: { stock: dbItem.stock - item.quantity },
      });
    }

    // Create the order first
    const order = await prisma.order.create({
      data: {
        attendantId: user.id,
        storeId: store.id,
        totalAmount,
        tableId: tableId || null,
        items: {
          create: orderItemsData.map(i => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
      include: { items: true },
    });

    // If a table is assigned, mark it OCCUPIED and set currentOrderId
    if (table) {
      await prisma.table.update({
        where: { id: table.id },
        data: {
          status: "OCCUPIED",
          currentOrderId: order.id, // <-- set the active order
        },
      });
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
    });

  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      message: "Failed to pass the order",
      error: error.message,
    });
  }
};


module.exports = {createOrder}

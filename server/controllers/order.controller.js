const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");
const {
  printOrder,
  printInvoice,
  printCancellation,
} = require("../services/printer");

const createOrder = async (req, res, next) => {
  try {
    const { items, tableId } = req.body;
    const userId = req.user.id;

    if (!items || !items.length) {
      return next(new HttpError("No items provided", 400));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new HttpError("User not found", 404));

    let totalAmount = 0;
    const orderItemsData = [];
    const storeItemMap = {};

    for (const item of items) {
      const dbItem = await prisma.item.findUnique({
        where: { id: item.itemId },
      });
      if (!dbItem)
        return next(new HttpError(`Item ${item.itemId} not found`, 404));

      if (dbItem.stock < item.quantity) {
        return next(
          new HttpError(`Insufficient stock for item ${dbItem.name}`, 400)
        );
      }

      // compute totals
      const itemTotal = dbItem.price * item.quantity;
      totalAmount += itemTotal;

      // push data for order creation
      orderItemsData.push({
        itemId: dbItem.id,
        storeId: dbItem.storeId,
        quantity: item.quantity,
        price: dbItem.price,
      });

      // group items by store for printing
      if (!storeItemMap[dbItem.storeId]) {
        storeItemMap[dbItem.storeId] = [];
      }
      storeItemMap[dbItem.storeId].push({
        itemName: dbItem.name,
        quantity: item.quantity,
      });

      // update stock
      await prisma.item.update({
        where: { id: dbItem.id },
        data: { stock: dbItem.stock - item.quantity },
      });
    }

    // ✅ create order
    const order = await prisma.order.create({
      data: {
        attendantId: user.id,
        totalAmount,
        tableId: tableId || null,
        items: {
          create: orderItemsData.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
      include: { items: true },
    });

    // ✅ update table status
    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: {
          status: "OCCUPIED",
          currentOrderId: order.id,
          attendantId: user.id,
        },
      });
    }

    // ✅ print grouped items per store
    for (const storeId in storeItemMap) {
      try {
        await printOrder(storeItemMap[storeId], storeId, user.name);
      } catch (error) {
        console.error("Print error:", error);
      }
    }

    res.status(201).json({
      message: "Order created successfully and sent to printers.",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      message: "Failed to create the order",
      error: error.message,
    });
  }
};

const getOrderByTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findFirst({
      where: { tableId: id },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        attendant: true,
      },
    });
    if (!order) {
      return res.json({ message: "No active order", items: [] });
    }
    res.json({ order });
  } catch (error) {
    console.log("error geting the order", error);
    next(new HttpError("Faildes to fetch order", 500));
  }
};

const printBill = async (req, res, next) => {
  try {
    const { tableId } = req.params;
    const userId = req.user.id;

    if (!tableId) {
      return next(new HttpError("Table ID is required.", 400));
    }

    const order = await prisma.order.findFirst({
      where: { tableId: tableId },
      include: {
        attendant: true,
        items: {
          include: { item: true },
        },
      },
    });

    if (!order) {
      return next(new HttpError("No order on this table.", 404));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(new HttpError("User not found.", 404));
    }

    const invoice = {
      invoiceNumber: `INVOICE-${order.id.toString().slice(-6).toUpperCase()}`,
      date: new Date().toLocaleString("fr-FR"),
      serverName: user.name,
      items: [],
      totalAmount: order.totalAmount,
    };

    for (const orderItem of order.items) {
      invoice.items.push({
        itemName: orderItem.item.name,
        quantity: orderItem.quantity,
        unitPrice: orderItem.price,
      });
    }

    await printInvoice(invoice);

    res.status(200).json({
      message: "Facture imprimée avec succès.",
    });
  } catch (error) {
    console.error("Erreur d'impression de la facture:", error);
    return next(new HttpError(error.message || "Erreur interne serveur.", 500));
  }
};

const addItemsToOrder = async (req, res, next) => {
  try {
    const { orderId, items } = req.body;
    const userId = req.user.id;

    if (!orderId) return next(new HttpError("Order ID is required.", 400));
    if (!items || !items.length) {
      return next(new HttpError("No items provided.", 400));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new HttpError("User not found.", 404));

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return next(new HttpError("Order not found.", 404));
    if (order.status !== "PENDING") {
      return next(new HttpError("Order is closed or paid.", 400));
    }

    let addedTotal = 0;
    const addedOrderItemsData = [];
    const storeItemMap = {};

    for (const item of items) {
      const dbItem = await prisma.item.findUnique({
        where: { id: item.itemId },
      });
      if (!dbItem)
        return next(new HttpError(`Item ${item.itemId} not found`, 404));

      if (dbItem.stock < item.quantity) {
        return next(
          new HttpError(`Insufficient stock for item ${dbItem.name}`, 400)
        );
      }

      const itemTotal = dbItem.price * item.quantity;
      addedTotal += itemTotal;

      addedOrderItemsData.push({
        itemId: dbItem.id,
        quantity: item.quantity,
        price: dbItem.price,
      });

      // group for printing
      if (!storeItemMap[dbItem.storeId]) {
        storeItemMap[dbItem.storeId] = [];
      }
      storeItemMap[dbItem.storeId].push({
        itemName: dbItem.name,
        quantity: item.quantity,
      });

      // update stock
      await prisma.item.update({
        where: { id: dbItem.id },
        data: { stock: dbItem.stock - item.quantity },
      });
    }

    // ✅ create new OrderItems
    await prisma.orderItem.createMany({
      data: addedOrderItemsData.map((i) => ({
        orderId: order.id,
        itemId: i.itemId,
        quantity: i.quantity,
        price: i.price,
      })),
    });

    // ✅ update totalAmount
    await prisma.order.update({
      where: { id: order.id },
      data: {
        totalAmount: order.totalAmount + addedTotal,
      },
    });

    // ✅ print only added items (grouped by store)
    for (const storeId in storeItemMap) {
      try {
        await printOrder(storeItemMap[storeId], storeId, user.name);
      } catch (error) {
        console.error("Print error (added items):", error);
      }
    }

    res.status(200).json({
      message: "Items added successfully and printed.",
    });
  } catch (error) {
    console.error("Error adding items to order:", error);
    return next(
      new HttpError(error.message || "Failed to add items to order", 500)
    );
  }
};

const removeItems = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { itemsToCancel } = req.body;
    const userId = req.user?.id;

    if (!orderId) return next(new HttpError("Order id is required", 400));
    if (!itemsToCancel?.length)
      return next(
        new HttpError("itemsToCancel must be a non-empty array", 400)
      );

    // Fetch order and related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { item: true } },
        attendant: true,
        Table: true,
      },
    });
    if (!order) return next(new HttpError("Order not found.", 404));

    const storeItemMap = {};
    const cancellationsToSave = [];

    // Process each cancelled item
    for (const cancelReq of itemsToCancel) {
      const { itemId, quantity: cancelQty } = cancelReq;
      if (!itemId || !cancelQty || cancelQty <= 0) continue;

      const orderItem = order.items.find((oi) => oi.itemId === itemId);
      if (!orderItem)
        return next(new HttpError(`Item ${itemId} is not in order`, 400));
      if (cancelQty > orderItem.quantity) {
        return next(
          new HttpError(
            `Cannot cancel ${cancelQty} for item ${orderItem.item.name}. Only ${orderItem.quantity} in order.`,
            400
          )
        );
      }

      // Restore stock
      await prisma.item.update({
        where: { id: itemId },
        data: { stock: { increment: cancelQty } },
      });

      // Update or delete orderItem
      if (cancelQty < orderItem.quantity) {
        await prisma.orderItem.update({
          where: { id: orderItem.id },
          data: { quantity: orderItem.quantity - cancelQty },
        });
      } else {
        await prisma.orderItem.delete({ where: { id: orderItem.id } });
      }

      // Record cancellation
      cancellationsToSave.push({
        name: orderItem.item.name,
        quantity: cancelQty,
        unitPrice: Math.round(orderItem.price),
        totalPrice: Math.round(orderItem.price * cancelQty),
        cancelledBy: String(userId),
        cancelledAt: new Date(),
        userId,
      });

      // Group by store for printing
      const itemDetails = orderItem.item;
      if (!storeItemMap[itemDetails.storeId])
        storeItemMap[itemDetails.storeId] = [];
      storeItemMap[itemDetails.storeId].push({
        itemName: itemDetails.name,
        quantity: cancelQty,
      });
    }

    // Check if any items remain
    const refreshedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!refreshedOrder || refreshedOrder.items.length === 0) {
      // All items removed -> cleanup
      await prisma.cancellations.createMany({
        data: cancellationsToSave,
      });

      await prisma.discount.deleteMany({ where: { orderId } });
      await prisma.order.delete({ where: { id: orderId } });

      // ✅ Free the table (search by currentOrderId OR order relation)
      const table = await prisma.table.findFirst({
        where: { id: order.tableId },
      });

      if (table) {
        await prisma.table.update({
          where: { id: table.id },
          data: {
            status: "AVAILABLE",
            currentOrderId: null,
            attendantId: null,
          },
        });
        console.log(`✅ Table ${table.number} freed successfully`);
      } else {
        console.warn("⚠️ No table found for order", orderId);
      }

      // Print cancellations
      for (const storeId of Object.keys(storeItemMap)) {
        try {
          await printCancellation(
            storeItemMap[storeId],
            storeId,
            order.attendant?.name || ""
          );
        } catch (err) {
          console.error("Error printing cancellations for store", storeId, err);
        }
      }

      return res
        .status(200)
        .json({ message: "All items removed, order deleted, table freed." });
    }

    // Partial cancellation: update order total
    const newTotal = refreshedOrder.items.reduce(
      (sum, oi) => sum + oi.price * oi.quantity,
      0
    );

    await prisma.order.update({
      where: { id: orderId },
      data: { totalAmount: newTotal },
    });

    // Save cancellations
    if (cancellationsToSave.length > 0) {
      await prisma.cancellations.createMany({
        data: cancellationsToSave,
      });
    }

    // Print partial cancellations
    for (const storeId of Object.keys(storeItemMap)) {
      try {
        await printCancellation(
          storeItemMap[storeId],
          storeId,
          order.attendant?.name || ""
        );
      } catch (err) {
        console.error("Error printing cancellations for store", storeId, err);
      }
    }

    return res.status(200).json({
      message: "Selected items cancelled, order updated and stock restored.",
    });
  } catch (error) {
    console.error("removeItems error:", error);
    return res.status(500).json({
      message: "Error while cancelling items.",
      error: error.message,
    });
  }
};

const discountOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { discountPercentage } = req.body;
    const userId = req.user.id;

    const validDiscounts = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    if (!validDiscounts.includes(discountPercentage)) {
      return res.status(400).json({
        message: "Pourcentage de réduction invalide.",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    const discountAmount = (order.totalAmount * discountPercentage) / 100;
    const discountedTotal = order.totalAmount - discountAmount;

    const discount = await prisma.discount.create({
      data: {
        discountedById: userId,
        orderId,
        discountPercentage,
        discountAmount,
        newTotalAmount: discountedTotal,
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: discountedTotal,
        status: "PENDING",
      },
    });

    const table = await prisma.table.findFirst({
      where: { currentOrderId: orderId },
    });

    if (table) {
      await prisma.table.update({
        where: { id: table.id },
        data: {
          status: "OCCUPIED",
        },
      });
    }

    return res.status(200).json({
      message: `Réduction de ${discountPercentage}% appliquée avec succès.`,
      order: updatedOrder,
      discount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de l'application de la réduction.",
      error: error.message,
    });
  }
};

const splitBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemsToSplit, newTableId } = req.body;

    // --- Validation ---
    if (
      !orderId ||
      !Array.isArray(itemsToSplit) ||
      itemsToSplit.length === 0 ||
      !newTableId
    ) {
      return res
        .status(400)
        .json({ message: "La commande, les items et la table sont requis." });
    }

    // --- Récupérer la commande originale ---
    const originalOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { item: true } },
        Table: true,
      },
    });

    if (!originalOrder) {
      return res
        .status(404)
        .json({ message: "Commande originale introuvable." });
    }

    let newItems = [];
    let updatedOriginalItems = [];
    let newTotalAmount = 0;
    let updatedTotalAmount = 0;

    // Créer un map des items à diviser
    const splitMap = {};
    for (const item of itemsToSplit) {
      splitMap[item.itemId] = item.quantity;
    }

    // --- Séparation des items ---
    for (const orderItem of originalOrder.items) {
      const itemId = orderItem.itemId;
      const splitQty = splitMap[itemId];

      if (splitQty) {
        if (splitQty > orderItem.quantity) {
          return res.status(400).json({
            message: `Quantité à diviser supérieure à celle existante pour l'article ${orderItem.item.name}.`,
          });
        }

        // Nouvel item pour la nouvelle commande
        newItems.push({
          itemId: orderItem.itemId,
          quantity: splitQty,
          price: orderItem.price,
          discount: orderItem.discount || 0,
        });
        newTotalAmount += orderItem.price * splitQty;

        // Garder le reste dans la commande originale
        const remainingQty = orderItem.quantity - splitQty;
        if (remainingQty > 0) {
          updatedOriginalItems.push({
            ...orderItem,
            quantity: remainingQty,
            total: orderItem.price * remainingQty,
          });
          updatedTotalAmount += orderItem.price * remainingQty;
        }
      } else {
        updatedOriginalItems.push(orderItem);
        updatedTotalAmount += orderItem.price * orderItem.quantity;
      }
    }

    // --- Mettre à jour la commande originale ---
    await prisma.orderItem.deleteMany({
      where: { orderId: originalOrder.id },
    });

    await prisma.order.update({
      where: { id: originalOrder.id },
      data: {
        totalAmount: updatedTotalAmount,
        items: {
          create: updatedOriginalItems.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
            discount: i.discount || 0,
          })),
        },
      },
    });

    // --- Créer la nouvelle commande ---
    const newOrder = await prisma.order.create({
      data: {
        tableId: newTableId,
        totalAmount: newTotalAmount,
        attendantId: originalOrder.attendantId,
        status: originalOrder.status,
        items: {
          create: newItems.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            price: i.price,
            discount: i.discount || 0,
          })),
        },
      },
      include: {
        items: { include: { item: true } },
        Table: true,
      },
    });

    // --- Mettre à jour la table ---
    await prisma.table.update({
      where: { id: newTableId },
      data: {
        status: "OCCUPIED",
        currentOrderId: newOrder.id,
        attendantId: newOrder.attendantId,
      },
    });

    if (updatedOriginalItems.length === 0 && originalOrder.Table) {
      await prisma.table.update({
        where: { id: originalOrder.Table.id },
        data: { status: "AVAILABLE", currentOrderId: null },
      });
    }

    return res.status(201).json({
      message: "Facture divisée avec succès.",
      originalOrderId: originalOrder.id,
      newOrder,
    });
  } catch (error) {
    console.error("Erreur splitBill:", error);
    return res.status(500).json({
      message: "Erreur lors de la division de la facture.",
      error: error.message,
    });
  }
};

const breakItemInOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId, quantityToBreak } = req.body;

    if (!orderId || !itemId || !quantityToBreak || quantityToBreak <= 0) {
      return res.status(400).json({
        message:
          "Order ID, item ID, and quantity to break are required and must be valid.",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { item: true } } },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const originalOrderItem = order.items.find((oi) => oi.itemId === itemId);

    if (!originalOrderItem) {
      return res.status(404).json({ message: "Item not found in the order." });
    }

    if (quantityToBreak >= originalOrderItem.quantity) {
      return res.status(400).json({
        message:
          "The quantity to break must be less than the existing item quantity.",
      });
    }

    const remainingQuantity = originalOrderItem.quantity - quantityToBreak;

    // Update the original item quantity only
    await prisma.orderItem.update({
      where: { id: originalOrderItem.id },
      data: { quantity: remainingQuantity },
    });

    // Create new order item for the broken quantity
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        itemId: originalOrderItem.itemId,
        quantity: quantityToBreak,
        price: originalOrderItem.price,
      },
    });

    // Recalculate totalAmount dynamically
    const updatedItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    const newTotalAmount = updatedItems.reduce(
      (sum, i) => sum + i.quantity * i.price, // calculate total dynamically
      0
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount: newTotalAmount },
    });

    return res.status(200).json({
      message: "Item successfully split in the order.",
      orderId: order.id,
      splitItem: { itemId, quantity: quantityToBreak },
      totalAmount: newTotalAmount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error while splitting item in the order.",
      error: error.message,
    });
  }
};


module.exports = {
  createOrder,
  getOrderByTable,
  printBill,
  addItemsToOrder,
  removeItems,
  discountOrder,
  splitBill,
  breakItemInOrder
};

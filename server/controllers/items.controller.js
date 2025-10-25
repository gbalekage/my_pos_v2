const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const createItem = async (req, res, next) => {
  try {
    const { name, storeId, categoryId, barcode, stock, price, package: pkg } = req.body;
    if (!name || !storeId || !categoryId || !barcode || stock === undefined || price === undefined)
      return next(new HttpError("Fill in all required fields", 400));

    const existing = await prisma.item.findUnique({ where: { barcode } });
    if (existing) return next(new HttpError("Barcode already exists", 400));

    const item = await prisma.item.create({
      data: { name, storeId, categoryId, barcode, stock, price, package: pkg },
    });

    res.status(201).json({ message: "Item created", item });
  } catch (error) {
    console.error(error);
    next(new HttpError("Server error", 500));
  }
};

const getAllItems = async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({ include: { store: true, category: true } });
    res.status(200).json({ items });
  } catch (error) {
    console.error(error);
    next(new HttpError("Server error", 500));
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({ where: { id }, include: { store: true, category: true } });
    if (!item) return next(new HttpError("Item not found", 404));
    res.status(200).json({ item });
  } catch (error) {
    console.error(error);
    next(new HttpError("Server error", 500));
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, storeId, categoryId, barcode, stock, price, package: pkg } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (storeId !== undefined) data.storeId = storeId;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (barcode !== undefined) data.barcode = barcode;
    if (stock !== undefined) data.stock = stock;
    if (price !== undefined) data.price = price;
    if (pkg !== undefined) data.package = pkg;

    const updatedItem = await prisma.item.update({
      where: { id },
      data,
      include: { store: true, category: true },
    });

    res.status(200).json({ message: "Item updated", item: updatedItem });
  } catch (error) {
    console.error(error);
    next(new HttpError("Server error", 500));
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.item.delete({ where: { id } });
    res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    console.error(error);
    next(new HttpError("Server error", 500));
  }
};

module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};


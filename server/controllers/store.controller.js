const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const createStore = async (req, res, next) => {
  try {
    const { name, printerId } = req.body;
    if (!name || !printerId) {
      return next(new HttpError("Fill in all fields", 400));
    }

    const store = await prisma.store.findUnique({
      where: { name },
    });
    if (store) {
      return next(
        new HttpError("You can't use that name, it has already been taken", 400)
      );
    }

    const newStore = await prisma.store.create({
      data: {
        name,
        printerId,
      },
    });

    res.status(201).json({
      message: "Store Added",
      store: newStore,
    });
  } catch (error) {
    console.log("Error creating the store", error);
    return next(new HttpError("Server error", 500));
  }
};

const getStores = async (req, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        printer: true,
      }
    });
    res.status(200).json({ stores });
  } catch (error) {
    console.log("Error geting stores", error);
    return next(new HttpError("Server error", 500));
  }
};

const getStoreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return next(new HttpError("Store not found", 404));
    }

    res.status(200).json({ store });
  } catch (error) {
    console.error("Error fetching store", error);
    return next(new HttpError("Error fetching store, please try again", 500));
  }
};

const updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, printerId, isActive } = req.body;

    const data = {};

    if (name !== undefined) data.name = name;
    if (printerId !== undefined) data.printerId = printerId;
    if (isActive !== undefined) data.isActive = isActive;

    const updatedStore = await prisma.store.update({
      where: { id },
      data,
    });

    res.status(200).json({
      message: "Store updated successfully",
      store: updatedStore,
    });
  } catch (error) {
    console.log("Error updating the store", error);
    return next(new HttpError("Server error", 500));
  }
};

const deleteStore = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.store.delete({
      where: { id },
    });

    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    console.log("Error deleting store", error);
    return next(new HttpError("Error deleting store, please try again", 500));
  }
};

module.exports = {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
};

const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");
const { printTestPage } = require("../services/printer");

const addPrinter = async (req, res, next) => {
  try {
    const { name, type, ip, port, isDefault } = req.body;

    if (!name || !type) {
      return next(new HttpError("Printer name and type are required", 400));
    }

    if (type === "ETHERNET" && !ip) {
      return next(
        new HttpError("IP address is required for network printers", 400)
      );
    }

    if (isDefault) {
      await prisma.printer.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const newPrinter = await prisma.printer.create({
      data: {
        name,
        type,
        ip,
        port: port || 9100,
        isDefault: !!isDefault,
      },
    });

    res.status(201).json({
      message: "Printer added successfully!",
      printer: newPrinter,
    });
  } catch (error) {
    console.log("Error adding printer:", error);
    return next(new HttpError(error.message || "Server error", 500));
  }
};

const getPrinters = async (req, res, next) => {
  try {
    const printers = await prisma.printer.findMany();
    res.status(200).json({ printers });
  } catch (error) {
    console.log("Error fetching printers", error);
    return next(
      new HttpError("Error fetching printers, please try again", 500)
    );
  }
};

const getPrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;
    const printer = await prisma.printer.findUnique({
      where: { id: parseInt(printerId) },
    });

    if (!printer) {
      return next(new HttpError("Printer not found", 404));
    }

    res.status(200).json({ printer });
  } catch (error) {
    console.log("Error fetching printer", error);
    return next(new HttpError("Error fetching printer, please try again", 500));
  }
};

const updatePrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;
    const { name, ip, isDefault } = req.body;

    // 1️⃣ Build a dynamic update object
    const data = {};

    if (name !== undefined) data.name = name;
    if (ip !== undefined) data.ip = ip;
    if (isDefault !== undefined) data.isDefault = isDefault;

    // 2️⃣ Handle default printer logic
    if (isDefault) {
      await prisma.printer.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // 3️⃣ Update only touched fields
    const updatedPrinter = await prisma.printer.update({
      where: { id: printerId },
      data,
    });

    res.status(200).json({
      message: "Printer updated successfully",
      printer: updatedPrinter,
    });
  } catch (error) {
    console.log("Error updating printer:", error);
    return next(new HttpError("Error updating printer, please try again", 500));
  }
};

const deletePrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;

    await prisma.printer.delete({
      where: { id: printerId },
    });

    res.status(200).json({ message: "Printer deleted successfully" });
  } catch (error) {
    console.log("Error deleting printer", error);
    return next(new HttpError("Error deleting printer, please try again", 500));
  }
};

const testPrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;

    const printer = await prisma.printer.findUnique({
      where: {
        id: printerId,
      },
    });
    if (!printer) {
      return res.status(404).json({ message: "Imprimante non connecté." });
    }

    await printTestPage(printer);

    res.status(200).json({ message: "Test print sent successfully." });
  } catch (error) {
    console.log("Error testing printer:", error);
    res
      .status(500)
      .json({ message: "Failed to test printer.", error: error.message });
  }
};

module.exports = {
  addPrinter,
  getPrinters,
  getPrinter,
  updatePrinter,
  deletePrinter,
  testPrinter,
};

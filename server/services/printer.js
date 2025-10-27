const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const defaultPrinter = async () => {
  const printer = await prisma.restaurant.findFirst({
    where: { isDefault: true },
  });
  if (!printer) {
    throw new Error("Aucune imprimante par défaut trouvée.");
  }
  return printer;
};

const initPrinter = async (printerConfig) => {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface:
      printerConfig.type === "usb"
        ? "usb"
        : `tcp://${printerConfig.ip}:${printerConfig.port || 9100}`,
    options: {
      timeout: 5000,
    },
    width: 48,
    characterSet: "SLOVENIA",
    removeSpecialCharacters: false,
    lineCharacter: "-",
  });

  return printer;
};

const printTestPage = async (printerConfig) => {
  try {
    const printer = await initPrinter(printerConfig);

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Printer not connected.");
    }

    // Print test page header
    printer.alignCenter();
    printer.println("*** PRINTER TEST ***");
    printer.drawLine();

    // Print printer details
    printer.println(`Printer name: ${printerConfig.name}`);
    printer.println(`Printer IP: ${printerConfig.ip}`);
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error(
      "Erreur lors de l'impression de la page test de l'imprimante :",
      error
    );
    return false;
  }
};


module.exports = {
  printTestPage,
  initPrinter
};

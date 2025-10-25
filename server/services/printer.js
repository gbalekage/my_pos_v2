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

    const company = await prisma.restaurant.findFirst();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Printer not connected.");
    }

    if (company.logoUrl) {
      const logoPath = path.join(
        __dirname,
        "../uploads/company/logo",
        path.basename(company.logoUrl)
      );

      if (fs.existsSync(logoPath)) {
        const resizedLogoPath = path.join(
          __dirname,
          "../uploads/company/logo/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        printer.alignCenter();
        await printer.printImage(resizedLogoPath);
        printer.newLine();
      } else {
        console.error("Logo introuvable à cet emplacement:", logoPath);
      }
    } else {
      console.warn("Aucun logo défini pour l'entreprise.");
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println(company.name);
    printer.println(company.email);
    printer.drawLine();

    printer.alignCenter();
    printer.println("*** PRINTER TEST ***");
    printer.drawLine();
    printer.println(`Printer name: ${printerConfig.name}`);
    printer.println(`Printer IP: ${printerConfig.ip}`);
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error(
      "Erreur lors de l'impression de le page test de l'imprimente :",
      error
    );
    return false;
  }
};

module.exports = {
  printTestPage,
};

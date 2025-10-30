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

const printOrder = async (items, storeId, attendantName) => {
  try {
    const storeWithPrinter = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        printer: true,
      },
    });

    if (!storeWithPrinter || !storeWithPrinter.printer) {
      throw new Error(
        `Aucune configuration d'imprimante trouvée pour le store`
      );
    }

    const printerConfig = storeWithPrinter.printer;
    const printer = await initPrinter(printerConfig);

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`Imprimante pour le store non connectée.`);
    }

    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.println("=== COMMANDE ===");
    printer.bold(false);
    printer.drawLine();

    // Store information
    printer.alignLeft();
    printer.println(`Store : ${storeWithPrinter.name}`);
    printer.println(`Attendant : ${attendantName}`);
    printer.println(`Date    : ${new Date().toLocaleString("fr-FR")}`);
    printer.drawLine();

    // Table header
    printer.bold(true);
    printer.println("Article                 Qty");
    printer.bold(false);
    printer.println("------------------------------");

    // Table content
    items.forEach((item) => {
      const itemName = item.itemName;
      const quantity = item.quantity;

      const formattedItemName =
        itemName.length > 20
          ? itemName.substring(0, 20)
          : itemName.padEnd(20, " ");
      const formattedQuantity = String(quantity).padStart(5, " ");

      printer.println(`${formattedItemName} ${formattedQuantity}`);
    });

    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression de la commande:", error);
    throw new Error(
      `Erreur d'impression pour le store ${storeId}: ${error.message}`
    );
  }
};

const printInvoice = async (invoice) => {
  try {
    let printerConfig;
    try {
      printerConfig = await defaultPrinter();
    } catch (error) {
      console.warn("Default printer not found, trying Bar Printer...");
      printerConfig = await prisma.printer.findFirst({
        where: { name: "Bar Printer" },
      });
      if (!printerConfig) {
        throw new Error("Aucune imprimante par défaut ni Bar Printer trouvée.");
      }
    }

    let printer = await initPrinter(printerConfig);

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("Bar Printer également non connectée.");
    }

    const company = await prisma.restaurant.findFirst();
    if (!company) {
      console.error("Aucune information sur l'entreprise trouvée.");
      return false;
    }

    if (company.logoUrl) {
      const logoPath = path.join(
        __dirname,
        "../uploads/company/logo/",
        path.basename(company.logoUrl)
      );

      if (fs.existsSync(logoPath)) {
        console.log("Logo trouvé, redimensionnement...");

        const resizedLogoPath = path.join(
          __dirname,
          "../uploads/company/logo/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resizedLogoPath);

        console.log("Logo redimensionné, envoi à l'imprimante...");
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

    // Titre
    printer.alignCenter();
    printer.bold(true);
    printer.println("CUSTOMER BILL");
    printer.setTextNormal();

    printer.bold(false);
    printer.drawLine();
    printer.alignLeft();
    printer.println(`Bill No : ${invoice.invoiceNumber}`);
    printer.println(`Date    : ${invoice.date}`);
    printer.println(`Attendant : ${invoice.serverName}`);
    printer.drawLine();

    // En-tête du tableau
    printer.bold(true);
    printer.println("Article          Qty    PU       Total");
    printer.setTextNormal();
    printer.drawLine();

    invoice.items.forEach((item) => {
      const itemName =
        item.itemName.length > 16
          ? item.itemName.substring(0, 16) + "."
          : item.itemName.padEnd(17, " ");
      const quantity = String(item.quantity).padStart(3, " ");
      const unitPrice = item.unitPrice.toLocaleString().padStart(7, " ");
      const totalPrice = (item.unitPrice * item.quantity)
        .toLocaleString()
        .padStart(9, " ");

      printer.println(`${itemName} ${quantity}  ${unitPrice}  ${totalPrice}`);
    });

    printer.drawLine();

    // Total
    printer.alignRight();
    printer.println(`Total: ${invoice.totalAmount.toLocaleString()}FC`);
    printer.setTextNormal();
    printer.alignLeft();

    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression de la facture:", error);
    throw new Error(`Erreur d'impression de la facture pour le store`);
  }
};

const printCancellation = async (items, storeId, attendant) => {
  try {
    const storeWithPrinter = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        printer: true,
      },
    });

    if (!storeWithPrinter || !storeWithPrinter.printer) {
      throw new Error(`No printer configuration found for this store`);
    }

    const printerConfig = storeWithPrinter.printer;
    const printer = await initPrinter(printerConfig);

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`Printer not connected`);
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println("=== REMOVED ITEMS ===");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Store : ${storeWithPrinter.name}`);
    printer.println(`Attendant : ${attendant}`);
    printer.println(`Date    : ${new Date().toLocaleString("fr-FR")}`);
    printer.drawLine();

    printer.bold(true);
    printer.println("Article                 Qty");
    printer.bold(false);
    printer.println("------------------------------");

    items.forEach((item) => {
      const itemName = item.itemName;
      const quantity = item.quantity;

      const formattedItemName =
        itemName.length > 20
          ? itemName.substring(0, 20)
          : itemName.padEnd(20, " ");
      const formattedQuantity = String(quantity).padStart(5, " ");

      printer.println(`${formattedItemName} ${formattedQuantity}`);
    });

    printer.cut();
    await printer.execute();
  } catch (error) {
    console.error("Erreur d'impression des articles supprimés:", error);
    throw new Error("Erreur d'impression");
  }
};

module.exports = {
  printTestPage,
  initPrinter,
  printOrder,
  printInvoice,
  printCancellation
};

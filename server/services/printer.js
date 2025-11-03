const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { ThermalPrinter, PrinterTypes } = require("node-thermal-printer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ----------------------
// 🔧 Helpers
// ----------------------
const defaultPrinter = async () => {
  const printer = await prisma.printer.findFirst({ where: { isDefault: true } });
  if (!printer) throw new Error("Aucune imprimante par défaut trouvée.");
  return printer;
};

const formatCurrency = (amount) => {
  const n = amount || 0;
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " FC";
};


const initPrinter = async (printerConfig) => {
  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface:
      printerConfig.type === "usb"
        ? "usb"
        : `tcp://${printerConfig.ip}:${printerConfig.port || 9100}`,
    options: { timeout: 5000 },
    width: 48,
    characterSet: "SLOVENIA",
    removeSpecialCharacters: false,
    lineCharacter: "-",
  });
};

// ----------------------
// 🧪 Imprimer page test
// ----------------------
const printTestPage = async (printerConfig) => {
  try {
    const printer = await initPrinter(printerConfig);
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) throw new Error("Imprimante non connectée.");

    printer.alignCenter();
    printer.println("*** PAGE TEST ***");
    printer.drawLine();
    printer.println(`Nom imprimante : ${printerConfig.name}`);
    printer.println(`IP : ${printerConfig.ip || "N/A"}`);
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur impression page test :", error);
  }
};

// ----------------------
// 🍽️ Imprimer commande
// ----------------------
const printOrder = async (items, storeId, attendantName) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { printer: true },
    });
    if (!store?.printer) throw new Error("Aucune imprimante configurée pour ce magasin.");

    const printer = await initPrinter(store.printer);
    if (!(await printer.isPrinterConnected())) throw new Error("Imprimante non connectée.");

    printer.alignCenter();
    printer.bold(true);
    printer.println("=== COMMANDE ===");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Magasin : ${store.name}`);
    printer.println(`Serveur : ${attendantName}`);
    printer.println(`Date : ${new Date().toLocaleString("fr-FR")}`);
    printer.drawLine();

    printer.bold(true);
    printer.println("Article                 Qty");
    printer.bold(false);
    printer.drawLine();

    items.forEach((item) => {
      const name = item.itemName.length > 20 ? item.itemName.substring(0, 20) : item.itemName.padEnd(20, " ");
      const qty = String(item.quantity).padStart(5, " ");
      printer.println(`${name} ${qty}`);
    });

    printer.cut();
    await printer.execute();
  } catch (error) {
    console.error("Erreur impression commande :", error);
  }
};

// ----------------------
// 💰 Imprimer facture
// ----------------------
const printInvoice = async (invoice) => {
  try {
    let printerConfig;
    try {
      printerConfig = await defaultPrinter();
    } catch {
      console.warn("Imprimante par défaut introuvable, tentative 'Bar Printer'...");
      printerConfig = await prisma.printer.findFirst({ where: { name: "Bar Printer" } });
      if (!printerConfig) throw new Error("Aucune imprimante par défaut ni 'Bar Printer' trouvée.");
    }

    const printer = await initPrinter(printerConfig);
    if (!(await printer.isPrinterConnected())) throw new Error("Imprimante non connectée.");

    const company = await prisma.restaurant.findFirst();
    if (!company) throw new Error("Aucune information sur le restaurant.");

    // Logo
    if (company.logoUrl) {
      const logoPath = path.join(__dirname, "../uploads/company/logo/", path.basename(company.logoUrl));
      if (fs.existsSync(logoPath)) {
        const resized = path.join(__dirname, "../uploads/company/logo/resized-logo.png");
        await sharp(logoPath).resize({ width: 300 }).toFormat("png").toFile(resized);
        printer.alignCenter();
        await printer.printImage(resized);
        printer.newLine();
      }
    }

    printer.alignCenter();
    printer.bold(true);
    printer.println(company.name);
    if (company.email) printer.println(company.email);
    if (company.phone) printer.println(company.phone);
    printer.drawLine();

    printer.println("FACTURE CLIENT");
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Facture : ${invoice.invoiceNumber}`);
    printer.println(`Date : ${invoice.date}`);
    printer.println(`Serveur : ${invoice.serverName}`);
    printer.drawLine();

    // Items
    printer.bold(true);
    printer.println("Article           Qty   PU        Total");
    printer.bold(false);
    printer.drawLine();

    invoice.items.forEach((item) => {
      const name = item.itemName.length > 15 ? item.itemName.substring(0, 15) + "." : item.itemName.padEnd(16, " ");
      const qty = String(item.quantity).padStart(3, " ");
      const pu = formatCurrency(item.unitPrice).padStart(10, " ");
      const total = formatCurrency(item.unitPrice * item.quantity).padStart(10, " ");
      printer.println(`${name} ${qty} ${pu} ${total}`);
    });

    printer.drawLine();
    printer.alignRight();
    printer.bold(true);
    printer.println(`TOTAL : ${formatCurrency(invoice.totalAmount)}`);
    printer.bold(false);
    printer.alignCenter();
    printer.println("Merci pour votre visite !");
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur impression facture :", error);
  }
};

// ----------------------
// ❌ Imprimer annulation
// ----------------------
const printCancellation = async (items, storeId, attendant) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { printer: true },
    });
    if (!store?.printer) throw new Error("Aucune imprimante trouvée pour ce magasin.");

    const printer = await initPrinter(store.printer);
    if (!(await printer.isPrinterConnected())) throw new Error("Imprimante non connectée.");

    printer.alignCenter();
    printer.bold(true);
    printer.println("=== ARTICLES ANNULÉS ===");
    printer.bold(false);
    printer.drawLine();

    printer.alignLeft();
    printer.println(`Magasin : ${store.name}`);
    printer.println(`Serveur : ${attendant}`);
    printer.println(`Date : ${new Date().toLocaleString("fr-FR")}`);
    printer.drawLine();

    printer.bold(true);
    printer.println("Article                 Qty");
    printer.bold(false);
    printer.drawLine();

    items.forEach((item) => {
      const name = item.itemName.length > 20 ? item.itemName.substring(0, 20) : item.itemName.padEnd(20, " ");
      const qty = String(item.quantity).padStart(5, " ");
      printer.println(`${name} ${qty}`);
    });

    printer.cut();
    await printer.execute();
  } catch (error) {
    console.error("Erreur impression annulation :", error);
  }
};

// ----------------------
// 🖊️ Imprimer note signée
// ----------------------
const printSignedBill = async (sale, signedBill) => {
  try {
    let printerConfig;
    try {
      printerConfig = await defaultPrinter();
    } catch {
      console.warn("Imprimante par défaut introuvable, tentative 'Bar Printer'...");
      printerConfig = await prisma.printer.findFirst({ where: { name: "Bar Printer" } });
      if (!printerConfig) throw new Error("Aucune imprimante par défaut ni 'Bar Printer' trouvée.");
    }

    const printer = await initPrinter(printerConfig);
    if (!(await printer.isPrinterConnected())) throw new Error("Imprimante non connectée.");

    const company = await prisma.restaurant.findFirst();
    if (!company) throw new Error("Aucune information sur le restaurant.");

    const printSingleCopy = async (copyFor) => {
      // Logo
      if (company.logoUrl) {
        const logoPath = path.join(__dirname, "../uploads/company/logo/", path.basename(company.logoUrl));
        if (fs.existsSync(logoPath)) {
          const resized = path.join(__dirname, "../uploads/company/logo/resized-logo.png");
          await sharp(logoPath).resize({ width: 300 }).toFormat("png").toFile(resized);
          printer.alignCenter();
          await printer.printImage(resized);
          printer.newLine();
        }
      }

      printer.alignCenter();
      printer.bold(true);
      printer.println(company.name);
      if (company.email) printer.println(company.email);
      if (company.phone) printer.println(company.phone);
      printer.drawLine();

      printer.println("NOTE SIGNEE");
      printer.drawLine();

      printer.alignLeft();
      printer.println(`ID Facture : ${signedBill.id}`);
      printer.println(`Date : ${new Date(signedBill.createdAt).toLocaleString("fr-FR")}`);
      printer.println(`Serveur : ${signedBill.attendant?.name || "N/A"}`);
      printer.println(`Client : ${signedBill.client?.name || "N/A"}`);
      printer.println(`Table : ${sale.table?.number || "N/A"}`);
      printer.println(`Copie pour : ${copyFor}`);
      printer.drawLine();

      // Items
      printer.bold(true);
      printer.println("Article           Qty   PU        Total");
      printer.bold(false);
      printer.drawLine();

      sale.items.forEach((item) => {
        if (item?.item?.name) {
          const name = item.item.name.length > 15 ? item.item.name.substring(0, 15) + "." : item.item.name.padEnd(16, " ");
          const qty = String(item.quantity).padStart(3, " ");
          const pu = formatCurrency(item.price).padStart(10, " ");
          const total = formatCurrency(item.total).padStart(10, " ");
          printer.println(`${name} ${qty} ${pu} ${total}`);
        }
      });

      printer.drawLine();
      printer.alignRight();
      printer.bold(true);
      printer.println(`TOTAL : ${formatCurrency(sale.totalAmount)}`);
      printer.bold(false);
      printer.alignCenter();
      printer.println("Merci pour votre visite !");
      printer.cut();
    };

    // Print first copy (Restaurant)
    await printSingleCopy("Restaurant");

    // Separator between copies
    printer.println("\n========== SEPARATION ==========\n");
    printer.cut();

    // Print second copy (Client)
    await printSingleCopy("Client");

    await printer.execute();

  } catch (error) {
    console.error("Erreur impression note signée :", error);
  }
};


module.exports = {
  printTestPage,
  initPrinter,
  printOrder,
  printInvoice,
  printCancellation,
  printSignedBill,
};

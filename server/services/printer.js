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
  const printer = await prisma.printer.findFirst({
    where: { isDefault: true },
  });
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

function printJustified(printer, label, value, lineLength = 42) {
  const labelText = label.toUpperCase();
  const valueText = value?.toLocaleString() || "0";
  const spaceLength = Math.max(
    1,
    lineLength - labelText.length - valueText.length
  );
  const spaces = " ".repeat(spaceLength);
  printer.println(`${labelText}${spaces}${valueText}`);
}

function padRight(str, length) {
  return str.length >= length
    ? str.slice(0, length)
    : str + " ".repeat(length - str.length);
}

function padLeft(str, length) {
  str = str.toString();
  return str.length >= length
    ? str.slice(0, length)
    : " ".repeat(length - str.length) + str;
}

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
    if (!store?.printer)
      throw new Error("Aucune imprimante configurée pour ce magasin.");

    const printer = await initPrinter(store.printer);
    if (!(await printer.isPrinterConnected()))
      throw new Error("Imprimante non connectée.");

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
      const name =
        item.itemName.length > 20
          ? item.itemName.substring(0, 20)
          : item.itemName.padEnd(20, " ");
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
      console.warn(
        "Imprimante par défaut introuvable, tentative 'Bar Printer'..."
      );
      printerConfig = await prisma.printer.findFirst({
        where: { name: "Bar Printer" },
      });
      if (!printerConfig)
        throw new Error(
          "Aucune imprimante par défaut ni 'Bar Printer' trouvée."
        );
    }

    const printer = await initPrinter(printerConfig);
    if (!(await printer.isPrinterConnected()))
      throw new Error("Imprimante non connectée.");

    const company = await prisma.restaurant.findFirst();
    if (!company) throw new Error("Aucune information sur le restaurant.");

    // Logo
    if (company.logoUrl) {
      const logoPath = path.join(
        __dirname,
        "../uploads/company/logo/",
        path.basename(company.logoUrl)
      );
      if (fs.existsSync(logoPath)) {
        const resized = path.join(
          __dirname,
          "../uploads/company/logo/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resized);
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
      const name =
        item.itemName.length > 15
          ? item.itemName.substring(0, 15) + "."
          : item.itemName.padEnd(16, " ");
      const qty = String(item.quantity).padStart(3, " ");
      const pu = formatCurrency(item.unitPrice).padStart(10, " ");
      const total = formatCurrency(item.unitPrice * item.quantity).padStart(
        10,
        " "
      );
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
    if (!store?.printer)
      throw new Error("Aucune imprimante trouvée pour ce magasin.");

    const printer = await initPrinter(store.printer);
    if (!(await printer.isPrinterConnected()))
      throw new Error("Imprimante non connectée.");

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
      const name =
        item.itemName.length > 20
          ? item.itemName.substring(0, 20)
          : item.itemName.padEnd(20, " ");
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
      console.warn(
        "Imprimante par défaut introuvable, tentative 'Bar Printer'..."
      );
      printerConfig = await prisma.printer.findFirst({
        where: { name: "Bar Printer" },
      });
      if (!printerConfig)
        throw new Error(
          "Aucune imprimante par défaut ni 'Bar Printer' trouvée."
        );
    }

    const printer = await initPrinter(printerConfig);
    if (!(await printer.isPrinterConnected()))
      throw new Error("Imprimante non connectée.");

    const company = await prisma.restaurant.findFirst();
    if (!company) throw new Error("Aucune information sur le restaurant.");

    const printSingleCopy = async (copyFor) => {
      // Logo
      if (company.logoUrl) {
        const logoPath = path.join(
          __dirname,
          "../uploads/company/logo/",
          path.basename(company.logoUrl)
        );
        if (fs.existsSync(logoPath)) {
          const resized = path.join(
            __dirname,
            "../uploads/company/logo/resized-logo.png"
          );
          await sharp(logoPath)
            .resize({ width: 300 })
            .toFormat("png")
            .toFile(resized);
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
      printer.println(
        `Date : ${new Date(signedBill.createdAt).toLocaleString("fr-FR")}`
      );
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
          const name =
            item.item.name.length > 15
              ? item.item.name.substring(0, 15) + "."
              : item.item.name.padEnd(16, " ");
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

    // Print second copy (Client)
    await printSingleCopy("Client");

    await printer.execute();
  } catch (error) {
    console.error("Erreur impression note signée :", error);
  }
};

// ----------------------
// 🖨️ Print Sale Receipt
// ----------------------
const printReceipt = async (saleOrId) => {
  try {
    // 1️⃣ Get printer config
    let printerConfig;
    try {
      printerConfig = await defaultPrinter();
    } catch {
      console.warn(
        "Imprimante par défaut introuvable, tentative 'Bar Printer'..."
      );
      printerConfig = await prisma.printer.findFirst({
        where: { name: "Bar Printer" },
      });
      if (!printerConfig)
        throw new Error(
          "Aucune imprimante par défaut ni 'Bar Printer' trouvée."
        );
    }

    const printer = await initPrinter(printerConfig);
    if (!(await printer.isPrinterConnected()))
      throw new Error("Imprimante non connectée.");

    // 2️⃣ Get sale data
    let sale;
    if (typeof saleOrId === "string") {
      sale = await prisma.sale.findUnique({
        where: { id: saleOrId },
        include: {
          table: true,
          attendant: true,
          items: { include: { item: true } },
        },
      });
      if (!sale) throw new Error("Vente introuvable pour impression.");
    } else {
      sale = saleOrId;
    }

    // 3️⃣ Get company info
    const company = await prisma.restaurant.findFirst();
    if (!company) throw new Error("Aucune information sur le restaurant.");

    // 4️⃣ Print logo
    if (company.logoUrl) {
      const logoPath = path.join(
        __dirname,
        "../uploads/company/logo/",
        path.basename(company.logoUrl)
      );
      if (fs.existsSync(logoPath)) {
        const resized = path.join(
          __dirname,
          "../uploads/company/logo/resized-logo.png"
        );
        await sharp(logoPath)
          .resize({ width: 300 })
          .toFormat("png")
          .toFile(resized);
        printer.alignCenter();
        await printer.printImage(resized);
        printer.newLine();
      }
    }

    // 5️⃣ Header
    printer.alignCenter();
    printer.bold(true);
    printer.println(company.name);
    if (company.email) printer.println(company.email);
    if (company.phone) printer.println(company.phone);
    printer.drawLine();

    printer.println("REÇU CLIENT");
    printer.drawLine();

    // 6️⃣ Sale info
    printer.alignLeft();
    printer.println(
      `Date : ${new Date(sale.createdAt).toLocaleString("fr-FR")}`
    );
    printer.println(`Serveur : ${sale.attendant?.name || "N/A"}`);
    printer.println(`Table : ${sale.table?.number || "N/A"}`);
    printer.println(`Mode de paiement : ${sale.paymentMethod || "CASH"}`);
    printer.drawLine();

    // 7️⃣ Items
    printer.bold(true);
    printer.println("Article           Qty    PU        Total");
    printer.bold(false);
    printer.drawLine();

    sale.items.forEach((item) => {
      if (!item?.item?.name) return;
      const name =
        item.item.name.length > 15
          ? item.item.name.substring(0, 15) + "."
          : item.item.name.padEnd(16, " ");
      const qty = String(item.quantity).padStart(3, " ");
      const pu = formatCurrency(item.price).padStart(10, " ");
      const total = formatCurrency(item.total).padStart(10, " ");
      printer.println(`${name} ${qty} ${pu} ${total}`);
    });

    printer.drawLine();
    printer.alignRight();
    printer.bold(true);
    printer.println(`TOTAL   : ${formatCurrency(sale.totalAmount)}`);
    printer.println(`REÇU    : ${formatCurrency(sale.receivedAmount)}`);
    printer.println(`RENDU   : ${formatCurrency(sale.change)}`);
    printer.bold(false);

    printer.alignCenter();
    printer.drawLine();
    printer.println("Merci pour votre visite !");
    printer.cut();

    await printer.execute();
  } catch (error) {
    console.error("Erreur impression reçu :", error);
  }
};

const printCloseDayReport = async (closeDay) => {
  try {
    // === PRINTER CONFIG ===
    let printerConfig;
    try {
      printerConfig = await defaultPrinter();
    } catch {
      printerConfig = await prisma.printer.findFirst({
        where: { name: "Bar Printer" },
      });
      if (!printerConfig)
        throw new Error("No default printer or 'Bar Printer' found.");
    }

    const printer = await initPrinter(printerConfig);
    if (!(await printer.isPrinterConnected()))
      throw new Error("Printer not connected.");

    // === COMPANY INFO ===
    const company = await prisma.restaurant.findFirst();
    if (!company) throw new Error("No restaurant info found.");

    // === LOGO ===
    if (company.logoUrl) {
      const logoPath = path.join(
        __dirname,
        "../uploads/company/logo/",
        path.basename(company.logoUrl)
      );
      if (fs.existsSync(logoPath)) {
        const resized = path.join(
          __dirname,
          "../uploads/company/logo/resized-logo.png"
        );
        await sharp(logoPath).resize({ width: 300 }).toFile(resized);
        printer.alignCenter();
        await printer.printImage(resized);
        printer.newLine();
      }
    }

    // === HEADER ===
    printer.alignCenter();
    printer.bold(true);
    printer.println(company.name.toUpperCase());
    printer.bold(false);
    if (company.email) printer.println(company.email);
    if (company.phoneNumber) printer.println(company.phoneNumber);
    printer.drawLine();

    printer.alignLeft();
    printer.println("=== RAPPORT JOURNALIER ===");
    printer.println(`Date: ${new Date(closeDay.date).toLocaleDateString()}`);
    printer.println(`Caissier: ${closeDay.cashierName}`);
    printer.drawLine();

    // === PAYMENT SUMMARY ===
    printer.println("RAPPORT DE CAISSE");
    printer.drawLine();
    // if (closeDay.paymentSummary?.actual) {
    //   for (const [method, amount] of Object.entries(
    //     closeDay.paymentSummary.actual
    //   )) {
    //     // const declared = closeDay.paymentSummary.declared?.[method] || 0;
    //     printJustified(
    //       printer,
    //       method,
    //       `${formatCurrency(amount)}`
    //     );
    //   }
    // }

    printJustified(
      printer,
      "FACTURES SIGNEES",
      formatCurrency(closeDay.signedBills)
    );
    printJustified(printer, "REDUCTIONS", formatCurrency(closeDay.discounts));
    printJustified(
      printer,
      "ANNULATIONS",
      formatCurrency(closeDay.cancellations)
    );
    printJustified(printer, "DEPENSES", formatCurrency(closeDay.expenses));
        printJustified(
      printer,
      "TOTAL VENTES",
      formatCurrency(closeDay.totalSales)
    );
    printer.drawLine();

    // === STATUS ===
    printer.println("STATUT DE CAISSE");
    printer.drawLine();
    printJustified(printer, "ETAT", closeDay.status);
    printJustified(
      printer,
      "DIFFERENCE",
      formatCurrency(closeDay.totalDifference)
    );
    printJustified(
      printer,
      "TOTAL VENTES",
      formatCurrency(closeDay.totalSales)
    );
    printJustified(
      printer,
      "ENCAISSE",
      formatCurrency(closeDay.totalCollections)
    );
    printer.drawLine();

    // === SALES BY ATTENDANT ===
    if (
      closeDay.salesByAttendant &&
      Object.keys(closeDay.salesByAttendant).length > 0
    ) {
      printer.println("VENTES PAR SERVEUR");
      printer.drawLine();
      for (const [attendantName, total] of Object.entries(
        closeDay.salesByAttendant
      )) {
        printJustified(printer, attendantName, formatCurrency(total));
      }
      printer.drawLine();
    }

    // === SALES BY STORE ===
    if (
      closeDay.salesByStore &&
      Object.keys(closeDay.salesByStore).length > 0
    ) {
      printer.println("VENTES PAR MAGASIN");
      printer.drawLine();
      for (const [storeName, total] of Object.entries(closeDay.salesByStore)) {
        printJustified(printer, storeName, formatCurrency(total));
      }
      printer.drawLine();
    }

    // === ITEMS SOLD ===
    if (
      closeDay.itemsSummary &&
      Object.keys(closeDay.itemsSummary).length > 0
    ) {
      printer.println("ARTICLES VENDUS");
      printer.drawLine();
      for (const [itemName, summary] of Object.entries(closeDay.itemsSummary)) {
        printJustified(printer, itemName, summary.quantity);
      }
      printer.drawLine();
    }

    // === EXPENSES BY STORE ===
    if (
      closeDay.expensesByStore &&
      Object.keys(closeDay.expensesByStore).length > 0
    ) {
      printer.println("DEPENSES PAR MAGASIN");
      printer.drawLine();
      for (const [storeName, total] of Object.entries(
        closeDay.expensesByStore
      )) {
        printJustified(printer, storeName, formatCurrency(total));
      }
      printer.drawLine();
    }

    // === NOTES ===
    if (closeDay.notes) {
      printer.println("NOTES:");
      printer.println(closeDay.notes);
      printer.drawLine();
    }

    // === FOOTER ===
    printer.alignCenter();
    printer.println("=== FIN DU RAPPORT ===");
    printer.cut();

    const success = await printer.execute();
    if (!success) throw new Error("Printing failed");
  } catch (error) {
    console.error("Error printing close day report:", error.message);
  }
};

module.exports = {
  printTestPage,
  initPrinter,
  printOrder,
  printInvoice,
  printCancellation,
  printSignedBill,
  printReceipt,
  printCloseDayReport,
};

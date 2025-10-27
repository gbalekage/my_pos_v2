const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const createTables = async (req, res, next) => {
  try {
    const { count } = req.body;

    if (!count) {
      return next(
        new HttpError("Please enter the number of tables to create", 400)
      );
    }

    // Get the last table to continue numbering
    const lastTable = await prisma.table.findFirst({
      orderBy: { number: "desc" },
    });

    const lastNumber = lastTable ? lastTable.number : 0;

    // ✅ Use 'count' instead of 'length'
    const newTables = Array.from({ length: count }, (_, i) => ({
      number: lastNumber + i + 1,
      status: "AVAILABLE"
    }));

    const created = await prisma.table.createMany({
      data: newTables,
    });

    res.status(201).json({
      message: `${count} tables created starting from table number ${
        lastNumber + 1
      }`,
      created,
    });
  } catch (error) {
    console.error("error creating tables:", error);
    return next(new HttpError("Failed to create tables", 500));
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await prisma.table.findMany({
      include: { attendant: true, order: true },
      orderBy: { number: "asc" },
    });

    res.status(200).json({ tables });
  } catch (error) {
    console.error("error getting tables:", error);
    return next(new HttpError("Faild to get tables", 500));
  }
};

const getTableById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({
      where: { id },
      include: { attendant: true, order: true },
    });
    if (!table) {
      return next(new HttpError("Table not found", 404));
    }
  } catch (error) {
    console.error("Error geting the table");
    return next(new HttpError("Faild to get the table", 500));
  }
};

module.exports = {
  createTables,
  getTables,
  getTableById,
};

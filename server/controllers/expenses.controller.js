const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const addExpenses = async (req, res, next) => {
  try {
    const { title, amount } = req.body;
    const { storeId } = req.params;

    if (!title || !amount || !storeId) {
      return next(
        new HttpError("Title, amount and store ID are required.", 400)
      );
    }

    const newExpense = await prisma.expences.create({
      data: {
        title,
        amount: parseFloat(amount),
        storeId: storeId,
        createdBy: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      expense: newExpense,
    });
  } catch (error) {
    console.log("Failed adding expenses", error);
    return next(new HttpError("Failed to add expenses", 500));
  }
};

const deleteExpenses = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    const expnese = await prisma.expences.findUnique({
      where: { id: expenseId },
    });
    if (!expnese) {
      return next(new HttpError("User not found", 404));
    }

    await prisma.expences.delete({ where: { id } });

    res.status(200).json({
      message: "Expense deleted",
    });
  } catch (error) {
    console.log("Error deleting the user", error);
    return next(new HttpError("Error deleting expense"));
  }
};

module.exports = {
  addExpenses,
  deleteExpenses,
};

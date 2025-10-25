const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const addCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return next(new HttpError("Fill in all fields", 400));
    }

    const category = await prisma.category.findUnique({
      where: { name },
    });
    if (category) {
      return next(
        new HttpError("You can't use that name, it has already been taken", 400)
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json({
      message: "Category Added",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating the store", error);
    return next(new HttpError("Server error", 500));
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json({ categories });
  } catch (error) {
    console.log("Error geting categories", error);
    return next(new HttpError("Server error", 500));
  }
};

const getCategryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return next(new HttpError("Store not found", 404));
    }

    res.status(200).json({ category });
  } catch (error) {
    console.error("Error fetching categories", error);
    return next(
      new HttpError("Error fetching categories, please try again", 500)
    );
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const data = {};

    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data,
    });

    res.status(200).json({
      message: "Category updated successfully",
      store: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating the category", error);
    return next(new HttpError("Server category", 500));
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting Category", error);
    return next(
      new HttpError("Error deleting Category, please try again", 500)
    );
  }
};

module.exports = {
  addCategory,
  getCategories,
  getCategryById,
  updateCategory,
  deleteCategory,
};

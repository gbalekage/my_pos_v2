const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");

const addClient = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return next(new HttpError("Please provide all required fields", 400));
    }

    const existingClient = await prisma.client.findFirst({
      where: {
        email: email,
      },
    });

    if (existingClient) {
      return next(new HttpError("Client with this email already exists", 409));
    }

    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        phone,
      },
    });

    res.status(201).json({ client: newClient });
  } catch (error) {
    console.error("Error in create client", error);
    return next(new HttpError("Creating client failed, please try again", 500));
  }
};

const getClients = async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      include: { SignedBills: true },
    });
    res.status(200).json({ clients });
  } catch (error) {
    console.error("Error in get clients", error);
    return next(
      new HttpError("Fetching clients failed, please try again", 500)
    );
  }
};

const getClientById = async (req, res, next) => {
  try {
    const clientId = parseInt(req.params.id);
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return next(new HttpError("Client not found", 404));
    }

    res.status(200).json({ client });
  } catch (error) {
    console.error("Error in get client by ID", error);
    return next(new HttpError("Fetching client failed, please try again", 500));
  }
};

const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: { name, email, phone },
    });

    res.status(200).json({ client: updatedClient });
  } catch (error) {
    console.error("Error in update client", error);
    return next(new HttpError("Updating client failed, please try again", 500));
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: { id },
    });

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error in delete client", error);
    return next(new HttpError("Deleting client failed, please try again", 500));
  }
};

module.exports = {
  addClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};

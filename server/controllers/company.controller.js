const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const HttpError = require("../models/error.model");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
];
const MAX_LOGO_SIZE = process.env.MAX_LOGO_SIZE
  ? parseInt(process.env.MAX_LOGO_SIZE, 10)
  : 2 * 1024 * 1024;

const safeLogError = (label, err) => {
  try {
    const msg = err && err.message ? err.message : String(err);
    if (process.env.NODE_ENV === "development") {
      console.error(label, msg, err && err.stack ? err.stack : "");
    } else {
      console.error(label, msg);
    }
  } catch (e) {
    console.error(label, "(error while logging)");
  }
};

const createCompany = async (req, res, next) => {
  try {
    const { name, address, email, phoneNumber } = req.body;

    if (!name || !address || !email || !phoneNumber) {
      return next(new HttpError("All fields including logo are required", 400));
    }

    if (!req.files || !req.files.logo) {
      return next(new HttpError("Logo file is required", 400));
    }

    const logoFile = req.files.logo;
    if (Array.isArray(logoFile)) {
      return next(
        new HttpError("Invalid logo file: multiple files provided", 400)
      );
    }

    if (!ALLOWED_LOGO_TYPES.includes(logoFile.mimetype)) {
      return next(
        new HttpError(
          `Invalid logo file: unsupported type ${logoFile.mimetype}`,
          400
        )
      );
    }

    if (typeof logoFile.size === "number" && logoFile.size > MAX_LOGO_SIZE) {
      return next(
        new HttpError(
          `Invalid logo file: file too large (max ${MAX_LOGO_SIZE} bytes)`,
          400
        )
      );
    }

    const existingCompany = await prisma.restaurant.findUnique({
      where: { email },
    });

    if (existingCompany) {
      return next(new HttpError("Company with this email already exists", 409));
    }

    const ext = path.extname(logoFile.name || "") || "";
    const fileName = uuidv4() + ext;
    const uploadsDir = path.join(__dirname, "../uploads/company/logo");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uploadPath = path.join(uploadsDir, fileName);
    await logoFile.mv(uploadPath);

    const newCompany = await prisma.restaurant.create({
      data: {
        name,
        address,
        email,
        phoneNumber,
        logoUrl: `/uploads/company/logo/${fileName}`,
      },
    });

    res.status(201).json({ company: newCompany });
  } catch (error) {
    safeLogError("Error in create company:", error);
    return next(
      new HttpError("Creating company failed, please try again", 500)
    );
  }
};

const getCompany = async (req, res, next) => {
  try {
    const company = await prisma.restaurant.findFirst();
    if (!company) {
      return res
        .status(404)
        .json({
          message: "Company not found, Please create a company to continue",
        });
    }
    res.json({ company });
  } catch (error) {
    safeLogError("Error in get company:", error);
    return next(
      new HttpError("Fetching company failed, please try again", 500)
    );
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const companyId = req.params.id;

    const existingCompany = await prisma.restaurant.findUnique({
      where: { id: companyId },
    });
    if (!existingCompany) {
      return next(new HttpError("Company not found", 404));
    }

    const fieldsToUpdate = {};
    const allowedFields = ["name", "address", "email", "phoneNumber"];

    // Reject client supplied logoUrl - logo must be uploaded as a file
    if (req.body.logoUrl) {
      // ignore or reject - choose to reject to be explicit
      return next(
        new HttpError(
          "Do not provide logoUrl directly; upload a logo file instead",
          400
        )
      );
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    // Handle logo upload if present
    if (req.files && req.files.logo) {
      const logoFile = req.files.logo;
      if (Array.isArray(logoFile)) {
        return next(
          new HttpError("Invalid logo file: multiple files provided", 400)
        );
      }
      if (!ALLOWED_LOGO_TYPES.includes(logoFile.mimetype)) {
        return next(
          new HttpError(
            `Invalid logo file: unsupported type ${logoFile.mimetype}`,
            400
          )
        );
      }
      if (typeof logoFile.size === "number" && logoFile.size > MAX_LOGO_SIZE) {
        return next(
          new HttpError(
            `Invalid logo file: file too large (max ${MAX_LOGO_SIZE} bytes)`,
            400
          )
        );
      }

      const ext = path.extname(logoFile.name || "") || "";
      const fileName = uuidv4() + ext;
      const uploadsDir = path.join(__dirname, "../uploads/company/logo");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const uploadPath = path.join(uploadsDir, fileName);
      try {
        await logoFile.mv(uploadPath);
        fieldsToUpdate.logoUrl = `/uploads/company/logo/${fileName}`;

        // attempt to remove old logo file if it exists and is inside our uploads
        try {
          const oldLogoPath = existingCompany.logoUrl
            ? path.join(__dirname, "..", existingCompany.logoUrl)
            : null;
          if (
            oldLogoPath &&
            oldLogoPath.startsWith(path.join(__dirname, "..", "uploads")) &&
            fs.existsSync(oldLogoPath)
          ) {
            fs.unlinkSync(oldLogoPath);
          }
        } catch (remErr) {
          // log and continue; non-fatal
          safeLogError("Error removing old logo:", remErr);
        }
      } catch (mvErr) {
        safeLogError("Error saving uploaded logo:", mvErr);
        return next(new HttpError("Failed to save uploaded logo", 500));
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return next(new HttpError("No fields provided to update", 400));
    }

    // If email will be updated, ensure it's not already used by another company
    if (fieldsToUpdate.email) {
      const dup = await prisma.restaurant.findFirst({
        where: { email: fieldsToUpdate.email, NOT: { id: companyId } },
      });
      if (dup) {
        return next(
          new HttpError("Company with this email already exists", 409)
        );
      }
    }

    const updatedCompany = await prisma.restaurant.update({
      where: { id: companyId },
      data: fieldsToUpdate,
    });

    res.json({ company: updatedCompany });
  } catch (error) {
    console.log("Error in update company:", error);
    return next(
      new HttpError("Updating company failed, please try again", 500)
    );
  }
};

const uploadCompanyLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new HttpError("Company ID is required", 400));
    }

    if (!req.files || !req.files.logo) {
      return next(new HttpError("Logo file is required", 400));
    }

    const logoFile = req.files.logo;
    if (Array.isArray(logoFile)) {
      return next(new HttpError("Only one logo file allowed", 400));
    }

    if (!ALLOWED_LOGO_TYPES.includes(logoFile.mimetype)) {
      return next(
        new HttpError(`Unsupported logo type: ${logoFile.mimetype}`, 400)
      );
    }

    if (typeof logoFile.size === "number" && logoFile.size > MAX_LOGO_SIZE) {
      return next(
        new HttpError(`Logo file too large (max ${MAX_LOGO_SIZE} bytes)`, 400)
      );
    }

    const ext = path.extname(logoFile.name || "") || "";
    const fileName = uuidv4() + ext;
    const uploadsDir = path.join(__dirname, "../uploads/company/logo");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uploadPath = path.join(uploadsDir, fileName);
    await logoFile.mv(uploadPath);

    const updatedCompany = await prisma.restaurant.update({
      where: { id },
      data: { logoUrl: `/uploads/company/logo/${fileName}` },
    });

    res.status(200).json({ company: updatedCompany });
  } catch (error) {
    safeLogError("Error uploading company logo:", error);
    return next(
      new HttpError("Uploading logo failed, please try again", 500)
    );
  }
};


module.exports = { createCompany, getCompany, updateCompany, uploadCompanyLogo };

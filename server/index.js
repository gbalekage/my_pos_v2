const express = require("express");
const cors = require("cors");
require("dotenv").config();
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const companyRoutes = require("./routes/company.routes");
const printerRoutes = require("./routes/printer.routes");
const storesRoutes = require("./routes/store.route");
const categoryRoutes = require("./routes/category.route");
const itemsRoutes = require("./routes/item.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const tablesRoutes = require("./routes/table.route");
const ordersRoutes = require("./routes/order.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const fileUpload = require("express-fileupload");
const path = require("path");
const { checkSubscriptionDurations } = require("./helpers/subscription.helper");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(express.json());
app.use(fileUpload());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

checkSubscriptionDurations()
  .then(() => console.log("Subscription check completed"))
  .catch((err) => console.error("Error checking subscriptions:", err));

// routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/printers", printerRoutes);
app.use("/api/stores", storesRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/tables", tablesRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is online" });
});

app.get("/", (req, res) => {
  res.send("Welcome to the POS System API");
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

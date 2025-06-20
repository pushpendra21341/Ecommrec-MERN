const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./middleware/error");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

// Body parsers
app.use(express.json({ limit: "10mb" })); // Accept JSON payloads
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" })); // For form-urlencoded payloads

// ❌ Removed express-fileupload

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ Change in production
    credentials: true,
  })
);

// Static folder (optional for deployment)
app.use(express.static(path.join(__dirname, "public")));

// Route Imports
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const adminLogRoutes = require("./routes/adminLogRoute");
const userLogRoutes = require("./routes/userLogRoutes");


// Mount routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", adminLogRoutes);
app.use("/api/v1/userlog", userLogRoutes);

// Error handling middleware
app.use(errorMiddleware);

module.exports = app;

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/senti";
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB", MONGODB_URI))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import routes
const dataRoutes = require("./routes/data");
const priceFeedsRoutes = require("./routes/priceFeeds");
const rsiSignalsRoutes = require("./routes/rsiSignals");
const fearGreedRoutes = require("./routes/fearGreed");
const tradingHistoryRoutes = require("./routes/tradingHistory");

// Routes
app.use("/api/data", dataRoutes);
app.use("/api/price-feeds", priceFeedsRoutes);
app.use("/api/rsi-signals", rsiSignalsRoutes);
app.use("/api/fear-greed", fearGreedRoutes);
app.use("/api/trading-history", tradingHistoryRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Senti Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      data: "/api/data",
      priceFeeds: "/api/price-feeds",
      rsiSignals: "/api/rsi-signals",
      fearGreed: "/api/fear-greed",
      tradingHistory: "/api/trading-history",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

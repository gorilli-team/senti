const express = require("express");
const router = express.Router();
const TradingHistoryController = require("../controllers/tradingHistoryController");

// GET trading statistics (must come before /:id route)
router.get("/stats", TradingHistoryController.getTradingStats);

// GET trades by pair (must come before /:id route)
router.get("/pair/:pair", TradingHistoryController.getTradesByPair);

// GET trades within date range (must come before /:id route)
router.get(
  "/range/:startDate/:endDate",
  TradingHistoryController.getTradesByDateRange
);

// GET all executed trades with pagination
router.get("/", TradingHistoryController.getAllTrades);

// GET trade by ID (must come last)
router.get("/:id", TradingHistoryController.getTradeById);

module.exports = router;

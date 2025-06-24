const express = require("express");
const router = express.Router();
const PriceFeedsController = require("../controllers/priceFeedsController");

// GET all price feeds with pagination
router.get("/", PriceFeedsController.getAllPriceFeeds);

// GET price feeds by pair
router.get("/pair/:pair", PriceFeedsController.getPriceFeedsByPair);

// GET current price for a specific pair
router.get("/current/:pair", PriceFeedsController.getCurrentPrice);

// GET latest price feeds
router.get("/latest/:limit?", PriceFeedsController.getLatestPriceFeeds);

// GET price feeds within date range
router.get(
  "/range/:startDate/:endDate",
  PriceFeedsController.getPriceFeedsByDateRange
);

// GET price feed statistics
router.get("/stats", PriceFeedsController.getPriceFeedStats);

// POST new price feed
router.post("/", PriceFeedsController.createPriceFeed);

// Debug endpoint to check RSI signals
router.get("/debug/rsi-signals", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const db = mongoose.connection.db;

    const rsiSignals = await db
      .collection("rsi_signals")
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const priceFeeds = await db
      .collection("price_feeds")
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    res.json({
      rsiSignalsCount: await db.collection("rsi_signals").countDocuments(),
      priceFeedsCount: await db.collection("price_feeds").countDocuments(),
      latestRsiSignals: rsiSignals,
      latestPriceFeeds: priceFeeds,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

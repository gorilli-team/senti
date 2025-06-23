const express = require("express");
const router = express.Router();
const MarketData = require("../models/MarketData");

// GET /api/market-data - Get all market data with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const {
      asset,
      source,
      pair = "USDT",
      timeRange = "24h",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Build query filters
    if (asset) query.asset = asset.toUpperCase();
    if (source) query.source = source;
    query.pair = pair.toUpperCase();

    // Add time range filter
    if (timeRange) {
      const now = new Date();
      let startTime;

      switch (timeRange) {
        case "1h":
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "24h":
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      query.timestamp = { $gte: startTime };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [marketData, total] = await Promise.all([
      MarketData.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v"),
      MarketData.countDocuments(query),
    ]);

    res.json({
      data: marketData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching market data:", error);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// GET /api/market-data/latest/:asset - Get latest market data for an asset
router.get("/latest/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const { pair = "USDT" } = req.query;

    const latestData = await MarketData.getLatestPrice(asset, pair);

    if (!latestData) {
      return res.status(404).json({
        error: `No market data found for ${asset}/${pair}`,
      });
    }

    res.json({
      asset: asset.toUpperCase(),
      pair: pair.toUpperCase(),
      data: latestData,
    });
  } catch (error) {
    console.error("Error fetching latest market data:", error);
    res.status(500).json({ error: "Failed to fetch latest market data" });
  }
});

// GET /api/market-data/history/:asset - Get price history for an asset
router.get("/history/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const { pair = "USDT", timeRange = "24h" } = req.query;

    const history = await MarketData.getPriceHistory(asset, pair, timeRange);

    res.json({
      asset: asset.toUpperCase(),
      pair: pair.toUpperCase(),
      timeRange,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// GET /api/market-data/stats/:asset - Get market statistics for an asset
router.get("/stats/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const { pair = "USDT", timeRange = "24h" } = req.query;

    const stats = await MarketData.getMarketStats(asset, pair, timeRange);

    res.json({
      asset: asset.toUpperCase(),
      pair: pair.toUpperCase(),
      timeRange,
      stats,
    });
  } catch (error) {
    console.error("Error fetching market stats:", error);
    res.status(500).json({ error: "Failed to fetch market statistics" });
  }
});

// POST /api/market-data - Create new market data entry
router.post("/", async (req, res) => {
  try {
    const {
      asset,
      price,
      volume,
      market_cap,
      change_24h,
      change_percentage_24h,
      high_24h,
      low_24h,
      open_24h,
      source,
      pair = "USDT",
    } = req.body;

    // Validate required fields
    if (!asset || price === undefined || volume === undefined || !source) {
      return res.status(400).json({
        error: "Missing required fields: asset, price, volume, source",
      });
    }

    const marketData = new MarketData({
      asset: asset.toUpperCase(),
      price: parseFloat(price),
      volume: parseFloat(volume),
      market_cap: market_cap ? parseFloat(market_cap) : undefined,
      change_24h: change_24h ? parseFloat(change_24h) : undefined,
      change_percentage_24h: change_percentage_24h
        ? parseFloat(change_percentage_24h)
        : undefined,
      high_24h: high_24h ? parseFloat(high_24h) : undefined,
      low_24h: low_24h ? parseFloat(low_24h) : undefined,
      open_24h: open_24h ? parseFloat(open_24h) : undefined,
      source,
      pair: pair.toUpperCase(),
    });

    const savedMarketData = await marketData.save();

    res.status(201).json({
      message: "Market data created successfully",
      data: savedMarketData,
    });
  } catch (error) {
    console.error("Error creating market data:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create market data" });
  }
});

// GET /api/market-data/sources - Get available market data sources
router.get("/sources", async (req, res) => {
  try {
    const sources = await MarketData.distinct("source");
    res.json({ sources });
  } catch (error) {
    console.error("Error fetching sources:", error);
    res.status(500).json({ error: "Failed to fetch sources" });
  }
});

// GET /api/market-data/assets - Get available assets
router.get("/assets", async (req, res) => {
  try {
    const assets = await MarketData.distinct("asset");
    res.json({ assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

// GET /api/market-data/pairs - Get available trading pairs
router.get("/pairs", async (req, res) => {
  try {
    const pairs = await MarketData.distinct("pair");
    res.json({ pairs });
  } catch (error) {
    console.error("Error fetching pairs:", error);
    res.status(500).json({ error: "Failed to fetch pairs" });
  }
});

module.exports = router;

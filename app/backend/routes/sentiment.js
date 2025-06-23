const express = require("express");
const router = express.Router();
const Sentiment = require("../models/Sentiment");

// GET /api/sentiment - Get all sentiment data with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const {
      asset,
      source,
      timeRange = "24h",
      page = 1,
      limit = 50,
      minSentiment,
      maxSentiment,
    } = req.query;

    const query = {};

    // Build query filters
    if (asset) query.asset = asset.toUpperCase();
    if (source) query.source = source;
    if (minSentiment !== undefined || maxSentiment !== undefined) {
      query.sentiment_score = {};
      if (minSentiment !== undefined)
        query.sentiment_score.$gte = parseFloat(minSentiment);
      if (maxSentiment !== undefined)
        query.sentiment_score.$lte = parseFloat(maxSentiment);
    }

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

    const [sentiments, total] = await Promise.all([
      Sentiment.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v"),
      Sentiment.countDocuments(query),
    ]);

    res.json({
      data: sentiments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching sentiment data:", error);
    res.status(500).json({ error: "Failed to fetch sentiment data" });
  }
});

// GET /api/sentiment/stats/:asset - Get sentiment statistics for an asset
router.get("/stats/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const { timeRange = "24h" } = req.query;

    const stats = await Sentiment.getSentimentStats(asset, timeRange);

    res.json({
      asset: asset.toUpperCase(),
      timeRange,
      stats,
    });
  } catch (error) {
    console.error("Error fetching sentiment stats:", error);
    res.status(500).json({ error: "Failed to fetch sentiment statistics" });
  }
});

// GET /api/sentiment/latest/:asset - Get latest sentiment data for an asset
router.get("/latest/:asset", async (req, res) => {
  try {
    const { asset } = req.params;
    const { limit = 10 } = req.query;

    const sentiments = await Sentiment.find({ asset: asset.toUpperCase() })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select("-__v");

    res.json({
      asset: asset.toUpperCase(),
      data: sentiments,
    });
  } catch (error) {
    console.error("Error fetching latest sentiment data:", error);
    res.status(500).json({ error: "Failed to fetch latest sentiment data" });
  }
});

// POST /api/sentiment - Create new sentiment entry
router.post("/", async (req, res) => {
  try {
    const {
      source,
      text,
      sentiment_score,
      confidence,
      keywords,
      asset,
      user_id,
      metadata,
    } = req.body;

    // Validate required fields
    if (
      !source ||
      !text ||
      sentiment_score === undefined ||
      !confidence ||
      !asset
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: source, text, sentiment_score, confidence, asset",
      });
    }

    const sentiment = new Sentiment({
      source,
      text,
      sentiment_score: parseFloat(sentiment_score),
      confidence: parseFloat(confidence),
      keywords: keywords || [],
      asset: asset.toUpperCase(),
      user_id,
      metadata: metadata || {},
    });

    const savedSentiment = await sentiment.save();

    res.status(201).json({
      message: "Sentiment data created successfully",
      data: savedSentiment,
    });
  } catch (error) {
    console.error("Error creating sentiment data:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create sentiment data" });
  }
});

// GET /api/sentiment/sources - Get available sentiment sources
router.get("/sources", async (req, res) => {
  try {
    const sources = await Sentiment.distinct("source");
    res.json({ sources });
  } catch (error) {
    console.error("Error fetching sources:", error);
    res.status(500).json({ error: "Failed to fetch sources" });
  }
});

// GET /api/sentiment/assets - Get available assets
router.get("/assets", async (req, res) => {
  try {
    const assets = await Sentiment.distinct("asset");
    res.json({ assets });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

module.exports = router;

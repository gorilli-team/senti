const mongoose = require("mongoose");

class PriceFeedsController {
  // GET all price feeds with pagination
  static async getAllPriceFeeds(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const sortBy = req.query.sortBy || "timestamp";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

      const filter = {};
      if (req.query.pair) filter.pair = req.query.pair;
      if (req.query.source) filter.source = req.query.source;

      const collection = mongoose.connection.db.collection("price_feeds");

      const data = await collection
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await collection.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET price feeds by pair
  static async getPriceFeedsByPair(req, res) {
    try {
      const { pair } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const collection = mongoose.connection.db.collection("price_feeds");

      const data = await collection
        .find({ pair })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      res.json({
        pair,
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET latest price feeds
  static async getLatestPriceFeeds(req, res) {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const { pair } = req.query;

      let query = {};
      if (pair) query.pair = pair;

      const collection = mongoose.connection.db.collection("price_feeds");

      const data = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      res.json({
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET price feeds within date range
  static async getPriceFeedsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.params;
      const { pair } = req.query;

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      let query = {
        timestamp: {
          $gte: start,
          $lte: end,
        },
      };

      if (pair) query.pair = pair;

      const collection = mongoose.connection.db.collection("price_feeds");

      const data = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();

      res.json({
        startDate,
        endDate,
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST new price feed
  static async createPriceFeed(req, res) {
    try {
      const collection = mongoose.connection.db.collection("price_feeds");
      const result = await collection.insertOne(req.body);

      const newPriceFeed = await collection.findOne({ _id: result.insertedId });
      res.status(201).json(newPriceFeed);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET price feed statistics
  static async getPriceFeedStats(req, res) {
    try {
      const collection = mongoose.connection.db.collection("price_feeds");

      const stats = await collection
        .aggregate([
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              uniquePairs: { $addToSet: "$pair" },
              latestTimestamp: { $max: "$timestamp" },
              earliestTimestamp: { $min: "$timestamp" },
            },
          },
        ])
        .toArray();

      const pairStats = await collection
        .aggregate([
          {
            $group: {
              _id: "$pair",
              count: { $sum: 1 },
              latestPrice: { $last: "$price" },
              latestTimestamp: { $last: "$timestamp" },
              decimals: { $last: "$decimals" },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray();

      // Convert price strings to readable format
      const formattedPairStats = pairStats.map((stat) => ({
        ...stat,
        latestPriceReadable: stat.latestPrice
          ? (
              parseInt(stat.latestPrice) / Math.pow(10, stat.decimals || 18)
            ).toFixed(2)
          : null,
      }));

      res.json({
        overall: stats[0] || {},
        byPair: formattedPairStats,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET current price for a specific pair
  static async getCurrentPrice(req, res) {
    try {
      const { pair } = req.params;

      const collection = mongoose.connection.db.collection("price_feeds");

      const latestPrice = await collection.findOne(
        { pair },
        { sort: { timestamp: -1 } }
      );

      if (!latestPrice) {
        return res
          .status(404)
          .json({ error: "Price feed not found for this pair" });
      }

      // Convert price to readable format
      const priceReadable = latestPrice.price
        ? (
            parseInt(latestPrice.price) /
            Math.pow(10, latestPrice.decimals || 18)
          ).toFixed(2)
        : null;

      res.json({
        pair: latestPrice.pair,
        price: latestPrice.price,
        priceReadable,
        decimals: latestPrice.decimals,
        timestamp: latestPrice.timestamp,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PriceFeedsController;

const mongoose = require("mongoose");

class RsiSignalsController {
  // GET all RSI signals with pagination
  static async getAllRsiSignals(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const sortBy = req.query.sortBy || "timestamp";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

      const filter = {};
      if (req.query.pair) filter.pair = req.query.pair;
      if (req.query.rsi_signal !== undefined)
        filter.rsi_signal = parseInt(req.query.rsi_signal);
      if (req.query.period) filter.period = req.query.period; // 14, 21, etc.

      const collection = mongoose.connection.db.collection("rsi_signals");

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

  // GET RSI signals by pair
  static async getRsiSignalsByPair(req, res) {
    try {
      const { pair } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const collection = mongoose.connection.db.collection("rsi_signals");

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

  // GET latest RSI signals
  static async getLatestRsiSignals(req, res) {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const { pair, rsi_signal } = req.query;

      let query = {};
      if (pair) query.pair = pair;
      if (rsi_signal !== undefined) query.rsi_signal = parseInt(rsi_signal);

      const collection = mongoose.connection.db.collection("rsi_signals");

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

  // GET RSI signals within date range
  static async getRsiSignalsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.params;
      const { pair, rsi_signal } = req.query;

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
      if (rsi_signal !== undefined) query.rsi_signal = parseInt(rsi_signal);

      const collection = mongoose.connection.db.collection("rsi_signals");

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

  // GET RSI signals by signal type (0, 1, -1)
  static async getRsiSignalsByType(req, res) {
    try {
      const { signal } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const { pair } = req.query;

      // Convert signal string to number
      let signalValue;
      switch (signal.toLowerCase()) {
        case "buy":
        case "1":
          signalValue = 1;
          break;
        case "sell":
        case "-1":
          signalValue = -1;
          break;
        case "hold":
        case "neutral":
        case "0":
          signalValue = 0;
          break;
        default:
          return res
            .status(400)
            .json({
              error: "Invalid signal type. Use: buy/1, sell/-1, hold/0/neutral",
            });
      }

      let query = { rsi_signal: signalValue };
      if (pair) query.pair = pair;

      const collection = mongoose.connection.db.collection("rsi_signals");

      const data = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      res.json({
        signal: signal,
        signalValue: signalValue,
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST new RSI signal
  static async createRsiSignal(req, res) {
    try {
      const collection = mongoose.connection.db.collection("rsi_signals");
      const result = await collection.insertOne(req.body);

      const newRsiSignal = await collection.findOne({ _id: result.insertedId });
      res.status(201).json(newRsiSignal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET RSI signal statistics
  static async getRsiSignalStats(req, res) {
    try {
      const collection = mongoose.connection.db.collection("rsi_signals");

      const stats = await collection
        .aggregate([
          {
            $group: {
              _id: null,
              totalCount: { $sum: 1 },
              uniquePairs: { $addToSet: "$pair" },
              latestTimestamp: { $max: "$timestamp" },
              earliestTimestamp: { $min: "$timestamp" },
              avgRsi: { $avg: "$rsi" },
              minRsi: { $min: "$rsi" },
              maxRsi: { $max: "$rsi" },
            },
          },
        ])
        .toArray();

      const signalStats = await collection
        .aggregate([
          {
            $group: {
              _id: "$rsi_signal",
              count: { $sum: 1 },
              pairs: { $addToSet: "$pair" },
              avgRsi: { $avg: "$rsi" },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

      const pairStats = await collection
        .aggregate([
          {
            $group: {
              _id: "$pair",
              count: { $sum: 1 },
              signals: { $addToSet: "$rsi_signal" },
              latestRsi: { $last: "$rsi" },
              latestPrice: { $last: "$price" },
              latestTimestamp: { $last: "$timestamp" },
              avgRsi: { $avg: "$rsi" },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray();

      // Add signal type labels
      const signalLabels = {
        "-1": "sell",
        0: "hold",
        1: "buy",
      };

      const formattedSignalStats = signalStats.map((stat) => ({
        ...stat,
        signalType: signalLabels[stat._id] || "unknown",
      }));

      res.json({
        overall: stats[0] || {},
        bySignal: formattedSignalStats,
        byPair: pairStats,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET current RSI for a specific pair
  static async getCurrentRsi(req, res) {
    try {
      const { pair } = req.params;

      const collection = mongoose.connection.db.collection("rsi_signals");

      const latestRsi = await collection.findOne(
        { pair },
        { sort: { timestamp: -1 } }
      );

      if (!latestRsi) {
        return res
          .status(404)
          .json({ error: "RSI signal not found for this pair" });
      }

      // Determine signal type
      const signalLabels = {
        "-1": "sell",
        0: "hold",
        1: "buy",
      };

      res.json({
        pair: latestRsi.pair,
        rsi: latestRsi.rsi,
        rsi_signal: latestRsi.rsi_signal,
        signalType: signalLabels[latestRsi.rsi_signal] || "unknown",
        price: latestRsi.price,
        timestamp: latestRsi.timestamp,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = RsiSignalsController;

const Data = require("../models/Data");

class DataController {
  // GET all data with pagination
  static async getAllData(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const sortBy = req.query.sortBy || "timestamp";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

      const filter = {};
      if (req.query.symbol) filter.symbol = req.query.symbol;
      if (req.query.source) filter["metadata.source"] = req.query.source;

      const data = await Data.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Data.countDocuments(filter);
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

  // GET data by ID
  static async getDataById(req, res) {
    try {
      const data = await Data.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ error: "Data not found" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET data by symbol
  static async getDataBySymbol(req, res) {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const data = await Data.find({ symbol })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      res.json({
        symbol,
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET latest data
  static async getLatestData(req, res) {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const { symbol } = req.query;

      let query = {};
      if (symbol) query.symbol = symbol;

      const data = await Data.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      res.json({
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET data within date range
  static async getDataByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.params;
      const { symbol } = req.query;

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

      if (symbol) query.symbol = symbol;

      const data = await Data.find(query).sort({ timestamp: -1 }).lean();

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

  // GET aggregated data
  static async getAggregatedData(req, res) {
    try {
      const { period } = req.params;
      const { symbol } = req.query;

      if (!["1h", "1d", "1w", "1m"].includes(period)) {
        return res
          .status(400)
          .json({ error: "Invalid period. Use: 1h, 1d, 1w, 1m" });
      }

      const data = await Data.getAggregatedData(symbol, period);

      res.json({
        period,
        symbol: symbol || "all",
        count: data.length,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // POST new data
  static async createData(req, res) {
    try {
      const newData = new Data(req.body);
      const savedData = await newData.save();
      res.status(201).json(savedData);
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // PUT update data
  static async updateData(req, res) {
    try {
      const updatedData = await Data.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!updatedData) {
        return res.status(404).json({ error: "Data not found" });
      }

      res.json(updatedData);
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // DELETE data
  static async deleteData(req, res) {
    try {
      const deletedData = await Data.findByIdAndDelete(req.params.id);

      if (!deletedData) {
        return res.status(404).json({ error: "Data not found" });
      }

      res.json({ message: "Data deleted successfully", deletedData });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET statistics
  static async getStatistics(req, res) {
    try {
      const { symbol } = req.query;

      let matchStage = {};
      if (symbol) matchStage.symbol = symbol;

      const stats = await Data.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            avgPrice: { $avg: "$price" },
            avgSentiment: { $avg: "$sentiment" },
            avgFearGreed: { $avg: "$fearGreedIndex" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
            minSentiment: { $min: "$sentiment" },
            maxSentiment: { $max: "$sentiment" },
            latestTimestamp: { $max: "$timestamp" },
            earliestTimestamp: { $min: "$timestamp" },
          },
        },
      ]);

      const symbolCounts = await Data.aggregate([
        { $group: { _id: "$symbol", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      res.json({
        statistics: stats[0] || {},
        symbolDistribution: symbolCounts,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DataController;

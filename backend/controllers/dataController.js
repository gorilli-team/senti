const Data = require("../models/Data");
const mongoose = require("mongoose");

class DataController {
  // GET all data with pagination - combines price feeds and RSI signals
  static async getAllData(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const db = mongoose.connection.db;

      // Get price feeds
      const priceFeeds = await db
        .collection("price_feeds")
        .find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get RSI signals for the same time period
      const rsiSignals = await db
        .collection("rsi_signals")
        .find({})
        .sort({ timestamp: -1 })
        .toArray();

      // Create a map of RSI signals by pair and timestamp
      const rsiMap = new Map();
      rsiSignals.forEach((signal) => {
        const key = `${signal.pair}_${signal.timestamp}`;
        rsiMap.set(key, signal);
      });

      // Combine and format the data
      const combinedData = priceFeeds.map((priceFeed) => {
        const key = `${priceFeed.pair}_${priceFeed.timestamp}`;
        const rsiSignal = rsiMap.get(key);

        // Convert price from wei to normal format
        const price =
          parseFloat(priceFeed.price) / Math.pow(10, priceFeed.decimals);

        // Create sentiment based on RSI signal
        let sentiment = 0; // neutral
        if (rsiSignal) {
          if (rsiSignal.rsi_signal === 1) {
            sentiment = 0.3; // bullish
          } else if (rsiSignal.rsi_signal === -1) {
            sentiment = -0.3; // bearish
          }
        }

        // Create fear/greed index based on RSI
        let fearGreedIndex = 50; // neutral
        if (rsiSignal) {
          if (rsiSignal.rsi < 30) {
            fearGreedIndex = 20; // extreme fear
          } else if (rsiSignal.rsi < 40) {
            fearGreedIndex = 35; // fear
          } else if (rsiSignal.rsi > 70) {
            fearGreedIndex = 80; // extreme greed
          } else if (rsiSignal.rsi > 60) {
            fearGreedIndex = 65; // greed
          }
        }

        return {
          _id: priceFeed._id,
          symbol: priceFeed.pair,
          price: price,
          sentiment: sentiment,
          volume: 0,
          marketCap: 0,
          fearGreedIndex: fearGreedIndex,
          socialSentiment: {
            twitter: 0,
            reddit: 0,
            news: 0,
          },
          technicalIndicators: {
            rsi: rsiSignal ? rsiSignal.rsi : 0,
            macd: 0,
            bollingerBands: {
              upper: 0,
              middle: 0,
              lower: 0,
            },
          },
          metadata: {
            source: "oracle",
            confidence: 1.0,
            tags: ["price_feed", rsiSignal ? "rsi_signal" : "no_rsi"],
          },
          timestamp: priceFeed.timestamp,
          createdAt: priceFeed.timestamp,
          updatedAt: priceFeed.timestamp,
        };
      });

      // Get total count for pagination
      const total = await db.collection("price_feeds").countDocuments();
      const totalPages = Math.ceil(total / limit);

      res.json({
        data: combinedData,
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

  // GET data by symbol - combines price feeds and RSI signals
  static async getDataBySymbol(req, res) {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const db = mongoose.connection.db;

      // Get price feeds for the symbol
      const priceFeeds = await db
        .collection("price_feeds")
        .find({ pair: symbol })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      // Get RSI signals for the symbol
      const rsiSignals = await db
        .collection("rsi_signals")
        .find({ pair: symbol })
        .sort({ timestamp: -1 })
        .toArray();

      // Create a map of RSI signals by timestamp
      const rsiMap = new Map();
      rsiSignals.forEach((signal) => {
        rsiMap.set(signal.timestamp, signal);
      });

      // Combine and format the data
      const combinedData = priceFeeds.map((priceFeed) => {
        const rsiSignal = rsiMap.get(priceFeed.timestamp);

        const price =
          parseFloat(priceFeed.price) / Math.pow(10, priceFeed.decimals);

        let sentiment = 0;
        if (rsiSignal) {
          if (rsiSignal.rsi_signal === 1) {
            sentiment = 0.3;
          } else if (rsiSignal.rsi_signal === -1) {
            sentiment = -0.3;
          }
        }

        let fearGreedIndex = 50;
        if (rsiSignal) {
          if (rsiSignal.rsi < 30) {
            fearGreedIndex = 20;
          } else if (rsiSignal.rsi < 40) {
            fearGreedIndex = 35;
          } else if (rsiSignal.rsi > 70) {
            fearGreedIndex = 80;
          } else if (rsiSignal.rsi > 60) {
            fearGreedIndex = 65;
          }
        }

        return {
          _id: priceFeed._id,
          symbol: priceFeed.pair,
          price: price,
          sentiment: sentiment,
          volume: 0,
          marketCap: 0,
          fearGreedIndex: fearGreedIndex,
          socialSentiment: {
            twitter: 0,
            reddit: 0,
            news: 0,
          },
          technicalIndicators: {
            rsi: rsiSignal ? rsiSignal.rsi : 0,
            macd: 0,
            bollingerBands: {
              upper: 0,
              middle: 0,
              lower: 0,
            },
          },
          metadata: {
            source: "oracle",
            confidence: 1.0,
            tags: ["price_feed", rsiSignal ? "rsi_signal" : "no_rsi"],
          },
          timestamp: priceFeed.timestamp,
          createdAt: priceFeed.timestamp,
          updatedAt: priceFeed.timestamp,
        };
      });

      res.json({
        symbol,
        count: combinedData.length,
        data: combinedData,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET latest data - combines price feeds and RSI signals
  static async getLatestData(req, res) {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const { symbol } = req.query;

      const db = mongoose.connection.db;

      let priceFeedsQuery = {};
      if (symbol) priceFeedsQuery.pair = symbol;

      const priceFeeds = await db
        .collection("price_feeds")
        .find(priceFeedsQuery)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      // Get RSI signals for the same symbols
      const symbols = [...new Set(priceFeeds.map((pf) => pf.pair))];
      const rsiSignals = await db
        .collection("rsi_signals")
        .find({ pair: { $in: symbols } })
        .sort({ timestamp: -1 })
        .toArray();

      // Create a map of RSI signals by pair and timestamp
      const rsiMap = new Map();
      rsiSignals.forEach((signal) => {
        const key = `${signal.pair}_${signal.timestamp}`;
        rsiMap.set(key, signal);
      });

      // Combine and format the data
      const combinedData = priceFeeds.map((priceFeed) => {
        const key = `${priceFeed.pair}_${priceFeed.timestamp}`;
        const rsiSignal = rsiMap.get(key);

        const price =
          parseFloat(priceFeed.price) / Math.pow(10, priceFeed.decimals);

        let sentiment = 0;
        if (rsiSignal) {
          if (rsiSignal.rsi_signal === 1) {
            sentiment = 0.3;
          } else if (rsiSignal.rsi_signal === -1) {
            sentiment = -0.3;
          }
        }

        let fearGreedIndex = 50;
        if (rsiSignal) {
          if (rsiSignal.rsi < 30) {
            fearGreedIndex = 20;
          } else if (rsiSignal.rsi < 40) {
            fearGreedIndex = 35;
          } else if (rsiSignal.rsi > 70) {
            fearGreedIndex = 80;
          } else if (rsiSignal.rsi > 60) {
            fearGreedIndex = 65;
          }
        }

        return {
          _id: priceFeed._id,
          symbol: priceFeed.pair,
          price: price,
          sentiment: sentiment,
          volume: 0,
          marketCap: 0,
          fearGreedIndex: fearGreedIndex,
          socialSentiment: {
            twitter: 0,
            reddit: 0,
            news: 0,
          },
          technicalIndicators: {
            rsi: rsiSignal ? rsiSignal.rsi : 0,
            macd: 0,
            bollingerBands: {
              upper: 0,
              middle: 0,
              lower: 0,
            },
          },
          metadata: {
            source: "oracle",
            confidence: 1.0,
            tags: ["price_feed", rsiSignal ? "rsi_signal" : "no_rsi"],
          },
          timestamp: priceFeed.timestamp,
          createdAt: priceFeed.timestamp,
          updatedAt: priceFeed.timestamp,
        };
      });

      res.json({
        count: combinedData.length,
        data: combinedData,
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

  // GET statistics - combines price feeds and RSI signals
  static async getStatistics(req, res) {
    try {
      const { symbol } = req.query;
      const db = mongoose.connection.db;

      // Get price feeds
      let priceFeedsQuery = {};
      if (symbol) priceFeedsQuery.pair = symbol;

      const priceFeeds = await db
        .collection("price_feeds")
        .find(priceFeedsQuery)
        .toArray();

      // Get RSI signals
      let rsiQuery = {};
      if (symbol) rsiQuery.pair = symbol;

      const rsiSignals = await db
        .collection("rsi_signals")
        .find(rsiQuery)
        .toArray();

      // Create a map of RSI signals by pair and timestamp
      const rsiMap = new Map();
      rsiSignals.forEach((signal) => {
        const key = `${signal.pair}_${signal.timestamp}`;
        rsiMap.set(key, signal);
      });

      // Process price feeds and calculate statistics
      const processedData = priceFeeds.map((priceFeed) => {
        const key = `${priceFeed.pair}_${priceFeed.timestamp}`;
        const rsiSignal = rsiMap.get(key);

        const price =
          parseFloat(priceFeed.price) / Math.pow(10, priceFeed.decimals);

        let sentiment = 0;
        if (rsiSignal) {
          if (rsiSignal.rsi_signal === 1) {
            sentiment = 0.3;
          } else if (rsiSignal.rsi_signal === -1) {
            sentiment = -0.3;
          }
        }

        let fearGreedIndex = 50;
        if (rsiSignal) {
          if (rsiSignal.rsi < 30) {
            fearGreedIndex = 20;
          } else if (rsiSignal.rsi < 40) {
            fearGreedIndex = 35;
          } else if (rsiSignal.rsi > 70) {
            fearGreedIndex = 80;
          } else if (rsiSignal.rsi > 60) {
            fearGreedIndex = 65;
          }
        }

        return {
          symbol: priceFeed.pair,
          price: price,
          sentiment: sentiment,
          fearGreedIndex: fearGreedIndex,
          timestamp: priceFeed.timestamp,
        };
      });

      // Calculate statistics
      const totalRecords = processedData.length;
      const avgPrice =
        processedData.reduce((sum, item) => sum + item.price, 0) / totalRecords;
      const avgSentiment =
        processedData.reduce((sum, item) => sum + item.sentiment, 0) /
        totalRecords;
      const avgFearGreed =
        processedData.reduce((sum, item) => sum + item.fearGreedIndex, 0) /
        totalRecords;
      const minPrice = Math.min(...processedData.map((item) => item.price));
      const maxPrice = Math.max(...processedData.map((item) => item.price));
      const minSentiment = Math.min(
        ...processedData.map((item) => item.sentiment)
      );
      const maxSentiment = Math.max(
        ...processedData.map((item) => item.sentiment)
      );
      const latestTimestamp = new Date(
        Math.max(...processedData.map((item) => new Date(item.timestamp)))
      );
      const earliestTimestamp = new Date(
        Math.min(...processedData.map((item) => new Date(item.timestamp)))
      );

      // Calculate symbol distribution
      const symbolCounts = {};
      processedData.forEach((item) => {
        symbolCounts[item.symbol] = (symbolCounts[item.symbol] || 0) + 1;
      });

      const symbolDistribution = Object.entries(symbolCounts)
        .map(([symbol, count]) => ({ _id: symbol, count }))
        .sort((a, b) => b.count - a.count);

      res.json({
        statistics: {
          totalRecords,
          avgPrice,
          avgSentiment,
          avgFearGreed,
          minPrice,
          maxPrice,
          minSentiment,
          maxSentiment,
          latestTimestamp,
          earliestTimestamp,
        },
        symbolDistribution,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DataController;

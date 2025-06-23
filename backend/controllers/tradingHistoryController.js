const mongoose = require("mongoose");

class TradingHistoryController {
  // GET all executed trades with pagination
  static async getAllTrades(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;
      const pair = req.query.pair;
      const action = req.query.action;

      const db = mongoose.connection.db;

      // Build query
      let query = {};
      if (pair) {
        query.pair = pair;
      }
      if (action) {
        query.action = action.toUpperCase();
      }

      // Get executed trades
      const trades = await db
        .collection("executed_trades")
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get total count for pagination
      const total = await db
        .collection("executed_trades")
        .countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      res.json({
        data: trades,
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
      console.error("Error fetching trading history:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET trade by ID
  static async getTradeById(req, res) {
    try {
      const db = mongoose.connection.db;
      const trade = await db
        .collection("executed_trades")
        .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      res.json(trade);
    } catch (error) {
      console.error("Error fetching trade by ID:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET trades by pair
  static async getTradesByPair(req, res) {
    try {
      const { pair } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      const db = mongoose.connection.db;

      const trades = await db
        .collection("executed_trades")
        .find({ pair })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      res.json({
        data: trades,
        total: trades.length,
      });
    } catch (error) {
      console.error("Error fetching trades by pair:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET trading statistics
  static async getTradingStats(req, res) {
    try {
      const db = mongoose.connection.db;

      // Get all trades for statistics
      const allTrades = await db
        .collection("executed_trades")
        .find({})
        .toArray();

      if (allTrades.length === 0) {
        return res.json({
          totalTrades: 0,
          totalVolume: 0,
          buyCount: 0,
          sellCount: 0,
          averagePrice: 0,
          profitLoss: 0,
          pairs: [],
        });
      }

      // Calculate statistics
      const totalTrades = allTrades.length;
      const buyTrades = allTrades.filter((trade) => trade.action === "BUY");
      const sellTrades = allTrades.filter((trade) => trade.action === "SELL");

      const totalVolume = allTrades.reduce((sum, trade) => {
        if (trade.amount_usd) {
          return sum + trade.amount_usd;
        } else if (trade.amount_token && trade.price) {
          return sum + trade.amount_token * trade.price;
        }
        return sum;
      }, 0);

      const averagePrice =
        allTrades.reduce((sum, trade) => sum + trade.price, 0) / totalTrades;

      // Get unique pairs
      const pairs = [...new Set(allTrades.map((trade) => trade.pair))];

      // Calculate profit/loss (simplified - would need more complex logic for actual P&L)
      let profitLoss = 0;
      const pairTrades = {};

      allTrades.forEach((trade) => {
        if (!pairTrades[trade.pair]) {
          pairTrades[trade.pair] = { buys: [], sells: [] };
        }

        if (trade.action === "BUY") {
          pairTrades[trade.pair].buys.push(trade);
        } else {
          pairTrades[trade.pair].sells.push(trade);
        }
      });

      // Simple P&L calculation (this is a simplified version)
      Object.values(pairTrades).forEach((pairData) => {
        const avgBuyPrice =
          pairData.buys.length > 0
            ? pairData.buys.reduce((sum, trade) => sum + trade.price, 0) /
              pairData.buys.length
            : 0;

        pairData.sells.forEach((sell) => {
          if (avgBuyPrice > 0) {
            profitLoss += (sell.price - avgBuyPrice) * (sell.amount_token || 0);
          }
        });
      });

      res.json({
        totalTrades,
        totalVolume: Math.round(totalVolume * 100) / 100,
        buyCount: buyTrades.length,
        sellCount: sellTrades.length,
        averagePrice: Math.round(averagePrice * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        pairs,
        recentTrades: allTrades.slice(0, 5), // Last 5 trades
      });
    } catch (error) {
      console.error("Error calculating trading statistics:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET trades within date range
  static async getTradesByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.params;
      const pair = req.query.pair;

      const db = mongoose.connection.db;

      let query = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      if (pair) {
        query.pair = pair;
      }

      const trades = await db
        .collection("executed_trades")
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();

      res.json({
        data: trades,
        total: trades.length,
      });
    } catch (error) {
      console.error("Error fetching trades by date range:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = TradingHistoryController;

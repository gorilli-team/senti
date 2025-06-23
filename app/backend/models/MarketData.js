const mongoose = require("mongoose");

const marketDataSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    asset: {
      type: String,
      required: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    volume: {
      type: Number,
      required: true,
      min: 0,
    },
    market_cap: {
      type: Number,
      required: false,
      min: 0,
    },
    change_24h: {
      type: Number,
      required: false,
    },
    change_percentage_24h: {
      type: Number,
      required: false,
    },
    high_24h: {
      type: Number,
      required: false,
      min: 0,
    },
    low_24h: {
      type: Number,
      required: false,
      min: 0,
    },
    open_24h: {
      type: Number,
      required: false,
      min: 0,
    },
    source: {
      type: String,
      required: true,
      enum: ["binance", "coinbase", "kraken", "other"],
    },
    pair: {
      type: String,
      required: true,
      default: "USDT",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
marketDataSchema.index({ timestamp: -1 });
marketDataSchema.index({ asset: 1, timestamp: -1 });
marketDataSchema.index({ asset: 1, pair: 1, timestamp: -1 });

// Method to get latest price for an asset
marketDataSchema.statics.getLatestPrice = async function (
  asset,
  pair = "USDT"
) {
  const result = await this.findOne(
    { asset: asset.toUpperCase(), pair: pair.toUpperCase() },
    {},
    { sort: { timestamp: -1 } }
  );
  return result;
};

// Method to get price history for an asset
marketDataSchema.statics.getPriceHistory = async function (
  asset,
  pair = "USDT",
  timeRange = "24h"
) {
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

  return await this.find({
    asset: asset.toUpperCase(),
    pair: pair.toUpperCase(),
    timestamp: { $gte: startTime },
  }).sort({ timestamp: 1 });
};

// Method to get market statistics
marketDataSchema.statics.getMarketStats = async function (
  asset,
  pair = "USDT",
  timeRange = "24h"
) {
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
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const pipeline = [
    {
      $match: {
        asset: asset.toUpperCase(),
        pair: pair.toUpperCase(),
        timestamp: { $gte: startTime },
      },
    },
    {
      $group: {
        _id: null,
        avgPrice: { $avg: "$price" },
        maxPrice: { $max: "$price" },
        minPrice: { $min: "$price" },
        totalVolume: { $sum: "$volume" },
        avgVolume: { $avg: "$volume" },
        priceChange: {
          $subtract: [{ $last: "$price" }, { $first: "$price" }],
        },
        priceChangePercentage: {
          $multiply: [
            {
              $divide: [
                { $subtract: [{ $last: "$price" }, { $first: "$price" }] },
                { $first: "$price" },
              ],
            },
            100,
          ],
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return (
    result[0] || {
      avgPrice: 0,
      maxPrice: 0,
      minPrice: 0,
      totalVolume: 0,
      avgVolume: 0,
      priceChange: 0,
      priceChangePercentage: 0,
    }
  );
};

module.exports = mongoose.model("MarketData", marketDataSchema);

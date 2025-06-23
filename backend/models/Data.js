const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
      enum: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "UNKNOWN"],
    },
    price: {
      type: Number,
      required: true,
    },
    sentiment: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
    volume: {
      type: Number,
      default: 0,
    },
    marketCap: {
      type: Number,
      default: 0,
    },
    fearGreedIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    socialSentiment: {
      twitter: { type: Number, default: 0 },
      reddit: { type: Number, default: 0 },
      news: { type: Number, default: 0 },
    },
    technicalIndicators: {
      rsi: { type: Number, default: 0 },
      macd: { type: Number, default: 0 },
      bollingerBands: {
        upper: { type: Number, default: 0 },
        middle: { type: Number, default: 0 },
        lower: { type: Number, default: 0 },
      },
    },
    metadata: {
      source: { type: String, default: "oracle" },
      confidence: { type: Number, default: 1.0 },
      tags: [String],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
dataSchema.index({ symbol: 1, timestamp: -1 });
dataSchema.index({ timestamp: -1 });
dataSchema.index({ sentiment: 1 });

// Virtual for formatted timestamp
dataSchema.virtual("formattedTimestamp").get(function () {
  return this.timestamp.toISOString();
});

// Method to get sentiment label
dataSchema.methods.getSentimentLabel = function () {
  if (this.sentiment >= 0.5) return "Very Bullish";
  if (this.sentiment >= 0.1) return "Bullish";
  if (this.sentiment >= -0.1) return "Neutral";
  if (this.sentiment >= -0.5) return "Bearish";
  return "Very Bearish";
};

// Static method to get latest data for a symbol
dataSchema.statics.getLatestBySymbol = function (symbol, limit = 1) {
  return this.find({ symbol }).sort({ timestamp: -1 }).limit(limit);
};

// Static method to get aggregated data
dataSchema.statics.getAggregatedData = function (symbol, period = "1d") {
  const matchStage = { symbol };
  let groupStage = {
    _id: null,
    avgPrice: { $avg: "$price" },
    avgSentiment: { $avg: "$sentiment" },
    avgVolume: { $avg: "$volume" },
    avgFearGreed: { $avg: "$fearGreedIndex" },
    count: { $sum: 1 },
    minPrice: { $min: "$price" },
    maxPrice: { $max: "$price" },
    minSentiment: { $min: "$sentiment" },
    maxSentiment: { $max: "$sentiment" },
  };

  if (period === "1h") {
    groupStage._id = {
      year: { $year: "$timestamp" },
      month: { $month: "$timestamp" },
      day: { $dayOfMonth: "$timestamp" },
      hour: { $hour: "$timestamp" },
    };
  } else if (period === "1d") {
    groupStage._id = {
      year: { $year: "$timestamp" },
      month: { $month: "$timestamp" },
      day: { $dayOfMonth: "$timestamp" },
    };
  }

  return this.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { _id: -1 } },
  ]);
};

module.exports = mongoose.model("Data", dataSchema);

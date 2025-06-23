const mongoose = require("mongoose");

const sentimentSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["twitter", "reddit", "news", "social_media"],
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    sentiment_score: {
      type: Number,
      required: true,
      min: -1,
      max: 1,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    asset: {
      type: String,
      required: true,
      uppercase: true,
    },
    user_id: {
      type: String,
      required: false,
    },
    metadata: {
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
sentimentSchema.index({ timestamp: -1 });
sentimentSchema.index({ asset: 1, timestamp: -1 });
sentimentSchema.index({ source: 1, timestamp: -1 });
sentimentSchema.index({ sentiment_score: 1 });

// Virtual for sentiment category
sentimentSchema.virtual("sentiment_category").get(function () {
  if (this.sentiment_score >= 0.1) return "positive";
  if (this.sentiment_score <= -0.1) return "negative";
  return "neutral";
});

// Method to get sentiment statistics
sentimentSchema.statics.getSentimentStats = async function (
  asset,
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
        timestamp: { $gte: startTime },
      },
    },
    {
      $group: {
        _id: null,
        avgSentiment: { $avg: "$sentiment_score" },
        totalPosts: { $sum: 1 },
        positiveCount: {
          $sum: { $cond: [{ $gte: ["$sentiment_score", 0.1] }, 1, 0] },
        },
        negativeCount: {
          $sum: { $cond: [{ $lte: ["$sentiment_score", -0.1] }, 1, 0] },
        },
        neutralCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$sentiment_score", -0.1] },
                  { $lt: ["$sentiment_score", 0.1] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return (
    result[0] || {
      avgSentiment: 0,
      totalPosts: 0,
      positiveCount: 0,
      negativeCount: 0,
      neutralCount: 0,
    }
  );
};

module.exports = mongoose.model("Sentiment", sentimentSchema);

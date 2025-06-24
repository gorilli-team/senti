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

      const db = mongoose.connection.db;

      const priceFeeds = await db
        .collection("price_feeds")
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get RSI signals for all price feeds
      const enhancedData = await Promise.all(
        priceFeeds.map(async (priceFeed) => {
          // Get the closest RSI signal within 1 hour of the price timestamp
          const oneHourAgo = new Date(
            priceFeed.timestamp.getTime() - 60 * 60 * 1000
          );
          const oneHourLater = new Date(
            priceFeed.timestamp.getTime() + 60 * 60 * 1000
          );

          const rsiSignal = await db.collection("rsi_signals").findOne(
            {
              pair: priceFeed.pair,
              timestamp: {
                $gte: oneHourAgo,
                $lte: oneHourLater,
              },
            },
            { sort: { timestamp: -1 } }
          );

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
            ...priceFeed,
            sentiment: sentiment,
            fearGreedIndex: fearGreedIndex,
            technicalIndicators: {
              rsi: rsiSignal ? rsiSignal.rsi : 0,
              rsi_signal: rsiSignal ? rsiSignal.rsi_signal : 0,
            },
            // Pass through the complete RSI signal data
            rsiSignal: rsiSignal || null,
            metadata: {
              source: "oracle",
              confidence: 1.0,
              tags: ["price_feed", rsiSignal ? "rsi_signal" : "no_rsi"],
            },
          };
        })
      );

      const total = await db.collection("price_feeds").countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        data: enhancedData,
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

      const db = mongoose.connection.db;

      const priceFeeds = await db
        .collection("price_feeds")
        .find({ pair })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      // Get RSI signals for all price feeds
      const enhancedData = await Promise.all(
        priceFeeds.map(async (priceFeed) => {
          // Get the closest RSI signal within 1 hour of the price timestamp
          const oneHourAgo = new Date(
            priceFeed.timestamp.getTime() - 60 * 60 * 1000
          );
          const oneHourLater = new Date(
            priceFeed.timestamp.getTime() + 60 * 60 * 1000
          );

          const rsiSignal = await db.collection("rsi_signals").findOne(
            {
              pair: priceFeed.pair,
              timestamp: {
                $gte: oneHourAgo,
                $lte: oneHourLater,
              },
            },
            { sort: { timestamp: -1 } }
          );

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
            ...priceFeed,
            sentiment: sentiment,
            fearGreedIndex: fearGreedIndex,
            technicalIndicators: {
              rsi: rsiSignal ? rsiSignal.rsi : 0,
              rsi_signal: rsiSignal ? rsiSignal.rsi_signal : 0,
            },
            // Pass through the complete RSI signal data
            rsiSignal: rsiSignal || null,
            metadata: {
              source: "oracle",
              confidence: 1.0,
              tags: ["price_feed", rsiSignal ? "rsi_signal" : "no_rsi"],
            },
          };
        })
      );

      res.json({
        pair,
        count: enhancedData.length,
        data: enhancedData,
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

      const db = mongoose.connection.db;

      const priceFeeds = await db
        .collection("price_feeds")
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      // Get RSI signals for all price feeds
      const enhancedData = await Promise.all(
        priceFeeds.map(async (priceFeed) => {
          // Get the closest RSI signal within 1 hour of the price timestamp
          const oneHourAgo = new Date(
            priceFeed.timestamp.getTime() - 60 * 60 * 1000
          );
          const oneHourLater = new Date(
            priceFeed.timestamp.getTime() + 60 * 60 * 1000
          );

          const rsiSignal = await db.collection("rsi_signals").findOne(
            {
              pair: priceFeed.pair,
              timestamp: {
                $gte: oneHourAgo,
                $lte: oneHourLater,
              },
            },
            { sort: { timestamp: -1 } }
          );

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
            ...priceFeed,
            sentiment: sentiment,
            fearGreedIndex: fearGreedIndex,
            technicalIndicators: {
              rsi: rsiSignal ? rsiSignal.rsi : 0,
              rsi_signal: rsiSignal ? rsiSignal.rsi_signal : 0,
            },
            // Pass through the complete RSI signal data
            rsiSignal: rsiSignal || null,
            metadata: {
              source: "oracle",
              confidence: 1.0,
              tags: ["price_feed", rsiSignal ? "rsi_signal" : "no_rsi"],
            },
          };
        })
      );

      res.json({
        count: enhancedData.length,
        data: enhancedData,
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

      const db = mongoose.connection.db;

      const priceFeeds = await db
        .collection("price_feeds")
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();

      // Get RSI signals for all price feeds
      const enhancedData = await Promise.all(
        priceFeeds.map(async (priceFeed) => {
          // Get the closest RSI signal within 1 hour of the price timestamp
          const oneHourAgo = new Date(
            priceFeed.timestamp.getTime() - 60 * 60 * 1000
          );
          const oneHourLater = new Date(
            priceFeed.timestamp.getTime() + 60 * 60 * 1000
          );

          const rsiSignal = await db.collection("rsi_signals").findOne(
            {
              pair: priceFeed.pair,
              timestamp: {
                $gte: oneHourAgo,
                $lte: oneHourLater,
              },
            },
            { sort: { timestamp: -1 } }
          );

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
            ...priceFeed,
            sentiment: sentiment,
            fearGreedIndex: fearGreedIndex,
            technicalIndicators: {
              rsi: rsiSignal ? rsiSignal.rsi : 0,
              rsi_signal: rsiSignal ? rsiSignal.rsi_signal : 0,
            },
            // Pass through the complete RSI signal data
            rsiSignal: rsiSignal || null,
            metadata: {
              source: "oracle",
              confidence: 1.0,
              tags: ["price_feed", rsiSignal ? "rsi_signal" : "no_rsi"],
            },
          };
        })
      );

      res.json({
        startDate,
        endDate,
        count: enhancedData.length,
        data: enhancedData,
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
      const db = mongoose.connection.db;

      const stats = await db
        .collection("price_feeds")
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

      const pairStats = await db
        .collection("price_feeds")
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

      // Get RSI signals for all pairs with a time window approach
      const rsiSignalsPromises = pairStats.map(async (stat) => {
        const oneHourAgo = new Date(
          stat.latestTimestamp.getTime() - 60 * 60 * 1000
        );
        const oneHourLater = new Date(
          stat.latestTimestamp.getTime() + 60 * 60 * 1000
        );

        const rsiSignal = await db.collection("rsi_signals").findOne(
          {
            pair: stat._id,
            timestamp: {
              $gte: oneHourAgo,
              $lte: oneHourLater,
            },
          },
          { sort: { timestamp: -1 } }
        );

        return {
          pair: stat._id,
          rsiSignal: rsiSignal,
        };
      });

      const rsiSignalsResults = await Promise.all(rsiSignalsPromises);

      // Create a map of RSI signals by pair
      const rsiMap = new Map();
      rsiSignalsResults.forEach((result) => {
        rsiMap.set(result.pair, result.rsiSignal);
      });

      // Convert price strings to readable format and add RSI data
      const formattedPairStats = pairStats.map((stat) => {
        const rsiData = rsiMap.get(stat._id);

        // Create sentiment based on RSI signal
        let sentiment = 0; // neutral
        if (rsiData) {
          if (rsiData.rsi_signal === 1) {
            sentiment = 0.3; // bullish
          } else if (rsiData.rsi_signal === -1) {
            sentiment = -0.3; // bearish
          }
        }

        // Create fear/greed index based on RSI
        let fearGreedIndex = 50; // neutral
        if (rsiData) {
          if (rsiData.rsi < 30) {
            fearGreedIndex = 20; // extreme fear
          } else if (rsiData.rsi < 40) {
            fearGreedIndex = 35; // fear
          } else if (rsiData.rsi > 70) {
            fearGreedIndex = 80; // extreme greed
          } else if (rsiData.rsi > 60) {
            fearGreedIndex = 65; // greed
          }
        }

        return {
          ...stat,
          latestPriceReadable: stat.latestPrice
            ? (
                parseInt(stat.latestPrice) / Math.pow(10, stat.decimals || 18)
              ).toFixed(2)
            : null,
          // Add technical indicators
          sentiment: sentiment,
          fearGreedIndex: fearGreedIndex,
          technicalIndicators: {
            rsi: rsiData ? rsiData.rsi : 0,
            rsi_signal: rsiData ? rsiData.rsi_signal : 0,
          },
          // Pass through the complete RSI signal data
          rsiSignal: rsiData || null,
          metadata: {
            source: "oracle",
            confidence: 1.0,
            tags: ["price_feed", rsiData ? "rsi_signal" : "no_rsi"],
          },
        };
      });

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

      const db = mongoose.connection.db;

      // Get latest price feed
      const latestPrice = await db
        .collection("price_feeds")
        .findOne({ pair }, { sort: { timestamp: -1 } });

      if (!latestPrice) {
        return res
          .status(404)
          .json({ error: "Price feed not found for this pair" });
      }

      console.log("Latest price for", pair, ":", latestPrice.timestamp);

      // Get the closest RSI signal within 1 hour of the price timestamp
      const oneHourAgo = new Date(
        latestPrice.timestamp.getTime() - 60 * 60 * 1000
      );
      const oneHourLater = new Date(
        latestPrice.timestamp.getTime() + 60 * 60 * 1000
      );

      console.log(
        "Looking for RSI signals between:",
        oneHourAgo,
        "and",
        oneHourLater
      );

      const rsiSignal = await db.collection("rsi_signals").findOne(
        {
          pair: pair,
          timestamp: {
            $gte: oneHourAgo,
            $lte: oneHourLater,
          },
        },
        { sort: { timestamp: -1 } }
      );

      console.log("Found RSI signal:", rsiSignal);

      // If no RSI signal found within 1 hour, try to get the latest one for this pair
      let finalRsiSignal = rsiSignal;
      if (!rsiSignal) {
        console.log(
          "No RSI signal found within 1 hour, looking for latest RSI signal for",
          pair
        );
        finalRsiSignal = await db
          .collection("rsi_signals")
          .findOne({ pair: pair }, { sort: { timestamp: -1 } });
        console.log("Latest RSI signal found:", finalRsiSignal);
      }

      // Convert price to readable format
      const priceReadable = latestPrice.price
        ? (
            parseInt(latestPrice.price) /
            Math.pow(10, latestPrice.decimals || 18)
          ).toFixed(2)
        : null;

      // Create sentiment based on RSI signal
      let sentiment = 0; // neutral
      if (finalRsiSignal) {
        if (finalRsiSignal.rsi_signal === 1) {
          sentiment = 0.3; // bullish
        } else if (finalRsiSignal.rsi_signal === -1) {
          sentiment = -0.3; // bearish
        }
      }

      // Create fear/greed index based on RSI
      let fearGreedIndex = 50; // neutral
      if (finalRsiSignal) {
        if (finalRsiSignal.rsi < 30) {
          fearGreedIndex = 20; // extreme fear
        } else if (finalRsiSignal.rsi < 40) {
          fearGreedIndex = 35; // fear
        } else if (finalRsiSignal.rsi > 70) {
          fearGreedIndex = 80; // extreme greed
        } else if (finalRsiSignal.rsi > 60) {
          fearGreedIndex = 65; // greed
        }
      }

      // Enhanced response with technical indicators
      const response = {
        pair: latestPrice.pair,
        price: latestPrice.price,
        priceReadable,
        decimals: latestPrice.decimals,
        timestamp: latestPrice.timestamp,
        // Add technical indicators
        sentiment: sentiment,
        fearGreedIndex: fearGreedIndex,
        technicalIndicators: {
          rsi: finalRsiSignal ? finalRsiSignal.rsi : 0,
          rsi_signal: finalRsiSignal ? finalRsiSignal.rsi_signal : 0,
        },
        // Pass through the complete RSI signal data
        rsiSignal: finalRsiSignal || null,
        metadata: {
          source: "oracle",
          confidence: 1.0,
          tags: ["price_feed", finalRsiSignal ? "rsi_signal" : "no_rsi"],
        },
      };

      console.log("Final response:", response);

      res.json(response);
    } catch (error) {
      console.error("Error in getCurrentPrice:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PriceFeedsController;

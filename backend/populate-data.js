const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/senti";

// Import the Data model
const Data = require("./models/Data");

async function populateData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB:", MONGODB_URI);

    // Get the database instance
    const db = mongoose.connection.db;

    // Get data from price_feeds collection
    const priceFeeds = await db.collection("price_feeds").find({}).toArray();
    console.log(`Found ${priceFeeds.length} price feeds`);

    // Get data from rsi_signals collection
    const rsiSignals = await db.collection("rsi_signals").find({}).toArray();
    console.log(`Found ${rsiSignals.length} RSI signals`);

    // Create a map of RSI signals by pair and timestamp for quick lookup
    const rsiMap = new Map();
    rsiSignals.forEach((signal) => {
      const key = `${signal.pair}_${signal.timestamp}`;
      rsiMap.set(key, signal);
    });

    // Combine data and create Data documents
    const dataToInsert = [];

    for (const priceFeed of priceFeeds) {
      const key = `${priceFeed.pair}_${priceFeed.timestamp}`;
      const rsiSignal = rsiMap.get(key);

      // Convert price from wei to normal format
      const price =
        parseFloat(priceFeed.price) / Math.pow(10, priceFeed.decimals);

      // Create sentiment based on RSI signal (if available)
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

      const dataDoc = {
        symbol: priceFeed.pair,
        price: price,
        sentiment: sentiment,
        volume: 0, // Not available in price feeds
        marketCap: 0, // Not available in price feeds
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
          tags: ["price_feed", "rsi_signal"],
        },
        timestamp: new Date(priceFeed.timestamp),
      };

      dataToInsert.push(dataDoc);
    }

    console.log(`Prepared ${dataToInsert.length} documents to insert`);

    // Clear existing data
    await Data.deleteMany({});
    console.log("Cleared existing data from datas collection");

    // Insert the combined data
    if (dataToInsert.length > 0) {
      const result = await Data.insertMany(dataToInsert);
      console.log(
        `Successfully inserted ${result.length} documents into datas collection`
      );
    }

    // Verify the insertion
    const count = await Data.countDocuments();
    console.log(`Total documents in datas collection: ${count}`);
  } catch (error) {
    console.error("Error populating data:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("✅ Connection closed.");
  }
}

// Run the function
populateData();

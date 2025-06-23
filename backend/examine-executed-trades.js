const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/senti";

async function examineExecutedTrades() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB:", MONGODB_URI);

    // Get the database instance
    const db = mongoose.connection.db;

    // Get a few sample documents from executed_trades
    const sampleTrades = await db
      .collection("executed_trades")
      .find({})
      .limit(5)
      .toArray();

    console.log("\n📊 Sample Executed Trades:");
    console.log("==========================");
    console.log(JSON.stringify(sampleTrades, null, 2));

    // Get total count
    const totalCount = await db.collection("executed_trades").countDocuments();
    console.log(`\nTotal executed trades: ${totalCount}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("\n✅ Connection closed.");
  }
}

// Run the function
examineExecutedTrades();

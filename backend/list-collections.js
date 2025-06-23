const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/senti";

async function listCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB:", MONGODB_URI);

    // Get the database instance
    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();

    console.log("\n📊 Available Collections:");
    console.log("==========================");

    if (collections.length === 0) {
      console.log("No collections found in the database.");
    } else {
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
      });
    }

    // Get collection stats for more details
    console.log("\n📈 Collection Details:");
    console.log("======================");

    for (const collection of collections) {
      try {
        const stats = await db.collection(collection.name).stats();
        console.log(`\n${collection.name}:`);
        console.log(`  - Documents: ${stats.count}`);
        console.log(`  - Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`  - Storage: ${(stats.storageSize / 1024).toFixed(2)} KB`);
      } catch (error) {
        console.log(
          `\n${collection.name}: Error getting stats - ${error.message}`
        );
      }
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("\n✅ Connection closed.");
  }
}

// Run the function
listCollections();

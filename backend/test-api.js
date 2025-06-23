const axios = require("axios");

const BASE_URL = "http://localhost:5001";

// Test data
const testData = {
  symbol: "BTC/USDT",
  price: 45000.5,
  sentiment: 0.75,
  volume: 2500000000,
  marketCap: 850000000000,
  fearGreedIndex: 65,
  socialSentiment: {
    twitter: 0.8,
    reddit: 0.7,
    news: 0.6,
  },
  technicalIndicators: {
    rsi: 58,
    macd: 0.002,
    bollingerBands: {
      upper: 46000,
      middle: 45000,
      lower: 44000,
    },
  },
  metadata: {
    source: "oracle",
    confidence: 0.95,
    tags: ["bitcoin", "bullish", "high-volume"],
  },
};

async function testAPI() {
  console.log("🚀 Testing Senti Backend API...\n");

  try {
    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const health = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Health check passed:", health.data);

    // Test root endpoint
    console.log("\n2. Testing root endpoint...");
    const root = await axios.get(`${BASE_URL}/`);
    console.log("✅ Root endpoint:", root.data);

    // Test creating data
    console.log("\n3. Testing data creation...");
    const createResponse = await axios.post(`${BASE_URL}/api/data`, testData);
    console.log("✅ Data created:", createResponse.data._id);
    const dataId = createResponse.data._id;

    // Test getting all data
    console.log("\n4. Testing get all data...");
    const allData = await axios.get(`${BASE_URL}/api/data`);
    console.log("✅ All data retrieved:", allData.data.data.length, "records");

    // Test getting data by ID
    console.log("\n5. Testing get data by ID...");
    const dataById = await axios.get(`${BASE_URL}/api/data/${dataId}`);
    console.log("✅ Data by ID retrieved:", dataById.data.symbol);

    // Test getting data by symbol
    console.log("\n6. Testing get data by symbol...");
    const dataBySymbol = await axios.get(
      `${BASE_URL}/api/data/symbol/BTC%2FUSDT`
    );
    console.log(
      "✅ Data by symbol retrieved:",
      dataBySymbol.data.count,
      "records"
    );

    // Test getting latest data
    console.log("\n7. Testing get latest data...");
    const latestData = await axios.get(`${BASE_URL}/api/data/latest/5`);
    console.log("✅ Latest data retrieved:", latestData.data.count, "records");

    // Test getting statistics
    console.log("\n8. Testing get statistics...");
    const stats = await axios.get(`${BASE_URL}/api/data/stats`);
    console.log(
      "✅ Statistics retrieved:",
      stats.data.statistics.totalRecords,
      "total records"
    );

    // Test updating data
    console.log("\n9. Testing update data...");
    const updateData = { ...testData, price: 46000.0, sentiment: 0.85 };
    const updatedResponse = await axios.put(
      `${BASE_URL}/api/data/${dataId}`,
      updateData
    );
    console.log("✅ Data updated:", updatedResponse.data.price);

    // Test deleting data
    console.log("\n10. Testing delete data...");
    const deleteResponse = await axios.delete(`${BASE_URL}/api/data/${dataId}`);
    console.log("✅ Data deleted:", deleteResponse.data.message);

    console.log("\n🎉 All tests passed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };

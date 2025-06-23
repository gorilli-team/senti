const axios = require("axios");

const BASE_URL = "http://localhost:3002";

async function testTradingHistory() {
  console.log("🚀 Testing Trading History API...\n");

  try {
    // Test 1: Get trading statistics
    console.log("1. Testing trading statistics endpoint...");
    const statsResponse = await axios.get(
      `${BASE_URL}/api/trading-history/stats`
    );
    console.log("✅ Stats endpoint working:");
    console.log("   - Total trades:", statsResponse.data.totalTrades);
    console.log("   - Total volume:", statsResponse.data.totalVolume);
    console.log(
      "   - Buy/Sell ratio:",
      `${statsResponse.data.buyCount}/${statsResponse.data.sellCount}`
    );
    console.log("   - P&L:", statsResponse.data.profitLoss);
    console.log("   - Pairs:", statsResponse.data.pairs.join(", "));
    console.log("");

    // Test 2: Get all trades
    console.log("2. Testing get all trades endpoint...");
    const tradesResponse = await axios.get(
      `${BASE_URL}/api/trading-history?limit=5`
    );
    console.log("✅ Trades endpoint working:");
    console.log("   - Total trades returned:", tradesResponse.data.data.length);
    console.log("   - Pagination info:", tradesResponse.data.pagination);
    console.log("");

    // Test 3: Get trades by pair
    if (statsResponse.data.pairs.length > 0) {
      const testPair = statsResponse.data.pairs[0];
      console.log(`3. Testing get trades by pair (${testPair})...`);
      const pairResponse = await axios.get(
        `${BASE_URL}/api/trading-history/pair/${testPair}`
      );
      console.log("✅ Pair endpoint working:");
      console.log("   - Trades for pair:", pairResponse.data.total);
      console.log("");
    }

    console.log("🎉 All trading history endpoints are working correctly!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

// Run the test
testTradingHistory();

const express = require("express");
const router = express.Router();
const PriceFeedsController = require("../controllers/priceFeedsController");

// GET all price feeds with pagination
router.get("/", PriceFeedsController.getAllPriceFeeds);

// GET price feeds by pair
router.get("/pair/:pair", PriceFeedsController.getPriceFeedsByPair);

// GET current price for a specific pair
router.get("/current/:pair", PriceFeedsController.getCurrentPrice);

// GET latest price feeds
router.get("/latest/:limit?", PriceFeedsController.getLatestPriceFeeds);

// GET price feeds within date range
router.get(
  "/range/:startDate/:endDate",
  PriceFeedsController.getPriceFeedsByDateRange
);

// GET price feed statistics
router.get("/stats", PriceFeedsController.getPriceFeedStats);

// POST new price feed
router.post("/", PriceFeedsController.createPriceFeed);

module.exports = router;

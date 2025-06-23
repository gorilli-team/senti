const express = require("express");
const router = express.Router();
const RsiSignalsController = require("../controllers/rsiSignalsController");

// GET all RSI signals with pagination
router.get("/", RsiSignalsController.getAllRsiSignals);

// GET RSI signals by pair
router.get("/pair/:pair", RsiSignalsController.getRsiSignalsByPair);

// GET current RSI for a specific pair
router.get("/current/:pair", RsiSignalsController.getCurrentRsi);

// GET latest RSI signals
router.get("/latest/:limit?", RsiSignalsController.getLatestRsiSignals);

// GET RSI signals within date range
router.get(
  "/range/:startDate/:endDate",
  RsiSignalsController.getRsiSignalsByDateRange
);

// GET RSI signals by signal type (buy/sell/hold)
router.get("/signal/:signal", RsiSignalsController.getRsiSignalsByType);

// GET RSI signal statistics
router.get("/stats", RsiSignalsController.getRsiSignalStats);

// POST new RSI signal
router.post("/", RsiSignalsController.createRsiSignal);

module.exports = router;

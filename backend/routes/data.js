const express = require("express");
const router = express.Router();
const DataController = require("../controllers/dataController");

// GET all data with pagination
router.get("/", DataController.getAllData);

// GET statistics
router.get("/stats", DataController.getStatistics);

// GET data by ID
router.get("/:id", DataController.getDataById);

// GET data by symbol (e.g., BTC/USDT)
router.get("/symbol/:symbol", DataController.getDataBySymbol);

// GET latest data
router.get("/latest/:limit?", DataController.getLatestData);

// GET data within date range
router.get("/range/:startDate/:endDate", DataController.getDataByDateRange);

// GET aggregated data (e.g., daily averages)
router.get("/aggregated/:period", DataController.getAggregatedData);

// POST new data
router.post("/", DataController.createData);

// PUT update data
router.put("/:id", DataController.updateData);

// DELETE data
router.delete("/:id", DataController.deleteData);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/dashboardController');

// GET /api/dashboard/summary - Fetch aggregated finance metrics
router.get('/summary', getSummary);

module.exports = router;


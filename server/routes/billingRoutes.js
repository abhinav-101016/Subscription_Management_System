const express = require('express');
const router = express.Router();
const { runBillingEngine } = require('../controllers/billingController');

// POST /api/billing/run - Manually trigger the billing engine
router.post('/run', runBillingEngine);

module.exports = router;


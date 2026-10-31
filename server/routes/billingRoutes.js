const express = require('express');
const router = express.Router();
const { runBillingEngine } = require('../controllers/billingController');
const { testApplyDiscount } = require('../controllers/discountController');

// POST /api/billing/run - Manually trigger the billing engine
router.post('/run', runBillingEngine);

// POST /api/billing/apply-discounts - Manually test the applyDiscountToInvoice service
router.post('/apply-discounts', testApplyDiscount);

module.exports = router;

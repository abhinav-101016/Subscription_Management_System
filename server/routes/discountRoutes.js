const express = require('express');
const router = express.Router();
const {
  createDiscountRule,
  getAllDiscountRules,
  getDiscountRuleById,
  updateDiscountRule,
} = require('../controllers/discountController');

// POST /api/discounts - Create a new discount rule
// GET /api/discounts - List all discount rules
router.route('/')
  .post(createDiscountRule)
  .get(getAllDiscountRules);

// GET /api/discounts/:id - Get a specific discount rule
// PATCH /api/discounts/:id - Update limits or dates
router.route('/:id')
  .get(getDiscountRuleById)
  .patch(updateDiscountRule);

module.exports = router;


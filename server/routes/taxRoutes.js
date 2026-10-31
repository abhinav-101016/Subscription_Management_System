const express = require('express');
const router = express.Router();
const {
  createTaxRule,
  getAllTaxRules,
  getTaxRuleById,
  updateTaxRule,
} = require('../controllers/taxController');

// POST /api/taxes - Admin creates a tax rule
// GET /api/taxes - List all tax rules
router.route('/')
  .post(createTaxRule)
  .get(getAllTaxRules);

// GET /api/taxes/:id - Get tax rule by ID
// PATCH /api/taxes/:id - Update tax rule
router.route('/:id')
  .get(getTaxRuleById)
  .patch(updateTaxRule);

module.exports = router;


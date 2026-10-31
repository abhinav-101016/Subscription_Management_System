const express = require('express');
const router = express.Router();
const {
  createPlan,
  getAllPlans,
  getPlanById,
} = require('../controllers/planController');

// POST /api/plans - Admin creates a new plan
// GET /api/plans - List all available plans
router.route('/')
  .post(createPlan)
  .get(getAllPlans);

// GET /api/plans/:id - Get plan by ID
router.route('/:id')
  .get(getPlanById);

module.exports = router;


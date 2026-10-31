const express = require('express');
const router = express.Router();
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');

// POST /api/plans - Admin creates a new plan
// GET /api/plans - List all available plans
router.route('/')
  .post(createPlan)
  .get(getAllPlans);

// GET /api/plans/:id - Get plan by ID
// PUT /api/plans/:id - Update plan
// DELETE /api/plans/:id - Delete or deactivate plan
router.route('/:id')
  .get(getPlanById)
  .put(updatePlan)
  .delete(deletePlan);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createSubscription,
  createSubscriptionFromTemplate,
  updateSubscriptionStatus,
  getAllSubscriptions,
  getSubscriptionById,
} = require('../controllers/subscriptionController');

// POST /api/subscriptions - Create a new Draft subscription
router.post('/', createSubscription);

// POST /api/subscriptions/from-template - Create a new Draft subscription by copying data from a specific template ID
router.post('/from-template', createSubscriptionFromTemplate);

// PATCH /api/subscriptions/:id/status - Trigger a state machine transition, passing the new requested status in the request body
router.patch('/:id/status', updateSubscriptionStatus);

// GET /api/subscriptions - List subscriptions
router.get('/', getAllSubscriptions);

// GET /api/subscriptions/:id - Get a subscription by ID
router.get('/:id', getSubscriptionById);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createPayment,
  getAllPayments,
  getPaymentById,
} = require('../controllers/paymentController');

// POST /api/payments - Record a new payment against an invoice
// GET /api/payments - List all payments
router.route('/')
  .post(createPayment)
  .get(getAllPayments);

// GET /api/payments/:id - Get a specific payment
router.route('/:id')
  .get(getPaymentById);

module.exports = router;


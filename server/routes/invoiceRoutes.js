const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
} = require('../controllers/invoiceController');

// GET /api/invoices - List invoices with query filters (status, customer_id)
router.route('/')
  .get(getAllInvoices);

// GET /api/invoices/:id - Get invoice by ID
router.route('/:id')
  .get(getInvoiceById);

// PATCH /api/invoices/:id/status - Advance the invoice status (Draft -> Confirmed -> Paid)
router.route('/:id/status')
  .patch(updateInvoiceStatus);

module.exports = router;


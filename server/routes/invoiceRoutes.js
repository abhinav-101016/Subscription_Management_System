const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getOutstandingInvoices,
  getInvoicePaymentsHandler,
  getInvoiceById,
  updateInvoiceStatus,
} = require('../controllers/invoiceController');

// GET /api/invoices/outstanding - Fetch all invoices where status is NOT "Paid" and amount_due > 0
// Must precede /:id to prevent "outstanding" being parsed as an id parameter
router.get('/outstanding', getOutstandingInvoices);

// GET /api/invoices - List invoices with query filters (status, customer_id, subscription_id)
router.get('/', getAllInvoices);

// GET /api/invoices/:id/payments - List all payments for a specific invoice
router.get('/:id/payments', getInvoicePaymentsHandler);

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', getInvoiceById);

// PATCH /api/invoices/:id/status - Advance invoice status (Draft -> Confirmed -> Paid)
router.patch('/:id/status', updateInvoiceStatus);

module.exports = router;

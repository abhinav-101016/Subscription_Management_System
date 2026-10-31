const mongoose = require('mongoose');
const { Invoice, INVOICE_STATUSES } = require('../models/Invoice');
const Payment = require('../models/Payment');

/**
 * Strict Invoice State Transition Rules:
 * Draft -> Confirmed -> Paid
 */
const INVOICE_TRANSITIONS = Object.freeze({
  Draft: ['Confirmed'],
  Confirmed: ['Paid'],
  Paid: [], // Terminal state
});

/**
 * @desc    Fetch all invoices where status is NOT "Paid" and amount_due > 0 (Outstanding/Overdue)
 * @route   GET /api/invoices/outstanding
 * @access  Public / Authenticated
 */
const getOutstandingInvoices = async (req, res) => {
  try {
    const filter = {
      status: { $ne: 'Paid' },
      $or: [{ amount_due: { $gt: 0 } }, { amount_due: { $exists: false } }],
    };

    if (req.query.customer_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.customer_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid customer_id filter format',
        });
      }
      filter.customer_id = req.query.customer_id;
    }

    const invoices = await Invoice.find(filter)
      .populate('customer_id', 'name email phone')
      .populate('subscription_id', 'subscription_number status payment_terms')
      .sort({ billing_period_end: 1 });

    const totalOutstanding = Number(
      invoices
        .reduce(
          (acc, curr) =>
            acc + (curr.amount_due !== undefined ? Number(curr.amount_due) : Number(curr.grand_total)),
          0
        )
        .toFixed(2)
    );

    return res.status(200).json({
      success: true,
      count: invoices.length,
      total_outstanding_amount: totalOutstanding,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching outstanding invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching outstanding invoices',
      error: error.message,
    });
  }
};

/**
 * @desc    List all payments for a specific invoice
 * @route   GET /api/invoices/:id/payments
 * @access  Public / Authenticated
 */
const getInvoicePaymentsHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const payments = await Payment.find({ invoice_id: id }).sort({ payment_date: -1 });

    return res.status(200).json({
      success: true,
      invoice_summary: {
        id: invoice._id,
        invoice_number: invoice.invoice_number,
        grand_total: invoice.grand_total,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        status: invoice.status,
      },
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payments for invoice:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching payments for invoice',
      error: error.message,
    });
  }
};

/**
 * @desc    List all invoices with optional filters
 * @route   GET /api/invoices
 * @access  Public / Authenticated
 */
const getAllInvoices = async (req, res) => {
  try {
    const filter = {};

    // Filter by status if provided
    if (req.query.status) {
      if (!INVOICE_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Valid options are: ${INVOICE_STATUSES.join(', ')}`,
        });
      }
      filter.status = req.query.status;
    }

    // Filter by customer_id if provided
    if (req.query.customer_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.customer_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid customer_id filter format',
        });
      }
      filter.customer_id = req.query.customer_id;
    }

    // Filter by subscription_id if provided
    if (req.query.subscription_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.subscription_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subscription_id filter format',
        });
      }
      filter.subscription_id = req.query.subscription_id;
    }

    const invoices = await Invoice.find(filter)
      .populate('subscription_id', 'subscription_number status payment_terms')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching invoices',
      error: error.message,
    });
  }
};

/**
 * @desc    Get invoice by ID
 * @route   GET /api/invoices/:id
 * @access  Public / Authenticated
 */
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    const invoice = await Invoice.findById(id).populate(
      'subscription_id',
      'subscription_number status payment_terms lines'
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching invoice',
      error: error.message,
    });
  }
};

/**
 * @desc    Advance the invoice status: Draft -> Confirmed -> Paid
 * @route   PATCH /api/invoices/:id/status
 * @access  Public / Authenticated
 */
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: requestedStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID format',
      });
    }

    if (!requestedStatus || typeof requestedStatus !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Field "status" is required in request body as a string',
      });
    }

    if (!INVOICE_STATUSES.includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${requestedStatus}'. Valid options are: ${INVOICE_STATUSES.join(', ')}`,
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: `Invoice with ID '${id}' not found`,
      });
    }

    const currentStatus = invoice.status;

    if (currentStatus === requestedStatus) {
      return res.status(400).json({
        success: false,
        error: 'State Machine Violation',
        message: `Invoice is already in '${currentStatus}' status.`,
      });
    }

    const allowedTransitions = INVOICE_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(requestedStatus)) {
      const allowedText =
        allowedTransitions.length > 0
          ? `Allowed transition(s) from '${currentStatus}': [${allowedTransitions.map((s) => `'${s}'`).join(', ')}]`
          : `'${currentStatus}' is a terminal state. No further transitions are permitted.`;

      return res.status(400).json({
        success: false,
        error: 'State Machine Violation',
        message: `Invalid state transition: Cannot transition invoice from '${currentStatus}' to '${requestedStatus}'. ${allowedText}`,
        current_status: currentStatus,
        requested_status: requestedStatus,
        allowed_transitions: allowedTransitions,
      });
    }

    // Apply valid status transition
    invoice.status = requestedStatus;

    const updatedInvoice = await invoice.save();

    return res.status(200).json({
      success: true,
      message: `Invoice status successfully advanced from '${currentStatus}' to '${requestedStatus}'`,
      data: updatedInvoice,
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating invoice status',
      error: error.message,
    });
  }
};

module.exports = {
  INVOICE_TRANSITIONS,
  getAllInvoices,
  getOutstandingInvoices,
  getInvoicePaymentsHandler,
  getInvoiceById,
  updateInvoiceStatus,
};

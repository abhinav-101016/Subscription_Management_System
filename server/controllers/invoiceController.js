const mongoose = require('mongoose');
const { Invoice, INVOICE_STATUSES } = require('../models/Invoice');

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
  getInvoiceById,
  updateInvoiceStatus,
};


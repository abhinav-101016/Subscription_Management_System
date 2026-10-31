const mongoose = require('mongoose');
const { recordPayment, getInvoicePayments } = require('../services/paymentService');
const Payment = require('../models/Payment');

/**
 * @desc    Record a new payment against an invoice
 * @route   POST /api/payments
 * @access  Public / Authenticated
 */
const createPayment = async (req, res) => {
  try {
    const { invoice_id, invoiceId, method, amount, payment_date, notes } = req.body;
    const targetInvoiceId = invoice_id || invoiceId;

    if (!targetInvoiceId) {
      return res.status(400).json({
        success: false,
        message: 'invoice_id is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetInvoiceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice_id format',
      });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'amount is required',
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0. Negative or zero payments are not allowed',
      });
    }

    if (!method || typeof method !== 'string' || !method.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required (e.g., "Credit Card", "Bank Transfer")',
      });
    }

    const result = await recordPayment(targetInvoiceId, {
      method: method.trim(),
      amount: numAmount,
      payment_date,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        payment: result.payment,
        invoice: result.invoice,
        total_paid: result.total_paid,
        amount_due: result.amount_due,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error.message);
    const statusCode =
      error.message.includes('not found') ? 404 :
      error.message.includes('exceeds') ||
      error.message.includes('already Paid') ||
      error.message.includes('allowed')
        ? 400
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error while recording payment',
    });
  }
};

/**
 * @desc    List all payments with optional invoice filter
 * @route   GET /api/payments
 * @access  Public / Authenticated
 */
const getAllPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.invoice_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.invoice_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invoice_id filter format',
        });
      }
      filter.invoice_id = req.query.invoice_id;
    }

    const payments = await Payment.find(filter)
      .populate('invoice_id', 'invoice_number grand_total amount_paid amount_due status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching payments',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single payment by ID
 * @route   GET /api/payments/:id
 * @access  Public / Authenticated
 */
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format',
      });
    }

    const payment = await Payment.findById(id).populate(
      'invoice_id',
      'invoice_number grand_total amount_paid amount_due status'
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching payment',
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
};


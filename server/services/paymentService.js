const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const { Invoice } = require('../models/Invoice');

/**
 * Record a payment against a specific invoice within a MongoDB transaction.
 *
 * Validations:
 * 1. Invoice exists and status is not already "Paid"
 * 2. Payment amount is strictly positive (no negative or zero values)
 * 3. Payment amount does not exceed invoice remaining balance / grand_total
 * 4. Automatically updates invoice status to "Paid" if total paid equals or exceeds grand_total
 *
 * @param {string|mongoose.Types.ObjectId} invoice_id
 * @param {Object} payment_data
 * @param {string} payment_data.method - E.g. "Credit Card", "Bank Transfer"
 * @param {number} payment_data.amount - Payment value
 * @param {Date|string} [payment_data.payment_date] - Date of transaction
 * @param {string} [payment_data.notes] - Additional notes
 * @param {Object} [options]
 * @returns {Promise<Object>} { invoice, payment, total_paid, amount_due }
 */
const recordPayment = async (invoice_id, payment_data, options = {}) => {
  if (!invoice_id || !mongoose.Types.ObjectId.isValid(invoice_id)) {
    throw new Error('A valid invoice_id (MongoDB ObjectId) is required');
  }

  if (!payment_data || typeof payment_data !== 'object') {
    throw new Error('payment_data object is required');
  }

  const { method, amount, payment_date, notes } = payment_data;

  // 1. Validation to prevent negative payment amounts
  if (amount === undefined || amount === null) {
    throw new Error('Payment amount is required');
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Payment amount must be a positive number greater than 0. Negative or zero payments are not allowed');
  }

  const roundedAmount = Number(numericAmount.toFixed(2));

  if (!method || typeof method !== 'string' || !method.trim()) {
    throw new Error('Payment method is required (e.g., "Credit Card", "Bank Transfer")');
  }

  let session = options.session || null;
  let isInternalTransaction = false;

  // Use existing session if provided, or initialize a new transaction session
  if (!session) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      isInternalTransaction = true;
    } catch (sessionErr) {
      if (session) {
        session.endSession();
        session = null;
      }
      isInternalTransaction = false;
    }
  }

  try {
    // 2. Validate invoice exists and its current status is not already "Paid"
    const invoiceQuery = Invoice.findById(invoice_id);
    if (session) invoiceQuery.session(session);
    const invoice = await invoiceQuery.exec();

    if (!invoice) {
      throw new Error(`Invoice with ID '${invoice_id}' not found`);
    }

    if (invoice.status === 'Paid') {
      throw new Error('Cannot record payment for an invoice that is already Paid');
    }

    // 3. Prevent recording payments that exceed the invoice's grand total / remaining balance
    const paymentsQuery = Payment.find({ invoice_id: invoice._id });
    if (session) paymentsQuery.session(session);
    const existingPayments = await paymentsQuery.exec();

    const currentTotalPaid = Number(
      existingPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toFixed(2)
    );
    const remainingBalance = Number((invoice.grand_total - currentTotalPaid).toFixed(2));

    if (roundedAmount > remainingBalance) {
      throw new Error(
        `Payment amount of $${roundedAmount} exceeds remaining balance of $${remainingBalance} (Invoice Grand Total: $${invoice.grand_total}, Already Paid: $${currentTotalPaid})`
      );
    }

    // 4. Create the new Payment document
    const payment = new Payment({
      invoice_id: invoice._id,
      method: method.trim(),
      amount: roundedAmount,
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      notes: notes ? String(notes).trim() : '',
    });

    const savedPayment = await payment.save({ session });

    // 5. Calculate new total amount paid
    const newTotalPaid = Number((currentTotalPaid + roundedAmount).toFixed(2));
    const newAmountDue = Math.max(0, Number((invoice.grand_total - newTotalPaid).toFixed(2)));

    invoice.amount_paid = newTotalPaid;
    invoice.amount_due = newAmountDue;

    // 6. If total paid equals or exceeds grand_total, automatically update invoice status to "Paid"
    if (newTotalPaid >= invoice.grand_total) {
      invoice.status = 'Paid';
    }

    const updatedInvoice = await invoice.save({ session });

    if (isInternalTransaction && session) {
      await session.commitTransaction();
    }

    return {
      success: true,
      message:
        updatedInvoice.status === 'Paid'
          ? 'Payment recorded successfully and invoice is now fully Paid'
          : `Payment of $${roundedAmount} recorded. Outstanding balance: $${newAmountDue}`,
      payment: savedPayment,
      invoice: updatedInvoice,
      total_paid: newTotalPaid,
      amount_due: newAmountDue,
    };
  } catch (error) {
    if (isInternalTransaction && session) {
      await session.abortTransaction();
    }
    console.error('Error in recordPayment service:', error.message);
    throw error;
  } finally {
    if (isInternalTransaction && session) {
      session.endSession();
    }
  }
};

/**
 * Fetch all payments for a specific invoice
 * @param {string|mongoose.Types.ObjectId} invoice_id
 * @returns {Promise<Array>} List of payments
 */
const getInvoicePayments = async (invoice_id) => {
  if (!invoice_id || !mongoose.Types.ObjectId.isValid(invoice_id)) {
    throw new Error('A valid invoice_id format is required');
  }

  return await Payment.find({ invoice_id }).sort({ payment_date: -1 });
};

module.exports = {
  recordPayment,
  getInvoicePayments,
};


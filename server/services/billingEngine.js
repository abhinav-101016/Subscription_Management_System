const mongoose = require('mongoose');
const { Subscription } = require('../models/Subscription');
const { Invoice } = require('../models/Invoice');
const TaxRule = require('../models/TaxRule');

/**
 * Helper to generate a unique invoice number
 */
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(100000 + Math.random() * 900000);
  return `INV-${dateStr}-${randomStr}`;
};

/**
 * Execute the core billing calculations and persistence for due subscriptions
 * @param {Object} params
 * @param {Date} params.referenceDate
 * @param {mongoose.ClientSession|null} params.session
 */
const processBillingCycle = async ({ referenceDate, session = null }) => {
  // 1. Query for all Subscriptions where status is "Active" and next billing date is today or in the past
  const query = {
    status: 'Active',
    $or: [
      { next_billing_date: { $lte: referenceDate } },
      { next_billing_date: { $exists: false }, start_date: { $lte: referenceDate } },
      { next_billing_date: null, start_date: { $lte: referenceDate } },
    ],
    $and: [
      {
        $or: [
          { expiry_date: { $exists: false } },
          { expiry_date: null },
          { expiry_date: { $gte: referenceDate } },
        ],
      },
    ],
  };

  const findQuery = Subscription.find(query);
  if (session) {
    findQuery.session(session);
  }
  const dueSubscriptions = await findQuery.exec();

  // 2. Fetch the current active TaxRule
  const taxRuleQuery = TaxRule.findOne({ active: true }).sort({ updatedAt: -1 });
  if (session) {
    taxRuleQuery.session(session);
  }
  const activeTaxRule = await taxRuleQuery.exec();
  const taxPercentage = activeTaxRule ? Number(activeTaxRule.percentage_rate) : 0;

  const generatedInvoices = [];
  const skippedInvoices = [];

  for (const sub of dueSubscriptions) {
    const intervalDays = sub.billing_interval_days || 30;
    const periodStart = sub.next_billing_date ? new Date(sub.next_billing_date) : new Date(sub.start_date || referenceDate);
    const periodEnd = new Date(periodStart.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // 4. CRITICAL: Idempotency check
    // Check if an invoice already exists for this specific subscription and billing period
    const existingCheckQuery = Invoice.findOne({
      subscription_id: sub._id,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
    });
    if (session) {
      existingCheckQuery.session(session);
    }
    const existingInvoice = await existingCheckQuery.exec();

    if (existingInvoice) {
      skippedInvoices.push({
        subscription_id: sub._id,
        subscription_number: sub.subscription_number,
        customer_id: sub.customer_id,
        reason: `Invoice already exists (${existingInvoice.invoice_number}) for period ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}`,
        existing_invoice_id: existingInvoice._id,
        existing_invoice_number: existingInvoice.invoice_number,
        period_start: periodStart,
        period_end: periodEnd,
      });
      continue;
    }

    // Skip subscriptions that have no line items
    if (!sub.lines || sub.lines.length === 0) {
      skippedInvoices.push({
        subscription_id: sub._id,
        subscription_number: sub.subscription_number,
        reason: 'Subscription has no line items defined',
      });
      continue;
    }

    // Copy lines from subscription and calculate amounts
    const invoiceLines = sub.lines.map((line) => {
      const quantity = Number(line.quantity) || 1;
      const unitPrice = Number(line.unit_price) || 0;
      const total = Number((quantity * unitPrice).toFixed(2));
      return {
        variant_id: line.variant_id,
        quantity,
        unit_price: unitPrice,
        total,
      };
    });

    const subtotal = Number(
      invoiceLines.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)
    );
    const taxTotal = Number(((subtotal * taxPercentage) / 100).toFixed(2));
    const grandTotal = Number((subtotal + taxTotal).toFixed(2));

    let uniqueInvoiceNumber = generateInvoiceNumber();
    // Safety check for invoice number collision
    const invoiceNumCheck = Invoice.findOne({ invoice_number: uniqueInvoiceNumber });
    if (session) invoiceNumCheck.session(session);
    const existingNum = await invoiceNumCheck.exec();
    if (existingNum) {
      uniqueInvoiceNumber = `${uniqueInvoiceNumber}-${Math.floor(10 + Math.random() * 90)}`;
    }

    // 3. Create a new Invoice document with status strictly set to "Draft"
    const newInvoice = new Invoice({
      invoice_number: uniqueInvoiceNumber,
      subscription_id: sub._id,
      customer_id: sub.customer_id,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      lines: invoiceLines,
      subtotal,
      tax_total: taxTotal,
      grand_total: grandTotal,
      status: 'Draft',
      tax_rule_applied: activeTaxRule
        ? {
            tax_rule_id: activeTaxRule._id,
            name: activeTaxRule.name,
            percentage_rate: taxPercentage,
          }
        : undefined,
    });

    const savedInvoice = await newInvoice.save({ session });

    // Advance subscription's next billing date to periodEnd and update last billed date
    sub.last_billed_date = referenceDate;
    sub.next_billing_date = periodEnd;
    await sub.save({ session });

    generatedInvoices.push(savedInvoice);
  }

  return {
    reference_date: referenceDate,
    total_due_subscriptions: dueSubscriptions.length,
    invoices_generated: generatedInvoices.length,
    invoices_skipped: skippedInvoices.length,
    tax_rule_applied: activeTaxRule
      ? {
          name: activeTaxRule.name,
          percentage_rate: taxPercentage,
        }
      : null,
    generated_invoices: generatedInvoices,
    skipped_invoices: skippedInvoices,
  };
};

/**
 * Core function to run "Billing Day"
 * Handles transactions where supported, with graceful fallback for standalone MongoDB instances
 *
 * @param {Object} options
 * @param {Date|string} [options.referenceDate] - Date to evaluate due subscriptions against (defaults to now)
 * @returns {Promise<Object>} Billing run result summary
 */
const generateDueInvoices = async (options = {}) => {
  const referenceDate = options.referenceDate ? new Date(options.referenceDate) : new Date();

  if (isNaN(referenceDate.getTime())) {
    throw new Error('Invalid referenceDate provided to billing engine');
  }

  let session = null;
  let isTransactional = false;

  // Attempt to use MongoDB Transactions if supported
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    isTransactional = true;
  } catch (sessionErr) {
    // If running in standalone MongoDB mode where replica set is not initialized
    if (session) {
      session.endSession();
      session = null;
    }
    isTransactional = false;
  }

  try {
    const result = await processBillingCycle({ referenceDate, session });

    if (isTransactional && session) {
      await session.commitTransaction();
    }

    return result;
  } catch (error) {
    if (isTransactional && session) {
      await session.abortTransaction();
    }
    console.error('Billing Engine execution failed:', error);
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

module.exports = {
  generateDueInvoices,
  processBillingCycle,
  generateInvoiceNumber,
};


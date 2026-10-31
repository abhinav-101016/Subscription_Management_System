const assert = require('assert');
const mongoose = require('mongoose');
const TaxRule = require('../models/TaxRule');
const { Invoice, INVOICE_STATUSES } = require('../models/Invoice');
const { Subscription } = require('../models/Subscription');
const { processBillingCycle } = require('../services/billingEngine');
const { updateInvoiceStatus, INVOICE_TRANSITIONS } = require('../controllers/invoiceController');

console.log('--- 1. Testing TaxRule & Invoice Model Definitions ---');

// TaxRule schema verification
const taxPaths = TaxRule.schema.paths;
assert(taxPaths['name'], 'TaxRule: name is missing');
assert(taxPaths['percentage_rate'], 'TaxRule: percentage_rate is missing');
assert(taxPaths['active'], 'TaxRule: active is missing');
console.log('✓ TaxRule schema fields verified (name, percentage_rate, active)');

// Invoice schema verification
const invPaths = Invoice.schema.paths;
assert(invPaths['invoice_number'], 'Invoice: invoice_number is missing');
assert(invPaths['subscription_id'], 'Invoice: subscription_id is missing');
assert(invPaths['customer_id'], 'Invoice: customer_id is missing');
assert(invPaths['billing_period_start'], 'Invoice: billing_period_start is missing');
assert(invPaths['billing_period_end'], 'Invoice: billing_period_end is missing');
assert(invPaths['lines'], 'Invoice: lines is missing');
assert(invPaths['subtotal'], 'Invoice: subtotal is missing');
assert(invPaths['tax_total'], 'Invoice: tax_total is missing');
assert(invPaths['grand_total'], 'Invoice: grand_total is missing');
assert(invPaths['status'], 'Invoice: status is missing');

const invoiceStatusEnum = invPaths['status'].enumValues;
assert.deepStrictEqual(invoiceStatusEnum, ['Draft', 'Confirmed', 'Paid']);
console.log('✓ Invoice schema fields and status enum ["Draft", "Confirmed", "Paid"] strictly match specifications');

console.log('\n--- 2. Testing Invoice State Machine Transitions ---');
assert.deepStrictEqual(INVOICE_TRANSITIONS['Draft'], ['Confirmed']);
assert.deepStrictEqual(INVOICE_TRANSITIONS['Confirmed'], ['Paid']);
assert.deepStrictEqual(INVOICE_TRANSITIONS['Paid'], []);
console.log('✓ Invoice transitions strict sequential rules (Draft -> Confirmed -> Paid) verified');

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function testInvoiceTransition(currentStatus, requestedStatus, expectedCode, expectedSuccess) {
  const mockInv = {
    _id: new mongoose.Types.ObjectId(),
    status: currentStatus,
    save: async function () {
      return this;
    },
  };

  const origFindById = Invoice.findById;
  Invoice.findById = async () => mockInv;

  const req = {
    params: { id: mockInv._id.toString() },
    body: { status: requestedStatus },
  };
  const res = mockRes();

  await updateInvoiceStatus(req, res);
  Invoice.findById = origFindById;

  assert.strictEqual(
    res.statusCode,
    expectedCode,
    `Expected status code ${expectedCode} for ${currentStatus} -> ${requestedStatus}, got ${res.statusCode}`
  );
  assert.strictEqual(
    res.body.success,
    expectedSuccess,
    `Expected success=${expectedSuccess} for ${currentStatus} -> ${requestedStatus}`
  );
  return res.body;
}

(async () => {
  // Valid Invoice transitions
  await testInvoiceTransition('Draft', 'Confirmed', 200, true);
  console.log('✓ Draft -> Confirmed (200 OK)');

  await testInvoiceTransition('Confirmed', 'Paid', 200, true);
  console.log('✓ Confirmed -> Paid (200 OK)');

  // Invalid transitions
  const resDraftPaid = await testInvoiceTransition('Draft', 'Paid', 400, false);
  assert(resDraftPaid.message.includes('Invalid state transition'));
  console.log('✓ Draft -> Paid blocked (Must confirm first)');

  const resPaidConfirmed = await testInvoiceTransition('Paid', 'Confirmed', 400, false);
  assert(resPaidConfirmed.message.includes('terminal state'));
  console.log('✓ Paid -> Confirmed blocked (Terminal state)');

  const resSameStatus = await testInvoiceTransition('Draft', 'Draft', 400, false);
  assert(resSameStatus.message.includes('already in \'Draft\' status'));
  console.log('✓ Draft -> Draft blocked');

  console.log('\n--- 3. Testing Billing Engine & Idempotency Calculations ---');

  const refDate = new Date('2026-10-31T00:00:00.000Z');
  const variantId1 = new mongoose.Types.ObjectId();
  const variantId2 = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();
  const subId = new mongoose.Types.ObjectId();

  const mockTaxRule = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Standard GST 18%',
    percentage_rate: 18,
    active: true,
  };

  const mockSubscription = {
    _id: subId,
    subscription_number: 'SUB-20261031-1001',
    customer_id: customerId,
    status: 'Active',
    start_date: new Date('2026-10-01T00:00:00.000Z'),
    next_billing_date: new Date('2026-10-31T00:00:00.000Z'),
    billing_interval_days: 30,
    lines: [
      { variant_id: variantId1, quantity: 2, unit_price: 100 }, // subtotal: 200
      { variant_id: variantId2, quantity: 1, unit_price: 50 },  // subtotal: 50
    ],
    // Subtotal = 250, Tax (18%) = 45, Grand Total = 295
    save: async function () {
      return this;
    },
  };

  const inMemoryInvoices = [];

  // Mock TaxRule.findOne
  TaxRule.findOne = () => ({
    sort: () => ({
      session: () => ({ exec: async () => mockTaxRule }),
      exec: async () => mockTaxRule,
    }),
  });

  // Mock Subscription.find
  Subscription.find = () => ({
    session: () => ({ exec: async () => [mockSubscription] }),
    exec: async () => [mockSubscription],
  });

  // Mock Invoice.findOne (for idempotency check)
  Invoice.findOne = (query) => {
    return {
      session: function () {
        return this;
      },
      exec: async () => {
        if (!query.subscription_id) return null;
        return inMemoryInvoices.find(
          (inv) =>
            inv.subscription_id.toString() === query.subscription_id.toString() &&
            inv.billing_period_start.getTime() === query.billing_period_start.getTime() &&
            inv.billing_period_end.getTime() === query.billing_period_end.getTime()
        ) || null;
      },
    };
  };

  // Mock Invoice.prototype.save
  Invoice.prototype.save = async function () {
    inMemoryInvoices.push(this);
    return this;
  };

  // Run 1: First billing execution
  console.log('Executing First Billing Run (expecting 1 generated invoice)...');
  const run1 = await processBillingCycle({ referenceDate: refDate });
  assert.strictEqual(run1.total_due_subscriptions, 1);
  assert.strictEqual(run1.invoices_generated, 1);
  assert.strictEqual(run1.invoices_skipped, 0);

  const generatedInvoice = run1.generated_invoices[0];
  assert.strictEqual(generatedInvoice.status, 'Draft', 'Invoice status must be Draft');
  assert.strictEqual(generatedInvoice.subtotal, 250, 'Subtotal calculation mismatch (2 * 100 + 1 * 50 = 250)');
  assert.strictEqual(generatedInvoice.tax_total, 45, 'Tax total calculation mismatch (18% of 250 = 45)');
  assert.strictEqual(generatedInvoice.grand_total, 295, 'Grand total calculation mismatch (250 + 45 = 295)');
  assert.strictEqual(generatedInvoice.lines.length, 2);
  console.log(`✓ Generated Invoice: ${generatedInvoice.invoice_number}`);
  console.log(`✓ Calculation verified: Subtotal=${generatedInvoice.subtotal}, Tax=${generatedInvoice.tax_total}, Grand Total=${generatedInvoice.grand_total}`);
  console.log(`✓ Status strictly verified as '${generatedInvoice.status}'`);

  // Run 2: Second billing execution with exact same subscription state and period (Idempotency test)
  console.log('\nExecuting Second Billing Run for same billing period (Idempotency Test)...');
  mockSubscription.next_billing_date = new Date('2026-10-31T00:00:00.000Z');
  const run2 = await processBillingCycle({ referenceDate: refDate });
  assert.strictEqual(run2.invoices_generated, 0, 'Must NOT generate duplicate invoice');
  assert.strictEqual(run2.invoices_skipped, 1, 'Must skip already billed invoice');
  assert(run2.skipped_invoices[0].reason.includes('Invoice already exists'));
  console.log('✓ Idempotency strictly verified: Duplicate billing avoided, invoice skipped with reason:', run2.skipped_invoices[0].reason);

  console.log('\n========================================');
  console.log('ALL BILLING & TAX TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

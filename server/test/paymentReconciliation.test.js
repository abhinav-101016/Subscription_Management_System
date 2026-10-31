const assert = require('assert');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const { Invoice } = require('../models/Invoice');
const { recordPayment } = require('../services/paymentService');

console.log('--- 1. Testing Payment & Updated Invoice Model Schemas ---');

// Payment Schema
const paymentPaths = Payment.schema.paths;
assert(paymentPaths['invoice_id'], 'Payment: invoice_id is missing');
assert(paymentPaths['method'], 'Payment: method is missing');
assert(paymentPaths['amount'], 'Payment: amount is missing');
assert(paymentPaths['payment_date'], 'Payment: payment_date is missing');
assert(paymentPaths['notes'], 'Payment: notes is missing');
console.log('✓ Payment model schema fields verified (invoice_id, method, amount, payment_date, notes)');

// Invoice Schema
const invoicePaths = Invoice.schema.paths;
assert(invoicePaths['amount_due'], 'Invoice: amount_due is missing');
assert(invoicePaths['amount_paid'], 'Invoice: amount_paid is missing');
assert(Invoice.schema.virtuals['calculated_amount_due'], 'Invoice: calculated_amount_due virtual is missing');
console.log('✓ Invoice model schema updated with amount_due, amount_paid, and calculated_amount_due virtual');

console.log('\n--- 2. Testing Payment Recording, Validations, and Auto-Status Transition ---');

(async () => {
  const invId1 = new mongoose.Types.ObjectId();
  const subId1 = new mongoose.Types.ObjectId();
  const customerId1 = new mongoose.Types.ObjectId();

  // Test Invoice setup: Grand Total $300, Confirmed status
  const mockInvoiceDoc = {
    _id: invId1,
    invoice_number: 'INV-20261031-998877',
    subscription_id: subId1,
    customer_id: customerId1,
    status: 'Confirmed',
    subtotal: 250,
    tax_total: 50,
    grand_total: 300,
    amount_paid: 0,
    amount_due: 300,
    save: async function () {
      return this;
    },
  };

  const inMemoryPayments = [];

  // Mock Invoice.findById
  Invoice.findById = () => ({
    session: function () {
      return this;
    },
    exec: async () => mockInvoiceDoc,
  });

  // Mock Payment.find
  Payment.find = () => ({
    session: function () {
      return this;
    },
    sort: function () {
      return this;
    },
    exec: async () => inMemoryPayments,
  });

  // Mock Payment.prototype.save
  Payment.prototype.save = async function () {
    inMemoryPayments.push(this);
    return this;
  };

  // Test 2.1: Rejection of negative or zero payment
  try {
    await recordPayment(invId1, { method: 'Credit Card', amount: -50 });
    assert.fail('Should have rejected negative payment amount');
  } catch (err) {
    assert(err.message.includes('greater than 0'), 'Error message must specify positive amount');
    console.log('✓ Negative payment blocked successfully:', err.message);
  }

  try {
    await recordPayment(invId1, { method: 'Credit Card', amount: 0 });
    assert.fail('Should have rejected zero payment amount');
  } catch (err) {
    assert(err.message.includes('greater than 0'));
    console.log('✓ Zero payment blocked successfully');
  }

  // Test 2.2: Rejection of payment exceeding grand_total / remaining balance
  try {
    await recordPayment(invId1, { method: 'Bank Transfer', amount: 350 }); // Exceeds 300
    assert.fail('Should have rejected overpayment');
  } catch (err) {
    assert(err.message.includes('exceeds remaining balance'), 'Error message must specify overpayment');
    console.log('✓ Overpayment blocked successfully:', err.message);
  }

  // Test 2.3: Record Partial Payment ($100 of $300)
  console.log('\nRecording Partial Payment ($100)...');
  const partialResult = await recordPayment(invId1, {
    method: 'Credit Card',
    amount: 100,
    notes: 'First installment',
  });

  assert.strictEqual(partialResult.success, true);
  assert.strictEqual(partialResult.payment.amount, 100);
  assert.strictEqual(partialResult.payment.method, 'Credit Card');
  assert.strictEqual(partialResult.total_paid, 100);
  assert.strictEqual(partialResult.amount_due, 200);
  assert.strictEqual(mockInvoiceDoc.status, 'Confirmed', 'Status must remain Confirmed on partial payment');
  console.log(`✓ Partial payment recorded: Paid=$${partialResult.total_paid}, Due=$${partialResult.amount_due}, Status=${mockInvoiceDoc.status}`);

  // Test 2.4: Attempt overpayment against remaining balance ($250 when only $200 is due)
  try {
    await recordPayment(invId1, { method: 'Bank Transfer', amount: 250 });
    assert.fail('Should have rejected payment exceeding remaining balance of 200');
  } catch (err) {
    assert(err.message.includes('exceeds remaining balance'));
    console.log('✓ Payment exceeding remaining balance ($250 > $200) blocked successfully');
  }

  // Test 2.5: Record Final Payment ($200 remaining) -> Automatically update status to "Paid"
  console.log('\nRecording Final Payment ($200)...');
  const finalResult = await recordPayment(invId1, {
    method: 'Bank Transfer',
    amount: 200,
    notes: 'Final settlement',
  });

  assert.strictEqual(finalResult.success, true);
  assert.strictEqual(finalResult.total_paid, 300);
  assert.strictEqual(finalResult.amount_due, 0);
  assert.strictEqual(mockInvoiceDoc.status, 'Paid', 'Status must automatically transition to "Paid" when fully settled');
  console.log(`✓ Final payment recorded: Paid=$${finalResult.total_paid}, Due=$${finalResult.amount_due}, Status=${mockInvoiceDoc.status}`);

  // Test 2.6: Rejection of payment against already "Paid" invoice
  try {
    await recordPayment(invId1, { method: 'Credit Card', amount: 50 });
    assert.fail('Should have rejected payment on already Paid invoice');
  } catch (err) {
    assert(err.message.includes('already Paid'), 'Must reject payment on already Paid invoice');
    console.log('✓ Subsequent payment on Paid invoice blocked successfully:', err.message);
  }

  console.log('\n========================================');
  console.log('ALL PAYMENT RECONCILIATION TESTS PASSED!');
  console.log('========================================');
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});


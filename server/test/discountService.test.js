const assert = require('assert');
const mongoose = require('mongoose');
const { DiscountRule, DISCOUNT_TYPES, APPLICABILITY_TYPES } = require('../models/DiscountRule');
const { evaluateDiscountRule, applyDiscountToInvoice } = require('../services/discountService');
const { Invoice } = require('../models/Invoice');
const { Subscription } = require('../models/Subscription');

console.log('--- 1. Testing DiscountRule Model Schema & Enum Definitions ---');

const paths = DiscountRule.schema.paths;
assert(paths['name'], 'DiscountRule: name is missing');
assert(paths['type'], 'DiscountRule: type is missing');
assert(paths['value'], 'DiscountRule: value is missing');
assert(paths['min_purchase_amount'], 'DiscountRule: min_purchase_amount is missing');
assert(paths['min_quantity'], 'DiscountRule: min_quantity is missing');
assert(paths['valid_from'], 'DiscountRule: valid_from is missing');
assert(paths['valid_to'], 'DiscountRule: valid_to is missing');
assert(paths['usage_limit'], 'DiscountRule: usage_limit is missing');
assert(paths['times_used'], 'DiscountRule: times_used is missing');
assert(paths['applicability'], 'DiscountRule: applicability is missing');
assert(paths['applicable_product_id'], 'DiscountRule: applicable_product_id is missing');

assert.deepStrictEqual(DISCOUNT_TYPES, ['Fixed', 'Percentage']);
assert.deepStrictEqual(APPLICABILITY_TYPES, ['Specific_Product', 'Whole_Subscription']);
console.log('✓ DiscountRule schema fields, types, and applicability enums verified');

console.log('\n--- 2. Testing Constraint Validation & Discount Calculations ---');

const prodVariantA = new mongoose.Types.ObjectId();
const prodVariantB = new mongoose.Types.ObjectId();

const mockInvoice = {
  _id: new mongoose.Types.ObjectId(),
  invoice_number: 'INV-20261031-112233',
  subtotal: 300,
  discount_total: 0,
  tax_total: 54, // 18% tax
  grand_total: 354,
  tax_rule_applied: { percentage_rate: 18 },
  lines: [
    { variant_id: prodVariantA, quantity: 2, unit_price: 100, total: 200 }, // Product A total = 200, qty = 2
    { variant_id: prodVariantB, quantity: 1, unit_price: 100, total: 100 }, // Product B total = 100, qty = 1
  ],
};

const refDate = new Date('2026-10-31T12:00:00.000Z');

// Test 2.1: Whole Subscription Percentage Discount (10% of 300 = 30)
const ruleWholePercent = {
  name: '10% Off Entire Subscription',
  type: 'Percentage',
  value: 10,
  applicability: 'Whole_Subscription',
  times_used: 0,
  usage_limit: 100,
};
const eval1 = evaluateDiscountRule(ruleWholePercent, mockInvoice, refDate);
assert.strictEqual(eval1.isValid, true);
assert.strictEqual(eval1.discountAmount, 30);
console.log('✓ Whole_Subscription Percentage discount: calculated $30 (10% of $300)');

// Test 2.2: Whole Subscription Fixed Discount ($50 off)
const ruleWholeFixed = {
  name: '$50 Off Entire Subscription',
  type: 'Fixed',
  value: 50,
  applicability: 'Whole_Subscription',
  times_used: 0,
};
const eval2 = evaluateDiscountRule(ruleWholeFixed, mockInvoice, refDate);
assert.strictEqual(eval2.isValid, true);
assert.strictEqual(eval2.discountAmount, 50);
console.log('✓ Whole_Subscription Fixed discount: calculated $50');

// Test 2.3: Specific Product Percentage Discount (25% off Product A subtotal of $200 = $50)
const ruleSpecificPercent = {
  name: '25% Off Product A',
  type: 'Percentage',
  value: 25,
  applicability: 'Specific_Product',
  applicable_product_id: prodVariantA,
  times_used: 0,
};
const eval3 = evaluateDiscountRule(ruleSpecificPercent, mockInvoice, refDate);
assert.strictEqual(eval3.isValid, true);
assert.strictEqual(eval3.discountAmount, 50);
console.log('✓ Specific_Product Percentage discount: calculated $50 (25% of $200 for Product A)');

// Test 2.4: Specific Product Fixed Discount ($40 off Product A)
const ruleSpecificFixed = {
  name: '$40 Off Product A',
  type: 'Fixed',
  value: 40,
  applicability: 'Specific_Product',
  applicable_product_id: prodVariantA,
  times_used: 0,
};
const eval4 = evaluateDiscountRule(ruleSpecificFixed, mockInvoice, refDate);
assert.strictEqual(eval4.isValid, true);
assert.strictEqual(eval4.discountAmount, 40);
console.log('✓ Specific_Product Fixed discount: calculated $40');

// Test 2.5: Expired Rule constraint
const expiredRule = {
  name: 'Expired 10%',
  type: 'Percentage',
  value: 10,
  applicability: 'Whole_Subscription',
  valid_to: new Date('2026-10-01T00:00:00.000Z'),
};
const evalExpired = evaluateDiscountRule(expiredRule, mockInvoice, refDate);
assert.strictEqual(evalExpired.isValid, false);
assert(evalExpired.reason.includes('expired'));
console.log('✓ Expired discount rule blocked successfully');

// Test 2.6: Future Start Date constraint
const futureRule = {
  name: 'Black Friday 50%',
  type: 'Percentage',
  value: 50,
  applicability: 'Whole_Subscription',
  valid_from: new Date('2026-11-25T00:00:00.000Z'),
};
const evalFuture = evaluateDiscountRule(futureRule, mockInvoice, refDate);
assert.strictEqual(evalFuture.isValid, false);
assert(evalFuture.reason.includes('not yet active'));
console.log('✓ Future discount rule blocked successfully');

// Test 2.7: Usage Limit Exhausted constraint
const exhaustedRule = {
  name: 'Limited 100 Uses',
  type: 'Fixed',
  value: 10,
  applicability: 'Whole_Subscription',
  usage_limit: 5,
  times_used: 5,
};
const evalExhausted = evaluateDiscountRule(exhaustedRule, mockInvoice, refDate);
assert.strictEqual(evalExhausted.isValid, false);
assert(evalExhausted.reason.includes('usage limit'));
console.log('✓ Exhausted usage limit rule blocked successfully');

// Test 2.8: Min Purchase Amount constraint
const highMinPurchaseRule = {
  name: 'Min $500 Purchase',
  type: 'Percentage',
  value: 10,
  applicability: 'Whole_Subscription',
  min_purchase_amount: 500,
};
const evalMinAmount = evaluateDiscountRule(highMinPurchaseRule, mockInvoice, refDate);
assert.strictEqual(evalMinAmount.isValid, false);
assert(evalMinAmount.reason.includes('Minimum purchase amount'));
console.log('✓ Min purchase amount constraint enforced successfully');

// Test 2.9: Min Quantity constraint
const highMinQtyRule = {
  name: 'Min 10 Items',
  type: 'Percentage',
  value: 10,
  applicability: 'Whole_Subscription',
  min_quantity: 10, // Invoice only has 3 items
};
const evalMinQty = evaluateDiscountRule(highMinQtyRule, mockInvoice, refDate);
assert.strictEqual(evalMinQty.isValid, false);
assert(evalMinQty.reason.includes('Minimum required quantity'));
console.log('✓ Min quantity constraint enforced successfully');

console.log('\n--- 3. Testing Full Service Execution & Grand Total Recalculation ---');

(async () => {
  const invId = new mongoose.Types.ObjectId();
  const subId = new mongoose.Types.ObjectId();
  const ruleId = new mongoose.Types.ObjectId();

  const testInvoiceDoc = {
    _id: invId,
    subscription_id: subId,
    status: 'Draft',
    subtotal: 200,
    discount_total: 0,
    tax_total: 36, // 18% of 200
    grand_total: 236,
    tax_rule_applied: { percentage_rate: 18 },
    lines: [
      { variant_id: prodVariantA, quantity: 2, unit_price: 100, total: 200 },
    ],
    save: async function () {
      return this;
    },
  };

  const testSubDoc = {
    _id: subId,
    customer_id: new mongoose.Types.ObjectId(),
  };

  const testRuleDoc = {
    _id: ruleId,
    name: 'Special $50 Off',
    type: 'Fixed',
    value: 50,
    applicability: 'Whole_Subscription',
    times_used: 3,
    usage_limit: 10,
    save: async function () {
      return this;
    },
  };

  // Mock DB lookups
  Invoice.findById = () => ({
    session: function () { return this; },
    exec: async () => testInvoiceDoc,
  });

  Subscription.findById = () => ({
    session: function () { return this; },
    exec: async () => testSubDoc,
  });

  DiscountRule.findById = () => ({
    session: function () { return this; },
    exec: async () => testRuleDoc,
  });

  const result = await applyDiscountToInvoice(invId, subId, {
    discount_rule_id: ruleId,
    referenceDate: refDate,
  });

  assert.strictEqual(result.applied, true);
  assert.strictEqual(testRuleDoc.times_used, 4, 'times_used must be incremented by 1');
  assert.strictEqual(testInvoiceDoc.discount_total, 50, 'Invoice discount_total must be $50');

  // Recalculated values:
  // Discounted subtotal = 200 - 50 = 150
  // Tax (18% of 150) = 27
  // Grand Total = 150 + 27 = 177
  assert.strictEqual(testInvoiceDoc.tax_total, 27, 'tax_total must be recalculated to 18% of discounted subtotal');
  assert.strictEqual(testInvoiceDoc.grand_total, 177, 'grand_total must be recalculated to discounted subtotal + tax');

  console.log(`✓ times_used correctly incremented to ${testRuleDoc.times_used}`);
  console.log(`✓ Invoice discount_total set to $${testInvoiceDoc.discount_total}`);
  console.log(`✓ Invoice tax_total recalculated to $${testInvoiceDoc.tax_total}`);
  console.log(`✓ Invoice grand_total recalculated to $${testInvoiceDoc.grand_total}`);

  console.log('\n========================================');
  console.log('ALL DISCOUNT RULES TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
})().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});


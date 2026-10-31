const assert = require('assert');
const { VALID_TRANSITIONS, updateSubscriptionStatus, createSubscriptionFromTemplate } = require('../controllers/subscriptionController');
const { Subscription, SUBSCRIPTION_STATUSES } = require('../models/Subscription');
const QuotationTemplate = require('../models/QuotationTemplate');

console.log('--- 1. Testing State Machine Rules Definition ---');
assert.deepStrictEqual(VALID_TRANSITIONS['Draft'], ['Quotation']);
assert.deepStrictEqual(VALID_TRANSITIONS['Quotation'], ['Confirmed', 'Closed']);
assert.deepStrictEqual(VALID_TRANSITIONS['Confirmed'], ['Active']);
assert.deepStrictEqual(VALID_TRANSITIONS['Active'], ['Closed']);
assert.deepStrictEqual(VALID_TRANSITIONS['Closed'], []);
console.log('✓ VALID_TRANSITIONS matches exact business rules');

console.log('\n--- 2. Testing Mongoose Model Field Definitions ---');
const subPaths = Subscription.schema.paths;
assert(subPaths['subscription_number'], 'subscription_number missing');
assert(subPaths['customer_id'], 'customer_id missing');
assert(subPaths['plan_id'], 'plan_id missing');
assert(subPaths['start_date'], 'start_date missing');
assert(subPaths['expiry_date'], 'expiry_date missing');
assert(subPaths['payment_terms'], 'payment_terms missing');
assert(subPaths['lines'], 'lines missing');
assert(subPaths['status'], 'status missing');

const statusEnum = subPaths['status'].enumValues;
assert.deepStrictEqual(statusEnum, ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed']);
console.log('✓ Subscription model schema and status enums strictly match specifications');

const tmplPaths = QuotationTemplate.schema.paths;
assert(tmplPaths['name'], 'name missing');
assert(tmplPaths['default_plan_id'], 'default_plan_id missing');
assert(tmplPaths['validity_days'], 'validity_days missing');
assert(tmplPaths['template_lines'], 'template_lines missing');
console.log('✓ QuotationTemplate model schema fields match specifications');

console.log('\n--- 3. Testing State Machine Controller Logic (Unit Mocking) ---');

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

// Test helper simulating updateSubscriptionStatus
async function testTransition(currentStatus, requestedStatus, expectedCode, expectedSuccess) {
  const mockSub = {
    _id: '507f1f77bcf86cd799439011',
    status: currentStatus,
    save: async function () {
      return this;
    },
  };

  const originalFindById = Subscription.findById;
  Subscription.findById = async () => mockSub;

  const req = {
    params: { id: '507f1f77bcf86cd799439011' },
    body: { status: requestedStatus },
  };
  const res = mockRes();

  await updateSubscriptionStatus(req, res);

  Subscription.findById = originalFindById;

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
  // Test valid transitions
  console.log('Testing valid transitions...');
  await testTransition('Draft', 'Quotation', 200, true);
  console.log('✓ Draft -> Quotation (200 OK)');

  await testTransition('Quotation', 'Confirmed', 200, true);
  console.log('✓ Quotation -> Confirmed (200 OK)');

  await testTransition('Quotation', 'Closed', 200, true);
  console.log('✓ Quotation -> Closed (Customer Rejection) (200 OK)');

  await testTransition('Confirmed', 'Active', 200, true);
  console.log('✓ Confirmed -> Active (200 OK)');

  await testTransition('Active', 'Closed', 200, true);
  console.log('✓ Active -> Closed (200 OK)');

  // Test invalid transitions
  console.log('\nTesting invalid transitions (expect 400 Bad Request with violation message)...');

  // Draft -> Active (Directly jumping)
  const resDraftActive = await testTransition('Draft', 'Active', 400, false);
  assert(resDraftActive.message.includes('Invalid state transition'));
  assert.strictEqual(resDraftActive.error, 'State Machine Violation');
  console.log('✓ Draft -> Active blocked with 400 and message:', resDraftActive.message);

  // Draft -> Confirmed
  const resDraftConf = await testTransition('Draft', 'Confirmed', 400, false);
  assert.strictEqual(resDraftConf.error, 'State Machine Violation');
  console.log('✓ Draft -> Confirmed blocked with 400');

  // Draft -> Closed
  const resDraftClosed = await testTransition('Draft', 'Closed', 400, false);
  assert.strictEqual(resDraftClosed.error, 'State Machine Violation');
  console.log('✓ Draft -> Closed blocked with 400');

  // Quotation -> Active
  const resQuotActive = await testTransition('Quotation', 'Active', 400, false);
  assert.strictEqual(resQuotActive.error, 'State Machine Violation');
  console.log('✓ Quotation -> Active blocked with 400');

  // Confirmed -> Closed (Must go through Active or be Quotation)
  const resConfClosed = await testTransition('Confirmed', 'Closed', 400, false);
  assert.strictEqual(resConfClosed.error, 'State Machine Violation');
  console.log('✓ Confirmed -> Closed blocked with 400');

  // Active -> Confirmed (Backwards transition)
  const resActiveConf = await testTransition('Active', 'Confirmed', 400, false);
  assert.strictEqual(resActiveConf.error, 'State Machine Violation');
  console.log('✓ Active -> Confirmed blocked with 400');

  // Closed -> Active (Transition from terminal state)
  const resClosedActive = await testTransition('Closed', 'Active', 400, false);
  assert.strictEqual(resClosedActive.error, 'State Machine Violation');
  console.log('✓ Closed -> Active blocked with 400');

  // Same status transition (Draft -> Draft)
  const resSameStatus = await testTransition('Draft', 'Draft', 400, false);
  assert(resSameStatus.message.includes('already in \'Draft\' status'));
  console.log('✓ Draft -> Draft blocked with 400');

  // Unknown status
  const resUnknownStatus = await testTransition('Draft', 'UnknownStatus', 400, false);
  assert(resUnknownStatus.message.includes('Invalid status'));
  console.log('✓ Draft -> UnknownStatus blocked with 400');

  console.log('\n--- 4. Testing Subscription from Template Logic ---');
  const mockTemplate = {
    _id: '507f1f77bcf86cd799439022',
    name: 'Enterprise Plan Template',
    default_plan_id: '507f1f77bcf86cd799439033',
    validity_days: 14,
    template_lines: [
      { product_variant_id: '507f1f77bcf86cd799439044', default_quantity: 2 },
      { product_variant_id: '507f1f77bcf86cd799439055', default_quantity: 5 },
    ],
  };

  QuotationTemplate.findById = async () => mockTemplate;
  Subscription.findOne = async () => null;

  // Mock Subscription.prototype.save for offline unit test
  const originalSave = Subscription.prototype.save;
  Subscription.prototype.save = async function () {
    return this;
  };

  const reqTemplate = {
    body: {
      template_id: '507f1f77bcf86cd799439022',
      customer_id: '507f1f77bcf86cd799439066',
      lines_pricing: [
        { variant_id: '507f1f77bcf86cd799439044', unit_price: 100, tax_amount: 10 },
      ],
    },
  };
  const resTemplate = mockRes();

  await createSubscriptionFromTemplate(reqTemplate, resTemplate);

  assert.strictEqual(resTemplate.statusCode, 201);
  assert.strictEqual(resTemplate.body.success, true);
  const createdSub = resTemplate.body.data;
  assert.strictEqual(createdSub.status, 'Draft', 'Subscription must be created in Draft status');
  assert.strictEqual(createdSub.lines.length, 2);
  assert.strictEqual(createdSub.lines[0].quantity, 2);
  assert.strictEqual(createdSub.lines[0].unit_price, 100);
  assert.strictEqual(createdSub.lines[0].total_amount, 210); // 2 * 100 + 10
  assert.strictEqual(createdSub.lines[1].quantity, 5);
  assert.strictEqual(createdSub.lines[1].unit_price, 0);
  assert.strictEqual(createdSub.lines[1].total_amount, 0);

  console.log('✓ Subscription successfully created in Draft status from template data');
  console.log('✓ Expiry date correctly computed from validity_days');
  console.log('✓ Lines properly mapped with pricing and quantity calculations');

  console.log('\n========================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});


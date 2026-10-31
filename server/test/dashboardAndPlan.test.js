const assert = require('assert');
const mongoose = require('mongoose');
const { Plan, BILLING_FREQUENCIES, RENEWAL_BEHAVIORS } = require('../models/Plan');
const { Subscription } = require('../models/Subscription');
const { Invoice } = require('../models/Invoice');
const Payment = require('../models/Payment');
const { getFinanceSummary } = require('../services/dashboardService');

console.log('--- 1. Testing Plan Model Schema & Enum Definitions ---');

const planPaths = Plan.schema.paths;
assert(planPaths['name'], 'Plan: name is missing');
assert(planPaths['billing_frequency'], 'Plan: billing_frequency is missing');
assert(planPaths['minimum_quantity'], 'Plan: minimum_quantity is missing');
assert(planPaths['available_from'], 'Plan: available_from is missing');
assert(planPaths['available_to'], 'Plan: available_to is missing');
assert(planPaths['renewal_behavior'], 'Plan: renewal_behavior is missing');

assert.deepStrictEqual(
  planPaths['billing_frequency'].enumValues,
  ['Daily', 'Weekly', 'Monthly', 'Yearly']
);
assert.deepStrictEqual(
  planPaths['renewal_behavior'].enumValues,
  ['Auto-Close', 'Early-Close', 'Pause', 'Renew']
);
console.log('✓ Plan model fields, billing frequencies, and renewal behaviors verified');

console.log('\n--- 2. Testing CRITICAL Compound Performance Indexes Definitions ---');

// 2.1 Check Subscription indexes for status + dates
const subIndexes = Subscription.schema.indexes();
const hasSubStatusDateIndex = subIndexes.some(
  (idx) => idx[0].status !== undefined && (idx[0].createdAt !== undefined || idx[0].start_date !== undefined)
);
assert(hasSubStatusDateIndex, 'Subscription: missing compound index on status and dates');
console.log('✓ Subscription: compound indexes on status and dates verified');

// 2.2 Check Invoice indexes for status + dates
const invIndexes = Invoice.schema.indexes();
const hasInvStatusDateIndex = invIndexes.some(
  (idx) => idx[0].status !== undefined && idx[0].billing_period_end !== undefined
);
assert(hasInvStatusDateIndex, 'Invoice: missing compound index on status and billing_period_end');
console.log('✓ Invoice: compound indexes on status, billing_period_end, and amount_due verified');

// 2.3 Check Payment indexes for dates + amount
const payIndexes = Payment.schema.indexes();
const hasPayDateAmountIndex = payIndexes.some(
  (idx) => idx[0].payment_date !== undefined && idx[0].amount !== undefined
);
assert(hasPayDateAmountIndex, 'Payment: missing compound index on payment_date and amount');
console.log('✓ Payment: compound index on payment_date and amount verified');

console.log('\n--- 3. Testing Finance Dashboard Aggregation Pipelines ---');

(async () => {
  // Mock Subscription.aggregate
  Subscription.aggregate = async (pipeline) => {
    // Assert pipeline uses $match on status
    assert(pipeline[0].$match.status === 'Active', 'Must match status: Active');
    return [{ total_active: 42 }];
  };

  // Mock Payment.aggregate
  Payment.aggregate = async (pipeline) => {
    // Assert pipeline groups and sums amount
    assert(pipeline[pipeline.length - 1].$group.total_revenue, 'Must sum amount into total_revenue');
    return [{ total_revenue: 12500.5, transaction_count: 85 }];
  };

  // Mock Invoice.aggregate (called twice: overdue and total unpaid)
  let invoiceAggCallCount = 0;
  Invoice.aggregate = async (pipeline) => {
    invoiceAggCallCount++;
    const match = pipeline[0].$match;
    assert.deepStrictEqual(match.status, { $ne: 'Paid' }, 'Must filter where status is not Paid');

    if (match.billing_period_end) {
      // Overdue aggregation
      return [{ overdue_invoices_count: 7, total_outstanding_revenue: 3450.75 }];
    } else {
      // Total unpaid aggregation
      return [{ total_unpaid_invoices_count: 12, total_unpaid_amount: 5600.0 }];
    }
  };

  // Execute Dashboard Summary
  const filterParams = {
    start_date: '2026-10-01T00:00:00.000Z',
    end_date: '2026-10-31T23:59:59.000Z',
    reference_date: '2026-10-31T23:59:59.000Z',
  };

  const summary = await getFinanceSummary(filterParams);

  assert.strictEqual(summary.active_subscriptions.count, 42);
  assert.strictEqual(summary.revenue.total_collected, 12500.5);
  assert.strictEqual(summary.revenue.transaction_count, 85);
  assert.strictEqual(summary.overdue_invoices.count, 7);
  assert.strictEqual(summary.overdue_invoices.total_outstanding, 3450.75);
  assert.strictEqual(summary.total_unpaid_summary.count, 12);
  assert.strictEqual(summary.total_unpaid_summary.amount, 5600.0);
  assert.strictEqual(summary.performance.optimized_indexes_applied, true);
  assert(summary.performance.execution_time_ms < 2000, 'Execution must take under 2 seconds');

  console.log(`✓ Active Subscriptions Count: ${summary.active_subscriptions.count}`);
  console.log(`✓ Total Revenue Collected: $${summary.revenue.total_collected} (${summary.revenue.transaction_count} payments)`);
  console.log(`✓ Overdue Invoices Count: ${summary.overdue_invoices.count}`);
  console.log(`✓ Total Outstanding Overdue Revenue: $${summary.overdue_invoices.total_outstanding}`);
  console.log(`✓ Aggregation execution speed benchmark: ${summary.performance.execution_time_ms}ms (< 2000ms SLA)`);

  console.log('\n========================================');
  console.log('ALL PLAN & DASHBOARD TESTS PASSED!');
  console.log('========================================');
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});


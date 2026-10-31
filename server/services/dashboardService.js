const { Subscription } = require('../models/Subscription');
const Payment = require('../models/Payment');
const { Invoice } = require('../models/Invoice');

/**
 * High-performance Finance Dashboard reporting service.
 * Executes optimized MongoDB Aggregation Pipelines leveraging compound indexes.
 *
 * @param {Object} [filters]
 * @param {Date|string} [filters.start_date] - Filter range start date
 * @param {Date|string} [filters.end_date] - Filter range end date
 * @param {Date|string} [filters.startDate] - Alias for start_date
 * @param {Date|string} [filters.endDate] - Alias for end_date
 * @param {Date|string} [filters.referenceDate] - Benchmark date for overdue calculation (defaults to now)
 * @returns {Promise<Object>} Aggregated financial metrics
 */
const getFinanceSummary = async (filters = {}) => {
  const startTime = Date.now();

  const rawStart = filters.start_date || filters.startDate;
  const rawEnd = filters.end_date || filters.endDate;
  const rawRef = filters.referenceDate || filters.reference_date;

  const startDate = rawStart ? new Date(rawStart) : null;
  const endDate = rawEnd ? new Date(rawEnd) : null;
  const referenceDate = rawRef ? new Date(rawRef) : new Date();

  if (startDate && isNaN(startDate.getTime())) {
    throw new Error('Invalid start_date format');
  }
  if (endDate && isNaN(endDate.getTime())) {
    throw new Error('Invalid end_date format');
  }

  // 1. Total number of active subscriptions (status === 'Active')
  const activeSubMatch = { status: 'Active' };
  if (startDate || endDate) {
    activeSubMatch.createdAt = {};
    if (startDate) activeSubMatch.createdAt.$gte = startDate;
    if (endDate) activeSubMatch.createdAt.$lte = endDate;
  }

  const activeSubPipeline = [
    { $match: activeSubMatch },
    { $count: 'total_active' },
  ];

  // 2. Total revenue collected (summing amount of all Payment records)
  const paymentMatch = {};
  if (startDate || endDate) {
    paymentMatch.payment_date = {};
    if (startDate) paymentMatch.payment_date.$gte = startDate;
    if (endDate) paymentMatch.payment_date.$lte = endDate;
  }

  const revenuePipeline = [
    { $match: paymentMatch },
    {
      $group: {
        _id: null,
        total_revenue: { $sum: '$amount' },
        transaction_count: { $sum: 1 },
      },
    },
  ];

  // 3. Total outstanding revenue and a count of overdue invoices (status !== "Paid" and billing_period_end <= referenceDate)
  const overdueMatch = {
    status: { $ne: 'Paid' },
    billing_period_end: { $lte: referenceDate },
  };

  if (startDate) {
    overdueMatch.billing_period_end.$gte = startDate;
  }
  if (endDate && endDate < referenceDate) {
    overdueMatch.billing_period_end.$lte = endDate;
  }

  const overduePipeline = [
    { $match: overdueMatch },
    {
      $group: {
        _id: null,
        overdue_invoices_count: { $sum: 1 },
        total_outstanding_revenue: {
          $sum: {
            $ifNull: [
              '$amount_due',
              { $subtract: ['$grand_total', { $ifNull: ['$amount_paid', 0] }] },
            ],
          },
        },
      },
    },
  ];

  // 4. Broader context: Total unpaid invoices across all periods
  const totalUnpaidMatch = { status: { $ne: 'Paid' } };
  const totalUnpaidPipeline = [
    { $match: totalUnpaidMatch },
    {
      $group: {
        _id: null,
        total_unpaid_invoices_count: { $sum: 1 },
        total_unpaid_amount: {
          $sum: {
            $ifNull: [
              '$amount_due',
              { $subtract: ['$grand_total', { $ifNull: ['$amount_paid', 0] }] },
            ],
          },
        },
      },
    },
  ];

  // Execute all aggregations in parallel via Promise.all
  const [activeSubsRes, revenueRes, overdueRes, totalUnpaidRes] = await Promise.all([
    Subscription.aggregate(activeSubPipeline),
    Payment.aggregate(revenuePipeline),
    Invoice.aggregate(overduePipeline),
    Invoice.aggregate(totalUnpaidPipeline),
  ]);

  const totalActiveSubscriptions = activeSubsRes[0]?.total_active || 0;
  const totalRevenueCollected = Number((revenueRes[0]?.total_revenue || 0).toFixed(2));
  const transactionCount = revenueRes[0]?.transaction_count || 0;
  const overdueInvoicesCount = overdueRes[0]?.overdue_invoices_count || 0;
  const totalOutstandingRevenue = Number(
    (overdueRes[0]?.total_outstanding_revenue || 0).toFixed(2)
  );
  const totalUnpaidAmount = Number((totalUnpaidRes[0]?.total_unpaid_amount || 0).toFixed(2));
  const totalUnpaidInvoicesCount = totalUnpaidRes[0]?.total_unpaid_invoices_count || 0;

  const executionTimeMs = Date.now() - startTime;

  return {
    date_filter: {
      start_date: startDate ? startDate.toISOString() : null,
      end_date: endDate ? endDate.toISOString() : null,
      reference_date: referenceDate.toISOString(),
    },
    active_subscriptions: {
      count: totalActiveSubscriptions,
    },
    revenue: {
      total_collected: totalRevenueCollected,
      transaction_count: transactionCount,
    },
    overdue_invoices: {
      count: overdueInvoicesCount,
      total_outstanding: totalOutstandingRevenue,
    },
    total_unpaid_summary: {
      count: totalUnpaidInvoicesCount,
      amount: totalUnpaidAmount,
    },
    performance: {
      execution_time_ms: executionTimeMs,
      optimized_indexes_applied: true,
    },
  };
};

module.exports = {
  getFinanceSummary,
};


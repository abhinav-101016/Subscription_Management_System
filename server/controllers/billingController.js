const { generateDueInvoices } = require('../services/billingEngine');

/**
 * @desc    Manually trigger the billing engine to generate due invoices
 * @route   POST /api/billing/run
 * @access  Admin / Public for testing
 */
const runBillingEngine = async (req, res) => {
  try {
    const { reference_date, referenceDate } = req.body;
    const targetDate = reference_date || referenceDate || new Date();

    const dateObj = new Date(targetDate);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid referenceDate format provided',
      });
    }

    const billingResult = await generateDueInvoices({ referenceDate: dateObj });

    return res.status(200).json({
      success: true,
      message: 'Billing Day engine execution completed successfully',
      summary: {
        reference_date: billingResult.reference_date,
        total_due_subscriptions: billingResult.total_due_subscriptions,
        invoices_generated: billingResult.invoices_generated,
        invoices_skipped: billingResult.invoices_skipped,
        tax_rule_applied: billingResult.tax_rule_applied,
      },
      data: {
        generated_invoices: billingResult.generated_invoices,
        skipped_invoices: billingResult.skipped_invoices,
      },
    });
  } catch (error) {
    console.error('Error running billing engine:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while running billing engine',
      error: error.message,
    });
  }
};

module.exports = {
  runBillingEngine,
};


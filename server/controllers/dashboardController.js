const { getFinanceSummary } = require('../services/dashboardService');

/**
 * @desc    Fetch aggregated finance dashboard summary metrics
 * @route   GET /api/dashboard/summary
 * @access  Admin / Finance Lead
 */
const getSummary = async (req, res) => {
  try {
    const { start_date, end_date, startDate, endDate, reference_date, referenceDate } = req.query;

    const summary = await getFinanceSummary({
      start_date: start_date || startDate,
      end_date: end_date || endDate,
      reference_date: reference_date || referenceDate,
    });

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error in dashboard summary controller:', error);
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error while generating finance summary',
    });
  }
};

module.exports = {
  getSummary,
};


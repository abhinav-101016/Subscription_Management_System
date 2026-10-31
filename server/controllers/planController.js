const mongoose = require('mongoose');
const { Plan, BILLING_FREQUENCIES, RENEWAL_BEHAVIORS } = require('../models/Plan');

/**
 * @desc    Create a new plan
 * @route   POST /api/plans
 * @access  Admin
 */
const createPlan = async (req, res) => {
  try {
    const {
      name,
      billing_frequency,
      minimum_quantity,
      available_from,
      available_to,
      renewal_behavior,
      active,
    } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid plan name is required',
      });
    }

    // Validate billing_frequency
    if (!billing_frequency || !BILLING_FREQUENCIES.includes(billing_frequency)) {
      return res.status(400).json({
        success: false,
        message: `Invalid billing_frequency '${billing_frequency}'. Allowed: ${BILLING_FREQUENCIES.join(', ')}`,
      });
    }

    // Validate minimum_quantity
    let minQty = 1;
    if (minimum_quantity !== undefined) {
      minQty = Number(minimum_quantity);
      if (isNaN(minQty) || minQty < 1) {
        return res.status(400).json({
          success: false,
          message: 'minimum_quantity must be a number greater than or equal to 1',
        });
      }
    }

    // Validate dates
    let fromDate = available_from ? new Date(available_from) : new Date();
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid available_from date format',
      });
    }

    let toDate = null;
    if (available_to) {
      toDate = new Date(available_to);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid available_to date format',
        });
      }
      if (toDate < fromDate) {
        return res.status(400).json({
          success: false,
          message: 'available_to date cannot be earlier than available_from date',
        });
      }
    }

    // Validate renewal_behavior
    const behavior = renewal_behavior || 'Renew';
    if (!RENEWAL_BEHAVIORS.includes(behavior)) {
      return res.status(400).json({
        success: false,
        message: `Invalid renewal_behavior '${behavior}'. Allowed: ${RENEWAL_BEHAVIORS.join(', ')}`,
      });
    }

    // Check unique name
    const existingPlan = await Plan.findOne({ name: name.trim() });
    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: `A plan with name '${name.trim()}' already exists`,
      });
    }

    const plan = new Plan({
      name: name.trim(),
      billing_frequency,
      minimum_quantity: minQty,
      available_from: fromDate,
      available_to: toDate,
      renewal_behavior: behavior,
      active: active !== undefined ? Boolean(active) : true,
    });

    const savedPlan = await plan.save();

    return res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: savedPlan,
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating plan',
      error: error.message,
    });
  }
};

/**
 * @desc    List all available plans
 * @route   GET /api/plans
 * @access  Public / Authenticated
 */
const getAllPlans = async (req, res) => {
  try {
    const filter = {};

    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    if (req.query.billing_frequency) {
      filter.billing_frequency = req.query.billing_frequency;
    }

    if (req.query.renewal_behavior) {
      filter.renewal_behavior = req.query.renewal_behavior;
    }

    const plans = await Plan.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching plans',
      error: error.message,
    });
  }
};

/**
 * @desc    Get plan by ID
 * @route   GET /api/plans/:id
 * @access  Public / Authenticated
 */
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format',
      });
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error fetching plan by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching plan',
      error: error.message,
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
};


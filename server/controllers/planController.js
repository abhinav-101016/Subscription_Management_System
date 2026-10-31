const mongoose = require('mongoose');
const { Plan, BILLING_FREQUENCIES, RENEWAL_BEHAVIORS } = require('../models/Plan');

/**
 * Normalizes billing frequency input (case-insensitive)
 */
const normalizeFrequency = (freq) => {
  if (!freq || typeof freq !== 'string') return null;
  const match = BILLING_FREQUENCIES.find((f) => f.toLowerCase() === freq.trim().toLowerCase());
  return match || null;
};

/**
 * Normalizes renewal behavior input (case-insensitive & handles synonyms)
 */
const normalizeRenewalBehavior = (behavior) => {
  if (!behavior || typeof behavior !== 'string') return 'Renew';
  const clean = behavior.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (['auto-close', 'autoclose', 'close-on-end'].includes(clean)) return 'Auto-Close';
  if (['early-close', 'earlyclose', 'close-early'].includes(clean)) return 'Early-Close';
  if (clean === 'pause') return 'Pause';
  if (clean === 'renew') return 'Renew';

  const match = RENEWAL_BEHAVIORS.find((b) => b.toLowerCase() === clean);
  return match || null;
};

/**
 * @desc    Create a new plan
 * @route   POST /api/plans
 * @access  Admin
 */
const createPlan = async (req, res) => {
  try {
    const {
      name,
      price,
      cost,
      billing_frequency,
      minimum_quantity,
      available_from,
      available_to,
      renewal_behavior,
      product_id,
      variant_id,
      description,
      active,
    } = req.body || {};

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid plan name is required',
      });
    }

    // Validate and normalize billing_frequency
    const freq = normalizeFrequency(billing_frequency);
    if (!freq) {
      return res.status(400).json({
        success: false,
        message: `Invalid billing_frequency '${billing_frequency}'. Allowed: ${BILLING_FREQUENCIES.join(', ')}`,
      });
    }

    // Validate price
    let planPrice = 0;
    if (price !== undefined) {
      planPrice = Number(price);
      if (isNaN(planPrice) || planPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'price must be a non-negative number',
        });
      }
    }

    // Validate cost
    let planCost = 0;
    if (cost !== undefined) {
      planCost = Number(cost);
      if (isNaN(planCost) || planCost < 0) {
        return res.status(400).json({
          success: false,
          message: 'cost must be a non-negative number',
        });
      }
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
    const behavior = normalizeRenewalBehavior(renewal_behavior);
    if (!behavior) {
      return res.status(400).json({
        success: false,
        message: `Invalid renewal_behavior '${renewal_behavior}'. Allowed: ${RENEWAL_BEHAVIORS.join(', ')}`,
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

    const planData = {
      name: name.trim(),
      price: planPrice,
      cost: planCost,
      billing_frequency: freq,
      minimum_quantity: minQty,
      available_from: fromDate,
      available_to: toDate,
      renewal_behavior: behavior,
      description: description ? String(description).trim() : '',
      active: active !== undefined ? Boolean(active) : true,
    };

    if (product_id && mongoose.Types.ObjectId.isValid(product_id)) {
      planData.product_id = product_id;
    }
    if (variant_id && mongoose.Types.ObjectId.isValid(variant_id)) {
      planData.variant_id = variant_id;
    }

    const plan = new Plan(planData);
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
      const freq = normalizeFrequency(req.query.billing_frequency);
      if (freq) filter.billing_frequency = freq;
    }

    if (req.query.renewal_behavior) {
      const behavior = normalizeRenewalBehavior(req.query.renewal_behavior);
      if (behavior) filter.renewal_behavior = behavior;
    }

    if (req.query.product_id && mongoose.Types.ObjectId.isValid(req.query.product_id)) {
      filter.product_id = req.query.product_id;
    }

    const plans = await Plan.find(filter)
      .populate('product_id', 'name item_type sales_price')
      .populate('variant_id', 'variant_name attribute_value final_price')
      .sort({ createdAt: -1 });

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

    const plan = await Plan.findById(id)
      .populate('product_id', 'name item_type sales_price')
      .populate('variant_id', 'variant_name attribute_value final_price');

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

/**
 * @desc    Update an existing plan
 * @route   PUT /api/plans/:id
 * @access  Admin
 */
const updatePlan = async (req, res) => {
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

    const {
      name,
      price,
      cost,
      billing_frequency,
      minimum_quantity,
      available_from,
      available_to,
      renewal_behavior,
      active,
      description,
    } = req.body || {};

    if (name && name.trim() !== plan.name) {
      const existing = await Plan.findOne({ name: name.trim(), _id: { $ne: plan._id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `A plan with name '${name.trim()}' already exists`,
        });
      }
      plan.name = name.trim();
    }

    if (price !== undefined) {
      const p = Number(price);
      if (isNaN(p) || p < 0) {
        return res.status(400).json({ success: false, message: 'price cannot be negative' });
      }
      plan.price = p;
    }

    if (cost !== undefined) {
      const c = Number(cost);
      if (isNaN(c) || c < 0) {
        return res.status(400).json({ success: false, message: 'cost cannot be negative' });
      }
      plan.cost = c;
    }

    if (billing_frequency) {
      const freq = normalizeFrequency(billing_frequency);
      if (!freq) {
        return res.status(400).json({
          success: false,
          message: `Invalid billing_frequency '${billing_frequency}'. Allowed: ${BILLING_FREQUENCIES.join(', ')}`,
        });
      }
      plan.billing_frequency = freq;
    }

    if (minimum_quantity !== undefined) {
      const qty = Number(minimum_quantity);
      if (isNaN(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: 'minimum_quantity must be at least 1',
        });
      }
      plan.minimum_quantity = qty;
    }

    if (available_from) {
      const from = new Date(available_from);
      if (isNaN(from.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid available_from date' });
      }
      plan.available_from = from;
    }

    if (available_to !== undefined) {
      if (available_to === null || available_to === '') {
        plan.available_to = null;
      } else {
        const to = new Date(available_to);
        if (isNaN(to.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid available_to date' });
        }
        if (to < plan.available_from) {
          return res.status(400).json({
            success: false,
            message: 'available_to date cannot be earlier than available_from date',
          });
        }
        plan.available_to = to;
      }
    }

    if (renewal_behavior) {
      const behavior = normalizeRenewalBehavior(renewal_behavior);
      if (!behavior) {
        return res.status(400).json({
          success: false,
          message: `Invalid renewal_behavior. Allowed: ${RENEWAL_BEHAVIORS.join(', ')}`,
        });
      }
      plan.renewal_behavior = behavior;
    }

    if (active !== undefined) plan.active = Boolean(active);
    if (description !== undefined) plan.description = String(description).trim();

    const updatedPlan = await plan.save();

    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: updatedPlan,
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating plan',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete or deactivate plan
 * @route   DELETE /api/plans/:id
 * @access  Admin
 */
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format',
      });
    }

    const isSoft = req.query.soft === 'true' || req.body?.soft === true;

    if (isSoft) {
      const plan = await Plan.findByIdAndUpdate(id, { active: false }, { new: true });
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
      return res.status(200).json({
        success: true,
        message: `Plan '${plan.name}' deactivated successfully`,
      });
    }

    const deleted = await Plan.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Plan not found' });

    return res.status(200).json({
      success: true,
      message: `Plan '${deleted.name}' deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting plan',
      error: error.message,
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
};

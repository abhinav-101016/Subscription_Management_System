const mongoose = require('mongoose');
const { DiscountRule, DISCOUNT_TYPES, APPLICABILITY_TYPES } = require('../models/DiscountRule');
const { applyDiscountToInvoice } = require('../services/discountService');

/**
 * @desc    Create a new discount rule
 * @route   POST /api/discounts
 * @access  Admin
 */
const createDiscountRule = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      value,
      min_purchase_amount,
      min_quantity,
      valid_from,
      valid_to,
      usage_limit,
      applicability,
      applicable_product_id,
      customer_id,
      subscription_id,
      active,
    } = req.body;

    // 1. Validate Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid discount rule name is required',
      });
    }

    // 2. Validate Type
    if (!type || !DISCOUNT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid discount type '${type}'. Allowed types: ${DISCOUNT_TYPES.join(', ')}`,
      });
    }

    // 3. Validate Value (prevent negative or contradictory discount values)
    const numValue = Number(value);
    if (value === undefined || isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount value must be a positive number greater than 0',
      });
    }

    if (type === 'Percentage' && numValue > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount value cannot exceed 100%',
      });
    }

    // 4. Validate Min Purchase Amount
    let minPurchase = 0;
    if (min_purchase_amount !== undefined) {
      minPurchase = Number(min_purchase_amount);
      if (isNaN(minPurchase) || minPurchase < 0) {
        return res.status(400).json({
          success: false,
          message: 'min_purchase_amount cannot be negative',
        });
      }
    }

    // 5. Validate Min Quantity
    let minQty = 0;
    if (min_quantity !== undefined) {
      minQty = Number(min_quantity);
      if (isNaN(minQty) || minQty < 0) {
        return res.status(400).json({
          success: false,
          message: 'min_quantity cannot be negative',
        });
      }
    }

    // 6. Validate Date Range (prevent contradictory dates where valid_to < valid_from)
    let validFromDate = null;
    let validToDate = null;

    if (valid_from) {
      validFromDate = new Date(valid_from);
      if (isNaN(validFromDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid valid_from date format',
        });
      }
    }

    if (valid_to) {
      validToDate = new Date(valid_to);
      if (isNaN(validToDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid valid_to date format',
        });
      }
    }

    if (validFromDate && validToDate && validToDate < validFromDate) {
      return res.status(400).json({
        success: false,
        message: 'Contradictory date rule: valid_to cannot be earlier than valid_from',
      });
    }

    // 7. Validate Usage Limit
    let limit = undefined;
    if (usage_limit !== undefined && usage_limit !== null) {
      limit = Number(usage_limit);
      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({
          success: false,
          message: 'usage_limit must be a positive integer greater than or equal to 1',
        });
      }
    }

    // 8. Validate Applicability & Target
    if (!applicability || !APPLICABILITY_TYPES.includes(applicability)) {
      return res.status(400).json({
        success: false,
        message: `Invalid applicability '${applicability}'. Allowed values: ${APPLICABILITY_TYPES.join(', ')}`,
      });
    }

    let targetProductId = undefined;
    if (applicability === 'Specific_Product') {
      if (!applicable_product_id || !mongoose.Types.ObjectId.isValid(applicable_product_id)) {
        return res.status(400).json({
          success: false,
          message: 'applicable_product_id (MongoDB ObjectId) is required when applicability is "Specific_Product"',
        });
      }
      targetProductId = applicable_product_id;
    }

    // Optional customer_id or subscription_id link
    if (customer_id && !mongoose.Types.ObjectId.isValid(customer_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer_id format',
      });
    }

    if (subscription_id && !mongoose.Types.ObjectId.isValid(subscription_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription_id format',
      });
    }

    const discountRule = new DiscountRule({
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : undefined,
      type,
      value: numValue,
      min_purchase_amount: minPurchase,
      min_quantity: minQty,
      valid_from: validFromDate,
      valid_to: validToDate,
      usage_limit: limit,
      times_used: 0,
      applicability,
      applicable_product_id: targetProductId,
      customer_id: customer_id || undefined,
      subscription_id: subscription_id || undefined,
      active: active !== undefined ? Boolean(active) : true,
    });

    const savedRule = await discountRule.save();

    return res.status(201).json({
      success: true,
      message: 'Discount rule created successfully',
      data: savedRule,
    });
  } catch (error) {
    console.error('Error creating discount rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating discount rule',
      error: error.message,
    });
  }
};

/**
 * @desc    List all discount rules with optional filtering
 * @route   GET /api/discounts
 * @access  Admin
 */
const getAllDiscountRules = async (req, res) => {
  try {
    const filter = {};

    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.applicability) {
      filter.applicability = req.query.applicability;
    }

    if (req.query.customer_id) {
      filter.customer_id = req.query.customer_id;
    }

    if (req.query.subscription_id) {
      filter.subscription_id = req.query.subscription_id;
    }

    const rules = await DiscountRule.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    console.error('Error fetching discount rules:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching discount rules',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a discount rule by ID
 * @route   GET /api/discounts/:id
 * @access  Admin
 */
const getDiscountRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount rule ID format',
      });
    }

    const rule = await DiscountRule.findById(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Discount rule not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Error fetching discount rule by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching discount rule',
      error: error.message,
    });
  }
};

/**
 * @desc    Update limits, dates, or parameters of an existing discount rule
 * @route   PATCH /api/discounts/:id
 * @access  Admin
 */
const updateDiscountRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      value,
      usage_limit,
      valid_from,
      valid_to,
      active,
      min_purchase_amount,
      min_quantity,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount rule ID format',
      });
    }

    const rule = await DiscountRule.findById(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Discount rule not found',
      });
    }

    if (name && typeof name === 'string' && name.trim()) {
      rule.name = name.trim();
    }

    // Value updates
    if (value !== undefined) {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Discount value must be greater than 0',
        });
      }
      if (rule.type === 'Percentage' && numValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount cannot exceed 100%',
        });
      }
      rule.value = numValue;
    }

    // Usage limit updates
    if (usage_limit !== undefined) {
      if (usage_limit === null) {
        rule.usage_limit = undefined;
      } else {
        const limit = Number(usage_limit);
        if (isNaN(limit) || limit < 1) {
          return res.status(400).json({
            success: false,
            message: 'usage_limit must be a positive number',
          });
        }
        rule.usage_limit = limit;
      }
    }

    // Date updates with contradiction checking
    let nextValidFrom = rule.valid_from;
    let nextValidTo = rule.valid_to;

    if (valid_from !== undefined) {
      if (valid_from === null) {
        nextValidFrom = null;
      } else {
        const fromDate = new Date(valid_from);
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid valid_from date' });
        }
        nextValidFrom = fromDate;
      }
    }

    if (valid_to !== undefined) {
      if (valid_to === null) {
        nextValidTo = null;
      } else {
        const toDate = new Date(valid_to);
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid valid_to date' });
        }
        nextValidTo = toDate;
      }
    }

    if (nextValidFrom && nextValidTo && nextValidTo < nextValidFrom) {
      return res.status(400).json({
        success: false,
        message: 'Contradictory date rule: valid_to cannot be earlier than valid_from',
      });
    }

    rule.valid_from = nextValidFrom;
    rule.valid_to = nextValidTo;

    if (min_purchase_amount !== undefined) {
      const minP = Number(min_purchase_amount);
      if (isNaN(minP) || minP < 0) {
        return res.status(400).json({ success: false, message: 'min_purchase_amount cannot be negative' });
      }
      rule.min_purchase_amount = minP;
    }

    if (min_quantity !== undefined) {
      const minQ = Number(min_quantity);
      if (isNaN(minQ) || minQ < 0) {
        return res.status(400).json({ success: false, message: 'min_quantity cannot be negative' });
      }
      rule.min_quantity = minQ;
    }

    if (active !== undefined) {
      rule.active = Boolean(active);
    }

    const updatedRule = await rule.save();

    return res.status(200).json({
      success: true,
      message: 'Discount rule updated successfully',
      data: updatedRule,
    });
  } catch (error) {
    console.error('Error updating discount rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating discount rule',
      error: error.message,
    });
  }
};

/**
 * @desc    Manually test the applyDiscountToInvoice service for an invoice
 * @route   POST /api/billing/apply-discounts
 * @access  Admin / Tester
 */
const testApplyDiscount = async (req, res) => {
  try {
    const { invoice_id, invoiceId, subscription_id, subscriptionId, discount_rule_id, discountRuleId } = req.body;

    const targetInvoiceId = invoice_id || invoiceId;
    const targetSubscriptionId = subscription_id || subscriptionId;
    const targetRuleId = discount_rule_id || discountRuleId;

    if (!targetInvoiceId) {
      return res.status(400).json({
        success: false,
        message: 'invoice_id is required',
      });
    }

    const result = await applyDiscountToInvoice(targetInvoiceId, targetSubscriptionId, {
      discount_rule_id: targetRuleId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('Error applying discount to invoice:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error applying discount to invoice',
    });
  }
};

module.exports = {
  createDiscountRule,
  getAllDiscountRules,
  getDiscountRuleById,
  updateDiscountRule,
  testApplyDiscount,
};


const mongoose = require('mongoose');
const { Subscription, SUBSCRIPTION_STATUSES } = require('../models/Subscription');
const QuotationTemplate = require('../models/QuotationTemplate');

/**
 * Strict state machine transition rules:
 * - Draft -> Quotation
 * - Quotation -> Confirmed OR Closed (rejection)
 * - Confirmed -> Active
 * - Active -> Closed
 * - Closed -> Terminal (no transitions allowed)
 */
const VALID_TRANSITIONS = Object.freeze({
  Draft: ['Quotation'],
  Quotation: ['Confirmed', 'Closed'],
  Confirmed: ['Active'],
  Active: ['Closed'],
  Closed: [],
});

/**
 * Helper to generate a unique subscription number if none is supplied
 */
const generateSubscriptionNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `SUB-${datePart}-${randomPart}`;
};

/**
 * @desc    Create a new Draft subscription by copying data from a specific template ID
 * @route   POST /api/subscriptions/from-template
 * @access  Public / Authenticated
 */
const createSubscriptionFromTemplate = async (req, res) => {
  try {
    const {
      template_id,
      templateId, // Support both camelCase and snake_case
      customer_id,
      customerId,
      plan_id,
      subscription_number,
      start_date,
      expiry_date,
      payment_terms,
      lines_pricing, // Optional price overrides per variant: [{ variant_id, unit_price, tax_amount }]
    } = req.body;

    const targetTemplateId = template_id || templateId;
    const targetCustomerId = customer_id || customerId;

    // Validate customer_id
    if (!targetCustomerId || !mongoose.Types.ObjectId.isValid(targetCustomerId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid customer_id (MongoDB ObjectId) is required',
      });
    }

    // Validate template_id
    if (!targetTemplateId || !mongoose.Types.ObjectId.isValid(targetTemplateId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid template_id (MongoDB ObjectId) is required',
      });
    }

    // Find the quotation template
    const template = await QuotationTemplate.findById(targetTemplateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Quotation template with ID '${targetTemplateId}' not found`,
      });
    }

    // Determine plan_id (defaults to template's default_plan_id)
    const finalPlanId = plan_id || template.default_plan_id;
    if (!mongoose.Types.ObjectId.isValid(finalPlanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan_id provided or template default_plan_id is invalid',
      });
    }

    // Calculate start and expiry dates based on template validity_days
    const effectiveStartDate = start_date ? new Date(start_date) : new Date();
    if (isNaN(effectiveStartDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start_date format provided',
      });
    }

    let effectiveExpiryDate;
    if (expiry_date) {
      effectiveExpiryDate = new Date(expiry_date);
      if (isNaN(effectiveExpiryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expiry_date format provided',
        });
      }
    } else {
      const validityDays = template.validity_days || 30;
      effectiveExpiryDate = new Date(
        effectiveStartDate.getTime() + validityDays * 24 * 60 * 60 * 1000
      );
    }

    // Create pricing lookup map if price overrides are supplied
    const pricingMap = new Map();
    if (Array.isArray(lines_pricing)) {
      lines_pricing.forEach((item) => {
        if (item.variant_id) {
          pricingMap.set(item.variant_id.toString(), {
            unit_price: Number(item.unit_price) || 0,
            tax_amount: Number(item.tax_amount) || 0,
          });
        }
      });
    }

    // Copy and map lines from template_lines
    const subscriptionLines = template.template_lines.map((line) => {
      const variantIdStr = line.product_variant_id.toString();
      const pricing = pricingMap.get(variantIdStr) || { unit_price: 0, tax_amount: 0 };
      const quantity = line.default_quantity || 1;
      const unitPrice = pricing.unit_price;
      const taxAmount = pricing.tax_amount;
      const totalAmount = quantity * unitPrice + taxAmount;

      return {
        variant_id: line.product_variant_id,
        quantity,
        unit_price: unitPrice,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      };
    });

    // Generate or use provided subscription number
    const subNumber = subscription_number ? subscription_number.trim() : generateSubscriptionNumber();

    // Check if subscription_number already exists
    const existing = await Subscription.findOne({ subscription_number: subNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Subscription with number '${subNumber}' already exists`,
      });
    }

    // Instantiating strictly in "Draft" status
    const newSubscription = new Subscription({
      subscription_number: subNumber,
      customer_id: targetCustomerId,
      plan_id: finalPlanId,
      start_date: effectiveStartDate,
      expiry_date: effectiveExpiryDate,
      payment_terms: payment_terms || 'Immediate Payment',
      lines: subscriptionLines,
      status: 'Draft',
    });

    const savedSubscription = await newSubscription.save();

    return res.status(201).json({
      success: true,
      message: 'Draft subscription successfully created from template',
      data: savedSubscription,
    });
  } catch (error) {
    console.error('Error creating subscription from template:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating subscription from template',
      error: error.message,
    });
  }
};

/**
 * @desc    Trigger a state machine transition for a subscription
 * @route   PATCH /api/subscriptions/:id/status
 * @access  Public / Authenticated
 */
const updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: requestedStatus } = req.body;

    // Validate Subscription ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format',
      });
    }

    // Validate that a status was provided
    if (!requestedStatus || typeof requestedStatus !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Field "status" is required in request body as a string',
      });
    }

    // Validate that the requested status is a recognized enum value
    if (!SUBSCRIPTION_STATUSES.includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${requestedStatus}'. Valid statuses are: ${SUBSCRIPTION_STATUSES.join(', ')}`,
      });
    }

    // Retrieve the subscription
    const subscription = await Subscription.findById(id)
      .populate('customer_id', 'name email phone')
      .populate('plan_id', 'name billing_frequency renewal_behavior')
      .populate('lines.variant_id');
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: `Subscription with ID '${id}' not found`,
      });
    }

    const currentStatus = subscription.status;

    // Reject transitions to the same status
    if (currentStatus === requestedStatus) {
      return res.status(400).json({
        success: false,
        error: 'State Machine Violation',
        message: `Subscription is already in '${currentStatus}' status. No transition needed.`,
        current_status: currentStatus,
        requested_status: requestedStatus,
      });
    }

    // Retrieve allowed transitions for current status
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    // Strictly enforce lifecycle transitions
    if (!allowedTransitions.includes(requestedStatus)) {
      const allowedText =
        allowedTransitions.length > 0
          ? `Allowed transition(s) from '${currentStatus}': [${allowedTransitions.map((s) => `'${s}'`).join(', ')}]`
          : `'${currentStatus}' is a terminal state. No further transitions are permitted.`;

      return res.status(400).json({
        success: false,
        error: 'State Machine Violation',
        message: `Invalid state transition: Cannot transition subscription from '${currentStatus}' to '${requestedStatus}'. ${allowedText}`,
        current_status: currentStatus,
        requested_status: requestedStatus,
        allowed_transitions: allowedTransitions,
      });
    }

    // Apply valid status transition
    subscription.status = requestedStatus;

    // If moving to Active and start_date is in the past or unset, ensure active start date
    if (requestedStatus === 'Active' && !subscription.start_date) {
      subscription.start_date = new Date();
    }

    const updatedSubscription = await subscription.save();

    return res.status(200).json({
      success: true,
      message: `Subscription status successfully updated from '${currentStatus}' to '${requestedStatus}'`,
      data: updatedSubscription,
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating subscription status',
      error: error.message,
    });
  }
};

/**
 * @desc    List all subscriptions
 * @route   GET /api/subscriptions
 * @access  Public / Authenticated
 */
const getAllSubscriptions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.customer_id) {
      filter.customer_id = req.query.customer_id;
    }

    if (req.user && req.user.role === 'customer') {
      filter.customer_id = req.user._id || req.user.id;
    }
    const subscriptions = await Subscription.find(filter)
      .populate('customer_id', 'name email phone')
      .populate('plan_id', 'name billing_frequency renewal_behavior')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching subscriptions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get subscription by ID
 * @route   GET /api/subscriptions/:id
 * @access  Public / Authenticated
 */
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format',
      });
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: `Subscription with ID '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error('Error fetching subscription by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching subscription',
      error: error.message,
    });
  }
};


/**
 * @desc    Directly create a new Draft subscription
 * @route   POST /api/subscriptions
 * @access  Public / Authenticated
 */
const createSubscription = async (req, res) => {
  try {
    const {
      customer_id,
      customerId,
      plan_id,
      planId,
      start_date,
      lines,
      subscription_number,
    } = req.body || {};

    const resolvedCustomer = customer_id || customerId;
    const resolvedPlan = plan_id || planId;

    if (!resolvedCustomer || !mongoose.Types.ObjectId.isValid(resolvedCustomer)) {
      return res.status(400).json({ success: false, message: 'Valid customer_id is required' });
    }
    if (!resolvedPlan || !mongoose.Types.ObjectId.isValid(resolvedPlan)) {
      return res.status(400).json({ success: false, message: 'Valid plan_id is required' });
    }

    const subNumber = subscription_number || generateSubscriptionNumber();
    const rawLines = Array.isArray(lines) ? lines : [];

    const mappedLines = rawLines.map((l) => {
      const vId = l.variant_id || l.product_variant_id?._id || l.product_variant_id;
      const qty = Number(l.quantity) || 1;
      const price = Number(l.unit_price) || 0;
      const tax = Number(l.tax_amount) || 0;
      const total = qty * price + tax;
      return {
        variant_id: mongoose.Types.ObjectId.isValid(vId) ? vId : new mongoose.Types.ObjectId(),
        quantity: qty,
        unit_price: price,
        tax_amount: tax,
        total_amount: total,
      };
    });

    if (mappedLines.length === 0) {
      mappedLines.push({
        variant_id: new mongoose.Types.ObjectId(),
        quantity: 1,
        unit_price: 100,
        tax_amount: 0,
        total_amount: 100,
      });
    }

    const sub = new Subscription({
      subscription_number: subNumber,
      customer_id: resolvedCustomer,
      plan_id: resolvedPlan,
      start_date: start_date ? new Date(start_date) : new Date(),
      status: 'Draft',
      lines: mappedLines,
    });

    const saved = await sub.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Error creating subscription:', err);
    return res.status(500).json({ success: false, message: 'Failed to create subscription', error: err.message });
  }
};

module.exports = {
  createSubscription,
  VALID_TRANSITIONS,
  createSubscriptionFromTemplate,
  updateSubscriptionStatus,
  getAllSubscriptions,
  getSubscriptionById,
};


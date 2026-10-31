const mongoose = require('mongoose');
const { DiscountRule } = require('../models/DiscountRule');
const { Invoice } = require('../models/Invoice');
const { Subscription } = require('../models/Subscription');

/**
 * Validates a discount rule against its constraints:
 * - Current date between valid_from and valid_to
 * - times_used < usage_limit
 * - min_purchase_amount satisfied
 * - min_quantity satisfied
 * - applicability targets present
 *
 * @param {Object} rule - DiscountRule document
 * @param {Object} invoice - Invoice document
 * @param {Date} referenceDate - Evaluation timestamp
 * @returns {Object} { isValid: boolean, reason?: string, discountAmount?: number }
 */
const evaluateDiscountRule = (rule, invoice, referenceDate = new Date()) => {
  // 1. Date constraints check
  if (rule.valid_from && referenceDate < new Date(rule.valid_from)) {
    return {
      isValid: false,
      reason: `Discount rule '${rule.name}' is not yet active (valid from ${new Date(rule.valid_from).toISOString()})`,
    };
  }

  if (rule.valid_to && referenceDate > new Date(rule.valid_to)) {
    return {
      isValid: false,
      reason: `Discount rule '${rule.name}' has expired (valid until ${new Date(rule.valid_to).toISOString()})`,
    };
  }

  // 2. Usage limit check
  if (rule.usage_limit !== undefined && rule.usage_limit !== null) {
    if (rule.times_used >= rule.usage_limit) {
      return {
        isValid: false,
        reason: `Discount rule '${rule.name}' has reached its usage limit of ${rule.usage_limit}`,
      };
    }
  }

  let applicableBaseAmount = 0;
  let applicableQuantity = 0;

  // 3. Applicability check (Specific_Product vs Whole_Subscription)
  if (rule.applicability === 'Specific_Product') {
    if (!rule.applicable_product_id) {
      return {
        isValid: false,
        reason: `Discount rule '${rule.name}' requires applicable_product_id for Specific_Product applicability`,
      };
    }

    const targetIdStr = rule.applicable_product_id.toString();
    const matchingLines = (invoice.lines || []).filter(
      (line) => line.variant_id && line.variant_id.toString() === targetIdStr
    );

    if (matchingLines.length === 0) {
      return {
        isValid: false,
        reason: `Invoice does not contain the target product variant (${targetIdStr}) for discount rule '${rule.name}'`,
      };
    }

    applicableQuantity = matchingLines.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    applicableBaseAmount = matchingLines.reduce((acc, curr) => {
      const lineTotal = curr.total !== undefined ? Number(curr.total) : Number(curr.quantity) * Number(curr.unit_price);
      return acc + (lineTotal || 0);
    }, 0);
  } else {
    // Whole_Subscription
    applicableQuantity = (invoice.lines || []).reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0),
      0
    );
    applicableBaseAmount = Number(invoice.subtotal) || 0;
  }

  // 4. Quantity and Min Purchase Amount constraints
  if (rule.min_quantity && applicableQuantity < rule.min_quantity) {
    return {
      isValid: false,
      reason: `Minimum required quantity of ${rule.min_quantity} not reached (current applicable quantity: ${applicableQuantity})`,
    };
  }

  if (rule.min_purchase_amount && applicableBaseAmount < rule.min_purchase_amount) {
    return {
      isValid: false,
      reason: `Minimum purchase amount of $${rule.min_purchase_amount} not reached (current applicable amount: $${applicableBaseAmount})`,
    };
  }

  // 5. Calculate discount amount based on type
  let discountAmount = 0;
  if (rule.type === 'Percentage') {
    discountAmount = (applicableBaseAmount * Number(rule.value)) / 100;
  } else if (rule.type === 'Fixed') {
    discountAmount = Math.min(Number(rule.value), applicableBaseAmount);
  }

  // Cap discount at invoice subtotal to prevent negative billing
  discountAmount = Math.min(discountAmount, Number(invoice.subtotal));
  discountAmount = Number(discountAmount.toFixed(2));

  if (discountAmount <= 0) {
    return {
      isValid: false,
      reason: `Calculated discount amount is 0 for rule '${rule.name}'`,
    };
  }

  return {
    isValid: true,
    discountAmount,
    applicableBaseAmount,
  };
};

/**
 * Apply eligible discount to an invoice
 *
 * @param {string|mongoose.Types.ObjectId} invoice_id - The ID of the Invoice
 * @param {string|mongoose.Types.ObjectId} [subscription_id] - Optional subscription ID (retrieved from invoice if omitted)
 * @param {Object} [options] - Optional configurations (discount_rule_id, session, referenceDate)
 * @returns {Promise<Object>} Result summary with updated invoice
 */
const applyDiscountToInvoice = async (invoice_id, subscription_id = null, options = {}) => {
  const { discount_rule_id = null, session = null, referenceDate = new Date() } = options;

  if (!invoice_id || !mongoose.Types.ObjectId.isValid(invoice_id)) {
    throw new Error('A valid invoice_id is required');
  }

  // 1. Fetch Invoice
  const invoiceQuery = Invoice.findById(invoice_id);
  if (session) invoiceQuery.session(session);
  const invoice = await invoiceQuery.exec();

  if (!invoice) {
    throw new Error(`Invoice with ID '${invoice_id}' not found`);
  }

  if (invoice.status === 'Paid') {
    throw new Error('Cannot apply discount to an invoice that is already Paid');
  }

  // 2. Fetch Subscription
  const targetSubId = subscription_id || invoice.subscription_id;
  if (!targetSubId || !mongoose.Types.ObjectId.isValid(targetSubId)) {
    throw new Error('A valid subscription_id is required');
  }

  const subQuery = Subscription.findById(targetSubId);
  if (session) subQuery.session(session);
  const subscription = await subQuery.exec();

  if (!subscription) {
    throw new Error(`Subscription with ID '${targetSubId}' not found`);
  }

  // 3. Fetch candidate discount rules linked to customer or subscription
  let candidateRules = [];

  if (discount_rule_id) {
    if (!mongoose.Types.ObjectId.isValid(discount_rule_id)) {
      throw new Error('Invalid discount_rule_id format provided');
    }
    const singleRuleQuery = DiscountRule.findById(discount_rule_id);
    if (session) singleRuleQuery.session(session);
    const rule = await singleRuleQuery.exec();
    if (!rule) {
      throw new Error(`DiscountRule with ID '${discount_rule_id}' not found`);
    }
    candidateRules = [rule];
  } else {
    // Find active discount rules linked to customer or subscription or global rules
    const rulesQuery = DiscountRule.find({
      active: true,
      $or: [
        { subscription_id: subscription._id },
        { customer_id: subscription.customer_id },
        { subscription_id: null, customer_id: null },
        { subscription_id: { $exists: false }, customer_id: { $exists: false } },
      ],
    }).sort({ value: -1 });

    if (session) rulesQuery.session(session);
    candidateRules = await rulesQuery.exec();
  }

  if (!candidateRules || candidateRules.length === 0) {
    return {
      applied: false,
      message: 'No discount rules linked to customer, subscription, or global pool',
      invoice,
    };
  }

  // 4. Evaluate each rule against constraints and find the best valid discount
  let bestEvaluation = null;
  let selectedRule = null;
  const evaluationLogs = [];

  for (const rule of candidateRules) {
    const evaluation = evaluateDiscountRule(rule, invoice, referenceDate);
    evaluationLogs.push({
      rule_id: rule._id,
      name: rule.name,
      ...evaluation,
    });

    if (evaluation.isValid) {
      if (!bestEvaluation || evaluation.discountAmount > bestEvaluation.discountAmount) {
        bestEvaluation = evaluation;
        selectedRule = rule;
      }
    }
  }

  if (!bestEvaluation || !selectedRule) {
    return {
      applied: false,
      message: 'No discount rules met the eligibility criteria',
      evaluations: evaluationLogs,
      invoice,
    };
  }

  const discountAmount = bestEvaluation.discountAmount;

  // 5. Update invoice discount_total and recalculate grand_total
  invoice.discount_total = discountAmount;
  const discountedSubtotal = Math.max(0, Number((invoice.subtotal - discountAmount).toFixed(2)));

  // Recalculate tax if tax rule is applied
  if (invoice.tax_rule_applied && invoice.tax_rule_applied.percentage_rate) {
    const taxRate = Number(invoice.tax_rule_applied.percentage_rate) || 0;
    invoice.tax_total = Number(((discountedSubtotal * taxRate) / 100).toFixed(2));
  }

  invoice.grand_total = Number((discountedSubtotal + (invoice.tax_total || 0)).toFixed(2));

  invoice.discount_applied = {
    discount_rule_id: selectedRule._id,
    name: selectedRule.name,
    type: selectedRule.type,
    value: selectedRule.value,
    amount: discountAmount,
    applicability: selectedRule.applicability,
    applied_at: referenceDate,
  };

  const updatedInvoice = await invoice.save({ session });

  // 6. Increment times_used on the DiscountRule
  selectedRule.times_used = (Number(selectedRule.times_used) || 0) + 1;
  await selectedRule.save({ session });

  return {
    applied: true,
    message: `Discount '${selectedRule.name}' of $${discountAmount} successfully applied`,
    discount_rule: {
      id: selectedRule._id,
      name: selectedRule.name,
      type: selectedRule.type,
      value: selectedRule.value,
      discount_amount: discountAmount,
      times_used: selectedRule.times_used,
      usage_limit: selectedRule.usage_limit,
    },
    invoice: updatedInvoice,
  };
};

module.exports = {
  evaluateDiscountRule,
  applyDiscountToInvoice,
};


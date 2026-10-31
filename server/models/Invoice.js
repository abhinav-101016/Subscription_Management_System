const mongoose = require('mongoose');

const INVOICE_STATUSES = ['Draft', 'Confirmed', 'Paid'];

const invoiceLineSchema = new mongoose.Schema(
  {
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'variant_id is required'],
      ref: 'ProductVariant',
    },
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
      min: [1, 'quantity must be at least 1'],
      default: 1,
    },
    unit_price: {
      type: Number,
      required: [true, 'unit_price is required'],
      min: [0, 'unit_price cannot be negative'],
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'total cannot be negative'],
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
      type: String,
      required: [true, 'invoice_number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'subscription_id is required'],
      ref: 'Subscription',
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'customer_id is required'],
      ref: 'Customer',
      index: true,
    },
    billing_period_start: {
      type: Date,
      required: [true, 'billing_period_start is required'],
    },
    billing_period_end: {
      type: Date,
      required: [true, 'billing_period_end is required'],
    },
    lines: {
      type: [invoiceLineSchema],
      required: [true, 'lines are required'],
      validate: {
        validator: function (lines) {
          return Array.isArray(lines) && lines.length > 0;
        },
        message: 'An invoice must contain at least one line item',
      },
    },
    subtotal: {
      type: Number,
      required: [true, 'subtotal is required'],
      min: [0, 'subtotal cannot be negative'],
      default: 0,
    },
    discount_total: {
      type: Number,
      default: 0,
      min: [0, 'discount_total cannot be negative'],
    },
    tax_total: {
      type: Number,
      required: [true, 'tax_total is required'],
      min: [0, 'tax_total cannot be negative'],
      default: 0,
    },
    grand_total: {
      type: Number,
      required: [true, 'grand_total is required'],
      min: [0, 'grand_total cannot be negative'],
      default: 0,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: INVOICE_STATUSES,
        message: '{VALUE} is not a valid invoice status',
      },
      default: 'Draft',
      index: true,
    },
    tax_rule_applied: {
      tax_rule_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaxRule',
      },
      name: String,
      percentage_rate: Number,
    },
    discount_applied: {
      discount_rule_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiscountRule',
      },
      name: String,
      type: {
        type: String,
        enum: ['Fixed', 'Percentage'],
      },
      value: Number,
      amount: Number,
      applicability: {
        type: String,
        enum: ['Specific_Product', 'Whole_Subscription'],
      },
      applied_at: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for strict database-level idempotency
invoiceSchema.index(
  { subscription_id: 1, billing_period_start: 1, billing_period_end: 1 },
  { unique: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = {
  Invoice,
  INVOICE_STATUSES,
};

const mongoose = require('mongoose');

const SUBSCRIPTION_STATUSES = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

const subscriptionLineSchema = new mongoose.Schema(
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
    tax_amount: {
      type: Number,
      default: 0,
      min: [0, 'tax_amount cannot be negative'],
    },
    total_amount: {
      type: Number,
      required: [true, 'total_amount is required'],
      min: [0, 'total_amount cannot be negative'],
      default: 0,
    },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    subscription_number: {
      type: String,
      required: [true, 'subscription_number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'customer_id is required'],
      ref: 'Customer',
      index: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'plan_id is required'],
      ref: 'Plan',
      index: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    expiry_date: {
      type: Date,
    },
    payment_terms: {
      type: String,
      default: 'Immediate Payment',
      trim: true,
    },
    lines: {
      type: [subscriptionLineSchema],
      default: [],
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: SUBSCRIPTION_STATUSES,
        message: '{VALUE} is not a valid subscription status',
      },
      default: 'Draft',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = {
  Subscription,
  SUBSCRIPTION_STATUSES,
};


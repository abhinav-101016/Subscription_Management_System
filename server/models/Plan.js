const mongoose = require('mongoose');

const BILLING_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
const RENEWAL_BEHAVIORS = ['Auto-Close', 'Early-Close', 'Pause', 'Renew'];

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    price: {
      type: Number,
      min: [0, 'Plan price cannot be negative'],
      default: 0,
    },
    cost: {
      type: Number,
      min: [0, 'Plan cost cannot be negative'],
      default: 0,
    },
    billing_frequency: {
      type: String,
      required: [true, 'Billing frequency is required'],
      enum: {
        values: BILLING_FREQUENCIES,
        message: '{VALUE} is not a valid billing frequency. Must be one of: Daily, Weekly, Monthly, Yearly',
      },
      index: true,
    },
    minimum_quantity: {
      type: Number,
      required: [true, 'Minimum quantity is required'],
      min: [1, 'Minimum quantity must be at least 1'],
      default: 1,
    },
    available_from: {
      type: Date,
      default: Date.now,
      index: true,
    },
    available_to: {
      type: Date,
      validate: {
        validator: function (val) {
          if (this.available_from && val) {
            return new Date(val) >= new Date(this.available_from);
          }
          return true;
        },
        message: 'available_to date cannot be earlier than available_from date',
      },
      index: true,
    },
    renewal_behavior: {
      type: String,
      required: [true, 'Renewal behavior is required'],
      enum: {
        values: RENEWAL_BEHAVIORS,
        message: '{VALUE} is not a valid renewal behavior. Must be one of: Auto-Close, Early-Close, Pause, Renew',
      },
      default: 'Renew',
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      sparse: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Performance compound index for listing currently available plans
planSchema.index({ active: 1, available_from: 1, available_to: 1 });

const Plan = mongoose.model('Plan', planSchema);

module.exports = {
  Plan,
  BILLING_FREQUENCIES,
  RENEWAL_BEHAVIORS,
};

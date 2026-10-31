const mongoose = require('mongoose');

const DISCOUNT_TYPES = ['Fixed', 'Percentage'];
const APPLICABILITY_TYPES = ['Specific_Product', 'Whole_Subscription'];

const discountRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Discount rule name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },
    type: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: DISCOUNT_TYPES,
        message: '{VALUE} is not a valid discount type. Must be "Fixed" or "Percentage"',
      },
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0.01, 'Discount value must be greater than 0'],
      validate: {
        validator: function (val) {
          if (this.type === 'Percentage') {
            return val <= 100;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 100%',
      },
    },
    min_purchase_amount: {
      type: Number,
      default: 0,
      min: [0, 'min_purchase_amount cannot be negative'],
    },
    min_quantity: {
      type: Number,
      default: 0,
      min: [0, 'min_quantity cannot be negative'],
    },
    valid_from: {
      type: Date,
    },
    valid_to: {
      type: Date,
      validate: {
        validator: function (val) {
          if (this.valid_from && val) {
            return new Date(val) >= new Date(this.valid_from);
          }
          return true;
        },
        message: 'valid_to date cannot be earlier than valid_from date',
      },
    },
    usage_limit: {
      type: Number,
      min: [1, 'usage_limit must be at least 1 if specified'],
    },
    times_used: {
      type: Number,
      default: 0,
      min: [0, 'times_used cannot be negative'],
    },
    applicability: {
      type: String,
      required: [true, 'applicability is required'],
      enum: {
        values: APPLICABILITY_TYPES,
        message: '{VALUE} is not a valid applicability. Must be "Specific_Product" or "Whole_Subscription"',
      },
    },
    applicable_product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      validate: {
        validator: function (val) {
          if (this.applicability === 'Specific_Product') {
            return mongoose.Types.ObjectId.isValid(val);
          }
          return true;
        },
        message: 'applicable_product_id is required when applicability is "Specific_Product"',
      },
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
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

const DiscountRule = mongoose.model('DiscountRule', discountRuleSchema);

module.exports = {
  DiscountRule,
  DISCOUNT_TYPES,
  APPLICABILITY_TYPES,
};


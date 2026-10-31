const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'product_id is required'],
      index: true,
    },
    variant_name: {
      type: String,
      required: [true, 'Variant name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    attribute_name: {
      type: String,
      trim: true,
      default: 'Brand',
    },
    attribute_value: {
      type: String,
      trim: true,
      required: [true, 'attribute_value is required'],
    },
    price_extra: {
      type: Number,
      default: 0,
      min: [0, 'price_extra cannot be negative'],
    },
    final_price: {
      type: Number,
      required: [true, 'final_price is required'],
      min: [0, 'final_price cannot be negative'],
    },
    cost_price: {
      type: Number,
      default: 0,
      min: [0, 'cost_price cannot be negative'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = ProductVariant;

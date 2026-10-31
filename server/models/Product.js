const mongoose = require('mongoose');

const ITEM_TYPES = ['Goods', 'Service', 'Consumable', 'Storable Product'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    item_type: {
      type: String,
      enum: {
        values: ITEM_TYPES,
        message: '{VALUE} is not a valid item type. Must be one of: Goods, Service, Consumable, Storable Product',
      },
      default: 'Service',
      index: true,
    },
    sales_price: {
      type: Number,
      required: [true, 'sales_price is required'],
      min: [0, 'sales_price cannot be negative'],
      default: 0,
    },
    cost_price: {
      type: Number,
      min: [0, 'cost_price cannot be negative'],
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
      },
    ],
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

const Product = mongoose.model('Product', productSchema);

module.exports = {
  Product,
  ITEM_TYPES,
};

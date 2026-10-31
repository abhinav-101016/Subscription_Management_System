const mongoose = require('mongoose');

const templateLineSchema = new mongoose.Schema(
  {
    product_variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'product_variant_id is required for template line'],
      ref: 'ProductVariant',
    },
    default_quantity: {
      type: Number,
      required: [true, 'default_quantity is required'],
      min: [1, 'default_quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: false }
);

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    default_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'default_plan_id is required'],
      ref: 'Plan',
    },
    validity_days: {
      type: Number,
      required: [true, 'validity_days is required'],
      min: [1, 'validity_days must be at least 1 day'],
      default: 30,
    },
    template_lines: {
      type: [templateLineSchema],
      default: [],
      validate: {
        validator: function (lines) {
          return Array.isArray(lines) && lines.length > 0;
        },
        message: 'A quotation template must include at least one template line',
      },
    },
  },
  {
    timestamps: true,
  }
);

const QuotationTemplate = mongoose.model('QuotationTemplate', quotationTemplateSchema);

module.exports = QuotationTemplate;


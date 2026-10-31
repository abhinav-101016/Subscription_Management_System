const mongoose = require('mongoose');

const taxRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax rule name is required'],
      trim: true,
    },
    percentage_rate: {
      type: Number,
      required: [true, 'Tax percentage rate is required'],
      min: [0, 'Tax percentage rate cannot be negative'],
      max: [100, 'Tax percentage rate cannot exceed 100%'],
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

// Method / Static to get current active tax rule
taxRuleSchema.statics.getActiveRule = async function (session = null) {
  const query = this.findOne({ active: true }).sort({ updatedAt: -1 });
  if (session) {
    query.session(session);
  }
  return await query.exec();
};

const TaxRule = mongoose.model('TaxRule', taxRuleSchema);

module.exports = TaxRule;


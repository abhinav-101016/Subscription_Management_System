const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'invoice_id is required'],
      ref: 'Invoice',
      index: true,
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    payment_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for date-range revenue aggregation and invoice lookups
paymentSchema.index({ payment_date: -1, amount: 1 });
paymentSchema.index({ invoice_id: 1, payment_date: -1 });
paymentSchema.index({ createdAt: -1, amount: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

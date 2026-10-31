const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff", "customer"], default: "customer" },
    staffId: { type: String, unique: true, sparse: true, trim: true },
    loginId: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    department: { type: String, trim: true, default: "General" },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    signupOtp: { type: String },
    signupOtpExpiry: { type: Date },
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Register alias for 'Customer' so that populate('customer_id') works seamlessly across both model references
if (!mongoose.models.Customer) {
  mongoose.model("Customer", userSchema);
}

module.exports = User;

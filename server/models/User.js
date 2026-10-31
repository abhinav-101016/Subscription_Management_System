const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff", "customer"], default: "customer" },
    isVerified: { type: Boolean, default: true },
    signupOtp: { type: String },
    signupOtpExpiry: { type: Date },
    resetOtp: { type: String },
    resetOtpExpiry: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
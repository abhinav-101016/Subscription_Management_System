const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/token");
const { sendOtpMail } = require("../utils/mailer");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "customer" });

    res.status(201).json({
      message: "Signup successful",
      token: generateToken(user),
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: { name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.resetOtp = await bcrypt.hash(otp, 10);
      user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpMail(user.email, otp);
    }

    res.json({ message: "If the email is registered, an OTP has been sent" });
  } catch (error) {
    res.status(500).json({ message: "Could not send OTP" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, otp and newPassword are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.resetOtp || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const valid = await bcrypt.compare(String(otp), user.resetOtp);
    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed" });
  }
};

const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { signup, login, forgotPassword, resetPassword, me };
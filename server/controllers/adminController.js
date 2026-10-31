const bcrypt = require("bcryptjs");
const User = require("../models/User");
const validatePassword = require("../utils/validatePassword");

const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const staff = await User.create({ name, email, password: hashed, role: "staff", isVerified: true });

    res.status(201).json({
      message: "Staff created",
      user: { name: staff.name, email: staff.email, role: staff.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create staff" });
  }
};

const listStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("name email role createdAt");
    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch staff" });
  }
};

module.exports = { createStaff, listStaff };
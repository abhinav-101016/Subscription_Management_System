require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      console.log("Admin already exists");
    } else {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        name: process.env.ADMIN_NAME || "Admin",
        email,
        password: hashed,
        role: "admin",
        isVerified: true
      });
      console.log("Admin seeded");
    }
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin();
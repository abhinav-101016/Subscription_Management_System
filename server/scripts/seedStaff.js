require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  generateSeededStaffId,
  generateLoginId,
  generateSecurePassword
} = require("../utils/credentialGenerator");

const defaultInternalStaff = [
  {
    name: "Customer Support Specialist",
    department: "Customer Support",
    email: "support@odoo.internal",
    phone: "+1-555-0101"
  },
  {
    name: "Sales Account Executive",
    department: "Sales & Accounts",
    email: "sales@odoo.internal",
    phone: "+1-555-0102"
  },
  {
    name: "Billing & Invoicing Officer",
    department: "Finance & Billing",
    email: "billing@odoo.internal",
    phone: "+1-555-0103"
  },
  {
    name: "Operations & Inventory Lead",
    department: "Operations",
    email: "operations@odoo.internal",
    phone: "+1-555-0104"
  }
];

const seedStaff = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/subscription_management";

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Staff Seeding...");

    const createdStaff = [];

    for (const member of defaultInternalStaff) {
      const existing = await User.findOne({
        $or: [{ email: member.email.toLowerCase() }, { name: member.name }]
      });

      if (existing) {
        console.log(`Staff already exists: ${existing.name} [${existing.staffId || existing.email}]`);
        continue;
      }

      const staffId = await generateSeededStaffId("STF");
      const loginId = await generateLoginId(member.name, staffId);
      const temporaryPassword = generateSecurePassword(12);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      const staff = await User.create({
        name: member.name,
        email: member.email.toLowerCase(),
        password: hashedPassword,
        role: "staff",
        staffId,
        loginId,
        department: member.department,
        phone: member.phone,
        isActive: true,
        isVerified: true
      });

      createdStaff.push({
        id: staff._id,
        name: staff.name,
        staffId: staff.staffId,
        loginId: staff.loginId,
        email: staff.email,
        department: staff.department,
        temporaryPassword
      });

      console.log(`----------------------------------------`);
      console.log(`✓ Seeded Staff Member: ${staff.name}`);
      console.log(`  Seeded ID : ${staff.staffId}`);
      console.log(`  Login ID  : ${staff.loginId}`);
      console.log(`  Email     : ${staff.email}`);
      console.log(`  Department: ${staff.department}`);
      console.log(`  Password  : ${temporaryPassword}`);
    }

    console.log(`----------------------------------------`);
    console.log(`Successfully seeded ${createdStaff.length} internal staff member(s).`);
    return createdStaff;
  } catch (error) {
    console.error("Staff seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedStaff();
}

module.exports = seedStaff;

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const validatePassword = require("../utils/validatePassword");
const {
  generateSeededStaffId,
  generateLoginId,
  generateSecurePassword
} = require("../utils/credentialGenerator");

/**
 * Helper to find a staff user by Mongo _id, staffId, or loginId
 */
const findStaffMember = async (identifier) => {
  if (!identifier) return null;

  const queries = [
    { staffId: String(identifier).trim().toUpperCase(), role: "staff" },
    { loginId: String(identifier).trim().toLowerCase(), role: "staff" }
  ];

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    queries.unshift({ _id: identifier, role: "staff" });
  }

  return await User.findOne({ $or: queries });
};

/**
 * Create a new internal staff member with seeded ID and generated credentials
 * POST /api/admin/staff
 */
const createStaff = async (req, res) => {
  try {
    const { name, email, password, staffId, seededId, loginId, department, phone } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "Staff name is required" });
    }

    // 1. Validate password upfront if provided; otherwise generate secure password
    let plainPassword = password;
    if (plainPassword) {
      const passwordError = validatePassword(plainPassword);
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
    } else {
      plainPassword = generateSecurePassword(12);
    }

    // 2. Resolve Seeded Staff ID
    let finalStaffId = (staffId || seededId || "").trim().toUpperCase();
    if (finalStaffId) {
      const existingWithStaffId = await User.findOne({ staffId: finalStaffId });
      if (existingWithStaffId) {
        return res.status(409).json({
          success: false,
          message: `Staff ID '${finalStaffId}' is already assigned`
        });
      }
    } else {
      finalStaffId = await generateSeededStaffId("STF");
    }

    // 3. Resolve Login ID
    let finalLoginId = (loginId || "").trim().toLowerCase();
    if (finalLoginId) {
      const existingWithLoginId = await User.findOne({ loginId: finalLoginId });
      if (existingWithLoginId) {
        return res.status(409).json({
          success: false,
          message: `Login ID '${finalLoginId}' is already taken`
        });
      }
    } else {
      finalLoginId = await generateLoginId(name, finalStaffId);
    }

    // 4. Resolve Email
    let finalEmail = (email || "").trim().toLowerCase();
    if (finalEmail) {
      const existingWithEmail = await User.findOne({ email: finalEmail });
      if (existingWithEmail) {
        return res.status(409).json({
          success: false,
          message: `Email '${finalEmail}' is already registered`
        });
      }
    } else {
      finalEmail = `${finalLoginId}@staff.odoo.internal`;
    }

    // 5. Hash and persist staff record
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const staff = await User.create({
      name: name.trim(),
      email: finalEmail,
      password: hashedPassword,
      role: "staff",
      staffId: finalStaffId,
      loginId: finalLoginId,
      department: department ? String(department).trim() : "General",
      phone: phone ? String(phone).trim() : "",
      isActive: true,
      isVerified: true
    });

    res.status(201).json({
      success: true,
      message: "Internal staff member created successfully",
      staff: {
        id: staff._id,
        staffId: staff.staffId,
        loginId: staff.loginId,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt
      },
      credentials: {
        seededId: staff.staffId,
        loginId: staff.loginId,
        email: staff.email,
        temporaryPassword: plainPassword
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A staff member with this email, login ID, or seeded ID already exists"
      });
    }
    console.error("Create Staff Error:", error);
    res.status(500).json({ success: false, message: "Could not create internal staff member" });
  }
};

/**
 * List internal staff members with search and filter capabilities
 * GET /api/admin/staff
 */
const listStaff = async (req, res) => {
  try {
    const { search, department, isActive } = req.query || {};
    const filter = { role: "staff" };

    if (department) {
      filter.department = new RegExp(`^${department.trim()}$`, "i");
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true" || isActive === true;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { loginId: searchRegex },
        { staffId: searchRegex },
        { department: searchRegex }
      ];
    }

    const staffList = await User.find(filter)
      .select("name email role staffId loginId department phone isActive isVerified createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: staffList.length,
      staff: staffList
    });
  } catch (error) {
    console.error("List Staff Error:", error);
    res.status(500).json({ success: false, message: "Could not fetch internal staff list" });
  }
};

/**
 * Get single internal staff member by ID, seeded staffId, or loginId
 * GET /api/admin/staff/:id
 */
const getStaffById = async (req, res) => {
  try {
    const staff = await findStaffMember(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Internal staff member not found" });
    }

    res.json({
      success: true,
      staff: {
        id: staff._id,
        staffId: staff.staffId,
        loginId: staff.loginId,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        isVerified: staff.isVerified,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt
      }
    });
  } catch (error) {
    console.error("Get Staff Error:", error);
    res.status(500).json({ success: false, message: "Could not retrieve staff details" });
  }
};

/**
 * Update internal staff member details
 * PUT /api/admin/staff/:id
 */
const updateStaff = async (req, res) => {
  try {
    const staff = await findStaffMember(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Internal staff member not found" });
    }

    const { name, email, loginId, department, phone, isActive, role } = req.body || {};

    if (name !== undefined) staff.name = String(name).trim();
    if (department !== undefined) staff.department = String(department).trim();
    if (phone !== undefined) staff.phone = String(phone).trim();
    if (isActive !== undefined) staff.isActive = Boolean(isActive);
    if (role !== undefined && ["staff", "admin"].includes(role)) staff.role = role;

    if (email && email.toLowerCase().trim() !== staff.email) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: staff._id }
      });
      if (emailTaken) {
        return res.status(409).json({ success: false, message: "Email is already in use by another user" });
      }
      staff.email = email.toLowerCase().trim();
    }

    if (loginId && loginId.toLowerCase().trim() !== staff.loginId) {
      const loginIdTaken = await User.findOne({
        loginId: loginId.toLowerCase().trim(),
        _id: { $ne: staff._id }
      });
      if (loginIdTaken) {
        return res.status(409).json({ success: false, message: "Login ID is already in use" });
      }
      staff.loginId = loginId.toLowerCase().trim();
    }

    await staff.save();

    res.json({
      success: true,
      message: "Internal staff details updated successfully",
      staff: {
        id: staff._id,
        staffId: staff.staffId,
        loginId: staff.loginId,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        updatedAt: staff.updatedAt
      }
    });
  } catch (error) {
    console.error("Update Staff Error:", error);
    res.status(500).json({ success: false, message: "Could not update internal staff member" });
  }
};

/**
 * Regenerate login credentials (password and/or loginId) for a staff member
 * POST /api/admin/staff/:id/reset-credentials
 */
const resetStaffCredentials = async (req, res) => {
  try {
    const staff = await findStaffMember(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Internal staff member not found" });
    }

    const { newPassword, password, regenerateLoginId } = req.body || {};

    let plainPassword = newPassword || password;
    if (plainPassword) {
      const passwordError = validatePassword(plainPassword);
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
    } else {
      plainPassword = generateSecurePassword(12);
    }

    staff.password = await bcrypt.hash(plainPassword, 10);

    if (regenerateLoginId) {
      staff.loginId = await generateLoginId(staff.name, staff.staffId);
    }

    await staff.save();

    res.json({
      success: true,
      message: "Staff credentials reset successfully",
      credentials: {
        staffId: staff.staffId,
        loginId: staff.loginId,
        email: staff.email,
        temporaryPassword: plainPassword
      }
    });
  } catch (error) {
    console.error("Reset Credentials Error:", error);
    res.status(500).json({ success: false, message: "Could not reset staff credentials" });
  }
};

/**
 * Delete or deactivate internal staff member
 * DELETE /api/admin/staff/:id
 */
const deleteStaff = async (req, res) => {
  try {
    const staff = await findStaffMember(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Internal staff member not found" });
    }

    const isSoftDelete =
      (req.query && req.query.soft === "true") ||
      (req.body && req.body.soft === true);

    if (isSoftDelete) {
      staff.isActive = false;
      await staff.save();
      return res.json({
        success: true,
        message: `Staff member '${staff.name}' (${staff.staffId}) deactivated successfully`
      });
    }

    await User.findByIdAndDelete(staff._id);

    res.json({
      success: true,
      message: `Staff member '${staff.name}' (${staff.staffId}) deleted successfully`
    });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    res.status(500).json({ success: false, message: "Could not delete staff member" });
  }
};

/**
 * Seed initial or batch internal staff members
 * POST /api/admin/staff/seed
 */
const seedStaff = async (req, res) => {
  try {
    const defaultStaff = [
      { name: "Support Specialist", department: "Customer Support", email: "support@odoo.internal" },
      { name: "Sales Executive", department: "Sales", email: "sales@odoo.internal" },
      { name: "Billing Officer", department: "Billing & Finance", email: "billing@odoo.internal" },
      { name: "Operations Lead", department: "Operations", email: "operations@odoo.internal" }
    ];

    const inputList = Array.isArray(req.body?.staff) && req.body.staff.length > 0 ? req.body.staff : defaultStaff;
    const seededResults = [];
    const skippedResults = [];

    for (const member of inputList) {
      const searchConditions = [{ name: member.name }];
      if (member.email) searchConditions.push({ email: member.email.toLowerCase().trim() });
      if (member.loginId) searchConditions.push({ loginId: member.loginId.toLowerCase().trim() });
      if (member.staffId || member.seededId) {
        searchConditions.push({ staffId: (member.staffId || member.seededId).toUpperCase().trim() });
      }

      const existing = await User.findOne({ $or: searchConditions });
      if (existing) {
        skippedResults.push({
          name: member.name,
          reason: `Already exists as ${existing.staffId || existing.email}`
        });
        continue;
      }

      const staffId = (member.staffId || member.seededId)
        ? (member.staffId || member.seededId).toUpperCase().trim()
        : await generateSeededStaffId("STF");

      const loginId = member.loginId
        ? member.loginId.toLowerCase().trim()
        : await generateLoginId(member.name, staffId);

      const email = member.email
        ? member.email.toLowerCase().trim()
        : `${loginId}@staff.odoo.internal`;

      let plainPassword = member.password;
      if (plainPassword) {
        const passwordError = validatePassword(plainPassword);
        if (passwordError) {
          plainPassword = generateSecurePassword(12);
        }
      } else {
        plainPassword = generateSecurePassword(12);
      }

      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const newStaff = await User.create({
        name: member.name.trim(),
        email,
        password: hashedPassword,
        role: "staff",
        staffId,
        loginId,
        department: member.department || "General",
        phone: member.phone || "",
        isActive: true,
        isVerified: true
      });

      seededResults.push({
        id: newStaff._id,
        name: newStaff.name,
        staffId: newStaff.staffId,
        loginId: newStaff.loginId,
        email: newStaff.email,
        department: newStaff.department,
        temporaryPassword: plainPassword
      });
    }

    res.status(201).json({
      success: true,
      message: `Seeded ${seededResults.length} staff member(s). ${skippedResults.length} skipped.`,
      seededCount: seededResults.length,
      seededStaff: seededResults,
      skipped: skippedResults
    });
  } catch (error) {
    console.error("Seed Staff Error:", error);
    res.status(500).json({ success: false, message: "Could not seed internal staff" });
  }
};

module.exports = {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  resetStaffCredentials,
  deleteStaff,
  seedStaff
};

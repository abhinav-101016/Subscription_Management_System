const crypto = require("crypto");
const User = require("../models/User");
const validatePassword = require("./validatePassword");

/**
 * Generates a sequential seeded staff ID (e.g. STF-0001, STF-0002)
 * @param {string} prefix - The prefix for the staff ID (defaults to 'STF')
 * @returns {Promise<string>}
 */
const generateSeededStaffId = async (prefix = "STF") => {
  const cleanPrefix = (prefix || "STF").trim().toUpperCase();
  const regex = new RegExp(`^${cleanPrefix}-(\\d+)$`, "i");

  const staffMembers = await User.find({
    role: "staff",
    staffId: { $regex: regex }
  }).select("staffId");

  let maxSequence = 0;
  for (const staff of staffMembers) {
    if (staff.staffId) {
      const match = staff.staffId.match(regex);
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    }
  }

  let nextSequence = maxSequence + 1;
  let candidate = `${cleanPrefix}-${String(nextSequence).padStart(4, "0")}`;

  // Ensure collision-free candidate
  while (await User.findOne({ staffId: candidate })) {
    nextSequence++;
    candidate = `${cleanPrefix}-${String(nextSequence).padStart(4, "0")}`;
  }

  return candidate;
};

/**
 * Generates a clean, unique login ID from name or fallback seed
 * @param {string} name - Staff member name
 * @param {string} fallbackSeed - Fallback seed string
 * @returns {Promise<string>}
 */
const generateLoginId = async (name, fallbackSeed = "") => {
  let base = (name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  if (!base) {
    const cleanFallback = (fallbackSeed || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    base = cleanFallback ? `staff.${cleanFallback}` : `staff.${crypto.randomInt(1000, 9999)}`;
  }

  let candidate = base;
  let counter = 1;
  while (await User.findOne({ loginId: candidate })) {
    counter++;
    candidate = `${base}${counter}`;
  }

  return candidate;
};

/**
 * Generates a strong random password that strictly satisfies validatePassword:
 * > 8 characters, at least 1 uppercase, at least 1 lowercase, at least 1 special char, and digits
 * @param {number} length - Password length (default 12)
 * @returns {string}
 */
const generateSecurePassword = (length = 12) => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%^&*";

  const passwordChars = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
    specials[crypto.randomInt(0, specials.length)]
  ];

  const allChars = upper + lower + digits + specials;
  const targetLength = Math.max(length, 10);
  while (passwordChars.length < targetLength) {
    passwordChars.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  const generated = passwordChars.join("");
  const err = validatePassword(generated);
  if (err) {
    return "Staff@Pass" + crypto.randomInt(1000, 9999) + "!";
  }

  return generated;
};

module.exports = {
  generateSeededStaffId,
  generateLoginId,
  generateSecurePassword
};

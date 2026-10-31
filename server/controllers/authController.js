const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/token");
const validatePassword = require("../utils/validatePassword");
const { sendOtpMail } = require("../utils/mailer");

const OTP_LIFETIME = 10 * 60 * 1000;

const createOtp = async () => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hash = await bcrypt.hash(otp, 10);
  return { otp, hash };
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.isVerified !== false) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { otp, hash } = await createOtp();
    const expiry = new Date(Date.now() + OTP_LIFETIME);

    if (user) {
      user.name = name;
      user.password = hashedPassword;
      user.signupOtp = hash;
      user.signupOtpExpiry = expiry;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "customer",
        isVerified: false,
        signupOtp: hash,
        signupOtpExpiry: expiry
      });
    }

    await sendOtpMail(user.email, otp, "Verify your email");

    res.status(201).json({
      message: "Signup successful. An OTP has been sent to your email",
      otp: process.env.NODE_ENV !== "production" ? otp : undefined
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    console.error(error);
    res.status(500).json({ message: "Signup failed" });
  }
};

const verifySignup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and otp are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.isVerified !== false || !user.signupOtp || user.signupOtpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const valid = await bcrypt.compare(String(otp), user.signupOtp);
    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.signupOtp = undefined;
    user.signupOtpExpiry = undefined;
    await user.save();

    res.json({
      message: "Email verified",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffId: user.staffId,
        loginId: user.loginId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    let devOtp;
    if (user && user.isVerified === false) {
      const { otp, hash } = await createOtp();
      user.signupOtp = hash;
      user.signupOtpExpiry = new Date(Date.now() + OTP_LIFETIME);
      await user.save();
      await sendOtpMail(user.email, otp, "Verify your email");
      devOtp = otp;
    }

    res.json({
      message: "If the account is pending verification, an OTP has been sent",
      otp: process.env.NODE_ENV !== "production" ? devOtp : undefined
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not send OTP" });
  }
};

const login = async (req, res) => {
  try {
    const { email, loginId, identifier: rawId, password } = req.body;
    const identifier = (email || loginId || rawId || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Login ID and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { loginId: identifier.toLowerCase() },
        { staffId: identifier.toUpperCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated. Please contact admin." });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffId: user.staffId,
        loginId: user.loginId,
        department: user.department
      }
    });
  } catch (error) {
    console.error(error);
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
      const { otp, hash } = await createOtp();
      user.resetOtp = hash;
      user.resetOtpExpiry = new Date(Date.now() + OTP_LIFETIME);
      await user.save();
      await sendOtpMail(user.email, otp);
    }

    res.json({ message: "If the email is registered, an OTP has been sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not send OTP" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, otp and newPassword are required" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
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
    console.error(error);
    res.status(500).json({ message: "Password reset failed" });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-password -signupOtp -resetOtp");
    const activeUser = user || req.user;
    const userData = {
      _id: activeUser._id,
      id: activeUser._id,
      name: activeUser.name,
      email: activeUser.email,
      role: activeUser.role || "customer",
    };
    res.json({
      success: true,
      data: userData,
      user: userData,
    });
  } catch (error) {
    const fallbackData = {
      _id: req.user._id,
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || "customer",
    };
    res.json({
      success: true,
      data: fallbackData,
      user: fallbackData,
    });
  }
};

module.exports = { signup, verifySignup, resendSignupOtp, login, forgotPassword, resetPassword, me };

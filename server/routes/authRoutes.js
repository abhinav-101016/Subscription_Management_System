const express = require("express");
const {
  signup,
  verifySignup,
  resendSignupOtp,
  login,
  forgotPassword,
  resetPassword,
  me
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-signup", verifySignup);
router.post("/resend-signup-otp", resendSignupOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, me);

module.exports = router;
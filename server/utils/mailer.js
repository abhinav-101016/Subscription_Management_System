const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendOtpMail = async (to, otp, subject = "Your verification OTP") => {
  console.log(`\n========================================`);
  console.log(`[AUTH OTP DISPATCH]`);
  console.log(`Recipient: ${to}`);
  console.log(`OTP Code:  ${otp}`);
  console.log(`Subject:   ${subject}`);
  console.log(`========================================\n`);

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_HOST) {
      console.warn("SMTP credentials not fully configured; skipping email dispatch.");
      return;
    }
    await transporter.sendMail({
      from: process.env.MAIL_FROM || "no-reply@cadence.finance",
      to,
      subject,
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`
    });
  } catch (error) {
    console.error("Warning: SMTP mail dispatch failed:", error.message);
    // In development or when TLS inspection causes cert errors, do not crash signup
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV FALLBACK] Use OTP "${otp}" in the browser to complete verification.`);
      return;
    }
    throw error;
  }
};

module.exports = { sendOtpMail };

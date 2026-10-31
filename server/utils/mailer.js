const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
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

const sendOtpMail = async (to, otp, subject = "Your Cadence verification OTP") => {
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

    const mailFrom = process.env.MAIL_FROM && process.env.MAIL_FROM.includes("@")
      ? process.env.MAIL_FROM
      : "prajitsingh05@gmail.com";

    const formattedFrom = `"${process.env.ADMIN_NAME || "Cadence Finance"}" <${mailFrom}>`;

    const info = await transporter.sendMail({
      from: formattedFrom,
      to,
      subject,
      text: `Your Cadence verification code is: ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border: 1px solid #E6E5DC; border-radius: 12px; background-color: #FAFAF7; color: #141413;">
          <div style="margin-bottom: 24px;">
            <div style="display: inline-block; width: 32px; height: 32px; border-radius: 6px; background-color: #0D4A38; color: #ffffff; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">C</div>
            <span style="margin-left: 8px; font-size: 18px; font-weight: 600; vertical-align: middle;">Cadence</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">Verify your email address</h2>
          <p style="font-size: 14px; color: #6B6A63; line-height: 1.5; margin: 0 0 24px 0;">
            Use the following six-digit code to complete your Cadence account registration:
          </p>
          <div style="background-color: #FFFFFF; border: 1px solid #E6E5DC; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: ui-monospace, 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0D4A38;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #9E9C93; line-height: 1.5; margin: 0;">
            This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`[SMTP SUCCESS] Mail delivered to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error("Warning: SMTP mail dispatch failed:", error.message);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV FALLBACK] Use OTP "${otp}" in the browser to complete verification.`);
    }
  }
};

module.exports = { sendOtpMail };

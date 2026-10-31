const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendOtpMail = async (to, otp, subject = "Your password reset OTP") => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`
  });
};

module.exports = { sendOtpMail };
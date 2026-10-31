const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  if (user.staffId) payload.staffId = user.staffId;
  if (user.loginId) payload.loginId = user.loginId;

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });
};

module.exports = generateToken;

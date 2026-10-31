const validatePassword = (password) => {
  if (typeof password !== "string" || password.length <= 8) {
    return "Password must be more than 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter";
  }
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return "Password must contain a special character";
  }
  return null;
};

module.exports = validatePassword;
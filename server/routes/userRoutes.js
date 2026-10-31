const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

/**
 * @desc    Get all users with optional role and search filter (e.g., customer picker)
 * @route   GET /api/users
 * @access  Authenticated (admin/staff)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.q) {
      const q = String(req.query.q).trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -signupOtp -resetOtp')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: err.message,
    });
  }
});

module.exports = router;

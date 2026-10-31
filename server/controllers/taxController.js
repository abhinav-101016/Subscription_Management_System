const mongoose = require('mongoose');
const TaxRule = require('../models/TaxRule');

/**
 * @desc    Create a new tax rule
 * @route   POST /api/taxes
 * @access  Admin
 */
const createTaxRule = async (req, res) => {
  try {
    const { name, percentage_rate, active } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid tax rule name is required',
      });
    }

    const rate = Number(percentage_rate);
    if (percentage_rate === undefined || isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({
        success: false,
        message: 'percentage_rate must be a valid number between 0 and 100',
      });
    }

    const isActive = active !== undefined ? Boolean(active) : true;

    // If new rule is set as active, optionally set older rules to inactive so there is a clear active rule
    if (isActive) {
      await TaxRule.updateMany({ active: true }, { $set: { active: false } });
    }

    const taxRule = new TaxRule({
      name: name.trim(),
      percentage_rate: rate,
      active: isActive,
    });

    const savedTaxRule = await taxRule.save();

    return res.status(201).json({
      success: true,
      message: 'Tax rule created successfully',
      data: savedTaxRule,
    });
  } catch (error) {
    console.error('Error creating tax rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating tax rule',
      error: error.message,
    });
  }
};

/**
 * @desc    List all tax rules
 * @route   GET /api/taxes
 * @access  Public / Admin
 */
const getAllTaxRules = async (req, res) => {
  try {
    const filter = {};
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    const taxRules = await TaxRule.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: taxRules.length,
      data: taxRules,
    });
  } catch (error) {
    console.error('Error fetching tax rules:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching tax rules',
      error: error.message,
    });
  }
};

/**
 * @desc    Get tax rule by ID
 * @route   GET /api/taxes/:id
 * @access  Public / Admin
 */
const getTaxRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tax rule ID format',
      });
    }

    const taxRule = await TaxRule.findById(id);
    if (!taxRule) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: taxRule,
    });
  } catch (error) {
    console.error('Error fetching tax rule by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching tax rule',
      error: error.message,
    });
  }
};

/**
 * @desc    Update tax rule
 * @route   PATCH /api/taxes/:id
 * @access  Admin
 */
const updateTaxRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, percentage_rate, active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tax rule ID format',
      });
    }

    const taxRule = await TaxRule.findById(id);
    if (!taxRule) {
      return res.status(404).json({
        success: false,
        message: 'Tax rule not found',
      });
    }

    if (name && typeof name === 'string' && name.trim()) {
      taxRule.name = name.trim();
    }

    if (percentage_rate !== undefined) {
      const rate = Number(percentage_rate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({
          success: false,
          message: 'percentage_rate must be a valid number between 0 and 100',
        });
      }
      taxRule.percentage_rate = rate;
    }

    if (active !== undefined) {
      const isActive = Boolean(active);
      if (isActive) {
        await TaxRule.updateMany({ _id: { $ne: id }, active: true }, { $set: { active: false } });
      }
      taxRule.active = isActive;
    }

    const updated = await taxRule.save();

    return res.status(200).json({
      success: true,
      message: 'Tax rule updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating tax rule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating tax rule',
      error: error.message,
    });
  }
};

module.exports = {
  createTaxRule,
  getAllTaxRules,
  getTaxRuleById,
  updateTaxRule,
};


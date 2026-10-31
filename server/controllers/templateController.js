const mongoose = require('mongoose');
const QuotationTemplate = require('../models/QuotationTemplate');

/**
 * @desc    Create a new quotation template
 * @route   POST /api/templates
 * @access  Public / Authenticated
 */
const createTemplate = async (req, res) => {
  try {
    const name = req.body.name;
    const default_plan_id = req.body.default_plan_id || req.body.plan_id;
    const validity_days = req.body.validity_days || 30;
    const rawLines = req.body.template_lines || req.body.lines || [];

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid template name is required',
      });
    }

    if (!default_plan_id || !mongoose.Types.ObjectId.isValid(default_plan_id)) {
      return res.status(400).json({
        success: false,
        message: 'A valid default_plan_id (MongoDB ObjectId) is required',
      });
    }

    const validity = Number(validity_days);
    if (isNaN(validity) || validity < 1) {
      return res.status(400).json({
        success: false,
        message: 'validity_days must be a positive number greater than or equal to 1',
      });
    }

    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'template_lines must be a non-empty array of items',
      });
    }

    const template_lines = [];
    // Validate each template line
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const variantId = line.product_variant_id || line.variant_id;
      if (!variantId || !mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid or missing product_variant_id at line index ${i}`,
        });
      }

      const qty = Number(line.default_quantity !== undefined ? line.default_quantity : line.quantity);
      if (isNaN(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: `default_quantity at line index ${i} must be a number greater than or equal to 1`,
        });
      }

      template_lines.push({
        product_variant_id: variantId,
        default_quantity: qty,
      });
    }

    const newTemplate = new QuotationTemplate({
      name: name.trim(),
      default_plan_id,
      validity_days: validity,
      template_lines,
    });

    const savedTemplate = await newTemplate.save();

    return res.status(201).json({
      success: true,
      message: 'Quotation template created successfully',
      data: savedTemplate,
    });
  } catch (error) {
    console.error('Error creating quotation template:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating quotation template',
      error: error.message,
    });
  }
};

/**
 * @desc    List all available quotation templates
 * @route   GET /api/templates
 * @access  Public / Authenticated
 */
const getAllTemplates = async (req, res) => {
  try {
    const templates = await QuotationTemplate.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching quotation templates:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching quotation templates',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a quotation template by ID
 * @route   GET /api/templates/:id
 * @access  Public / Authenticated
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID format',
      });
    }

    const template = await QuotationTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Quotation template not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching quotation template by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching quotation template',
      error: error.message,
    });
  }
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
};

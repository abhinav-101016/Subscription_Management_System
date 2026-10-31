const express = require('express');
const router = express.Router();
const {
  createTemplate,
  getAllTemplates,
  getTemplateById,
} = require('../controllers/templateController');

// POST /api/templates - Create a new quotation template
// GET /api/templates - List all available templates
router.route('/')
  .post(createTemplate)
  .get(getAllTemplates);

// GET /api/templates/:id - Get a specific template by ID
router.route('/:id')
  .get(getTemplateById);

module.exports = router;


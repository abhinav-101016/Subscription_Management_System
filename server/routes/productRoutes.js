const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
} = require('../controllers/productController');

// Product CRUD routes
router.route('/')
  .post(createProduct)
  .get(getAllProducts);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// Variant routes
router.route('/:id/variants')
  .post(addVariant);

router.route('/variants/:variantId')
  .put(updateVariant)
  .delete(deleteVariant);

module.exports = router;

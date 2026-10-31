const mongoose = require('mongoose');
const { Product, ITEM_TYPES } = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { Plan, BILLING_FREQUENCIES, RENEWAL_BEHAVIORS } = require('../models/Plan');

/**
 * Normalizes item type (handles case variations)
 */
const normalizeItemType = (type) => {
  if (!type || typeof type !== 'string') return 'Service';
  const clean = type.trim().toLowerCase();
  const match = ITEM_TYPES.find((t) => t.toLowerCase() === clean);
  return match || 'Service';
};

/**
 * @desc    Create a new product catalog item with specific variants and optional plan launch
 * @route   POST /api/products
 * @access  Admin
 */
const createProduct = async (req, res) => {
  try {
    const {
      name,
      item_type,
      type, // support both 'item_type' and 'type'
      sales_price,
      price, // support both 'sales_price' and 'price'
      cost_price,
      cost, // support both 'cost_price' and 'cost'
      notes,
      description,
      brand,
      variants,
      plan, // optional plan launch data
    } = req.body || {};

    // 1. Validate Product Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required',
      });
    }

    // 2. Validate Sales Price
    const rawSalesPrice = sales_price !== undefined ? sales_price : price;
    if (rawSalesPrice === undefined || isNaN(Number(rawSalesPrice)) || Number(rawSalesPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid non-negative sales_price is required',
      });
    }
    const finalSalesPrice = Number(rawSalesPrice);

    // 3. Validate Cost Price
    const rawCostPrice = cost_price !== undefined ? cost_price : (cost !== undefined ? cost : 0);
    const finalCostPrice = isNaN(Number(rawCostPrice)) || Number(rawCostPrice) < 0 ? 0 : Number(rawCostPrice);

    // 4. Item Type & Notes
    const resolvedItemType = normalizeItemType(item_type || type);
    const resolvedNotes = (notes || description || '').trim();

    // 5. Create Parent Product
    const newProduct = new Product({
      name: name.trim(),
      item_type: resolvedItemType,
      sales_price: finalSalesPrice,
      cost_price: finalCostPrice,
      notes: resolvedNotes,
      brand: brand ? String(brand).trim() : '',
      variants: [],
      active: true,
    });

    const savedProduct = await newProduct.save();

    // 6. Handle Variants (e.g., brand-based variants where Odoo adds 560)
    const variantDocs = [];
    const inputVariants = Array.isArray(variants) && variants.length > 0
      ? variants
      : [
          {
            attribute_name: 'Brand',
            attribute_value: brand || 'Standard',
            price_extra: 0,
          },
        ];

    for (const v of inputVariants) {
      const attrName = (v.attribute_name || v.attribute || 'Brand').trim();
      const attrVal = (v.attribute_value || v.value || v.name || 'Standard').trim();
      const priceExtra = !isNaN(Number(v.price_extra)) && Number(v.price_extra) >= 0 ? Number(v.price_extra) : 0;
      const variantCost = !isNaN(Number(v.cost_price)) && Number(v.cost_price) >= 0 ? Number(v.cost_price) : finalCostPrice;
      const finalVariantPrice = finalSalesPrice + priceExtra;

      const variantDoc = await ProductVariant.create({
        product_id: savedProduct._id,
        variant_name: v.variant_name || `${savedProduct.name} - ${attrVal}`,
        sku: v.sku || `${savedProduct.name.slice(0, 3).toUpperCase()}-${attrVal.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        attribute_name: attrName,
        attribute_value: attrVal,
        price_extra: priceExtra,
        final_price: finalVariantPrice,
        cost_price: variantCost,
        active: v.active !== undefined ? Boolean(v.active) : true,
      });

      variantDocs.push(variantDoc);
      savedProduct.variants.push(variantDoc._id);
    }

    await savedProduct.save();

    // 7. Optional: Launching a plan together with the product
    let createdPlan = null;
    if (plan && typeof plan === 'object') {
      const planName = plan.name || `${savedProduct.name} Subscription Plan`;
      const planFreq = plan.billing_frequency || 'Monthly';
      const planMinQty = Number(plan.minimum_quantity) >= 1 ? Number(plan.minimum_quantity) : 1;
      const planFrom = plan.available_from ? new Date(plan.available_from) : new Date();
      const planTo = plan.available_to ? new Date(plan.available_to) : null;
      const planBehavior = plan.renewal_behavior || 'Renew';
      const planPrice = plan.price !== undefined ? Number(plan.price) : (variantDocs[0]?.final_price || finalSalesPrice);

      createdPlan = await Plan.create({
        name: planName,
        price: planPrice,
        cost: finalCostPrice,
        billing_frequency: planFreq,
        minimum_quantity: planMinQty,
        available_from: planFrom,
        available_to: planTo,
        renewal_behavior: planBehavior,
        product_id: savedProduct._id,
        variant_id: variantDocs[0]?._id,
        description: plan.description || `Plan for ${savedProduct.name}`,
        active: true,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Product catalog item created successfully',
      data: {
        product: {
          id: savedProduct._id,
          name: savedProduct.name,
          item_type: savedProduct.item_type,
          sales_price: savedProduct.sales_price,
          cost_price: savedProduct.cost_price,
          notes: savedProduct.notes,
          brand: savedProduct.brand,
          active: savedProduct.active,
          variants: variantDocs,
        },
        plan: createdPlan,
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating product catalog item',
      error: error.message,
    });
  }
};

/**
 * @desc    List all products in catalog
 * @route   GET /api/products
 * @access  Public / Authenticated
 */
const getAllProducts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    if (req.query.item_type) {
      filter.item_type = normalizeItemType(req.query.item_type);
    }

    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { notes: searchRegex },
        { brand: searchRegex },
      ];
    }

    const products = await Product.find(filter)
      .populate('variants')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single product by ID with variants
 * @route   GET /api/products/:id
 * @access  Public / Authenticated
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(id).populate('variants');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching product',
      error: error.message,
    });
  }
};

/**
 * @desc    Update product details and recalculate variant prices if sales_price changes
 * @route   PUT /api/products/:id
 * @access  Admin
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const {
      name,
      item_type,
      type,
      sales_price,
      price,
      cost_price,
      cost,
      notes,
      description,
      brand,
      active,
    } = req.body || {};

    if (name && name.trim()) product.name = name.trim();
    if (item_type || type) product.item_type = normalizeItemType(item_type || type);
    if (notes !== undefined || description !== undefined) {
      product.notes = (notes !== undefined ? notes : description || '').trim();
    }
    if (brand !== undefined) product.brand = String(brand).trim();
    if (active !== undefined) product.active = Boolean(active);

    if (cost_price !== undefined || cost !== undefined) {
      const c = Number(cost_price !== undefined ? cost_price : cost);
      if (!isNaN(c) && c >= 0) product.cost_price = c;
    }

    // Check if sales_price is updated
    const newSalesPriceRaw = sales_price !== undefined ? sales_price : price;
    let salesPriceChanged = false;
    if (newSalesPriceRaw !== undefined) {
      const newPrice = Number(newSalesPriceRaw);
      if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== product.sales_price) {
        product.sales_price = newPrice;
        salesPriceChanged = true;
      }
    }

    await product.save();

    // If sales price changed, recalculate final_price on all child variants
    if (salesPriceChanged) {
      const variants = await ProductVariant.find({ product_id: product._id });
      for (const variant of variants) {
        variant.final_price = product.sales_price + variant.price_extra;
        await variant.save();
      }
    }

    const updated = await Product.findById(product._id).populate('variants');

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating product',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete or deactivate product
 * @route   DELETE /api/products/:id
 * @access  Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const isSoft = req.query.soft === 'true' || req.body?.soft === true;

    if (isSoft) {
      const product = await Product.findByIdAndUpdate(id, { active: false }, { new: true });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      await ProductVariant.updateMany({ product_id: id }, { active: false });
      return res.status(200).json({
        success: true,
        message: `Product '${product.name}' deactivated successfully`,
      });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Clean up child variants
    await ProductVariant.deleteMany({ product_id: id });

    return res.status(200).json({
      success: true,
      message: `Product '${product.name}' and associated variants deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a specific variant to an existing product
 * @route   POST /api/products/:id/variants
 * @access  Admin
 */
const addVariant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const {
      attribute_name,
      attribute_value,
      price_extra,
      cost_price,
      variant_name,
      sku,
      active,
    } = req.body || {};

    if (!attribute_value || !String(attribute_value).trim()) {
      return res.status(400).json({
        success: false,
        message: 'attribute_value is required (e.g. Odoo)',
      });
    }

    const attrName = (attribute_name || 'Brand').trim();
    const attrVal = String(attribute_value).trim();
    const extra = !isNaN(Number(price_extra)) && Number(price_extra) >= 0 ? Number(price_extra) : 0;
    const variantCost = !isNaN(Number(cost_price)) && Number(cost_price) >= 0 ? Number(cost_price) : product.cost_price;
    const calculatedPrice = product.sales_price + extra;

    const variant = await ProductVariant.create({
      product_id: product._id,
      variant_name: variant_name || `${product.name} - ${attrVal}`,
      sku: sku || `${product.name.slice(0, 3).toUpperCase()}-${attrVal.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      attribute_name: attrName,
      attribute_value: attrVal,
      price_extra: extra,
      final_price: calculatedPrice,
      cost_price: variantCost,
      active: active !== undefined ? Boolean(active) : true,
    });

    product.variants.push(variant._id);
    await product.save();

    return res.status(201).json({
      success: true,
      message: `Variant '${variant.variant_name}' added successfully with price adjustment +${extra}`,
      data: variant,
    });
  } catch (error) {
    console.error('Error adding variant:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding variant',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a specific variant
 * @route   PUT /api/products/variants/:variantId
 * @access  Admin
 */
const updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid variant ID format',
      });
    }

    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found',
      });
    }

    const product = await Product.findById(variant.product_id);
    const {
      variant_name,
      attribute_name,
      attribute_value,
      price_extra,
      cost_price,
      sku,
      active,
    } = req.body || {};

    if (variant_name) variant.variant_name = String(variant_name).trim();
    if (attribute_name) variant.attribute_name = String(attribute_name).trim();
    if (attribute_value) variant.attribute_value = String(attribute_value).trim();
    if (sku !== undefined) variant.sku = String(sku).trim();
    if (active !== undefined) variant.active = Boolean(active);

    if (cost_price !== undefined) {
      const c = Number(cost_price);
      if (!isNaN(c) && c >= 0) variant.cost_price = c;
    }

    if (price_extra !== undefined) {
      const extra = Number(price_extra);
      if (isNaN(extra) || extra < 0) {
        return res.status(400).json({
          success: false,
          message: 'price_extra cannot be negative',
        });
      }
      variant.price_extra = extra;
      const basePrice = product ? product.sales_price : 0;
      variant.final_price = basePrice + extra;
    }

    await variant.save();

    return res.status(200).json({
      success: true,
      message: 'Variant updated successfully',
      data: variant,
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating variant',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a variant
 * @route   DELETE /api/products/variants/:variantId
 * @access  Admin
 */
const deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid variant ID format',
      });
    }

    const variant = await ProductVariant.findByIdAndDelete(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found',
      });
    }

    // Remove from parent product's variants array
    await Product.findByIdAndUpdate(variant.product_id, {
      $pull: { variants: variant._id },
    });

    return res.status(200).json({
      success: true,
      message: `Variant '${variant.variant_name}' deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting variant',
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
};

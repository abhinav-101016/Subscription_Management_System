const assert = require('assert');
const mongoose = require('mongoose');
const { Product, ITEM_TYPES } = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { Plan, BILLING_FREQUENCIES, RENEWAL_BEHAVIORS } = require('../models/Plan');
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
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

console.log('--- 1. Testing Product & ProductVariant Schema Definitions ---');
const prodPaths = Product.schema.paths;
assert(prodPaths['name'], 'Product: name is missing');
assert(prodPaths['item_type'], 'Product: item_type is missing');
assert(prodPaths['sales_price'], 'Product: sales_price is missing');
assert(prodPaths['cost_price'], 'Product: cost_price is missing');
assert(prodPaths['notes'], 'Product: notes is missing');
assert(prodPaths['variants'], 'Product: variants reference array is missing');
assert(prodPaths['active'], 'Product: active is missing');

const varPaths = ProductVariant.schema.paths;
assert(varPaths['product_id'], 'ProductVariant: product_id is missing');
assert(varPaths['variant_name'], 'ProductVariant: variant_name is missing');
assert(varPaths['attribute_name'], 'ProductVariant: attribute_name is missing');
assert(varPaths['attribute_value'], 'ProductVariant: attribute_value is missing');
assert(varPaths['price_extra'], 'ProductVariant: price_extra is missing');
assert(varPaths['final_price'], 'ProductVariant: final_price is missing');
assert(varPaths['cost_price'], 'ProductVariant: cost_price is missing');

assert.deepStrictEqual(ITEM_TYPES, ['Goods', 'Service', 'Consumable', 'Storable Product']);
console.log('✓ Product & ProductVariant schemas correctly defined with required catalog fields');

console.log('\n--- 2. Testing Plan Model Schema & Enum Definitions ---');
const planPaths = Plan.schema.paths;
assert(planPaths['name'], 'Plan: name is missing');
assert(planPaths['price'], 'Plan: price is missing');
assert(planPaths['cost'], 'Plan: cost is missing');
assert(planPaths['billing_frequency'], 'Plan: billing_frequency is missing');
assert(planPaths['minimum_quantity'], 'Plan: minimum_quantity is missing');
assert(planPaths['available_from'], 'Plan: available_from is missing');
assert(planPaths['available_to'], 'Plan: available_to is missing');
assert(planPaths['renewal_behavior'], 'Plan: renewal_behavior is missing');

assert.deepStrictEqual(BILLING_FREQUENCIES, ['Daily', 'Weekly', 'Monthly', 'Yearly']);
assert.deepStrictEqual(RENEWAL_BEHAVIORS, ['Auto-Close', 'Early-Close', 'Pause', 'Renew']);
console.log('✓ Plan schema fields, billing frequencies, and renewal behaviors strictly verified');

console.log('\n--- 3. Testing Brightloop Product Launch with Odoo Variant Price Adjustment ---');
(async () => {
  // Save originals
  const origProductSave = Product.prototype.save;
  const origProductFind = Product.find;
  const origProductFindById = Product.findById;
  const origProductFindByIdAndDelete = Product.findByIdAndDelete;
  const origProductVariantCreate = ProductVariant.create;
  const origProductVariantFind = ProductVariant.find;
  const origProductVariantFindById = ProductVariant.findById;
  const origPlanSave = Plan.prototype.save;
  const origPlanFind = Plan.find;
  const origPlanFindOne = Plan.findOne;
  const origPlanFindById = Plan.findById;

  let createdVariants = [];
  ProductVariant.create = async (doc) => {
    const vDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      createdAt: new Date(),
    };
    createdVariants.push(vDoc);
    return vDoc;
  };

  Product.prototype.save = async function () {
    this._id = this._id || new mongoose.Types.ObjectId();
    return this;
  };

  const reqProduct = {
    body: {
      name: 'Brightloop',
      item_type: 'Service',
      sales_price: 1000,
      cost_price: 400,
      notes: 'Brightloop enterprise smart lighting service',
      variants: [
        {
          attribute_name: 'Brand',
          attribute_value: 'Standard',
          price_extra: 0,
        },
        {
          attribute_name: 'Brand',
          attribute_value: 'Odoo',
          price_extra: 560,
        },
      ],
    },
  };

  const resProduct = mockRes();
  await createProduct(reqProduct, resProduct);

  assert.strictEqual(resProduct.statusCode, 201);
  assert.strictEqual(resProduct.body.success, true);
  assert.strictEqual(resProduct.body.data.product.name, 'Brightloop');
  assert.strictEqual(resProduct.body.data.product.sales_price, 1000);
  assert.strictEqual(resProduct.body.data.product.cost_price, 400);

  const odooVariant = resProduct.body.data.product.variants.find(
    (v) => v.attribute_value === 'Odoo'
  );
  assert(odooVariant, 'Odoo variant must be present');
  assert.strictEqual(odooVariant.price_extra, 560, 'Odoo variant price adjustment should be 560');
  assert.strictEqual(odooVariant.final_price, 1560, 'Choosing Odoo brand must add 560 to price (1000 + 560 = 1560)');
  console.log(`✓ Product 'Brightloop' created with Odoo brand variant (+560 adjustment) -> final price: $${odooVariant.final_price}`);

  console.log('\n--- 4. Testing Plan Creation & Lifecycle Renewal Behaviors ---');
  Plan.findOne = async () => null; // No duplicate
  Plan.prototype.save = async function () {
    this._id = this._id || new mongoose.Types.ObjectId();
    return this;
  };

  // Plan A: Monthly Plan that closes on its own when it ends ('Auto-Close')
  const resPlan1 = mockRes();
  await createPlan(
    {
      body: {
        name: 'Brightloop Monthly Auto-Close Plan',
        price: 1560,
        cost: 400,
        billing_frequency: 'Monthly',
        minimum_quantity: 2,
        available_from: '2026-11-01',
        available_to: '2027-11-01',
        renewal_behavior: 'Auto-Close',
      },
    },
    resPlan1
  );

  assert.strictEqual(resPlan1.statusCode, 201);
  assert.strictEqual(resPlan1.body.data.name, 'Brightloop Monthly Auto-Close Plan');
  assert.strictEqual(resPlan1.body.data.billing_frequency, 'Monthly');
  assert.strictEqual(resPlan1.body.data.price, 1560);
  assert.strictEqual(resPlan1.body.data.minimum_quantity, 2);
  assert.strictEqual(resPlan1.body.data.renewal_behavior, 'Auto-Close');
  console.log('✓ Plan 1 created: Monthly billing, $1560, minimum_quantity 2, closes on its own when it ends (Auto-Close)');

  // Plan B: Yearly Plan that auto-renews ('Renew')
  const resPlan2 = mockRes();
  await createPlan(
    {
      body: {
        name: 'Brightloop Yearly Renew Plan',
        price: 15000,
        billing_frequency: 'yearly',
        minimum_quantity: 1,
        available_from: '2026-11-01',
        renewal_behavior: 'renew',
      },
    },
    resPlan2
  );

  assert.strictEqual(resPlan2.statusCode, 201);
  assert.strictEqual(resPlan2.body.data.billing_frequency, 'Yearly');
  assert.strictEqual(resPlan2.body.data.renewal_behavior, 'Renew');
  console.log('✓ Plan 2 created: Yearly billing, $15000, auto-renews (Renew)');

  // Plan C: Daily Plan that can be closed early ('Early-Close')
  const resPlan3 = mockRes();
  await createPlan(
    {
      body: {
        name: 'Brightloop Daily Flexible Plan',
        price: 50,
        billing_frequency: 'Daily',
        minimum_quantity: 1,
        renewal_behavior: 'Early-Close',
      },
    },
    resPlan3
  );

  assert.strictEqual(resPlan3.statusCode, 201);
  assert.strictEqual(resPlan3.body.data.renewal_behavior, 'Early-Close');
  console.log('✓ Plan 3 created: Daily billing, can be closed early (Early-Close)');

  // Plan D: Weekly Plan that can be paused ('Pause')
  const resPlan4 = mockRes();
  await createPlan(
    {
      body: {
        name: 'Brightloop Weekly Pausable Plan',
        price: 300,
        billing_frequency: 'Weekly',
        renewal_behavior: 'Pause',
      },
    },
    resPlan4
  );

  assert.strictEqual(resPlan4.statusCode, 201);
  assert.strictEqual(resPlan4.body.data.renewal_behavior, 'Pause');
  console.log('✓ Plan 4 created: Weekly billing, can be paused (Pause)');

  console.log('\n--- 5. Testing Adding & Updating Specific Variants ---');
  const dummyProduct = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Brightloop',
    sales_price: 1000,
    cost_price: 400,
    variants: [],
    save: async function () { return this; },
  };

  Product.findById = async () => dummyProduct;

  const resAddVariant = mockRes();
  await addVariant(
    {
      params: { id: dummyProduct._id.toString() },
      body: {
        attribute_name: 'Brand',
        attribute_value: 'Odoo Enterprise Edition',
        price_extra: 800,
      },
    },
    resAddVariant
  );

  assert.strictEqual(resAddVariant.statusCode, 201);
  assert.strictEqual(resAddVariant.body.data.price_extra, 800);
  assert.strictEqual(resAddVariant.body.data.final_price, 1800);
  console.log('✓ addVariant successfully added new brand variant with +800 adjustment -> final price: $1800');

  // Restore mocks
  Product.prototype.save = origProductSave;
  Product.find = origProductFind;
  Product.findById = origProductFindById;
  Product.findByIdAndDelete = origProductFindByIdAndDelete;
  ProductVariant.create = origProductVariantCreate;
  ProductVariant.find = origProductVariantFind;
  ProductVariant.findById = origProductVariantFindById;
  Plan.prototype.save = origPlanSave;
  Plan.find = origPlanFind;
  Plan.findOne = origPlanFindOne;
  Plan.findById = origPlanFindById;

  console.log('\n======================================================');
  console.log('ALL PRODUCT CATALOG & PLAN ENDPOINT TESTS PASSED!');
  console.log('======================================================');
})();

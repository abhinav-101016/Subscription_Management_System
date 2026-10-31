const express = require("express");
const {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  resetStaffCredentials,
  deleteStaff,
  seedStaff,
} = require("../controllers/adminController");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
} = require("../controllers/productController");
const {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require("../controllers/planController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Require admin authentication for all endpoints under /api/admin
router.use(authenticate, authorize("admin"));

// Staff Seeding & Management
router.post("/staff/seed", seedStaff);
router.post("/staff", createStaff);
router.get("/staff", listStaff);
router.get("/staff/:id", getStaffById);
router.put("/staff/:id", updateStaff);
router.post("/staff/:id/reset-credentials", resetStaffCredentials);
router.delete("/staff/:id", deleteStaff);

// Product Catalog Management
router.post("/products", createProduct);
router.get("/products", getAllProducts);
router.get("/products/:id", getProductById);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/products/:id/variants", addVariant);
router.put("/products/variants/:variantId", updateVariant);
router.delete("/products/variants/:variantId", deleteVariant);

// Plan Management
router.post("/plans", createPlan);
router.get("/plans", getAllPlans);
router.get("/plans/:id", getPlanById);
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

module.exports = router;

const express = require("express");
const {
  createStaff,
  listStaff,
  getStaffById,
  updateStaff,
  resetStaffCredentials,
  deleteStaff,
  seedStaff
} = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Require admin authentication for all staff management endpoints
router.use(authenticate, authorize("admin"));

// Seed staff
router.post("/staff/seed", seedStaff);

// Staff management endpoints
router.post("/staff", createStaff);
router.get("/staff", listStaff);
router.get("/staff/:id", getStaffById);
router.put("/staff/:id", updateStaff);
router.post("/staff/:id/reset-credentials", resetStaffCredentials);
router.delete("/staff/:id", deleteStaff);

module.exports = router;

const express = require("express");
const { createStaff, listStaff } = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.post("/staff", createStaff);
router.get("/staff", listStaff);

module.exports = router;
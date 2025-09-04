// vms-backend/src/api/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// Guard Login (name + 4-6 digit pin)
router.post('/guard/login', authController.guardLogin);

// Admin Login (email + password)
router.post('/admin/login', authController.adminLogin);

// Super Admin Login (global, not tenant-scoped when mounted outside tenant router)
router.post('/superadmin/login', authController.superAdminLogin);

module.exports = router;
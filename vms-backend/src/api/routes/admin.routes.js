// src/api/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');

// This is the temporary route for creating a guard
router.post('/create-guard', adminController.createGuard);

// Secure routes for the admin dashboard
router.get('/visits', [protect, isAdmin], adminController.getAllVisits);
router.get('/reports/end-of-day', [protect, isAdmin], adminController.getEndOfDayReport);
router.get('/reports/history-by-employee', [protect, isAdmin], adminController.getVisitsByEmployee);
router.get('/employees/search', [protect, isAdmin], adminController.searchEmployees);

module.exports = router;
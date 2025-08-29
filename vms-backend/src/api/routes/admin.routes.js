// src/api/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');

// Guard Management
router.get('/guards', [protect, isAdmin], adminController.getGuards);
router.post('/guards', [protect, isAdmin], adminController.createGuard);
router.put('/guards/:id', [protect, isAdmin], adminController.updateGuard);
router.delete('/guards/:id', [protect, isAdmin], adminController.deleteGuard);

// Reports
router.get('/visits', [protect, isAdmin], adminController.getAllVisits);
router.get('/reports/end-of-day', [protect, isAdmin], adminController.getEndOfDayReport);
router.get('/reports/history-by-employee', [protect, isAdmin], adminController.getVisitsByEmployee);
router.get('/employees/search', [protect, isAdmin], adminController.searchEmployees);
router.get('/reports/download-log', [protect, isAdmin], adminController.downloadVisitorLog);

module.exports = router;
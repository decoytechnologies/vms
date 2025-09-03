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

// Admin Management
router.get('/admins', [protect, isAdmin], adminController.getAdmins);
router.post('/admins', [protect, isAdmin], adminController.createAdmin);
router.put('/admins/:id', [protect, isAdmin], adminController.updateAdmin);
router.delete('/admins/:id', [protect, isAdmin], adminController.deleteAdmin);

// Reports and Data Fetching
router.get('/visits', [protect, isAdmin], adminController.getAllVisits);
router.get('/visits/:visitId/images', [protect, isAdmin], adminController.getVisitImageUrls);
router.get('/reports/end-of-day', [protect, isAdmin], adminController.getEndOfDayReport);
router.get('/reports/history-by-employee', [protect, isAdmin], adminController.getVisitsByEmployee);
router.get('/employees/search', [protect, isAdmin], adminController.searchEmployees);

// Changed to POST to accept configuration body
router.post('/reports/download-log', [protect, isAdmin], adminController.downloadVisitorLog);

module.exports = router;
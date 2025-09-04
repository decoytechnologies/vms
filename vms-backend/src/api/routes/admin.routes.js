// src/api/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Guard Management
router.get('/guards', [protect, isAdmin], adminController.getGuards);
router.post('/guards', [protect, isAdmin], adminController.createGuard);
router.put('/guards/:id', [protect, isAdmin], adminController.updateGuard);
router.delete('/guards/:id', [protect, isAdmin], adminController.deleteGuard);

// Employee Management
router.get('/employees', [protect, isAdmin], adminController.getEmployees);
router.post('/employees', [protect, isAdmin], adminController.createEmployee);
router.put('/employees/:id', [protect, isAdmin], adminController.updateEmployee);
router.delete('/employees/:id', [protect, isAdmin], adminController.deleteEmployee);
router.get('/employees/template', [protect, isAdmin], adminController.downloadEmployeeTemplate);
router.post('/employees/upload', [protect, isAdmin, upload.single('file')], adminController.uploadEmployeesCsv);

// Reports and Data Fetching
router.get('/visits', [protect, isAdmin], adminController.getAllVisits);
router.get('/visits/:visitId/images', [protect, isAdmin], adminController.getVisitImageUrls);
router.get('/reports/end-of-day', [protect, isAdmin], adminController.getEndOfDayReport);
router.get('/reports/history-by-employee', [protect, isAdmin], adminController.getVisitsByEmployee);
router.get('/employees/search', [protect, isAdmin], adminController.searchEmployees);

// Changed to POST to accept configuration body
router.post('/reports/download-log', [protect, isAdmin], adminController.downloadVisitorLog);

module.exports = router;
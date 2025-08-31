// src/api/routes/visitor.routes.js
const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor.controller');
const { protect, isGuard } = require('../middlewares/auth.middleware');
const { uploadVisitorImages } = require('../services/s3.service');

router.post('/check-in', [protect, isGuard], uploadVisitorImages, visitorController.checkIn);
router.get('/active', [protect, isGuard], visitorController.getActiveVisits);
router.patch('/:id/checkout', [protect, isGuard], visitorController.checkOut);
router.get('/search-by-email', [protect, isGuard], visitorController.searchVisitorByEmail);
router.get('/search-by-phone', [protect, isGuard], visitorController.searchVisitorsByPhone);
// --- NEW ROUTE ---
// Secure route for guards to get full details of a specific visit
router.get('/details/:visitId', [protect, isGuard], visitorController.getVisitDetailsForGuard);


module.exports = router;
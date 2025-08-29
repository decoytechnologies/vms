// vms-backend/src/api/routes/auth.routes.js
const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// Route for Guard Login
router.post('/guard/login', authController.guardLogin);

// Route for the temporary "dummy" Admin Login for local testing
router.post('/admin/dummy-login', authController.dummyAdminLogin);

// --- Real Admin OAuth Routes (for production) ---
router.get('/microsoft', passport.authenticate('microsoft', { session: false }));
router.get('/microsoft/callback', passport.authenticate('microsoft', { session: false }), authController.adminOAuthCallback);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false }), authController.adminOAuthCallback);

module.exports = router;
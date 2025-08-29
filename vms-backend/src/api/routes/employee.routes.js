// vms-backend/src/api/routes/employee.routes.js
const express = require('express');
const router = express.Router();
const { searchEmployees } = require('../controllers/admin.controller');
const { protect, isGuard } = require('../middlewares/auth.middleware');

router.get('/search', [protect, isGuard], searchEmployees);

module.exports = router;
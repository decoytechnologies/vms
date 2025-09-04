const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

router.get('/tenants', publicController.listActiveTenants);

module.exports = router;



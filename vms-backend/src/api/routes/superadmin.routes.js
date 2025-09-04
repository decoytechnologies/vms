const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const { protect, isSuperAdmin } = require('../middlewares/auth.middleware');

router.use(protect, isSuperAdmin);

router.get('/tenants', superadminController.listTenants);
router.post('/tenants', superadminController.createTenant);
router.patch('/tenants/:tenantId', superadminController.updateTenant);
router.delete('/tenants/:tenantId', superadminController.deleteTenant);

router.get('/tenants/:tenantId/admins', superadminController.listTenantAdmins);
router.post('/tenants/:tenantId/admins', superadminController.createTenantAdmin);
router.patch('/tenants/:tenantId/admins/:adminId', superadminController.updateTenantAdmin);
router.delete('/tenants/:tenantId/admins/:adminId', superadminController.deleteTenantAdmin);

module.exports = router;



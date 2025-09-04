// src/app.js
const express = require('express');
const cors = require('cors');
const { tenantResolver } = require('./api/middlewares/tenant.middleware');

// Import all route handlers
const authRoutes = require('./api/routes/auth.routes');
const superAdminRoutes = require('./api/routes/superadmin.routes');
const superAdminAuthRoutes = require('./api/routes/superadmin.auth.routes');
const publicRoutes = require('./api/routes/public.routes');
const visitorRoutes = require('./api/routes/visitor.routes');
const adminRoutes = require('./api/routes/admin.routes'); // <-- MUST BE IMPORTED
const employeeRoutes = require('./api/routes/employee.routes');


const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Passport/OAuth removed; only local auth is used now.

// --- API Routes ---

// Global routes (no tenant)
app.use('/api', superAdminAuthRoutes); // exposes /api/superadmin/login
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/public', publicRoutes);
const tenantApiRouter = express.Router();
tenantApiRouter.use(tenantResolver);

// Add your tenant-aware routes to this sub-router
tenantApiRouter.use('/auth', authRoutes);
tenantApiRouter.use('/visitors', visitorRoutes);
tenantApiRouter.use('/admin', adminRoutes); // <-- MUST BE USED
tenantApiRouter.use('/employees', employeeRoutes);

// Mount the entire group of tenant-aware routes under /api
app.use('/api', tenantApiRouter);

// Webhooks removed (Teams/Google Chat integrations are not used)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

module.exports = app;
// src/app.js
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const { tenantResolver } = require('./api/middlewares/tenant.middleware');

// Import all route handlers
const authRoutes = require('./api/routes/auth.routes');
const visitorRoutes = require('./api/routes/visitor.routes');
const webhookRoutes = require('./api/routes/webhook.routes');
const adminRoutes = require('./api/routes/admin.routes'); // <-- MUST BE IMPORTED
const employeeRoutes = require('./api/routes/employee.routes');

require('./config/passport');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// --- API Routes ---
const tenantApiRouter = express.Router();
tenantApiRouter.use(tenantResolver);

// Add your tenant-aware routes to this sub-router
tenantApiRouter.use('/auth', authRoutes);
tenantApiRouter.use('/visitors', visitorRoutes);
tenantApiRouter.use('/admin', adminRoutes); // <-- MUST BE USED
tenantApiRouter.use('/employees', employeeRoutes);

// Mount the entire group of tenant-aware routes under /api
app.use('/api', tenantApiRouter);

// Public webhooks do not need the tenant resolver
app.use('/api/webhooks', webhookRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

module.exports = app;
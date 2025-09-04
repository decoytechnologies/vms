// vms-backend/src/api/middlewares/auth.middleware.js
const { verifyToken } = require('../services/jwt.service');
const { Admin, Guard, SuperAdmin } = require('../../models');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token.' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: 'Not authorized, token invalid.' });
  
  // SuperAdmin is global and not tenant-scoped
  if (!req.tenant && decoded.role !== 'superadmin') {
    console.error("CRITICAL: tenantResolver did not run before protect middleware.");
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  if (decoded.role !== 'superadmin') {
    if (decoded.tenantId !== req.tenant.id) {
      return res.status(403).json({ message: 'Forbidden: Token is not valid for this tenant.' });
    }
  }

  let user;
  if (decoded.role === 'superadmin') {
    user = await SuperAdmin.findByPk(decoded.id);
  } else if (decoded.role === 'admin') {
    user = await Admin.findByPk(decoded.id);
  } else {
    user = await Guard.findByPk(decoded.id);
  }
  if (!user) return res.status(401).json({ message: 'Not authorized, user not found.' });

  req.user = user;
  req.user.role = decoded.role;
  next();
};

const isAdmin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Forbidden: Admins only.' });
const isGuard = (req, res, next) => req.user?.role === 'guard' ? next() : res.status(403).json({ message: 'Forbidden: Guards only.' });
const isSuperAdmin = (req, res, next) => req.user?.role === 'superadmin' ? next() : res.status(403).json({ message: 'Forbidden: SuperAdmins only.' });

module.exports = { protect, isAdmin, isGuard, isSuperAdmin };
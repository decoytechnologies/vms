// vms-backend/src/api/middlewares/auth.middleware.js
const { verifyToken } = require('../services/jwt.service');
const { Admin, Guard } = require('../../models');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized, no token.' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ message: 'Not authorized, token invalid.' });
  
  if (!req.tenant) {
    console.error("CRITICAL: tenantResolver did not run before protect middleware.");
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  if (decoded.tenantId !== req.tenant.id) {
    return res.status(403).json({ message: 'Forbidden: Token is not valid for this tenant.' });
  }

  const user = decoded.role === 'admin' ? await Admin.findByPk(decoded.id) : await Guard.findByPk(decoded.id);
  if (!user) return res.status(401).json({ message: 'Not authorized, user not found.' });

  req.user = user;
  req.user.role = decoded.role;
  next();
};

const isAdmin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Forbidden: Admins only.' });
const isGuard = (req, res, next) => req.user?.role === 'guard' ? next() : res.status(403).json({ message: 'Forbidden: Guards only.' });

module.exports = { protect, isAdmin, isGuard };
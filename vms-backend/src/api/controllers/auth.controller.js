// vms-backend/src/api/controllers/auth.controller.js
const { Guard, Admin, SuperAdmin } = require('../../models');
const { signToken } = require('../services/jwt.service');
const logger = require('../services/logger.service');
const { comparePassword } = require('../services/password.service');

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const { id: tenantId } = req.tenant;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const admin = await Admin.findOne({ where: { email, tenantId } });
    if (!admin) {
      logger.warn('Admin login failed: user not found', { email, tenantId });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) {
      logger.warn('Admin login failed: invalid password', { email, tenantId });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const payload = { id: admin.id, email: admin.email, tenantId, role: 'admin' };
    const token = signToken(payload);
    res.status(200).json({ message: 'Login successful', token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    logger.error('Admin login error', { error, email, tenantId });
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

exports.guardLogin = async (req, res) => {
  const { name, email, phone, identifier, pin } = req.body;
  const { id: tenantId } = req.tenant;

  const loginId = identifier || name || email || phone;
  if (!loginId || !pin) return res.status(400).json({ message: 'Guard name/email/phone and PIN are required.' });
  if (!/^[0-9]{4,6}$/.test(String(pin))) return res.status(400).json({ message: 'PIN must be 4-6 digits.' });

  try {
    const { Op } = require('sequelize');
    const guard = await Guard.findOne({
      where: {
        tenantId,
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: loginId } },
          { email: { [Op.iLike]: loginId } },
          { phone: loginId }
        ]
      }
    });
    if (!guard) {
      logger.warn('Guard login failed: guard not found or inactive', { identifier: loginId, tenantId });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const validPin = await guard.isValidPin(String(pin));
    if (!validPin) {
      logger.warn('Guard login failed: invalid pin', { identifier: loginId, tenantId });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const payload = { id: guard.id, name: guard.name, tenantId, role: 'guard' };
    const token = signToken(payload);

    res.status(200).json({ message: 'Login successful', token, guard: { id: guard.id, name: guard.name } });
  } catch (error) {
    logger.error('Guard login error', { error, name, tenantId });
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

// OAuth has been removed; only username/password is supported for Admin login.

exports.superAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const user = await SuperAdmin.findOne({ where: { email, isActive: true } });
    if (!user) {
      logger.warn('SuperAdmin login failed: user not found', { email });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const hash = user.passwordHash || '';
    const looksBcrypt = typeof hash === 'string' && /^\$2[aby]?\$\d{2}\$.{53}$/.test(hash);
    logger.debug('SuperAdmin password metadata', { email, hashLength: hash.length, looksBcrypt });
    const valid = await user.isValidPassword(password);
    if (!valid) {
      logger.warn('SuperAdmin login failed: invalid password', { email });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const payload = { id: user.id, email: user.email, role: 'superadmin' };
    const token = signToken(payload);
    res.status(200).json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    logger.error('SuperAdmin login error', { error, email });
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};
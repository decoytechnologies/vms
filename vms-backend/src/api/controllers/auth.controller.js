// vms-backend/src/api/controllers/auth.controller.js
const { Guard, Admin } = require('../../models');
const { signToken } = require('../services/jwt.service');

exports.dummyAdminLogin = async (req, res) => {
  const { email, password } = req.body;
  const { id: tenantId } = req.tenant;

  if (email !== 'admin@test.local' || password !== 'password123') {
    return res.status(401).json({ message: 'Invalid credentials for dummy admin.' });
  }

  try {
    const admin = await Admin.findOne({ where: { email, tenantId } });
    if (!admin) {
      return res.status(404).json({ message: 'Dummy admin user not found in database.' });
    }

    const payload = { id: admin.id, email: admin.email, tenantId, role: 'admin' };
    const token = signToken(payload);
    res.status(200).json({ message: 'Dummy admin login successful', token });

  } catch (error) {
    res.status(500).json({ message: 'An error occurred during dummy login.' });
  }
};

exports.guardLogin = async (req, res) => {
  const { name, pin } = req.body;
  const { id: tenantId } = req.tenant;

  if (!name || !pin) return res.status(400).json({ message: 'Guard name and PIN are required.' });

  try {
    const guard = await Guard.findOne({ where: { name, tenantId, isActive: true } });
    if (!guard || !(await guard.isValidPin(pin))) return res.status(401).json({ message: 'Invalid credentials.' });

    const payload = { id: guard.id, name: guard.name, tenantId, role: 'guard' };
    const token = signToken(payload);

    res.status(200).json({ message: 'Login successful', token, guard: { id: guard.id, name: guard.name } });
  } catch (error) {
    console.error('Guard Login Error:', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

exports.adminOAuthCallback = (req, res) => {
    const user = req.user;
    const payload = { id: user.id, email: user.email, tenantId: user.tenantId, role: 'admin' };
    const token = signToken(payload);
    res.status(200).json({ message: 'Admin login successful', token, admin: { id: user.id, name: user.name, email: user.email } });
};
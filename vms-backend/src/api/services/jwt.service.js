// vms-backend/src/api/services/jwt.service.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
const verifyToken = (token) => {
  try { return jwt.verify(token, JWT_SECRET); }
  catch (error) { return null; }
};

module.exports = { signToken, verifyToken };
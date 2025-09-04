const bcrypt = require('bcrypt');

const DEFAULT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

async function hashPassword(plainText) {
  if (typeof plainText !== 'string' || plainText.length === 0) {
    throw new Error('Cannot hash empty password');
  }
  const saltRounds = Number.isFinite(DEFAULT_SALT_ROUNDS) ? DEFAULT_SALT_ROUNDS : 12;
  return bcrypt.hash(plainText, saltRounds);
}

async function comparePassword(plainText, hashed) {
  if (!hashed) return false;
  return bcrypt.compare(plainText, hashed);
}

module.exports = { hashPassword, comparePassword };



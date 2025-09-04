require('dotenv').config();
const { sequelize, SuperAdmin, Tenant, Admin, Guard } = require('../models');

async function ensureSuperAdmin() {
  const email = 'swapnil@exxat.com';
  const name = 'Super Admin';
  const password = 'P@ssword@123';
  const existing = await SuperAdmin.findOne({ where: { email } });
  if (existing) return existing;
  // Pass plaintext; model hook will hash
  return SuperAdmin.create({ email, name, passwordHash: password, isActive: true });
}

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await ensureSuperAdmin();
    console.log('Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();



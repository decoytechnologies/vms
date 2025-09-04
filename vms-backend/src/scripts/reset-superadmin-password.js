require('dotenv').config();
const { SuperAdmin } = require('../models');

(async () => {
  try {
    const email = process.argv[2] || 'swapnil@exxat.com';
    const newPassword = process.argv[3] || 'P@ssword@123';
    const user = await SuperAdmin.findOne({ where: { email } });
    if (!user) throw new Error(`SuperAdmin not found for email ${email}`);
    user.passwordHash = newPassword; // model hook will hash if not already
    await user.save();
    console.log(`SuperAdmin password reset for ${email}`);
    process.exit(0);
  } catch (err) {
    console.error('Password reset failed:', err);
    process.exit(1);
  }
})();



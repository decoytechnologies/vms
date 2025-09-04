module.exports = (sequelize, DataTypes) => {
  const SuperAdmin = sequelize.define('SuperAdmin', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    name: { type: DataTypes.STRING, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  });

  SuperAdmin.addHook('beforeCreate', async (user) => {
    if (user.passwordHash) {
      const alreadyHashed = typeof user.passwordHash === 'string' && /^\$2[aby]?\$\d{2}\$.{53}$/.test(user.passwordHash);
      if (!alreadyHashed) {
        const { hashPassword } = require('../api/services/password.service');
        user.passwordHash = await hashPassword(user.passwordHash);
      }
    }
  });

  SuperAdmin.addHook('beforeUpdate', async (user) => {
    if (user.changed('passwordHash') && user.passwordHash) {
      const alreadyHashed = typeof user.passwordHash === 'string' && /^\$2[aby]?\$\d{2}\$.{53}$/.test(user.passwordHash);
      if (!alreadyHashed) {
        const { hashPassword } = require('../api/services/password.service');
        user.passwordHash = await hashPassword(user.passwordHash);
      }
    }
  });

  SuperAdmin.prototype.isValidPassword = function(password) {
    const { comparePassword } = require('../api/services/password.service');
    return comparePassword(password, this.passwordHash);
  };

  return SuperAdmin;
};



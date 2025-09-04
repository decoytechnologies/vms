// vms-backend/src/models/admin.model.js
module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    name: { type: DataTypes.STRING, allowNull: false, validate: { is: /^[A-Za-z ]+$/ } },
    phone: { type: DataTypes.STRING, allowNull: true, validate: { is: /^\d{0,10}$/ } },
    passwordHash: { type: DataTypes.STRING, allowNull: true },
  }, {
    indexes: [{ unique: true, fields: ['tenantId', 'email'] }]
  });

  Admin.associate = (models) => {
    Admin.belongsTo(models.Tenant, {
      foreignKey: { name: 'tenantId', allowNull: false },
      onDelete: 'CASCADE',
    });
  };

  Admin.addHook('beforeCreate', async (admin, options) => {
    if (admin.passwordHash) {
      const alreadyHashed = typeof admin.passwordHash === 'string' && /^\$2[aby]?\$\d{2}\$.{53}$/.test(admin.passwordHash);
      if (!alreadyHashed) {
        const { hashPassword } = require('../api/services/password.service');
        admin.passwordHash = await hashPassword(admin.passwordHash);
      }
    }
  });

  Admin.addHook('beforeUpdate', async (admin, options) => {
    if (admin.changed('passwordHash') && admin.passwordHash) {
      const alreadyHashed = typeof admin.passwordHash === 'string' && /^\$2[aby]?\$\d{2}\$.{53}$/.test(admin.passwordHash);
      if (!alreadyHashed) {
        const { hashPassword } = require('../api/services/password.service');
        admin.passwordHash = await hashPassword(admin.passwordHash);
      }
    }
  });

  Admin.prototype.isValidPassword = function(password) {
    const { comparePassword } = require('../api/services/password.service');
    return comparePassword(password, this.passwordHash);
  };

  return Admin;
};
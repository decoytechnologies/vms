// vms-backend/src/models/admin.model.js
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING },
    pinHash: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    oauthProvider: { type: DataTypes.STRING },
    oauthId: { type: DataTypes.STRING },
  }, {
    indexes: [{ unique: true, fields: ['tenantId', 'email'] }]
  });

  // Instance method to validate PIN
  Admin.prototype.isValidPin = async function(pin) {
    if (!this.pinHash) return false;
    return await bcrypt.compare(pin, this.pinHash);
  };

  // Hook to hash PIN before saving
  Admin.beforeSave(async (admin) => {
    if (admin.changed('pinHash') && admin.pinHash) {
      const saltRounds = 10;
      admin.pinHash = await bcrypt.hash(admin.pinHash, saltRounds);
    }
  });

  Admin.associate = (models) => {
    Admin.belongsTo(models.Tenant, {
      foreignKey: { name: 'tenantId', allowNull: false },
      onDelete: 'CASCADE',
    });
  };
  return Admin;
};
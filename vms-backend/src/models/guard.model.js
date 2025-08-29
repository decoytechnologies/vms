// vms-backend/src/models/guard.model.js
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const Guard = sequelize.define('Guard', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    pinHash: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    hooks: {
      beforeCreate: async (guard) => {
        if (guard.pinHash) guard.pinHash = await bcrypt.hash(guard.pinHash, 10);
      },
      beforeUpdate: async (guard) => {
        if (guard.changed('pinHash')) guard.pinHash = await bcrypt.hash(guard.pinHash, 10);
      },
    }
  });
  Guard.prototype.isValidPin = function(pin) { return bcrypt.compare(pin, this.pinHash); };
  Guard.associate = (models) => {
    Guard.belongsTo(models.Tenant, {
      foreignKey: { name: 'tenantId', allowNull: false },
      onDelete: 'CASCADE',
    });
  };
  return Guard;
};
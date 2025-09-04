// src/models/guard.model.js
const { hashPassword, comparePassword } = require('../api/services/password.service');

module.exports = (sequelize, DataTypes) => {
  const Guard = sequelize.define('Guard', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING, allowNull: true },
    pinHash: { type: DataTypes.STRING, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    hooks: {
      beforeCreate: async (guard) => {
        if (guard.pinHash) guard.pinHash = await hashPassword(String(guard.pinHash));
      },
      beforeUpdate: async (guard) => {
        if (guard.pinHash && guard.changed('pinHash')) {
          guard.pinHash = await hashPassword(String(guard.pinHash));
        }
      },
    }
  });
  Guard.prototype.isValidPin = function(pin) { return comparePassword(String(pin), this.pinHash); };
  Guard.associate = (models) => {
    Guard.belongsTo(models.Tenant, {
      foreignKey: { name: 'tenantId', allowNull: false },
      onDelete: 'CASCADE',
    });
  };
  return Guard;
};
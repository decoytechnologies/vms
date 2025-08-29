// vms-backend/src/models/admin.model.js
module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    oauthProvider: { type: DataTypes.STRING },
    oauthId: { type: DataTypes.STRING },
  }, {
    indexes: [{ unique: true, fields: ['tenantId', 'email'] }]
  });

  Admin.associate = (models) => {
    Admin.belongsTo(models.Tenant, {
      foreignKey: { name: 'tenantId', allowNull: false },
      onDelete: 'CASCADE',
    });
  };
  return Admin;
};
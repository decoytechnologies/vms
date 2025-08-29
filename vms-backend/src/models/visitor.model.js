// vms-backend/src/models/visitor.model.js
module.exports = (sequelize, DataTypes) => {
  const Visitor = sequelize.define('Visitor', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING, allowNull: false },
  });
  Visitor.associate = (models) => {
    Visitor.belongsTo(models.Tenant, { foreignKey: { name: 'tenantId', allowNull: false }, onDelete: 'CASCADE' });
    Visitor.hasMany(models.Visit, { foreignKey: 'visitorId' });
  };
  return Visitor;
};
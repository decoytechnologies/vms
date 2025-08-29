// vms-backend/src/models/employee.model.js
module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING },
  });
  Employee.associate = (models) => {
    Employee.belongsTo(models.Tenant, { foreignKey: { name: 'tenantId', allowNull: false }, onDelete: 'CASCADE' });
    Employee.hasMany(models.Visit, { foreignKey: 'employeeId' });
  };
  return Employee;
};
module.exports = (sequelize, DataTypes) => {
  const Visit = sequelize.define('Visit', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    checkInTimestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    expectedCheckOutTimestamp: { type: DataTypes.DATE },
    actualCheckOutTimestamp: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('CHECKED_IN', 'PENDING_APPROVAL', 'CHECKED_OUT', 'DENIED'), allowNull: false },
    visitType: { type: DataTypes.ENUM('VISITOR', 'EMPLOYEE_NO_ID'), allowNull: false },
    visitorPhotoUrl: { type: DataTypes.STRING },
    idCardPhotoUrl: { type: DataTypes.STRING },
    // THIS IS THE FIX: Added 'CHAT_APPROVAL' to the list of allowed values
    approvalMethod: { type: DataTypes.ENUM('PRE_APPROVED_EMAIL', 'TEAMS_APPROVAL', 'CHAT_APPROVAL', 'AUTO_APPROVED') },
  });

  Visit.associate = (models) => {
    Visit.belongsTo(models.Tenant, { foreignKey: { name: 'tenantId', allowNull: false }, onDelete: 'CASCADE' });
    Visit.belongsTo(models.Visitor, { foreignKey: 'visitorId' });
    Visit.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    Visit.belongsTo(models.Guard, { as: 'CheckInGuard', foreignKey: 'checkInGuardId' });
    Visit.belongsTo(models.Guard, { as: 'CheckOutGuard', foreignKey: 'checkOutGuardId' });
  };

  return Visit;
};


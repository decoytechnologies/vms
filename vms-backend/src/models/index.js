// vms-backend/src/models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/database');

const sequelize = new Sequelize(dbConfig.url, { dialect: dbConfig.dialect, logging: false });

const db = {};

db.Tenant = require('./tenant.model')(sequelize, DataTypes);
db.Admin = require('./admin.model')(sequelize, DataTypes);
db.Guard = require('./guard.model')(sequelize, DataTypes);
db.Employee = require('./employee.model')(sequelize, DataTypes);
db.Visitor = require('./visitor.model')(sequelize, DataTypes);
db.Visit = require('./visit.model')(sequelize, DataTypes);

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
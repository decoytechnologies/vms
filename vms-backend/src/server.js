// src/server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const storageService = require('./api/services/storage.service');

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // Initialize storage service
    await storageService.initializeStorage();
    const storageInfo = storageService.getStorageInfo();
    console.log(`✅ Storage service initialized: ${storageInfo.type} (${storageInfo.initialized ? 'Ready' : 'Not Ready'})`);

    server.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}...`);
      console.log(`📁 Using ${storageInfo.type} for file storage`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
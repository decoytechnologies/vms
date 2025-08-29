// src/server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

async function startServer() {
  try {
    // We will now only test the connection. We will not sync the database.
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    server.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}...`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

startServer();
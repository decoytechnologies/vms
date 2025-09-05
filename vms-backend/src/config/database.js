// vms-backend/src/config/database.js
require('dotenv').config();

const useSsl = (process.env.DB_SSL || 'true').toLowerCase() === 'true';

const url = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

module.exports = {
  url,
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Azure managed PG requires this unless you import CA
        },
      }
    : {},
};
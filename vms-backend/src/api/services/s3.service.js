// vms-backend/src/api/services/s3.service.js
// DEPRECATED: This file is kept for backward compatibility
// Please use upload.service.js for new implementations

console.warn('⚠️  s3.service.js is deprecated. Please use upload.service.js instead.');

// Redirect to the new unified upload service
const { uploadVisitorImages } = require('./upload.service');

module.exports = { uploadVisitorImages };
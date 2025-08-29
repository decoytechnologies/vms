// vms-backend/src/api/services/notification.service.js
const microsoftService = require('./integrations/microsoft.service');
const googleService = require('./integrations/google.service');

const getServiceForEmail = (email) => {
  const lowerCaseEmail = email.toLowerCase();
  if (lowerCaseEmail.endsWith('@gmail.com') || lowerCaseEmail.endsWith('decoytech.in')) {
    return googleService;
  }
  return microsoftService;
};

const findApprovalEmail = (visitorName, employeeEmail) => {
  return getServiceForEmail(employeeEmail).findApprovalEmail(visitorName, employeeEmail);
};

const sendApprovalRequest = (employeeEmail, visitorName, visitId) => {
  return getServiceForEmail(employeeEmail).sendApprovalRequest(employeeEmail, visitorName, visitId);
};

module.exports = { findApprovalEmail, sendApprovalRequest };
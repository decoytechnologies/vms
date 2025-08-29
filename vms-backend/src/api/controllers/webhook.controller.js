// vms-backend/src/api/controllers/webhook.controller.js
const { Visit } = require('../../models');

const processApproval = async (visitId, action) => {
  const visit = await Visit.findOne({ where: { id: visitId, status: 'PENDING_APPROVAL' } });
  if (!visit) {
    console.warn(`Webhook callback for invalid/processed visit: ${visitId}`);
    return null;
  }
  const newStatus = action === 'approved' ? 'CHECKED_IN' : 'DENIED';
  await visit.update({ status: newStatus });
  console.log(`Visit ${visitId} updated to ${newStatus}.`);
  return visit;
};

exports.handleTeamsApproval = async (req, res) => {
  // ... (logic remains the same)
};

exports.handleGoogleChatApproval = async (req, res) => {
    // ... (logic remains the same)
};